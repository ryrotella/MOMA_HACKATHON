"use client";

import { useStore } from "@/store/useStore";
import WrappedStories from "@/components/WrappedStories";
import Link from "next/link";

export default function WrappedPage() {
  const { currentSession, pastSessions } = useStore();

  // Use current session or most recent past session
  const session = currentSession || pastSessions[pastSessions.length - 1];

  if (!session || session.artworksViewed.length === 0) {
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

  return <WrappedStories session={session} />;
}
