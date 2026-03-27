"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ConstellationEdge, ConstellationNode } from "@/lib/constellation";

interface Props {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: ConstellationNode) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

const NODE_RADIUS = {
  bookmarked_on_view: 41,
  related_archive: 18,
  hub: 16,
} as const;

const ROOT_NODE_GREEN = "#8DBE9F";
const RECOMMENDATION_BLUE = "#B8CCE4";

export default function ConstellationGraph({ nodes, edges, selectedNodeId, onSelectNode }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = useState({ width: 900, height: 620 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [smoothedTransform, setSmoothedTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const dragViewRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [hovered, setHovered] = useState<{ node: ConstellationNode; x: number; y: number } | null>(null);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const positions = useMemo(
    () => computeNodePositions(nodes, viewport.width, viewport.height),
    [nodes, viewport.width, viewport.height]
  );

  useEffect(() => {
    let raf = 0;
    const animate = () => {
      setSmoothedTransform((prev) => {
        const smoothing = 0.22;
        return {
          x: prev.x + (transform.x - prev.x) * smoothing,
          y: prev.y + (transform.y - prev.y) * smoothing,
          k: prev.k + (transform.k - prev.k) * smoothing,
        };
      });
      raf = window.requestAnimationFrame(animate);
    };
    raf = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(raf);
  }, [transform]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const preventWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const preventScroll = (event: TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    element.addEventListener("wheel", preventWheel, { passive: false });
    element.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      element.removeEventListener("wheel", preventWheel);
      element.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  const handleWheel: React.WheelEventHandler<SVGSVGElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextScale = Math.min(2.4, Math.max(0.55, transform.k + (event.deltaY > 0 ? -0.1 : 0.1)));
    setTransform((prev) => ({ ...prev, k: nextScale }));
  };

  const handleBackgroundPointerDown: React.PointerEventHandler<SVGSVGElement> = (event) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-node='true']")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setHovered(null);
    dragViewRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
  };

  const handleBackgroundPointerMove: React.PointerEventHandler<SVGSVGElement> = (event) => {
    if (!dragViewRef.current) return;
    const dx = event.clientX - dragViewRef.current.startX;
    const dy = event.clientY - dragViewRef.current.startY;
    setTransform((prev) => ({ ...prev, x: dragViewRef.current!.originX + dx, y: dragViewRef.current!.originY + dy }));
  };

  const handleBackgroundPointerUp: React.PointerEventHandler<SVGSVGElement> = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragViewRef.current = null;
  };

  const updateHoverPosition = (clientX: number, clientY: number, node: ConstellationNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered({
      node,
      x: Math.min(rect.width - 12, Math.max(12, clientX - rect.left + 14)),
      y: Math.min(rect.height - 12, Math.max(12, clientY - rect.top - 12)),
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-[radial-gradient(circle_at_20%_20%,rgba(228,0,43,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(100,116,255,0.08),transparent_24%),#ffffff]"
    >
      <svg
        ref={svgRef}
        role="img"
        aria-label="Interactive my collection graph of bookmarked and related artworks"
        className="h-full w-full touch-none overscroll-none"
        onWheel={handleWheel}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
      >
        <g transform={`translate(${smoothedTransform.x}, ${smoothedTransform.y}) scale(${smoothedTransform.k})`}>
          {edges.map((edge) => {
            const sourcePos = positions[edge.source];
            const targetPos = positions[edge.target];
            if (!sourcePos || !targetPos) return null;
            const sourceNode = nodeById.get(edge.source);
            const targetNode = nodeById.get(edge.target);
            const isRootLink =
              sourceNode?.kind === "bookmarked_on_view" || targetNode?.kind === "bookmarked_on_view";

            const cx = (sourcePos.x + targetPos.x) / 2;
            const cy = (sourcePos.y + targetPos.y) / 2 - 20;
            const d = `M${sourcePos.x},${sourcePos.y} Q${cx},${cy} ${targetPos.x},${targetPos.y}`;

            return (
                <path
                  key={edge.id}
                  d={d}
                  fill="none"
                  stroke={isRootLink ? "rgba(141,190,159,0.42)" : "rgba(184,204,228,0.55)"}
                  strokeWidth={Math.max(1, edge.weight * 2.4)}
                  strokeDasharray={isRootLink ? undefined : "2.5 5"}
                />
            );
          })}

          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const radius = NODE_RADIUS[node.kind];
            const isSelected = selectedNodeId === node.id;
            const isHovered = hovered?.node.id === node.id;
            const stroke = node.kind === "bookmarked_on_view" ? ROOT_NODE_GREEN : RECOMMENDATION_BLUE;
            const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
            const strokeWidth =
              node.kind === "bookmarked_on_view"
                ? isSelected
                  ? 4
                  : isHovered
                    ? 3.4
                  : 2.8
                : isSelected
                  ? 2.3
                  : isHovered
                    ? 2
                  : 1.3;

            return (
              <g
                key={node.id}
                data-node="true"
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onSelectNode(node)}
                style={{
                  filter:
                    node.kind === "bookmarked_on_view"
                      ? isHovered
                        ? "drop-shadow(0 0 16px rgba(141,190,159,0.62))"
                        : "drop-shadow(0 0 10px rgba(141,190,159,0.38))"
                      : isHovered
                        ? "drop-shadow(0 0 10px rgba(184,204,228,0.75))"
                        : "drop-shadow(0 0 2px rgba(184,204,228,0.42))",
                }}
                onPointerEnter={(event) => updateHoverPosition(event.clientX, event.clientY, node)}
                onPointerMove={(event) => updateHoverPosition(event.clientX, event.clientY, node)}
                onPointerLeave={() => setHovered((current) => (current?.node.id === node.id ? null : current))}
              >
                {node.kind === "bookmarked_on_view" ? (
                  <polygon
                    points={hexagonPoints(radius + (isSelected ? 5 : isHovered ? 3 : 0))}
                    fill="rgba(141,190,159,0.24)"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  <circle
                    r={radius + (isSelected ? 5 : isHovered ? 3 : 0)}
                    fill="rgba(184,204,228,0.18)"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                )}
                {node.thumbnailUrl ? (
                  <>
                    <defs>
                      <clipPath id={clipId}>
                        {node.kind === "bookmarked_on_view" ? <polygon points={hexagonPoints(radius - 3)} /> : <circle r={radius - 3} />}
                      </clipPath>
                    </defs>
                    <image
                      href={node.thumbnailUrl}
                      x={-radius + 3}
                      y={-radius + 3}
                      width={(radius - 3) * 2}
                      height={(radius - 3) * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#${clipId})`}
                    />
                  </>
                ) : (
                  <text textAnchor="middle" fontSize="7" fill="#475569">
                    {toNodePlaceholderLines(node.classification).map((line, index) => (
                      <tspan key={`${node.id}-line-${index}`} x={0} y={index === 0 ? -4 : index * 8 - 4}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
                <title>{`${node.label}${node.artist ? ` — ${node.artist}` : ""}`}</title>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute right-3 top-3 z-20 space-y-2">
        <GraphControl label="Zoom in" onClick={() => setTransform((prev) => ({ ...prev, k: Math.min(2.4, prev.k + 0.15) }))}>
          +
        </GraphControl>
        <GraphControl label="Zoom out" onClick={() => setTransform((prev) => ({ ...prev, k: Math.max(0.55, prev.k - 0.15) }))}>
          −
        </GraphControl>
        <GraphControl label="Reset view" onClick={() => setTransform({ x: 0, y: 0, k: 1 })}>
          ⟳
        </GraphControl>
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute z-30 max-w-[220px] -translate-y-full rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{ left: hovered.x, top: hovered.y }}
        >
          <p className="text-xs font-semibold leading-tight text-[var(--moma-black)]">{hovered.node.label}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-gray-600">{hovered.node.artist || "Unknown artist"}</p>
        </div>
      )}
    </div>
  );
}

function toNodePlaceholderLines(classification?: string): string[] {
  if (!classification) return ["Work"];
  const normalized = classification
    .replace(/[^a-zA-Z0-9\s&/-]/g, "")
    .trim();
  if (!normalized) return ["Work"];

  const knownAbbreviations: Record<string, string> = {
    "Illustrated Book": "Illus. Book",
    "Photograph": "Photo",
    "Gelatin silver print": "Gel. silver print",
    "Color photograph": "Color photo",
    "Lithograph": "Litho.",
    "Screenprint": "Screen pt.",
    "Offset lithograph": "Offset litho",
    "Oil on canvas": "Oil canvas",
    "Albumen print": "Albumen pt.",
    "Ink on paper": "Ink paper",
  };

  const abbreviated = knownAbbreviations[normalized] ?? abbreviateArtworkType(normalized);
  const words = abbreviated.split(/\s+/).filter(Boolean).slice(0, 3);

  if (words.length === 0) return ["Work"];
  if (words.length === 1) return [words[0]];
  if (words.length === 2) return [words[0], words[1]];
  return [words.slice(0, 2).join(" "), words[2]];
}

function clusterCenter(tag: string | undefined, width: number, height: number): { x: number; y: number } {
  if (!tag) {
    return { x: width / 2, y: height / 2 };
  }
  const hash = tag.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = Math.min(width, height) * 0.27;
  return {
    x: width / 2 + Math.cos(angle) * radius,
    y: height / 2 + Math.sin(angle) * radius,
  };
}

function computeNodePositions(
  nodes: ConstellationNode[],
  width: number,
  height: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const centerX = width / 2;
  const centerY = height / 2;
  const roots = nodes.filter((node) => node.kind === "bookmarked_on_view");
  const related = nodes.filter((node) => node.kind !== "bookmarked_on_view");

  const rootRadius = Math.min(width, height) * 0.31;
  roots.forEach((root, index) => {
    const angle = (index / Math.max(roots.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[root.id] = {
      x: centerX + Math.cos(angle) * rootRadius,
      y: centerY + Math.sin(angle) * rootRadius,
    };
  });

  const grouped = new Map<string, ConstellationNode[]>();
  for (const node of related) {
    const key = node.clusterTag || "misc";
    const bucket = grouped.get(key) ?? [];
    bucket.push(node);
    grouped.set(key, bucket);
  }

  for (const [tag, group] of grouped) {
    const tagCenter = clusterCenter(tag, width, height);
    group.forEach((node, index) => {
      const parent = node.relatedToId ? positions[node.relatedToId] : undefined;
      const anchor = parent ?? tagCenter;
      const hash = hashString(`${node.id}:${tag}`);
      const angle = ((hash % 360) * Math.PI) / 180;
      const ring = 34 + (index % 4) * 16;
      const drift = (Math.floor(hash / 360) % 3) * 10;
      positions[node.id] = {
        x: anchor.x + Math.cos(angle) * (ring + drift),
        y: anchor.y + Math.sin(angle) * (ring + drift),
      };
    });
  }

  resolveNodeCollisions(nodes, positions, width, height);
  return positions;
}

function resolveNodeCollisions(
  nodes: ConstellationNode[],
  positions: Record<string, { x: number; y: number }>,
  width: number,
  height: number
) {
  const placement = nodes.map((node) => ({
    node,
    pos: positions[node.id],
    radius: NODE_RADIUS[node.kind] + 6,
  }));
  if (placement.some((entry) => !entry.pos)) return;

  const minX = 12;
  const minY = 12;
  const maxX = Math.max(minX + 1, width - 12);
  const maxY = Math.max(minY + 1, height - 12);

  for (let pass = 0; pass < 30; pass += 1) {
    let moved = false;
    for (let i = 0; i < placement.length; i += 1) {
      const a = placement[i];
      if (!a.pos) continue;
      for (let j = i + 1; j < placement.length; j += 1) {
        const b = placement[j];
        if (!b.pos) continue;

        let dx = b.pos.x - a.pos.x;
        let dy = b.pos.y - a.pos.y;
        let distance = Math.hypot(dx, dy);
        const minDistance = a.radius + b.radius;

        if (distance < 0.001) {
          const nudge = (hashString(`${a.node.id}:${b.node.id}:${pass}`) % 360) * (Math.PI / 180);
          dx = Math.cos(nudge);
          dy = Math.sin(nudge);
          distance = 1;
        }

        if (distance >= minDistance) continue;

        const overlap = minDistance - distance;
        const ux = dx / distance;
        const uy = dy / distance;
        const shift = overlap / 2 + 0.5;

        a.pos.x -= ux * shift;
        a.pos.y -= uy * shift;
        b.pos.x += ux * shift;
        b.pos.y += uy * shift;
        moved = true;
      }
    }

    for (const entry of placement) {
      if (!entry.pos) continue;
      entry.pos.x = clamp(entry.pos.x, minX + entry.radius, maxX - entry.radius);
      entry.pos.y = clamp(entry.pos.y, minY + entry.radius, maxY - entry.radius);
    }

    if (!moved) break;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function abbreviateArtworkType(type: string): string {
  const shortWordMap: Record<string, string> = {
    illustrated: "Illus.",
    illustration: "Illus.",
    photograph: "Photo",
    photographic: "Photo",
    sculpture: "Sculpt.",
    drawing: "Draw.",
    painting: "Paint.",
    print: "Print",
    prints: "Prints",
    installation: "Install.",
    architecture: "Arch.",
    design: "Design",
    collage: "Collage",
    etching: "Etch.",
    lithograph: "Litho.",
    screenprint: "Screen pt.",
    book: "Book",
    poster: "Poster",
    textile: "Textile",
    video: "Video",
    film: "Film",
  };

  const words = type.split(/\s+/).filter(Boolean).slice(0, 3);
  return words
    .map((word) => {
      const cleaned = word.replace(/[^a-zA-Z0-9&/-]/g, "");
      if (!cleaned) return "";
      const mapped = shortWordMap[cleaned.toLowerCase()];
      if (mapped) return mapped;
      if (cleaned.length <= 8) return cleaned;
      return `${cleaned.slice(0, 5)}.`;
    })
    .filter(Boolean)
    .join(" ");
}

function hexagonPoints(radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
  }
  return points.join(" ");
}

function GraphControl({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-9 w-9 rounded-lg border border-gray-300 bg-white/90 text-lg font-semibold text-gray-800 backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--moma-red)]"
    >
      {children}
    </button>
  );
}
