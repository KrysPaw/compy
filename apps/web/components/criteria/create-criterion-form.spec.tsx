import { useState } from 'react';
import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  CREATE_CRITERION_INITIAL_STATE,
  CreateCriterionForm,
  type CreateCriterionFormState,
} from '@/components/criteria/create-criterion-form';
import { buildCreateCriterionPayload } from '@/lib/create-criterion';

function isCollapseOpen(label: string) {
  const field = screen.getByLabelText(label);
  const collapse = field.closest('div.grid');
  return collapse?.classList.contains('grid-rows-[1fr]') ?? false;
}

function Harness({
  initialState = CREATE_CRITERION_INITIAL_STATE,
}: {
  initialState?: CreateCriterionFormState;
}) {
  const [state, setState] = useState(initialState);

  return (
    <>
      <CreateCriterionForm
        state={state}
        onStateChange={setState}
        onSubmit={() => undefined}
      />
      <pre data-testid="payload">
        {JSON.stringify(buildCreateCriterionPayload(state))}
      </pre>
    </>
  );
}

describe('CreateCriterionForm', () => {
  it('selects Identity only by default and keeps number config collapsed', () => {
    render(<Harness />);

    expect(
      screen.getByRole('radio', { name: /identity only/i }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(isCollapseOpen('Unit')).toBe(false);
    expect(JSON.parse(screen.getByTestId('payload').textContent ?? '')).toEqual({
      name: '',
      is_comparable: false,
      type: 'text',
    });
  });

  it('reveals the unit field when Comparable number is selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole('radio', { name: /comparable number/i }),
    );

    expect(
      screen.getByRole('radio', { name: /comparable number/i }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(isCollapseOpen('Unit')).toBe(true);
    expect(isCollapseOpen('Min')).toBe(false);
  });

  it('reveals min and max when Rating scale is selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: /rating scale/i }));

    expect(isCollapseOpen('Min')).toBe(true);
    expect(isCollapseOpen('Max')).toBe(true);
    expect(isCollapseOpen('Unit')).toBe(false);
  });

  it('hides type config when returning to Identity only', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole('radio', { name: /comparable number/i }),
    );
    await user.click(screen.getByRole('radio', { name: /identity only/i }));

    expect(
      screen.getByRole('radio', { name: /identity only/i }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(isCollapseOpen('Unit')).toBe(false);
    expect(isCollapseOpen('Min')).toBe(false);
  });

  it('includes a trimmed unit in the number payload', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialState={{
          ...CREATE_CRITERION_INITIAL_STATE,
          name: 'Weight',
          isComparable: true,
          type: 'number',
        }}
      />,
    );

    await user.type(screen.getByLabelText('Unit'), ' kg');

    expect(JSON.parse(screen.getByTestId('payload').textContent ?? '')).toEqual({
      name: 'Weight',
      is_comparable: true,
      type: 'number',
      config: { unit: 'kg' },
    });
  });
});
