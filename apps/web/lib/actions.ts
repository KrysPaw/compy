'use server';

import { z } from 'zod';
import {
  CreateAccessRequestSchema,
  CreateComparisonSchema,
  ComparisonResponseSchema,
  ComparisonTemplateIdSchema,
  CreateCriterionSchema,
  CreateEntrySchema,
  InviteByEmailSchema,
  RequestMagicLinkSchema,
  resolveTemplateCriteria,
  SessionResponseSchema,
  UpdateComparisonSchema,
  UpdateCriterionSchema,
  UpdateEntrySchema,
  ReplaceCriterionWeightsSchema,
  VerifyMagicLinkSchema,
} from '@compy/shared';
import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from './api-fetch';
import { defaultKeyCriterionName } from './default-key-criterion-name';
import { SESSION_COOKIE_NAME } from './session';

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
    | 'failedToDeleteCriterion'
    | 'failedToSendMagicLink'
    | 'failedToVerifyMagicLink'
    | 'invalidEmail'
    | 'failedToInvite'
    | 'failedToApplyForAccess'
    | 'failedToReviewAccessRequest'
    | 'failedToDeleteAccount'
    | 'failedToLogout',
) {
  const t = await getTranslations('errors');
  return t(key);
}

async function setSessionCookie(token: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
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
  const locale = await getLocale();
  const templateRaw = formData.get('templateId');
  const templateId =
    typeof templateRaw === 'string' &&
    templateRaw !== '' &&
    templateRaw !== 'blank'
      ? templateRaw
      : undefined;

  let templateCriteria;
  if (templateId !== undefined) {
    const parsedTemplateId = ComparisonTemplateIdSchema.safeParse(templateId);
    if (!parsedTemplateId.success) {
      return {
        error: parsedTemplateId.error.issues[0]?.message ?? (await errorMessage('invalidInput')),
      };
    }

    const t = await getTranslations(`comparisonTemplates.${parsedTemplateId.data}`);
    templateCriteria = resolveTemplateCriteria(parsedTemplateId.data, (key) =>
      t(key as Parameters<typeof t>[0]),
    );
  }

  const parsed = CreateComparisonSchema.safeParse({
    name: formData.get('name'),
    keyCriterionName: defaultKeyCriterionName(locale),
    ...(templateId !== undefined
      ? { templateId, templateCriteria }
      : {}),
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

export type RequestMagicLinkState = {
  error?: string;
  sent?: boolean;
  devMagicLinkUrl?: string;
};

export async function requestMagicLink(
  formData: FormData,
): Promise<RequestMagicLinkState> {
  const parsed = RequestMagicLinkSchema.safeParse({
    email: formData.get('email'),
    locale: await getLocale(),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidEmail')),
    };
  }

  const res = await apiFetch('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToSendMagicLink') };
  }

  const body = (await res.json()) as {
    ok?: boolean;
    devMagicLinkUrl?: string;
  };

  return {
    sent: true,
    ...(body.devMagicLinkUrl !== undefined
      ? { devMagicLinkUrl: body.devMagicLinkUrl }
      : {}),
  };
}

export type VerifyMagicLinkState = {
  error?: string;
  ok?: boolean;
};

export async function verifyMagicLink(
  token: string,
): Promise<VerifyMagicLinkState> {
  const parsed = VerifyMagicLinkSchema.safeParse({ token });

  if (!parsed.success) {
    return { error: await errorMessage('failedToVerifyMagicLink') };
  }

  const res = await apiFetch('/auth/magic-link/verify', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToVerifyMagicLink') };
  }

  const session = SessionResponseSchema.parse(await res.json());
  await setSessionCookie(session.token, session.expiresAt);
  return { ok: true };
}

export type InviteByEmailState = {
  error?: string;
  ok?: boolean;
};

export async function inviteByEmail(
  publicId: string,
  email: string,
): Promise<InviteByEmailState> {
  const parsed = InviteByEmailSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidEmail')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/invites`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(res, await errorMessage('failedToInvite')),
    };
  }

  return { ok: true };
}

export type ApplyForAccessState = {
  error?: string;
  ok?: boolean;
};

export async function applyForAccess(
  publicId: string,
  formData: FormData,
): Promise<ApplyForAccessState> {
  const parsed = CreateAccessRequestSchema.safeParse({
    displayName: formData.get('displayName'),
    message: formData.get('message') || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? (await errorMessage('invalidInput')),
    };
  }

  const res = await apiFetch(`/comparisons/${publicId}/access-requests`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToApplyForAccess'),
      ),
    };
  }

  return { ok: true };
}

export type ReviewAccessRequestState = {
  error?: string;
  ok?: boolean;
};

export async function acceptAccessRequest(
  publicId: string,
  requestId: number,
): Promise<ReviewAccessRequestState> {
  const res = await apiFetch(
    `/comparisons/${publicId}/access-requests/${requestId}/accept`,
    { method: 'POST' },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToReviewAccessRequest'),
      ),
    };
  }

  return { ok: true };
}

export async function rejectAccessRequest(
  publicId: string,
  requestId: number,
): Promise<ReviewAccessRequestState> {
  const res = await apiFetch(
    `/comparisons/${publicId}/access-requests/${requestId}/reject`,
    { method: 'POST' },
  );

  if (!res.ok) {
    return {
      error: await readApiErrorMessage(
        res,
        await errorMessage('failedToReviewAccessRequest'),
      ),
    };
  }

  return { ok: true };
}

export type DeleteAccountState = {
  error?: string;
};

export async function deleteAccount(): Promise<DeleteAccountState> {
  const res = await apiFetch('/auth/me', {
    method: 'DELETE',
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToDeleteAccount') };
  }

  const session = SessionResponseSchema.parse(await res.json());
  await setSessionCookie(session.token, session.expiresAt);
  revalidatePath('/');
  redirect('/');
}

export type LogoutState = {
  error?: string;
};

export async function logout(): Promise<LogoutState> {
  const res = await apiFetch('/auth/logout', {
    method: 'POST',
  });

  if (!res.ok) {
    return { error: await errorMessage('failedToLogout') };
  }

  const session = SessionResponseSchema.parse(await res.json());
  await setSessionCookie(session.token, session.expiresAt);
  revalidatePath('/');
  redirect('/');
}
