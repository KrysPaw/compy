import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEntryDialog } from './create-entry-dialog';
import type { Criterion } from '@/lib/create-entry';

const refresh = vi.fn();
const createEntry = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  createEntry: (...args: unknown[]) => createEntry(...args),
}));

const criteria: Criterion[] = [
  {
    id: 1,
    name: 'Name',
    type: 'text',
    is_key: true,
    is_comparable: false,
    weight: 0,
    config: null,
    ruleConfig: null,
  },
];

describe('CreateEntryDialog', () => {
  beforeEach(() => {
    refresh.mockReset();
    createEntry.mockReset();
  });

  it('closes the dialog after a successful create', async () => {
    const user = userEvent.setup();
    createEntry.mockResolvedValue({ entryId: 9 });

    render(
      <CreateEntryDialog
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add entry/i }));
    await user.type(screen.getByLabelText('Name'), 'Pixel 8');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createEntry).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps the dialog open and clears fields when Add next is on', async () => {
    const user = userEvent.setup();
    createEntry.mockResolvedValue({ entryId: 9 });

    render(
      <CreateEntryDialog
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add entry/i }));
    await user.type(screen.getByLabelText('Name'), 'Pixel 8');
    await user.click(screen.getByRole('switch', { name: 'Add next' }));
    expect(screen.getByRole('switch', { name: 'Add next' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createEntry).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByRole('switch', { name: 'Add next' })).toBeChecked();
  });

  it('shows a server error and keeps field values', async () => {
    const user = userEvent.setup();
    createEntry.mockResolvedValue({ error: 'Failed to create entry' });

    render(
      <CreateEntryDialog
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        criteria={criteria}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add entry/i }));
    await user.type(screen.getByLabelText('Name'), 'Pixel 8');
    await user.click(screen.getByRole('switch', { name: 'Add next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Failed to create entry')).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Pixel 8');
  });
});
