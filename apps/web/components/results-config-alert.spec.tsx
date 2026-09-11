import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { ResultsConfigAlertView } from './results-config-alert';

const labels = {
  weightsZero: 'No weights assigned — all scores are equal.',
  weightsPartial: 'Weight pool isn’t fully distributed (remaining 40/100).',
  rulesUnset: 'Some ranking rules aren’t set yet.',
  setRules: 'Set rules',
};

describe('ResultsConfigAlertView', () => {
  it('renders zero-weight and rules lines with a rules link', () => {
    render(
      <ResultsConfigAlertView
        comparisonId={42}
        state={{
          weightIssue: 'zero',
          remaining: 100,
          rulesIncomplete: true,
        }}
        labels={labels}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(labels.weightsZero);
    expect(alert).toHaveTextContent(labels.rulesUnset);
    expect(alert).not.toHaveTextContent(labels.weightsPartial);

    const link = screen.getByRole('link', { name: labels.setRules });
    expect(link).toHaveAttribute('href', '/comparisons/42/rules');
  });

  it('renders only the partial-weight line when rules are complete', () => {
    render(
      <ResultsConfigAlertView
        comparisonId={7}
        state={{
          weightIssue: 'partial',
          remaining: 40,
          rulesIncomplete: false,
        }}
        labels={labels}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(labels.weightsPartial);
    expect(alert).not.toHaveTextContent(labels.weightsZero);
    expect(alert).not.toHaveTextContent(labels.rulesUnset);
  });
});
