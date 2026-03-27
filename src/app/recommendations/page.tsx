"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import artworks from "@/data/artworks.json";

const artworkMap = Object.fromEntries(artworks.map((a) => [a.id, a]));

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    onboardingAnswers,
    onboardingComplete,
    recommendations,
    recommendationsLoading,
    setRecommendations,
    setRecommendationsLoading,
  } = useStore();

  useEffect(() => {
    if (!onboardingComplete) {
      router.push("/onboarding");
      return;
    }
    if (recommendations.length > 0) return;

    async function fetchRecs() {
      setRecommendationsLoading(true);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: onboardingAnswers }),
        });
        const data = await res.json();
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setRecommendationsLoading(false);
      }
    }

    fetchRecs();
  }, [onboardingComplete, recommendations.length, onboardingAnswers, router, setRecommendations, setRecommendationsLoading]);

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

        {recommendationsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            {/* Animated dots */}
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-[var(--moma-black)]"
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <motion.p
              className="text-sm text-gray-500 text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Finding your perfect artworks...
            </motion.p>
            <p className="text-xs text-gray-400 mt-2">
              Curating from 50+ works across 3 floors
            </p>
          </motion.div>
        )}

        {!recommendationsLoading && recommendations.length > 0 && (
          <div className="space-y-8">
            {recommendations.map((rec, i) => {
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
                      <Image
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
                    <p className="text-sm font-medium text-[var(--moma-red)] mb-2">
                      {rec.hook}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {rec.blurb}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Floor {artwork.floor} · Gallery {artwork.gallery}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

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
