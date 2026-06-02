import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import { useIsMobile } from "../hooks/useIsMobile";
import { trackQuoteStart, trackWhatsAppClick } from "../lib/tracking";

type StatItem = { value: string; label: string };
type InfoItem = { title: string; desc: string };
type FaqItem = { q: string; a: string };

type Copy = {
  seoTitle: string;
  seoDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBullets: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  badge: string;
  instantChat: string;
  panelTitle: string;
  panelDesc: string;
  panelItems: string[];
  stats: StatItem[];
  trustTitle: string;
  trustItems: InfoItem[];
  benefitsTitle: string;
  benefits: InfoItem[];
  processTitle: string;
  processSteps: string[];
  faqTitle: string;
  faqs: FaqItem[];
  finalTitle: string;
  finalDesc: string;
  finalPrimary: string;
  finalSecondary: string;
};

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.58 2 2.14 6.44 2.14 11.9c0 1.75.46 3.46 1.33 4.97L2 22l5.27-1.38a9.8 9.8 0 0 0 4.76 1.21h.01c5.45 0 9.89-4.44 9.89-9.9a9.86 9.86 0 0 0-2.88-7.02Zm-7.01 15.24h-.01a8.14 8.14 0 0 1-4.14-1.13l-.3-.18-3.13.82.84-3.05-.2-.32a8.19 8.19 0 0 1-1.25-4.38c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.24.85 5.79 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.52-3.69 8.2-8.21 8.2Zm4.49-6.13c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.36-1.67-.14-.25-.02-.38.1-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05c0 1.21.88 2.37 1 2.54.12.17 1.72 2.62 4.16 3.68.58.25 1.03.4 1.38.51.58.18 1.11.15 1.53.09.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

function ArrowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function SparkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 14.7 8.3 21 11l-6.3 2.7L12 20l-2.7-6.3L3 11l6.3-2.7L12 2Zm7.2 15.2 1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1 1-2.6ZM5 16l1.2 3.1L9.3 20l-3.1 1.2L5 24l-1.2-2.8L.7 20l3.1-.9L5 16Z" />
    </svg>
  );
}

const copyByLang: Record<"pt" | "en", Copy> = {
  pt: {
    seoTitle: "Seguro Automóvel em Póvoa de Santa Iria",
    seoDesc:
      "Peça a sua simulação de seguro automóvel com resposta rápida em Póvoa de Santa Iria e Forte da Casa. Comparação entre seguradoras e apoio próximo.",
    heroTitle: "Seguro Auto com descontos para condutores experientes e descontos extra",
    heroSubtitle:
      "Compare seguradoras, descubra vantagens para bons condutores e receba uma proposta rápida sem compromisso.",
    heroBullets: [
      "Descontos conforme experiência e histórico",
      "Vantagens para bons condutores",
      "Comparação de coberturas e franquias",
    ],
    ctaPrimary: "Pedir simulação grátis",
    ctaSecondary: "Falar connosco",
    badge: "Simulação grátis · Resposta rápida",
    instantChat: "Conversa instantânea",
    panelTitle: "Peça a sua simulação em minutos",
    panelDesc:
      "Indicamos opções de seguro auto ajustadas ao seu perfil, ao seu carro e ao nível de proteção que procura.",
    panelItems: [
      "Desconto por experiência do condutor",
      "Coberturas ajustadas ao uso do veículo",
      "Ajuda a escolher entre preço e proteção",
    ],
    stats: [
      { value: "24h", label: "resposta habitual" },
      { value: "100%", label: "simulação gratuita" },
      { value: "Auto", label: "seguro automóvel" },
    ],
    trustTitle: "O que analisamos no seu seguro auto",
    trustItems: [
      {
        title: "Leitura correta do perfil",
        desc: "Analisamos experiência, histórico e utilização do veículo para procurar melhores condições.",
      },
      {
        title: "Vantagens para bons condutores",
        desc: "Perfis com menor sinistralidade podem conseguir propostas mais competitivas.",
      },
      {
        title: "Comparação sem complicações",
        desc: "Comparamos coberturas importantes sem complicar a decisão.",
      },
    ],
    benefitsTitle: "Vantagens no seu seguro auto",
    benefits: [
      {
        title: "Desconto pela experiência do condutor",
        desc: "Mais anos de carta e um bom histórico podem ajudar a baixar o prémio.",
      },
      {
        title: "Benefícios para bons condutores",
        desc: "Condução responsável pode traduzir-se em condições mais favoráveis e franquias ajustadas.",
      },
      {
        title: "Coberturas certas para o seu carro",
        desc: "Compare responsabilidade civil, danos próprios, vidros, assistência e proteção do condutor.",
      },
      {
        title: "Apoio também em sinistro e renovação",
        desc: "Ajudamos em alterações, renovação e apoio em caso de acidente.",
      },
    ],
    processTitle: "Como funciona",
    processSteps: [
      "Envia os dados do carro e do condutor.",
      "Comparamos opções de seguro auto para o seu perfil.",
      "Recebe uma proposta com preço, coberturas e franquias.",
      "Se quiser avançar, tratamos do resto consigo.",
    ],
    faqTitle: "Dúvidas rápidas",
    faqs: [
      {
        q: "A experiência de condução influencia o preço do seguro auto?",
        a: "Sim. Anos de carta, idade, histórico de sinistros e utilização do veículo podem influenciar o preço e as condições.",
      },
      {
        q: "Existem vantagens para bons condutores?",
        a: "Sim. Um histórico responsável pode ajudar a obter melhores condições e franquias mais equilibradas.",
      },
      {
        q: "Posso tratar tudo por WhatsApp?",
        a: "Sim. Pode enviar os primeiros dados por WhatsApp e esclarecer dúvidas rapidamente.",
      },
    ],
    finalTitle: "Compare já o seu seguro auto",
    finalDesc:
      "Descubra se o seu perfil permite melhores condições, descontos por experiência e vantagens para bons condutores.",
    finalPrimary: "Começar simulação",
    finalSecondary: "Entrar em contacto",
  },
  en: {
    seoTitle: "Car insurance in Póvoa de Santa Iria",
    seoDesc:
      "Request your car insurance quote with a fast response in Póvoa de Santa Iria and Forte da Casa. Compare insurers and get local support.",
    heroTitle: "Car insurance with discounts for experienced drivers and extra savings",
    heroSubtitle:
      "Compare insurers, unlock benefits for careful drivers and receive a fast no-obligation quote.",
    heroBullets: [
      "Discounts based on experience and history",
      "Benefits for careful drivers",
      "Comparison of cover and excess levels",
    ],
    ctaPrimary: "Get free quote",
    ctaSecondary: "Contact us",
    badge: "Free quote · Fast response",
    instantChat: "Instant chat",
    panelTitle: "Request your quote in minutes",
    panelDesc:
      "We show car insurance options matched to your profile, your car and the level of protection you want.",
    panelItems: [
      "Discount based on driver experience",
      "Cover matched to vehicle usage",
      "Help balancing price and protection",
    ],
    stats: [
      { value: "24h", label: "usual response" },
      { value: "100%", label: "free quote" },
      { value: "Auto", label: "car insurance" },
    ],
    trustTitle: "What we review in your car insurance",
    trustItems: [
      {
        title: "Accurate driver assessment",
        desc: "We assess experience, claims history and usage to look for better terms.",
      },
      {
        title: "Benefits for careful drivers",
        desc: "Lower-claim profiles may access more competitive options.",
      },
      {
        title: "Simple comparison",
        desc: "We compare the key cover options without making it complicated.",
      },
    ],
    benefitsTitle: "Car insurance advantages",
    benefits: [
      {
        title: "Discount for driver experience",
        desc: "More years licensed and a good history can help reduce the premium.",
      },
      {
        title: "Benefits for good drivers",
        desc: "Responsible driving may lead to better terms and better-adjusted excess levels.",
      },
      {
        title: "The right cover for your car",
        desc: "Compare liability, own damage, glass cover, roadside assistance and driver protection.",
      },
      {
        title: "Support for claims and renewal",
        desc: "We help with changes, renewal and support after an accident.",
      },
    ],
    processTitle: "How it works",
    processSteps: [
      "Send the car and driver details.",
      "We compare car insurance options for your profile.",
      "You receive a proposal with price, cover and excess levels.",
      "If you want to move ahead, we handle the next steps with you.",
    ],
    faqTitle: "Quick answers",
    faqs: [
      {
        q: "Does driving experience affect car insurance pricing?",
        a: "Yes. Years licensed, age, claims history and usage profile can affect price and policy terms.",
      },
      {
        q: "Are there benefits for good drivers?",
        a: "Yes. A responsible driving history can help secure better terms and a more suitable excess.",
      },
      {
        q: "Can I handle everything through WhatsApp?",
        a: "Yes. You can send the first details through WhatsApp and clarify questions quickly.",
      },
    ],
    finalTitle: "Compare your car insurance now",
    finalDesc:
      "See whether your profile qualifies for better terms, experience-based discounts and benefits for careful drivers.",
    finalPrimary: "Start quote",
    finalSecondary: "Get in touch",
  },
};

export default function LandingPovoaAuto() {
  const { lang } = useParams();
  const { search } = useLocation();
  const base = lang === "en" ? "en" : "pt";
  const copy = copyByLang[base];
  const heroImage = `${import.meta.env.BASE_URL}imagens/bg-povoa1.jpg`;
  const isMobile = useIsMobile();
  const quoteHref = `/${base}/simulacao-auto${search}`;
  const contactHref = `/${base}/contato${search}`;
  const heroBullets = isMobile ? copy.heroBullets.slice(0, 2) : copy.heroBullets;
  const stats = isMobile ? copy.stats.slice(0, 2) : copy.stats;
  const panelItems = isMobile ? copy.panelItems.slice(0, 2) : copy.panelItems;
  const trustItems = isMobile ? copy.trustItems.slice(0, 2) : copy.trustItems;
  const benefits = isMobile ? copy.benefits.slice(0, 3) : copy.benefits;
  const processSteps = isMobile ? copy.processSteps.slice(0, 3) : copy.processSteps;
  const faqs = isMobile ? copy.faqs.slice(0, 2) : copy.faqs;

  function handleQuoteStart(placement: string) {
    trackQuoteStart({
      page: 'povoa-auto',
      placement,
      language: base,
    });
  }

  function handleWhatsAppIntent(placement: string) {
    trackWhatsAppClick({
      page: 'povoa-auto',
      placement,
      language: base,
      destination: 'contact-page',
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_35%,#f8fafc_65%,#ffffff_100%)] px-2.5 py-3 pb-20 md:px-6 md:py-10 md:pb-10">
      <Seo
        title={copy.seoTitle}
        description={copy.seoDesc}
        image={heroImage}
        canonicalPath={`/${base}/povoa-auto`}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%)]" />

      <div className="mx-auto max-w-6xl overflow-hidden rounded-[26px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:rounded-[36px]">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <img src={heroImage} alt="Póvoa de Santa Iria" className="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.92),rgba(15,23,42,0.78),rgba(30,41,59,0.72))]" />
          <div className="absolute -left-16 top-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 grid gap-4 px-3 py-4 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:px-10 md:py-12">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100 shadow-lg backdrop-blur md:px-3 md:py-1.5 md:text-[11px] md:tracking-[0.18em]">
                  <SparkIcon className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{copy.badge}</span>
                </div>

                <h1 className="mt-3 max-w-3xl text-[2rem] font-black leading-[1.02] text-white md:mt-6 md:text-6xl">
                  {copy.heroTitle}
                </h1>

                <p className="mt-3 max-w-2xl text-[13px] leading-5 text-slate-200 md:mt-4 md:text-lg md:leading-8">
                  {copy.heroSubtitle}
                </p>

                <ul className="mt-4 grid gap-2 md:mt-7 md:gap-3">
                  {heroBullets.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm md:gap-3 md:px-3 md:py-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs text-emerald-300 md:h-6 md:w-6 md:text-base">
                        ✓
                      </span>
                      <span className="text-[13px] leading-5 text-slate-100 md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row md:mt-8 md:gap-3">
                  <Link
                    to={quoteHref}
                    onClick={() => handleQuoteStart('hero-primary')}
                    className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-2.5 text-center text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(16,185,129,0.28)] transition hover:scale-[1.01] hover:from-emerald-300 hover:to-teal-200 md:min-h-12 md:px-6 md:py-3 md:text-base"
                  >
                    <span>{copy.ctaPrimary}</span>
                    <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to={contactHref}
                    onClick={() => handleWhatsAppIntent('hero-secondary')}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-green-300/40 bg-green-500/15 px-5 py-2.5 text-center text-white shadow-[0_12px_32px_rgba(37,211,102,0.12)] backdrop-blur transition hover:bg-green-500/25 md:min-h-12 md:px-6 md:py-3"
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm md:h-9 md:w-9">
                        <WhatsAppIcon className="h-4 w-4 md:h-5 md:w-5" />
                      </span>
                      <span className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-bold md:text-base">{copy.ctaSecondary}</span>
                        <span className="text-xs text-green-100">{copy.instantChat}</span>
                      </span>
                    </span>
                  </Link>
                </div>
              </div>

              <div className={`mt-4 grid gap-2.5 md:mt-8 md:gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm md:px-3 md:py-3">
                    <div className="text-base font-black text-white md:text-2xl">{item.value}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-300 md:text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/20 to-white/5 blur-xl" />
              <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-white/10 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl md:rounded-[28px] md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                      {base === "pt" ? "Análise rápida" : "Quick review"}
                    </div>
                    <h2 className="mt-1.5 text-xl font-black text-white md:mt-2 md:text-3xl">{copy.panelTitle}</h2>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-right text-[11px] text-slate-200 md:px-3 md:py-2 md:text-xs">
                    <div className="font-semibold text-white">Seguro Auto</div>
                    <div>{base === "pt" ? "Simulação sem compromisso" : "No-obligation quote"}</div>
                  </div>
                </div>

                <p className="mt-3 text-[13px] leading-5 text-slate-200 md:mt-4 md:text-base md:leading-6">{copy.panelDesc}</p>

                <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
                  {panelItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/20 px-3 py-2.5 md:px-4 md:py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                        <SparkIcon className="h-4 w-4" />
                      </span>
                      <span className="text-[13px] leading-5 text-slate-100 md:text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {!isMobile && (
                  <div className="mt-6 rounded-[24px] bg-white p-4 text-slate-900 shadow-xl md:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                          {base === "pt" ? "Perfil analisado" : "Profile reviewed"}
                        </div>
                        <div className="mt-2 text-xl font-black md:text-2xl">
                          {base === "pt" ? "Preço, coberturas e benefícios em equilíbrio" : "Price, cover and benefits kept in balance"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right text-xs text-emerald-700">
                        <div className="font-bold">WhatsApp</div>
                        <div>{copy.instantChat}</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-sm font-bold text-slate-900">{base === "pt" ? "Histórico valorizado" : "History valued"}</div>
                        <div className="mt-1 text-xs text-slate-600">{base === "pt" ? "Boa experiência pode traduzir-se em melhores condições" : "Strong experience can lead to better terms"}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-sm font-bold text-slate-900">{base === "pt" ? "Cobertura ajustada" : "Tailored cover"}</div>
                        <div className="mt-1 text-xs text-slate-600">{base === "pt" ? "Escolha entre preço, assistência e proteção extra" : "Choose between price, assistance and extra protection"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {isMobile && (
                  <Link
                    to={quoteHref}
                    onClick={() => handleQuoteStart('panel-mobile')}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    {copy.finalPrimary}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-3 py-6 md:px-10 md:py-12">
          <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                {base === "pt" ? "Perfil do condutor" : "Driver profile"}
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-4xl">{copy.trustTitle}</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-5">
            {trustItems.map((item, index) => (
              <div key={item.title} className="group rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl md:rounded-[28px] md:p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white md:h-11 md:w-11">
                  0{index + 1}
                </div>
                <h3 className="mt-3 text-lg font-black text-slate-950 md:mt-4 md:text-xl">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-slate-600 md:mt-2 md:leading-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-3 py-6 md:px-10 md:py-12">
          <div className="mb-4 max-w-2xl md:mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {base === "pt" ? "Condições" : "Key terms"}
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-4xl">{copy.benefitsTitle}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {benefits.map((item, index) => (
              <div key={item.title} className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm md:rounded-[28px]">
                <div className="flex items-start gap-3 p-4 md:gap-4 md:p-6">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-base font-black text-white shadow-lg md:h-12 md:w-12 md:text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-slate-600 md:mt-2 md:leading-6">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-3 py-6 md:px-10 md:py-12">
          <div className="grid gap-6 md:grid-cols-[1fr_0.95fr] md:gap-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                {base === "pt" ? "Passos" : "Steps"}
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-4xl">{copy.processTitle}</h2>
              <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
                {processSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-sm md:gap-4 md:rounded-[26px] md:p-5">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white md:h-10 md:w-10">
                      {index + 1}
                    </div>
                    <div className="pt-0.5 text-sm leading-5 text-slate-700 md:pt-1 md:text-base md:leading-6">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 text-white shadow-[0_24px_50px_rgba(15,23,42,0.15)] md:rounded-[30px] md:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                {base === "pt" ? "Esclarecimentos" : "Clarifications"}
              </div>
              <h2 className="mt-2 text-2xl font-black md:text-4xl">{copy.faqTitle}</h2>
              <div className="mt-4 space-y-2.5 md:mt-6 md:space-y-3">
                {faqs.map((item) => (
                  <div key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm md:p-4">
                    <h3 className="font-bold text-white">{item.q}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-slate-200 md:mt-2 md:leading-6">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950 px-3 py-6 text-center text-white md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 md:px-4 md:text-xs">
              <SparkIcon className="h-3.5 w-3.5 text-emerald-300" />
              <span>{base === "pt" ? "Simulação sem compromisso" : "No-obligation quote"}</span>
            </div>
            <h2 className="mt-3 text-2xl font-black md:mt-4 md:text-5xl">{copy.finalTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:mt-4 md:text-lg md:leading-7">{copy.finalDesc}</p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row md:mt-6 md:gap-3">
              <Link
                to={quoteHref}
                onClick={() => handleQuoteStart('final-primary')}
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(16,185,129,0.28)] transition hover:scale-[1.01] hover:from-emerald-300 hover:to-teal-200 md:min-h-12 md:px-7 md:py-3 md:text-base"
              >
                <span>{copy.finalPrimary}</span>
                <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={contactHref}
                onClick={() => handleWhatsAppIntent('final-secondary')}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-green-300/40 bg-green-500/15 px-6 py-2.5 text-white transition hover:bg-green-500/25 md:min-h-12 md:px-7 md:py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm md:h-9 md:w-9">
                    <WhatsAppIcon className="h-4 w-4 md:h-5 md:w-5" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-bold md:text-base">{copy.finalSecondary}</span>
                    <span className="text-xs text-green-100">{copy.instantChat}</span>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-2.5 py-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2.5">
            <Link
              to={quoteHref}
              onClick={() => handleQuoteStart('sticky-primary')}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-2.5 text-center text-sm font-bold text-slate-950 shadow transition"
            >
              {copy.ctaPrimary}
            </Link>
            <Link
              to={contactHref}
              onClick={() => handleWhatsAppIntent('sticky-secondary')}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-center text-green-800 transition hover:bg-green-100"
            >
              <span className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                <span className="text-sm font-bold">WhatsApp</span>
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}