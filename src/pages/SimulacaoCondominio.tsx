import React, { useMemo, useState, useRef } from "react";
import Seo from "../components/Seo";
import { safeEmailSend, EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, EMAILJS_USER_ID_GENERIC } from "../emailjs.config";
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';
import { auth } from '../firebase';
import { saveSimulation } from '../utils/simulations';

type FormState = {
  // Passo 1 - Contacto e identificação
  administradorNome: string;
  administradorEmail: string;
  administradorTelefone?: string;
  condominioNome?: string;
  morada: string;
  codigoPostal?: string;
  localidade?: string;
  // Passo 2 - Dados do condomínio
  numeroFracoes?: string; // numeric string
  numeroPisos?: string; // numeric string
  anoConstrucao?: string; // yyyy
  temElevadores: string; // 'Sim' | 'Não'
  numeroElevadores?: string; // numeric string when temElevadores = 'Sim'
  temGaragem: string; // 'Sim' | 'Não'
  capitalEdificio: string; // e.g., 250 000
  sinistros5Anos: string; // 'Sim' | 'Não'
  detalhesSinistros?: string;
  outrosPedidos?: string;
  // Passo 3
  aceitaRgpd: boolean;
};

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

function sanitizeTemplateParams(params: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) { out[k] = ""; continue; }
    if (typeof v === 'string') { out[k] = v; continue; }
    try { out[k] = JSON.stringify(v); } catch { out[k] = String(v); }
  }
  return out;
}

export default function SimulacaoCondominio(): React.ReactElement {
  const [step, setStep] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const busyRef = useRef(false);
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState<'sucesso'|'erro'|''>('');
  const { user } = useAuth();
  const { requireAuth } = useAuthUX();
  const [form, setForm] = useState<FormState>({
    administradorNome: '',
    administradorEmail: '',
    administradorTelefone: '',
  condominioNome: '',
    morada: '',
    codigoPostal: '',
    localidade: '',
    numeroFracoes: '',
    numeroPisos: '',
    anoConstrucao: '',
    temElevadores: 'Não',
    numeroElevadores: '',
    temGaragem: 'Não',
    capitalEdificio: '',
    sinistros5Anos: 'Não',
    detalhesSinistros: '',
    outrosPedidos: '',
    aceitaRgpd: false,
  });

  const canNext1 = useMemo(() => !!form.administradorNome && !!form.administradorEmail && !!form.morada && !!form.codigoPostal && !!form.localidade, [form]);
  const canNext2 = useMemo(() => !!form.numeroFracoes && !!form.numeroPisos && !!form.anoConstrucao && !!form.capitalEdificio, [form]);
  const canSubmit = useMemo(() => step===3 && !!form.capitalEdificio && !!form.administradorEmail && form.aceitaRgpd && !enviando, [step, form, enviando]);

  const setCustomValidity = (e: React.FormEvent<any>, message: string) => {
    (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).setCustomValidity(message);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const target = e.target as HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement;
    const { name, value } = target;
    setMensagem(''); setMensagemTipo('');
    if ((target as HTMLInputElement).type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (target as HTMLInputElement).checked } as FormState));
      return;
    }
    // Numeric only fields
    if (["numeroFracoes","numeroPisos","numeroElevadores"].includes(name)) {
      const v = value.replace(/\D/g,'');
      setForm(prev => ({ ...prev, [name]: v } as FormState));
      return;
    }
    if (name === 'anoConstrucao') {
      const v = value.replace(/\D/g,'').slice(0,4);
      setForm(prev => ({ ...prev, anoConstrucao: v }));
      return;
    }
    if (name === 'capitalEdificio') {
      // keep only digits and format with spaces as thousands separators
      const digits = value.replace(/\D/g,'');
      const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
      setForm(prev => ({ ...prev, [name]: withThousands } as FormState));
      return;
    }
    if (name === 'administradorTelefone') {
      const v = value.replace(/[^+0-9\s]/g,'').slice(0,20);
      setForm(prev => ({ ...prev, administradorTelefone: v }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value } as FormState));
  };

  const handleNext: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (step === 1 && canNext1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await requireAuth();
    if (enviando || busyRef.current) return; // prevent double submit
    if (!canSubmit) return;
    setEnviando(true); setMensagem(''); setMensagemTipo('');

    const tipoSeguro = 'Seguro Condomínio';
    const subjectEmail = tipoSeguro;

    const resumo = [
      `Administrador: ${form.administradorNome}`,
  form.condominioNome ? `Condomínio: ${form.condominioNome}` : null,
      `Email: ${form.administradorEmail}`,
      form.administradorTelefone ? `Telefone: ${form.administradorTelefone}` : null,
      `Morada: ${form.morada}${form.codigoPostal ? ', ' + form.codigoPostal : ''}${form.localidade ? ' ' + form.localidade : ''}`,
      form.numeroFracoes ? `N.º frações: ${form.numeroFracoes}` : null,
      form.numeroPisos ? `N.º pisos: ${form.numeroPisos}` : null,
      form.anoConstrucao ? `Ano construção: ${form.anoConstrucao}` : null,
      `Elevadores: ${form.temElevadores}${form.temElevadores==='Sim' && form.numeroElevadores ? ' ('+form.numeroElevadores+')' : ''}`,
      `Garagem: ${form.temGaragem}`,
      `Capital edifício: € ${form.capitalEdificio}`,
      `Sinistros 5 anos: ${form.sinistros5Anos}${form.sinistros5Anos==='Sim' && form.detalhesSinistros ? ' - ' + form.detalhesSinistros : ''}`,
      form.outrosPedidos ? `Outros pedidos: ${form.outrosPedidos}` : null,
    ].filter(Boolean).join('\n');

    const detalhes_html = `
      <h4 style="margin:12px 0 6px;">Dados de contacto</h4>
      <table style="border-collapse:collapse;width:100%"><tbody>
        <tr><td><b>Administrador</b></td><td>${form.administradorNome}</td></tr>
        ${form.condominioNome ? `<tr><td><b>Condomínio</b></td><td>${form.condominioNome}</td></tr>` : ''}
        <tr><td><b>Email</b></td><td>${form.administradorEmail}</td></tr>
        ${form.administradorTelefone ? `<tr><td><b>Telefone</b></td><td>${form.administradorTelefone}</td></tr>` : ''}
      </tbody></table>
      <h4 style="margin:12px 0 6px;">Condomínio</h4>
      <table style="border-collapse:collapse;width:100%"><tbody>
        <tr><td><b>Morada</b></td><td>${form.morada}${form.codigoPostal ? ', ' + form.codigoPostal : ''}${form.localidade ? ' ' + form.localidade : ''}</td></tr>
        ${form.numeroFracoes ? `<tr><td><b>N.º frações</b></td><td>${form.numeroFracoes}</td></tr>` : ''}
        ${form.numeroPisos ? `<tr><td><b>N.º pisos</b></td><td>${form.numeroPisos}</td></tr>` : ''}
        ${form.anoConstrucao ? `<tr><td><b>Ano construção</b></td><td>${form.anoConstrucao}</td></tr>` : ''}
      </tbody></table>
      <h4 style="margin:12px 0 6px;">Questionário</h4>
      <table style="border-collapse:collapse;width:100%"><tbody>
        <tr><td><b>Elevadores</b></td><td>${form.temElevadores}${form.temElevadores==='Sim' && form.numeroElevadores ? ' ('+form.numeroElevadores+')' : ''}</td></tr>
        <tr><td><b>Garagem</b></td><td>${form.temGaragem}</td></tr>
        <tr><td><b>Capital edifício</b></td><td>€ ${form.capitalEdificio}</td></tr>
        <tr><td><b>Sinistros 5 anos</b></td><td>${form.sinistros5Anos}</td></tr>
        ${form.sinistros5Anos==='Sim' && form.detalhesSinistros ? `<tr><td><b>Detalhes sinistros</b></td><td>${form.detalhesSinistros.replace(/\n/g,'<br/>')}</td></tr>` : ''}
        ${form.outrosPedidos ? `<tr><td><b>Outros pedidos</b></td><td>${form.outrosPedidos.replace(/\n/g,'<br/>')}</td></tr>` : ''}
      </tbody></table>
    `;

    const templateParams = sanitizeTemplateParams({
      nome: form.administradorNome,
      email: form.administradorEmail,
      tipoSeguro: tipoSeguro,
      subjectEmail,
      resultado: resumo,
      detalhes_html,
    });

    if (isDev) {
      console.debug('[EmailJS][Condominio] Params keys:', Object.keys(templateParams));
      console.debug('[EmailJS][Condominio] detalhes_html length:', templateParams.detalhes_html?.length);
    }

    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
              const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
              const key = ['condominio', form.administradorEmail || 'anon', minuteBucket.toISOString()].join(':');
              await saveSimulation(uid, {
          type: 'condominio',
          title: `Condomínio - ${form.localidade || form.morada.split(',')[0] || ''}`,
          summary: `Fracoes: ${form.numeroFracoes || '-'} | Edifício: € ${form.capitalEdificio}`,
          status: 'submitted',
          payload: { ...form },
              }, { idempotencyKey: key });
        } catch (err) {
          console.warn('[Condominio] Falha a guardar simulação (ignorado):', err);
        }
      }
      console.log('[EmailJS][Condominio] Sending', { service: EMAILJS_SERVICE_ID_GENERIC, template: EMAILJS_TEMPLATE_ID_GENERIC });
      await safeEmailSend(EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, templateParams, EMAILJS_USER_ID_GENERIC);
      console.log('[EmailJS][Condominio] Success');
        setMensagem('Obrigado! Recebemos o seu pedido e entraremos em contacto.');
        setMensagemTipo('sucesso');
        setStep(1);
        setForm({
          administradorNome: '', administradorEmail: '', administradorTelefone: '', morada: '', codigoPostal: '', localidade: '',
          numeroFracoes: '', numeroPisos: '', anoConstrucao: '', temElevadores: 'Não', numeroElevadores: '', temGaragem: 'Não',
          capitalEdificio: '', sinistros5Anos: 'Não', detalhesSinistros: '', outrosPedidos: '', aceitaRgpd: false,
        });
    } catch (err) {
        console.error('[EmailJS][Condominio] send error:', err);
        setMensagem('Ocorreu um erro ao enviar. Tente novamente.');
        setMensagemTipo('erro');
    } finally {
      setEnviando(false); setTimeout(()=>{ setMensagem(''); setMensagemTipo(''); }, 6000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4">
      <Seo
        title={"Simulação Condomínio"}
        description={"Simule o seguro de condomínio e receba proposta personalizada."}
        canonicalPath={(typeof window !== 'undefined' ? window.location.pathname : '/pt/simulacao-condominio')}
      />
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900">Simulação Seguro Condomínio</h2>
          <p className="text-blue-700 mt-2">Preencha os dados para receber uma proposta personalizada.</p>
          <div className="text-blue-700 font-medium mt-2">Passo {step} de 3</div>
        </div>

        <form onSubmit={step===3?handleSubmit:handleNext} className="space-y-5 mt-6">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">1. Contacto e identificação</h3>
              <input name="administradorNome" value={form.administradorNome} onChange={handleChange} placeholder="Nome do administrador / contacto" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique o seu nome.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="condominioNome" value={form.condominioNome || ''} onChange={handleChange} placeholder="Nome do condomínio (opcional)" className="w-full p-3 border border-blue-300 rounded-lg" />
              <input name="administradorEmail" type="email" value={form.administradorEmail} onChange={handleChange} placeholder="Email de contacto" className="w-full p-3 border border-blue-300 rounded-lg" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" onInvalid={e=>setCustomValidity(e,'Insira um email válido.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="administradorTelefone" value={form.administradorTelefone} onChange={handleChange} placeholder="Telefone (opcional)" className="w-full p-3 border border-blue-300 rounded-lg" />
              <input name="morada" value={form.morada} onChange={handleChange} placeholder="Morada do condomínio" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique a morada.')} onInput={e=>setCustomValidity(e,'')} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="codigoPostal" value={form.codigoPostal} onChange={handleChange} placeholder="Código Postal" className="w-full p-3 border border-blue-300 rounded-lg" required pattern="^\d{4}-?\d{3}$" onInvalid={e=>setCustomValidity(e,'Indique um código postal válido (ex.: 1234-567).')} onInput={e=>setCustomValidity(e,'')} />
                <input name="localidade" value={form.localidade} onChange={handleChange} placeholder="Localidade" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique a localidade.')} onInput={e=>setCustomValidity(e,'')} />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-6 py-2 bg-gray-200 rounded" disabled>Anterior</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition" disabled={!canNext1}>Próximo</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">2. Dados do condomínio</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="numeroFracoes" className="block text-sm font-semibold mb-1">N.º de frações</label>
                  <input id="numeroFracoes" name="numeroFracoes" value={form.numeroFracoes||''} onChange={handleChange} placeholder="N.º de frações" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" required onInvalid={e=>setCustomValidity(e,'Indique o número de frações.')} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label htmlFor="numeroPisos" className="block text-sm font-semibold mb-1">N.º de pisos</label>
                  <input id="numeroPisos" name="numeroPisos" value={form.numeroPisos||''} onChange={handleChange} placeholder="N.º de pisos" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" required onInvalid={e=>setCustomValidity(e,'Indique o número de pisos.')} onInput={e=>setCustomValidity(e,'')} />
                </div>
                <div>
                  <label htmlFor="anoConstrucao" className="block text-sm font-semibold mb-1">Ano de construção</label>
                  <input id="anoConstrucao" name="anoConstrucao" value={form.anoConstrucao||''} onChange={handleChange} placeholder="Ano construção" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" maxLength={4} required onInvalid={e=>setCustomValidity(e,'Indique o ano de construção.')} onInput={e=>setCustomValidity(e,'')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="temElevadores" className="block text-sm font-semibold mb-1">Tem elevadores?</label>
                  <select id="temElevadores" name="temElevadores" value={form.temElevadores} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg">
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                </div>
                {form.temElevadores==='Sim' && (
                  <div>
                    <label htmlFor="numeroElevadores" className="block text-sm font-semibold mb-1">N.º de elevadores</label>
                    <input id="numeroElevadores" name="numeroElevadores" value={form.numeroElevadores||''} onChange={handleChange} placeholder="N.º de elevadores" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="temGaragem" className="block text-sm font-semibold mb-1">Tem garagem?</label>
                  <select id="temGaragem" name="temGaragem" value={form.temGaragem} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg">
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="capitalEdificio" className="block text-sm font-semibold mb-1">Capital edifício</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-800 font-semibold select-none">€</span>
                    <input id="capitalEdificio" name="capitalEdificio" value={form.capitalEdificio||''} onChange={handleChange} placeholder="Ex.: 250 000" className="w-full pl-8 p-3 border border-blue-300 rounded-lg" inputMode="numeric" required onInvalid={e=>setCustomValidity(e,'Indique o capital do edifício.')} onInput={e=>setCustomValidity(e,'')} />
                  </div>
                </div>
              </div>
              {/* Campo Capital RC removido conforme pedido */}
              <div>
                <label className="block text-sm font-semibold mb-1">Teve sinistros nos últimos 5 anos?</label>
                <div className="flex gap-6">
                  {['Não','Sim'].map(v => (
                    <label key={v} className="inline-flex items-center gap-2">
                      <input type="radio" name="sinistros5Anos" value={v} checked={form.sinistros5Anos===v} onChange={handleChange} /> {v}
                    </label>
                  ))}
                </div>
                {form.sinistros5Anos==='Sim' && (
                  <div className="mt-2">
                    <label htmlFor="detalhesSinistros" className="block text-sm font-semibold mb-1">Detalhes dos sinistros</label>
                    <textarea id="detalhesSinistros" name="detalhesSinistros" value={form.detalhesSinistros||''} onChange={handleChange} placeholder="Descreva datas, causas e valores aproximados" className="w-full p-3 border border-blue-300 rounded-lg min-h-[90px]" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Outros pedidos / detalhes (opcional)</label>
                <textarea name="outrosPedidos" value={form.outrosPedidos||''} onChange={handleChange} placeholder="Ex.: capitais pretendidos por fração, gestão profissional, etc." className="w-full p-3 border border-blue-300 rounded-lg min-h-[90px]" />
              </div>
              <div className="flex justify-between gap-2 mt-2">
                <button type="button" onClick={()=>setStep(1)} className="px-6 py-2 bg-gray-200 rounded">Anterior</button>
                <button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition" disabled={!canNext2}>Próximo</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">3. RGPD e envio</h3>
              <label className="flex items-start gap-2 text-sm text-blue-800">
                <input type="checkbox" name="aceitaRgpd" checked={form.aceitaRgpd} onChange={handleChange} required onInvalid={e=> (e.target as HTMLInputElement).setCustomValidity('Necessário aceitar a Política de Privacidade & RGPD.')} onInput={e=> (e.target as HTMLInputElement).setCustomValidity('')} />
                <span>Li e aceito a <a href={`${import.meta.env.BASE_URL}politica-rgpd`} target="_blank" className="underline">Política de Privacidade & RGPD</a>.</span>
              </label>
              <div className="flex justify-between gap-2 mt-2">
                <button type="button" onClick={()=>setStep(2)} className="px-6 py-2 bg-gray-200 rounded">Anterior</button>
                <button type="submit" onClick={()=>{}} disabled={!canSubmit} className={`px-6 py-2 rounded font-bold text-white transition ${canSubmit ? 'bg-blue-700 hover:bg-blue-900' : 'bg-blue-300 cursor-not-allowed'}`}>{enviando ? 'A enviar…' : 'Enviar pedido'}</button>
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
