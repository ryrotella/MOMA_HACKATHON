"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ArtworkImage from "@/components/ArtworkImage";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import artworks from "@/data/artworks.json";
import { useStore } from "@/store/useStore";

// Floor 4 → 5 (floor 2 hidden)
const FLOORS = [
  { num: 4, era: "1950s–1970s", color: "#F2C6C6", bgLight: "#FBF0F0" },
  { num: 5, era: "1880s–1940s", color: "#F2D6B3", bgLight: "#FAF3EA" },
];

const artworksByFloor = FLOORS.map((floor) => ({
  ...floor,
  artworks: artworks.filter((a) => a.floor === floor.num),
}));

export default function ExplorePage() {
  const [visibleFloor, setVisibleFloor] = useState(4);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const { isSavedArtwork } = useStore();
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const headerRef = useRef<HTMLDivElement>(null);
  const visibleArtworksByFloor = useMemo(
    () =>
      artworksByFloor.map((floor) => ({
        ...floor,
        artworks: floor.artworks.filter(
          (artwork) => Boolean(artwork.thumbnail?.trim()) && !failedImageIds.has(artwork.id)
        ),
      })),
    [failedImageIds]
  );

  const currentFloorData = FLOORS.find((f) => f.num === visibleFloor) ?? FLOORS[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Intersection Observer — update header as floor sections scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const floorNum = Number(entry.target.getAttribute("data-floor"));
            if (floorNum) setVisibleFloor(floorNum);
          }
        }
      },
      {
        rootMargin: "-40% 0px -55% 0px", // trigger when section hits middle of viewport
      }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToFloor = useCallback((floorNum: number) => {
    const el = sectionRefs.current.get(floorNum);
    if (el) {
      const headerHeight = headerRef.current?.offsetHeight ?? 140;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header — changes color with current floor */}
      <div
        ref={headerRef}
        className="sticky top-0 z-40 transition-colors duration-500 border-b"
        style={{
          backgroundColor: `${currentFloorData.bgLight}ee`,
          borderColor: `${currentFloorData.color}40`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="px-6 pt-12 pb-3">
          {/* Search bar — Figma: bg #eee, rounded-8px, 8px padding, 14px #828282 */}
          <div className="flex items-center gap-2 bg-[#eee] rounded-[8px] p-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#828282" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-[14px] text-[#828282] tracking-[-0.21px]">Search artist, painting, room, etc.</span>
          </div>

          {/* Floor indicator — animated */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={visibleFloor}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-[24px] font-bold tracking-[-0.36px] leading-[1.5]">Floor {visibleFloor}</h1>
                  <p className="text-xs text-gray-500">{currentFloorData.era}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floor dots — tap to jump */}
            <div className="flex items-center gap-1.5">
              {FLOORS.map((f) => (
                <button
                  key={f.num}
                  onClick={() => scrollToFloor(f.num)}
                  className="flex flex-col items-center gap-1 px-2 py-1"
                >
                  <motion.div
                    className="rounded-full transition-all"
                    animate={{
                      width: visibleFloor === f.num ? 28 : 10,
                      height: 10,
                      backgroundColor: visibleFloor === f.num ? f.color : "#e5e7eb",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                  <span
                    className={`text-[9px] font-bold transition-opacity ${
                      visibleFloor === f.num ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    {f.num}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floor sections */}
      <div className="pb-28">
        {visibleArtworksByFloor.map((floor) => (
          <div
            key={floor.num}
            ref={(el) => {
              if (el) sectionRefs.current.set(floor.num, el);
            }}
            data-floor={floor.num}
            className="px-4 pt-6"
          >
            {/* Floor divider */}
            <div className="flex items-center gap-3 mb-4 px-2">
              <div
                className="h-px flex-1"
                style={{ backgroundColor: `${floor.color}80` }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: floor.color }}
                />
                <h2 className="text-sm font-bold text-gray-900">
                  Floor {floor.num}
                </h2>
                <span className="text-xs text-gray-400">{floor.era}</span>
              </div>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: `${floor.color}80` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {floor.artworks.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: (i % 4) * 0.05 }}
                >
                  <Link
                    href={`/artwork/${artwork.id}`}
                    className="block group"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <ArtworkImage
                        src={artwork.thumbnail}
                        alt={artwork.title}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => {
                          setFailedImageIds((current) => {
                            if (current.has(artwork.id)) return current;
                            const next = new Set(current);
                            next.add(artwork.id);
                            return next;
                          });
                        }}
                      />
                      {isHydrated && isSavedArtwork(artwork.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--moma-red)] rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Gallery {artwork.gallery}
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold mt-2 leading-tight line-clamp-1">
                      {artwork.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1">
                      {artwork.artist}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
