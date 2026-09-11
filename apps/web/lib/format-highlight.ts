import type { HighlightItem } from '@compy/shared';

/** Minimal translator for highlight value tokens (yes/no/high/low). */
export type HighlightMessages = {
  yes: string;
  no: string;
  high: string;
  low: string;
};

/** Formats a structured highlight as `{name} · {token}` without conjugating the name. */
export function formatHighlightLabel(
  item: HighlightItem,
  messages: HighlightMessages,
): string {
  const value =
    item.type === 'boolean'
      ? item.value
        ? messages.yes
        : messages.no
      : item.type === 'direction'
        ? item.level === 'high'
          ? messages.high
          : messages.low
        : item.value;

  return `${item.name} · ${value}`;
}
