import { NextRequest, NextResponse } from "next/server";

import artworks from "@/data/artworks.json";
import {
  clamp,
  normalizeText,
  scoreRelatedArtwork,
  toAnchorNode,
  toRelatedNode,
  type ConstellationEdge,
  type ConstellationNode,
  type ConstellationResponse,
  type CuratedArtwork,
} from "@/lib/constellation";
import { fetchCandidatePool } from "@/lib/constellation-db";

export const runtime = "nodejs";

const DEFAULT_MAX_NODES = 120;
const MAX_MAX_NODES = 220;
const RELATED_PER_ANCHOR_LIMIT = 14;
const CACHE_TTL_MS = 1000 * 60 * 2;

interface CacheEntry {
  createdAt: number;
  payload: ConstellationResponse;
}

const memoryCache = new Map<string, CacheEntry>();

function parseBookmarkIds(input: string | null): string[] {
  if (!input) return [];
  return [...new Set(input.split(",").map((id) => id.trim()).filter(Boolean))];
}

function cacheKey(bookmarks: string[], maxNodes: number): string {
  return `${bookmarks.sort().join("|")}::${maxNodes}`;
}

function getCached(key: string): ConstellationResponse | null {
  const found = memoryCache.get(key);
  if (!found) return null;
  if (Date.now() - found.createdAt > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return found.payload;
}

function setCached(key: string, payload: ConstellationResponse) {
  memoryCache.set(key, { createdAt: Date.now(), payload });
}

async function enrichWithMomaApi(nodes: ConstellationNode[]): Promise<{ nodes: ConstellationNode[]; used: boolean }> {
  const token = process.env.NEXT_PUBLIC_MOMA_API_TOKEN;
  if (!token) {
    return { nodes, used: false };
  }

  const candidates = nodes.filter((node) => node.source === "db" && node.objectId).slice(0, 8);
  if (candidates.length === 0) {
    return { nodes, used: false };
  }

  const enrichedById = new Map<string, Partial<ConstellationNode>>();

  await Promise.all(
    candidates.map(async (node) => {
      const objectId = node.objectId;
      if (!objectId) return;

      const endpoint = `https://api.moma.org/api/objects/${objectId}?token=${encodeURIComponent(token)}`;
      try {
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as Record<string, unknown>;
        enrichedById.set(node.id, {
          source: "api",
          imageUrl: (payload.PrimaryImage as string) || node.imageUrl,
          momaUrl: (payload.URL as string) || node.momaUrl,
          date: (payload.Date as string) || node.date,
          department: (payload.Department as string) || node.department,
          classification: (payload.Classification as string) || node.classification,
        });
      } catch (error) {
        console.warn("[constellation] API enrichment failed for object", objectId, error);
      }
    })
  );

  if (enrichedById.size === 0) {
    return { nodes, used: false };
  }

  return {
    nodes: nodes.map((node) => ({ ...node, ...(enrichedById.get(node.id) ?? {}) })),
    used: true,
  };
}

async function buildGraph(
  bookmarkIds: string[],
  maxNodes: number
): Promise<{ nodes: ConstellationNode[]; edges: ConstellationEdge[]; truncated: boolean }> {
  const curatedById = new Map((artworks as CuratedArtwork[]).map((art) => [art.id, art]));
  const anchors = bookmarkIds
    .map((id) => curatedById.get(id))
    .filter((art): art is CuratedArtwork => Boolean(art));

  const anchorNodes = anchors.map(toAnchorNode);
  const edges: ConstellationEdge[] = [];

  const curatedIdentityKeys = new Set(
    (artworks as CuratedArtwork[]).map((art) => `${normalizeText(art.artist)}|${normalizeText(art.title)}`)
  );

  const relatedById = new Map<string, ConstellationNode>();
  const bestScoreById = new Map<string, number>();
  const bestAnchorById = new Map<string, { anchorId: string; reasons: string[] }>();

  for (const anchor of anchors) {
    const candidatePool = await fetchCandidatePool(anchor, curatedIdentityKeys);
    const scored = candidatePool
      .map((candidate) => ({
        candidate,
        rel: scoreRelatedArtwork(anchor, candidate),
      }))
      .filter(({ rel }) => rel.score > 0)
      .sort((a, b) => b.rel.score - a.rel.score)
      .slice(0, RELATED_PER_ANCHOR_LIMIT);

    for (const item of scored) {
      const node = toRelatedNode(item.candidate, item.rel.score, item.rel.reasons, {
        anchorId: anchor.id,
        anchorLabel: anchor.title,
      });
      const currentBest = bestScoreById.get(node.id) ?? -1;
      if (item.rel.score > currentBest) {
        relatedById.set(node.id, node);
        bestScoreById.set(node.id, item.rel.score);
        bestAnchorById.set(node.id, { anchorId: anchor.id, reasons: item.rel.reasons });
      }
    }
  }

  const relatedNodes = [...relatedById.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const capacity = Math.max(0, maxNodes - anchorNodes.length);
  const selectedRelated = relatedNodes.slice(0, capacity);
  const selectedRelatedIds = new Set(selectedRelated.map((node) => node.id));

  for (const node of selectedRelated) {
    const best = bestAnchorById.get(node.id);
    if (!best || !selectedRelatedIds.has(node.id)) continue;
    edges.push({
      id: `${best.anchorId}->${node.id}`,
      source: best.anchorId,
      target: node.id,
      weight: clamp(node.score ?? 0.1, 0.05, 1),
      reason: best.reasons[0] ?? "related",
    });
  }

  for (let index = 1; index < anchorNodes.length; index += 1) {
    const prev = anchorNodes[index - 1];
    const current = anchorNodes[index];
    edges.push({
      id: `${prev.id}<->${current.id}`,
      source: prev.id,
      target: current.id,
      weight: 0.35,
      reason: "bookmarked_cluster",
    });
  }

  const truncated = relatedNodes.length > selectedRelated.length;
  return {
    nodes: [...anchorNodes, ...selectedRelated],
    edges,
    truncated,
  };
}

export async function GET(request: NextRequest) {
  const bookmarks = parseBookmarkIds(request.nextUrl.searchParams.get("bookmarks"));
  const maxNodesRaw = Number.parseInt(request.nextUrl.searchParams.get("maxNodes") ?? "", 10);
  const maxNodes = Number.isFinite(maxNodesRaw)
    ? clamp(maxNodesRaw, 20, MAX_MAX_NODES)
    : DEFAULT_MAX_NODES;

  if (bookmarks.length === 0) {
    const empty: ConstellationResponse = {
      nodes: [],
      edges: [],
      meta: {
        bookmarkCount: 0,
        relatedCount: 0,
        truncated: false,
        dataSources: ["curated"],
      },
    };
    return NextResponse.json(empty);
  }

  const key = cacheKey(bookmarks, maxNodes);
  const cached = getCached(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  const graph = await buildGraph(bookmarks, maxNodes);
  const enrichment = await enrichWithMomaApi(graph.nodes);

  const response: ConstellationResponse = {
    nodes: enrichment.nodes,
    edges: graph.edges,
    meta: {
      bookmarkCount: bookmarks.length,
      relatedCount: enrichment.nodes.filter((node) => node.kind === "related_archive").length,
      truncated: graph.truncated,
      dataSources: enrichment.used ? ["curated", "db", "api"] : ["curated", "db"],
    },
  };

  setCached(key, response);

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, max-age=60",
    },
  });
}
