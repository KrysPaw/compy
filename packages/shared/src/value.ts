import { z } from 'zod';
import { IdSchema } from './common/primitives.js';

export const ValueInputSchema = z.discriminatedUnion('type', [
  z.object({ criterionId: IdSchema, type: z.literal('number'), value: z.number().finite() }),
  z.object({ criterionId: IdSchema, type: z.literal('text'), value: z.string() }),
  z.object({ criterionId: IdSchema, type: z.literal('boolean'), value: z.boolean() }),
  z.object({ criterionId: IdSchema, type: z.literal('rating'), value: z.number().finite() }),
  z.object({ criterionId: IdSchema, type: z.literal('enum'), value: z.string() }),
]);
export type ValueInput = z.infer<typeof ValueInputSchema>;
