import artworks from "@/data/artworks.json";
import ArtworkDetail from "@/components/ArtworkDetail";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return artworks.map((a) => ({ id: a.id }));
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = artworks.find((a) => a.id === id);
  if (!artwork) return notFound();

  return <ArtworkDetail artwork={artwork} />;
}
