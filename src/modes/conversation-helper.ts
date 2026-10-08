import { CONVERSATION_HELPER_SYSTEM_V1 } from '../agent/prompts/conversation';
import { conversationContract, type ConversationResponse } from '../agent/schemas/conversation';
import { err, ok } from '../lib/result';
import { buildUserMessage, type ModeDefinitionResult } from './shared';

export type ConversationHelperInput = { excerpt: string };

export const createConversationHelperMode = (
  input: ConversationHelperInput,
): ModeDefinitionResult<ConversationResponse> => {
  const userMessage = buildUserMessage(conversationContract.schema, [
    { name: 'relevantExcerpt', value: input.excerpt, maxLength: 8_000 },
  ]);
  if (!userMessage.ok) return err(userMessage.error);
  return ok({
    systemPrompt: CONVERSATION_HELPER_SYSTEM_V1,
    userMessage: userMessage.value,
    contract: conversationContract,
    maxTokens: 1_400,
  });
};
