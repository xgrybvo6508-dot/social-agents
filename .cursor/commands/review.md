# Review

Review current changes, or the area named after the command, for correctness, ethics, privacy, and design.

1. Inspect the diff and applicable rules. Do not expand into unrelated cleanup.
2. Run **tester** proactively. Add missing deterministic tests, then run typecheck, lint, tests, and build.
3. Run **ui-designer** for changed UI/CSS/HTML.
4. Run read-only **ta-expert** for TA prompts/content/workflows.
5. Run read-only **privacy-reviewer** for settings, network, storage, import/export, prompts, fixtures, docs, and owner/third-party data.
6. Fix clear findings within scope, then repeat affected checks until green.

Summarize what was checked, what was fixed, PASS/FAIL results, and only the remaining decisions that require Vladislav.
