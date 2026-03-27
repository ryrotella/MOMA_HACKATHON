"use client";

import { motion } from "framer-motion";

// Each stamp is a self-contained SVG that mimics vintage passport/rubber stamp aesthetics
// Mapped to specific MoMA artworks as shown in UX designs

export type StampTheme = {
  id: string;
  name: string;
  artist: string;
  shape: "circle" | "rect" | "square";
  color: string; // ink color
  artwork: string; // artwork reference
  imageUrl?: string; // official stamp PNG
};

export const STAMP_THEMES: StampTheme[] = [
  { id: "starry-night", name: "The Starry Night", artist: "Vincent van Gogh", shape: "circle", color: "#1a3a5c", artwork: "starry-night", imageUrl: "/STAMPS/stamp-starry-night.png" },
  { id: "bicycle-wheel", name: "Bicycle Wheel", artist: "Marcel Duchamp", shape: "rect", color: "#1a3a5c", artwork: "bicycle-wheel" },
  { id: "les-demoiselles", name: "Les Demoiselles d'Avignon", artist: "Pablo Picasso", shape: "rect", color: "#1a3a5c", artwork: "les-demoiselles" },
  { id: "self-portrait", name: "Self-Portrait", artist: "Frida Kahlo", shape: "circle", color: "#1a3a5c", artwork: "self-portrait-cropped-hair", imageUrl: "/STAMPS/stamp-explorer.png" },
  { id: "broadacre-city", name: "Broadacre City", artist: "Frank Lloyd Wright", shape: "rect", color: "#1a3a5c", artwork: "broadacre-city", imageUrl: "/STAMPS/stamp-broadacre-city.png" },
  { id: "starry-swirl", name: "The Starry Night", artist: "Detail", shape: "circle", color: "#0f2847", artwork: "starry-night", imageUrl: "/STAMPS/stamp-persistence.png" },
  { id: "pollock", name: "One: Number 31", artist: "Jackson Pollock", shape: "square", color: "#1a3a5c", artwork: "one-number-31" },
  { id: "campbell-soup", name: "Campbell's Soup Cans", artist: "Andy Warhol", shape: "rect", color: "#c41e2a", artwork: "campbell-soup" },
  { id: "mike-kelley", name: "Deodorized Central Mass", artist: "Mike Kelley", shape: "rect", color: "#c41e2a", artwork: "deodorized-central-mass", imageUrl: "/STAMPS/stamp-mike-kelley.png" },
];

interface StampProps {
  theme: StampTheme;
  earned: boolean;
  size?: number;
  showAnimation?: boolean;
  delay?: number;
}

export function PassportStamp({ theme, earned, size = 120, showAnimation = true, delay = 0 }: StampProps) {
  // Use official stamp image when available
  if (theme.imageUrl) {
    return (
      <motion.div
        initial={showAnimation && earned ? { scale: 0, rotate: -15, opacity: 0 } : {}}
        animate={showAnimation && earned ? { scale: 1, rotate: 0, opacity: 1 } : {}}
        transition={{ delay, type: "spring", stiffness: 150, damping: 15 }}
        style={{ width: size, height: size, opacity: earned ? 1 : 0.15 }}
        className="flex items-center justify-center"
      >
        <img
          src={theme.imageUrl}
          alt={`${theme.name} stamp`}
          style={{ width: size, height: size, objectFit: "contain" }}
          draggable={false}
        />
      </motion.div>
    );
  }

  if (theme.shape === "circle") {
    return (
      <motion.div
        initial={showAnimation && earned ? { scale: 0, rotate: -45, opacity: 0 } : {}}
        animate={showAnimation && earned ? { scale: 1, rotate: 0, opacity: 1 } : {}}
        transition={{ delay, type: "spring", stiffness: 150, damping: 15 }}
        style={{ width: size, height: size, opacity: earned ? 1 : 0.15 }}
      >
        <CircleStamp theme={theme} size={size} earned={earned} />
      </motion.div>
    );
  }

  if (theme.shape === "square") {
    return (
      <motion.div
        initial={showAnimation && earned ? { scale: 0, rotate: -20, opacity: 0 } : {}}
        animate={showAnimation && earned ? { scale: 1, rotate: 0, opacity: 1 } : {}}
        transition={{ delay, type: "spring", stiffness: 150, damping: 15 }}
        style={{ width: size, height: size, opacity: earned ? 1 : 0.15 }}
      >
        <SquareStamp theme={theme} size={size} earned={earned} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={showAnimation && earned ? { scale: 0, rotate: 10, opacity: 0 } : {}}
      animate={showAnimation && earned ? { scale: 1, rotate: 0, opacity: 1 } : {}}
      transition={{ delay, type: "spring", stiffness: 150, damping: 15 }}
      style={{ width: size * 1.2, height: size * 0.85, opacity: earned ? 1 : 0.15 }}
    >
      <RectStamp theme={theme} size={size} earned={earned} />
    </motion.div>
  );
}

function CircleStamp({ theme, size }: { theme: StampTheme; size: number; earned: boolean }) {
  const r = size / 2 - 4;
  const innerR = r - 8;
  const textR = r - 4;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={theme.color}
        strokeWidth="3"
      />
      {/* Inner circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={innerR}
        fill="none"
        stroke={theme.color}
        strokeWidth="1.5"
      />
      {/* Circular text - artist name */}
      <defs>
        <path
          id={`circle-top-${theme.id}`}
          d={`M ${size / 2 - textR},${size / 2} A ${textR},${textR} 0 1,1 ${size / 2 + textR},${size / 2}`}
        />
        <path
          id={`circle-bottom-${theme.id}`}
          d={`M ${size / 2 + textR},${size / 2} A ${textR},${textR} 0 1,1 ${size / 2 - textR},${size / 2}`}
        />
      </defs>
      <text
        fill={theme.color}
        fontSize={size * 0.065}
        fontWeight="700"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        <textPath href={`#circle-top-${theme.id}`} startOffset="50%">
          {theme.name.toUpperCase()}
        </textPath>
      </text>
      <text
        fill={theme.color}
        fontSize={size * 0.055}
        fontWeight="500"
        letterSpacing="1"
        textAnchor="middle"
      >
        <textPath href={`#circle-bottom-${theme.id}`} startOffset="50%">
          {theme.artist.toUpperCase()}
        </textPath>
      </text>
      {/* Center motif */}
      <StampCenterMotif theme={theme} cx={size / 2} cy={size / 2} size={size * 0.35} />
    </svg>
  );
}

function RectStamp({ theme, size }: { theme: StampTheme; size: number; earned: boolean }) {
  const w = size * 1.2;
  const h = size * 0.85;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Outer border */}
      <rect
        x="3"
        y="3"
        width={w - 6}
        height={h - 6}
        fill="none"
        stroke={theme.color}
        strokeWidth="2.5"
        rx="2"
      />
      {/* Inner border */}
      <rect
        x="8"
        y="8"
        width={w - 16}
        height={h - 16}
        fill="none"
        stroke={theme.color}
        strokeWidth="1"
        rx="1"
      />
      {/* Title text */}
      <text
        x={w / 2}
        y={h * 0.25}
        textAnchor="middle"
        fill={theme.color}
        fontSize={w * 0.065}
        fontWeight="800"
        letterSpacing="0.5"
      >
        {theme.name.length > 20 ? theme.name.slice(0, 20).toUpperCase() : theme.name.toUpperCase()}
      </text>
      {/* Center motif */}
      <StampCenterMotif theme={theme} cx={w / 2} cy={h / 2 + 2} size={Math.min(w, h) * 0.32} />
      {/* Artist text at bottom */}
      <text
        x={w / 2}
        y={h * 0.85}
        textAnchor="middle"
        fill={theme.color}
        fontSize={w * 0.05}
        fontWeight="600"
        letterSpacing="1"
      >
        {theme.artist.toUpperCase()}
      </text>
    </svg>
  );
}

function SquareStamp({ theme, size }: { theme: StampTheme; size: number; earned: boolean }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer border */}
      <rect
        x="3"
        y="3"
        width={size - 6}
        height={size - 6}
        fill="none"
        stroke={theme.color}
        strokeWidth="2.5"
        rx="2"
      />
      {/* Inner border */}
      <rect
        x="8"
        y="8"
        width={size - 16}
        height={size - 16}
        fill="none"
        stroke={theme.color}
        strokeWidth="1"
        rx="1"
      />
      {/* Artist name at top */}
      <text
        x={size / 2}
        y={size * 0.2}
        textAnchor="middle"
        fill={theme.color}
        fontSize={size * 0.075}
        fontWeight="800"
        letterSpacing="0.5"
      >
        {theme.artist.toUpperCase()}
      </text>
      {/* Center motif */}
      <StampCenterMotif theme={theme} cx={size / 2} cy={size / 2 + 2} size={size * 0.35} />
      {/* Subtitle */}
      <text
        x={size / 2}
        y={size * 0.88}
        textAnchor="middle"
        fill={theme.color}
        fontSize={size * 0.055}
        fontWeight="500"
        letterSpacing="0.5"
      >
        THE MUSEUM OF MODERN ART
      </text>
    </svg>
  );
}

// Center motifs for each stamp - simple SVG art that evokes the artwork
function StampCenterMotif({ theme, cx, cy, size }: { theme: StampTheme; cx: number; cy: number; size: number }) {
  const s = size / 2;

  switch (theme.id) {
    case "starry-night":
      // Swirling stars pattern
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <circle cx="0" cy="0" r={s * 0.15} fill={theme.color} />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
              key={angle}
              cx={Math.cos((angle * Math.PI) / 180) * s * 0.55}
              cy={Math.sin((angle * Math.PI) / 180) * s * 0.55}
              r={s * 0.1}
              fill={theme.color}
            />
          ))}
          <path
            d={`M ${-s * 0.7} 0 Q ${-s * 0.35} ${-s * 0.3} 0 0 Q ${s * 0.35} ${s * 0.3} ${s * 0.7} 0`}
            fill="none"
            stroke={theme.color}
            strokeWidth="1.5"
          />
          <path
            d={`M ${-s * 0.6} ${s * 0.3} Q ${-s * 0.2} ${-s * 0.1} ${s * 0.2} ${s * 0.3} Q ${s * 0.5} ${s * 0.1} ${s * 0.6} ${-s * 0.2}`}
            fill="none"
            stroke={theme.color}
            strokeWidth="1.5"
          />
        </g>
      );

    case "bicycle-wheel":
      // Bicycle wheel spokes
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <circle cx="0" cy="0" r={s * 0.7} fill="none" stroke={theme.color} strokeWidth="2" />
          <circle cx="0" cy="0" r={s * 0.15} fill="none" stroke={theme.color} strokeWidth="1.5" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1={Math.cos((angle * Math.PI) / 180) * s * 0.15}
              y1={Math.sin((angle * Math.PI) / 180) * s * 0.15}
              x2={Math.cos((angle * Math.PI) / 180) * s * 0.7}
              y2={Math.sin((angle * Math.PI) / 180) * s * 0.7}
              stroke={theme.color}
              strokeWidth="0.8"
            />
          ))}
        </g>
      );

    case "les-demoiselles":
      // Abstract faces / angular forms
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <path
            d={`M ${-s * 0.4} ${-s * 0.5} L ${-s * 0.1} ${-s * 0.6} L ${s * 0.2} ${-s * 0.4} L ${s * 0.4} ${-s * 0.5} L ${s * 0.5} ${-s * 0.1} L ${s * 0.3} ${s * 0.4} L ${-s * 0.1} ${s * 0.5} L ${-s * 0.5} ${s * 0.3} Z`}
            fill="none"
            stroke={theme.color}
            strokeWidth="2"
          />
          <line x1={-s * 0.1} y1={-s * 0.3} x2={-s * 0.2} y2={s * 0.1} stroke={theme.color} strokeWidth="1.5" />
          <line x1={s * 0.15} y1={-s * 0.2} x2={s * 0.2} y2={s * 0.2} stroke={theme.color} strokeWidth="1.5" />
          <circle cx={-s * 0.15} cy={-s * 0.15} r={s * 0.06} fill={theme.color} />
          <circle cx={s * 0.2} cy={-s * 0.05} r={s * 0.06} fill={theme.color} />
        </g>
      );

    case "self-portrait":
      // Simplified portrait silhouette
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <ellipse cx="0" cy={-s * 0.1} rx={s * 0.35} ry={s * 0.45} fill="none" stroke={theme.color} strokeWidth="2" />
          <circle cx={-s * 0.1} cy={-s * 0.2} r={s * 0.06} fill={theme.color} />
          <circle cx={s * 0.1} cy={-s * 0.2} r={s * 0.06} fill={theme.color} />
          <path
            d={`M ${-s * 0.08} ${s * 0.05} Q 0 ${s * 0.12} ${s * 0.08} ${s * 0.05}`}
            fill="none"
            stroke={theme.color}
            strokeWidth="1.5"
          />
          <path
            d={`M ${-s * 0.35} ${-s * 0.3} Q ${-s * 0.4} ${-s * 0.6} 0 ${-s * 0.55} Q ${s * 0.4} ${-s * 0.6} ${s * 0.35} ${-s * 0.3}`}
            fill="none"
            stroke={theme.color}
            strokeWidth="1.5"
          />
        </g>
      );

    case "broadacre-city":
      // Architectural / city grid
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <rect x={-s * 0.6} y={-s * 0.3} width={s * 1.2} height={s * 0.6} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <line x1={-s * 0.3} y1={-s * 0.3} x2={-s * 0.3} y2={s * 0.3} stroke={theme.color} strokeWidth="0.8" />
          <line x1={0} y1={-s * 0.3} x2={0} y2={s * 0.3} stroke={theme.color} strokeWidth="0.8" />
          <line x1={s * 0.3} y1={-s * 0.3} x2={s * 0.3} y2={s * 0.3} stroke={theme.color} strokeWidth="0.8" />
          <line x1={-s * 0.6} y1={0} x2={s * 0.6} y2={0} stroke={theme.color} strokeWidth="0.8" />
          {/* Small buildings */}
          <rect x={-s * 0.55} y={-s * 0.25} width={s * 0.2} height={s * 0.15} fill={theme.color} opacity="0.3" />
          <rect x={s * 0.05} y={-s * 0.25} width={s * 0.15} height={s * 0.25} fill={theme.color} opacity="0.3" />
          <rect x={s * 0.35} y={s * 0.05} width={s * 0.2} height={s * 0.2} fill={theme.color} opacity="0.3" />
        </g>
      );

    case "starry-swirl":
      // Dense swirl pattern
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <path
            d={`M 0 0 Q ${s * 0.3} ${-s * 0.3} ${s * 0.5} 0 Q ${s * 0.3} ${s * 0.3} 0 ${s * 0.2} Q ${-s * 0.4} ${s * 0.5} ${-s * 0.5} 0 Q ${-s * 0.4} ${-s * 0.5} 0 ${-s * 0.4} Q ${s * 0.5} ${-s * 0.5} ${s * 0.6} 0`}
            fill="none"
            stroke={theme.color}
            strokeWidth="2"
          />
          <circle cx={s * 0.3} cy={-s * 0.3} r={s * 0.08} fill={theme.color} />
          <circle cx={-s * 0.35} cy={s * 0.2} r={s * 0.06} fill={theme.color} />
          <circle cx={s * 0.1} cy={s * 0.35} r={s * 0.05} fill={theme.color} />
          <circle cx={-s * 0.2} cy={-s * 0.35} r={s * 0.07} fill={theme.color} />
        </g>
      );

    case "pollock":
      // Splatter / drip pattern
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <path d={`M ${-s * 0.6} ${-s * 0.3} Q ${-s * 0.2} ${-s * 0.5} ${s * 0.1} ${-s * 0.2} Q ${s * 0.4} 0 ${s * 0.6} ${-s * 0.4}`} fill="none" stroke={theme.color} strokeWidth="2" />
          <path d={`M ${-s * 0.5} ${s * 0.1} Q ${-s * 0.1} ${-s * 0.2} ${s * 0.3} ${s * 0.2} Q ${s * 0.5} ${s * 0.4} ${s * 0.6} ${s * 0.1}`} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <path d={`M ${-s * 0.3} ${s * 0.4} Q 0 ${s * 0.1} ${s * 0.2} ${s * 0.5}`} fill="none" stroke={theme.color} strokeWidth="2.5" />
          <path d={`M ${-s * 0.6} ${-s * 0.1} Q ${-s * 0.3} ${s * 0.3} 0 ${-s * 0.1} Q ${s * 0.3} ${-s * 0.5} ${s * 0.5} ${s * 0.3}`} fill="none" stroke={theme.color} strokeWidth="1" />
          {/* Drips */}
          <circle cx={-s * 0.2} cy={s * 0.15} r={s * 0.05} fill={theme.color} />
          <circle cx={s * 0.3} cy={-s * 0.1} r={s * 0.04} fill={theme.color} />
          <circle cx={-s * 0.4} cy={-s * 0.25} r={s * 0.03} fill={theme.color} />
          <circle cx={s * 0.15} cy={s * 0.35} r={s * 0.04} fill={theme.color} />
        </g>
      );

    case "campbell-soup":
      // Soup can silhouette
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <ellipse cx="0" cy={-s * 0.35} rx={s * 0.4} ry={s * 0.12} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <line x1={-s * 0.4} y1={-s * 0.35} x2={-s * 0.4} y2={s * 0.35} stroke={theme.color} strokeWidth="1.5" />
          <line x1={s * 0.4} y1={-s * 0.35} x2={s * 0.4} y2={s * 0.35} stroke={theme.color} strokeWidth="1.5" />
          <ellipse cx="0" cy={s * 0.35} rx={s * 0.4} ry={s * 0.12} fill="none" stroke={theme.color} strokeWidth="1.5" />
          {/* Label band */}
          <line x1={-s * 0.4} y1={0} x2={s * 0.4} y2={0} stroke={theme.color} strokeWidth="1" />
          <line x1={-s * 0.4} y1={s * 0.15} x2={s * 0.4} y2={s * 0.15} stroke={theme.color} strokeWidth="1" />
          {/* Fleur de lis hint */}
          <circle cx="0" cy={s * 0.075} r={s * 0.06} fill={theme.color} />
        </g>
      );

    case "mike-kelley":
      // Organic blob shapes (stuffed animals cluster)
      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <circle cx={-s * 0.2} cy={-s * 0.15} r={s * 0.2} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <circle cx={s * 0.15} cy={-s * 0.2} r={s * 0.18} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <circle cx={s * 0.3} cy={s * 0.1} r={s * 0.15} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <circle cx={-s * 0.1} cy={s * 0.2} r={s * 0.22} fill="none" stroke={theme.color} strokeWidth="1.5" />
          <circle cx={-s * 0.35} cy={s * 0.1} r={s * 0.13} fill="none" stroke={theme.color} strokeWidth="1.5" />
          {/* Connecting lines */}
          <line x1={-s * 0.3} y1={s * 0.35} x2={-s * 0.3} y2={s * 0.55} stroke={theme.color} strokeWidth="1" />
          <line x1={s * 0.1} y1={s * 0.35} x2={s * 0.1} y2={s * 0.55} stroke={theme.color} strokeWidth="1" />
          <line x1={s * 0.35} y1={s * 0.2} x2={s * 0.5} y2={s * 0.45} stroke={theme.color} strokeWidth="1" />
        </g>
      );

    default:
      return null;
  }
}

// Mini stamp for toast notifications and inline use
export function MiniStamp({ theme, size = 48 }: { theme: StampTheme; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center">
      <PassportStamp theme={theme} earned={true} size={size} showAnimation={false} />
    </div>
  );
}
