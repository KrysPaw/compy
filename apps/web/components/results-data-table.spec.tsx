import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildResultsRows,
  ResultsDataTable,
  resultsInfoColumns,
} from './results-data-table';

describe('ResultsDataTable', () => {
  it('shows an empty state when there are no rows', () => {
    render(
      <ResultsDataTable
        keyCriterionName="Name"
        infoColumns={[]}
        rows={[]}
      />,
    );

    expect(screen.getByText('No entries yet.')).toBeInTheDocument();
  });

  it('renders info columns between key and Pros', () => {
    render(
      <ResultsDataTable
        keyCriterionName="Name"
        infoColumns={[{ id: 2, name: 'Brand' }]}
        rows={[
          {
            entryId: 11,
            keyLabel: 'iPhone 15',
            infoValues: ['Apple'],
            pros: '',
            cons: '',
            rate: 80,
          },
          {
            entryId: 10,
            keyLabel: 'Pixel 8',
            infoValues: ['Google'],
            pros: '',
            cons: '',
            rate: 40,
          },
          {
            entryId: 12,
            keyLabel: 'Galaxy S24',
            infoValues: ['Samsung'],
            pros: '',
            cons: '',
            rate: 30,
          },
          {
            entryId: 13,
            keyLabel: 'Nothing Phone',
            infoValues: ['Nothing'],
            pros: '',
            cons: '',
            rate: 10,
          },
        ]}
      />,
    );

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

    expect(headers).toEqual(['Name', 'Brand', 'Pros', 'Cons']);
    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
    expect(screen.getByLabelText('2nd place')).toBeInTheDocument();
    expect(screen.getByLabelText('3rd place')).toBeInTheDocument();
    expect(screen.queryByLabelText('4th place')).not.toBeInTheDocument();

    const rows = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      );

    expect(rows).toEqual([
      ['iPhone 15', 'Apple', '—', '—'],
      ['Pixel 8', 'Google', '—', '—'],
      ['Galaxy S24', 'Samsung', '—', '—'],
      ['Nothing Phone', 'Nothing', '—', '—'],
    ]);
  });
});

describe('resultsInfoColumns', () => {
  it('returns non-key, non-comparable criteria only', () => {
    expect(
      resultsInfoColumns([
        {
          id: 1,
          name: 'Name',
          type: 'text',
          is_key: true,
          is_comparable: false,
          weight: 0,
          config: null,
          ruleConfig: null,
        },
        {
          id: 2,
          name: 'Brand',
          type: 'text',
          is_key: false,
          is_comparable: false,
          weight: 0,
          config: null,
          ruleConfig: null,
        },
        {
          id: 3,
          name: 'Price',
          type: 'number',
          is_key: false,
          is_comparable: true,
          weight: 50,
          config: null,
          ruleConfig: { direction: 'lower' },
        },
      ]),
    ).toEqual([{ id: 2, name: 'Brand' }]);
  });
});

describe('buildResultsRows', () => {
  it('maps ranked entries with info values and empty pros/cons', () => {
    const criteria = [
      {
        id: 1,
        name: 'Name',
        type: 'text' as const,
        is_key: true,
        is_comparable: false,
        weight: 0,
        config: null,
        ruleConfig: null,
      },
      {
        id: 2,
        name: 'Brand',
        type: 'text' as const,
        is_key: false,
        is_comparable: false,
        weight: 0,
        config: null,
        ruleConfig: null,
      },
      {
        id: 3,
        name: 'Price',
        type: 'number' as const,
        is_key: false,
        is_comparable: true,
        weight: 100,
        config: null,
        ruleConfig: { direction: 'lower' as const },
      },
    ];
    const infoColumns = resultsInfoColumns(criteria);

    const rows = buildResultsRows(
      {
        criteria,
        entries: [
          {
            id: 10,
            entryValues: [
              { criterionId: 1, value: 'Pixel 8' },
              { criterionId: 2, value: 'Google' },
              { criterionId: 3, value: 799 },
            ],
          },
          {
            id: 11,
            entryValues: [
              { criterionId: 1, value: 'iPhone 15' },
              { criterionId: 2, value: 'Apple' },
              { criterionId: 3, value: 999 },
            ],
          },
        ],
      },
      [
        { entryId: 11, rate: 90 },
        { entryId: 10, rate: 10 },
      ],
      infoColumns,
    );

    expect(rows).toEqual([
      {
        entryId: 11,
        keyLabel: 'iPhone 15',
        infoValues: ['Apple'],
        pros: '',
        cons: '',
        rate: 90,
      },
      {
        entryId: 10,
        keyLabel: 'Pixel 8',
        infoValues: ['Google'],
        pros: '',
        cons: '',
        rate: 10,
      },
    ]);
  });
});
