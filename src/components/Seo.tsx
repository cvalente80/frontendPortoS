import React, { useEffect } from 'react';
import i18n from '../i18n';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  canonicalPath?: string; // e.g. "/produto-frota"
  noIndex?: boolean;
  structuredData?: object | object[];
};

const DEFAULT_IMAGE = `${import.meta.env.BASE_URL}logo-empresarial.svg`;

function siteBase(): string | null {
  const fromEnv = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const base = (import.meta as any).env?.BASE_URL || '/';
    const baseNormalized = base.startsWith('/') ? base : `/${base}`;
    return `${window.location.origin}${baseNormalized.replace(/\/$/, '')}`;
  }
  return null;
}

function upsertMetaByName(name: string, content: string | undefined) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProp(property: string, content: string | undefined) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string | undefined) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, image, canonicalPath, noIndex, structuredData }: SeoProps) {
  useEffect(() => {
    // language
    const lang = i18n.language === 'en' ? 'en' : 'pt';
    document.documentElement.lang = lang;

    // Brand and location by domain
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    let brandName = 'Ansião Seguros';
    let cityDesc = 'Ansião (Leiria)';
    let addressLocality = 'Ansião';
    let addressRegion = 'Leiria';
    if (host.includes('aurelio')) {
      brandName = 'Aurélio Seguros';
      cityDesc = 'Ansião (Leiria)';
      addressLocality = 'Ansião';
      addressRegion = 'Leiria';
    } else if (host.includes('povoaseg') || host.includes('povoa')) {
      brandName = 'Póvoa Seguros';
      cityDesc = 'Póvoa de Santa Iria (Vila Franca de Xira)';
      addressLocality = 'Póvoa de Santa Iria';
      addressRegion = 'Lisboa';
    } else if (host.includes('lisboaseg') || host.includes('lisboa')) {
      brandName = 'Lisboa Seguros';
      cityDesc = 'Lisboa';
      addressLocality = 'Lisboa';
      addressRegion = 'Lisboa';
    } else if (host.includes('portoseg') || host.includes('porto')) {
      brandName = 'Porto Seguros';
      cityDesc = 'Porto';
      addressLocality = 'Porto';
      addressRegion = 'Porto';
    }

    const base = siteBase();
    let resolvedTitle = title ? `${brandName} | ${title}` : brandName;
    // Normalizar cidade dentro do título caso a tradução ainda refira Ansião
    resolvedTitle = resolvedTitle
      .replace(/Ansião \(Leiria\)/g, cityDesc)
      .replace(/Ansião/g, cityDesc);

    const rawDesc = description || `${brandName} — Seguros Auto, Vida, Saúde, Habitação e soluções empresariais em ${cityDesc}. Simulações e propostas personalizadas.`;
    const desc = rawDesc
      .replace(/Ansião Seguros/g, brandName)
      .replace(/Ansião \(Leiria\)/g, cityDesc)
      .replace(/Ansião/g, cityDesc);
    const img = image || DEFAULT_IMAGE;
    const url = (() => {
      if (!base) return undefined;
      if (canonicalPath) {
        const path = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
        return `${base}${path}`;
      }
      return typeof window !== 'undefined' ? `${base}${window.location.pathname}${window.location.search}` : undefined;
    })();

    // Derive localized alternates from current/canonical path
    const { altPt, altEn } = (() => {
      if (!base) return { altPt: undefined as string | undefined, altEn: undefined as string | undefined };
      const currentPath = canonicalPath
        ? (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`)
        : (typeof window !== 'undefined' ? window.location.pathname : '/');
      // Expect paths like /pt/... or /en/...; normalize suffix after lang segment
      const segs = currentPath.split('/').filter(Boolean);
      const maybeLang = segs[0];
      const suffix = (maybeLang === 'pt' || maybeLang === 'en') ? `/${segs.slice(1).join('/')}` : `/${segs.join('/')}`;
      const normalizedSuffix = suffix === '/' ? '' : suffix;
      return {
        altPt: `${base}/pt${normalizedSuffix}`,
        altEn: `${base}/en${normalizedSuffix}`,
      };
    })();

    // Title
    document.title = resolvedTitle;
    // Meta
    upsertMetaByName('description', desc);
    if (noIndex) upsertMetaByName('robots', 'noindex,nofollow');

    // Open Graph
    if (url) upsertMetaByProp('og:url', url);
    upsertMetaByProp('og:type', 'website');
    upsertMetaByProp('og:site_name', brandName);
    upsertMetaByProp('og:locale', lang === 'en' ? 'en_GB' : 'pt_PT');
    upsertMetaByProp('og:locale:alternate', lang === 'en' ? 'pt_PT' : 'en_GB');
    upsertMetaByProp('og:title', resolvedTitle);
    upsertMetaByProp('og:description', desc);
    upsertMetaByProp('og:image', img);

    // Twitter
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', resolvedTitle);
    upsertMetaByName('twitter:description', desc);
    upsertMetaByName('twitter:image', img);

    // Canonical
    if (url) upsertLink('canonical', url);

    // hreflang alternates: clean previous ones we created, then add fresh
    const oldAlts = Array.from(document.head.querySelectorAll('link[data-seo-hreflang="true"]')) as HTMLLinkElement[];
    oldAlts.forEach(n => n.parentElement?.removeChild(n));
    const addAlt = (href: string | undefined, hreflang: string) => {
      if (!href) return;
      const l = document.createElement('link');
      l.setAttribute('rel', 'alternate');
      l.setAttribute('hreflang', hreflang);
      l.setAttribute('href', href);
      l.setAttribute('data-seo-hreflang', 'true');
      document.head.appendChild(l);
    };
    addAlt(altPt, 'pt-PT');
    addAlt(altEn, 'en-GB');
    // x-default → prefer Portuguese site as default
    addAlt(altPt, 'x-default');

    // Structured data: remove old ones we created then add fresh ones
    const old = Array.from(document.head.querySelectorAll('script[data-seo-jsonld="true"]'));
    old.forEach(n => n.parentElement?.removeChild(n));
    const baseJsonLd: object[] = [];
    // Organization and Website schema as safe defaults across pages
    if (base) {
      baseJsonLd.push(
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brandName,
          url: base,
          logo: `${import.meta.env.BASE_URL}logo-empresarial.svg`,
          address: {
            "@type": "PostalAddress",
            addressLocality,
            addressRegion,
            addressCountry: "PT"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: brandName,
          url: base,
          inLanguage: lang === 'en' ? 'en-GB' : 'pt-PT',
          potentialAction: {
            "@type": "SearchAction",
            target: `${base}/?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }
      );
    }
    const list = [
      ...baseJsonLd,
      ...(Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : []),
    ];
    for (const obj of list) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-seo-jsonld', 'true');
      s.text = JSON.stringify(obj);
      document.head.appendChild(s);
    }
  }, [title, description, image, canonicalPath, noIndex, structuredData, i18n.language]);

  return null;
}

