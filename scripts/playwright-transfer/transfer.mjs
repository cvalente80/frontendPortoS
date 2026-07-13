import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

export const defaultSelectors = {
  loginUsername: 'input[type="email"], input[name*="user" i], input[id*="user" i], input[name*="login" i], input[id*="login" i], input[name*="mail" i], input[id*="mail" i], input[type="text"]',
  loginPassword: 'input[type="password"], input[name*="pass" i], input[id*="pass" i]',
  loginSubmit: 'button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Login")',
  plate: '[name="plate"], #plate',
  postalCode: '[name="postalCode"], #postalCode',
  birthDate: '[name="birthDate"], #birthDate',
  email: '[name="email"], #email',
  phone: '[name="phone"], #phone',
  consentCheckbox: '[name="consent"], #consent',
  submitButton: 'button[type="submit"], [data-testid="submit-simulation"]',
  resultContainer: '[data-testid="simulation-result"], .simulation-result',
};

function pick(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') {
      return String(source[key]);
    }
  }
  return undefined;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function maybeFill(page, selector, value) {
  if (!selector || value === undefined) return;
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    await locator.fill(value);
  }
}

export async function maybeCheck(page, selector) {
  if (!selector) return;
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    const checked = await locator.isChecked().catch(() => false);
    if (!checked) {
      await locator.check();
    }
  }
}

export async function mustFill(page, selector, value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing value for required field: ${fieldName}`);
  }
  const locator = page.locator(selector).first();
  if (!(await locator.count())) {
    throw new Error(`Selector not found for required field: ${fieldName} (${selector})`);
  }
  await locator.fill(String(value));
}

export async function mustClick(page, selector, fieldName) {
  const locator = page.locator(selector).first();
  if (!(await locator.count())) {
    throw new Error(`Selector not found for required click target: ${fieldName} (${selector})`);
  }
  await locator.click();
}

export async function waitForAnySelector(page, selectors, timeoutMs = 15000) {
  const selectorList = String(selectors)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const selector of selectorList) {
      const count = await page.locator(selector).count().catch(() => 0);
      if (count > 0) {
        return selector;
      }
    }
    await page.waitForTimeout(250);
  }

  return null;
}

export function buildSelectors(selectors = {}) {
  return { ...defaultSelectors, ...selectors };
}

export function getTransferFields(payload = {}) {
  return {
    plate: pick(payload, ['plate', 'matricula', 'licensePlate']),
    postalCode: pick(payload, ['postalCode', 'codigoPostal', 'zipCode']),
    birthDate: pick(payload, ['birthDate', 'dataNascimento']),
    email: pick(payload, ['email']),
    phone: pick(payload, ['phone', 'telefone']),
  };
}

export async function openTransferPage({ page, targetUrl, timeoutMs = 45000 }) {
  page.setDefaultTimeout(timeoutMs);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
}

export async function performLogin({ page, selectors = {}, login, artifactBaseDir }) {
  const mergedSelectors = buildSelectors(selectors);
  const result = {
    attempted: false,
    succeeded: null,
    beforeLoginScreenshot: null,
    afterLoginScreenshot: null,
  };

  if (!login?.required && !(login?.username && login?.password)) {
    return result;
  }

  result.attempted = true;

  if (!login?.username || !login?.password) {
    throw new Error('Login required but credentials are missing.');
  }

  if (artifactBaseDir) {
    result.beforeLoginScreenshot = path.resolve(artifactBaseDir, 'before-login.png');
    await page.screenshot({ path: result.beforeLoginScreenshot, fullPage: true });
  }

  const usernameSelector = await waitForAnySelector(page, mergedSelectors.loginUsername, 20000);
  if (!usernameSelector) {
    throw new Error(`Selector not found for required field: loginUsername (${mergedSelectors.loginUsername})`);
  }
  await mustFill(page, usernameSelector, login.username, 'loginUsername');

  let passwordSelector = await waitForAnySelector(page, mergedSelectors.loginPassword, 3000);
  if (!passwordSelector) {
    await mustClick(page, mergedSelectors.loginSubmit, 'loginSubmit(step1)');
    await page.waitForLoadState('networkidle').catch(() => null);
    passwordSelector = await waitForAnySelector(page, mergedSelectors.loginPassword, 15000);
  }

  if (!passwordSelector) {
    throw new Error(`Selector not found for required field: loginPassword (${mergedSelectors.loginPassword})`);
  }

  await mustFill(page, passwordSelector, login.password, 'loginPassword');
  await mustClick(page, mergedSelectors.loginSubmit, 'loginSubmit(step2)');

  await page.waitForLoadState('networkidle').catch(() => null);
  await page.waitForTimeout(1000).catch(() => null);

  const successUrlIncludes = login?.successUrlIncludes;
  const successSelector = login?.successSelector;

  if (successUrlIncludes) {
    await page
      .waitForURL((url) => url.toString().includes(successUrlIncludes), { timeout: 12000 })
      .catch(() => null);
  }

  if (successSelector) {
    await page
      .locator(successSelector)
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => null);
  }

  result.succeeded =
    (successUrlIncludes ? page.url().includes(successUrlIncludes) : true) &&
    (successSelector ? (await page.locator(successSelector).first().count()) > 0 : true);

  if (artifactBaseDir) {
    result.afterLoginScreenshot = path.resolve(artifactBaseDir, 'after-login.png');
    await page.screenshot({ path: result.afterLoginScreenshot, fullPage: true });
  }

  if (login.required && !result.succeeded) {
    throw new Error('Login attempted but success condition not met.');
  }

  return result;
}

export async function fillTransferForm({ page, payload, selectors = {} }) {
  const mergedSelectors = buildSelectors(selectors);
  const fields = getTransferFields(payload);

  await maybeFill(page, mergedSelectors.plate, fields.plate);
  await maybeFill(page, mergedSelectors.postalCode, fields.postalCode);
  await maybeFill(page, mergedSelectors.birthDate, fields.birthDate);
  await maybeFill(page, mergedSelectors.email, fields.email);
  await maybeFill(page, mergedSelectors.phone, fields.phone);
  await maybeCheck(page, mergedSelectors.consentCheckbox);

  return fields;
}

export async function submitTransferForm({ page, selectors = {}, artifactBaseDir }) {
  const mergedSelectors = buildSelectors(selectors);
  const beforeSubmitScreenshot = artifactBaseDir ? path.resolve(artifactBaseDir, 'before-submit.png') : null;
  const afterSubmitScreenshot = artifactBaseDir ? path.resolve(artifactBaseDir, 'after-submit.png') : null;

  if (beforeSubmitScreenshot) {
    await page.screenshot({ path: beforeSubmitScreenshot, fullPage: true });
  }

  await mustClick(page, mergedSelectors.submitButton, 'submitButton');
  await page.waitForLoadState('networkidle').catch(() => null);

  if (afterSubmitScreenshot) {
    await page.screenshot({ path: afterSubmitScreenshot, fullPage: true });
  }

  return {
    beforeSubmitScreenshot,
    afterSubmitScreenshot,
  };
}

export async function readTransferResult({ page, selectors = {}, artifactBaseDir }) {
  const mergedSelectors = buildSelectors(selectors);
  const htmlDumpPath = artifactBaseDir ? path.resolve(artifactBaseDir, 'result-page.html') : null;

  if (htmlDumpPath) {
    await fs.writeFile(htmlDumpPath, await page.content(), 'utf8');
  }

  const resultLocator = page.locator(mergedSelectors.resultContainer).first();
  const hasResult = (await resultLocator.count()) > 0;
  const resultText = hasResult ? (await resultLocator.textContent())?.trim() ?? null : null;

  return {
    htmlDumpPath,
    hasResult,
    resultText,
  };
}

export async function runTransferJob({
  targetUrl,
  payload,
  selectors = {},
  login,
  headless = true,
  timeoutMs = 45000,
  artifactsDir = path.resolve(process.cwd(), 'artifacts', 'playwright-transfer'),
  jobId = `local-${Date.now()}`,
}) {
  const mergedSelectors = buildSelectors(selectors);
  const startedAt = Date.now();
  const artifactBaseDir = path.resolve(artifactsDir, jobId);
  await ensureDir(artifactBaseDir);

  let browser;
  try {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();

    await openTransferPage({ page, targetUrl, timeoutMs });

    const loginResult = await performLogin({
      page,
      selectors: mergedSelectors,
      login,
      artifactBaseDir,
    });

    await fillTransferForm({
      page,
      payload,
      selectors: mergedSelectors,
    });

    const submitArtifacts = await submitTransferForm({
      page,
      selectors: mergedSelectors,
      artifactBaseDir,
    });

    const result = await readTransferResult({
      page,
      selectors: mergedSelectors,
      artifactBaseDir,
    });

    return {
      ok: true,
      durationMs: Date.now() - startedAt,
      resultText: result.resultText,
      login: {
        attempted: loginResult.attempted,
        succeeded: loginResult.succeeded,
      },
      artifacts: {
        beforeLoginScreenshot: loginResult.beforeLoginScreenshot,
        afterLoginScreenshot: loginResult.afterLoginScreenshot,
        beforeSubmitScreenshot: submitArtifacts.beforeSubmitScreenshot,
        afterSubmitScreenshot: submitArtifacts.afterSubmitScreenshot,
        htmlDumpPath: result.htmlDumpPath,
      },
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
