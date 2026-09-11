import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import enMessages from './messages/en.json';

function lookup(tree: unknown, path: string[]): unknown {
  let current: unknown = tree;
  for (const segment of path) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(segment in current)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function formatSimple(template: string, values?: Record<string, unknown>) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] === undefined ? `{${key}}` : String(values[key]),
  );
}

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) => {
    return (key: string, values?: Record<string, unknown>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const found = lookup(enMessages, path.split('.'));
      return typeof found === 'string' ? formatSimple(found, values) : path;
    };
  },
  getLocale: async () => 'en',
  getMessages: async () => enMessages,
}));
