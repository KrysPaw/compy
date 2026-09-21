import { describe, expect, it } from 'vitest';
import {
  filterUnitHintGroups,
  numberUnitHintGroups,
} from './number-unit-hints';

describe('numberUnitHintGroups', () => {
  it('uses the provided quantity tokens', () => {
    const quantity = numberUnitHintGroups(['szt.', 'sztuki']).find(
      (group) => group.categoryKey === 'quantity',
    );

    expect(quantity?.units).toEqual(['szt.', 'sztuki']);
  });

  it('keeps universal categories stable', () => {
    const mass = numberUnitHintGroups(['pcs', 'pieces']).find(
      (group) => group.categoryKey === 'mass',
    );

    expect(mass?.units).toContain('kg');
  });
});

describe('filterUnitHintGroups', () => {
  it('filters items by query across groups', () => {
    expect(
      filterUnitHintGroups(
        [
          { value: 'Mass', items: ['kg', 'g'] },
          { value: 'Quantity', items: ['pcs', 'pieces'] },
        ],
        'pc',
      ),
    ).toEqual([{ value: 'Quantity', items: ['pcs'] }]);
  });
});
