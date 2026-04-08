# Playwright Transfer (Simulação Auto)

Este fluxo permite reutilizar os dados da simulação em `/:lang/simulacao-auto` para iniciar uma nova simulação num site externo, de forma assíncrona e robusta.

Target atual por omissão: `https://myzurich.zurich.com.pt/`.

## Arquitetura recomendada

1. Frontend cria job em `simulationTransferJobs` com `status=queued`.
2. Worker Node + Playwright lê jobs pendentes.
3. Worker preenche formulário no site destino e submete.
4. Worker grava `status=done|failed` + `result` no job.

## Ficheiros adicionados

- `src/utils/simulationTransferJobs.ts`: enfileira job no Firestore.
- `scripts/playwright-transfer/transfer.mjs`: automação Playwright.
- `scripts/playwright-transfer/worker.mjs`: worker que processa fila.
- `scripts/playwright-transfer/run-local-job.mjs`: runner local.
- `scripts/playwright-transfer/sample-job.json`: payload de exemplo.
- `scripts/playwright-transfer/selectors.example.json`: mapeamento de seletores.
- `scripts/playwright-transfer/selectors.zurich.json`: base inicial de seletores para Zurich.
- `scripts/playwright-transfer/demo-form.html`: página local para teste.

## Variáveis de ambiente (worker)

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON completo em string) ou ADC
- `TRANSFER_TARGET_URL` (fallback se job não incluir `targetUrl`)
- `TRANSFER_JOBS_COLLECTION` (default: `simulationTransferJobs`)
- `TRANSFER_POLL_INTERVAL_MS` (default: `5000`)
- `TRANSFER_TIMEOUT_MS` (default: `45000`)
- `TRANSFER_HEADLESS` (`true`/`false`)
- `TRANSFER_LOGIN_REQUIRED` (`true`/`false`)
- `TRANSFER_LOGIN_USERNAME`
- `TRANSFER_LOGIN_PASSWORD`
- `TRANSFER_LOGIN_SUCCESS_URL_INCLUDES` (opcional)
- `TRANSFER_LOGIN_SUCCESS_SELECTOR` (opcional)

## Execução local

1. Instalar dependências e browser:
   - `npm install`
   - `npm run pw:install`
2. Teste rápido em página local:
   - `npm run pw:transfer:local -- --url file://$PWD/scripts/playwright-transfer/demo-form.html`
3. Teste rápido contra Zurich (exige ajuste de seletores):
   - `npm run pw:transfer:local -- --url https://myzurich.zurich.com.pt/ --selectors scripts/playwright-transfer/selectors.zurich.json`
4. Teste com login (credenciais de sandbox):
   - `TRANSFER_LOGIN_REQUIRED=true TRANSFER_LOGIN_USERNAME='utilizador' TRANSFER_LOGIN_PASSWORD='password' npm run pw:transfer:local -- --url https://myzurich.zurich.com.pt/ --selectors scripts/playwright-transfer/selectors.zurich.json --login-success-url /myzurich/`
5. Processar um job real no Firestore (uma vez):
   - `npm run pw:transfer:worker`

## Secrets (recomendado)

1. Copiar o template local:
   - `cp .env.playwright.local.example .env.playwright.local`
2. Preencher:
   - `TRANSFER_LOGIN_USERNAME`
   - `TRANSFER_LOGIN_PASSWORD`
3. Executar com secrets locais:
   - `npm run pw:transfer:local:secrets -- --url https://myzurich.zurich.com.pt/ --selectors scripts/playwright-transfer/selectors.zurich.json --login-required`
   - `npm run pw:transfer:worker:secrets`

` .env.playwright.local` está ignorado no Git e não deve ser comitado.

## GitHub Actions Secrets

No repositório, em `Settings > Secrets and variables > Actions`, criar:

- `TRANSFER_LOGIN_REQUIRED`
- `TRANSFER_LOGIN_USERNAME`
- `TRANSFER_LOGIN_PASSWORD`
- `TRANSFER_LOGIN_SUCCESS_URL_INCLUDES`
- `TRANSFER_TARGET_URL`

## Integração no frontend

Após a submissão em `simulacao-auto`, chamar `enqueueSimulationTransferJob(...)` com:

- `uid`
- `simulationType: 'auto'`
- `idempotencyKey`
- `payload` com os campos de entrada
- `targetUrl` (opcional, pode vir do backend)
- `selectors` (opcional)

## Notas importantes

- Nunca executar Playwright no browser React.
- Não guardar credenciais do site destino em `VITE_*`.
- Use retries e backoff no worker para reduzir falhas transitórias.
