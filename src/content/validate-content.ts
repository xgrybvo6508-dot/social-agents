import { hasOnlyKeys, isRecord } from '../lib/guards';
import {
  PHRASE_CATEGORIES,
  STARTER_PHRASES,
  STARTER_ROLE_IDS,
  type PhraseCategory,
  type StarterRoleId,
} from './starter-phrases';
import { TA_CARDS } from './ta-cards';
import { WORKSHEETS, WORKSHEET_MODES, type WorksheetMode } from './worksheets';

export type ContentValidationResult = {
  valid: boolean;
  errors: readonly string[];
};

const PHRASE_KEYS = ['id', 'roleId', 'category', 'situation', 'text', 'note', 'easyNo'] as const;
const TA_CARD_KEYS = [
  'id',
  'title',
  'definition',
  'doesNotMean',
  'evidenceQuestion',
  'ordinaryAlternative',
  'caution',
] as const;
const WORKSHEET_KEYS = [
  'id',
  'mode',
  'title',
  'purpose',
  'privacyReminder',
  'steps',
  'completion',
] as const;
const STEP_KEYS = ['id', 'title', 'instruction', 'prompts'] as const;

const REQUIRED_TA_CARD_IDS = [
  'ta-ego-states',
  'ta-parent',
  'ta-adult',
  'ta-child',
  'ta-complementary-transaction',
  'ta-crossed-transaction',
  'ta-ulterior-transaction',
  'ta-games',
  'ta-yes-but',
  'ta-drama-triangle',
  'ta-life-positions',
  'ta-scripts',
] as const;

const MIN_WORKSHEET_STEPS: Readonly<Record<WorksheetMode, number>> = {
  'phrase-preparation': 6,
  'phrase-training': 6,
  'conversation-helper': 7,
  'task-extraction': 7,
  'transactional-analysis': 9,
};

const hasPrivateContactData = (text: string): boolean =>
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(text) ||
  /(?:https?:\/\/|www\.)/iu.test(text) ||
  /@[a-z0-9_]{2,}/iu.test(text) ||
  /\+?\d[\d ().-]{7,}\d/u.test(text) ||
  /\bapi[_ -]?key\s*[:=]\s*\S+/iu.test(text);

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === 'string' && values.some((candidate) => candidate === value);

const readText = (
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
  path: string,
  errors: string[],
): string | undefined => {
  const value = record[key];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.length > maxLength
  ) {
    errors.push(`${path}.${key} must be a trimmed string of 1 to ${String(maxLength)} characters.`);
    return undefined;
  }
  if (hasPrivateContactData(value)) {
    errors.push(`${path}.${key} contains private contact data or a secret-like value.`);
  }
  return value;
};

const checkUniqueId = (
  id: string | undefined,
  path: string,
  ids: Set<string>,
  errors: string[],
): void => {
  if (id === undefined) return;
  if (ids.has(id)) errors.push(`${path}.id duplicates ${id}.`);
  ids.add(id);
};

export const validateStarterPhrases = (phrases: readonly unknown[]): readonly string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const roleCounts = new Map<StarterRoleId, number>(STARTER_ROLE_IDS.map((roleId) => [roleId, 0]));

  if (phrases.length !== 50) errors.push('Starter phrases must contain exactly 50 records.');

  phrases.forEach((value, index) => {
    const path = `starterPhrases[${String(index)}]`;
    if (!isRecord(value)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    if (!hasOnlyKeys(value, PHRASE_KEYS)) errors.push(`${path} has an unsupported field.`);

    const id = readText(value, 'id', 80, path, errors);
    const situation = readText(value, 'situation', 160, path, errors);
    const text = readText(value, 'text', 240, path, errors);
    readText(value, 'note', 240, path, errors);
    checkUniqueId(id, path, ids, errors);

    const roleId = value.roleId;
    if (!isOneOf(roleId, STARTER_ROLE_IDS)) {
      errors.push(`${path}.roleId is not supported.`);
    } else {
      roleCounts.set(roleId, (roleCounts.get(roleId) ?? 0) + 1);
    }

    const category = value.category;
    if (!isOneOf<PhraseCategory>(category, PHRASE_CATEGORIES)) {
      errors.push(`${path}.category is not supported.`);
    }
    if (typeof value.easyNo !== 'boolean') errors.push(`${path}.easyNo must be a boolean.`);

    if (category === 'invitation') {
      if (value.easyNo !== true) errors.push(`${path} invitation must set easyNo to true.`);
      if (text !== undefined && !/(?:say no|if not|fine to say no)/iu.test(text)) {
        errors.push(`${path} invitation must contain a clear no option.`);
      }
      if (text !== undefined && !/\badult\b/iu.test(text)) {
        errors.push(`${path} invitation must state the adult context.`);
      }
      if (text !== undefined && !/\b(?:project|team|collaborat\w*)\b/iu.test(text)) {
        errors.push(`${path} invitation must stay project-focused.`);
      }
    }
    if (situation === undefined) return;
  });

  for (const [roleId, count] of roleCounts) {
    if (count !== 10) errors.push(`${roleId} must have exactly 10 starter phrases.`);
  }
  return errors;
};

export const validateTaCards = (cards: readonly unknown[]): readonly string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (cards.length < 12) errors.push('TA cards must contain at least 12 records.');

  cards.forEach((value, index) => {
    const path = `taCards[${String(index)}]`;
    if (!isRecord(value)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    if (!hasOnlyKeys(value, TA_CARD_KEYS)) errors.push(`${path} has an unsupported field.`);
    const id = readText(value, 'id', 80, path, errors);
    checkUniqueId(id, path, ids, errors);
    readText(value, 'title', 100, path, errors);
    readText(value, 'definition', 500, path, errors);
    readText(value, 'doesNotMean', 300, path, errors);
    readText(value, 'evidenceQuestion', 300, path, errors);
    readText(value, 'ordinaryAlternative', 300, path, errors);
    readText(value, 'caution', 300, path, errors);
  });

  for (const id of REQUIRED_TA_CARD_IDS) {
    if (!ids.has(id)) errors.push(`TA cards are missing required card ${id}.`);
  }
  return errors;
};

export const validateWorksheets = (worksheets: readonly unknown[]): readonly string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const stepIds = new Set<string>();
  const modeCounts = new Map<WorksheetMode, number>(WORKSHEET_MODES.map((mode) => [mode, 0]));
  if (worksheets.length !== WORKSHEET_MODES.length) {
    errors.push('Worksheets must contain exactly one workflow for each mode.');
  }

  worksheets.forEach((value, index) => {
    const path = `worksheets[${String(index)}]`;
    if (!isRecord(value)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    if (!hasOnlyKeys(value, WORKSHEET_KEYS)) errors.push(`${path} has an unsupported field.`);
    const id = readText(value, 'id', 80, path, errors);
    checkUniqueId(id, path, ids, errors);
    readText(value, 'title', 120, path, errors);
    readText(value, 'purpose', 300, path, errors);
    readText(value, 'privacyReminder', 300, path, errors);
    readText(value, 'completion', 300, path, errors);

    const mode = value.mode;
    if (!isOneOf(mode, WORKSHEET_MODES)) {
      errors.push(`${path}.mode is not supported.`);
    } else {
      modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
    }

    if (!isUnknownArray(value.steps)) {
      errors.push(`${path}.steps must be an array.`);
      return;
    }
    if (isOneOf(mode, WORKSHEET_MODES) && value.steps.length < MIN_WORKSHEET_STEPS[mode]) {
      errors.push(`${path}.steps does not contain the complete manual workflow.`);
    }
    value.steps.forEach((step, stepIndex) => {
      const stepPath = `${path}.steps[${String(stepIndex)}]`;
      if (!isRecord(step)) {
        errors.push(`${stepPath} must be an object.`);
        return;
      }
      if (!hasOnlyKeys(step, STEP_KEYS)) errors.push(`${stepPath} has an unsupported field.`);
      const stepId = readText(step, 'id', 100, stepPath, errors);
      checkUniqueId(stepId, stepPath, stepIds, errors);
      readText(step, 'title', 120, stepPath, errors);
      readText(step, 'instruction', 400, stepPath, errors);
      if (!isUnknownArray(step.prompts) || step.prompts.length === 0) {
        errors.push(`${stepPath}.prompts must contain at least one prompt.`);
      } else {
        step.prompts.forEach((prompt, promptIndex) => {
          const promptRecord = { prompt };
          readText(
            promptRecord,
            'prompt',
            300,
            `${stepPath}.prompts[${String(promptIndex)}]`,
            errors,
          );
        });
      }
    });
  });

  for (const [mode, count] of modeCounts) {
    if (count !== 1) errors.push(`${mode} must have exactly one worksheet.`);
  }
  return errors;
};

export const validateOfflineContent = (): ContentValidationResult => {
  const errors = [
    ...validateStarterPhrases(STARTER_PHRASES),
    ...validateTaCards(TA_CARDS),
    ...validateWorksheets(WORKSHEETS),
  ];
  return { valid: errors.length === 0, errors };
};
