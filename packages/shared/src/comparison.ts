import { z } from "zod";
import { NameSchema, OptionalNameSchema } from "./common/primitives.js";

export const CreateComparisonSchema = z.object({
  name: NameSchema,
});
export type CreateComparisonInput = z.infer<typeof CreateComparisonSchema>;

export const UpdateComparisonSchema = z
  .object({
    name: OptionalNameSchema,
  })
  .refine((value) => value.name !== undefined, {
    message: "At least one field must be provided",
  });
export type UpdateComparisonInput = z.infer<typeof UpdateComparisonSchema>;

export const ComparisonResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ComparisonResponse = z.infer<typeof ComparisonResponseSchema>;

const ComparisonCriterionSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  type: z.enum(["text", "number", "enum", "boolean", "rating"]),
  is_key: z.boolean(),
  is_comparable: z.boolean(),
  config: z.unknown(),
});

const ComparisonEntryValueSchema = z.object({
  criterionId: z.coerce.number().int().positive(),
  value: z.unknown(),
});

const ComparisonEntrySchema = z.object({
  id: z.coerce.number().int().positive(),
  entryValues: ComparisonEntryValueSchema.array(),
});

export const ComparisonDetailsResponseSchema = ComparisonResponseSchema.extend({
  criteria: ComparisonCriterionSchema.array(),
  entries: ComparisonEntrySchema.array(),
});
export type ComparisonDetailsResponse = z.infer<
  typeof ComparisonDetailsResponseSchema
>;
