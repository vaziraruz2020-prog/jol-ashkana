import { useEffect, useState } from 'react';
import { geoName } from '../copy/index.js';
import { STEP_EMOJIS } from '../lib/emoji.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Reveal } from '../components/ui.jsx';

const SECTIONS = [
  { id: 'how', key: 'landHow' },
  { id: 'why', key: 'landWhy' },
  { id: 'bakers', key: 'landBakers' },
];

function HeroWords({ text }) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
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
    <div className="city-marquee rounded-cut bg-white/70 py-3">
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

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Landing() {
  const t = useT();
  const { user, geo, locale } = useApp();
  const steps = t('steps');
  const vs = t('vsPoints');
  const [active, setActive] = useState('how');

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-28% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="space-y-8">
      <section id="hero" className="section-anchor card-cut relative overflow-hidden">
        <div className="relative min-h-[240px] sm:min-h-[300px]">
          <img
            src="/images/hero-bakery.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="hero-grain pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute left-[22%] top-8 h-16 w-10 steam rounded-full bg-white/40 blur-md" />
          <div className="pointer-events-none absolute left-[28%] top-6 h-20 w-8 steam rounded-full bg-white/30 blur-md [animation-delay:.8s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/70 to-transparent" />
          <div className="relative px-5 pb-5 pt-16 sm:pt-24">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">{t('brand')}</p>
            <HeroWords text={t('slogan')} />
            <p className="hero-sub mt-3 max-w-xl text-mute">{t('subline')}</p>
          </div>
        </div>
        <div className="space-y-3 bg-cream/80 px-5 pb-5 pt-2">
          <Button capsule className="cta-pulse hover-lift" onClick={() => go('#/catalog')}>
            {t('ctaDistrict')}
          </Button>
          {user ? (
            <Button
              variant="ghost"
              onClick={() => go(user.activeRole === 'baker' ? '#/cabinet' : '#/account')}
            >
              {user.activeRole === 'baker' ? t('cabinetTitle') : t('accountTitle')}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => go('#/login')}>
                {t('ctaLogin')}
              </Button>
              <Button variant="ghost" onClick={() => go('#/register')}>
                {t('ctaRegister')}
              </Button>
            </div>
          )}
          <p className="text-xs text-mute">{t('social')}</p>
          <nav className="flex gap-5 border-t border-line/80 pt-3" aria-label={t('brand')}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`anchor-link ${active === s.id ? 'is-active' : ''}`}
                onClick={() => scrollToId(s.id)}
              >
                {t(s.key)}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <CityMarquee cities={geo.cities} locale={locale} />

      <section id="how" className="section-anchor">
        <h2 className="mb-3 text-lg font-extrabold tracking-tight">{t('stepsTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Array.isArray(steps) ? steps : []).map((s, i) => (
            <Reveal key={s.n} delay={i * 50}>
              <div className="card-cut hover-lift hover-cut p-4">
                <div className="flex items-center justify-between">
                  <div className="step-num grid h-8 w-8 place-items-center rounded-cut bg-primary-soft text-sm font-extrabold text-primary-dark">
                    {s.n}
                  </div>
                  <span className="text-2xl" aria-hidden="true">
                    {STEP_EMOJIS[i] || '🥐'}
                  </span>
                </div>
                <p className="step-title mt-3 font-extrabold tracking-tight">{s.t}</p>
                <p className="mt-1 text-sm text-mute">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="why" className="section-anchor">
        <Reveal>
          <div className="card-cut p-5">
            <h2 className="mb-3 text-lg font-extrabold tracking-tight">{t('vsTitle')}</h2>
            <div className="space-y-3">
              {(Array.isArray(vs) ? vs : []).map((row) => (
                <div key={row.bad} className="grid gap-2 sm:grid-cols-2">
                  <p className="rounded-cut bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100">
                    {row.bad}
                  </p>
                  <p className="rounded-cut bg-fresh-soft px-3 py-2 text-sm text-fresh-dark transition hover:bg-fresh/20">
                    {row.good}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="bakers" className="section-anchor">
        <Reveal>
          <div className="card-cut overflow-hidden">
            <div className="grid sm:grid-cols-3">
              <img src="/images/croissant.svg" alt="" className="h-36 w-full object-cover sm:h-full" />
              <img src="/images/loaf.svg" alt="" className="hidden h-full w-full object-cover sm:block" />
              <img src="/images/pie.svg" alt="" className="hidden h-full w-full object-cover sm:block" />
            </div>
            <div className="space-y-3 p-5">
              <h2 className="text-lg font-extrabold tracking-tight">{t('landBakersTitle')}</h2>
              <p className="text-sm text-mute">{t('landBakersBody')}</p>
              <Button
                onClick={async () => {
                  if (!user) {
                    go('#/register');
                    return;
                  }
                  go('#/cabinet/kitchen');
                }}
              >
                {t('beFirstBaker')}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
