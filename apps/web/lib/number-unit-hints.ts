export type UnitCategoryKey =
  | 'mass'
  | 'length'
  | 'quantity'
  | 'currency'
  | 'time'
  | 'digital'
  | 'other';

export type UnitHintGroup = {
  categoryKey: UnitCategoryKey;
  units: string[];
};

/** Categorized unit suggestions; pass locale-specific quantity tokens from i18n. */
export function numberUnitHintGroups(quantityUnits: string[]): UnitHintGroup[] {
  return [
    {
      categoryKey: 'mass',
      units: ['kg', 'g', 'mg', 'lb', 'oz', 't'],
    },
    {
      categoryKey: 'length',
      units: ['mm', 'cm', 'm', 'km', 'in', 'ft'],
    },
    {
      categoryKey: 'quantity',
      units: quantityUnits,
    },
    {
      categoryKey: 'currency',
      units: ['PLN', 'EUR', 'USD', 'GBP'],
    },
    {
      categoryKey: 'time',
      units: ['s', 'min', 'h', 'days', 'weeks', 'months', 'years'],
    },
    {
      categoryKey: 'digital',
      units: ['B', 'KB', 'MB', 'GB', 'TB'],
    },
    {
      categoryKey: 'other',
      units: ['%', '°C', '°F'],
    },
  ];
}

export function filterUnitHintGroups<T extends { items: string[] }>(
  groups: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.toLowerCase().includes(normalized),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
