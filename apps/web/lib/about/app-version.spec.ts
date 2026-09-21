import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { appVersion } from './app-version';

describe('appVersion', () => {
  it('matches apps/web package.json', () => {
    expect(appVersion).toBe(packageJson.version);
  });
});
