import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { geoName } from '../copy/index.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Chip, ChipRow, EmptyState, FoodTile, Reveal } from '../components/ui.jsx';

export default function Catalog() {
  const t = useT();
  const app = useApp();
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(false);

  const cities = (app.geo.cities || []).filter((c) => c.countryId === app.countryId);
  const districts = (app.geo.districts || []).filter((d) => d.cityId === app.cityId);

  useEffect(() => {
    if (!app.districtId) {
      setKitchens([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api(`/kitchens?countryId=${app.countryId}&cityId=${app.cityId}&districtId=${app.districtId}`)
      .then((data) => {
        if (!cancelled) setKitchens(data.kitchens || []);
      })
      .catch(() => {
        if (!cancelled) setKitchens([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [app.countryId, app.cityId, app.districtId]);

  const visible = kitchens.filter((k) => k.verificationStatus === 'verified' && !k.hidden);
  const strip = visible.slice(0, 6);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('navDistrict')}</h1>
      <ChipRow>
        {(app.geo.countries || []).map((c) => (
          <Chip key={c.id} active={c.id === app.countryId} onClick={() => app.setGeoSel({ country: c.id })}>
            {geoName(c, app.locale)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        {cities.map((c) => (
          <Chip key={c.id} active={c.id === app.cityId} onClick={() => app.setGeoSel({ city: c.id })}>
            {geoName(c, app.locale)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        {districts.map((d) => (
          <Chip key={d.id} active={d.id === app.districtId} onClick={() => app.setGeoSel({ district: d.id })}>
            {geoName(d, app.locale)}
          </Chip>
        ))}
      </ChipRow>

      {!app.districtId && <EmptyState title={t('pickDistrictFirst')} />}
      {app.districtId && !loading && visible.length === 0 && (
        <EmptyState
          title={t('emptyDistrict')}
          action={t('beFirstBaker')}
          onAction={async () => {
            if (!app.user) {
              go('#/register');
              return;
            }
            await app.switchRole('baker');
            go('#/cabinet/kitchen');
          }}
        />
      )}

      {strip.length > 0 && (
        <div className="snap-strip no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {strip.map((k) => (
            <button
              key={`strip-${k.id}`}
              type="button"
              onClick={() => go(`#/baker/${k.id}`)}
              className="w-[78%] shrink-0 rounded-3xl bg-white p-4 text-left shadow-card sm:w-[240px]"
            >
              <FoodTile emoji={k.emoji} accent={k.accent} className="h-16 w-16" />
              <p className="mt-3 font-extrabold">{k.name}</p>
              <p className="mt-1 text-xs text-mute">{t('cutoffOk').replace('{hour}', String(k.cutoffHour))}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((k, i) => (
          <Reveal key={k.id} delay={i * 50}>
            <button
              type="button"
              onClick={() => go(`#/baker/${k.id}`)}
              className="flex w-full gap-3 rounded-3xl bg-white p-4 text-left shadow-card"
            >
              <FoodTile emoji={k.emoji} accent={k.accent} className="h-16 w-16 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold">{k.name}</p>
                <p className="truncate text-sm text-mute">{k.bio || k.address}</p>
                <p className="mt-1 text-xs text-mute">{t('cutoffOk').replace('{hour}', String(k.cutoffHour))}</p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
