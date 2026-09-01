import { redirect } from 'next/navigation';

export default async function RegionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/worlds/${encodeURIComponent(id)}/map`);
}
