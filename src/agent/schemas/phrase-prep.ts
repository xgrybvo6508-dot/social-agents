import {
  enumValue,
  exactObject,
  invalid,
  safeOutput,
  trimmedString,
  valid,
  type Contract,
  type JsonSchema,
} from '../contracts';

export const PHRASE_KINDS = [
  'opener',
  'follow-up',
  'clarification',
  'boundary',
  'invitation',
  'ending',
] as const;
export type PhraseKind = (typeof PHRASE_KINDS)[number];

export type PreparedPhrase = {
  kind: PhraseKind;
  text: string;
  whenToUse: string;
  implicitMeaning: string;
  easyNo: boolean;
};

export type PhrasePreparationResponse = { phrases: PreparedPhrase[] };

export const PHRASE_PREPARATION_SCHEMA: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['phrases'],
  properties: {
    phrases: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'text', 'whenToUse', 'implicitMeaning', 'easyNo'],
        properties: {
          kind: { enum: PHRASE_KINDS },
          text: { type: 'string', maxLength: 240 },
          whenToUse: { type: 'string', maxLength: 240 },
          implicitMeaning: { type: 'string', maxLength: 240 },
          easyNo: { type: 'boolean' },
        },
      },
    },
  },
};

const validate = (value: unknown) => {
  const errors: string[] = [];
  if (!exactObject(value, ['phrases'], '$', errors))
    return invalid<PhrasePreparationResponse>(errors);
  const phrases = value.phrases;
  if (!Array.isArray(phrases)) {
    errors.push('$.phrases must be an array.');
  } else {
    if (phrases.length < 3 || phrases.length > 6) {
      errors.push('$.phrases must contain 3 to 6 items.');
    }
    phrases.forEach((phrase, index) => {
      const path = `$.phrases[${String(index)}]`;
      if (
        !exactObject(
          phrase,
          ['kind', 'text', 'whenToUse', 'implicitMeaning', 'easyNo'],
          path,
          errors,
        )
      ) {
        return;
      }
      enumValue(phrase.kind, PHRASE_KINDS, `${path}.kind`, errors);
      trimmedString(phrase.text, 240, `${path}.text`, errors);
      trimmedString(phrase.whenToUse, 240, `${path}.whenToUse`, errors);
      trimmedString(phrase.implicitMeaning, 240, `${path}.implicitMeaning`, errors);
      if (typeof phrase.easyNo !== 'boolean') errors.push(`${path}.easyNo must be a boolean.`);
      if (phrase.kind === 'invitation' && phrase.easyNo !== true) {
        errors.push(`${path}.easyNo must be true for an invitation.`);
      }
    });
  }
  safeOutput(value, '$', errors);
  return errors.length === 0
    ? valid(value as PhrasePreparationResponse)
    : invalid<PhrasePreparationResponse>(errors);
};

export const phrasePreparationContract: Contract<PhrasePreparationResponse> = {
  schema: PHRASE_PREPARATION_SCHEMA,
  validate,
};
