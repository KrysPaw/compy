'use server';

import { z } from 'zod';
import {
  CreateComparisonSchema,
  ComparisonResponseSchema,
  CreateCriterionSchema,
  CreateEntrySchema,
  UpdateComparisonSchema,
  UpdateCriterionSchema,
  UpdateEntrySchema,
  ReplaceCriterionWeightsSchema,
} from '@compy/shared';
import { getTranslations } from 'next-intl/server';
import { apiFetch } from './api-fetch';

const CriterionResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function errorMessage(
  key:
    | 'invalidName'
    | 'invalidInput'
    | 'invalidWeight'
    | 'invalidWeights'
    | 'invalidRule'
    | 'failedToCreateComparison'
    | 'failedToCreateCriterion'
    | 'failedToCreateEntry'
    | 'failedToUpdateEntry'
    | 'failedToClearEntryValue'
    | 'failedToDeleteEntry'
    | 'failedToUpdateWeight'
    | 'failedToUpdateWeights'
    | 'failedToUpdateRule'
    | 'failedToDeleteComparison'
    | 'failedToUpdateName'
    | 'failedToDeleteCriterion',
) {
  const t = await getTranslations('errors');
  return t(key);
}

export type CreateComparisonState = {
  error?: string;
  publicId?: string;
};

export type DeleteComparisonState = {
  error?: string;
};

export async function createComparison(
  formData: FormData,
): Promise<CreateComparisonState> {
  const parsed = CreateComparisonSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidName')),
    };
  }

  const res = await apiFetch('/comparisons', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToCreateComparison') };
  }

  const comparison = ComparisonResponseSchema.parse(await res.json());
  return { publicId: comparison.publicId };
}

export type CreateCriterionState = {
  error?: string;
  criterionId?: number;
};

export async function createCriterion(
  publicId: string,
  input: unknown,
): Promise<CreateCriterionState> {
  const parsed = CreateCriterionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidInput')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/criteria`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToCreateCriterion') };
  }

  const criterion = CriterionResponseSchema.parse(await res.json());
  return { criterionId: criterion.id };
}

export type CreateEntryState = {
  error?: string;
  entryId?: number;
};

const EntryResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function readApiErrorMessage(res: Response, fallback: string) {
  try {
    const body: unknown = await res.json();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
      if (Array.isArray(message) && typeof message[0] === 'string') {
        return message[0];
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function createEntry(
  publicId: string,
  input: unknown,
): Promise<CreateEntryState> {
  const parsed = CreateEntrySchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidInput')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/entries`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToCreateEntry'),
      ),
    };
  }

  const entry = EntryResponseSchema.parse(await res.json());
  return { entryId: entry.id };
}

export type UpdateEntryState = {
  error?: string;
};

export async function updateEntry(
  publicId: string,
  entryId: number,
  input: unknown,
  clearCriterionIds: number[] = [],
): Promise<UpdateEntryState> {
  const parsed = UpdateEntrySchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidInput')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateEntry'),
      ),
    };
  }

  for (const criterionId of clearCriterionIds) {
    const clearRes = await apiFetch(
      `/comparisons/${publicId}/entries/${entryId}/values/${criterionId}`,
      { method: 'DELETE' },
    );

    if (!clearRes.ok) {
      return {
        error: await readApiErrorMessage(
          clearRes,
          await errorMessage('failedToClearEntryValue'),
        ),
      };
    }
  }

  return {};
}

export type DeleteEntryState = {
  error?: string;
};

export async function deleteEntry(
  publicId: string,
  entryId: number,
): Promise<DeleteEntryState> {
  const res = await apiFetch(`/comparisons/${publicId}/entries/${entryId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToDeleteEntry'),
      ),
    };
  }

  return {};
}

export type UpdateCriterionWeightState = {
  error?: string;
};

export async function updateCriterionWeight(
  publicId: string,
  criterionId: number,
  weight: number,
): Promise<UpdateCriterionWeightState> {
  const parsed = UpdateCriterionSchema.safeParse({ weight });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? (await errorMessage('invalidWeight')),
    };
  }

  const res = await apiFetch(
    `/comparisons/${publicId}/criteria/${criterionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateWeight'),
      ),
    };
  }

  return {};
}

export type ReplaceCriterionWeightsState = {
  error?: string;
};

export async function replaceCriterionWeights(
  publicId: string,
  input: unknown,
): Promise<ReplaceCriterionWeightsState> {
  const parsed = ReplaceCriterionWeightsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        (await errorMessage('invalidWeights')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/criteria/weights`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateWeights'),
      ),
    };
  }

  return {};
}

export type UpdateCriterionRuleConfigState = {
  error?: string;
};

export async function updateCriterionRuleConfig(
  publicId: string,
  criterionId: number,
  ruleConfig: unknown,
): Promise<UpdateCriterionRuleConfigState> {
  const parsed = UpdateCriterionSchema.safeParse({ ruleConfig });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidRule')),
    };
  }

  const res = await apiFetch(
    `/comparisons/${publicId}/criteria/${criterionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateRule'),
      ),
    };
  }

  return {};
}

export async function deleteComparison(
  publicId: string,
): Promise<DeleteComparisonState> {
  const res = await apiFetch(`/comparisons/${publicId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToDeleteComparison') };
  }

  return {};
}

export type UpdateComparisonNameState = {
  error?: string;
};

export async function updateComparisonName(
  publicId: string,
  name: string,
): Promise<UpdateComparisonNameState> {
  const parsed = UpdateComparisonSchema.safeParse({ name });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidName')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateName'),
      ),
    };
  }

  return {};
}

export type UpdateCriterionNameState = {
  error?: string;
};

export async function updateCriterionName(
  publicId: string,
  criterionId: number,
  name: string,
): Promise<UpdateCriterionNameState> {
  const parsed = UpdateCriterionSchema.safeParse({ name });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidName')),
    };
  }

  const res = await apiFetch(
    `/comparisons/${publicId}/criteria/${criterionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToUpdateName'),
      ),
    };
  }

  return {};
}

export type DeleteCriterionState = {
  error?: string;
};

export async function deleteCriterion(
  publicId: string,
  criterionId: number,
): Promise<DeleteCriterionState> {
  const res = await apiFetch(
    `/comparisons/${publicId}/criteria/${criterionId}`,
    {
      method: 'DELETE',
    },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToDeleteCriterion'),
      ),
    };
  }

  return {};
}
