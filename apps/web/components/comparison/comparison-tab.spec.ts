import { describe, expect, it } from 'vitest';
import {
  comparisonTabFromPathname,
  comparisonTabHref,
} from './comparison-tab';

describe('comparisonTabFromPathname', () => {
  it('maps known suffixes and defaults to entries', () => {
    expect(
      comparisonTabFromPathname('/comparisons/x/criteria'),
    ).toBe('criteria');
    expect(comparisonTabFromPathname('/comparisons/x/entries')).toBe('entries');
    expect(comparisonTabFromPathname('/comparisons/x/rules')).toBe('rules');
    expect(comparisonTabFromPathname('/comparisons/x/results')).toBe('results');
    expect(comparisonTabFromPathname('/comparisons/x')).toBe('entries');
  });
});

describe('comparisonTabHref', () => {
  it('builds the tab path', () => {
    expect(comparisonTabHref('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'rules')).toBe(
      '/comparisons/01ARZ3NDEKTSV4RRFFQ69G5FAV/rules',
    );
  });
});
