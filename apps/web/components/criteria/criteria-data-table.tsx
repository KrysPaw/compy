'use client';

import { useTranslations } from 'next-intl';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriterionActionsMenu } from '@/components/criteria/criterion-actions-menu';
import {
  formatCriterionConfig,
  roleOf,
  sortCriteriaByRole,
} from '@/components/criteria/criterion-display';
import { RoleIcon } from '@/components/criteria/role-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function CriteriaDataTable({
  publicId,
  criteria,
}: {
  publicId: string;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
  const t = useTranslations();
  const sortedCriteria = sortCriteriaByRole(criteria);

  return (
    <div
      className="overflow-hidden rounded-xl border bg-background"
      data-testid="criteria-data-table"
    >
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
                    {formatCriterionConfig(
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
