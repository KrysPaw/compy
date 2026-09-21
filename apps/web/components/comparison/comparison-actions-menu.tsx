'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisIcon, PencilIcon, Share2Icon, Trash2Icon } from 'lucide-react';
import type { AccessRequestResponse } from '@compy/shared';
import { deleteComparison, updateComparisonName } from '@/lib/actions';
import { DeleteComparisonDialog } from '@/components/comparison/delete-comparison-dialog';
import { RenameComparisonDialog } from '@/components/comparison/rename-comparison-dialog';
import { ShareComparisonDialog } from '@/components/comparison/share-comparison-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ComparisonActionsMenuProps = {
  publicId: string;
  comparisonName: string;
  isOwner: boolean;
  pendingRequests: AccessRequestResponse[];
};

type ActiveDialog = 'rename' | 'delete' | 'share' | null;

export function ComparisonActionsMenu({
  publicId,
  comparisonName,
  isOwner,
  pendingRequests,
}: ComparisonActionsMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [name, setName] = useState(comparisonName);
  const [confirmationName, setConfirmationName] = useState('');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

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
      const result = await updateComparisonName(publicId, name);

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
      const result = await deleteComparison(publicId);

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
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('comparisonActions.menuLabel')}
          >
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
          {isOwner ? (
            <DropdownMenuItem onSelect={() => setActiveDialog('share')}>
              <Share2Icon />
              {t('sharing.share')}
            </DropdownMenuItem>
          ) : null}
          {isOwner ? (
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

      <RenameComparisonDialog
        publicId={publicId}
        open={activeDialog === 'rename'}
        name={name}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onNameChange={setName}
        onSave={handleRename}
      />

      {isOwner ? (
        <ShareComparisonDialog
          publicId={publicId}
          open={activeDialog === 'share'}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
            } else {
              setActiveDialog('share');
            }
          }}
          pendingRequests={pendingRequests}
        />
      ) : null}

      <DeleteComparisonDialog
        comparisonName={comparisonName}
        open={activeDialog === 'delete'}
        confirmationName={confirmationName}
        error={error}
        isPending={isPending}
        onOpenChange={handleDialogOpenChange}
        onConfirmationChange={setConfirmationName}
        onDelete={handleDelete}
      />
    </>
  );
}
