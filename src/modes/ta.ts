import { TA_SYSTEM_V1 } from '../agent/prompts/ta';
import { taContract, type TaResponse } from '../agent/schemas/ta';
import { err, ok } from '../lib/result';
import { buildUserMessage, type ModeDefinitionResult } from './shared';

export type TaInput = {
  scope: 'person' | 'group';
  purpose: string;
  observations: string;
  wantsAndBoundaries: string;
};

export const createTaMode = (input: TaInput): ModeDefinitionResult<TaResponse> => {
  const userMessage = buildUserMessage(taContract.schema, [
    { name: 'scope', value: input.scope, maxLength: 6 },
    { name: 'purpose', value: input.purpose, maxLength: 1_000 },
    { name: 'observations', value: input.observations, maxLength: 8_000 },
    { name: 'userWantsAndBoundaries', value: input.wantsAndBoundaries, maxLength: 2_000 },
  ]);
  if (!userMessage.ok) return err(userMessage.error);
  return ok({
    systemPrompt: TA_SYSTEM_V1,
    userMessage: userMessage.value,
    contract: taContract,
    maxTokens: 1_800,
  });
};
