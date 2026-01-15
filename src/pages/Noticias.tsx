import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import Seo from "../components/Seo";
import { db } from "../firebase";

export type NewsRegion = "ansiao" | "povoa" | "lisboa" | "porto" | "nacional";

export type NewsItem = {
  id?: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string; // ISO string
  region: NewsRegion;
  tags?: string[];
};

function detectRegionFromHost(host: string): NewsRegion {
  const h = host.toLowerCase();
  if (h.includes("lisboaseg") || h.includes("lisboa")) return "lisboa";
  if (h.includes("povoaseg") || h.includes("povoa")) return "povoa";
  if (h.includes("portoseg") || h.includes("porto")) return "porto";
  // aurélio e ansião caem aqui
  return "ansiao";
}

export default function Noticias() {
  const { lang } = useParams();
  const base = lang === "en" ? "en" : "pt";
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const host = typeof window !== "undefined" ? window.location.hostname : "";
        const region = detectRegionFromHost(host || "");
        const col = collection(db, "news");
        const q = query(
          col,
          where("region", "in", [region, "nacional"]),
          orderBy("publishedAt", "desc"),
          limit(30)
        );
        const snap = await getDocs(q);
        const docs: NewsItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as NewsItem;
          docs.push({ ...data, id: d.id });
        });
        setItems(docs);
      } catch (e) {
        console.error("[Noticias] Failed to load news", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const regionLabel = useMemo(() => {
    if (typeof window === "undefined") return "";
    const r = detectRegionFromHost(window.location.hostname);
    switch (r) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={lang === "en" ? "News and highlights" : "Notícias e destaques"}
        description={
          lang === "en"
            ? `Curated news and articles about the region and insurance market.`
            : `Notícias e artigos selecionados sobre a região de ${regionLabel} e o mercado segurador.`
        }
        canonicalPath={`/${base}/noticias`}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
        {lang === "en" ? "News and local highlights" : "Notícias e destaques da região"}
      </h1>
      <p className="text-blue-700 mb-6 max-w-2xl">
        {lang === "en"
          ? "This page aggregates external news links about the region and insurance topics. All articles remain on their original sources."
          : "Esta página agrega ligações para notícias externas sobre a região e temas de seguros. Os artigos permanecem sempre nos sites de origem."}
      </p>

      {loading ? (
        <div className="text-blue-700">{lang === "en" ? "Loading news…" : "A carregar notícias…"}</div>
      ) : items.length === 0 ? (
        <div className="text-blue-700">
          {lang === "en"
            ? "No news available at the moment. Please check back later."
            : "De momento não existem notícias disponíveis. Volte a consultar em breve."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.id || item.url}
              className="bg-white rounded-xl shadow border border-blue-100 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-blue-500 mb-1">
                  {new Date(item.publishedAt).toLocaleDateString(lang === "en" ? "en-GB" : "pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  {" • "}
                  {item.source}
                </div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2 line-clamp-2">{item.title}</h2>
                <p className="text-sm text-blue-800 mb-3 line-clamp-4">{item.summary}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {regionLabel}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900 underline"
                >
                  {lang === "en" ? "Read on source site" : "Ler no site de origem"}
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
