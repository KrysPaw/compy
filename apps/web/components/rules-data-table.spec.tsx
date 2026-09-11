import '@testing-library/jest-dom/vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RulesDataTable } from './rules-data-table';

const refresh = vi.fn();
const updateCriterionWeight = vi.fn();
const updateCriterionRuleConfig = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  updateCriterionWeight: (...args: unknown[]) =>
    updateCriterionWeight(...args),
  updateCriterionRuleConfig: (...args: unknown[]) =>
    updateCriterionRuleConfig(...args),
}));

const criteria = [
  {
    id: 1,
    name: 'Name',
    type: 'text' as const,
    is_key: true,
    is_comparable: false,
    weight: 0,
    config: null,
    ruleConfig: null,
  },
  {
    id: 2,
    name: 'Price',
    type: 'number' as const,
    is_key: false,
    is_comparable: true,
    weight: 40,
    config: null,
    ruleConfig: { direction: 'lower' as const },
  },
  {
    id: 3,
    name: 'Electric',
    type: 'boolean' as const,
    is_key: false,
    is_comparable: true,
    weight: 20,
    config: null,
    ruleConfig: { preferredValue: true },
  },
  {
    id: 4,
    name: 'Fuel',
    type: 'enum' as const,
    is_key: false,
    is_comparable: true,
    weight: 10,
    config: { options: ['Petrol', 'Diesel'] },
    ruleConfig: {
      tiers: [
        { rank: 1, values: ['Petrol'] },
        { rank: 2, values: ['Diesel'] },
      ],
    },
  },
  {
    id: 5,
    name: 'Score',
    type: 'rating' as const,
    is_key: false,
    is_comparable: true,
    weight: 5,
    config: { min: 1, max: 5 },
    ruleConfig: { direction: 'higher' as const, min: 1, max: 5 },
  },
];

describe('RulesDataTable', () => {
  beforeEach(() => {
    refresh.mockReset();
    updateCriterionWeight.mockReset();
    updateCriterionWeight.mockResolvedValue({});
    updateCriterionRuleConfig.mockReset();
    updateCriterionRuleConfig.mockResolvedValue({});
  });

  it('renders only comparable criteria with rule and weight columns', () => {
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1);

    expect(bodyRows).toHaveLength(4);
    expect(screen.queryByRole('cell', { name: 'Name' })).not.toBeInTheDocument();

    const weightHeader = screen.getByRole('columnheader', { name: /Weight/ });
    expect(weightHeader).toHaveTextContent('Remaining: 25 / 100');

    const priceRow = screen.getByText('Price').closest('tr');
    expect(priceRow).not.toBeNull();
    expect(
      within(priceRow!).getByRole('radio', { name: 'Lower is better' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(priceRow!).getByRole('radio', { name: 'Higher is better' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(within(priceRow!).getByLabelText('Weight for Price')).toHaveValue(
      '40',
    );

    const electricRow = screen.getByText('Electric').closest('tr');
    expect(electricRow).not.toBeNull();
    expect(
      within(electricRow!).getByRole('radio', { name: 'Yes is better' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(electricRow!).getByRole('radio', { name: 'No is better' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      within(electricRow!).getByLabelText('Weight for Electric'),
    ).toHaveValue('20');

    const fuelRow = screen.getByText('Fuel').closest('tr');
    expect(fuelRow).not.toBeNull();
    expect(
      within(fuelRow!).getByText('Best: Petrol · Worst: Diesel'),
    ).toBeInTheDocument();
    expect(
      within(fuelRow!).getByRole('button', { name: 'Edit' }),
    ).toBeInTheDocument();
    expect(within(fuelRow!).getByLabelText('Weight for Fuel')).toHaveValue(
      '10',
    );

    const scoreRow = screen.getByText('Score').closest('tr');
    expect(scoreRow).not.toBeNull();
    expect(
      within(scoreRow!).getByRole('radio', { name: 'Higher is better' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(scoreRow!).getByRole('radio', { name: 'Lower is better' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('shows an empty state when there are no comparable criteria', () => {
    render(<RulesDataTable comparisonId={7} criteria={[criteria[0]]} />);

    expect(screen.getByText('No comparable criteria yet.')).toBeInTheDocument();

    const weightHeader = screen.getByRole('columnheader', { name: /Weight/ });
    expect(weightHeader).toHaveTextContent('Remaining: 100 / 100');
  });

  it('reduces the remaining pool when weight increases by 1', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    await user.click(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    );

    expect(screen.getByLabelText('Weight for Price')).toHaveValue('41');
    expect(
      screen.getByRole('columnheader', { name: /Weight/ }),
    ).toHaveTextContent('Remaining: 24 / 100');
  });

  it('disables decrease when weight is 0', () => {
    render(
      <RulesDataTable
        comparisonId={7}
        criteria={[
          criteria[0],
          { ...criteria[1], weight: 0 },
          { ...criteria[2], weight: 20 },
        ]}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Decrease weight for Price' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    ).toBeEnabled();
  });

  it('disables increase when the remaining pool is 0', () => {
    render(
      <RulesDataTable
        comparisonId={7}
        criteria={[
          criteria[0],
          { ...criteria[1], weight: 40 },
          { ...criteria[2], weight: 60 },
        ]}
      />,
    );

    expect(
      screen.getByRole('columnheader', { name: /Weight/ }),
    ).toHaveTextContent('Remaining: 0 / 100');
    expect(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Increase weight for Electric' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Decrease weight for Price' }),
    ).toBeEnabled();
  });

  it('saves the updated weight after debounce', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    await user.click(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    );

    await waitFor(() => {
      expect(updateCriterionWeight).toHaveBeenCalledWith(7, 2, 41);
    });
  });

  it('rolls the weight back when saving fails', async () => {
    const user = userEvent.setup();
    updateCriterionWeight.mockResolvedValue({ error: 'Pool exceeded' });
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    await user.click(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    );

    expect(
      screen.getByRole('columnheader', { name: /Weight/ }),
    ).toHaveTextContent('Remaining: 24 / 100');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Pool exceeded');
    });
    expect(screen.getByLabelText('Weight for Price')).toHaveValue('40');
    expect(
      screen.getByRole('columnheader', { name: /Weight/ }),
    ).toHaveTextContent('Remaining: 25 / 100');
  });

  it('saves a number direction change and keeps only one option active', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const priceRow = screen.getByText('Price').closest('tr');
    await user.click(
      within(priceRow!).getByRole('radio', { name: 'Higher is better' }),
    );

    expect(
      within(priceRow!).getByRole('radio', { name: 'Higher is better' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(priceRow!).getByRole('radio', { name: 'Lower is better' }),
    ).toHaveAttribute('aria-checked', 'false');

    await waitFor(() => {
      expect(updateCriterionRuleConfig).toHaveBeenCalledWith(7, 2, {
        direction: 'higher',
      });
    });
  });

  it('saves a rating direction change without dropping min and max', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const scoreRow = screen.getByText('Score').closest('tr');
    await user.click(
      within(scoreRow!).getByRole('radio', { name: 'Lower is better' }),
    );

    await waitFor(() => {
      expect(updateCriterionRuleConfig).toHaveBeenCalledWith(7, 5, {
        direction: 'lower',
        min: 1,
        max: 5,
      });
    });
  });

  it('saves a boolean preferred-value change', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const electricRow = screen.getByText('Electric').closest('tr');
    await user.click(
      within(electricRow!).getByRole('radio', { name: 'No is better' }),
    );

    await waitFor(() => {
      expect(updateCriterionRuleConfig).toHaveBeenCalledWith(7, 3, {
        preferredValue: false,
      });
    });
  });

  it('rolls the rule back when saving fails', async () => {
    const user = userEvent.setup();
    updateCriterionRuleConfig.mockResolvedValue({ error: 'Invalid rule' });
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const priceRow = screen.getByText('Price').closest('tr');
    await user.click(
      within(priceRow!).getByRole('radio', { name: 'Higher is better' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid rule');
    });
    expect(
      within(priceRow!).getByRole('radio', { name: 'Lower is better' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(priceRow!).getByRole('radio', { name: 'Higher is better' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('saves a valid enum rule payload when every option is assigned', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const fuelRow = screen.getByText('Fuel').closest('tr');
    await user.click(within(fuelRow!).getByRole('button', { name: 'Edit' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();

    await user.click(within(dialog).getByRole('button', { name: 'Add tier' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateCriterionRuleConfig).toHaveBeenCalledWith(7, 4, {
        tiers: [
          { rank: 1, values: ['Petrol'] },
          { rank: 2, values: ['Diesel'] },
          { rank: 3, values: [] },
        ],
      });
    });
  });
});
