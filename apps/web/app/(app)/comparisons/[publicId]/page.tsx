import { notFound, redirect } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';
import { loadComparisonAccess } from '@/lib/load-comparison';

export default async function ComparisonPage({
  params,
}: PageProps<'/comparisons/[publicId]'>) {
  const { publicId: rawPublicId } = await params;
  const parsed = PublicIdSchema.safeParse(rawPublicId);

  if (!parsed.success) {
    notFound();
  }

  const access = await loadComparisonAccess(parsed.data);

  if (access === null) {
    notFound();
  }

  if (access.status === 'locked') {
    return null;
  }

  redirect(`/comparisons/${parsed.data}/entries`);
}
