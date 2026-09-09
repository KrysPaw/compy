import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RulesDataTable } from './rules-data-table';

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
  it('renders only comparable criteria with rule and weight columns', () => {
    render(<RulesDataTable criteria={criteria} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1);

    expect(bodyRows).toHaveLength(3);
    expect(screen.queryByRole('cell', { name: 'Name' })).not.toBeInTheDocument();

    const priceRow = screen.getByText('Price').closest('tr');
    expect(priceRow).not.toBeNull();
    expect(within(priceRow!).getByText('lower is better')).toBeInTheDocument();
    expect(within(priceRow!).getByText('40')).toBeInTheDocument();

    const electricRow = screen.getByText('Electric').closest('tr');
    expect(electricRow).not.toBeNull();
    expect(within(electricRow!).getByText('yes is better')).toBeInTheDocument();
    expect(within(electricRow!).getByText('20')).toBeInTheDocument();

    const fuelRow = screen.getByText('Fuel').closest('tr');
    expect(fuelRow).not.toBeNull();
    expect(within(fuelRow!).getByText('—')).toBeInTheDocument();
    expect(within(fuelRow!).getByText('10')).toBeInTheDocument();
  });

  it('shows an empty state when there are no comparable criteria', () => {
    render(<RulesDataTable criteria={[criteria[0]]} />);

    expect(screen.getByText('No comparable criteria yet.')).toBeInTheDocument();
  });
});
