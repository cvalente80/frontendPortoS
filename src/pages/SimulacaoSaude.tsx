import React, { useRef, useState } from "react";
import Seo from "../components/Seo";
import emailjs from "@emailjs/browser";
import { EMAILJS_SERVICE_ID_SAUDE, EMAILJS_TEMPLATE_ID_SAUDE, EMAILJS_USER_ID_SAUDE } from "../emailjs.config";
import DatePicker, { registerLocale } from "react-datepicker";
import { pt } from "date-fns/locale/pt";
import { enGB } from "date-fns/locale/en-GB";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useAuthUX } from '../context/AuthUXContext';
import { auth } from '../firebase';
import { saveSimulation } from '../utils/simulations';

registerLocale("pt", pt);
registerLocale("en", enGB);

type Segurado = { nome: string; nascimento: string; nascimentoManual: string; contribuinte: string };

export default function SimulacaoSaude() {
	const { t } = useTranslation('sim_saude');
	const { lang } = useParams();
	const base = lang === 'en' ? 'en' : 'pt';
	const { user } = useAuth();
	const { requireAuth } = useAuthUX();
	const [step, setStep] = useState<1 | 2>(1);
	const [segurados, setSegurados] = useState<Segurado[]>([
		{ nome: "", nascimento: "", nascimentoManual: "", contribuinte: "" }
	]);
	const [openNascimento, setOpenNascimento] = useState<number | null>(null);
	const [errosSegurados, setErrosSegurados] = useState<{ nome?: string; nascimento?: string; contribuinte?: string }[]>([]);

	const [plano, setPlano] = useState<"opcao1" | "opcao2" | "opcao3" | "">("");
	const [addEstomatologia2, setAddEstomatologia2] = useState<boolean>(false);
	const [addEstomatologia3, setAddEstomatologia3] = useState<boolean>(false);
	const [nome, setNome] = useState("");
	const [email, setEmail] = useState("");
	const [telefone, setTelefone] = useState("");
	const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const busyRef = useRef(false);

	function handleChangeSegurado(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
		const { name, value } = e.target;
		setSegurados(prev => {
			const copy = [...prev];
			copy[idx] = { ...copy[idx], [name]: value } as Segurado;
			return copy;
		});
		setErrosSegurados(errs => {
			const copy = [...errs];
			if (!copy[idx]) copy[idx] = {};
			if (name === 'nome' || name === 'nascimento' || name === 'contribuinte') {
				copy[idx][name] = '' as any;
			}
			return copy;
		});
	}

	function addSegurado() {
		setSegurados(prev => (prev.length >= 5 ? prev : [...prev, { nome: "", nascimento: "", nascimentoManual: "", contribuinte: "" }]));
	}
	function removeSegurado(idx: number) {
		setSegurados(prev => prev.filter((_, i) => i !== idx));
	}

	function validarPasso1(): boolean {
		const novosErros = segurados.map(seg => ({
			nome: !seg.nome ? t('validations.insuredNameRequired') : undefined,
			nascimento: !seg.nascimento ? t('validations.insuredBirthRequired') : undefined,
			contribuinte: !seg.contribuinte ? t('validations.insuredNifRequired') : undefined,
		}));
		setErrosSegurados(novosErros);
		return !novosErros.some(e => e.nome || e.nascimento || e.contribuinte);
	}

	function validarPasso2(): boolean {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!plano) {
			alert(t('validations.planRequired'));
			return false;
		}
		if (!nome) {
			alert(t('validations.nameRequired'));
			return false;
		}
		if (!email || !emailRegex.test(email)) {
			alert(t('validations.emailInvalid'));
			return false;
		}
		if (!telefone || !/^[0-9]{9}$/.test(telefone)) {
			alert(t('validations.phoneRequired'));
			return false;
		}
		return true;
	}

	function handleNext(e: React.FormEvent) {
		e.preventDefault();
		if (step === 1) {
			if (validarPasso1()) setStep(2);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (isSubmitting || busyRef.current) return; // block double submit
		setIsSubmitting(true); busyRef.current = true;
		// Exigir login antes de submeter e persistir
		await requireAuth();
		if (!validarPasso2()) return;
		// Mapeamento conforme o template fornecido: {{nome}}, {{time}}, {{opcao}}, {{pessoasSeguras}}
		const now = new Date();
		const localeStr = base === 'pt' ? 'pt-PT' : 'en-GB';
		const time = now.toLocaleString(localeStr, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
		const opcao = plano === 'opcao1' ? t('table.option1') : plano === 'opcao2' ? t('table.option2') : t('table.option3');
		const pessoasSeguras = segurados
			.map((s, i) => `${t('emailSummary.person')} ${i + 1}: ${t('emailSummary.name')} ${s.nome}, ${t('emailSummary.birth')} ${s.nascimentoManual}, ${t('emailSummary.nif')} ${s.contribuinte}`)
			.join(' | ');
		const templateParams = { nome, time, opcao, pessoasSeguras, email };

		// Dry-run in dev or when explicitly requested via env
		const dryRun = (import.meta as any)?.env?.DEV || (import.meta as any)?.env?.VITE_EMAIL_DRY_RUN === 'true';
		if (dryRun) {
			try {
				console.log('[EmailJS][DRY_RUN][Saude] Would send with params:', templateParams);
				const uid = auth.currentUser?.uid;
				if (uid) {
					try {
						const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
						const key = ['saude', email || 'anon', minuteBucket.toISOString()].join(':');
						await saveSimulation(uid, {
						type: 'saude',
						title: `Saúde - ${opcao}`,
						summary: `Plano: ${opcao} | Pessoas seguras: ${segurados.length}`,
						status: 'submitted',
						payload: { segurados, plano, addEstomatologia2, addEstomatologia3, nome, email, telefone },
					}, { idempotencyKey: key });
					} catch (err) {
						console.warn('[SimulacaoSaude][DRY] Falha a guardar simulação (ignorado):', err);
					}
				}
				setMensagemSucesso(t('messages.submitSuccess'));
				setSegurados([{ nome: "", nascimento: "", nascimentoManual: "", contribuinte: "" }]);
				setPlano("");
				setAddEstomatologia2(false);
				setAddEstomatologia3(false);
				setNome("");
				setEmail("");
				setTelefone("");
				setStep(1);
				setTimeout(() => setMensagemSucesso(null), 7000);
				return;
			} catch {}
		}
		try {
			console.log('[EmailJS][Saude] Sending', { service: EMAILJS_SERVICE_ID_SAUDE, template: EMAILJS_TEMPLATE_ID_SAUDE });
			const uid = auth.currentUser?.uid;
			if (uid) {
				try {
					const minuteBucket = new Date(); minuteBucket.setSeconds(0,0);
					const key = ['saude', email || 'anon', minuteBucket.toISOString()].join(':');
					await saveSimulation(uid, {
					type: 'saude',
					title: `Saúde - ${opcao}`,
					summary: `Plano: ${opcao} | Pessoas seguras: ${segurados.length}`,
					status: 'submitted',
					payload: { segurados, plano, addEstomatologia2, addEstomatologia3, nome, email, telefone },
					}, { idempotencyKey: key });
				} catch (err) {
					console.warn('[SimulacaoSaude] Falha a guardar simulação (ignorado):', err);
				}
			}
			await emailjs
			.send(EMAILJS_SERVICE_ID_SAUDE, EMAILJS_TEMPLATE_ID_SAUDE, templateParams, EMAILJS_USER_ID_SAUDE)
			;
			console.log('[EmailJS][Saude] Success');
				setMensagemSucesso(t('messages.submitSuccess'));
				setSegurados([{ nome: "", nascimento: "", nascimentoManual: "", contribuinte: "" }]);
				setPlano("");
				setAddEstomatologia2(false);
				setAddEstomatologia3(false);
				setNome("");
				setEmail("");
				setTelefone("");
				setStep(1);
				setTimeout(() => setMensagemSucesso(null), 7000);
		} catch (err) {
			console.error('[EmailJS][Saude] Error', err);
				setMensagemSucesso(t('messages.submitError'));
				setTimeout(() => setMensagemSucesso(null), 7000);
		}
		setIsSubmitting(false); busyRef.current = false;
	}

	// Dados da grelha comparativa de planos (texto genérico, sem preços)
	const beneficios: { chave: keyof Record<string, string>; label: string; op1: string | boolean; op2: string | boolean; op3: string | boolean }[] = [
		{ chave: "consultas", label: t('benefits.consultas'), op1: true, op2: true, op3: true },
		{ chave: "exames", label: t('benefits.exames'), op1: true, op2: true, op3: true },
		{ chave: "ambulatoria", label: t('benefits.ambulatoria'), op1: "Opcional", op2: "2.500 €", op3: "5.000 €" },
		{ chave: "internamento", label: t('benefits.internamento'), op1: "15.000 €", op2: "50.000 €", op3: "1.000.000 €" },
		{ chave: "urgencias", label: t('benefits.urgencias'), op1: true, op2: true, op3: true },
		{ chave: "parto", label: t('benefits.parto'), op1: false, op2: "Opcional", op3: true },
		{ chave: "estomatologia", label: t('benefits.estomatologia'), op1: "Descontos", op2: "Parcial", op3: "Ampla" },
		{ chave: "medicamentos", label: t('benefits.medicamentos'), op1: false, op2: "Parcial", op3: "Parcial" },
		{ chave: "internacional", label: t('benefits.internacional'), op1: false, op2: true, op3: true },
		{ chave: "domicilio", label: t('benefits.domicilio'), op1: "Telemedicina", op2: true, op3: true },
	];

	const traduzValor = (val: string | boolean) => {
		if (typeof val === 'boolean') return val ? t('table.included') : t('table.notApplicable');
		if (val === 'Opcional') return t('table.optional');
		if (val === 'Descontos') return t('table.discounts');
		if (val === 'Parcial') return t('table.partial');
		if (val === 'Telemedicina') return t('table.telemedicine');
		if (val === 'Ampla') return t('table.included');
		return val;
	};

	const valorCelula = (b: typeof beneficios[number], col: 1 | 2 | 3) => {
		const val = col === 1 ? b.op1 : col === 2 ? b.op2 : b.op3;
		return traduzValor(val);
	};

	return (
		<div className="min-h-screen flex items-start justify-center bg-blue-50 relative pt-8 md:pt-12">
			<Seo
				title={t('seo.title', 'Simulação Seguro Saúde') as any}
				description={t('seo.description', 'Simule o seu seguro de saúde e receba proposta personalizada.') as any}
				canonicalPath={`/${base}/simulacao-saude`}
			/>
			<img
				src={`${import.meta.env.BASE_URL}imagens/insurance-background.jpg`}
				alt={t('backgroundAlt')}
				className="absolute inset-0 w-full h-full object-cover opacity-25"
				onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/family-happy2.png'; }}
			/>
			<div className="relative z-10 as-card max-w-5xl w-full bg-white/90 md:p-8">
				<h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">{t('title')}</h1>
				<form className="space-y-4" onSubmit={handleSubmit}>
					{step === 1 && (
						<div>
							<h2 className="text-xl font-bold text-blue-800 mb-4">{t('step1Title')}</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{segurados.map((seg, idx) => (
									<div key={idx} className="p-4 rounded-xl bg-blue-50 flex flex-col gap-4">
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700">
												<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
											</span>
											<input
												type="text"
												name="nome"
												value={seg.nome}
												onChange={e => { handleChangeSegurado(e as any, idx); setErrosSegurados(errs => { const copy = [...errs]; if (copy[idx]) copy[idx].nome = ''; return copy; }); }}
												placeholder={t('placeholders.fullName')}
												className={`as-input pl-10 ${errosSegurados[idx]?.nome ? 'border-red-500' : ''}`}
												required
												onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.insuredNameRequired'))}
												onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
											/>
										</div>
										{errosSegurados[idx]?.nome && <div className="text-red-600 text-sm -mt-2">{errosSegurados[idx].nome}</div>}
										<div className="relative">
											<DatePicker
												selected={seg.nascimento ? new Date(seg.nascimento) : null}
												onChange={date => {
													if (date) {
														const iso = date.toISOString().slice(0, 10);
														const [year, month, day] = iso.split('-');
														const manual = `${day}-${month}-${year}`;
														handleChangeSegurado({ target: { name: 'nascimento', value: iso } } as any, idx);
														handleChangeSegurado({ target: { name: 'nascimentoManual', value: manual } } as any, idx);
														setErrosSegurados(errs => { const copy = [...errs]; if (copy[idx]) copy[idx].nascimento = ''; return copy; });
													} else {
														handleChangeSegurado({ target: { name: 'nascimento', value: '' } } as any, idx);
														handleChangeSegurado({ target: { name: 'nascimentoManual', value: '' } } as any, idx);
													}
												}}
												locale={base}
												dateFormat="dd-MM-yyyy"
												placeholderText={t('placeholders.birthDate')}
												className="as-input pr-10"
												required
												showMonthDropdown
												showYearDropdown
												yearDropdownItemNumber={100}
												scrollableYearDropdown
												value={seg.nascimentoManual || ''}
												customInput={
													<div className="relative w-full">
														<button type="button" onClick={() => setOpenNascimento(idx)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow" tabIndex={-1}>
															<svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="14" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
														</button>
														<input
															type="text"
															className="as-input pl-10 pr-10"
															value={seg.nascimentoManual || ''}
															required
															readOnly
															placeholder={t('placeholders.birthDate')}
															onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.insuredBirthRequired'))}
															onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
														/>
														<button type="button" onClick={() => setOpenNascimento(idx)} className="absolute right-2 top-1/2 -translate-y-1/2" tabIndex={-1}>
															<svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="14" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
														</button>
													</div>
												}
												open={openNascimento === idx}
												onClickOutside={() => setOpenNascimento(null)}
											/>
										</div>
										{errosSegurados[idx]?.nascimento && <div className="text-red-600 text-sm -mt-2">{errosSegurados[idx].nascimento}</div>}
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700">
												<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
											</span>
											<input
												type="text"
												name="contribuinte"
												value={seg.contribuinte}
												onChange={e => { handleChangeSegurado(e as any, idx); setErrosSegurados(errs => { const copy = [...errs]; if (copy[idx]) copy[idx].contribuinte = ''; return copy; }); }}
												placeholder={t('placeholders.nif')}
												className={`as-input pl-10 ${errosSegurados[idx]?.contribuinte ? 'border-red-500' : ''}`}
												required
												pattern="^[0-9]{9}$"
												maxLength={9}
												onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.insuredNifRequired'))}
												onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
											/>
										</div>
										{errosSegurados[idx]?.contribuinte && <div className="text-red-600 text-sm -mt-2">{errosSegurados[idx].contribuinte}</div>}
										{segurados.length > 1 && (
											<button type="button" onClick={() => removeSegurado(idx)} className="text-red-500 text-sm self-end">{t('buttons.remove')}</button>
										)}
									</div>
								))}
							</div>
							<div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
								{segurados.length < 5 ? (
										<button type="button" onClick={addSegurado} className="as-btn bg-blue-200 text-blue-900 hover:bg-blue-300">{t('buttons.addInsured')}</button>
								) : (
									<p className="text-xs text-blue-700 font-medium">{t('buttons.maxReached5')}</p>
								)}
								<div className="flex-1" />
									<button type="button" onClick={handleNext} className="as-btn bg-blue-700 text-white hover:bg-blue-900 self-end">{t('buttons.next')}</button>
							</div>
						</div>
					)}

					{step === 2 && (
						<div>
							<h2 className="text-xl font-bold text-blue-800 mb-4">{t('step2Title')}</h2>
							<div className="overflow-auto rounded-xl border bg-white shadow">
								<table className="min-w-full text-sm">
									<thead>
										<tr className="bg-blue-50 text-blue-900">
											<th className="text-left p-3 font-semibold">{t('table.coverages')}</th>
											<th className="p-3 font-bold">
												<label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${plano === 'opcao1' ? 'bg-green-100 text-green-800' : 'bg-white text-blue-900 border'}`}>
													<input type="radio" name="plano" value="opcao1" checked={plano === 'opcao1'} onChange={e => setPlano(e.target.value as any)} />
													{t('table.option1')}
												</label>
											</th>
											<th className="p-3 font-bold">
												<label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${plano === 'opcao2' ? 'bg-green-100 text-green-800' : 'bg-white text-blue-900 border'}`}>
													<input type="radio" name="plano" value="opcao2" checked={plano === 'opcao2'} onChange={e => setPlano(e.target.value as any)} />
													{t('table.option2')}
												</label>
											</th>
											<th className="p-3 font-bold">
												<label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${plano === 'opcao3' ? 'bg-green-100 text-green-800' : 'bg-white text-blue-900 border'}`}>
													<input type="radio" name="plano" value="opcao3" checked={plano === 'opcao3'} onChange={e => setPlano(e.target.value as any)} />
													{t('table.option3')}
												</label>
											</th>
										</tr>
									</thead>
									<tbody>
										{beneficios.map((b, i) => (
											<tr key={b.chave} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}>
												<td className="p-3 text-blue-900">{b.label}</td>
												{/* Coluna Opção 1 */}
												<td className="p-3 text-center font-medium">
													{b.chave === 'estomatologia' ? (
														<span>{t('table.discounts')}</span>
													) : (
														<span>{valorCelula(b, 1)}</span>
													)}
												</td>
												{/* Coluna Opção 2 */}
												<td className="p-3 text-center font-medium">
													{b.chave === 'estomatologia' ? (
														<label className="inline-flex items-center gap-2">
															<input
																type="checkbox"
																checked={addEstomatologia2}
																onChange={(e) => setAddEstomatologia2(e.target.checked)}
															/>
															<span>{t('table.add')}</span>
														</label>
													) : (
														<span>{valorCelula(b, 2)}</span>
													)}
												</td>
												{/* Coluna Opção 3 */}
												<td className="p-3 text-center font-medium">
													{b.chave === 'estomatologia' ? (
														<label className="inline-flex items-center gap-2">
															<input
																type="checkbox"
																checked={addEstomatologia3}
																onChange={(e) => setAddEstomatologia3(e.target.checked)}
															/>
															<span>{t('table.add')}</span>
														</label>
													) : (
														<span>{valorCelula(b, 3)}</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="md:col-span-1">
									<label className="block text-sm font-semibold text-blue-900 mb-1">{t('contact:labels.name')}</label>
									<input
										type="text"
										value={nome}
										onChange={e => setNome(e.target.value)}
										className="as-input"
										placeholder={t('placeholders.yourName')}
										required
										onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.nameRequired'))}
										onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
									/>
								</div>
								<div className="md:col-span-1">
									<label className="block text-sm font-semibold text-blue-900 mb-1">{t('contact:labels.email')}</label>
									<input
										type="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										className="as-input"
										placeholder={t('placeholders.email')}
										required
										pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
										onInvalid={e => {
											const input = e.target as HTMLInputElement;
											if (input.validity.valueMissing) input.setCustomValidity(t('validations.emailRequired'));
											else input.setCustomValidity(t('validations.emailInvalid'));
										}}
										onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
									/>
								</div>
								<div className="md:col-span-1">
									<label className="block text-sm font-semibold text-blue-900 mb-1">{t('contact:labels.phone')}</label>
									<input
										type="tel"
										value={telefone}
										onChange={e => {
											const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 9);
											setTelefone(onlyDigits);
										}}
										className="as-input"
										placeholder={t('placeholders.phone')}
										required
										inputMode="numeric"
										pattern="[0-9]{9}"
										maxLength={9}
										onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('validations.phoneRequired'))}
										onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
									/>
								</div>
							</div>

							<div className="flex justify-between mt-6">
								<button type="button" onClick={() => setStep(1)} className="as-btn bg-gray-200 text-slate-900 hover:bg-gray-300">{t('buttons.prev')}</button>
								<button type="submit" disabled={isSubmitting} className={`as-btn text-white ${isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting ? t('buttons.submitting', { defaultValue: 'A enviar…' }) : t('buttons.submit')}</button>
							</div>
						</div>
					)}
				</form>
				{mensagemSucesso && (
					<div className="as-alert as-alert-success fixed bottom-8 right-8 z-50 font-semibold shadow" style={{ minWidth: '260px', maxWidth: '350px', textAlign: 'left' }}>
						{mensagemSucesso}
					</div>
				)}
			</div>
		</div>
	);
}
