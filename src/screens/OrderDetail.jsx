import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { formatDate } from '../lib/dates.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { EmptyState, StatusStepper } from '../components/ui.jsx';
import ReportForm from '../components/ReportForm.jsx';

export default function OrderDetail({ id }) {
  const t = useT();
  const app = useApp();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!app.user) {
      go('#/login');
      return;
    }
    api(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setMissing(true));
  }, [id, app.user]);

  if (!app.user) return null;
  if (missing) return <EmptyState title={t('adminNoOrders')} action={t('navOrders')} onAction={() => go('#/orders')} />;
  if (!order) return <p className="text-mute">…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{order.id}</h1>
      <p className="text-mute">{order.kitchen?.name} · {formatDate(order.forDate, app.locale)}</p>
      {order.status === 'cancelled' ? (
        <p className="font-bold text-red-600">{t('status.cancelled')}</p>
      ) : (
        <StatusStepper status={order.status} />
      )}
      <div className="rounded-3xl bg-white p-4 shadow-card">
        {(order.items || []).map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>{formatMoney(item.price * item.qty, order.currency, app.locale)}</span>
          </div>
        ))}
        <p className="mt-2 font-extrabold">
          {t('total')}: {formatMoney(order.total, order.currency, app.locale)}
        </p>
        <p className="mt-2 text-sm text-mute">{t('payCash')}</p>
        <p className="mt-2 text-sm">
          {order.deliveryType === 'courier' ? t('courier') : t('pickup')} · {order.slot}
        </p>
        <p className="text-sm">{order.address}</p>
      </div>
      <button type="button" className="font-bold text-red-600" onClick={() => setReportOpen(true)}>
        {t('report')}
      </button>
      <ReportForm open={reportOpen} onClose={() => setReportOpen(false)} targetType="order" targetId={order.id} />
    </div>
  );
}
