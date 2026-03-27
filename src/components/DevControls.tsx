"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function DevControls() {
  const router = useRouter();
  const { seedDemoData, resetAllData } = useStore();
  const [showPanel, setShowPanel] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setShowPanel(!showPanel);
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 500);
    }
  };

  const handleSeed = () => {
    seedDemoData();
    setSeeded(true);
    setTimeout(() => {
      router.push("/wrapped");
    }, 300);
  };

  const handleReset = () => {
    resetAllData();
    setSeeded(false);
  };

  return (
    <div className="space-y-2">
      <div onClick={handleTap} className="cursor-default select-none">
        <h1 className="text-5xl font-black tracking-tight">MoMA</h1>
        <p className="text-lg text-gray-500 font-light">Explorer</p>
      </div>

      {showPanel && (
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 border border-gray-200">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Dev Controls</p>
          <button
            onClick={handleSeed}
            className="w-full bg-emerald-600 text-white text-sm py-2 px-4 rounded-lg font-medium active:scale-[0.98] transition-transform"
          >
            {seeded ? "Seeded! Going to Wrapped..." : "Seed Demo Data → Wrapped"}
          </button>
          <button
            onClick={() => { seedDemoData(); setSeeded(true); }}
            className="w-full bg-blue-600 text-white text-sm py-2 px-4 rounded-lg font-medium active:scale-[0.98] transition-transform"
          >
            Seed Demo Data (stay here)
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-red-600 text-white text-sm py-2 px-4 rounded-lg font-medium active:scale-[0.98] transition-transform"
          >
            Reset All Data
          </button>
          <p className="text-[10px] text-gray-400 text-center">Triple-tap logo to toggle</p>
        </div>
      )}
    </div>
  );
}
