import { useEffect, useState } from 'react';

export function parseHash(hash) {
  const path = (hash || '#/').replace(/^#/, '');
  const segs = path.split('/').filter(Boolean);
  if (segs.length === 0) return { name: 'landing' };
  const [a, b] = segs;
  if (a === 'catalog') return { name: 'catalog' };
  if (a === 'baker' && b) return { name: 'baker', id: decodeURIComponent(b) };
  if (a === 'cart') return { name: 'cart' };
  if (a === 'checkout') return { name: 'checkout' };
  if (a === 'orders' && b) return { name: 'order', id: decodeURIComponent(b) };
  if (a === 'orders') return { name: 'orders' };
  if (a === 'cabinet' && b === 'menu') return { name: 'cabinet', tab: 'menu' };
  if (a === 'cabinet' && b === 'kitchen') return { name: 'cabinet', tab: 'kitchen' };
  if (a === 'cabinet') return { name: 'cabinet', tab: 'orders' };
  if (a === 'admin') return { name: 'admin' };
  if (a === 'login') return { name: 'login' };
  if (a === 'register') return { name: 'register' };
  if (a === 'account') return { name: 'account' };
  return { name: 'landing' };
}

export function go(to) {
  const hash = to.startsWith('#') ? to : `#${to}`;
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = hash;
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#/';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}
