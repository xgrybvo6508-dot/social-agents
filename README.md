# Social Agents

Static, installable PWA for communication practice and finding adult project collaborators. All UI copy is simple literal English. Memory stays in IndexedDB on this device; API keys stay in `localStorage` under `sa:settings` only.

## Scripts

- `npm run dev` — local development server
- `npm run build` — typecheck and production build (`dist/`, base `/social-agents/`)
- `npm run preview` — serve the production build locally
- `npm test` — Vitest
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run format` — Prettier

## Modes

1. Prepare phrases — starter bank, worksheet, or agent
2. Train phrases — spaced repetition and optional agent feedback
3. Conversation helper — facts vs guesses and reply drafts
4. Task extraction — evidence-linked checklist items
5. Transactional Analysis — tentative lens, user-owned decision

Without an API key, starter phrases, TA cards, worksheets, and phrase training still work offline.

## Deployment

GitHub Pages workflow builds and deploys from `main`. Public URL path: `/social-agents/`.

## Privacy

JSON export includes memory only — never settings or API keys. Do not put private contact details in shared exports.
