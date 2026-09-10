import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildResultsRows,
  denseMedalPlaceIndex,
  ResultsDataTable,
  resultsInfoColumns,
} from './results-data-table';

describe('denseMedalPlaceIndex', () => {
  it('shares medals for tied scores using dense ranking', () => {
    expect(denseMedalPlaceIndex([100, 100, 80, 70], 0)).toBe(0);
    expect(denseMedalPlaceIndex([100, 100, 80, 70], 1)).toBe(0);
    expect(denseMedalPlaceIndex([100, 100, 80, 70], 2)).toBe(1);
    expect(denseMedalPlaceIndex([100, 100, 80, 70], 3)).toBe(2);
  });

  it('allows multiple 2nd and 3rd placers', () => {
    expect(denseMedalPlaceIndex([90, 80, 80, 70, 70], 0)).toBe(0);
    expect(denseMedalPlaceIndex([90, 80, 80, 70, 70], 1)).toBe(1);
    expect(denseMedalPlaceIndex([90, 80, 80, 70, 70], 2)).toBe(1);
    expect(denseMedalPlaceIndex([90, 80, 80, 70, 70], 3)).toBe(2);
    expect(denseMedalPlaceIndex([90, 80, 80, 70, 70], 4)).toBe(2);
  });

  it('returns null below 3rd place', () => {
    expect(denseMedalPlaceIndex([100, 90, 80, 70], 3)).toBeNull();
  });
});

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

  it('renders Score then Highlights with pros above cons', () => {
    render(
      <ResultsDataTable
        keyCriterionName="Name"
        infoColumns={[{ id: 2, name: 'Brand' }]}
        rows={[
          {
            entryId: 11,
            keyLabel: 'iPhone 15',
            infoValues: ['Apple'],
            pros: ['Low Price'],
            cons: ['Not Electric'],
            rate: 80,
          },
          {
            entryId: 10,
            keyLabel: 'Pixel 8',
            infoValues: ['Google'],
            pros: [],
            cons: [],
            rate: 40,
          },
          {
            entryId: 12,
            keyLabel: 'Galaxy S24',
            infoValues: ['Samsung'],
            pros: [],
            cons: [],
            rate: 30,
          },
          {
            entryId: 13,
            keyLabel: 'Nothing Phone',
            infoValues: ['Nothing'],
            pros: [],
            cons: [],
            rate: 10,
          },
        ]}
      />,
    );

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

    expect(headers).toEqual(['Name', 'Brand', 'Score', 'Highlights']);
    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
    expect(screen.getByLabelText('2nd place')).toBeInTheDocument();
    expect(screen.getByLabelText('3rd place')).toBeInTheDocument();
    expect(screen.queryByLabelText('4th place')).not.toBeInTheDocument();

    expect(screen.getByText('Low Price')).toBeInTheDocument();
    expect(screen.getByText('Not Electric')).toBeInTheDocument();

    const rows = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      );

    expect(rows[0]?.[0]).toContain('iPhone 15');
    expect(rows[0]?.[1]).toBe('Apple');
    expect(rows[0]?.[2]).toBe('80');
    expect(rows[0]?.[3]).toContain('Low Price');
    expect(rows[0]?.[3]).toContain('Not Electric');
    expect(rows[0]?.[3]?.indexOf('Low Price')).toBeLessThan(
      rows[0]?.[3]?.indexOf('Not Electric') ?? -1,
    );
    expect(rows[1]).toEqual(['Pixel 8', 'Google', '40', '—']);
  });

  it('shows the same medal for tied top scores', () => {
    render(
      <ResultsDataTable
        keyCriterionName="Name"
        infoColumns={[]}
        rows={[
          {
            entryId: 1,
            keyLabel: 'A',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 100,
          },
          {
            entryId: 2,
            keyLabel: 'B',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 100,
          },
          {
            entryId: 3,
            keyLabel: 'C',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 50,
          },
        ]}
      />,
    );

    expect(screen.getAllByLabelText('1st place')).toHaveLength(2);
    expect(screen.getByLabelText('2nd place')).toBeInTheDocument();
    expect(screen.queryByLabelText('3rd place')).not.toBeInTheDocument();
  });

  it('ties medals by displayed rounded scores, not raw floats', () => {
    render(
      <ResultsDataTable
        keyCriterionName="Name"
        infoColumns={[]}
        rows={[
          {
            entryId: 1,
            keyLabel: 'A',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 67.2,
          },
          {
            entryId: 2,
            keyLabel: 'B',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 66.4,
          },
          {
            entryId: 3,
            keyLabel: 'C',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 63.4,
          },
          {
            entryId: 4,
            keyLabel: 'D',
            infoValues: [],
            pros: [],
            cons: [],
            rate: 62.6,
          },
        ]}
      />,
    );

    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
    expect(screen.getByLabelText('2nd place')).toBeInTheDocument();
    expect(screen.getAllByLabelText('3rd place')).toHaveLength(2);
    expect(screen.getAllByText('63')).toHaveLength(2);
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
  it('maps ranked entries with info values and typed pros/cons', () => {
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
        weight: 40,
        config: null,
        ruleConfig: { direction: 'lower' as const },
      },
      {
        id: 4,
        name: 'Fuel',
        type: 'enum' as const,
        is_key: false,
        is_comparable: true,
        weight: 20,
        config: { options: ['Petrol', 'Hybrid', 'Electric'] },
        ruleConfig: {
          tiers: [
            { rank: 1, values: ['Hybrid'] },
            { rank: 2, values: ['Electric'] },
            { rank: 3, values: ['Petrol'] },
          ],
        },
      },
      {
        id: 5,
        name: 'electric',
        type: 'boolean' as const,
        is_key: false,
        is_comparable: true,
        weight: 20,
        config: null,
        ruleConfig: { preferredValue: true },
      },
      {
        id: 6,
        name: 'rate',
        type: 'rating' as const,
        is_key: false,
        is_comparable: true,
        weight: 20,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: 'higher' as const, min: 1, max: 5 },
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
              { criterionId: 3, value: 500 },
              { criterionId: 4, value: 'Hybrid' },
              { criterionId: 5, value: true },
              { criterionId: 6, value: 5 },
            ],
          },
          {
            id: 11,
            entryValues: [
              { criterionId: 1, value: 'iPhone 15' },
              { criterionId: 2, value: 'Apple' },
              { criterionId: 3, value: 999 },
              { criterionId: 4, value: 'Petrol' },
              { criterionId: 5, value: false },
              { criterionId: 6, value: 1 },
            ],
          },
        ],
      },
      [
        { entryId: 10, rate: 100 },
        { entryId: 11, rate: 0 },
      ],
      infoColumns,
    );

    expect(rows).toEqual([
      {
        entryId: 10,
        keyLabel: 'Pixel 8',
        infoValues: ['Google'],
        pros: [
          'Low Price',
          'Fuel is Hybrid',
          'electric',
          'High rate',
        ],
        cons: [],
        rate: 100,
      },
      {
        entryId: 11,
        keyLabel: 'iPhone 15',
        infoValues: ['Apple'],
        pros: [],
        cons: [
          'High Price',
          'Fuel is Petrol',
          'Not electric',
          'Low rate',
        ],
        rate: 0,
      },
    ]);
  });
});
