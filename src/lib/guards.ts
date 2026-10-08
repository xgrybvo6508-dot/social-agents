export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isString = (value: unknown, maxLength = Number.POSITIVE_INFINITY): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

export const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).every((key) => keys.includes(key));

export const isStringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number,
): value is string[] =>
  Array.isArray(value) &&
  value.length <= maxItems &&
  value.every((item) => typeof item === 'string' && item.length <= maxLength);
