"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import artworks from "@/data/artworks.json";
import Link from "next/link";

type Artwork = (typeof artworks)[number];

export default function ArtworkDetail({ artwork }: { artwork: Artwork }) {
  const router = useRouter();
  const { bookmarks, toggleBookmark, currentSession, startSession, recordArtworkView, updateDwellTime } = useStore();
  const isBookmarked = bookmarks.includes(artwork.id);
  const dwellRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track view and dwell time
  useEffect(() => {
    if (!currentSession) startSession();
    recordArtworkView(artwork.id, artwork.gallery, artwork.floor);

    dwellRef.current = setInterval(() => {
      updateDwellTime(artwork.id, 5);
    }, 5000);

    return () => {
      if (dwellRef.current) clearInterval(dwellRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.id]);

  // Find related artworks (same gallery or same tags)
  const related = artworks
    .filter(
      (a) =>
        a.id !== artwork.id &&
        (a.gallery === artwork.gallery ||
          a.tags.some((t) => artwork.tags.includes(t)))
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-gray-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <button
            onClick={() => toggleBookmark(artwork.id)}
            className="p-2"
          >
            {isBookmarked ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--moma-red)" stroke="var(--moma-red)" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Artwork image */}
        <div className="bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
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

        {/* Title & Artist */}
        <div>
          <h1 className="text-2xl font-black leading-tight">{artwork.title}</h1>
          <p className="text-base text-gray-600 mt-1">
            {artwork.artist}, <span className="text-gray-400">{artwork.year}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {artwork.description}
        </p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-wrap gap-2">
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
          <div>
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
    </div>
  );
}
