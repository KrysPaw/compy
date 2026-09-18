'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CREATE_CRITERION_INITIAL_STATE,
  CreateCriterionForm,
  type CreateCriterionFormState,
} from '@/components/create-criterion-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type CriterionStage = {
  id: string;
  title: string;
  description: string;
  initialState: CreateCriterionFormState;
};

const CRITERION_STAGES: CriterionStage[] = [
  {
    id: 'create-criterion-identity',
    title: 'Identity only (default)',
    description: 'Comparable off — maps to text / not ranked.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'SKU / notes',
      isComparable: false,
    },
  },
  {
    id: 'create-criterion-number',
    title: 'Comparable number',
    description: 'Comparable on, type number.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Battery life',
      isComparable: true,
      type: 'number',
    },
  },
  {
    id: 'create-criterion-boolean',
    title: 'Yes / No',
    description: 'Comparable on, type boolean.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Wireless charging',
      isComparable: true,
      type: 'boolean',
    },
  },
  {
    id: 'create-criterion-rating',
    title: 'Rating scale',
    description: 'Comparable on, type rating with min/max.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Build quality',
      isComparable: true,
      type: 'rating',
      ratingMin: '1',
      ratingMax: '5',
    },
  },
  {
    id: 'create-criterion-enum',
    title: 'Choice list',
    description: 'Comparable on, type enum with options.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Size',
      isComparable: true,
      type: 'enum',
      enumOptions: ['S', 'M', 'L', 'XL'],
    },
  },
  {
    id: 'create-criterion-error',
    title: 'Error state',
    description: 'Shows inline validation / API error treatment.',
    initialState: {
      ...CREATE_CRITERION_INITIAL_STATE,
      name: 'Battery life',
      isComparable: true,
      type: 'number',
    },
  },
];

const SECTIONS = [
  { id: 'buttons', label: 'Button' },
  { id: 'inputs', label: 'Input' },
  { id: 'switch', label: 'Switch' },
  { id: 'create-criterion', label: 'Create criterion' },
] as const;

function GalleryStage({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-none border border-border bg-card p-4',
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        <code className="text-[11px] text-muted-foreground">#{id}</code>
      </div>
      {children}
    </section>
  );
}

function DialogPanel({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid w-full max-w-md gap-6 bg-popover p-6 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <div className="flex flex-col gap-2">
        <h4 className="font-heading text-lg leading-none font-semibold tracking-wider uppercase">
          {title}
        </h4>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function CriterionFormStage({
  stage,
  error,
}: {
  stage: CriterionStage;
  error?: string;
}) {
  const t = useTranslations();
  const [state, setState] = useState(stage.initialState);

  return (
    <GalleryStage
      id={stage.id}
      title={stage.title}
      description={stage.description}
    >
      <DialogPanel
        title={t('createCriterion.title')}
        description={t('createCriterion.description')}
      >
        <CreateCriterionForm
          state={state}
          onStateChange={setState}
          error={error}
          idPrefix={stage.id}
          onSubmit={() => undefined}
        />
      </DialogPanel>
    </GalleryStage>
  );
}

export function ComponentGallery() {
  const t = useTranslations();

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Dev only
              </p>
              <h1 className="font-heading text-xl font-semibold tracking-wider uppercase">
                Component gallery
              </h1>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Back to app</Link>
            </Button>
          </div>
          <nav className="flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <Button key={section.id} variant="secondary" size="xs" asChild>
                <a href={`#${section.id}`}>{section.label}</a>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fixed usage states for visual iteration. Change a component, refresh
          this page, and compare stages side by side. Production builds return
          404 for <code className="text-foreground">/dev/gallery</code>.
        </p>

        <section id="buttons" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
            Button
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <GalleryStage id="button-variants" title="Variants">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </GalleryStage>
            <GalleryStage id="button-sizes" title="Sizes">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">XS</Button>
                <Button size="sm">SM</Button>
                <Button size="default">Default</Button>
                <Button size="lg">LG</Button>
                <Button size="default" disabled>
                  Disabled
                </Button>
              </div>
            </GalleryStage>
          </div>
        </section>

        <section id="inputs" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
            Input
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <GalleryStage id="input-default" title="Default + filled">
              <div className="flex max-w-sm flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gallery-input-empty">Empty</Label>
                  <Input
                    id="gallery-input-empty"
                    placeholder={t('createCriterion.placeholder')}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gallery-input-filled">Filled</Label>
                  <Input id="gallery-input-filled" defaultValue="Battery life" />
                </div>
              </div>
            </GalleryStage>
            <GalleryStage id="input-states" title="Disabled + invalid">
              <div className="flex max-w-sm flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gallery-input-disabled">Disabled</Label>
                  <Input
                    id="gallery-input-disabled"
                    defaultValue="Locked value"
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gallery-input-invalid">Invalid</Label>
                  <Input
                    id="gallery-input-invalid"
                    defaultValue=""
                    aria-invalid
                    placeholder="Required"
                  />
                </div>
              </div>
            </GalleryStage>
          </div>
        </section>

        <section id="switch" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
            Switch
          </h2>
          <GalleryStage id="switch-states" title="Off / on">
            <div className="flex max-w-sm flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="gallery-switch-off">Off</Label>
                <Switch id="gallery-switch-off" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="gallery-switch-on">On</Label>
                <Switch id="gallery-switch-on" defaultChecked />
              </div>
            </div>
          </GalleryStage>
        </section>

        <section
          id="create-criterion"
          className="scroll-mt-24 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
              Create criterion
            </h2>
            <p className="text-sm text-muted-foreground">
              Real form chrome in a dialog-shaped panel (no portal). Submit is a
              no-op so you can poke at layouts safely.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {CRITERION_STAGES.map((stage) => (
              <CriterionFormStage
                key={stage.id}
                stage={stage}
                error={
                  stage.id === 'create-criterion-error'
                    ? 'Something went wrong creating this criterion.'
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
