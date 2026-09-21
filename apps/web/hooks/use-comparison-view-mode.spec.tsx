import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComparisonViewModeToggle } from '@/components/comparison/comparison-view-mode-toggle';
import { COMPARISON_VIEW_MODE_KEY } from '@/lib/comparison-view-mode';
import { renderWithViewMode } from '@/test/render';
import { useComparisonViewMode } from '@/hooks/use-comparison-view-mode';

function EffectiveModeProbe() {
  const { effectiveMode, showToggle } = useComparisonViewMode();
  return (
    <div>
      <span data-testid="effective-mode">{effectiveMode}</span>
      <span data-testid="show-toggle">{String(showToggle)}</span>
    </div>
  );
}

describe('useComparisonViewMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.innerWidth = 1280;
  });

  afterEach(() => {
    window.innerWidth = 1280;
    window.localStorage.clear();
  });

  it('uses table on desktop by default and persists cards preference', async () => {
    const user = userEvent.setup();
    renderWithViewMode(
      <>
        <ComparisonViewModeToggle />
        <EffectiveModeProbe />
      </>,
    );

    expect(screen.getByTestId('effective-mode')).toHaveTextContent('table');
    expect(screen.getByTestId('show-toggle')).toHaveTextContent('true');

    await user.click(screen.getByRole('radio', { name: 'Cards' }));
    expect(screen.getByTestId('effective-mode')).toHaveTextContent('cards');
    expect(window.localStorage.getItem(COMPARISON_VIEW_MODE_KEY)).toBe('cards');
  });

  it('forces cards on mobile and hides the toggle', () => {
    window.innerWidth = 390;
    renderWithViewMode(<EffectiveModeProbe />);

    expect(screen.getByTestId('effective-mode')).toHaveTextContent('cards');
    expect(screen.getByTestId('show-toggle')).toHaveTextContent('false');
    expect(screen.queryByRole('group', { name: 'View mode' })).not.toBeInTheDocument();
  });

  it('keeps forcing cards on mobile even when storage prefers table', () => {
    window.localStorage.setItem(COMPARISON_VIEW_MODE_KEY, 'table');
    window.innerWidth = 390;
    renderWithViewMode(<EffectiveModeProbe />);

    expect(screen.getByTestId('effective-mode')).toHaveTextContent('cards');
  });
});
