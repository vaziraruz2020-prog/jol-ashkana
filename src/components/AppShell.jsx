import { geoName } from '../copy/index.js';
import { cartQty } from '../lib/format.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';

function Logo({ onClick }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-extrabold text-white shadow-pop">
        JA
      </span>
      <span className="text-base font-extrabold tracking-tight">{t('brand')}</span>
    </button>
  );
}

function isNoisyHealthHint(hint) {
  return /duplicate key|users_pkey|users_email/i.test(String(hint || ''));
}

export default function AppShell({ route, hideNav, children }) {
  const app = useApp();
  const t = useT();
  const qty = cartQty(app.cart);
  const city = app.geo.cities.find((c) => c.id === app.cityId);
  const role = app.user?.isSupport ? 'support' : app.user?.activeRole || 'buyer';
  const healthDown =
    app.health && app.health.ok === false && !isNoisyHealthHint(app.health.hint);
  const healthText = t('healthBanner').replace('{hint}', app.health?.hint || t('dbError'));

  const tabs = [
    { id: 'home', label: t('navHome'), hash: '#/', icon: '⌂' },
    { id: 'catalog', label: t('navDistrict'), hash: '#/catalog', icon: '◎' },
    { id: 'cart', label: t('navCart'), hash: '#/cart', icon: '◉' },
    { id: 'orders', label: t('navOrders'), hash: '#/orders', icon: '☰' },
    {
      id: 'last',
      label: role === 'support' ? t('iAmSupport') : role === 'baker' ? t('navBaker') : t('navAccount'),
      hash: role === 'support' ? '#/admin' : role === 'baker' ? '#/cabinet' : '#/account',
      icon: '♨',
    },
  ];

  const active =
    route.name === 'landing' || route.name === 'login' || route.name === 'register'
      ? 'home'
      : route.name === 'cabinet' || route.name === 'account' || route.name === 'admin'
        ? 'last'
        : route.name === 'cart' || route.name === 'checkout'
          ? 'cart'
          : route.name === 'orders' || route.name === 'order'
            ? 'orders'
            : 'catalog';

  return (
    <div className="mx-auto min-h-dvh max-w-app">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Logo onClick={() => go('#/')} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => app.setLocale(app.locale === 'ru' ? 'en' : 'ru')}
              className="min-h-11 rounded-full border border-line bg-white px-3 text-xs font-bold"
            >
              {app.locale === 'ru' ? 'EN' : 'RU'}
            </button>
            {city && (
              <button
                type="button"
                onClick={() => go('#/catalog')}
                className="hidden min-h-11 rounded-full border border-line bg-white px-3 text-xs font-bold sm:inline-flex sm:items-center"
              >
                {geoName(city, app.locale)}
              </button>
            )}
            {app.user ? (
              <button
                type="button"
                onClick={async () => {
                  if (app.user.isSupport) {
                    go('#/admin');
                    return;
                  }
                  const next = app.user.activeRole === 'baker' ? 'buyer' : 'baker';
                  await app.switchRole(next);
                  go(next === 'baker' ? '#/cabinet' : '#/catalog');
                }}
                className="min-h-11 rounded-full bg-ink px-3 text-xs font-bold text-white"
              >
                {app.user.activeRole === 'baker' ? t('iAmBuyer') : t('iAmBaker')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go('#/login')}
                className="min-h-11 rounded-full bg-ink px-3 text-xs font-bold text-white"
              >
                {t('ctaLogin')}
              </button>
            )}
          </div>
        </div>
      </header>

      {healthDown && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{healthText}</div>
        </div>
      )}

      <main className={hideNav ? 'px-4 pb-10 pt-4' : 'px-4 pb-28 pt-4'}>{children}</main>

      {!hideNav && (
        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto grid max-w-app grid-cols-5 px-1 pt-1">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => go(tab.hash)}
                  className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                    isActive ? 'text-primary' : 'text-mute'
                  }`}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'cart' && qty > 0 && (
                    <span className="absolute right-3 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">
                      {qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
