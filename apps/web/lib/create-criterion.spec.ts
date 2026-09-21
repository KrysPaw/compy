import { describe, expect, it } from 'vitest';
import { CREATE_CRITERION_INITIAL_STATE } from '@/components/criteria/create-criterion-form';
import { buildCreateCriterionPayload } from '@/lib/create-criterion';

describe('buildCreateCriterionPayload', () => {
  it('omits config when number unit is empty', () => {
    expect(
      buildCreateCriterionPayload({
        ...CREATE_CRITERION_INITIAL_STATE,
        name: 'Price',
        isComparable: true,
        type: 'number',
        unit: '   ',
      }),
    ).toEqual({
      name: 'Price',
      is_comparable: true,
      type: 'number',
    });
  });

  it('includes trimmed unit in number config', () => {
    expect(
      buildCreateCriterionPayload({
        ...CREATE_CRITERION_INITIAL_STATE,
        name: 'Weight',
        isComparable: true,
        type: 'number',
        unit: ' kg ',
      }),
    ).toEqual({
      name: 'Weight',
      is_comparable: true,
      type: 'number',
      config: { unit: 'kg' },
    });
  });
});
