import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../copy/index.js';
import { api, fetchHealth } from '../lib/api.js';

const CART_KEY = 'jol-ashkana-cart-v2';
const LOCALE_KEY = 'jol-ashkana-locale';
const GEO_KEY = 'jol-ashkana-geo';

const AppContext = createContext(null);

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.dishId && i.qty > 0) : [];
  } catch {
    return [];
  }
}

function loadGeoSel() {
  try {
    return JSON.parse(localStorage.getItem(GEO_KEY) || '{}');
  } catch {
    return {};
  }
}

function cartLine(dish, kitchenMeta, qty = 1) {
  return {
    dishId: dish.id,
    kitchenId: dish.kitchenId,
    name: dish.name,
    price: dish.price,
    unit: dish.unit,
    emoji: dish.emoji,
    photoUrl: dish.photoUrl || '',
    leftover: dish.leftover,
    qty,
    currency: kitchenMeta?.currency,
  };
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [kitchen, setKitchen] = useState(null);
  const [geo, setGeo] = useState({ countries: [], cities: [], districts: [], slots: [] });
  const [health, setHealth] = useState(null);
  const [locale, setLocaleState] = useState(() => localStorage.getItem(LOCALE_KEY) || 'ru');
  const [countryId, setCountryId] = useState(() => loadGeoSel().countryId || 'uz');
  const [cityId, setCityId] = useState(() => loadGeoSel().cityId || null);
  const [districtId, setDistrictId] = useState(() => loadGeoSel().districtId || null);
  const [cart, setCart] = useState(loadCart);
  const [toast, setToast] = useState(null);

  function notify(message) {
    setToast(message);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2200);
  }

  function applySession(data) {
    setUser(data?.user || null);
    setKitchen(data?.kitchen || null);
    if (data?.user?.locale) setLocaleState(data.user.locale);
    if (data?.user?.countryId) setCountryId(data.user.countryId);
    if (data?.user?.cityId) setCityId(data.user.cityId);
    if (data?.user?.districtId) setDistrictId(data.user.districtId);
  }

  async function refreshMe() {
    try {
      const data = await api('/me');
      applySession(data);
      return data;
    } catch {
      setUser(null);
      setKitchen(null);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await fetchHealth();
      if (!cancelled) setHealth(h);
      try {
        const g = await api('/geo');
        if (!cancelled) setGeo(g);
      } catch {
        /* API down */
      }
      if (!cancelled) await refreshMe();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale === 'en' ? 'en' : 'ru';
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(GEO_KEY, JSON.stringify({ countryId, cityId, districtId }));
  }, [countryId, cityId, districtId]);

  const value = useMemo(() => {
    function setLocale(next) {
      setLocaleState(next);
      if (user) api('/me', { method: 'PATCH', body: { locale: next } }).catch(() => {});
    }

    function setGeoSel({ country, city, district }) {
      if (country) {
        setCountryId(country);
        const cities = geo.cities.filter((c) => c.countryId === country);
        const nextCity = cities.find((c) => c.id === cityId)?.id || cities[0]?.id || null;
        setCityId(nextCity);
        const districts = geo.districts.filter((d) => d.cityId === nextCity);
        setDistrictId(districts.find((d) => d.id === districtId)?.id || districts[0]?.id || null);
        return;
      }
      if (city) {
        setCityId(city);
        const districts = geo.districts.filter((d) => d.cityId === city);
        setDistrictId(districts[0]?.id || null);
        const c = geo.cities.find((x) => x.id === city);
        if (c) setCountryId(c.countryId);
        return;
      }
      if (district) {
        setDistrictId(district);
        const d = geo.districts.find((x) => x.id === district);
        if (d) {
          setCityId(d.cityId);
          const c = geo.cities.find((x) => x.id === d.cityId);
          if (c) setCountryId(c.countryId);
        }
      }
    }

    function addToCart(dish, kitchenMeta) {
      if (!dish.availableTomorrow || dish.leftover <= 0) return { ok: false, error: 'out' };
      const other = cart.find((i) => i.kitchenId !== dish.kitchenId);
      if (other) return { ok: false, error: 'other-baker', kitchenId: dish.kitchenId };
      const existing = cart.find((i) => i.dishId === dish.id);
      const nextQty = (existing?.qty || 0) + 1;
      if (nextQty > dish.leftover) return { ok: false, error: 'leftover' };
      setCart(
        existing
          ? cart.map((i) => (i.dishId === dish.id ? { ...i, qty: nextQty, photoUrl: dish.photoUrl || i.photoUrl } : i))
          : [...cart, cartLine(dish, kitchenMeta, 1)],
      );
      return { ok: true };
    }

    function replaceCartAndAdd(dish, kitchenMeta) {
      setCart([cartLine(dish, kitchenMeta, 1)]);
      return { ok: true };
    }

    function setQty(dishId, qty) {
      const item = cart.find((i) => i.dishId === dishId);
      const nextQty = Math.max(0, Math.min(qty, item?.leftover ?? qty));
      setCart(
        nextQty === 0
          ? cart.filter((i) => i.dishId !== dishId)
          : cart.map((i) => (i.dishId === dishId ? { ...i, qty: nextQty } : i)),
      );
    }

    function clearCart() {
      setCart([]);
    }

    async function switchRole(activeRole) {
      const data = await api('/me', { method: 'PATCH', body: { activeRole } });
      applySession(data);
      return data;
    }

    async function logout() {
      try {
        await api('/logout', { method: 'POST', body: {} });
      } catch {
        /* ignore */
      }
      setUser(null);
      setKitchen(null);
    }

    return {
      ready,
      user,
      kitchen,
      geo,
      health,
      locale,
      countryId,
      cityId,
      districtId,
      cart,
      toast,
      notify,
      setLocale,
      setGeoSel,
      addToCart,
      replaceCartAndAdd,
      setQty,
      clearCart,
      applySession,
      refreshMe,
      switchRole,
      logout,
      setKitchen,
    };
  }, [ready, user, kitchen, geo, health, locale, countryId, cityId, districtId, cart, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

export function useT() {
  const { locale } = useApp();
  return (key) => translate(locale, key);
}
