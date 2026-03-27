"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from "d3-force";

import type { ConstellationEdge, ConstellationNode } from "@/lib/constellation";

interface Props {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: ConstellationNode) => void;
}

interface GraphNode extends SimulationNodeDatum, ConstellationNode {}
interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
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

export default function ConstellationGraph({ nodes, edges, selectedNodeId, onSelectNode }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [smoothedTransform, setSmoothedTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const didDragRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragViewRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  const graph = useMemo(() => {
    const graphNodes: GraphNode[] = nodes.map((node, index) => ({
      ...node,
      x: index * 10,
      y: index * 6,
      vx: 0,
      vy: 0,
    }));

    const graphLinks: GraphLink[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    }));

    return { graphNodes, graphLinks };
  }, [nodes, edges]);

  useEffect(() => {
    if (!svgRef.current || graph.graphNodes.length === 0) return;

    const { width, height } = svgRef.current.getBoundingClientRect();
    const simulation = forceSimulation(graph.graphNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(graph.graphLinks)
          .id((d) => d.id)
          .distance((d) => 148 - d.weight * 30)
          .strength((d) => 0.14 + d.weight * 0.22)
      )
      .force(
        "charge",
        forceManyBody<GraphNode>().strength((node) =>
          node.kind === "bookmarked_on_view" ? -280 : -120
        )
      )
      .force(
        "root-ring",
        forceRadial<GraphNode>(
          (node) => (node.kind === "bookmarked_on_view" ? Math.min(width, height) * 0.3 : 0),
          width / 2,
          height / 2
        ).strength((node) => (node.kind === "bookmarked_on_view" ? 0.22 : 0))
      )
      .force(
        "tag-cluster-x",
        forceX<GraphNode>((node) => clusterCenter(node.clusterTag, width, height).x).strength((node) =>
          node.kind === "related_archive" ? 0.06 : 0
        )
      )
      .force(
        "tag-cluster-y",
        forceY<GraphNode>((node) => clusterCenter(node.clusterTag, width, height).y).strength((node) =>
          node.kind === "related_archive" ? 0.06 : 0
        )
      )
      .force("collision", forceCollide<GraphNode>().radius((node) => NODE_RADIUS[node.kind] + 12).strength(0.9))
      .force("center", forceCenter(width / 2, height / 2))
      .alpha(1);

    simulationRef.current = simulation;

    let frame = 0;
    simulation.on("tick", () => {
      frame += 1;
      if (frame % 2 !== 0) return;
      const next: Record<string, { x: number; y: number }> = {};
      for (const node of graph.graphNodes) {
        if (typeof node.x === "number" && typeof node.y === "number") {
          next[node.id] = { x: node.x, y: node.y };
        }
      }
      setPositions(next);
    });

    const stopTimer = window.setTimeout(() => {
      setIsAnimating(false);
      simulation.alphaTarget(0);
    }, 1800);

    return () => {
      window.clearTimeout(stopTimer);
      simulation.stop();
    };
  }, [graph]);

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
    const handleResize = () => {
      if (!svgRef.current || !simulationRef.current) return;
      const { width, height } = svgRef.current.getBoundingClientRect();
      simulationRef.current.force("center", forceCenter(width / 2, height / 2));
      simulationRef.current.alpha(0.4).restart();
      setIsAnimating(true);
      window.setTimeout(() => setIsAnimating(false), 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDraggingRef = useRef(false);
  useEffect(() => { isDraggingRef.current = draggingId !== null || dragViewRef.current !== null; });

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const preventScroll = (event: TouchEvent) => {
      // Always prevent during active node drag or pan; prevent single-touch otherwise
      // to avoid accidental page bounce while interacting with the graph
      if (isDraggingRef.current || event.touches.length === 1) {
        event.preventDefault();
      }
    };
    element.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      element.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  const handleWheel: React.WheelEventHandler<SVGSVGElement> = (event) => {
    event.preventDefault();
    const nextScale = Math.min(2.4, Math.max(0.55, transform.k + (event.deltaY > 0 ? -0.1 : 0.1)));
    setTransform((prev) => ({ ...prev, k: nextScale }));
  };

  const handleBackgroundPointerDown: React.PointerEventHandler<SVGSVGElement> = (event) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-node='true']")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
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

  const setNodeFixedPosition = (nodeId: string, x: number, y: number) => {
    const sim = simulationRef.current;
    if (!sim) return;
    const node = sim.nodes().find((item) => item.id === nodeId);
    if (!node) return;
    node.fx = x;
    node.fy = y;
    sim.alpha(0.5).restart();
  };

  const releaseNodeFixedPosition = (nodeId: string) => {
    const sim = simulationRef.current;
    if (!sim) return;
    const node = sim.nodes().find((item) => item.id === nodeId);
    if (!node) return;
    node.fx = null;
    node.fy = null;
    sim.alpha(0.25).restart();
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-[radial-gradient(circle_at_20%_20%,rgba(228,0,43,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(100,116,255,0.08),transparent_24%),#ffffff]">
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
          {graph.graphLinks.map((edge) => {
            const sourceId = typeof edge.source === "string" ? edge.source : edge.source.id;
            const targetId = typeof edge.target === "string" ? edge.target : edge.target.id;
            const sourcePos = positions[sourceId];
            const targetPos = positions[targetId];
            if (!sourcePos || !targetPos) return null;
            const sourceNode = typeof edge.source === "string" ? graph.graphNodes.find((node) => node.id === edge.source) : edge.source;
            const targetNode = typeof edge.target === "string" ? graph.graphNodes.find((node) => node.id === edge.target) : edge.target;
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
                stroke={isRootLink ? "rgba(228,0,43,0.35)" : "rgba(15,23,42,0.24)"}
                strokeWidth={Math.max(1, edge.weight * 2.4)}
                strokeDasharray={isRootLink ? undefined : "2.5 5"}
                className={isAnimating && isRootLink ? "constellation-edge-animate" : undefined}
              />
            );
          })}

          {graph.graphNodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const radius = NODE_RADIUS[node.kind];
            const isSelected = selectedNodeId === node.id;
            const stroke = node.kind === "bookmarked_on_view" ? "var(--moma-red)" : "rgba(51,65,85,0.9)";
            const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
            const strokeWidth =
              node.kind === "bookmarked_on_view"
                ? isSelected
                  ? 4
                  : 2.8
                : isSelected
                  ? 2.3
                  : 1.3;

            return (
              <g
                key={node.id}
                data-node="true"
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => {
                  if (!didDragRef.current) onSelectNode(node);
                }}
                style={{
                  filter:
                    node.kind === "bookmarked_on_view"
                      ? "drop-shadow(0 0 10px rgba(228,0,43,0.35))"
                      : "drop-shadow(0 0 2px rgba(15,23,42,0.15))",
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  svgRef.current?.setPointerCapture(event.pointerId);
                  didDragRef.current = false;
                  dragStartRef.current = { x: event.clientX, y: event.clientY };
                  setDraggingId(node.id);
                  setNodeFixedPosition(node.id, pos.x, pos.y);
                }}
                onPointerMove={(event) => {
                  if (draggingId !== node.id) return;
                  event.stopPropagation();
                  if (!didDragRef.current && dragStartRef.current) {
                    const dx = event.clientX - dragStartRef.current.x;
                    const dy = event.clientY - dragStartRef.current.y;
                    if (dx * dx + dy * dy < 25) return; // 5px threshold
                    didDragRef.current = true;
                  }
                  const svg = svgRef.current;
                  if (!svg) return;
                  const ctm = svg.getScreenCTM();
                  if (!ctm) return;
                  const transformed = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
                  const translatedX = (transformed.x - smoothedTransform.x) / smoothedTransform.k;
                  const translatedY = (transformed.y - smoothedTransform.y) / smoothedTransform.k;
                  setNodeFixedPosition(node.id, translatedX, translatedY);
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  if (svgRef.current?.hasPointerCapture(event.pointerId)) {
                    svgRef.current.releasePointerCapture(event.pointerId);
                  }
                  releaseNodeFixedPosition(node.id);
                  dragStartRef.current = null;
                  setDraggingId(null);
                }}
              >
                {node.kind === "bookmarked_on_view" ? (
                  <polygon
                    points={hexagonPoints(radius + (isSelected ? 5 : 0))}
                    fill="rgba(228,0,43,0.22)"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  <circle
                    r={radius + (isSelected ? 5 : 0)}
                    fill="rgba(255,255,255,0.95)"
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
                <title>{node.label}</title>
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
