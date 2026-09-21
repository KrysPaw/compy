'use client';

import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntryActionsMenu } from './entry-actions-menu';

const refresh = vi.fn();
const updateEntry = vi.fn();
const deleteEntry = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  updateEntry: (...args: unknown[]) => updateEntry(...args),
  deleteEntry: (...args: unknown[]) => deleteEntry(...args),
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

describe('EntryActionsMenu', () => {
  beforeEach(() => {
    refresh.mockReset();
    updateEntry.mockReset();
    deleteEntry.mockReset();
  });

  it('edits an entry and refreshes', async () => {
    const user = userEvent.setup();
    updateEntry.mockResolvedValue({});

    render(
      <EntryActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        entryId={9}
        entryLabel="Pixel 8"
        criteria={criteria}
        entryValues={[
          { criterionId: 1, value: 'Pixel 8' },
          { criterionId: 2, value: 799 },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pixel 8 actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Pixel 8a');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateEntry).toHaveBeenCalledWith(
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        9,
        {
          values: [
            { criterionId: 1, type: 'text', value: 'Pixel 8a' },
            { criterionId: 2, type: 'number', value: 799 },
          ],
        },
        [],
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('clears removed optional values when saving', async () => {
    const user = userEvent.setup();
    updateEntry.mockResolvedValue({});

    render(
      <EntryActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        entryId={9}
        entryLabel="Pixel 8"
        criteria={criteria}
        entryValues={[
          { criterionId: 1, value: 'Pixel 8' },
          { criterionId: 2, value: 799 },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pixel 8 actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

    const priceInput = screen.getByLabelText('Price');
    await user.clear(priceInput);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateEntry).toHaveBeenCalledWith(
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        9,
        {
          values: [{ criterionId: 1, type: 'text', value: 'Pixel 8' }],
        },
        [2],
      );
    });
  });

  it('deletes an entry after confirmation', async () => {
    const user = userEvent.setup();
    deleteEntry.mockResolvedValue({});

    render(
      <EntryActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        entryId={9}
        entryLabel="Pixel 8"
        criteria={criteria}
        entryValues={[{ criterionId: 1, value: 'Pixel 8' }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pixel 8 actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteEntry).toHaveBeenCalledWith(
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        9,
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows an error when delete fails', async () => {
    const user = userEvent.setup();
    deleteEntry.mockResolvedValue({ error: 'Entry not found' });

    render(
      <EntryActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        entryId={9}
        entryLabel="Pixel 8"
        criteria={criteria}
        entryValues={[{ criterionId: 1, value: 'Pixel 8' }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pixel 8 actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Entry not found')).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
