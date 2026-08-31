import { ru } from './ru.js';
import { en } from './en.js';

export const dictionaries = { ru, en };
export const statusOrder = ['accepted', 'baking', 'ready', 'delivered'];

export function translate(locale, key) {
  const dict = dictionaries[locale] || ru;
  if (key.includes('.')) {
    return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict) ?? key;
  }
  return dict[key] ?? key;
}

export function geoName(item, locale) {
  if (!item) return '';
  return locale === 'en' ? item.nameEn || item.nameRu : item.nameRu || item.nameEn;
}
