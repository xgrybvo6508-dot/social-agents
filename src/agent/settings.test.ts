import { describe, expect, it } from 'vitest';
import {
  SETTINGS_KEY,
  clearApiKey,
  defaultSettings,
  isAllowedBaseUrl,
  loadSettings,
  maskApiKey,
  saveSettings,
} from './settings';

describe('settings', () => {
  it('stores settings only under the settings key and masks the key', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const saved = saveSettings(storage, { ...defaultSettings(), apiKey: 'example-secret' });
    expect([...values.keys()]).toEqual([SETTINGS_KEY]);
    expect(loadSettings(storage)).toEqual(saved);
    expect(maskApiKey(saved.apiKey)).toBe('••••••••cret');
    expect(clearApiKey(storage, saved).apiKey).toBe('');
  });

  it('allows HTTPS and local HTTP only', () => {
    expect(isAllowedBaseUrl('https://example.com/v1')).toBe(true);
    expect(isAllowedBaseUrl('http://localhost:8080/v1')).toBe(true);
    expect(isAllowedBaseUrl('http://example.com/v1')).toBe(false);
  });
});
