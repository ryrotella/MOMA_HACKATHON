"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, Stamp } from "@/store/useStore";
import { MiniStamp, STAMP_THEMES } from "@/components/StampVisuals";

export default function StampToast() {
  const { stamps, suppressStampToast } = useStore();
  const [toastStamp, setToastStamp] = useState<Stamp | null>(null);
  const initializedRef = useRef(false);
  const lastEarnedIdsRef = useRef<Set<string>>(new Set());

  // On first render, snapshot existing earned stamps so we don't toast them
  useEffect(() => {
    if (!initializedRef.current) {
      const earned = stamps.filter((s) => s.earnedAt);
      lastEarnedIdsRef.current = new Set(earned.map((s) => s.id));
      initializedRef.current = true;
      return;
    }

    const earned = stamps.filter((s) => s.earnedAt);
    const earnedIds = new Set(earned.map((s) => s.id));

    // Find stamps that are new since last check — skip if artwork detail handles it
    if (!suppressStampToast) {
      for (const stamp of earned) {
        if (!lastEarnedIdsRef.current.has(stamp.id)) {
          setToastStamp(stamp);
          break;
        }
      }
    }

    lastEarnedIdsRef.current = earnedIds;
  }, [stamps]);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!toastStamp) return;
    const timer = setTimeout(() => setToastStamp(null), 3000);
    return () => clearTimeout(timer);
  }, [toastStamp]);

  const theme = toastStamp?.stampThemeId
    ? STAMP_THEMES.find((t) => t.id === toastStamp.stampThemeId)
    : null;

  return (
    <AnimatePresence>
      {toastStamp && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-12 left-4 right-4 z-[100] pointer-events-none flex justify-center"
        >
          <div
            className="bg-[var(--moma-black)] text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl max-w-sm w-full pointer-events-auto"
            onClick={() => setToastStamp(null)}
          >
            {theme ? (
              <div className="flex-shrink-0">
                <MiniStamp theme={theme} size={48} />
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="text-3xl flex-shrink-0"
              >
                {toastStamp.icon}
              </motion.div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                Stamp earned!
              </p>
              <p className="text-sm font-bold truncate">{toastStamp.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {toastStamp.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
