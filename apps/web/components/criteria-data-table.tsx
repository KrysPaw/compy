import { Fingerprint, KeyRound, Scale } from 'lucide-react';
import type { ComparisonDetailsResponse } from '@compy/shared';
import { CriterionActionsMenu } from '@/components/criterion-actions-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Criterion = ComparisonDetailsResponse['criteria'][number];

type Role = 'Key' | 'Identity' | 'Comparable';

function roleOf(criterion: Criterion): Role {
  if (criterion.is_key) {
    return 'Key';
  }

  return criterion.is_comparable ? 'Comparable' : 'Identity';
}

const ROLE_ICON: Record<Role, typeof KeyRound> = {
  Key: KeyRound,
  Identity: Fingerprint,
  Comparable: Scale,
};

const ROLE_ORDER: Record<Role, number> = {
  Key: 0,
  Identity: 1,
  Comparable: 2,
};

function RoleIcon({ role }: { role: Role }) {
  const Icon = ROLE_ICON[role];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon aria-label={role} className="size-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{role}</TooltipContent>
    </Tooltip>
  );
}

function formatConfig(criterion: Criterion) {
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
        ? `${shown.join(', ')}, +${remaining} more`
        : shown.join(', ');
    }
  }

  return '—';
}

export function CriteriaDataTable({
  comparisonId,
  criteria,
}: {
  comparisonId: number;
} & Pick<ComparisonDetailsResponse, 'criteria'>) {
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Config</TableHead>
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
                  No criteria yet.
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
                  <TableCell>{criterion.type}</TableCell>
                  <TableCell>{formatConfig(criterion)}</TableCell>
                  <TableCell className="text-right">
                    <CriterionActionsMenu
                      comparisonId={comparisonId}
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
