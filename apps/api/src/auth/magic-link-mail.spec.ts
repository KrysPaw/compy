import { describe, expect, it } from 'vitest';
import { magicLinkMailCopy } from './magic-link-mail.js';

const URL = 'https://example.com/auth/verify?token=abc';

describe('magicLinkMailCopy', () => {
  it('returns English subject and body with the magic link URL', () => {
    const copy = magicLinkMailCopy('en', URL);

    expect(copy.subject).toBe('Sign in to Compy');
    expect(copy.text).toContain(URL);
    expect(copy.text).toContain('expires in 15 minutes');
  });

  it('returns Polish subject and body with the magic link URL', () => {
    const copy = magicLinkMailCopy('pl', URL);

    expect(copy.subject).toBe('Zaloguj się do Compy');
    expect(copy.text).toContain(URL);
    expect(copy.text).toContain('wygasa za 15 minut');
  });
});
