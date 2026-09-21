'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { WEIGHT_POOL_TOTAL } from '@compy/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WeightStepper({
  name,
  value,
  remaining,
  onChange,
}: {
  name: string;
  value: number;
  remaining: number;
  onChange: (next: number) => void;
}) {
  const t = useTranslations();
  const max = Math.min(WEIGHT_POOL_TOTAL, value + Math.max(0, remaining));
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commitDraft() {
    const parsed = Number.parseInt(draft, 10);

    if (!Number.isInteger(parsed)) {
      setDraft(String(value));
      return;
    }

    const clamped = Math.min(max, Math.max(0, parsed));
    setDraft(String(clamped));

    if (clamped !== value) {
      onChange(clamped);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="default"
        size="icon-xs"
        aria-label={t('rules.decreaseWeight', { name })}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        aria-label={t('rules.weightFor', { name })}
        className="h-7 w-12 px-1 text-center"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <Button
        type="button"
        variant="default"
        size="icon-xs"
        aria-label={t('rules.increaseWeight', { name })}
        disabled={remaining <= 0 || value >= WEIGHT_POOL_TOTAL}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
