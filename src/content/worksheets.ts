export const WORKSHEET_MODES = [
  'phrase-preparation',
  'phrase-training',
  'conversation-helper',
  'task-extraction',
  'transactional-analysis',
] as const;

export type WorksheetMode = (typeof WORKSHEET_MODES)[number];

export type WorksheetStep = {
  id: string;
  title: string;
  instruction: string;
  prompts: readonly string[];
};

export type Worksheet = {
  id: string;
  mode: WorksheetMode;
  title: string;
  purpose: string;
  privacyReminder: string;
  steps: readonly WorksheetStep[];
  completion: string;
};

export const WORKSHEETS: readonly Worksheet[] = [
  {
    id: 'worksheet-phrase-preparation',
    mode: 'phrase-preparation',
    title: 'Prepare a phrase',
    purpose: 'Write a clear phrase for one real situation.',
    privacyReminder: 'Use role labels. You do not need to add names or private details.',
    steps: [
      {
        id: 'phrase-preparation-role',
        title: 'Choose the role',
        instruction: 'Choose who you are speaking to and name only their role.',
        prompts: ['What is their role?', 'What is the situation?'],
      },
      {
        id: 'phrase-preparation-goal',
        title: 'State your goal',
        instruction: 'Write the one result you want from this message.',
        prompts: ['What do I want to say?', 'What answer or action would be clear?'],
      },
      {
        id: 'phrase-preparation-consent',
        title: 'Add a clear no option',
        instruction: 'If this is an invitation, make refusal safe and simple.',
        prompts: [
          'Can the other person easily say no?',
          'Could I add “If not, that is fine” or “You can say no”?',
        ],
      },
      {
        id: 'phrase-preparation-draft',
        title: 'Write the literal phrase',
        instruction:
          'Write one short phrase that says the request, boundary, or information directly.',
        prompts: ['My draft:', 'Does every sentence have a clear purpose?'],
      },
      {
        id: 'phrase-preparation-review',
        title: 'Read it literally',
        instruction: 'Check only the words on the page. Do not depend on hints or hidden meaning.',
        prompts: [
          'Could the words be understood without guessing?',
          'Is it honest, respectful, and free of pressure?',
        ],
      },
      {
        id: 'phrase-preparation-finish',
        title: 'Choose the final phrase',
        instruction: 'Edit the phrase, then choose whether to save it.',
        prompts: ['Final phrase:', 'Do I want to save this phrase?'],
      },
    ],
    completion: 'Nothing is saved until you choose Save.',
  },
  {
    id: 'worksheet-phrase-training',
    mode: 'phrase-training',
    title: 'Train a phrase',
    purpose: 'Practise recalling one phrase without pressure to perform a social style.',
    privacyReminder: 'Use a generic scenario. Do not add a real person’s private details.',
    steps: [
      {
        id: 'phrase-training-deck',
        title: 'Choose a phrase',
        instruction: 'Choose a due phrase, any phrase, or a role group.',
        prompts: ['Which phrase or role will I practise?', 'What situation is it for?'],
      },
      {
        id: 'phrase-training-cue',
        title: 'Read the cue',
        instruction: 'Describe the moment when the phrase would be useful.',
        prompts: ['What has happened?', 'What do I need to communicate?'],
      },
      {
        id: 'phrase-training-recall',
        title: 'Recall the phrase',
        instruction: 'Say or type the phrase before looking at the saved version.',
        prompts: ['My recalled phrase:'],
      },
      {
        id: 'phrase-training-reveal',
        title: 'Reveal and compare',
        instruction: 'Read the saved phrase. Differences are information, not failure.',
        prompts: [
          'Saved phrase:',
          'Did my version keep the main meaning?',
          'Was it clear, direct, and respectful of consent?',
        ],
      },
      {
        id: 'phrase-training-grade',
        title: 'Choose your grade',
        instruction: 'Grade your recall from 0 to 5. You own the grade.',
        prompts: [
          '0: no recall; 1: very hard; 2: hard; 3: recalled with effort; 4: clear; 5: easy.',
          'My grade:',
        ],
      },
      {
        id: 'phrase-training-next',
        title: 'Schedule the next review',
        instruction: 'Use the grade to schedule the phrase. Repeat now only if you want.',
        prompts: ['Review later, try once more, or end this session?'],
      },
    ],
    completion: 'Finish after any review. Direct communication does not need to be masked.',
  },
  {
    id: 'worksheet-conversation-helper',
    mode: 'conversation-helper',
    title: 'Understand a conversation',
    purpose: 'Separate observed words from uncertain interpretations and choose a reply.',
    privacyReminder:
      'Use only the relevant excerpt. Remove names, contact details, and unrelated personal facts.',
    steps: [
      {
        id: 'conversation-observations',
        title: 'Record exact evidence',
        instruction: 'Copy exact words or write only observable actions.',
        prompts: ['Exact words or action:', 'What can I observe without interpretation?'],
      },
      {
        id: 'conversation-unknowns',
        title: 'List what is unknown',
        instruction: 'Write what the excerpt cannot establish.',
        prompts: [
          'What intent, context, timing, or preference is unknown?',
          'What am I currently guessing?',
        ],
      },
      {
        id: 'conversation-possibilities',
        title: 'Write possible wants',
        instruction: 'Write possibilities, not claims about the other person’s mind.',
        prompts: [
          'One possible want is:',
          'Evidence for this possibility:',
          'An ordinary alternative is:',
          'How uncertain is this: low, medium, or high?',
        ],
      },
      {
        id: 'conversation-question',
        title: 'Ask directly',
        instruction: 'Write one question that could replace guessing with information.',
        prompts: ['My direct clarification question:'],
      },
      {
        id: 'conversation-replies',
        title: 'Write three reply options',
        instruction: 'Keep the same honest meaning in three styles. No style is superior.',
        prompts: ['Direct reply:', 'Warm reply:', 'Brief reply:'],
      },
      {
        id: 'conversation-avoid',
        title: 'Check what to avoid',
        instruction: 'Remove claims about hidden intent, diagnoses, pressure, or invented facts.',
        prompts: [
          'Did I present a guess as a fact?',
          'Did I add pressure or an unnecessary private detail?',
        ],
      },
      {
        id: 'conversation-finish',
        title: 'Choose your response',
        instruction: 'Edit or copy one response. Save a summary only if you want to keep it.',
        prompts: ['Chosen response:', 'Optional summary to save:'],
      },
    ],
    completion: 'The conversation excerpt is not saved by default.',
  },
  {
    id: 'worksheet-task-extraction',
    mode: 'task-extraction',
    title: 'Extract a task',
    purpose: 'Turn supplied text into evidence-linked actions without inventing commitments.',
    privacyReminder:
      'Use only the text needed for the task. Remove names, contact details, and private context.',
    steps: [
      {
        id: 'task-extraction-outcome',
        title: 'Find the requested outcome',
        instruction: 'Mark the words that state what result is requested.',
        prompts: ['Exact evidence:', 'Requested outcome:', 'Is it stated, likely, or uncertain?'],
      },
      {
        id: 'task-extraction-items',
        title: 'List concrete actions',
        instruction: 'Write one observable action per item and attach source evidence.',
        prompts: ['Action:', 'Source evidence:', 'Is this action actually supported by the text?'],
      },
      {
        id: 'task-extraction-ownership',
        title: 'Check owner and timing',
        instruction: 'Record only what the text says. Use “unknown” when it does not say.',
        prompts: ['Owner: user, other, shared, or unknown?', 'Timing: stated value or unknown?'],
      },
      {
        id: 'task-extraction-dependencies',
        title: 'Check dependencies',
        instruction: 'List required inputs or earlier actions only when the text supports them.',
        prompts: ['Supported dependencies:', 'Evidence for each dependency:'],
      },
      {
        id: 'task-extraction-unknowns',
        title: 'Keep ambiguity visible',
        instruction: 'Move unsupported assumptions into questions.',
        prompts: [
          'What owner, deadline, scope, or acceptance rule is unknown?',
          'What direct question would clarify it?',
        ],
      },
      {
        id: 'task-extraction-next-action',
        title: 'Choose the smallest next action',
        instruction: 'Choose a supported action, or ask for the most important missing detail.',
        prompts: ['Smallest next action:', 'Evidence or clarification reason:'],
      },
      {
        id: 'task-extraction-finish',
        title: 'Review and decide',
        instruction: 'Remove invented commitments, then edit and choose whether to save the task.',
        prompts: ['Final task title:', 'Do I want to save this task?'],
      },
    ],
    completion: 'Nothing is assigned or saved until you confirm it.',
  },
  {
    id: 'worksheet-transactional-analysis',
    mode: 'transactional-analysis',
    title: 'Plan with a TA lens',
    purpose:
      'Use Transactional Analysis as one tentative lens for a person or group, then make your own decision.',
    privacyReminder:
      'Use role labels and necessary observations only. Do not add private details about other people.',
    steps: [
      {
        id: 'ta-scope',
        title: 'Choose scope and purpose',
        instruction: 'Choose one person or one group and state what decision you need to make.',
        prompts: ['Scope: one person or group?', 'Purpose:', 'What do I want from this process?'],
      },
      {
        id: 'ta-observations',
        title: 'Record observations',
        instruction: 'Write exact words or observable actions before using TA terms.',
        prompts: ['Evidence:', 'Observable pattern:', 'What remains unknown?'],
      },
      {
        id: 'ta-hypotheses',
        title: 'Try a tentative TA reading',
        instruction: 'Use a reference card only if it helps. Keep each reading uncertain.',
        prompts: [
          'Possible ego state, transaction, or pattern:',
          'Evidence:',
          'Ordinary alternative:',
          'Unknown information:',
          'What direct question could check this reading or invite correction?',
        ],
      },
      {
        id: 'ta-group-patterns',
        title: 'Check communication patterns',
        instruction:
          'Check transactions and ordinary context. If this is a group, also check participation, decisions, boundaries, and role changes.',
        prompts: [
          'Which transactions may be complementary, crossed, or unclear?',
          'If this is a group, who speaks, decides, helps, objects, or stays unheard?',
          'Could a simple task or context issue explain this?',
        ],
      },
      {
        id: 'ta-voices',
        title: 'Voice all voices',
        instruction:
          'Write brief, charitable first-person possibilities. These are drafts, not claims about thoughts.',
        prompts: [
          'My Parent voice may say:',
          'My Adult voice may say:',
          'My Child voice may say:',
          'Each relevant person or group member may say:',
          'Which voice is missing?',
        ],
      },
      {
        id: 'ta-wants-boundaries',
        title: 'Separate wants and boundaries',
        instruction: 'Keep your wants distinct from what others may want.',
        prompts: [
          'What I want:',
          'What others may want:',
          'My consent and boundaries:',
          'Their possible consent and boundaries:',
        ],
      },
      {
        id: 'ta-options',
        title: 'Write neutral options',
        instruction: 'Write at least two actions and one tradeoff for each.',
        prompts: [
          'Option and tradeoff:',
          'Another option and tradeoff:',
          'Option to pause or ask:',
        ],
      },
      {
        id: 'ta-fixation',
        title: 'Write the fixation',
        instruction:
          'Write a neutral summary of observations, tentative readings, voices, wants, boundaries, and options.',
        prompts: ['Neutral summary:', 'What could change this reading?'],
      },
      {
        id: 'ta-decision',
        title: 'Make your decision',
        instruction: 'Choose the next action yourself. The TA lens does not decide for you.',
        prompts: ['My decision:', 'My smallest next action:', 'Do I want to save this fixation?'],
      },
    ],
    completion: 'Save the fixation only after you write and confirm your own decision.',
  },
];
