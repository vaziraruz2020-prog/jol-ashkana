import { randomBytes, randomUUID } from 'crypto';

export function flag(v) {
  return v === true || v === 1 || v === '1' || v === 't' || v === 'true';
}

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateOnly(v) {
  if (!v) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return s.slice(0, 10);
}

export function orderDateForBaker(cutoffHour) {
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 1);
  if (new Date().getHours() >= (Number(cutoffHour) || 18)) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function newId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

export function newOrderId() {
  return `JA-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function kitchenVisible(k, owner) {
  if (!k) return false;
  if (flag(k.hidden)) return false;
  if (k.verificationStatus !== 'verified') return false;
  if (owner && flag(owner.blocked)) return false;
  return true;
}

export const STATUS_FLOW = ['accepted', 'baking', 'ready', 'delivered'];

export function nextStatusAllowed(from, to, { force = false } = {}) {
  if (to === from) return true;
  if (to === 'cancelled' && from !== 'delivered' && from !== 'cancelled') return true;
  if (force && to === 'cancelled') return true;
  const i = STATUS_FLOW.indexOf(from);
  return i >= 0 && STATUS_FLOW[i + 1] === to;
}
