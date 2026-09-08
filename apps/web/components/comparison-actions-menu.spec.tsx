import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComparisonActionsMenu } from './comparison-actions-menu';

const push = vi.fn();
const refresh = vi.fn();
const deleteComparison = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/actions', () => ({
  deleteComparison: (...args: unknown[]) => deleteComparison(...args),
}));

describe('ComparisonActionsMenu', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    deleteComparison.mockReset();
  });

  it('keeps delete disabled until the comparison name is confirmed', async () => {
    const user = userEvent.setup();

    render(
      <ComparisonActionsMenu
        comparisonId={7}
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
        comparisonId={7}
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
      expect(deleteComparison).toHaveBeenCalledWith(7);
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
        comparisonId={7}
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
