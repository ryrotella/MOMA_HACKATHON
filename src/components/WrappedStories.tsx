"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
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
  const nowTimestamp = session.endTime ?? session.startTime;

  // Compute stats
  const viewedArtworks = session.artworksViewed
    .map((v) => ({ ...v, artwork: getArtworkById(v.artworkId) }))
    .filter((v) => v.artwork);

  const totalArtworks = viewedArtworks.length;
  const totalFloors = session.floorsVisited.length;
  const totalGalleries = session.galleriesVisited.length;
  const visitDuration = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : Math.round((nowTimestamp - session.startTime) / 60000);

  // Top artworks by dwell time
  const topArtworks = [...viewedArtworks]
    .sort((a, b) => b.dwellTime - a.dwellTime)
    .slice(0, 5);

  // Genre distribution
  const allTags = viewedArtworks.flatMap((v) => v.artwork?.tags || []);
  const tagCounts: Record<string, number> = {};
  for (const t of allTags) tagCounts[t] = (tagCounts[t] || 0) + 1;
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxTagCount = topTags[0]?.[1] || 1;

  // Most viewed artist
  const artistCounts: Record<string, number> = {};
  for (const v of viewedArtworks) {
    const artist = v.artwork?.artist || "";
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  }
  const soulmateArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

  // Hidden gem (lowest popularity among viewed)
  const hiddenGem = [...viewedArtworks].sort(
    (a, b) => (a.artwork?.popularity || 0) - (b.artwork?.popularity || 0)
  )[0];

  // Art personality
  const personality = getArtPersonality(allTags);

  const slides: StorySlide[] = [
    // Slide 1: Welcome
    {
      id: "welcome",
      bg: "bg-[var(--moma-black)]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-5xl font-black mb-2">MoMA</h1>
            <p className="text-xl font-light text-gray-300">Wrapped</p>
          </motion.div>
          <motion.p
            className="text-sm text-gray-400 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Your visit on {new Date(session.startTime).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </motion.p>
        </div>
      ),
    },
    // Slide 2: By the numbers
    {
      id: "numbers",
      bg: "bg-[#e4002b]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-12">
          <motion.h2
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Your visit in numbers
          </motion.h2>
          <div className="space-y-8">
            {[
              { value: totalArtworks, label: "artworks viewed" },
              { value: totalFloors, label: "floors explored" },
              { value: totalGalleries, label: "galleries visited" },
              { value: `${visitDuration}`, label: "minutes spent" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.2 }}
              >
                <div className="text-6xl font-black">{stat.value}</div>
                <div className="text-lg font-light opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 3: Top Artworks
    {
      id: "top-artworks",
      bg: "bg-[#1a1a1a]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col justify-center h-full px-8">
          <motion.h2
            className="text-2xl font-bold mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Your top artworks
          </motion.h2>
          <div className="space-y-4">
            {topArtworks.map((v, i) => (
              <motion.div
                key={v.artworkId}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                <span className="text-3xl font-black text-gray-500 w-8">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{v.artwork?.title}</p>
                  <p className="text-xs text-gray-400">{v.artwork?.artist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 4: Art DNA
    {
      id: "art-dna",
      bg: "bg-[#0066cc]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col justify-center h-full px-8">
          <motion.h2
            className="text-2xl font-bold mb-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Your Art DNA
          </motion.h2>
          <motion.p
            className="text-sm text-blue-200 text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            What draws you in
          </motion.p>
          <div className="space-y-4">
            {topTags.map(([tag, count], i) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                style={{ transformOrigin: "left" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{tag.replace(/-/g, " ")}</span>
                  <span className="text-xs text-blue-200">{count}</span>
                </div>
                <div className="h-3 bg-blue-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxTagCount) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 5: Soulmate Artist
    ...(soulmateArtist
      ? [
          {
            id: "soulmate",
            bg: "bg-[#8B5CF6]",
            textColor: "text-white",
            render: () => (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="text-7xl mb-6"
                >
                  💜
                </motion.div>
                <motion.h2
                  className="text-lg font-medium text-purple-200 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Your soulmate artist
                </motion.h2>
                <motion.p
                  className="text-4xl font-black"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {soulmateArtist[0]}
                </motion.p>
                <motion.p
                  className="text-sm text-purple-200 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  You viewed {soulmateArtist[1]} of their works
                </motion.p>
              </div>
            ),
          } as StorySlide,
        ]
      : []),
    // Slide 6: Hidden Gem
    ...(hiddenGem
      ? [
          {
            id: "hidden-gem",
            bg: "bg-[#059669]",
            textColor: "text-white",
            render: () => (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <motion.div
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring" }}
                  className="text-7xl mb-6"
                >
                  💎
                </motion.div>
                <motion.h2
                  className="text-lg font-medium text-emerald-200 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your hidden gem discovery
                </motion.h2>
                <motion.p
                  className="text-3xl font-black"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {hiddenGem.artwork?.title}
                </motion.p>
                <motion.p
                  className="text-sm text-emerald-200 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  by {hiddenGem.artwork?.artist}
                </motion.p>
                <motion.p
                  className="text-xs text-emerald-300 mt-4 max-w-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Not everyone finds this one — you have a great eye.
                </motion.p>
              </div>
            ),
          } as StorySlide,
        ]
      : []),
    // Slide 7: Art Personality
    {
      id: "personality",
      bg: "bg-[#F59E0B]",
      textColor: "text-[var(--moma-black)]",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-8xl mb-6"
          >
            {personality.emoji}
          </motion.div>
          <motion.h2
            className="text-lg font-medium text-amber-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            You are
          </motion.h2>
          <motion.p
            className="text-4xl font-black"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {personality.name}
          </motion.p>
          <motion.p
            className="text-base text-amber-800 mt-4 max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {personality.desc}
          </motion.p>
        </div>
      ),
    },
    // Slide 8: Shareable card
    {
      id: "share",
      bg: "bg-[var(--moma-black)]",
      textColor: "text-white",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-6">
          <div
            ref={shareRef}
            className="bg-white text-[var(--moma-black)] rounded-2xl p-6 w-full max-w-xs shadow-2xl"
          >
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-black">MoMA Wrapped</h3>
              <div className="text-5xl">{personality.emoji}</div>
              <p className="font-bold text-lg">{personality.name}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-black">{totalArtworks}</div>
                  <div className="text-[10px] text-gray-500">artworks</div>
                </div>
                <div>
                  <div className="text-xl font-black">{totalGalleries}</div>
                  <div className="text-[10px] text-gray-500">galleries</div>
                </div>
                <div>
                  <div className="text-xl font-black">{visitDuration}m</div>
                  <div className="text-[10px] text-gray-500">spent</div>
                </div>
              </div>
              {topArtworks[0] && (
                <p className="text-xs text-gray-500">
                  Favorite: {topArtworks[0].artwork?.title}
                </p>
              )}
              <p className="text-[10px] text-gray-300 pt-2">
                moma-explorer.vercel.app
              </p>
            </div>
          </div>
          <motion.div
            className="flex gap-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleShare}
              className="bg-white text-[var(--moma-black)] px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              Share
            </button>
            <button
              onClick={handleDownload}
              className="border-2 border-white text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
            >
              Download
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
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/20">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: i <= currentSlide ? "100%" : "0%" }}
            />
          </div>
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
