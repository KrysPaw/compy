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

export function fieldsFromEntryValues(
  criteria: Criterion[],
  entryValues: ReadonlyArray<{ criterionId: number; value: unknown }>,
): Record<number, EntryFieldValue> {
  const fields = initialEntryFields(criteria);

  for (const criterion of criteria) {
    const found = entryValues.find(
      (entryValue) => entryValue.criterionId === criterion.id,
    );
    if (found === undefined) {
      continue;
    }

    const value = found.value;
    if (criterion.type === 'boolean') {
      fields[criterion.id] = value === true;
      continue;
    }

    if (value === null || value === undefined) {
      fields[criterion.id] = '';
      continue;
    }

    fields[criterion.id] = String(value);
  }

  return fields;
}

/** Criteria that previously had a value but were cleared in the edit form. */
export function clearedCriterionIds(
  criteria: Criterion[],
  existingValues: ReadonlyArray<{ criterionId: number }>,
  submittedValues: ReadonlyArray<{ criterionId: number }>,
): number[] {
  const submitted = new Set(
    submittedValues.map((value) => value.criterionId),
  );

  return existingValues
    .map((value) => value.criterionId)
    .filter((criterionId) => {
      if (submitted.has(criterionId)) {
        return false;
      }

      const criterion = criteria.find((item) => item.id === criterionId);
      return criterion !== undefined && !criterion.is_key;
    });
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

export function unitOf(criterion: Criterion): string | undefined {
  if (
    criterion.type !== 'number' ||
    !criterion.config ||
    typeof criterion.config !== 'object'
  ) {
    return undefined;
  }

  const { unit } = criterion.config as { unit?: unknown };
  if (typeof unit !== 'string') {
    return undefined;
  }

  const trimmed = unit.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function formatValueWithUnit(
  valueText: string,
  unit: string | undefined,
): string {
  return unit ? `${valueText} ${unit}` : valueText;
}

export type EntryValidationMessage =
  | { id: 'createEntry.nameRequired' }
  | { id: 'createEntry.mustBeANumber'; values: { name: string } };

export function entryValidationText(
  t: (id: EntryValidationMessage['id'], values?: { name: string }) => string,
  error: EntryValidationMessage,
) {
  return error.id === 'createEntry.mustBeANumber'
    ? t(error.id, error.values)
    : t(error.id);
}

export function buildCreateEntryValues(
  criteria: Criterion[],
  fields: Record<number, EntryFieldValue>,
):
  | { values: CreateEntryInput['values'] }
  | { error: EntryValidationMessage } {
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
          return { error: { id: 'createEntry.nameRequired' } };
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
        return {
          error: {
            id: 'createEntry.mustBeANumber',
            values: { name: criterion.name },
          },
        };
      }

      values.push({ criterionId: criterion.id, type, value });
      continue;
    }

    if (type === 'enum' && text.length > 0) {
      values.push({ criterionId: criterion.id, type, value: text });
    }
  }

  if (values.length === 0) {
    return { error: { id: 'createEntry.nameRequired' } };
  }

  return { values };
}
