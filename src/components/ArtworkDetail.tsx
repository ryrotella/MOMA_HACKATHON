"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { PassportStamp, STAMP_THEMES } from "@/components/StampVisuals";
import artworks from "@/data/artworks.json";
import Link from "next/link";

type Artwork = (typeof artworks)[number];

export default function ArtworkDetail({ artwork }: { artwork: Artwork }) {
  const router = useRouter();
  const { bookmarks, toggleBookmark, currentSession, startSession, recordArtworkView, updateDwellTime, checkAndAwardStamps, stamps, setSuppressStampToast } = useStore();
  const isBookmarked = bookmarks.includes(artwork.id);
  const dwellRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);

  // Suppress global toast while on artwork detail page
  useEffect(() => {
    setSuppressStampToast(true);
    return () => setSuppressStampToast(false);
  }, [setSuppressStampToast]);
  const [achievementStamp, setAchievementStamp] = useState<(typeof stamps)[number] | null>(null);
  const prevStampsRef = useRef<Set<string>>(new Set());

  // Track view and dwell time
  useEffect(() => {
    // Snapshot current stamps before recording view
    const earned = stamps.filter((s) => s.earnedAt);
    prevStampsRef.current = new Set(earned.map((s) => s.id));

    if (!currentSession) startSession();
    recordArtworkView(artwork.id, artwork.gallery, artwork.floor);
    checkAndAwardStamps(artwork.id, artwork.tags, artwork.floor, artwork.popularity);

    dwellRef.current = setInterval(() => {
      updateDwellTime(artwork.id, 5);
    }, 5000);

    return () => {
      if (dwellRef.current) clearInterval(dwellRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.id]);

  // Detect new stamps earned → show achievement modal
  useEffect(() => {
    const earned = stamps.filter((s) => s.earnedAt);
    const newStamp = earned.find((s) => !prevStampsRef.current.has(s.id));
    if (newStamp) {
      setAchievementStamp(newStamp);
      setShowAchievement(true);
    }
  }, [stamps]);

  // Find related artworks
  const related = artworks
    .filter(
      (a) =>
        a.id !== artwork.id &&
        (a.gallery === artwork.gallery ||
          a.tags.some((t) => artwork.tags.includes(t)))
    )
    .slice(0, 4);

  const achievementTheme = achievementStamp?.stampThemeId
    ? STAMP_THEMES.find((t) => t.id === achievementStamp.stampThemeId)
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header — gallery number + back + Add button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.back()}
              className="text-[var(--moma-black)] p-1"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[18px] font-bold tracking-[-0.27px]">{artwork.gallery}</span>
          </div>

          {/* Add / Added pill — Figma: border-2 #666, rounded-full, bg white/64%, 18px medium */}
          <button
            onClick={() => toggleBookmark(artwork.id)}
            className={`flex items-center gap-2 px-4 py-0.5 rounded-full text-[18px] font-medium tracking-[-0.27px] transition-all active:scale-95 ${
              isBookmarked
                ? "bg-[var(--moma-black)] text-white border-2 border-[var(--moma-black)]"
                : "bg-white/65 text-[#666] border-2 border-[#666]"
            }`}
          >
            {isBookmarked ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Title & Artist — Figma: title 24px bold, artist 18px bold */}
        <div className="mb-4">
          <h1 className="text-[24px] font-bold leading-[1.5] tracking-[-0.36px]">{artwork.title}</h1>
          <p className="text-[18px] font-bold leading-[1.5] tracking-[-0.27px] text-black">{artwork.artist}</p>
        </div>

        {/* Artwork image */}
        <div className="bg-gray-100 rounded-xl overflow-hidden mb-6">
          {artwork.thumbnail && artwork.thumbnail.includes("moma.org") ? (
            <img
              src={artwork.thumbnail}
              alt={artwork.title}
              className="w-full h-auto object-contain max-h-[400px]"
              loading="eager"
            />
          ) : (
            <div className="aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-sm text-gray-400">{artwork.classification}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description — Figma: 16px regular */}
        <p className="text-[16px] font-normal leading-[1.5] tracking-[-0.24px] text-black mb-6">
          {artwork.description}
        </p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium">MEDIUM</p>
            <p className="text-sm text-gray-700 mt-0.5">{artwork.medium}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium">DIMENSIONS</p>
            <p className="text-sm text-gray-700 mt-0.5">{artwork.dimensions}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium">GALLERY</p>
            <p className="text-sm text-gray-700 mt-0.5">Gallery {artwork.gallery}, Floor {artwork.floor}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium">DEPARTMENT</p>
            <p className="text-sm text-gray-700 mt-0.5">{artwork.department}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {artwork.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Related works */}
        {related.length > 0 && (
          <div className="pb-24">
            <h2 className="text-lg font-bold mb-3">You might also like</h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/artwork/${r.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-lg overflow-hidden">
                    {r.thumbnail && r.thumbnail.includes("moma.org") ? (
                      <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      "🎨"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.artist}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Gallery {r.gallery}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievement modal — full-screen yellow overlay */}
      <AnimatePresence>
        {showAchievement && achievementStamp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-[#F5A623] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => setShowAchievement(false)}
              className="absolute top-8 right-4 z-10 p-2 text-[var(--moma-black)]"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex-1 flex flex-col items-center justify-center px-8 text-[var(--moma-black)]">
              {/* Stamp visual */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.2 }}
                className="mb-8"
              >
                {achievementTheme ? (
                  <div className="bg-[#faf7f2] rounded-full p-6">
                    <PassportStamp
                      theme={achievementTheme}
                      earned={true}
                      size={160}
                      showAnimation={false}
                    />
                  </div>
                ) : (
                  <div className="text-8xl">{achievementStamp.icon}</div>
                )}
              </motion.div>

              {/* Achievement text */}
              <motion.h2
                className="text-2xl font-black text-center mb-2 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {achievementStamp.description}
              </motion.h2>

              {/* Did you know section */}
              <motion.div
                className="mt-10 w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-bold mb-3">Did you know?</h3>
                <p className="text-sm leading-relaxed opacity-80">
                  {artwork.description}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
