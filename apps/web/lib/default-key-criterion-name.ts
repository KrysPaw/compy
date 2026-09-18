/** Lowercase default for the built-in key criterion, frozen at comparison create. */
export function defaultKeyCriterionName(locale: string): 'name' | 'nazwa' {
  return locale === 'pl' ? 'nazwa' : 'name';
}
