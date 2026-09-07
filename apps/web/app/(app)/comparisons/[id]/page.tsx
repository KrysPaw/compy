import { redirect } from 'next/navigation';

export default async function ComparisonPage({
  params,
}: PageProps<'/comparisons/[id]'>) {
  const { id } = await params;

  redirect(`/comparisons/${id}/entries`);
}
