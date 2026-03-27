"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import artworks from "@/data/artworks.json";

const artworkMap = Object.fromEntries(artworks.map((a) => [a.id, a]));

export default function VisitsPage() {
  const { currentSession, bookmarks } = useStore();
  const viewedArtworks = currentSession?.artworksViewed ?? [];

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white pt-14 pb-28">
      <div className="px-6 mb-4">
        <h1 className="text-[24px] font-bold tracking-[-0.36px] leading-[1.5]">{dateStr}</h1>
        <p className="text-sm text-gray-500">
          {viewedArtworks.length} artwork{viewedArtworks.length !== 1 ? "s" : ""} viewed
        </p>
      </div>

      <div className="px-6">
        {viewedArtworks.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">👀</p>
            <p className="text-sm text-gray-500 mb-1">
              No artworks visited yet today
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Explore artworks and they&apos;ll appear here
            </p>
            <Link
              href="/explore"
              className="inline-block bg-[var(--moma-black)] text-white py-2.5 px-6 rounded-xl text-sm font-semibold"
            >
              Start exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {viewedArtworks
              .slice()
              .reverse()
              .map((visit, i) => {
                const artwork = artworkMap[visit.artworkId];
                if (!artwork) return null;
                return (
                  <motion.div
                    key={visit.artworkId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={`/artwork/${artwork.id}`}
                      className="block group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={artwork.thumbnail}
                          alt={artwork.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {bookmarks.includes(artwork.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--moma-red)] rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold mt-2 leading-tight line-clamp-1">
                        {artwork.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 line-clamp-1">
                        {artwork.artist}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
