import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { ResultsConfigAlertView } from './results-config-alert-view';

const labels = {
  weightsZero: 'No weights assigned — all scores are equal.',
  weightsPartial: 'Weight pool isn’t fully distributed (remaining 40/100).',
  rulesUnset: 'Some ranking rules aren’t set yet.',
  valuesMissing:
    'Some entry values are missing — incomplete data may distort ranking.',
  setRules: 'Set rules',
  completeEntries: 'Complete entries',
};

describe('ResultsConfigAlertView', () => {
  it('renders zero-weight and rules lines with a rules link', () => {
    render(
      <ResultsConfigAlertView
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        state={{
          weightIssue: 'zero',
          remaining: 100,
          rulesIncomplete: true,
          valuesMissing: false,
        }}
        labels={labels}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(labels.weightsZero);
    expect(alert).toHaveTextContent(labels.rulesUnset);
    expect(alert).not.toHaveTextContent(labels.weightsPartial);
    expect(alert).not.toHaveTextContent(labels.valuesMissing);

    const link = screen.getByRole('link', { name: labels.setRules });
    expect(link).toHaveAttribute(
      'href',
      '/comparisons/01ARZ3NDEKTSV4RRFFQ69G5FAV/rules',
    );
    expect(
      screen.queryByRole('link', { name: labels.completeEntries }),
    ).not.toBeInTheDocument();
  });

  it('renders only the partial-weight line when rules are complete', () => {
    render(
      <ResultsConfigAlertView
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        state={{
          weightIssue: 'partial',
          remaining: 40,
          rulesIncomplete: false,
          valuesMissing: false,
        }}
        labels={labels}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(labels.weightsPartial);
    expect(alert).not.toHaveTextContent(labels.weightsZero);
    expect(alert).not.toHaveTextContent(labels.rulesUnset);
    expect(alert).not.toHaveTextContent(labels.valuesMissing);
  });

  it('renders missing-values line with an entries link', () => {
    render(
      <ResultsConfigAlertView
        publicId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
        state={{
          weightIssue: null,
          remaining: 0,
          rulesIncomplete: false,
          valuesMissing: true,
        }}
        labels={labels}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(labels.valuesMissing);
    expect(alert).not.toHaveTextContent(labels.rulesUnset);

    const link = screen.getByRole('link', { name: labels.completeEntries });
    expect(link).toHaveAttribute(
      'href',
      '/comparisons/01ARZ3NDEKTSV4RRFFQ69G5FAV/entries',
    );
    expect(
      screen.queryByRole('link', { name: labels.setRules }),
    ).not.toBeInTheDocument();
  });
});
