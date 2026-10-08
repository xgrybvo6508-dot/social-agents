import { withSystemCore } from './core';

export const CONVERSATION_HELPER_PROMPT_VERSION = 1 as const;

export const CONVERSATION_HELPER_MODE_V1 =
  'TASK: Help understand the supplied conversation excerpt. Quote or closely paraphrase observable evidence first. Offer likely wants only as uncertain possibilities, include ordinary alternatives and what remains unknown. Write exactly three reply options labelled direct, warm, and brief. State patterns to avoid without shaming. Do not infer diagnosis, identity, relationship, hidden intent, or private facts. Output exactly the conversation-helper schema.';

export const CONVERSATION_HELPER_SYSTEM_V1 = withSystemCore(CONVERSATION_HELPER_MODE_V1);
