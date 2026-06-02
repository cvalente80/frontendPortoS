type TrackingParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const env = import.meta.env;

const gtmId = env.VITE_GOOGLE_TAG_MANAGER_ID as string | undefined;
const ga4Id = env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const adsId = env.VITE_GOOGLE_ADS_CONVERSION_ID as string | undefined;

const quoteStartLabel = env.VITE_GOOGLE_ADS_LABEL_QUOTE_START as string | undefined;
const whatsappClickLabel = env.VITE_GOOGLE_ADS_LABEL_WHATSAPP_CLICK as string | undefined;
const generateLeadLabel = env.VITE_GOOGLE_ADS_LABEL_GENERATE_LEAD as string | undefined;
const phoneClickLabel = env.VITE_GOOGLE_ADS_LABEL_PHONE_CLICK as string | undefined;

let trackingInitialized = false;

function ensureDataLayer() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
}

function appendScript(src: string) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function appendInlineScript(id: string, code: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.innerHTML = code;
  document.head.appendChild(script);
}

function pushDataLayer(eventName: string, params: TrackingParams = {}) {
  if (typeof window === 'undefined') return;
  ensureDataLayer();
  window.dataLayer.push({ event: eventName, ...params });
}

function fireAdsConversion(label: string | undefined, params: TrackingParams = {}) {
  if (!label || !adsId || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: `${adsId}/${label}`,
    ...params,
  });
}

export function initGoogleTracking() {
  if (trackingInitialized || typeof window === 'undefined') return;
  ensureDataLayer();

  if (gtmId) {
    appendInlineScript(
      'gtm-bootstrap',
      `window.dataLayer = window.dataLayer || [];window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});`
    );
    appendScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`);
    trackingInitialized = true;
    return;
  }

  const firstTagId = ga4Id || adsId;
  if (!firstTagId) {
    trackingInitialized = true;
    return;
  }

  appendScript(`https://www.googletagmanager.com/gtag/js?id=${firstTagId}`);
  appendInlineScript(
    'gtag-bootstrap',
    `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
    `
  );

  if (typeof window.gtag === 'function') {
    if (ga4Id) window.gtag('config', ga4Id, { send_page_view: false });
    if (adsId) window.gtag('config', adsId);
  }

  trackingInitialized = true;
}

export function trackEvent(eventName: string, params: TrackingParams = {}) {
  pushDataLayer(eventName, params);
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackPageView(path: string, title?: string, language?: string) {
  const params = {
    page_path: path,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    language,
  };
  pushDataLayer('page_view', params);
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', params);
  }
}

export function trackQuoteStart(params: TrackingParams = {}) {
  trackEvent('quote_start', params);
  fireAdsConversion(quoteStartLabel, params);
}

export function trackWhatsAppClick(params: TrackingParams = {}) {
  trackEvent('whatsapp_click', params);
  fireAdsConversion(whatsappClickLabel, params);
}

export function trackPhoneClick(params: TrackingParams = {}) {
  trackEvent('phone_click', params);
  fireAdsConversion(phoneClickLabel, params);
}

export function trackLead(params: TrackingParams = {}) {
  trackEvent('generate_lead', params);
  fireAdsConversion(generateLeadLabel, params);
}
