import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HeroMobile() {
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('home');

  const stats = t('heroStats', { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="relative min-h-[480px] flex flex-col items-center justify-center overflow-hidden md:hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 anim-hero-gradient" />

      {/* Floating orbs */}
      <div className="hero-orb w-[200px] h-[200px] bg-blue-500 top-[-50px] left-[-50px]" />
      <div className="hero-orb w-[150px] h-[150px] bg-indigo-400 bottom-[-40px] right-[-30px]" style={{ animationDelay: '3s' }} />

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-5 py-10">
        {/* Tagline chip */}
        <div className="anim-fade-in-up inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full glass-card text-white/90 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t('heroTagline')}
        </div>

        {/* Title */}
        <h1 className="anim-fade-in-up anim-delay-200 text-3xl font-extrabold text-white leading-tight mb-2">
          {t('heroHeadline')}
        </h1>

        {/* Shimmer underline */}
        <div className="anim-fade-in anim-delay-300 shimmer-underline w-16 mx-auto my-3" />

        {/* Subtitle */}
        <p className="anim-fade-in-up anim-delay-400 text-base text-blue-100/90 mb-6 leading-relaxed">
          {t('heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="anim-fade-in-up anim-delay-500 flex items-center justify-center gap-3 mb-8">
          <Link
            to={`/${base}/simulacao-auto`}
            className="px-5 py-3 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition-all duration-200 active:scale-[0.98] text-sm"
          >
            {t('heroCta1')}
          </Link>
          <Link
            to={`/${base}/produtos`}
            className="px-5 py-3 text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all duration-200 active:scale-[0.98] text-sm"
          >
            {t('heroCta2')}
          </Link>
        </div>

        {/* Stats — 2 columns on mobile */}
        {Array.isArray(stats) && stats.length > 0 && (
          <div className="anim-fade-in-up anim-delay-700 grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-glass rounded-xl px-3 py-3 text-center">
                <div className="text-xl font-extrabold text-yellow-400 mb-0.5">{stat.value}</div>
                <div className="text-[11px] text-blue-200/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
