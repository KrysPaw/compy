'use client';

import { useTranslations } from 'next-intl';
import { MedalIcon } from 'lucide-react';

export const PLACE_MEDALS = [
  { labelKey: 'firstPlace', color: '#D4AF37' },
  { labelKey: 'secondPlace', color: '#A8A9AD' },
  { labelKey: 'thirdPlace', color: '#CD7F32' },
] as const;

export function PlaceMedal({ placeIndex }: { placeIndex: number | null }) {
  const t = useTranslations('results');

  if (placeIndex === null) {
    return null;
  }

  const medal = PLACE_MEDALS[placeIndex];
  if (!medal) {
    return null;
  }

  return (
    <MedalIcon
      aria-label={t(medal.labelKey)}
      className="size-4 shrink-0"
      color={medal.color}
      fill={medal.color}
      fillOpacity={0.35}
      stroke={medal.color}
    />
  );
}
