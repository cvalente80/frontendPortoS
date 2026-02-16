import React, { useMemo, useState } from 'react';
import { savePolicy, type PolicyRecord, type PaymentFrequency } from '../utils/policies';
import { useTranslation } from 'react-i18next';
import emailjs from '@emailjs/browser';
import { EMAILJS_SERVICE_ID_POLICY, EMAILJS_TEMPLATE_ID_POLICY, EMAILJS_USER_ID_POLICY } from '../emailjs.config';

export type PolicyFormProps = {
  uid: string;
  policyId: string;
  initial?: Partial<PolicyRecord> | null;
  onSaved?: (data: Partial<PolicyRecord>) => void;
  submitLabel?: string;
};

const freqOptions: PaymentFrequency[] = ['anual', 'semestral', 'trimestral', 'mensal'];

export default function PolicyForm({ uid, policyId, initial, onSaved, submitLabel }: PolicyFormProps): React.ReactElement {
  const { t } = useTranslation(['policies', 'common']);
  const [holderName, setHolderName] = useState(initial?.holderName || '');
  const [nif, setNif] = useState(initial?.nif || '');
  const [citizenCardNumber, setCitizenCardNumber] = useState(initial?.citizenCardNumber || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [addressStreet, setAddressStreet] = useState(initial?.addressStreet || initial?.address || '');
  const [addressPostalCode, setAddressPostalCode] = useState(initial?.addressPostalCode || '');
  const [addressLocality, setAddressLocality] = useState(initial?.addressLocality || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(initial?.paymentFrequency as PaymentFrequency || 'anual');
  const [paymentMethod, setPaymentMethod] = useState<'multibanco' | 'debito_direto'>((initial?.paymentMethod as any) || 'multibanco');
  const [nib, setNib] = useState(initial?.nib || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Helpers
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
  const isValidPhone = (v: string) => {
    const digits = (v || '').replace(/\D/g, '');
    return /^\d{9}$/.test(digits);
  };
  const isValidCitizenCard = (v: string) => {
    const norm = (v || '').trim().toUpperCase();
    // Example format: 00000000 0 ZZ0 (BI/CC pattern commonly used)
    return /^\d{8}\s?\d\s?[A-Z]{2}\d$/.test(norm);
  };
  const isValidNIF = (v: string) => {
    const digits = (v || '').replace(/\D/g, '');
    if (!/^\d{9}$/.test(digits)) return false;
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + parseInt(digits[i], 10) * w, 0);
    const cd = 11 - (sum % 11);
    const check = cd >= 10 ? 0 : cd;
    return check === parseInt(digits[8], 10);
  };
  const isValidPTIBAN = (v: string) => {
    const norm = (v || '').replace(/\s+/g, '').toUpperCase();
    if (!/^PT\d{23}$/.test(norm)) return false; // PT + 23 digits = total 25 chars
    // IBAN mod-97 check
    const rearranged = norm.slice(4) + norm.slice(0, 4);
    const converted = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
    let remainder = 0;
    for (let i = 0; i < converted.length; i += 7) {
      const block = (remainder.toString() + converted.slice(i, i + 7));
      remainder = parseInt(block, 10) % 97;
    }
    return remainder === 1;
  };

  const validEmail = useMemo(() => isValidEmail(email), [email]);
  const validPhone = useMemo(() => isValidPhone(phone), [phone]);
  const validNif = useMemo(() => isValidNIF(nif), [nif]);
  const validCitizenCard = useMemo(() => isValidCitizenCard(citizenCardNumber), [citizenCardNumber]);
  const validNib = useMemo(() => isValidPTIBAN(nib), [nib]);
  const validName = useMemo(() => (holderName || '').trim().length >= 3, [holderName]);
  const validStreet = useMemo(() => (addressStreet || '').trim().length >= 3, [addressStreet]);
  const validPostal = useMemo(() => /^\d{4}-\d{3}$/.test((addressPostalCode || '').trim()), [addressPostalCode]);
  const validLocality = useMemo(() => (addressLocality || '').trim().length >= 2, [addressLocality]);
  const baseValid = validName && validNif && validCitizenCard && validStreet && validPostal && validLocality && validEmail && validPhone && Boolean(paymentFrequency);
  const canSave = baseValid && (paymentMethod === 'debito_direto' ? validNib : true);

  // Formatters for UI-only grouping of 9 digits as XXX XXX XXX
  const formatTripleGroups = (v: string) => {
    const d = (v || '').replace(/\D/g, '');
    if (!d) return '';
    return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  async function handleSave() {
    setError(null);
    setOk(null);
    try {
      if (!canSave) {
        setError(t('policies:errors.invalidForm'));
        return;
      }
      setSaving(true);
      // Compose legacy combined address for backward compatibility
      const combinedAddress = [addressStreet, [addressPostalCode, addressLocality].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      const payload: Partial<PolicyRecord> = {
        holderName,
        nif,
        citizenCardNumber,
        address: combinedAddress || undefined,
        addressStreet,
        addressPostalCode,
        addressLocality,
        phone,
        email,
        paymentFrequency,
        paymentMethod,
        nib,
        status: 'em_validacao',
      };
      await savePolicy(uid, policyId, payload);
      // Enviar email de confirmação ao utilizador (não bloqueante para o fluxo)
      try {
        if (email) {
          const subject = t('policies:email.subject', 'Recebemos os dados da sua apólice');
          const body = t(
            'policies:email.body',
            'Olá, recebemos os dados necessários para preparar a sua apólice. Em breve um consultor irá contactá-lo com os próximos passos.'
          );
          await emailjs.send(
            EMAILJS_SERVICE_ID_POLICY,
            EMAILJS_TEMPLATE_ID_POLICY,
            {
              email,
              subject,
              body,
            },
            EMAILJS_USER_ID_POLICY
          );
        }
      } catch (mailErr) {
        // Não falhar o fluxo de gravação se o email não for enviado
        console.warn('[PolicyForm] emailjs policy notify error', mailErr);
      }
      setOk(t('policies:form.saved'));
      onSaved?.(payload);
    } catch (e: any) {
      console.error('[PolicyForm] save error', e);
      setError(t('policies:errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="as-card mt-3 bg-blue-50/50 border-blue-100">
      <h4 className="text-blue-900 font-semibold mb-2">{t('policies:form.title')}</h4>
      {error && <div className="as-alert as-alert-error mb-3">{error}</div>}
      {ok && <div className="as-alert as-alert-success mb-3">{ok}</div>}
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="pf-holderName" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.holderName')}</label>
          <input id="pf-holderName" className={`as-input ${validName ? 'border-blue-200' : 'border-red-300'}`} value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder={t('policies:placeholders.holderName') as string} />
          {!validName && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.nameRequired')}</p>}
        </div>
        <div>
          <label htmlFor="pf-nif" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.nif')}</label>
          <input
            id="pf-nif"
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            maxLength={11}
            className={`as-input ${validNif ? 'border-blue-200' : 'border-red-300'}`}
            value={formatTripleGroups(nif)}
            onChange={(e) => setNif(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder={t('policies:placeholders.nif') as string}
          />
          {!validNif && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.invalidNif')}</p>}
        </div>
        <div>
          <label htmlFor="pf-cc" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.citizenCardNumber')}</label>
          <input
            id="pf-cc"
            type="text"
            maxLength={14}
            className={`as-input ${validCitizenCard ? 'border-blue-200' : 'border-red-300'}`}
            value={citizenCardNumber}
            onChange={(e) => {
              const raw = e.target.value.toUpperCase().replace(/[^0-9A-Z\s]/g, '');
              setCitizenCardNumber(raw.slice(0, 14));
            }}
            placeholder={t('policies:placeholders.citizenCardNumber') as string}
          />
          {!validCitizenCard && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.invalidCitizenCard')}</p>}
        </div>
        <div>
          <label htmlFor="pf-addr-street" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.addressStreet', 'Rua e nº')}</label>
          <input id="pf-addr-street" className={`as-input ${validStreet ? 'border-blue-200' : 'border-red-300'}`} value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} placeholder={t('policies:placeholders.addressStreet', 'Rua e nº') as string} />
          {!validStreet && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.addressStreetRequired', 'Indique a rua e nº')}</p>}
        </div>
        <div>
          <label htmlFor="pf-addr-locality" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.locality', 'Localidade')}</label>
          <input id="pf-addr-locality" className={`as-input ${validLocality ? 'border-blue-200' : 'border-red-300'}`} value={addressLocality} onChange={(e) => setAddressLocality(e.target.value)} placeholder={t('policies:placeholders.locality', 'Localidade') as string} />
          {!validLocality && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.localityRequired', 'Indique a localidade')}</p>}
        </div>
        <div>
          <label htmlFor="pf-addr-postal" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.postalCode', 'Código Postal')}</label>
          <input
            id="pf-addr-postal"
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            maxLength={8}
            className={`as-input ${validPostal ? 'border-blue-200' : 'border-red-300'}`}
            value={addressPostalCode}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
              const formatted = digits.length <= 4
                ? digits
                : `${digits.slice(0, 4)}-${digits.slice(4)}`;
              setAddressPostalCode(formatted);
            }}
            placeholder={t('policies:placeholders.postalCode', '____-___') as string}
          />
          {!validPostal && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.postalCodeInvalid', 'Código postal inválido (XXXX-XXX).')}</p>}
        </div>
        <div>
          <label htmlFor="pf-phone" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.phone')}</label>
          <input
            id="pf-phone"
            type="tel"
            inputMode="numeric"
            pattern="\\d*"
            maxLength={11}
            className={`as-input ${validPhone ? 'border-blue-200' : 'border-red-300'}`}
            value={formatTripleGroups(phone)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
              setPhone(digits);
            }}
            placeholder={t('policies:placeholders.phone') as string}
          />
          {!validPhone && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.invalidPhone')}</p>}
        </div>
        <div>
          <label htmlFor="pf-email" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.email')}</label>
          <input id="pf-email" className={`as-input ${validEmail ? 'border-blue-200' : 'border-red-300'}`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('policies:placeholders.email') as string} />
          {!validEmail && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.invalidEmail')}</p>}
        </div>
        <div>
          <label htmlFor="pf-frequency" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.paymentFrequency')}</label>
          <select id="pf-frequency" className="as-select border-blue-200" value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}>
            {freqOptions.map((opt) => (
              <option key={opt} value={opt}>{t(`policies:frequencies.${opt}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-method" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.paymentMethod', 'Forma de pagamento')}</label>
          <select
            id="pf-method"
            className="as-select border-blue-200"
            value={paymentMethod}
            onChange={(e) => {
              const val = e.target.value as 'multibanco' | 'debito_direto';
              setPaymentMethod(val);
              if (val === 'multibanco') {
                setNib('');
              } else if (val === 'debito_direto' && !nib) {
                setNib('PT50');
              }
            }}
          >
            <option value="multibanco">{t('policies:paymentMethods.multibanco', 'Multibanco')}</option>
            <option value="debito_direto">{t('policies:paymentMethods.debito_direto', 'Débito direto')}</option>
          </select>
        </div>
        {paymentMethod === 'debito_direto' && (
        <div>
          <label htmlFor="pf-nib" className="block text-left text-sm text-blue-800 mb-1">{t('policies:form.nib')}</label>
          <input
            id="pf-nib"
            type="text"
            maxLength={25}
            className={`as-input ${validNib ? 'border-blue-200' : 'border-red-300'}`}
            value={nib}
            onFocus={() => { if (!nib) setNib('PT50'); }}
            onChange={(e) => {
              const raw = e.target.value.toUpperCase().replace(/\s+/g, '');
              const suffix = raw.startsWith('PT50') ? raw.slice(4) : raw.replace(/^PT50/, '');
              const next = ('PT50' + suffix).slice(0, 25);
              setNib(next);
            }}
            placeholder={t('policies:placeholders.nib') as string}
          />
          <p className="mt-1 text-xs text-blue-700 text-left">{t('policies:help.nibFormat')}</p>
          {!validNib && <p className="mt-1 text-xs text-red-700 text-left">{t('policies:errors.invalidNib')}</p>}
        </div>
        )}
      </div>
      <div className="mt-3">
        <button type="button" onClick={handleSave} disabled={!canSave || saving} className={`as-btn bg-blue-600 text-white hover:bg-blue-700 ${(!canSave || saving) ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {saving && <span className="w-3 h-3 inline-block border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitLabel || t('policies:form.saveCta')}
        </button>
      </div>
    </div>
  );
}
