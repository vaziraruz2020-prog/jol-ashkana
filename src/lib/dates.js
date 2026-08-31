const monthsRu = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const monthsEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(date, locale = 'ru') {
  const d = date instanceof Date ? date : parseISODate(date);
  if (locale === 'en') return `${monthsEn[d.getMonth()]} ${d.getDate()}`;
  return `${d.getDate()} ${monthsRu[d.getMonth()]}`;
}

export function isPastCutoff(cutoffHour) {
  return new Date().getHours() >= cutoffHour;
}

export function orderDateForBaker(cutoffHour) {
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 1);
  if (isPastCutoff(cutoffHour)) target.setDate(target.getDate() + 1);
  return target;
}

export function orderDateLabel(cutoffHour, locale, t) {
  const d = orderDateForBaker(cutoffHour);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const prefix = toISODate(d) === toISODate(tomorrow) ? t('tomorrow') : t('dayAfter');
  return `${prefix}, ${formatDate(d, locale)}`;
}
