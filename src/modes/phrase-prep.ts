import { PHRASE_PREPARATION_SYSTEM_V1 } from '../agent/prompts/phrase-prep';
import {
  phrasePreparationContract,
  type PhrasePreparationResponse,
} from '../agent/schemas/phrase-prep';
import { err, ok } from '../lib/result';
import { buildUserMessage, type ModeDefinitionResult } from './shared';

export type PhrasePreparationInput = {
  role: string;
  situation: string;
  goal: string;
};

export const createPhrasePreparationMode = (
  input: PhrasePreparationInput,
): ModeDefinitionResult<PhrasePreparationResponse> => {
  const userMessage = buildUserMessage(phrasePreparationContract.schema, [
    { name: 'adultRole', value: input.role, maxLength: 160 },
    { name: 'situation', value: input.situation, maxLength: 2_000 },
    { name: 'honestGoal', value: input.goal, maxLength: 1_000 },
  ]);
  if (!userMessage.ok) return err(userMessage.error);
  return ok({
    systemPrompt: PHRASE_PREPARATION_SYSTEM_V1,
    userMessage: userMessage.value,
    contract: phrasePreparationContract,
    maxTokens: 1_000,
  });
};
