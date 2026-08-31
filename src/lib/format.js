const labels = {
  UZS: { ru: 'сум', en: 'som' },
  KZT: { ru: '₸', en: '₸' },
  KGS: { ru: 'сом', en: 'som' },
  TJS: { ru: 'сомони', en: 'somoni' },
  TMT: { ru: 'манат', en: 'manat' },
  AMD: { ru: '֏', en: '֏' },
  AZN: { ru: '₼', en: '₼' },
  BYN: { ru: 'Br', en: 'Br' },
  MDL: { ru: 'лей', en: 'lei' },
  RUB: { ru: '₽', en: '₽' },
};

export function formatMoney(amount, currency = 'UZS', locale = 'ru') {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU').format(n);
  const tag = labels[currency]?.[locale] || currency;
  return `${formatted} ${tag}`;
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidPhone(value) {
  return digitsOnly(value).length >= 9;
}

export function cartQty(cart) {
  return (cart || []).reduce((sum, item) => sum + (item.qty || 0), 0);
}

export function cartTotal(cart) {
  return (cart || []).reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
}
