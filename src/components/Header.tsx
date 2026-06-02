import React from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { user, loading, displayName, loginWithGoogle, logout, isAdmin } = useAuth();
  const base = typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'pt';
  const { t } = useTranslation('common');
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  let brandName = 'Ansião Seguros';
  if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
  else if (host.includes('sintraseg') || host.includes('sintra')) brandName = 'Sintra Seguros';
  else if (host.includes('pombalseg') || host.includes('pombal')) brandName = 'Pombal Seguros';
  else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
  else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
  else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';
  else if (host.includes('vlxinsurance') || host.includes('vlx') || host.includes('vfx')) brandName = 'VFX Seguros';
  else if (pathname.includes('/povoa-auto')) brandName = 'Póvoa Seguros';

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logótipo ou nome do site à esquerda */}
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo-empresarial.svg`} alt={`Logo ${brandName}`} className="h-8 w-8" />
          <span className="text-lg font-semibold text-gray-800">{brandName}</span>
        </div>

        {/* Controlos à direita */}
        <div className="flex items-center gap-4">
          {/* O seu seletor de língua pode vir aqui */}
          {/* <LanguageSwitcher /> */}
          {/* Admin inbox link removed from header; available under profile menu */}

          {/* Estado de autenticação */}
          {loading ? (
            <div className="h-6 w-24 animate-pulse rounded-md bg-gray-200" />
          ) : user ? (
            <>
              <div className="flex flex-col items-end">
                <span className="hidden sm:inline text-sm text-gray-700 max-w-[180px] truncate">Olá {displayName}</span>
                {isAdmin && (
                  <Link
                    to={`/${base}/admin/inbox`}
                    className="mt-1 text-xs rounded-md bg-blue-600 px-2 py-1 font-semibold text-white shadow-sm hover:bg-blue-500"
                  >{base === 'en' ? t('admin.inboxEn', { defaultValue: 'Admin Inbox' }) : t('admin.inboxPt', { defaultValue: 'Inbox Admin' })}</Link>
                )}
              </div>
              <button
                onClick={logout}
                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
