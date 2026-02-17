import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HeroDesktop() {
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('home');

  const stats = t('heroStats', { returnObjects: true }) as Array<{ value: string; label: string }>;
  const trustBadges = t('trustBadges', { returnObjects: true }) as string[];

  return (
    <section className="relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 anim-hero-gradient" />

      {/* Decorative floating orbs */}
      <div className="hero-orb w-[400px] h-[400px] bg-blue-500 top-[-100px] left-[-100px]" />
      <div className="hero-orb w-[300px] h-[300px] bg-indigo-400 bottom-[-80px] right-[-60px]" style={{ animationDelay: '3s' }} />
      <div className="hero-orb w-[200px] h-[200px] bg-yellow-400/40 top-[30%] right-[15%]" style={{ animationDelay: '5s' }} />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-16">
        {/* Tagline chip */}
        <div className="anim-fade-in-up inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full glass-card text-white/90 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {t('heroTagline')}
        </div>

        {/* Title */}
        <h1 className="anim-fade-in-up anim-delay-200 text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-2">
          {t('heroHeadline')}
        </h1>

        {/* Shimmer underline */}
        <div className="anim-fade-in anim-delay-400 shimmer-underline w-24 mx-auto my-4" />

        {/* Subtitle */}
        <p className="anim-fade-in-up anim-delay-400 text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t('heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="anim-fade-in-up anim-delay-600 flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            to={`/${base}/simulacao-auto`}
            className="group relative px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:shadow-yellow-400/30 hover:shadow-2xl transition-all duration-300 active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10">{t('heroCta1')}</span>
          </Link>
          <Link
            to={`/${base}/produtos`}
            className="px-8 py-4 text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
          >
            {t('heroCta2')}
          </Link>
        </div>

        {/* Stats */}
        {Array.isArray(stats) && stats.length > 0 && (
          <div className="anim-fade-in-up anim-delay-800 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-glass rounded-2xl px-4 py-5 text-center anim-count-scale" style={{ animationDelay: `${0.9 + idx * 0.15}s` }}>
                <div className="text-2xl md:text-3xl font-extrabold text-yellow-400 mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-blue-200/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trust badges */}
        {Array.isArray(trustBadges) && trustBadges.length > 0 && (
          <div className="anim-fade-in anim-delay-1000 flex flex-wrap items-center justify-center gap-3">
            {trustBadges.map((badge, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 text-white/70 text-xs font-medium">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
