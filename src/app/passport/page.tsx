"use client";

import { motion } from "framer-motion";
import { useStore, Stamp } from "@/store/useStore";
import { PassportStamp, STAMP_THEMES } from "@/components/StampVisuals";

export default function PassportPage() {
  const { stamps, currentSession } = useStore();

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
      <div className="px-6 mb-4">
        <h1 className="text-[24px] font-bold tracking-[-0.36px] leading-[1.5]">{dateStr}</h1>
        <p className="text-sm text-gray-500">
          {earnedStamps.length} stamp{earnedStamps.length !== 1 ? "s" : ""} earned · {viewedArtworks.length} artwork{viewedArtworks.length !== 1 ? "s" : ""} viewed
        </p>
      </div>

      <div className="px-6">
        {earnedStamps.length === 0 && lockedStamps.length > 0 && (
          <div className="bg-[#faf7f2] rounded-xl p-6 text-center border border-[#e8e0d4] mb-6">
            <p className="text-3xl mb-2">🎟️</p>
            <p className="text-sm text-gray-500">
              Visit artworks to earn stamps!
            </p>
          </div>
        )}

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
