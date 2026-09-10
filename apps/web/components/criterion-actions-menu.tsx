'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteCriterion, updateCriterionName } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CriterionActionsMenuProps = {
  comparisonId: number;
  criterionId: number;
  criterionName: string;
  canDelete: boolean;
};

type ActiveDialog = 'rename' | 'delete' | null;

export function CriterionActionsMenu({
  comparisonId,
  criterionId,
  criterionName,
  canDelete,
}: CriterionActionsMenuProps) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [name, setName] = useState(criterionName);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    setActiveDialog(null);
    setName(criterionName);
    setError(undefined);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      closeDialog();
    }
  }

  function handleRename() {
    startTransition(async () => {
      const result = await updateCriterionName(
        comparisonId,
        criterionId,
        name,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCriterion(comparisonId, criterionId);

      if (result.error) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${criterionName} actions`}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setName(criterionName);
              setActiveDialog('rename');
            }}
          >
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          {canDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setActiveDialog('delete')}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={activeDialog === 'rename'}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename criterion</DialogTitle>
            <DialogDescription>
              Type and config stay the same; only the display name changes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`rename-criterion-${criterionId}`}>Name</Label>
            <Input
              id={`rename-criterion-${criterionId}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              autoComplete="off"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              disabled={isPending || name.trim().length === 0}
              onClick={handleRename}
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === 'delete'}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete criterion?</DialogTitle>
            <DialogDescription>
              This permanently deletes{' '}
              <span className="font-semibold text-foreground">
                {criterionName}
              </span>{' '}
              and all values stored for it on entries.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
