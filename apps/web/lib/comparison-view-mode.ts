export const COMPARISON_VIEW_MODE_KEY = 'compy:comparison-view-mode';

export type ComparisonViewMode = 'table' | 'cards';

export const DEFAULT_COMPARISON_VIEW_MODE: ComparisonViewMode = 'table';

export function parseComparisonViewMode(
  value: string | null,
): ComparisonViewMode {
  if (value === 'cards' || value === 'table') {
    return value;
  }

  return DEFAULT_COMPARISON_VIEW_MODE;
}

export function readStoredComparisonViewMode(): ComparisonViewMode {
  if (typeof window === 'undefined') {
    return DEFAULT_COMPARISON_VIEW_MODE;
  }

  try {
    return parseComparisonViewMode(
      window.localStorage.getItem(COMPARISON_VIEW_MODE_KEY),
    );
  } catch {
    return DEFAULT_COMPARISON_VIEW_MODE;
  }
}

export function writeStoredComparisonViewMode(mode: ComparisonViewMode) {
  try {
    window.localStorage.setItem(COMPARISON_VIEW_MODE_KEY, mode);
  } catch {
    // Ignore quota / private-mode failures; in-memory state still updates.
  }
}
