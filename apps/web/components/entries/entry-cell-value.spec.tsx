import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import { describe, expect, it } from 'vitest';
import { EntryCellValue } from './entry-cell-value';

describe('EntryCellValue', () => {
  it('appends the criterion unit as a value suffix for numbers', () => {
    render(
      <EntryCellValue
        criterion={{
          id: 2,
          name: 'Weight',
          type: 'number',
          is_key: false,
          is_comparable: true,
          weight: 25,
          config: { unit: 'kg' },
          ruleConfig: { direction: 'higher' },
        }}
        value={12}
      />,
    );

    expect(screen.getByText('12 kg')).toBeInTheDocument();
  });

  it('renders number values without a unit when config has none', () => {
    render(
      <EntryCellValue
        criterion={{
          id: 2,
          name: 'Price',
          type: 'number',
          is_key: false,
          is_comparable: true,
          weight: 25,
          config: null,
          ruleConfig: { direction: 'lower' },
        }}
        value={799}
      />,
    );

    expect(screen.getByText('799')).toBeInTheDocument();
  });
});
