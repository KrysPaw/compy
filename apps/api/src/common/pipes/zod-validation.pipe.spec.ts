import { BadRequestException } from '@nestjs/common';
import { CreateComparisonSchema, IdSchema } from '@compy/shared';
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

  it('includes validation issues in the bad request response', () => {
    let error: unknown;

    try {
      pipe.transform({ name: '   ' }, { type: 'body' });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ code: 'too_small', path: ['name'] }),
        ]),
      }),
    );
  });

  it('coerces a string id into a number', () => {
    const idPipe = new ZodValidationPipe(IdSchema);

    expect(idPipe.transform('42', { type: 'param' })).toBe(42);
  });

  it('rejects a non-positive id', () => {
    const idPipe = new ZodValidationPipe(IdSchema);

    expect(() => idPipe.transform('0', { type: 'param' })).toThrow(
      BadRequestException,
    );
  });
});
