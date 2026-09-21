'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusIcon } from 'lucide-react';
import { createComparison } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SidebarGroupAction } from '@/components/ui/sidebar';
import { CreateComparisonTemplateField } from '@/components/comparison/create-comparison-template-field';

type CreateComparisonDialogProps = {
  trigger?: ReactNode;
};

export function CreateComparisonDialog({ trigger }: CreateComparisonDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createComparison(formData);

      if (result.publicId === undefined) {
        setError(result.error);
        return;
      }

      setError(undefined);
      setOpen(false);
      router.push(`/comparisons/${result.publicId}`);
      router.refresh();
    });
  }

  const defaultTrigger = (
    <SidebarGroupAction title={t('sidebar.newComparison')}>
      <PlusIcon />
      <span className="sr-only">{t('sidebar.newComparison')}</span>
    </SidebarGroupAction>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createComparison.title')}</DialogTitle>
          <DialogDescription>
            {t('createComparison.description')}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="comparison-name">{t('common.name')}</Label>
            <Input
              id="comparison-name"
              name="name"
              placeholder={t('createComparison.placeholder')}
              required
              maxLength={200}
              autoFocus
            />
          </div>
          <CreateComparisonTemplateField />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
