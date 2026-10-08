# Add starter phrases

Add privacy-safe offline phrases for the role, situation, or category given after the command. If none is given, choose an underrepresented built-in role and state the choice.

1. Use **content-writer** and follow `00-user-context.mdc` plus `20-prompts-ethics.mdc`.
2. Inspect existing ids and schemas. Add a balanced set of openers, follow-ups, clarification, boundaries, and graceful endings where relevant.
3. Keep every phrase short, literal, honest, adult, project-focused, and easy to decline. Directness is valid. Add a brief explicit note when social context may otherwise be implicit.
4. Do not include persuasion tricks, fabricated familiarity, diagnoses, private details, real contact data, or claims about what another person thinks.
5. Connect phrases to roles/situations and initialize valid SM-2-like metadata without marking them reviewed.
6. Add or update content validation tests, then run typecheck, lint, tests, and build.

Report categories and ids added, coverage improved, and check results.
