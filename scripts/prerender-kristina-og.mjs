#!/usr/bin/env node
/*
  Prerender static HTML entrypoints for social crawlers (Facebook, etc.).
  GitHub Pages serves these route-specific index.html files directly.

  Usage:
    SITE_URL=https://ansiaoseguros.pt node scripts/prerender-kristina-og.mjs
*/

import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

function normalizeSiteUrl(input) {
  if (!input) return null;
  return input.replace(/\/$/, '');
}

const siteUrl =
  normalizeSiteUrl(process.env.SITE_URL) ||
  normalizeSiteUrl(process.env.VITE_SITE_URL) ||
  'https://ansiaoseguros.pt';

function brandNameForHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (host.includes('aurelio')) return 'Aurélio Seguros';
  if (host.includes('sintraseg') || host.includes('sintra')) return 'Sintra Seguros';
  if (host.includes('pombalseg') || host.includes('pombal')) return 'Pombal Seguros';
  if (host.includes('povoaseg') || host.includes('povoa')) return 'Póvoa Seguros';
  if (host.includes('lisboaseg') || host.includes('lisboa')) return 'Lisboa Seguros';
  if (host.includes('portoseg') || host.includes('porto')) return 'Porto Seguros';
  return 'Ansião Seguros';
}

let brandName = 'Ansião Seguros';
try {
  brandName = brandNameForHost(new URL(siteUrl).hostname);
} catch {
  // keep default
}

const ogImagePath = '/imagens/insurance-background.jpg';
const ogImageAbs = `${siteUrl}${ogImagePath}`;

const routes = [
  {
    outDir: 'pt/kristin',
    title: `${brandName} | Depressão Kristin — Multirriscos Habitação`,
    description:
      'Apoio rápido, orientação e simulação de Multirriscos Habitação para reforçar a proteção do seu lar.',
    canonical: `${siteUrl}/pt/kristin`,
    locale: 'pt_PT',
    localeAlt: 'en_GB'
  },
  {
    outDir: 'pt/kristin-guia',
    title: `${brandName} | Guia pós-tempestade — Depressão Kristin`,
    description:
      'Checklist rápido para agir após danos e preparar o contacto com a seguradora.',
    canonical: `${siteUrl}/pt/kristin-guia`,
    locale: 'pt_PT',
    localeAlt: 'en_GB'
  },
  {
    outDir: 'en/kristin',
    title: `${brandName} | Storm Kristin — Home Insurance`,
    description:
      'Fast support, guidance and a home insurance quote to strengthen protection for your home.',
    canonical: `${siteUrl}/en/kristin`,
    locale: 'en_GB',
    localeAlt: 'pt_PT'
  },
  {
    outDir: 'en/kristin-guia',
    title: `${brandName} | Post-storm guide — Storm Kristin`,
    description: 'Quick checklist to act after damage and prepare your insurer contact.',
    canonical: `${siteUrl}/en/kristin-guia`,
    locale: 'en_GB',
    localeAlt: 'pt_PT'
  }
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function injectOrReplaceMeta(html, key, value, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const pattern = new RegExp(
    `<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*\\/?>(\\s*)`,
    'i'
  );
  const metaTag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  if (pattern.test(html)) return html.replace(pattern, `${metaTag}$1`);
  return html.replace(/<\/head>/i, `  ${metaTag}\n</head>`);
}

function injectOrReplaceCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>(\s*)/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  if (pattern.test(html)) return html.replace(pattern, `${tag}$1`);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function injectOrReplaceTitle(html, title) {
  if (/<title>.*?<\/title>/is.test(html)) {
    return html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function absolutizeBaseUrlPlaceholders(html) {
  // Convert %BASE_URL%... placeholders to absolute URLs for crawlers.
  return html.replaceAll('%BASE_URL%', `${siteUrl}/`);
}

async function main() {
  const baseIndexPath = path.join(distDir, 'index.html');
  let baseHtml;
  try {
    baseHtml = await fs.readFile(baseIndexPath, 'utf8');
  } catch {
    console.error(`prerender-kristina-og: missing ${baseIndexPath}. Run build first.`);
    process.exit(1);
  }

  for (const r of routes) {
    let html = baseHtml;
    html = absolutizeBaseUrlPlaceholders(html);

    html = injectOrReplaceTitle(html, r.title);
    html = injectOrReplaceMeta(html, 'description', r.description, false);

    // Open Graph
    html = injectOrReplaceMeta(html, 'og:site_name', brandName, true);
    html = injectOrReplaceMeta(html, 'og:type', 'website', true);
    html = injectOrReplaceMeta(html, 'og:url', r.canonical, true);
    html = injectOrReplaceMeta(html, 'og:title', r.title, true);
    html = injectOrReplaceMeta(html, 'og:description', r.description, true);
    html = injectOrReplaceMeta(html, 'og:image', ogImageAbs, true);
    html = injectOrReplaceMeta(html, 'og:locale', r.locale, true);
    html = injectOrReplaceMeta(html, 'og:locale:alternate', r.localeAlt, true);

    // Twitter
    html = injectOrReplaceMeta(html, 'twitter:card', 'summary_large_image', false);
    html = injectOrReplaceMeta(html, 'twitter:title', r.title, false);
    html = injectOrReplaceMeta(html, 'twitter:description', r.description, false);
    html = injectOrReplaceMeta(html, 'twitter:image', ogImageAbs, false);

    // Canonical
    html = injectOrReplaceCanonical(html, r.canonical);

    const outPath = path.join(distDir, r.outDir, 'index.html');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, 'utf8');
  }

  console.log(`prerender-kristina-og: wrote ${routes.length} HTML entrypoints (SITE_URL=${siteUrl})`);
}

main();
