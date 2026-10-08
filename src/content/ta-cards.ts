export type TaCard = {
  id: string;
  title: string;
  definition: string;
  doesNotMean: string;
  evidenceQuestion: string;
  ordinaryAlternative: string;
  caution: string;
};

export const TA_CARDS: readonly TaCard[] = [
  {
    id: 'ta-ego-states',
    title: 'Ego states',
    definition:
      'In Transactional Analysis, ego states are patterns of thinking, feeling, and behaving. The three broad labels are Parent, Adult, and Child.',
    doesNotMean: 'They are not ages, diagnoses, moral rankings, or fixed personality types.',
    evidenceQuestion: 'Which exact words or actions suggest this pattern?',
    ordinaryAlternative:
      'The person may be responding to the immediate situation without a stable pattern.',
    caution: 'Use an ego-state label as a tentative lens, not as a verdict about a person.',
  },
  {
    id: 'ta-parent',
    title: 'Parent ego state',
    definition:
      'Parent describes patterns that resemble learned rules, care, protection, criticism, or control.',
    doesNotMean: 'It does not mean the person is a parent, older, wrong, or controlling.',
    evidenceQuestion: 'Is there an observable rule, caring response, warning, or judgment?',
    ordinaryAlternative: 'The person may be stating a practical rule or a current preference.',
    caution: 'Do not declare a nurturing or critical subtype without enough repeated evidence.',
  },
  {
    id: 'ta-adult',
    title: 'Adult ego state',
    definition:
      'Adult describes responding to current reality by checking information, options, and likely results.',
    doesNotMean: 'It does not mean emotionless, always correct, mature, or superior.',
    evidenceQuestion: 'What current facts, questions, or options appear in the exchange?',
    ordinaryAlternative: 'A factual style may reflect the task, limited time, or message format.',
    caution: 'Feelings can be present in an Adult response.',
  },
  {
    id: 'ta-child',
    title: 'Child ego state',
    definition:
      'Child describes patterns connected with felt needs, play, creativity, fear, resistance, or adaptation.',
    doesNotMean: 'It does not mean childish, inferior, young, or unable to reason.',
    evidenceQuestion:
      'Which words or actions show a need, feeling, spontaneous response, or adaptation?',
    ordinaryAlternative:
      'The response may be a direct reaction to pressure, joy, risk, or uncertainty.',
    caution: 'Do not infer Free or Adapted Child, or a past cause, from one short exchange.',
  },
  {
    id: 'ta-complementary-transaction',
    title: 'Complementary transaction',
    definition:
      'A complementary transaction receives a response along the ego-state direction that the first message appears to invite, so the exchange can continue.',
    doesNotMean: 'It does not mean the exchange is healthy, fair, respectful, or correct.',
    evidenceQuestion: 'Did the response address the kind of message that appeared to be sent?',
    ordinaryAlternative: 'The speakers may simply share the same practical expectation.',
    caution: 'The ego-state directions are interpretations and may need correction.',
  },
  {
    id: 'ta-crossed-transaction',
    title: 'Crossed transaction',
    definition:
      'A crossed transaction answers from an unexpected ego-state direction and often interrupts the expected flow of communication.',
    doesNotMean: 'It does not mean either person is wrong or intentionally difficult.',
    evidenceQuestion:
      'How did the response differ from the question or response that seemed expected?',
    ordinaryAlternative:
      'The response may come from ambiguity, missing context, stress, or a new priority.',
    caution: 'Ask a direct clarification question before assigning meaning.',
  },
  {
    id: 'ta-ulterior-transaction',
    title: 'Ulterior transaction',
    definition:
      'An ulterior transaction may carry one message at the social level and a different message at the psychological level.',
    doesNotMean: 'It does not prove deception, manipulation, or a hidden motive.',
    evidenceQuestion:
      'What repeated words, tone descriptions, or outcomes suggest two possible levels?',
    ordinaryAlternative: 'The message may be unclear, indirect, humorous, or poorly phrased.',
    caution: 'Treat a psychological-level message as a low-confidence possibility only.',
  },
  {
    id: 'ta-games',
    title: 'Games',
    definition:
      'In classic TA, a game is a recurring sequence with an ulterior level and a familiar payoff or outcome.',
    doesNotMean: 'One conflict, refusal, misunderstanding, or difficult exchange is not enough.',
    evidenceQuestion: 'Has the same sequence and outcome happened repeatedly, with clear evidence?',
    ordinaryAlternative:
      'The problem may be a normal disagreement, unclear request, or missing resource.',
    caution: 'Do not use a game label to blame, expose, or predict a person.',
  },
  {
    id: 'ta-yes-but',
    title: '“Yes, but…” pattern',
    definition:
      'In Berne’s game terminology, “Yes, but…” describes a repeated sequence where offered solutions are discounted and a familiar outcome is confirmed.',
    doesNotMean: 'Rejecting one suggestion does not establish a game or bad intent.',
    evidenceQuestion:
      'Are suggestions repeatedly requested, rejected in the same way, and followed by the same outcome?',
    ordinaryAlternative:
      'The suggestions may not fit, or the person may want understanding rather than solutions.',
    caution: 'Ask what kind of help is wanted before applying this label.',
  },
  {
    id: 'ta-drama-triangle',
    title: 'Drama Triangle',
    definition:
      'Karpman’s Drama Triangle describes shifting Rescuer, Persecutor, and Victim interaction positions.',
    doesNotMean: 'These positions are not identities, diagnoses, or fixed roles.',
    evidenceQuestion:
      'Which exact words or actions show helping without agreement, blame or pressure, or a claim of having no choice? Do positions appear to switch?',
    ordinaryAlternative:
      'People may be helping, setting a boundary, or describing a real power limit.',
    caution: 'Do not use the model to deny harm or make all people equally responsible.',
  },
  {
    id: 'ta-life-positions',
    title: 'Life positions',
    definition:
      'Harris described four simplified stances: “I’m OK—You’re OK,” “I’m OK—You’re not OK,” “I’m not OK—You’re OK,” and “I’m not OK—You’re not OK.”',
    doesNotMean: 'They are not scores, permanent traits, or measures of human worth.',
    evidenceQuestion:
      'What words suggest a temporary stance toward self and others in this situation?',
    ordinaryAlternative:
      'The person may be reacting to one event rather than expressing a broad stance.',
    caution: 'Do not rank people or infer a life position from one message.',
  },
  {
    id: 'ta-scripts',
    title: 'Scripts',
    definition:
      'In TA, a script is a proposed early-formed life pattern that may shape repeated expectations and choices.',
    doesNotMean: 'It is not destiny, a diagnosis, or proof of a childhood cause.',
    evidenceQuestion:
      'Is there long-term, user-confirmed evidence of a repeated expectation or choice?',
    ordinaryAlternative:
      'A repeated choice may follow current limits, habits, incentives, or available options.',
    caution: 'Never infer a script, childhood event, or hidden cause from a transcript.',
  },
];
