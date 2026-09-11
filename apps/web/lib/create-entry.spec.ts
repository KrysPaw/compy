import { describe, expect, it } from 'vitest';
import {
  buildCreateEntryValues,
  clearedCriterionIds,
  enumOptionsOf,
  fieldsFromEntryValues,
  initialEntryFields,
  orderedCriteria,
  ratingBoundsOf,
  type Criterion,
} from './create-entry';

function criterion(
  overrides: Partial<Criterion> & Pick<Criterion, 'id' | 'name' | 'type'>,
): Criterion {
  return {
    is_key: false,
    is_comparable: false,
    weight: 0,
    config: null,
    ruleConfig: null,
    ...overrides,
  };
}

describe('orderedCriteria', () => {
  it('puts key criteria first and keeps relative order within groups', () => {
    const criteria = [
      criterion({ id: 1, name: 'Price', type: 'number', is_comparable: true }),
      criterion({ id: 2, name: 'Name', type: 'text', is_key: true }),
      criterion({ id: 3, name: 'Brand', type: 'text' }),
      criterion({ id: 4, name: 'SKU', type: 'text', is_key: true }),
    ];

    expect(orderedCriteria(criteria).map((item) => item.id)).toEqual([
      2, 4, 1, 3,
    ]);
  });
});

describe('initialEntryFields', () => {
  it('defaults booleans to false and everything else to empty string', () => {
    const criteria = [
      criterion({ id: 1, name: 'Name', type: 'text', is_key: true }),
      criterion({ id: 2, name: 'In stock', type: 'boolean' }),
      criterion({ id: 3, name: 'Price', type: 'number' }),
    ];

    expect(initialEntryFields(criteria)).toEqual({
      1: '',
      2: false,
      3: '',
    });
  });
});

describe('fieldsFromEntryValues', () => {
  it('prefills known values and keeps defaults for missing ones', () => {
    const criteria = [
      criterion({ id: 1, name: 'Name', type: 'text', is_key: true }),
      criterion({ id: 2, name: 'In stock', type: 'boolean' }),
      criterion({ id: 3, name: 'Price', type: 'number' }),
      criterion({ id: 4, name: 'Notes', type: 'text' }),
    ];

    expect(
      fieldsFromEntryValues(criteria, [
        { criterionId: 1, value: 'Pixel 8' },
        { criterionId: 2, value: true },
        { criterionId: 3, value: 799 },
      ]),
    ).toEqual({
      1: 'Pixel 8',
      2: true,
      3: '799',
      4: '',
    });
  });
});

describe('clearedCriterionIds', () => {
  it('returns previously set optional criteria missing from the submit payload', () => {
    const criteria = [
      criterion({ id: 1, name: 'Name', type: 'text', is_key: true }),
      criterion({ id: 2, name: 'Price', type: 'number' }),
      criterion({ id: 3, name: 'Notes', type: 'text' }),
    ];

    expect(
      clearedCriterionIds(
        criteria,
        [
          { criterionId: 1 },
          { criterionId: 2 },
          { criterionId: 3 },
        ],
        [{ criterionId: 1 }, { criterionId: 3 }],
      ),
    ).toEqual([2]);
  });

  it('never clears the key criterion', () => {
    const criteria = [
      criterion({ id: 1, name: 'Name', type: 'text', is_key: true }),
    ];

    expect(
      clearedCriterionIds(criteria, [{ criterionId: 1 }], []),
    ).toEqual([]);
  });
});

describe('enumOptionsOf', () => {
  it('returns string options from enum config', () => {
    expect(
      enumOptionsOf(
        criterion({
          id: 1,
          name: 'Color',
          type: 'enum',
          config: { options: ['Red', 'Blue', 3, null] },
        }),
      ),
    ).toEqual(['Red', 'Blue']);
  });

  it('returns an empty list for non-enum or invalid config', () => {
    expect(
      enumOptionsOf(criterion({ id: 1, name: 'Name', type: 'text' })),
    ).toEqual([]);
    expect(
      enumOptionsOf(
        criterion({ id: 2, name: 'Color', type: 'enum', config: null }),
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
          type: 'rating',
          config: { min: 1, max: 5 },
        }),
      ),
    ).toEqual({ min: 1, max: 5 });
  });

  it('ignores non-rating criteria and non-numeric bounds', () => {
    expect(
      ratingBoundsOf(criterion({ id: 1, name: 'Name', type: 'text' })),
    ).toEqual({});
    expect(
      ratingBoundsOf(
        criterion({
          id: 2,
          name: 'Score',
          type: 'rating',
          config: { min: '1', max: 5 },
        }),
      ),
    ).toEqual({ min: undefined, max: 5 });
  });
});

describe('buildCreateEntryValues', () => {
  const name = criterion({ id: 1, name: 'Name', type: 'text', is_key: true });
  const notes = criterion({ id: 2, name: 'Notes', type: 'text' });
  const price = criterion({
    id: 3,
    name: 'Price',
    type: 'number',
    is_comparable: true,
  });
  const inStock = criterion({ id: 4, name: 'In stock', type: 'boolean' });
  const score = criterion({
    id: 5,
    name: 'Score',
    type: 'rating',
    is_comparable: true,
  });
  const color = criterion({
    id: 6,
    name: 'Color',
    type: 'enum',
    is_comparable: true,
  });

  it('requires the key text value', () => {
    expect(buildCreateEntryValues([name], { 1: '   ' })).toEqual({
      error: { id: 'createEntry.nameRequired' },
    });
  });

  it('requires at least one value overall', () => {
    expect(buildCreateEntryValues([notes, price], { 2: '', 3: '' })).toEqual({
      error: { id: 'createEntry.nameRequired' },
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
    ).toEqual({
      error: {
        id: 'createEntry.mustBeANumber',
        values: { name: 'Price' },
      },
    });
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
