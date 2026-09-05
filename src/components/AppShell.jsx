import { cartCount } from '../lib/format.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';

function LogoMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-cut bg-primary text-sm font-extrabold text-white shadow-pop transition duration-200 group-hover:rotate-6 group-hover:bg-primary-dark">
      JA
    </span>
  );
}

export default function AppShell({ children, route, hideNav }) {
  const t = useT();
  const { user, locale, setLocale, cart, health } = useApp();
  const count = cartCount(cart);
  const isBaker = user?.activeRole === 'baker';
  const isSupport = Boolean(user?.isSupport);

  const tabs = [
    { id: 'home', hash: '#/', label: t('navHome'), icon: '⌂', match: ['landing'] },
    { id: 'district', hash: '#/catalog', label: t('navDistrict'), icon: '◎', match: ['catalog', 'baker'] },
    { id: 'cart', hash: '#/cart', label: t('navCart'), icon: '◉', match: ['cart', 'checkout'] },
    { id: 'orders', hash: '#/orders', label: t('navOrders'), icon: '☰', match: ['orders', 'order'] },
  ];
  if (isBaker) tabs.push({ id: 'baker', hash: '#/cabinet', label: t('navBaker'), icon: '♨', match: ['cabinet'] });
  if (isSupport) tabs.push({ id: 'admin', hash: '#/admin', label: t('iAmSupport'), icon: '✦', match: ['admin'] });
  tabs.push({ id: 'account', hash: user ? '#/account' : '#/login', label: t('navAccount'), icon: '●', match: ['account', 'login', 'register'] });

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-app items-center justify-between gap-3 px-4 py-3">
          <button type="button" className="group flex min-w-0 items-center gap-2" onClick={() => go('#/')}>
            <LogoMark />
            <span className="truncate font-extrabold tracking-tight transition group-hover:text-primary">{t('brand')}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1 text-xs font-bold transition duration-200 hover:border-primary hover:bg-primary-soft/70"
              onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
            >
              {locale === 'ru' ? 'EN' : 'RU'}
            </button>
            {user ? (
              <button
                type="button"
                className="max-w-[42vw] truncate rounded-full bg-white px-3 py-1 text-xs font-bold transition duration-200 hover:bg-primary-soft"
                onClick={() => go('#/account')}
              >
                {user.name}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white transition duration-200 hover:bg-primary"
                onClick={() => go('#/login')}
              >
                {t('ctaLogin')}
              </button>
            )}
          </div>
        </div>
      </header>
      {health && health.ok === false && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
          {t('healthBanner').replace('{hint}', health.hint || '')}
        </div>
      )}
      <main className={`mx-auto max-w-app px-4 py-4 ${hideNav ? 'pb-8' : 'pb-28'}`}>{children}</main>
      {!hideNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto grid max-w-app" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => {
              const active = tab.match.includes(route.name);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => go(tab.hash)}
                  className={`relative flex min-h-[64px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition duration-200 hover:-translate-y-0.5 ${
                    active ? 'text-primary' : 'text-mute hover:text-ink'
                  }`}
                >
                  <span className={`text-lg leading-none transition duration-200 ${active ? 'scale-110' : 'hover:scale-110'}`}>
                    {tab.icon}
                  </span>
                  <span className="max-w-full truncate">{tab.label}</span>
                  {tab.id === 'cart' && count > 0 && (
                    <span className="absolute right-2 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">
                      {count}
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
