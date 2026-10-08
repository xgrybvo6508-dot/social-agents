import { isRecord } from '../lib/guards';

export const SETTINGS_KEY = 'sa:settings';

export type ProviderId = 'nous' | 'openrouter' | 'groq' | 'custom';

export type ProviderPreset = {
  id: ProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
};

export const PROVIDERS: readonly ProviderPreset[] = [
  {
    id: 'nous',
    label: 'Nous Portal',
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    defaultModel: 'poolside/laguna-s-2.1:free',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: '',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
  },
  { id: 'custom', label: 'Custom', baseUrl: '', defaultModel: '' },
] as const;

export type Settings = {
  version: 1;
  provider: ProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export const defaultSettings = (): Settings => {
  const provider = PROVIDERS[0];
  if (provider === undefined) throw new Error('Provider presets are missing.');
  return {
    version: 1,
    provider: provider.id,
    baseUrl: provider.baseUrl,
    model: provider.defaultModel,
    apiKey: '',
  };
};

const isProvider = (value: unknown): value is ProviderId =>
  typeof value === 'string' && PROVIDERS.some((provider) => provider.id === value);

export const isAllowedBaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
    );
  } catch {
    return false;
  }
};

export const validateSettings = (value: unknown): Settings | null => {
  if (!isRecord(value) || value.version !== 1 || !isProvider(value.provider)) return null;
  if (
    typeof value.baseUrl !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.apiKey !== 'string' ||
    value.baseUrl.length > 500 ||
    value.model.length > 200 ||
    value.apiKey.length > 1000
  ) {
    return null;
  }
  return {
    version: 1,
    provider: value.provider,
    baseUrl: value.baseUrl.trim().replace(/\/+$/, ''),
    model: value.model.trim(),
    apiKey: value.apiKey.trim(),
  };
};

export const loadSettings = (storage: Pick<Storage, 'getItem'>): Settings => {
  const raw = storage.getItem(SETTINGS_KEY);
  if (raw === null) return defaultSettings();
  try {
    return validateSettings(JSON.parse(raw) as unknown) ?? defaultSettings();
  } catch {
    return defaultSettings();
  }
};

export const saveSettings = (storage: Pick<Storage, 'setItem'>, settings: Settings): Settings => {
  const valid = validateSettings(settings);
  if (valid === null) throw new Error('Settings are invalid.');
  storage.setItem(SETTINGS_KEY, JSON.stringify(valid));
  return valid;
};

export const clearApiKey = (storage: Pick<Storage, 'setItem'>, settings: Settings): Settings =>
  saveSettings(storage, { ...settings, apiKey: '' });

export const maskApiKey = (apiKey: string): string =>
  apiKey.length === 0 ? 'No key saved' : `••••••••${apiKey.slice(-4)}`;

export const applyPreset = (providerId: ProviderId, current: Settings): Settings => {
  const preset = PROVIDERS.find((item) => item.id === providerId);
  if (preset === undefined) return current;
  return {
    ...current,
    provider: providerId,
    baseUrl: preset.baseUrl,
    model: preset.defaultModel,
  };
};
