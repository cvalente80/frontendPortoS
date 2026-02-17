import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatAuthError } from '../../utils/firebaseAuthErrors';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('common');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await resetPassword(email);
      setSuccess(
        t('auth.emailSent', 'Email de recuperação enviado.') + ' ' +
        t('auth.emailSentSpamNote', 'Por favor, verifique também a pasta de spam/lixo caso não encontre o email.')
      );
    } catch (err: any) {
      setError(formatAuthError(err, t) || t('auth.resetFailed', 'Falha ao enviar recuperação'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="as-card">
        <h1 className="text-2xl font-semibold mb-6">Recuperar palavra-passe</h1>
        {error && <div className="as-alert as-alert-error mb-4">{error}</div>}
        {success && <div className="as-alert as-alert-success mb-4">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="as-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <button disabled={pending} className="as-btn-primary w-full">{pending ? t('chat.sending', 'A enviar…') : t('auth.sendResetLink', 'Enviar link de recuperação')}</button>
        </form>
        <div className="text-sm mt-4">
          <NavLink className="underline underline-offset-4" to={`/${base}/auth/login`}>Voltar ao login</NavLink>
        </div>
      </div>
    </div>
  );
}
