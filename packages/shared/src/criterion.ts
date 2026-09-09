import { z } from 'zod';
import { NameSchema } from './common/primitives.js';

export const WEIGHT_POOL_TOTAL = 100;

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

export const RuleDirectionSchema = z.enum(['higher', 'lower']);
export type RuleDirection = z.infer<typeof RuleDirectionSchema>;

export const CriterionWeightSchema = z
  .number()
  .int()
  .min(0)
  .max(WEIGHT_POOL_TOTAL);

export const NumberRuleConfigSchema = z.object({
  type: z.literal('number'),
  direction: RuleDirectionSchema,
});

export const BooleanRuleConfigSchema = z.object({
  type: z.literal('boolean'),
  preferredValue: z.boolean(),
});

export const EnumTierRankSchema = z.number().int().min(1).max(5);

export const EnumTierSchema = z.object({
  rank: EnumTierRankSchema,
  label: z.string().trim().min(1).max(100),
  values: z.array(z.string().trim().min(1).max(100)),
});

export const EnumRuleConfigSchema = z.object({
  type: z.literal('enum'),
  tiers: z.array(EnumTierSchema).min(1).max(5),
}).superRefine((value, ctx) => {
  const ranks = value.tiers.map((tier) => tier.rank);
  if (new Set(ranks).size !== ranks.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enum tier ranks must be unique',
      path: ['tiers'],
    });
  }

  const assignedValues = value.tiers.flatMap((tier) => tier.values);
  if (new Set(assignedValues).size !== assignedValues.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enum values must be assigned to at most one tier',
      path: ['tiers'],
    });
  }
});

export const RatingRuleConfigSchema = z.object({
  type: z.literal('rating'),
  direction: RuleDirectionSchema,
  min: z.number().int().default(1),
  max: z.number().int().default(5),
}).refine(({ min, max }) => min < max, {
  message: 'Rating rule min must be less than max',
});

export const RuleConfigSchema = z.discriminatedUnion('type', [
  NumberRuleConfigSchema,
  BooleanRuleConfigSchema,
  EnumRuleConfigSchema,
  RatingRuleConfigSchema,
]);
export type RuleConfig = z.infer<typeof RuleConfigSchema>;

export const CreateCriterionSchema = z.object({
  name: NameSchema,
  is_comparable: z.boolean(),
}).and(CriterionConfigSchema);
export type CreateCriterionInput = z.infer<typeof CreateCriterionSchema>;

export const UpdateCriterionSchema = z
  .object({
    name: NameSchema.optional(),
    weight: CriterionWeightSchema.optional(),
    ruleConfig: RuleConfigSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined
      || value.weight !== undefined
      || value.ruleConfig !== undefined,
    { message: 'At least one field must be provided' },
  );
export type UpdateCriterionInput = z.infer<typeof UpdateCriterionSchema>;
