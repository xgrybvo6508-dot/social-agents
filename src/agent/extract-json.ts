import { err, ok, type Result } from '../lib/result';

export const MAX_MODE_OUTPUT_CHARS = 32_000;

export type JsonExtractionError = 'oversized' | 'missing-object' | 'malformed-json';

const findObjectEnd = (text: string, start: number): number | null => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return null;
};

export const extractJsonObject = (output: string): Result<unknown, JsonExtractionError> => {
  if (output.length > MAX_MODE_OUTPUT_CHARS) return err('oversized');

  for (let start = output.indexOf('{'); start >= 0; start = output.indexOf('{', start + 1)) {
    const end = findObjectEnd(output, start);
    if (end === null) continue;
    try {
      const parsed = JSON.parse(output.slice(start, end + 1)) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return ok(parsed);
      }
    } catch {
      // A later object may still be valid.
    }
  }

  return err(output.includes('{') ? 'malformed-json' : 'missing-object');
};
