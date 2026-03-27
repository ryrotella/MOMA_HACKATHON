"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useStore, Stamp } from "@/store/useStore";
import { PassportStamp, STAMP_THEMES } from "@/components/StampVisuals";
import artworks from "@/data/artworks.json";

const artworkMap = Object.fromEntries(artworks.map((a) => [a.id, a]));

type Tab = "visits" | "stamps";

export default function PassportPage() {
  const { stamps, currentSession, bookmarks } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("visits");

  const earnedStamps = stamps.filter((s) => s.earnedAt);
  const lockedStamps = stamps.filter((s) => !s.earnedAt);
  const viewedArtworks = currentSession?.artworksViewed ?? [];

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white pt-14 pb-28">
      {/* Date header */}
      <div className="px-6 mb-4">
        <h1 className="text-[24px] font-bold tracking-[-0.36px] leading-[1.5]">{dateStr}</h1>
        <p className="text-sm text-gray-500">
          {earnedStamps.length} stamp{earnedStamps.length !== 1 ? "s" : ""} · {viewedArtworks.length} artwork{viewedArtworks.length !== 1 ? "s" : ""} viewed
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 px-6 mb-6">
        <button
          onClick={() => setActiveTab("visits")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "visits"
              ? "bg-[var(--moma-black)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Visits
        </button>
        <button
          onClick={() => setActiveTab("stamps")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "stamps"
              ? "bg-[var(--moma-black)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Stamps
        </button>
      </div>

      {activeTab === "visits" ? (
        <VisitsView
          viewedArtworks={viewedArtworks}
          bookmarks={bookmarks}
          dateStr={dateStr}
        />
      ) : (
        <StampsView
          earnedStamps={earnedStamps}
          lockedStamps={lockedStamps}
        />
      )}
    </div>
  );
}

function VisitsView({
  viewedArtworks,
  bookmarks,
  dateStr,
}: {
  viewedArtworks: { artworkId: string; timestamp: number; dwellTime: number }[];
  bookmarks: string[];
  dateStr: string;
}) {
  return (
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
        <>
          {/* Artwork grid - matching UX with 2-col grid */}
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

          {/* Action links — Figma: 24px bold, plain text */}
          <div className="space-y-8 mt-4">
            <Link
              href="/explore"
              className="block text-[24px] font-bold tracking-[-0.36px] leading-[1.5] text-black"
            >
              Add
            </Link>
            <Link
              href="/wrapped"
              className="block text-[24px] font-bold tracking-[-0.36px] leading-[1.5] text-black"
            >
              Make wrapped
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function StampsView({
  earnedStamps,
  lockedStamps,
}: {
  earnedStamps: Stamp[];
  lockedStamps: Stamp[];
}) {
  return (
    <div className="px-6">
      {earnedStamps.length === 0 && (
        <div className="bg-[#faf7f2] rounded-xl p-6 text-center border border-[#e8e0d4]">
          <p className="text-3xl mb-2">🎟️</p>
          <p className="text-sm text-gray-500">
            Visit artworks to earn stamps!
          </p>
        </div>
      )}

      {/* Stamp grid - paper cards */}
      {(earnedStamps.length > 0 || lockedStamps.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {earnedStamps.map((stamp, i) => (
            <StampCard key={stamp.id} stamp={stamp} earned delay={i * 0.08} />
          ))}
          {lockedStamps.map((stamp) => (
            <StampCard key={stamp.id} stamp={stamp} earned={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function StampCard({
  stamp,
  earned,
  delay = 0,
}: {
  stamp: Stamp;
  earned: boolean;
  delay?: number;
}) {
  const theme = stamp.stampThemeId
    ? STAMP_THEMES.find((t) => t.id === stamp.stampThemeId)
    : null;

  if (theme) {
    return (
      <div
        className={`bg-[#faf7f2] rounded-xl p-4 flex flex-col items-center border border-[#e8e0d4] ${
          earned ? "" : "opacity-30"
        }`}
        style={{ minHeight: 140 }}
      >
        <PassportStamp
          theme={theme}
          earned={earned}
          size={100}
          showAnimation={earned}
          delay={delay}
        />
        <p className="text-[10px] font-semibold leading-tight text-center mt-2">
          {stamp.name}
        </p>
        {earned && stamp.earnedAt && (
          <p className="text-[8px] text-gray-400 mt-0.5">
            {new Date(stamp.earnedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
        {!earned && (
          <p className="text-[8px] text-gray-400 mt-0.5">🔒 Locked</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={earned ? { scale: 0.8, opacity: 0 } : {}}
      animate={earned ? { scale: 1, opacity: 1 } : {}}
      transition={earned ? { delay, type: "spring", stiffness: 200 } : {}}
      className={`bg-[#faf7f2] rounded-xl p-4 text-center border border-[#e8e0d4] ${
        earned ? "" : "opacity-30"
      }`}
    >
      <div className={`text-3xl mb-1 ${earned ? "" : "grayscale"}`}>
        {earned ? stamp.icon : "🔒"}
      </div>
      <p className="text-[10px] font-semibold leading-tight">{stamp.name}</p>
      <p className="text-[8px] text-gray-400 mt-0.5">{stamp.description}</p>
      {earned && stamp.earnedAt && (
        <p className="text-[8px] text-gray-400 mt-0.5">
          {new Date(stamp.earnedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </motion.div>
  );
}
