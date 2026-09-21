/** Default display name for the built-in key criterion, frozen at comparison create. */
export function defaultKeyCriterionName(locale: string): 'Name' | 'Nazwa' {
  return locale === 'pl' ? 'Nazwa' : 'Name';
}
