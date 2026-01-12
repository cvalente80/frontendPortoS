import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';

export function DesktopNav() {
  const { t } = useTranslation('common');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { user, loading, displayName, loginWithGoogle, logout, isAdmin } = useAuth();
  const { openAuth } = useAuthUX();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  let brandName = 'Ansião Seguros';
  if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
  else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
  else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
  else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';

  // Close profile menu on outside click or Escape
  useEffect(() => {
    function onDocPointer(e: MouseEvent | TouchEvent) {
      if (!profileOpen) return;
      const el = profileRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (!profileOpen) return;
      if (e.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDocPointer, true);
    document.addEventListener('touchstart', onDocPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDocPointer, true);
      document.removeEventListener('touchstart', onDocPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [profileOpen]);
  function resetFloatingWidgets() {
    try {
      localStorage.removeItem('chat:hideWhatsApp');
      localStorage.removeItem('chat:hideChatButton');
    } catch {}
    window.dispatchEvent(new CustomEvent('chat:resetFloating'));
  }
  return (
    <nav className="bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <NavLink to={`/${base}`} className="flex items-center gap-2 shrink-0" onClick={resetFloatingWidgets}>
        <img src={`${import.meta.env.BASE_URL}logo-empresarial.svg`} alt="Logo Ansião Seguros" className="h-10 w-10 xl:h-12 xl:w-12" />
  <span className="text-2xl xl:text-3xl font-bold text-blue-900 hover:text-blue-700 whitespace-nowrap">{brandName}</span>
      </NavLink>
      <div className="hidden md:flex items-center gap-4 xl:gap-6 text-blue-700 font-medium text-sm xl:text-base">
        {/* Dropdown Simulador */}
        <div className="relative group">
          <button className="whitespace-nowrap hover:text-blue-900 inline-flex items-center gap-1 focus:outline-none" aria-haspopup="true">
            {t('nav.simulator')}
            <svg className="w-4 h-4 text-current" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="absolute left-0 top-full min-w-[34rem] w-[40rem] max-w-[80vw] rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 opacity-0 scale-95 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition duration-150 ease-out p-4 z-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-800 text-left">
              <div>
                <div className="pl-3 pt-1 pb-2 text-left text-[11px] uppercase tracking-wider text-blue-400">{t('nav.individuals')}</div>
                <NavLink to={`/${base}/simulacao-auto`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13l2-2 4-2 6 0 4 2 2 2"/><path d="M5 16h14"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>
                  {t('nav.auto')}
                </NavLink>
                <NavLink to={`/${base}/simulacao-vida`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {t('nav.life')}
                </NavLink>
                <NavLink to={`/${base}/simulacao-saude`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {t('nav.health')}
                </NavLink>
                <NavLink to={`/${base}/simulacao-habitacao`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9"/><path d="M9 21V9h6v12"/></svg>
                  {t('nav.homeInsurance')}
                </NavLink>
              </div>
              <div>
                <div className="pl-3 pt-1 pb-2 text-left text-[11px] uppercase tracking-wider text-blue-400">{t('nav.business')}</div>
                <NavLink to={`/${base}/simulacao-rc-profissional`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  {t('nav.businessRcp')}
                </NavLink>
                <NavLink to={`/${base}/simulacao-condominio`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M6 21V8h4v13"/><path d="M14 21V4h4v17"/></svg>
                  {t('nav.businessCondo')}
                </NavLink>
                <NavLink to={`/${base}/produto-multirriscos-empresarial`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H4z"/><path d="M2 20h20"/></svg>
                  {t('nav.businessMreb')}
                </NavLink>
                <NavLink to={`/${base}/produto-frota`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13l2-2 4-2h6l4 2 2 2"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>
                  {t('nav.businessFleet')}
                </NavLink>
                <NavLink to={`/${base}/produto-acidentes-trabalho`} className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14a8 8 0 0 1 16 0"/>
                    <path d="M2 14h20"/>
                    <path d="M12 6v2"/>
                    <path d="M6 18h12"/>
                  </svg>
                  {t('nav.businessWork')}
                </NavLink>
              </div>
            </div>
          </div>
        </div>
        <NavLink to={`/${base}/produtos`} className={({ isActive }) => (isActive ? "border-b-2 border-blue-900 text-blue-900 font-bold" : "hover:text-blue-900") + " whitespace-nowrap"}>{t('nav.products')}</NavLink>
        <NavLink to={`/${base}/contato`} className={({ isActive }) => (isActive ? "border-b-2 border-blue-900 text-blue-900 font-bold" : "hover:text-blue-900") + " whitespace-nowrap"}>{t('nav.contact')}</NavLink>
        {/* Admin inbox link removed from main nav; available under profile menu */}
        {user && (
          <NavLink
            to={`/${base}/minhas-simulacoes`}
            className={({ isActive }) =>
              (isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100") +
              " whitespace-nowrap inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
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
        )}
        {/* Admin inbox pill removed from top navigation */}
        {user && (
          <NavLink
            to={`/${base}/minhas-apolices`}
            className={({ isActive }) =>
              (isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100") +
              " whitespace-nowrap inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9.5 12.5l1.5 1.5 3.5-3.5"/>
            </svg>
            {t('nav.myPolicies')}
          </NavLink>
        )}
        <LanguageSwitcher />

        {/* Perfil / Autenticação */}
        {loading ? (
          <div className="h-9 w-28 animate-pulse rounded-full bg-gray-200" />
        ) : user ? (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              aria-label="Conta"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="relative flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-900 hover:bg-blue-100 focus:outline-none"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {/* Online/active dot */}
              <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" aria-hidden="true" />
              <span className="hidden xl:inline">{t('auth.hello')}, {displayName?.split(' ')[0] || 'Utilizador'}</span>
            </button>
            <div
              role="menu"
              aria-hidden={!profileOpen}
              className={
                `absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg transition duration-150 ease-out p-2 z-50 ` +
                (profileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none')
              }
            >
              <div className="flex flex-col text-blue-800">
                <NavLink
                  to={`/${base}/minhas-simulacoes`}
                  onClick={() => setProfileOpen(false)}
                  className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " rounded px-3 py-2"}
                >
                  {t('nav.mySimulations')}
                </NavLink>
                <NavLink
                  to={`/${base}/minhas-apolices`}
                  onClick={() => setProfileOpen(false)}
                  className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " rounded px-3 py-2"}
                >
                  {t('nav.myPolicies')}
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to={`/${base}/admin/inbox`}
                    onClick={() => setProfileOpen(false)}
                    className={({ isActive }) => (isActive ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 hover:text-blue-900") + " rounded px-3 py-2"}
                  >
                    {base === 'en' ? t('admin.inboxEn', { defaultValue: 'Admin Inbox' }) : t('admin.inboxPt', { defaultValue: 'Inbox Admin' })}
                  </NavLink>
                )}
                <div className="my-1 h-px bg-gray-200" />
                <button onClick={() => { setProfileOpen(false); logout(); }} className="text-left rounded px-3 py-2 hover:bg-gray-50 hover:text-blue-900">{t('auth.signOut')}</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={openAuth}
            className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-blue-900 hover:bg-blue-50 focus:outline-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="hidden xl:inline">{t('auth.loginCta')}</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default DesktopNav;
