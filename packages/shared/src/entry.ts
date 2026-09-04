import { z } from 'zod';
import { ValueInputSchema } from './value.js';

export const CreateEntrySchema = z.object({
  values: z.array(ValueInputSchema).max(100),
});
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

export const UpdateEntrySchema = z.object({
  values: z.array(ValueInputSchema).max(100),
}).refine((value) => value.values.length > 0, {
  message: 'At least one value must be provided',
});
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;
