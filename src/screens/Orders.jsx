import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { formatDate } from '../lib/dates.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { EmptyState, StatusChip } from '../components/ui.jsx';

export default function Orders() {
  const t = useT();
  const app = useApp();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!app.user) {
      go('#/login');
      return;
    }
    api('/orders')
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]));
  }, [app.user]);

  if (!app.user) return null;
  if (!orders.length) {
    return <EmptyState title={t('myOrdersEmpty')} action={t('ctaDistrict')} onAction={() => go('#/catalog')} />;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">{t('navOrders')}</h1>
      <p className="text-sm text-mute">{t('trackHint')}</p>
      {orders.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => go(`#/orders/${o.id}`)}
          className="w-full rounded-3xl bg-white p-4 text-left shadow-card"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold">{o.kitchen?.name || o.id}</p>
            <StatusChip status={o.status} />
          </div>
          <p className="mt-1 text-sm text-mute">
            {o.id} · {formatDate(o.forDate, app.locale)} · {formatMoney(o.total, o.currency, app.locale)}
          </p>
        </button>
      ))}
    </div>
  );
}
