import { z } from "zod";
import { NameSchema } from "./common/primitives.js";
import {
  BooleanRuleConfigSchema,
  CriterionConfigSchema,
  CriterionTypeSchema,
  EnumConfigSchema,
  NumberRuleConfigSchema,
  RatingConfigSchema,
  RatingRuleConfigSchema,
  RuleConfigSchema,
  type CriterionType,
  type RuleConfig,
} from "./criterion.js";

export const ComparisonTemplateCategorySchema = z.enum([
  "electronics",
  "vehicles",
  "travel",
]);
export type ComparisonTemplateCategory = z.infer<
  typeof ComparisonTemplateCategorySchema
>;

export const ComparisonTemplateIdSchema = z.enum([
  "phones",
  "laptops",
  "tablets",
  "headphones",
  "tvs",
  "cars",
  "bikes",
  "eScooters",
  "hotels",
  "flights",
  "shortStays",
]);
export type ComparisonTemplateId = z.infer<typeof ComparisonTemplateIdSchema>;

const TEMPLATE_DISPLAY_ORDER: readonly ComparisonTemplateId[] = [
  "phones",
  "laptops",
  "tablets",
  "headphones",
  "tvs",
  "cars",
  "bikes",
  "eScooters",
  "hotels",
  "flights",
  "shortStays",
];

const TemplateNameKeySchema = z.string().trim().min(1).max(64);

type TemplateCriterionSource = {
  nameKey: string;
  type: CriterionType;
  is_comparable: boolean;
  config?: unknown;
  optionKeys?: readonly string[];
  ruleConfig?: RuleConfig;
};

export const ResolvedTemplateCriterionSchema = z.object({
  name: NameSchema,
  type: CriterionTypeSchema,
  is_comparable: z.boolean(),
  config: z.unknown().nullable(),
  ruleConfig: RuleConfigSchema.nullable(),
});
export type ResolvedTemplateCriterion = z.infer<
  typeof ResolvedTemplateCriterionSchema
>;

export type ComparisonTemplate = {
  id: ComparisonTemplateId;
  category: ComparisonTemplateCategory;
  criteria: readonly TemplateCriterionSource[];
};

const TEMPLATES: Record<ComparisonTemplateId, ComparisonTemplate> = {
  phones: {
    id: "phones",
    category: "electronics",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "storage",
        type: "number",
        is_comparable: true,
        config: { unit: "GB" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "battery",
        type: "number",
        is_comparable: true,
        config: { unit: "mAh" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "camera",
        type: "number",
        is_comparable: true,
        config: { unit: "MP" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "screenSize",
        type: "number",
        is_comparable: true,
        config: { unit: "in" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "fiveG",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  laptops: {
    id: "laptops",
    category: "electronics",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "ram",
        type: "number",
        is_comparable: true,
        config: { unit: "GB" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "storage",
        type: "number",
        is_comparable: true,
        config: { unit: "GB" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "weight",
        type: "number",
        is_comparable: true,
        config: { unit: "kg" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "batteryLife",
        type: "number",
        is_comparable: true,
        config: { unit: "h" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "screenSize",
        type: "number",
        is_comparable: true,
        config: { unit: "in" },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  tablets: {
    id: "tablets",
    category: "electronics",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "storage",
        type: "number",
        is_comparable: true,
        config: { unit: "GB" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "ram",
        type: "number",
        is_comparable: true,
        config: { unit: "GB" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "screenSize",
        type: "number",
        is_comparable: true,
        config: { unit: "in" },
      },
      {
        nameKey: "batteryLife",
        type: "number",
        is_comparable: true,
        config: { unit: "h" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  headphones: {
    id: "headphones",
    category: "electronics",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "type",
        type: "enum",
        is_comparable: true,
        optionKeys: ["overEar", "onEar", "inEar"],
      },
      {
        nameKey: "wireless",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "anc",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "batteryLife",
        type: "number",
        is_comparable: true,
        config: { unit: "h" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  tvs: {
    id: "tvs",
    category: "electronics",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "screenSize",
        type: "number",
        is_comparable: true,
        config: { unit: "in" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "resolution",
        type: "enum",
        is_comparable: true,
        optionKeys: ["hd", "fhd", "uhd", "8k"],
      },
      {
        nameKey: "refreshRate",
        type: "number",
        is_comparable: true,
        config: { unit: "Hz" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "smartTv",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  cars: {
    id: "cars",
    category: "vehicles",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "mileage",
        type: "number",
        is_comparable: true,
        config: { unit: "km" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "year",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "fuelType",
        type: "enum",
        is_comparable: true,
        optionKeys: ["petrol", "diesel", "hybrid", "electric"],
      },
      {
        nameKey: "power",
        type: "number",
        is_comparable: true,
        config: { unit: "HP" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  bikes: {
    id: "bikes",
    category: "vehicles",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "type",
        type: "enum",
        is_comparable: true,
        optionKeys: ["road", "mountain", "hybrid", "electric"],
      },
      {
        nameKey: "weight",
        type: "number",
        is_comparable: true,
        config: { unit: "kg" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "gearCount",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "frameSize",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  eScooters: {
    id: "eScooters",
    category: "vehicles",
    criteria: [
      {
        nameKey: "brand",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "range",
        type: "number",
        is_comparable: true,
        config: { unit: "km" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "topSpeed",
        type: "number",
        is_comparable: true,
        config: { unit: "km/h" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "weight",
        type: "number",
        is_comparable: true,
        config: { unit: "kg" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "maxLoad",
        type: "number",
        is_comparable: true,
        config: { unit: "kg" },
        ruleConfig: { direction: "higher" },
      },
      {
        nameKey: "foldable",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  hotels: {
    id: "hotels",
    category: "travel",
    criteria: [
      {
        nameKey: "neighborhood",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "pricePerNight",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "distanceToCenter",
        type: "number",
        is_comparable: true,
        config: { unit: "km" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "guestRating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
      {
        nameKey: "breakfastIncluded",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "freeCancellation",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "stars",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  flights: {
    id: "flights",
    category: "travel",
    criteria: [
      {
        nameKey: "airline",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "price",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "duration",
        type: "number",
        is_comparable: true,
        config: { unit: "h" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "stops",
        type: "enum",
        is_comparable: true,
        optionKeys: ["nonstop", "1stop", "2plus"],
      },
      {
        nameKey: "departureTime",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "baggageIncluded",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "rating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
    ],
  },
  shortStays: {
    id: "shortStays",
    category: "travel",
    criteria: [
      {
        nameKey: "neighborhood",
        type: "text",
        is_comparable: false,
      },
      {
        nameKey: "pricePerNight",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "distanceToCenter",
        type: "number",
        is_comparable: true,
        config: { unit: "km" },
        ruleConfig: { direction: "lower" },
      },
      {
        nameKey: "guestRating",
        type: "rating",
        is_comparable: true,
        config: { min: 1, max: 5 },
        ruleConfig: { direction: "higher", min: 1, max: 5 },
      },
      {
        nameKey: "entirePlace",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "freeCancellation",
        type: "boolean",
        is_comparable: true,
        ruleConfig: { preferredValue: true },
      },
      {
        nameKey: "cleaningFee",
        type: "number",
        is_comparable: true,
        config: {},
        ruleConfig: { direction: "lower" },
      },
    ],
  },
};

function assertTemplateCriterion(source: TemplateCriterionSource): void {
  TemplateNameKeySchema.parse(source.nameKey);

  const configInput =
    source.type === "enum"
      ? {
          type: "enum" as const,
          config: EnumConfigSchema.parse({
            options: [...(source.optionKeys ?? [])],
          }),
        }
      : source.type === "rating"
        ? {
            type: "rating" as const,
            config: RatingConfigSchema.parse(source.config),
          }
        : source.type === "number"
          ? {
              type: "number" as const,
              config: source.config,
            }
          : { type: source.type, config: source.config };

  CriterionConfigSchema.parse(configInput);

  if (source.type === "enum" && source.optionKeys === undefined) {
    throw new Error(
      `Enum criterion "${source.nameKey}" requires optionKeys`,
    );
  }

  if (source.ruleConfig === undefined) {
    return;
  }

  if (source.type === "text") {
    throw new Error(
      `Text criterion "${source.nameKey}" cannot have ruleConfig`,
    );
  }

  if (source.type === "number") {
    NumberRuleConfigSchema.parse(source.ruleConfig);
  } else if (source.type === "boolean") {
    BooleanRuleConfigSchema.parse(source.ruleConfig);
  } else if (source.type === "rating") {
    RatingRuleConfigSchema.parse(source.ruleConfig);
  } else if (source.type === "enum") {
    throw new Error(
      `Enum criterion "${source.nameKey}" must not seed ruleConfig in v1 templates`,
    );
  }
}

for (const template of Object.values(TEMPLATES)) {
  for (const criterion of template.criteria) {
    assertTemplateCriterion(criterion);
  }
}

export function listComparisonTemplates(): ReadonlyArray<{
  id: ComparisonTemplateId;
  category: ComparisonTemplateCategory;
}> {
  return TEMPLATE_DISPLAY_ORDER.map((id) => ({
    id,
    category: TEMPLATES[id].category,
  }));
}

export function getComparisonTemplate(
  id: ComparisonTemplateId,
): ComparisonTemplate {
  return TEMPLATES[id];
}

/** Resolve catalog defs with localized names/options from the message catalogs. */
export function resolveTemplateCriteria(
  id: ComparisonTemplateId,
  translate: (key: string) => string,
): ResolvedTemplateCriterion[] {
  const template = getComparisonTemplate(id);

  return template.criteria.map((criterion) => {
    const config =
      criterion.type === "enum"
        ? {
            options: (criterion.optionKeys ?? []).map((optionKey) =>
              translate(`criteria.${criterion.nameKey}Options.${optionKey}`),
            ),
          }
        : (criterion.config ?? null);

    return {
      name: translate(`criteria.${criterion.nameKey}`),
      type: criterion.type,
      is_comparable: criterion.is_comparable,
      config,
      ruleConfig: criterion.ruleConfig ?? null,
    };
  });
}

export function templateCriteriaMatchCatalog(
  id: ComparisonTemplateId,
  criteria: ResolvedTemplateCriterion[],
): boolean {
  const expected = getComparisonTemplate(id).criteria;
  if (criteria.length !== expected.length) {
    return false;
  }

  return expected.every((source, index) => {
    const got = criteria[index];
    if (got === undefined) {
      return false;
    }
    if (got.type !== source.type || got.is_comparable !== source.is_comparable) {
      return false;
    }
    if (JSON.stringify(got.ruleConfig) !== JSON.stringify(source.ruleConfig ?? null)) {
      return false;
    }
    if (source.type === "enum") {
      const options = EnumConfigSchema.safeParse(got.config);
      return (
        options.success &&
        options.data.options.length === (source.optionKeys?.length ?? 0)
      );
    }
    return JSON.stringify(got.config ?? null) === JSON.stringify(source.config ?? null);
  });
}
