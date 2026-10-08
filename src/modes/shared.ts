import type { JsonSchema } from '../agent/contracts';
import type { ModeDefinition } from '../agent/run-mode';
import { err, ok, type Result } from '../lib/result';

export type ModeInputError = {
  code: 'invalid-input';
  message: string;
};

export type ModeDefinitionResult<T> = Result<ModeDefinition<T>, ModeInputError>;

export type InputField = {
  name: string;
  value: string;
  maxLength: number;
};

export const buildUserMessage = (
  schema: JsonSchema,
  fields: readonly InputField[],
): Result<string, ModeInputError> => {
  const data: Record<string, string> = {};
  for (const field of fields) {
    const value = field.value.trim();
    if (value.length === 0 || value.length > field.maxLength) {
      return err({
        code: 'invalid-input',
        message: `Check ${field.name}. It must contain 1 to ${String(field.maxLength)} characters.`,
      });
    }
    data[field.name] = value;
  }
  return ok(
    [
      `OUTPUT SCHEMA:\n${JSON.stringify(schema)}`,
      `BEGIN USER DATA\n${JSON.stringify(data)}\nEND USER DATA`,
    ].join('\n\n'),
  );
};
