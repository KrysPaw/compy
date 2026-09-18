import { afterEach, describe, expect, it, vi } from 'vitest';
import { getComparisonByPublicId, getComparisons } from './api';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

const SAMPLE_PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('getComparisons', () => {
  it('returns parsed comparisons', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: 1,
            publicId: SAMPLE_PUBLIC_ID,
            name: 'Phones',
            role: 'owner',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ]),
      ),
    );

    await expect(getComparisons()).resolves.toEqual([
      {
        id: 1,
        publicId: SAMPLE_PUBLIC_ID,
        name: 'Phones',
        role: 'owner',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
  });

  it('returns an empty list when fetchJson yields null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(getComparisons()).resolves.toEqual([]);
  });

  it('throws on unexpected HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('server error', { status: 500 })),
    );

    await expect(getComparisons()).rejects.toMatchObject({
      message: 'Request to /comparisons failed: 500',
    });
  });
});

describe('getComparisonByPublicId', () => {
  it('returns null for missing comparisons', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(getComparisonByPublicId(SAMPLE_PUBLIC_ID)).resolves.toBeNull();
  });

  it('returns parsed comparison details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: 2,
          publicId: SAMPLE_PUBLIC_ID,
          name: 'Laptops',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          criteria: [
            {
              id: 1,
              name: 'Name',
              type: 'text',
              is_key: true,
              is_comparable: false,
              weight: 0,
              config: null,
              ruleConfig: null,
            },
          ],
          entries: [],
        }),
      ),
    );

    await expect(getComparisonByPublicId(SAMPLE_PUBLIC_ID)).resolves.toMatchObject({
      id: 2,
      publicId: SAMPLE_PUBLIC_ID,
      name: 'Laptops',
      criteria: [{ id: 1, name: 'Name', type: 'text', is_key: true }],
      entries: [],
    });
  });
});
