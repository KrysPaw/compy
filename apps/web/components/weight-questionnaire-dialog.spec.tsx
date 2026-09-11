import '@testing-library/jest-dom/vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WeightQuestionnaireDialog } from './weight-questionnaire-dialog';

const refresh = vi.fn();
const replaceCriterionWeights = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  replaceCriterionWeights: (...args: unknown[]) =>
    replaceCriterionWeights(...args),
}));

const nameCriterion = {
  id: 1,
  name: 'Name',
  type: 'text' as const,
  is_key: true,
  is_comparable: false,
  weight: 0,
  config: null,
  ruleConfig: null,
};

const price = {
  id: 2,
  name: 'Price',
  type: 'number' as const,
  is_key: false,
  is_comparable: true,
  weight: 40,
  config: null,
  ruleConfig: { direction: 'lower' as const },
};

const electric = {
  id: 3,
  name: 'Electric',
  type: 'boolean' as const,
  is_key: false,
  is_comparable: true,
  weight: 20,
  config: null,
  ruleConfig: { preferredValue: true },
};

const fuel = {
  id: 4,
  name: 'Fuel',
  type: 'enum' as const,
  is_key: false,
  is_comparable: true,
  weight: 0,
  config: { options: ['Petrol', 'Diesel'] },
  ruleConfig: null,
};

async function openQuestions(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(
    screen.getByRole('button', { name: 'Distribute weights' }),
  );

  const intro = screen.getByRole('dialog');
  await user.click(within(intro).getByRole('button', { name: 'Continue' }));

  return screen.getByRole('dialog');
}

describe('WeightQuestionnaireDialog', () => {
  beforeEach(() => {
    refresh.mockReset();
    replaceCriterionWeights.mockReset();
    replaceCriterionWeights.mockResolvedValue({});
  });

  it('disables the start button when there are fewer than 2 comparable criteria', () => {
    const { rerender } = render(
      <WeightQuestionnaireDialog comparisonId={7} criteria={[nameCriterion]} />,
    );

    expect(
      screen.getByRole('button', { name: 'Distribute weights' }),
    ).toBeDisabled();

    rerender(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price]}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Distribute weights' }),
    ).toBeDisabled();
  });

  it('shows an intro dialog before questions and closes on cancel', async () => {
    const user = userEvent.setup();
    render(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price, electric, fuel]}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Distribute weights' }),
    );

    const intro = screen.getByRole('dialog');
    expect(
      within(intro).getByText(/at most 3 questions/i),
    ).toBeInTheDocument();
    expect(
      within(intro).getByText(/current weights will be replaced/i),
    ).toBeInTheDocument();
    expect(
      within(intro).queryByText('Question 1'),
    ).not.toBeInTheDocument();

    await user.click(within(intro).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(replaceCriterionWeights).not.toHaveBeenCalled();
  });

  it('never shows an implied pair and finishes after the last needed answer', async () => {
    const user = userEvent.setup();
    render(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price, electric, fuel]}
      />,
    );

    const dialog = await openQuestions(user);
    expect(within(dialog).getByText('Question 1')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Price' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Electric' }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Price' }));

    expect(within(dialog).getByText('Question 2')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Price' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Fuel' })).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Electric' }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Fuel' }));

    await waitFor(() => {
      expect(replaceCriterionWeights).toHaveBeenCalledWith(7, {
        weights: [
          { criterionId: 2, weight: 33 },
          { criterionId: 3, weight: 0 },
          { criterionId: 4, weight: 67 },
        ],
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('finishes the questionnaire after one answer when there are two criteria', async () => {
    const user = userEvent.setup();
    render(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price, electric]}
      />,
    );

    const dialog = await openQuestions(user);
    await user.click(within(dialog).getByRole('button', { name: 'Price' }));

    await waitFor(() => {
      expect(replaceCriterionWeights).toHaveBeenCalledWith(7, {
        weights: [
          { criterionId: 2, weight: 100 },
          { criterionId: 3, weight: 0 },
        ],
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('does not save when the questionnaire is cancelled', async () => {
    const user = userEvent.setup();
    render(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price, electric, fuel]}
      />,
    );

    const dialog = await openQuestions(user);
    await user.click(within(dialog).getByRole('button', { name: 'Price' }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(replaceCriterionWeights).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores the last asked pair on Back and re-asks a dropped inference', async () => {
    const user = userEvent.setup();
    replaceCriterionWeights.mockResolvedValue({ error: 'Could not save' });
    render(
      <WeightQuestionnaireDialog
        comparisonId={7}
        criteria={[nameCriterion, price, electric, fuel]}
      />,
    );

    const dialog = await openQuestions(user);
    await user.click(within(dialog).getByRole('button', { name: 'Price' }));
    await user.click(within(dialog).getByRole('button', { name: 'Fuel' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    });
    expect(within(dialog).getByRole('button', { name: 'Price' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Fuel' })).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Electric' }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Back' }));

    expect(within(dialog).getByText('Question 2')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Price' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Fuel' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Price' }));

    expect(within(dialog).getByText('Question 3')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Electric' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Fuel' })).toBeInTheDocument();
  });
});
