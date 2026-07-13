import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { After, Before, setDefaultTimeout, setWorldConstructor } from '@cucumber/cucumber';
import { chromium } from 'playwright';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));

setDefaultTimeout(10 * 60 * 1000);

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

class TransferWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.payload = null;
    this.result = null;
    this.targetUrl = null;
    this.artifactDir = null;
    this.workspaceRoot = workspaceRoot;
  }

  resolvePath(relativePath) {
    return path.resolve(this.workspaceRoot, relativePath);
  }

  async readJson(relativePath) {
    const content = await fs.readFile(this.resolvePath(relativePath), 'utf8');
    return JSON.parse(content);
  }
}

setWorldConstructor(TransferWorld);

Before(async function ({ pickle }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scenarioSlug = slugify(pickle.name);
  this.artifactDir = this.resolvePath(`artifacts/playwright-bdd/${stamp}-${scenarioSlug}`);
  await fs.mkdir(this.artifactDir, { recursive: true });

  const headless = process.env.PW_HEADLESS !== 'false';
  this.browser = await chromium.launch({ headless });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function ({ result }) {
  if (result?.status === 'FAILED' && this.page && this.artifactDir) {
    const screenshotPath = path.join(this.artifactDir, 'failed-step.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
  }

  await this.context?.close().catch(() => null);
  await this.browser?.close().catch(() => null);
});
