'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { listComparisonTemplates } from '@compy/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BLANK_TEMPLATE_ID = 'blank';

export function CreateComparisonTemplateField() {
  const t = useTranslations('createComparison');
  const [templateId, setTemplateId] = useState(BLANK_TEMPLATE_ID);
  const templates = listComparisonTemplates();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="comparison-template">{t('template')}</Label>
      <input type="hidden" name="templateId" value={templateId} />
      <Select value={templateId} onValueChange={setTemplateId}>
        <SelectTrigger id="comparison-template" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={BLANK_TEMPLATE_ID}>{t('templates.blank.label')}</SelectItem>
          {templates.map(({ id }) => (
            <SelectItem key={id} value={id}>
              {t(`templates.${id}.label`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        {t(`templates.${templateId}.description`)}
      </p>
    </div>
  );
}
