'use client';

import { Fingerprint, KeyRound, Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Role = 'key' | 'identity' | 'comparable';

export const ROLE_ICON: Record<Role, typeof KeyRound> = {
  key: KeyRound,
  identity: Fingerprint,
  comparable: Scale,
};

export function RoleIcon({ role }: { role: Role }) {
  const t = useTranslations('criteriaTable.roles');
  const Icon = ROLE_ICON[role];
  const label = t(role);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon aria-label={label} className="size-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
