'use client';

import { useTranslations } from 'next-intl';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateCriterionEnumOptions({
  enumOptions,
  required,
  onEnumOptionsChange,
}: {
  enumOptions: string[];
  required: boolean;
  onEnumOptionsChange: (options: string[]) => void;
}) {
  const t = useTranslations();

  function updateEnumOption(index: number, value: string) {
    onEnumOptionsChange(
      enumOptions.map((option, i) => (i === index ? value : option)),
    );
  }

  function addEnumOption() {
    onEnumOptionsChange([...enumOptions, '']);
  }

  function removeEnumOption(index: number) {
    onEnumOptionsChange(enumOptions.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('createCriterion.options')}</Label>
      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
        {enumOptions.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(event) => updateEnumOption(index, event.target.value)}
              placeholder={t('createCriterion.optionPlaceholder', {
                n: index + 1,
              })}
              required={required}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={enumOptions.length === 1}
              onClick={() => removeEnumOption(index)}
            >
              <XIcon />
              <span className="sr-only">
                {t('createCriterion.removeOption')}
              </span>
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addEnumOption}>
        {t('createCriterion.addOption')}
      </Button>
    </div>
  );
}
