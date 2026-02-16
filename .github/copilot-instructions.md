<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions — Ansião Seguros Template

Template React + Vite + Tailwind focado em simulações de seguros, com Firebase (Auth/Firestore/Storage), chat em tempo real e i18n PT/EN.

## Big picture (como está organizado)
- Rotas com idioma: `/:lang(pt|en)/*` e `/` redireciona para `/pt`.
- Páginas em `src/pages/*` e UI partilhada em `src/components/*` (ex.: `Header`, `Seo`, `ChatWidget`).
- i18n em `src/i18n.ts` com `defaultNS: 'common'` e `ns: [...]`; o detector usa `path` e ajusta `lookupFromPathIndex` com `import.meta.env.BASE_URL` (para funcionar em GH Pages com `/frontendAS/`).

## Workflows (scripts reais)
- Dev: `npm run dev` (Vite tenta `5175`, `strictPort: false`, e faz auto-open).
- Build local: `npm run build` (faz `vite build --mode devlocal`, corre `scripts/prerender-kristina-og.mjs` e copia `dist/index.html` → `dist/404.html`). Preview: `npm run preview` e abrir `/<lang>`.
- GitHub Pages: `npm run build:gh` (modo `gh`, `base: '/frontendAS/'`). Preview: abrir `/frontendAS/<lang>`.
- Rules Firestore: `npm run test:rules` ou `npm run emulators:test:rules`.

## Firebase/Auth (convenções)
- Importar singletons sempre de `src/firebase.ts` (não inicializar Firebase noutros ficheiros).
- `src/context/AuthContext.tsx` faz merge de `users/{uid}` com dados básicos; não escrever `isAdmin` aqui.
- Admin: preferir `admins/{uid}` (doc vazio basta); fallback `users/{uid}.isAdmin`.

## Chat (modelo e notificações)
- Modelo: `chats/{chatId}` onde `chatId === userId`, com `messages` em `chats/{chatId}/messages/*`.
- Metadados no chat: `lastMessageAt`, `lastMessagePreview`, `unreadForAdmin/unreadForUser`, typing (`typingUser|Admin` + `typingUserAt|AdminAt`), `firstNotified`.
- Primeiro contacto: em `src/lib/chat.ts`, o cliente faz flip atómico de `firstNotified` via `runTransaction` e envia EmailJS; existe também Cloud Function `notifyOnFirstUserMessage` (ver `functions/README.md`).

## Simulações
- Guardar em `users/{uid}/simulations/*` via `src/utils/simulations.ts` (`saveSimulation`) com `opts.idempotencyKey` para upsert/idempotência.

## Pontos de referência
- `src/lib/chat.ts`, `src/context/AuthContext.tsx`, `src/utils/simulations.ts`, `src/i18n.ts`, `vite.config.js`, `firestore.rules`, `functions/src/index.ts`.
