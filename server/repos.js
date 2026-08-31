import { randomUUID } from 'crypto';
import { ApiError } from './errors.js';
import {
  insertRow,
  isPostgres,
  memFindById,
  memInsert,
  memList,
  memUpdate,
  query,
  updateRow,
  withTransaction,
} from './db.js';
import { publicDish, publicOrder } from './serialize.js';
import {
  flag,
  kitchenVisible,
  newId,
  newOrderId,
  nextStatusAllowed,
  orderDateForBaker,
  toISODate,
} from './util.js';

function nowIso() {
  return new Date().toISOString();
}

export async function findUserById(id) {
  if (!id) return null;
  if (!isPostgres()) return memFindById('users', id);
  const rows = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findUserByEmail(email) {
  if (!isPostgres()) return memList('users', (u) => u.email === email)[0] || null;
  const rows = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

export async function insertUser(user) {
  return insertRow('users', user);
}

export async function updateUser(id, patch) {
  return updateRow('users', id, { ...patch, updatedAt: nowIso() });
}

export async function listUsers() {
  if (!isPostgres()) return memList('users');
  return query('SELECT * FROM users ORDER BY created_at DESC');
}

export async function listCountries() {
  if (!isPostgres()) {
    return memList('countries').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  return query('SELECT * FROM countries ORDER BY sort_order ASC');
}

export async function listCities() {
  if (!isPostgres()) return memList('cities');
  return query('SELECT * FROM cities');
}

export async function listDistricts() {
  if (!isPostgres()) return memList('districts');
  return query('SELECT * FROM districts');
}

export async function findCountryById(id) {
  if (!isPostgres()) return memFindById('countries', id);
  const rows = await query('SELECT * FROM countries WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findCityById(id) {
  if (!isPostgres()) return memFindById('cities', id);
  const rows = await query('SELECT * FROM cities WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findDistrictById(id) {
  if (!isPostgres()) return memFindById('districts', id);
  const rows = await query('SELECT * FROM districts WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findKitchenById(id) {
  if (!id) return null;
  if (!isPostgres()) return memFindById('kitchens', id);
  const rows = await query('SELECT * FROM kitchens WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findKitchenByOwner(userId) {
  if (!isPostgres()) return memList('kitchens', (k) => k.ownerUserId === userId)[0] || null;
  const rows = await query('SELECT * FROM kitchens WHERE owner_user_id = $1', [userId]);
  return rows[0] || null;
}

export async function listKitchensFiltered({ countryId, cityId, districtId } = {}) {
  if (!isPostgres()) {
    return memList('kitchens', (k) => {
      if (countryId && k.countryId !== countryId) return false;
      if (cityId && k.cityId !== cityId) return false;
      if (districtId && k.districtId !== districtId) return false;
      return true;
    });
  }
  const clauses = [];
  const params = [];
  if (countryId) {
    params.push(countryId);
    clauses.push(`country_id = $${params.length}`);
  }
  if (cityId) {
    params.push(cityId);
    clauses.push(`city_id = $${params.length}`);
  }
  if (districtId) {
    params.push(districtId);
    clauses.push(`district_id = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return query(`SELECT * FROM kitchens ${where} ORDER BY name ASC`, params);
}

export async function listAllKitchens() {
  if (!isPostgres()) return memList('kitchens');
  return query('SELECT * FROM kitchens ORDER BY created_at DESC');
}

export async function insertKitchen(row) {
  return insertRow('kitchens', row);
}

export async function updateKitchen(id, patch) {
  return updateRow('kitchens', id, { ...patch, updatedAt: nowIso() });
}

export async function findDishById(id) {
  if (!isPostgres()) return memFindById('dishes', id);
  const rows = await query('SELECT * FROM dishes WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function listDishesByKitchen(kitchenId) {
  if (!isPostgres()) return memList('dishes', (d) => d.kitchenId === kitchenId);
  return query('SELECT * FROM dishes WHERE kitchen_id = $1 ORDER BY created_at ASC', [kitchenId]);
}

export async function insertDish(row) {
  return insertRow('dishes', row);
}

export async function updateDish(id, patch) {
  return updateRow('dishes', id, { ...patch, updatedAt: nowIso() });
}

export async function listUsersByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  if (!isPostgres()) return unique.map((id) => memFindById('users', id)).filter(Boolean);
  const rows = await query(`SELECT * FROM users WHERE id = ANY($1::text[])`, [unique]);
  return rows;
}

async function listItemsByOrderIds(orderIds) {
  if (!orderIds.length) return [];
  if (!isPostgres()) return memList('orderItems', (i) => orderIds.includes(i.orderId));
  return query('SELECT * FROM order_items WHERE order_id = ANY($1::text[])', [orderIds]);
}

async function listKitchensByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  if (!isPostgres()) return unique.map((id) => memFindById('kitchens', id)).filter(Boolean);
  return query('SELECT * FROM kitchens WHERE id = ANY($1::text[])', [unique]);
}

export async function attachOrders(orders) {
  if (!orders.length) return [];
  const items = await listItemsByOrderIds(orders.map((o) => o.id));
  const kitchens = await listKitchensByIds(orders.map((o) => o.kitchenId));
  const itemsBy = {};
  for (const item of items) {
    if (!itemsBy[item.orderId]) itemsBy[item.orderId] = [];
    itemsBy[item.orderId].push(item);
  }
  const kitBy = Object.fromEntries(kitchens.map((k) => [k.id, k]));
  return orders.map((o) => publicOrder(o, { items: itemsBy[o.id] || [], kitchen: kitBy[o.kitchenId] || null }));
}

export async function attachOrder(order) {
  const [row] = await attachOrders([order]);
  return row;
}

export async function findOrderById(id) {
  if (!id) return null;
  if (!isPostgres()) return memFindById('orders', id);
  const rows = await query('SELECT * FROM orders WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function listOrdersByBuyer(userId) {
  if (!isPostgres()) {
    return memList('orders', (o) => o.buyerUserId === userId).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }
  return query('SELECT * FROM orders WHERE buyer_user_id = $1 ORDER BY created_at DESC', [userId]);
}

export async function listOrdersByKitchen(kitchenId) {
  if (!isPostgres()) {
    return memList('orders', (o) => o.kitchenId === kitchenId).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }
  return query('SELECT * FROM orders WHERE kitchen_id = $1 ORDER BY created_at DESC', [kitchenId]);
}

export async function searchAdminOrders(q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!isPostgres()) {
    const rows = memList('orders');
    if (!needle) return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return rows
      .filter(
        (o) =>
          String(o.id).toLowerCase().includes(needle) ||
          String(o.guestPhone || '').includes(needle) ||
          String(o.guestName || '').toLowerCase().includes(needle),
      )
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  if (!needle) return query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200');
  return query(
    `SELECT * FROM orders
     WHERE lower(id) LIKE $1 OR guest_phone LIKE $2 OR lower(guest_name) LIKE $1
     ORDER BY created_at DESC
     LIMIT 200`,
    [`%${needle}%`, `%${needle}%`],
  );
}

async function writeEvent(qOrMem, { orderId, actorUserId, fromStatus, toStatus, source }) {
  const row = {
    id: newId('evt'),
    orderId,
    actorUserId: actorUserId || null,
    fromStatus: fromStatus || null,
    toStatus,
    source: source || 'system',
    createdAt: nowIso(),
  };
  if (qOrMem) {
    await qOrMem(
      `INSERT INTO order_events (id, order_id, actor_user_id, from_status, to_status, source, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.id, row.orderId, row.actorUserId, row.fromStatus, row.toStatus, row.source, row.createdAt],
    );
    return;
  }
  memInsert('orderEvents', row);
}

async function writeNotification(qOrMem, { userId, type, payload }) {
  if (!userId) return;
  const row = {
    id: newId('ntf'),
    userId,
    type,
    payload: payload || {},
    readAt: null,
    createdAt: nowIso(),
  };
  if (qOrMem) {
    await qOrMem(
      `INSERT INTO notifications (id, user_id, type, payload, created_at) VALUES ($1,$2,$3,$4::jsonb,$5)`,
      [row.id, row.userId, row.type, JSON.stringify(row.payload), row.createdAt],
    );
    return;
  }
  memInsert('notifications', row);
}

export async function writeAudit({ actorUserId, action, targetType, targetId, payload }) {
  const row = {
    id: newId('aud'),
    actorUserId: actorUserId || null,
    action,
    targetType: targetType || null,
    targetId: targetId || null,
    payload: payload || {},
    createdAt: nowIso(),
  };
  if (!isPostgres()) return memInsert('auditLog', row);
  await query(
    `INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, payload, created_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
    [row.id, row.actorUserId, row.action, row.targetType, row.targetId, JSON.stringify(row.payload), row.createdAt],
  );
  return row;
}

function buildLines(itemsIn, dishes) {
  const byId = Object.fromEntries(dishes.map((d) => [d.id, d]));
  const qtyByDish = new Map();
  for (const item of itemsIn) {
    const qty = Math.max(0, Math.round(Number(item.qty) || 0));
    if (!qty) throw new ApiError('empty');
    const dishId = item.dishId;
    if (!byId[dishId]) throw new ApiError('dish');
    qtyByDish.set(dishId, (qtyByDish.get(dishId) || 0) + qty);
  }
  const lines = [];
  let total = 0;
  for (const [dishId, qty] of qtyByDish) {
    const d = byId[dishId];
    if (!flag(d.availableTomorrow)) throw new ApiError('out');
    if (Number(d.leftover) < qty) throw new ApiError('leftover');
    lines.push({ dish: d, qty });
    total += Number(d.price) * qty;
  }
  return { lines, total };
}

async function createOrderMem({ user, itemsIn, guestName, guestPhone, deliveryType, slot, address, comment }) {
  const dishIds = [...new Set(itemsIn.map((i) => i.dishId))];
  const dishes = dishIds.map((id) => memFindById('dishes', id));
  if (dishes.some((d) => !d)) throw new ApiError('dish');
  const kitchenId = dishes[0].kitchenId;
  if (dishes.some((d) => d.kitchenId !== kitchenId)) throw new ApiError('mixed');
  const kitchen = memFindById('kitchens', kitchenId);
  const owner = kitchen ? memFindById('users', kitchen.ownerUserId) : null;
  if (!kitchenVisible(kitchen, owner)) throw new ApiError('hidden', 404);
  if (deliveryType === 'courier' && !flag(kitchen.deliveryCourier)) throw new ApiError('delivery');
  if (deliveryType === 'pickup' && !flag(kitchen.deliveryPickup)) throw new ApiError('delivery');
  const { lines, total } = buildLines(itemsIn, dishes);
  const country = memFindById('countries', kitchen.countryId);
  const order = {
    id: newOrderId(),
    buyerUserId: user.id,
    kitchenId,
    guestName,
    guestPhone,
    deliveryType,
    slot,
    address,
    comment,
    payMethod: 'cash',
    payStatus: 'unpaid',
    status: 'accepted',
    forDate: toISODate(orderDateForBaker(kitchen.cutoffHour)),
    total,
    currency: country?.currency || 'UZS',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  memInsert('orders', order);
  for (const line of lines) {
    memInsert('orderItems', {
      id: newId('item'),
      orderId: order.id,
      dishId: line.dish.id,
      name: line.dish.name,
      qty: line.qty,
      price: Number(line.dish.price),
    });
    memUpdate('dishes', line.dish.id, { leftover: Number(line.dish.leftover) - line.qty });
  }
  await writeEvent(null, {
    orderId: order.id,
    actorUserId: user.id,
    fromStatus: null,
    toStatus: 'accepted',
    source: 'buyer',
  });
  await writeNotification(null, {
    userId: kitchen.ownerUserId,
    type: 'order_new',
    payload: { orderId: order.id },
  });
  if (!user.phone && guestPhone) memUpdate('users', user.id, { phone: guestPhone });
  return order;
}

export async function createOrder(input) {
  if (!isPostgres()) return createOrderMem(input);
  const { user, itemsIn, guestName, guestPhone, deliveryType, slot, address, comment } = input;
  return withTransaction(async (q) => {
    const dishIds = [...new Set(itemsIn.map((i) => i.dishId))].sort();
    if (!dishIds.length) throw new ApiError('empty');
    const dishes = [];
    for (const id of dishIds) {
      const rows = await q('SELECT * FROM dishes WHERE id = $1 FOR UPDATE', [id]);
      if (!rows[0]) throw new ApiError('dish');
      dishes.push(rows[0]);
    }
    const kitchenId = dishes[0].kitchenId;
    if (dishes.some((d) => d.kitchenId !== kitchenId)) throw new ApiError('mixed');
    const kitchenRows = await q('SELECT * FROM kitchens WHERE id = $1 FOR UPDATE', [kitchenId]);
    const kitchen = kitchenRows[0];
    if (!kitchen) throw new ApiError('hidden', 404);
    const ownerRows = await q('SELECT * FROM users WHERE id = $1', [kitchen.ownerUserId]);
    if (!kitchenVisible(kitchen, ownerRows[0])) throw new ApiError('hidden', 404);
    if (deliveryType === 'courier' && !flag(kitchen.deliveryCourier)) throw new ApiError('delivery');
    if (deliveryType === 'pickup' && !flag(kitchen.deliveryPickup)) throw new ApiError('delivery');
    const { lines, total } = buildLines(itemsIn, dishes);
    const countryRows = await q('SELECT * FROM countries WHERE id = $1', [kitchen.countryId]);
    const createdAt = nowIso();
    const orderId = newOrderId();
    const orderRows = await q(
      `INSERT INTO orders (
        id, buyer_user_id, kitchen_id, guest_name, guest_phone, delivery_type, slot, address, comment,
        pay_method, pay_status, status, for_date, total, currency, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'cash','unpaid','accepted',$10,$11,$12,$13,$13)
      RETURNING *`,
      [
        orderId,
        user.id,
        kitchenId,
        guestName,
        guestPhone,
        deliveryType,
        slot,
        address,
        comment,
        toISODate(orderDateForBaker(kitchen.cutoffHour)),
        total,
        countryRows[0]?.currency || 'UZS',
        createdAt,
      ],
    );
    for (const line of lines) {
      await q(
        `INSERT INTO order_items (id, order_id, dish_id, name, qty, price) VALUES ($1,$2,$3,$4,$5,$6)`,
        [newId('item'), orderId, line.dish.id, line.dish.name, line.qty, Number(line.dish.price)],
      );
      const updated = await q(
        `UPDATE dishes SET leftover = leftover - $1, updated_at = $2 WHERE id = $3 AND leftover >= $1 RETURNING id`,
        [line.qty, createdAt, line.dish.id],
      );
      if (!updated[0]) throw new ApiError('leftover');
    }
    await writeEvent(q, {
      orderId,
      actorUserId: user.id,
      fromStatus: null,
      toStatus: 'accepted',
      source: 'buyer',
    });
    await writeNotification(q, {
      userId: kitchen.ownerUserId,
      type: 'order_new',
      payload: { orderId },
    });
    if (!user.phone && guestPhone) {
      await q('UPDATE users SET phone = $1, updated_at = $2 WHERE id = $3', [guestPhone, createdAt, user.id]);
    }
    return orderRows[0];
  });
}

async function restoreLeftover(q, orderId) {
  const items = q
    ? await q('SELECT * FROM order_items WHERE order_id = $1', [orderId])
    : memList('orderItems', (i) => i.orderId === orderId);
  for (const item of items) {
    if (q) {
      await q('UPDATE dishes SET leftover = leftover + $1, updated_at = $2 WHERE id = $3', [
        Number(item.qty) || 0,
        nowIso(),
        item.dishId,
      ]);
    } else {
      const dish = memFindById('dishes', item.dishId);
      if (dish) memUpdate('dishes', dish.id, { leftover: Number(dish.leftover) + (Number(item.qty) || 0) });
    }
  }
}

export async function updateOrderStatus(order, { status, actorUserId, source, force = false }) {
  if (!nextStatusAllowed(order.status, status, { force })) throw new ApiError('status');
  const fromStatus = order.status;
  const restore = status === 'cancelled' && fromStatus !== 'cancelled' && fromStatus !== 'delivered';

  if (!isPostgres()) {
    const next = memUpdate('orders', order.id, { status, updatedAt: nowIso() });
    if (restore) await restoreLeftover(null, order.id);
    await writeEvent(null, { orderId: order.id, actorUserId, fromStatus, toStatus: status, source });
    await writeNotification(null, {
      userId: order.buyerUserId,
      type: 'order_status',
      payload: { orderId: order.id, status },
    });
    return next;
  }

  return withTransaction(async (q) => {
    const locked = (await q('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [order.id]))[0];
    if (!locked) throw new ApiError('not_found', 404);
    if (!nextStatusAllowed(locked.status, status, { force })) throw new ApiError('status');
    const shouldRestore = status === 'cancelled' && locked.status !== 'cancelled' && locked.status !== 'delivered';
    const rows = await q('UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *', [
      status,
      nowIso(),
      order.id,
    ]);
    if (shouldRestore) await restoreLeftover(q, order.id);
    await writeEvent(q, {
      orderId: order.id,
      actorUserId,
      fromStatus: locked.status,
      toStatus: status,
      source,
    });
    await writeNotification(q, {
      userId: locked.buyerUserId,
      type: 'order_status',
      payload: { orderId: order.id, status },
    });
    return rows[0];
  });
}

export async function insertTicket(row) {
  return insertRow('tickets', row);
}

export async function listTickets() {
  if (!isPostgres()) {
    return memList('tickets').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  return query('SELECT * FROM tickets ORDER BY created_at DESC');
}

export async function findTicketById(id) {
  if (!isPostgres()) return memFindById('tickets', id);
  const rows = await query('SELECT * FROM tickets WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function updateTicket(id, patch) {
  return updateRow('tickets', id, { ...patch, updatedAt: nowIso() });
}

export { publicDish, newId, randomUUID };
