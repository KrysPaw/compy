import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

const SAMPLE_PUBLIC_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
import {
  createComparison,
  createCriterion,
  createEntry,
  deleteComparison,
  deleteCriterion,
  deleteEntry,
  replaceCriterionWeights,
  updateComparisonName,
  updateCriterionName,
  updateCriterionRuleConfig,
  updateCriterionWeight,
  updateEntry,
} from './actions';

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

describe('createComparison', () => {
  it('returns a validation error for an empty name', async () => {
    const formData = new FormData();
    formData.set('name', '   ');

    await expect(createComparison(formData)).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('posts a valid name and returns the created id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 12,
        publicId: SAMPLE_PUBLIC_ID,
        name: 'Phones',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const formData = new FormData();
    formData.set('name', 'Phones');

    await expect(createComparison(formData)).resolves.toEqual({
      publicId: SAMPLE_PUBLIC_ID,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Phones' }),
      }),
    );
  });

  it('returns a failure message when the API rejects the create', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const formData = new FormData();
    formData.set('name', 'Phones');

    await expect(createComparison(formData)).resolves.toEqual({
      error: 'Failed to create comparison',
    });
  });
});

describe('createCriterion', () => {
  it('returns a validation error for invalid input', async () => {
    await expect(createCriterion(SAMPLE_PUBLIC_ID, { name: '' })).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('posts valid criterion input and returns the created id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 3 }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createCriterion(SAMPLE_PUBLIC_ID, {
        name: 'Price',
        is_comparable: true,
        type: 'number',
      }),
    ).resolves.toEqual({ criterionId: 3 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/criteria$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Price',
          is_comparable: true,
          type: 'number',
        }),
      }),
    );
  });

  it('returns a failure message when the API rejects the create', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 400 })),
    );

    await expect(
      createCriterion(SAMPLE_PUBLIC_ID, {
        name: 'Price',
        is_comparable: false,
        type: 'text',
      }),
    ).resolves.toEqual({ error: 'Failed to create criterion' });
  });
});

describe('createEntry', () => {
  it('returns a validation error for empty values', async () => {
    await expect(createEntry(SAMPLE_PUBLIC_ID, { values: [] })).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('posts valid values and returns the created id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 9 }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      values: [{ criterionId: 1, type: 'text' as const, value: 'Pixel 8' }],
    };

    await expect(createEntry(SAMPLE_PUBLIC_ID, input)).resolves.toEqual({ entryId: 9 });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(
      /\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/entries$/,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
      input,
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Duplicate key value' }, { status: 409 }),
      ),
    );

    await expect(
      createEntry(SAMPLE_PUBLIC_ID, {
        values: [{ criterionId: 1, type: 'text', value: 'Pixel 8' }],
      }),
    ).resolves.toEqual({ error: 'Duplicate key value' });
  });

  it('falls back when the error body cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not-json', { status: 500 })),
    );

    await expect(
      createEntry(SAMPLE_PUBLIC_ID, {
        values: [{ criterionId: 1, type: 'text', value: 'Pixel 8' }],
      }),
    ).resolves.toEqual({ error: 'Failed to create entry' });
  });
});

describe('updateEntry', () => {
  it('returns a validation error for empty values', async () => {
    await expect(updateEntry(SAMPLE_PUBLIC_ID, 2, { values: [] })).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches values and clears removed criterion values', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: 9 }, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      values: [{ criterionId: 1, type: 'text' as const, value: 'Pixel 8a' }],
    };

    await expect(updateEntry(SAMPLE_PUBLIC_ID, 9, input, [3])).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(
      /\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/entries\/9$/,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PATCH' });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
      input,
    );
    expect(fetchMock.mock.calls[1]?.[0]).toMatch(
      /\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/entries\/9\/values\/3$/,
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'DELETE' });
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Duplicate key value' }, { status: 409 }),
      ),
    );

    await expect(
      updateEntry(SAMPLE_PUBLIC_ID, 9, {
        values: [{ criterionId: 1, type: 'text', value: 'Pixel 8' }],
      }),
    ).resolves.toEqual({ error: 'Duplicate key value' });
  });
});

describe('deleteEntry', () => {
  it('returns an empty object on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(deleteEntry(SAMPLE_PUBLIC_ID, 9)).resolves.toEqual({});
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Entry not found' }, { status: 404 }),
      ),
    );

    await expect(deleteEntry(SAMPLE_PUBLIC_ID, 9)).resolves.toEqual({
      error: 'Entry not found',
    });
  });
});

describe('updateCriterionWeight', () => {
  it('returns a validation error for a negative weight', async () => {
    await expect(updateCriterionWeight(SAMPLE_PUBLIC_ID, 2, -1)).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches a valid weight', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateCriterionWeight(SAMPLE_PUBLIC_ID, 3, 25)).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/criteria\/3$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ weight: 25 }),
      }),
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: 'Comparable criteria weights cannot exceed 100.' },
          { status: 400 },
        ),
      ),
    );

    await expect(updateCriterionWeight(SAMPLE_PUBLIC_ID, 3, 25)).resolves.toEqual({
      error: 'Comparable criteria weights cannot exceed 100.',
    });
  });
});

describe('replaceCriterionWeights', () => {
  it('returns a validation error when weights do not sum to 100', async () => {
    await expect(
      replaceCriterionWeights(SAMPLE_PUBLIC_ID, {
        weights: [
          { criterionId: 2, weight: 40 },
          { criterionId: 3, weight: 40 },
        ],
      }),
    ).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches a full comparable weight set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 2 }]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      replaceCriterionWeights(SAMPLE_PUBLIC_ID, {
        weights: [
          { criterionId: 2, weight: 100 },
          { criterionId: 3, weight: 0 },
        ],
      }),
    ).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/criteria\/weights$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          weights: [
            { criterionId: 2, weight: 100 },
            { criterionId: 3, weight: 0 },
          ],
        }),
      }),
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: 'Unknown or non-comparable criterion id.' },
          { status: 400 },
        ),
      ),
    );

    await expect(
      replaceCriterionWeights(SAMPLE_PUBLIC_ID, {
        weights: [
          { criterionId: 2, weight: 100 },
          { criterionId: 3, weight: 0 },
        ],
      }),
    ).resolves.toEqual({
      error: 'Unknown or non-comparable criterion id.',
    });
  });
});

describe('updateCriterionRuleConfig', () => {
  it('returns a validation error for an invalid rule config', async () => {
    await expect(
      updateCriterionRuleConfig(SAMPLE_PUBLIC_ID, 2, { direction: 'sideways' }),
    ).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches a valid number direction rule', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      updateCriterionRuleConfig(SAMPLE_PUBLIC_ID, 3, { direction: 'higher' }),
    ).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/criteria\/3$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ ruleConfig: { direction: 'higher' } }),
      }),
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: 'Rule config does not match criterion type.' },
          { status: 400 },
        ),
      ),
    );

    await expect(
      updateCriterionRuleConfig(SAMPLE_PUBLIC_ID, 3, { preferredValue: true }),
    ).resolves.toEqual({
      error: 'Rule config does not match criterion type.',
    });
  });
});

describe('deleteComparison', () => {
  it('returns an empty object on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(deleteComparison(SAMPLE_PUBLIC_ID)).resolves.toEqual({});
  });

  it('returns a failure message when delete fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(deleteComparison(SAMPLE_PUBLIC_ID)).resolves.toEqual({
      error: 'Failed to delete comparison',
    });
  });
});

describe('updateComparisonName', () => {
  it('returns a validation error for an empty name', async () => {
    await expect(updateComparisonName(SAMPLE_PUBLIC_ID, '   ')).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches a valid name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 7 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateComparisonName(SAMPLE_PUBLIC_ID, 'Laptops')).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Laptops' }),
      }),
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Name already exists' }, { status: 409 }),
      ),
    );

    await expect(updateComparisonName(SAMPLE_PUBLIC_ID, 'Laptops')).resolves.toEqual({
      error: 'Name already exists',
    });
  });
});

describe('updateCriterionName', () => {
  it('returns a validation error for an empty name', async () => {
    await expect(updateCriterionName(SAMPLE_PUBLIC_ID, 2, '   ')).resolves.toEqual({
      error: expect.any(String),
    });
  });

  it('patches a valid name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateCriterionName(SAMPLE_PUBLIC_ID, 3, 'Price')).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/comparisons\/01ARZ3NDEKTSV4RRFFQ69G5FAV\/criteria\/3$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Price' }),
      }),
    );
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Name already exists' }, { status: 409 }),
      ),
    );

    await expect(updateCriterionName(SAMPLE_PUBLIC_ID, 3, 'Price')).resolves.toEqual({
      error: 'Name already exists',
    });
  });
});

describe('deleteCriterion', () => {
  it('returns an empty object on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(deleteCriterion(SAMPLE_PUBLIC_ID, 3)).resolves.toEqual({});
  });

  it('surfaces API error messages when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: 'Key criterion cannot be deleted.' },
          { status: 400 },
        ),
      ),
    );

    await expect(deleteCriterion(SAMPLE_PUBLIC_ID, 1)).resolves.toEqual({
      error: 'Key criterion cannot be deleted.',
    });
  });
});
