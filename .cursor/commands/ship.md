# Ship

Prepare Social Agents for GitHub Pages at `https://xgrybvo6508-dot.github.io/social-agents/`. Stop at the first failed step and report it.

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. Confirm built asset URLs, manifest `start_url`/`scope`, navigation, and service worker all respect `/social-agents/`.
6. Confirm offline mode includes starter phrases, TA cards, all manual worksheets, and phrase training.
7. Pipe completed-stop JSON into `.cursor/hooks/secret-scan.sh`; it must return `{}`. Confirm tracked files contain no real `.env*`, private keys, credentials, or settings export.
8. Run read-only **privacy-reviewer** on release changes.

If all steps pass, describe the human release: make a normal commit and normal `git push origin main`; the existing Pages workflow runs `npm ci`, tests, build, uploads `dist`, and deploys. **Do not push unless explicitly asked. Never force-push or use a `+refspec`.**

Report a concise PASS/FAIL checklist and the expected deployment URL.
