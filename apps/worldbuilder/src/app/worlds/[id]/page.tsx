import { redirect } from "next/navigation";

export default function WorldRoot({ params }: { params: { id: string } }) {
  redirect(`/worlds/${params.id}/locations`);
}
