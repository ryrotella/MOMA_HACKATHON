"use client";

import { useMemo } from "react";

import { useStore } from "@/store/useStore";
import WrappedStories from "@/components/WrappedStories";
import Link from "next/link";

const DEFAULT_SAVED_ARTWORK_ID = "starry-night";

export default function WrappedPage() {
  const { currentSession, pastSessions, savedArtworks } = useStore();

  // Use current session or most recent past session
  const session = currentSession || pastSessions[pastSessions.length - 1];
  const effectiveSavedArtworks = useMemo(() => {
    const unique = new Set(savedArtworks);
    unique.add(DEFAULT_SAVED_ARTWORK_ID);
    return [...unique];
  }, [savedArtworks]);
  const effectiveSession = useMemo(() => {
    if (!session) return null;
    const alreadyViewed = new Set(session.artworksViewed.map((view) => view.artworkId));
    const syntheticViews = effectiveSavedArtworks
      .filter((artworkId) => !alreadyViewed.has(artworkId))
      .map((artworkId) => ({
        artworkId,
        timestamp: session.startTime,
        dwellTime: 1,
      }));

    if (syntheticViews.length === 0) return session;
    return {
      ...session,
      artworksViewed: [...session.artworksViewed, ...syntheticViews],
    };
  }, [effectiveSavedArtworks, session]);

  if (!effectiveSession || effectiveSession.artworksViewed.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h1 className="text-2xl font-black mb-2">No Visit Yet</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Start exploring artworks on the map to build your personalized MoMA Wrapped experience.
        </p>
        <Link
          href="/map"
          className="bg-[var(--moma-black)] text-white py-3 px-8 rounded-xl font-semibold"
        >
          Start Exploring
        </Link>
      </div>
    );
  }

  return <WrappedStories session={effectiveSession} />;
}
