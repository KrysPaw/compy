import { remainingWeightPool, WEIGHT_POOL_TOTAL } from '@compy/shared';
import { describe, expect, it } from 'vitest';

describe('remainingWeightPool', () => {
  it('returns the full pool when there are no comparable criteria', () => {
    expect(
      remainingWeightPool([
        { is_comparable: false, weight: 40 },
        { is_comparable: false, weight: 0 },
      ]),
    ).toBe(WEIGHT_POOL_TOTAL);
  });

  it('subtracts only comparable weights from the pool', () => {
    expect(
      remainingWeightPool([
        { is_comparable: false, weight: 99 },
        { is_comparable: true, weight: 40 },
        { is_comparable: true, weight: 20 },
        { is_comparable: true, weight: 10 },
      ]),
    ).toBe(30);
  });

  it('returns 0 when comparable weights fill the pool', () => {
    expect(
      remainingWeightPool([
        { is_comparable: true, weight: 70 },
        { is_comparable: true, weight: 30 },
      ]),
    ).toBe(0);
  });
});
