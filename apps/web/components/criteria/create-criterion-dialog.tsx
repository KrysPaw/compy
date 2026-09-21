'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusIcon } from 'lucide-react';
import { createCriterion } from '@/lib/actions';
import { buildCreateCriterionPayload } from '@/lib/create-criterion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CREATE_CRITERION_INITIAL_STATE,
  CreateCriterionForm,
} from '@/components/criteria/create-criterion-form';

export function CreateCriterionDialog({
  publicId,
}: {
  publicId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(CREATE_CRITERION_INITIAL_STATE);

  function reset() {
    setState(CREATE_CRITERION_INITIAL_STATE);
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  function handleSubmit() {
    const payload = buildCreateCriterionPayload(state);

    startTransition(async () => {
      const result = await createCriterion(publicId, payload);

      if (result.criterionId === undefined) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {t('createCriterion.add')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createCriterion.title')}</DialogTitle>
          <DialogDescription>
            {t('createCriterion.description')}
          </DialogDescription>
        </DialogHeader>
        <CreateCriterionForm
          state={state}
          onStateChange={setState}
          error={error}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
