import { withSystemCore } from './core';

export const PHRASE_PREPARATION_PROMPT_VERSION = 1 as const;

export const PHRASE_PREPARATION_MODE_V1 =
  'TASK: Draft 3 to 6 short phrases for the supplied adult role, situation, and honest goal. Include useful variety across opener, follow-up, clarification, boundary, invitation, or ending. Every invitation must be easy to decline. Do not fabricate familiarity or claim what the other person thinks. Explain implicit social meaning only as a possibility. Output exactly the phrase-preparation schema.';

export const PHRASE_PREPARATION_SYSTEM_V1 = withSystemCore(PHRASE_PREPARATION_MODE_V1);
