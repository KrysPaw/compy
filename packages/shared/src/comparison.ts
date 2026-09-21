import { z } from "zod";
import {
  NameSchema,
  OptionalNameSchema,
  PublicIdSchema,
} from "./common/primitives.js";
import { CriterionWeightSchema } from "./criterion.js";
import {
  ComparisonTemplateIdSchema,
  ResolvedTemplateCriterionSchema,
  templateCriteriaMatchCatalog,
} from "./comparison-templates.js";

export const CreateComparisonSchema = z
  .object({
    name: NameSchema,
    keyCriterionName: OptionalNameSchema,
    templateId: ComparisonTemplateIdSchema.optional(),
    templateCriteria: z.array(ResolvedTemplateCriterionSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.templateId === undefined) {
      if (value.templateCriteria !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: "templateCriteria requires templateId",
          path: ["templateCriteria"],
        });
      }
      return;
    }

    if (value.templateCriteria === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "templateCriteria is required when templateId is set",
        path: ["templateCriteria"],
      });
      return;
    }

    if (!templateCriteriaMatchCatalog(value.templateId, value.templateCriteria)) {
      ctx.addIssue({
        code: "custom",
        message: "templateCriteria does not match the selected template",
        path: ["templateCriteria"],
      });
    }
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
  publicId: PublicIdSchema,
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ComparisonResponse = z.infer<typeof ComparisonResponseSchema>;

export const ComparisonListItemSchema = ComparisonResponseSchema.extend({
  role: z.enum(["owner", "editor"]),
});
export type ComparisonListItem = z.infer<typeof ComparisonListItemSchema>;

const ComparisonCriterionSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  type: z.enum(["text", "number", "enum", "boolean", "rating"]),
  is_key: z.boolean(),
  is_comparable: z.boolean(),
  weight: CriterionWeightSchema,
  config: z.unknown(),
  ruleConfig: z.unknown().nullable(),
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
