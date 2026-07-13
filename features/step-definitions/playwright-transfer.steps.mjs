import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  fillTransferForm,
  openTransferPage,
  readTransferResult,
  submitTransferForm,
} from '../../scripts/playwright-transfer/transfer.mjs';

Given('que abro a demo local de transferência', async function () {
  const fileUrl = pathToFileURL(this.resolvePath('scripts/playwright-transfer/demo-form.html')).href;
  this.targetUrl = fileUrl;
  await openTransferPage({
    page: this.page,
    targetUrl: this.targetUrl,
  });
});

Given('que carrego o payload de exemplo da transferência', async function () {
  this.payload = await this.readJson('scripts/playwright-transfer/sample-job.json');
});

When('preencho o formulário de transferência com o payload', async function () {
  assert.ok(this.page, 'A página Playwright não foi inicializada.');
  assert.ok(this.payload, 'O payload de exemplo ainda não foi carregado.');

  await fillTransferForm({
    page: this.page,
    payload: this.payload,
  });
});

When('submeto o formulário de transferência', async function () {
  assert.ok(this.page, 'A página Playwright não foi inicializada.');

  await submitTransferForm({
    page: this.page,
    artifactBaseDir: this.artifactDir,
  });
});

Then('devo ver o contentor de resultado da simulação', async function () {
  assert.ok(this.page, 'A página Playwright não foi inicializada.');

  this.result = await readTransferResult({
    page: this.page,
    artifactBaseDir: this.artifactDir,
  });

  assert.equal(this.result.hasResult, true, 'O contentor de resultado não ficou visível.');
});

Then('o texto de resultado deve conter {string}', async function (expectedText) {
  if (!this.result) {
    this.result = await readTransferResult({
      page: this.page,
      artifactBaseDir: this.artifactDir,
    });
  }

  assert.ok(this.result.resultText, 'O resultado não contém texto.');
  assert.match(this.result.resultText, new RegExp(expectedText, 'i'));
});
