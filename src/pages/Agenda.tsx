import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import Seo from "../components/Seo";
import { db } from "../firebase";

export type AgendaRegion = "ansiao" | "povoa" | "lisboa" | "porto" | "sintra";

export type AgendaEvent = {
  id?: string;
  dateLabel: string; // ex.: "16–17 Jan"
  title: string; // ex.: "Terra de Gigantes"
  description?: string; // detalhe opcional
  sourceLabel?: string; // ex.: "cm-ansiao.pt"
};

export type AgendaDoc = {
  id?: string;
  region: AgendaRegion;
  monthKey: string; // YYYY-MM
  title: string;
  intro?: string;
  events: AgendaEvent[];
  generatedAt?: string; // ISO
};

function detectRegionFromHost(host: string): AgendaRegion {
  const h = host.toLowerCase();
  if (h.includes("sintraseg") || h.includes("sintra")) return "sintra";
  if (h.includes("lisboaseg") || h.includes("lisboa")) return "lisboa";
  if (h.includes("povoaseg") || h.includes("povoa")) return "povoa";
  if (h.includes("portoseg") || h.includes("porto")) return "porto";
  // aurélio e ansião caem aqui
  return "ansiao";
}

function getCurrentMonthKey(): { key: string; labelPt: string; labelEn: string; year: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthsPt = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const monthsEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return { key, labelPt: monthsPt[month], labelEn: monthsEn[month], year };
}

export default function Agenda() {
  const { lang } = useParams();
  const base = lang === "en" ? "en" : "pt";
  const [agenda, setAgenda] = useState<AgendaDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const { key: monthKey, labelPt, labelEn, year } = useMemo(() => getCurrentMonthKey(), []);

  useEffect(() => {
    async function load() {
      try {
        const host = typeof window !== "undefined" ? window.location.hostname : "";
        const region = detectRegionFromHost(host || "");
        const col = collection(db, "agenda");
        const q = query(col, where("region", "==", region), where("monthKey", "==", monthKey), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data() as AgendaDoc;
          setAgenda({ ...data, id: docSnap.id });
        } else {
          setAgenda(null);
        }
      } catch (e) {
        console.error("[Agenda] Failed to load agenda", e);
        setAgenda(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [monthKey]);

  const regionLabel = useMemo(() => {
    if (typeof window === "undefined") return "";
    const r = detectRegionFromHost(window.location.hostname);
    switch (r) {
      case "sintra":
        return "Sintra";
      case "lisboa":
        return "Lisboa";
      case "povoa":
        return "Póvoa de Santa Iria";
      case "porto":
        return "Porto";
      case "ansiao":
      default:
        return "Ansião (Leiria)";
    }
  }, []);

  const monthLabel = lang === "en" ? `${labelEn} ${year}` : `${labelPt} de ${year}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Seo
        title={lang === "en" ? "Local agenda" : "Agenda da região"}
        description={
          lang === "en"
            ? `Monthly agenda of events and activities in ${regionLabel}.`
            : `Agenda mensal de eventos e atividades em ${regionLabel}.`
        }
        canonicalPath={`/${base}/agenda`}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
        {lang === "en" ? "Local agenda" : "Agenda da região"}
      </h1>
      <p className="text-blue-700 mb-6 max-w-2xl">
        {lang === "en"
          ? "This page aggregates a curated agenda of local events for the current month. Please always confirm details on the official websites."
          : "Esta página apresenta uma agenda sintetizada de eventos locais para o mês atual. Confirme sempre os detalhes nos sites oficiais."}
      </p>

      <div className="bg-white rounded-xl shadow border border-blue-100 p-5">
        <div className="flex items-center gap-2 mb-3 text-blue-900">
          <span className="text-2xl" aria-hidden>
            📅
          </span>
          <h2 className="text-xl md:text-2xl font-semibold">
            {agenda?.title || (lang === "en" ? `Events in ${monthLabel}` : `Eventos previstos em ${monthLabel}`)}
          </h2>
        </div>
        <p className="text-sm md:text-base text-blue-800 mb-4">
          {agenda?.intro ||
            (lang === "en"
              ? `Overview of public events, cultural activities and sports scheduled in ${regionLabel} during ${monthLabel}.`
              : `Resumo de eventos públicos, atividades culturais e desportivas previstos em ${regionLabel} durante ${monthLabel}.`)}
        </p>

        {loading ? (
          <div className="text-blue-700 text-sm md:text-base">{lang === "en" ? "Loading agenda…" : "A carregar agenda…"}</div>
        ) : !agenda || !agenda.events || agenda.events.length === 0 ? (
          <div className="text-blue-700 text-sm md:text-base">
            {lang === "en"
              ? "There is no agenda available for this month yet."
              : "De momento ainda não existe agenda disponível para este mês."}
          </div>
        ) : (
          <ul className="space-y-2">
            {agenda.events.map((ev, idx) => (
              <li key={ev.id || idx} className="flex items-start gap-2">
                <span className="mt-1" aria-hidden>
                  📍
                </span>
                <div className="text-sm md:text-base text-blue-900">
                  <span className="font-semibold">{ev.dateLabel}</span>
                  {" — "}
                  <span className="italic">{ev.title}</span>
                  {ev.description && (
                    <span className="text-blue-800">{` — ${ev.description}`}</span>
                  )}
                  {ev.sourceLabel && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {ev.sourceLabel}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
