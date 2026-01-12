import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation('common');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { user, loading, displayName, loginWithGoogle, logout, isAdmin } = useAuth();
  const { openAuth } = useAuthUX();
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  let brandName = 'Ansião Seguros';
  if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
  else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
  else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
  else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';
  function resetFloatingWidgets() {
    try {
      localStorage.removeItem('chat:hideWhatsApp');
      localStorage.removeItem('chat:hideChatButton');
    } catch {}
    window.dispatchEvent(new CustomEvent('chat:resetFloating'));
  }

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm md:hidden">
      <div className="py-4 px-4 flex justify-between items-center">
        <NavLink to={`/${base}`} className="flex items-center gap-2" onClick={() => { setOpen(false); resetFloatingWidgets(); }}>
          <img src={`${import.meta.env.BASE_URL}logo-empresarial.svg`} alt="Logo Ansião Seguros" className="h-8 w-8" />
          <span className="text-lg font-semibold text-blue-900 tracking-tight">{brandName}</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* Perfil / Autenticação (mobile) */}
          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="relative">
              {/* Indicador visível de sessão iniciada */}
              <span className="mr-1 text-xs font-medium text-blue-900 max-w-[110px] truncate align-middle">
                {t('auth.hello')}, {displayName?.split(' ')[0] || 'Utilizador'}
              </span>
              <button aria-label="Conta" className="relative p-2 rounded-full border border-blue-200 bg-blue-50" onClick={() => setOpen((v) => v)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {/* Online/active dot */}
                <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button aria-label={t('auth.signIn')} className="p-2 rounded-full border border-blue-200" onClick={openAuth}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}

          <button aria-label="Abrir menu" className="p-2 rounded-md border border-blue-200" onClick={() => setOpen((v) => !v)}>
          <svg width="24" height="24" fill="none" stroke="#1e3a8a" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          </button>
        </div>
      </div>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
      )}
      {open && (
        <nav className="px-4 pb-4 relative">
          {user && (
            <div className="pt-2 pb-2 text-sm text-blue-900">
              {t('auth.hello')}, <strong>{displayName?.split(' ')[0] || 'Utilizador'}</strong>
            </div>
          )}
          <ul className="flex flex-col gap-3 text-blue-800 font-medium">
            {user && (
              <li>
                <NavLink
                  to={`/${base}/minhas-simulacoes`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    (isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-blue-50 text-blue-900 border-blue-200") +
                    " inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <path d="M9 3h6v4H9z"/>
                    <path d="M9 12h6"/>
                    <path d="M9 16h6"/>
                  </svg>
                  {t('nav.mySimulations')}
                </NavLink>
              </li>
            )}
            {user && (
              <li>
                <NavLink
                  to={`/${base}/minhas-apolices`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    (isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-blue-50 text-blue-900 border-blue-200") +
                    " inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9.5 12.5l1.5 1.5 3.5-3.5"/>
                  </svg>
                  {t('nav.myPolicies')}
                </NavLink>
              </li>
            )}
            {/* Simulador collapsible */}
            <li>
              <details className="group">
                <summary className="cursor-pointer select-none flex items-center justify-center gap-2">
                  {t('nav.simulator')}
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                </summary>
                <div className="mt-2 ml-3">
                  <div className="text-base font-semibold text-blue-800 mb-3">{t('nav.individuals')}</div>
                  <ul className="flex flex-col gap-2 mb-3">
                    <li><NavLink to={`/${base}/simulacao-auto`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.auto')}</NavLink></li>
                    <li><NavLink to={`/${base}/simulacao-vida`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.life')}</NavLink></li>
                    <li><NavLink to={`/${base}/simulacao-saude`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.health')}</NavLink></li>
                    <li><NavLink to={`/${base}/simulacao-habitacao`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.homeInsurance')}</NavLink></li>
                  </ul>
                  <div className="text-base font-semibold text-blue-800 mb-3">{t('nav.business')}</div>
                  <ul className="flex flex-col gap-2">
                    <li><NavLink to={`/${base}/simulacao-rc-profissional`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.businessRcp')}</NavLink></li>
                    <li><NavLink to={`/${base}/simulacao-condominio`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.businessCondo')}</NavLink></li>
                    <li><NavLink to={`/${base}/produto-multirriscos-empresarial`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.businessMreb')}</NavLink></li>
                    <li><NavLink to={`/${base}/produto-frota`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.businessFleet')}</NavLink></li>
                    <li><NavLink to={`/${base}/produto-acidentes-trabalho`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.businessWork')}</NavLink></li>
                  </ul>
                </div>
              </details>
            </li>
            <li><NavLink to={`/${base}/produtos`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.products')}</NavLink></li>
            <li><NavLink to={`/${base}/contato`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>{t('nav.contact')}</NavLink></li>
            {/* Admin links for administrators */}
            {user && isAdmin && (
              <li>
                <NavLink to={`/${base}/admin/inbox`} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "font-bold text-blue-900" : "hover:text-blue-900"}>
                  {base === 'en' ? t('admin.inboxEn', { defaultValue: 'Admin Inbox' }) : t('admin.inboxPt', { defaultValue: 'Inbox Admin' })}
                </NavLink>
              </li>
            )}
            {user && (
              <li><div className="h-px bg-gray-200" /></li>
            )}
            {user && (
              <li>
                <button onClick={() => { setOpen(false); logout(); }} className="text-left text-blue-800 hover:text-blue-900">{t('auth.signOut')}</button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
