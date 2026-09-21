import type { CreateCriterionInput } from '@compy/shared';
import type { CreateCriterionFormState } from '@/components/criteria/create-criterion-form';

export function buildCreateCriterionPayload(
  state: CreateCriterionFormState,
): CreateCriterionInput {
  if (!state.isComparable) {
    return {
      name: state.name,
      is_comparable: false,
      type: 'text',
    };
  }

  if (state.type === 'rating') {
    return {
      name: state.name,
      is_comparable: true,
      type: 'rating',
      config: {
        min: Number(state.ratingMin),
        max: Number(state.ratingMax),
      },
    };
  }

  if (state.type === 'enum') {
    return {
      name: state.name,
      is_comparable: true,
      type: 'enum',
      config: {
        options: state.enumOptions
          .map((option) => option.trim())
          .filter((option) => option.length > 0),
      },
    };
  }

  if (state.type === 'number') {
    const unit = state.unit.trim();
    if (unit.length > 0) {
      return {
        name: state.name,
        is_comparable: true,
        type: 'number',
        config: { unit },
      };
    }

    return {
      name: state.name,
      is_comparable: true,
      type: 'number',
    };
  }

  return {
    name: state.name,
    is_comparable: true,
    type: state.type,
  };
}
