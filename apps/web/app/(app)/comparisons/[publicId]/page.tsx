import { notFound, redirect } from 'next/navigation';
import { PublicIdSchema } from '@compy/shared';

export default async function ComparisonPage({
  params,
}: PageProps<'/comparisons/[publicId]'>) {
  const { publicId: rawPublicId } = await params;
  const parsed = PublicIdSchema.safeParse(rawPublicId);

  if (!parsed.success) {
    notFound();
  }

  redirect(`/comparisons/${parsed.data}/entries`);
}
