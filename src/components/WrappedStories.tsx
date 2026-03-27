"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import Image from "next/image";
import artworks from "@/data/artworks.json";
import type { VisitSession } from "@/store/useStore";

type Artwork = (typeof artworks)[number];

interface StorySlide {
  id: string;
  bg: string;
  textColor: string;
  render: () => React.ReactNode;
}

function getArtworkById(id: string): Artwork | undefined {
  return artworks.find((a) => a.id === id);
}

const FLOORS = [
  { num: 5, era: "1880s–1940s" },
  { num: 4, era: "1950s–1970s" },
  { num: 2, era: "1980s–Present" },
];

function getArtPersonality(tags: string[]): { name: string; emoji: string; desc: string } {
  const tagCounts: Record<string, number> = {};
  for (const t of tags) tagCounts[t] = (tagCounts[t] || 0) + 1;

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0] || "eclectic";

  const personalities: Record<string, { name: string; emoji: string; desc: string }> = {
    "cubism": { name: "The Deconstructor", emoji: "🔷", desc: "You see the world from every angle at once." },
    "surrealism": { name: "The Dreamer", emoji: "🌙", desc: "Reality is just a starting point for you." },
    "abstract": { name: "The Abstract Thinker", emoji: "🌀", desc: "You find meaning beyond form." },
    "pop-art": { name: "The Culture Maven", emoji: "⚡", desc: "You blur the line between high and low." },
    "impressionism": { name: "The Light Chaser", emoji: "🌅", desc: "You live for fleeting moments of beauty." },
    "abstract-expressionism": { name: "The Emotional Force", emoji: "💥", desc: "You feel art in your whole body." },
    "figurative": { name: "The People Watcher", emoji: "👁️", desc: "Humanity is your endless subject." },
    "sculpture": { name: "The Space Shaper", emoji: "🗿", desc: "You think in three dimensions." },
    "iconic": { name: "The Greatest Hits Fan", emoji: "⭐", desc: "You know what's legendary — and why." },
    "landscape": { name: "The Wanderer", emoji: "🏔️", desc: "Every horizon tells a story." },
    "portrait": { name: "The Face Reader", emoji: "🎭", desc: "Every portrait is a window to a soul." },
    "minimalism": { name: "The Essentialist", emoji: "◻️", desc: "Less is more. Always." },
    "color-field": { name: "The Color Feeler", emoji: "🎨", desc: "Color speaks louder than words." },
  };

  return personalities[top] || { name: "The Eclectic Explorer", emoji: "🌍", desc: "You refuse to be categorized — and that's your superpower." };
}

export default function WrappedStories({ session }: { session: VisitSession }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const shareRef = useRef<HTMLDivElement>(null);
  // Compute stats
  const viewedArtworks = session.artworksViewed
    .map((v) => ({ ...v, artwork: getArtworkById(v.artworkId) }))
    .filter((v) => v.artwork);

  const totalArtworks = viewedArtworks.length;
  const totalFloors = session.floorsVisited.length;
  const totalGalleries = session.galleriesVisited.length;

  // Top artworks by dwell time
  const topArtworks = [...viewedArtworks]
    .sort((a, b) => b.dwellTime - a.dwellTime)
    .slice(0, 4);

  // Determine favorite collection era
  const floorCounts: Record<number, number> = {};
  for (const v of viewedArtworks) {
    const floor = v.artwork?.floor;
    if (floor) floorCounts[floor] = (floorCounts[floor] || 0) + 1;
  }
  const favoriteFloor = Object.entries(floorCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const favoriteEra = favoriteFloor
    ? FLOORS.find((f) => f.num === Number(favoriteFloor[0]))?.era || "1880s–Present"
    : "1880s–Present";

  // All tags for personality
  const allTags = viewedArtworks.flatMap((v) => v.artwork?.tags || []);
  const personality = getArtPersonality(allTags);

  // Top tags for "other wrapped stuff"
  const tagCounts: Record<string, number> = {};
  for (const t of allTags) tagCounts[t] = (tagCounts[t] || 0) + 1;
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Date string
  const visitDate = new Date(session.startTime).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const shortDate = new Date(session.startTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const slides: StorySlide[] = [
    // Slide 1: Wrapped title (coral background matching UX)
    {
      id: "welcome",
      bg: "bg-[#E87461]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-6xl font-black mb-4">Wrapped</h1>
          </motion.div>
          <motion.p
            className="text-lg text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Your MoMA visit
          </motion.p>
        </div>
      ),
    },
    // Slide 2: "beautifully curated day" with artwork collage
    {
      id: "curated-day",
      bg: "bg-white",
      textColor: "text-[var(--moma-black)]",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-6">
          <motion.p
            className="text-sm text-gray-500 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {visitDate}
          </motion.p>
          <motion.h2
            className="text-[24px] font-bold text-center mb-8 leading-[1.5] tracking-[-0.36px] max-w-[208px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {shortDate} was a beautifully curated day
          </motion.h2>
          {/* Artwork collage */}
          <motion.div
            className="grid grid-cols-2 gap-2 w-full max-w-xs"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {topArtworks.slice(0, 4).map((v, i) => (
              <div
                key={v.artworkId}
                className={`rounded-lg overflow-hidden bg-gray-100 ${
                  i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                }`}
              >
                {v.artwork?.thumbnail && (
                  <img
                    src={v.artwork.thumbnail}
                    alt={v.artwork.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      ),
    },
    // Slide 3: Favorite collection era
    {
      id: "favorite-era",
      bg: "bg-white",
      textColor: "text-[var(--moma-black)]",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-6">
          <motion.p
            className="text-sm text-gray-500 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Your favorite collection was
          </motion.p>
          <motion.h2
            className="text-4xl font-black text-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {favoriteEra}
          </motion.h2>
          {/* Show artworks from that era */}
          <motion.div
            className="grid grid-cols-2 gap-2 w-full max-w-xs"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {viewedArtworks
              .filter((v) => {
                const floor = v.artwork?.floor;
                return favoriteFloor && floor === Number(favoriteFloor[0]);
              })
              .slice(0, 4)
              .map((v) => (
                <div key={v.artworkId} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {v.artwork?.thumbnail && (
                    <img
                      src={v.artwork.thumbnail}
                      alt={v.artwork.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
          </motion.div>
        </div>
      ),
    },
    // Slide 4: Other wrapped stuff (stats)
    {
      id: "other-stats",
      bg: "bg-white",
      textColor: "text-[var(--moma-black)]",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-8">
          <motion.h2
            className="text-[24px] font-bold text-center mb-10 leading-[1.5] tracking-[-0.36px] max-w-[208px]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Other wrapped stuff
          </motion.h2>
          <div className="w-full max-w-xs space-y-6">
            {[
              { value: totalArtworks, label: "artworks viewed" },
              { value: totalFloors, label: "floors explored" },
              { value: totalGalleries, label: "galleries visited" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
              >
                <div className="text-4xl font-black w-16 text-right">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
            {topTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="pt-4 border-t border-gray-100"
              >
                <p className="text-xs text-gray-400 mb-2">Your top movements</p>
                <div className="flex flex-wrap gap-2">
                  {topTags.map(([tag, count]) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                      {tag.replace(/-/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ),
    },
    // Slide 5: Profile / Share card (matches UX - dark card with personality)
    {
      id: "share",
      bg: "bg-[var(--moma-black)]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-6">
          {/* Figma: black card, rounded-8px, 332px wide, px-16 py-24 */}
          <div
            ref={shareRef}
            className="bg-black text-white w-[332px] rounded-[8px] px-4 py-6 flex flex-col items-center justify-between"
            style={{ minHeight: 480 }}
          >
            <div className="text-center w-full space-y-1">
              <p className="text-[18px] font-bold tracking-[-0.27px]">Your taste profile</p>
              <h3 className="text-[24px] font-bold tracking-[-0.36px]">{personality.name}</h3>
            </div>

            <div className="w-full my-4">
              {/* Top artwork image */}
              {topArtworks[0]?.artwork?.thumbnail && (
                <img
                  src={topArtworks[0].artwork.thumbnail}
                  alt={topArtworks[0].artwork.title}
                  className="w-full h-auto rounded object-cover"
                />
              )}
              {/* Facts bullets */}
              <div className="flex gap-12 mt-4 text-[16px] font-bold tracking-[-0.24px]">
                <ul className="list-disc ml-6 space-y-0">
                  <li>{totalArtworks} works</li>
                  <li>{totalFloors} floors</li>
                </ul>
                <ul className="list-disc ml-6 space-y-0">
                  <li>{totalGalleries} galleries</li>
                  <li>{favoriteEra}</li>
                </ul>
              </div>
            </div>

            {/* MoMA branding — Figma: 24px bold + 16px bold */}
            <div className="flex items-center gap-[35px] w-full">
              <p className="text-[24px] font-bold tracking-[-0.36px]">MoMA</p>
              <p className="text-[16px] font-bold tracking-[-0.24px]">moma.org/passport</p>
            </div>
          </div>

          {/* Share button — Figma: #080808, h-44px, rounded-8px, 24px bold */}
          <motion.div
            className="w-full max-w-[361px] mt-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleShare}
              className="btn-primary bg-[#080808] text-white text-[24px]"
            >
              Share
            </button>
          </motion.div>
        </div>
      ),
    },
  ];

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < slides.length) {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
      }
    },
    [currentSlide, slides.length]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      const x = e.clientX;
      const width = window.innerWidth;
      if (x > width * 0.5) {
        goTo(currentSlide + 1);
      } else {
        goTo(currentSlide - 1);
      }
    },
    [currentSlide, goTo]
  );

  async function handleDownload() {
    if (!shareRef.current) return;
    try {
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = "moma-wrapped.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // fallback: do nothing
    }
  }

  async function handleShare() {
    if (!shareRef.current) return;
    try {
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 3 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "moma-wrapped.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "My MoMA Wrapped",
          text: `I'm ${personality.name}! Check out my MoMA visit summary.`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  }

  const slide = slides[currentSlide];

  return (
    <div
      className={`fixed inset-0 z-50 ${slide.bg} ${slide.textColor} cursor-pointer select-none`}
      onClick={handleTap}
    >
      {/* Progress bar — Figma: 64px x 8px segments, 3px gap, centered */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-[3px] justify-center p-[10px] pt-[32px]">
        {slides.map((_, i) => (
          <div
            key={i}
            className="progress-segment transition-colors duration-300"
            style={{
              backgroundColor: i <= currentSlide ? "#171717" : "#dedede",
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.history.back();
        }}
        className="absolute top-8 right-4 z-20 p-2"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -100 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {slide.render()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
