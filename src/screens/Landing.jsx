import { useEffect, useRef, useState } from 'react';
import { geoName } from '../copy/index.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Reveal } from '../components/ui.jsx';

const SECTIONS = [
  { id: 'gallery', key: 'landGalleryKicker' },
  { id: 'how', key: 'landHow' },
  { id: 'why', key: 'landWhy' },
  { id: 'bakers', key: 'landBakers' },
];

const PLATES = [
  { src: '/images/plate-samsa.svg', nameKey: 'landPlateSamsa' },
  { src: '/images/plate-non.svg', nameKey: 'landPlateNon' },
  { src: '/images/plate-baklava.svg', nameKey: 'landPlateBaklava' },
  { src: '/images/croissant.svg', nameKey: 'landPlateCroissant' },
  { src: '/images/loaf.svg', nameKey: 'landPlateLoaf' },
  { src: '/images/pie.svg', nameKey: 'landPlatePie' },
];

const HOW_THUMBS = ['/images/plate-non.svg', '/images/plate-samsa.svg', '/images/pie.svg'];

const TICKER = [
  '/images/ticker-patir.svg',
  '/images/ticker-buns.svg',
  '/images/ticker-chakchak.svg',
  '/images/ticker-pirozhki.svg',
  '/images/ticker-cookies.svg',
  '/images/ticker-khachapuri.svg',
];

const HERO_PLATES = [
  { src: '/images/plate-samsa.svg', className: 'hero-plate hero-plate-a', depth: 0.18 },
  { src: '/images/croissant.svg', className: 'hero-plate hero-plate-b', depth: 0.32 },
  { src: '/images/plate-baklava.svg', className: 'hero-plate hero-plate-c', depth: 0.46 },
];

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function HeroWords({ text }) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
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

function PastryTicker() {
  const loop = [...TICKER, ...TICKER];
  return (
    <div className="pastry-ticker-bleed city-marquee pastry-ticker">
      <div className="city-marquee-track items-stretch gap-0">
        {loop.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            className="h-28 w-[46vw] max-w-none shrink-0 object-cover sm:h-40 sm:w-[28vw]"
          />
        ))}
      </div>
    </div>
  );
}

function SectionHead({ kicker, title, lead }) {
  return (
    <header className="mb-5 space-y-2">
      <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-primary">{kicker}</p>
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">{title}</h2>
      {lead ? <p className="max-w-xl text-[15px] leading-relaxed text-mute">{lead}</p> : null}
    </header>
  );
}

function MagneticCta({ children, onClick }) {
  const wrapRef = useRef(null);

  function onMove(e) {
    const el = wrapRef.current;
    if (!el || reducedMotion()) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translate(${x * 10}px, ${y * 6}px)`;
  }

  function onLeave() {
    const el = wrapRef.current;
    if (!el) return;
    el.style.transform = 'translate(0, 0)';
  }

  return (
    <div
      ref={wrapRef}
      className="magnetic-cta"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Button capsule className="cta-pulse hover-lift" onClick={onClick}>
        {children}
      </Button>
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
  const bakerPath = t('bakerPath');
  const [active, setActive] = useState('gallery');
  const heroRef = useRef(null);
  const platesRef = useRef([]);

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

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const hero = heroRef.current;
    if (!hero) return undefined;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const y = Math.min(Math.max(-rect.top, 0), 280);
        platesRef.current.forEach((node, i) => {
          if (!node) return;
          const depth = HERO_PLATES[i]?.depth || 0.2;
          node.style.setProperty('--parallax', `${y * depth}px`);
        });
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onVis() {
      document.documentElement.classList.toggle('page-hidden', document.hidden);
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const activeIndex = Math.max(
    0,
    SECTIONS.findIndex((s) => s.id === active),
  );

  return (
    <div className="landing-page">
      <div className="space-y-12">
        <section id="hero" className="section-anchor card-cut relative overflow-hidden">
          <div ref={heroRef} className="relative min-h-[300px] overflow-hidden sm:min-h-[380px]">
            <img
              src="/images/hero-bakery.svg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="hero-grain pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute left-[18%] top-8 h-16 w-10 steam rounded-full bg-white/40 blur-md" />
            <div className="pointer-events-none absolute left-[24%] top-5 h-20 w-8 steam rounded-full bg-white/30 blur-md [animation-delay:.8s]" />
            <div className="pointer-events-none absolute left-[30%] top-10 h-14 w-7 steam rounded-full bg-white/25 blur-md [animation-delay:1.6s]" />
            {HERO_PLATES.map((plate, i) => (
              <img
                key={plate.src}
                ref={(node) => {
                  platesRef.current[i] = node;
                }}
                src={plate.src}
                alt=""
                className={plate.className}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/75 to-transparent" />
            <div className="relative px-5 pb-5 pt-16 sm:pt-24">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">{t('brand')}</p>
              <HeroWords text={t('slogan')} />
              <p className="hero-sub mt-3 max-w-xl text-mute">{t('subline')}</p>
            </div>
          </div>
          <div className="space-y-3 bg-cream/80 px-5 pb-5 pt-2">
            <MagneticCta onClick={() => go('#/catalog')}>{t('ctaDistrict')}</MagneticCta>
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
            <p className="text-xs text-mute">{t('social')}</p>
            <nav className="anchor-nav relative flex gap-5 border-t border-line/80 pt-3" aria-label={t('brand')}>
              <span
                className="anchor-ink"
                style={{ transform: `translateX(${activeIndex * 100}%)`, width: `${100 / SECTIONS.length}%` }}
              />
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`anchor-link flex-1 ${active === s.id ? 'is-active' : ''}`}
                  onClick={() => scrollToId(s.id)}
                >
                  {t(s.key)}
                </button>
              ))}
            </nav>
          </div>
        </section>

        <CityMarquee cities={geo.cities} locale={locale} />

        <section id="gallery" className="section-anchor scroll-mt-20">
          <SectionHead kicker={t('landGalleryKicker')} title={t('landGallery')} lead={t('landGalleryLead')} />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-mute">{t('landGalleryHint')}</p>
          <div className="snap-strip -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
            {PLATES.map((p, i) => (
              <Reveal key={p.src} delay={i * 70} className="shrink-0">
                <figure className="gallery-card card-cut w-[220px] sm:w-[260px]">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.src} alt="" className="h-full w-full object-cover" />
                  </div>
                  <figcaption className="border-t border-ink/10 px-3 py-2.5">
                    <p className="font-extrabold tracking-tight">{t(p.nameKey)}</p>
                    <p className="text-xs text-mute">{t('landGalleryCaption')}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how" className="section-anchor scroll-mt-20 border-t border-line/80 pt-8">
          <SectionHead kicker={t('landHow')} title={t('stepsTitle')} lead={t('landHowLead')} />
          <div className="grid gap-3 sm:grid-cols-3">
            {(Array.isArray(steps) ? steps : []).map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="card-cut mask-reveal h-full overflow-hidden">
                  <div className="h-24 overflow-hidden">
                    <img
                      src={HOW_THUMBS[i] || PLATES[0].src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="step-num grid h-8 w-8 place-items-center rounded-cut bg-primary-soft text-sm font-extrabold text-primary-dark">
                        {s.n}
                      </div>
                    </div>
                    <p className="step-title mt-3 font-extrabold tracking-tight">{s.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="why" className="section-anchor scroll-mt-20 border-t border-line/80 pt-8">
          <SectionHead kicker={t('landWhy')} title={t('vsTitle')} lead={t('landWhyLead')} />
          <Reveal>
            <div className="card-cut overflow-hidden p-4 sm:p-5">
              <div className="mb-3 hidden grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid">
                <p className="px-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-700/80">
                  {t('landWhyNow')}
                </p>
                <span className="vs-pill">{t('landWhyVs')}</span>
                <p className="px-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-fresh-dark">
                  {t('landWhyJol')}
                </p>
              </div>
              <div className="space-y-3">
                {(Array.isArray(vs) ? vs : []).map((row, i) => (
                  <div key={row.bad} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                    <p
                      className="why-bad rounded-cut bg-red-50 px-3 py-2.5 text-sm leading-relaxed text-red-800"
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-700/70 sm:hidden">
                        {t('landWhyNow')}
                      </span>
                      {row.bad}
                    </p>
                    <span className="vs-pill hidden self-center sm:inline-flex">{t('landWhyVs')}</span>
                    <p
                      className="why-good rounded-cut bg-fresh-soft px-3 py-2.5 text-sm leading-relaxed text-fresh-dark"
                      style={{ transitionDelay: `${i * 80 + 40}ms` }}
                    >
                      <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-fresh-dark/70 sm:hidden">
                        {t('landWhyJol')}
                      </span>
                      {row.good}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section id="bakers" className="section-anchor scroll-mt-20 border-t border-line/80 pt-8">
          <SectionHead kicker={t('landBakers')} title={t('landBakersTitle')} lead={t('landBakersLead')} />
          <Reveal>
            <div className="card-cut overflow-hidden">
              <div className="baker-mosaic">
                {PLATES.map((p) => (
                  <div key={p.src} className="overflow-hidden">
                    <img src={p.src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="space-y-4 p-5">
                <p className="text-sm leading-relaxed text-ink/80">{t('landBakersBody')}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(Array.isArray(bakerPath) ? bakerPath : []).map((s) => (
                    <div key={s.n} className="rounded-cut bg-cream px-3 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{s.n}</p>
                      <p className="mt-1 font-extrabold tracking-tight">{s.t}</p>
                      <p className="mt-1 text-sm leading-relaxed text-mute">{s.d}</p>
                    </div>
                  ))}
                </div>
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

      <PastryTicker />
    </div>
  );
}
