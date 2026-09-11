import { describe, expect, it } from 'vitest';
import {
  defaultLocale,
  localeFromAcceptLanguage,
  resolveLocale,
} from './config';
import en from '../messages/en.json';
import pl from '../messages/pl.json';

function keyTree(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    keyTree(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('catalogs', () => {
  it('keeps en and pl key trees identical', () => {
    expect(keyTree(pl).sort()).toEqual(keyTree(en).sort());
  });
});

describe('resolveLocale', () => {
  it('uses a valid cookie over Accept-Language', () => {
    expect(resolveLocale('pl', 'en')).toBe('pl');
    expect(resolveLocale('en', 'pl')).toBe('en');
  });

  it('ignores invalid cookies and negotiates Accept-Language', () => {
    expect(resolveLocale('de', 'pl-PL,en;q=0.8')).toBe('pl');
    expect(resolveLocale(undefined, 'en-US,pl;q=0.5')).toBe('en');
    expect(resolveLocale('nope', 'de,fr')).toBe(defaultLocale);
  });
});

describe('localeFromAcceptLanguage', () => {
  it('prefers Polish when it ranks above English', () => {
    expect(localeFromAcceptLanguage('pl,en;q=0.8')).toBe('pl');
    expect(localeFromAcceptLanguage('en,pl;q=0.8')).toBe('en');
  });
});
