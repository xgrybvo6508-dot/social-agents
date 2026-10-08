# AGENTS.md: Social Agents

Social Agents is a static, installable PWA for communication practice and finding adult collaborators/teams. It uses Vite + vanilla strict TypeScript and deploys to GitHub Pages with base `/social-agents/`. All UI copy is simple literal English.

## Owner and privacy

Vladislav Shamanov is 18, in the St. Petersburg area, and openly autistic, ADHD, and twice-exceptional (2e). Identity-first “autistic” is fine. He learns through mind maps, likes minimalism, and prefers direct concrete text, clear expectations, and async communication.

He seeks adult collaborators/cofounders (18–25+) for AI and development projects through international English-language channels. The only public contact is [X @VladislavSsqwl](https://x.com/VladislavSsqwl).

Hard rule: never include email, phone, exact address, school/university name, finances, health details beyond “autistic / ADHD / 2e”, family information, secrets, or keys.

## Product modes

1. Phrase preparation linked to roles and situations; generate or manually write openers/follow-ups and save them.
2. Phrase training through drills/roleplay, brief feedback, and SM-2-like review.
3. Conversation helper: observations, likely wants with uncertainty, direct/warm/brief replies, and what to avoid.
4. “Generate me a task”: extract concrete checklist items and next steps without inventing commitments.
5. Transactional Analysis for one person or a group: ego states, transactions, games/scripts, planning, “voice all voices”, then a saved summary and user decision.

Without a key, every mode has a guided manual worksheet. Starter phrases, TA reference cards, and phrase training work offline.

## Architecture and data

`src/agent` (providers, prompts, strict JSON validation) · `src/memory` (IndexedDB, import/export, phrase SRS) · `src/modes` (mode logic) · `src/content` (offline phrases/cards/worksheets) · `src/ui` (views/CSS) · `src/lib` (pure helpers).

OpenAI-compatible presets:

- Nous Portal: `https://inference-api.nousresearch.com/v1`, model `poolside/laguna-s-2.1:free`
- OpenRouter: `https://openrouter.ai/api/v1`
- Groq: `https://api.groq.com/openai/v1`, model `openai/gpt-oss-120b`
- Custom

Settings and key exist only in localStorage `sa:settings`. People, groups, roles, phrases, sessions, tasks, and TA fixations stay in versioned IndexedDB. JSON export/import excludes settings and keys.

Every model response is strict JSON validated before use. Retry invalid output once, then show a calm error and manual fallback. Render model output as text only, never untrusted `innerHTML`. Prompts are non-diagnostic, consent-respecting, explicit about uncertainty, supportive of autistic directness, and never teach manipulation.

## Rules

| File | Applies | Purpose |
|---|---|---|
| `00-user-context.mdc` | always | owner preferences, public context, hard privacy boundary |
| `10-project-conventions.mdc` | always | stack, layout, IndexedDB, strict TS, tests, scripts |
| `20-prompts-ethics.mdc` | agent/modes/content | prompt safety, consent, JSON schemas, explicit communication |
| `25-ta-content.mdc` | agent/modes/content | accurate, tentative, ethical TA terminology |
| `30-design-system.mdc` | UI/CSS/HTML | dark calm green/purple system, accessibility, responsive behavior |
| `40-security-secrets.mdc` | always | local data, keys, exports, provider errors, CSP |

## Design

Dark `#0e0f13` background, green `#3ddc97` for primary/success, purple `#a78bfa` for AI/agent content. Mobile-first, WCAG AA, keyboard accessible, visible focus, touch targets at least 44px, one primary action per screen, no flashing, reduced-motion support, and no third-party fonts/CDNs/trackers.

## Subagents and commands

Subagents: `prompt-engineer`, `content-writer`, read-only `ta-expert`, `ui-designer`, proactive `tester`, and read-only `privacy-reviewer`.

Commands: `/add-mode`, `/add-phrases`, `/review`, `/ship`.

Required scripts: `npm run dev | build | preview | test | lint | typecheck | format`. Done means typecheck, lint, tests, and build pass.

## Hooks and hard limits

`.cursor/hooks.json` guards shell/read operations, formats eligible edited files, and scans changed files for secret-like strings. Run `bash .cursor/hooks/test-hooks.sh` after hook changes.

Never read secret files, expose keys, touch `~/.hermes`, write outside this repository, add telemetry/CDNs, force-push, or push without the human explicitly asking. Deployment is handled by the existing GitHub Pages workflow; the human deploys.
