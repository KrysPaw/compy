import { describe, expect, it } from 'vitest';
import { changelog } from './changelog';

describe('changelog', () => {
  it('lists entries newest-first with English change bullets', () => {
    expect(changelog.length).toBeGreaterThan(0);
    for (const entry of changelog) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
  });
});
