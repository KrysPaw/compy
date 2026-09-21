'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriterionActionsMenu } from '@/components/criteria/criterion-actions-menu';
import { RoleIcon, type Role } from '@/components/criteria/role-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Criterion = ComparisonDetailsResponse['criteria'][number];

function roleOf(criterion: Criterion): Role {
  if (criterion.is_key) {
    return 'key';
  }

  return criterion.is_comparable ? 'comparable' : 'identity';
}

const ROLE_ORDER: Record<Role, number> = {
  key: 0,
  identity: 1,
  comparable: 2,
};

function formatConfig(
  criterion: Criterion,
  moreOptions: (list: string, count: number) => string,
  emDash: string,
) {
  const config = criterion.config;

  if (criterion.type === 'rating' && config && typeof config === 'object') {
    const { min, max } = config as { min?: number; max?: number };
    if (typeof min === 'number' && typeof max === 'number') {
      return `${min}–${max}`;
    }
  }

  if (criterion.type === 'enum' && config && typeof config === 'object') {
    const { options } = config as { options?: string[] };
    if (Array.isArray(options)) {
      const shown = options.slice(0, 3);
      const remaining = options.length - shown.length;
      return remaining > 0
        ? moreOptions(shown.join(', '), remaining)
        : shown.join(', ');
    }
  }

  return emDash;
}

export function CriteriaDataTable({
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const t = useTranslations();
  const sortedCriteria = [...criteria].sort(
    (left, right) => ROLE_ORDER[roleOf(left)] - ROLE_ORDER[roleOf(right)],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t('criteriaTable.name')}</TableHead>
              <TableHead>{t('criteriaTable.type')}</TableHead>
              <TableHead>{t('criteriaTable.config')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCriteria.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('criteriaTable.empty')}
                </TableCell>
              </TableRow>
            ) : (
              sortedCriteria.map((criterion: Criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell>
                    <RoleIcon role={roleOf(criterion)} />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {criterion.name}
                  </TableCell>
                  <TableCell>
                    {t(`criteriaTable.types.${criterion.type}`)}
                  </TableCell>
                  <TableCell>
                    {formatConfig(
                      criterion,
                      (list, count) =>
                        t('criteriaTable.moreOptions', { list, count }),
                      t('common.emDash'),
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CriterionActionsMenu
                      publicId={publicId}
                      criterionId={criterion.id}
                      criterionName={criterion.name}
                      canDelete={!criterion.is_key}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
