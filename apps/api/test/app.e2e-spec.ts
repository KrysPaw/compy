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
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';

vi.mock('ulid', () => ({
  ulid: () => '01ARZ3NDEKTSV4RRFFQ69G5FAV',
}));

describe('API (e2e)', () => {
  let app: INestApplication;
  const PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const USER_ID = 1;
  const comparison = {
    id: 1,
    publicId: PUBLIC_ID,
    name: 'Phones',
    ownerId: USER_ID,
    lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
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
  const comparisonFindFirst = vi.fn().mockResolvedValue({
    ...comparison,
    criteria: [builtInCriterion],
    entries: [],
  });
  const comparisonUpdate = vi.fn().mockResolvedValue(comparison);
  const comparisonCreate = vi.fn().mockResolvedValue(comparison);
  const criterionCreate = vi.fn().mockResolvedValue(builtInCriterion);
  const prisma = {
    comparison: {
      findMany: comparisonFindMany,
      findFirst: comparisonFindFirst,
      update: comparisonUpdate,
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

  const authService = {
    createGuestSession: vi.fn().mockResolvedValue({
      token: 'guest-token',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      principal: { id: USER_ID, kind: 'guest' },
    }),
    resolvePrincipal: vi.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authService.resolvePrincipal.mockResolvedValue(null);
    authService.createGuestSession.mockResolvedValue({
      token: 'guest-token',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      principal: { id: USER_ID, kind: 'guest' },
    });
  });

  it('returns the health response', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('bootstraps a guest session', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/guest')
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        token: 'guest-token',
        principal: { id: USER_ID, kind: 'guest' },
      }),
    );
    expect(response.headers['set-cookie'][0]).toContain('compy_session=');
  });

  it('lists comparisons for the session principal', async () => {
    const response = await request(app.getHttpServer())
      .get('/comparisons')
      .expect(200);

    expect(comparisonFindMany).toHaveBeenCalledWith({
      where: { ownerId: USER_ID },
      orderBy: { updatedAt: 'desc' },
    });
    expect(response.body).toEqual([
      expect.objectContaining({ id: 1, publicId: PUBLIC_ID, name: 'Phones' }),
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
        publicId: PUBLIC_ID,
        name: 'Phones',
        criteria: [expect.objectContaining({ is_key: true, type: 'text' })],
      }),
    );
    expect(comparisonCreate).toHaveBeenCalledWith({
      data: {
        name: 'Phones',
        publicId: PUBLIC_ID,
        ownerId: USER_ID,
        lastActiveAt: expect.any(Date),
      },
    });
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
    comparisonFindFirst.mockResolvedValueOnce(null);

    await request(app.getHttpServer())
      .get('/comparisons/01ZZZZZZZZZZZZZZZZZZZZZZZZ')
      .expect(404);
  });

  it('rejects an invalid comparison public id', async () => {
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
    expect(response.body.paths['/auth/guest']).toBeDefined();
  });

  it('allows the configured web origin through CORS with credentials', async () => {
    await request(app.getHttpServer())
      .get('/comparisons')
      .set('Origin', 'http://localhost:3001')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001')
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  afterAll(async () => {
    await app.close();
  });
});
