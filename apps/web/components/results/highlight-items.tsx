'use client';

import { useTranslations } from 'next-intl';
import { MinusIcon, PlusIcon } from 'lucide-react';
import type { HighlightItem } from '@compy/shared';
import { formatHighlightLabel } from '@/lib/format-highlight';

export function HighlightItems({
  items,
  kind,
}: {
  items: HighlightItem[];
  kind: 'pro' | 'con';
}) {
  const t = useTranslations('results');
  const Icon = kind === 'pro' ? PlusIcon : MinusIcon;
  const iconClass =
    kind === 'pro'
      ? 'size-3.5 shrink-0 text-emerald-600'
      : 'size-3.5 shrink-0 text-red-600';
  const messages = {
    yes: t('highlightYes'),
    no: t('highlightNo'),
    high: t('highlightHigh'),
    low: t('highlightLow'),
  };

  return items.map((item) => {
    const label = formatHighlightLabel(item, messages);
    return (
      <li key={`${kind}:${label}`} className="inline-flex items-center gap-1.5">
        <Icon aria-hidden className={iconClass} />
        <span>{label}</span>
      </li>
    );
  });
}
