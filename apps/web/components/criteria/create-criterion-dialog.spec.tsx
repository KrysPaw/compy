import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCriterionDialog } from './create-criterion-dialog';

const refresh = vi.fn();
const createCriterion = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions', () => ({
  createCriterion: (...args: unknown[]) => createCriterion(...args),
}));

describe('CreateCriterionDialog', () => {
  beforeEach(() => {
    refresh.mockReset();
    createCriterion.mockReset();
  });

  it('closes the dialog after a successful create', async () => {
    const user = userEvent.setup();
    createCriterion.mockResolvedValue({ criterionId: 4 });

    render(<CreateCriterionDialog publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV" />);

    await user.click(screen.getByRole('button', { name: /add criterion/i }));
    await user.type(screen.getByLabelText('Name'), 'Price');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createCriterion).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps the dialog open and clears fields when Add next is on', async () => {
    const user = userEvent.setup();
    createCriterion.mockResolvedValue({ criterionId: 4 });

    render(<CreateCriterionDialog publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV" />);

    await user.click(screen.getByRole('button', { name: /add criterion/i }));
    await user.type(screen.getByLabelText('Name'), 'Price');
    await user.click(screen.getByRole('radio', { name: /comparable number/i }));
    await user.click(screen.getByRole('switch', { name: 'Add next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createCriterion).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(
      screen.getByRole('radio', { name: /identity only/i }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Add next' })).toBeChecked();
  });

  it('shows a server error and keeps field values', async () => {
    const user = userEvent.setup();
    createCriterion.mockResolvedValue({ error: 'Failed to create criterion' });

    render(<CreateCriterionDialog publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV" />);

    await user.click(screen.getByRole('button', { name: /add criterion/i }));
    await user.type(screen.getByLabelText('Name'), 'Price');
    await user.click(screen.getByRole('switch', { name: 'Add next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Failed to create criterion'),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Price');
  });
});
