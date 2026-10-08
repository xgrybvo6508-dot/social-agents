import {
  enumValue,
  exactObject,
  invalid,
  safeOutput,
  stringArray,
  trimmedString,
  valid,
  type Contract,
  type JsonSchema,
} from '../contracts';

export type ConversationResponse = {
  observations: { evidence: string; observation: string }[];
  possibilities: {
    possibleWant: string;
    evidence: string;
    uncertainty: 'low' | 'medium' | 'high';
    alternative: string;
  }[];
  unknowns: string[];
  replies: { direct: string; warm: string; brief: string };
  whatToAvoid: { pattern: string; reason: string }[];
};

const UNCERTAINTY = ['low', 'medium', 'high'] as const;

export const CONVERSATION_SCHEMA: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['observations', 'possibilities', 'unknowns', 'replies', 'whatToAvoid'],
  properties: {
    observations: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['evidence', 'observation'],
        properties: {
          evidence: { type: 'string', maxLength: 300 },
          observation: { type: 'string', maxLength: 300 },
        },
      },
    },
    possibilities: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['possibleWant', 'evidence', 'uncertainty', 'alternative'],
        properties: {
          possibleWant: { type: 'string', maxLength: 240 },
          evidence: { type: 'string', maxLength: 300 },
          uncertainty: { enum: UNCERTAINTY },
          alternative: { type: 'string', maxLength: 240 },
        },
      },
    },
    unknowns: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 240 } },
    replies: {
      type: 'object',
      additionalProperties: false,
      required: ['direct', 'warm', 'brief'],
      properties: {
        direct: { type: 'string', maxLength: 400 },
        warm: { type: 'string', maxLength: 400 },
        brief: { type: 'string', maxLength: 240 },
      },
    },
    whatToAvoid: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['pattern', 'reason'],
        properties: {
          pattern: { type: 'string', maxLength: 200 },
          reason: { type: 'string', maxLength: 240 },
        },
      },
    },
  },
};

const validatePairs = (
  value: unknown,
  keys: readonly [string, string],
  limits: readonly [number, number],
  maxItems: number,
  path: string,
  errors: string[],
): void => {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  if (value.length > maxItems) errors.push(`${path} has too many items.`);
  value.forEach((item, index) => {
    const itemPath = `${path}[${String(index)}]`;
    if (!exactObject(item, keys, itemPath, errors)) return;
    trimmedString(item[keys[0]], limits[0], `${itemPath}.${keys[0]}`, errors);
    trimmedString(item[keys[1]], limits[1], `${itemPath}.${keys[1]}`, errors);
  });
};

const validate = (value: unknown) => {
  const errors: string[] = [];
  const keys = ['observations', 'possibilities', 'unknowns', 'replies', 'whatToAvoid'] as const;
  if (!exactObject(value, keys, '$', errors)) return invalid<ConversationResponse>(errors);

  validatePairs(
    value.observations,
    ['evidence', 'observation'],
    [300, 300],
    6,
    '$.observations',
    errors,
  );
  if (Array.isArray(value.observations) && value.observations.length === 0) {
    errors.push('$.observations needs at least one item.');
  }
  if (!Array.isArray(value.possibilities)) {
    errors.push('$.possibilities must be an array.');
  } else {
    if (value.possibilities.length > 5) errors.push('$.possibilities has too many items.');
    value.possibilities.forEach((item, index) => {
      const path = `$.possibilities[${String(index)}]`;
      if (
        !exactObject(item, ['possibleWant', 'evidence', 'uncertainty', 'alternative'], path, errors)
      )
        return;
      trimmedString(item.possibleWant, 240, `${path}.possibleWant`, errors);
      trimmedString(item.evidence, 300, `${path}.evidence`, errors);
      enumValue(item.uncertainty, UNCERTAINTY, `${path}.uncertainty`, errors);
      trimmedString(item.alternative, 240, `${path}.alternative`, errors);
    });
  }
  stringArray(value.unknowns, 6, 240, '$.unknowns', errors);
  if (exactObject(value.replies, ['direct', 'warm', 'brief'], '$.replies', errors)) {
    trimmedString(value.replies.direct, 400, '$.replies.direct', errors);
    trimmedString(value.replies.warm, 400, '$.replies.warm', errors);
    trimmedString(value.replies.brief, 240, '$.replies.brief', errors);
  }
  validatePairs(value.whatToAvoid, ['pattern', 'reason'], [200, 240], 5, '$.whatToAvoid', errors);
  safeOutput(value, '$', errors);
  return errors.length === 0
    ? valid(value as ConversationResponse)
    : invalid<ConversationResponse>(errors);
};

export const conversationContract: Contract<ConversationResponse> = {
  schema: CONVERSATION_SCHEMA,
  validate,
};
