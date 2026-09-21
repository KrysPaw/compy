import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntriesView } from './entries-view';
import { renderWithViewMode } from '@/test/render';

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
];

describe('EntriesView', () => {
  it('renders the table on desktop by default', () => {
    window.innerWidth = 1280;
    renderWithViewMode(
      <EntriesView
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={entries}
      />,
    );

    expect(screen.getByTestId('entries-data-table')).toBeInTheDocument();
    expect(screen.queryByTestId('entries-card-list')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('renders cards on mobile', () => {
    window.innerWidth = 390;
    renderWithViewMode(
      <EntriesView
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
        entries={entries}
      />,
    );

    expect(screen.getByTestId('entries-card-list')).toBeInTheDocument();
    expect(screen.queryByTestId('entries-data-table')).not.toBeInTheDocument();
    expect(screen.getAllByText('Pixel 8').length).toBeGreaterThan(0);
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('799')).toBeInTheDocument();
  });
});
