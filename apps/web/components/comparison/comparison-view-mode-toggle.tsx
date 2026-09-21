'use client';

import { LayoutGridIcon, TableIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useComparisonViewMode } from '@/hooks/use-comparison-view-mode';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ComparisonViewModeToggle() {
  const t = useTranslations('viewMode');
  const { mode, setMode, showToggle } = useComparisonViewMode();

  if (!showToggle) {
    return null;
  }

  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (value === 'table' || value === 'cards') {
          setMode(value);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label={t('label')}
    >
      <ToggleGroupItem value="table" aria-label={t('table')}>
        <TableIcon className="size-4" />
        <span className="sr-only">{t('table')}</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label={t('cards')}>
        <LayoutGridIcon className="size-4" />
        <span className="sr-only">{t('cards')}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
