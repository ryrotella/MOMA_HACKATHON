"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ConstellationDetailPanel from "@/components/ConstellationDetailPanel";
import ConstellationGraph from "@/components/ConstellationGraph";
import ConstellationLegend from "@/components/ConstellationLegend";
import type { ConstellationNode, ConstellationResponse } from "@/lib/constellation";
import { useStore } from "@/store/useStore";

const INITIAL_MAX_NODES = 120;

export default function ConstellationPage() {
  const bookmarks = useStore((state) => state.bookmarks);
  const [maxNodes, setMaxNodes] = useState(INITIAL_MAX_NODES);
  const [refreshTick, setRefreshTick] = useState(0);
  const [data, setData] = useState<ConstellationResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  const bookmarkParam = useMemo(() => bookmarks.join(","), [bookmarks]);

  useEffect(() => {
    if (bookmarks.length === 0) {
      setData(null);
      setSelectedNode(null);
      return;
    }

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
  }, [bookmarkParam, bookmarks.length, maxNodes, refreshTick]);

  useEffect(() => {
    if (!selectedNode || !data) return;
    const stillExists = data.nodes.some((node) => node.id === selectedNode.id);
    if (!stillExists) {
      setSelectedNode(null);
    }
  }, [data, selectedNode]);

  if (bookmarks.length === 0) {
    return (
      <section className="constellation-page min-h-screen px-5 py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white/90 p-6 text-center text-[var(--moma-black)] shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-4xl" aria-hidden>
            ☆
          </p>
          <h1 className="mb-2 text-2xl font-black">Build your collection</h1>
          <p className="mb-5 text-sm text-gray-600">
            Bookmark artworks on the map, then explore related works from MoMA&apos;s wider archive.
          </p>
          <Link
            href="/map"
            className="inline-flex rounded-xl bg-[var(--moma-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c80025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--moma-red)]"
          >
            Go to map
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="constellation-page relative h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] overflow-hidden px-3 pb-3 pt-3">
      <header className="mb-3 flex items-end justify-between px-2">
        <div>
          <h1 className="text-xl font-black text-[var(--moma-black)]">My Collection</h1>
          <p className="text-xs text-gray-600">Your bookmarks + archive discoveries</p>
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
            onSelectNode={(node) => setSelectedNode(node)}
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
        <ConstellationDetailPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
    </section>
  );
}
