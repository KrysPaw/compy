import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnumConfigSchema,
  type CreateCriterionInput,
  type RuleConfig,
  type UpdateCriterionInput,
} from '@compy/shared';
import { PrismaService } from '../prisma/prisma.service.js';

const RULE_TYPE_BY_CRITERION_TYPE = {
  number: 'number',
  boolean: 'boolean',
  enum: 'enum',
  rating: 'rating',
  text: null,
} as const;

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureComparisonExists(comparisonId: number) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id: comparisonId },
      select: { id: true },
    });

    if (comparison === null) {
      throw new NotFoundException();
    }
  }

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
    ruleConfig: RuleConfig,
    criterionConfig: unknown,
  ) {
    const expectedType = RULE_TYPE_BY_CRITERION_TYPE[criterionType];

    if (expectedType === null) {
      throw new BadRequestException('text criteria cannot have a rule config.');
    }

    if (ruleConfig.type !== expectedType) {
      throw new BadRequestException(
        `Rule config type "${ruleConfig.type}" does not match criterion type "${expectedType}".`,
      );
    }

    if (ruleConfig.type === 'enum') {
      const options = EnumConfigSchema.safeParse(criterionConfig);
      if (!options.success) {
        throw new BadRequestException(
          'Enum criterion is missing a valid options config.',
        );
      }

      const assignedValues = ruleConfig.tiers.flatMap((tier) => tier.values);
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

  public async create(comparisonId: number, data: CreateCriterionInput) {
    await this.ensureComparisonExists(comparisonId);

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

  public async findAll(comparisonId: number) {
    await this.ensureComparisonExists(comparisonId);

    return this.prisma.criterion.findMany({
      where: { comparisonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async findOne(comparisonId: number, criterionId: number) {
    return this.findCriterion(comparisonId, criterionId);
  }

  public async update(
    comparisonId: number,
    criterionId: number,
    data: UpdateCriterionInput,
  ) {
    const criterion = await this.findCriterion(comparisonId, criterionId);

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

  public async remove(comparisonId: number, criterionId: number) {
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
