import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe<TOutput, TInput = unknown>
  implements PipeTransform<TInput, TOutput> {
  constructor(private readonly schema: z.ZodType<TOutput, TInput>) { }

  transform(value: TInput, _metadata: ArgumentMetadata): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }

    return result.data;
  }
}
