import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatAuthError } from '../../utils/firebaseAuthErrors';

export default function VerifyEmail() {
  const { sendVerification, user } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { t } = useTranslation('common');

  async function resend() {
    setMsg(null); setErr(null); setPending(true);
    try {
      await sendVerification();
      setMsg(t('auth.verificationEmailSent', 'Email de verificação reenviado.'));
    } catch (e: any) {
      setErr(formatAuthError(e, t) || t('auth.errors.generic', 'Ocorreu um erro. Tente novamente.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="as-card">
        <h1 className="text-2xl font-semibold mb-4">{t('auth.verifyTitle', 'Verificar email')}</h1>
        <p className="text-sm mb-4">{t('auth.verifyIntro', { email: user?.email ? ` (${user.email})` : '' })}</p>
        {msg && <div className="as-alert as-alert-success mb-3">{msg}</div>}
        {err && <div className="as-alert as-alert-error mb-3">{err}</div>}
        <button onClick={resend} disabled={pending} className="as-btn-primary">{pending ? t('auth.resending', 'A reenviar…') : t('auth.resendVerification', 'Reenviar email')}</button>
      </div>
    </div>
  );
}
