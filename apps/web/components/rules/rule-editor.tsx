'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EnumRuleDialog } from '@/components/rules/enum-rule-dialog';
import { enumOptionsOf } from '@/lib/create-entry';
import {
  formatRuleMessage,
  hasDirection,
  hasPreferredValue,
  nextBooleanRuleConfig,
  nextDirectionRuleConfig,
} from '@/lib/format-rule';

export type Criterion = ComparisonDetailsResponse['criteria'][number];

export function RuleEditor({
  criterion,
  ruleConfig,
  onChange,
}: {
  criterion: Criterion;
  ruleConfig: unknown;
  onChange: (next: unknown) => void;
}) {
  const t = useTranslations();

  if (criterion.type === 'number' || criterion.type === 'rating') {
    const direction = hasDirection(ruleConfig) ? ruleConfig.direction : '';

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={direction}
        onValueChange={(next) => {
          if (next !== 'higher' && next !== 'lower') {
            return;
          }

          onChange(nextDirectionRuleConfig(criterion, next, ruleConfig));
        }}
        aria-label={t('rules.ruleFor', { name: criterion.name })}
      >
        <ToggleGroupItem value="higher">
          {t('rules.higherIsBetter')}
        </ToggleGroupItem>
        <ToggleGroupItem value="lower">
          {t('rules.lowerIsBetter')}
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (criterion.type === 'boolean') {
    const preferred = hasPreferredValue(ruleConfig)
      ? ruleConfig.preferredValue
        ? 'yes'
        : 'no'
      : '';

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={preferred}
        onValueChange={(next) => {
          if (next !== 'yes' && next !== 'no') {
            return;
          }

          onChange(nextBooleanRuleConfig(next === 'yes'));
        }}
        aria-label={t('rules.ruleFor', { name: criterion.name })}
      >
        <ToggleGroupItem value="yes">{t('rules.yesIsBetter')}</ToggleGroupItem>
        <ToggleGroupItem value="no">{t('rules.noIsBetter')}</ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (criterion.type === 'enum') {
    return (
      <EnumRuleDialog
        criterionName={criterion.name}
        options={enumOptionsOf({ ...criterion, ruleConfig })}
        ruleConfig={ruleConfig}
        onSave={onChange}
      />
    );
  }

  const message = formatRuleMessage({ ...criterion, ruleConfig });
  return message.id === 'rules.enumSummary'
    ? t(message.id, message.values)
    : t(message.id);
}
