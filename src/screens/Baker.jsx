import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';
import { isPastCutoff, orderDateLabel } from '../lib/dates.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, EmptyState, FoodStage, Modal, Reveal } from '../components/ui.jsx';
import ReportForm from '../components/ReportForm.jsx';

function DishPlate({ dish, kitchen, currency, locale, t, onAdd }) {
  const out = !dish.availableTomorrow || dish.leftover <= 0;
  return (
    <article className={`card-cut hover-lift hover-cut group ${out ? 'opacity-70' : ''}`}>
      <FoodStage
        photoUrl={dish.photoUrl}
        emoji={dish.emoji || '🥟'}
        accent={kitchen.accent}
        ratio="plate"
        dim={out}
      />
      <div className="bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold tracking-tight">{dish.name}</h3>
          <p className="shrink-0 text-sm font-extrabold">
            {formatMoney(dish.price, currency, locale)}
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-mute">/ {dish.unit}</span>
          </p>
        </div>
        {dish.ingredients ? (
          <p className="mt-1 text-sm tracking-wide text-mute">{dish.ingredients}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">
            {out ? t('leftoverOut') : dish.leftover <= 3 ? t('leftoverFew') : `${t('leftover')}: ${dish.leftover}`}
          </p>
          <button
            type="button"
            disabled={out}
            onClick={() => onAdd(dish)}
            className="h-11 min-w-11 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-pop transition duration-200 hover:bg-primary-dark disabled:bg-line disabled:text-mute disabled:shadow-none active:scale-[0.99]"
          >
            {t('addToCart')}
          </button>
        </div>
      </div>
    </article>
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
      <div className="card-cut overflow-hidden">
        <FoodStage photoUrl={k.photoUrl} emoji={k.emoji || '🥐'} accent={k.accent} ratio="poster" />
        <div className="bg-white p-5">
          <h1 className="text-2xl font-extrabold tracking-tight">{k.name}</h1>
          {k.bio ? <p className="mt-1 text-sm tracking-wide text-mute">{k.bio}</p> : null}
          <p className="mt-2 text-sm">{k.address}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
            {late
              ? t('cutoffLate').replace('{hour}', String(k.cutoffHour))
              : t('cutoffOk').replace('{hour}', String(k.cutoffHour))}
            {' · '}
            {orderDateLabel(k.cutoffHour, app.locale, t)}
          </p>
          {app.user && (
            <button
              type="button"
              className="mt-3 text-sm font-bold text-red-600 transition hover:text-red-700"
              onClick={() => setReportOpen(true)}
            >
              {t('report')}
            </button>
          )}
        </div>
      </div>

      {available.length >= 3 && (
        <div className="-mx-4">
          <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.18em] text-mute">{t('availableStrip')}</p>
          <div className="snap-strip no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
            {available.map((dish) => (
              <button
                key={`av-${dish.id}`}
                type="button"
                onClick={() => add(dish)}
                className="w-[min(68%,220px)] shrink-0 overflow-hidden rounded-cut bg-white text-left shadow-card transition duration-200 hover:shadow-lift active:scale-[0.99]"
              >
                <FoodStage
                  photoUrl={dish.photoUrl}
                  emoji={dish.emoji || '🥟'}
                  accent={k.accent}
                  ratio="plate"
                  className="h-28"
                />
                <div className="px-3 py-2">
                  <p className="truncate font-extrabold tracking-tight">{dish.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-mute">
                    {formatMoney(dish.price, currency, app.locale)}
                    {dish.leftover <= 3 ? ` · ${t('leftoverFew')}` : ''}
                  </p>
                </div>
              </button>
            ))}
            <div className="w-3 shrink-0" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data.dishes.map((dish, i) => (
          <Reveal key={dish.id} delay={i * 40}>
            <DishPlate dish={dish} kitchen={k} currency={currency} locale={app.locale} t={t} onAdd={add} />
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
