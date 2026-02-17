import React from "react";
import { useAuth } from "../../context/AuthContext";
import { signOutUser } from "../../firebase";
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthChoiceModal from "../../components/AuthChoiceModal";

export default function Login() {
  const { user, loading } = useAuth();
  const [pending, setPending] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  const { t } = useTranslation('common');

  const baseLangPath = lang === 'en' ? '/en' : '/pt';

  const handleLogout = async () => {
    setPending(true);
    try {
      await signOutUser();
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <div className="p-6">A carregar...</div>;
  }

  if (user) {
    const name = user.displayName ?? user.email?.split("@")[0] ?? t('auth.hello', 'Olá');
    return (
      <div className="p-6 space-y-3">
        <div>{t('auth.hello', 'Olá')} {name} 👋</div>
        <button
          onClick={handleLogout}
          disabled={pending}
          className="as-btn bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {t('auth.signOut', 'Sair')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <AuthChoiceModal
        open={true}
        onClose={() => {
          if (redirect) {
            navigate(redirect, { replace: true });
          } else {
            navigate(baseLangPath, { replace: true });
          }
        }}
      />
    </div>
  );
}
