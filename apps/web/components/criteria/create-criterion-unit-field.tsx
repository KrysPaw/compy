'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import {
  UnitHintsPanel,
  type UnitHintGroupItem,
} from '@/components/criteria/unit-hints-panel';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  filterUnitHintGroups,
  numberUnitHintGroups,
} from '@/lib/number-unit-hints';

const UNIT_MAX_LENGTH = 32;

function quantityUnitsFromMessages(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item): item is string => typeof item === 'string');
}

export function CreateCriterionUnitField({
  idPrefix,
  unit,
  onUnitChange,
}: {
  idPrefix: string;
  unit: string;
  onUnitChange: (value: string) => void;
}) {
  const t = useTranslations('createCriterion');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const inputId = `${idPrefix}-unit`;

  const groups = useMemo((): UnitHintGroupItem[] => {
    const quantityUnits = quantityUnitsFromMessages(t.raw('unit.quantityUnits'));
    return numberUnitHintGroups(quantityUnits).map((group) => ({
      value: t(`unit.categories.${group.categoryKey}`),
      items: group.units,
    }));
  }, [t]);

  const filteredGroups = useMemo(
    () => filterUnitHintGroups(groups, unit),
    [groups, unit],
  );

  const updatePanelPosition = useCallback(() => {
    const anchor = rootRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(288, Math.max(120, window.innerHeight - rect.bottom - 12)),
      zIndex: 60,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open, updatePanelPosition, unit, filteredGroups.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function setUnit(next: string) {
    onUnitChange(next.slice(0, UNIT_MAX_LENGTH));
  }

  function focusInput() {
    document.getElementById(inputId)?.focus();
  }

  function selectUnit(next: string) {
    setUnit(next);
    setOpen(false);
    focusInput();
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{t('unit.label')}</Label>
      <InputGroup className="w-full">
        <InputGroupInput
          id={inputId}
          value={unit}
          maxLength={UNIT_MAX_LENGTH}
          placeholder={t('unit.placeholder')}
          autoComplete="off"
          onChange={(event) => {
            setUnit(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <InputGroupAddon align="inline-end">
          {unit.length > 0 ? (
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              aria-label={t('unit.clear')}
              onClick={() => {
                setUnit('');
                focusInput();
                setOpen(true);
              }}
            >
              <XIcon className="pointer-events-none size-3.5" />
            </InputGroupButton>
          ) : null}
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-expanded={open}
            aria-label={t('unit.hints')}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDownIcon className="pointer-events-none size-3.5 text-muted-foreground" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {open && panelStyle && filteredGroups.length > 0
        ? createPortal(
            <UnitHintsPanel
              panelRef={panelRef}
              style={panelStyle}
              groups={filteredGroups}
              unit={unit}
              onSelect={selectUnit}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
