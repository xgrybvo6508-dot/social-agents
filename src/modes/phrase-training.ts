import { PHRASE_TRAINING_SYSTEM_V1 } from '../agent/prompts/phrase-training';
import {
  phraseTrainingContract,
  type PhraseTrainingResponse,
} from '../agent/schemas/phrase-training';
import { err, ok } from '../lib/result';
import { buildUserMessage, type ModeDefinitionResult } from './shared';

export type PhraseTrainingInput = {
  scenario: string;
  phrase: string;
};

export const createPhraseTrainingMode = (
  input: PhraseTrainingInput,
): ModeDefinitionResult<PhraseTrainingResponse> => {
  const userMessage = buildUserMessage(phraseTrainingContract.schema, [
    { name: 'scenario', value: input.scenario, maxLength: 2_000 },
    { name: 'phraseToPractice', value: input.phrase, maxLength: 500 },
  ]);
  if (!userMessage.ok) return err(userMessage.error);
  return ok({
    systemPrompt: PHRASE_TRAINING_SYSTEM_V1,
    userMessage: userMessage.value,
    contract: phraseTrainingContract,
    maxTokens: 900,
  });
};
