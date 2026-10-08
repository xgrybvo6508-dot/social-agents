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

export const REVISION_LABELS = ['direct', 'warm', 'brief'] as const;
export type RevisionLabel = (typeof REVISION_LABELS)[number];

export type PhraseTrainingResponse = {
  partnerReply: string;
  feedback: { clarity: string; directness: string; consent: string };
  revisions: { label: RevisionLabel; text: string }[];
  nextCue: string;
};

export const PHRASE_TRAINING_SCHEMA: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['partnerReply', 'feedback', 'revisions', 'nextCue'],
  properties: {
    partnerReply: { type: 'string', maxLength: 300 },
    feedback: {
      type: 'object',
      additionalProperties: false,
      required: ['clarity', 'directness', 'consent'],
      properties: {
        clarity: { type: 'string', maxLength: 240 },
        directness: { type: 'string', maxLength: 240 },
        consent: { type: 'string', maxLength: 240 },
      },
    },
    revisions: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'text'],
        properties: {
          label: { enum: REVISION_LABELS },
          text: { type: 'string', maxLength: 240 },
        },
      },
    },
    nextCue: { type: 'string', maxLength: 300 },
  },
};

const validate = (value: unknown) => {
  const errors: string[] = [];
  if (!exactObject(value, ['partnerReply', 'feedback', 'revisions', 'nextCue'], '$', errors)) {
    return invalid<PhraseTrainingResponse>(errors);
  }
  trimmedString(value.partnerReply, 300, '$.partnerReply', errors);
  trimmedString(value.nextCue, 300, '$.nextCue', errors);

  if (exactObject(value.feedback, ['clarity', 'directness', 'consent'], '$.feedback', errors)) {
    trimmedString(value.feedback.clarity, 240, '$.feedback.clarity', errors);
    trimmedString(value.feedback.directness, 240, '$.feedback.directness', errors);
    trimmedString(value.feedback.consent, 240, '$.feedback.consent', errors);
  }

  if (!Array.isArray(value.revisions)) {
    errors.push('$.revisions must be an array.');
  } else {
    if (value.revisions.length > 3) errors.push('$.revisions has too many items.');
    const labels = new Set<string>();
    value.revisions.forEach((revision, index) => {
      const path = `$.revisions[${String(index)}]`;
      if (!exactObject(revision, ['label', 'text'], path, errors)) return;
      if (enumValue(revision.label, REVISION_LABELS, `${path}.label`, errors)) {
        if (labels.has(revision.label)) errors.push(`${path}.label is duplicated.`);
        labels.add(revision.label);
      }
      trimmedString(revision.text, 240, `${path}.text`, errors);
    });
  }
  safeOutput(value, '$', errors);
  return errors.length === 0
    ? valid(value as PhraseTrainingResponse)
    : invalid<PhraseTrainingResponse>(errors);
};

export const phraseTrainingContract: Contract<PhraseTrainingResponse> = {
  schema: PHRASE_TRAINING_SCHEMA,
  validate,
};
