import type { AgentClient, ChatMessage } from './client';
import type { Contract } from './contracts';
import { AgentError } from './errors';
import { extractJsonObject } from './extract-json';
import type { Settings } from './settings';

export type ModeDefinition<T> = {
  readonly systemPrompt: string;
  readonly userMessage: string;
  readonly contract: Contract<T>;
  readonly maxTokens: number;
};

export type ModeRunResult<T> =
  | { status: 'success'; value: T; repaired: boolean }
  | { status: 'manual-fallback'; error: AgentError };

const parseAndValidate = <T>(
  output: string,
  contract: Contract<T>,
): { value: T } | { error: AgentError; details: readonly string[] } => {
  const extracted = extractJsonObject(output);
  if (!extracted.ok) {
    return {
      error: new AgentError('invalid-json'),
      details: [`$ could not be parsed: ${extracted.error}.`],
    };
  }
  const validation = contract.validate(extracted.value);
  if (!validation.valid) {
    return { error: new AgentError('invalid-schema'), details: validation.errors };
  }
  return { value: validation.value };
};

const repairMessage = <T>(
  originalOutput: string,
  details: readonly string[],
  contract: Contract<T>,
): string =>
  [
    'Repair the previous response. Return only one corrected JSON object.',
    `VALIDATION ERRORS:\n${details.join('\n')}`,
    `OUTPUT SCHEMA:\n${JSON.stringify(contract.schema)}`,
    `ORIGINAL OUTPUT:\n${originalOutput}`,
  ].join('\n\n');

const safeError = (error: unknown): AgentError =>
  error instanceof AgentError ? error : new AgentError('network');

export const runMode = async <T>(
  client: AgentClient,
  settings: Settings,
  definition: ModeDefinition<T>,
): Promise<ModeRunResult<T>> => {
  const messages: ChatMessage[] = [
    { role: 'system', content: definition.systemPrompt },
    { role: 'user', content: definition.userMessage },
  ];

  let output: string;
  try {
    output = await client.chat(settings, {
      messages,
      jsonMode: true,
      maxTokens: definition.maxTokens,
    });
  } catch (error: unknown) {
    return { status: 'manual-fallback', error: safeError(error) };
  }

  const first = parseAndValidate(output, definition.contract);
  if ('value' in first) return { status: 'success', value: first.value, repaired: false };

  try {
    const repairedOutput = await client.chat(settings, {
      messages: [
        ...messages,
        { role: 'assistant', content: output },
        {
          role: 'user',
          content: repairMessage(output, first.details, definition.contract),
        },
      ],
      jsonMode: true,
      maxTokens: definition.maxTokens,
    });
    const repaired = parseAndValidate(repairedOutput, definition.contract);
    return 'value' in repaired
      ? { status: 'success', value: repaired.value, repaired: true }
      : { status: 'manual-fallback', error: repaired.error };
  } catch (error: unknown) {
    return { status: 'manual-fallback', error: safeError(error) };
  }
};
