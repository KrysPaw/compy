'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisIcon, Trash2Icon } from 'lucide-react';
import { deleteComparison } from '@/lib/actions';
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

export function ComparisonActionsMenu({
  comparisonId,
  comparisonName,
}: ComparisonActionsMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const isNameConfirmed = confirmationName === comparisonName;

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);

    if (!isOpen) {
      setConfirmationName('');
      setError(undefined);
    }
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
            variant="destructive"
            onSelect={() => setOpen(true)}
          >
            <Trash2Icon />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={handleOpenChange}>
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
