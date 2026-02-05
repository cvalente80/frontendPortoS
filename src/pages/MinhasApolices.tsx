import React, { useEffect, useMemo, useState } from 'react';
import Seo from "../components/Seo";
import { useAuth } from '../context/AuthContext';
import { listPolicies, listAllPolicies, type PolicyRecord, savePolicy } from '../utils/policies';
import { useTranslation } from 'react-i18next';
import PolicyForm from '../components/PolicyForm';
import { NavLink } from 'react-router-dom';
import i18n from '../i18n';
import { db, storage } from '../firebase';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function MinhasApolices(): React.ReactElement {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation(['policies', 'common', 'mysims']);
  type PolicyItem = PolicyRecord & { id: string; ownerUid: string };
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [simDetails, setSimDetails] = useState<Record<string, { marca?: string; matricula?: string }>>({});
  const [adminEditing, setAdminEditing] = useState<Set<string>>(new Set());
  const [adminFilterType, setAdminFilterType] = useState<string>('');
  const [adminFilterStatus, setAdminFilterStatus] = useState<'em_criacao' | 'em_validacao' | 'em_vigor' | ''>('');

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function formatDate(dt: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(dt.getDate());
    const month = pad(dt.getMonth() + 1);
    const year = dt.getFullYear();
    const hours = pad(dt.getHours());
    const minutes = pad(dt.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function policyCreatedAtLabel(it: PolicyRecord): string {
    const anyIt: any = it as any;
    const ts = anyIt?.createdAt as Timestamp | undefined;
    if (ts && typeof ts.toDate === 'function') {
      return formatDate(ts.toDate());
    }
    // Fallback: try to infer from simulationId suffix (ISO date after last colon)
    const raw = String(it.simulationId || '');
    const last = raw.split(':').pop() || '';
    const parsed = new Date(last);
    if (!isNaN(parsed.getTime())) return formatDate(parsed);
    // Last resort: current date
    return formatDate(new Date());
  }
  function typeLabel(type?: string): string {
    if (!type) return '';
    const map: Record<string, string> = {
      auto: t('mysims:filters.types.auto'),
      vida: t('mysims:filters.types.vida'),
      saude: t('mysims:filters.types.saude'),
      habitacao: t('mysims:filters.types.habitacao'),
      rc_prof: t('mysims:filters.types.rc_prof'),
      condominio: t('mysims:filters.types.condominio'),
    };
    return map[type] || String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Normalize legacy statuses to new keys for display/classes
  const normalizeStatus = (s?: string | null): 'em_criacao' | 'em_validacao' | 'em_vigor' | undefined => {
    if (!s) return undefined;
    if (s === 'em_criacao' || s === 'em_validacao' || s === 'em_vigor') return s;
    if (s === 'draft') return 'em_criacao';
    if (s === 'submitted') return 'em_validacao';
    if (s === 'active' || s === 'em_vigor' || s === 'approved') return 'em_vigor';
    return 'em_criacao';
  };

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    (async () => {
      try {
        if (isAdmin) {
          const all = await listAllPolicies();
          setItems(all.map((it) => ({ ...(it as PolicyRecord), id: it.id!, ownerUid: it.ownerUid })));
        } else {
          const mine = await listPolicies(user.uid);
          setItems(mine.map((it) => ({ ...(it as PolicyRecord), id: it.id!, ownerUid: user.uid })));
        }
      } catch (e) {
        console.error(e);
        setError(t('policies:errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid, isAdmin]);

  // Prefetch auto simulation details (brand, plate) for pill labels
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const missing = items.filter((it) => it.type === 'auto' && it.simulationId && !simDetails[it.simulationId]);
      for (const it of missing) {
        try {
          const sref = doc(db, 'users', it.ownerUid || user.uid, 'simulations', it.simulationId);
          const snap = await getDoc(sref);
          const data: any = snap.exists() ? snap.data() : {};
          const payload = data?.payload || {};
          const marca = payload.marca || data.marca || undefined;
          const matricula = payload.matricula || data.matricula || undefined;
          setSimDetails((prev) => ({ ...prev, [it.simulationId]: { marca, matricula } }));
        } catch (e) {
          // ignore fetch errors for labels
        }
      }
    })();
  }, [items, user?.uid]);

  return (
    <main className="container mx-auto px-4 py-8">
      {toast && (
        <div className={`mb-4 rounded px-4 py-2 text-sm font-medium shadow-sm border transition-colors ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>{toast.message}</div>
      )}
      <Seo title={t('policies:seo.title')} description={t('policies:seo.desc')} canonicalPath={(typeof window !== 'undefined' ? window.location.pathname : '/pt/minhas-apolices')} noIndex />
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">{t('policies:heading')}</h1>
      {!user && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded">{t('policies:authRequired')}</div>
      )}
      {user && (
        <section className="space-y-4">
          {isAdmin && (
            <div className="p-3 border border-blue-100 rounded bg-white shadow-sm flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-sm text-blue-800 mb-1">Tipo de seguro</label>
                <select
                  className="w-full md:w-64 border border-blue-200 rounded px-2 py-1"
                  value={adminFilterType}
                  onChange={(e) => setAdminFilterType(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="auto">{t('mysims:filters.types.auto')}</option>
                  <option value="vida">{t('mysims:filters.types.vida')}</option>
                  <option value="saude">{t('mysims:filters.types.saude')}</option>
                  <option value="habitacao">{t('mysims:filters.types.habitacao')}</option>
                  <option value="rc_prof">{t('mysims:filters.types.rc_prof')}</option>
                  <option value="condominio">{t('mysims:filters.types.condominio')}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-blue-800 mb-1">Estado</label>
                <select
                  className="w-full md:w-64 border border-blue-200 rounded px-2 py-1"
                  value={adminFilterStatus}
                  onChange={(e) => setAdminFilterStatus(e.target.value as any)}
                >
                  <option value="">Todos</option>
                  <option value="em_criacao">{t('policies:statuses.em_criacao')}</option>
                  <option value="em_validacao">{t('policies:statuses.em_validacao')}</option>
                  <option value="em_vigor">{t('policies:statuses.em_vigor')}</option>
                </select>
              </div>
            </div>
          )}
          {loading && <div className="p-4 border border-blue-100 rounded bg-white shadow-sm">{t('policies:loading')}</div>}
          {error && <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="p-4 border border-blue-100 rounded bg-white shadow-sm text-blue-800">{t('policies:empty')}</div>
          )}
          {/** Apply admin filters to items */}
          {(() => {
            const visibleItems = isAdmin
              ? items.filter((it) => {
                  const typeOk = adminFilterType ? (it.type === adminFilterType) : true;
                  const statusOk = adminFilterStatus ? (normalizeStatus(it.status) === adminFilterStatus) : true;
                  return typeOk && statusOk;
                })
              : items;
            return (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((it) => (
              <li key={it.id} className="p-4 border border-blue-100 rounded bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {it.type && (
                      <span className="shrink-0 text-[11px] leading-none px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                        {it.type === 'auto'
                          ? `${typeLabel(it.type)}${simDetails[it.simulationId]?.marca ? ' - ' + simDetails[it.simulationId]?.marca : ''}${simDetails[it.simulationId]?.matricula ? ' - ' + simDetails[it.simulationId]?.matricula : ''}`
                          : typeLabel(it.type)}
                      </span>
                    )}
                    {/* Admin: owner UID badge removed as requested */}
                  </div>
                  {/* Status badge */}
                  {normalizeStatus(it.status) && (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${normalizeStatus(it.status) === 'em_criacao' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' : normalizeStatus(it.status) === 'em_validacao' ? 'bg-blue-100 border border-blue-300 text-blue-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                      {t(`policies:statuses.${normalizeStatus(it.status)}`)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-700 mt-3 mb-3 text-left">{t('policies:itemSub', { sim: policyCreatedAtLabel(it) })}</p>
                {/* Para utilizadores não administradores: mostrar instrução para preencher o formulário */}
                {(!isAdmin || it.ownerUid === user.uid) && (
                  <>
                    {!isAdmin && normalizeStatus(it.status) === 'em_criacao' && (
                      <div className="mb-2 p-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800">
                        {t('policies:fillPromptType', {
                          type: typeLabel(it.type),
                          defaultValue: typeLabel(it.type)
                            ? `Por favor, preencha os dados da apólice de ${typeLabel(it.type)} para avançar.`
                            : 'Por favor, preencha o formulário da apólice para avançar.'
                        })}
                      </div>
                    )}
                    {/* Non-admin in Em Vigor: hide form and show request-change CTA */}
                    {!isAdmin && normalizeStatus(it.status) === 'em_vigor' ? (
                      <div className="mt-2">
                        <NavLink
                          to={`/${i18n.language || 'pt'}/contato`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {t('policies:form.requestChangeCta')}
                        </NavLink>
                      </div>
                    ) : (
                      <PolicyForm
                        uid={it.ownerUid}
                        policyId={it.id!}
                        initial={it}
                        submitLabel={
                          !isAdmin
                            ? (normalizeStatus(it.status) === 'em_criacao'
                                ? t('policies:form.createCta')
                                : normalizeStatus(it.status) === 'em_validacao'
                                  ? t('policies:form.resendCta')
                                  : t('policies:form.saveCta'))
                            : undefined
                        }
                      />
                    )}
                  </>
                )}
                {/* Admin read-only view of user-provided policy data with edit toggle */}
                {isAdmin && it.ownerUid !== user.uid && (
                  <div className="mt-3 p-3 border border-blue-100 rounded bg-white">
                    <h4 className="text-blue-900 font-semibold mb-2">Dados submetidos pelo utilizador</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                      {it.holderName && <div><span className="font-medium">Nome:</span> {it.holderName}</div>}
                      {it.nif && <div><span className="font-medium">NIF:</span> {it.nif}</div>}
                      {it.citizenCardNumber && <div><span className="font-medium">Nº CC:</span> {it.citizenCardNumber}</div>}
                      {it.addressStreet && <div><span className="font-medium">Rua:</span> {it.addressStreet}</div>}
                      {it.addressPostalCode && <div><span className="font-medium">Código Postal:</span> {it.addressPostalCode}</div>}
                      {it.addressLocality && <div><span className="font-medium">Localidade:</span> {it.addressLocality}</div>}
                      {it.phone && <div><span className="font-medium">Telefone:</span> {it.phone}</div>}
                      {it.email && <div><span className="font-medium">Email:</span> {it.email}</div>}
                      {it.paymentFrequency && <div><span className="font-medium">Periodicidade:</span> {t(`policies:frequencies.${it.paymentFrequency}`)}</div>}
                      {it.paymentMethod && <div><span className="font-medium">Pagamento:</span> {t(`policies:paymentMethods.${it.paymentMethod}`)}</div>}
                      {it.nib && <div className="md:col-span-2"><span className="font-medium">NIB (IBAN):</span> {it.nib}</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded ${adminEditing.has(it.id!) ? 'bg-gray-600 hover:bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                        onClick={() => {
                          setAdminEditing((prev) => {
                            const next = new Set(prev);
                            if (next.has(it.id!)) next.delete(it.id!); else next.add(it.id!);
                            return next;
                          });
                        }}
                      >
                        {adminEditing.has(it.id!) ? 'Fechar edição' : 'Editar como Admin'}
                      </button>
                      {/* Workflow controls: show appropriate status actions */}
                      {normalizeStatus(it.status) !== 'em_criacao' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-600 text-white hover:bg-yellow-500"
                          onClick={async () => {
                            try {
                              const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                              await updateDoc(ref, { status: 'em_criacao' });
                              showToast(`Estado alterado para ${t('policies:statuses.em_criacao')}`, 'success');
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: 'em_criacao' } : p)));
                            } catch (e) {
                              console.error(e);
                              showToast(t('policies:errors.saveFailed'), 'error');
                            }
                          }}
                        >
                          Voltar a Em Criação
                        </button>
                      )}
                      {normalizeStatus(it.status) === 'em_criacao' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
                          onClick={async () => {
                            try {
                              const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                              await updateDoc(ref, { status: 'em_validacao' });
                              showToast(`Estado alterado para ${t('policies:statuses.em_validacao')}`, 'success');
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: 'em_validacao' } : p)));
                            } catch (e) {
                              console.error(e);
                              showToast(t('policies:errors.saveFailed'), 'error');
                            }
                          }}
                        >
                          Colocar Em Validação
                        </button>
                      )}
                    </div>
                    {adminEditing.has(it.id!) && (
                      <div className="mt-3">
                        <div className="mb-2 text-xs text-blue-800">Edição de administrador (independente do estado)</div>
                        <PolicyForm
                          uid={it.ownerUid}
                          policyId={it.id!}
                          initial={it}
                          onSaved={(patch) => {
                            setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, ...patch } as any : p)));
                            showToast(t('policies:form.saved'), 'success');
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Policy PDF actions */}
                <div className="mt-3 grid grid-cols-[max-content,1fr] gap-x-4 gap-y-3 items-center">
                  {/* Apólice */}
                  <span className="text-sm text-blue-900 font-medium whitespace-nowrap">Apólice:</span>
                  {it.policyPdfUrl ? (
                    <div className="flex items-center gap-3">
                      <a href={it.policyPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
                          <rect x="4" y="4" width="40" height="40" rx="6" fill="#10B981" />
                          <text x="50%" y="62%" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="14" fill="#FFFFFF">PDF</text>
                        </svg>
                        <span className="text-sm font-medium underline">{t('policies:pdf.viewPolicy', { defaultValue: 'Ver Apólice' })}</span>
                      </a>
                      {isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setDeletingId(it.id!);
                              const pdfRef = storageRef(storage, `policies/${it.ownerUid}/${it.id}/policy.pdf`);
                              try { await deleteObject(pdfRef); } catch {}
                              const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                              await updateDoc(ref, { policyPdfUrl: null });
                              showToast(t('policies:pdf.successDelete'), 'success');
                            } catch (e) {
                              console.error(e);
                              showToast(t('policies:pdf.errorDelete'), 'error');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          className={`inline-flex items-center text-red-600 hover:text-red-700 ${deletingId === it.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label={t('policies:pdf.delete')}
                          title={t('policies:pdf.delete')}
                          disabled={deletingId === it.id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v-2a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 4v6m4-6v6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                      <div className="flex flex-col">
                        <input
                          aria-label="Upload Apólice"
                          className="max-w-xs"
                          type="file"
                          accept="application/pdf"
                          disabled={uploadingId === it.id}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || f.type !== 'application/pdf') return;
                            const MAX_BYTES = 2 * 1024 * 1024;
                            if (f.size > MAX_BYTES) { showToast(t('policies:pdf.tooLarge'), 'error'); e.currentTarget.value = ''; return; }
                            try {
                              setUploadingId(it.id!);
                              const sref = storageRef(storage, `policies/${it.ownerUid}/${it.id}/policy.pdf`);
                              await uploadBytes(sref, f, { contentType: 'application/pdf' });
                              const url = await getDownloadURL(sref);
                              await savePolicy(it.ownerUid, it.id!, { policyPdfUrl: url, status: 'em_vigor' });
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, policyPdfUrl: url, status: 'em_vigor' } : p)));
                              showToast(t('policies:pdf.successUpload'), 'success');
                            } catch (err) {
                              console.error(err);
                              showToast(t('policies:pdf.errorUpload'), 'error');
                            } finally {
                              setUploadingId(null);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        {uploadingId === it.id && (
                          <div className="mt-1 text-xs text-blue-700 flex items-center gap-2">
                            <span className="w-3 h-3 inline-block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            {t('policies:pdf.uploading')}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Recibo */}
                  <span className="text-sm text-blue-900 font-medium whitespace-nowrap">Recibo:</span>
                  {it.receiptPdfUrl ? (
                    <div className="flex items-center gap-3">
                      <a href={it.receiptPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
                          <rect x="4" y="4" width="40" height="40" rx="6" fill="#10B981" />
                          <text x="50%" y="62%" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="14" fill="#FFFFFF">PDF</text>
                        </svg>
                        <span className="text-sm font-medium underline">{t('policies:pdf.viewReceipt', { defaultValue: 'Ver Recibo' })}</span>
                      </a>
                      {isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setDeletingId(it.id!);
                              const pdfRef = storageRef(storage, `policies/${it.ownerUid}/${it.id}/receipt.pdf`);
                              try { await deleteObject(pdfRef); } catch {}
                              const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                              await updateDoc(ref, { receiptPdfUrl: null });
                              showToast(t('policies:pdf.successDelete'), 'success');
                            } catch (e) {
                              console.error(e);
                              showToast(t('policies:pdf.errorDelete'), 'error');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          className={`inline-flex items-center text-red-600 hover:text-red-700 ${deletingId === it.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label={t('policies:pdf.delete')}
                          title={t('policies:pdf.delete')}
                          disabled={deletingId === it.id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v-2a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 4v6m4-6v6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                      <div className="flex flex-col">
                        <input
                          aria-label="Upload Recibo"
                          className="max-w-xs"
                          type="file"
                          accept="application/pdf"
                          disabled={uploadingId === it.id}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || f.type !== 'application/pdf') return;
                            const MAX_BYTES = 2 * 1024 * 1024;
                            if (f.size > MAX_BYTES) { showToast(t('policies:pdf.tooLarge'), 'error'); e.currentTarget.value = ''; return; }
                            try {
                              setUploadingId(it.id!);
                              const sref = storageRef(storage, `policies/${it.ownerUid}/${it.id}/receipt.pdf`);
                              await uploadBytes(sref, f, { contentType: 'application/pdf' });
                              const url = await getDownloadURL(sref);
                              await savePolicy(it.ownerUid, it.id!, { receiptPdfUrl: url });
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, receiptPdfUrl: url } : p)));
                              showToast(t('policies:pdf.successUpload'), 'success');
                            } catch (err) {
                              console.error(err);
                              showToast(t('policies:pdf.errorUpload'), 'error');
                            } finally {
                              setUploadingId(null);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        {uploadingId === it.id && (
                          <div className="mt-1 text-xs text-blue-700 flex items-center gap-2">
                            <span className="w-3 h-3 inline-block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            {t('policies:pdf.uploading')}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Condições particulares */}
                  <span className="text-sm text-blue-900 font-medium whitespace-nowrap">Condições Particulares:</span>
                  {it.conditionsPdfUrl ? (
                    <div className="flex items-center gap-3">
                      <a href={it.conditionsPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
                          <rect x="4" y="4" width="40" height="40" rx="6" fill="#10B981" />
                          <text x="50%" y="62%" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="14" fill="#FFFFFF">PDF</text>
                        </svg>
                        <span className="text-sm font-medium underline">{t('policies:pdf.viewConditions', { defaultValue: 'Ver Condições Particulares' })}</span>
                      </a>
                      {isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setDeletingId(it.id!);
                              const pdfRef = storageRef(storage, `policies/${it.ownerUid}/${it.id}/conditions.pdf`);
                              try { await deleteObject(pdfRef); } catch {}
                              const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                              await updateDoc(ref, { conditionsPdfUrl: null });
                              showToast(t('policies:pdf.successDelete'), 'success');
                            } catch (e) {
                              console.error(e);
                              showToast(t('policies:pdf.errorDelete'), 'error');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          className={`inline-flex items-center text-red-600 hover:text-red-700 ${deletingId === it.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label={t('policies:pdf.delete')}
                          title={t('policies:pdf.delete')}
                          disabled={deletingId === it.id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v-2a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 4v6m4-6v6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                      <div className="flex flex-col">
                        <input
                          aria-label="Upload Condições Particulares"
                          className="max-w-xs"
                          type="file"
                          accept="application/pdf"
                          disabled={uploadingId === it.id}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || f.type !== 'application/pdf') return;
                            const MAX_BYTES = 2 * 1024 * 1024;
                            if (f.size > MAX_BYTES) { showToast(t('policies:pdf.tooLarge'), 'error'); e.currentTarget.value = ''; return; }
                            try {
                              setUploadingId(it.id!);
                              const sref = storageRef(storage, `policies/${it.ownerUid}/${it.id}/conditions.pdf`);
                              await uploadBytes(sref, f, { contentType: 'application/pdf' });
                              const url = await getDownloadURL(sref);
                              await savePolicy(it.ownerUid, it.id!, { conditionsPdfUrl: url });
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, conditionsPdfUrl: url } : p)));
                              showToast(t('policies:pdf.successUpload'), 'success');
                            } catch (err) {
                              console.error(err);
                              showToast(t('policies:pdf.errorUpload'), 'error');
                            } finally {
                              setUploadingId(null);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        {uploadingId === it.id && (
                          <div className="mt-1 text-xs text-blue-700 flex items-center gap-2">
                            <span className="w-3 h-3 inline-block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            {t('policies:pdf.uploading')}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Carta Verde (auto) */}
                  {it.type === 'auto' && (
                    <>
                      <span className="text-sm text-blue-900 font-medium whitespace-nowrap">Carta Verde:</span>
                      {it.greenCardPdfUrl ? (
                        <div className="flex items-center gap-3">
                          <a href={it.greenCardPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
                              <rect x="4" y="4" width="40" height="40" rx="6" fill="#10B981" />
                              <text x="50%" y="62%" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="14" fill="#FFFFFF">PDF</text>
                            </svg>
                            <span className="text-sm font-medium underline">{t('policies:pdf.viewGreenCard', { defaultValue: 'Ver Carta Verde' })}</span>
                          </a>
                          {isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setDeletingId(it.id!);
                                  const pdfRef = storageRef(storage, `policies/${it.ownerUid}/${it.id}/green-card.pdf`);
                                  try { await deleteObject(pdfRef); } catch {}
                                  const ref = doc(db, 'users', it.ownerUid, 'policies', it.id!);
                                  await updateDoc(ref, { greenCardPdfUrl: null });
                                  showToast(t('policies:pdf.successDelete'), 'success');
                                  setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, greenCardPdfUrl: undefined } : p)));
                                } catch (e) {
                                  console.error(e);
                                  showToast(t('policies:pdf.errorDelete'), 'error');
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              className={`inline-flex items-center text-red-600 hover:text-red-700 ${deletingId === it.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                              aria-label={t('policies:pdf.delete')}
                              title={t('policies:pdf.delete')}
                              disabled={deletingId === it.id}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v-2a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 4v6m4-6v6" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        isAdmin && normalizeStatus(it.status) !== 'em_criacao' && (
                          <div className="flex flex-col">
                            <input
                              aria-label="Upload Carta Verde"
                              className="max-w-xs"
                              type="file"
                              accept="application/pdf"
                              disabled={uploadingId === it.id}
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f || f.type !== 'application/pdf') return;
                                const MAX_BYTES = 2 * 1024 * 1024;
                                if (f.size > MAX_BYTES) { showToast(t('policies:pdf.tooLarge'), 'error'); e.currentTarget.value = ''; return; }
                                try {
                                  setUploadingId(it.id!);
                                  const sref = storageRef(storage, `policies/${it.ownerUid}/${it.id}/green-card.pdf`);
                                  await uploadBytes(sref, f, { contentType: 'application/pdf' });
                                  const url = await getDownloadURL(sref);
                                  await savePolicy(it.ownerUid, it.id!, { greenCardPdfUrl: url });
                                  setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, greenCardPdfUrl: url } : p)));
                                  showToast(t('policies:pdf.successUpload'), 'success');
                                } catch (err) {
                                  console.error(err);
                                  showToast(t('policies:pdf.errorUpload'), 'error');
                                } finally {
                                  setUploadingId(null);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            {uploadingId === it.id && (
                              <div className="mt-1 text-xs text-blue-700 flex items-center gap-2">
                                <span className="w-3 h-3 inline-block border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                {t('policies:pdf.uploading')}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
              </ul>
            );
          })()}
        </section>
      )}
    </main>
  );
}
