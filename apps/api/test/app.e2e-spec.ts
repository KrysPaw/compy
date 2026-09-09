import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { configureApp } from '../src/app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';

describe('API (e2e)', () => {
  let app: INestApplication;
  const comparison = {
    id: 1,
    name: 'Phones',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const builtInCriterion = {
    id: 1,
    comparisonId: 1,
    name: 'name',
    type: 'text',
    config: null,
    is_comparable: false,
    is_key: true,
  };
  const comparisonFindMany = vi.fn().mockResolvedValue([comparison]);
  const comparisonFindUnique = vi.fn().mockResolvedValue({
    ...comparison,
    criteria: [builtInCriterion],
    entries: [],
  });
  const comparisonCreate = vi.fn().mockResolvedValue(comparison);
  const criterionCreate = vi.fn().mockResolvedValue(builtInCriterion);
  const prisma = {
    comparison: {
      findMany: comparisonFindMany,
      findUnique: comparisonFindUnique,
      create: comparisonCreate,
    },
    $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
      callback({
        comparison: {
          create: comparisonCreate,
          findUnique: vi.fn().mockResolvedValue({
            ...comparison,
            criteria: [builtInCriterion],
          }),
        },
        criterion: { create: criterionCreate },
      }),
    ),
  } as unknown as PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the health response', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('lists comparisons', async () => {
    const response = await request(app.getHttpServer())
      .get('/comparisons')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({ id: 1, name: 'Phones' }),
    ]);
  });

  it('creates a comparison with the built-in criterion', async () => {
    const response = await request(app.getHttpServer())
      .post('/comparisons')
      .send({ name: 'Phones' })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Phones',
        criteria: [expect.objectContaining({ is_key: true, type: 'text' })],
      }),
    );
    expect(comparisonCreate).toHaveBeenCalledWith({ data: { name: 'Phones' } });
    expect(criterionCreate).toHaveBeenCalledWith({
      data: {
        comparisonId: 1,
        name: 'name',
        type: 'text',
        is_comparable: false,
        is_key: true,
      },
    });
  });

  it('rejects an invalid comparison body', async () => {
    const response = await request(app.getHttpServer())
      .post('/comparisons')
      .send({ name: '   ' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );
    expect(comparisonCreate).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing comparison', async () => {
    comparisonFindUnique.mockResolvedValueOnce(null);

    await request(app.getHttpServer()).get('/comparisons/999').expect(404);
  });

  it('rejects an invalid comparison id', async () => {
    await request(app.getHttpServer())
      .get('/comparisons/not-an-id')
      .expect(400);
  });

  it('serves the OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body.paths['/comparisons']).toBeDefined();
  });

  it('allows the configured web origin through CORS', async () => {
    await request(app.getHttpServer())
      .get('/comparisons')
      .set('Origin', 'http://localhost:3001')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001');
  });

  afterAll(async () => {
    await app.close();
  });
});
