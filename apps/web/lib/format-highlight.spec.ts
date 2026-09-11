import { describe, expect, it } from 'vitest';
import { formatHighlightLabel } from './format-highlight';

const en = {
  yes: 'Yes',
  no: 'No',
  high: 'High',
  low: 'Low',
};

const pl = {
  yes: 'Tak',
  no: 'Nie',
  high: 'Wysoki',
  low: 'Niski',
};

describe('formatHighlightLabel', () => {
  it('formats boolean without negating the criterion name', () => {
    expect(
      formatHighlightLabel(
        { type: 'boolean', name: 'is red', value: false },
        en,
      ),
    ).toBe('is red · No');
    expect(
      formatHighlightLabel(
        { type: 'boolean', name: 'has backup', value: true },
        pl,
      ),
    ).toBe('has backup · Tak');
  });

  it('formats enum and direction with translated level tokens', () => {
    expect(
      formatHighlightLabel({ type: 'enum', name: 'fuel', value: 'Hybrid' }, en),
    ).toBe('fuel · Hybrid');
    expect(
      formatHighlightLabel(
        { type: 'direction', name: 'Price', level: 'low' },
        en,
      ),
    ).toBe('Price · Low');
    expect(
      formatHighlightLabel(
        { type: 'direction', name: 'rate', level: 'high' },
        pl,
      ),
    ).toBe('rate · Wysoki');
  });
});
