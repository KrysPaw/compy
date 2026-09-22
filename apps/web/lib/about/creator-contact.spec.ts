import { afterEach, describe, expect, it, vi } from 'vitest';
import { getContactEmail, getCreatorName } from './creator-contact';

describe('creator-contact', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads trimmed NEXT_PUBLIC values', () => {
    vi.stubEnv('NEXT_PUBLIC_CREATOR_NAME', '  Ada Example  ');
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', '  contact@example.com  ');

    expect(getCreatorName()).toBe('Ada Example');
    expect(getContactEmail()).toBe('contact@example.com');
  });

  it('returns empty string when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_CREATOR_NAME', '');
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', '');

    expect(getCreatorName()).toBe('');
    expect(getContactEmail()).toBe('');
  });
});
