import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, collectionGroup, doc, getDocs, getFirestore, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.resolve(process.cwd(), 'artifacts', 'playwright-transfer', `zurich-auto-flow-${stamp}`);
await fs.mkdir(dir, { recursive: true });

const meta = { steps: [] };
const runStartedAt = Date.now();
const originalStepsPush = meta.steps.push.bind(meta.steps);
meta.steps.push = (...entries) => {
  const stampedEntries = entries.map((entry) => {
    if (typeof entry !== 'string') return entry;
    const elapsedMs = Date.now() - runStartedAt;
    return `t+${elapsedMs}ms | ${entry}`;
  });
  return originalStepsPush(...stampedEntries);
};
const debugOverlayEnabled = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_DEBUG_OVERLAY || 'false').trim().toLowerCase());
const sourcePreferenceRaw = String(process.env.TRANSFER_SOURCE_PREFERENCE || '').trim().toLowerCase();
const preferLocalhostFirst = sourcePreferenceRaw === 'localhost' || sourcePreferenceRaw === 'local' || sourcePreferenceRaw === 'localhost-first';
const headless = String(process.env.PW_HEADLESS || 'true').toLowerCase() !== 'false';
const slowMo = Number(process.env.PW_SLOW_MO || (headless ? 0 : 220));
const manualMatriculaCapture = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_MANUAL_MATRICULA_LUPA_CAPTURE || '').trim().toLowerCase());
const manualMatriculaAfterNif = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_MANUAL_MATRICULA_AFTER_NIF || '').trim().toLowerCase());
const manualSelectVehicleFirst = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_MANUAL_SELECT_VEHICLE_FIRST || '').trim().toLowerCase());
const manualSelectVehicleTimeoutMs = Math.max(10000, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_VEHICLE_TIMEOUT_MS || '240000'), 10) || 240000);
const manualSelectVehicleReopenAttempts = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_REOPEN_ATTEMPTS || '4'), 10) || 4);
const manualSelectVehicleReopenWaitMs = Math.max(120, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_REOPEN_WAIT_MS || '220'), 10) || 220);
const manualSelectVehicleLateFieldWaitMs = Math.max(300, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_LATE_FIELD_WAIT_MS || '700'), 10) || 700);
const manualSelectVehicleInvisibleIdleMs = Math.max(350, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_INVISIBLE_IDLE_MS || '700'), 10) || 700);
const manualSelectVehicleAutoPickAfterMs = Math.max(1200, Number.parseInt(String(process.env.TRANSFER_MANUAL_SELECT_AUTOPICK_AFTER_MS || '3500'), 10) || 3500);
const manualLearnVehicleClick = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_MANUAL_LEARN_VEHICLE_CLICK || 'false').trim().toLowerCase());
const manualLearnCaptureWindowMs = Math.max(1200, Number.parseInt(String(process.env.TRANSFER_MANUAL_LEARN_CAPTURE_WINDOW_MS || '3200'), 10) || 3200);
const manualLearnSecondLupaRetryAttempts = Math.max(1, Number.parseInt(String(process.env.TRANSFER_MANUAL_LEARN_SECOND_RETRY_ATTEMPTS || '10'), 10) || 10);
const forceRecoveryReclickInAutoMode = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_FORCE_RECOVERY_RECLICK_ONCE || 'true').trim().toLowerCase());
const vehicleResultIndex = Math.max(0, Number.parseInt(String(process.env.TRANSFER_VEHICLE_RESULT_INDEX || '0'), 10) || 0);
const vehiclePreferredSelector = String(process.env.TRANSFER_VEHICLE_PREFERRED_SELECTOR || '').trim();
const pauseAfterAutoSelectVehicleMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_PAUSE_AFTER_AUTO_SELECT_VEHICLE_MS || '2500'), 10) || 2500);
const finalStepActions = String(process.env.TRANSFER_FINAL_STEP_ACTIONS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const shouldClickSeguinteAndChooseEssencialForThirdParty = finalStepActions.includes('click-seguinte-escolher-essencial-terceiros')
  || finalStepActions.includes('click-seguinte-escolher-opcao-por-tipo-seguro')
  || finalStepActions.includes('opcao-por-tipo-seguro')
  || finalStepActions.includes('terceiros-essencial');
const shouldAdvanceThirdPartyToCoberturas = finalStepActions.includes('terceiros-essencial-coberturas')
  || finalStepActions.includes('click-seguinte-escolher-essencial-coberturas');
const shouldClickFinalSeguinte = finalStepActions.includes('click-seguinte');
const shouldPauseOnDadosAuto = finalStepActions.includes('pause-dados-auto')
  || finalStepActions.includes('manual-click-dados-auto');
const shouldClickLearnedResumoAfterSeguinte = finalStepActions.includes('click-resumo-learned')
  || finalStepActions.includes('resumo-click-learned');
const shouldAdvanceLearnedResumoToCoberturas = finalStepActions.includes('click-resumo-learned-coberturas')
  || finalStepActions.includes('resumo-click-learned-coberturas')
  || finalStepActions.includes('click-resumo-learned-coberturas-pause')
  || finalStepActions.includes('resumo-click-learned-coberturas-pause');
const shouldPauseOnCoberturas = finalStepActions.includes('pause-coberturas')
  || finalStepActions.includes('click-resumo-learned-coberturas-pause')
  || finalStepActions.includes('resumo-click-learned-coberturas-pause');
const shouldDragCoberturasSlider = finalStepActions.includes('drag-coberturas-slider')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag');
const shouldCalculateCoberturasAfterDrag = finalStepActions.includes('click-coberturas-calcular')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-calcular')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-calcular')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-calcular-pause-recibos')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-calcular-pause-recibos');
const shouldPauseBeforeCoberturasCalculator = finalStepActions.includes('pause-coberturas-calculadora')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-pause-calculadora')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-pause-calculadora');
const shouldPauseAfterCoberturasSlider = finalStepActions.includes('pause-coberturas-apos-slider')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-pause-clicks')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-pause-clicks');
const shouldScrapeAccordionAfterSlider = finalStepActions.includes('accordion-apos-slider')
  || finalStepActions.includes('drag-accordion-calcular')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-accordion-calcular-full')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-accordion-calcular-full');
const shouldPauseBeforeCoberturasReceiptDetails = finalStepActions.includes('pause-coberturas-recibos')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-calcular-pause-recibos')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-calcular-pause-recibos');
const shouldPauseBeforeAccordionScrape = finalStepActions.includes('pause-accordion-scrape')
  || finalStepActions.includes('calcular-pause-accordion')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-calcular-pause-accordion')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-calcular-pause-accordion');
const shouldScrapeAccordionBeforeCalcular = finalStepActions.includes('accordion-antes-calcular')
  || finalStepActions.includes('scrape-accordion-before-calcular')
  || finalStepActions.includes('click-resumo-learned-coberturas-drag-accordion-calcular')
  || finalStepActions.includes('resumo-click-learned-coberturas-drag-accordion-calcular');
const shouldPauseForGlassUncheck = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_PAUSE_FOR_GLASS_UNCHECK || '').trim().toLowerCase());
// Pausa simples após clicar Seguinte (passo 1→2) — sem captura de cliques; 0 = desativado
const pauseAfterSeguinteMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_PAUSE_AFTER_SEGUINTE_MS || '0'), 10) || 0);
const manualCoberturasReceiptClickCount = Math.max(1, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_RECIBOS_MANUAL_CLICK_COUNT || '4'), 10) || 4);
const manualCoberturasReceiptClickTimeoutMs = Math.max(15000, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_RECIBOS_MANUAL_CLICK_TIMEOUT_MS || '180000'), 10) || 180000);
const accordionScrapeManualClickCount = Math.max(1, Number.parseInt(String(process.env.TRANSFER_ACCORDION_MANUAL_CLICK_COUNT || '4'), 10) || 4);
const accordionScrapeManualClickTimeoutMs = Math.max(15000, Number.parseInt(String(process.env.TRANSFER_ACCORDION_MANUAL_CLICK_TIMEOUT_MS || '300000'), 10) || 300000);
const accordionScrapeSettleMs = Math.max(400, Number.parseInt(String(process.env.TRANSFER_ACCORDION_SETTLE_MS || '1200'), 10) || 1200);
const finalStepSettlingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_FINAL_STEP_SETTLING_MS || '1200'), 10) || 1200);
const finalStepBeforeSeguinteMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_FINAL_STEP_BEFORE_SEGUINTE_MS || '1800'), 10) || 1800);
const finalStepNextPageWaitMs = Math.max(1500, Number.parseInt(String(process.env.TRANSFER_FINAL_STEP_NEXT_PAGE_WAIT_MS || '7000'), 10) || 7000);
const forcedMatriculaLupaSelector = String(process.env.TRANSFER_MATRICULA_LUPA_SELECTOR || '').trim();
const defaultMatriculaLupaSelector = 'div.WSearch.T3:nth-of-type(1) > div.Text_Note.OSInline:nth-of-type(2) > span.fa.fa-fw';
const effectiveMatriculaLupaSelector = forcedMatriculaLupaSelector || defaultMatriculaLupaSelector;
const matriculaLookupClicks = Math.max(1, Number.parseInt(String(process.env.TRANSFER_MATRICULA_LUPA_CLICKS || '2'), 10) || 2);
const matriculaFieldFocusClicks = Math.max(1, Number.parseInt(String(process.env.TRANSFER_MATRICULA_FOCUS_CLICKS || '3'), 10) || 3);
const matriculaFieldFocusClickGapMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_FOCUS_CLICK_GAP_MS || '70'), 10) || 70);
const matriculaPreflightFocusClicks = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PREFLIGHT_FOCUS_CLICKS || '3'), 10) || 3);
const matriculaPreflightFocusGapMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PREFLIGHT_FOCUS_GAP_MS || '35'), 10) || 35);
const matriculaPostPreflightFocusClicks = Math.max(1, Number.parseInt(String(process.env.TRANSFER_MATRICULA_POST_PREFLIGHT_FOCUS_CLICKS || '1'), 10) || 1);
const matriculaPrimingEnabled = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_MATRICULA_PRIMING_ENABLED || 'true').trim().toLowerCase());
const matriculaPrimingFocusClicks = Math.max(1, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PRIMING_FOCUS_CLICKS || '2'), 10) || 2);
const matriculaPrimingFocusGapMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PRIMING_FOCUS_GAP_MS || '20'), 10) || 20);
const matriculaPrimingClickTimeoutMs = Math.max(250, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PRIMING_CLICK_TIMEOUT_MS || '700'), 10) || 700);
const matriculaCharTypeDelayMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_TYPE_DELAY_MS || '90'), 10) || 90);
const matriculaInterCharPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_INTER_CHAR_PAUSE_MS || '40'), 10) || 40);
const matriculaPostTypePauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_POST_TYPE_PAUSE_MS || '320'), 10) || 320);
const matriculaTabPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_TAB_PAUSE_MS || '260'), 10) || 260);
const matriculaShiftTabPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_SHIFT_TAB_PAUSE_MS || '220'), 10) || 220);
const matriculaEnterPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_ENTER_PAUSE_MS || '600'), 10) || 600);
const matriculaPostBlurPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_POST_BLUR_MS || '250'), 10) || 250);
const matriculaPreLookupPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_PRE_LOOKUP_MS || '250'), 10) || 250);
const matriculaLookupWaitFirstMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_LOOKUP_WAIT_FIRST_MS || '250'), 10) || 250);
const matriculaLookupWaitRetryMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MATRICULA_LOOKUP_WAIT_RETRY_MS || '350'), 10) || 350);
const firstSimularSettlingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_FIRST_SIMULAR_SETTLING_MS || '250'), 10) || 250);
const contribuintePostFillWaitMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_CONTRIBUINTE_POST_FILL_MS || '120'), 10) || 120);
const contribuintePostLookupWaitMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_CONTRIBUINTE_POST_LOOKUP_MS || '120'), 10) || 120);
const contribuinteNameWaitTimeoutMs = Math.max(1200, Number.parseInt(String(process.env.TRANSFER_CONTRIBUINTE_NAME_WAIT_MS || '3500'), 10) || 3500);
const contribuinteNamePollMs = Math.max(60, Number.parseInt(String(process.env.TRANSFER_CONTRIBUINTE_NAME_POLL_MS || '120'), 10) || 120);
const simularPostClickReadyTimeoutMs = Math.max(1500, Number.parseInt(String(process.env.TRANSFER_SIMULAR_READY_TIMEOUT_MS || '10000'), 10) || 10000);
const matriculaAutoDialogInitialWaitMs = Math.max(80, Number.parseInt(String(process.env.TRANSFER_MATRICULA_AUTO_DIALOG_WAIT_MS || '200'), 10) || 200);
const loginStepTransitionMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_LOGIN_STEP_TRANSITION_MS || '500'), 10) || 500);
const homeSettlingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_HOME_SETTLING_MS || '800'), 10) || 800);
const menuTransitionMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MENU_TRANSITION_MS || '300'), 10) || 300);
const simuladoresListSettlingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_SIMULADORES_LIST_SETTLING_MS || '700'), 10) || 700);
const tileOpenSettlingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_TILE_OPEN_SETTLING_MS || '700'), 10) || 700);
const manualCaptureArmingMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_MANUAL_CAPTURE_ARMING_MS || '200'), 10) || 200);
const vehicleChooserPostLookupWaitMs = Math.max(900, Number.parseInt(String(process.env.TRANSFER_VEHICLE_CHOOSER_POST_LOOKUP_MS || '2500'), 10) || 2500);
const vehiclePostSelectWaitMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_VEHICLE_POST_SELECT_MS || '350'), 10) || 350);
const vehicleLoadedWaitTimeoutMs = Math.max(1200, Number.parseInt(String(process.env.TRANSFER_VEHICLE_LOADED_WAIT_MS || '2500'), 10) || 2500);
const vehicleLoadedSoftPauseMs = Math.max(0, Number.parseInt(String(process.env.TRANSFER_VEHICLE_LOADED_SOFT_PAUSE_MS || '350'), 10) || 350);
const vehiclePostSelectLoadWaitMs = Math.max(200, Number.parseInt(String(process.env.TRANSFER_VEHICLE_POST_SELECT_LOAD_WAIT_MS || '900'), 10) || 900);
const skipVehicleLoadedWait = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_SKIP_VEHICLE_LOADED_WAIT || 'true').trim().toLowerCase());
const captureMatriculaIntermediateShot = ['1', 'true', 'yes'].includes(String(process.env.TRANSFER_CAPTURE_MATRICULA_SHOT || 'false').trim().toLowerCase());
const loginLandingWaitTimeoutMs = Math.max(3000, Number.parseInt(String(process.env.TRANSFER_LOGIN_LANDING_WAIT_MS || '12000'), 10) || 12000);
const menuSimuladoresReadyWaitMs = Math.max(600, Number.parseInt(String(process.env.TRANSFER_MENU_READY_WAIT_MS || '2500'), 10) || 2500);
const clienteReadyElementId = 'Zurich_PT_Theme_wtZurich_PT_Theme_Layout_SideBar_block_WebPatterns_wt24_block_wtColumn1_wtMainContent_wt20_wtItems_wt893_wtContent_WebPatterns_wt271_block_wtColumn1_Simuladores_WB_wt619_block_wtcnt_Cliente';
const clienteReadyWaitTimeoutMs = Math.max(300, Number.parseInt(String(process.env.TRANSFER_CLIENTE_READY_WAIT_MS || '2000'), 10) || 2000);
const clienteReadyPollMs = Math.max(40, Number.parseInt(String(process.env.TRANSFER_CLIENTE_READY_POLL_MS || '90'), 10) || 90);
const learnedResumoSelector = String(process.env.TRANSFER_RESUMO_LEARNED_SELECTOR || 'div#Zurich_PT_Theme_wtZurich_PT_Theme_Layout_SideBar_block_WebPatterns_wt24_block_wtColumn1_wtMainContent_wt20_wtItems_wt567_wtContent_wtDivPremios > div.card.OSInline:nth-of-type(2) > div.cardObservacoes:nth-of-type(3) > p:nth-of-type(4) > strong').trim();
const learnedResumoParentSelector = String(process.env.TRANSFER_RESUMO_LEARNED_PARENT_SELECTOR || 'div#Zurich_PT_Theme_wtZurich_PT_Theme_Layout_SideBar_block_WebPatterns_wt24_block_wtColumn1_wtMainContent_wt20_wtItems_wt567_wtContent_wtDivPremios > div.card.OSInline:nth-of-type(2) > div.cardObservacoes:nth-of-type(3) > p:nth-of-type(4)').trim();
const learnedResumoText = String(process.env.TRANSFER_RESUMO_LEARNED_TEXT || 'Proteção Jurídica').trim();
// Seletor aprendido para o card "Opção Base" na página de seleção de planos (Terceiros)
const learnedBaseCardSelector = String(process.env.TRANSFER_BASE_CARD_SELECTOR || '').trim();
const manualCoberturasDragCount = Math.max(1, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_MANUAL_DRAG_COUNT || '1'), 10) || 1);
const manualCoberturasDragTimeoutMs = Math.max(15000, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_MANUAL_DRAG_TIMEOUT_MS || '180000'), 10) || 180000);
const learnedCoberturasHandleSelector = String(process.env.TRANSFER_COBERTURAS_DRAG_SELECTOR || 'div#Zurich_PT_Theme_wt146_block_WebPatterns_wt24_block_wtColumn1_wtMainContent_wtlr_Objectos_ctl00_wt407_wtItems_wt398_wtContent_wt416_wtLR_Descontos_ctl02_Zurich_PT_Patterns_wt12_block_wtSliderRange > span.ui-slider-handle.ui-state-default.ui-corner-all').trim();
const learnedCoberturasDragDeltaX = Number.parseInt(String(process.env.TRANSFER_COBERTURAS_DRAG_DELTA_X || '235'), 10) || 235;
const learnedCoberturasDragDeltaY = Number.parseInt(String(process.env.TRANSFER_COBERTURAS_DRAG_DELTA_Y || '19'), 10) || 19;
const learnedCoberturasDragSteps = Math.max(4, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_DRAG_STEPS || '18'), 10) || 18);
const learnedCoberturasPostDragWaitMs = Math.max(200, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_POST_DRAG_WAIT_MS || '1200'), 10) || 1200);
const coberturasCalcularWaitTimeoutMs = Math.max(2500, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_CALCULAR_WAIT_MS || '18000'), 10) || 18000);
const coberturasCalcularPostClickWaitMs = Math.max(200, Number.parseInt(String(process.env.TRANSFER_COBERTURAS_CALCULAR_POST_CLICK_MS || '1200'), 10) || 1200);
const coberturasTotalPanelSelector = String(process.env.TRANSFER_COBERTURAS_TOTAL_SELECTOR || 'form#WebForm1 > div.Zurich_PT_NovoLayout:nth-of-type(3) > div.Page.osx.chrome:nth-of-type(1) > div.Content:nth-of-type(2) > div.Columns.SmallRightColumns.tab_BreakAll:nth-of-type(1) > div.Column.ColLast:nth-of-type(2)').trim();
const learnedCoberturasCalculatorParentSelector = String(process.env.TRANSFER_COBERTURAS_CALCULATOR_PARENT_SELECTOR || 'a#Zurich_PT_Theme_wt146_block_WebPatterns_wt24_block_wtColumn2_wtMainSideBar_MZ_Coberturas_CW_wt85_block_Zurich_PT_Patterns_wt61_block_wtMiddleContent_wtcalculatorLink').trim();
const learnedCoberturasCalculatorSelector = String(process.env.TRANSFER_COBERTURAS_CALCULATOR_SELECTOR || 'a#Zurich_PT_Theme_wt146_block_WebPatterns_wt24_block_wtColumn2_wtMainSideBar_MZ_Coberturas_CW_wt85_block_Zurich_PT_Patterns_wt61_block_wtMiddleContent_wtcalculatorLink > span.icon-Calculator_CMYK').trim();

class ControlledPauseStop extends Error {
  constructor() {
    super('Controlled pause stop');
    this.name = 'ControlledPauseStop';
  }
}

function cleanEnv(value) {
  if (!value) return '';
  return String(value).split('#')[0].trim();
}

function getFirebaseClientConfigFromEnv() {
  const apiKey = cleanEnv(process.env.VITE_FIREBASE_API_KEY);
  const authDomain = cleanEnv(process.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = cleanEnv(process.env.VITE_FIREBASE_PROJECT_ID);
  const storageBucket = cleanEnv(process.env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = cleanEnv(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  const appId = cleanEnv(process.env.VITE_FIREBASE_APP_ID);

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

function getFirebaseClientApp(config) {
  if (!config) return null;
  return getApps().length ? getApp() : initializeApp(config);
}

async function loadLatestAutoSimulationPayload() {
  const config = getFirebaseClientConfigFromEnv();
  if (!config) return null;

  const app = getFirebaseClientApp(config);
  if (!app) return null;

  const db = getFirestore(app);

  const candidates = [];

  try {
    const simulationsQuery = query(
      collectionGroup(db, 'simulations'),
      where('type', '==', 'auto'),
      limit(25)
    );

    const snapshot = await getDocs(simulationsQuery);
    snapshot.forEach((document) => {
      const data = document.data() || {};
      candidates.push({
        id: document.id,
        path: document.ref.path,
        payload: data.payload || {},
        raw: data,
      });
    });
  } catch {
  }

  try {
    // Preferir jobs com status 'queued'; fallback sem filtro de status para compatibilidade
    let jobsSnapshot = null;
    try {
      const jobsQueuedQuery = query(
        collection(db, 'simulationTransferJobs'),
        where('simulationType', '==', 'auto'),
        where('status', '==', 'queued'),
        limit(25)
      );
      jobsSnapshot = await getDocs(jobsQueuedQuery);
    } catch {
      jobsSnapshot = null;
    }
    if (!jobsSnapshot || jobsSnapshot.empty) {
      const jobsQuery = query(
        collection(db, 'simulationTransferJobs'),
        where('simulationType', '==', 'auto'),
        limit(25)
      );
      jobsSnapshot = await getDocs(jobsQuery);
    }
    jobsSnapshot.forEach((document) => {
      const data = document.data() || {};
      candidates.push({
        id: document.id,
        path: document.ref.path,
        payload: data.payload || {},
        raw: data,
      });
    });
  } catch {
  }

  if (candidates.length > 0) {
    const toMillis = (value) => {
      if (!value) return 0;
      if (typeof value?.toMillis === 'function') return value.toMillis();
      if (typeof value?.seconds === 'number') return value.seconds * 1000;
      if (typeof value === 'string' || value instanceof Date) {
        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    candidates.sort((left, right) => {
      const leftMillis = toMillis(left.raw?.createdAt) || toMillis(left.raw?.updatedAt) || toMillis(left.raw?.capturedAt);
      const rightMillis = toMillis(right.raw?.createdAt) || toMillis(right.raw?.updatedAt) || toMillis(right.raw?.capturedAt);
      return rightMillis - leftMillis;
    });

    return candidates[0];
  }

  return null;
}

async function fillFirstMatchingField(page, selectors, value, fieldLabel, metaState) {
  if (value === undefined || value === null || String(value).trim() === '') return false;
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    const visible = await locator.isVisible().catch(() => true);
    if (!visible) continue;
    try {
      await locator.fill(String(value));
      metaState.steps.push(`prefill ${fieldLabel} -> ${selector}`);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function forceFocusMatriculaField(page, selectors, metaState, stepLabel = 'matricula-focus', options = {}) {
  const focusClicks = Math.max(1, Number(options.focusClicks) || matriculaFieldFocusClicks);
  const focusGapMs = Math.max(0, Number(options.focusGapMs) || matriculaFieldFocusClickGapMs);
  const initialForce = Boolean(options.initialForce);
  const clickTimeoutMs = Math.max(300, Number(options.clickTimeoutMs) || 15000);
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;

    for (let focusAttempt = 1; focusAttempt <= focusClicks; focusAttempt++) {
      try {
        await locator.click({ timeout: clickTimeoutMs, force: initialForce || focusAttempt > 1 });
      } catch {
        await locator.click({ force: true, timeout: clickTimeoutMs }).catch(() => null);
      }
      if (focusAttempt < focusClicks) {
        await page.waitForTimeout(focusGapMs);
      }
    }

    metaState.steps.push(`${stepLabel} -> ${selector} (${focusClicks} clicks)`);
    return true;
  }

  metaState.steps.push(`${stepLabel} -> not-found`);
  return false;
}

async function typeMatriculaProgressively(page, selectors, value, metaState, options = {}) {
  if (!value || String(value).trim() === '') return false;
  const skipInitialFocus = Boolean(options.skipInitialFocus);
  const waitEditableMs = Math.max(300, Number.parseInt(String(process.env.TRANSFER_MATRICULA_EDITABLE_WAIT_MS || '1800'), 10) || 1800);
  const plateOriginal = String(value).trim();
  const plateRaw = plateOriginal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const plateFormatted = plateOriginal.toUpperCase();
  const variants = Array.from(new Set([plateFormatted, plateRaw].filter(Boolean)));

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;

    const editableStarted = Date.now();
    let editable = await locator.isEditable().catch(() => false);
    while (!editable && Date.now() - editableStarted < waitEditableMs) {
      await page.waitForTimeout(90);
      editable = await locator.isEditable().catch(() => false);
    }
    if (!editable) {
      metaState.steps.push(`matricula-editable -> timeout (${selector})`);
      continue;
    }

    for (const variant of variants) {
      try {
        if (skipInitialFocus) {
          try {
            await locator.click({ timeout: 800, force: true });
          } catch {
            await locator.click({ timeout: 1200, force: true }).catch(() => null);
          }
        } else {
          for (let focusAttempt = 1; focusAttempt <= matriculaFieldFocusClicks; focusAttempt++) {
            try {
              await locator.click({ timeout: 15000, force: focusAttempt > 1 });
            } catch {
              await locator.click({ force: true, timeout: 15000 }).catch(() => null);
            }
            if (focusAttempt < matriculaFieldFocusClicks) {
              await page.waitForTimeout(matriculaFieldFocusClickGapMs);
            }
          }
          metaState.steps.push(`matricula-focus -> ${selector} (${matriculaFieldFocusClicks} clicks)`);
        }

        await page.keyboard.down('Control');
        await locator.press('KeyA').catch(() => null);
        await page.keyboard.up('Control');
        await locator.press('Backspace').catch(() => null);
        await locator.fill('');
        await page.waitForTimeout(90);

        for (const char of variant) {
          await locator.type(char, { delay: matriculaCharTypeDelayMs });
          await page.waitForTimeout(matriculaInterCharPauseMs);
        }

        await page.waitForTimeout(matriculaPostTypePauseMs);
        await locator.press('Tab').catch(() => null);
        await page.waitForTimeout(matriculaTabPauseMs);
        await page.keyboard.press('Shift+Tab').catch(() => null);
        await page.waitForTimeout(matriculaShiftTabPauseMs);
        await locator.press('Enter').catch(() => null);
        await page.waitForTimeout(matriculaEnterPauseMs);

        const typed = await locator.inputValue().catch(() => '');
        const typedNormalized = String(typed || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (typedNormalized.length < 5) {
          metaState.steps.push(`prefill matricula-progressive -> short-value (${selector}: ${typed || variant})`);
          continue;
        }
        metaState.steps.push(`prefill matricula-progressive -> ${selector} (${typed || variant})`);
        return true;
      } catch {
        continue;
      }
    }
  }
  return false;
}

async function clickOutsideField(page, selectors, metaState) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;
    const box = await locator.boundingBox().catch(() => null);
    if (!box) continue;

    const x = Math.max(20, Math.round(box.x - 80));
    const y = Math.max(20, Math.round(box.y + box.height + 30));
    try {
      await page.mouse.click(x, y);
      metaState.steps.push(`matricula-blur-click -> outside @${x},${y}`);
      return true;
    } catch {
      continue;
    }
  }

  const clickedBody = await page.evaluate(() => {
    try {
      document.body.click();
      return true;
    } catch {
      return false;
    }
  }).catch(() => false);
  if (clickedBody) {
    metaState.steps.push('matricula-blur-click -> body');
    return true;
  }
  metaState.steps.push('matricula-blur-click -> not-possible');
  return false;
}

async function clickLookupNearField(page, fieldSelectors, fieldLabel, metaState) {
  const result = await page.evaluate(({ selectors }) => {
    function isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    function clickTarget(target) {
      if (!target) return false;
      try {
        target.click();
        return true;
      } catch {
        return false;
      }
    }

    function textFrom(el) {
      return `${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('alt') || ''} ${el.getAttribute('class') || ''} ${(el.textContent || '')}`.toLowerCase();
    }

    const keyword = /(lupa|pesquis|search|procur|consulta|find|look)/i;
    const directCandidates = 'button,a,input[type="button"],input[type="submit"],img,[role="button"],span,div';

    for (const selector of selectors) {
      const field = document.querySelector(selector);
      if (!field || !isVisible(field)) continue;

      const scopes = [
        field.closest('td'),
        field.closest('tr'),
        field.closest('div'),
        field.parentElement,
      ].filter(Boolean);

      for (const scope of scopes) {
        const candidates = Array.from(scope.querySelectorAll(directCandidates));
        for (const candidate of candidates) {
          if (candidate === field) continue;
          if (!isVisible(candidate)) continue;
          const text = textFrom(candidate);
          const imgSrc = candidate.getAttribute('src') || '';
          const classText = (candidate.getAttribute('class') || '').toLowerCase();
          const withinWSearch = Boolean(candidate.closest('.WSearch, .wsearch, [class*="WSearch" i], [class*="wsearch" i]'));
          const iconLike = /fa\b|fa-|icon|glyph/.test(classText);
          if (!keyword.test(text) && !/lupa|search|find/i.test(imgSrc) && !(withinWSearch && iconLike)) continue;
          if (candidate.tagName.toLowerCase() === 'img' && candidate.parentElement) {
            if (clickTarget(candidate.parentElement)) {
              return { ok: true, mode: 'img-parent', selector, matched: text || imgSrc };
            }
          }
          if (clickTarget(candidate)) {
            return { ok: true, mode: 'nearby', selector, matched: text || imgSrc };
          }
        }
      }
    }

    const globalSelectors = [
      'button[title*="pesquis" i]',
      'button[aria-label*="pesquis" i]',
      'button[title*="search" i]',
      'a[title*="pesquis" i]',
      'a[title*="search" i]',
      'img[alt*="lupa" i]',
      'img[src*="lupa" i]',
      'img[src*="search" i]'
    ];

    for (const globalSelector of globalSelectors) {
      const candidate = document.querySelector(globalSelector);
      if (!candidate || !isVisible(candidate)) continue;
      if (candidate.tagName.toLowerCase() === 'img' && candidate.parentElement) {
        if (clickTarget(candidate.parentElement)) {
          return { ok: true, mode: 'global-img-parent', selector: globalSelector, matched: textFrom(candidate) };
        }
      }
      if (clickTarget(candidate)) {
        return { ok: true, mode: 'global', selector: globalSelector, matched: textFrom(candidate) };
      }
    }

    return { ok: false };
  }, { selectors: fieldSelectors });

  if (result?.ok) {
    metaState.steps.push(`lookup ${fieldLabel} -> ${result.mode} (${result.selector})`);
    return true;
  }
  for (const selector of fieldSelectors) {
    const field = page.locator(selector).first();
    const count = await field.count().catch(() => 0);
    if (!count) continue;
    const visible = await field.isVisible().catch(() => false);
    if (!visible) continue;
    const box = await field.boundingBox().catch(() => null);
    if (!box) continue;
    const x = Math.round(box.x + box.width + 24);
    const y = Math.round(box.y + box.height / 2);
    try {
      await page.mouse.click(x, y);
      metaState.steps.push(`lookup ${fieldLabel} -> offset-click (${selector}) @${x},${y}`);
      return true;
    } catch {
      continue;
    }
  }
  metaState.steps.push(`lookup ${fieldLabel} -> not-found`);
  return false;
}

async function readFieldValue(page, selector) {
  const locator = page.locator(selector).first();
  const count = await locator.count().catch(() => 0);
  if (!count) return '';
  const visible = await locator.isVisible().catch(() => false);
  if (!visible) return '';
  const tagName = await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return (await locator.inputValue().catch(() => '')).trim();
  }
  return (await locator.innerText().catch(() => '')).trim();
}

async function snapshotValues(page, selectors) {
  const result = {};
  for (const selector of selectors) {
    result[selector] = await readFieldValue(page, selector);
  }
  return result;
}

async function waitForValueAppearance(page, selectors, baseline, timeoutMs, stepLabel, metaState, options = {}) {
  const allowExistingNonEmpty = Boolean(options.allowExistingNonEmpty);
  const pollIntervalMs = Math.max(60, Number(options.pollIntervalMs) || 450);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const selector of selectors) {
      const current = await readFieldValue(page, selector);
      const before = baseline?.[selector] || '';
      if (allowExistingNonEmpty && current) {
        metaState.steps.push(`${stepLabel} -> ${selector} (${current.slice(0, 60)})`);
        return true;
      }
      if (current && current !== before) {
        metaState.steps.push(`${stepLabel} -> ${selector} (${current.slice(0, 60)})`);
        return true;
      }
    }
    await page.waitForTimeout(pollIntervalMs);
  }
  metaState.steps.push(`${stepLabel} -> timeout`);
  return false;
}

async function waitForAnyFieldNonEmpty(page, selectors, timeoutMs, stepLabel, metaState) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const selector of selectors) {
      const value = await readFieldValue(page, selector);
      if (value) {
        metaState.steps.push(`${stepLabel} -> ${selector} (${value.slice(0, 40)})`);
        return { ok: true, selector, value };
      }
    }
    await page.waitForTimeout(350);
  }
  metaState.steps.push(`${stepLabel} -> timeout`);
  return { ok: false };
}

async function waitForVehicleChooser(page, knownPages, timeoutMs, metaState) {
  const context = page.context();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const freshPopup = context.pages().find((candidate) => !knownPages.has(candidate));
    if (freshPopup && freshPopup !== page) {
      metaState.steps.push(`vehicle-dialog-detected -> popup (${freshPopup.url() || 'about:blank'})`);
      return { ok: true, kind: 'popup' };
    }

    const dialogVisible = await page
      .locator('[role="dialog"], .modal, .ui-dialog, .popup, .modal-dialog, [id*="dialog" i], [class*="dialog" i], table tbody tr')
      .first()
      .isVisible()
      .catch(() => false);
    if (dialogVisible) {
      metaState.steps.push('vehicle-dialog-detected -> in-page-dialog');
      return { ok: true, kind: 'dialog' };
    }

    await page.waitForTimeout(160);
  }
  metaState.steps.push('vehicle-dialog-detected -> timeout');
  return { ok: false };
}

async function waitForVehicleDialogOrLoaded(page, knownPages, watchSelectors, baseline, timeoutMs, metaState) {
  const context = page.context();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const freshPopup = context.pages().find((candidate) => !knownPages.has(candidate));
    if (freshPopup && freshPopup !== page) {
      metaState.steps.push(`vehicle-dialog-or-loaded -> popup (${freshPopup.url() || 'about:blank'})`);
      return { ok: true, mode: 'popup' };
    }

    const dialogVisible = await page
      .locator('[role="dialog"], .modal, .ui-dialog, .popup, .modal-dialog, [id*="dialog" i], [class*="dialog" i], table tbody tr')
      .first()
      .isVisible()
      .catch(() => false);
    if (dialogVisible) {
      metaState.steps.push('vehicle-dialog-or-loaded -> in-page-dialog');
      return { ok: true, mode: 'dialog' };
    }

    for (const selector of watchSelectors) {
      const current = await readFieldValue(page, selector);
      const before = baseline?.[selector] || '';
      if (current && current !== before) {
        metaState.steps.push(`vehicle-dialog-or-loaded -> field-updated (${selector})`);
        return { ok: true, mode: 'loaded' };
      }
    }

    await page.waitForTimeout(180);
  }

  metaState.steps.push('vehicle-dialog-or-loaded -> timeout');
  return { ok: false, mode: 'timeout' };
}

async function reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, attempt) {
  metaState.steps.push(`manual-select-vehicle -> reopen-attempt ${attempt}`);
  const stepLabel = attempt === 1 ? 'lookup matricula manual-reopen' : `lookup matricula manual-reopen-${attempt}`;

  let clicked = false;
  if (effectiveMatriculaLupaSelector) {
    clicked = await clickForcedSelector(page, effectiveMatriculaLupaSelector, stepLabel, metaState);
    if (!clicked) {
      metaState.steps.push(`manual-select-vehicle -> forced-selector-not-available (${effectiveMatriculaLupaSelector})`);
    }
  }

  if (!clicked) {
    clicked = await clickLookupNearField(page, matriculaSelectors, `matricula-manual-reopen-${attempt}`, metaState);
  }

  if (clicked) {
    metaState.steps.push(`manual-select-vehicle -> chooser-reopened-attempt ${attempt}`);
  } else {
    metaState.steps.push(`manual-select-vehicle -> chooser-reopen-failed ${attempt}`);
  }
  return clicked;
}

async function recoverVehicleChooserByReclickAndSelectFirst(page, knownPages, matriculaSelectors, metaState, reasonLabel = 'vehicle-recovery') {
  metaState.steps.push(`${reasonLabel} -> reclick-matricula-lupa-and-select-first:start`);

  const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, 'recovery');
  if (!reopened) {
    metaState.steps.push(`${reasonLabel} -> reopen-failed`);
    return false;
  }

  await page.waitForTimeout(Math.min(700, Math.max(200, manualSelectVehicleReopenWaitMs)));
  const chooser = await waitForVehicleChooser(page, knownPages, Math.max(1200, Math.min(3800, vehicleChooserPostLookupWaitMs)), metaState);
  if (!chooser.ok) {
    metaState.steps.push(`${reasonLabel} -> chooser-not-detected-after-reclick`);
  }

  const selected = await selectFirstVehicleResult(page, metaState, knownPages);
  if (!selected) {
    metaState.steps.push(`${reasonLabel} -> select-first-failed`);
    return false;
  }

  metaState.steps.push(`${reasonLabel} -> select-first-success`);
  return true;
}

async function waitForManualVehicleSelection(page, knownPages, watchSelectors, baseline, timeoutMs, metaState, options = {}) {
  const context = page.context();
  const started = Date.now();
  let popupSeen = false;
  let dialogSeen = false;
  const matriculaSelectors = Array.isArray(options.matriculaSelectors) ? options.matriculaSelectors : [];
  const reopenAttempts = Math.max(0, Number(options.reopenAttempts) || 0);
  const reopenWaitMs = Math.max(100, Number(options.reopenWaitMs) || 200);
  const reopenInvisibleIdleMs = Math.max(350, Number(options.reopenInvisibleIdleMs) || manualSelectVehicleInvisibleIdleMs);
  const lateFieldWaitMs = Math.max(300, Number(options.lateFieldWaitMs) || manualSelectVehicleLateFieldWaitMs);
  const autoPickAfterMs = Math.max(1200, Number(options.autoPickAfterMs) || manualSelectVehicleAutoPickAfterMs);
  const learnVehicleClick = Boolean(options.learnVehicleClick);
  const maxReopenAttempts = learnVehicleClick ? manualLearnSecondLupaRetryAttempts : reopenAttempts;
  let usedReopenAttempts = 0;
  let lastChooserVisibleAt = Date.now();
  let dialogVisibleSince = 0;
  let autoPickTried = false;
  let learnClickCaptured = false;
  let userInteractionPhaseStarted = false;

  metaState.steps.push('manual-select-vehicle -> aguardando seleção manual do utilizador');
  if (learnVehicleClick) {
    metaState.steps.push('manual-select-vehicle -> learn-mode ativo (não terminar sem clique aprendido)');
  }

  while (Date.now() - started < timeoutMs) {
    const allPages = context.pages();
    const extraPages = allPages.filter((candidate) => !knownPages.has(candidate) && candidate !== page);
    if (extraPages.length > 0) {
      popupSeen = true;
      lastChooserVisibleAt = Date.now();
    }

    const dialogVisible = await page
      .locator('[role="dialog"], .modal, .ui-dialog, .popup, .modal-dialog, [id*="dialog" i], [class*="dialog" i], table tbody tr')
      .first()
      .isVisible()
      .catch(() => false);

    if (dialogVisible) {
      dialogSeen = true;
      lastChooserVisibleAt = Date.now();
      if (!dialogVisibleSince) {
        dialogVisibleSince = Date.now();
      }
    } else {
      dialogVisibleSince = 0;
    }

    for (const selector of watchSelectors) {
      const current = await readFieldValue(page, selector);
      const before = baseline?.[selector] || '';
      if (current && current !== before) {
        metaState.steps.push(`manual-select-vehicle -> field-updated (${selector})`);
        if (learnVehicleClick && !learnClickCaptured) {
          metaState.steps.push('manual-select-vehicle -> field-update detetado sem learned-click (assumir seleção manual)');
        }
        return { ok: true, mode: 'loaded' };
      }
    }

    if (dialogSeen && !dialogVisible) {
      metaState.steps.push('manual-select-vehicle -> dialog-closed-without-selection');

      if (learnVehicleClick && userInteractionPhaseStarted) {
        const lateLoadedAfterClose = await waitForValueAppearance(
          page,
          watchSelectors,
          baseline,
          Math.max(450, Math.min(1400, lateFieldWaitMs)),
          'manual-select-vehicle-close-after-interaction-field-update',
          metaState,
          { allowExistingNonEmpty: true, pollIntervalMs: 120 }
        );
        if (!lateLoadedAfterClose) {
          metaState.steps.push('manual-select-vehicle -> assume-selection-after-close (sem novas tentativas)');
        }
        return { ok: true, mode: lateLoadedAfterClose ? 'loaded-after-close' : 'assume-selected-after-close' };
      }

      if (learnVehicleClick && usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
        usedReopenAttempts += 1;
        metaState.steps.push('manual-select-vehicle -> segunda-tentativa-lupa (após fechar diálogo)');
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          lastChooserVisibleAt = Date.now();
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }

      const lateLoaded = await waitForValueAppearance(
        page,
        watchSelectors,
        baseline,
        Math.min(lateFieldWaitMs, Math.max(300, timeoutMs)),
        'manual-select-vehicle-late-field-update',
        metaState,
        { allowExistingNonEmpty: true, pollIntervalMs: 140 }
      );
      if (lateLoaded) {
        return { ok: true, mode: 'loaded-after-close' };
      }

      if (usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
        usedReopenAttempts += 1;
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }
    }

    if (popupSeen && extraPages.length === 0) {
      metaState.steps.push('manual-select-vehicle -> popup-closed-without-selection');

      if (learnVehicleClick && userInteractionPhaseStarted) {
        const lateLoadedAfterPopupClose = await waitForValueAppearance(
          page,
          watchSelectors,
          baseline,
          Math.max(450, Math.min(1400, lateFieldWaitMs)),
          'manual-select-vehicle-popup-close-after-interaction-field-update',
          metaState,
          { allowExistingNonEmpty: true, pollIntervalMs: 120 }
        );
        if (!lateLoadedAfterPopupClose) {
          metaState.steps.push('manual-select-vehicle -> assume-selection-after-popup-close (sem novas tentativas)');
        }
        return { ok: true, mode: lateLoadedAfterPopupClose ? 'loaded-after-popup-close' : 'assume-selected-after-popup-close' };
      }

      if (learnVehicleClick && usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
        usedReopenAttempts += 1;
        metaState.steps.push('manual-select-vehicle -> segunda-tentativa-lupa (após fechar popup)');
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          lastChooserVisibleAt = Date.now();
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }

      const lateLoaded = await waitForValueAppearance(
        page,
        watchSelectors,
        baseline,
        Math.min(lateFieldWaitMs, Math.max(300, timeoutMs)),
        'manual-select-vehicle-late-field-update',
        metaState,
        { allowExistingNonEmpty: true, pollIntervalMs: 140 }
      );
      if (lateLoaded) {
        return { ok: true, mode: 'loaded-after-popup-close' };
      }

      if (usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
        usedReopenAttempts += 1;
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }
    }

    if (!learnVehicleClick && dialogVisible && !autoPickTried && Date.now() - dialogVisibleSince >= autoPickAfterMs) {
      autoPickTried = true;
      metaState.steps.push(`manual-select-vehicle -> auto-pick-first after ${Date.now() - dialogVisibleSince}ms`);
      const autoPicked = await selectFirstVehicleResult(page, metaState, knownPages);
      if (autoPicked) {
        const loadedAfterAutoPick = await waitForValueAppearance(
          page,
          watchSelectors,
          baseline,
          Math.max(700, Math.min(2200, lateFieldWaitMs + 600)),
          'manual-select-vehicle-auto-pick-field-update',
          metaState,
          { allowExistingNonEmpty: true, pollIntervalMs: 120 }
        );
        if (loadedAfterAutoPick) {
          return { ok: true, mode: 'auto-picked' };
        }
        metaState.steps.push('manual-select-vehicle -> auto-pick-clicked-without-immediate-field-update');
        return { ok: true, mode: 'auto-picked-clicked' };
      }
    }

    if (dialogVisible && learnVehicleClick && !learnClickCaptured) {
      userInteractionPhaseStarted = true;
      metaState.steps.push('manual-select-vehicle -> learning-click: aguardando clique do utilizador');
      const learned = await captureSingleUserClickPassive(
        page,
        'manual-select-vehicle-learning-click',
        metaState,
        manualLearnCaptureWindowMs
      );
      if (learned) {
        learnClickCaptured = true;
        return { ok: true, mode: 'learned-click' };
      }
      metaState.steps.push('manual-select-vehicle -> learning-click sem evento, continuar');

      if (usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
        usedReopenAttempts += 1;
        metaState.steps.push('manual-select-vehicle -> nova tentativa de lupa após janela sem clique');
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          lastChooserVisibleAt = Date.now();
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }
    }

    if (!dialogVisible && extraPages.length === 0 && usedReopenAttempts < maxReopenAttempts && matriculaSelectors.length > 0) {
      const chooserInvisibleForMs = Date.now() - lastChooserVisibleAt;
      if (chooserInvisibleForMs >= reopenInvisibleIdleMs) {
        usedReopenAttempts += 1;
        metaState.steps.push(`manual-select-vehicle -> chooser-invisible ${chooserInvisibleForMs}ms`);
        const reopened = await reopenVehicleChooserFromMatricula(page, matriculaSelectors, metaState, usedReopenAttempts);
        if (reopened) {
          popupSeen = false;
          dialogSeen = false;
          lastChooserVisibleAt = Date.now();
          await page.waitForTimeout(reopenWaitMs);
          continue;
        }
      }
    }

    await page.waitForTimeout(180);
  }

  metaState.steps.push('manual-select-vehicle -> timeout');
  return { ok: false, mode: 'timeout' };
}

async function clickForcedSelector(page, selector, stepLabel, metaState) {
  if (!selector) return false;
  const locator = page.locator(selector).first();
  const count = await locator.count().catch(() => 0);
  if (!count) return false;
  const visible = await locator.isVisible().catch(() => false);
  if (!visible) return false;
  try {
    await locator.click({ timeout: 15000 });
    metaState.steps.push(`${stepLabel} -> forced-selector (${selector})`);
    return true;
  } catch {
    try {
      await locator.click({ force: true, timeout: 15000 });
      metaState.steps.push(`${stepLabel} -> forced-selector-force (${selector})`);
      return true;
    } catch {
    }
  }

  const clickedAncestor = await locator.evaluate((element) => {
    const candidates = [
      element.parentElement,
      element.closest('a'),
      element.closest('button'),
      element.closest('[role="button"]'),
      element.closest('span'),
      element.closest('div'),
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        candidate.click();
        return true;
      } catch {
      }
    }
    return false;
  }).catch(() => false);

  if (clickedAncestor) {
    metaState.steps.push(`${stepLabel} -> forced-selector-ancestor (${selector})`);
    return true;
  }

  return false;
}

async function captureSingleUserClick(page, stepLabel, metaState) {
  const payload = await page.evaluate(() => {
    return new Promise((resolve) => {
      function cssPath(element) {
        if (!element || !(element instanceof Element)) return '';
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
          let part = current.nodeName.toLowerCase();
          if (current.id) {
            part += `#${current.id}`;
            parts.unshift(part);
            break;
          }
          if (current.classList && current.classList.length > 0) {
            part += '.' + Array.from(current.classList).slice(0, 2).join('.');
          }
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((node) => node.nodeName === current.nodeName);
            if (siblings.length > 1) {
              part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            }
          }
          parts.unshift(part);
          current = current.parentElement;
        }
        return parts.join(' > ');
      }

      function onClick(event) {
        if (!event.isTrusted || event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const target = event.target;
        const payload = {
          x: event.clientX,
          y: event.clientY,
          tag: target?.tagName?.toLowerCase?.() || null,
          id: target?.id || null,
          className: target?.className || null,
          title: target?.getAttribute?.('title') || null,
          ariaLabel: target?.getAttribute?.('aria-label') || null,
          text: (target?.textContent || '').trim().slice(0, 120),
          selector: cssPath(target),
          parentSelector: cssPath(target?.parentElement || null),
        };
        document.removeEventListener('click', onClick, true);
        resolve(payload);
      }

      document.addEventListener('click', onClick, true);
    });
  });

  metaState.steps.push(`${stepLabel} -> manual-click (${payload.selector || payload.tag || 'unknown'}) @${payload.x},${payload.y}`);
  return payload;
}

async function captureSingleUserDrag(page, stepLabel, metaState, timeoutMs = 120000) {
  const payload = await page.evaluate((timeout) => {
    return new Promise((resolve) => {
      function cssPath(element) {
        if (!element || !(element instanceof Element)) return '';
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 10) {
          let part = current.nodeName.toLowerCase();
          if (current.id) {
            part += `#${current.id}`;
            parts.unshift(part);
            break;
          }
          if (current.classList && current.classList.length > 0) {
            part += '.' + Array.from(current.classList).slice(0, 3).join('.');
          }
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((node) => node.nodeName === current.nodeName);
            if (siblings.length > 1) {
              part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            }
          }
          parts.unshift(part);
          current = current.parentElement;
        }
        return parts.join(' > ');
      }

      let startEvent = null;
      let timer = null;

      function cleanup() {
        if (timer) clearTimeout(timer);
        document.removeEventListener('mousedown', onMouseDown, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      }

      function eventPayload(event) {
        const target = event.target;
        return {
          x: event.clientX,
          y: event.clientY,
          tag: target?.tagName?.toLowerCase?.() || null,
          id: target?.id || null,
          className: target?.className || null,
          title: target?.getAttribute?.('title') || null,
          ariaLabel: target?.getAttribute?.('aria-label') || null,
          text: (target?.textContent || '').trim().slice(0, 160),
          selector: cssPath(target),
          parentSelector: cssPath(target?.parentElement || null),
          timestamp: Date.now(),
        };
      }

      function onMouseDown(event) {
        startEvent = eventPayload(event);
      }

      function onMouseUp(event) {
        if (!startEvent) return;
        const endEvent = eventPayload(event);
        const deltaX = endEvent.x - startEvent.x;
        const deltaY = endEvent.y - startEvent.y;
        cleanup();
        resolve({
          start: startEvent,
          end: endEvent,
          deltaX,
          deltaY,
          distance: Math.round(Math.sqrt((deltaX ** 2) + (deltaY ** 2))),
          horizontalDirection: deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : 'none',
          verticalDirection: deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none',
        });
      }

      timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);

      document.addEventListener('mousedown', onMouseDown, true);
      document.addEventListener('mouseup', onMouseUp, true);
    });
  }, timeoutMs).catch(() => null);

  if (!payload) {
    metaState.steps.push(`${stepLabel} -> timeout-no-drag`);
    return null;
  }

  metaState.steps.push(
    `${stepLabel} -> manual-drag (${payload.start?.selector || payload.start?.tag || 'unknown'} -> ${payload.end?.selector || payload.end?.tag || 'unknown'}) ${payload.deltaX},${payload.deltaY}`
  );
  return payload;
}

async function pauseOnDadosAutoForManualInstruction(page, metaState) {
  const pauseShot = path.join(dir, '98-resumo-dados-pause.png');
  metaState.steps.push('pause-resumo-dados -> aguardando indicação manual do utilizador');
  await updateDebugOverlay(page, 'resumo-dados-pause');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  console.log('[transfer] Pausado no resumo dos dados após clicar em Seguinte. Clique no elemento desejado no browser para registar o alvo.');

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const payload = await captureSingleUserClick(page, 'dados-auto-manual-click', metaState);
  metaState.manualDadosAutoClick = payload;
  metaState.finalScreenshot = pauseShot;
  metaState.steps.push('pause-resumo-dados -> click capturado');
  await updateDebugOverlay(page, 'resumo-dados-click-captured');
  console.log(`[transfer] Clique registado: ${payload.selector || payload.tag || 'unknown'} @${payload.x},${payload.y}`);
  return payload;
}

async function pauseOnCoberturasForManualInstruction(page, metaState) {
  const pauseShot = path.join(dir, '98-coberturas-pause.png');
  metaState.steps.push('pause-coberturas -> aguardando indicação manual do utilizador');
  await updateDebugOverlay(page, 'coberturas-pause');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  console.log(`[transfer] Pausado em Coberturas. Arraste ${manualCoberturasDragCount} vez(es) os controlos desejados no browser para registar os alvos.`);

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const dragInteractions = [];
  for (let index = 0; index < manualCoberturasDragCount; index += 1) {
    await updateDebugOverlay(page, `coberturas-drag-${index + 1}/${manualCoberturasDragCount}`);
    console.log(`[transfer] À espera do drag ${index + 1}/${manualCoberturasDragCount} em Coberturas...`);
    const payload = await captureSingleUserDrag(page, `coberturas-manual-drag-${index + 1}`, metaState, manualCoberturasDragTimeoutMs);
    if (!payload) {
      throw new Error(`Timeout: não houve drag ${index + 1}/${manualCoberturasDragCount} em Coberturas`);
    }
    dragInteractions.push(payload);
    console.log(`[transfer] Drag ${index + 1}/${manualCoberturasDragCount} registado: ${payload.start?.selector || payload.start?.tag || 'unknown'} -> ${payload.end?.selector || payload.end?.tag || 'unknown'} (${payload.deltaX},${payload.deltaY})`);
  }

  metaState.manualCoberturasDrags = dragInteractions;
  metaState.finalScreenshot = pauseShot;
  metaState.steps.push(`pause-coberturas -> drags capturados ${dragInteractions.length}`);
  await updateDebugOverlay(page, 'coberturas-drags-captured');
  return dragInteractions;
}

async function pauseBeforeCoberturasCalculator(page, metaState) {
  const pauseShot = path.join(dir, '98-coberturas-calculadora-pause.png');
  metaState.steps.push('pause-coberturas-calculadora -> aguardando clique manual do utilizador');
  await updateDebugOverlay(page, 'coberturas-calculadora-pause');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  console.log('[transfer] Pausado antes da calculadora. Clica no link/ícone da calculadora para eu registar o locator.');

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const payload = await captureSingleUserClick(page, 'coberturas-calculadora-manual-click', metaState);
  metaState.manualCoberturasCalculatorClick = payload;
  metaState.finalScreenshot = pauseShot;
  metaState.steps.push('pause-coberturas-calculadora -> click capturado');
  await updateDebugOverlay(page, 'coberturas-calculadora-click-captured');
  console.log(`[transfer] Clique da calculadora registado: ${payload.selector || payload.tag || 'unknown'} @${payload.x},${payload.y}`);
  return payload;
}

async function pauseBeforeCoberturasReceiptDetails(page, metaState) {
  const pauseShot = path.join(dir, '99-coberturas-recibos-pause.png');
  metaState.steps.push('pause-coberturas-recibos -> aguardando clique manual do utilizador');
  await updateDebugOverlay(page, 'coberturas-recibos-pause');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  metaState.finalScreenshot = pauseShot;
  console.log(`[transfer] Prémio total detetado. Faz agora ${manualCoberturasReceiptClickCount} clique(s) seguidos para eu registar a sequência correta dos recibos.`);

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const capturedClicks = [];
  for (let index = 0; index < manualCoberturasReceiptClickCount; index += 1) {
    await updateDebugOverlay(page, `coberturas-recibos-click-${index + 1}/${manualCoberturasReceiptClickCount}`);
    console.log(`[transfer] À espera do clique ${index + 1}/${manualCoberturasReceiptClickCount} nos recibos...`);
    const payload = await captureSingleUserClickPassive(page, `coberturas-recibos-manual-click-${index + 1}`, metaState, manualCoberturasReceiptClickTimeoutMs);
    if (!payload) {
      throw new Error(`Timeout: não houve clique ${index + 1}/${manualCoberturasReceiptClickCount} nos recibos`);
    }
    capturedClicks.push(payload);
    console.log(`[transfer] Clique ${index + 1}/${manualCoberturasReceiptClickCount} registado: ${payload.selector || payload.tag || 'unknown'} @${payload.x},${payload.y}`);
    await page.waitForTimeout(250);
  }

  metaState.manualCoberturasReceiptDetailsClick = capturedClicks[0] || null;
  metaState.manualCoberturasReceiptDetailsClicks = capturedClicks;
  metaState.steps.push(`pause-coberturas-recibos -> ${capturedClicks.length} clique(s) capturados`);
  await updateDebugOverlay(page, 'coberturas-recibos-clicks-captured');
  return capturedClicks;
}

async function pauseAfterCoberturasSlider(page, metaState) {
  const pauseShot = path.join(dir, '98-coberturas-apos-slider-pause.png');
  metaState.steps.push('pause-coberturas-apos-slider -> aguardando cliques manuais do utilizador');
  await updateDebugOverlay(page, 'coberturas-apos-slider-pause');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  metaState.finalScreenshot = pauseShot;
  console.log(`[transfer] Slider aplicado. Faz agora ${manualCoberturasReceiptClickCount} clique(s) seguidos para eu gravar a sequência manual.`);

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const capturedClicks = [];
  for (let index = 0; index < manualCoberturasReceiptClickCount; index += 1) {
    await updateDebugOverlay(page, `coberturas-apos-slider-click-${index + 1}/${manualCoberturasReceiptClickCount}`);
    console.log(`[transfer] À espera do clique ${index + 1}/${manualCoberturasReceiptClickCount} após o slider...`);
    const payload = await captureSingleUserClickPassive(page, `coberturas-apos-slider-manual-click-${index + 1}`, metaState, manualCoberturasReceiptClickTimeoutMs);
    if (!payload) {
      throw new Error(`Timeout: não houve clique ${index + 1}/${manualCoberturasReceiptClickCount} após o slider`);
    }
    capturedClicks.push(payload);
    console.log(`[transfer] Clique ${index + 1}/${manualCoberturasReceiptClickCount} registado: ${payload.selector || payload.tag || 'unknown'} @${payload.x},${payload.y}`);
    await page.waitForTimeout(250);
  }

  metaState.manualCoberturasPostSliderClick = capturedClicks[0] || null;
  metaState.manualCoberturasPostSliderClicks = capturedClicks;
  metaState.steps.push(`pause-coberturas-apos-slider -> ${capturedClicks.length} clique(s) capturados`);
  await updateDebugOverlay(page, 'coberturas-apos-slider-clicks-captured');
  return capturedClicks;
}

/**
 * Arrasta um único handle de slider para o extremo direito do seu track.
 * Retorna informação sobre o drag para logging.
 */
async function dragSingleSliderHandle(page, handleLocator, deltaY, dragSteps, metaState, label) {
  await handleLocator.scrollIntoViewIfNeeded().catch(() => null);
  const box = await handleLocator.boundingBox().catch(() => null);
  if (!box) {
    metaState.steps.push(`${label} -> missing-bounding-box`);
    return null;
  }

  const startX = Math.round(box.x + (box.width / 2));
  const startY = Math.round(box.y + (box.height / 2));

  // Medir o track pai para calcular o limite direito real
  // Estratégia 1: subir pelo parentElement do handle diretamente (mais fiável)
  // Estratégia 2: elementFromPoint → subir pelo DOM à procura de ui-slider
  const trackBox = await handleLocator.evaluate((handleEl) => {
    // Subir até encontrar um elemento com ui-slider ou ui-slider-horizontal,
    // ou até ao pai imediato (que é sempre o contentor do slider)
    let el = handleEl.parentElement;
    while (el && el !== document.body) {
      if (
        el.classList.contains('ui-slider') ||
        el.classList.contains('ui-slider-horizontal') ||
        el.classList.contains('SliderRange') ||
        (el.id && el.id.toLowerCase().includes('slider'))
      ) {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      // Se o pai imediato tem handles dentro, usa-o diretamente
      if (el === handleEl.parentElement && el.querySelectorAll('span.ui-slider-handle').length >= 1) {
        const r = el.getBoundingClientRect();
        if (r.width > 20) return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      el = el.parentElement;
    }
    // Fallback: usar o pai direto do handle
    const parent = handleEl.parentElement;
    if (parent) {
      const r = parent.getBoundingClientRect();
      if (r.width > 20) return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
    return null;
  }).catch(() => null);

  let endX;
  const endY = startY + deltaY;

  if (trackBox && trackBox.width > 0) {
    // -2 px de margem (em vez de -4) para garantir que chega mesmo ao extremo
    endX = Math.round(trackBox.x + trackBox.width - 2);
    metaState.steps.push(`${label} -> track-measured width=${trackBox.width} trackRight=${Math.round(trackBox.x + trackBox.width)}`);
  } else {
    endX = startX + learnedCoberturasDragDeltaX;
    metaState.steps.push(`${label} -> track-not-measured, using deltaX=${learnedCoberturasDragDeltaX}`);
  }

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: dragSteps });
  await page.mouse.up();

  const actualDeltaX = endX - startX;
  metaState.steps.push(`${label} -> success (${startX},${startY} -> ${endX},${endY} deltaX=${actualDeltaX})`);
  return { startX, startY, endX, endY, deltaX: actualDeltaX, deltaY: deltaY, trackBox: trackBox || null };
}

/**
 * Arrasta TODOS os sliders de desconto na página Coberturas para o extremo direito.
 * A Zurich tem tipicamente 3 sliders: Débito Direto, Desconto Comercial, Cliente Digital.
 * Usa o seletor aprendido (learnedCoberturasHandleSelector) para encontrar o primeiro,
 * depois descobre todos os handles dentro da mesma secção de Descontos.
 */
async function dragCoberturasSliderStep(page, metaState) {
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(450);

  // Encontrar todos os handles de slider dentro da secção de Descontos
  // Estratégia: procurar todos os ui-slider-handle dentro do container que contém "Descontos"
  const allHandleSelectors = await page.evaluate((primarySelector) => {
    // Tentar encontrar a secção de Descontos pelo texto
    const allEls = Array.from(document.querySelectorAll('*'));
    let descontosContainer = null;
    for (const el of allEls) {
      if (el.children.length === 0 && (el.textContent || '').trim() === 'Descontos') {
        // Subir até encontrar um container com vários sliders
        let parent = el.parentElement;
        for (let i = 0; i < 10; i++) {
          if (!parent) break;
          const handles = parent.querySelectorAll('span.ui-slider-handle');
          if (handles.length >= 2) { descontosContainer = parent; break; }
          parent = parent.parentElement;
        }
        if (descontosContainer) break;
      }
    }

    if (descontosContainer) {
      const handles = Array.from(descontosContainer.querySelectorAll('span.ui-slider-handle'));
      return handles.map((h) => {
        // Construir seletor único via ID do pai ou índice
        const slider = h.closest('[id]');
        if (slider && slider.id) {
          const idx = Array.from(slider.querySelectorAll('span.ui-slider-handle')).indexOf(h);
          return `#${CSS.escape(slider.id)} > span.ui-slider-handle${idx > 0 ? `:nth-of-type(${idx + 1})` : ''}`;
        }
        return null;
      }).filter(Boolean);
    }

    // Fallback: usar o seletor aprendido — encontrar todos os handles com o mesmo padrão de classe
    const primary = document.querySelector(primarySelector);
    if (!primary) return [];
    // Subir até encontrar o contentor de descontos mais próximo com vários handles
    let container = primary.parentElement;
    for (let i = 0; i < 15; i++) {
      if (!container) break;
      const handles = container.querySelectorAll('span.ui-slider-handle.ui-state-default.ui-corner-all');
      if (handles.length >= 2) {
        return Array.from(handles).map((h) => {
          const slider = h.closest('[id]');
          if (slider && slider.id) return `#${CSS.escape(slider.id)} > span.ui-slider-handle`;
          return null;
        }).filter(Boolean);
      }
      container = container.parentElement;
    }
    return [primarySelector]; // último recurso: só o primário
  }, learnedCoberturasHandleSelector).catch(() => [learnedCoberturasHandleSelector]);

  const selectors = allHandleSelectors.length > 0 ? allHandleSelectors : [learnedCoberturasHandleSelector];
  metaState.steps.push(`final-step-coberturas-drag -> found ${selectors.length} slider handle(s)`);

  const dragResults = [];
  for (let i = 0; i < selectors.length; i++) {
    const sel = selectors[i];
    const locator = page.locator(sel).first();
    const count = await locator.count().catch(() => 0);
    if (!count) {
      metaState.steps.push(`final-step-coberturas-drag -> handle-${i + 1}-not-found (${sel})`);
      continue;
    }
    const result = await dragSingleSliderHandle(
      page, locator,
      learnedCoberturasDragDeltaY, learnedCoberturasDragSteps,
      metaState, `final-step-coberturas-drag-${i + 1}/${selectors.length}`
    );
    if (result) {
      dragResults.push({ selector: sel, ...result });
      // Pequena pausa entre drags para a página processar
      await page.waitForTimeout(350);
    }
  }

  // Se não encontrou nenhum pela descoberta automática, fallback para o seletor aprendido
  if (dragResults.length === 0) {
    metaState.steps.push(`final-step-coberturas-drag -> fallback to learned selector`);
    const locator = page.locator(learnedCoberturasHandleSelector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) {
      metaState.steps.push(`final-step-coberturas-drag -> handle-not-found (${learnedCoberturasHandleSelector})`);
      return false;
    }
    const result = await dragSingleSliderHandle(
      page, locator,
      learnedCoberturasDragDeltaY, learnedCoberturasDragSteps,
      metaState, 'final-step-coberturas-drag'
    );
    if (result) {
      dragResults.push({ selector: learnedCoberturasHandleSelector, ...result });
    }
  }

  if (dragResults.length > 0) {
    // Guardar info do primeiro drag (compatibilidade com código existente)
    metaState.learnedCoberturasDrag = { selector: dragResults[0].selector, ...dragResults[0] };
    metaState.learnedCoberturasDrags = dragResults;
  }

  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, learnedCoberturasPostDragWaitMs) }).catch(() => null);
  await page.waitForTimeout(learnedCoberturasPostDragWaitMs);
  return dragResults.length > 0;
}

async function clickCoberturasCalcularStep(page, metaState) {
  let clicked = false;

  if (learnedCoberturasCalculatorParentSelector) {
    clicked = await clickForcedSelector(page, learnedCoberturasCalculatorParentSelector, 'final-step-coberturas-calcular-learned-parent', metaState);
  }

  if (!clicked && learnedCoberturasCalculatorSelector) {
    clicked = await clickForcedSelector(page, learnedCoberturasCalculatorSelector, 'final-step-coberturas-calcular-learned-selector', metaState);
  }

  if (!clicked) {
    clicked = await clickForcedSelector(page, '.icon-Calculator_CMYK', 'final-step-coberturas-calcular-icon', metaState);
  }

  if (!clicked) {
    clicked = await clickFirstVisible([
      { name: 'coberturas calcular button exact', locator: page.getByRole('button', { name: /^\s*Calcular\s*$/i }) },
      { name: 'coberturas calcular link exact', locator: page.getByRole('link', { name: /^\s*Calcular\s*$/i }) },
      { name: 'coberturas calcular button loose', locator: page.getByRole('button', { name: /Calcular/i }) },
      { name: 'coberturas calcular link loose', locator: page.getByRole('link', { name: /Calcular/i }) },
      { name: 'coberturas calcular input', locator: page.locator('input[type="submit"][value*="Calcular" i], input[type="button"][value*="Calcular" i]') },
      { name: 'coberturas calcular text', locator: page.locator('a,button,div,span,li').filter({ hasText: /^\s*Calcular\s*$/i }) },
    ], 'final-step-coberturas-calcular');
  }

  if (!clicked) {
    const fallbackClicked = await clickByTextFallback(/Calcular/i, 'final-step-coberturas-calcular-fallback');
    if (!fallbackClicked) {
      metaState.steps.push('final-step-coberturas-calcular -> not-found');
      return false;
    }
  }

  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, coberturasCalcularWaitTimeoutMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, coberturasCalcularWaitTimeoutMs) }).catch(() => null);
  await waitForCoberturasCalculationToSettle(page, metaState);
  await page.waitForTimeout(coberturasCalcularPostClickWaitMs);
  metaState.steps.push('final-step-coberturas-calcular -> success');
  return true;
}

async function readCoberturasPremiumSummary(page) {
  return page.evaluate(() => {
    function normalizeText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function splitLines(value) {
      return String(value || '')
        .split(/\n+/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
    }

    function isVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    function cssPath(element) {
      if (!element || !(element instanceof Element)) return '';
      const parts = [];
      let current = element;
      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
        let part = current.nodeName.toLowerCase();
        if (current.id) {
          part += `#${current.id}`;
          parts.unshift(part);
          break;
        }
        if (current.classList && current.classList.length > 0) {
          part += `.` + Array.from(current.classList).slice(0, 3).join('.');
        }
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((node) => node.nodeName === current.nodeName);
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    function extractCurrencyValues(text) {
      return Array.from(String(text || '').matchAll(/\b\d{1,3}(?:[.\s]\d{3})*,\d{2}\s*€|\b\d+(?:,\d{2})\s*€/g)).map((match) => normalizeText(match[0]));
    }

    function extractAmountTokens(text) {
      return Array.from(String(text || '').matchAll(/\b\d{1,3}(?:[.\s]\d{3})*,\d{2}(?:\s*€)?/g)).map((match) => normalizeText(match[0]));
    }

    function parseAmount(value) {
      const numeric = String(value || '')
        .replace(/€/g, '')
        .replace(/\s+/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const parsed = Number.parseFloat(numeric);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const installmentRegex = /\b(mensal|mensais|mensalidade|mensalidades|trimestral|trimestrais|semestral|semestrais|prestação|prestações|prestacoes)\b/i;
    const premiumLabelRegex = /Pr[ée]mio\s+Total/i;

    const visibleElements = Array.from(document.querySelectorAll('body *')).filter((element) => isVisible(element));
    const premiumLabelElements = visibleElements.filter((element) => {
      const lines = splitLines(element.innerText || '');
      return lines.some((line) => premiumLabelRegex.test(line));
    });

    let bestContainer = null;
    for (const labelElement of premiumLabelElements) {
      let current = labelElement;
      for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
        if (!isVisible(current)) continue;
        const rawText = current.innerText || '';
        const lines = splitLines(rawText);
        const hasPremiumLabel = lines.some((line) => premiumLabelRegex.test(line));
        if (!hasPremiumLabel) continue;
        const values = extractCurrencyValues(rawText);
        if (!values.length) continue;
        const score = rawText.length + (depth * 120);
        if (!bestContainer || score < bestContainer.score) {
          bestContainer = {
            element: current,
            selector: cssPath(current),
            rawText,
            score,
          };
        }
      }
    }

    const sourceElement = bestContainer?.element || document.body;
    const sourceSelector = bestContainer?.selector || 'body';
    const sourceLines = splitLines(bestContainer?.rawText || document.body.innerText || '');
    const excludedInstallmentValues = [];
    const premiumDebugBlocks = [];
    const labelIndex = sourceLines.findIndex((line) => premiumLabelRegex.test(line));
    const premiumLabelWindow = labelIndex >= 0
      ? sourceLines.slice(Math.max(0, labelIndex - 5), Math.min(sourceLines.length, labelIndex + 60))
      : [];

    sourceLines.forEach((line) => {
      const values = extractCurrencyValues(line);
      if (!values.length) return;
      if (installmentRegex.test(line)) {
        values.forEach((value) => {
          excludedInstallmentValues.push({ value, context: line });
        });
      }
    });

    let premiumTotal = null;
    let premiumContext = null;
    const debugCandidates = [];

    function collectReasonableAmounts(text, context, priority = 0) {
      const tokens = extractAmountTokens(text);
      const collected = [];
      for (const token of tokens) {
        const amount = parseAmount(token);
        if (!amount || amount <= 0) continue;
        if (amount >= 100000) continue;
        collected.push({ value: token, context: normalizeText(context || text), amount, priority });
      }
      return collected;
    }

    for (const labelElement of premiumLabelElements) {
      if (premiumDebugBlocks.length < 8) {
        premiumDebugBlocks.push({
          selector: cssPath(labelElement),
          text: normalizeText((labelElement.innerText || '').slice(0, 500)),
          parentText: normalizeText((labelElement.parentElement?.innerText || '').slice(0, 800)),
          parentSelector: cssPath(labelElement.parentElement),
          nextText: normalizeText((labelElement.nextElementSibling?.innerText || '').slice(0, 500)),
          nextSelector: cssPath(labelElement.nextElementSibling),
          previousText: normalizeText((labelElement.previousElementSibling?.innerText || '').slice(0, 500)),
          previousSelector: cssPath(labelElement.previousElementSibling),
        });
      }

      const relatedElements = [
        labelElement,
        labelElement.nextElementSibling,
        labelElement.previousElementSibling,
        labelElement.parentElement,
        labelElement.parentElement?.nextElementSibling,
        labelElement.parentElement?.previousElementSibling,
        labelElement.closest('div'),
        labelElement.closest('div')?.nextElementSibling,
        labelElement.closest('div')?.previousElementSibling,
      ].filter(Boolean);

      for (const [index, element] of relatedElements.entries()) {
        if (!(element instanceof Element) || !isVisible(element)) continue;
        const rawText = element.innerText || '';
        if (installmentRegex.test(rawText)) continue;
        const nearbyAmounts = collectReasonableAmounts(rawText, rawText, index);
        nearbyAmounts.forEach((candidate) => debugCandidates.push(candidate));
        if (!premiumTotal && nearbyAmounts.length) {
          premiumTotal = nearbyAmounts[0].value;
          premiumContext = nearbyAmounts[0].context;
        }
      }

      if (premiumTotal) break;
    }

    if (!premiumTotal && labelIndex >= 0) {
      const nearbyCandidates = [];
      const windowStart = Math.max(0, labelIndex - 5);
      const windowEnd = Math.min(sourceLines.length, labelIndex + 80);
      for (let lineIndex = windowStart; lineIndex < windowEnd; lineIndex += 1) {
        const line = sourceLines[lineIndex];
        const amountTokens = extractAmountTokens(line);
        if (!amountTokens.length) continue;
        if (installmentRegex.test(line)) continue;

        for (const token of amountTokens) {
          const amount = parseAmount(token);
          if (!amount || amount <= 0) continue;
          if (amount >= 100000) continue;
          nearbyCandidates.push({
            value: token,
            context: line,
            amount,
            distance: Math.abs(lineIndex - labelIndex),
            lineIndex,
          });
          debugCandidates.push({ value: token, context: line, amount, priority: Math.abs(lineIndex - labelIndex) + 10 });
        }
      }

      nearbyCandidates.sort((left, right) => {
        if (left.distance !== right.distance) return left.distance - right.distance;
        if (left.lineIndex !== right.lineIndex) return left.lineIndex - right.lineIndex;
        return left.amount - right.amount;
      });

      if (nearbyCandidates.length) {
        premiumTotal = nearbyCandidates[0].value;
        premiumContext = nearbyCandidates[0].context;
      }
    }

    if (!premiumTotal) {
      const fallbackLines = sourceLines.filter((line) => !installmentRegex.test(line));
      for (const line of fallbackLines) {
        const values = extractAmountTokens(line);
        if (!values.length) continue;
        const firstReasonable = values.find((value) => {
          const amount = parseAmount(value);
          return amount && amount > 0 && amount < 100000;
        });
        if (!firstReasonable) continue;
        premiumTotal = firstReasonable;
        premiumContext = line;
        debugCandidates.push({ value: firstReasonable, context: line, amount: parseAmount(firstReasonable), priority: 999 });
        break;
      }
    }

    return {
      premiumTotal,
      premiumContext,
      sourceSelector,
      excludedInstallmentValues,
      debugCandidates: debugCandidates.slice(0, 20),
      premiumDebugBlocks,
      premiumLabelWindow,
    };
  }).catch(() => ({ premiumTotal: null, premiumContext: null, sourceSelector: null, excludedInstallmentValues: [], debugCandidates: [], premiumDebugBlocks: [], premiumLabelWindow: [] }));
}

async function readCoberturasTotalPanel(page) {
  const text = await page.locator(coberturasTotalPanelSelector).first().innerText().catch(() => '');
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function splitNormalizedLines(value) {
  return String(value || '')
    .split(/\n+/)
    .map((line) => String(line || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractFirstAmount(value) {
  const match = String(value || '').match(/\b\d{1,3}(?:[.\s]\d{3})*,\d{2}(?:\s*€)?/);
  return match ? match[0].trim() : null;
}

function parseCoberturasReceiptDetails(panelText) {
  const rawText = String(panelText || '');
  const normalizedText = rawText.replace(/\s+/g, ' ').trim();
  const lines = splitNormalizedLines(rawText);
  const labels = [
    { key: 'anual', regex: /\banual(?:mente|idade)?\b/i },
    { key: 'mensal', regex: /\bmensal(?:idade|idades|mente|es)?\b/i },
    { key: 'trimestral', regex: /\btrimestral(?:idade|idades|mente|es)?\b/i },
    { key: 'semestral', regex: /\bsemestral(?:idade|idades|mente|es)?\b/i },
  ];
  const values = {
    anual: null,
    mensal: null,
    trimestral: null,
    semestral: null,
  };
  const contexts = {
    anual: null,
    mensal: null,
    trimestral: null,
    semestral: null,
  };

  for (const [index, line] of lines.entries()) {
    for (const label of labels) {
      if (values[label.key] || !label.regex.test(line)) continue;
      const nearbyText = [line, lines[index + 1], lines[index + 2], lines[index - 1]].filter(Boolean).join(' ');
      const amount = extractFirstAmount(nearbyText);
      if (amount) {
        values[label.key] = amount;
        contexts[label.key] = nearbyText;
      }
    }
  }

  if ((!values.anual || !values.mensal || !values.trimestral || !values.semestral) && /Detalhe\s+Recibos/i.test(normalizedText)) {
    const sectionMatch = normalizedText.match(/Detalhe\s+Recibos\s*(.*)$/i);
    const sectionText = String(sectionMatch?.[1] || '').trim();
    for (const label of labels) {
      if (values[label.key]) continue;
      const pattern = new RegExp(`${label.regex.source}[^\d€]{0,40}(\\d{1,3}(?:[.\\s]\\d{3})*,\\d{2}(?:\\s*€)?)`, 'i');
      const match = sectionText.match(pattern);
      if (match?.[1]) {
        values[label.key] = match[1].trim();
        contexts[label.key] = match[0].trim();
      }
    }
  }

  return {
    rawText: normalizedText || null,
    anual: values.anual,
    mensal: values.mensal,
    trimestral: values.trimestral,
    semestral: values.semestral,
    anualContext: contexts.anual,
    mensalContext: contexts.mensal,
    trimestralContext: contexts.trimestral,
    semestralContext: contexts.semestral,
    hasAny: Boolean(values.anual || values.mensal || values.trimestral || values.semestral),
  };
}

async function findCoberturasReceiptDetailTargets(page) {
  return page.evaluate(() => {
    function cssPath(element) {
      if (!element || !(element instanceof Element)) return '';
      const parts = [];
      let current = element;
      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
        let part = current.nodeName.toLowerCase();
        if (current.id) {
          part += `#${current.id}`;
          parts.unshift(part);
          break;
        }
        if (current.classList?.length) {
          part += `.${Array.from(current.classList).slice(0, 3).join('.')}`;
        }
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((node) => node.nodeName === current.nodeName);
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    function isVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    const matches = [];
    for (const element of Array.from(document.querySelectorAll('body *'))) {
      if (!(element instanceof Element) || !isVisible(element)) continue;
      const text = String(element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/Detalhe\s+Recibos/i.test(text)) continue;
      const clickable = element.closest('a,button,[role="button"],input[type="button"],input[type="submit"],label,div,span');
      matches.push({
        selector: cssPath(element),
        clickableSelector: cssPath(clickable || element),
        tag: element.tagName.toLowerCase(),
        clickableTag: clickable?.tagName?.toLowerCase() || element.tagName.toLowerCase(),
        text: text.slice(0, 160),
      });
      if (matches.length >= 10) break;
    }
    return matches;
  }).catch(() => []);
}

async function readCoberturasReceiptDetailsFromContext(page) {
  const sources = [];
  const panelText = await page.locator(coberturasTotalPanelSelector).first().innerText().catch(() => '');
  sources.push({ source: 'panel', text: panelText, url: page.url() });

  const bodyText = await page.locator('body').innerText().catch(() => '');
  sources.push({ source: 'page-body', text: bodyText, url: page.url() });

  const contextPages = page.context().pages().filter((candidate) => candidate !== page);
  for (const candidatePage of contextPages) {
    const popupText = await candidatePage.locator('body').innerText().catch(() => '');
    sources.push({ source: 'popup-body', text: popupText, url: candidatePage.url() });
  }

  for (const entry of sources) {
    const details = parseCoberturasReceiptDetails(entry.text);
    if (!details.hasAny) continue;
    return {
      ...details,
      source: entry.source,
      sourceUrl: entry.url,
    };
  }

  return null;
}

async function expandCoberturasReceiptDetails(page, metaState) {
  const panelLocator = page.locator(coberturasTotalPanelSelector).first();
  const initialText = await panelLocator.innerText().catch(() => '');

  // Tentativa rápida: os valores podem já estar no DOM sem precisar clicar
  const quickDetails = await readCoberturasReceiptDetailsFromContext(page);
  if (quickDetails?.hasAny) {
    metaState.steps.push(`final-step-coberturas-detalhe-recibos -> already-in-dom (${quickDetails.source})`);
    return quickDetails;
  }
  // quickDom early return desativado: precisa sempre de clicar em "Detalhe Recibos" para expandir
  // o accordion SDD (1ª Recibo Cobrança SDD). Sem o clique, os valores SDD nunca ficam disponíveis.

  const detailTargets = await findCoberturasReceiptDetailTargets(page);
  metaState.coberturasReceiptDetailTargets = detailTargets;

  let clicked = false;
  for (const [index, target] of detailTargets.entries()) {
    const selectorsToTry = [target.clickableSelector, target.selector].filter(Boolean);
    for (const selector of selectorsToTry) {
      const targetClicked = await clickForcedSelector(page, selector, `final-step-coberturas-detalhe-recibos-${index}`, metaState);
      if (targetClicked) {
        metaState.steps.push(`final-step-coberturas-detalhe-recibos -> click [${index}]`);
        clicked = true;
        break;
      }
    }
    if (clicked) break;
  }

  if (!clicked) {
    const detailCandidates = [
      panelLocator.getByRole('link', { name: /Detalhe\s+Recibos/i }).first(),
      panelLocator.getByRole('button', { name: /Detalhe\s+Recibos/i }).first(),
      panelLocator.locator('a,button,div,span,li').filter({ hasText: /Detalhe\s+Recibos/i }).first(),
      page.getByRole('link', { name: /Detalhe\s+Recibos/i }).first(),
      page.getByRole('button', { name: /Detalhe\s+Recibos/i }).first(),
    ];

    for (const [index, locator] of detailCandidates.entries()) {
      const count = await locator.count().catch(() => 0);
      if (!count) continue;
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) continue;
      try {
        await locator.click({ timeout: 4000 });
        metaState.steps.push(`final-step-coberturas-detalhe-recibos -> fallback-click [${index}]`);
        clicked = true;
        break;
      } catch {
        try {
          await locator.click({ force: true, timeout: 4000 });
          metaState.steps.push(`final-step-coberturas-detalhe-recibos -> fallback-force-click [${index}]`);
          clicked = true;
          break;
        } catch {
        }
      }
    }
  }

  if (!clicked) {
    metaState.steps.push('final-step-coberturas-detalhe-recibos -> not-found');
    return null;
  }

  const started = Date.now();
  while (Date.now() - started < 3000) {
    const panelText = await panelLocator.innerText().catch(() => '');
    const details = await readCoberturasReceiptDetailsFromContext(page);
    if (details?.hasAny) {
      metaState.steps.push(`final-step-coberturas-detalhe-recibos -> expanded (${details.source})`);
      return details;
    }

    const changed = String(panelText || '').replace(/\s+/g, ' ').trim() !== String(initialText || '').replace(/\s+/g, ' ').trim();
    if (changed && /Detalhe\s+Recibos/i.test(String(panelText || '')) && /mensal|trimestral|semestral/i.test(String(panelText || ''))) {
      metaState.steps.push('final-step-coberturas-detalhe-recibos -> expanded-with-keywords');
      return parseCoberturasReceiptDetails(panelText);
    }

    await page.waitForTimeout(250);
  }

  metaState.steps.push('final-step-coberturas-detalhe-recibos -> timeout');
  return (await readCoberturasReceiptDetailsFromContext(page)) || parseCoberturasReceiptDetails(await panelLocator.innerText().catch(() => ''));
}

async function captureCoberturasReceiptDetailsScreenshot(page, metaState) {
  const screenshotPath = path.join(dir, '99-coberturas-detalhe-recibos.png');
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
  metaState.coberturasReceiptDetailsScreenshot = screenshotPath;
}

async function scrapeAccordionValues(page, metaState) {
  metaState.steps.push('accordion-scrape -> iniciando leitura do acordeão');

  // Screenshot para diagnóstico (sem fullPage para ser rápido)
  const screenshotPath = path.join(dir, '99-accordion-values.png');
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
  metaState.accordionScreenshot = screenshotPath;
  metaState.finalScreenshot = screenshotPath;

  // Gravar body text completo para diagnóstico
  const bodyText = await page.locator('body').innerText().catch(() => '');
  metaState.accordionBodyTextDiag = bodyText ? bodyText.slice(0, 4000) : null;

  // Tentativa 1: painel total já conhecido — só usar se contiver 'Cobrança SDD' (accordion expandido)
  const panelText = await page.locator(coberturasTotalPanelSelector).first().innerText().catch(() => '');
  if (panelText && /Cobran[çc]a\s+SDD/i.test(panelText)) {
    const details = parseCoberturasReceiptDetails(panelText);
    if (details.hasAny) {
      metaState.steps.push(`accordion-scrape -> panel-selector anual=${details.anual || '-'} mensal=${details.mensal || '-'} trimestral=${details.trimestral || '-'} semestral=${details.semestral || '-'}`);
      metaState.accordionValues = { anual: details.anual || null, mensal: details.mensal || null, trimestral: details.trimestral || null, semestral: details.semestral || null };
      metaState.accordionRawText = details.rawText || null;
      return details;
    }
  }

  // Tentativa 2: DOM evaluate — procura elementos visíveis com valores monetários perto de labels de periodicidade
  const domResult = await page.evaluate(() => {
    const amountRe = /\b\d{1,3}(?:[.\s]\d{3})*,\d{2}\s*€/g;
    const periodLabels = [
      { key: 'anual', re: /\banual/i },
      { key: 'semestral', re: /\bsemestral/i },
      { key: 'trimestral', re: /\btrimestral/i },
      { key: 'mensal', re: /\bmensal/i },
    ];
    const found = { anual: null, semestral: null, trimestral: null, mensal: null };
    const contexts = { anual: null, semestral: null, trimestral: null, mensal: null };

    // Extrai AMBOS os valores SDD (Débito Direto) de um bloco de texto de periodicidade.
    // Estrutura do Zurich: "1ª Recibo Cobrança SDD  <sem SDD>  <com SDD>  Recibos Seguintes Cobrança SDD  <sem SDD>  <com SDD>"
    // O valor SDD é SEMPRE o último da linha (coluna da direita).
    function extractBothValues(scopeText) {
      const amounts = Array.from(scopeText.matchAll(amountRe)).map(m => m[0].trim()).filter(a => !/^-\s*$/.test(a));
      if (!amounts.length) return { seguintes: null, primeiro: null };

      // Extrair todos os valores após "1ª Recibo Cobrança SDD" até "Recibos Seguintes"
      const primeiroBlock = scopeText.match(/1[ªa]\s*Recibo\s+Cobran[çc]a\s+SDD\s+((?:[\d.,]+\s*€\s*|-\s*){1,4})/i);
      let primeiro = null;
      if (primeiroBlock) {
        const vals = Array.from(primeiroBlock[1].matchAll(/[\d]{1,3}(?:[.\s]\d{3})*,\d{2}\s*€/g)).map(m => m[0].trim());
        primeiro = vals.length >= 2 ? vals[vals.length - 1] : (vals[0] || null); // último = SDD
      }

      // Extrair todos os valores após "Recibos Seguintes Cobrança SDD"
      const seguintesBlock = scopeText.match(/Recibos?\s+Seguintes?\s+Cobran[çc]a\s+SDD\s+((?:[\d.,]+\s*€\s*|-\s*){1,4})/i);
      let seguintes = null;
      if (seguintesBlock) {
        const vals = Array.from(seguintesBlock[1].matchAll(/[\d]{1,3}(?:[.\s]\d{3})*,\d{2}\s*€/g)).map(m => m[0].trim());
        seguintes = vals.length >= 2 ? vals[vals.length - 1] : (vals[0] || null);
      }

      // Fallback sem "Cobrança SDD" explícito
      if (!primeiro && !seguintes) {
        const seguintesSimple = scopeText.match(/Recibos?\s+Seguintes?[^€\d]{0,60}([\d]{1,3}(?:[.\s]\d{3})*,\d{2}\s*€)/i);
        seguintes = seguintesSimple?.[1]?.trim() || amounts[amounts.length - 1] || null;
        primeiro = seguintes;
      }
      if (!primeiro) primeiro = seguintes;
      if (!seguintes) seguintes = primeiro;
      return { seguintes, primeiro };
    }

    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      if (el.children.length > 20) continue; // skip containers muito grandes
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 2000) continue;
      for (const label of periodLabels) {
        if (found[label.key]) continue;
        if (!label.re.test(text)) continue;
        // Usar o scope mais amplo (pai) se disponível
        const scope = el.parentElement || el;
        const rawText = (scope.innerText || scope.textContent || '').replace(/\s+/g, ' ').trim();
        const useText = rawText.length > 0 && rawText.length <= 3000 ? rawText : text;
        // Clipar ao bloco desta periodicidade: do label até ao próximo label diferente
        const labelIdx = useText.search(label.re);
        let clipped = useText;
        if (labelIdx >= 0) {
          const afterLabel = useText.slice(labelIdx);
          const nextPerRe = /\b(Anual|Semestral|Trimestral|Mensal)\b/gi;
          nextPerRe.lastIndex = 1;
          let nextIdx = afterLabel.length;
          let mm;
          while ((mm = nextPerRe.exec(afterLabel)) !== null) {
            if (mm.index > 0 && !label.re.test(mm[0])) { nextIdx = mm.index; break; }
          }
          clipped = afterLabel.slice(0, Math.min(nextIdx, 400));
        }
        // Só aceitar se o texto contém 'Cobrança SDD' — garante que veio do accordion expandido
        if (!/Cobran[çc]a\s+SDD/i.test(clipped)) continue;
        const both = extractBothValues(clipped);
        if (both.seguintes || both.primeiro) {
          found[label.key] = both.seguintes || both.primeiro;
          if (label.key !== 'anual' && both.primeiro && both.primeiro !== both.seguintes) {
            found[`${label.key}_primeiro`] = both.primeiro;
          }
          const ctxIdx = clipped.search(label.re);
          contexts[label.key] = (ctxIdx >= 0 ? clipped.slice(ctxIdx, ctxIdx + 200) : clipped.slice(0, 200)).trim();
        }
      }
      // Se já encontrámos todos, parar
      if (Object.values(found).filter(Boolean).length >= 4) break;
    }
    return { found, contexts, hasAny: Object.values(found).some(Boolean) };
  }).catch(() => null);

  if (domResult?.hasAny) {
    metaState.steps.push(`accordion-scrape -> dom-evaluate anual=${domResult.found.anual || '-'} mensal=${domResult.found.mensal || '-'} (1º:${domResult.found.mensal_primeiro || '-'}) trimestral=${domResult.found.trimestral || '-'} (1º:${domResult.found.trimestral_primeiro || '-'}) semestral=${domResult.found.semestral || '-'} (1º:${domResult.found.semestral_primeiro || '-'})`);
    metaState.accordionValues = {
      anual: domResult.found.anual || null,
      mensal: domResult.found.mensal || null,
      mensal_primeiro: domResult.found.mensal_primeiro || null,
      trimestral: domResult.found.trimestral || null,
      trimestral_primeiro: domResult.found.trimestral_primeiro || null,
      semestral: domResult.found.semestral || null,
      semestral_primeiro: domResult.found.semestral_primeiro || null,
    };
    metaState.accordionValuesContext = domResult.contexts;
    metaState.accordionRawText = null;
    // Sobrescreve coberturasReceiptDetails com valores correctos (o dom-evaluate anterior pode ter capturado valores errados)
    metaState.coberturasReceiptDetails = { ...metaState.accordionValues };
    return { ...domResult.found, hasAny: true };
  }

  // Tentativa 3: body text completo
  const details = parseCoberturasReceiptDetails(bodyText);
  metaState.accordionValues = { anual: details.anual || null, mensal: details.mensal || null, trimestral: details.trimestral || null, semestral: details.semestral || null };
  metaState.accordionRawText = details.rawText ? details.rawText.slice(0, 2000) : null;

  if (details.hasAny) {
    metaState.steps.push(`accordion-scrape -> body-fallback anual=${details.anual || '-'} mensal=${details.mensal || '-'} trimestral=${details.trimestral || '-'} semestral=${details.semestral || '-'}`);
  } else {
    metaState.steps.push('accordion-scrape -> no-values-found');
  }

  return details;
}

async function pauseAndScrapeAccordionValues(page, metaState) {
  const pauseShot = path.join(dir, '99-accordion-pause.png');
  metaState.steps.push('pause-accordion-scrape -> pausado, aguardando cliques manuais do utilizador');
  await updateDebugOverlay(page, 'PAUSADO: faz os cliques no acordeão e depois carrega Enter ou aguarda');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  metaState.finalScreenshot = pauseShot;

  console.log(`[transfer] Cálculo concluído. Faz agora ${accordionScrapeManualClickCount} clique(s) no acordeão do canto inferior direito (para abrir os valores anual/semestral/trimestral/mensal).`);

  if (manualCaptureArmingMs > 0) {
    await page.waitForTimeout(manualCaptureArmingMs);
  }

  const capturedClicks = [];
  for (let index = 0; index < accordionScrapeManualClickCount; index += 1) {
    await updateDebugOverlay(page, `acordeão: clique ${index + 1}/${accordionScrapeManualClickCount}`);
    console.log(`[transfer] À espera do clique ${index + 1}/${accordionScrapeManualClickCount} no acordeão...`);
    const payload = await captureSingleUserClickPassive(page, `accordion-manual-click-${index + 1}`, metaState, accordionScrapeManualClickTimeoutMs);
    if (!payload) {
      metaState.steps.push(`pause-accordion-scrape -> timeout no clique ${index + 1}, continuar com scrape`);
      console.log(`[transfer] Timeout no clique ${index + 1}/${accordionScrapeManualClickCount}, a extrair valores...`);
      break;
    }
    capturedClicks.push(payload);
    console.log(`[transfer] Clique ${index + 1}/${accordionScrapeManualClickCount} registado: ${payload.selector || payload.tag || 'unknown'} @${payload.x},${payload.y}`);
    // Tenta extrair valores após cada clique; para assim que encontrar algo
    await updateDebugOverlay(page, `clique ${index + 1} registado, a tentar extrair valores...`);
    const interimDetails = await scrapeAccordionValues(page, metaState);
    if (interimDetails?.hasAny) {
      metaState.steps.push(`pause-accordion-scrape -> valores encontrados após clique ${index + 1}`);
      console.log(`[transfer] Valores encontrados após clique ${index + 1}: anual=${interimDetails.anual || '-'} | semestral=${interimDetails.semestral || '-'} | trimestral=${interimDetails.trimestral || '-'} | mensal=${interimDetails.mensal || '-'}`);
      metaState.accordionManualClicks = capturedClicks;
      await updateDebugOverlay(page, `acordeão: anual=${interimDetails.anual || '-'} mensal=${interimDetails.mensal || '-'} trim=${interimDetails.trimestral || '-'} sem=${interimDetails.semestral || '-'}`);
      return interimDetails;
    }
  }

  metaState.accordionManualClicks = capturedClicks;
  metaState.steps.push(`pause-accordion-scrape -> ${capturedClicks.length} clique(s) capturados, nenhum valor encontrado — a fazer scrape final`);

  await updateDebugOverlay(page, 'a extrair valores do acordeão (tentativa final)...');
  const details = await scrapeAccordionValues(page, metaState);

  await updateDebugOverlay(page, `acordeão: anual=${details.anual || '-'} mensal=${details.mensal || '-'} trim=${details.trimestral || '-'} sem=${details.semestral || '-'}`);
  console.log(`[transfer] Valores extraídos: anual=${details.anual || '-'} | semestral=${details.semestral || '-'} | trimestral=${details.trimestral || '-'} | mensal=${details.mensal || '-'}`);

  return details;
}

async function enrichCoberturasReceiptDetails(page, metaState) {
  const details = await expandCoberturasReceiptDetails(page, metaState);
  if (!details?.hasAny) return null;

  metaState.coberturasReceiptDetails = {
    anual: details.anual || null,
    mensal: details.mensal || null,
    trimestral: details.trimestral || null,
    semestral: details.semestral || null,
  };
  metaState.coberturasReceiptDetailsContext = {
    anual: details.anualContext || null,
    mensal: details.mensalContext || null,
    trimestral: details.trimestralContext || null,
    semestral: details.semestralContext || null,
  };
  metaState.coberturasReceiptDetailsText = details.rawText || null;
  metaState.coberturasReceiptDetailsSource = details.source || null;
  metaState.coberturasReceiptDetailsSourceUrl = details.sourceUrl || null;
  metaState.steps.push(`final-step-coberturas-recibos -> anual=${details.anual || '-'} mensal=${details.mensal || '-'} trimestral=${details.trimestral || '-'} semestral=${details.semestral || '-'}`);
  await captureCoberturasReceiptDetailsScreenshot(page, metaState);
  return details;
}

async function readCoberturasLoadingIndicators(page) {
  return page.evaluate(() => {
    function normalizeText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function isVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    const loadingRegex = /(carregando|a preparar apresentaç[ãa]o)/i;
    const matches = [];
    const elements = Array.from(document.querySelectorAll('body *'));

    for (const element of elements) {
      if (!(element instanceof Element) || !isVisible(element)) continue;
      const text = normalizeText(element.innerText || element.textContent || '');
      if (!text || !loadingRegex.test(text)) continue;
      matches.push(text.slice(0, 140));
      if (matches.length >= 6) break;
    }

    return {
      active: matches.length > 0,
      matches,
    };
  }).catch(() => ({ active: false, matches: [] }));
}

async function waitForCoberturasCalculationToSettle(page, metaState) {
  const started = Date.now();
  let idleSince = 0;
  let stablePanelSince = 0;
  let lastPanelText = '';
  let lastLoadingSignature = '';

  while (Date.now() - started < coberturasCalcularWaitTimeoutMs) {
    const loadingState = await readCoberturasLoadingIndicators(page);
    const totalPanelText = await readCoberturasTotalPanel(page);
    const totalPanelSummary = extractCoberturasTotalFromPanelText(totalPanelText);
    const loadingSignature = (loadingState.matches || []).join(' | ');

    metaState.coberturasTotalPanelText = totalPanelText;

    if (loadingState.active) {
      idleSince = 0;
      stablePanelSince = 0;
      if (loadingSignature && loadingSignature !== lastLoadingSignature) {
        metaState.steps.push(`final-step-coberturas-loading -> ${loadingSignature}`);
        lastLoadingSignature = loadingSignature;
      }
      await page.waitForTimeout(250);
      continue;
    }

    if (!idleSince) {
      idleSince = Date.now();
      metaState.steps.push('final-step-coberturas-loading -> desapareceu');
    }

    if (totalPanelSummary.premiumTotal) {
      metaState.steps.push(`final-step-coberturas-total-panel -> pronto (${totalPanelSummary.premiumTotal})`);
      return true;
    }

    if (totalPanelText && totalPanelText === lastPanelText) {
      if (!stablePanelSince) stablePanelSince = Date.now();
    } else {
      stablePanelSince = 0;
      lastPanelText = totalPanelText;
    }

    if (idleSince && (Date.now() - idleSince >= 1500) && stablePanelSince && (Date.now() - stablePanelSince >= 600)) {
      metaState.steps.push('final-step-coberturas-total-panel -> estabilizado-sem-valor');
      return true;
    }

    await page.waitForTimeout(250);
  }

  metaState.steps.push('final-step-coberturas-loading -> timeout');
  return false;
}

async function captureCoberturasPremiumScreenshot(page, metaState, premiumTotal) {
  const screenshotPath = path.join(dir, '99-coberturas-premio-total-preenchido.png');
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
  metaState.coberturasPremiumScreenshot = screenshotPath;
  metaState.finalScreenshot = screenshotPath;
  metaState.steps.push(`final-step-coberturas-print -> premio-total (${premiumTotal})`);
}

function extractCoberturasTotalFromPanelText(panelText) {
  const normalized = String(panelText || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { premiumTotal: null, excludedInstallmentValues: [], totalContext: null, detailText: null };
  }

  const totalMatch = normalized.match(/TOTAL:\s*(.*?)(Detalhe\s+Recibos|$)/i);
  const totalSection = String(totalMatch?.[1] || '').trim();
  const detailMatch = normalized.match(/Detalhe\s+Recibos\s*(.*)$/i);
  const detailText = String(detailMatch?.[1] || '').trim();
  const amountRegex = /\b\d{1,3}(?:[.\s]\d{3})*,\d{2}(?:\s*€)?/g;
  const installmentRegex = /\b(mensal|mensais|mensalidade|mensalidades|trimestral|trimestrais|semestral|semestrais)\b/i;

  const excludedInstallmentValues = Array.from(detailText.matchAll(amountRegex)).map((match) => ({
    value: match[0].trim(),
    context: detailText,
  }));

  const premiumCandidates = Array.from(totalSection.matchAll(amountRegex))
    .map((match) => match[0].trim())
    .filter((value) => value !== '- €' && value !== '-€');

  const premiumTotal = premiumCandidates.find((value) => !installmentRegex.test(value)) || null;
  return {
    premiumTotal,
    excludedInstallmentValues,
    totalContext: totalSection || null,
    detailText: detailText || null,
  };
}

async function waitForCoberturasCalculatedValue(page, metaState) {
  const started = Date.now();
  while (Date.now() - started < coberturasCalcularWaitTimeoutMs) {
    const loadingState = await readCoberturasLoadingIndicators(page);
    const totalPanelText = await readCoberturasTotalPanel(page);
    const totalPanelSummary = extractCoberturasTotalFromPanelText(totalPanelText);
    metaState.coberturasTotalPanelText = totalPanelText;

    if (loadingState.active) {
      await page.waitForTimeout(350);
      continue;
    }

    if (totalPanelSummary.premiumTotal) {
      metaState.coberturasCalculatedValue = totalPanelSummary.premiumTotal;
      metaState.coberturasPremiumTotal = totalPanelSummary.premiumTotal;
      metaState.coberturasPremiumContext = totalPanelSummary.totalContext;
      metaState.coberturasExcludedInstallmentValues = totalPanelSummary.excludedInstallmentValues;
      metaState.coberturasTotalPanelText = totalPanelText;
      metaState.steps.push(`final-step-coberturas-valor -> total-panel (${totalPanelSummary.premiumTotal})`);
      if (shouldPauseBeforeCoberturasReceiptDetails) {
        await captureCoberturasPremiumScreenshot(page, metaState, totalPanelSummary.premiumTotal);
        await pauseBeforeCoberturasReceiptDetails(page, metaState);
        throw new ControlledPauseStop();
      }
      await enrichCoberturasReceiptDetails(page, metaState);
      if (shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
        await scrapeAccordionValues(page, metaState);
      }
      await captureCoberturasPremiumScreenshot(page, metaState, totalPanelSummary.premiumTotal);
      if (totalPanelSummary.excludedInstallmentValues?.length) {
        metaState.steps.push(`final-step-coberturas-valor-filtrado -> ${totalPanelSummary.excludedInstallmentValues.length} prestações ignoradas`);
      }
      return true;
    }

    await page.waitForTimeout(500);
  }

  const fallbackPanelText = await readCoberturasTotalPanel(page);
  const fallbackPanelSummary = extractCoberturasTotalFromPanelText(fallbackPanelText);
  metaState.coberturasTotalPanelText = fallbackPanelText;
  if (fallbackPanelSummary.premiumTotal) {
    metaState.coberturasCalculatedValue = fallbackPanelSummary.premiumTotal;
    metaState.coberturasPremiumTotal = fallbackPanelSummary.premiumTotal;
    metaState.coberturasPremiumContext = fallbackPanelSummary.totalContext;
    metaState.coberturasExcludedInstallmentValues = fallbackPanelSummary.excludedInstallmentValues;
    metaState.coberturasTotalPanelText = fallbackPanelText;
    metaState.steps.push(`final-step-coberturas-valor -> total-panel-fallback (${fallbackPanelSummary.premiumTotal})`);
    if (shouldPauseBeforeCoberturasReceiptDetails) {
      await captureCoberturasPremiumScreenshot(page, metaState, fallbackPanelSummary.premiumTotal);
      await pauseBeforeCoberturasReceiptDetails(page, metaState);
      throw new ControlledPauseStop();
    }
    await enrichCoberturasReceiptDetails(page, metaState);
    if (shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
      await scrapeAccordionValues(page, metaState);
    }
    await captureCoberturasPremiumScreenshot(page, metaState, fallbackPanelSummary.premiumTotal);
    return true;
  }

  if (fallbackPanelText) {
    metaState.steps.push(`final-step-coberturas-valor -> total-panel-empty (${fallbackPanelText.slice(0, 120)})`);
  }

  const fallbackSummary = await readCoberturasPremiumSummary(page);
  if (fallbackSummary?.premiumTotal) {
    metaState.coberturasCalculatedValue = fallbackSummary.premiumTotal;
    metaState.coberturasPremiumTotal = fallbackSummary.premiumTotal;
    metaState.coberturasPremiumContext = fallbackSummary.premiumContext || null;
    metaState.coberturasExcludedInstallmentValues = fallbackSummary.excludedInstallmentValues || [];
    metaState.steps.push(`final-step-coberturas-valor -> premium-total-fallback (${fallbackSummary.premiumTotal})`);
    if (shouldPauseBeforeCoberturasReceiptDetails) {
      await captureCoberturasPremiumScreenshot(page, metaState, fallbackSummary.premiumTotal);
      await pauseBeforeCoberturasReceiptDetails(page, metaState);
      throw new ControlledPauseStop();
    }
    await enrichCoberturasReceiptDetails(page, metaState);
    if (shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
      await scrapeAccordionValues(page, metaState);
    }
    await captureCoberturasPremiumScreenshot(page, metaState, fallbackSummary.premiumTotal);
    return true;
  }

  metaState.coberturasPremiumDebugCandidates = fallbackSummary?.debugCandidates || [];
  metaState.coberturasExcludedInstallmentValues = fallbackSummary?.excludedInstallmentValues || [];
  metaState.coberturasPremiumDebugBlocks = fallbackSummary?.premiumDebugBlocks || [];
  metaState.coberturasPremiumLabelWindow = fallbackSummary?.premiumLabelWindow || [];
  metaState.steps.push('final-step-coberturas-valor -> timeout');
  return false;
}

async function clickLearnedResumoStep(page, metaState) {
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(450);

  const selectorsToTry = [learnedResumoSelector, learnedResumoParentSelector].filter(Boolean);
  for (const [index, selector] of selectorsToTry.entries()) {
    const clicked = await clickForcedSelector(page, selector, `final-step-click-resumo-learned-${index + 1}`, metaState);
    if (clicked) {
      metaState.steps.push('final-step-click-resumo-learned -> success');
      metaState.learnedResumoClick = { selector, method: 'selector' };
      await page.waitForTimeout(400);
      return true;
    }
  }

  if (learnedResumoText) {
    const escapedText = learnedResumoText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const clickedByText = await clickByTextFallback(new RegExp(escapedText, 'i'), 'final-step-click-resumo-learned-fallback');
    if (clickedByText) {
      metaState.steps.push('final-step-click-resumo-learned -> success');
      metaState.learnedResumoClick = { text: learnedResumoText, method: 'text' };
      await page.waitForTimeout(400);
      return true;
    }
  }

  metaState.steps.push('final-step-click-resumo-learned -> not-found');
  return false;
}

/**
 * Pausa na página Coberturas e pede ao utilizador para clicar no elemento
 * que representa a cobertura de vidros, para aprender o seletor.
 */
async function pauseForGlassUncheck(page, metaState) {
  const pauseShot = path.join(dir, '99-glass-uncheck-pause.png');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  await updateDebugOverlay(page, 'PAUSADO: clica no checkbox/radio de Quebra de Vidros para o desativar');
  console.log('[transfer] ⏸  PAUSADO na página Coberturas.');
  console.log('[transfer]    👆 Clica no elemento de "Quebra de Vidros" (checkbox ou radio) para o desativar.');
  console.log('[transfer]    O seletor será aprendido e guardado no meta.json.');
  const payload = await captureSingleUserClickPassive(page, 'glass-uncheck-manual-click', metaState, 120000);
  if (payload) {
    metaState.learnedGlassUncheckSelector = payload.selector || null;
    metaState.learnedGlassUncheckClick = payload;
    metaState.steps.push(`glass-uncheck-pause -> clique registado: ${payload.selector || 'unknown'} @${payload.x},${payload.y}`);
    console.log(`[transfer] ✅ Clique registado: ${payload.selector || 'unknown'} @${payload.x},${payload.y}`);
    console.log('[transfer]    Guarda este seletor em TRANSFER_GLASS_UNCHECK_SELECTOR no .env.playwright.local para automatizar.');
    // Aguardar recálculo após o clique
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(800);
  } else {
    metaState.steps.push('glass-uncheck-pause -> timeout, sem clique');
    console.log('[transfer] ⚠️  Timeout — sem clique registado.');
  }
}

/**
 * Pausa para o utilizador clicar no card "Opção Base" e aprender o seletor.
 * Após o clique, aguarda que a página processe a seleção.
 * O seletor aprendido é guardado no meta e deve ser copiado para TRANSFER_BASE_CARD_SELECTOR.
 */
async function pauseAndLearnBaseCardStep(page, metaState) {
  const pauseShot = path.join(dir, '99-base-card-pause.png');
  await page.screenshot({ path: pauseShot, fullPage: false }).catch(() => null);
  metaState.pauseScreenshot = pauseShot;
  await updateDebugOverlay(page, 'PAUSADO: clica no card "Opção Base" para aprender o seletor');
  console.log('[transfer] ⏸  PAUSADO na página de seleção de planos.');
  console.log('[transfer]    👆 Clica no botão "Seleccionar" do card "Opção Base".');
  console.log('[transfer]    O seletor será aprendido e guardado no meta.json.');
  console.log('[transfer]    Depois copia o valor de learnedBaseCardSelector para TRANSFER_BASE_CARD_SELECTOR no .env.playwright.local.');
  const payload = await captureSingleUserClickPassive(page, 'base-card-manual-click', metaState, 120000);
  if (payload) {
    metaState.learnedBaseCardSelector = payload.selector || null;
    metaState.learnedBaseCardClick = payload;
    metaState.steps.push(`base-card-pause -> clique registado: ${payload.selector || 'unknown'} @${payload.x},${payload.y}`);
    console.log(`[transfer] ✅ Clique registado: ${payload.selector || 'unknown'} @${payload.x},${payload.y}`);
    console.log('[transfer]    Copia learnedBaseCardSelector para TRANSFER_BASE_CARD_SELECTOR no .env.playwright.local.');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
    await page.waitForTimeout(500);
    return true;
  }
  metaState.steps.push('base-card-pause -> timeout, sem clique');
  console.log('[transfer] ⚠️  Timeout — sem clique registado.');
  return false;
}

/**
 * Se o utilizador NÃO selecionou "Vidros" nas coberturas adicionais,
 * desativa a opção "Quebra de Vidros" na página Coberturas da Zurich.
 * A Zurich apresenta esta cobertura como radio buttons (QV Essencial / Quebra Vidros / QV-Marca)
 * dentro de uma linha de coberturas complementares. Para desativar, clicamos
 * no radio já selecionado (toggle-off) ou procuramos uma opção vazia/nenhuma.
 */
async function uncheckGlassIfNotRequested(page, metaState, simulationPayload) {
  const coberturas = Array.isArray(simulationPayload?.coberturas) ? simulationPayload.coberturas : [];
  // Normalizar: verificar se alguma cobertura inclui "vidro" (PT) ou "glass"/"windscreen" (EN)
  const wantsGlass = coberturas.some((c) =>
    String(c).toLowerCase().includes('vidro') ||
    String(c).toLowerCase().includes('glass') ||
    String(c).toLowerCase().includes('windscreen') ||
    String(c).toLowerCase().includes('qv')
  );

  if (wantsGlass) {
    metaState.steps.push('coberturas-glass -> requested, skip uncheck');
    return;
  }

  // Tentar desativar: procurar o radio/checkbox atualmente selecionado dentro da row de Quebra de Vidros
  // e clicar nele (toggle-off) ou clicar numa opção "Nenhuma/Sem cobertura"
  const unchecked = await page.evaluate(() => {
    // Encontrar o container/row que contém o texto "Quebra de Vidros" ou "QV"
    const allLabels = Array.from(document.querySelectorAll('label, td, div, span, th'));
    const glassContainer = allLabels.find((el) => {
      const txt = (el.textContent || '').trim();
      return txt === 'Quebra de Vidros' || txt === 'QV Essencial';
    });

    if (!glassContainer) return { found: false, reason: 'container-not-found' };

    // Subir na árvore para encontrar a row/section
    let row = glassContainer;
    for (let i = 0; i < 8; i++) {
      if (!row.parentElement) break;
      row = row.parentElement;
      // Verificar se esta row tem inputs
      const inputs = Array.from(row.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
      if (inputs.length > 0) {
        // Tentar encontrar opção sem valor / vazia (representa "sem cobertura")
        const emptyOpt = inputs.find((inp) => {
          const v = String(inp.value || '').trim();
          return v === '' || v === '0' || v === 'none' || v === 'nenhuma';
        });
        if (emptyOpt && !emptyOpt.checked) {
          emptyOpt.click();
          return { found: true, action: 'clicked-empty-option', value: emptyOpt.value };
        }

        // Se for checkbox e estiver checked, clicar para desmarcar
        const checkedCheckbox = inputs.find((inp) => inp.type === 'checkbox' && inp.checked);
        if (checkedCheckbox) {
          checkedCheckbox.click();
          return { found: true, action: 'unchecked-checkbox' };
        }

        // Se for radio já selecionado, tentar clicar de novo (alguns toggleiam)
        const checkedRadio = inputs.find((inp) => inp.type === 'radio' && inp.checked);
        if (checkedRadio) {
          // Não há opção vazia, tentar clicar no radio selecionado
          checkedRadio.click();
          return { found: true, action: 'clicked-selected-radio', value: checkedRadio.value, note: 'may-not-toggle' };
        }
        return { found: true, action: 'no-checked-input-found', inputs: inputs.length };
      }
    }
    return { found: false, reason: 'no-inputs-in-row' };
  }).catch(() => ({ found: false, reason: 'evaluate-error' }));

  metaState.steps.push(`coberturas-glass -> uncheck result: ${JSON.stringify(unchecked)}`);

  if (unchecked?.found && unchecked?.action !== 'no-checked-input-found') {
    await page.waitForTimeout(600);
    // Aguardar recalculo (a página pode fazer AJAX)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
  }
}

async function advanceLearnedResumoToCoberturasStep(page, metaState) {
  const clickedSeguinte = await clickLowerSeguinteStep(page, metaState);
  if (!clickedSeguinte) {
    const clickedCoberturasNav = await clickCoberturasStepNavigation(page, metaState);
    if (!clickedCoberturasNav) {
      metaState.steps.push('final-step-resumo-coberturas -> navigation-not-found');
    }
  }

  const reachedCoberturas = await waitForCoberturasPage(page, metaState);
  if (reachedCoberturas) {
    metaState.steps.push('final-step-resumo-coberturas -> success');
    if (shouldPauseOnCoberturas) {
      await pauseOnCoberturasForManualInstruction(page, metaState);
      throw new ControlledPauseStop();
    }
    return true;
  }

  const directReached = await navigateDirectlyToCoberturasStep(page, metaState);
  metaState.steps.push(`final-step-resumo-coberturas -> ${directReached ? 'success-direct' : 'failed'}`);
  if (directReached && shouldPauseOnCoberturas) {
    await pauseOnCoberturasForManualInstruction(page, metaState);
    throw new ControlledPauseStop();
  }
  return directReached;
}

async function captureSingleUserClickPassive(page, stepLabel, metaState, timeoutMs = 120000) {
  const payload = await page.evaluate((timeout) => {
    return new Promise((resolve) => {
      function cssPath(element) {
        if (!element || !(element instanceof Element)) return '';
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 10) {
          let part = current.nodeName.toLowerCase();
          if (current.id) {
            part += `#${current.id}`;
            parts.unshift(part);
            break;
          }
          if (current.classList && current.classList.length > 0) {
            part += '.' + Array.from(current.classList).slice(0, 3).join('.');
          }
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((node) => node.nodeName === current.nodeName);
            if (siblings.length > 1) {
              part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            }
          }
          parts.unshift(part);
          current = current.parentElement;
        }
        return parts.join(' > ');
      }

      function cleanup() {
        clearTimeout(timer);
        document.removeEventListener('click', onClick, true);
      }

      function onClick(event) {
        if (!event.isTrusted || event.button !== 0) {
          return;
        }
        const target = event.target;
        const data = {
          x: event.clientX,
          y: event.clientY,
          tag: target?.tagName?.toLowerCase?.() || null,
          id: target?.id || null,
          className: target?.className || null,
          title: target?.getAttribute?.('title') || null,
          ariaLabel: target?.getAttribute?.('aria-label') || null,
          text: (target?.textContent || '').trim().slice(0, 160),
          selector: cssPath(target),
          parentSelector: cssPath(target?.parentElement || null),
          timestamp: Date.now(),
        };
        cleanup();
        resolve(data);
      }

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);

      document.addEventListener('click', onClick, true);
    });
  }, timeoutMs).catch(() => null);

  if (payload) {
    metaState.steps.push(`${stepLabel} -> learned-click (${payload.selector || payload.tag || 'unknown'}) @${payload.x},${payload.y}`);
    metaState.learnedVehicleClick = payload;
    return payload;
  }

  metaState.steps.push(`${stepLabel} -> timeout-no-click`);
  return null;
}

async function clickPreferredVehicleRow(targetPage, preferredIndex, metaState, stepLabel) {
  if (!Number.isInteger(preferredIndex) || preferredIndex < 0) return false;

  const result = await targetPage.evaluate(({ index }) => {
    function isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    const selectors = [
      '[role="dialog"] table tbody tr',
      '.modal table tbody tr',
      '.popup table tbody tr',
      'table tbody tr',
    ];

    for (const selector of selectors) {
      const allRows = Array.from(document.querySelectorAll(selector)).filter(isVisible);
      if (!allRows.length || index >= allRows.length) continue;

      const row = allRows[index];
      try {
        row.scrollIntoView({ block: 'center', inline: 'nearest' });
      } catch {
      }

      const actionCandidate = row.querySelector('a,button,input[type="button"],input[type="submit"],div,span');
      if (actionCandidate) {
        try {
          actionCandidate.click();
          return {
            ok: true,
            selector,
            method: 'row-action',
            text: (row.textContent || '').trim().slice(0, 140),
          };
        } catch {
        }
      }

      try {
        row.click();
        return {
          ok: true,
          selector,
          method: 'row',
          text: (row.textContent || '').trim().slice(0, 140),
        };
      } catch {
      }
    }

    return { ok: false };
  }, { index: preferredIndex }).catch(() => ({ ok: false }));

  if (result?.ok) {
    metaState.steps.push(`${stepLabel} -> preferred-row-dom index=${preferredIndex} (${result.selector}/${result.method}) ${result.text || ''}`.trim());
    return true;
  }

  metaState.steps.push(`${stepLabel} -> preferred-row-dom-miss index=${preferredIndex}`);
  return false;
}

async function selectFirstVehicleResult(page, metaState, knownPages = new Set()) {
  const context = page.context();

  for (let attempt = 0; attempt < 8; attempt++) {
    const freshPopup = context.pages().find((candidate) => !knownPages.has(candidate));
    if (freshPopup && freshPopup !== page) {
      await freshPopup.bringToFront().catch(() => null);
      await freshPopup.waitForLoadState('domcontentloaded').catch(() => null);

      const popupSelected = await (async () => {
        if (vehiclePreferredSelector) {
          const preferredLocator = freshPopup.locator(vehiclePreferredSelector).first();
          const preferredCount = await preferredLocator.count().catch(() => 0);
          if (preferredCount) {
            const preferredVisible = await preferredLocator.isVisible().catch(() => false);
            if (preferredVisible) {
              await preferredLocator.click({ timeout: 15000 }).catch(() => preferredLocator.click({ force: true, timeout: 15000 }));
              metaState.steps.push(`select-vehicle-popup -> preferred-selector (${vehiclePreferredSelector})`);
              return true;
            }
          }
        }

        if (await clickPreferredVehicleRow(freshPopup, vehicleResultIndex, metaState, 'select-vehicle-popup')) {
          return true;
        }

        const popupClicked = await clickFirstVisible([
          { name: `popup linha preferida (${vehicleResultIndex})`, locator: freshPopup.locator('table tbody tr').nth(vehicleResultIndex) },
          { name: 'popup primeira linha', locator: freshPopup.locator('table tbody tr').first() },
          { name: 'popup selecionar link', locator: freshPopup.getByRole('link', { name: /selecionar|escolher|confirmar|ok/i }) },
          { name: 'popup selecionar button', locator: freshPopup.getByRole('button', { name: /selecionar|escolher|confirmar|ok/i }) },
        ], 'select-vehicle-popup');
        if (popupClicked) return true;

        const domPopupClicked = await freshPopup.evaluate(() => {
          const row = document.querySelector('table tbody tr, table tr');
          if (row) {
            try {
              row.click();
            } catch {
            }
          }
          const action = document.querySelector('a[title*="sele" i],button[title*="sele" i],a,button,input[type="button"],input[type="submit"]');
          if (action) {
            try {
              action.click();
              return true;
            } catch {
            }
          }
          return false;
        }).catch(() => false);
        return domPopupClicked;
      })();

      if (popupSelected) {
        metaState.steps.push(`select-vehicle -> popup-page (${freshPopup.url() || 'about:blank'})`);
        await freshPopup.close().catch(() => null);
        await page.bringToFront().catch(() => null);
        await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
        await page.waitForTimeout(vehiclePostSelectWaitMs);
        return true;
      }
    }
    await page.waitForTimeout(160);
  }

  const dialogVisible = await page
    .locator('[role="dialog"], .modal, .ui-dialog, .popup, .modal-dialog, [id*="dialog" i], [class*="dialog" i]')
    .first()
    .isVisible()
    .catch(() => false);

  if (dialogVisible) {
    if (vehiclePreferredSelector) {
      const preferredDialog = page.locator(vehiclePreferredSelector).first();
      const preferredCount = await preferredDialog.count().catch(() => 0);
      if (preferredCount) {
        const preferredVisible = await preferredDialog.isVisible().catch(() => false);
        if (preferredVisible) {
          await preferredDialog.click({ timeout: 15000 }).catch(() => preferredDialog.click({ force: true, timeout: 15000 }));
          metaState.steps.push(`select-vehicle-dialog -> preferred-selector (${vehiclePreferredSelector})`);
          await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
          await page.waitForTimeout(vehiclePostSelectWaitMs);
          return true;
        }
      }
    }

    if (await clickPreferredVehicleRow(page, vehicleResultIndex, metaState, 'select-vehicle-dialog')) {
      await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
      await page.waitForTimeout(vehiclePostSelectWaitMs);
      return true;
    }

    const clickedDialog = await clickFirstVisible([
      { name: `dialog linha preferida (${vehicleResultIndex})`, locator: page.locator('[role="dialog"] table tbody tr, .modal table tbody tr, .popup table tbody tr').nth(vehicleResultIndex) },
      { name: 'dialog primeira linha', locator: page.locator('[role="dialog"] table tbody tr, .modal table tbody tr, .popup table tbody tr').first() },
      { name: 'dialog selecionar link', locator: page.locator('[role="dialog"] a, .modal a, .popup a').filter({ hasText: /selecionar|escolher|confirmar|ok/i }).first() },
      { name: 'dialog selecionar button', locator: page.locator('[role="dialog"] button, .modal button, .popup button').filter({ hasText: /selecionar|escolher|confirmar|ok/i }).first() },
    ], 'select-vehicle-dialog');

    if (clickedDialog) {
      await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
      await page.waitForTimeout(vehiclePostSelectWaitMs);
      return true;
    }
  }

  if (await clickPreferredVehicleRow(page, vehicleResultIndex, metaState, 'select-vehicle')) {
    await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
    await page.waitForTimeout(vehiclePostSelectWaitMs);
    return true;
  }

  const clickedByLocator = await clickFirstVisible([
    { name: `linha preferida tabela (${vehicleResultIndex})`, locator: page.locator('table tbody tr').nth(vehicleResultIndex) },
    { name: 'primeira linha tabela', locator: page.locator('table tbody tr').first() },
    { name: `resultado preferido genérico (${vehicleResultIndex})`, locator: page.locator('.modal table tr, .popup table tr, [role="dialog"] table tr').nth(vehicleResultIndex) },
    { name: 'primeiro resultado genérico', locator: page.locator('.modal table tr, .popup table tr, [role="dialog"] table tr').first() },
    { name: 'selecionar viatura button', locator: page.getByRole('button', { name: /selecionar|escolher|confirmar|ok/i }) },
    { name: 'selecionar viatura link', locator: page.getByRole('link', { name: /selecionar|escolher|confirmar|ok/i }) },
  ], 'select-vehicle');

  if (clickedByLocator) {
    await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
    await page.waitForTimeout(vehiclePostSelectWaitMs);
    return true;
  }

  const clickedByDom = await page.evaluate(() => {
    function isVisible(el) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    const preferred = [
      ...Array.from(document.querySelectorAll('button,a,input[type="button"],input[type="submit"]')),
      ...Array.from(document.querySelectorAll('table tbody tr, .modal tr, .popup tr, [role="dialog"] tr')),
    ];

    for (const candidate of preferred) {
      if (!isVisible(candidate)) continue;
      const text = (candidate.textContent || '').trim();
      const label = `${candidate.getAttribute('title') || ''} ${candidate.getAttribute('aria-label') || ''} ${text}`.toLowerCase();
      const isAction = /selecionar|escolher|confirmar|ok|selec|choose|select/.test(label);
      const isResultRow = candidate.tagName.toLowerCase() === 'tr' && text.length > 0;
      if (!isAction && !isResultRow) continue;
      try {
        candidate.click();
        return { ok: true, label: label.slice(0, 120) };
      } catch {
      }
    }
    return { ok: false };
  });

  if (clickedByDom?.ok) {
    metaState.steps.push(`select-vehicle -> dom-fallback (${clickedByDom.label})`);
    await page.waitForLoadState('domcontentloaded', { timeout: vehiclePostSelectLoadWaitMs }).catch(() => null);
    await page.waitForTimeout(vehiclePostSelectWaitMs);
    return true;
  }

  metaState.steps.push('select-vehicle -> not-found');
  return false;
}

const browser = await chromium.launch({ headless, slowMo });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

async function loadLatestAutoSimulationFromLocalhost() {
  const bridgePage = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  try {
    await bridgePage.goto('http://localhost:5176/pt/simulacao-auto', { waitUntil: 'domcontentloaded', timeout: 12000 });
    const payloadRaw = await bridgePage.evaluate(() => localStorage.getItem('latestAutoSimulationPayload'));
    if (!payloadRaw) return null;
    const payload = JSON.parse(payloadRaw);
    return {
      id: 'localhost-localStorage',
      path: 'localStorage:latestAutoSimulationPayload',
      payload,
      raw: payload,
    };
  } catch {
    return null;
  } finally {
    await bridgePage.close();
  }
}

async function clickFirstVisible(locators, stepLabel) {
  for (const item of locators) {
    const locator = item.locator;
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    for (let index = 0; index < Math.min(count, 8); index++) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      try {
        await candidate.click({ timeout: 15000 });
      } catch {
        try {
          await candidate.click({ force: true, timeout: 15000 });
        } catch {
          continue;
        }
      }
      meta.steps.push(`${stepLabel} -> ${item.name} [${index}]`);
      return true;
    }
  }
  return false;
}

async function clickLastVisible(locators, stepLabel) {
  for (const item of locators) {
    const locator = item.locator;
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    for (let index = Math.min(count, 8) - 1; index >= 0; index--) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      try {
        await candidate.click({ timeout: 15000 });
      } catch {
        try {
          await candidate.click({ force: true, timeout: 15000 });
        } catch {
          continue;
        }
      }
      meta.steps.push(`${stepLabel} -> ${item.name} [${index}]`);
      return true;
    }
  }
  return false;
}

async function clickVisibleByPreferredIndex(locators, stepLabel, preferredVisibleIndex = 0) {
  for (const item of locators) {
    const locator = item.locator;
    const count = await locator.count().catch(() => 0);
    if (!count) continue;

    const visibleCandidates = [];
    for (let index = 0; index < Math.min(count, 8); index++) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (visible) visibleCandidates.push({ candidate, index });
    }

    if (!visibleCandidates.length) continue;

    const orderedCandidates = [];
    if (visibleCandidates[preferredVisibleIndex]) {
      orderedCandidates.push(visibleCandidates[preferredVisibleIndex]);
    }
    for (const entry of visibleCandidates) {
      if (!orderedCandidates.includes(entry)) orderedCandidates.push(entry);
    }

    for (const entry of orderedCandidates) {
      try {
        await entry.candidate.click({ timeout: 15000 });
      } catch {
        try {
          await entry.candidate.click({ force: true, timeout: 15000 });
        } catch {
          continue;
        }
      }
      meta.steps.push(`${stepLabel} -> ${item.name} [${entry.index}]`);
      return true;
    }
  }

  return false;
}

async function clickOptionCardByText(page, textRegex, stepLabel, preferredVisibleIndex = 0) {
  const pattern = textRegex.source;
  const flags = textRegex.flags;
  const target = await page.evaluate(({ pattern, flags, preferredVisibleIndex }) => {
    const regex = new RegExp(pattern, flags);
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    const isClickable = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const tag = element.tagName.toLowerCase();
      if (['a', 'button', 'label', 'input'].includes(tag)) return true;
      if (element.getAttribute('role') && /button|link|radio|checkbox|tab/.test(element.getAttribute('role') || '')) return true;
      if (typeof element.onclick === 'function') return true;
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && tabIndex !== '-1') return true;
      return false;
    };

    const elements = Array.from(document.querySelectorAll('a,button,label,input,div,span,li,td,tr'));
    const cards = [];
    const seen = new Set();

    for (const node of elements) {
      if (!(node instanceof HTMLElement)) continue;
      if (!visible(node)) continue;
      const text = normalize(node.textContent || node.getAttribute('value') || '');
      if (!text || !regex.test(text)) continue;

      let clickable = node;
      let guard = 0;
      while (clickable.parentElement && guard < 6) {
        if (isClickable(clickable)) break;
        const parent = clickable.parentElement;
        if (!parent || !visible(parent)) break;
        clickable = parent;
        guard += 1;
      }

      const rect = clickable.getBoundingClientRect();
      const key = `${Math.round(rect.left)}:${Math.round(rect.top)}:${Math.round(rect.width)}:${Math.round(rect.height)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      cards.push({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        text,
        key,
      });
    }

    if (!cards.length) return null;
    const chosen = cards[Math.min(preferredVisibleIndex, cards.length - 1)];
    return { ...chosen, index: Math.min(preferredVisibleIndex, cards.length - 1), total: cards.length };
  }, { pattern, flags, preferredVisibleIndex });

  if (!target) return false;
  await page.mouse.click(target.x, target.y);
  meta.steps.push(`${stepLabel} -> card-click [${target.index}] (${target.text}) @${target.x},${target.y}`);
  return true;
}

async function clickByTextFallback(textRegex, stepLabel) {
  const pattern = textRegex.source;
  const flags = textRegex.flags;
  const result = await page.evaluate(({ pattern, flags }) => {
    const regex = new RegExp(pattern, flags);
    const candidates = Array.from(document.querySelectorAll('a,button,div,span,li'));
    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      if (!text || !regex.test(text)) continue;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      if (!visible) continue;
      el.click();
      return { ok: true, text };
    }
    return { ok: false };
  }, { pattern, flags });

  if (result?.ok) {
    meta.steps.push(`${stepLabel} -> fallback text click (${result.text})`);
    return true;
  }
  return false;
}

async function clickFinalSeguinteStep(page, metaState) {
  const beforeClickUrl = page.url();

  if (finalStepBeforeSeguinteMs > 0) {
    await page.waitForTimeout(finalStepBeforeSeguinteMs);
    metaState.steps.push(`final-step-click-seguinte -> pre-click-wait ${finalStepBeforeSeguinteMs}ms`);
  }

  const clicked = await clickFirstVisible([
    { name: 'final-seguinte button exato', locator: page.getByRole('button', { name: /^\s*Seguinte\s*$/i }) },
    { name: 'final-seguinte link exato', locator: page.getByRole('link', { name: /^\s*Seguinte\s*$/i }) },
    { name: 'final-seguinte button loose', locator: page.getByRole('button', { name: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
    { name: 'final-seguinte link loose', locator: page.getByRole('link', { name: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
    { name: 'final-seguinte input submit', locator: page.locator('input[type="submit"][value*="Seguinte" i], input[type="button"][value*="Seguinte" i]') },
    { name: 'final-seguinte class fallback', locator: page.locator('a,button,input[type="submit"],input[type="button"]').filter({ hasText: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
  ], 'final-step-click-seguinte');

  if (!clicked) {
    const fallbackClicked = await clickByTextFallback(/Seguinte|Próximo|Proximo|Next|Continuar/i, 'final-step-click-seguinte-fallback');
    if (!fallbackClicked) {
      metaState.steps.push('final-step-click-seguinte -> not-found');
      return false;
    }
  }

  await page.waitForURL((url) => url.toString() !== beforeClickUrl, { timeout: finalStepNextPageWaitMs }).catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(500);
  metaState.steps.push(`final-step-click-seguinte -> waited-next-page ${finalStepNextPageWaitMs}ms`);
  metaState.steps.push('final-step-click-seguinte -> success');
  return true;
}

async function clickLowerSeguinteStep(page, metaState) {
  const beforeClickUrl = page.url();

  if (finalStepBeforeSeguinteMs > 0) {
    await page.waitForTimeout(finalStepBeforeSeguinteMs);
    metaState.steps.push(`final-step-click-lower-seguinte -> pre-click-wait ${finalStepBeforeSeguinteMs}ms`);
  }

  const clicked = await clickLastVisible([
    { name: 'lower-seguinte button exato', locator: page.getByRole('button', { name: /^\s*Seguinte\s*$/i }) },
    { name: 'lower-seguinte link exato', locator: page.getByRole('link', { name: /^\s*Seguinte\s*$/i }) },
    { name: 'lower-seguinte button loose', locator: page.getByRole('button', { name: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
    { name: 'lower-seguinte link loose', locator: page.getByRole('link', { name: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
    { name: 'lower-seguinte input submit', locator: page.locator('input[type="submit"][value*="Seguinte" i], input[type="button"][value*="Seguinte" i]') },
    { name: 'lower-seguinte class fallback', locator: page.locator('a,button,input[type="submit"],input[type="button"]').filter({ hasText: /Seguinte|Próximo|Proximo|Next|Continuar/i }) },
  ], 'final-step-click-lower-seguinte');

  if (!clicked) {
    metaState.steps.push('final-step-click-lower-seguinte -> not-found');
    return false;
  }

  await page.waitForURL((url) => url.toString() !== beforeClickUrl, { timeout: finalStepNextPageWaitMs }).catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(500);
  metaState.steps.push(`final-step-click-lower-seguinte -> waited-next-page ${finalStepNextPageWaitMs}ms`);
  metaState.steps.push('final-step-click-lower-seguinte -> success');
  return true;
}

function isThirdPartyAutoSimulation(simulationPayload) {
  const rawType = String(
    simulationPayload?.tipoSeguro
    || simulationPayload?.insuranceType
    || simulationPayload?.type
    || ''
  ).trim().toLowerCase();

  return rawType === 'terceiros'
    || rawType === 'thirdparty'
    || rawType === 'third party'
    || rawType.includes('terceiros')
    || rawType.includes('third party');
}

function isOwnDamageAutoSimulation(simulationPayload) {
  const rawType = String(
    simulationPayload?.tipoSeguro
    || simulationPayload?.insuranceType
    || simulationPayload?.type
    || ''
  ).trim().toLowerCase();

  return rawType === 'danos próprios'
    || rawType === 'danos proprios'
    || rawType === 'own damage'
    || rawType.includes('danos próprios')
    || rawType.includes('danos proprios')
    || rawType.includes('own damage');
}

async function selectNamedOptionStep(page, metaState, optionRegex, stepLabel) {
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(700);

  const cardClicked = await clickOptionCardByText(page, optionRegex, `${stepLabel}-card`, 1);
  if (cardClicked) {
    await page.waitForTimeout(350);
    metaState.steps.push(`${stepLabel} -> success`);
    return true;
  }

  const selected = await clickVisibleByPreferredIndex([
    { name: `${stepLabel} radio`, locator: page.getByRole('radio', { name: optionRegex }) },
    { name: `${stepLabel} checkbox`, locator: page.getByRole('checkbox', { name: optionRegex }) },
    { name: `${stepLabel} button`, locator: page.getByRole('button', { name: optionRegex }) },
    { name: `${stepLabel} link`, locator: page.getByRole('link', { name: optionRegex }) },
    { name: `${stepLabel} label`, locator: page.locator('label').filter({ hasText: optionRegex }) },
    { name: `${stepLabel} input value`, locator: page.locator('input[type="radio"], input[type="checkbox"]').filter({ hasText: optionRegex }) },
    { name: `${stepLabel} fallback text container`, locator: page.locator('a,button,div,span,li').filter({ hasText: optionRegex }) },
  ], stepLabel, 1);

  if (!selected) {
    const fallbackSelected = await clickByTextFallback(optionRegex, `${stepLabel}-fallback`);
    if (!fallbackSelected) {
      metaState.steps.push(`${stepLabel} -> not-found`);
      return false;
    }
  }

  await page.waitForTimeout(350);
  metaState.steps.push(`${stepLabel} -> success`);
  return true;
}

async function selectOpcaoBaseStep(page, metaState) {
  const baseRegex = /Opção\s*Base|Opcao\s*Base/i;
  return selectNamedOptionStep(page, metaState, baseRegex, 'final-step-select-opcao-base');
}

async function selectOpcaoEssencialStep(page, metaState) {
  const essentialRegex = /Opção\s*Essencial|Opcao\s*Essencial|Essencial/i;
  return selectNamedOptionStep(page, metaState, essentialRegex, 'final-step-select-opcao-essencial');
}

async function selectOpcaoPremiumStep(page, metaState) {
  const premiumRegex = /Opção\s*Premium|Opcao\s*Premium|Premium/i;
  return selectNamedOptionStep(page, metaState, premiumRegex, 'final-step-select-opcao-premium');
}

async function waitForCoberturasPage(page, metaState) {
  await page.waitForURL((url) => /\/MZ_Auto\/Coberturas\.aspx\?q=/i.test(url.toString()), { timeout: Math.max(5000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout: Math.max(2500, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(500);
  const reached = /\/MZ_Auto\/Coberturas\.aspx\?q=/i.test(page.url());
  metaState.steps.push(`final-step-coberturas-url -> ${reached ? 'success' : 'not-reached'} (${page.url()})`);
  return reached;
}

async function navigateDirectlyToCoberturasStep(page, metaState) {
  const currentUrl = new URL(page.url());
  const q = currentUrl.searchParams.get('q');
  if (!q) {
    metaState.steps.push('final-step-coberturas-direct -> missing-q');
    return false;
  }

  const directUrl = `${currentUrl.origin}/MZ_Auto/Coberturas.aspx?q=${encodeURIComponent(q)}`;
  await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: Math.max(10000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.max(3000, finalStepNextPageWaitMs) }).catch(() => null);
  await page.waitForTimeout(500);

  const reached = /\/MZ_Auto\/Coberturas\.aspx\?q=/i.test(page.url());
  metaState.steps.push(`final-step-coberturas-direct -> ${reached ? 'success' : 'failed'} (${page.url()})`);
  return reached;
}

async function clickCoberturasStepNavigation(page, metaState) {
  const clicked = await clickFirstVisible([
    { name: 'coberturas nav link exact', locator: page.getByRole('link', { name: /^\s*2\s*COBERTURAS\s*$/i }) },
    { name: 'coberturas nav button exact', locator: page.getByRole('button', { name: /^\s*2\s*COBERTURAS\s*$/i }) },
    { name: 'coberturas nav link loose', locator: page.getByRole('link', { name: /COBERTURAS/i }) },
    { name: 'coberturas nav button loose', locator: page.getByRole('button', { name: /COBERTURAS/i }) },
    { name: 'coberturas nav text fallback', locator: page.locator('a,button,div,span,li').filter({ hasText: /\b2\b.*COBERTURAS|COBERTURAS/i }) },
  ], 'final-step-click-coberturas-nav');

  if (!clicked) {
    const fallbackClicked = await clickByTextFallback(/\b2\b.*COBERTURAS|COBERTURAS/i, 'final-step-click-coberturas-nav-fallback');
    if (!fallbackClicked) {
      metaState.steps.push('final-step-click-coberturas-nav -> not-found');
      return false;
    }
  }

  await page.waitForTimeout(400);
  metaState.steps.push('final-step-click-coberturas-nav -> success');
  return true;
}

async function waitForAutoFormReady(page, timeoutMs, metaState) {
  await page
    .waitForURL((u) => /MZ_Auto\/(Dados_Auto\.aspx|Dados_Auto)/i.test(u.toString()), { timeout: timeoutMs })
    .catch(() => null);

  const readySelectors = [
    'input[name*="nif" i]',
    'input[id*="nif" i]',
    'input[name*="contrib" i]',
    'input[id*="contrib" i]',
  ];

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const selector of readySelectors) {
      const locator = page.locator(selector).first();
      const count = await locator.count().catch(() => 0);
      if (!count) continue;
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) continue;
      metaState.steps.push(`simular-ready -> ${selector}`);
      return true;
    }
    await page.waitForTimeout(120);
  }

  metaState.steps.push('simular-ready -> timeout');
  return false;
}

async function waitForSimuladoresMenuReady(page, timeoutMs, metaState) {
  async function poll(ms, label) {
    const started = Date.now();
    while (Date.now() - started < ms) {
      const ready = await page
        .locator('a:has-text("Simuladores"), [role="link"]:has-text("Simuladores"), *:has-text("Simuladores")')
        .first()
        .isVisible()
        .catch(() => false);
      if (ready) {
        metaState.steps.push(`menu-simuladores-ready -> ${label}`);
        return true;
      }
      await page.waitForTimeout(120);
    }
    return false;
  }

  if (await poll(timeoutMs, 'visible')) return true;

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
  if (await poll(3000, 'visible-after-networkidle')) return true;

  metaState.steps.push('menu-simuladores-ready -> timeout');
  return false;
}

async function updateDebugOverlay(page, label) {
  if (!debugOverlayEnabled) return;
  const elapsedMs = Date.now() - runStartedAt;
  const text = `t+${elapsedMs}ms | ${label}`;
  await page.evaluate((overlayText) => {
    let overlay = document.getElementById('__pw_transfer_debug_overlay__');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = '__pw_transfer_debug_overlay__';
      overlay.style.position = 'fixed';
      overlay.style.right = '12px';
      overlay.style.top = '12px';
      overlay.style.zIndex = '2147483647';
      overlay.style.background = 'rgba(0,0,0,0.82)';
      overlay.style.color = '#8dff9e';
      overlay.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      overlay.style.fontSize = '12px';
      overlay.style.lineHeight = '1.3';
      overlay.style.padding = '8px 10px';
      overlay.style.borderRadius = '8px';
      overlay.style.maxWidth = '520px';
      overlay.style.pointerEvents = 'none';
      overlay.style.whiteSpace = 'normal';
      document.body.appendChild(overlay);
    }
    overlay.textContent = overlayText;
  }, text).catch(() => null);
}

async function waitForClienteContainerReady(page, timeoutMs, pollMs, metaState) {
  const selector = `#${clienteReadyElementId}`;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ready = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const text = (element.textContent || '').trim();
      return element.childElementCount > 0 || text.length > 0;
    }, selector).catch(() => false);

    if (ready) {
      metaState.steps.push(`cliente-ready -> ${selector}`);
      return true;
    }
    await page.waitForTimeout(pollMs);
  }

  metaState.steps.push('cliente-ready -> timeout');
  return false;
}

async function saveShot(name) {
  await page.screenshot({ path: path.join(dir, name), fullPage: false });
}

try {
  const simulationSource = preferLocalhostFirst
    ? ((await loadLatestAutoSimulationFromLocalhost().catch(() => null)) ||
      (await loadLatestAutoSimulationPayload().catch(() => null)))
    : ((await loadLatestAutoSimulationPayload().catch(() => null)) ||
      (await loadLatestAutoSimulationFromLocalhost().catch(() => null)));
  const simulationPayload = simulationSource?.payload || {};
  meta.simulationSourcePreference = preferLocalhostFirst ? 'localhost-first' : 'firestore-first';
  meta.simulationSourcePath = simulationSource?.path || null;
  meta.simulationPayloadSample = {
    matricula: simulationPayload.matricula || null,
    codigoPostal: simulationPayload.codigoPostal || null,
    marca: simulationPayload.marca || null,
    modelo: simulationPayload.modelo || null,
    ano: simulationPayload.ano || null,
    tipoSeguro: simulationPayload.tipoSeguro || null,
  };

  // Auto-detectar job ID a partir do simulationSource (path = 'simulationTransferJobs/{id}')
  // Permite que o script escreva resultados de volta ao Firestore sem TRANSFER_JOB_ID manual
  if (!process.env.TRANSFER_JOB_ID && simulationSource?.path?.startsWith('simulationTransferJobs/')) {
    const autoJobId = simulationSource.id || simulationSource.path.split('/').pop();
    if (autoJobId) {
      process.env.TRANSFER_JOB_ID = autoJobId;
      meta.steps.push(`transfer-job-id -> auto-detected (${autoJobId})`);
    }
  }

  // Marcar job como 'running' no Firestore assim que começamos
  const activeJobId = process.env.TRANSFER_JOB_ID;
  if (activeJobId) {
    try {
      const _fbCfg = getFirebaseClientConfigFromEnv();
      const _fbApp = getFirebaseClientApp(_fbCfg);
      if (_fbApp) {
        const _fbDb = getFirestore(_fbApp);
        await updateDoc(doc(_fbDb, 'simulationTransferJobs', activeJobId), {
          status: 'running',
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => null);
        meta.steps.push(`firestore-job-update -> running (jobId=${activeJobId})`);
      }
    } catch { /* ignorar — não bloquear o flow */ }
  }

  await page.goto('https://myzurich.zurich.com.pt/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await updateDebugOverlay(page, 'login-page-opened');
  await page.waitForSelector('#Input_LoginUsername', { timeout: 20000 });
  await page.fill('#Input_LoginUsername', process.env.TRANSFER_LOGIN_USERNAME || '');

  await clickFirstVisible([
    { name: 'seguinte login step1', locator: page.locator('#LoginForm button[type="submit"], #LoginForm input[type="submit"], button:has-text("Seguinte")') },
  ], 'login-step1');
  await updateDebugOverlay(page, 'login-step1-submitted');

  await page.waitForLoadState('domcontentloaded', { timeout: 1200 }).catch(() => null);
  await page.waitForTimeout(loginStepTransitionMs);

  const pass = page.locator('input[type="password"], input[name*="pass" i], input[id*="pass" i]').first();
  // Aguardar até 8s pelo campo de password (login em 2 passos do Zurich)
  await pass.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null);
  if (await pass.count() && await pass.isVisible().catch(() => false)) {
    await pass.fill(process.env.TRANSFER_LOGIN_PASSWORD || '');
    meta.steps.push('login-step2-password-filled');
    await clickFirstVisible([
      { name: 'entrar login step2', locator: page.locator('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Seguinte")') },
    ], 'login-step2');
    await updateDebugOverlay(page, 'login-step2-submitted');
  } else {
    meta.steps.push('login-step2-password-not-found');
  }

  await page.waitForURL((u) => u.toString().includes('/MYZ_Home/Home'), { timeout: loginLandingWaitTimeoutMs }).catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout: 1200 }).catch(() => null);
  await page.waitForTimeout(homeSettlingMs);
  await waitForSimuladoresMenuReady(page, menuSimuladoresReadyWaitMs, meta);
  await updateDebugOverlay(page, 'home-ready');
  await saveShot('01-home.png');

  let clickedMenu = await clickFirstVisible([
    { name: 'menu Simuladores link', locator: page.getByRole('link', { name: /^Simuladores$/i }) },
    { name: 'menu Simuladores any', locator: page.getByText(/Simuladores/i) },
  ], 'menu-simuladores');

  if (!clickedMenu) {
    clickedMenu = await clickByTextFallback(/Simuladores|Simulador/i, 'menu-simuladores-fallback');
  }

  if (!clickedMenu) throw new Error('Não consegui clicar no menu Simuladores');
  await updateDebugOverlay(page, 'menu-simuladores-clicked');

  await page.waitForTimeout(menuTransitionMs);

  let clickedSubmenu = await clickFirstVisible([
    { name: 'submenu Simuladores link', locator: page.getByRole('link', { name: /^Simuladores$/i }) },
    { name: 'submenu Simuladores text', locator: page.getByText(/^Simuladores$/i) },
    { name: 'submenu Simuladores any', locator: page.getByText(/Simuladores/i) },
  ], 'submenu-simuladores');

  if (!clickedSubmenu) {
    clickedSubmenu = await clickByTextFallback(/Simuladores/i, 'submenu-simuladores-fallback');
  }

  await page.waitForLoadState('networkidle', { timeout: 1800 }).catch(() => null);
  await page.waitForTimeout(simuladoresListSettlingMs);
  await saveShot('02-lista-simuladores.png');

  let clickedTile = await clickFirstVisible([
    { name: 'tile Zurich Auto exact', locator: page.getByText(/^Zurich\s*Auto$/i) },
    { name: 'tile Zurich Auto loose', locator: page.getByText(/Zurich\s*Auto/i) },
    { name: 'tile Auto fallback', locator: page.getByText(/Auto/i) },
  ], 'tile-zurich-auto');

  if (!clickedTile) {
    clickedTile = await clickByTextFallback(/Zurich\s*Auto|Auto/i, 'tile-zurich-auto-fallback');
  }

  if (!clickedTile) throw new Error('Não consegui clicar no tile Zurich Auto');
  await updateDebugOverlay(page, 'tile-zurich-auto-clicked');

  await page.waitForLoadState('networkidle', { timeout: 1800 }).catch(() => null);
  await page.waitForTimeout(tileOpenSettlingMs);
  await saveShot('03-tile-aberto.png');

  const alreadyInAutoForm = page.url().includes('/MZ_Auto/Dados_Auto.aspx');
  if (alreadyInAutoForm) {
    meta.steps.push('botao-simular -> já em Dados_Auto.aspx (último passo alcançado)');
  }

  let clickedSimular = alreadyInAutoForm;
  if (!clickedSimular) {
    clickedSimular = await clickFirstVisible([
      { name: 'botao Simular role button', locator: page.getByRole('button', { name: /^Simular$/i }) },
      { name: 'botao Simular text', locator: page.getByText(/^Simular$/i) },
      { name: 'botao Simular loose', locator: page.getByText(/Simular/i) },
      { name: 'link Simular', locator: page.getByRole('link', { name: /Simular/i }) },
    ], 'botao-simular');
  }

  if (!clickedSimular) {
    clickedSimular = await clickByTextFallback(/Simular/i, 'botao-simular-fallback');
  }

  if (!clickedSimular) throw new Error('Não consegui clicar em Simular');
  await updateDebugOverlay(page, 'simular-clicked');

  await waitForAutoFormReady(page, simularPostClickReadyTimeoutMs, meta);
  await page.waitForTimeout(firstSimularSettlingMs);
  await updateDebugOverlay(page, 'auto-form-ready');

  const contribuinteSelectors = [
    'input[name*="nif" i]',
    'input[id*="nif" i]',
    'input[name*="contrib" i]',
    'input[id*="contrib" i]',
  ];

  await fillFirstMatchingField(
    page,
    contribuinteSelectors,
    simulationPayload.contribuinte,
    'contribuinte',
    meta
  );

  await page.waitForTimeout(contribuintePostFillWaitMs);
  const personNameWatchSelectors = [
    'input[name*="nome" i]',
    'input[id*="nome" i]',
    'input[name*="tomador" i]',
    'input[id*="tomador" i]',
    'input[name*="cliente" i]',
    'input[id*="cliente" i]',
    'input[name*="segurado" i]',
    'input[id*="segurado" i]',
    'span[id*="nome" i]',
    'div[id*="nome" i]',
  ];
  const nameBaseline = await snapshotValues(page, personNameWatchSelectors);
  const clickedContribLookup = await clickLookupNearField(page, contribuinteSelectors, 'contribuinte', meta);
  if (!clickedContribLookup) {
    throw new Error('Não foi possível clicar na lupa do contribuinte');
  }
  await updateDebugOverlay(page, 'nif-lookup-clicked');
  const clienteReady = await waitForClienteContainerReady(
    page,
    clienteReadyWaitTimeoutMs,
    clienteReadyPollMs,
    meta
  );
  if (clienteReady) {
    await updateDebugOverlay(page, 'cliente-ready -> avançar matrícula');
  }

  let nameResolved = clienteReady;
  if (!nameResolved) {
    await page.waitForTimeout(contribuintePostLookupWaitMs);
    nameResolved = await waitForValueAppearance(
      page,
      personNameWatchSelectors,
      nameBaseline,
      contribuinteNameWaitTimeoutMs,
      'contribuinte-name-loaded',
      meta,
      { allowExistingNonEmpty: true, pollIntervalMs: contribuinteNamePollMs }
    );
  }
  if (!nameResolved) {
    throw new Error('Nome da pessoa não apareceu após lookup do contribuinte');
  }

  const matriculaSelectors = [
    'input[name*="matric" i]',
    'input[id*="matric" i]',
    'input[placeholder*="matr" i]',
    'input[name*="plate" i]',
    'input[id*="plate" i]',
  ];
  const vehicleWatchSelectors = [
    'input[name*="marca" i]',
    'input[id*="marca" i]',
    'input[name*="modelo" i]',
    'input[id*="modelo" i]',
    'input[name*="versao" i]',
    'input[id*="versao" i]',
    'input[name*="vehicle" i]',
    'input[id*="vehicle" i]',
  ];
  let primingFocused = false;
  if (matriculaPrimingEnabled) {
    primingFocused = await forceFocusMatriculaField(
      page,
      matriculaSelectors,
      meta,
      'matricula-prefocus-priming',
      {
        focusClicks: matriculaPrimingFocusClicks,
        focusGapMs: matriculaPrimingFocusGapMs,
        initialForce: true,
        clickTimeoutMs: matriculaPrimingClickTimeoutMs,
      }
    );
  }
  const vehicleBaseline = await snapshotValues(page, vehicleWatchSelectors);
  const knownPages = new Set(page.context().pages());
  const preflightFocused = await forceFocusMatriculaField(
    page,
    matriculaSelectors,
    meta,
    'matricula-prefocus-preflight',
    {
      focusClicks: primingFocused ? 1 : Math.max(1, matriculaPreflightFocusClicks),
      focusGapMs: matriculaPreflightFocusGapMs,
      initialForce: primingFocused,
      clickTimeoutMs: primingFocused ? 900 : 15000,
    }
  );

  if (manualMatriculaAfterNif) {
    let recoveredByReclick = false;
    meta.steps.push('manual-matricula-after-nif -> aguardando utilizador inserir matrícula e clicar lupa');
    await updateDebugOverlay(page, 'AGUARDO: inserir matrícula + clicar lupa');
    if (captureMatriculaIntermediateShot) {
      await saveShot('04-matricula-antes-lupa.png');
    }

    const manualPlate = await waitForAnyFieldNonEmpty(
      page,
      matriculaSelectors,
      240000,
      'manual-matricula-filled',
      meta
    );
    if (!manualPlate.ok) {
      throw new Error('Timeout: matrícula não foi inserida manualmente');
    }
    await updateDebugOverlay(page, 'matrícula preenchida manualmente');

    const manualChooser = await waitForVehicleDialogOrLoaded(
      page,
      knownPages,
      vehicleWatchSelectors,
      vehicleBaseline,
      240000,
      meta
    );
    if (!manualChooser.ok) {
      recoveredByReclick = await recoverVehicleChooserByReclickAndSelectFirst(
        page,
        knownPages,
        matriculaSelectors,
        meta,
        'manual-after-nif-recovery'
      );
      if (!recoveredByReclick) {
        throw new Error('Timeout: após inserires matrícula e clicares na lupa não apareceu diálogo/lista de viaturas');
      }
    }
    await updateDebugOverlay(page, 'diálogo/lista viaturas detetado');

    if (!recoveredByReclick && (manualChooser.mode === 'popup' || manualChooser.mode === 'dialog')) {
      if (manualSelectVehicleFirst) {
        const manualSelected = await waitForManualVehicleSelection(
          page,
          knownPages,
          vehicleWatchSelectors,
          vehicleBaseline,
          manualSelectVehicleTimeoutMs,
          meta,
          {
            matriculaSelectors,
            reopenAttempts: manualSelectVehicleReopenAttempts,
            reopenWaitMs: manualSelectVehicleReopenWaitMs,
            learnVehicleClick: manualLearnVehicleClick,
          }
        );
        if (!manualSelected.ok) {
          throw new Error('Timeout: lista de viaturas aberta, mas não houve seleção manual a tempo');
        }
      } else {
        let selectedVehicle = await selectFirstVehicleResult(page, meta, knownPages);
        if (!selectedVehicle && forceRecoveryReclickInAutoMode) {
          recoveredByReclick = await recoverVehicleChooserByReclickAndSelectFirst(
            page,
            knownPages,
            matriculaSelectors,
            meta,
            'forced-recovery-auto'
          );
        }
        if (recoveredByReclick) {
          meta.steps.push('select-vehicle -> skipped (already selected by forced recovery auto)');
        } else {
          if (!selectedVehicle) {
            throw new Error('Não foi possível selecionar uma viatura após o teu clique na lupa da matrícula');
          }
          meta.steps.push(`auto-select-vehicle-pause -> ${pauseAfterAutoSelectVehicleMs}ms`);
          await page.waitForTimeout(pauseAfterAutoSelectVehicleMs);
        }
      }
    }
  } else {
    let recoveredByReclick = false;
    await forceFocusMatriculaField(
      page,
      matriculaSelectors,
      meta,
      'matricula-prefocus-early',
      {
        focusClicks: preflightFocused ? matriculaPostPreflightFocusClicks : matriculaFieldFocusClicks,
        focusGapMs: matriculaFieldFocusClickGapMs,
        initialForce: preflightFocused,
        clickTimeoutMs: preflightFocused ? 1200 : 15000,
      }
    );
    await page.waitForTimeout(2000);
    const typedMatricula = await typeMatriculaProgressively(page, matriculaSelectors, simulationPayload.matricula, meta, { skipInitialFocus: true });
    if (!typedMatricula) {
      await fillFirstMatchingField(
        page,
        matriculaSelectors,
        simulationPayload.matricula,
        'matricula',
        meta
      );
    }

    await page.waitForTimeout(150);
    await clickOutsideField(page, matriculaSelectors, meta);
    await page.waitForTimeout(matriculaPostBlurPauseMs);

    const matriculaVisible = await waitForAnyFieldNonEmpty(
      page,
      matriculaSelectors,
      5000,
      'matricula-visible-before-lookup',
      meta
    );
    if (!matriculaVisible.ok) {
      meta.steps.push('matricula-visible-before-lookup-soft-timeout -> continuar');
    }

    await page.waitForTimeout(matriculaPreLookupPauseMs);
    if (captureMatriculaIntermediateShot) {
      await saveShot('04-matricula-antes-lupa.png');
    }

    let chooser = await waitForVehicleChooser(page, knownPages, matriculaAutoDialogInitialWaitMs, meta);
    if (!chooser.ok) {
      meta.steps.push('vehicle-dialog-auto-open -> not-detected, clicar lupa imediata');
      let clickedVehicleLookup = false;
      for (let attempt = 1; attempt <= matriculaLookupClicks && !chooser.ok; attempt++) {
        meta.steps.push(`lookup matricula -> attempt ${attempt}/${matriculaLookupClicks}`);

        if (manualMatriculaCapture && attempt === 1) {
          meta.steps.push('manual-capture-matricula-lupa -> aguardando clique do utilizador');
          await page.waitForTimeout(manualCaptureArmingMs);
          meta.manualMatriculaLookupClick = await captureSingleUserClick(page, 'lookup matricula', meta);
          clickedVehicleLookup = true;
        } else if (effectiveMatriculaLupaSelector) {
          const stepLabel = attempt === 1 ? 'lookup matricula' : `lookup matricula retry-${attempt}`;
          clickedVehicleLookup = await clickForcedSelector(page, effectiveMatriculaLupaSelector, stepLabel, meta);
          if (!clickedVehicleLookup) {
            meta.steps.push(`lookup matricula -> forced-selector-not-available (${effectiveMatriculaLupaSelector})`);
            clickedVehicleLookup = await clickLookupNearField(page, matriculaSelectors, attempt === 1 ? 'matricula' : `matricula-retry-${attempt}`, meta);
          }
        } else {
          clickedVehicleLookup = await clickLookupNearField(page, matriculaSelectors, attempt === 1 ? 'matricula' : `matricula-retry-${attempt}`, meta);
        }

        if (!clickedVehicleLookup) {
          continue;
        }

        await page.waitForTimeout(attempt === 1 ? matriculaLookupWaitFirstMs : matriculaLookupWaitRetryMs);
        chooser = await waitForVehicleChooser(page, knownPages, vehicleChooserPostLookupWaitMs, meta);
      }

      if (!clickedVehicleLookup) {
        throw new Error('Não foi possível clicar na lupa da matrícula');
      }

      if (!chooser.ok) {
        recoveredByReclick = await recoverVehicleChooserByReclickAndSelectFirst(
          page,
          knownPages,
          matriculaSelectors,
          meta,
          'auto-flow-recovery'
        );
        if (!recoveredByReclick) {
          throw new Error('Após clicar na lupa da matrícula não apareceu diálogo/lista de viaturas');
        }
      }
    } else {
      meta.steps.push('vehicle-dialog-auto-open -> detected');
    }

    if (recoveredByReclick) {
      meta.steps.push('select-vehicle -> skipped (already selected by recovery)');
    } else if (manualSelectVehicleFirst) {
      const manualSelected = await waitForManualVehicleSelection(
        page,
        knownPages,
        vehicleWatchSelectors,
        vehicleBaseline,
        manualSelectVehicleTimeoutMs,
        meta,
        {
          matriculaSelectors,
          reopenAttempts: manualSelectVehicleReopenAttempts,
          reopenWaitMs: manualSelectVehicleReopenWaitMs,
          learnVehicleClick: manualLearnVehicleClick,
        }
      );
      if (!manualSelected.ok) {
        throw new Error('Timeout: lista de viaturas aberta, mas não houve seleção manual a tempo');
      }
    } else {
      let selectedVehicle = await selectFirstVehicleResult(page, meta, knownPages);
      if (!selectedVehicle && forceRecoveryReclickInAutoMode) {
        recoveredByReclick = await recoverVehicleChooserByReclickAndSelectFirst(
          page,
          knownPages,
          matriculaSelectors,
          meta,
          'forced-recovery-auto'
        );
      }
      if (recoveredByReclick) {
        meta.steps.push('select-vehicle -> skipped (already selected by forced recovery auto)');
      } else {
        if (!selectedVehicle) {
          throw new Error('Não foi possível selecionar uma viatura após abrir lista de viaturas');
        }
        meta.steps.push(`auto-select-vehicle-pause -> ${pauseAfterAutoSelectVehicleMs}ms`);
        await page.waitForTimeout(pauseAfterAutoSelectVehicleMs);
      }
    }
    if (skipVehicleLoadedWait) {
      meta.steps.push('vehicle-loaded -> skipped');
    } else {
      await page.waitForTimeout(vehiclePostSelectWaitMs);
      const vehicleResolved = await waitForValueAppearance(
        page,
        vehicleWatchSelectors,
        vehicleBaseline,
        vehicleLoadedWaitTimeoutMs,
        'vehicle-loaded',
        meta,
        { allowExistingNonEmpty: true }
      );
      if (!vehicleResolved) {
        meta.steps.push('vehicle-loaded-soft-timeout -> sem mudança visível, continuar');
        await page.waitForTimeout(vehicleLoadedSoftPauseMs);
      }
    }
  }

  await fillFirstMatchingField(
    page,
    [
      'input[name*="postal" i]',
      'input[id*="postal" i]',
      'input[name*="codigo" i]',
      'input[id*="codigo" i]',
      'input[placeholder*="postal" i]',
    ],
    simulationPayload.codigoPostal,
    'codigoPostal',
    meta
  );

  await fillFirstMatchingField(
    page,
    [
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[type="email"]',
    ],
    simulationPayload.email,
    'email',
    meta
  );

  await fillFirstMatchingField(
    page,
    [
      'input[name*="nome" i]',
      'input[id*="nome" i]',
      'input[name*="name" i]',
      'input[id*="name" i]',
    ],
    simulationPayload.nome,
    'nome',
    meta
  );

  if (shouldAdvanceThirdPartyToCoberturas) {
    await clickFinalSeguinteStep(page, meta);

    if (pauseAfterSeguinteMs > 0) {
      meta.steps.push(`pause-after-seguinte -> ${pauseAfterSeguinteMs}ms (sem captura)`);
      console.log(`[transfer] ⏸  Pausa de ${pauseAfterSeguinteMs}ms após Seguinte. Podes fazer cliques manuais — não serão gravados.`);
      await page.waitForTimeout(pauseAfterSeguinteMs);
      console.log('[transfer] ▶️  A retomar...');
    }

    if (shouldPauseOnDadosAuto) {
      meta.steps.push('final-step-decision -> pause-after-seguinte-summary');
      await pauseOnDadosAutoForManualInstruction(page, meta);
      throw new ControlledPauseStop();
    }

    if (isThirdPartyAutoSimulation(simulationPayload)) {
      meta.steps.push(`final-step-decision -> third-party-coberturas (${simulationPayload.tipoSeguro || 'unknown'})`);
      const selectedEssencial = await selectOpcaoEssencialStep(page, meta);
      if (selectedEssencial) {
        const clickedCoberturasNav = await clickCoberturasStepNavigation(page, meta);
        if (!clickedCoberturasNav) {
          await clickLowerSeguinteStep(page, meta);
        }
        const reachedCoberturas = await waitForCoberturasPage(page, meta);
        if (!reachedCoberturas) {
          await navigateDirectlyToCoberturasStep(page, meta);
        }
      }
    } else {
      meta.steps.push(`final-step-decision -> skipped-non-third-party-coberturas (${simulationPayload.tipoSeguro || 'empty'})`);
    }
  } else if (shouldClickSeguinteAndChooseEssencialForThirdParty) {
    await clickFinalSeguinteStep(page, meta);

    if (pauseAfterSeguinteMs > 0) {
      meta.steps.push(`pause-after-seguinte -> ${pauseAfterSeguinteMs}ms (sem captura)`);
      console.log(`[transfer] ⏸  Pausa de ${pauseAfterSeguinteMs}ms após Seguinte. Podes fazer cliques manuais — não serão gravados.`);
      await page.waitForTimeout(pauseAfterSeguinteMs);
      console.log('[transfer] ▶️  A retomar...');
    }

    if (shouldPauseOnDadosAuto) {
      meta.steps.push('final-step-decision -> pause-after-seguinte-summary');
      await pauseOnDadosAutoForManualInstruction(page, meta);
      throw new ControlledPauseStop();
    }

    if (isThirdPartyAutoSimulation(simulationPayload)) {
      meta.steps.push(`final-step-decision -> third-party (${simulationPayload.tipoSeguro || 'unknown'})`);
      await selectOpcaoEssencialStep(page, meta);
    } else if (isOwnDamageAutoSimulation(simulationPayload)) {
      meta.steps.push(`final-step-decision -> own-damage (${simulationPayload.tipoSeguro || 'unknown'})`);
      await selectOpcaoPremiumStep(page, meta);
    } else {
      meta.steps.push(`final-step-decision -> skipped-unknown-type (${simulationPayload.tipoSeguro || 'empty'})`);
    }
  } else if (shouldClickFinalSeguinte || shouldPauseOnDadosAuto || shouldClickLearnedResumoAfterSeguinte || shouldAdvanceLearnedResumoToCoberturas || shouldDragCoberturasSlider || shouldCalculateCoberturasAfterDrag || shouldPauseBeforeCoberturasCalculator || shouldPauseBeforeCoberturasReceiptDetails || shouldPauseAfterCoberturasSlider || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
    await clickFinalSeguinteStep(page, meta);

    if (pauseAfterSeguinteMs > 0) {
      meta.steps.push(`pause-after-seguinte -> ${pauseAfterSeguinteMs}ms (sem captura)`);
      console.log(`[transfer] ⏸  Pausa de ${pauseAfterSeguinteMs}ms após Seguinte. Podes fazer cliques manuais — não serão gravados.`);
      await page.waitForTimeout(pauseAfterSeguinteMs);
      console.log('[transfer] ▶️  A retomar...');
    }

    if (shouldPauseOnDadosAuto) {
      meta.steps.push('final-step-decision -> pause-after-seguinte-summary');
      await pauseOnDadosAutoForManualInstruction(page, meta);
      throw new ControlledPauseStop();
    }

    if (shouldClickLearnedResumoAfterSeguinte || shouldAdvanceLearnedResumoToCoberturas || shouldDragCoberturasSlider || shouldCalculateCoberturasAfterDrag || shouldPauseBeforeCoberturasCalculator || shouldPauseBeforeCoberturasReceiptDetails || shouldPauseAfterCoberturasSlider || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
      // Para Terceiros: não há página Resumo — selecionar Essencial e avançar para Coberturas diretamente
      if (isThirdPartyAutoSimulation(simulationPayload)) {
        meta.steps.push(`final-step-decision -> terceiros-drag-flow (${simulationPayload.tipoSeguro})`);
        // Selecionar card Base: usar seletor aprendido se disponível, senão pausar para aprender
        let baseSelected = false;
        if (learnedBaseCardSelector) {
          meta.steps.push(`terceiros-drag-flow -> base-card-learned (${learnedBaseCardSelector})`);
          await page.locator(learnedBaseCardSelector).click({ timeout: 8000 }).catch(() => null);
          await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => null);
          await page.waitForTimeout(400);
          baseSelected = true;
        } else {
          meta.steps.push('terceiros-drag-flow -> base-card-pause (sem seletor aprendido)');
          baseSelected = await pauseAndLearnBaseCardStep(page, meta);
        }
        if (baseSelected) {
          const clickedCoberturasNav = await clickCoberturasStepNavigation(page, meta);
          if (!clickedCoberturasNav) {
            await clickLowerSeguinteStep(page, meta);
          }
          const reachedCoberturas = await waitForCoberturasPage(page, meta);
          if (!reachedCoberturas) {
            await navigateDirectlyToCoberturasStep(page, meta);
          }
          // Opção Base não inclui Quebra de Vidros — sem necessidade de uncheck
          if (shouldDragCoberturasSlider || shouldCalculateCoberturasAfterDrag || shouldPauseBeforeCoberturasCalculator || shouldPauseBeforeCoberturasReceiptDetails || shouldPauseAfterCoberturasSlider || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
            meta.steps.push('terceiros-drag-flow -> drag-coberturas-slider');
            await dragCoberturasSliderStep(page, meta);
          }
          if (shouldPauseAfterCoberturasSlider) {
            meta.steps.push('terceiros-drag-flow -> pause-coberturas-apos-slider');
            await pauseAfterCoberturasSlider(page, meta);
            throw new ControlledPauseStop();
          }
          if (shouldPauseBeforeCoberturasCalculator) {
            meta.steps.push('terceiros-drag-flow -> pause-coberturas-calculadora');
            await pauseBeforeCoberturasCalculator(page, meta);
            throw new ControlledPauseStop();
          }
          if (shouldCalculateCoberturasAfterDrag || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
            meta.steps.push('terceiros-drag-flow -> click-coberturas-calcular');
            const clickedCalcular = await clickCoberturasCalcularStep(page, meta);
            if (clickedCalcular) {
              await waitForCoberturasCalculatedValue(page, meta).catch(() => null);
            }
            if (shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
              const alreadyHasValues = meta.accordionValues && Object.values(meta.accordionValues).some(Boolean);
              if (alreadyHasValues) {
                meta.steps.push('terceiros-drag-flow -> accordion-values-already-captured, skip pause');
              } else {
                meta.steps.push('terceiros-drag-flow -> pause-accordion-scrape');
                await pauseAndScrapeAccordionValues(page, meta);
              }
            }
          }
        }
      } else {
      meta.steps.push('final-step-decision -> click-resumo-learned');
      const clickedLearnedResumo = await clickLearnedResumoStep(page, meta);
      if (clickedLearnedResumo && (shouldAdvanceLearnedResumoToCoberturas || shouldDragCoberturasSlider || shouldCalculateCoberturasAfterDrag || shouldPauseBeforeCoberturasCalculator || shouldPauseBeforeCoberturasReceiptDetails || shouldPauseAfterCoberturasSlider || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider)) {
        meta.steps.push('final-step-decision -> click-resumo-learned-coberturas');
        await advanceLearnedResumoToCoberturasStep(page, meta);
        // Pausa manual para aprender o seletor de Vidros (apenas quando TRANSFER_PAUSE_FOR_GLASS_UNCHECK=true)
        if (shouldPauseForGlassUncheck) {
          await pauseForGlassUncheck(page, meta);
        }
        // Desativar Quebra de Vidros se não foi pedida pelo utilizador
        await uncheckGlassIfNotRequested(page, meta, simulationPayload);
        if (shouldDragCoberturasSlider || shouldCalculateCoberturasAfterDrag || shouldPauseBeforeCoberturasCalculator || shouldPauseBeforeCoberturasReceiptDetails || shouldPauseAfterCoberturasSlider || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
          meta.steps.push('final-step-decision -> drag-coberturas-slider');
          await dragCoberturasSliderStep(page, meta);
        }
        if (shouldPauseAfterCoberturasSlider) {
          meta.steps.push('final-step-decision -> pause-coberturas-apos-slider');
          await pauseAfterCoberturasSlider(page, meta);
          throw new ControlledPauseStop();
        }
        if (shouldPauseBeforeCoberturasCalculator) {
          meta.steps.push('final-step-decision -> pause-coberturas-calculadora');
          await pauseBeforeCoberturasCalculator(page, meta);
          throw new ControlledPauseStop();
        }
        if (shouldCalculateCoberturasAfterDrag || shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
          meta.steps.push('final-step-decision -> click-coberturas-calcular');
          const clickedCalcular = await clickCoberturasCalcularStep(page, meta);
          if (clickedCalcular) {
            await waitForCoberturasCalculatedValue(page, meta).catch(() => null);
          }
          if (shouldPauseBeforeAccordionScrape || shouldScrapeAccordionBeforeCalcular || shouldScrapeAccordionAfterSlider) {
            // Só faz pausa/re-scrape se os valores ainda não foram capturados no DOM de Coberturas.aspx
            const alreadyHasValues = meta.accordionValues && Object.values(meta.accordionValues).some(Boolean);
            if (alreadyHasValues) {
              meta.steps.push('final-step-decision -> accordion-values-already-captured, skip pause');
            } else {
              meta.steps.push('final-step-decision -> pause-accordion-scrape');
              await pauseAndScrapeAccordionValues(page, meta);
            }
          }
        }
      }
      } // end else (non-third-party resumo flow)
    }
  }

  await page.waitForTimeout(finalStepSettlingMs);

  const finalShot = path.join(dir, '99-ultimo-passo-simular.png');
  await page.screenshot({ path: finalShot, fullPage: false });

  meta.finalUrl = page.url();
  meta.finalTitle = await page.title();
  meta.finalScreenshot = meta.coberturasPremiumScreenshot || finalShot;
  meta.lastPageScreenshot = finalShot;
  meta.bodyTextSample = (await page.locator('body').innerText().catch(() => '')).slice(0, 700);

  // Escreve resultados de volta ao job Firestore (para o frontend mostrar no passo 4)
  const jobId = process.env.TRANSFER_JOB_ID;
  if (jobId) {
    try {
      // Reutiliza a app Firebase já inicializada (evita erro se config for null neste ponto)
      const fbDb = getFirestore(getApps().length ? getApp() : initializeApp(getFirebaseClientConfigFromEnv()));
      const hasValues = meta.accordionValues && Object.values(meta.accordionValues).some(Boolean);
      if (hasValues) {
        await updateDoc(doc(fbDb, 'simulationTransferJobs', jobId), {
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          result: {
            accordionValues: meta.accordionValues || null,
            coberturasReceiptDetails: meta.coberturasReceiptDetails || null,
            coberturasPremiumTotal: meta.coberturasPremiumTotal || null,
            finalUrl: meta.finalUrl || null,
          },
        });
        meta.steps.push(`firestore-job-update -> completed (jobId=${jobId})`);
      } else {
        await updateDoc(doc(fbDb, 'simulationTransferJobs', jobId), {
          status: 'failed',
          failedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          error: 'accordionValues not extracted — simulation did not reach Coberturas',
        });
        meta.steps.push(`firestore-job-update -> failed-no-values (jobId=${jobId})`);
      }
    } catch (fbErr) {
      console.warn('[transfer] Falha ao actualizar job Firestore completed:', fbErr?.message || fbErr);
      meta.steps.push(`firestore-job-update -> error: ${fbErr?.message || String(fbErr)}`);
    }
  }

  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, dir, finalScreenshot: meta.finalScreenshot, lastPageScreenshot: finalShot, finalUrl: meta.finalUrl, accordionValues: meta.accordionValues || null }, null, 2));
} catch (error) {
  if (error instanceof ControlledPauseStop) {
    meta.finalUrl = page.url();
    meta.finalTitle = await page.title().catch(() => null);
    meta.bodyTextSample = (await page.locator('body').innerText().catch(() => '')).slice(0, 700);
    await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: true, paused: true, dir, finalScreenshot: meta.finalScreenshot || null, finalUrl: meta.finalUrl, manualDadosAutoClick: meta.manualDadosAutoClick || null, manualCoberturasClick: meta.manualCoberturasClick || null, manualCoberturasDrags: meta.manualCoberturasDrags || null, manualCoberturasCalculatorClick: meta.manualCoberturasCalculatorClick || null, manualCoberturasPostSliderClick: meta.manualCoberturasPostSliderClick || null, manualCoberturasPostSliderClicks: meta.manualCoberturasPostSliderClicks || null, manualCoberturasReceiptDetailsClick: meta.manualCoberturasReceiptDetailsClick || null, manualCoberturasReceiptDetailsClicks: meta.manualCoberturasReceiptDetailsClicks || null }, null, 2));
  } else {
    const errShot = path.join(dir, 'error.png');
    await page.screenshot({ path: errShot, fullPage: false }).catch(() => null);
    meta.error = error instanceof Error ? error.message : String(error);
    meta.finalUrl = page.url();
    meta.errorScreenshot = errShot;
    // Marcar job como failed no Firestore
    const failedJobId = process.env.TRANSFER_JOB_ID;
    if (failedJobId) {
      try {
        const fbDb = getFirestore(getApps().length ? getApp() : initializeApp(getFirebaseClientConfigFromEnv()));
        await updateDoc(doc(fbDb, 'simulationTransferJobs', failedJobId), {
          status: 'failed',
          failedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          error: meta.error || 'unknown error',
        });
      } catch { /* ignorar */ }
    }
    await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: false, dir, error: meta.error, errorScreenshot: errShot, finalUrl: meta.finalUrl }, null, 2));
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
