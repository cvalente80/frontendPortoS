import React, { useRef, useState, ChangeEvent, FormEvent } from "react";
import Seo from "../components/Seo";
import { safeEmailSend, EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, EMAILJS_USER_ID_GENERIC } from "../emailjs.config";
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';
import { auth } from '../firebase';
import { saveSimulation } from '../utils/simulations';

type FormState = {
  // Passo 1 - Empresa
  empresaNome: string;
  empresaNif: string;
  empresaEmail: string;
  // Passo 2 - Questionário
  atividade: string;
  anosAtividade?: string;
  numeroColaboradores?: string;
  volumeNegocios?: string; // com separadores de milhar (espaços) e vírgula opcional
  capitais: string; // limite de indemnização desejado
  franquia: string;
  coberturas: string[];
  mercados: string[]; // Portugal, UE, Fora UE
  teveSinistros?: boolean;
  detalhesSinistros?: string;
  descricaoAtividade?: string;
  // Passo 3
  aceitaRgpd?: boolean;
  outrosPedidos?: string;
};

function validarNIF(nif: string): boolean { if (!/^[0-9]{9}$/.test(nif)) return false; const n = nif.split('').map(Number); if (![1,2,3,5,6,8,9].includes(n[0])) return false; let soma = 0; for (let i=0;i<8;i++) soma += n[i]*(9-i); let controlo = 11 - (soma % 11); if (controlo >= 10) controlo = 0; return controlo === n[8]; }

export default function SimulacaoResponsabilidadeCivilProfissional() {
  const [step, setStep] = useState<number>(1);
  const { user } = useAuth();
  const { requireAuth } = useAuthUX();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busyRef = useRef(false);
  const [form, setForm] = useState<FormState>({
    empresaNome: "",
    empresaNif: "",
    empresaEmail: "",
    atividade: "",
    anosAtividade: "",
    numeroColaboradores: "",
    volumeNegocios: "",
    capitais: "",
    franquia: "",
    coberturas: [],
    mercados: [],
    teveSinistros: undefined,
    detalhesSinistros: "",
    descricaoAtividade: "",
    aceitaRgpd: false,
    outrosPedidos: "",
  });
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mensagemTipo, setMensagemTipo] = useState<"sucesso" | "erro" | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  function setCustomValidity(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, message: string) {
    (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).setCustomValidity(message);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value, type } = target;
    if (type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      if (name === 'aceitaRgpd') setForm(prev => ({ ...prev, aceitaRgpd: checked }));
      if (name === 'teveSinistros') setForm(prev => ({ ...prev, teveSinistros: checked }));
      if (name === 'coberturas') {
        setForm(prev => ({ ...prev, coberturas: checked ? [...prev.coberturas, value] : prev.coberturas.filter(c=>c!==value) }));
      }
      if (name === 'mercados') {
        setForm(prev => ({ ...prev, mercados: checked ? [...prev.mercados, value] : prev.mercados.filter(m=>m!==value) }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value } as any));
    }
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!form.empresaNome || !form.empresaNif || !form.empresaEmail) { setMensagem('Preencha Nome, NIF e Email da empresa.'); setMensagemTipo('erro'); return; }
      if (!validarNIF(form.empresaNif)) { setMensagem('NIF da empresa inválido.'); setMensagemTipo('erro'); return; }
    }
    if (step === 2) {
      if (!form.atividade || !form.descricaoAtividade || !form.capitais || !form.franquia || !form.volumeNegocios) { setMensagem('Indique a atividade, descrição detalhada, volume de negócios, capitais e franquia.'); setMensagemTipo('erro'); return; }
    }
    setMensagem(null); setMensagemTipo(null); setStep(s=>s+1);
  }

  function handlePrev(e: FormEvent) { e.preventDefault(); setStep(s=>Math.max(1, s-1)); }

  function parseVolume(v?: string) { if (!v) return 0; const cleaned = v.replace(/\s+/g,'').replace(',', '.'); const n = Number(cleaned); return isFinite(n) ? n : 0; }
  function formatEUR(n: number) { return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function sanitizeTemplateParams(obj: Record<string, any>) { const out: Record<string, string> = {}; for (const [k,v] of Object.entries(obj)) { if (v==null) out[k] = ""; else if (v instanceof Date) out[k]=v.toISOString(); else if (Array.isArray(v)) out[k]=v.map(x=>x==null?'':String(x)).join(', '); else if (typeof v==='object') out[k]=JSON.stringify(v); else out[k]=String(v); } return out; }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || busyRef.current) return; // prevent double-submit
    setIsSubmitting(true); busyRef.current = true;
    await requireAuth();
    if (!form.aceitaRgpd) { setMensagem('Necessário aceitar a Política de Privacidade & RGPD.'); setMensagemTipo('erro'); return; }

  const resumo = `Proposta - RC Profissional\nEmpresa: ${form.empresaNome} | NIF: ${form.empresaNif}\nEmail: ${form.empresaEmail}\nAtividade: ${form.atividade}\nDescrição atividade: ${form.descricaoAtividade||'-'}\nAnos de atividade: ${form.anosAtividade||'-'}\nColaboradores: ${form.numeroColaboradores||'-'}\nVolume de negócios: ${form.volumeNegocios||'-'}\nCapitais: ${form.capitais}\nFranquia: ${form.franquia}\nCoberturas: ${form.coberturas.join(', ')||'-'}\nMercados: ${form.mercados.join(', ')||'-'}\nTeve sinistros 5 anos?: ${form.teveSinistros? 'Sim':'Não'}${form.teveSinistros?`\nDetalhes sinistros: ${form.detalhesSinistros||'-'}`:''}\nOutros pedidos: ${form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-'}`;
    setResultado(resumo);

    const detalhesHtml = `
      <div style="margin-top:10px">
        <h3 style="margin:0 0 8px 0;color:#1f2937;">Dados da empresa</h3>
        <table role="presentation" style="border-collapse:collapse;font-size:14px;">
          <tbody>
            <tr><td style="padding:4px 8px;color:#374151;">Nome</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaNome}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">NIF</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaNif}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Email</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.empresaEmail}</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px">
        <h3 style="margin:0 0 8px 0;color:#1f2937;">Questionário</h3>
        <table role="presentation" style="border-collapse:collapse;font-size:13px;">
          <tbody>
            <tr><td style="padding:4px 8px;color:#374151;">Atividade</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.atividade}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Descrição atividade</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${(form.descricaoAtividade||'-').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Anos de atividade</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.anosAtividade||'-'}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">N.º colaboradores</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.numeroColaboradores||'-'}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Volume de negócios</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.volumeNegocios||'-'}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Capitais</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.capitais}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Franquia</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.franquia}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Coberturas</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.coberturas.join(', ')||'-'}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Mercados</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.mercados.join(', ')||'-'}</td></tr>
            <tr><td style="padding:4px 8px;color:#374151;">Sinistros (5 anos)</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${form.teveSinistros? 'Sim':'Não'}</td></tr>
            ${form.teveSinistros ? `<tr><td style="padding:4px 8px;color:#374151;">Detalhes sinistros</td><td style="padding:4px 8px;color:#111827; font-weight:600;">${(form.detalhesSinistros||'-').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px">
        <h3 style=\"margin:0 0 8px 0;color:#1f2937;\">Outros pedidos / detalhes</h3>
        <div style=\"padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;color:#111827;\">${(form.outrosPedidos?.trim() || '-').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      </div>
    `;

    const templateParams = sanitizeTemplateParams({
      nome: form.empresaNome,
      email: form.empresaEmail,
      contribuinte: form.empresaNif,
      tipoSeguro: 'Responsabilidade Civil Profissional',
      subjectEmail: 'Responsabilidade Civil Profissional',
      resultado: resumo,
      detalhes_html: detalhesHtml,
      outrosPedidos: form.outrosPedidos?.trim() ? form.outrosPedidos.trim() : '-',
    });

    if ((import.meta as any).env?.DEV) {
      console.debug('[EmailJS][RCProf] Params keys:', Object.keys(templateParams));
    }

    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
          const key = ['rc_prof', form.empresaEmail || 'anon', minuteBucket.toISOString()].join(':');
          await saveSimulation(uid, {
          type: 'rc_prof',
          title: `RC Profissional - ${form.atividade || form.empresaNome}`,
          summary: `Empresa: ${form.empresaNome} | Capitais: ${form.capitais} | Franquia: ${form.franquia}`,
          status: 'submitted',
          payload: { ...form },
          }, { idempotencyKey: key });
        } catch (err) {
          console.warn('[RCProf] Falha a guardar simulação (ignorado):', err);
        }
      }
  console.log('[EmailJS][RCProf] Sending', { service: EMAILJS_SERVICE_ID_GENERIC, template: EMAILJS_TEMPLATE_ID_GENERIC });
  await safeEmailSend(EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_GENERIC, templateParams, EMAILJS_USER_ID_GENERIC);
  console.log('[EmailJS][RCProf] Success');
      setMensagem('Pedido enviado com sucesso!'); setMensagemTipo('sucesso'); setStep(1);
    } catch (err) {
      console.error('[EmailJS][RCProf] send error:', err);
      setMensagem('Ocorreu um erro ao enviar. Tente novamente.'); setMensagemTipo('erro');
    } finally {
      setTimeout(()=>{ setMensagem(null); setMensagemTipo(null); }, 6000);
      setIsSubmitting(false); busyRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-12 px-4">
      <Seo
        title={"Simulação Responsabilidade Civil Profissional"}
        description={"Simule o seguro de responsabilidade civil profissional e receba proposta personalizada."}
        canonicalPath={(typeof window !== 'undefined' ? window.location.pathname : '/pt/simulacao-rc-profissional')}
      />
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-blue-900 text-center">Simulação - RC Profissional</h2>
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
          <div className="text-center text-blue-700 font-medium mt-2">Passo {step} de 3</div>
        </div>

        <form onSubmit={step===3?handleSubmit:handleNext} className="space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">1. Identificação da Empresa</h3>
              <input name="empresaNome" value={form.empresaNome} onChange={handleChange} placeholder="Nome da empresa" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique o nome da empresa.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="empresaNif" value={form.empresaNif} onChange={e=>{ const v = e.target.value.replace(/\D/g,'').slice(0,9); setForm(prev=>({ ...prev, empresaNif: v })); }} placeholder="NIF da empresa (9 dígitos)" className={`w-full p-3 border rounded-lg ${form.empresaNif && !validarNIF(form.empresaNif) ? 'border-red-500' : 'border-blue-300'}`} required maxLength={9} pattern="[0-9]{9}" onInvalid={e=>setCustomValidity(e,'NIF inválido.')} onInput={e=>setCustomValidity(e,'')} />
              <input name="empresaEmail" type="email" value={form.empresaEmail} onChange={handleChange} placeholder="Email de contacto" className="w-full p-3 border border-blue-300 rounded-lg" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" onInvalid={e=>setCustomValidity(e,'Insira um email válido.')} onInput={e=>setCustomValidity(e,'')} />
              <div className="flex justify-end gap-2 mt-2"><button type="button" className="px-6 py-2 bg-gray-200 rounded" disabled>Anterior</button><button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">Próximo</button></div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">2. Questionário</h3>
              <input name="atividade" value={form.atividade} onChange={handleChange} placeholder="Atividade / Profissão" className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Indique a atividade.')} onInput={e=>setCustomValidity(e,'')} />
              <div>
                <label className="block text-sm font-semibold mb-1">Descrição detalhada da atividade</label>
                <textarea name="descricaoAtividade" value={form.descricaoAtividade||''} onChange={handleChange} placeholder="Descreva com pormenor os serviços prestados, âmbito, projetos típicos, etc." className="w-full p-3 border border-blue-300 rounded-lg min-h-[90px]" required onInvalid={e=>setCustomValidity(e,'Descreva a atividade com algum detalhe.')} onInput={e=>setCustomValidity(e,'')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="anosAtividade" value={form.anosAtividade||''} onChange={e=>{ const v = e.target.value.replace(/\D/g,''); setForm(p=>({...p, anosAtividade:v})); }} placeholder="Anos de atividade" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" />
                <input name="numeroColaboradores" value={form.numeroColaboradores||''} onChange={e=>{ const v = e.target.value.replace(/\D/g,''); setForm(p=>({...p, numeroColaboradores:v})); }} placeholder="Número de colaboradores" className="w-full p-3 border border-blue-300 rounded-lg" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Volume de negócios (anual)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-800 font-semibold select-none">€</span>
                  <input name="volumeNegocios" value={form.volumeNegocios||''} onChange={e=>{ let raw=e.target.value; // remover espaços e não dígitos
                    const digits = raw.replace(/\D/g,'');
                    // inserir separador de milhar por espaços
                    const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
                    setForm(p=>({...p, volumeNegocios: withThousands})); }} placeholder="Ex.: 250 000" className="w-full pl-8 p-3 border border-blue-300 rounded-lg" inputMode="numeric" required onInvalid={e=>setCustomValidity(e,'Indique o volume de negócios (em milhares).')} onInput={e=>setCustomValidity(e,'')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select name="capitais" value={form.capitais} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Selecione os capitais desejados.')} onInput={e=>setCustomValidity(e,'')} >
                  <option value="">Capitais desejados</option>
                  <option value="100.000 €">100.000 €</option>
                  <option value="250.000 €">250.000 €</option>
                  <option value="500.000 €">500.000 €</option>
                  <option value="1.000.000 €">1.000.000 €</option>
                  <option value="2.000.000 €">2.000.000 €</option>
                </select>
                <select name="franquia" value={form.franquia} onChange={handleChange} className="w-full p-3 border border-blue-300 rounded-lg" required onInvalid={e=>setCustomValidity(e,'Selecione a franquia.')} onInput={e=>setCustomValidity(e,'')} >
                  <option value="">Franquia</option>
                  <option value="Sem franquia">Sem franquia</option>
                  <option value="500 €">500 €</option>
                  <option value="1.000 €">1.000 €</option>
                  <option value="2.500 €">2.500 €</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Coberturas adicionais</label>
                <div className="flex flex-col gap-2">
                  {['Danos Patrimoniais Puros','Proteção Jurídica','Retroatividade','Responsabilidade Cruzada'].map(c=> (
                    <label key={c}><input type="checkbox" name="coberturas" value={c} checked={form.coberturas.includes(c)} onChange={handleChange} /> {c}</label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Mercados onde atua</label>
                <div className="flex flex-col gap-2">
                  {['Portugal','União Europeia','Fora da UE'].map(m=> (
                    <label key={m}><input type="checkbox" name="mercados" value={m} checked={form.mercados.includes(m)} onChange={handleChange} /> {m}</label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sinistros nos últimos 5 anos?</label>
                <div className="flex items-center gap-4">
                  <label><input type="checkbox" name="teveSinistros" checked={!!form.teveSinistros} onChange={handleChange} /> Sim</label>
                </div>
                {form.teveSinistros && (
                  <textarea name="detalhesSinistros" value={form.detalhesSinistros||''} onChange={handleChange} placeholder="Descreva datas, valores e circunstâncias" className="w-full p-3 border border-blue-300 rounded-lg mt-2 min-h-[90px]" />
                )}
              </div>
              <div className="flex justify-between gap-2 mt-2"><button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">Anterior</button><button type="submit" className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-900 transition">Próximo</button></div>
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="text-xl font-semibold text-blue-700 mb-2 text-center">3. Envio</h3>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="aceitaRgpd" name="aceitaRgpd" checked={!!form.aceitaRgpd} onChange={handleChange} className="accent-blue-700 w-5 h-5" required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Necessário aceitar a Política de Privacidade & RGPD.')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
                <label htmlFor="aceitaRgpd" className="text-blue-900 text-sm select-none">Li e aceito a <a href={`${import.meta.env.BASE_URL}politica-rgpd`} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">Política de Privacidade & RGPD</a>.</label>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Outros pedidos / detalhes</label>
                <textarea name="outrosPedidos" value={form.outrosPedidos||''} onChange={handleChange} placeholder="Ex.: limites, projetos, retroatividade específica, observações…" className="w-full p-3 border rounded bg-white min-h-[90px]" />
              </div>
              <div className="flex justify-between gap-2 mt-4"><button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 rounded">Anterior</button><button type="submit" disabled={isSubmitting} className={`px-6 py-2 text-white rounded font-bold transition ${isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting ? 'A enviar…' : 'Pedir Proposta'}</button></div>
              {resultado && (<div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-lg text-center font-semibold shadow whitespace-pre-line">{resultado}</div>)}
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
