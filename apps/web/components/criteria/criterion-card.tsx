'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriterionActionsMenu } from '@/components/criteria/criterion-actions-menu';
import {
  formatCriterionConfig,
  roleOf,
} from '@/components/criteria/criterion-display';
import { RoleIcon } from '@/components/criteria/role-icon';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function CriterionCard({
  publicId,
  criterion,
}: {
  publicId: string;
  criterion: Criterion;
}) {
  const t = useTranslations();
  const role = roleOf(criterion);

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <RoleIcon role={role} />
          <div className="min-w-0">
            <h3 className="text-base font-medium text-foreground">
              {criterion.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(`criteriaTable.roles.${role}`)}
            </p>
          </div>
        </div>
        <CriterionActionsMenu
          publicId={publicId}
          criterionId={criterion.id}
          criterionName={criterion.name}
          canDelete={!criterion.is_key}
        />
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
          <dt className="text-muted-foreground">{t('criteriaTable.type')}</dt>
          <dd className="text-right text-foreground">
            {t(`criteriaTable.types.${criterion.type}`)}
          </dd>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
          <dt className="text-muted-foreground">{t('criteriaTable.config')}</dt>
          <dd className="min-w-0 text-right text-foreground">
            {formatCriterionConfig(
              criterion,
              (list, count) =>
                t('criteriaTable.moreOptions', { list, count }),
              t('common.emDash'),
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
