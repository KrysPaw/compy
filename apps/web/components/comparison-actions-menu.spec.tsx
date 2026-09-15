import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComparisonActionsMenu } from './comparison-actions-menu';

const push = vi.fn();
const refresh = vi.fn();
const deleteComparison = vi.fn();
const updateComparisonName = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/actions', () => ({
  deleteComparison: (...args: unknown[]) => deleteComparison(...args),
  updateComparisonName: (...args: unknown[]) => updateComparisonName(...args),
}));

describe('ComparisonActionsMenu', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    deleteComparison.mockReset();
    updateComparisonName.mockReset();
  });

  it('renames a comparison and refreshes', async () => {
    const user = userEvent.setup();
    updateComparisonName.mockResolvedValue({});

    render(
      <ComparisonActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        comparisonName="Phones 2026"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Comparison actions' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /rename/i }));

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Laptops 2026');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateComparisonName).toHaveBeenCalledWith(
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        'Laptops 2026',
      );
      expect(refresh).toHaveBeenCalled();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('shows an error when rename fails', async () => {
    const user = userEvent.setup();
    updateComparisonName.mockResolvedValue({
      error: 'Failed to update name',
    });

    render(
      <ComparisonActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        comparisonName="Phones 2026"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Comparison actions' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /rename/i }));

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Laptops 2026');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Failed to update name')).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps delete disabled until the comparison name is confirmed', async () => {
    const user = userEvent.setup();

    render(
      <ComparisonActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        comparisonName="Phones 2026"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Comparison actions' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeDisabled();

    await user.type(
      screen.getByLabelText('Comparison name'),
      'Phones 2026',
    );

    expect(deleteButton).toBeEnabled();
  });

  it('deletes and navigates home after confirmation', async () => {
    const user = userEvent.setup();
    deleteComparison.mockResolvedValue({});

    render(
      <ComparisonActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        comparisonName="Phones 2026"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Comparison actions' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.type(
      screen.getByLabelText('Comparison name'),
      'Phones 2026',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteComparison).toHaveBeenCalledWith(
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      );
      expect(push).toHaveBeenCalledWith('/');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows an error when delete fails', async () => {
    const user = userEvent.setup();
    deleteComparison.mockResolvedValue({
      error: 'Failed to delete comparison',
    });

    render(
      <ComparisonActionsMenu
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        comparisonName="Phones 2026"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Comparison actions' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.type(
      screen.getByLabelText('Comparison name'),
      'Phones 2026',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('Failed to delete comparison'),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
