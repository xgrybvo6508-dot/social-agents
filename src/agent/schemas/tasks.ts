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

const OWNERS = ['user', 'other', 'shared', 'unknown'] as const;
const CONFIDENCE = ['stated', 'likely', 'uncertain'] as const;

export type TaskExtractionResponse = {
  title: string;
  items: {
    action: string;
    evidence: string;
    owner: (typeof OWNERS)[number];
    timing: string | null;
    confidence: (typeof CONFIDENCE)[number];
    dependencies: string[];
  }[];
  unknowns: string[];
  nextAction: string;
};

export const TASK_EXTRACTION_SCHEMA: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['title', 'items', 'unknowns', 'nextAction'],
  properties: {
    title: { type: 'string', maxLength: 160 },
    items: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['action', 'evidence', 'owner', 'timing', 'confidence', 'dependencies'],
        properties: {
          action: { type: 'string', maxLength: 300 },
          evidence: { type: 'string', maxLength: 300 },
          owner: { enum: OWNERS },
          timing: { type: ['string', 'null'], maxLength: 160 },
          confidence: { enum: CONFIDENCE },
          dependencies: {
            type: 'array',
            maxItems: 5,
            items: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
    unknowns: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 240 } },
    nextAction: { type: 'string', maxLength: 300 },
  },
};

const validate = (value: unknown) => {
  const errors: string[] = [];
  if (!exactObject(value, ['title', 'items', 'unknowns', 'nextAction'], '$', errors)) {
    return invalid<TaskExtractionResponse>(errors);
  }
  trimmedString(value.title, 160, '$.title', errors);
  trimmedString(value.nextAction, 300, '$.nextAction', errors);
  stringArray(value.unknowns, 8, 240, '$.unknowns', errors);

  if (!Array.isArray(value.items)) {
    errors.push('$.items must be an array.');
  } else {
    if (value.items.length > 12) errors.push('$.items has too many items.');
    value.items.forEach((item, index) => {
      const path = `$.items[${String(index)}]`;
      if (
        !exactObject(
          item,
          ['action', 'evidence', 'owner', 'timing', 'confidence', 'dependencies'],
          path,
          errors,
        )
      )
        return;
      trimmedString(item.action, 300, `${path}.action`, errors);
      trimmedString(item.evidence, 300, `${path}.evidence`, errors);
      enumValue(item.owner, OWNERS, `${path}.owner`, errors);
      if (item.timing !== null) trimmedString(item.timing, 160, `${path}.timing`, errors);
      enumValue(item.confidence, CONFIDENCE, `${path}.confidence`, errors);
      stringArray(item.dependencies, 5, 200, `${path}.dependencies`, errors);
    });
  }
  safeOutput(value, '$', errors);
  return errors.length === 0
    ? valid(value as TaskExtractionResponse)
    : invalid<TaskExtractionResponse>(errors);
};

export const taskExtractionContract: Contract<TaskExtractionResponse> = {
  schema: TASK_EXTRACTION_SCHEMA,
  validate,
};
