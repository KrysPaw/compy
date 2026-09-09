import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RulesDataTable } from './rules-data-table';

const refresh = vi.fn();
const updateCriterionWeight = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  updateCriterionWeight: (...args: unknown[]) =>
    updateCriterionWeight(...args),
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
    ruleConfig: { tiers: [] },
  },
];

describe('RulesDataTable', () => {
  beforeEach(() => {
    refresh.mockReset();
    updateCriterionWeight.mockReset();
    updateCriterionWeight.mockResolvedValue({});
  });

  it('renders only comparable criteria with rule and weight columns', () => {
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1);

    expect(bodyRows).toHaveLength(3);
    expect(screen.queryByRole('cell', { name: 'Name' })).not.toBeInTheDocument();

    const weightHeader = screen.getByRole('columnheader', { name: /Weight/ });
    expect(
      within(weightHeader).getByText('Remaining: 30 / 100'),
    ).toBeInTheDocument();

    const priceRow = screen.getByText('Price').closest('tr');
    expect(priceRow).not.toBeNull();
    expect(within(priceRow!).getByText('Lower is better')).toBeInTheDocument();
    expect(within(priceRow!).getByLabelText('Weight for Price')).toHaveValue(
      '40',
    );

    const electricRow = screen.getByText('Electric').closest('tr');
    expect(electricRow).not.toBeNull();
    expect(within(electricRow!).getByText('yes is better')).toBeInTheDocument();
    expect(
      within(electricRow!).getByLabelText('Weight for Electric'),
    ).toHaveValue('20');

    const fuelRow = screen.getByText('Fuel').closest('tr');
    expect(fuelRow).not.toBeNull();
    expect(within(fuelRow!).getByText('—')).toBeInTheDocument();
    expect(within(fuelRow!).getByLabelText('Weight for Fuel')).toHaveValue(
      '10',
    );
  });

  it('shows an empty state when there are no comparable criteria', () => {
    render(<RulesDataTable comparisonId={7} criteria={[criteria[0]]} />);

    expect(screen.getByText('No comparable criteria yet.')).toBeInTheDocument();

    const weightHeader = screen.getByRole('columnheader', { name: /Weight/ });
    expect(
      within(weightHeader).getByText('Remaining: 100 / 100'),
    ).toBeInTheDocument();
  });

  it('reduces the remaining pool when weight increases by 1', async () => {
    const user = userEvent.setup();
    render(<RulesDataTable comparisonId={7} criteria={criteria} />);

    await user.click(
      screen.getByRole('button', { name: 'Increase weight for Price' }),
    );

    expect(screen.getByLabelText('Weight for Price')).toHaveValue('41');
    expect(screen.getByText('Remaining: 29 / 100')).toBeInTheDocument();
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

    expect(screen.getByText('Remaining: 0 / 100')).toBeInTheDocument();
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

    expect(screen.getByText('Remaining: 29 / 100')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Pool exceeded');
    });
    expect(screen.getByLabelText('Weight for Price')).toHaveValue('40');
    expect(screen.getByText('Remaining: 30 / 100')).toBeInTheDocument();
  });
});
