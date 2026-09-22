export type ComparisonTab = 'rules' | 'criteria' | 'entries' | 'results';

export function comparisonTabFromPathname(pathname: string): ComparisonTab {
  if (pathname.endsWith('/rules')) {
    return 'rules';
  }
  if (pathname.endsWith('/criteria')) {
    return 'criteria';
  }
  if (pathname.endsWith('/results')) {
    return 'results';
  }
  return 'entries';
}

export function comparisonTabHref(
  publicId: string,
  tab: ComparisonTab,
): string {
  return `/comparisons/${publicId}/${tab}`;
}
