import React, { useMemo, useState } from "react";
import Seo from "../components/Seo";
import emailjs from "@emailjs/browser";
import { EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, EMAILJS_USER_ID_GENERIC } from "../emailjs.config";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

type FormState = {
  nome: string;
  email: string;
  telefone?: string;
  tipoPedido: string;
  produtoInteresse: string;
  assunto?: string;
  mensagem: string;
  aceitaRgpd: boolean;
};

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

function sanitizeTemplateParams(params: Record<string, any>) {
  const out: Record<string,string> = {};
  for (const [k,v] of Object.entries(params)) {
    if (v === undefined || v === null) { out[k] = ""; continue; }
    if (typeof v === 'string') { out[k] = v; continue; }
    try { out[k] = JSON.stringify(v); }
    catch { out[k] = String(v); }
  }
  return out;
}

export default function Contato() {
  const { t } = useTranslation('contact');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isPovoa = host.includes('povoaseg') || host.includes('povoa');
  const isLisboa = host.includes('lisboaseg') || host.includes('lisboa');
  const isPorto = host.includes('portoseg') || host.includes('porto');
  const mapQuery = isLisboa
    ? 'Lisboa, Portugal'
    : isPovoa
      ? 'Póvoa de Santa Iria, Portugal'
      : isPorto
        ? 'Porto, Portugal'
        : 'Ansião, Leiria, Portugal';
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=${base === 'en' ? 'en' : 'pt-PT'}&z=13&output=embed`;
  const mapLink = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;
  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    telefone: "",
    tipoPedido: t('requestType.info'),
    produtoInteresse: "",
    assunto: "",
    mensagem: "",
    aceitaRgpd: false,
  });
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string>("");
  const [mensagemTipo, setMensagemTipo] = useState<'sucesso'|'erro'|''>("");

  const canSubmit = useMemo(()=>{
    return !!form.nome && !!form.email && !!form.mensagem && form.aceitaRgpd && !enviando;
  }, [form, enviando]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const target = e.target as HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement;
    const { name, value } = target;
    setMensagem(""); setMensagemTipo("");
    if ((target as HTMLInputElement).type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (target as HTMLInputElement).checked } as FormState));
    } else if (name === 'telefone') {
      // permitir +, espaços e dígitos
      const v = value.replace(/[^+0-9\s]/g, '').slice(0, 20);
      setForm(prev => ({ ...prev, telefone: v }));
    } else {
      setForm(prev => ({ ...prev, [name]: value } as FormState));
    }
  };

  const setCustomValidity = (e: React.FormEvent<any>, message: string) => {
    (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).setCustomValidity(message);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setEnviando(true);
    setMensagem(""); setMensagemTipo("");

  const tipoSeguro = form.produtoInteresse ? t('email.typeWithProduct', { product: form.produtoInteresse }) : t('email.typePrefix');
  const subjectEmail = `${t('email.subjectPrefix')}${form.tipoPedido}`;

    const resumo = [
      `${t('labels.name')}: ${form.nome}`,
      `${t('labels.email')}: ${form.email}`,
      form.telefone ? `${t('labels.phone')}: ${form.telefone}` : null,
      `${t('labels.requestType')}: ${form.tipoPedido}`,
      form.produtoInteresse ? `${t('labels.productInterest')}: ${form.produtoInteresse}` : null,
      form.assunto ? `${t('labels.subject')}: ${form.assunto}` : null,
      `${t('labels.message')}: ${form.mensagem}`
    ].filter(Boolean).join('\n');

    const detalhes_html = `
      <h4 style="margin:12px 0 6px;">${t('labels.contactDataTitle')}</h4>
      <table style="border-collapse:collapse;width:100%">
        <tbody>
          <tr><td><b>${t('labels.name')}</b></td><td>${form.nome}</td></tr>
          <tr><td><b>${t('labels.email')}</b></td><td>${form.email}</td></tr>
          ${form.telefone ? `<tr><td><b>${t('labels.phone')}</b></td><td>${form.telefone}</td></tr>` : ''}
        </tbody>
      </table>
      <h4 style="margin:12px 0 6px;">${t('labels.requestTitle')}</h4>
      <table style="border-collapse:collapse;width:100%">
        <tbody>
          <tr><td><b>${t('labels.requestType')}</b></td><td>${form.tipoPedido}</td></tr>
          ${form.produtoInteresse ? `<tr><td><b>${t('labels.productInterest')}</b></td><td>${form.produtoInteresse}</td></tr>` : ''}
          ${form.assunto ? `<tr><td><b>${t('labels.subject')}</b></td><td>${form.assunto}</td></tr>` : ''}
          <tr><td style="vertical-align:top"><b>${t('labels.message')}</b></td><td>${form.mensagem.replace(/\n/g,'<br/>')}</td></tr>
        </tbody>
      </table>
    `;

    const templateParams = sanitizeTemplateParams({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone || '',
      tipoSeguro,
      subjectEmail,
      resultado: resumo,
      detalhes_html,
    });

    if (isDev) {
      console.debug('[EmailJS][Contato] Params keys:', Object.keys(templateParams));
      console.debug('[EmailJS][Contato] detalhes_html length:', templateParams.detalhes_html?.length);
    }

    emailjs
      .send(EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, templateParams, EMAILJS_USER_ID_GENERIC)
      .then(() => {
        setMensagem(t('messages.success'));
        setMensagemTipo('sucesso');
        setForm({ nome: '', email: '', telefone: '', tipoPedido: t('requestType.info'), produtoInteresse: '', assunto: '', mensagem: '', aceitaRgpd: false });
      })
      .catch(async (err) => {
        console.error('[EmailJS][Contato] send error:', err);
        const status = (err && typeof err === 'object' && 'status' in err) ? (err as any).status : undefined;
        const shouldFallback = status === 412 || (err && String(err).includes('412'));
        if (shouldFallback) {
          try {
            const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
            const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
            const url = `https://${region}-${projectId}.cloudfunctions.net/sendContactEmail`;
            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID_GENERIC,
                template_id: EMAILJS_TEMPLATE_ID_GENERIC,
                user_id: EMAILJS_USER_ID_GENERIC,
                template_params: templateParams,
              }),
            });
            if (!resp.ok) {
              const txt = await resp.text().catch(() => '');
              throw new Error(`Fallback failed: ${resp.status} ${resp.statusText} ${txt}`);
            }
            setMensagem(t('messages.success'));
            setMensagemTipo('sucesso');
            setForm({ nome: '', email: '', telefone: '', tipoPedido: t('requestType.info'), produtoInteresse: '', assunto: '', mensagem: '', aceitaRgpd: false });
          } catch (e) {
            console.error('[EmailJS][Contato] fallback send error:', e);
            setMensagem(t('messages.error'));
            setMensagemTipo('erro');
          }
        } else {
          setMensagem(t('messages.error'));
          setMensagemTipo('erro');
        }
      })
      .finally(() => setEnviando(false));
  };

  const whereText = isLisboa
    ? 'Lisboa, Portugal.'
    : isPovoa
      ? 'Póvoa de Santa Iria, concelho de Vila Franca de Xira.'
      : isPorto
        ? 'Porto, Portugal.'
        : t('map.whereDesc');

  const iframeTitle = isLisboa
    ? 'Mapa de Lisboa, Portugal'
    : isPovoa
      ? 'Mapa de Póvoa de Santa Iria, Vila Franca de Xira'
      : isPorto
        ? 'Mapa do Porto, Portugal'
        : t('map.iframeTitle');

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={t('seoTitle')}
        description={t('seoDesc')}
        canonicalPath={`/${base}/contato`}
      />
      <div className="bg-white/80 backdrop-blur rounded-xl shadow-md p-6 md:p-8">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center">{t('pageTitle')}</h2>
        <p className="text-blue-700 text-center mt-2">{t('pageSubtitle')}</p>
        {/* Destaque de contacto telefónico */}
        <div className="mt-6">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 p-4 border border-blue-200 rounded-xl bg-blue-50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow">
                {/* Phone Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.2 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.32 1.76.59 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.11a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.6.59A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <div>
                <div className="text-blue-900 font-semibold">{t('phoneHeadline')}</div>
                <div className="text-blue-800 text-sm">{t('phoneDesc')}</div>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="text-blue-900 font-medium">
                <span className="sr-only">{t('phoneNumberLabel')}</span>
                <a
                  href={`tel:+351962116764`}
                  className="text-2xl font-bold tracking-wide hover:underline whitespace-nowrap"
                  title={t('callNowCta') as string}
                >
                  +351 962 116 764
                </a>
              </div>
              <a
                href={`tel:+351962116764`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-500"
                aria-label={t('callNowCta')}
              >
                {t('callNowCta')}
              </a>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <input name="nome" value={form.nome} onChange={handleChange} placeholder={t('placeholders.name')} className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,t('validation.nameRequired'))} onInput={e=>setCustomValidity(e,'')} />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={t('placeholders.email')} className="w-full p-3 border border-blue-300 rounded-lg" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" onInvalid={e=>setCustomValidity(e,t('validation.emailInvalid'))} onInput={e=>setCustomValidity(e,'')} />
              <input name="telefone" value={form.telefone} onChange={handleChange} placeholder={t('placeholders.phoneOptional')} className="w-full p-3 border border-blue-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select name="tipoPedido" value={form.tipoPedido} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg" required>
                <option>{t('requestType.info')}</option>
                <option>{t('requestType.adhoc')}</option>
                <option>{t('requestType.contact')}</option>
                <option>{t('requestType.change')}</option>
                <option>{t('requestType.other')}</option>
              </select>
              <select name="produtoInteresse" value={form.produtoInteresse} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg">
                <option value="">{t('placeholders.productInterestOptional')}</option>
                <option>{t('productInterest.auto')}</option>
                <option>{t('productInterest.life')}</option>
                <option>{t('productInterest.health')}</option>
                <option>{t('productInterest.home')}</option>
                <option>{t('productInterest.fleet')}</option>
                <option>{t('productInterest.work')}</option>
                <option>{t('productInterest.mreb')}</option>
                <option>{t('productInterest.rcp')}</option>
                <option>{t('productInterest.other')}</option>
              </select>
            </div>
            <input name="assunto" value={form.assunto} onChange={handleChange} placeholder={t('placeholders.subjectOptional')} className="w-full p-3 border border-blue-300 rounded-lg" />
            <textarea name="mensagem" value={form.mensagem} onChange={handleChange} placeholder={t('placeholders.message')} className="w-full p-3 border border-blue-300 rounded-lg min-h-[140px]" required onInvalid={e=>setCustomValidity(e,t('validation.messageRequired'))} onInput={e=>setCustomValidity(e,'')} />
            <label className="flex items-start gap-2 text-sm text-blue-800">
              <input type="checkbox" name="aceitaRgpd" checked={form.aceitaRgpd} onChange={handleChange} required onInvalid={e=> (e.target as HTMLInputElement).setCustomValidity(t('validation.rgpdRequired'))} onInput={e=> (e.target as HTMLInputElement).setCustomValidity('')} />
              <span>
                <Trans i18nKey="rgpdText" t={t} components={[<a href={`/${base}/politica-rgpd`} className="underline" target="_blank" rel="noreferrer" />]} />
              </span>
            </label>

            {mensagem && (
              <div className={"p-3 rounded " + (mensagemTipo==='sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{mensagem}</div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={!canSubmit} className={`px-6 py-3 rounded font-bold text-white transition ${canSubmit ? 'bg-blue-700 hover:bg-blue-900' : 'bg-blue-300 cursor-not-allowed'}`}>
                {enviando ? t('messages.sending') : t('messages.submit')}
              </button>
            </div>
          </form>

          {/* Mapa */}
          <div>
            <h3 className="text-xl font-semibold text-blue-900 mb-3">{t('map.whereTitle')}</h3>
            <p className="text-blue-700 mb-3">{whereText}</p>
            <div className="rounded-xl overflow-hidden shadow border border-blue-200">
              <iframe
                title={iframeTitle}
                src={mapSrc}
                width="100%"
                height="360"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a className="text-blue-700 underline mt-2 inline-block" href={mapLink} target="_blank" rel="noreferrer">{t('map.openInMaps')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
