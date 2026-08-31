import { randomBytes, randomUUID } from 'crypto';
import { SLOTS } from './geo-data.js';
import { checkPassword, cookieHeader, hashPassword, signToken, tokenFromReq } from './auth.js';
import { ensureDb, findById, findOne, flag, insert, list, update } from './db.js';

const STATUS_FLOW = ['accepted', 'baking', 'ready', 'delivered'];
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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1_000_000) {
        reject(new Error('too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function getBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const raw = await readRawBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function pathnameOf(req) {
  const raw = req.url || '/';
  const path = raw.split('?')[0];
  if (path.startsWith('/api')) return path;
  return `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone || '',
    locale: u.locale || 'ru',
    countryId: u.countryId || null,
    cityId: u.cityId || null,
    districtId: u.districtId || null,
    activeRole: u.activeRole === 'baker' ? 'baker' : 'buyer',
    isSupport: flag(u.isSupport),
    blocked: flag(u.blocked),
    blockedReason: u.blockedReason || '',
  };
}

function publicKitchen(k, { includePrivate = false } = {}) {
  if (!k) return null;
  const base = {
    id: k.id,
    ownerUserId: k.ownerUserId,
    name: k.name,
    bio: k.bio || '',
    address: k.address || '',
    countryId: k.countryId,
    cityId: k.cityId,
    districtId: k.districtId,
    cutoffHour: Number(k.cutoffHour) || 18,
    deliveryPickup: flag(k.deliveryPickup),
    deliveryCourier: flag(k.deliveryCourier),
    emoji: k.emoji || '🍞',
    accent: k.accent || '#E85D04',
    verificationStatus: k.verificationStatus,
    hidden: flag(k.hidden),
  };
  if (includePrivate) {
    base.ownerFullName = k.ownerFullName || '';
    base.verificationNote = k.verificationNote || '';
    base.confirmCooksHere = flag(k.confirmCooksHere);
  }
  return base;
}

function publicDish(d) {
  return {
    id: d.id,
    kitchenId: d.kitchenId,
    name: d.name,
    category: d.category || '',
    price: Number(d.price) || 0,
    unit: d.unit || 'шт',
    ingredients: d.ingredients || '',
    leftover: Number(d.leftover) || 0,
    availableTomorrow: flag(d.availableTomorrow),
    emoji: d.emoji || '🍽',
  };
}

async function currentUser(req) {
  const token = tokenFromReq(req);
  if (!token) return null;
  const { readToken } = await import('./auth.js');
  const payload = readToken(token);
  if (!payload?.sub) return null;
  return findById('users', payload.sub);
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

function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function orderDateForBaker(cutoffHour) {
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 1);
  if (new Date().getHours() >= (Number(cutoffHour) || 18)) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function newId(prefix) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function newOrderId() {
  return `JA-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function kitchenVisible(k, owner) {
  if (!k) return false;
  if (flag(k.hidden)) return false;
  if (k.verificationStatus !== 'verified') return false;
  if (owner && flag(owner.blocked)) return false;
  return true;
}

async function mePayload(user) {
  const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
  return {
    user: publicUser(user),
    kitchen: kitchen ? publicKitchen(kitchen, { includePrivate: true }) : null,
  };
}

async function attachOrder(order) {
  const items = await list('orderItems', (i) => i.orderId === order.id);
  const kitchen = await findById('kitchens', order.kitchenId);
  return {
    ...order,
    payMethod: order.payMethod || 'cash',
    items,
    kitchen: kitchen ? publicKitchen(kitchen) : null,
  };
}

export async function handle(req, res) {
  try {
    await ensureDb();
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const pathname = pathnameOf(req);
    const method = req.method || 'GET';
    const url = new URL(req.url || '/', 'http://localhost');
    const q = Object.fromEntries(url.searchParams.entries());

    const hit = (m, p) => matchRoute(m, p, method, pathname);

    if (hit('GET', '/api/health')) {
      send(res, 200, { ok: true });
      return;
    }

    if (hit('GET', '/api/geo')) {
      const countries = await list('countries');
      const cities = await list('cities');
      const districts = await list('districts');
      countries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      send(res, 200, { countries, cities, districts, slots: SLOTS });
      return;
    }

    if (hit('POST', '/api/auth/register')) {
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
      const exists = await findOne('users', (u) => u.email === email);
      if (exists) {
        send(res, 409, { error: 'exists' });
        return;
      }
      const user = {
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
        isSupport: 0,
        blocked: 0,
        blockedReason: '',
        createdAt: new Date().toISOString(),
      };
      await insert('users', user);
      send(res, 201, await mePayload(user), { 'Set-Cookie': cookieHeader(signToken(user.id)) });
      return;
    }

    if (hit('POST', '/api/auth/login')) {
      const body = await getBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      const password = String(body.password || '');
      const user = await findOne('users', (u) => u.email === email);
      if (!user || !checkPassword(password, user.passwordHash)) {
        send(res, 401, { error: 'credentials' });
        return;
      }
      if (flag(user.blocked)) {
        send(res, 403, { error: 'blocked', reason: user.blockedReason || '' });
        return;
      }
      send(res, 200, await mePayload(user), { 'Set-Cookie': cookieHeader(signToken(user.id)) });
      return;
    }

    if (hit('POST', '/api/auth/logout')) {
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
      const next = await update('users', user.id, patch);
      send(res, 200, await mePayload(next));
      return;
    }

    if (hit('GET', '/api/kitchens')) {
      const user = await currentUser(req);
      const kitchens = await list('kitchens');
      const users = await list('users');
      const byId = Object.fromEntries(users.map((u) => [u.id, u]));
      const filtered = kitchens.filter((k) => {
        if (q.countryId && k.countryId !== q.countryId) return false;
        if (q.cityId && k.cityId !== q.cityId) return false;
        if (q.districtId && k.districtId !== q.districtId) return false;
        if (user && (flag(user.isSupport) || k.ownerUserId === user.id)) return true;
        return kitchenVisible(k, byId[k.ownerUserId]);
      });
      send(res, 200, { kitchens: filtered.map((k) => publicKitchen(k, { includePrivate: Boolean(user && flag(user.isSupport)) })) });
      return;
    }

    const kitchenOne = hit('GET', '/api/kitchens/:id');
    if (kitchenOne) {
      const user = await currentUser(req);
      const kitchen = await findById('kitchens', kitchenOne.id);
      if (!kitchen) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const owner = await findById('users', kitchen.ownerUserId);
      const canSee =
        kitchenVisible(kitchen, owner) ||
        (user && (user.id === kitchen.ownerUserId || flag(user.isSupport)));
      if (!canSee) {
        send(res, 404, { error: 'hidden' });
        return;
      }
      const dishes = (await list('dishes', (d) => d.kitchenId === kitchen.id)).map(publicDish);
      send(res, 200, {
        kitchen: publicKitchen(kitchen, { includePrivate: Boolean(user && (user.id === kitchen.ownerUserId || flag(user.isSupport))) }),
        dishes,
      });
      return;
    }

    if (hit('GET', '/api/my/kitchen')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
      if (!kitchen) {
        send(res, 200, { kitchen: null, dishes: [] });
        return;
      }
      const dishes = (await list('dishes', (d) => d.kitchenId === kitchen.id)).map(publicDish);
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
      const district = await findById('districts', districtId);
      const city = await findById('cities', cityId);
      if (!district || !city || district.cityId !== cityId || city.countryId !== countryId) {
        send(res, 400, { error: 'geo' });
        return;
      }
      const existing = await findOne('kitchens', (k) => k.ownerUserId === user.id);
      const payload = {
        name,
        ownerFullName,
        bio: String(body.bio || '').trim(),
        address,
        countryId,
        cityId,
        districtId,
        cutoffHour: Math.min(22, Math.max(10, Number(body.cutoffHour) || 18)),
        deliveryPickup: body.deliveryPickup === false ? 0 : 1,
        deliveryCourier: body.deliveryCourier === false ? 0 : 1,
        emoji: String(body.emoji || '🍞').slice(0, 4),
        confirmCooksHere: 1,
        verificationStatus: 'pending',
        verificationNote: '',
        hidden: existing ? existing.hidden : 0,
      };
      if (!payload.deliveryPickup && !payload.deliveryCourier) payload.deliveryPickup = 1;
      let kitchen;
      if (existing) {
        kitchen = await update('kitchens', existing.id, payload);
      } else {
        kitchen = await insert('kitchens', {
          id: newId('kit'),
          ownerUserId: user.id,
          accent: '#E85D04',
          createdAt: new Date().toISOString(),
          ...payload,
        });
      }
      if (user.activeRole !== 'baker') await update('users', user.id, { activeRole: 'baker' });
      send(res, 200, { kitchen: publicKitchen(kitchen, { includePrivate: true }) });
      return;
    }

    if (hit('POST', '/api/my/dishes')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
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
      const dish = await insert('dishes', {
        id: newId('dish'),
        kitchenId: kitchen.id,
        name,
        category: String(body.category || '').trim(),
        price: Math.round(price),
        unit: String(body.unit || 'шт').trim() || 'шт',
        ingredients: String(body.ingredients || '').trim(),
        leftover: Math.max(0, Number(body.leftover) || 20),
        availableTomorrow: body.availableTomorrow === false ? 0 : 1,
        emoji: String(body.emoji || '🍽').slice(0, 4),
        createdAt: new Date().toISOString(),
      });
      send(res, 201, { dish: publicDish(dish) });
      return;
    }

    const dishPatch = hit('PATCH', '/api/my/dishes/:id');
    if (dishPatch) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
      const dish = await findById('dishes', dishPatch.id);
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
      if (body.availableTomorrow != null) patch.availableTomorrow = body.availableTomorrow ? 1 : 0;
      if (typeof body.emoji === 'string') patch.emoji = body.emoji.slice(0, 4);
      const next = await update('dishes', dish.id, patch);
      send(res, 200, { dish: publicDish(next) });
      return;
    }

    if (hit('GET', '/api/orders')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const mine = await list('orders', (o) => o.buyerUserId === user.id);
      mine.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      send(res, 200, { orders: await Promise.all(mine.map(attachOrder)) });
      return;
    }

    if (hit('GET', '/api/my/baker-orders')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
      if (!kitchen) {
        send(res, 200, { orders: [] });
        return;
      }
      const rows = await list('orders', (o) => o.kitchenId === kitchen.id);
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      send(res, 200, { orders: await Promise.all(rows.map(attachOrder)) });
      return;
    }

    const orderOne = hit('GET', '/api/orders/:id');
    if (orderOne) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const order = await findById('orders', orderOne.id);
      if (!order) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const kitchen = await findById('kitchens', order.kitchenId);
      const allowed =
        order.buyerUserId === user.id ||
        kitchen?.ownerUserId === user.id ||
        flag(user.isSupport);
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
      if (!SLOTS.includes(slot)) {
        send(res, 400, { error: 'slot' });
        return;
      }
      if (deliveryType === 'courier' && !address) {
        send(res, 400, { error: 'address' });
        return;
      }

      const firstDish = await findById('dishes', itemsIn[0].dishId);
      if (!firstDish) {
        send(res, 400, { error: 'dish' });
        return;
      }
      const kitchen = await findById('kitchens', firstDish.kitchenId);
      const owner = kitchen ? await findById('users', kitchen.ownerUserId) : null;
      if (!kitchenVisible(kitchen, owner)) {
        send(res, 400, { error: 'kitchen' });
        return;
      }
      if (deliveryType === 'courier' && !flag(kitchen.deliveryCourier)) {
        send(res, 400, { error: 'delivery' });
        return;
      }
      if (deliveryType === 'pickup' && !flag(kitchen.deliveryPickup)) {
        send(res, 400, { error: 'delivery' });
        return;
      }

      const country = await findById('countries', kitchen.countryId);
      const built = [];
      let total = 0;
      for (const line of itemsIn) {
        const dish = await findById('dishes', line.dishId);
        const qty = Math.max(1, Number(line.qty) || 0);
        if (!dish || dish.kitchenId !== kitchen.id) {
          send(res, 400, { error: 'dish' });
          return;
        }
        if (!flag(dish.availableTomorrow) || Number(dish.leftover) < qty) {
          send(res, 400, { error: 'leftover' });
          return;
        }
        built.push({ dish, qty });
        total += Number(dish.price) * qty;
      }

      const order = {
        id: newOrderId(),
        buyerUserId: user.id,
        kitchenId: kitchen.id,
        guestName,
        guestPhone,
        deliveryType,
        slot,
        address: deliveryType === 'courier' ? address : kitchen.address,
        comment,
        payMethod: 'cash',
        status: 'accepted',
        forDate: toISODate(orderDateForBaker(kitchen.cutoffHour)),
        total,
        currency: country?.currency || 'UZS',
        createdAt: new Date().toISOString(),
      };
      await insert('orders', order);
      for (const line of built) {
        await insert('orderItems', {
          id: newId('oi'),
          orderId: order.id,
          dishId: line.dish.id,
          name: line.dish.name,
          qty: line.qty,
          price: Number(line.dish.price),
        });
        await update('dishes', line.dish.id, { leftover: Number(line.dish.leftover) - line.qty });
      }
      if (guestPhone && user.phone !== guestPhone) {
        await update('users', user.id, { phone: guestPhone, name: guestName || user.name });
      }
      send(res, 201, { order: await attachOrder(order) });
      return;
    }

    const bakerStatus = hit('PATCH', '/api/my/baker-orders/:id');
    if (bakerStatus) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const kitchen = await findOne('kitchens', (k) => k.ownerUserId === user.id);
      const order = await findById('orders', bakerStatus.id);
      if (!kitchen || !order || order.kitchenId !== kitchen.id) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const next = body.status;
      if (next === 'cancelled' && order.status !== 'delivered') {
        await restoreLeftover(order);
        const updated = await update('orders', order.id, { status: 'cancelled' });
        send(res, 200, { order: await attachOrder(updated) });
        return;
      }
      const cur = STATUS_FLOW.indexOf(order.status);
      const want = STATUS_FLOW.indexOf(next);
      if (want !== cur + 1) {
        send(res, 400, { error: 'status' });
        return;
      }
      const updated = await update('orders', order.id, { status: next });
      send(res, 200, { order: await attachOrder(updated) });
      return;
    }

    if (hit('POST', '/api/tickets')) {
      const user = await currentUser(req);
      if (!requireUser(user, res)) return;
      const body = await getBody(req);
      const targetType = ['order', 'kitchen', 'user'].includes(body.targetType) ? body.targetType : '';
      const targetId = String(body.targetId || '');
      const topic = String(body.topic || 'other');
      const text = String(body.body || '').trim();
      if (!targetType || !targetId || text.length < 4) {
        send(res, 400, { error: 'fields' });
        return;
      }
      const ticket = await insert('tickets', {
        id: newId('t'),
        authorUserId: user.id,
        targetType,
        targetId,
        topic,
        body: text,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      send(res, 201, { ticket });
      return;
    }

    if (hit('GET', '/api/admin/users')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const users = (await list('users')).map(publicUser);
      send(res, 200, { users });
      return;
    }

    if (hit('GET', '/api/admin/kitchens')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const kitchens = await list('kitchens');
      send(res, 200, { kitchens: kitchens.map((k) => publicKitchen(k, { includePrivate: true })) });
      return;
    }

    if (hit('GET', '/api/admin/orders')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const qtext = String(q.q || '').toLowerCase();
      const digits = String(q.q || '').replace(/\D/g, '');
      let orders = await list('orders');
      if (qtext || digits) {
        orders = orders.filter((o) => {
          if (digits && String(o.guestPhone || '').includes(digits)) return true;
          if (qtext && String(o.id).toLowerCase().includes(qtext)) return true;
          if (qtext && String(o.guestName || '').toLowerCase().includes(qtext)) return true;
          return false;
        });
      }
      orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      send(res, 200, { orders: await Promise.all(orders.slice(0, 50).map(attachOrder)) });
      return;
    }

    if (hit('GET', '/api/admin/tickets')) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const tickets = await list('tickets');
      tickets.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      send(res, 200, { tickets });
      return;
    }

    const adminUser = hit('PATCH', '/api/admin/users/:id');
    if (adminUser) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const target = await findById('users', adminUser.id);
      if (!target) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      if (target.id === user.id) {
        send(res, 400, { error: 'self' });
        return;
      }
      const body = await getBody(req);
      const patch = {};
      if (body.blocked != null) {
        patch.blocked = body.blocked ? 1 : 0;
        patch.blockedReason = body.blocked ? String(body.reason || body.blockedReason || '') : '';
      }
      const next = await update('users', target.id, patch);
      send(res, 200, { user: publicUser(next) });
      return;
    }

    const adminKitchen = hit('PATCH', '/api/admin/kitchens/:id');
    if (adminKitchen) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const kitchen = await findById('kitchens', adminKitchen.id);
      if (!kitchen) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const patch = {};
      if (body.verificationStatus === 'verified' || body.verificationStatus === 'rejected' || body.verificationStatus === 'pending') {
        patch.verificationStatus = body.verificationStatus;
        patch.verificationNote = String(body.verificationNote || body.note || '');
      }
      if (body.hidden != null) patch.hidden = body.hidden ? 1 : 0;
      const next = await update('kitchens', kitchen.id, patch);
      send(res, 200, { kitchen: publicKitchen(next, { includePrivate: true }) });
      return;
    }

    const adminOrder = hit('PATCH', '/api/admin/orders/:id');
    if (adminOrder) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const order = await findById('orders', adminOrder.id);
      if (!order) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const nextStatus = body.status;
      if (nextStatus === 'cancelled' && order.status !== 'cancelled' && order.status !== 'delivered') {
        await restoreLeftover(order);
        const updated = await update('orders', order.id, { status: 'cancelled' });
        send(res, 200, { order: await attachOrder(updated) });
        return;
      }
      if (!STATUS_FLOW.includes(nextStatus)) {
        send(res, 400, { error: 'status' });
        return;
      }
      const updated = await update('orders', order.id, { status: nextStatus });
      send(res, 200, { order: await attachOrder(updated) });
      return;
    }

    const adminTicket = hit('PATCH', '/api/admin/tickets/:id');
    if (adminTicket) {
      const user = await currentUser(req);
      if (!requireSupport(user, res)) return;
      const ticket = await findById('tickets', adminTicket.id);
      if (!ticket) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      const body = await getBody(req);
      const status = ['open', 'working', 'closed'].includes(body.status) ? body.status : ticket.status;
      const next = await update('tickets', ticket.id, { status });
      send(res, 200, { ticket: next });
      return;
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'server' });
  }
}

async function restoreLeftover(order) {
  if (order.status === 'cancelled') return;
  const items = await list('orderItems', (i) => i.orderId === order.id);
  for (const item of items) {
    const dish = await findById('dishes', item.dishId);
    if (dish) await update('dishes', dish.id, { leftover: Number(dish.leftover) + Number(item.qty) });
  }
}
