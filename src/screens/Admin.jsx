import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/poll.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Chip, EmptyState, Field, StatusChip, inputClass } from '../components/ui.jsx';

export default function Admin() {
  const t = useT();
  const app = useApp();
  const [tab, setTab] = useState('kitchens');
  const [kitchens, setKitchens] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!app.user) {
      go('#/login');
      return;
    }
    if (!app.user.isSupport) {
      go('#/');
    }
  }, [app.user]);

  async function load() {
    const results = await Promise.allSettled([
      api('/admin/kitchens'),
      api('/admin/users'),
      api('/admin/tickets'),
      api(`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    ]);
    const [k, u, ti, o] = results;
    if (k.status === 'fulfilled') setKitchens(k.value.kitchens || []);
    if (u.status === 'fulfilled') setUsers(u.value.users || []);
    if (ti.status === 'fulfilled') setTickets(ti.value.tickets || []);
    if (o.status === 'fulfilled') setOrders(o.value.orders || []);
  }

  function actionError(err) {
    const code = err?.data?.error || err?.message;
    if (code === 'network' || err?.status === 0) return t('networkError');
    if (code === 'auth') return t('authError');
    return err?.data?.hint || t('adminActionFailed');
  }

  async function runAction(id, request, onOk, okMessage) {
    if (busyId) return;
    setBusyId(id);
    try {
      const data = await request();
      onOk(data);
      if (okMessage) app.notify(okMessage);
      await load();
    } catch (err) {
      app.notify(actionError(err));
    } finally {
      setBusyId('');
    }
  }

  usePoll(
    async () => {
      await load();
    },
    { enabled: Boolean(app.user?.isSupport), interval: 8000 },
  );

  if (!app.user?.isSupport) return null;

  function kitchenStatusLabel(k) {
    const key = `${k.verificationStatus}Short`;
    const parts = [t(key) === key ? k.verificationStatus : t(key)];
    if (k.hidden) parts.push(t('hiddenShort'));
    return parts.join(' · ');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('adminTitle')}</h1>
      <p className="text-sm text-mute">{t('adminSub')}</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['kitchens', 'orders', 'tickets', 'users'].map((id) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>
            {t(id === 'kitchens' ? 'adminKitchens' : id === 'orders' ? 'adminOrders' : id === 'tickets' ? 'adminTickets' : 'adminUsers')}
          </Chip>
        ))}
      </div>

      {tab === 'kitchens' && (
        <div className="space-y-3">
          <Field label={t('rejectNote')}>
            <input className={inputClass()} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {!kitchens.length && <EmptyState title={t('adminEmptyKitchens')} />}
          {kitchens.map((k) => (
            <div key={k.id} className="rounded-3xl bg-white p-4 shadow-card">
              <p className="font-extrabold">{k.name}</p>
              <p className="text-sm text-mute">
                {k.ownerFullName} · {k.address} · {kitchenStatusLabel(k)}
              </p>
              <p className="text-xs text-mute">{t('verifyHint')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    runAction(
                      `kit-verify-${k.id}`,
                      () => api(`/admin/kitchens/${k.id}`, { method: 'PATCH', body: { verificationStatus: 'verified' } }),
                      (data) => {
                        if (data.kitchen) {
                          setKitchens((prev) => prev.map((row) => (row.id === k.id ? data.kitchen : row)));
                        }
                      },
                      t('adminVerified'),
                    )
                  }
                >
                  {t('adminVerify')}
                </Button>
                <Button
                  variant="danger"
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    runAction(
                      `kit-reject-${k.id}`,
                      () =>
                        api(`/admin/kitchens/${k.id}`, {
                          method: 'PATCH',
                          body: { verificationStatus: 'rejected', verificationNote: note },
                        }),
                      (data) => {
                        if (data.kitchen) {
                          setKitchens((prev) => prev.map((row) => (row.id === k.id ? data.kitchen : row)));
                        }
                      },
                      t('adminRejected'),
                    )
                  }
                >
                  {t('adminReject')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    runAction(
                      `kit-hide-${k.id}`,
                      () => api(`/admin/kitchens/${k.id}`, { method: 'PATCH', body: { hidden: !k.hidden } }),
                      (data) => {
                        if (data.kitchen) {
                          setKitchens((prev) => prev.map((row) => (row.id === k.id ? data.kitchen : row)));
                        }
                      },
                      k.hidden ? t('adminShown') : t('adminHidden'),
                    )
                  }
                >
                  {k.hidden ? t('adminShow') : t('adminHide')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          <p className="text-sm text-mute">{t('adminOrdersHint')}</p>
          <Field label={t('adminSearch')}>
            <input className={inputClass()} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adminSearchHint')} />
          </Field>
          <Button variant="ghost" onClick={() => load()}>
            {t('adminSearch')}
          </Button>
          {!orders.length && <EmptyState title={t('adminNoOrders')} />}
          {orders.map((o) => (
            <div key={o.id} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">{o.id}</p>
                <StatusChip status={o.status} />
              </div>
              <p className="text-sm text-mute">
                {o.guestName} · {o.guestPhone} · {o.kitchen?.name}
              </p>
              {o.status !== 'cancelled' && o.status !== 'delivered' && (
                <div className="mt-2">
                  <Button
                    variant="danger"
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      runAction(
                        `ord-${o.id}`,
                        () => api(`/admin/orders/${o.id}`, { method: 'PATCH', body: { status: 'cancelled' } }),
                        (data) => {
                          if (data.order) {
                            setOrders((prev) => prev.map((row) => (row.id === o.id ? data.order : row)));
                          }
                        },
                        t('adminCancelled'),
                      )
                    }
                  >
                    {t('adminForceCancel')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-3">
          {!tickets.length && <EmptyState title={t('adminEmptyTickets')} />}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-3xl bg-white p-4 shadow-card">
              <p className="font-extrabold">
                {ticket.topic} · {ticket.targetType}/{ticket.targetId}
              </p>
              <p className="text-sm">{ticket.body}</p>
              <p className="mt-1 text-xs text-mute">{t(`ticketStatus.${ticket.status}`)}</p>
              <div className="mt-2 flex gap-2">
                {['open', 'working', 'closed'].map((st) => (
                  <Chip
                    key={st}
                    active={ticket.status === st}
                    onClick={() =>
                      runAction(
                        `tkt-${ticket.id}-${st}`,
                        () => api(`/admin/tickets/${ticket.id}`, { method: 'PATCH', body: { status: st } }),
                        (data) => {
                          if (data.ticket) {
                            setTickets((prev) => prev.map((row) => (row.id === ticket.id ? data.ticket : row)));
                          }
                        },
                        t('adminTicketUpdated'),
                      )
                    }
                  >
                    {t(`ticketStatus.${st}`)}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          <Field label={t('blockReason')}>
            <input className={inputClass()} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {!users.length && <EmptyState title={t('adminEmptyUsers')} />}
          {users.map((u) => (
            <div key={u.id} className="rounded-3xl bg-white p-4 shadow-card">
              <p className="font-extrabold">{u.name}</p>
              <p className="text-sm text-mute">
                {u.email} · {u.activeRole}
                {u.isSupport ? ` · ${t('iAmSupport')}` : ''}
                {u.blocked ? ` · ${t('blockedTitle')}` : ''}
              </p>
              {!u.isSupport && (
                <div className="mt-2">
                  <Button
                    variant={u.blocked ? 'fresh' : 'danger'}
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      runAction(
                        `usr-${u.id}`,
                        () =>
                          api(`/admin/users/${u.id}`, {
                            method: 'PATCH',
                            body: { blocked: !u.blocked, reason: note },
                          }),
                        (data) => {
                          if (data.user) {
                            setUsers((prev) => prev.map((row) => (row.id === u.id ? data.user : row)));
                          }
                        },
                        u.blocked ? t('adminUnblocked') : t('adminBlocked'),
                      )
                    }
                  >
                    {u.blocked ? t('adminUnblock') : t('adminBlock')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
