import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatMoney, cartTotal } from '../lib/format.js';
import { kitchenBlockReason } from '../lib/kitchen-status.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, EmptyState } from '../components/ui.jsx';

export default function Cart() {
  const t = useT();
  const app = useApp();
  const [block, setBlock] = useState(null);
  const currency = app.cart[0]?.currency || app.geo.countries.find((c) => c.id === app.countryId)?.currency || 'UZS';
  const kitchenId = app.cart[0]?.kitchenId;

  useEffect(() => {
    if (!kitchenId) {
      setBlock(null);
      return;
    }
    let cancelled = false;
    api(`/kitchens/${kitchenId}`)
      .then((d) => {
        if (!cancelled) setBlock(kitchenBlockReason(d.kitchen, undefined, app.user));
      })
      .catch((err) => {
        if (!cancelled) setBlock(kitchenBlockReason(null, err.data?.error, app.user));
      });
    return () => {
      cancelled = true;
    };
  }, [kitchenId, app.user]);

  if (!app.cart.length) {
    return <EmptyState title={t('cartEmpty')} action={t('ctaDistrict')} onAction={() => go('#/catalog')} />;
  }

  const blocked = block === 'rejected' || block === 'hidden' || block === 'own_kitchen';

  function blockTitle() {
    if (block === 'rejected') return t('cartKitchenRejected');
    if (block === 'own_kitchen') return t('cartOwnKitchen');
    return t('cartKitchenHidden');
  }

  function blockHint() {
    if (block === 'rejected') return t('cartKitchenRejectedHint');
    if (block === 'own_kitchen') return t('cartOwnKitchenHint');
    return t('cartKitchenHiddenHint');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('navCart')}</h1>
      {blocked && (
        <div className="rounded-cut bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <p>{blockTitle()}</p>
          <p className="mt-1 font-medium text-red-600">{blockHint()}</p>
        </div>
      )}
      {app.cart.map((item) => (
        <div key={item.dishId} className="card-cut hover-lift flex items-center gap-3 bg-white p-3">
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
      {blocked ? (
        <Button
          onClick={() => {
            app.clearCart();
            go('#/catalog');
          }}
        >
          {t('cartClear')}
        </Button>
      ) : (
        <>
          <p className="text-sm text-mute">{t('payCash')}</p>
          <Button onClick={() => go(app.user ? '#/checkout' : '#/login')}>{t('checkout')}</Button>
        </>
      )}
    </div>
  );
}
