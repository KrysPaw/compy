import { z } from 'zod';
import { IdSchema } from './common/primitives.js';

const ValuePayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('number'), value: z.number() }),
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('boolean'), value: z.boolean() }),
  z.object({ type: z.literal('rating'), value: z.number() }),
  z.object({ type: z.literal('enum'), value: z.string() }),
]);

export const ValueInputSchema = ValuePayloadSchema.and(
  z.object({
    criterionId: IdSchema,
  }),
);
export type ValueInput = z.infer<typeof ValueInputSchema>;

export const EntryValueUpsertSchema = ValuePayloadSchema;
export type EntryValueUpsertInput = z.infer<typeof EntryValueUpsertSchema>;
