import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const defaultSelectors = {
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

async function maybeFill(page, selector, value) {
  if (!selector || value === undefined) return;
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    await locator.fill(value);
  }
}

async function maybeCheck(page, selector) {
  if (!selector) return;
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    const checked = await locator.isChecked().catch(() => false);
    if (!checked) {
      await locator.check();
    }
  }
}

async function mustFill(page, selector, value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing value for required field: ${fieldName}`);
  }
  const locator = page.locator(selector).first();
  if (!(await locator.count())) {
    throw new Error(`Selector not found for required field: ${fieldName} (${selector})`);
  }
  await locator.fill(String(value));
}

async function mustClick(page, selector, fieldName) {
  const locator = page.locator(selector).first();
  if (!(await locator.count())) {
    throw new Error(`Selector not found for required click target: ${fieldName} (${selector})`);
  }
  await locator.click();
}

async function waitForAnySelector(page, selectors, timeoutMs = 15000) {
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
  const mergedSelectors = { ...defaultSelectors, ...selectors };
  const startedAt = Date.now();
  const artifactBaseDir = path.resolve(artifactsDir, jobId);
  await ensureDir(artifactBaseDir);

  let browser;
  try {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    let loginAttempted = false;
    let loginSucceeded = null;
    let beforeLoginScreenshot = null;
    let afterLoginScreenshot = null;

    if (login?.required || (login?.username && login?.password)) {
      loginAttempted = true;

      if (!login?.username || !login?.password) {
        throw new Error('Login required but credentials are missing.');
      }

      beforeLoginScreenshot = path.resolve(artifactBaseDir, 'before-login.png');
      await page.screenshot({ path: beforeLoginScreenshot, fullPage: true });

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

      loginSucceeded =
        (successUrlIncludes ? page.url().includes(successUrlIncludes) : true) &&
        (successSelector ? (await page.locator(successSelector).first().count()) > 0 : true);

      afterLoginScreenshot = path.resolve(artifactBaseDir, 'after-login.png');
      await page.screenshot({ path: afterLoginScreenshot, fullPage: true });

      if (login.required && !loginSucceeded) {
        throw new Error('Login attempted but success condition not met.');
      }
    }

    const plate = pick(payload, ['plate', 'matricula', 'licensePlate']);
    const postalCode = pick(payload, ['postalCode', 'codigoPostal', 'zipCode']);
    const birthDate = pick(payload, ['birthDate', 'dataNascimento']);
    const email = pick(payload, ['email']);
    const phone = pick(payload, ['phone', 'telefone']);

    await maybeFill(page, mergedSelectors.plate, plate);
    await maybeFill(page, mergedSelectors.postalCode, postalCode);
    await maybeFill(page, mergedSelectors.birthDate, birthDate);
    await maybeFill(page, mergedSelectors.email, email);
    await maybeFill(page, mergedSelectors.phone, phone);
    await maybeCheck(page, mergedSelectors.consentCheckbox);

    const beforeSubmitScreenshot = path.resolve(artifactBaseDir, 'before-submit.png');
    await page.screenshot({ path: beforeSubmitScreenshot, fullPage: true });

    await mustClick(page, mergedSelectors.submitButton, 'submitButton');
    await page.waitForLoadState('networkidle').catch(() => null);

    const afterSubmitScreenshot = path.resolve(artifactBaseDir, 'after-submit.png');
    await page.screenshot({ path: afterSubmitScreenshot, fullPage: true });

    const htmlDumpPath = path.resolve(artifactBaseDir, 'result-page.html');
    await fs.writeFile(htmlDumpPath, await page.content(), 'utf8');

    let resultText = null;
    const resultLocator = page.locator(mergedSelectors.resultContainer).first();
    if (await resultLocator.count()) {
      resultText = (await resultLocator.textContent())?.trim() ?? null;
    }

    return {
      ok: true,
      durationMs: Date.now() - startedAt,
      resultText,
      login: {
        attempted: loginAttempted,
        succeeded: loginSucceeded,
      },
      artifacts: {
        beforeLoginScreenshot,
        afterLoginScreenshot,
        beforeSubmitScreenshot,
        afterSubmitScreenshot,
        htmlDumpPath,
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
