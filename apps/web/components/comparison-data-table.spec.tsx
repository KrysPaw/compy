import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ComparisonDataTable } from './comparison-data-table';

const criteria = [
  {
    id: 1,
    name: 'Name',
    type: 'Text' as const,
    is_key: true,
    is_comparable: false,
    config: null,
  },
  {
    id: 2,
    name: 'Price',
    type: 'Float' as const,
    is_key: false,
    is_comparable: true,
    config: null,
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
    render(<ComparisonDataTable criteria={criteria} entries={[]} />);

    expect(screen.getByText('No entries yet.')).toBeInTheDocument();
  });

  it('renders entry values and sorts by the clicked column', async () => {
    const user = userEvent.setup();
    render(<ComparisonDataTable criteria={criteria} entries={entries} />);

    const rows = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) =>
          within(row)
            .getAllByRole('cell')
            .map((cell) => cell.textContent),
        );

    expect(rows()).toEqual([
      ['Pixel 8', '799'],
      ['iPhone 15', '999'],
    ]);

    await user.click(screen.getByRole('button', { name: /Name/i }));

    expect(rows()).toEqual([
      ['iPhone 15', '999'],
      ['Pixel 8', '799'],
    ]);

    await user.click(screen.getByRole('button', { name: /Name/i }));

    expect(rows()).toEqual([
      ['Pixel 8', '799'],
      ['iPhone 15', '999'],
    ]);
  });

  it('renders a dash for missing values', () => {
    render(
      <ComparisonDataTable
        criteria={criteria}
        entries={[
          { id: 12, entryValues: [{ criterionId: 1, value: 'Only name' }] },
        ]}
      />,
    );

    expect(screen.getByText('Only name')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
