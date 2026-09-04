import { BadRequestException } from '@nestjs/common';
import { CreateComparisonSchema } from '@compy/shared';
import { describe, expect, it } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(CreateComparisonSchema);

  it('returns the parsed value', () => {
    const result = pipe.transform(
      { name: '  Telefony  ' },
      { type: 'body' },
    );

    expect(result).toEqual({ name: 'Telefony' });
  });

  it('throws a bad request for invalid input', () => {
    expect(() => pipe.transform({ name: '   ' }, { type: 'body' })).toThrow(
      BadRequestException,
    );
  });
});
