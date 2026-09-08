import { describe, expect, it } from 'vitest';
import {
  buildCreateEntryValues,
  enumOptionsOf,
  initialEntryFields,
  orderedCriteria,
  ratingBoundsOf,
  valueTypeForCriterion,
  type Criterion,
} from './create-entry';

function criterion(
  overrides: Partial<Criterion> & Pick<Criterion, 'id' | 'name' | 'type'>,
): Criterion {
  return {
    is_key: false,
    is_comparable: false,
    config: null,
    ...overrides,
  };
}

describe('valueTypeForCriterion', () => {
  it('maps API criterion types to value input types', () => {
    expect(valueTypeForCriterion('Text')).toBe('text');
    expect(valueTypeForCriterion('Int')).toBe('number');
    expect(valueTypeForCriterion('Float')).toBe('number');
    expect(valueTypeForCriterion('Boolean')).toBe('boolean');
    expect(valueTypeForCriterion('Rating')).toBe('rating');
    expect(valueTypeForCriterion('Enum')).toBe('enum');
  });
});

describe('orderedCriteria', () => {
  it('puts key criteria first and keeps relative order within groups', () => {
    const criteria = [
      criterion({ id: 1, name: 'Price', type: 'Float', is_comparable: true }),
      criterion({ id: 2, name: 'Name', type: 'Text', is_key: true }),
      criterion({ id: 3, name: 'Brand', type: 'Text' }),
      criterion({ id: 4, name: 'SKU', type: 'Text', is_key: true }),
    ];

    expect(orderedCriteria(criteria).map((item) => item.id)).toEqual([
      2, 4, 1, 3,
    ]);
  });
});

describe('initialEntryFields', () => {
  it('defaults booleans to false and everything else to empty string', () => {
    const criteria = [
      criterion({ id: 1, name: 'Name', type: 'Text', is_key: true }),
      criterion({ id: 2, name: 'In stock', type: 'Boolean' }),
      criterion({ id: 3, name: 'Price', type: 'Float' }),
    ];

    expect(initialEntryFields(criteria)).toEqual({
      1: '',
      2: false,
      3: '',
    });
  });
});

describe('enumOptionsOf', () => {
  it('returns string options from enum config', () => {
    expect(
      enumOptionsOf(
        criterion({
          id: 1,
          name: 'Color',
          type: 'Enum',
          config: { options: ['Red', 'Blue', 3, null] },
        }),
      ),
    ).toEqual(['Red', 'Blue']);
  });

  it('returns an empty list for non-enum or invalid config', () => {
    expect(
      enumOptionsOf(criterion({ id: 1, name: 'Name', type: 'Text' })),
    ).toEqual([]);
    expect(
      enumOptionsOf(
        criterion({ id: 2, name: 'Color', type: 'Enum', config: null }),
      ),
    ).toEqual([]);
  });
});

describe('ratingBoundsOf', () => {
  it('reads numeric min/max from rating config', () => {
    expect(
      ratingBoundsOf(
        criterion({
          id: 1,
          name: 'Score',
          type: 'Rating',
          config: { min: 1, max: 5 },
        }),
      ),
    ).toEqual({ min: 1, max: 5 });
  });

  it('ignores non-rating criteria and non-numeric bounds', () => {
    expect(
      ratingBoundsOf(criterion({ id: 1, name: 'Name', type: 'Text' })),
    ).toEqual({});
    expect(
      ratingBoundsOf(
        criterion({
          id: 2,
          name: 'Score',
          type: 'Rating',
          config: { min: '1', max: 5 },
        }),
      ),
    ).toEqual({ min: undefined, max: 5 });
  });
});

describe('buildCreateEntryValues', () => {
  const name = criterion({ id: 1, name: 'Name', type: 'Text', is_key: true });
  const notes = criterion({ id: 2, name: 'Notes', type: 'Text' });
  const price = criterion({
    id: 3,
    name: 'Price',
    type: 'Float',
    is_comparable: true,
  });
  const inStock = criterion({ id: 4, name: 'In stock', type: 'Boolean' });
  const score = criterion({
    id: 5,
    name: 'Score',
    type: 'Rating',
    is_comparable: true,
  });
  const color = criterion({
    id: 6,
    name: 'Color',
    type: 'Enum',
    is_comparable: true,
  });

  it('requires the key text value', () => {
    expect(buildCreateEntryValues([name], { 1: '   ' })).toEqual({
      error: 'Name is required',
    });
  });

  it('requires at least one value overall', () => {
    expect(buildCreateEntryValues([notes, price], { 2: '', 3: '' })).toEqual({
      error: 'Name is required',
    });
  });

  it('builds typed values and skips empty optional fields', () => {
    expect(
      buildCreateEntryValues([name, notes, price, inStock, score, color], {
        1: ' Pixel 8 ',
        2: '',
        3: '799.99',
        4: true,
        5: '4',
        6: 'Black',
      }),
    ).toEqual({
      values: [
        { criterionId: 1, type: 'text', value: 'Pixel 8' },
        { criterionId: 3, type: 'number', value: 799.99 },
        { criterionId: 4, type: 'boolean', value: true },
        { criterionId: 5, type: 'rating', value: 4 },
        { criterionId: 6, type: 'enum', value: 'Black' },
      ],
    });
  });

  it('rejects non-numeric number and rating input', () => {
    expect(
      buildCreateEntryValues([name, price], { 1: 'Phone', 3: 'abc' }),
    ).toEqual({ error: 'Price must be a number' });
  });

  it('always includes boolean values, even when false', () => {
    expect(
      buildCreateEntryValues([name, inStock], { 1: 'Phone', 4: false }),
    ).toEqual({
      values: [
        { criterionId: 1, type: 'text', value: 'Phone' },
        { criterionId: 4, type: 'boolean', value: false },
      ],
    });
  });
});
