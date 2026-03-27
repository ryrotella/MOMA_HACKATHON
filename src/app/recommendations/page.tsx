"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ArtworkImage from "@/components/ArtworkImage";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import artworks from "@/data/artworks.json";

const artworkMap = Object.fromEntries(artworks.map((a) => [a.id, a]));

// Hardcoded curated recommendations with hand-written hooks and blurbs
const CURATED_RECOMMENDATIONS = [
  {
    artworkId: "starry-night",
    hook: "The painting that changed how we see the sky",
    blurb: "Van Gogh painted this from the window of his asylum room in Saint-Remy, transforming an ordinary night into a swirling cosmos of emotion and light.",
  },
  {
    artworkId: "persistence-of-memory",
    hook: "Time literally melts before your eyes",
    blurb: "Dali's tiny masterpiece is smaller than you'd expect — just 9.5 by 13 inches — but its melting clocks have become the defining image of Surrealism.",
  },
  {
    artworkId: "campbell-soup",
    hook: "32 cans that redefined what art could be",
    blurb: "Warhol took the most ordinary object in an American pantry and forced the art world to reconsider the boundary between commercial design and fine art.",
  },
];

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    onboardingComplete,
    recommendations,
    setRecommendations,
  } = useStore();

  useEffect(() => {
    if (!onboardingComplete) {
      router.push("/onboarding");
      return;
    }
    // If no recommendations set yet, use curated defaults
    if (recommendations.length === 0) {
      setRecommendations(CURATED_RECOMMENDATIONS);
    }
  }, [onboardingComplete, recommendations.length, router, setRecommendations]);

  const displayRecs = recommendations.length > 0 ? recommendations : CURATED_RECOMMENDATIONS;

  return (
    <div className="min-h-screen bg-white px-6 pt-14 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto"
      >
        <h1 className="text-2xl font-black mb-1">Great!</h1>
        <p className="text-2xl font-black mb-8">
          Here&apos;s what we think you would like
        </p>

        <div className="space-y-8">
          {displayRecs.map((rec, i) => {
            const artwork = artworkMap[rec.artworkId];
            if (!artwork) return null;
            return (
              <motion.div
                key={rec.artworkId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <Link href={`/artwork/${artwork.id}`} className="block group">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
                    <ArtworkImage
                      src={artwork.thumbnail}
                      alt={artwork.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-lg">{artwork.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {artwork.artist}, {artwork.year}
                  </p>
                  {rec.hook && (
                    <p className="text-sm font-medium text-[var(--moma-red)] mb-2">
                      {rec.hook}
                    </p>
                  )}
                  {rec.blurb && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {rec.blurb}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Floor {artwork.floor} · Gallery {artwork.gallery}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 space-y-3">
          <Link
            href="/explore"
            className="block w-full bg-[var(--moma-black)] text-white py-4 rounded-xl font-semibold text-center active:scale-[0.98] transition-transform"
          >
            Explore more
          </Link>
          <Link
            href="/map"
            className="block w-full border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-center active:scale-[0.98] transition-transform"
          >
            View map
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
