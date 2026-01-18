import React, { useState, ChangeEvent, FormEvent, useRef } from "react";
import Seo from "../components/Seo";
import DatePicker, { registerLocale } from "react-datepicker";
import { pt } from "date-fns/locale/pt";
import { enGB } from "date-fns/locale/en-GB";
import "react-datepicker/dist/react-datepicker.css";
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID } from "../emailjs.config";
import emailjs from "@emailjs/browser";
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';
import { auth } from '../firebase';
import { saveSimulation } from '../utils/simulations';
registerLocale("pt", pt);
registerLocale("en", enGB);


interface FormState {
  nome: string;
  email: string;
  contribuinte: string;
  dataNascimento: string;
  dataNascimentoManual?: string;
  dataCartaConducao?: string;
  dataCartaConducaoManual?: string;
  modelo: string;
  marca?: string;
  versao?: string;
  ano: string;
  matricula: string;
  tipoSeguro: string;
  coberturas: string[];
  codigoPostal?: string;
  outrosPedidos?: string;
}

export default function SimulacaoAuto() {
  const { t } = useTranslation('sim_auto');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { user } = useAuth();
  const { requireAuth } = useAuthUX();
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    contribuinte: "",
    dataNascimento: "",
    modelo: "",
    marca: "",
    versao: "",
    ano: "",
    matricula: "",
    tipoSeguro: "",
    coberturas: [],
    codigoPostal: "",
    outrosPedidos: "",

  });
  const [resultado, setResultado] = useState<string | null>(null);
  const [openNascimento, setOpenNascimento] = useState<boolean>(false);
  const [openCarta, setOpenCarta] = useState<boolean>(false);
  const [erroNascimento, setErroNascimento] = useState<string>("");
  const [erroCarta, setErroCarta] = useState<string>("");
  const [erroMatricula, setErroMatricula] = useState<string>("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mensagemTipo, setMensagemTipo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busyRef = useRef(false);

  // Determina a "marca" do site actual (para assinatura dinâmica no email)
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  let siteBrand = 'Ansião';
  if (host.includes('aurelio')) siteBrand = 'Aurélio';
  else if (host.includes('povoaseg') || host.includes('povoa')) siteBrand = 'Póvoa';
  else if (host.includes('lisboaseg') || host.includes('lisboa')) siteBrand = 'Lisboa';
  else if (host.includes('portoseg') || host.includes('porto')) siteBrand = 'Porto';


  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    if (type === "checkbox") {
      const checked = (target as HTMLInputElement).checked;

      setForm((prev) => {
        const coberturas = checked
          ? [...prev.coberturas, value]
          : prev.coberturas.filter((c) => c !== value);
        return { ...prev, coberturas };
      });
    } else {
      if (name === 'tipoSeguro') {
        const thirdParty = t('typeThirdParty');
        const ownDamage = t('typeOwnDamage');
        if (value === thirdParty) {
          // Pré-selecionar Ocupantes, Vidros e Assistência em Viagem
          const defaults = [
            t('coverageLabels.occupants'),
            t('coverageLabels.glass'),
            t('coverageLabels.assistance'),
          ];
          setForm(prev => ({ ...prev, tipoSeguro: value, coberturas: defaults }));
        } else if (value === ownDamage) {
          // Sem pré-seleção para Danos Próprios
          setForm(prev => ({ ...prev, tipoSeguro: value, coberturas: [] }));
        } else {
          setForm(prev => ({ ...prev, tipoSeguro: value }));
        }
      } else {
        setForm({ ...form, [name]: value });
      }
    }
  }


  // Função utilitária para setCustomValidity e validity
  function setCustomValidity(e: React.FormEvent<HTMLInputElement | HTMLSelectElement>, message: string) {
    (e.target as HTMLInputElement | HTMLSelectElement).setCustomValidity(message);
  }

  function validarDatas() {
    // Sem validação manual de formato, apenas obrigatório
    setErroNascimento("");
    setErroCarta("");
    return true;
  }

  function validarNIF(nif: string): boolean {
    if (!/^[0-9]{9}$/.test(nif)) return false;
    const n = nif.split('').map(Number);
    const start = n[0];
    if (![1,2,3,5,6,8,9].includes(start)) return false;
    let soma = 0;
    for (let i = 0; i < 8; i++) {
      soma += n[i] * (9 - i);
    }
    let controlo = 11 - (soma % 11);
    if (controlo >= 10) controlo = 0;
    return controlo === n[8];
  }

  function validarMatricula(m: string): boolean {
    if (!m) return false;
    // Formato genérico: XX-XX-XX (cada XX é alfanumérico maiúsculo)
    return /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(m);
  }


  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!validarDatas()) return;
      if (idadeMenorQue18(form.dataNascimento)) {
        setErroNascimento(t('validations.under18'));
        return;
      }
    }
    if (step === 2) {
      // validação da matrícula antes de avançar
      if (!validarMatricula(form.matricula)) {
        setErroMatricula(t('validations.plateFormat'));
        return;
      } else {
        setErroMatricula("");
      }
    }
    setStep((s) => s + 1);
  }


  function handlePrev(e: FormEvent) {
    e.preventDefault();
    setStep((s) => s - 1);
  }


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || busyRef.current) return; // prevent double-submit
    setIsSubmitting(true); busyRef.current = true;
    // Force login to persist simulation in DB
    await requireAuth();
    if (!form.tipoSeguro) {
      setMensagem(t('messages.selectType'));
      setMensagemTipo('erro');
      setTimeout(() => {
        setMensagem(null);
        setMensagemTipo(null);
      }, 6000);
      return;
    }
  const resumo = `${t('summary.title')} ${form.marca} ${form.modelo}${form.versao ? ' ' + form.versao : ''} (${form.ano}) - ${form.tipoSeguro}\n${t('summary.labels.nif')} ${form.contribuinte}\n${t('summary.labels.birthDate')} ${form.dataNascimento ? formatDate(form.dataNascimento) : '-'}\n${t('summary.labels.licenseDate')} ${form.dataCartaConducao ? formatDate(form.dataCartaConducao) : '-'}\n${t('summary.labels.postalCode')} ${form.codigoPostal || '-'}\n${t('summary.labels.version')} ${form.versao?.trim() ? form.versao.trim() : '-'}\n${t('summary.labels.coverages')} ${form.coberturas.join(", ")}\n${t('summary.labels.otherRequests')} ${form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-'}`;
    setResultado(resumo);

    // Enviar email via EmailJS
    const templateParams = {
      email: form.email,
      nome: form.nome,
      contribuinte: form.contribuinte,
      dataNascimento: form.dataNascimento ? formatDate(form.dataNascimento) : '',
      dataCartaConducao: form.dataCartaConducao ? formatDate(form.dataCartaConducao) : '',
      codigoPostal: form.codigoPostal || '',
      modelo: form.modelo,
  versao: form.versao || '',
      marca: form.marca,
      ano: form.ano,
      matricula: form.matricula,
      tipoSeguro: form.tipoSeguro,
      coberturas: form.coberturas.join(", "),
      outrosPedidos: form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-',
      resultado: resumo,
      // Usado no template EmailJS como {{siteURL}} Seguros
      siteURL: siteBrand,
    };
    try {
      // Firestore persistence if authenticated (will be after requireAuth)
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          // Generate a deterministic idempotency key for this combination and minute
          const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
          const key = [
            'auto',
            form.email || 'anon',
            (form.matricula || '').replace(/[^A-Za-z0-9]/g,'').toUpperCase(),
            minuteBucket.toISOString(),
          ].join(':');
          await saveSimulation(uid, {
            type: 'auto',
            title: `${form.marca || ''} ${form.modelo || ''}`.trim() || 'Auto',
            summary: resumo,
            status: 'submitted',
            payload: {
              email: form.email,
              nome: form.nome,
              contribuinte: form.contribuinte,
              dataNascimento: form.dataNascimento,
              dataCartaConducao: form.dataCartaConducao,
              codigoPostal: form.codigoPostal,
              marca: form.marca,
              modelo: form.modelo,
              versao: form.versao,
              ano: form.ano,
              matricula: form.matricula,
              tipoSeguro: form.tipoSeguro,
              coberturas: form.coberturas,
              outrosPedidos: form.outrosPedidos,
            }
          }, { idempotencyKey: key });
        } catch (e) {
          console.warn('[SimulacaoAuto] Falha a guardar simulação (ignorado):', e);
        }
      }
  console.log('[EmailJS][Auto] Sending', { service: EMAILJS_SERVICE_ID, template: EMAILJS_TEMPLATE_ID });
  const resp = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_USER_ID);
  console.log('[EmailJS][Auto] Success', resp?.status, resp?.text);
      setMensagem(t('messages.submitSuccess'));
      setMensagemTipo('sucesso');
    } catch (error: any) {
      console.error('[EmailJS][Auto] Error', error);
        setMensagem(t('messages.submitEmailError'));
        setMensagemTipo('erro');
        // Exibe o erro no canto inferior esquerdo, incluindo o user_id
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Erro ao enviar email: ${error?.text || error?.message || error} | user_id: ${EMAILJS_USER_ID}`;
        errorDiv.style.position = 'fixed';
        errorDiv.style.left = '24px';
        errorDiv.style.bottom = '24px';
        errorDiv.style.background = '#fee2e2';
        errorDiv.style.color = '#991b1b';
        errorDiv.style.padding = '12px 20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.zIndex = '9999';
        errorDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        document.body.appendChild(errorDiv);
        setTimeout(() => {
          if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
        }, 8000);
    }

    setTimeout(() => {
      setMensagem(null);
      setMensagemTipo(null);
    }, 6000);
    setIsSubmitting(false); busyRef.current = false;
  }

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  function idadeMenorQue18(data: string): boolean {
    if (!data) return true;
    const [ano, mes, dia] = data.split('-').map(Number);
    const hoje = new Date();
    let idade = hoje.getFullYear() - ano;
    if (
      hoje.getMonth() + 1 < mes ||
      (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
    ) {
      idade--;
    }
    return idade < 18;
  }

  function nomeCompletoValido(nome: string): boolean {
    if (!nome) return false;
    return nome.trim().split(/\s+/).length > 1;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Seo
        title={t('seo.title', 'Simulação Seguro Auto') as any}
        description={t('seo.description', 'Faça a simulação do seu seguro automóvel e receba proposta personalizada.') as any}
        canonicalPath={`/${base}/simulacao-auto`}
      />
      <img src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80" alt="Road" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="max-w-lg w-full p-8 bg-white bg-opacity-90 rounded-2xl shadow-xl relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-blue-900 text-center">{t('title')}</h2>
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1,2,3].map(n => (
              <div
                key={n}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all duration-300 ${step >= n ? 'bg-blue-700 scale-110' : 'bg-blue-300 scale-100'}`}
              >
                {n}
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-700 transition-all duration-500"
              style={{ width: `${step * 33.33}%` }}
            />
          </div>
          <div className="text-center text-blue-700 font-medium mt-2">{t('stepProgress', { step, defaultValue: base==='en' ? `Step ${step} of 3` : `Passo ${step} de 3` })}</div>
        </div>
        <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('step1Title')}</h3>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder={t('placeholders.name')}
                className={`w-full p-3 border rounded-lg ${form.nome && !nomeCompletoValido(form.nome) ? 'border-red-500' : 'border-blue-300'}`}
                required
                onBlur={e => {
                  if (!nomeCompletoValido(e.target.value)) {
                    e.target.setCustomValidity(t('validations.nameFull'));
                  } else {
                    e.target.setCustomValidity('');
                  }
                }}
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.nameFull'))}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
              />
              {form.nome && !nomeCompletoValido(form.nome) && (
                <div className="text-red-600 text-sm mt-1">{t('validations.nameFull')}</div>
              )}
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('placeholders.email')}
                className="w-full p-3 border border-blue-300 rounded-lg"
                required
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                onInvalid={e => {
                  const input = e.target as HTMLInputElement;
                  if (input.validity.valueMissing) {
                    input.setCustomValidity(t('validations.emailRequired'));
                  } else if (input.validity.typeMismatch || input.validity.patternMismatch) {
                    input.setCustomValidity(t('validations.emailInvalid'));
                  } else {
                    input.setCustomValidity('');
                  }
                }}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
              />
              <div className="w-full relative">
                <DatePicker
                  selected={form.dataNascimento ? new Date(form.dataNascimento) : null}
                  onChange={date => {
                    if (date) {
                      // Salva em ISO, mas também atualiza o manual para dd-mm-aaaa
                      const iso = date.toISOString().slice(0, 10);
                      const [year, month, day] = iso.split('-');
                      const manual = `${day}-${month}-${year}`;
                      setForm(f => ({ ...f, dataNascimento: iso, dataNascimentoManual: manual }));
                    } else {
                      setForm(f => ({ ...f, dataNascimento: "", dataNascimentoManual: "" }));
                    }
                  }}
                  locale={base}
                  dateFormat="dd-MM-yyyy"
                  placeholderText={t('placeholders.birthDate')}
                  className="w-full p-3 border border-blue-300 rounded-lg pr-10"
                  required
                  todayButton={base==='en' ? 'Today' : 'Hoje'}
                  isClearable
                  clearButtonTitle={base==='en' ? 'Clear' : 'Limpar'}
                  showMonthDropdown
                  showYearDropdown
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  value={form.dataNascimentoManual || ""}
                  customInput={
                    React.createElement('input', {
                      type: 'text',
                      className: 'w-full p-3 border border-blue-300 rounded-lg pr-10',
                      value: form.dataNascimentoManual || '',
                      required: true,
                      readOnly: true,
                      placeholder: t('placeholders.birthDate')
                    })
                  }
                  open={openNascimento}
                  onClickOutside={() => setOpenNascimento(false)}
                  calendarClassName="relative"
                  renderCustomHeader={props => (
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex gap-2 items-center">
                        <button type="button" onClick={props.decreaseMonth} className="px-2 py-1 text-blue-700">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <select
                          value={props.date.getMonth()}
                          onChange={e => props.changeMonth(Number(e.target.value))}
                          className="border rounded px-2 py-1"
                        >
                          {(base==='en' ? ["January","February","March","April","May","June","July","August","September","October","November","December"] : ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]).map((month, idx) => (
                            <option key={month} value={idx}>{month}</option>
                          ))}
                        </select>
                        <select
                          value={props.date.getFullYear()}
                          onChange={e => props.changeYear(Number(e.target.value))}
                          className="border rounded px-2 py-1"
                        >
                          {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <button type="button" onClick={props.increaseMonth} className="px-2 py-1 text-blue-700">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                  )}
                />
                {erroNascimento && <div className="text-red-600 text-sm mt-1">{erroNascimento}</div>}
                <div className="absolute top-1/2 -translate-y-1/2 flex gap-2" style={{ right: '2.5rem' }}>
                  <button type="button" onClick={() => setOpenNascimento(true)} tabIndex={-1}>
                    <svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="14" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
                  </button>
                </div>
              </div>
              <div className="w-full mt-2 relative">
                <DatePicker
                  selected={form.dataCartaConducao ? new Date(form.dataCartaConducao) : null}
                  onChange={date => {
                    if (date) {
                      const iso = date.toISOString().slice(0, 10);
                      const [year, month, day] = iso.split('-');
                      const manual = `${day}-${month}-${year}`;
                      setForm(f => ({ ...f, dataCartaConducao: iso, dataCartaConducaoManual: manual }));
                    } else {
                      setForm(f => ({ ...f, dataCartaConducao: "", dataCartaConducaoManual: "" }));
                    }
                  }}
                  locale={base}
                  dateFormat="dd-MM-yyyy"
                  placeholderText={t('placeholders.licenseDate')}
                  className="w-full p-3 border border-blue-300 rounded-lg pr-10"
                  required
                  todayButton={base==='en' ? 'Today' : 'Hoje'}
                  isClearable
                  clearButtonTitle={base==='en' ? 'Clear' : 'Limpar'}
                  showMonthDropdown
                  showYearDropdown
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  value={form.dataCartaConducaoManual || ""}
                  customInput={
                    React.createElement('input', {
                      type: 'text',
                      className: 'w-full p-3 border border-blue-300 rounded-lg pr-10',
                      value: form.dataCartaConducaoManual !== undefined ? form.dataCartaConducaoManual : (form.dataCartaConducao ? formatDate(form.dataCartaConducao) : ''),
                      required: true,
                      readOnly: true,
                      placeholder: t('placeholders.licenseDate')
                    })
                  }
                  open={openCarta}
                  onClickOutside={() => setOpenCarta(false)}
                  calendarClassName="relative"
                  renderCustomHeader={props => (
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex gap-2 items-center">
                        <button type="button" onClick={props.decreaseMonth} className="px-2 py-1 text-blue-700">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <select
                          value={props.date.getMonth()}
                          onChange={e => props.changeMonth(Number(e.target.value))}
                          className="border rounded px-2 py-1"
                        >
                          {(base==='en' ? ["January","February","March","April","May","June","July","August","September","October","November","December"] : ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]).map((month, idx) => (

                            <option key={month} value={idx}>{month}</option>
                          ))}
                        </select>
                        <select
                          value={props.date.getFullYear()}
                          onChange={e => props.changeYear(Number(e.target.value))}
                          className="border rounded px-2 py-1"
                        >
                          {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <button type="button" onClick={props.increaseMonth} className="px-2 py-1 text-blue-700">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                  )}
                />
                {erroCarta && <div className="text-red-600 text-sm mt-1">{erroCarta}</div>}
                <div className="absolute top-1/2 -translate-y-1/2 flex gap-2" style={{ right: '2.5rem' }}>
                  <button type="button" onClick={() => setOpenCarta(true)} tabIndex={-1}>
                    <svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="14" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
                  </button>
                </div>
              </div>
              <input
                name="codigoPostal"
                value={form.codigoPostal || ""}
                onChange={e => {
                  let v = e.target.value.replace(/[^\d]/g, "");
                  if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 7);
                  if (v.length > 8) v = v.slice(0, 8);
                  setForm({ ...form, codigoPostal: v });
                }}
                placeholder={t('placeholders.postalCode')}
                className="w-full p-3 border border-blue-300 rounded-lg mt-2"
                maxLength={8}
                required
                pattern="^\d{4}-\d{3}$"
                onFocus={e => {
                  if (!form.codigoPostal) {
                    setForm({ ...form, codigoPostal: "" });
                  }
                }}
                onInvalid={e => setCustomValidity(e, t('validations.postalHelp'))}
                onInput={e => setCustomValidity(e, '')}
              />
              {form.codigoPostal && !/^\d{4}-\d{3}$/.test(form.codigoPostal) && (
                <div className="text-red-600 text-sm mt-1">{t('validations.postalFormat')}</div>
              )}
              <input
                name="contribuinte"
                type="text"
                value={form.contribuinte || ""}
                onChange={handleChange}
                placeholder={t('placeholders.nif')}
                className={`w-full p-3 border rounded-lg ${form.contribuinte && !validarNIF(form.contribuinte) ? 'border-red-500' : 'border-blue-300'}`}
                required
                pattern="[0-9]{9}"
                maxLength={9}
                minLength={9}
                onBlur={e => {
                  if (e.target.value && !validarNIF(e.target.value)) {
                    e.target.setCustomValidity(t('validations.nifInvalid'));
                  } else {
                    e.target.setCustomValidity('');
                  }
                }}
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.nifRequired'))}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
              />
              {form.contribuinte && !validarNIF(form.contribuinte) && (
                <div className="text-red-600 text-sm mt-1">{t('validations.nifInvalid')}</div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="px-6 py-2 bg-gray-200 rounded" disabled>{t('buttons.prev')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">{t('buttons.next')}</button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('step2Title')}</h3>
              <div className="space-y-4">
                <div>
                  <input name="marca" value={form.marca || ""} onChange={handleChange} placeholder={t('placeholders.carBrand')} className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e => setCustomValidity(e, t('validations.brandRequired'))} onInput={e => setCustomValidity(e, '')} />
                  <div className="text-[11px] text-blue-600 mt-1 italic pl-1 text-left">{t('examples.brand')}</div>
                </div>
                <div>
                  <input name="modelo" value={form.modelo} onChange={handleChange} placeholder={t('placeholders.carModel')} className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e => setCustomValidity(e, t('validations.modelRequired'))} onInput={e => setCustomValidity(e, '')} />
                  <div className="text-[11px] text-blue-600 mt-1 italic pl-1 text-left">{t('examples.model')}</div>
                </div>
                <div>
                  <input name="versao" value={form.versao || ''} onChange={handleChange} placeholder={t('placeholders.carVersion')} className="w-full p-3 border border-blue-300 rounded-lg" />
                  <div className="text-[11px] text-blue-600 mt-1 italic pl-1 text-left">{t('examples.version')}</div>
                </div>
                <div>
                  <input name="ano" value={form.ano} onChange={e => {
  let v = e.target.value.replace(/[^\d]/g, "");
  if (v.length > 4) v = v.slice(0, 4);
  setForm({ ...form, ano: v });
}} placeholder={t('placeholders.carYear')} className="w-full p-3 border border-blue-300 rounded-lg" required maxLength={4} onInvalid={e => setCustomValidity(e, t('validations.yearRequired'))} onInput={e => setCustomValidity(e, '')} />
                  <div className="text-[11px] text-blue-600 mt-1 italic pl-1 text-left">{t('examples.year')}</div>
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-center my-4">
  <div className="border-4 border-gray-700 rounded-lg flex items-center px-4 py-2 shadow-md" style={{ minWidth: '180px', maxWidth: '220px', background: 'white' }}>
    <input
      name="matricula"
      value={form.matricula}
      onChange={e => {
        let v = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (v.length > 2) v = v.slice(0,2) + '-' + v.slice(2);
        if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,7);
        if (v.length > 8) v = v.slice(0,8);
        setForm({ ...form, matricula: v });
        if (erroMatricula) setErroMatricula("");
      }}
  placeholder={t('placeholders.plate')}
      className="text-center font-mono text-lg bg-transparent outline-none w-full"
      maxLength={8}
      required
  onInvalid={e => setCustomValidity(e, t('validations.plateFormat'))}
      onInput={e => setCustomValidity(e, '')}
      style={{ letterSpacing: '2px' }}
    />
    <svg width="32" height="20" viewBox="0 0 32 20" className="ml-2" fill="none"><rect x="0.5" y="0.5" width="31" height="19" rx="3" fill="#2563eb" stroke="#1e293b"/><text x="16" y="14" textAnchor="middle" fontSize="10" fill="#fff">PT</text></svg>
  </div>
  <div className="text-[11px] text-blue-600 mt-2 italic pl-1 text-left">{t('examples.plate')}</div>
  {erroMatricula && (
    <div className="text-red-600 text-xs mt-1 text-left">{erroMatricula}</div>
  )}
</div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">{t('buttons.prev')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">{t('buttons.next')}</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('step3Title')}</h3>
              <label className="block font-semibold mb-2 text-left" htmlFor="tipoSeguro">{t('typeLabel')}</label>
<select id="tipoSeguro" name="tipoSeguro" value={form.tipoSeguro || ""} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg text-left" required onInvalid={e => setCustomValidity(e, t('messages.selectType'))} onInput={e => setCustomValidity(e, '')}>

  <option value="">{t('typeSelectPlaceholder')}</option>
  <option value={t('typeThirdParty')}>{t('typeThirdParty')}</option>
  <option value={t('typeOwnDamage')}>{t('typeOwnDamage')}</option>
</select>
              {form.tipoSeguro === t('typeThirdParty') && (
                <div className="text-sm text-blue-700 mt-1 bg-blue-50 rounded p-2">{t('typeThirdPartyInfo')}</div>
              )}
              {form.tipoSeguro === t('typeOwnDamage') && (
                <div className="text-sm text-blue-700 mt-1 bg-blue-50 rounded p-2">{t('typeOwnDamageInfo')}</div>
              )}
              <label className="block font-semibold mb-2">{t('baseCoverLabel')}</label>
              {form.tipoSeguro === t('typeThirdParty') && (
  <div className="flex flex-col gap-2 mb-2">
    {(t('baseCoversThirdParty', { returnObjects: true }) as string[]).map((label, i) => (
      <label key={i}><input type="checkbox" checked disabled /> {label}</label>
    ))}
  </div>
)}
{form.tipoSeguro === t('typeOwnDamage') && (
  <div className="flex flex-col gap-2 mb-2">
    {(t('baseCoversOwnDamage', { returnObjects: true }) as string[]).map((label, i) => (
      <label key={i}><input type="checkbox" checked disabled /> {label}</label>
    ))}
  </div>
)}
<label className="block font-semibold mb-2">{t('additionalCoverages')}</label>
              {form.tipoSeguro === t('typeThirdParty') && (
  <div className="flex flex-col gap-2">
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.occupants')} checked={form.coberturas.includes(t('coverageLabels.occupants'))} onChange={handleChange} /> {t('coverageLabels.occupants')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.glass')} checked={form.coberturas.includes(t('coverageLabels.glass'))} onChange={handleChange} /> {t('coverageLabels.glass')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.assistance')} checked={form.coberturas.includes(t('coverageLabels.assistance'))} onChange={handleChange} /> {t('coverageLabels.assistance')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.fire')} checked={form.coberturas.includes(t('coverageLabels.fire'))} onChange={handleChange} /> {t('coverageLabels.fire')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.theft')} checked={form.coberturas.includes(t('coverageLabels.theft'))} onChange={handleChange} /> {t('coverageLabels.theft')}</label>
  </div>
)}
{form.tipoSeguro === t('typeOwnDamage') && (
  <div className="flex flex-col gap-2">
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.naturalCatastrophes')} checked={form.coberturas.includes(t('coverageLabels.naturalCatastrophes'))} onChange={handleChange} /> {t('coverageLabels.naturalCatastrophes')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.vandalism')} checked={form.coberturas.includes(t('coverageLabels.vandalism'))} onChange={handleChange} /> {t('coverageLabels.vandalism')}</label>
    <label><input type="checkbox" name="coberturas" value={t('coverageLabels.replacementVehicle')} checked={form.coberturas.includes(t('coverageLabels.replacementVehicle'))} onChange={handleChange} /> {t('coverageLabels.replacementVehicle')}</label>
  </div>
)}
<div className="mt-4">
  <label className="block text-sm font-semibold mb-1">{t('summary.labels.otherRequests')}</label>
  <textarea
    name="outrosPedidos"
    value={form.outrosPedidos || ''}
    onChange={handleChange}
    placeholder={t('placeholders.otherRequests')}
    className="w-full p-3 border rounded bg-white min-h-[90px]"
  />
</div>
              <div className="flex justify-between gap-2 mt-4">
                <button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">{t('buttons.prev')}</button>
                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-white rounded font-bold transition ${isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting ? t('buttons.simulating', { defaultValue: 'A enviar…' }) : t('buttons.simulate')}</button>
              </div>
                {/* RGPD Checkbox moved to bottom */}
                <div className="mb-4 mt-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="aceitaRgpd"
                    required
                    className="accent-blue-700 w-5 h-5 mt-0.5"
                    style={{ minWidth: 20, minHeight: 20 }}
                    onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.rgpdRequired'))}
                    onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  />
                  <label htmlFor="aceitaRgpd" className="text-blue-900 text-sm select-none">
                    <Trans i18nKey="contact:rgpdText" components={[<a href={`/${base}/politica-rgpd`} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900" />]} />
                  </label>
                </div>
            </>
          )}
        </form>
        {resultado && <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-lg text-center font-semibold shadow whitespace-pre-line">{resultado}</div>}
        {mensagem && (
          <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-lg font-semibold shadow transition-opacity duration-500 ${mensagemTipo === 'sucesso' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}
            style={{ minWidth: '260px', maxWidth: '350px', textAlign: 'left' }}>
            {mensagem.split('\n').map((line, idx) => (
              <div key={idx} style={{ textAlign: 'left' }}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
