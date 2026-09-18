import { cache } from 'react';
import { notFound } from 'next/navigation';
import type {
  ComparisonAccessStatus,
  ComparisonDetailsResponse,
} from '@compy/shared';
import {
  getComparisonAccess,
  getComparisonByPublicId,
  getPendingAccessRequests,
} from '@/lib/api';
import type { AccessRequestResponse } from '@compy/shared';

export const loadComparisonAccess = cache(async (publicId: string) => {
  return getComparisonAccess(publicId);
});

export type OpenComparison = {
  comparison: ComparisonDetailsResponse;
  access: Extract<ComparisonAccessStatus, { status: 'accessible' }>;
  pendingRequests: AccessRequestResponse[];
};

/**
 * For comparison page bodies. Returns null when locked so the layout can show
 * the apply UI without child routes triggering notFound().
 */
export async function loadOpenComparison(
  publicId: string,
): Promise<OpenComparison | null> {
  const access = await loadComparisonAccess(publicId);

  if (access === null) {
    notFound();
  }

  if (access.status === 'locked') {
    return null;
  }

  const comparison = await getComparisonByPublicId(publicId);

  if (comparison === null) {
    notFound();
  }

  const pendingRequests =
    access.role === 'owner' ? await getPendingAccessRequests(publicId) : [];

  return { comparison, access, pendingRequests };
}
