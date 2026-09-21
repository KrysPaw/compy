'use client';

import { useTranslations } from 'next-intl';
import { appVersion } from '@/lib/about/app-version';
import { changelog } from '@/lib/about/changelog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const t = useTranslations('about');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,32rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-3 text-sm">
          <div className="grid gap-1">
            <dt className="text-muted-foreground">{t('creator')}</dt>
            <dd>{t('creatorName')}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-muted-foreground">{t('contact')}</dt>
            <dd>
              <a
                className="text-foreground underline underline-offset-2"
                href={`mailto:${t('contactEmail')}`}
              >
                {t('contactEmail')}
              </a>
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-muted-foreground">{t('version')}</dt>
            <dd>{appVersion}</dd>
          </div>
        </dl>

        <section className="grid gap-3">
          <h3 className="text-sm font-medium">{t('changelog')}</h3>
          <ul className="grid gap-4">
            {changelog.map((entry) => (
              <li key={entry.version} className="grid gap-1.5 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-medium">v{entry.version}</span>
                  <span className="text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {entry.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
