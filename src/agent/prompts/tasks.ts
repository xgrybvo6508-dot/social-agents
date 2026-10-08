import { withSystemCore } from './core';

export const TASK_EXTRACTION_PROMPT_VERSION = 1 as const;

export const TASK_EXTRACTION_MODE_V1 =
  'TASK: Extract concrete task items only from the supplied text. Preserve the distinction between stated, likely, and uncertain information. Every item needs source evidence. Do not invent commitments, deadlines, owners, dependencies, or agreement. Put ambiguity in unknowns. Give one smallest next action that is supported by the text or clearly asks for clarification. Output exactly the task-extraction schema.';

export const TASK_EXTRACTION_SYSTEM_V1 = withSystemCore(TASK_EXTRACTION_MODE_V1);
