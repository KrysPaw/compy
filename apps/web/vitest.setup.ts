import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import enMessages from './messages/en.json';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
