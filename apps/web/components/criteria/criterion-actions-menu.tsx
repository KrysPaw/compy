'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteCriterion, updateCriterionName } from '@/lib/actions';
import { DeleteCriterionDialog } from '@/components/criteria/delete-criterion-dialog';
import { RenameCriterionDialog } from '@/components/criteria/rename-criterion-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CriterionActionsMenuProps = {
  publicId: string;
  criterionId: number;
  criterionName: string;
  canDelete: boolean;
};

type ActiveDialog = 'rename' | 'delete' | null;

export function CriterionActionsMenu({
  publicId,
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
      const result = await updateCriterionName(publicId, criterionId, name);

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
      const result = await deleteCriterion(publicId, criterionId);

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

      <RenameCriterionDialog
        criterionId={criterionId}
        open={activeDialog === 'rename'}
        name={name}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onNameChange={setName}
        onSave={handleRename}
      />

      <DeleteCriterionDialog
        criterionName={criterionName}
        open={activeDialog === 'delete'}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onDelete={handleDelete}
      />
    </>
  );
}
