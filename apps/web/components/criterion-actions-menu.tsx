'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
            aria-label={t('criterionActions.menuLabel', { name: criterionName })}
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
            {t('criterionActions.rename')}
          </DropdownMenuItem>
          {canDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setActiveDialog('delete')}
            >
              <Trash2Icon />
              {t('common.delete')}
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
            <DialogTitle>{t('criterionActions.renameTitle')}</DialogTitle>
            <DialogDescription>
              {t('criterionActions.renameDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`rename-criterion-${criterionId}`}>
              {t('common.name')}
            </Label>
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
              {isPending ? t('common.saving') : t('common.save')}
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
            <DialogTitle>{t('criterionActions.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t.rich('criterionActions.deleteDescription', {
                criterionName,
                name: (chunks) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
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
              {isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
