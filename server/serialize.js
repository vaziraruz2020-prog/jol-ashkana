import { dateOnly, flag } from './util.js';

export function publicUser(u) {
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

export function publicKitchen(k, { includePrivate = false } = {}) {
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

export function publicDish(d) {
  if (!d) return null;
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

export function publicOrder(order, { items = [], kitchen = null } = {}) {
  if (!order) return null;
  return {
    ...order,
    forDate: dateOnly(order.forDate),
    payMethod: order.payMethod || 'cash',
    payStatus: order.payStatus || 'unpaid',
    total: Number(order.total) || 0,
    items,
    kitchen: kitchen ? publicKitchen(kitchen) : null,
  };
}
