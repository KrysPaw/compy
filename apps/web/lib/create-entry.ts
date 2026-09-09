import type {
  ComparisonDetailsResponse,
  CreateEntryInput,
  ValueInput,
} from '@compy/shared';

export type Criterion = ComparisonDetailsResponse['criteria'][number];
export type EntryFieldValue = string | boolean;

export function orderedCriteria(criteria: Criterion[]): Criterion[] {
  return [
    ...criteria.filter((criterion) => criterion.is_key),
    ...criteria.filter((criterion) => !criterion.is_key),
  ];
}

export function initialEntryFields(
  criteria: Criterion[],
): Record<number, EntryFieldValue> {
  return Object.fromEntries(
    criteria.map((criterion) => [
      criterion.id,
      criterion.type === 'boolean' ? false : '',
    ]),
  );
}

export function enumOptionsOf(criterion: Criterion): string[] {
  if (
    criterion.type !== 'enum' ||
    !criterion.config ||
    typeof criterion.config !== 'object'
  ) {
    return [];
  }

  const { options } = criterion.config as { options?: unknown };
  return Array.isArray(options)
    ? options.filter((option): option is string => typeof option === 'string')
    : [];
}

export function ratingBoundsOf(criterion: Criterion): {
  min?: number;
  max?: number;
} {
  if (
    criterion.type !== 'rating' ||
    !criterion.config ||
    typeof criterion.config !== 'object'
  ) {
    return {};
  }

  const { min, max } = criterion.config as { min?: unknown; max?: unknown };
  return {
    min: typeof min === 'number' ? min : undefined,
    max: typeof max === 'number' ? max : undefined,
  };
}

export function buildCreateEntryValues(
  criteria: Criterion[],
  fields: Record<number, EntryFieldValue>,
): { values: CreateEntryInput['values'] } | { error: string } {
  const values: ValueInput[] = [];

  for (const criterion of criteria) {
    const type = criterion.type;
    const raw = fields[criterion.id];

    if (type === 'boolean') {
      values.push({
        criterionId: criterion.id,
        type,
        value: raw === true,
      });
      continue;
    }

    const text = typeof raw === 'string' ? raw.trim() : '';

    if (type === 'text') {
      if (criterion.is_key) {
        if (text.length === 0) {
          return { error: 'Name is required' };
        }

        values.push({ criterionId: criterion.id, type, value: text });
      } else if (text.length > 0) {
        values.push({ criterionId: criterion.id, type, value: text });
      }
      continue;
    }

    if (type === 'number' || type === 'rating') {
      if (text.length === 0) {
        continue;
      }

      const value = Number(text);
      if (!Number.isFinite(value)) {
        return { error: `${criterion.name} must be a number` };
      }

      values.push({ criterionId: criterion.id, type, value });
      continue;
    }

    if (type === 'enum' && text.length > 0) {
      values.push({ criterionId: criterion.id, type, value: text });
    }
  }

  if (values.length === 0) {
    return { error: 'Name is required' };
  }

  return { values };
}
