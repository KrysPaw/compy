/**
 * Seeds mock data for manual testing.
 *
 * Compy has no Car model — a "car" is an Entry in a Comparison, with attributes
 * stored as EntryValue rows against Criterion definitions.
 *
 * Run from apps/api:
 *   npm run db:seed
 *   npx prisma db seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const COMPARISON_NAME = 'Cars';

type CarSeed = {
  name: string;
  brand: string;
  year: number;
  price: number;
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  electric: boolean;
  rating: number;
  horsepower: number;
};

const CARS: CarSeed[] = [
  {
    name: 'Toyota Corolla',
    brand: 'Toyota',
    year: 2022,
    price: 25_000,
    fuel: 'Hybrid',
    electric: false,
    rating: 4,
    horsepower: 120,
  },
  {
    name: 'Tesla Model 3',
    brand: 'Tesla',
    year: 2023,
    price: 42_000,
    fuel: 'Electric',
    electric: true,
    rating: 5,
    horsepower: 283,
  },
  {
    name: 'Volkswagen Golf',
    brand: 'Volkswagen',
    year: 2021,
    price: 28_000,
    fuel: 'Petrol',
    electric: false,
    rating: 4,
    horsepower: 150,
  },
  {
    name: 'BMW 320d',
    brand: 'BMW',
    year: 2020,
    price: 35_000,
    fuel: 'Diesel',
    electric: false,
    rating: 4,
    horsepower: 190,
  },
  {
    name: 'Toyota Yaris',
    brand: 'Toyota',
    year: 2024,
    price: 22_000,
    fuel: 'Hybrid',
    electric: false,
    rating: 3,
    horsepower: 116,
  },
];

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the database');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function seed() {
  const prisma = createPrismaClient();

  try {
    const removed = await prisma.comparison.deleteMany({
      where: { name: COMPARISON_NAME },
    });

    if (removed.count > 0) {
      console.log(
        `Removed ${removed.count} existing "${COMPARISON_NAME}" comparison(s).`,
      );
    }

    const comparison = await prisma.comparison.create({
      data: { name: COMPARISON_NAME },
    });

    const nameCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'name',
        type: 'text',
        is_comparable: false,
        is_key: true,
      },
    });

    const brandCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'brand',
        type: 'text',
        is_comparable: false,
        is_key: false,
      },
    });

    const yearCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'year',
        type: 'number',
        weight: 1,
        is_comparable: true,
        is_key: false,
      },
    });

    const priceCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'price',
        type: 'number',
        weight: 3,
        is_comparable: true,
        is_key: false,
      },
    });

    const fuelCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'fuel',
        type: 'enum',
        config: { options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
        is_comparable: true,
        is_key: false,
      },
    });

    const electricCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'electric',
        type: 'boolean',
        is_comparable: true,
        is_key: false,
      },
    });

    const ratingCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'rating',
        type: 'rating',
        weight: 2,
        config: { min: 1, max: 5 },
        is_comparable: true,
        is_key: false,
      },
    });

    const horsepowerCriterion = await prisma.criterion.create({
      data: {
        comparisonId: comparison.id,
        name: 'horsepower',
        type: 'number',
        weight: 1,
        is_comparable: true,
        is_key: false,
      },
    });

    for (const car of CARS) {
      const entry = await prisma.entry.create({
        data: { comparisonId: comparison.id },
      });

      await prisma.entryValue.createMany({
        data: [
          { entryId: entry.id, criterionId: nameCriterion.id, value: car.name },
          {
            entryId: entry.id,
            criterionId: brandCriterion.id,
            value: car.brand,
          },
          { entryId: entry.id, criterionId: yearCriterion.id, value: car.year },
          {
            entryId: entry.id,
            criterionId: priceCriterion.id,
            value: car.price,
          },
          { entryId: entry.id, criterionId: fuelCriterion.id, value: car.fuel },
          {
            entryId: entry.id,
            criterionId: electricCriterion.id,
            value: car.electric,
          },
          {
            entryId: entry.id,
            criterionId: ratingCriterion.id,
            value: car.rating,
          },
          {
            entryId: entry.id,
            criterionId: horsepowerCriterion.id,
            value: car.horsepower,
          },
        ],
      });
    }

    console.log(
      `Seeded comparison "${COMPARISON_NAME}" (id=${comparison.id}) with ${CARS.length} cars.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
