import { describe, expect, it } from 'vitest';
import { newSrsState, reviewPhrase } from './phrase-srs';

describe('phrase scheduling', () => {
  it('grows intervals after recall and resets after difficulty', () => {
    const now = new Date(2026, 0, 1, 12).getTime();
    const first = reviewPhrase(newSrsState(now), 5, now, 'phrase-1');
    const second = reviewPhrase(first, 4, now, 'phrase-1');
    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(3);
    const reset = reviewPhrase(second, 1, now, 'phrase-1');
    expect(reset.reps).toBe(0);
    expect(reset.lapses).toBe(1);
    expect(reset.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('does not add another lapse for a same-session retry', () => {
    const now = Date.now();
    const first = reviewPhrase(newSrsState(now), 0, now, 'phrase-1');
    const retry = reviewPhrase(first, 1, now, 'phrase-1', true);
    expect(retry.lapses).toBe(1);
  });
});
