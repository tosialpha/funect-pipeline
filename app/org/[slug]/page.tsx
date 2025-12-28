import { redirect } from "next/navigation";

interface OrgPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params;
  redirect(`/org/${slug}/dashboard`);
}
