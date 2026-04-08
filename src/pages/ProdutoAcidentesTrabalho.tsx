import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { safeEmailSend, EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, EMAILJS_USER_ID_GENERIC } from "../emailjs.config";
import Seo from "../components/Seo";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Colaborador = {
  nome: string;
  nif: string;
  funcao: string;
  vencimentoMensal: string; // € por mês
  subsidioAlimentacaoMensal: string; // € por mês
};

type FormState = {
  // Passo 1 - Empresa
  empresaNome: string;
  empresaNif: string;
  empresaMorada: string;
  empresaEmail: string;
  // Passo 2 - Colaboradores
  colaboradores: Colaborador[];
  aceitaRgpd?: boolean;
  outrosPedidos?: string;
};

export default function ProdutoAcidentesTrabalho() {
  const { t } = useTranslation('product_work');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const [step, setStep] = useState<number>(1);
  const [showForm, setShowForm] = useState<boolean>(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const { hash } = useLocation();
  const [form, setForm] = useState<FormState>({
    empresaNome: "",
    empresaNif: "",
    empresaMorada: "",
    empresaEmail: "",
    colaboradores: [ { nome: "", nif: "", funcao: "", vencimentoMensal: "", subsidioAlimentacaoMensal: "" } ],
    aceitaRgpd: false,
    outrosPedidos: "",
  });
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mensagemTipo, setMensagemTipo] = useState<"sucesso" | "erro" | null>(null);

  // Exibir formulário se URL tiver âncora (#form-at) e rolar até ele
  useEffect(() => {
    if (hash === "#form-at") {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [hash]);

  function handleAbrirFormulario() {
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function validarNIF(nif: string) {
    if (!/^[0-9]{9}$/.test(nif)) return false;
    const n = nif.split('').map(Number);
    if (![1,2,3,5,6,8,9].includes(n[0])) return false;
    let soma = 0; for (let i=0;i<8;i++) soma += n[i]*(9-i);
    let controlo = 11 - (soma % 11); if (controlo >= 10) controlo = 0; return controlo === n[8];
  }
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;
    const type = (target as HTMLInputElement).type;
    const value = type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm(prev => ({ ...prev, [name]: value as any }));
  }

  // Ajuda para mensagens de validade customizadas nos inputs
  function setCustomValidity(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, message: string) {
    e.currentTarget.setCustomValidity(message);
  }

  // Handlers para a lista de colaboradores
  function handleColabChange(index: number, field: keyof Colaborador, rawValue: string) {
    let value = rawValue;
    if (field === 'vencimentoMensal') {
      const digits = rawValue.replace(/\D/g, '');
      value = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    } else if (field === 'subsidioAlimentacaoMensal') {
      let cleaned = rawValue.replace(/[^0-9.,]/g, '').replace(/\./g, ',');
      const parts = cleaned.split(',');
      if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('').replace(/,/g, '');
      value = cleaned;
    } else if (field === 'nif') {
      value = rawValue.replace(/\D/g, '').slice(0, 9);
    }
    const colaboradores = [...form.colaboradores];
    colaboradores[index] = { ...colaboradores[index], [field]: value } as Colaborador;
    setForm(prev => ({ ...prev, colaboradores }));
  }

  function addColaborador() {
    setForm(prev => ({
      ...prev,
      colaboradores: [...prev.colaboradores, { nome: '', nif: '', funcao: '', vencimentoMensal: '', subsidioAlimentacaoMensal: '' }]
    }));
  }

  function removeColaborador(index: number) {
    setForm(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.length > 1 ? prev.colaboradores.filter((_, i) => i !== index) : prev.colaboradores
    }));
  }
  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!form.empresaNome || !form.empresaNif || !form.empresaMorada || !form.empresaEmail) { setMensagem('Preencha os dados da empresa, incluindo o email de contacto.'); setMensagemTipo('erro'); return; }
      if (!validarNIF(form.empresaNif)) { setMensagem('NIF da empresa inválido.'); setMensagemTipo('erro'); return; }
    }
    if (step === 2) {
      // validação completa antes de enviar no submit
    }
    setMensagem(null); setMensagemTipo(null);
    setStep(s=>s+1);
  }

  function handlePrev(e: FormEvent) { e.preventDefault(); setStep(s=>Math.max(1, s-1)); }

  // Converte vencimento formatado com separadores de milhar por espaços em número (euros inteiros)
  function parseVencimento(v: string) { if (!v) return 0; const x = v.replace(/\s+/g, ''); const n = Number(x); return isFinite(n) ? n : 0; }
  // Converte subsídio com separador decimal por vírgula (ou ponto) em número
  function parseSubsidio(v: string) { if (!v) return 0; const n = Number(v.replace(',', '.')); return isFinite(n) ? n : 0; }

  function formatEUR(n: number) { return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // validação colaboradores e RGPD
    for (const c of form.colaboradores) {
      if (!c.nome || !c.nif || !c.funcao) { setMensagem('Preencha todos os campos dos colaboradores.'); setMensagemTipo('erro'); return; }
      if (!validarNIF(c.nif)) { setMensagem(`NIF inválido para colaborador: ${c.nome||''}`); setMensagemTipo('erro'); return; }
      if (parseVencimento(c.vencimentoMensal) <= 0) { setMensagem(`Vencimento mensal inválido para: ${c.nome||''}`); setMensagemTipo('erro'); return; }
    }
    if (!form.aceitaRgpd) { setMensagem('Necessário aceitar a Política de Privacidade & RGPD.'); setMensagemTipo('erro'); return; }

    const colaboradoresResumo = form.colaboradores.map((c,i) => {
      const sal = parseVencimento(c.vencimentoMensal);
      const sub = parseSubsidio(c.subsidioAlimentacaoMensal);
      const anual14 = sal * 14;
      return `${i+1}. ${c.nome} | NIF: ${c.nif} | Função: ${c.funcao} | Venc. mensal: ${formatEUR(sal)} € | Anual (x14): ${formatEUR(anual14)} € | SA mensal: ${formatEUR(sub)} €`;
    }).join('\n');

  const resumo = `Proposta - Acidentes de Trabalho\nEmpresa: ${form.empresaNome} | NIF: ${form.empresaNif}\nMorada: ${form.empresaMorada}\nEmail: ${form.empresaEmail}\nColaboradores:\n${colaboradoresResumo}\nOutros pedidos: ${form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-'}`;

    // HTML genérico para {{detalhes_html}} no EmailJS
    const colaboradoresHtmlRows = form.colaboradores.map((c) => {
      const sal = parseVencimento(c.vencimentoMensal);
      const sub = parseSubsidio(c.subsidioAlimentacaoMensal);
      const anual14 = sal * 14;
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.nome || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.nif || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.funcao || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb; text-align:right;">${formatEUR(sal)} €</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb; text-align:right;">${formatEUR(anual14)} €</td>
        <td style="padding:6px 8px;border:1px solid #e5e7eb; text-align:right;">${formatEUR(sub)} €</td>
      </tr>`;
    }).join('');

    const detalhesHtml = `
      <div style="margin-top:14px">
        <h3 style="margin:0 0 8px 0;color:#1f2937;">Dados da empresa</h3>
        <table role="presentation" style="border-collapse:collapse;font-size:14px;">
          <tbody>
            <tr><td style="padding:4px 8px;color:#374151;">Nome</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaNome}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">NIF</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaNif}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Morada</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaMorada}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Email</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaEmail}</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:14px">
        <h3 style="margin:0 0 8px 0;color:#1f2937;">Colaboradores</h3>
        <table role="presentation" style="border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left;">Nome</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left;">NIF</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left;">Função</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:right;">Venc. mensal</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:right;">Anual (x14)</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:right;">SA mensal</th>
            </tr>
          </thead>
          <tbody>
            ${colaboradoresHtmlRows}
          </tbody>
        </table>
      </div>
      <div style=\"margin-top:14px\">
        <h3 style=\"margin:0 0 8px 0;color:#1f2937;\">Outros pedidos / detalhes</h3>
        <div style=\"padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;color:#111827;\">${(form.outrosPedidos?.trim() || '-').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      </div>
    `;

    const templateParams = {
      nome: form.empresaNome,
  email: form.empresaEmail,
      contribuinte: form.empresaNif,
      morada: form.empresaMorada,
      colaboradores: colaboradoresResumo,
      tipoSeguro: 'Acidentes de Trabalho',
      subjectEmail: 'Acidentes de Trabalho',
  detalhes_html: detalhesHtml,
      outrosPedidos: form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-',
      resultado: resumo,
    } as Record<string, any>;

  safeEmailSend(EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, templateParams, EMAILJS_USER_ID_GENERIC)
      .then(() => {
        setMensagem('Pedido enviado com sucesso!'); setMensagemTipo('sucesso');
  setForm({ empresaNome: "", empresaNif: "", empresaMorada: "", empresaEmail: "", colaboradores: [ { nome: "", nif: "", funcao: "", vencimentoMensal: "", subsidioAlimentacaoMensal: "" } ], aceitaRgpd: false, outrosPedidos: "" });
        setStep(1);
        setTimeout(()=>{ setMensagem(null); setMensagemTipo(null); }, 6000);
      })
      .catch(err => { console.error(err); setMensagem('Ocorreu um erro ao enviar. Tente novamente.'); setMensagemTipo('erro'); setTimeout(()=>{ setMensagem(null); setMensagemTipo(null); }, 6000); });
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-12 px-4">
      <Seo
        title={t('seoTitle')}
        description={t('seoDesc')}
        canonicalPath={`/${base}/produto-acidentes-trabalho`}
      />
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        {/* Header visual com imagem e título */}
        <div className="relative h-56 md:h-80 w-full flex items-center justify-center bg-blue-900">
          <img src="https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=800&q=60" alt={t('headerTitle')} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="relative z-10 text-center w-full">
            <h1 className="text-2xl md:text-5xl leading-tight font-extrabold text-white drop-shadow mb-2">{t('headerTitle')}</h1>
            <p className="text-sm md:text-lg text-blue-100 font-medium mb-4">{t('headerSubtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" onClick={handleAbrirFormulario} className="inline-block px-8 py-3 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition">{t('ctaRequest')}</button>
              <Link to={`/${base}/contato`} className="inline-block px-8 py-3 bg-blue-400 text-white font-bold rounded-full shadow-lg hover:bg-blue-300 transition">{t('ctaContact')}</Link>
            </div>
          </div>
        </div>
        {/* Conteúdo principal */}
        <div className="p-8 space-y-10">
          {/* Seção: Benefícios */}
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              {t('whyTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: '🦺' },
                { icon: '👷‍♂️' },
                { icon: '🏥' },
                { icon: '�' },
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-50 rounded-xl p-5 shadow flex gap-3 items-start">
                  <span className="text-blue-700 text-2xl">{item.icon}</span>
                  <span>{t(`whyItems.${idx}`)}</span>
                </div>
              ))}
            </div>
          </section>
          {/* Seção: Coberturas */}
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="14" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
              {t('coveragesTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-blue-100 shadow p-5">
                  <h3 className="font-bold text-blue-700 mb-1">{t(`coverages.${idx}.title`)}</h3>
                  <p className="text-gray-700">{t(`coverages.${idx}.desc`)}</p>
                </div>
              ))}
            </div>
          </section>
          {/* Seção: Vantagens */}
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              {t('advantagesTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: '📱' },
                { icon: '🕒' },
                { icon: '💡' },
                { icon: '👨‍👩‍👧‍�' },
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-50 rounded-xl p-5 shadow flex gap-3 items-start">
                  <span className="text-blue-700 text-2xl">{item.icon}</span>
                  <span>{t(`advantages.${idx}`)}</span>
                </div>
              ))}
            </div>
          </section>
          {/* Seção: Como contratar */}
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              {t('howTitle')}
            </h2>
            <ol className="list-decimal pl-6 text-blue-900 text-lg space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <li key={idx}>{t(`howSteps.${idx}`)}</li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      {/* Formulário Proposta - Acidentes de Trabalho */}
      {showForm && (
      <div id="form-at" ref={formRef} className="max-w-lg w-full mt-12 p-8 bg-white bg-opacity-90 rounded-2xl shadow-xl relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-blue-900 text-center">{t('formTitle')}</h2>
        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1,2].map(n => (
              <div key={n} className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all duration-300 ${step >= n ? 'bg-blue-700 scale-110' : 'bg-blue-300 scale-100'}`}>{n}</div>
            ))}
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-700 transition-all duration-500" style={{ width: `${step * 50}%` }} />
          </div>
          <div className="text-center text-blue-700 font-medium mt-2">Passo {step} de 2</div>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : handleNext} className="space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">1. Identificação da Empresa</h3>
              <input name="empresaNome" value={form.empresaNome} onChange={handleChange} placeholder="Nome da empresa" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique o nome da empresa.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="empresaNif" value={form.empresaNif} onChange={e=>{
                const v = e.target.value.replace(/\D/g,'').slice(0,9);
                setForm(prev=>({ ...prev, empresaNif: v }));
              }} placeholder="NIF da empresa (9 dígitos)" className={`w-full p-3 border rounded-lg ${form.empresaNif && !validarNIF(form.empresaNif) ? 'border-red-500' : 'border-blue-300'}`} required maxLength={9} pattern="[0-9]{9}" onInvalid={e=>setCustomValidity(e,'NIF inválido.')} onInput={e=>setCustomValidity(e,'')} />
              <textarea name="empresaMorada" value={form.empresaMorada} onChange={handleChange} placeholder="Morada completa" className="w-full p-3 border border-blue-300 rounded-lg min-h-[80px]" required onInvalid={e=>setCustomValidity(e,'Indique a morada.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="empresaEmail" type="email" value={form.empresaEmail} onChange={handleChange} placeholder="Email de contacto" className="w-full p-3 border border-blue-300 rounded-lg" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" onInvalid={e=>setCustomValidity(e,'Insira um email válido.')} onInput={e=>setCustomValidity(e,'')} />
              <div className="flex justify-end gap-2 mt-2"><button type="button" className="px-6 py-2 bg-gray-200 rounded" disabled>Anterior</button><button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">Próximo</button></div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">2. Colaboradores</h3>
              <div className="space-y-4">
                {form.colaboradores.map((c, idx) => (
                  <div key={idx} className="border border-blue-100 rounded-lg p-4 bg-blue-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-blue-900">Colaborador #{idx+1}</div>
                      <button type="button" onClick={()=>removeColaborador(idx)} className="text-red-700 text-sm hover:underline" disabled={form.colaboradores.length===1}>Remover</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={c.nome} onChange={e=>handleColabChange(idx,'nome',e.target.value)} placeholder="Nome completo" className="w-full p-3 border border-blue-300 rounded-lg" required />
                      <input value={c.nif} onChange={e=>handleColabChange(idx,'nif',e.target.value)} placeholder="NIF (9 dígitos)" className={`w-full p-3 border rounded-lg ${c.nif && !validarNIF(c.nif) ? 'border-red-500' : 'border-blue-300'}`} required maxLength={9} />
                      <input value={c.funcao} onChange={e=>handleColabChange(idx,'funcao',e.target.value)} placeholder="Função / Cargo" className="w-full p-3 border border-blue-300 rounded-lg" required />
                      <div>
                        <label className="block text-sm font-semibold mb-1">Vencimento mensal bruto</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-800 font-semibold select-none">€</span>
                          <input value={c.vencimentoMensal} onChange={e=>handleColabChange(idx,'vencimentoMensal',e.target.value)} placeholder="Ex.: 1 250" className="w-full pl-8 p-3 border border-blue-300 rounded-lg" required inputMode="numeric" aria-label="Vencimento mensal bruto com separador de milhar por espaços" />
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-800 font-semibold select-none">€</span>
                        <input value={c.subsidioAlimentacaoMensal} onChange={e=>handleColabChange(idx,'subsidioAlimentacaoMensal',e.target.value)} placeholder="Ex.: 9,60" className="w-full pl-8 p-3 border border-blue-300 rounded-lg" inputMode="decimal" aria-label="Subsídio de alimentação mensal em euros vírgula cêntimos" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3"><button type="button" onClick={addColaborador} className="px-4 py-2 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200">+ Adicionar colaborador</button></div>
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1">Outros pedidos / detalhes</label>
                <textarea name="outrosPedidos" value={form.outrosPedidos || ''} onChange={handleChange} placeholder="Ex.: atividade específica, limites, observações…" className="w-full p-3 border rounded bg-white min-h-[90px]" />
              </div>
              <div className="mb-4 mt-4 flex items-center gap-2">
                <input type="checkbox" id="aceitaRgpd" name="aceitaRgpd" checked={!!form.aceitaRgpd} onChange={handleChange} className="accent-blue-700 w-5 h-5" required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Necessário aceitar a Política de Privacidade & RGPD.')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
                <label htmlFor="aceitaRgpd" className="text-blue-900 text-sm select-none">Li e aceito a <a href={`/${base}/politica-rgpd`} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">Política de Privacidade & RGPD</a>.</label>
              </div>
              <div className="flex justify-between gap-2 mt-2"><button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">Anterior</button><button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition">Pedir Proposta</button></div>
            </>
          )}
        </form>
        {mensagem && (
          <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-lg font-semibold shadow transition-opacity duration-500 ${mensagemTipo === 'sucesso' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`} style={{ minWidth: '260px', maxWidth: '350px', textAlign: 'left' }}>
            {mensagem}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
