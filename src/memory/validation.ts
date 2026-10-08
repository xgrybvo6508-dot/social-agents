import { hasOnlyKeys, isRecord, isStringArray } from '../lib/guards';
import type {
  Group,
  MemoryData,
  Person,
  Phrase,
  Role,
  SavedTask,
  Session,
  TaFixation,
} from './types';

const base = (value: Record<string, unknown>): boolean =>
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  value.id.length <= 100 &&
  typeof value.createdAt === 'number' &&
  Number.isFinite(value.createdAt) &&
  typeof value.updatedAt === 'number' &&
  Number.isFinite(value.updatedAt);

const text = (value: unknown, max = 2000): value is string =>
  typeof value === 'string' && value.length <= max;

const person = (value: unknown): value is Person =>
  isRecord(value) &&
  hasOnlyKeys(value, ['id', 'label', 'context', 'notes', 'createdAt', 'updatedAt']) &&
  base(value) &&
  text(value.label, 160) &&
  text(value.context) &&
  text(value.notes);

const group = (value: unknown): value is Group =>
  isRecord(value) &&
  hasOnlyKeys(value, ['id', 'label', 'purpose', 'memberIds', 'notes', 'createdAt', 'updatedAt']) &&
  base(value) &&
  text(value.label, 160) &&
  text(value.purpose) &&
  isStringArray(value.memberIds, 200, 100) &&
  text(value.notes);

const role = (value: unknown): value is Role =>
  isRecord(value) &&
  hasOnlyKeys(value, ['id', 'label', 'description', 'builtIn', 'createdAt', 'updatedAt']) &&
  base(value) &&
  text(value.label, 160) &&
  text(value.description, 1000) &&
  typeof value.builtIn === 'boolean';

const phrase = (value: unknown): value is Phrase => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'id',
      'roleId',
      'situation',
      'category',
      'text',
      'note',
      'source',
      'archived',
      'srs',
      'createdAt',
      'updatedAt',
    ]) ||
    !base(value) ||
    !isRecord(value.srs)
  ) {
    return false;
  }
  const srs = value.srs;
  return (
    text(value.roleId, 100) &&
    text(value.situation, 500) &&
    text(value.category, 80) &&
    text(value.text, 500) &&
    text(value.note, 500) &&
    ['starter', 'manual', 'agent'].includes(String(value.source)) &&
    typeof value.archived === 'boolean' &&
    typeof srs.ease === 'number' &&
    typeof srs.intervalDays === 'number' &&
    typeof srs.reps === 'number' &&
    typeof srs.lapses === 'number' &&
    typeof srs.dueAt === 'number' &&
    (srs.lastReviewedAt === null || typeof srs.lastReviewedAt === 'number') &&
    (srs.lastGrade === null ||
      (typeof srs.lastGrade === 'number' && srs.lastGrade >= 0 && srs.lastGrade <= 5))
  );
};

const session = (value: unknown): value is Session =>
  isRecord(value) &&
  base(value) &&
  text(value.mode, 80) &&
  isStringArray(value.relatedIds, 100, 100) &&
  text(value.summary, 3000) &&
  Array.isArray(value.reviewEvents) &&
  value.reviewEvents.length <= 500 &&
  typeof value.startedAt === 'number' &&
  typeof value.endedAt === 'number';

const task = (value: unknown): value is SavedTask =>
  isRecord(value) &&
  base(value) &&
  text(value.title, 160) &&
  text(value.sourceExcerpt, 5000) &&
  Array.isArray(value.items) &&
  value.items.length <= 100 &&
  isStringArray(value.unknowns, 50, 500) &&
  ['open', 'done', 'paused'].includes(String(value.status));

const taFixation = (value: unknown): value is TaFixation =>
  isRecord(value) &&
  base(value) &&
  ['person', 'group'].includes(String(value.scope)) &&
  isStringArray(value.subjectIds, 100, 100) &&
  isStringArray(value.observations, 50, 1000) &&
  isStringArray(value.hypotheses, 50, 1000) &&
  isStringArray(value.voices, 50, 1000) &&
  isStringArray(value.options, 50, 1000) &&
  text(value.decision, 2000);

export const validateMemoryData = (value: unknown): MemoryData | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'people',
      'groups',
      'roles',
      'phrases',
      'sessions',
      'tasks',
      'taFixations',
    ])
  ) {
    return null;
  }
  const checks = [
    ['people', person],
    ['groups', group],
    ['roles', role],
    ['phrases', phrase],
    ['sessions', session],
    ['tasks', task],
    ['taFixations', taFixation],
  ] as const;
  for (const [key, guard] of checks) {
    const records = value[key];
    if (!Array.isArray(records) || records.length > 10_000 || !records.every(guard)) return null;
  }
  return value as MemoryData;
};
