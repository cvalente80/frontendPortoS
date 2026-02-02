import React, { useEffect, useMemo, useState } from 'react';
import Seo from "../components/Seo";
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { getApp } from 'firebase/app';
import { collection, collectionGroup, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, deleteField } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import emailjs from '@emailjs/browser';
import { EMAILJS_SERVICE_ID_GENERIC, EMAILJS_TEMPLATE_ID_NOTIFY, EMAILJS_USER_ID_GENERIC } from '../emailjs.config';
import PolicyForm from '../components/PolicyForm';
import { createOrGetPolicyForSimulation } from '../utils/policies';

type SimulationDoc = {
  id: string;
  type: 'auto' | 'vida' | 'saude' | 'habitacao' | 'rc_prof' | 'condominio' | string;
  createdAt?: Timestamp | null;
  status?: 'draft' | 'submitted' | 'quoted' | 'archived' | string;
  title?: string;
  summary?: string;
  pdfUrl?: string;
  // Dados adicionais guardados pela página de simulação (ex.: auto: matricula, marca, modelo, ...)
  payload?: Record<string, any>;
  ownerUid?: string; // preenchido quando for consulta admin (collectionGroup)
};

export default function MinhasSimulacoes(): React.ReactElement {
  const { user, displayName, isAdmin, refreshAdminStatus } = useAuth();
  const { t } = useTranslation(['mysims', 'common']);
  const [items, setItems] = useState<SimulationDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [openPolicyForSimId, setOpenPolicyForSimId] = useState<string | null>(null);
  const [policyInitialBySim, setPolicyInitialBySim] = useState<Record<string, any>>({});
  const app = typeof window !== 'undefined' ? getApp() : undefined;
  const firebaseCfg = (app && (app.options as any)) || {};
  const diagnostics = useMemo(() => {
    const apiKey: string = firebaseCfg.apiKey || '';
    const apiKeyRedacted = apiKey ? `${apiKey.slice(0, 8)}…` : '-';
    const origin = typeof window !== 'undefined' ? window.location.origin : '-';
    return {
      uid: user?.uid || '-',
      isAdmin,
      projectId: firebaseCfg.projectId || '-',
      apiKey: apiKeyRedacted,
      authDomain: firebaseCfg.authDomain || '-',
      origin,
      when: new Date().toISOString(),
    };
  }, [user?.uid, isAdmin, firebaseCfg.projectId, firebaseCfg.apiKey, firebaseCfg.authDomain]);

  const uid = user?.uid;

  // Scope strictly to the current user's simulations to avoid
  // permission issues with collectionGroup when not truly admin.
  const baseRef = useMemo(() => {
    if (!uid) return null;
    return isAdmin ? (collectionGroup(db, 'simulations') as any) : collection(db, 'users', uid, 'simulations');
  }, [uid, isAdmin]);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type });
    // auto-hide after 3s
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUploadPdf(simId: string, file: File, ownerUid?: string) {
    if (!user) return;
    if (!file || file.type !== 'application/pdf') return;
    // Enforce max size 1MB (1 * 1024 * 1024 bytes)
    const MAX_BYTES = 1 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      showToast(t('mysims:pdf.tooLarge'), 'error');
      return;
    }
    // Determina o dono da simulação (admin pode atuar em nome de outro utilizador)
    const targetUid = ownerUid || uid;
    if (!targetUid) return;
    // Path: simulations/{targetUid}/{simId}/quote.pdf
    const path = `simulations/${targetUid}/${simId}/quote.pdf`;
    const sref = storageRef(storage, path);
    try {
      setUploadingId(simId);
      await uploadBytes(sref, file, { contentType: 'application/pdf' });
      const url = await getDownloadURL(sref);
      const simRef = doc(db, 'users', targetUid, 'simulations', simId);
      await updateDoc(simRef, { pdfUrl: url });
      showToast(t('mysims:pdf.successUpload'), 'success');
      // Try sending a notification email to the user informing the quote is ready
      try {
        const simSnap = await getDoc(simRef);
        const simData = simSnap.exists() ? (simSnap.data() as any) : undefined;
        // Try to infer recipient email from simulation payload or fall back to the account email
        const recipientEmail: string | undefined = simData?.payload?.email || simData?.email || user.email || undefined;
        if (recipientEmail) {
          showToast(t('mysims:pdf.emailSending'), 'info');
          // Derivar marca pelo domínio para personalizar o assunto do email
          const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
          let brandName = 'Ansião Seguros';
          if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
          else if (host.includes('sintraseg') || host.includes('sintra')) brandName = 'Sintra Seguros';
          else if (host.includes('pombalseg') || host.includes('pombal')) brandName = 'Pombal Seguros';
          else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
          else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
          else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';

          const subjectBase = t('mysims:pdf.emailSubject') as string;
          const subject = subjectBase.replace(/Ansião Seguros/g, brandName);
          const nameForEmail = simData?.payload?.nome || user.displayName || 'Cliente';
          // Construir base dinâmica: domínio atual + BASE_URL (Vite)
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cvalente80.github.io';
          const rawBase = (import.meta as any).env?.BASE_URL ?? '/';
          const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
          const currentLang = (typeof window !== 'undefined' && window.location.pathname.startsWith('/en')) ? 'en' : 'pt';
          const mysimsPath = currentLang === 'en' ? 'en/minhas-simulacoes' : 'pt/minhas-simulacoes';
          const mysimsLink = `${origin}${baseUrl}${mysimsPath}`;
          const pdfLink = url;
          const body = t('mysims:pdf.emailBody', { pdfLink, mysimsLink });
          const templateParams: Record<string, any> = {
            subjectEmail: subject,
            name: nameForEmail,
            body,
            email: recipientEmail,
            pdfLink,
            mysimsLink,
          };
          try {
            await emailjs.send(
              EMAILJS_SERVICE_ID_GENERIC,
              EMAILJS_TEMPLATE_ID_NOTIFY,
              templateParams,
              EMAILJS_USER_ID_GENERIC
            );
            showToast(t('mysims:pdf.emailSuccess'), 'success');
          } catch (sendErr) {
            console.error('[MinhasSimulacoes] EmailJS send error', sendErr);
            showToast(t('mysims:pdf.emailError'), 'error');
          }
        } else {
          // No recipient email available; do not treat as error, just inform silently in console
          console.warn('[MinhasSimulacoes] No recipient email found for simulation', simId);
        }
      } catch (mailErr) {
        console.error('[MinhasSimulacoes] Failed to send notification email:', mailErr);
          showToast(t('mysims:pdf.emailError'), 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(t('mysims:pdf.errorUpload'), 'error');
      throw e;
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDeletePdf(simId: string, ownerUid?: string) {
    if (!user || !isAdmin) return;
    const targetUid = ownerUid || uid;
    if (!targetUid) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(t('mysims:pdf.confirmDelete'))
      : true;
    if (!confirmed) return;
    try {
      setDeletingId(simId);
      const pdfRef = storageRef(storage, `simulations/${targetUid}/${simId}/quote.pdf`);
      try { await deleteObject(pdfRef); } catch { /* se não existir ignorar */ }
      const simRef = doc(db, 'users', targetUid, 'simulations', simId);
      // Remover campo pdfUrl (deleteField) para refletir ausência do anexo
      await updateDoc(simRef, { pdfUrl: deleteField() });
      showToast(t('mysims:pdf.successDelete'), 'success');
    } catch (e) {
      console.error('Falha ao remover anexo PDF:', e);
      showToast(t('mysims:pdf.errorDelete'), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!baseRef) return;
    setLoading(true);
    setError(null);
    setNote(null);

    const constraints = [orderBy('createdAt', 'desc'), limit(100)] as const;
    const q = query(baseRef as any, ...constraints);
    const unsub = onSnapshot(q, {
      next: (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data() as any;
          // Para collectionGroup, recuperar o UID do dono a partir do path: users/{uid}/simulations/{id}
          let ownerUid: string | undefined;
          try {
            const segments = d.ref.path.split('/');
            const usersIdx = segments.indexOf('users');
            if (usersIdx >= 0 && segments[usersIdx + 1]) ownerUid = segments[usersIdx + 1];
          } catch {
            // ignore
          }
          return { id: d.id, ...data, ownerUid } as SimulationDoc;
        });
        const filtered = filter === 'all' ? docs : docs.filter((d) => d.type === filter);
        setItems(filtered);
        setLoading(false);
      },
      error: (e: any) => {
        console.error('[MinhasSimulacoes] Firestore snapshot error:', e);
        const code = e?.code || e?.status || 'unknown';
        const msg = e?.message || '';
        // Graceful fallback: try a one-time fetch so the user still sees content
        (async () => {
          try {
            setNote(t('mysims:errors.listenFallbackNote'));
            const oneTime = await getDocs(q);
            const docs = oneTime.docs.map((d) => {
              const data = d.data() as any;
              let ownerUid: string | undefined;
              try {
                const segments = d.ref.path.split('/');
                const usersIdx = segments.indexOf('users');
                if (usersIdx >= 0 && segments[usersIdx + 1]) ownerUid = segments[usersIdx + 1];
              } catch {}
              return { id: d.id, ...data, ownerUid } as SimulationDoc;
            });
            const filtered = filter === 'all' ? docs : docs.filter((d) => d.type === filter);
            setItems(filtered);
          } catch (fallbackErr: any) {
            console.error('[MinhasSimulacoes] Fallback getDocs failed:', fallbackErr);
            const code2 = fallbackErr?.code || fallbackErr?.status || 'unknown';
            setError(t('mysims:errors.loadFailed', { code: code2 }));
          } finally {
            setLoading(false);
          }
        })().catch(() => {
          // No-op; errors handled above
        });
      },
    });
    return () => unsub();
  }, [baseRef, filter]);

  return (
    <main className="container mx-auto px-4 py-8">
      {toast && (
        <div
          className={`mb-4 rounded px-4 py-2 text-sm font-medium shadow-sm border transition-colors ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}
        >
          {toast.message}
        </div>
      )}
  <Seo title={t('mysims:seoTitle')} description={t('mysims:seoDesc')} canonicalPath={(typeof window !== 'undefined' ? window.location.pathname : '/pt/minhas-simulacoes')} noIndex />
  <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">{t('mysims:heading')}</h1>
  <p className="text-blue-800 mb-6">{t('mysims:welcome', { name: displayName ? `, ${displayName}` : '' })}</p>

      {!user && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded">
          {t('mysims:authRequired')}
        </div>
      )}

      {user && (
        <section className="space-y-4">
          {/* Debug UI removed: admin status and diagnostics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-800">{t('mysims:filters.typeLabel')}</label>
              <select
                className="border border-blue-200 rounded px-2 py-1 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">{t('mysims:filters.all')}</option>
                <option value="auto">{t('mysims:filters.types.auto')}</option>
                <option value="vida">{t('mysims:filters.types.vida')}</option>
                <option value="saude">{t('mysims:filters.types.saude')}</option>
                <option value="habitacao">{t('mysims:filters.types.habitacao')}</option>
                <option value="rc_prof">{t('mysims:filters.types.rc_prof')}</option>
                <option value="condominio">{t('mysims:filters.types.condominio')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-800">{t('mysims:filters.statusLabel')}</label>
              <select
                className="border border-blue-200 rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('mysims:filters.all')}</option>
                <option value="em_processamento">{t('mysims:statuses.em_processamento')}</option>
                <option value="simulacao_enviada">{t(isAdmin ? 'mysims:statuses.simulacao_enviada' : 'mysims:statuses.simulacao_recebida')}</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-4 border border-blue-100 rounded bg-white shadow-sm">{t('mysims:loading')}</div>
          )}
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded">{error}</div>
          )}
          {!error && note && (
            <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-900 rounded">{note}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="p-4 border border-blue-100 rounded bg-white shadow-sm text-blue-800">
              {t('mysims:empty')}
            </div>
          )}

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter((it) => {
                const typeOk = filter === 'all' || it.type === filter;
                const hasPdf = Boolean((it as any)?.pdfUrl);
                const statusKey = hasPdf ? 'simulacao_enviada' : 'em_processamento';
                const statusOk = statusFilter === 'all' || statusFilter === statusKey;
                return typeOk && statusOk;
              })
              .map((it) => {
              const date = (it.createdAt instanceof Timestamp)
                ? it.createdAt.toDate().toLocaleString()
                : '';
              const title = it.title || (it.type ? it.type.toUpperCase() : t('mysims:simulationFallback'));
              const plate = (it as any)?.payload?.matricula || (it as any)?.matricula as string | undefined;
              const brand = (it as any)?.payload?.marca || (it as any)?.marca as string | undefined;
              const model = (it as any)?.payload?.modelo || (it as any)?.modelo as string | undefined;
              const year = (it as any)?.payload?.ano || (it as any)?.ano as string | undefined;
              // Estados definidos pelo anexo PDF: sem PDF = Em processamento (vermelho), com PDF = Simulação enviada (verde)
              const STATUS_MAP: Record<string, { label: string; className: string }> = {
                em_processamento: {
                  label: t('mysims:statuses.em_processamento'),
                  className: 'bg-red-100 border border-red-300 text-red-800',
                },
                simulacao_enviada: {
                  label: t(isAdmin ? 'mysims:statuses.simulacao_enviada' : 'mysims:statuses.simulacao_recebida'),
                  className: 'bg-green-100 border border-green-300 text-green-800',
                },
              };
              const hasPdf = Boolean((it as any)?.pdfUrl);
              const statusKey: keyof typeof STATUS_MAP = hasPdf ? 'simulacao_enviada' : 'em_processamento';
              const statusInfo = STATUS_MAP[statusKey];
              return (
                <li key={it.id} className="p-4 border border-blue-100 rounded bg-white shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                      <span>{title}</span>
                      {plate && (
                        <span className="text-[11px] leading-none px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                          {plate}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      {statusInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                      )}
                    </div>
                  </div>
                  {date && <p className="text-xs text-blue-700">{date}</p>}
                  {/* Detalhe estruturado para Auto; fallback para summary multi-linha */}
                  {it.type === 'auto' ? (
                    (() => {
                      const p = (it as any).payload || {};
                      const fmtDate = (raw?: string) => {
                        if (!raw) return '-';
                        const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
                        return String(raw);
                      };
                      const cob = Array.isArray(p.coberturas) ? p.coberturas.join(', ') : (p.coberturas || '');
                      const outros = (p.outrosPedidos || '').toString().trim() || '-';
                      const nif = p.contribuinte || p.nif || '-';
                      return (
                        <div className="text-sm text-blue-800 space-y-1">
                          <div className="font-semibold">{t('mysims:detail.simTitle')}</div>
                          <div>{t('mysims:detail.brand')}: {p.marca || '-'}</div>
                          <div>{t('mysims:detail.model')}: {p.modelo || '-'}</div>
                          <div>{t('mysims:detail.version')}: {p.versao?.trim() || '-'}</div>
                          <div>{t('mysims:detail.year')}: {p.ano || '-'}</div>
                          <div>{t('mysims:detail.insuranceType')}: {p.tipoSeguro || '-'}</div>
                          <div className="mt-2 font-semibold">{t('mysims:detail.holderTitle')}</div>
                          <div>{t('mysims:detail.nif')}: {nif}</div>
                          <div>{t('mysims:detail.birth')}: {fmtDate(p.dataNascimento)}</div>
                          <div>{t('mysims:detail.licenseDate')}: {fmtDate(p.dataCartaConducao)}</div>
                          <div>{t('mysims:detail.postalCode')}: {p.codigoPostal || '-'}</div>
                          <div className="mt-2">{t('mysims:detail.coverages')}: {cob || '-'}</div>
                          <div>{t('mysims:detail.others')}: {outros}</div>
                        </div>
                      );
                    })()
                  ) : (
                    it.summary ? (
                      <p className="text-sm text-blue-800 whitespace-pre-line">{it.summary}</p>
                    ) : null
                  )}
                  {/* PDF actions */}
                  {(it as any)?.pdfUrl && (
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(it.id, it.ownerUid)}
                          title={t('mysims:pdf.delete')}
                          aria-label={t('mysims:pdf.delete')}
                          disabled={deletingId === it.id}
                          className={`inline-flex items-center justify-center ${deletingId === it.id ? 'opacity-60 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                        >
                          {deletingId === it.id ? (
                            <span className="w-5 h-5 inline-block border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
                        </button>
                      )}
                      <a
                        href={(it as any).pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 text-blue-700 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                        aria-label={t('mysims:pdf.viewCta')}
                      >
                        {/* Ícone PDF maior (≈3x) estilo genérico (não-marcado) */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          className="w-14 h-14"
                          aria-hidden="true"
                        >
                          <rect x="4" y="4" width="40" height="40" rx="6" fill="#EF4444" />
                          <text
                            x="50%"
                            y="62%"
                            textAnchor="middle"
                            fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif"
                            fontWeight="700"
                            fontSize="14"
                            fill="#FFFFFF"
                          >PDF</text>
                        </svg>
                        <span className="text-sm md:text-base font-medium underline">{t('mysims:pdf.viewCta')}</span>
                      </a>
                      {!isAdmin && uid && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const { data } = await createOrGetPolicyForSimulation(uid, it.id, it.type);
                              // Prefill with any known payload fields
                              const prefill = {
                                holderName: (it as any)?.payload?.nome || undefined,
                                nif: (it as any)?.payload?.nif || undefined,
                                email: (it as any)?.payload?.email || undefined,
                                phone: (it as any)?.payload?.telefone || undefined,
                                // Prefill split address: put full morada in street field; leave others blank
                                addressStreet: (it as any)?.payload?.morada || undefined,
                                addressPostalCode: undefined,
                                addressLocality: undefined,
                              };
                              setPolicyInitialBySim((prev) => ({ ...prev, [it.id]: { ...data, ...prefill } }));
                              setOpenPolicyForSimId(it.id);
                            } catch (e) {
                              console.error('[MinhasSimulacoes] create policy error', e);
                              showToast('Falha ao preparar apólice', 'error');
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Avançar para Apólice
                        </button>
                      )}
                    </div>
                  )}
                  {openPolicyForSimId === it.id && uid && (
                    <PolicyForm uid={uid} policyId={it.id} initial={policyInitialBySim[it.id]} onSaved={() => showToast('Apólice guardada com sucesso', 'success')} />
                  )}
                  {isAdmin && !hasPdf && (
                    <div className="mt-2">
                      <label className="text-xs text-blue-800 block mb-1">{t('mysims:pdf.uploadLabel')}</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            try {
                              await handleUploadPdf(it.id, f, it.ownerUid);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        disabled={uploadingId === it.id}
                        className={`text-sm ${uploadingId === it.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      {uploadingId === it.id && (
                        <div className="mt-1 text-xs text-blue-700 flex items-center gap-2">
                          <span className="w-3 h-3 inline-block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          {t('mysims:pdf.uploading')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Futuro: Botões para ver detalhe, repetir, etc. */}
                </li>
              );
              })}
          </ul>
        </section>
      )}
    </main>
  );
}
