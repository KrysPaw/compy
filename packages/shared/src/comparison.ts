import { z } from 'zod';
import { NameSchema, OptionalNameSchema } from './common/primitives.js';

export const CreateComparisonSchema = z.object({
  name: NameSchema,
});
export type CreateComparisonInput = z.infer<typeof CreateComparisonSchema>;

export const UpdateComparisonSchema = z.object({
  name: OptionalNameSchema,
}).refine((value) => value.name !== undefined, {
  message: 'At least one field must be provided',
});
export type UpdateComparisonInput = z.infer<typeof UpdateComparisonSchema>;

export const ComparisonResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ComparisonResponse = z.infer<typeof ComparisonResponseSchema>;
