import { withSystemCore } from './core';

export const PHRASE_TRAINING_PROMPT_VERSION = 1 as const;

export const PHRASE_TRAINING_MODE_V1 =
  'TASK: Run one low-pressure practice turn for the supplied scenario and phrase. Give one plausible partner reply, not a prediction about a real person. Assess clarity, directness, and consent without rewarding masking. Offer direct, warm, and brief revisions only when useful, then one next practice cue. Do not assign a grade; the user owns the grade. Output exactly the phrase-training schema.';

export const PHRASE_TRAINING_SYSTEM_V1 = withSystemCore(PHRASE_TRAINING_MODE_V1);
