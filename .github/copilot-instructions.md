<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

# Copilot Instructions — frontendAS (Ansião Seguros)

App React 19 + Vite + Tailwind para simulações de seguros, com Firebase (Auth/Firestore/Storage), chat em tempo real e i18n PT/EN.

## Arquitetura (o que desbloqueia produtividade)
- Rotas com idioma: `/:lang(pt|en)/*`; `/` redireciona para `/pt` (`src/App.tsx`).
- UI partilhada em `src/components/*`; páginas em `src/pages/*`.
- Branding “multi-site” é decidido por `window.location.hostname` (ex.: `aurelio`, `sintra`, `pombal`, etc.) dentro de `src/App.tsx`.

## i18n + links
- i18n está em `src/i18n.ts` (detetor por `path` + ajuste para `import.meta.env.BASE_URL`, necessário em GH Pages).
- Ao criar links, preserve o prefixo de idioma (`src/utils/lang.ts` `withLang()` é a helper preferida).

## Workflows (scripts são a fonte de verdade)
- Dev: `npm run dev` (porta preferida `5175`, `strictPort: false`, auto-open).
- Build local/preview: `npm run build && npm run preview` → abrir `/<lang>` (modo `devlocal`, `base: '/'`).
- GitHub Pages: `npm run build:gh` → abrir `/frontendAS/<lang>` (modo `gh`, `base: '/frontendAS/'`).
- Firestore rules tests: `npm run test:rules` ou `npm run emulators:test:rules` (`tests/chat-rules-test.mjs`).

## Firebase/Auth (convenções do projeto)
- Não inicializar Firebase fora do módulo singleton: importar sempre de `src/firebase.ts` (re-exporta singletons definidos em `/typescript.ts`).
- `src/context/AuthContext.tsx` faz “merge” de `users/{uid}` com dados básicos; **não** escrever `isAdmin` aqui.
- Admin: preferir `admins/{uid}` (doc vazio basta); fallback `users/{uid}.isAdmin`.

## Chat (modelo + notificações)
- Modelo: `chats/{chatId}` onde `chatId === userId`; mensagens em `chats/{chatId}/messages/*` (`src/lib/chat.ts`, `src/components/ChatWidget.tsx`).
- Metadados: `lastMessageAt`, `lastMessagePreview`, `unreadForAdmin/unreadForUser`, typing (`typingUser|Admin` + `typing*At`), `firstNotified`.
- “Primeiro contacto” notifica via EmailJS no cliente (flip atómico de `firstNotified` com `runTransaction`). Também existe Cloud Function `notifyOnFirstUserMessage` (`functions/README.md`).
- IDs EmailJS estão centralizados em `src/emailjs.config.ts` (não espalhar strings pelos componentes).

## Simulações
- Guardar em `users/{uid}/simulations/*` via `saveSimulation(uid, data, { idempotencyKey })` para upsert/idempotência (`src/utils/simulations.ts`).

## Regras (estado atual)
- `firestore.rules` tem um fallback temporário allow-all até `2026-12-31`; `storage.rules` permite writes de PDFs por utilizadores autenticados (temporário). Se endurecer rules, atualizar o harness em `tests/chat-rules-test.mjs`.
