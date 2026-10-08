import { startOfLocalDay } from '../lib/time';
import type { ReviewGrade, SrsState } from './types';

const DAY = 86_400_000;

export const newSrsState = (now: number): SrsState => ({
  ease: 2.5,
  intervalDays: 0,
  reps: 0,
  lapses: 0,
  dueAt: now,
  lastReviewedAt: null,
  lastGrade: null,
});

const hash = (value: string): number => {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const fuzz = (days: number, seed: string): number => {
  if (days < 3) return days;
  const offset = (hash(seed) % 21) - 10;
  return Math.max(1, Math.round(days * (1 + offset / 100)));
};

const updatedEase = (ease: number, grade: ReviewGrade): number => {
  const quality = grade;
  const next = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.min(2.8, Math.max(1.3, next));
};

export const reviewPhrase = (
  current: SrsState,
  grade: ReviewGrade,
  now: number,
  phraseId: string,
  alreadyLapsedThisSession = false,
): SrsState => {
  if (grade <= 2) {
    return {
      ease: Math.max(1.3, current.ease - 0.2),
      intervalDays: 1,
      reps: 0,
      lapses: current.lapses + (alreadyLapsedThisSession ? 0 : 1),
      dueAt: startOfLocalDay(now) + DAY,
      lastReviewedAt: now,
      lastGrade: grade,
    };
  }
  const baseInterval =
    current.reps === 0
      ? 1
      : current.reps === 1
        ? 3
        : Math.round(current.intervalDays * current.ease);
  const intervalDays = fuzz(baseInterval, `${phraseId}:${String(current.reps)}:${String(grade)}`);
  return {
    ease: updatedEase(current.ease, grade),
    intervalDays,
    reps: current.reps + 1,
    lapses: current.lapses,
    dueAt: startOfLocalDay(now) + intervalDays * DAY,
    lastReviewedAt: now,
    lastGrade: grade,
  };
};
