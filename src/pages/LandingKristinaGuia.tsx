import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";

export default function LandingKristinaGuia() {
  const { t } = useTranslation("landing_kristina");
  const { lang } = useParams();
  const { search } = useLocation();
  const base = lang === "en" ? "en" : "pt";

  const ogImage = `${import.meta.env.BASE_URL}imagens/insurance-background.jpg`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-12 px-4">
      <Seo
        title={t("guia.seoTitle")}
        description={t("guia.seoDesc")}
        image={ogImage}
        canonicalPath={`/${base}/kristin-guia`}
      />

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        <div className="p-8 border-b border-blue-50">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900">{t("guia.title")}</h1>
          <p className="mt-2 text-gray-700">{t("guia.subtitle")}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to={`/${base}/contato${search}`}
              className="inline-block px-6 py-3 bg-blue-400 text-white font-bold rounded-full shadow hover:bg-blue-300 transition text-center"
            >
              {t("guia.ctaContact")}
            </Link>
            <Link
              to={`/${base}/simulacao-habitacao${search}`}
              className="inline-block px-6 py-3 bg-blue-900 text-white font-bold rounded-full shadow hover:bg-blue-800 transition text-center"
            >
              {t("guia.ctaQuote")}
            </Link>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{t("guia.stepsTitle")}</h2>
            <div className="space-y-4">
              {([0, 1, 2, 3, 4] as const).map((idx) => (
                <div key={idx} className="bg-blue-50 rounded-xl p-5 shadow">
                  <div className="font-bold text-blue-900">{t(`guia.steps.${idx}.title`)}</div>
                  <div className="text-gray-700">{t(`guia.steps.${idx}.desc`)}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">{t("guia.disclaimer")}</p>
          </section>

          <section className="bg-white rounded-xl border border-blue-100 shadow p-6">
            <h2 className="text-xl font-bold text-blue-800">{t("guia.whatWeNeedTitle")}</h2>
            <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-2">
              {([0, 1, 2, 3] as const).map((idx) => (
                <li key={idx}>{t(`guia.whatWeNeedItems.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/${base}/kristin${search}`}
              className="inline-block px-6 py-3 bg-blue-900 text-white font-bold rounded-full shadow hover:bg-blue-800 transition text-center"
            >
              {t("guia.ctaBack")}
            </Link>
            <Link
              to={`/${base}/contato${search}`}
              className="inline-block px-6 py-3 bg-blue-400 text-white font-bold rounded-full shadow hover:bg-blue-300 transition text-center"
            >
              {t("guia.ctaContactSecondary")}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
