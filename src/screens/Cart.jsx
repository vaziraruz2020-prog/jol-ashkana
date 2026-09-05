import { formatMoney, cartTotal } from '../lib/format.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, EmptyState, FoodStage } from '../components/ui.jsx';

export default function Cart() {
  const t = useT();
  const app = useApp();
  const currency = app.cart[0]?.currency || app.geo.countries.find((c) => c.id === app.countryId)?.currency || 'UZS';

  if (!app.cart.length) {
    return <EmptyState title={t('cartEmpty')} action={t('ctaDistrict')} onAction={() => go('#/catalog')} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('navCart')}</h1>
      {app.cart.map((item) => (
        <div key={item.dishId} className="card-cut hover-lift flex items-center gap-3 bg-white p-3">
          <FoodStage photoUrl={item.photoUrl} emoji={item.emoji || '🥟'} ratio="thumb" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold tracking-tight">{item.name}</p>
            <p className="text-sm text-mute">{formatMoney(item.price, currency, app.locale)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-cut border border-line transition hover:border-primary hover:bg-primary-soft/50"
              onClick={() => app.setQty(item.dishId, item.qty - 1)}
            >
              −
            </button>
            <span className="w-6 text-center font-bold">{item.qty}</span>
            <button
              type="button"
              className="h-11 w-11 rounded-cut border border-line transition hover:border-primary hover:bg-primary-soft/50"
              onClick={() => app.setQty(item.dishId, item.qty + 1)}
            >
              +
            </button>
          </div>
        </div>
      ))}
      <p className="text-lg font-extrabold">
        {t('total')}: {formatMoney(cartTotal(app.cart), currency, app.locale)}
      </p>
      <p className="text-sm text-mute">{t('payCash')}</p>
      <Button onClick={() => go(app.user ? '#/checkout' : '#/login')}>{t('checkout')}</Button>
    </div>
  );
}
