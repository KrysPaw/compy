import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateComparisonDialog } from './create-comparison-dialog';

const push = vi.fn();
const refresh = vi.fn();
const createComparison = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/actions', () => ({
  createComparison: (...args: unknown[]) => createComparison(...args),
}));

describe('CreateComparisonDialog', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    createComparison.mockReset();
  });

  it('shows a server error and keeps the dialog open', async () => {
    const user = userEvent.setup();
    createComparison.mockResolvedValue({ error: 'Failed to create comparison' });

    render(<CreateComparisonDialog />);

    await user.click(
      screen.getByRole('button', { name: /new comparison/i }),
    );
    await user.type(screen.getByLabelText('Name'), 'Phones');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Failed to create comparison'),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('navigates to the created comparison on success', async () => {
    const user = userEvent.setup();
    createComparison.mockResolvedValue({
      publicId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    });

    render(<CreateComparisonDialog />);

    await user.click(
      screen.getByRole('button', { name: /new comparison/i }),
    );
    await user.type(screen.getByLabelText('Name'), 'Phones');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        '/comparisons/01ARZ3NDEKTSV4RRFFQ69G5FAV',
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('uses a custom trigger when provided', async () => {
    const user = userEvent.setup();

    render(
      <CreateComparisonDialog
        trigger={<button type="button">Create comparison</button>}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Create comparison' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
