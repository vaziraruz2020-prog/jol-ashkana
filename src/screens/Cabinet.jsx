import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/poll.js';
import { geoName, statusOrder } from '../copy/index.js';
import { formatMoney } from '../lib/format.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Chip, ChipRow, EmptyState, Field, Reveal, StatusChip, inputClass } from '../components/ui.jsx';

export default function Cabinet({ tab = 'orders' }) {
  const t = useT();
  const app = useApp();
  const [kitchen, setKitchen] = useState(app.kitchen);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!app.user) {
      go('#/login');
      return;
    }
    api('/my/kitchen').then((d) => {
      setKitchen(d.kitchen);
      setDishes(d.dishes || []);
      app.setKitchen(d.kitchen);
    }).catch(() => {});
  }, [app.user]);

  usePoll(
    async () => {
      if (!app.user) return;
      const d = await api('/my/baker-orders');
      setOrders(d.orders || []);
    },
    { enabled: Boolean(app.user), interval: 5000 },
  );

  if (!app.user) return null;

  const tabs = [
    { id: 'orders', hash: '#/cabinet', label: t('tabOrders') },
    { id: 'menu', hash: '#/cabinet/menu', label: t('tabMenu') },
    { id: 'kitchen', hash: '#/cabinet/kitchen', label: t('tabKitchen') },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('cabinetTitle')}</h1>
      <ChipRow>
        {tabs.map((item) => (
          <Chip key={item.id} active={tab === item.id} onClick={() => go(item.hash)}>
            {item.label}
          </Chip>
        ))}
      </ChipRow>
      {kitchen?.verificationStatus === 'pending' && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{t('kitchenPending')}</p>
      )}
      {kitchen?.verificationStatus === 'rejected' && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {t('kitchenRejected')}: {kitchen.verificationNote}
        </p>
      )}
      {tab === 'kitchen' && (
        <KitchenForm
          kitchen={kitchen}
          onSaved={(k) => {
            setKitchen(k);
            app.setKitchen(k);
          }}
        />
      )}
      {tab === 'menu' && kitchen && (
        <MenuForm
          kitchen={kitchen}
          dishes={dishes}
          onAdd={(dish) => setDishes((prev) => [...prev, dish])}
          onPatch={(dish) => setDishes((prev) => prev.map((d) => (d.id === dish.id ? dish : d)))}
        />
      )}
      {tab === 'menu' && !kitchen && (
        <EmptyState title={t('createKitchenHint')} action={t('createKitchen')} onAction={() => go('#/cabinet/kitchen')} />
      )}
      {tab === 'orders' && (
        <BakerOrders
          orders={orders}
          dishes={dishes}
          onChange={(o) => setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)))}
        />
      )}
    </div>
  );
}

function KitchenForm({ kitchen, onSaved }) {
  const t = useT();
  const app = useApp();
  const [form, setForm] = useState(() => ({
    name: kitchen?.name || '',
    ownerFullName: kitchen?.ownerFullName || '',
    bio: kitchen?.bio || '',
    address: kitchen?.address || '',
    countryId: kitchen?.countryId || app.countryId || 'uz',
    cityId: kitchen?.cityId || app.cityId || '',
    districtId: kitchen?.districtId || app.districtId || '',
    cutoffHour: kitchen?.cutoffHour || 18,
    deliveryPickup: kitchen?.deliveryPickup !== false,
    deliveryCourier: kitchen?.deliveryCourier !== false,
    confirmCooksHere: Boolean(kitchen?.confirmCooksHere),
    emoji: kitchen?.emoji || '🍞',
  }));
  const [busy, setBusy] = useState(false);

  const cities = (app.geo.cities || []).filter((c) => c.countryId === form.countryId);
  const districts = (app.geo.districts || []).filter((d) => d.cityId === form.cityId);

  function set(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'countryId') {
        const cs = (app.geo.cities || []).filter((c) => c.countryId === value);
        next.cityId = cs[0]?.id || '';
        next.districtId = (app.geo.districts || []).find((d) => d.cityId === next.cityId)?.id || '';
      }
      if (key === 'cityId') {
        next.districtId = (app.geo.districts || []).find((d) => d.cityId === value)?.id || '';
      }
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/my/kitchen', { method: kitchen ? 'PATCH' : 'POST', body: form });
      onSaved(data.kitchen);
      app.notify(t('kitchenSaved'));
    } catch {
      app.notify(t('serverError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
      <p className="text-sm text-mute">{t('createKitchenHint')}</p>
      <Field label={t('kitchenName')}>
        <input className={inputClass()} value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </Field>
      <Field label={t('ownerFullName')}>
        <input className={inputClass()} value={form.ownerFullName} onChange={(e) => set('ownerFullName', e.target.value)} required />
      </Field>
      <Field label={t('kitchenBio')}>
        <textarea className={inputClass()} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
      </Field>
      <Field label={t('kitchenAddress')}>
        <input className={inputClass()} value={form.address} onChange={(e) => set('address', e.target.value)} required />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-mute">{t('country')}</p>
        <ChipRow>
          {(app.geo.countries || []).map((c) => (
            <Chip key={c.id} active={c.id === form.countryId} onClick={() => set('countryId', c.id)}>
              {geoName(c, app.locale)}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-mute">{t('city')}</p>
        <ChipRow>
          {cities.map((c) => (
            <Chip key={c.id} active={c.id === form.cityId} onClick={() => set('cityId', c.id)}>
              {geoName(c, app.locale)}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-mute">{t('district')}</p>
        <ChipRow>
          {districts.map((d) => (
            <Chip key={d.id} active={d.id === form.districtId} onClick={() => set('districtId', d.id)}>
              {geoName(d, app.locale)}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <Field label={t('cutoffHour')}>
        <input className={inputClass()} type="number" min="10" max="22" value={form.cutoffHour} onChange={(e) => set('cutoffHour', Number(e.target.value))} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.deliveryPickup} onChange={(e) => set('deliveryPickup', e.target.checked)} />
        {t('pickup')}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.deliveryCourier} onChange={(e) => set('deliveryCourier', e.target.checked)} />
        {t('courier')}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.confirmCooksHere} onChange={(e) => set('confirmCooksHere', e.target.checked)} required />
        {t('confirmCooks')}
      </label>
      <Button type="submit" disabled={busy}>{t('createKitchen')}</Button>
    </form>
  );
}

function MenuForm({ kitchen, dishes, onAdd, onPatch }) {
  const t = useT();
  const app = useApp();
  const country = app.geo.countries.find((c) => c.id === kitchen.countryId);
  const currency = country?.currency || 'UZS';
  const [form, setForm] = useState({ name: '', price: '', unit: 'шт', category: '', ingredients: '', leftover: 20, emoji: '🍽' });
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/my/dishes', {
        method: 'POST',
        body: { ...form, price: Number(form.price), leftover: Number(form.leftover) },
      });
      onAdd(data.dish);
      setForm({ name: '', price: '', unit: 'шт', category: '', ingredients: '', leftover: 20, emoji: '🍽' });
      app.notify(t('dishAdded'));
    } catch {
      app.notify(t('serverError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        <Field label={t('dishName')}>
          <input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('dishPrice')}>
            <input className={inputClass()} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </Field>
          <Field label={t('dishUnit')}>
            <input className={inputClass()} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>
        </div>
        <Field label={t('dishIngredients')}>
          <input className={inputClass()} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
        </Field>
        <Field label={t('leftover')}>
          <input className={inputClass()} type="number" value={form.leftover} onChange={(e) => setForm({ ...form, leftover: e.target.value })} />
        </Field>
        <Button type="submit" disabled={busy}>{t('addDish')}</Button>
      </form>
      {dishes.map((dish, i) => (
        <Reveal key={dish.id} delay={i * 50}>
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold">{dish.emoji} {dish.name}</p>
              <p className="text-sm font-bold">{formatMoney(dish.price, currency, app.locale)}</p>
            </div>
            <p className="text-sm text-mute">{dish.ingredients}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs font-bold"
                onClick={async () => {
                  const data = await api(`/my/dishes/${dish.id}`, {
                    method: 'PATCH',
                    body: { leftover: Math.max(0, dish.leftover - 1) },
                  });
                  onPatch(data.dish);
                }}
              >
                −
              </button>
              <span className="text-sm">{t('leftover')}: {dish.leftover}</span>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs font-bold"
                onClick={async () => {
                  const data = await api(`/my/dishes/${dish.id}`, {
                    method: 'PATCH',
                    body: { leftover: dish.leftover + 1 },
                  });
                  onPatch(data.dish);
                }}
              >
                +
              </button>
              <button
                type="button"
                className="ml-auto rounded-full bg-ink px-3 py-1 text-xs font-bold text-white"
                onClick={async () => {
                  const data = await api(`/my/dishes/${dish.id}`, {
                    method: 'PATCH',
                    body: { availableTomorrow: !dish.availableTomorrow },
                  });
                  onPatch(data.dish);
                }}
              >
                {dish.availableTomorrow ? t('onMenu') : t('offMenu')}
              </button>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function BakerOrders({ orders, dishes = [], onChange }) {
  const t = useT();
  const app = useApp();
  const openCount = orders.filter((o) => o.status === 'accepted' || o.status === 'baking').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const leftoverSum = dishes.reduce((sum, d) => sum + Number(d.leftover || 0), 0);

  async function nextStatus(order) {
    const i = statusOrder.indexOf(order.status);
    const next = statusOrder[i + 1];
    if (!next) return;
    const data = await api(`/my/baker-orders/${order.id}`, { method: 'PATCH', body: { status: next } });
    onChange(data.order);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="text-xl font-extrabold">{openCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('statOpen')}</p>
        </div>
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="text-xl font-extrabold">{readyCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('status.ready')}</p>
        </div>
        <div className="rounded-3xl bg-white px-3 py-4 text-center shadow-card">
          <p className="text-xl font-extrabold">{leftoverSum}</p>
          <p className="mt-1 text-[11px] font-semibold text-mute">{t('leftover')}</p>
        </div>
      </div>
      {!orders.length && <EmptyState title={t('noOrdersToday')} />}
      {orders.map((o) => (
        <div key={o.id} className="rounded-3xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-extrabold">{o.id}</p>
            <StatusChip status={o.status} />
          </div>
          <p className="text-sm text-mute">
            {o.guestName} · {o.guestPhone} · {o.deliveryType === 'courier' ? t('courier') : t('pickup')} · {o.slot}
          </p>
          <p className="text-sm font-bold">{formatMoney(o.total, o.currency, app.locale)}</p>
          {(o.items || []).map((item) => (
            <p key={item.id} className="text-sm">
              {item.name} × {item.qty}
            </p>
          ))}
          {o.status !== 'delivered' && o.status !== 'cancelled' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => nextStatus(o)}>{t('nextStatus')}</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const data = await api(`/my/baker-orders/${o.id}`, { method: 'PATCH', body: { status: 'cancelled' } });
                  onChange(data.order);
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
