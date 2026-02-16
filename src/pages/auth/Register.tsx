import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatAuthError } from '../../utils/firebaseAuthErrors';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nav = useNavigate();
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('common');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await register(email, password, name);
      setSuccess(t('auth.registerSuccess', 'Conta criada. Verifique o seu email para ativar.'));
      setTimeout(() => nav(`/${base}/auth/login`), 1200);
    } catch (err: any) {
      setError(formatAuthError(err, t) || t('auth.registerFailed', 'Falha no registo'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="as-card">
        <h1 className="text-2xl font-semibold mb-6">{t('auth.registerTitle', 'Criar conta')}</h1>
        {error && <div className="as-alert as-alert-error mb-4">{error}</div>}
        {success && <div className="as-alert as-alert-success mb-4">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="as-input" type="text" placeholder={t('auth.name', 'Nome')} value={name} onChange={e => setName(e.target.value)} required />
          <input className="as-input" type="email" placeholder={t('auth.email', 'Email')} value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="as-input" type="password" placeholder={t('auth.passwordMin', 'Password (min 6)')} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button disabled={pending} className="as-btn-primary w-full">{pending ? 'A criar…' : t('auth.register', 'Criar conta')}</button>
        </form>
        <div className="text-sm mt-4">
          Já tem conta? <NavLink to={`/${base}/auth/login`} className="underline underline-offset-4">{t('auth.signIn', 'Entrar')}</NavLink>
        </div>
      </div>
    </div>
  );
}
