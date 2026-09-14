'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteComparison, updateComparisonName } from '@/lib/actions';
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

type ComparisonActionsMenuProps = {
  comparisonId: number;
  comparisonName: string;
};

type ActiveDialog = 'rename' | 'delete' | null;

export function ComparisonActionsMenu({
  comparisonId,
  comparisonName,
}: ComparisonActionsMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [name, setName] = useState(comparisonName);
  const [confirmationName, setConfirmationName] = useState('');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const isNameConfirmed = confirmationName === comparisonName;

  function closeDialog() {
    setActiveDialog(null);
    setName(comparisonName);
    setConfirmationName('');
    setError(undefined);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      closeDialog();
    }
  }

  function handleRename() {
    startTransition(async () => {
      const result = await updateComparisonName(comparisonId, name);

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
      const result = await deleteComparison(comparisonId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/');
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('comparisonActions.menuLabel')}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setName(comparisonName);
              setActiveDialog('rename');
            }}
          >
            <PencilIcon />
            {t('comparisonActions.rename')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setActiveDialog('delete')}
          >
            <Trash2Icon />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={activeDialog === 'rename'}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('comparisonActions.renameTitle')}</DialogTitle>
            <DialogDescription>
              {t('comparisonActions.renameDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`rename-comparison-${comparisonId}`}>
              {t('common.name')}
            </Label>
            <Input
              id={`rename-comparison-${comparisonId}`}
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
            <DialogTitle>{t('comparisonActions.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t.rich('comparisonActions.deleteDescription', {
                comparisonName,
                name: (chunks) => (
                  <span className="font-mono font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-comparison-name">
              {t('comparisonActions.nameLabel')}
            </Label>
            <Input
              id="delete-comparison-name"
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={!isNameConfirmed || isPending}
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
