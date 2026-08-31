import { useState } from 'react';
import { api } from '../lib/api.js';
import { geoName } from '../copy/index.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Chip, ChipRow, Field, inputClass } from '../components/ui.jsx';

export default function Account() {
  const t = useT();
  const app = useApp();
  const [name, setName] = useState(app.user?.name || '');
  const [phone, setPhone] = useState(app.user?.phone || '');
  const [busy, setBusy] = useState(false);

  if (!app.user) {
    go('#/login');
    return null;
  }

  const countries = app.geo.countries || [];
  const cities = (app.geo.cities || []).filter((c) => c.countryId === app.countryId);
  const districts = (app.geo.districts || []).filter((d) => d.cityId === app.cityId);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/me', {
        method: 'PATCH',
        body: {
          name,
          phone,
          countryId: app.countryId,
          cityId: app.cityId,
          districtId: app.districtId,
        },
      });
      app.applySession(data);
      app.notify(t('save'));
    } catch {
      app.notify(t('serverError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t('accountTitle')}</h1>
      {app.user.blocked && (
        <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-extrabold">{t('blockedTitle')}</p>
          <p>{app.user.blockedReason}</p>
        </div>
      )}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <p className="font-extrabold">{t('roleSwitch')}</p>
        <p className="mt-1 text-sm text-mute">{t('roleSwitchHint')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            active={app.user.activeRole !== 'baker'}
            onClick={() => app.switchRole('buyer')}
          >
            {t('buyer')}
          </Chip>
          <Chip
            active={app.user.activeRole === 'baker'}
            onClick={async () => {
              await app.switchRole('baker');
              go('#/cabinet');
            }}
          >
            {t('baker')}
          </Chip>
        </div>
      </section>
      <form onSubmit={save} className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        <Field label={t('name')}>
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('phone')}>
          <input className={inputClass()} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-mute">{t('country')}</p>
          <ChipRow>
            {countries.map((c) => (
              <Chip key={c.id} active={c.id === app.countryId} onClick={() => app.setGeoSel({ country: c.id })}>
                {geoName(c, app.locale)}
              </Chip>
            ))}
          </ChipRow>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-mute">{t('city')}</p>
          <ChipRow>
            {cities.map((c) => (
              <Chip key={c.id} active={c.id === app.cityId} onClick={() => app.setGeoSel({ city: c.id })}>
                {geoName(c, app.locale)}
              </Chip>
            ))}
          </ChipRow>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-mute">{t('district')}</p>
          <ChipRow>
            {districts.map((d) => (
              <Chip key={d.id} active={d.id === app.districtId} onClick={() => app.setGeoSel({ district: d.id })}>
                {geoName(d, app.locale)}
              </Chip>
            ))}
          </ChipRow>
        </div>
        <p className="text-sm text-mute">
          {t('email')}: {app.user.email}
        </p>
        <Button type="submit" disabled={busy}>
          {t('save')}
        </Button>
      </form>
      <Button variant="ghost" onClick={async () => { await app.logout(); go('#/'); }}>
        {t('logout')}
      </Button>
    </div>
  );
}
