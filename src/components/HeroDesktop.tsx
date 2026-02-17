import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const slides: Array<{ imagem: string; link: string }> = [
  {
    imagem: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80',
    link: 'simulacao-auto'
  },
  {
    imagem: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=80',
    link: 'simulacao-vida'
  },
  {
    imagem: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    link: 'simulacao-habitacao'
  },
];

export default function HeroDesktop() {
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { t } = useTranslation('home');
  return (
    <section className="relative h-[400px] flex items-center justify-center bg-blue-900">
      <Swiper
        className="w-full h-full"
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        loop
        navigation
        modules={[Navigation, Autoplay]}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative h-[400px] flex items-center justify-center">
              <img src={slide.imagem} alt={t(`heroSlides.${idx}.title`)} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none select-none" />
              <div className="relative z-10 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow">{t(`heroSlides.${idx}.title`)}</h1>
                <p className="text-xl mb-6 text-white max-w-2xl mx-auto">{t(`heroSlides.${idx}.text`)}</p>
                <Link
                  to={`/${base}/${slide.link}`}
                  aria-label={t(`heroSlides.${idx}.cta`)}
                  className={
                    idx === 0
                      ? 'px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition-all duration-200 active:scale-[0.99]'
                      : idx === 1
                        ? 'px-8 py-4 bg-green-400 text-blue-900 font-bold rounded-full shadow-lg hover:bg-green-300 transition-all duration-200 active:scale-[0.99]'
                        : 'px-8 py-4 bg-blue-400 text-white font-bold rounded-full shadow-lg hover:bg-blue-300 transition-all duration-200 active:scale-[0.99]'
                  }
                >
                  {t(`heroSlides.${idx}.cta`)}
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
