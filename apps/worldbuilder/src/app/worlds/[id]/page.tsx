import { redirect } from 'next/navigation';

export default async function WorldRoot({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  redirect(`/worlds/${id}/map`);
}
