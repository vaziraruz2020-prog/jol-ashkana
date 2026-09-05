import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { cartTotal, formatMoney, isValidPhone } from '../lib/format.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Chip, Field, inputClass } from '../components/ui.jsx';

export default function Checkout() {
  const t = useT();
  const app = useApp();
  const [kitchen, setKitchen] = useState(null);
  const [name, setName] = useState(app.user?.name || '');
  const [phone, setPhone] = useState(app.user?.phone || '');
  const [delivery, setDelivery] = useState('pickup');
  const [slot, setSlot] = useState(app.geo.slots[0] || '10:00–12:00');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const kitchenId = app.cart[0]?.kitchenId;
  const currency = app.cart[0]?.currency || 'UZS';

  useEffect(() => {
    if (!app.user) {
      go('#/login');
      return;
    }
    if (!kitchenId) {
      go('#/cart');
      return;
    }
    api(`/kitchens/${kitchenId}`)
      .then((d) => {
        setKitchen(d.kitchen);
        if (!d.kitchen.deliveryPickup && d.kitchen.deliveryCourier) setDelivery('courier');
      })
      .catch(() => go('#/cart'));
  }, [app.user, kitchenId]);

  if (!app.user || !app.cart.length) return null;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('name');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('phone');
      return;
    }
    if (delivery === 'courier' && !address.trim()) {
      setError('address');
      return;
    }
    setBusy(true);
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          items: app.cart.map((i) => ({ dishId: i.dishId, qty: i.qty })),
          guestName: name.trim(),
          guestPhone: phone,
          deliveryType: delivery,
          slot,
          address,
          comment,
        },
      });
      app.clearCart();
      app.notify(t('orderPlaced'));
      go(`#/orders/${data.order.id}`);
    } catch (err) {
      setError(err.data?.error || 'server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-cut space-y-4 bg-white p-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('confirm')}</h1>
      <p className="rounded-cut bg-fresh-soft px-4 py-3 text-sm font-semibold text-fresh-dark">{t('payCash')}</p>
      <Field label={t('name')}>
        <input className={inputClass(error === 'name')} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {error === 'name' && <p className="text-sm text-red-600">{t('nameError')}</p>}
      <Field label={t('phone')}>
        <input className={inputClass(error === 'phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      {error === 'phone' && <p className="text-sm text-red-600">{t('phoneError')}</p>}
      <div>
        <p className="mb-2 text-sm font-semibold text-mute">{t('delivery')}</p>
        <div className="flex gap-2">
          {kitchen?.deliveryPickup && (
            <Chip active={delivery === 'pickup'} onClick={() => setDelivery('pickup')}>
              {t('pickup')}
            </Chip>
          )}
          {kitchen?.deliveryCourier && (
            <Chip active={delivery === 'courier'} onClick={() => setDelivery('courier')}>
              {t('courier')}
            </Chip>
          )}
        </div>
      </div>
      {delivery === 'courier' && (
        <Field label={t('address')}>
          <input className={inputClass(error === 'address')} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      )}
      {error === 'address' && <p className="text-sm text-red-600">{t('addressError')}</p>}
      <Field label={t('slot')}>
        <select className={inputClass()} value={slot} onChange={(e) => setSlot(e.target.value)}>
          {(app.geo.slots || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('comment')}>
        <textarea className={inputClass()} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <p className="text-lg font-extrabold tracking-tight">
        {t('total')}: {formatMoney(cartTotal(app.cart), currency, app.locale)}
      </p>
      {error && !['name', 'phone', 'address'].includes(error) && (
        <p className="text-sm text-red-600">{t('serverError')}</p>
      )}
      <Button type="submit" disabled={busy}>
        {t('orderTomorrow')}
      </Button>
    </form>
  );
}
