import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CriterionActionsMenu } from './criterion-actions-menu';

const refresh = vi.fn();
const updateCriterionName = vi.fn();
const deleteCriterion = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  updateCriterionName: (...args: unknown[]) => updateCriterionName(...args),
  deleteCriterion: (...args: unknown[]) => deleteCriterion(...args),
}));

describe('CriterionActionsMenu', () => {
  beforeEach(() => {
    refresh.mockReset();
    updateCriterionName.mockReset();
    deleteCriterion.mockReset();
  });

  it('renames a criterion and refreshes', async () => {
    const user = userEvent.setup();
    updateCriterionName.mockResolvedValue({});

    render(
      <CriterionActionsMenu
        comparisonId={7}
        criterionId={3}
        criterionName="Price"
        canDelete
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Price actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /rename/i }));

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Cost');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateCriterionName).toHaveBeenCalledWith(7, 3, 'Cost');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('hides delete when the criterion cannot be deleted', async () => {
    const user = userEvent.setup();

    render(
      <CriterionActionsMenu
        comparisonId={7}
        criterionId={1}
        criterionName="name"
        canDelete={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'name actions' }));
    expect(await screen.findByRole('menuitem', { name: /rename/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('deletes a criterion after confirmation', async () => {
    const user = userEvent.setup();
    deleteCriterion.mockResolvedValue({});

    render(
      <CriterionActionsMenu
        comparisonId={7}
        criterionId={3}
        criterionName="Price"
        canDelete
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Price actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteCriterion).toHaveBeenCalledWith(7, 3);
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows an error when delete fails', async () => {
    const user = userEvent.setup();
    deleteCriterion.mockResolvedValue({
      error: 'Key criterion cannot be deleted.',
    });

    render(
      <CriterionActionsMenu
        comparisonId={7}
        criterionId={3}
        criterionName="Price"
        canDelete
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Price actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('Key criterion cannot be deleted.'),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
