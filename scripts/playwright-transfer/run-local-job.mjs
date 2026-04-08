import fs from 'node:fs/promises';
import path from 'node:path';
import { runTransferJob } from './transfer.mjs';

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

async function readJson(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(absolute, 'utf8');
  return JSON.parse(content);
}

const targetUrl = getArg('--url', process.env.TRANSFER_TARGET_URL ?? 'https://myzurich.zurich.com.pt/');
const payloadPath = getArg('--payload', 'scripts/playwright-transfer/sample-job.json');
const selectorsPath = getArg('--selectors', 'scripts/playwright-transfer/selectors.zurich.json');
const headed = process.argv.includes('--headed');
const loginRequired = process.argv.includes('--login-required') || process.env.TRANSFER_LOGIN_REQUIRED === 'true';

const login = {
  required: loginRequired,
  username: getArg('--login-user', process.env.TRANSFER_LOGIN_USERNAME),
  password: getArg('--login-pass', process.env.TRANSFER_LOGIN_PASSWORD),
  successUrlIncludes: getArg('--login-success-url', process.env.TRANSFER_LOGIN_SUCCESS_URL_INCLUDES),
  successSelector: getArg('--login-success-selector', process.env.TRANSFER_LOGIN_SUCCESS_SELECTOR),
};

const payload = await readJson(payloadPath);
const selectors = await readJson(selectorsPath);

const result = await runTransferJob({
  targetUrl,
  payload,
  selectors,
  login,
  headless: !headed,
});

console.log(JSON.stringify(result, null, 2));
if (!result.ok) {
  process.exitCode = 1;
}
