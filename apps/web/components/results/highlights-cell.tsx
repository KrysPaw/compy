'use client';

import { useTranslations } from 'next-intl';
import type { HighlightItem } from '@compy/shared';
import { HighlightItems } from '@/components/results/highlight-items';

export function HighlightsCell({
  pros,
  cons,
}: {
  pros: HighlightItem[];
  cons: HighlightItem[];
}) {
  const t = useTranslations('common');

  if (pros.length === 0 && cons.length === 0) {
    return t('emDash');
  }

  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      <HighlightItems items={pros} kind="pro" />
      <HighlightItems items={cons} kind="con" />
    </ul>
  );
}
