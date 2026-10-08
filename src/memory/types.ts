export type BaseRecord = {
  id: string;
  createdAt: number;
  updatedAt: number;
};

export type Person = BaseRecord & { label: string; context: string; notes: string };
export type Group = BaseRecord & {
  label: string;
  purpose: string;
  memberIds: string[];
  notes: string;
};
export type Role = BaseRecord & {
  label: string;
  description: string;
  builtIn: boolean;
};

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;
export type SrsState = {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: number;
  lastReviewedAt: number | null;
  lastGrade: ReviewGrade | null;
};

export type Phrase = BaseRecord & {
  roleId: string;
  situation: string;
  category: string;
  text: string;
  note: string;
  source: 'starter' | 'manual' | 'agent';
  archived: boolean;
  srs: SrsState;
};

export type ReviewEvent = { phraseId: string; grade: ReviewGrade; reviewedAt: number };
export type Session = BaseRecord & {
  mode: string;
  relatedIds: string[];
  summary: string;
  reviewEvents: ReviewEvent[];
  startedAt: number;
  endedAt: number;
};

export type TaskItem = {
  action: string;
  evidence: string;
  owner: 'user' | 'other' | 'shared' | 'unknown';
  timing: string | null;
  confidence: 'stated' | 'likely' | 'uncertain';
  dependencies: string[];
};
export type SavedTask = BaseRecord & {
  title: string;
  sourceExcerpt: string;
  items: TaskItem[];
  unknowns: string[];
  status: 'open' | 'done' | 'paused';
};

export type TaFixation = BaseRecord & {
  scope: 'person' | 'group';
  subjectIds: string[];
  observations: string[];
  hypotheses: string[];
  voices: string[];
  options: string[];
  decision: string;
};

export type MemoryRecordMap = {
  people: Person;
  groups: Group;
  roles: Role;
  phrases: Phrase;
  sessions: Session;
  tasks: SavedTask;
  taFixations: TaFixation;
};

export type MemoryStoreName = keyof MemoryRecordMap;
export const MEMORY_STORES: readonly MemoryStoreName[] = [
  'people',
  'groups',
  'roles',
  'phrases',
  'sessions',
  'tasks',
  'taFixations',
];

export type MemoryData = { [K in MemoryStoreName]: MemoryRecordMap[K][] };
