'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EnumRuleBoard } from '@/components/rules/enum-rule-board';
import {
  addEnumTier,
  createEnumRuleDraft,
  enumRuleDraftToConfig,
  formatEnumRuleSummary,
  isEnumRuleDraftComplete,
  moveEnumValue,
  removeEnumTier,
} from '@/lib/format-rule';

export function EnumRuleDialog({
  criterionName,
  options,
  ruleConfig,
  onSave,
}: {
  criterionName: string;
  options: string[];
  ruleConfig: unknown;
  onSave: (next: unknown) => void;
}) {
  const t = useTranslations();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    createEnumRuleDraft(options, ruleConfig),
  );

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(createEnumRuleDraft(options, ruleConfig));
    }
    setOpen(next);
  }

  const canSave = isEnumRuleDraftComplete(draft, options);
  const summary = formatEnumRuleSummary(ruleConfig);
  const summaryText =
    summary.id === 'rules.enumSummary'
      ? t(summary.id, summary.values)
      : t(summary.id);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate text-sm">{summaryText}</span>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="xs">
            {t('enumRule.edit')}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-5xl"
          aria-labelledby={titleId}
        >
          <DialogHeader>
            <DialogTitle id={titleId}>
              {t('enumRule.title', { name: criterionName })}
            </DialogTitle>
            <DialogDescription>{t('enumRule.description')}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={t('enumRule.removeTier')}
              disabled={draft.tiers.length <= 2}
              onClick={() => setDraft((current) => removeEnumTier(current))}
            >
              <MinusIcon />
            </Button>
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              {t('enumRule.tierCount', { count: draft.tiers.length })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={t('enumRule.addTier')}
              disabled={draft.tiers.length >= 10}
              onClick={() => setDraft((current) => addEnumTier(current))}
            >
              <PlusIcon />
            </Button>
          </div>

          <EnumRuleBoard
            draft={draft}
            onMove={(value, to) =>
              setDraft((current) => moveEnumValue(current, value, to))
            }
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() => {
                onSave(enumRuleDraftToConfig(draft));
                setOpen(false);
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
