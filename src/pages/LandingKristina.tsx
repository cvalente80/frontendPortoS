import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";

export default function LandingKristina() {
  const { t } = useTranslation("landing_kristina");
  const { lang } = useParams();
  const { search } = useLocation();
  const base = lang === "en" ? "en" : "pt";

  const ogImage = `${import.meta.env.BASE_URL}imagens/insurance-background.jpg`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-12 px-4">
      <Seo
        title={t("kristina.seoTitle")}
        description={t("kristina.seoDesc")}
        image={ogImage}
        canonicalPath={`/${base}/kristin`}
      />

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        <div className="relative h-56 md:h-80 w-full flex items-center justify-center bg-blue-900">
          <img
            src={ogImage}
            alt={t("kristina.heroAlt")}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative z-10 text-center w-full px-6">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow mb-3">
              {t("kristina.heroTitle")}
            </h1>
            <p className="text-base md:text-lg text-blue-100 font-medium mb-5">
              {t("kristina.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/${base}/simulacao-habitacao${search}`}
                className="inline-block px-8 py-3 bg-blue-400 text-white font-bold rounded-full shadow-lg hover:bg-blue-300 transition"
              >
                {t("kristina.ctaQuote")}
              </Link>
              <Link
                to={`/${base}/contato${search}`}
                className="inline-block px-8 py-3 bg-blue-400 text-white font-bold rounded-full shadow-lg hover:bg-blue-300 transition"
              >
                {t("kristina.ctaContact")}
              </Link>
            </div>
            <p className="mt-4 text-xs md:text-sm text-blue-100/90">
              {t("kristina.emergencyNote")}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{t("kristina.section1Title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([0, 1, 2, 3] as const).map((idx) => (
                <div key={idx} className="bg-blue-50 rounded-xl p-5 shadow flex gap-3 items-start">
                  <span className="text-blue-700 text-2xl">{t(`kristina.section1Items.${idx}.icon`)}</span>
                  <div>
                    <div className="font-bold text-blue-900">{t(`kristina.section1Items.${idx}.title`)}</div>
                    <div className="text-gray-700">{t(`kristina.section1Items.${idx}.desc`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{t("kristina.section2Title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([0, 1, 2, 3] as const).map((idx) => (
                <div key={idx} className="bg-white rounded-xl border border-blue-100 shadow p-5">
                  <h3 className="font-bold text-blue-700 mb-1">{t(`kristina.section2Items.${idx}.title`)}</h3>
                  <p className="text-gray-700">{t(`kristina.section2Items.${idx}.desc`)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">{t("kristina.coverageDisclaimer")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{t("kristina.section3Title")}</h2>
            <ol className="list-decimal pl-6 text-blue-900 text-lg space-y-2">
              {([0, 1, 2, 3] as const).map((idx) => (
                <li key={idx}>{t(`kristina.section3Steps.${idx}`)}</li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/${base}/kristin-guia${search}`}
                className="inline-block px-6 py-3 bg-blue-900 text-white font-bold rounded-full shadow hover:bg-blue-800 transition text-center"
              >
                {t("kristina.ctaGuide")}
              </Link>
              <Link
                to={`/${base}/simulacao-habitacao${search}`}
                className="inline-block px-6 py-3 bg-blue-400 text-white font-bold rounded-full shadow hover:bg-blue-300 transition text-center"
              >
                {t("kristina.ctaQuoteSecondary")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
