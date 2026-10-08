import { hasOnlyKeys, isRecord } from '../lib/guards';

export type JsonSchema = Readonly<Record<string, unknown>>;

export type ContractValidation<T> =
  { valid: true; value: T } | { valid: false; errors: readonly string[] };

export type Contract<T> = {
  readonly schema: JsonSchema;
  validate(value: unknown): ContractValidation<T>;
};

const UNSAFE_OUTPUT =
  /\b(?:blackmail|stalk|manipulat(?:e|ion)|coerc(?:e|ion)|deceiv(?:e|ing)|trick them|pressure them|pretend to be|diagnos(?:e|is)|monitor them|track them)\b/iu;

export const exactObject = (
  value: unknown,
  keys: readonly string[],
  path: string,
  errors: string[],
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return false;
  }
  if (!hasOnlyKeys(value, keys)) errors.push(`${path} has an extra field.`);
  for (const key of keys) {
    if (!(key in value)) errors.push(`${path}.${key} is required.`);
  }
  return true;
};

export const trimmedString = (
  value: unknown,
  maxLength: number,
  path: string,
  errors: string[],
): value is string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maxLength ||
    value !== value.trim()
  ) {
    errors.push(`${path} must be a trimmed string of 1 to ${String(maxLength)} characters.`);
    return false;
  }
  return true;
};

export const enumValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  errors: string[],
): value is T => {
  if (typeof value === 'string' && allowed.some((item) => item === value)) return true;
  errors.push(`${path} is not an allowed value.`);
  return false;
};

export const stringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number,
  path: string,
  errors: string[],
): value is string[] => {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return false;
  }
  if (value.length > maxItems) errors.push(`${path} has too many items.`);
  value.forEach((item, index) => {
    trimmedString(item, maxLength, `${path}[${String(index)}]`, errors);
  });
  return true;
};

export const safeOutput = (value: unknown, path: string, errors: string[]): void => {
  if (typeof value === 'string') {
    if (UNSAFE_OUTPUT.test(value)) errors.push(`${path} contains unsafe guidance.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => safeOutput(item, `${path}[${String(index)}]`, errors));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) safeOutput(item, `${path}.${key}`, errors);
  }
};

export const invalid = <T>(errors: readonly string[]): ContractValidation<T> => ({
  valid: false,
  errors,
});

export const valid = <T>(value: T): ContractValidation<T> => ({ valid: true, value });
