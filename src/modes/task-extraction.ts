import { TASK_EXTRACTION_SYSTEM_V1 } from '../agent/prompts/tasks';
import { taskExtractionContract, type TaskExtractionResponse } from '../agent/schemas/tasks';
import { err, ok } from '../lib/result';
import { buildUserMessage, type ModeDefinitionResult } from './shared';

export type TaskExtractionInput = { sourceText: string };

export const createTaskExtractionMode = (
  input: TaskExtractionInput,
): ModeDefinitionResult<TaskExtractionResponse> => {
  const userMessage = buildUserMessage(taskExtractionContract.schema, [
    { name: 'sourceText', value: input.sourceText, maxLength: 8_000 },
  ]);
  if (!userMessage.ok) return err(userMessage.error);
  return ok({
    systemPrompt: TASK_EXTRACTION_SYSTEM_V1,
    userMessage: userMessage.value,
    contract: taskExtractionContract,
    maxTokens: 1_400,
  });
};
