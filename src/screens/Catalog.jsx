import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { geoName } from '../copy/index.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Chip, ChipRow, EmptyState, FoodTile, KitchenCard, Reveal } from '../components/ui.jsx';

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
  const peek = visible.slice(0, 6);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('navDistrict')}</h1>
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

      {peek.length > 0 && (
        <div className="-mx-4">
          <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.18em] text-mute">{t('tomorrowStrip')}</p>
          <div className="snap-strip no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
            {peek.map((k) => (
              <button
                key={`peek-${k.id}`}
                type="button"
                onClick={() => go(`#/baker/${k.id}`)}
                className="w-[min(72%,260px)] shrink-0 overflow-hidden rounded-cut bg-white text-left shadow-card transition duration-200 hover:shadow-lift active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 p-3">
                  <FoodTile
                    emoji={k.emoji || '🥐'}
                    accent={k.accent}
                    className="rounded-cut"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold tracking-tight">{k.name}</p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                      {t('cutoffOk').replace('{hour}', String(k.cutoffHour))}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            <div className="w-3 shrink-0" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((k, i) => {
          const district = (app.geo.districts || []).find((d) => d.id === k.districtId);
          const meta = [geoName(district, app.locale), t('cutoffOk').replace('{hour}', String(k.cutoffHour))]
            .filter(Boolean)
            .join(' · ');
          return (
            <Reveal key={k.id} delay={i * 50}>
              <KitchenCard kitchen={k} meta={meta} onClick={() => go(`#/baker/${k.id}`)} />
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
