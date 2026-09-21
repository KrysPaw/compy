import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  COMPARISON_VIEW_MODE_KEY,
  DEFAULT_COMPARISON_VIEW_MODE,
  parseComparisonViewMode,
  readStoredComparisonViewMode,
  writeStoredComparisonViewMode,
} from './comparison-view-mode';

describe('comparison-view-mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('parses stored values and falls back to table', () => {
    expect(parseComparisonViewMode('table')).toBe('table');
    expect(parseComparisonViewMode('cards')).toBe('cards');
    expect(parseComparisonViewMode('nope')).toBe(DEFAULT_COMPARISON_VIEW_MODE);
    expect(parseComparisonViewMode(null)).toBe(DEFAULT_COMPARISON_VIEW_MODE);
  });

  it('reads and writes localStorage', () => {
    expect(readStoredComparisonViewMode()).toBe('table');
    writeStoredComparisonViewMode('cards');
    expect(window.localStorage.getItem(COMPARISON_VIEW_MODE_KEY)).toBe('cards');
    expect(readStoredComparisonViewMode()).toBe('cards');
  });
});
