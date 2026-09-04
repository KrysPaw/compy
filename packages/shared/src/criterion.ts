import { z } from 'zod';
import { NameSchema } from './common/primitives.js';

export const CriterionTypeSchema = z.enum([
  'number',
  'text',
  'boolean',
  'rating',
  'enum',
]);
export type CriterionType = z.infer<typeof CriterionTypeSchema>;

export const RatingConfigSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite(),
}).refine(({ min, max }) => min < max, {
  message: 'Rating min must be less than max',
});

export const EnumConfigSchema = z.object({
  options: z.array(z.string().trim().min(1).max(100)).min(1).max(100),
}).refine(({ options }) => new Set(options).size === options.length, {
  message: 'Enum options must be unique',
});

export const CriterionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('number'), config: z.undefined().optional() }),
  z.object({ type: z.literal('text'), config: z.undefined().optional() }),
  z.object({ type: z.literal('boolean'), config: z.undefined().optional() }),
  z.object({ type: z.literal('rating'), config: RatingConfigSchema }),
  z.object({ type: z.literal('enum'), config: EnumConfigSchema }),
]);
export type CriterionConfig = z.infer<typeof CriterionConfigSchema>;

export const CreateCriterionSchema = z.object({
  name: NameSchema,
  is_comparable: z.boolean(),
}).and(CriterionConfigSchema);
export type CreateCriterionInput = z.infer<typeof CreateCriterionSchema>;

export const UpdateCriterionSchema = z.object({
  name: NameSchema,
});
export type UpdateCriterionInput = z.infer<typeof UpdateCriterionSchema>;
