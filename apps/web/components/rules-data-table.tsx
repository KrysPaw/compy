import type { ComparisonDetailsResponse } from '@compy/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRuleMessage } from '@/lib/format-rule';

type Criterion = ComparisonDetailsResponse['criteria'][number];

export function RulesDataTable({
  criteria,
}: Pick<ComparisonDetailsResponse, 'criteria'>) {
  const comparableCriteria = criteria.filter(
    (criterion) => criterion.is_comparable,
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparableCriteria.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No comparable criteria yet.
                </TableCell>
              </TableRow>
            ) : (
              comparableCriteria.map((criterion: Criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell className="font-medium text-foreground">
                    {criterion.name}
                  </TableCell>
                  <TableCell>{formatRuleMessage(criterion)}</TableCell>
                  <TableCell>{criterion.weight}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
