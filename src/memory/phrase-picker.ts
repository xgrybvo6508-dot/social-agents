import { startOfLocalDay } from '../lib/time';
import type { Phrase } from './types';

const stableScore = (id: string, seed: string): string => `${seed}:${id}`;

export const pickDuePhrases = (
  phrases: readonly Phrase[],
  now: number,
  seed: string,
  roleId?: string,
): Phrase[] => {
  const today = startOfLocalDay(now);
  return phrases
    .filter(
      (phrase) =>
        !phrase.archived &&
        (roleId === undefined || phrase.roleId === roleId) &&
        (phrase.srs.lastReviewedAt === null || phrase.srs.dueAt <= today + 86_399_999),
    )
    .toSorted((left, right) => {
      const leftGroup = left.srs.lastReviewedAt === null ? 2 : left.srs.dueAt < today ? 0 : 1;
      const rightGroup = right.srs.lastReviewedAt === null ? 2 : right.srs.dueAt < today ? 0 : 1;
      if (leftGroup !== rightGroup) return leftGroup - rightGroup;
      if (left.srs.dueAt !== right.srs.dueAt) return left.srs.dueAt - right.srs.dueAt;
      return stableScore(left.id, seed).localeCompare(stableScore(right.id, seed));
    });
};
