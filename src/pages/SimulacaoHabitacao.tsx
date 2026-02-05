import React, { useRef, useState, ChangeEvent, FormEvent } from "react";
import Seo from "../components/Seo";
import emailjs from "@emailjs/browser";
import { EMAILJS_SERVICE_ID_SAUDE, EMAILJS_TEMPLATE_ID_HABITACAO, EMAILJS_USER_ID_SAUDE } from "../emailjs.config";
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';
import { auth } from '../firebase';
import { saveSimulation } from '../utils/simulations';

type FormState = {
  // Passo 1 - Imóvel
  situacao: "proprietario" | "inquilino" | "";
  tipoImovel: "apartamento" | "moradia" | "";
  utilizacao: "permanente" | "secundaria" | "arrendamento" | "";
  anoConstrucao: string;
  area: string; // m2
  codigoPostal: string;
  construcao: "betao" | "alvenaria" | "madeira" | "";
  seguranca: string[]; // alarme, porta, cctv
  capitalEdificio?: string; // obrigatório se proprietario
  capitalConteudo: string;

  // Passo 2 - Dados pessoais
  nome: string;
  email: string;
  telefone: string;
  contribuinte: string;
  // Morada do tomador
  moradaTomador: string;
  codigoPostalTomador: string;
  localidadeTomador: string;

  // Morada do risco (pode ser diferente)
  moradaRiscoIgualTomador: boolean;
  moradaRisco: string;
  localidadeRisco: string;
  aceitaRgpd: boolean;

  // Passo 3 - Produto
  produto: "base" | "intermedio" | "completo" | "";
  extras: string[]; // sismo, inundacoes, rcExtra, assistenciaLar
  detalhes?: string; // campo aberto para detalhes adicionais
};

export default function SimulacaoHabitacao() {
  const { t } = useTranslation(['sim_home','contact']);
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const { user } = useAuth();
  const { requireAuth } = useAuthUX();
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<FormState>({
    situacao: "",
    tipoImovel: "",
    utilizacao: "",
  anoConstrucao: "",
  area: "",
    codigoPostal: "",
    construcao: "",
    seguranca: [],
    capitalEdificio: "",
    capitalConteudo: "",
    nome: "",
    email: "",
    telefone: "",
    contribuinte: "",
    moradaTomador: "",
    codigoPostalTomador: "",
    localidadeTomador: "",
    moradaRiscoIgualTomador: true,
    moradaRisco: "",
    localidadeRisco: "",
    aceitaRgpd: false,
    produto: "",
    extras: [],
    detalhes: "",
  });
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mensagemTipo, setMensagemTipo] = useState<"sucesso" | "erro" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busyRef = useRef(false);

  // Helper para formatar capitais em EUR (sem casas decimais)
  const formatCapital = (v?: string) => {
    const n = Number(v);
    if (!v || !isFinite(n) || n <= 0) return 'n/a';
    try {
      return new Intl.NumberFormat(base === 'pt' ? 'pt-PT' : 'en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' €';
    } catch {
      return n.toString() + ' €';
    }
  };

  // Formatação para o input (sem símbolo €)
  const formatThousands = (v?: string) => {
    if (!v) return '';
    const n = Number(v);
    if (!isFinite(n)) return '';
    try {
      return new Intl.NumberFormat(base === 'pt' ? 'pt-PT' : 'en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
    } catch {
      return v;
    }
  };

  // Formatação telefone / NIF (### ### ###)
  const formatNineDigitsSpaced = (v: string) => {
    const raw = (v || '').replace(/\D/g, '').slice(0,9);
    return raw.replace(/(\d{3})(\d{3})(\d{0,3})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : `${a} ${b}` ).trim();
  };

  // Formatação telefone PT específica (XX XXXXXXX)
  const formatPhoneTwoSeven = (v: string) => {
    const raw = (v || '').replace(/\D/g,'').slice(0,9);
    if (!raw) return '';
    if (raw.length <= 2) return raw; // ainda a escrever prefixo
    return raw.slice(0,2) + ' ' + raw.slice(2);
  };

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    if (type === "checkbox") {
      const checked = (target as HTMLInputElement).checked;
      if (name === "aceitaRgpd") {
        setForm(prev => ({ ...prev, aceitaRgpd: checked }));
      } else if (name === 'moradaRiscoIgualTomador') {
        setForm((prev) => {
          const next = { ...prev, moradaRiscoIgualTomador: checked };
          if (checked) {
            next.moradaRisco = prev.moradaTomador;
            next.localidadeRisco = prev.localidadeTomador;
          }
          return next;
        });
      } else if (name === "seguranca" || name === "extras") {
        const group = name as "seguranca" | "extras";
        setForm(prev => {
          const arr = new Set(prev[group]);
          if (checked) arr.add(value); else arr.delete(value);
          return { ...prev, [group]: Array.from(arr) } as FormState;
        });
      }
    } else {
      if (name === 'moradaTomador' || name === 'localidadeTomador') {
        setForm((prev) => {
          const next = { ...prev, [name]: value } as FormState;
          if (prev.moradaRiscoIgualTomador) {
            if (name === 'moradaTomador') next.moradaRisco = value;
            if (name === 'localidadeTomador') next.localidadeRisco = value;
          }
          return next;
        });
      } else if (name === 'codigoPostalTomador') {
        let v = value.replace(/\D/g, "");
        if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 7);
        if (v.length > 8) v = v.slice(0, 8);
        setForm((prev) => ({ ...prev, codigoPostalTomador: v }));
      } else if (name === 'produto') {
        setForm(prev => {
          const next: FormState = { ...prev, produto: value as FormState['produto'] };
          if (value === 'completo' && next.extras.includes('sismo')) {
            next.extras = next.extras.filter(e => e !== 'sismo');
          }
          return next;
        });
      } else {
        setForm(prev => ({ ...prev, [name]: value } as FormState));
      }
    }
  }

  // Utilitários
  function setCustomValidity(e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, message: string) {
    (e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).setCustomValidity(message);
  }

  function validarNIF(nif: string): boolean {
    if (!/^[0-9]{9}$/.test(nif)) return false;
    const n = nif.split('').map(Number);
    if (![1,2,3,5,6,8,9].includes(n[0])) return false;
    let soma = 0;
    for (let i = 0; i < 8; i++) soma += n[i] * (9 - i);
    let controlo = 11 - (soma % 11);
    if (controlo >= 10) controlo = 0;
    return controlo === n[8];
  }

  function validarPasso1(): boolean {
    if (!form.situacao || !form.tipoImovel || !form.utilizacao || !form.anoConstrucao || !form.area || !form.codigoPostal || !form.construcao) {
      setMensagem(t('sim_home:messages.step1Missing'));
      setMensagemTipo("erro");
      return false;
    }
    // Pelo menos um dos capitais (edifício ou conteúdo) deve estar preenchido (>0)
    const capitalEdificioValido = !!form.capitalEdificio && Number(form.capitalEdificio) > 0;
    const capitalConteudoValido = !!form.capitalConteudo && Number(form.capitalConteudo) > 0;
    if (!capitalEdificioValido && !capitalConteudoValido) {
      setMensagem(t('sim_home:messages.atLeastOneCapital'));
      setMensagemTipo("erro");
      return false;
    }
    if (!/^[0-9]{4}-[0-9]{3}$/.test(form.codigoPostal)) {
      setMensagem(t('sim_home:messages.postalInvalid'));
      setMensagemTipo("erro");
      return false;
    }
    if (!/^\d{4}$/.test(form.anoConstrucao)) {
      setMensagem(t('sim_home:messages.yearInvalid'));
      setMensagemTipo("erro");
      return false;
    }
    setMensagem(null); setMensagemTipo(null);
    return true;
  }

  function validarPasso2(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.nome) { setMensagem(t('sim_home:messages.nameRequired')); setMensagemTipo("erro"); return false; }
    if (!form.email || !emailRegex.test(form.email)) { setMensagem(t('sim_home:messages.emailInvalid')); setMensagemTipo("erro"); return false; }
  if (!/^[0-9]{9}$/.test(form.telefone)) { setMensagem(t('sim_home:messages.phoneInvalid')); setMensagemTipo("erro"); return false; }
  if (!/^[0-9]{9}$/.test(form.contribuinte)) { setMensagem(t('sim_home:messages.nifInvalid')); setMensagemTipo("erro"); return false; }

    if (!form.moradaTomador?.trim() || !form.codigoPostalTomador || !form.localidadeTomador?.trim()) {
      setMensagem(t('sim_home:messages.addressHolderRequired'));
      setMensagemTipo('erro');
      return false;
    }
    if (!/^[0-9]{4}-[0-9]{3}$/.test(form.codigoPostalTomador)) {
      setMensagem(t('sim_home:messages.postalInvalid'));
      setMensagemTipo('erro');
      return false;
    }
    // Risk address can be same as holder
    if (!form.moradaRiscoIgualTomador) {
      if (!form.moradaRisco?.trim() || !form.localidadeRisco?.trim()) {
        setMensagem(t('sim_home:messages.addressRiskRequired'));
        setMensagemTipo('erro');
        return false;
      }
    }
    setMensagem(null); setMensagemTipo(null);
    return true;
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (validarPasso1()) setStep(2);
    } else if (step === 2) {
      if (validarPasso2()) setStep(3);
    }
  }

  function handlePrev(e: FormEvent) {
    e.preventDefault();
    setStep(s => Math.max(1, s - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || busyRef.current) return; // prevent double submit
    setIsSubmitting(true); busyRef.current = true;
    // Exigir autenticação antes de submeter (persistir no DB)
    await requireAuth();
    if (!form.produto) {
      setMensagem(t('sim_home:messages.productRequired'));
      setMensagemTipo("erro");
      return;
    }
    if (!form.aceitaRgpd) {
      setMensagem(t('sim_home:messages.rgpdRequired'));
      setMensagemTipo("erro");
      return;
    }

  const produtoLabel = form.produto === 'base' ? 'Imóvel' : form.produto === 'intermedio' ? 'Imóvel + Recheio' : 'Imóvel + Recheio + Fenómenos Sísmicos';
  const extrasLabel = (form.extras || []).map(x => x === 'sismo' ? 'Fenómenos sísmico' : x === 'veiculos-garagem' ? 'Veículos em garagem' : x).join(', ');
  const telefoneFormatado = formatPhoneTwoSeven(form.telefone);
  const segurancaLista = form.seguranca.join(', ') || 'Nenhuma';

  const resumo =
`Imóvel: ${form.tipoImovel} | Situação: ${form.situacao} | Utilização: ${form.utilizacao}
Ano: ${form.anoConstrucao} | Área: ${form.area} m²
Construção: ${form.construcao} | Segurança: ${form.seguranca.join(', ') || 'Nenhuma'}
Morada risco: ${form.moradaRiscoIgualTomador ? 'Igual ao tomador' : (form.moradaRisco || '-')}, ${form.codigoPostal} ${form.localidadeRisco || '-'}
Morada tomador: ${form.moradaTomador || '-'}, ${form.codigoPostalTomador || '-'} ${form.localidadeTomador || '-'}
Capitais -> Edifício: ${form.situacao==='proprietario'?form.capitalEdificio+' €':'n/a'} | Conteúdo: ${form.capitalConteudo} €
Produto: ${produtoLabel} | Extras: ${extrasLabel || 'Nenhum'}
Detalhes: ${form.detalhes?.trim() ? form.detalhes?.trim() : '-'}
Cliente: ${form.nome} | Email: ${form.email} | Tel: ${form.telefone} | NIF: ${form.contribuinte}`;

    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    let dominioDetails = 'Ansião Seguros';
    if (host.includes('aurelio')) dominioDetails = 'Aurélio Seguros';
    else if (host.includes('sintraseg') || host.includes('sintra')) dominioDetails = 'Sintra Seguros';
    else if (host.includes('pombalseg') || host.includes('pombal')) dominioDetails = 'Pombal Seguros';
    else if (host.includes('povoaseg') || host.includes('povoa')) dominioDetails = 'Póvoa Seguros';
    else if (host.includes('lisboaseg') || host.includes('lisboa')) dominioDetails = 'Lisboa Seguros';
    else if (host.includes('portoseg') || host.includes('porto')) dominioDetails = 'Porto Seguros';

    const templateParams = {
      // Identificação
      nome: form.nome,
      email: form.email,
      telefone: telefoneFormatado,
      nif: form.contribuinte,
      DominioDetails: dominioDetails,
      // Dados do risco
      situacao: form.situacao,
      tipo_imovel: form.tipoImovel,
      utilizacao: form.utilizacao,
      ano_construcao: form.anoConstrucao,
      area_m2: form.area,
      morada_risco: form.moradaRiscoIgualTomador ? form.moradaTomador : form.moradaRisco,
      codigo_postal: form.codigoPostal,
      localidade_risco: form.moradaRiscoIgualTomador ? form.localidadeTomador : form.localidadeRisco,
      risco_igual_tomador: form.moradaRiscoIgualTomador ? 'sim' : 'nao',
      construcao: form.construcao,
      seguranca: segurancaLista,
      capital_edificio: form.situacao==='proprietario' && form.capitalEdificio ? form.capitalEdificio : 'n/a',
      capital_conteudo: form.capitalConteudo || 'n/a',
      // Dados tomador
      morada_tomador: form.moradaTomador,
      codigo_postal_tomador: form.codigoPostalTomador,
      localidade_tomador: form.localidadeTomador,
      // Produto e coberturas
      produto: produtoLabel,
      extras: extrasLabel || 'Nenhum',
      detalhes: form.detalhes?.trim() ? form.detalhes.trim() : '-',
      // Resumo legacy / compatibilidade
      resultado: resumo,
      tipoSeguro: `Casa (${produtoLabel})`,
    } as Record<string, any>;

    const isDev = (import.meta as any)?.env?.DEV;
    const dryRun = isDev || (import.meta as any)?.env?.VITE_EMAIL_DRY_RUN === 'true';
    if (isDev) {
      // Log seguro (não mostra todos os dados sensíveis, mas suficiente para debug)
      // Atenção: remover se for exposto em produção.
      console.log('[EmailJS][DEBUG] Enviando', {
        service: EMAILJS_SERVICE_ID_SAUDE,
        template: EMAILJS_TEMPLATE_ID_HABITACAO,
        user: EMAILJS_USER_ID_SAUDE?.slice(0,4) + '***',
        params: templateParams
      });
    }

  if (dryRun) {
      console.log('[EmailJS][DRY_RUN][Habitacao] Would send with params:', templateParams);
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          try {
            const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
            const key = ['habitacao', form.email || 'anon', minuteBucket.toISOString()].join(':');
            await saveSimulation(uid, {
            type: 'habitacao',
            title: `Casa - ${produtoLabel}`,
            summary: `CP ${form.codigoPostal} | ${form.tipoImovel} | Capitais: Edi ${form.capitalEdificio || 'n/a'} / Cont ${form.capitalConteudo || 'n/a'}`,
            status: 'submitted',
            payload: { ...form },
            }, { idempotencyKey: key });
          } catch (err) {
            console.warn('[SimulacaoHabitacao][DRY] Falha a guardar simulação (ignorado):', err);
          }
        }
      } catch {}
      setMensagem(t('sim_home:messages.submitSuccess'));
      setMensagemTipo("sucesso");
      setForm({
        situacao: "",
        tipoImovel: "",
        utilizacao: "",
        anoConstrucao: "",
        area: "",
        codigoPostal: "",
        construcao: "",
        seguranca: [],
        capitalEdificio: "",
        capitalConteudo: "",
        nome: "",
        email: "",
        telefone: "",
        contribuinte: "",
        moradaTomador: "",
        codigoPostalTomador: "",
        localidadeTomador: "",
        moradaRiscoIgualTomador: true,
        moradaRisco: "",
        localidadeRisco: "",
        aceitaRgpd: false,
        produto: "",
        extras: [],
        detalhes: "",
      });
      setStep(1);
      setTimeout(() => { setMensagem(null); setMensagemTipo(null); }, 6000);
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
          const key = ['habitacao', form.email || 'anon', minuteBucket.toISOString()].join(':');
          await saveSimulation(uid, {
          type: 'habitacao',
          title: `Casa - ${produtoLabel}`,
          summary: `CP ${form.codigoPostal} | ${form.tipoImovel} | Capitais: Edi ${form.capitalEdificio || 'n/a'} / Cont ${form.capitalConteudo || 'n/a'}`,
          status: 'submitted',
          payload: { ...form },
          }, { idempotencyKey: key });
        } catch (err) {
          console.warn('[SimulacaoHabitacao] Falha a guardar simulação (ignorado):', err);
        }
      }
      console.log('[EmailJS][Habitacao] Sending', { service: EMAILJS_SERVICE_ID_SAUDE, template: EMAILJS_TEMPLATE_ID_HABITACAO });
      const resp = await emailjs
        .send(EMAILJS_SERVICE_ID_SAUDE, EMAILJS_TEMPLATE_ID_HABITACAO, templateParams, EMAILJS_USER_ID_SAUDE);
        if (isDev) console.log('[EmailJS][DEBUG] Sucesso', resp.status, resp.text);
      console.log('[EmailJS][Habitacao] Success', resp.status, resp.text);
  setMensagem(t('sim_home:messages.submitSuccess'));
        setMensagemTipo("sucesso");
        // reset parcial
        setForm({
          situacao: "",
          tipoImovel: "",
          utilizacao: "",
          anoConstrucao: "",
          area: "",
          codigoPostal: "",
          construcao: "",
          seguranca: [],
          capitalEdificio: "",
          capitalConteudo: "",
          nome: "",
          email: "",
          telefone: "",
          contribuinte: "",
          moradaTomador: "",
          codigoPostalTomador: "",
          localidadeTomador: "",
          moradaRiscoIgualTomador: true,
          moradaRisco: "",
          localidadeRisco: "",
          aceitaRgpd: false,
          produto: "",
          extras: [],
          detalhes: "",
        });
        setStep(1);
        setTimeout(() => { setMensagem(null); setMensagemTipo(null); }, 6000);
    } catch (error) {
      if (isDev) console.error('[EmailJS][DEBUG] Erro envio', error);
      console.error('[EmailJS][Habitacao] Error', error);
  setMensagem(t('sim_home:messages.submitError'));
        setMensagemTipo("erro");
        console.error(error);
        setTimeout(() => { setMensagem(null); setMensagemTipo(null); }, 6000);
    }
    setIsSubmitting(false); busyRef.current = false;
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-blue-50 relative pt-8 md:pt-12">
      <Seo
        title={t('sim_home:seo.title', 'Simulação Seguro Habitação') as any}
        description={t('sim_home:seo.description', 'Simule o seguro multirriscos habitação e receba proposta personalizada.') as any}
        canonicalPath={`/${base}/simulacao-habitacao`}
      />
      <img
  src={`${import.meta.env.BASE_URL}imagens/insurance-background.jpg`}
        alt={t('sim_home:title')}
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/family-happy2.png'; }}
      />
      <div className="relative z-10 max-w-3xl w-full bg-white bg-opacity-90 rounded-xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">{t('sim_home:title')}</h1>

        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1,2,3].map(n => (
              <div key={n} className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all duration-300 ${step >= n ? 'bg-blue-700 scale-110' : 'bg-blue-300 scale-100'}`}>{n}</div>
            ))}
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-700 transition-all duration-500" style={{ width: `${step * 33.33}%` }} />
          </div>
          <div className="text-center text-blue-700 font-medium mt-2">{t('sim_home:stepProgress', { step })}</div>
        </div>

        <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('sim_home:step1Title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.situacao')}</label>
                  <select name="situacao" value={form.situacao} onChange={handleChange} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:options.selecione'))} onInput={e=>setCustomValidity(e,'')}>
                    <option value="">{t('sim_home:options.selecione')}</option>
                    <option value="proprietario">{t('sim_home:options.situacao.proprietario')}</option>
                    <option value="inquilino">{t('sim_home:options.situacao.inquilino')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.tipoImovel')}</label>
                  <select name="tipoImovel" value={form.tipoImovel} onChange={handleChange} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:options.selecione'))} onInput={e=>setCustomValidity(e,'')}>
                    <option value="">{t('sim_home:options.selecione')}</option>
                    <option value="apartamento">{t('sim_home:options.tipoImovel.apartamento')}</option>
                    <option value="moradia">{t('sim_home:options.tipoImovel.moradia')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.utilizacao')}</label>
                  <select name="utilizacao" value={form.utilizacao} onChange={handleChange} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:options.selecione'))} onInput={e=>setCustomValidity(e,'')}>
                    <option value="">{t('sim_home:options.selecione')}</option>
                    <option value="permanente">{t('sim_home:options.utilizacao.permanente')}</option>
                    <option value="secundaria">{t('sim_home:options.utilizacao.secundaria')}</option>
                    <option value="arrendamento">{t('sim_home:options.utilizacao.arrendamento')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.anoConstrucao')}</label>
                  <input name="anoConstrucao" value={form.anoConstrucao} onChange={e=>{
                    const v = e.target.value.replace(/\D/g,'').slice(0,4);
                    setForm(prev=>({ ...prev, anoConstrucao: v }));
                  }} placeholder={t('sim_home:placeholders.year')} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:messages.yearInvalid'))} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.area')}</label>
                  <input name="area" value={form.area} onChange={e=>{
                    const v = e.target.value.replace(/[^\d.]/g,'').slice(0,6);
                    setForm(prev=>({ ...prev, area: v }));
                  }} placeholder={t('sim_home:placeholders.area')} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:labels.area'))} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.codigoPostal')}</label>
                  <input name="codigoPostal" value={form.codigoPostal} onChange={e=>{
                    let v = e.target.value.replace(/\D/g,"");
                    if (v.length > 4) v = v.slice(0,4)+'-'+v.slice(4,7);
                    if (v.length > 8) v = v.slice(0,8);
                    setForm(prev=>({ ...prev, codigoPostal: v }));
                  }} placeholder={t('sim_home:placeholders.postal')} className="w-full p-3 border rounded" required maxLength={8} pattern="^[0-9]{4}-[0-9]{3}$" onInvalid={e=>setCustomValidity(e,t('sim_home:messages.postalInvalid'))} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.construcao')}</label>
                  <select name="construcao" value={form.construcao} onChange={handleChange} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,'Selecione o tipo de construção.')} onInput={e=>setCustomValidity(e,'')}>
                    <option value="">{t('sim_home:options.selecione')}</option>
                    <option value="betao">{t('sim_home:options.construcao.betao')}</option>
                    <option value="alvenaria">{t('sim_home:options.construcao.alvenaria')}</option>
                    <option value="madeira">{t('sim_home:options.construcao.madeira')}</option>
                  </select>
                </div>
                {form.situacao === 'proprietario' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.capitalEdificio')}</label>
                    <input
                      name="capitalEdificio"
                      value={formatThousands(form.capitalEdificio)}
                      onChange={e=>{
                        const raw = e.target.value.replace(/[^0-9]/g,'').slice(0,9);
                        setForm(prev=>({ ...prev, capitalEdificio: raw }));
                      }}
                      placeholder={t('sim_home:placeholders.capEdificio')}
                      inputMode="numeric"
                      className="w-full p-3 border rounded"
                      onPaste={e=>{
                        const text = e.clipboardData.getData('text');
                        if (!/^[0-9]+$/.test(text.replace(/[^0-9]/g,''))) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.capitalConteudo')}</label>
                  <input
                    name="capitalConteudo"
                    value={formatThousands(form.capitalConteudo)}
                    onChange={e=>{
                      const raw = e.target.value.replace(/[^0-9]/g,'').slice(0,9);
                      setForm(prev=>({ ...prev, capitalConteudo: raw }));
                    }}
                    placeholder={t('sim_home:placeholders.capConteudo')}
                    inputMode="numeric"
                    className="w-full p-3 border rounded"
                    onPaste={e=>{
                      const text = e.clipboardData.getData('text');
                      if (!/^[0-9]+$/.test(text.replace(/[^0-9]/g,''))) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.seguranca')}</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="seguranca" value="alarme" checked={form.seguranca.includes('alarme')} onChange={handleChange}/> {t('sim_home:options.seguranca.alarme')}</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="seguranca" value="porta-blindada" checked={form.seguranca.includes('porta-blindada')} onChange={handleChange}/> {t('sim_home:options.seguranca.portaBlindada')}</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="seguranca" value="cctv" checked={form.seguranca.includes('cctv')} onChange={handleChange}/> {t('sim_home:options.seguranca.cctv')}</label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-6 py-2 bg-gray-200 rounded" disabled>{t('sim_home:buttons.prev')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">{t('sim_home:buttons.next')}</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('sim_home:step2Title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.nomeCompleto')}</label>
                  <input name="nome" value={form.nome} onChange={handleChange} placeholder={t('sim_home:placeholders.yourName')} className="w-full p-3 border rounded" required onInvalid={e=>setCustomValidity(e,t('sim_home:messages.nameRequired'))} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.email')}</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={t('sim_home:placeholders.email')} className="w-full p-3 border rounded" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" onInvalid={e=>setCustomValidity(e,t('sim_home:messages.emailInvalid'))} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.telefone')}</label>
                  <input
                    name="telefone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10} /* 2 + espaço + 7 */
                    value={formatPhoneTwoSeven(form.telefone)}
                    onChange={e=>{
                      const raw = e.target.value.replace(/\D/g,'').slice(0,9);
                      setForm(prev=>({ ...prev, telefone: raw }));
                    }}
                    placeholder={t('sim_home:placeholders.phone')}
                    className="w-full p-3 border rounded"
                    required
                    onInvalid={e=>setCustomValidity(e,t('sim_home:messages.phoneInvalid'))}
                    onInput={e=>setCustomValidity(e,'')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.nif')}</label>
                  <input
                    name="contribuinte"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={formatNineDigitsSpaced(form.contribuinte)}
                    onChange={e=>{
                      const raw = e.target.value.replace(/\D/g,'').slice(0,9);
                      setForm(prev=>({ ...prev, contribuinte: raw }));
                    }}
                    placeholder={t('sim_home:placeholders.nif')}
                    className="w-full p-3 border rounded"
                    required
                    onInvalid={e=>setCustomValidity(e,t('sim_home:messages.nifInvalid'))}
                    onInput={e=>setCustomValidity(e,'')}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <div className="text-sm font-semibold text-blue-900 mb-2">{t('sim_home:labels.addressHolderTitle')}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.addressStreet')}</label>
                      <input
                        name="moradaTomador"
                        value={form.moradaTomador}
                        onChange={handleChange}
                        placeholder={t('sim_home:placeholders.addressStreet')}
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.addressPostalCode')}</label>
                      <input
                        name="codigoPostalTomador"
                        value={form.codigoPostalTomador}
                        onChange={handleChange}
                        placeholder={t('sim_home:placeholders.postal')}
                        className="w-full p-3 border rounded"
                        required
                        maxLength={8}
                        pattern="^[0-9]{4}-[0-9]{3}$"
                        onInvalid={e=>setCustomValidity(e,t('sim_home:messages.postalInvalid'))}
                        onInput={e=>setCustomValidity(e,'')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.addressLocality')}</label>
                      <input
                        name="localidadeTomador"
                        value={form.localidadeTomador}
                        onChange={handleChange}
                        placeholder={t('sim_home:placeholders.addressLocality')}
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-blue-900">
                    <input
                      type="checkbox"
                      name="moradaRiscoIgualTomador"
                      checked={form.moradaRiscoIgualTomador}
                      onChange={handleChange}
                    />
                    {t('sim_home:labels.riskAddressSameAsHolder')}
                  </label>
                </div>

                {!form.moradaRiscoIgualTomador && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold text-blue-900 mb-2">{t('sim_home:labels.addressRiskTitle')}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.addressStreet')}</label>
                        <input
                          name="moradaRisco"
                          value={form.moradaRisco}
                          onChange={handleChange}
                          placeholder={t('sim_home:placeholders.addressStreet')}
                          className="w-full p-3 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.codigoPostal')}</label>
                        <input
                          name="codigoPostal"
                          value={form.codigoPostal}
                          onChange={e=>{
                            let v = e.target.value.replace(/\D/g,"");
                            if (v.length > 4) v = v.slice(0,4)+'-'+v.slice(4,7);
                            if (v.length > 8) v = v.slice(0,8);
                            setForm(prev=>({ ...prev, codigoPostal: v }));
                          }}
                          placeholder={t('sim_home:placeholders.postal')}
                          className="w-full p-3 border rounded"
                          required
                          maxLength={8}
                          pattern="^[0-9]{4}-[0-9]{3}$"
                          onInvalid={e=>setCustomValidity(e,t('sim_home:messages.postalInvalid'))}
                          onInput={e=>setCustomValidity(e,'')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.addressLocality')}</label>
                        <input
                          name="localidadeRisco"
                          value={form.localidadeRisco}
                          onChange={handleChange}
                          placeholder={t('sim_home:placeholders.addressLocality')}
                          className="w-full p-3 border rounded"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">{t('sim_home:buttons.prev')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">{t('sim_home:buttons.next')}</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">{t('sim_home:step3Title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { key: 'base', title: t('sim_home:product.cards.base.title'), desc: t('sim_home:product.cards.base.desc') },
                  { key: 'intermedio', title: t('sim_home:product.cards.intermedio.title'), desc: t('sim_home:product.cards.intermedio.desc') },
                  { key: 'completo', title: t('sim_home:product.cards.completo.title'), desc: t('sim_home:product.cards.completo.desc') },
                ] as const).map(card => (
                  <label key={card.key} className={`border rounded-xl p-4 cursor-pointer shadow-sm flex flex-col gap-2 ${form.produto === card.key ? 'ring-2 ring-blue-600 bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-900">{card.title}</span>
                      <input type="radio" name="produto" value={card.key} checked={form.produto === card.key} onChange={handleChange} />
                    </div>
                    <p className="text-sm text-blue-800">{card.desc}</p>
                    <ul className="text-xs text-blue-900 list-disc list-inside">
                      {card.key === 'base' && (t('sim_home:product.bullets', { returnObjects: true }) as unknown as string[]).slice(0,4).map((b: string, i: number) => (<li key={i}>{b}</li>))}
                      {card.key === 'intermedio' && (t('sim_home:product.bullets', { returnObjects: true }) as unknown as string[]).slice(0,5).map((b: string, i: number) => (<li key={i}>{b}</li>))}
                      {card.key === 'completo' && (t('sim_home:product.bullets', { returnObjects: true }) as unknown as string[]).map((b: string, i: number) => (<li key={i}>{b}</li>))}
                    </ul>
                    {/* Capitais selecionados */}
                    <div className="mt-2 text-xs text-blue-900 bg-white/70 border border-blue-100 rounded p-2">
                      <div className="font-semibold mb-1">{t('sim_home:labels.capitaisSelecionados')}</div>
                      {card.key === 'base' && (
                        <div className="flex items-center justify-between gap-2">
                          <span>{t('sim_home:labels.capitalImovel')}</span>
                          <span className="font-bold">{formatCapital(form.capitalEdificio)}</span>
                        </div>
                      )}
                      {card.key !== 'base' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span>{t('sim_home:labels.capitalImovel')}</span>
                            <span className="font-bold">{formatCapital(form.capitalEdificio)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>{t('sim_home:labels.capitalConteudoLabel')}</span>
                            <span className="font-bold">{formatCapital(form.capitalConteudo)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.adicionais')}</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  {form.produto !== 'completo' && (
                    <label className="inline-flex items-center gap-2"><input type="checkbox" name="extras" value="sismo" checked={form.extras.includes('sismo')} onChange={handleChange}/> {t('sim_home:extras.earthquake')}</label>
                  )}
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="extras" value="veiculos-garagem" checked={form.extras.includes('veiculos-garagem')} onChange={handleChange}/> {t('sim_home:extras.garageVehicles')}</label>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-1">{t('sim_home:labels.detalhesAdicionais')}</label>
                  <textarea
                    name="detalhes"
                    value={form.detalhes || ''}
                    onChange={handleChange}
                    placeholder={t('sim_home:placeholders.details')}
                    className="w-full p-3 border rounded min-h-[90px]"
                  />
                </div>
              </div>
              <div className="flex justify-between gap-2 mt-2">
                <button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">{t('sim_home:buttons.prev')}</button>
                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-white rounded font-bold transition ${isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting ? t('sim_home:buttons.submitting', { defaultValue: 'A enviar…' }) : t('sim_home:buttons.submit')}</button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input type="checkbox" id="aceitaRgpd" name="aceitaRgpd" checked={form.aceitaRgpd} onChange={handleChange} className="accent-blue-700 w-5 h-5" required onInvalid={e=>setCustomValidity(e as any,t('sim_home:messages.rgpdRequired'))} onInput={e=>setCustomValidity(e as any,'')} />
                <label htmlFor="aceitaRgpd" className="text-blue-900 text-sm select-none">
                  <Trans i18nKey="contact:rgpdText" components={{ 0: <a href={`${import.meta.env.BASE_URL}${base}/politica-rgpd`} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900" /> }} />
                </label>
              </div>
            </>
          )}
        </form>

        {mensagem && (
          <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-lg font-semibold shadow transition-opacity duration-500 ${mensagemTipo === 'sucesso' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`} style={{ minWidth: '260px', maxWidth: '350px', textAlign: 'left' }}>
            {mensagem}
          </div>
        )}
      </div>
    </div>
  );
}
