import { geoName } from '../copy/index.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Reveal } from '../components/ui.jsx';

function HeroWords({ text }) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    <h1 className="mt-2 text-3xl font-extrabold leading-tight">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="hero-word" style={{ animationDelay: `${i * 50}ms` }}>
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </h1>
  );
}

function CityMarquee({ cities, locale }) {
  const names = (cities || []).map((c) => geoName(c, locale)).filter(Boolean);
  if (!names.length) return null;
  const loop = [...names, ...names];
  return (
    <div className="city-marquee rounded-2xl bg-white/70 py-3">
      <div className="city-marquee-track gap-8 px-4">
        {loop.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-mute"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const t = useT();
  const { user, geo, locale } = useApp();
  const steps = t('steps');
  const vs = t('vsPoints');

  return (
    <div className="space-y-8">
      <section className="hero-warm relative overflow-hidden rounded-[28px] p-6 shadow-card">
        <div className="pointer-events-none absolute -right-2 top-3 select-none text-5xl opacity-25" aria-hidden="true">
          🥐
        </div>
        <div className="pointer-events-none absolute right-10 top-16 select-none text-4xl opacity-20" aria-hidden="true">
          🍞
        </div>
        <div className="pointer-events-none absolute bottom-8 right-6 select-none text-4xl opacity-15" aria-hidden="true">
          🥖
        </div>
        <p className="relative text-sm font-bold text-primary">{t('brand')}</p>
        <div className="relative">
          <HeroWords text={t('slogan')} />
        </div>
        <p className="hero-sub relative mt-3 text-mute">{t('subline')}</p>
        <div className="relative mt-6 space-y-3">
          <Button capsule className="cta-pulse" onClick={() => go('#/catalog')}>
            {t('ctaDistrict')}
          </Button>
          {user ? (
            <Button
              variant="ghost"
              pill
              onClick={() => go(user.activeRole === 'baker' ? '#/cabinet' : '#/account')}
            >
              {user.activeRole === 'baker' ? t('cabinetTitle') : t('accountTitle')}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" pill onClick={() => go('#/login')}>
                {t('ctaLogin')}
              </Button>
              <Button variant="ghost" pill onClick={() => go('#/register')}>
                {t('ctaRegister')}
              </Button>
            </div>
          )}
        </div>
        <p className="relative mt-4 text-xs text-mute">{t('social')}</p>
      </section>

      <CityMarquee cities={geo.cities} locale={locale} />

      <section>
        <h2 className="mb-3 text-lg font-extrabold">{t('stepsTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Array.isArray(steps) ? steps : []).map((s, i) => (
            <Reveal key={s.n} delay={i * 50}>
              <div className="rounded-3xl bg-white p-4 shadow-card">
                <div className="step-num grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-dark">
                  {s.n}
                </div>
                <p className="step-title mt-3 font-extrabold">{s.t}</p>
                <p className="mt-1 text-sm text-mute">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="rounded-3xl bg-white p-5 shadow-card">
          <h2 className="mb-3 text-lg font-extrabold">{t('vsTitle')}</h2>
          <div className="space-y-3">
            {(Array.isArray(vs) ? vs : []).map((row) => (
              <div key={row.bad} className="grid gap-2 sm:grid-cols-2">
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{row.bad}</p>
                <p className="rounded-2xl bg-fresh-soft px-3 py-2 text-sm text-fresh-dark">{row.good}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
