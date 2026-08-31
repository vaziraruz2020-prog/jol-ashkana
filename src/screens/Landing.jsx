import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button } from '../components/ui.jsx';

export default function Landing() {
  const t = useT();
  const { user } = useApp();
  const steps = t('steps');
  const vs = t('vsPoints');

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-white p-6 shadow-card">
        <p className="text-sm font-bold text-primary">{t('brand')}</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">{t('slogan')}</h1>
        <p className="mt-3 text-mute">{t('subline')}</p>
        <div className="mt-6 space-y-3">
          <Button onClick={() => go('#/catalog')}>{t('ctaDistrict')}</Button>
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
        </div>
        <p className="mt-4 text-xs text-mute">{t('social')}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">{t('stepsTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Array.isArray(steps) ? steps : []).map((s) => (
            <div key={s.n} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-dark">
                {s.n}
              </div>
              <p className="mt-3 font-extrabold">{s.t}</p>
              <p className="mt-1 text-sm text-mute">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
}
