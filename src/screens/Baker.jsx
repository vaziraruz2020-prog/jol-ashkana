import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { isPastCutoff, orderDateLabel } from '../lib/dates.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, EmptyState, FoodTile, Modal, Reveal } from '../components/ui.jsx';
import ReportForm from '../components/ReportForm.jsx';

function DishCard({ dish, kitchen, currency, locale, t, onAdd, compact }) {
  const out = !dish.availableTomorrow || dish.leftover <= 0;
  return (
    <div className={`flex gap-3 rounded-3xl bg-white p-4 shadow-card ${compact ? 'h-full' : ''}`}>
      <FoodTile emoji={dish.emoji} accent={kitchen.accent} className="h-14 w-14 shrink-0 text-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{dish.name}</p>
        <p className="text-sm text-mute">{dish.ingredients}</p>
        <p className="mt-1 text-sm font-bold">
          {formatMoney(dish.price, currency, locale)} / {dish.unit}
        </p>
        {dish.leftover <= 3 && dish.leftover > 0 && (
          <p className="text-xs font-bold text-primary">{t('leftoverFew')}</p>
        )}
        {out && <p className="text-xs font-bold text-mute">{t('leftoverOut')}</p>}
      </div>
      <button
        type="button"
        disabled={out}
        onClick={() => onAdd(dish)}
        className="h-11 shrink-0 self-center rounded-full bg-primary px-4 text-sm font-bold text-white disabled:bg-line disabled:text-mute"
      >
        +
      </button>
    </div>
  );
}

export default function Baker({ id }) {
  const t = useT();
  const app = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [replaceDish, setReplaceDish] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api(`/kitchens/${id}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.data?.error || 'hidden');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error === 'hidden' || error === 'not_found') {
    return <EmptyState title={t('kitchenHidden')} action={t('navDistrict')} onAction={() => go('#/catalog')} />;
  }
  if (!data) return <p className="text-mute">…</p>;

  const k = data.kitchen;
  const country = app.geo.countries.find((c) => c.id === k.countryId);
  const currency = country?.currency || 'UZS';
  const late = isPastCutoff(k.cutoffHour);
  const available = (data.dishes || []).filter((d) => d.availableTomorrow && d.leftover > 0);

  function add(dish) {
    const result = app.addToCart(dish, { currency });
    if (result.error === 'other-baker') {
      setReplaceDish(dish);
      return;
    }
    if (result.ok) app.notify(t('added'));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex gap-3">
          <FoodTile emoji={k.emoji} accent={k.accent} className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-extrabold">{k.name}</h1>
            <p className="text-sm text-mute">{k.bio}</p>
            <p className="mt-1 text-sm">{k.address}</p>
            <p className="mt-1 text-xs text-mute">
              {late
                ? t('cutoffLate').replace('{hour}', String(k.cutoffHour))
                : t('cutoffOk').replace('{hour}', String(k.cutoffHour))}
              {' · '}
              {orderDateLabel(k.cutoffHour, app.locale, t)}
            </p>
          </div>
        </div>
        {app.user && (
          <button type="button" className="mt-3 text-sm font-bold text-red-600" onClick={() => setReportOpen(true)}>
            {t('report')}
          </button>
        )}
      </div>

      {available.length > 3 && (
        <div className="snap-strip no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {available.map((dish) => (
            <div key={`snap-${dish.id}`} className="w-[78%] shrink-0 sm:w-[260px]">
              <DishCard
                dish={dish}
                kitchen={k}
                currency={currency}
                locale={app.locale}
                t={t}
                onAdd={add}
                compact
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {data.dishes.map((dish, i) => (
          <Reveal key={dish.id} delay={i * 50}>
            <DishCard dish={dish} kitchen={k} currency={currency} locale={app.locale} t={t} onAdd={add} />
          </Reveal>
        ))}
      </div>

      <Modal open={Boolean(replaceDish)} title={t('cartOtherBaker')} onClose={() => setReplaceDish(null)}>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => setReplaceDish(null)}>
            {t('keep')}
          </Button>
          <Button
            onClick={() => {
              app.replaceCartAndAdd(replaceDish, { currency });
              setReplaceDish(null);
              app.notify(t('added'));
            }}
          >
            {t('replace')}
          </Button>
        </div>
      </Modal>

      <ReportForm
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="kitchen"
        targetId={k.id}
      />
    </div>
  );
}
