import { SLOTS } from './geo-data.js';
import { checkPassword, cookieHeader, hashPassword, signToken, tokenFromReq, readToken } from './auth.js';
import { dbMode, ensureDb, healthCheck } from './db.js';
import { ApiError } from './errors.js';
import {
  attachOrder,
  attachOrders,
  createOrder,
  findCityById,
  findDishById,
  findDistrictById,
  findKitchenById,
  findKitchenByOwner,
  findOrderById,
  findTicketById,
  findUserByEmail,
  findUserById,
  insertDish,
  insertKitchen,
  insertTicket,
  insertUser,
  listAllKitchens,
  listCities,
  listCountries,
  listDishesByKitchen,
  listDistricts,
  listKitchensFiltered,
  listOrdersByBuyer,
  listOrdersByKitchen,
  listTickets,
  listUsers,
  listUsersByIds,
  newId,
  searchAdminOrders,
  updateDish,
  updateKitchen,
  updateOrderStatus,
  updateTicket,
  updateUser,
  writeAudit,
} from './repos.js';
import { publicDish, publicKitchen, publicUser } from './serialize.js';
import { flag, kitchenVisible } from './util.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function send(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (typeof res.setHeader === 'function') res.setHeader(k, v);
    }
  }
  if (typeof res.status === 'function' && typeof res.json === 'function' && !extraHeaders?.['Set-Cookie']) {
    res.status(status).json(obj);
    return;
  }
  if (typeof res.status === 'function' && extraHeaders?.['Set-Cookie'] && typeof res.json === 'function') {
    res.setHeader('Set-Cookie', extraHeaders['Set-Cookie']);
    res.status(status).json(obj);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
}

function matchRoute(method, pattern, reqMethod, pathname) {
  if (method !== reqMethod) return null;
  const pp = pattern.split('/').filter(Boolean);
  const pa = pathname.split('/').filter(Boolean);
  if (pp.length !== pa.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i += 1) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(pa[i]);
    else if (pp[i] !== pa[i]) return null;
  }
  return params;
}

function parseJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    if (req.readableEnded) {
      resolve('');
      return;
    }
    let data = '';
    const timer = setTimeout(() => {
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onErr);
      resolve(data);
    }, 4000);
    function done(value, err) {
      clearTimeout(timer);
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onErr);
      if (err) reject(err);
      else resolve(value);
    }
    function onData(c) {
      data += c;
      if (data.length > 1_000_000) done('', new Error('too large'));
    }
    function onEnd() {
      done(data);
    }
    function onErr(err) {
      done('', err);
    }
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onErr);
  });
}

async function getBody(req) {
  if (Buffer.isBuffer(req.body)) return parseJson(req.body.toString('utf8'));
  if (typeof req.body === 'string') return parseJson(req.body);
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    const raw = await readRawBody(req);
    return parseJson(raw);
  } catch {
    return {};
  }
}

function catchAllParts(req) {
  const q = req.query;
  if (q?.path == null) return [];
  const parts = Array.isArray(q.path) ? q.path : String(q.path).split('/');
  return parts.map((p) => String(p)).filter(Boolean);
}

function folderPrefixFromPath(path) {
  if (/\/admin(\/|$)/.test(path)) return '/api/admin';
  if (/\/auth(\/|$)/.test(path)) return '/api/auth';
  if (/\/kitchens(\/|$)/.test(path)) return '/api/kitchens';
  if (/\/orders(\/|$)/.test(path)) return '/api/orders';
  if (/\/my(\/|$)/.test(path)) return '/api/my';
  return '/api';
}

function headerPathOf(req) {
  const headers = req.headers || {};
  return String(headers['x-invoke-path'] || headers['x-vercel-original-path'] || headers['x-matched-path'] || '')
    .split('?')[0];
}

function pathnameOf(req) {
  const raw = String(req.url || '/');
  let path = raw.split('?')[0];
  try {
    if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname;
  } catch {
    /* keep path */
  }

  const headerPath = headerPathOf(req);
  if (headerPath.startsWith('/api/') && !headerPath.includes('[...')) return headerPath;

  const isPlaceholder = path.includes('[...') || path.includes('[[...');
  if (path.startsWith('/api/') && !isPlaceholder) return path;
  if ((path === '/api' || path === '/api/') && !isPlaceholder) return '/api';

  const rest = catchAllParts(req).join('/');
  let prefix = '/api';
  if (isPlaceholder) {
    prefix = folderPrefixFromPath(path);
    if (prefix === '/api' && headerPath) prefix = folderPrefixFromPath(headerPath);
  } else if (path.startsWith('/api')) {
    return path;
  }

  if (rest) return `${prefix}/${rest}`;
  return prefix;
}

function queryOf(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  const fromUrl = Object.fromEntries(url.searchParams.entries());
  const fromReq = {};
  for (const [key, val] of Object.entries(req.query || {})) {
    if (key === 'path') continue;
    if (typeof val === 'string') fromReq[key] = val;
  }
  return { ...fromReq, ...fromUrl };
}

function sessionCookie(userId) {
  try {
    return cookieHeader(signToken(userId));
  } catch (err) {
    const e = new Error(
      err.message || 'JWT_SECRET is missing. Set it in Vercel Environment Variables (Production) and Redeploy.',
    );
    e.code = err.code || 'jwt_config';
    throw e;
  }
}

async function currentUser(req) {
  const token = tokenFromReq(req);
  if (!token) return null;
  const payload = readToken(token);
  if (!payload?.sub) return null;
  return findUserById(payload.sub);
}

function requireUser(user, res) {
  if (!user) {
    send(res, 401, { error: 'auth' });
    return false;
  }
  if (flag(user.blocked)) {
    send(res, 403, { error: 'blocked', reason: user.blockedReason || '' });
    return false;
  }
  return true;
}

function requireSupport(user, res) {
  if (!requireUser(user, res)) return false;
  if (!flag(user.isSupport)) {
    send(res, 403, { error: 'forbidden' });
    return false;
  }
  return true;
}

async function mePayload(user) {
  const kitchen = await findKitchenByOwner(user.id);
  return {
    user: publicUser(user),
    kitchen: kitchen ? publicKitchen(kitchen, { includePrivate: true }) : null,
  };
}

function sendErr(res, err) {
  if (err instanceof ApiError) {
    send(res, err.status, { error: err.code });
    return true;
  }
  return false;
}

function sendDbDown(res, err) {
  const code = err?.code === 'db_config' || err?.code === 'jwt_config' ? err.code : 'db';
  send(res, 503, {
    error: code,
    hint: err?.message || 'Database is not configured',
  });
}

function healthPayload(err) {
  return {
    ok: false,
    db: 'none',
    vercel: Boolean(process.env.VERCEL),
    hasDatabaseUrl: Boolean(
      process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL,
    ),
    error: 'db',
    hint: err?.message || 'Health check failed',
  };
}

async function safeAudit(entry) {
  try {
    await writeAudit(entry);
  } catch (err) {
    console.error('audit_failed', err);
  }
}

function parseBlocked(body) {
  if (typeof body.blocked === 'boolean') return body.blocked;
  if (body.blocked === 'true' || body.blocked === 1 || body.blocked === '1') return true;
  if (body.blocked === 'false' || body.blocked === 0 || body.blocked === '0') return false;
  return null;
}

export async function handle(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const pathname = pathnameOf(req);
    const method = req.method || 'GET';
    const q = queryOf(req);
    const hit = (m, p) => matchRoute(m, p, method, pathname);

    if (hit('GET', '/api/health') || pathname === '/api/health' || pathname.endsWith('/health')) {
      try {
        const health = await healthCheck();
        send(res, health.ok ? 200 : 503, health);
      } catch (err) {
        send(res, 503, healthPayload(err));
      }
      return;
    }

    try {
      await ensureDb();
    } catch (err) {
      sendDbDown(res, err);
      return;
    }

    if (hit('GET', '/api/geo')) {
      const countries = await listCountries();
      const cities = await listCities();
      const districts = await listDistricts();
      send(res, 200, { countries, cities, districts, slots: SLOTS });
      return;
    }

    if (hit('POST', '/api/auth/register') || hit('POST', '/api/register')) {
      const body = await getBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      const password = String(body.password || '');
      const name = String(body.name || '').trim();
      const locale = body.locale === 'en' ? 'en' : 'ru';
      if (!EMAIL_RE.test(email)) {
        send(res, 400, { error: 'email' });
        return;
      }
      if (password.length < 8) {
        send(res, 400, { error: 'password' });
        return;
      }
      if (!name) {
        send(res, 400, { error: 'name' });
        return;
      }
      const exists = await findUserByEmail(email);
      if (exists) {
        send(res, 409, { error: 'exists' });
        return;
      }
      const user = await insertUser({
        id: newId('user'),
        email,
        passwordHash: hashPassword(password),
        name,
        phone: String(body.phone || '').replace(/\D/g, ''),
        locale,
        countryId: body.countryId || 'uz',
        cityId: body.cityId || null,
        districtId: body.districtId || null,
        activeRole: 'buyer',
        isSupport: false,
        blocked: false,
        blockedReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      send(res, 201, await mePayload(user), { 'Set-Cookie': sessionCookie(user.id) });
      return;
    }

    if (hit('POST', '/api/auth/login') || hit('POST', '/api/login')) {
      const body = await getBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      const password = String(body.password || '');
      const user = await findUserByEmail(email);
      if (!user || !checkPassword(password, user.passwordHash)) {
        send(res, 401, { error: 'auth' });
        return;
      }
      if (flag(user.blocked)) {
        send(res, 403, { error: 'blocked', reason: user.blockedReason || '' });
        return;
      }
      send(res, 200, await mePayload(user), { 'Set-Cookie': sessionCookie(user.id) });
      return;
    }

    if (hit('POST', '/api/auth/logout') || hit('POST', '/api/logout')) {
      send(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', true) });
      return;
    }

    if (hit('GET', '/api/me')) {
      const user = await currentUser(req);
      if (!user) {
        send(res, 401, { error: 'auth' });
        return;
      }
      send(res, 200, await mePayload(user));
      return;
    }

    if (hit('PATCH', '/api/me')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const body = await getBody(req);
      const patch = {};
      if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
      if (typeof body.phone === 'string') patch.phone = body.phone.replace(/\D/g, '');
      if (body.locale === 'ru' || body.locale === 'en') patch.locale = body.locale;
      if (body.activeRole === 'buyer' || body.activeRole === 'baker') patch.activeRole = body.activeRole;
      if (body.countryId) patch.countryId = body.countryId;
      if (body.cityId !== undefined) patch.cityId = body.cityId || null;
      if (body.districtId !== undefined) patch.districtId = body.districtId || null;
      const next = await updateUser(user.id, patch);
      send(res, 200, await mePayload(next));
      return;
    }

    if (hit('GET', '/api/kitchens')) {
      const user = await currentUser(req);
      const kitchens = await listKitchensFiltered({
        countryId: q.countryId,
        cityId: q.cityId,
        districtId: q.districtId,
      });
      const owners = await listUsersByIds(kitchens.map((k) => k.ownerUserId));
      const byId = Object.fromEntries(owners.map((u) => [u.id, u]));
      const filtered = kitchens.filter((k) => {
        if (user && (flag(user.isSupport) || k.ownerUserId === user.id)) return true;
        return kitchenVisible(k, byId[k.ownerUserId]);
      });
      send(res, 200, {
        kitchens: filtered.map((k) => publicKitchen(k, { includePrivate: Boolean(user && flag(user.isSupport)) })),
      });
      return;
    }

    const kitchenOne = hit('GET', '/api/kitchens/:id');
    if (kitchenOne) {
      const user = await currentUser(req);
      const kitchen = await findKitchenById(kitchenOne.id);
      if (!kitchen) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const owner = await findUserById(kitchen.ownerUserId);
      const canSee =
        kitchenVisible(kitchen, owner) || (user && (user.id === kitchen.ownerUserId || flag(user.isSupport)));
      if (!canSee) {
        send(res, 404, { error: 'hidden' });
        return;
      }
      const dishes = (await listDishesByKitchen(kitchen.id)).map(publicDish);
      send(res, 200, {
        kitchen: publicKitchen(kitchen, {
          includePrivate: Boolean(user && (user.id === kitchen.ownerUserId || flag(user.isSupport))),
        }),
        dishes,
      });
      return;
    }

    if (hit('GET', '/api/my/kitchen')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findKitchenByOwner(user.id);
      if (!kitchen) {
        send(res, 200, { kitchen: null, dishes: [] });
        return;
      }
      const dishes = (await listDishesByKitchen(kitchen.id)).map(publicDish);
      send(res, 200, { kitchen: publicKitchen(kitchen, { includePrivate: true }), dishes });
      return;
    }

    if (hit('POST', '/api/my/kitchen') || hit('PATCH', '/api/my/kitchen')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const body = await getBody(req);
      const name = String(body.name || '').trim();
      const ownerFullName = String(body.ownerFullName || '').trim();
      const address = String(body.address || '').trim();
      const countryId = body.countryId;
      const cityId = body.cityId;
      const districtId = body.districtId;
      if (!name || !ownerFullName || !address || !countryId || !cityId || !districtId) {
        send(res, 400, { error: 'fields' });
        return;
      }
      if (!body.confirmCooksHere) {
        send(res, 400, { error: 'confirm' });
        return;
      }
      const district = await findDistrictById(districtId);
      const city = await findCityById(cityId);
      if (!district || !city || district.cityId !== cityId || city.countryId !== countryId) {
        send(res, 400, { error: 'geo' });
        return;
      }
      const existing = await findKitchenByOwner(user.id);
      const payload = {
        name,
        ownerFullName,
        bio: String(body.bio || '').trim(),
        address,
        countryId,
        cityId,
        districtId,
        cutoffHour: Math.min(22, Math.max(10, Number(body.cutoffHour) || 18)),
        deliveryPickup: body.deliveryPickup !== false,
        deliveryCourier: body.deliveryCourier !== false,
        emoji: String(body.emoji || '🍞').slice(0, 4),
        confirmCooksHere: true,
        verificationStatus: 'pending',
        verificationNote: '',
        hidden: existing ? flag(existing.hidden) : false,
      };
      if (!payload.deliveryPickup && !payload.deliveryCourier) payload.deliveryPickup = true;
      let kitchen;
      if (existing) {
        kitchen = await updateKitchen(existing.id, payload);
      } else {
        kitchen = await insertKitchen({
          id: newId('kit'),
          ownerUserId: user.id,
          accent: '#E85D04',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload,
        });
      }
      if (user.activeRole !== 'baker') await updateUser(user.id, { activeRole: 'baker' });
      send(res, 200, { kitchen: publicKitchen(kitchen, { includePrivate: true }) });
      return;
    }

    if (hit('POST', '/api/my/dishes')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findKitchenByOwner(user.id);
      if (!kitchen) {
        send(res, 400, { error: 'no_kitchen' });
        return;
      }
      const body = await getBody(req);
      const name = String(body.name || '').trim();
      const price = Number(body.price);
      if (!name || !Number.isFinite(price) || price <= 0) {
        send(res, 400, { error: 'fields' });
        return;
      }
      const leftover = Math.max(0, Number(body.leftover) || 20);
      const dish = await insertDish({
        id: newId('dish'),
        kitchenId: kitchen.id,
        name,
        category: String(body.category || '').trim(),
        price: Math.round(price),
        unit: String(body.unit || 'шт').trim() || 'шт',
        ingredients: String(body.ingredients || '').trim(),
        leftover,
        defaultLeftover: leftover,
        availableTomorrow: body.availableTomorrow !== false,
        emoji: String(body.emoji || '🍽').slice(0, 4),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      send(res, 201, { dish: publicDish(dish) });
      return;
    }

    const dishPatch = hit('PATCH', '/api/my/dishes/:id');
    if (dishPatch) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findKitchenByOwner(user.id);
      const dish = await findDishById(dishPatch.id);
      if (!kitchen || !dish || dish.kitchenId !== kitchen.id) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const patch = {};
      if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
      if (body.price != null) patch.price = Math.round(Number(body.price));
      if (typeof body.unit === 'string') patch.unit = body.unit;
      if (typeof body.category === 'string') patch.category = body.category;
      if (typeof body.ingredients === 'string') patch.ingredients = body.ingredients;
      if (body.leftover != null) patch.leftover = Math.max(0, Number(body.leftover) || 0);
      if (body.availableTomorrow != null) patch.availableTomorrow = Boolean(body.availableTomorrow);
      if (typeof body.emoji === 'string') patch.emoji = body.emoji.slice(0, 4);
      const next = await updateDish(dish.id, patch);
      send(res, 200, { dish: publicDish(next) });
      return;
    }

    if (hit('GET', '/api/orders')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const mine = await listOrdersByBuyer(user.id);
      send(res, 200, { orders: await attachOrders(mine) });
      return;
    }

    if (hit('GET', '/api/my/baker-orders')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findKitchenByOwner(user.id);
      if (!kitchen) {
        send(res, 200, { orders: [] });
        return;
      }
      const rows = await listOrdersByKitchen(kitchen.id);
      send(res, 200, { orders: await attachOrders(rows) });
      return;
    }

    const bakerPatch = hit('PATCH', '/api/my/baker-orders/:id');
    if (bakerPatch) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findKitchenByOwner(user.id);
      const order = await findOrderById(bakerPatch.id);
      if (!kitchen || !order || order.kitchenId !== kitchen.id) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const status = String(body.status || '');
      try {
        const next = await updateOrderStatus(order, { status, actorUserId: user.id, source: 'baker' });
        send(res, 200, { order: await attachOrder(next) });
      } catch (err) {
        if (!sendErr(res, err)) throw err;
      }
      return;
    }

    const orderOne = hit('GET', '/api/orders/:id');
    if (orderOne) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const order = await findOrderById(orderOne.id);
      if (!order) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const kitchen = await findKitchenById(order.kitchenId);
      const allowed = order.buyerUserId === user.id || kitchen?.ownerUserId === user.id || flag(user.isSupport);
      if (!allowed) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      send(res, 200, { order: await attachOrder(order) });
      return;
    }

    if (hit('POST', '/api/orders')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const body = await getBody(req);
      const itemsIn = Array.isArray(body.items) ? body.items : [];
      if (!itemsIn.length) {
        send(res, 400, { error: 'empty' });
        return;
      }
      const guestName = String(body.guestName || user.name || '').trim();
      const guestPhone = String(body.guestPhone || user.phone || '').replace(/\D/g, '');
      const deliveryType = body.deliveryType === 'courier' ? 'courier' : 'pickup';
      const slot = String(body.slot || '');
      const address = String(body.address || '').trim();
      const comment = String(body.comment || '').trim();
      if (!guestName) {
        send(res, 400, { error: 'name' });
        return;
      }
      if (guestPhone.length < 9) {
        send(res, 400, { error: 'phone' });
        return;
      }
      if (deliveryType === 'courier' && !address) {
        send(res, 400, { error: 'address' });
        return;
      }
      if (SLOTS.length && slot && !SLOTS.includes(slot)) {
        send(res, 400, { error: 'slot' });
        return;
      }
      try {
        const order = await createOrder({
          user,
          itemsIn,
          guestName,
          guestPhone,
          deliveryType,
          slot: slot || SLOTS[0] || '10:00–12:00',
          address,
          comment,
        });
        send(res, 201, { order: await attachOrder(order) });
      } catch (err) {
        if (!sendErr(res, err)) throw err;
      }
      return;
    }

    if (hit('POST', '/api/tickets')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const body = await getBody(req);
      const topic = String(body.topic || 'other').trim() || 'other';
      const text = String(body.body || '').trim();
      const targetType = String(body.targetType || 'order').trim();
      const targetId = String(body.targetId || '').trim();
      if (text.length < 4 || !targetId) {
        send(res, 400, { error: 'fields' });
        return;
      }
      const ticket = await insertTicket({
        id: newId('tkt'),
        authorUserId: user.id,
        targetType,
        targetId,
        topic,
        body: text,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      send(res, 201, { ticket });
      return;
    }

    if (hit('GET', '/api/admin/kitchens')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const kitchens = await listAllKitchens();
      send(res, 200, { kitchens: kitchens.map((k) => publicKitchen(k, { includePrivate: true })) });
      return;
    }

    const adminKitchen = hit('PATCH', '/api/admin/kitchens/:id');
    if (adminKitchen) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const kitchen = await findKitchenById(adminKitchen.id);
      if (!kitchen) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const patch = {};
      if (
        body.verificationStatus === 'verified' ||
        body.verificationStatus === 'rejected' ||
        body.verificationStatus === 'pending'
      ) {
        patch.verificationStatus = body.verificationStatus;
      }
      if (typeof body.verificationNote === 'string') patch.verificationNote = body.verificationNote;
      if (body.hidden != null) patch.hidden = Boolean(body.hidden);
      if (patch.verificationStatus == null && patch.hidden == null) {
        send(res, 400, { error: 'fields' });
        return;
      }
      const next = await updateKitchen(kitchen.id, patch);
      await safeAudit({
        actorUserId: user.id,
        action: 'kitchen.patch',
        targetType: 'kitchen',
        targetId: kitchen.id,
        payload: patch,
      });
      send(res, 200, { kitchen: publicKitchen(next, { includePrivate: true }) });
      return;
    }

    if (hit('GET', '/api/admin/users')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const users = await listUsers();
      send(res, 200, { users: users.map(publicUser) });
      return;
    }

    const adminUser = hit('PATCH', '/api/admin/users/:id');
    if (adminUser) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const target = await findUserById(adminUser.id);
      if (!target) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      if (flag(target.isSupport)) {
        send(res, 403, { error: 'forbidden' });
        return;
      }
      const body = await getBody(req);
      const blocked = parseBlocked(body);
      if (blocked == null) {
        send(res, 400, { error: 'fields' });
        return;
      }
      const next = await updateUser(target.id, {
        blocked,
        blockedReason: blocked ? String(body.reason || '') : '',
      });
      await safeAudit({
        actorUserId: user.id,
        action: blocked ? 'user.block' : 'user.unblock',
        targetType: 'user',
        targetId: target.id,
        payload: { reason: body.reason || '' },
      });
      send(res, 200, { user: publicUser(next) });
      return;
    }

    if (hit('GET', '/api/admin/tickets')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      send(res, 200, { tickets: await listTickets() });
      return;
    }

    const adminTicket = hit('PATCH', '/api/admin/tickets/:id');
    if (adminTicket) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const ticket = await findTicketById(adminTicket.id);
      if (!ticket) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const status = String(body.status || '');
      if (!['open', 'working', 'closed'].includes(status)) {
        send(res, 400, { error: 'status' });
        return;
      }
      const next = await updateTicket(ticket.id, { status });
      await safeAudit({
        actorUserId: user.id,
        action: 'ticket.status',
        targetType: 'ticket',
        targetId: ticket.id,
        payload: { status },
      });
      send(res, 200, { ticket: next });
      return;
    }

    if (hit('GET', '/api/admin/orders')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const rows = await searchAdminOrders(q.q);
      send(res, 200, { orders: await attachOrders(rows) });
      return;
    }

    const adminOrder = hit('PATCH', '/api/admin/orders/:id');
    if (adminOrder) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const order = await findOrderById(adminOrder.id);
      if (!order) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const status = String(body.status || '');
      if (status !== 'cancelled') {
        send(res, 400, { error: 'status' });
        return;
      }
      try {
        const next = await updateOrderStatus(order, {
          status,
          actorUserId: user.id,
          source: 'support',
          force: true,
        });
        await safeAudit({
          actorUserId: user.id,
          action: 'order.cancel',
          targetType: 'order',
          targetId: order.id,
          payload: { status },
        });
        send(res, 200, { order: await attachOrder(next) });
      } catch (err) {
        if (!sendErr(res, err)) throw err;
      }
      return;
    }

    if (method === 'GET' && (pathname === '/api' || pathname === '/api/')) {
      send(res, 200, {
        ok: true,
        app: 'JOL-Ashkana API',
        db: dbMode(),
        open: 'http://localhost:5173',
      });
      return;
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    const code = err?.code;
    if (code === 'jwt_config' || code === 'db_config' || code === 'db') {
      send(res, 503, { error: code, hint: err.message || 'Config error' });
      return;
    }
    send(res, 500, { error: 'server', hint: err?.message || 'Server error' });
  }
}
