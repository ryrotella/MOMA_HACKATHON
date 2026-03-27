"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";

const FloorMap = dynamic(() => import("@/components/FloorMap"), { ssr: false });

const floors = [
  { num: 2, era: "1980s–Present", color: "#B8CCE4" },
  { num: 4, era: "1950s–1970s", color: "#F2C6C6" },
  { num: 5, era: "1880s–1940s", color: "#F2D6B3" },
];

export default function MapPage() {
  const { currentFloor, setCurrentFloor } = useStore();
  const [isIsometric, setIsIsometric] = useState(false);
  const currentFloorData = floors.find((f) => f.num === currentFloor);

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-gray-50">
      {/* Header with integrated floor tabs */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center justify-between gap-3 z-10">
        <div className="min-w-0">
          <h1 className="text-base font-black leading-tight">Floor {currentFloor}</h1>
          <p className="text-[11px] text-gray-500 truncate">
            {currentFloorData?.era || ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 2D / 3D toggle */}
          <button
            onClick={() => setIsIsometric((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isIsometric
                ? "bg-[var(--moma-black)] text-white border-transparent"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {isIsometric ? (
              <>
                <CubeIcon />
                3D
              </>
            ) : (
              <>
                <FlatIcon />
                2D
              </>
            )}
          </button>

          {/* Floor tabs */}
          <div className="flex gap-1">
            {floors.map((f) => (
              <button
                key={f.num}
                onClick={() => setCurrentFloor(f.num)}
                className={`relative w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  currentFloor === f.num
                    ? "bg-[var(--moma-black)] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {currentFloor !== f.num && (
                  <span
                    className="absolute inset-1 rounded-md opacity-30"
                    style={{ backgroundColor: f.color }}
                  />
                )}
                <span className="relative">{f.num}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map with isometric wrapper */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="w-full h-full transition-transform duration-500 ease-out"
          style={
            isIsometric
              ? {
                  perspective: "1200px",
                  perspectiveOrigin: "50% 50%",
                }
              : undefined
          }
        >
          <div
            className="w-full h-full transition-transform duration-500 ease-out origin-center"
            style={
              isIsometric
                ? {
                    transform: "rotateX(45deg) rotateZ(-10deg) scale(0.85)",
                    transformStyle: "preserve-3d",
                  }
                : undefined
            }
          >
            <FloorMap isIsometric={isIsometric} />
          </div>
        </div>

        {/* Isometric shadow/ground plane */}
        {isIsometric && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.08) 0%, transparent 70%)",
              zIndex: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}

function CubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function FlatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}
