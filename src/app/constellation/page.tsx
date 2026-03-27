"use client";

import { useEffect, useMemo, useState } from "react";

import ConstellationDetailPanel from "@/components/ConstellationDetailPanel";
import ConstellationGraph from "@/components/ConstellationGraph";
import ConstellationLegend from "@/components/ConstellationLegend";
import type { ConstellationNode, ConstellationResponse } from "@/lib/constellation";
import { useStore } from "@/store/useStore";

const INITIAL_MAX_NODES = 120;
const DEFAULT_SAVED_ARTWORK_ID = "starry-night";

export default function ConstellationPage() {
  const savedArtworks = useStore((state) => state.savedArtworks);
  const effectiveSavedArtworks = useMemo(
    () =>
      savedArtworks.length > 0
        ? savedArtworks
        : [DEFAULT_SAVED_ARTWORK_ID],
    [savedArtworks]
  );
  const [maxNodes, setMaxNodes] = useState(INITIAL_MAX_NODES);
  const [refreshTick, setRefreshTick] = useState(0);
  const [data, setData] = useState<ConstellationResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  const bookmarkParam = useMemo(() => effectiveSavedArtworks.join(","), [effectiveSavedArtworks]);
  const relatedNodesForSelection = useMemo(() => {
    if (!data || !selectedNode) return [];
    const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
    const connectedIds = new Set<string>();

    for (const edge of data.edges) {
      if (edge.source === selectedNode.id) connectedIds.add(edge.target);
      if (edge.target === selectedNode.id) connectedIds.add(edge.source);
    }

    return [...connectedIds]
      .map((id) => nodeById.get(id))
      .filter((node): node is ConstellationNode => Boolean(node));
  }, [data, selectedNode]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/constellation?bookmarks=${encodeURIComponent(bookmarkParam)}&maxNodes=${maxNodes}`,
          {
            signal: abortController.signal,
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to load constellation: ${response.status}`);
        }
        const payload = (await response.json()) as ConstellationResponse;
        setData(payload);
        setStatus("idle");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error(error);
        setStatus("error");
      }
    };

    load();
    return () => abortController.abort();
  }, [bookmarkParam, maxNodes, refreshTick]);

  useEffect(() => {
    if (!selectedNode || !data) return;
    const stillExists = data.nodes.some((node) => node.id === selectedNode.id);
    if (!stillExists) {
      setSelectedNode(null);
    }
  }, [data, selectedNode]);

  return (
    <section className="constellation-page relative h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] overflow-hidden px-3 pb-3 pt-3">
      <header className="mb-3 flex items-end justify-between px-2">
        <div>
          <h1 className="text-xl font-black text-[var(--moma-black)]">My Collection</h1>
          <p className="text-xs text-gray-600">Your saved art + archive discoveries</p>
        </div>
        <ConstellationLegend />
      </header>

      <div className="relative h-[calc(100%-58px)] max-h-[calc(100%-58px)] overflow-hidden">
        {status === "error" && (
          <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl border border-gray-200 bg-white/90 text-center text-[var(--moma-black)]">
            <div className="px-6">
              <p className="mb-2 text-lg font-semibold">Couldn&apos;t load your collection</p>
              <button
                onClick={() => setRefreshTick((value) => value + 1)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {data ? (
          <ConstellationGraph
            nodes={data.nodes}
            edges={data.edges}
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={(node) =>
              setSelectedNode((current) => (current?.id === node.id ? null : node))
            }
            onBackgroundClick={() => setSelectedNode(null)}
          />
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-gray-200 bg-white/85 text-sm text-gray-600">
            {status === "loading" ? "Loading your collection..." : "Preparing your collection..."}
          </div>
        )}

        {data?.meta.truncated && (
          <div className="absolute bottom-4 left-4 z-10">
            <button
              onClick={() => setMaxNodes((value) => Math.min(220, value + 40))}
              className="rounded-full border border-gray-300 bg-white/95 px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm hover:bg-white"
            >
              See more art
            </button>
          </div>
        )}
        <ConstellationDetailPanel
          selectedNode={selectedNode}
          relatedNodes={relatedNodesForSelection}
          onSelectRelatedNode={(node) => setSelectedNode(node)}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </section>
  );
}
