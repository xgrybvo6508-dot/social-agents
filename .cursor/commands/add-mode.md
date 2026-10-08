# Add a mode

Add or extend the Social Agents mode named after the command. If no mode is named, ask which of the five product modes is intended.

1. Read the applicable rules and inspect existing mode, content, memory, UI, and test patterns.
2. Define the offline manual workflow first. It must remain useful with no provider or API key.
3. If AI is useful, use **prompt-engineer** to add a minimal strict JSON contract, runtime validator, tests, and one-retry repair flow. Never render unvalidated output.
4. Implement the mode as small pure logic under `src/modes/`, with thin UI/persistence adapters. Save only after an explicit user action.
5. Use **content-writer** for starter content or worksheets and **ui-designer** for the accessible one-action-at-a-time interface.
6. For TA work, run the read-only **ta-expert**. For personal data, prompts, import/export, or storage, run the read-only **privacy-reviewer**.
7. Run **tester** proactively: typecheck, lint, tests, and build.

Reply with the mode flow, offline behavior, JSON contract if any, persistence changes, and check results.
