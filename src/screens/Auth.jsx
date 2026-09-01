import { useState } from 'react';
import { api } from '../lib/api.js';
import { go } from '../lib/route.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Field, inputClass, PasswordInput } from '../components/ui.jsx';

export default function Auth({ mode }) {
  const t = useT();
  const app = useApp();
  const isRegister = mode === 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const path = isRegister ? '/auth/register' : '/auth/login';
      const data = await api(path, {
        method: 'POST',
        body: isRegister
          ? { email, password, name, locale: app.locale, countryId: app.countryId, cityId: app.cityId, districtId: app.districtId }
          : { email, password },
      });
      app.applySession(data);
      if (data.user?.isSupport) go('#/admin');
      else if (data.user?.activeRole === 'baker') go('#/cabinet');
      else go('#/catalog');
    } catch (err) {
      const code = err.data?.error;
      const hint = err.data?.hint;
      if (code === 'blocked') setError(err.data.reason || t('blockedTitle'));
      else if (code === 'exists') setError(t('existsError'));
      else if (code === 'password') setError(t('passwordHint'));
      else if (code === 'name') setError(t('nameError'));
      else if (code === 'email') setError(t('emailError'));
      else if (code === 'db' || code === 'db_config' || code === 'jwt_config' || err.status === 503) {
        setError(hint || t('dbError'));
      } else if (err.status === 401) setError(t('authError'));
      else if (code === 'api_missing' && err.status === 404) setError(t('apiMissingError'));
      else if (code === 'network' || err.status === 0) setError(t('networkError'));
      else setError(hint || t('serverError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-[28px] bg-white p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">{isRegister ? t('registerTitle') : t('loginTitle')}</h1>
      <p className="text-sm text-mute">{isRegister ? t('registerHint') : t('loginHint')}</p>
      {isRegister && (
        <Field label={t('name')}>
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      )}
      <Field label={t('email')}>
        <input className={inputClass()} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label={t('password')}>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />
      </Field>
      {isRegister && <p className="text-xs text-mute">{t('passwordHint')}</p>}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <Button type="submit" disabled={busy}>
        {isRegister ? t('ctaRegister') : t('ctaLogin')}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm font-bold text-primary"
        onClick={() => go(isRegister ? '#/login' : '#/register')}
      >
        {isRegister ? t('hasAccount') : t('noAccount')}
      </button>
    </form>
  );
}
