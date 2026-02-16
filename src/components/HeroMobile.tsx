import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HeroMobile() {
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('home');
  return (
    <section className="relative h-[320px] flex items-center justify-center bg-blue-900 md:hidden">
      <img
        src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=70"
        alt={t('heroSlides.0.title')}
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none select-none"
      />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-3xl font-extrabold mb-3 text-white drop-shadow">{t('heroSlides.0.title')}</h1>
        <p className="text-base mb-4 text-white/90">{t('heroSlides.0.text')}</p>
        <div className="flex items-center justify-center gap-3">
          <Link to={`/${base}/simulacao-auto`} className="px-4 py-3 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition-all duration-200 active:scale-[0.99]">
            {t('heroSlides.0.cta')}
          </Link>
          <Link to={`/${base}/produtos`} className="px-4 py-3 bg-white/90 text-blue-900 font-bold rounded-full shadow-lg hover:bg-white transition-all duration-200 active:scale-[0.99]">
            {t('ctaMore')}
          </Link>
        </div>
      </div>
    </section>
  );
}
