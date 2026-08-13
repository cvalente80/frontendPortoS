# Developer Manual — frontendAS

## 1) Project overview
React 19 + Vite + Tailwind app for insurance simulations, with Firebase (Auth/Firestore/Storage), real-time chat, and i18n PT/EN.

## 2) Prerequisites
- Node.js 20+
- npm
- Firebase project credentials
- (Optional) GitHub Actions secrets for CI workflows

## 3) Local setup
1. Clone repository
2. Install dependencies:
   - Root: `npm install`
   - Functions: `cd functions && npm install`
3. Configure environment variables (see `.env.example` if available)
4. Start app:
   - `npm run dev`
   - Preferred port is `5175` (`strictPort: false`)

## 4) Routing and i18n
- Main language route pattern: `/:lang(pt|en)/*`
- `/` redirects to `/pt`
- i18n config: `src/i18n.ts`
- For links, preserve language prefix using `withLang()` from `src/utils/lang.ts`
- GitHub Pages base path support must be respected

## 5) App architecture
- Shared UI: `src/components/*`
- Pages: `src/pages/*`
- Branding by hostname in `src/App.tsx` (`aurelio`, `sintra`, `pombal`, etc.)

## 6) Firebase conventions
- Always import Firebase singletons from `src/firebase.ts`
- Auth merge logic is in `src/context/AuthContext.tsx`
- Do **not** write `isAdmin` in AuthContext
- Admin detection:
  1. Prefer `admins/{uid}`
  2. Fallback `users/{uid}.isAdmin`

## 7) Chat model
- Chat doc: `chats/{chatId}` where `chatId === userId`
- Messages: `chats/{chatId}/messages/*`
- Metadata fields: `lastMessageAt`, `lastMessagePreview`, unread flags, typing fields, `firstNotified`
- First-contact notification uses EmailJS + atomic transaction
- EmailJS IDs must stay centralized in `src/emailjs.config.ts`

## 8) Simulations
- Save at `users/{uid}/simulations/*`
- Use `saveSimulation(uid, data, { idempotencyKey })` from `src/utils/simulations.ts`

## 9) Scripts and workflows
- Dev: `npm run dev`
- Local build+preview: `npm run build && npm run preview` (open `/<lang>`)
- GitHub Pages build: `npm run build:gh` (open `/frontendAS/<lang>`)
- Firestore rules tests:
  - `npm run test:rules`
  - `npm run emulators:test:rules`

## 10) Security rules status
- `firestore.rules`: temporary allow-all fallback until `2026-12-31`
- `storage.rules`: temporary authenticated PDF writes
- If rules are tightened, update `tests/chat-rules-test.mjs`

## 11) CI/CD
- Workflow example: `.github/workflows/agenda.yml`
- `workflow_dispatch` inputs:
  - `region`
  - `source_url`
  - `month_key`
- Required secrets:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `FIREBASE_SERVICE_ACCOUNT_JSON`

## 12) Feature development checklist
For each new feature:
1. Define route and language behavior
2. Add/adjust Firestore data model
3. Validate Auth/admin constraints
4. Add tests (rules/unit where relevant)
5. Update this manual + changelog

## 13) PR checklist
- [ ] Works in PT and EN
- [ ] Language prefix preserved in navigation
- [ ] Uses Firebase singleton import pattern
- [ ] No hardcoded EmailJS IDs outside config
- [ ] Rules/tests updated if data access changed
- [ ] Manual updated


<!-- ...existing code... -->

## 14) Environment variables (example checklist)
Create `.env.local` (frontend) and set project values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

For `functions/.env` (if used locally), keep server-only secrets there and never expose them in `VITE_*`.

## 15) Suggested folder map
- `src/components/` → reusable UI
- `src/pages/` → route-level pages
- `src/context/` → app contexts (auth/session)
- `src/lib/` → domain modules (chat, etc.)
- `src/utils/` → pure helpers (lang, simulations)
- `functions/` → Firebase/Node backend logic
- `tests/` → rules and integration harness

## 16) How to add a new feature (standard flow)
1. Create branch: `git checkout -b feat/<short-name>`
2. Add page/component with `/:lang(pt|en)` compatibility
3. Use `withLang()` for all internal links
4. If data is needed, define Firestore shape and access rules impact
5. Add/update tests
6. Run:
   - `npm run dev`
   - `npm run build`
   - `npm run test:rules` (if DB/rules touched)
7. Update this manual
8. Open PR with screenshots + test notes

## 17) Troubleshooting quick guide
- **Blank page on GH Pages**: confirm `npm run build:gh` and route includes `/frontendAS/<lang>`.
- **Wrong language on refresh**: verify `src/i18n.ts` path detector and `BASE_URL` handling.
- **Firebase errors**: check `.env.local` keys and singleton imports from `src/firebase.ts`.
- **Chat first-contact email not sent**: verify EmailJS IDs in `src/emailjs.config.ts` and `firstNotified` transaction flow.

## 18) Release/rollback notes
- Merge to main only after green checks.
- Tag releases: `git tag vX.Y.Z && git push --tags`.
- If regression appears, rollback by reverting merge commit and redeploy.
- Always document behavior changes in manual + changelog.

## 19) Playwright testing — simulation flow

### Setup
1. Install Playwright (if not already):
   ```bash
   npm install -D @playwright/test
   ```
2. Create test file: `tests/e2e/simulation.spec.ts`

### Simulation flow test example
This covers: auth → navigate to simulation → fill form → save → verify Firestore.

````typescript
// filepath: tests/e2e/simulation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Simulation flow', () => {
  const baseUrl = 'http://localhost:5175'; // adjust if needed
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Start app
    await page.goto(`${baseUrl}/pt`);
  });

  test('should login, create simulation, and save to Firestore', async ({ page }) => {
    // 1. Navigate to login
    await page.click('a:has-text("Login")'); // or use withLang() link
    await expect(page).toHaveURL(/\/pt\/login/);

    // 2. Fill login form
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', testUserPassword);
    await page.click('button:has-text("Entrar")'); // PT: "Entrar"

    // 3. Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/pt\/dashboard/);
    await expect(page.locator('text=Bem-vindo')).toBeVisible();

    // 4. Navigate to simulations
    await page.click('a:has-text("Simulação")'); // or exact path
    await expect(page).toHaveURL(/\/pt\/simulation/);

    // 5. Fill simulation form
    await page.fill('input[name="insuranceType"]', 'Auto');
    await page.fill('input[name="coverage"]', '500000');
    await page.fill('input[name="deductible"]', '250');

    // 6. Submit form
    await page.click('button:has-text("Guardar Simulação")');

    // 7. Verify success message or redirect
    await expect(page.locator('text=Simulação guardada')).toBeVisible();

    // 8. (Optional) Check Firestore via admin SDK in separate test
    // This requires Firebase Admin setup in test harness
  });

  test('should preserve language in simulation navigation', async ({ page }) => {
    // Simulate in PT
    await page.goto(`${baseUrl}/pt/simulation`);
    await page.fill('input[name="insuranceType"]', 'Auto');
    await page.click('a:has-text("Voltar")'); // should stay in /pt/...

    await expect(page).toHaveURL(/\/pt\//);
    await expect(page).not.toHaveURL(/\/en\//);
  });

  test('should work in EN language', async ({ page }) => {
    // Same flow but in English
    await page.goto(`${baseUrl}/en/simulation`);
    await page.fill('input[name="insuranceType"]', 'Auto');
    await page.fill('input[name="coverage"]', '500000');
    await page.click('button:has-text("Save Simulation")');

    await expect(page.locator('text=Simulation saved')).toBeVisible();
  });
});
````