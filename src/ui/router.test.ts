import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

describe('parseRoute', () => {
  it('maps known hashes', () => {
    expect(parseRoute('#/')).toBe('home');
    expect(parseRoute('#/phrase-prep')).toBe('phrase-prep');
    expect(parseRoute('#/settings')).toBe('settings');
  });

  it('returns not-found for unknown hashes', () => {
    expect(parseRoute('#/missing')).toBe('not-found');
  });
});
