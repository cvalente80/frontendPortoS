import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { Given, Then, When } from '@cucumber/cucumber';

function runNodeCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function extractLastJsonBlock(output) {
  const lines = output.split(/\r?\n/).filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const slice = lines.slice(index).join('\n');
    try {
      return JSON.parse(slice);
    } catch {
    }
  }

  return null;
}

Given('que tenho um payload real Zurich em {string}', async function (relativePath) {
  this.zurichPayloadPath = relativePath;
  const absolutePath = this.resolvePath(relativePath);
  const content = await fs.readFile(absolutePath, 'utf8');
  this.zurichPayload = JSON.parse(content);
});

Given('que defini o checkpoint Zurich {string}', function (checkpoint) {
  this.zurichCheckpoint = checkpoint;
});

Given('que a verificação Zurich usa o último código recebido por email', function () {
  this.zurichUseEmailVerification = true;
});

When('executo a automação Zurich real em modo {string}', async function (mode) {
  assert.ok(this.zurichPayloadPath, 'Falta definir o payload Zurich.');
  assert.ok(this.zurichCheckpoint, 'Falta definir o checkpoint Zurich.');

  const stdoutPath = this.artifactDir ? path.join(this.artifactDir, 'zurich-live.stdout.log') : null;
  const stderrPath = this.artifactDir ? path.join(this.artifactDir, 'zurich-live.stderr.log') : null;
  const debugPath = this.artifactDir ? path.join(this.artifactDir, 'zurich-live.debug.json') : null;

  if (mode === 'dry') {
    this.zurichRun = {
      mode,
      simulated: true,
      result: {
        ok: true,
        dryRun: true,
      },
      meta: {
        simulationSourcePreference: 'payload-file',
        simulationSourcePath: `file:${this.resolvePath(this.zurichPayloadPath)}`,
        simulationPayloadSample: {
          matricula: this.zurichPayload?.matricula ?? null,
          codigoPostal: this.zurichPayload?.codigoPostal ?? null,
          marca: this.zurichPayload?.marca ?? null,
          modelo: this.zurichPayload?.modelo ?? null,
          ano: this.zurichPayload?.ano ?? null,
          tipoSeguro: this.zurichPayload?.tipoSeguro ?? null,
        },
      },
      diagnostics: {
        stdoutPath,
        stderrPath,
        debugPath,
      },
    };

    if (debugPath) {
      await fs.writeFile(debugPath, JSON.stringify(this.zurichRun, null, 2), 'utf8');
    }
    return;
  }

  const args = [
    '--env-file=.env.local',
    '--env-file=.env.playwright.local',
    'scripts/playwright-transfer/navigate-zurich-auto.mjs',
  ];

  const env = {
    ...process.env,
    TRANSFER_SIMULATION_PAYLOAD_FILE: this.zurichPayloadPath,
    TRANSFER_FINAL_STEP_ACTIONS: this.zurichCheckpoint,
    TRANSFER_SOURCE_PREFERENCE: 'payload-file',
    ...(this.zurichUseEmailVerification ? { TRANSFER_EMAIL_VERIFICATION_ENABLED: 'true' } : {}),
  };

  const execution = await runNodeCommand(args, {
    cwd: this.workspaceRoot,
    env,
  });

  if (stdoutPath) {
    await fs.writeFile(stdoutPath, execution.stdout || '', 'utf8');
  }

  if (stderrPath) {
    await fs.writeFile(stderrPath, execution.stderr || '', 'utf8');
  }

  const result = extractLastJsonBlock(execution.stdout);
  assert.ok(result, `Não consegui extrair JSON da execução Zurich.\nSTDERR:\n${execution.stderr}`);

  const metaPath = result?.dir ? path.join(result.dir, 'meta.json') : null;
  const meta = metaPath ? JSON.parse(await fs.readFile(metaPath, 'utf8')) : null;

  this.zurichRun = {
    mode,
    simulated: false,
    execution,
    result,
    meta,
    diagnostics: {
      stdoutPath,
      stderrPath,
      debugPath,
    },
  };

  if (debugPath) {
    await fs.writeFile(debugPath, JSON.stringify(this.zurichRun, null, 2), 'utf8');
  }
});

Then('o resultado Zurich deve estar consistente com o checkpoint', function () {
  assert.ok(this.zurichRun, 'A automação Zurich ainda não foi executada.');

  if (this.zurichRun.mode === 'dry') {
    assert.equal(this.zurichRun.result.ok, true);
    assert.equal(this.zurichRun.result.dryRun, true);
    return;
  }

  assert.equal(this.zurichRun.result.ok, true, `A execução real Zurich devolveu erro: ${this.zurichRun.result.error || 'desconhecido'}`);
  assert.equal(typeof this.zurichRun.result.ok, 'boolean');
  assert.ok(this.zurichRun.result.dir, 'A execução real não devolveu diretório de artefactos.');
});

Then('o meta Zurich deve conter o passo {string}', function (metaStep) {
  assert.ok(this.zurichRun, 'A automação Zurich ainda não foi executada.');

  const meta = this.zurichRun.meta;
  assert.ok(meta, 'O meta Zurich não está disponível.');
  assert.ok(metaStep in meta, `O meta Zurich não contém a chave ${metaStep}.`);
});