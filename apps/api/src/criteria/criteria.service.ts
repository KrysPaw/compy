import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BooleanRuleConfigSchema,
  EnumConfigSchema,
  EnumRuleConfigSchema,
  NumberRuleConfigSchema,
  RatingRuleConfigSchema,
  remainingWeightPool,
  WEIGHT_POOL_TOTAL,
  type CreateCriterionInput,
  type ReplaceCriterionWeightsInput,
  type UpdateCriterionInput,
} from '@compy/shared';
import { resolveComparisonId } from '../comparisons/resolve-comparison-id.js';
import { PrismaService } from '../prisma/prisma.service.js';

const RULE_TYPE_BY_CRITERION_TYPE = {
  number: 'number',
  boolean: 'boolean',
  enum: 'enum',
  rating: 'rating',
  text: null,
} as const;

const RULE_SCHEMA_BY_CRITERION_TYPE = {
  number: NumberRuleConfigSchema,
  boolean: BooleanRuleConfigSchema,
  enum: EnumRuleConfigSchema,
  rating: RatingRuleConfigSchema,
} as const;

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  private async findCriterion(comparisonId: number, criterionId: number) {
    const criterion = await this.prisma.criterion.findFirst({
      where: {
        id: criterionId,
        comparisonId,
      },
    });

    if (criterion === null) {
      throw new NotFoundException();
    }

    return criterion;
  }

  private assertRuleConfigMatchesType(
    criterionType: keyof typeof RULE_TYPE_BY_CRITERION_TYPE,
    ruleConfig: unknown,
    criterionConfig: unknown,
  ) {
    const expectedType = RULE_TYPE_BY_CRITERION_TYPE[criterionType];

    if (criterionType === 'text') {
      throw new BadRequestException('text criteria cannot have a rule config.');
    }

    const parsedRuleConfig =
      RULE_SCHEMA_BY_CRITERION_TYPE[criterionType].safeParse(ruleConfig);
    if (!parsedRuleConfig.success) {
      throw new BadRequestException(
        'Rule config does not match criterion type.',
      );
    }

    if (criterionType === 'enum') {
      const parsedEnumRuleConfig = EnumRuleConfigSchema.safeParse(ruleConfig);
      if (!parsedEnumRuleConfig.success) {
        throw new BadRequestException(
          'Rule config does not match criterion type.',
        );
      }

      const options = EnumConfigSchema.safeParse(criterionConfig);
      if (!options.success) {
        throw new BadRequestException(
          'Enum criterion is missing a valid options config.',
        );
      }

      const assignedValues = parsedEnumRuleConfig.data.tiers.flatMap(
        (tier) => tier.values,
      );
      const optionSet = new Set(options.data.options);
      const unknownValues = assignedValues.filter(
        (value) => !optionSet.has(value),
      );

      if (unknownValues.length > 0) {
        throw new BadRequestException(
          `Enum rule config includes unknown values: ${unknownValues.join(', ')}.`,
        );
      }

      const missingValues = options.data.options.filter(
        (option) => !assignedValues.includes(option),
      );

      if (missingValues.length > 0) {
        throw new BadRequestException(
          `Enum rule config is missing values: ${missingValues.join(', ')}.`,
        );
      }
    }
  }

  public async create(
    publicId: string,
    userId: number,
    data: CreateCriterionInput,
  ) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );

    const type = {
      number: 'number',
      text: 'text',
      boolean: 'boolean',
      rating: 'rating',
      enum: 'enum',
    }[data.type] as 'number' | 'text' | 'boolean' | 'rating' | 'enum';

    return this.prisma.criterion.create({
      data: {
        comparisonId,
        name: data.name,
        type,
        config: data.config,
        is_comparable: data.is_comparable,
        is_key: false,
      },
    });
  }

  public async findAll(publicId: string, userId: number) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );

    return this.prisma.criterion.findMany({
      where: { comparisonId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  public async findOne(
    publicId: string,
    userId: number,
    criterionId: number,
  ) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );
    return this.findCriterion(comparisonId, criterionId);
  }

  public async update(
    publicId: string,
    userId: number,
    criterionId: number,
    data: UpdateCriterionInput,
  ) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );
    const criterion = await this.findCriterion(comparisonId, criterionId);

    if (data.weight !== undefined) {
      if (!criterion.is_comparable) {
        throw new BadRequestException(
          'Only comparable criteria can have a weight.',
        );
      }

      const nextWeight = data.weight;
      const comparableCriteria = await this.prisma.criterion.findMany({
        where: { comparisonId, is_comparable: true },
        select: { id: true, weight: true, is_comparable: true },
      });
      const nextCriteria = comparableCriteria.map((item) =>
        item.id === criterionId ? { ...item, weight: nextWeight } : item,
      );

      if (remainingWeightPool(nextCriteria) < 0) {
        throw new BadRequestException(
          'Comparable criteria weights cannot exceed 100.',
        );
      }
    }

    if (data.ruleConfig !== undefined) {
      this.assertRuleConfigMatchesType(
        criterion.type,
        data.ruleConfig,
        criterion.config,
      );
    }

    return this.prisma.criterion.update({
      where: {
        id: criterionId,
        comparisonId,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.ruleConfig !== undefined
          ? { ruleConfig: data.ruleConfig }
          : {}),
      },
    });
  }

  public async replaceWeights(
    publicId: string,
    userId: number,
    data: ReplaceCriterionWeightsInput,
  ) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );

    const total = data.weights.reduce((sum, item) => sum + item.weight, 0);
    if (total !== WEIGHT_POOL_TOTAL) {
      throw new BadRequestException('Weights must sum to 100.');
    }

    const comparableCriteria = await this.prisma.criterion.findMany({
      where: { comparisonId, is_comparable: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });
    const comparableIds = comparableCriteria.map((criterion) => criterion.id);
    const comparableIdSet = new Set(comparableIds);
    const bodyIds = data.weights.map((item) => item.criterionId);

    const extraIds = bodyIds.filter((id) => !comparableIdSet.has(id));
    if (extraIds.length > 0) {
      throw new BadRequestException(
        'Unknown or non-comparable criterion id.',
      );
    }

    const bodyIdSet = new Set(bodyIds);
    const missingIds = comparableIds.filter((id) => !bodyIdSet.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        'Weights must cover every comparable criterion.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const item of data.weights) {
        await transaction.criterion.update({
          where: { id: item.criterionId },
          data: { weight: item.weight },
        });
      }
    });

    return this.findAll(publicId, userId);
  }

  public async remove(publicId: string, userId: number, criterionId: number) {
    const comparisonId = await resolveComparisonId(
      this.prisma,
      publicId,
      userId,
    );
    const criterion = await this.findCriterion(comparisonId, criterionId);

    if (criterion.is_key) {
      throw new BadRequestException(
        'The built-in name criterion cannot be removed.',
      );
    }

    return this.prisma.criterion.delete({
      where: { id: criterionId },
    });
  }
}
