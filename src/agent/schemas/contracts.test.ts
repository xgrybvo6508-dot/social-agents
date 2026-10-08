import { describe, expect, it } from 'vitest';
import type { Contract } from '../contracts';
import { extractJsonObject, MAX_MODE_OUTPUT_CHARS } from '../extract-json';
import { conversationContract } from './conversation';
import { phrasePreparationContract } from './phrase-prep';
import { phraseTrainingContract } from './phrase-training';
import { taContract } from './ta';
import { taskExtractionContract } from './tasks';

const preparedPhrase = {
  kind: 'opener',
  text: 'Would you like to discuss this project?',
  whenToUse: 'At the start of a project conversation.',
  implicitMeaning: 'This may show interest without assuming agreement.',
  easyNo: false,
};

const validValues = {
  phrasePreparation: {
    phrases: [
      preparedPhrase,
      { ...preparedPhrase, kind: 'clarification', text: 'Which part should I clarify?' },
      {
        ...preparedPhrase,
        kind: 'invitation',
        text: 'Would you like to join? It is fine to say no.',
        easyNo: true,
      },
    ],
  },
  phraseTraining: {
    partnerReply: 'I can discuss it tomorrow.',
    feedback: {
      clarity: 'The request is specific.',
      directness: 'The goal is stated directly.',
      consent: 'The other person can decline.',
    },
    revisions: [{ label: 'brief', text: 'Can we discuss this tomorrow?' }],
    nextCue: 'Ask one clear follow-up question.',
  },
  conversation: {
    observations: [
      { evidence: 'Let us talk tomorrow.', observation: 'A later talk is suggested.' },
    ],
    possibilities: [
      {
        possibleWant: 'They may want more time.',
        evidence: 'They suggested tomorrow.',
        uncertainty: 'medium',
        alternative: 'They may have another task now.',
      },
    ],
    unknowns: ['The preferred time is unknown.'],
    replies: {
      direct: 'What time tomorrow works for you?',
      warm: 'Thanks. What time tomorrow works for you?',
      brief: 'What time tomorrow?',
    },
    whatToAvoid: [{ pattern: 'Assuming a time', reason: 'No exact time was stated.' }],
  },
  tasks: {
    title: 'Prepare project outline',
    items: [
      {
        action: 'Draft the outline.',
        evidence: 'Please draft the outline.',
        owner: 'user',
        timing: null,
        confidence: 'stated',
        dependencies: [],
      },
    ],
    unknowns: ['The deadline is unknown.'],
    nextAction: 'Draft the first outline section.',
  },
  ta: {
    observations: [{ evidence: 'Please send the draft.', observation: 'A draft was requested.' }],
    hypotheses: [
      {
        lens: 'transaction',
        reading: 'This may be an Adult-to-Adult request.',
        evidence: 'The request names a concrete action.',
        confidence: 'low',
        ordinaryAlternative: 'It could be a routine reminder.',
        unknown: 'The tone and earlier context are unknown.',
      },
    ],
    voices: [
      {
        speaker: 'User',
        voice: 'Adult',
        statement: 'I want to confirm the expected date.',
        tentative: true,
      },
    ],
    wants: {
      mine: ['A clear date.'],
      othersPossible: ['The draft may be needed soon.'],
      boundaries: ['I will not assume a deadline.'],
    },
    options: [
      { action: 'Ask for the date.', tradeoff: 'This adds one message.' },
      { action: 'Send a partial draft.', tradeoff: 'It may need revision.' },
    ],
    summary: 'The request is clear, but timing is unknown.',
    decisionPrompt: 'Which option do you choose?',
  },
} as const;

type ContractCase = {
  name: string;
  contract: Contract<unknown>;
  valid: unknown;
  missing: unknown;
  wrongType: unknown;
  oversized: unknown;
  extra: unknown;
  unsafe: unknown;
};

const cases: readonly ContractCase[] = [
  {
    name: 'phrase preparation',
    contract: phrasePreparationContract,
    valid: validValues.phrasePreparation,
    missing: {},
    wrongType: { phrases: 'wrong' },
    oversized: {
      phrases: validValues.phrasePreparation.phrases.map((item, index) =>
        index === 0 ? { ...item, text: 'x'.repeat(241) } : item,
      ),
    },
    extra: { ...validValues.phrasePreparation, extra: true },
    unsafe: {
      phrases: validValues.phrasePreparation.phrases.map((item, index) =>
        index === 0 ? { ...item, text: 'Manipulate them into agreeing.' } : item,
      ),
    },
  },
  {
    name: 'phrase training',
    contract: phraseTrainingContract,
    valid: validValues.phraseTraining,
    missing: { partnerReply: 'Hello.' },
    wrongType: { ...validValues.phraseTraining, revisions: false },
    oversized: { ...validValues.phraseTraining, nextCue: 'x'.repeat(301) },
    extra: { ...validValues.phraseTraining, extra: true },
    unsafe: { ...validValues.phraseTraining, partnerReply: 'Pressure them to answer.' },
  },
  {
    name: 'conversation helper',
    contract: conversationContract,
    valid: validValues.conversation,
    missing: { observations: [] },
    wrongType: { ...validValues.conversation, replies: [] },
    oversized: {
      ...validValues.conversation,
      replies: { ...validValues.conversation.replies, direct: 'x'.repeat(401) },
    },
    extra: { ...validValues.conversation, extra: true },
    unsafe: {
      ...validValues.conversation,
      replies: { ...validValues.conversation.replies, direct: 'Trick them into answering.' },
    },
  },
  {
    name: 'task extraction',
    contract: taskExtractionContract,
    valid: validValues.tasks,
    missing: { title: 'Task' },
    wrongType: { ...validValues.tasks, items: 'wrong' },
    oversized: { ...validValues.tasks, title: 'x'.repeat(161) },
    extra: { ...validValues.tasks, extra: true },
    unsafe: { ...validValues.tasks, nextAction: 'Deceive them about the deadline.' },
  },
  {
    name: 'TA',
    contract: taContract,
    valid: validValues.ta,
    missing: { observations: [] },
    wrongType: { ...validValues.ta, voices: 'wrong' },
    oversized: { ...validValues.ta, summary: 'x'.repeat(601) },
    extra: { ...validValues.ta, extra: true },
    unsafe: { ...validValues.ta, summary: 'Diagnose the other person.' },
  },
];

describe.each(cases)('$name contract', ({ contract, valid, ...invalidValues }) => {
  it('accepts plain, fenced, and prose-wrapped valid objects', () => {
    const json = JSON.stringify(valid);
    for (const output of [json, `\`\`\`json\n${json}\n\`\`\``, `Result:\n${json}\nDone.`]) {
      const extracted = extractJsonObject(output);
      expect(extracted.ok).toBe(true);
      if (extracted.ok) expect(contract.validate(extracted.value).valid).toBe(true);
    }
  });

  it('rejects missing, wrong-type, oversized, extra, and unsafe values', () => {
    for (const value of Object.values(invalidValues)) {
      expect(contract.validate(value).valid).toBe(false);
    }
  });

  it('does not validate malformed JSON', () => {
    expect(extractJsonObject('Result: {"broken": }').ok).toBe(false);
  });
});

describe('model JSON extraction limits', () => {
  it('rejects oversized output before parsing', () => {
    expect(extractJsonObject(`{"value":"${'x'.repeat(MAX_MODE_OUTPUT_CHARS)}"}`).ok).toBe(false);
  });
});
