import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/poll.js';
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
    if (!app.user) go('#/login');
  }, [app.user]);

  usePoll(
    async () => {
      if (!app.user || !id) return;
      try {
        const d = await api(`/orders/${id}`);
        setOrder(d.order);
        setMissing(false);
      } catch {
        setMissing(true);
      }
    },
    { enabled: Boolean(app.user && id), interval: 5000 },
  );

  if (!app.user) return null;
  if (missing) return <EmptyState title={t('adminNoOrders')} action={t('navOrders')} onAction={() => go('#/orders')} />;
  if (!order) return <p className="text-mute">…</p>;

  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);

  return (
    <div className="space-y-4">
      <section className="hero-warm rounded-[28px] p-5 shadow-card">
        <p className="text-sm font-bold text-primary">{order.kitchen?.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{formatDate(order.forDate, app.locale)}</h1>
        <p className="mt-1 text-sm text-mute">
          {order.deliveryType === 'courier' ? t('courier') : t('pickup')} · {order.slot}
        </p>
        <p className="mt-2 text-xs text-mute">{order.id}</p>
      </section>

      {order.status === 'cancelled' ? (
        <p className="font-bold text-red-600">{t('status.cancelled')}</p>
      ) : (
        <StatusStepper status={order.status} />
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="text-xl font-extrabold">{itemCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('qty')}</p>
        </div>
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="truncate text-lg font-extrabold">{formatMoney(order.total, order.currency, app.locale)}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('total')}</p>
        </div>
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="truncate text-lg font-extrabold">{order.slot}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('slot')}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-bold">{t('yourOrder')}</p>
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
        <p className="mt-2 text-sm">{order.address}</p>
      </div>
      <button type="button" className="font-bold text-red-600" onClick={() => setReportOpen(true)}>
        {t('report')}
      </button>
      <ReportForm open={reportOpen} onClose={() => setReportOpen(false)} targetType="order" targetId={order.id} />
    </div>
  );
}
