import '@testing-library/jest-dom/vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/render';
import { ComparisonTabShell } from './comparison-tab-shell';

const push = vi.fn();
let pathname = '/comparisons/01ARZ3NDEKTSV4RRFFQ69G5FAV/criteria';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

const publicId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

describe('ComparisonTabShell', () => {
  beforeEach(() => {
    push.mockReset();
    pathname = `/comparisons/${publicId}/criteria`;
  });

  it('optimistically selects the clicked tab and dims content while pending', async () => {
    const user = userEvent.setup();

    render(
      <ComparisonTabShell publicId={publicId} header={<div>Phones</div>}>
        <p>Criteria body</p>
      </ComparisonTabShell>,
    );

    const content = screen.getByText('Criteria body').parentElement;
    expect(content).not.toHaveAttribute('data-pending');
    expect(content).toHaveAttribute('aria-busy', 'false');

    await user.click(screen.getByRole('tab', { name: 'Entries' }));

    expect(screen.getByRole('tab', { name: 'Entries' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(push).toHaveBeenCalledWith(`/comparisons/${publicId}/entries`);
    expect(content).toHaveAttribute('data-pending');
    expect(content).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores a click on the already active tab', async () => {
    const user = userEvent.setup();

    render(
      <ComparisonTabShell publicId={publicId} header={<div>Phones</div>}>
        <p>Criteria body</p>
      </ComparisonTabShell>,
    );

    await user.click(screen.getByRole('tab', { name: 'Criteria' }));

    expect(push).not.toHaveBeenCalled();
  });

  it('clears pending when pathname matches and the transition is idle', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ComparisonTabShell publicId={publicId} header={<div>Phones</div>}>
        <p>Body</p>
      </ComparisonTabShell>,
    );

    await user.click(screen.getByRole('tab', { name: 'Entries' }));

    const content = screen.getByText('Body').parentElement;
    expect(content).toHaveAttribute('data-pending');

    pathname = `/comparisons/${publicId}/entries`;
    await act(async () => {
      rerender(
        <ComparisonTabShell publicId={publicId} header={<div>Phones</div>}>
          <p>Body</p>
        </ComparisonTabShell>,
      );
    });

    expect(screen.getByRole('tab', { name: 'Entries' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(content).not.toHaveAttribute('data-pending');
    expect(content).toHaveAttribute('aria-busy', 'false');
  });
});
