import { describe, expect, it } from 'vitest';
import {
  PHRASE_CATEGORIES,
  STARTER_PHRASES,
  STARTER_ROLE_IDS,
  type PhraseCategory,
  type StarterRoleId,
} from './starter-phrases';
import { TA_CARDS } from './ta-cards';
import {
  validateOfflineContent,
  validateStarterPhrases,
  validateTaCards,
  validateWorksheets,
} from './validate-content';
import { WORKSHEETS, WORKSHEET_MODES } from './worksheets';

const categoryCounts = (roleId: StarterRoleId): Readonly<Record<PhraseCategory, number>> => {
  const counts = Object.fromEntries(PHRASE_CATEGORIES.map((category) => [category, 0])) as Record<
    PhraseCategory,
    number
  >;
  for (const phrase of STARTER_PHRASES) {
    if (phrase.roleId === roleId) counts[phrase.category] += 1;
  }
  return counts;
};

describe('offline content', () => {
  it('passes the complete content validator', () => {
    expect(validateOfflineContent()).toEqual({ valid: true, errors: [] });
  });

  it('has exactly ten phrases for every stable role', () => {
    expect(STARTER_PHRASES).toHaveLength(50);
    for (const roleId of STARTER_ROLE_IDS) {
      expect(STARTER_PHRASES.filter((phrase) => phrase.roleId === roleId)).toHaveLength(10);
    }
  });

  it('matches the planned phrase category balance', () => {
    expect(categoryCounts('role-teammate')).toEqual({
      opener: 1,
      'follow-up': 3,
      clarification: 2,
      boundary: 1,
      invitation: 2,
      ending: 1,
    });
    expect(categoryCounts('role-team-lead')).toEqual({
      opener: 0,
      'follow-up': 2,
      clarification: 4,
      boundary: 1,
      invitation: 2,
      ending: 1,
    });
    expect(categoryCounts('role-new-acquaintance')).toEqual({
      opener: 2,
      'follow-up': 2,
      clarification: 1,
      boundary: 1,
      invitation: 2,
      ending: 2,
    });
    expect(categoryCounts('role-meetup-attendee')).toEqual({
      opener: 3,
      'follow-up': 3,
      clarification: 1,
      boundary: 1,
      invitation: 1,
      ending: 1,
    });
    expect(categoryCounts('role-coding-contest-participant')).toEqual({
      opener: 3,
      'follow-up': 1,
      clarification: 2,
      boundary: 1,
      invitation: 2,
      ending: 1,
    });
  });

  it('provides the required TA references', () => {
    expect(TA_CARDS.length).toBeGreaterThanOrEqual(12);
    expect(TA_CARDS.map((card) => card.id)).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });

  it('provides one complete manual worksheet for every mode', () => {
    expect(WORKSHEETS.map((worksheet) => worksheet.mode)).toEqual(WORKSHEET_MODES);
    const text = JSON.stringify(WORKSHEETS);
    expect(text).toContain('0 to 5');
    expect(text).toContain('Ordinary alternative');
    expect(text).toContain('Source evidence');
    expect(text).toContain('Voice all voices');
    expect(text).toContain('save this fixation');
  });

  it('detects duplicate IDs, unsupported roles, and missing required fields', () => {
    const duplicatedPhrases: readonly unknown[] = [
      ...STARTER_PHRASES.slice(0, 49),
      STARTER_PHRASES[0],
    ];
    expect(validateStarterPhrases(duplicatedPhrases).join(' ')).toContain('duplicates');

    const unsupportedRole: readonly unknown[] = [
      { ...STARTER_PHRASES[0], roleId: 'role-unsupported' },
      ...STARTER_PHRASES.slice(1),
    ];
    expect(validateStarterPhrases(unsupportedRole).join(' ')).toContain('roleId is not supported');

    const missingTaTitle: readonly unknown[] = [
      { ...TA_CARDS[0], title: '' },
      ...TA_CARDS.slice(1),
    ];
    expect(validateTaCards(missingTaTitle).join(' ')).toContain('.title must be');

    const duplicateWorksheet: readonly unknown[] = [
      WORKSHEETS[0],
      WORKSHEETS[0],
      ...WORKSHEETS.slice(2),
    ];
    expect(validateWorksheets(duplicateWorksheet).join(' ')).toContain('duplicates');
  });
});
