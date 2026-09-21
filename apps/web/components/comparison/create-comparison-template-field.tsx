'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ComparisonTemplateCategorySchema,
  ComparisonTemplateIdSchema,
  listComparisonTemplates,
  type ComparisonTemplateId,
} from '@compy/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BLANK_TEMPLATE_ID = 'blank';

type TemplateSelectId = ComparisonTemplateId | typeof BLANK_TEMPLATE_ID;

const CATEGORY_ORDER = ComparisonTemplateCategorySchema.options;

function parseTemplateSelectId(value: string | null): TemplateSelectId | null {
  if (value === BLANK_TEMPLATE_ID) {
    return BLANK_TEMPLATE_ID;
  }
  const parsed = ComparisonTemplateIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function CreateComparisonTemplateField() {
  const t = useTranslations('createComparison');
  const [templateId, setTemplateId] = useState<TemplateSelectId>(BLANK_TEMPLATE_ID);
  const templates = listComparisonTemplates();

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    templates: templates.filter((item) => item.category === category),
  }));

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="comparison-template">{t('template')}</Label>
      <input type="hidden" name="templateId" value={templateId} />
      <Select
        value={templateId}
        onValueChange={(value) => {
          const next = parseTemplateSelectId(value);
          if (next !== null) {
            setTemplateId(next);
          }
        }}
      >
        <SelectTrigger id="comparison-template" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={BLANK_TEMPLATE_ID}>{t('templates.blank.label')}</SelectItem>
          {byCategory.map(({ category, templates: categoryTemplates }) => (
            <SelectGroup key={category}>
              <SelectLabel>{t(`templateCategories.${category}`)}</SelectLabel>
              {categoryTemplates.map(({ id }) => (
                <SelectItem key={id} value={id}>
                  {t(`templates.${id}.label`)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        {t(`templates.${templateId}.description`)}
      </p>
    </div>
  );
}
