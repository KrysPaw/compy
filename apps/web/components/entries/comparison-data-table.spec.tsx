import '@testing-library/jest-dom/vitest';
import { screen, within } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComparisonDataTable } from './comparison-data-table';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/actions', () => ({
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
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
    weight: 25,
    config: null,
    ruleConfig: { direction: 'lower' as const },
  },
];

const entries = [
  {
    id: 10,
    entryValues: [
      { criterionId: 1, value: 'Pixel 8' },
      { criterionId: 2, value: 799 },
    ],
  },
  {
    id: 11,
    entryValues: [
      { criterionId: 1, value: 'iPhone 15' },
      { criterionId: 2, value: 999 },
    ],
  },
];

describe('ComparisonDataTable', () => {
  it('shows an empty state when there are no entries', () => {
    render(
      <ComparisonDataTable
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={[]}
      />,
    );

    expect(screen.getByText('No entries yet.')).toBeInTheDocument();
  });

  it('renders entry values and sorts by the clicked column', async () => {
    const user = userEvent.setup();
    render(
      <ComparisonDataTable
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={entries}
      />,
    );

    const valueCells = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) =>
          within(row)
            .getAllByRole('cell')
            .slice(0, -1)
            .map((cell) => cell.textContent),
        );

    expect(valueCells()).toEqual([
      ['Pixel 8', '799'],
      ['iPhone 15', '999'],
    ]);

    await user.click(screen.getByRole('button', { name: /Name/i }));

    expect(valueCells()).toEqual([
      ['iPhone 15', '999'],
      ['Pixel 8', '799'],
    ]);

    await user.click(screen.getByRole('button', { name: /Name/i }));

    expect(valueCells()).toEqual([
      ['Pixel 8', '799'],
      ['iPhone 15', '999'],
    ]);
  });

  it('renders a dash for missing values', () => {
    render(
      <ComparisonDataTable
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={[
          { id: 12, entryValues: [{ criterionId: 1, value: 'Only name' }] },
        ]}
      />,
    );

    expect(screen.getByText('Only name')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('exposes edit and delete actions for each entry', () => {
    render(
      <ComparisonDataTable
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={entries}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Pixel 8 actions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'iPhone 15 actions' }),
    ).toBeInTheDocument();
  });

  it('formats rating values as value/max with a star', () => {
    render(
      <ComparisonDataTable
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={[
          ...criteria,
          {
            id: 3,
            name: 'Score',
            type: 'rating',
            is_key: false,
            is_comparable: true,
            weight: 10,
            config: { min: 1, max: 5 },
            ruleConfig: { direction: 'higher', min: 1, max: 5 },
          },
        ]}
        entries={[
          {
            id: 12,
            entryValues: [
              { criterionId: 1, value: 'Pixel 8' },
              { criterionId: 2, value: 799 },
              { criterionId: 3, value: 4 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('4 / 5')).toBeInTheDocument();
  });
});
