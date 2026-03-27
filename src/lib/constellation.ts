export type ConstellationNodeKind = "bookmarked_on_view" | "related_archive" | "hub";
export type ConstellationNodeSource = "curated" | "db" | "api";

export interface CuratedArtwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  gallery: string;
  floor: number;
  department: string;
  classification: string;
  thumbnail: string;
  description: string;
  tags: string[];
  popularity: number;
}

export interface ArchiveArtworkCandidate {
  objectId: number;
  title: string;
  artist: string;
  date: string;
  department: string;
  classification: string;
  medium: string;
  imageUrl?: string | null;
  momaUrl?: string | null;
  onViewText?: string | null;
}

export interface ConstellationNode {
  id: string;
  label: string;
  kind: ConstellationNodeKind;
  source: ConstellationNodeSource;
  imageUrl?: string;
  momaUrl?: string;
  artist?: string;
  date?: string;
  department?: string;
  classification?: string;
  onView?: boolean | null;
  score?: number;
  reasons?: string[];
  relatedToId?: string;
  relatedToLabel?: string;
  relationSummary?: string;
  curatedId?: string;
  objectId?: number;
}

export interface ConstellationEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  reason: string;
}

export interface ConstellationResponse {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  meta: {
    bookmarkCount: number;
    relatedCount: number;
    truncated: boolean;
    dataSources: string[];
  };
}

export interface RelationshipScoreBreakdown {
  score: number;
  artistScore: number;
  tagScore: number;
  departmentScore: number;
  eraScore: number;
  reasons: string[];
}

const REASON_LABELS: Record<string, string> = {
  same_artist: "same artist",
  style_overlap: "style/tag overlap",
  same_department: "same department",
  era_close: "same era",
  era_related: "nearby era",
};

export const RELATIONSHIP_WEIGHTS = {
  artist: 0.4,
  tags: 0.25,
  department: 0.2,
  era: 0.15,
} as const;

const TAG_HINTS: Record<string, string[]> = {
  "post-impressionism": ["post impressionism", "impressionism"],
  cubism: ["cubism", "cubist"],
  surrealism: ["surrealism", "surreal"],
  "pop-art": ["pop art", "pop"],
  "still-life": ["still life"],
  landscape: ["landscape", "nature", "view"],
  figurative: ["figurative", "portrait", "figure"],
  portrait: ["portrait", "figure"],
  iconoclasm: ["iconoclasm"],
  iconic: ["iconic", "masterpiece"],
  minimalism: ["minimalism", "minimalist", "minimal"],
  abstraction: ["abstraction", "abstract"],
  "abstract-expressionism": ["abstract expressionism", "expressionism"],
  "color-field": ["color field", "colour field"],
  modernism: ["modernism", "modern"],
};

export function normalizeText(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractYear(input?: string | null): number | null {
  if (!input) {
    return null;
  }

  const match = input.match(/(1[6-9]\d{2}|20\d{2})/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[0], 10);
  return Number.isFinite(year) ? year : null;
}

export function eraProximityScore(
  anchorYear: number | null,
  candidateYear: number | null,
  window = 20
): number {
  if (!anchorYear || !candidateYear) {
    return 0;
  }

  const delta = Math.abs(anchorYear - candidateYear);
  if (delta > window) {
    return 0;
  }

  return Number((1 - delta / window).toFixed(4));
}

function getTagHints(tag: string): string[] {
  const normalized = normalizeText(tag).replace(/-/g, " ");
  const mapped = TAG_HINTS[normalized.replace(/\s+/g, "-")] ?? [];
  return [...new Set([normalized, ...mapped].map((hint) => normalizeText(hint)).filter(Boolean))];
}

function calculateTagScore(tags: string[], candidate: ArchiveArtworkCandidate): number {
  if (tags.length === 0) {
    return 0;
  }

  const searchable = normalizeText(
    [candidate.classification, candidate.department, candidate.medium, candidate.title]
      .filter(Boolean)
      .join(" ")
  );

  if (!searchable) {
    return 0;
  }

  let matched = 0;
  for (const tag of tags) {
    const hints = getTagHints(tag);
    if (hints.some((hint) => searchable.includes(hint))) {
      matched += 1;
    }
  }

  return Number(Math.min(1, matched / Math.max(tags.length, 1)).toFixed(4));
}

export function scoreRelatedArtwork(
  anchor: CuratedArtwork,
  candidate: ArchiveArtworkCandidate
): RelationshipScoreBreakdown {
  const anchorArtist = normalizeText(anchor.artist);
  const candidateArtist = normalizeText(candidate.artist);
  const sameArtist = Boolean(anchorArtist && candidateArtist && anchorArtist === candidateArtist);
  const artistScore = sameArtist ? 1 : 0;

  const tagScore = calculateTagScore(anchor.tags, candidate);

  const sameDepartment =
    normalizeText(anchor.department) !== "" &&
    normalizeText(anchor.department) === normalizeText(candidate.department);
  const departmentScore = sameDepartment ? 1 : 0;

  const eraScore = eraProximityScore(extractYear(anchor.year), extractYear(candidate.date), 20);

  const score = Number(
    (
      artistScore * RELATIONSHIP_WEIGHTS.artist +
      tagScore * RELATIONSHIP_WEIGHTS.tags +
      departmentScore * RELATIONSHIP_WEIGHTS.department +
      eraScore * RELATIONSHIP_WEIGHTS.era
    ).toFixed(4)
  );

  const reasons: string[] = [];
  if (artistScore > 0) reasons.push("same_artist");
  if (tagScore > 0) reasons.push("style_overlap");
  if (departmentScore > 0) reasons.push("same_department");
  if (eraScore >= 0.5) reasons.push("era_close");
  else if (eraScore > 0) reasons.push("era_related");

  return {
    score,
    artistScore,
    tagScore,
    departmentScore,
    eraScore,
    reasons,
  };
}

export function toAnchorNode(artwork: CuratedArtwork): ConstellationNode {
  return {
    id: artwork.id,
    curatedId: artwork.id,
    label: artwork.title,
    kind: "bookmarked_on_view",
    source: "curated",
    imageUrl: artwork.thumbnail,
    artist: artwork.artist,
    date: artwork.year,
    department: artwork.department,
    classification: artwork.classification,
    onView: true,
  };
}

export function toRelatedNode(
  candidate: ArchiveArtworkCandidate,
  score: number,
  reasons: string[],
  relation?: { anchorId: string; anchorLabel: string }
): ConstellationNode {
  const onView = normalizeText(candidate.onViewText) ? true : false;

  return {
    id: `db:${candidate.objectId}`,
    objectId: candidate.objectId,
    label: candidate.title || "Untitled",
    kind: "related_archive",
    source: "db",
    imageUrl: candidate.imageUrl || undefined,
    momaUrl: candidate.momaUrl || undefined,
    artist: candidate.artist || undefined,
    date: candidate.date || undefined,
    department: candidate.department || undefined,
    classification: candidate.classification || undefined,
    onView,
    score,
    reasons,
    relatedToId: relation?.anchorId,
    relatedToLabel: relation?.anchorLabel,
    relationSummary: buildRelationSummary(reasons),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function humanizeReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}

export function buildRelationSummary(reasons: string[]): string {
  if (!reasons.length) {
    return "its themes and time period are close to what you liked";
  }
  return reasons.map(humanizeReason).join(", ");
}
