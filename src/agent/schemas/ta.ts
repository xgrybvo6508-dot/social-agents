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

const LENSES = [
  'ego-state',
  'transaction',
  'game-pattern',
  'life-position',
  'script-pattern',
  'group-dynamic',
] as const;
const CONFIDENCE = ['low', 'medium'] as const;
const VOICES = ['Parent', 'Adult', 'Child', 'group-member', 'user'] as const;

export type TaResponse = {
  observations: { evidence: string; observation: string }[];
  hypotheses: {
    lens: (typeof LENSES)[number];
    reading: string;
    evidence: string;
    confidence: (typeof CONFIDENCE)[number];
    ordinaryAlternative: string;
    unknown: string;
  }[];
  voices: {
    speaker: string;
    voice: (typeof VOICES)[number];
    statement: string;
    tentative: true;
  }[];
  wants: { mine: string[]; othersPossible: string[]; boundaries: string[] };
  options: { action: string; tradeoff: string }[];
  summary: string;
  decisionPrompt: string;
};

const pairArray = (
  minItems: number,
  maxItems: number,
  first: string,
  second: string,
  firstMax: number,
  secondMax: number,
): JsonSchema => ({
  type: 'array',
  minItems,
  maxItems,
  items: {
    type: 'object',
    additionalProperties: false,
    required: [first, second],
    properties: {
      [first]: { type: 'string', maxLength: firstMax },
      [second]: { type: 'string', maxLength: secondMax },
    },
  },
});

export const TA_SCHEMA: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: [
    'observations',
    'hypotheses',
    'voices',
    'wants',
    'options',
    'summary',
    'decisionPrompt',
  ],
  properties: {
    observations: pairArray(1, 8, 'evidence', 'observation', 300, 300),
    hypotheses: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['lens', 'reading', 'evidence', 'confidence', 'ordinaryAlternative', 'unknown'],
        properties: {
          lens: { enum: LENSES },
          reading: { type: 'string', maxLength: 400 },
          evidence: { type: 'string', maxLength: 300 },
          confidence: { enum: CONFIDENCE },
          ordinaryAlternative: { type: 'string', maxLength: 300 },
          unknown: { type: 'string', maxLength: 300 },
        },
      },
    },
    voices: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['speaker', 'voice', 'statement', 'tentative'],
        properties: {
          speaker: { type: 'string', maxLength: 100 },
          voice: { enum: VOICES },
          statement: { type: 'string', maxLength: 300 },
          tentative: { const: true },
        },
      },
    },
    wants: {
      type: 'object',
      additionalProperties: false,
      required: ['mine', 'othersPossible', 'boundaries'],
      properties: {
        mine: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 240 } },
        othersPossible: {
          type: 'array',
          maxItems: 6,
          items: { type: 'string', maxLength: 240 },
        },
        boundaries: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 240 } },
      },
    },
    options: pairArray(2, 5, 'action', 'tradeoff', 300, 300),
    summary: { type: 'string', maxLength: 600 },
    decisionPrompt: { type: 'string', maxLength: 240 },
  },
};

const validatePairs = (
  value: unknown,
  min: number,
  max: number,
  path: string,
  errors: string[],
): void => {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  if (value.length < min || value.length > max) errors.push(`${path} has an invalid item count.`);
  value.forEach((item, index) => {
    const itemPath = `${path}[${String(index)}]`;
    const keys =
      path === '$.options'
        ? (['action', 'tradeoff'] as const)
        : (['evidence', 'observation'] as const);
    if (!exactObject(item, keys, itemPath, errors)) return;
    trimmedString(item[keys[0]], 300, `${itemPath}.${keys[0]}`, errors);
    trimmedString(item[keys[1]], 300, `${itemPath}.${keys[1]}`, errors);
  });
};

const validateHypotheses = (value: unknown, errors: string[]): void => {
  if (!Array.isArray(value)) {
    errors.push('$.hypotheses must be an array.');
    return;
  }
  if (value.length > 6) errors.push('$.hypotheses has too many items.');
  value.forEach((item, index) => {
    const path = `$.hypotheses[${String(index)}]`;
    const keys = ['lens', 'reading', 'evidence', 'confidence', 'ordinaryAlternative', 'unknown'];
    if (!exactObject(item, keys, path, errors)) return;
    enumValue(item.lens, LENSES, `${path}.lens`, errors);
    if (trimmedString(item.reading, 400, `${path}.reading`, errors)) {
      if (!/\b(?:may|might|could|possible|possibly|tentative)\b/iu.test(item.reading)) {
        errors.push(`${path}.reading must use tentative language.`);
      }
    }
    trimmedString(item.evidence, 300, `${path}.evidence`, errors);
    enumValue(item.confidence, CONFIDENCE, `${path}.confidence`, errors);
    trimmedString(item.ordinaryAlternative, 300, `${path}.ordinaryAlternative`, errors);
    trimmedString(item.unknown, 300, `${path}.unknown`, errors);
  });
};

const validateVoices = (value: unknown, errors: string[]): void => {
  if (!Array.isArray(value)) {
    errors.push('$.voices must be an array.');
    return;
  }
  if (value.length > 10) errors.push('$.voices has too many items.');
  value.forEach((item, index) => {
    const path = `$.voices[${String(index)}]`;
    if (!exactObject(item, ['speaker', 'voice', 'statement', 'tentative'], path, errors)) return;
    trimmedString(item.speaker, 100, `${path}.speaker`, errors);
    enumValue(item.voice, VOICES, `${path}.voice`, errors);
    if (trimmedString(item.statement, 300, `${path}.statement`, errors)) {
      if (!/\b(?:I|we|my|our)\b/u.test(item.statement)) {
        errors.push(`${path}.statement must be in first person.`);
      }
    }
    if (item.tentative !== true) errors.push(`${path}.tentative must be true.`);
  });
};

const validate = (value: unknown) => {
  const errors: string[] = [];
  const keys = [
    'observations',
    'hypotheses',
    'voices',
    'wants',
    'options',
    'summary',
    'decisionPrompt',
  ];
  if (!exactObject(value, keys, '$', errors)) return invalid<TaResponse>(errors);
  validatePairs(value.observations, 1, 8, '$.observations', errors);
  validateHypotheses(value.hypotheses, errors);
  validateVoices(value.voices, errors);
  if (exactObject(value.wants, ['mine', 'othersPossible', 'boundaries'], '$.wants', errors)) {
    stringArray(value.wants.mine, 5, 240, '$.wants.mine', errors);
    stringArray(value.wants.othersPossible, 6, 240, '$.wants.othersPossible', errors);
    stringArray(value.wants.boundaries, 5, 240, '$.wants.boundaries', errors);
  }
  validatePairs(value.options, 2, 5, '$.options', errors);
  trimmedString(value.summary, 600, '$.summary', errors);
  trimmedString(value.decisionPrompt, 240, '$.decisionPrompt', errors);
  safeOutput(value, '$', errors);
  return errors.length === 0 ? valid(value as TaResponse) : invalid<TaResponse>(errors);
};

export const taContract: Contract<TaResponse> = { schema: TA_SCHEMA, validate };
