import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Chip, Field, StatusChip, inputClass } from '../components/ui.jsx';

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
    const [k, u, ti, o] = await Promise.all([
      api('/admin/kitchens'),
      api('/admin/users'),
      api('/admin/tickets'),
      api(`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    ]);
    setKitchens(k.kitchens || []);
    setUsers(u.users || []);
    setTickets(ti.tickets || []);
    setOrders(o.orders || []);
  }

  useEffect(() => {
    if (app.user?.isSupport) load().catch(() => {});
  }, [app.user]);

  if (!app.user?.isSupport) return null;

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
          {kitchens.map((k) => (
            <div key={k.id} className="rounded-3xl bg-white p-4 shadow-card">
              <p className="font-extrabold">{k.name}</p>
              <p className="text-sm text-mute">
                {k.ownerFullName} · {k.address} · {k.verificationStatus}
                {k.hidden ? ` · ${t('hiddenShort')}` : ''}
              </p>
              <p className="text-xs text-mute">{t('verifyHint')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  onClick={async () => {
                    await api(`/admin/kitchens/${k.id}`, { method: 'PATCH', body: { verificationStatus: 'verified' } });
                    load();
                  }}
                >
                  {t('adminVerify')}
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await api(`/admin/kitchens/${k.id}`, {
                      method: 'PATCH',
                      body: { verificationStatus: 'rejected', verificationNote: note },
                    });
                    load();
                  }}
                >
                  {t('adminReject')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await api(`/admin/kitchens/${k.id}`, { method: 'PATCH', body: { hidden: !k.hidden } });
                    load();
                  }}
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
          <Field label={t('adminSearch')}>
            <input className={inputClass()} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adminSearchHint')} />
          </Field>
          <Button variant="ghost" onClick={() => load()}>{t('adminSearch')}</Button>
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
                    onClick={async () => {
                      await api(`/admin/orders/${o.id}`, { method: 'PATCH', body: { status: 'cancelled' } });
                      load();
                    }}
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
                    onClick={async () => {
                      await api(`/admin/tickets/${ticket.id}`, { method: 'PATCH', body: { status: st } });
                      load();
                    }}
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
                    onClick={async () => {
                      await api(`/admin/users/${u.id}`, {
                        method: 'PATCH',
                        body: { blocked: !u.blocked, reason: note },
                      });
                      load();
                    }}
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
