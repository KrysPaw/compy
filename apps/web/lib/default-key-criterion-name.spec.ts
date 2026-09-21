import { describe, expect, it } from 'vitest';
import { defaultKeyCriterionName } from './default-key-criterion-name';

describe('defaultKeyCriterionName', () => {
  it('returns Name for English', () => {
    expect(defaultKeyCriterionName('en')).toBe('Name');
  });

  it('returns Nazwa for Polish', () => {
    expect(defaultKeyCriterionName('pl')).toBe('Nazwa');
  });

  it('falls back to Name for unknown locales', () => {
    expect(defaultKeyCriterionName('de')).toBe('Name');
  });
});
