import { NextRequest, NextResponse } from "next/server";

import artworks from "@/data/artworks.json";
import {
  clamp,
  inferClusterTag,
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
const ANCHOR_CHILDREN = 2;
const CHILDREN_PER_RELATED_NODE = 2;
const MAX_HOPS = 3;
const ROOT_RELATION_THRESHOLD = 0.32;
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

  const candidates = nodes
    .filter(
      (node) =>
        node.source === "db" &&
        node.objectId &&
        (!node.fullImageUrl || !node.thumbnailUrl || !node.momaUrl || !node.date || !node.department || !node.classification)
    )
    .slice(0, 8);
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
        const primaryImage = (payload.PrimaryImage as string) || undefined;
        enrichedById.set(node.id, {
          source: node.source,
          thumbnailUrl: node.thumbnailUrl || primaryImage,
          fullImageUrl: node.fullImageUrl || primaryImage,
          momaUrl: node.momaUrl || (payload.URL as string) || undefined,
          date: node.date || (payload.Date as string) || undefined,
          department: node.department || (payload.Department as string) || undefined,
          classification: node.classification || (payload.Classification as string) || undefined,
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
  const nodesById = new Map(anchorNodes.map((node) => [node.id, node]));
  const edges: ConstellationEdge[] = [];

  const curatedIdentityKeys = new Set(
    (artworks as CuratedArtwork[]).map((art) => `${normalizeText(art.artist)}|${normalizeText(art.title)}`)
  );
  const queue: Array<{
    parentNodeId: string;
    parentLabel: string;
    anchor: CuratedArtwork;
    depth: number;
  }> = anchors.map((anchor) => ({
    parentNodeId: anchor.id,
    parentLabel: anchor.title,
    anchor,
    depth: 0,
  }));

  let truncated = false;

  while (queue.length > 0 && nodesById.size < maxNodes) {
    const current = queue.shift();
    if (!current) break;

    const excludedKeys = new Set(curatedIdentityKeys);
    for (const existingNode of nodesById.values()) {
      excludedKeys.add(`${normalizeText(existingNode.artist)}|${normalizeText(existingNode.label)}`);
    }

    const candidatePool = await fetchCandidatePool(current.anchor, excludedKeys);
    const scored = candidatePool
      .map((candidate) => ({
        candidate,
        rel: scoreRelatedArtwork(current.anchor, candidate),
      }))
      .filter(({ rel }) => rel.score > 0)
      .sort((a, b) => b.rel.score - a.rel.score);

    const childLimit = current.depth === 0 ? ANCHOR_CHILDREN : CHILDREN_PER_RELATED_NODE;
    let addedChildren = 0;

    for (const item of scored) {
      if (nodesById.size >= maxNodes) {
        truncated = true;
        break;
      }

      if (addedChildren >= childLimit) {
        break;
      }

      const node = toRelatedNode(item.candidate, item.rel.score, item.rel.reasons, {
        anchorId: current.parentNodeId,
        anchorLabel: current.parentLabel,
        clusterTag: inferClusterTag(current.anchor.tags, item.candidate),
      });

      if (nodesById.has(node.id)) {
        continue;
      }

      nodesById.set(node.id, node);
      edges.push({
        id: `${current.parentNodeId}->${node.id}`,
        source: current.parentNodeId,
        target: node.id,
        weight: clamp(node.score ?? 0.1, 0.05, 1),
        reason: item.rel.reasons[0] ?? "related",
      });
      addedChildren += 1;

      if (current.depth + 1 < MAX_HOPS) {
        queue.push({
          parentNodeId: node.id,
          parentLabel: node.label,
          depth: current.depth + 1,
          anchor: toJourneyAnchor(node),
        });
      }
    }

    if (scored.length > childLimit) {
      truncated = true;
    }
  }

  for (let index = 0; index < anchors.length; index += 1) {
    for (let inner = index + 1; inner < anchors.length; inner += 1) {
      const left = anchors[index];
      const right = anchors[inner];
      const relevance = scoreAnchorToAnchor(left, right);
      if (relevance.score < ROOT_RELATION_THRESHOLD) {
        continue;
      }
      edges.push({
        id: `${left.id}<->${right.id}`,
        source: left.id,
        target: right.id,
        weight: clamp(relevance.score, 0.05, 1),
        reason: relevance.reason,
      });
    }
  }

  return {
    nodes: [...nodesById.values()],
    edges,
    truncated,
  };
}

function scoreAnchorToAnchor(
  left: CuratedArtwork,
  right: CuratedArtwork
): { score: number; reason: string } {
  const sameArtist = normalizeText(left.artist) === normalizeText(right.artist);
  const sameDepartment = normalizeText(left.department) === normalizeText(right.department);
  const sharedTags = left.tags.filter((tag) => right.tags.includes(tag)).length;
  const hasExplicitRelation = sameArtist || sameDepartment || sharedTags > 0;
  if (!hasExplicitRelation) {
    return { score: 0, reason: "related" };
  }

  const tagScore = Math.min(1, sharedTags / Math.max(1, Math.min(left.tags.length, right.tags.length)));

  const yearA = Number.parseInt((left.year.match(/\d{4}/) || [])[0] ?? "", 10);
  const yearB = Number.parseInt((right.year.match(/\d{4}/) || [])[0] ?? "", 10);
  const eraScore =
    Number.isFinite(yearA) && Number.isFinite(yearB)
      ? Math.max(0, 1 - Math.abs(yearA - yearB) / 30)
      : 0;

  const score = clamp(
    (sameArtist ? 0.45 : 0) + (sameDepartment ? 0.25 : 0) + tagScore * 0.2 + eraScore * 0.1,
    0,
    1
  );

  if (sameArtist) return { score, reason: "same_artist" };
  if (sharedTags > 0) return { score, reason: "style_overlap" };
  if (sameDepartment) return { score, reason: "same_department" };
  if (eraScore > 0.5) return { score, reason: "era_close" };
  return { score, reason: "related" };
}

function toJourneyAnchor(node: ConstellationNode): CuratedArtwork {
  return {
    id: node.id,
    title: node.label,
    artist: node.artist ?? "",
    year: node.date ?? "",
    medium: "",
    dimensions: "",
    gallery: "",
    floor: 0,
    department: node.department ?? "",
    classification: node.classification ?? "",
    thumbnail: node.thumbnailUrl ?? "",
    description: "",
    tags: [node.classification ?? "", node.department ?? ""]
      .flatMap((value) => value.split(/[,\s]+/g))
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 2)
      .slice(0, 6),
    popularity: 50,
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
