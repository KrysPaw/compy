import { describe, expect, it } from 'vitest';
import { defaultKeyCriterionName } from './default-key-criterion-name';

describe('defaultKeyCriterionName', () => {
  it('returns name for English', () => {
    expect(defaultKeyCriterionName('en')).toBe('name');
  });

  it('returns nazwa for Polish', () => {
    expect(defaultKeyCriterionName('pl')).toBe('nazwa');
  });

  it('falls back to name for unknown locales', () => {
    expect(defaultKeyCriterionName('de')).toBe('name');
  });
});
