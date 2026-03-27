# GPT-5.3-Codex Implementation Prompt: MoMA Constellation View

You are GPT-5.3-Codex working inside the `MOMA_HACKATHON` Next.js app.

Build a new **Constellation** experience in this app, matching existing visual language and UX quality, while extending discovery beyond on-view works.

## Product Goal

Create a new `/constellation` view that:

1. Visualizes the user’s **bookmarked artworks** as anchor nodes.
2. Expands each bookmark with **related artworks** from MoMA’s broader archive (not currently on view when possible).
3. Uses a **force-directed graph with physics** (pannable + zoomable).
4. Opens a **bottom detail panel** on node select, populated from local DB and API.
5. Encourages continued engagement with the collection after a museum visit.

Inspiration references:

- Meow Wolf Convergence Station constellation/recollection UI (dark space, floating connected circles, bottom sheet details).
- MoMA.org visual language (typography clarity, restrained palette, strong hierarchy).
- MoMA `sol` design principles (atomic, utility-first, simple elements used consistently).

Do not copy proprietary visuals directly; reinterpret into this app’s current style.

---

## Required Design Language

Use and extend the app’s existing style:

- Palette: `--moma-black`, `--moma-red`, white/gray neutrals already in `globals.css`.
- Type: existing app typography patterns and spacing.
- UI behavior: mobile-first, clear CTAs, smooth animation, readable hierarchy.

Constellation styling constraints:

- Background: dark/space-like (subtle stars/noise/gradient), but keep text contrast AA+.
- Node thumbnails: circular, clean border, subtle glow.
- Edges: curved lines, low visual noise, animated only when helpful.
- Motion: smooth and intentional; no chaotic jitter.

---

## Current App Context (Do Not Re-Discover, Use This)

Framework + stack:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Zustand (`src/store/useStore.ts`)
- framer-motion
- Existing routes: `/`, `/map`, `/artwork/[id]`, `/wrapped`, `/api/moma`
- Existing bottom nav in `src/components/BottomNav.tsx`

Key current data:

- `src/data/artworks.json`: 57 curated artworks with fields including `id`, `title`, `artist`, `year`, `gallery`, `floor`, `thumbnail`, `tags`, `popularity`.
- `src/data/galleries.json`: floor/gallery map geometry.
- Bookmarks persisted in Zustand/localStorage (`moma-explorer-storage`).

Available archive database submodule (already added):

- `_db_moma-collection` (git submodule)
- SQLite DB path (project-local): `_db_moma-collection/moma_full.db`
- Tables: `artworks`, `artists`
- `artworks` has ~160k rows and fields including `ObjectID`, `Title`, `Artist`, `Date`, `Department`, `Classification`, `ImageURL`, `URL`, `OnView`.

Also integrate MoMA API when useful:

- Existing proxy route: `src/app/api/moma/route.ts`
- Token may be missing/expired; ensure graceful fallback to DB-only enrichment.

---

## Core Interaction Requirements

### 1) Constellation Graph

Implement a force-directed graph view that:

- Starts with bookmarked artworks as primary nodes.
- Adds related archive nodes around them.
- Supports pan, zoom, drag.
- Includes controls: zoom in, zoom out, reset view.
- Performs well on laptop and mobile.

Recommended library:

- Prefer `d3-force` + custom SVG/Canvas rendering for control.
- `react-force-graph-2d` is acceptable if implemented cleanly and styleable.

### 2) Node Semantics

At minimum support:

- `bookmarked_on_view` (anchor nodes, strongest emphasis)
- `related_archive` (discovery nodes, secondary emphasis)
- Optional grouping/hub nodes if they improve readability

Each node needs:

- stable id
- artwork metadata subset for quick rendering
- source (`curated`, `db`, `api`)
- score + reason summaries for explainable relationships

### 3) Detail Panel (Bottom Sheet)

On node tap/click:

- Open bottom sheet from screen bottom.
- Show:
  - image (prefer full image when available)
  - title
  - artist
  - date
  - medium/classification/department (as available)
  - on-view status if available
  - “View on MoMA.org” link when URL available
  - bookmark/add/remove control where relevant
- Include related chips/links (artist/style/era) to encourage deeper traversal.

Bottom sheet behavior:

- dismiss via close button and swipe/drag-down on touch devices (if feasible)
- no layout shift breaking graph context

### 4) Empty and Edge States

- No bookmarks: show a designed empty state with CTA to `/map`.
- Missing images: fallback visual placeholder using current design language.
- API unavailable: continue with DB/local results.
- Very dense graph: cap node count and expose “load more”.

---

## Relationship Engine Requirements

Build a deterministic weighted relevance system for archive suggestions:

- Same Artist: **40%**
- Same Style/Tags: **25%**
- Same Department: **20%**
- Same Era proximity: **15%**

### Notes for matching

- Artist:
  - exact normalized artist string match first
  - optional fuzzy fallback if needed
- Style/Tags:
  - map curated `tags[]` to DB text fields (`Classification`, `Department`, `Medium`, `Title` keyword hints)
- Department:
  - exact or normalized match
- Era:
  - parse years from curated `year` and DB `Date`; score by proximity (target ±20 years)

Output per related node:

- final numeric score (0..1 or 0..100)
- evidence array, e.g. `["same_artist", "era_close"]`

Keep algorithm in a reusable module with unit-testable pure functions.

---

## Data Access Architecture

### Server-side route for constellation data

Create:

- `src/app/api/constellation/route.ts`

Route responsibilities:

1. Accept bookmarked artwork IDs (from curated set).
2. Resolve curated anchor records.
3. Query SQLite DB for related candidates.
4. Compute weighted relevance.
5. Return graph payload (`nodes`, `edges`, `meta`).
6. Optionally enrich top results with MoMA API fields when token works.
7. Cache responses (short TTL + in-memory strategy where safe).

### SQLite access

Use project-local DB path:

- `_db_moma-collection/moma_full.db`

Implementation expectation:

- Use a safe, well-supported SQLite access approach for Next.js runtime (Node runtime, not edge).
- Parameterize SQL; never string-concatenate untrusted inputs.
- Add lightweight query guards and sane limits.

### API fallback strategy

- Primary for archive breadth: SQLite
- Optional enrichment from MoMA API
- If API fails, do not fail request; return DB-only payload

---

## File-Level Implementation Plan (Execute)

Create:

- `src/app/constellation/page.tsx`
- `src/components/ConstellationGraph.tsx`
- `src/components/ConstellationDetailPanel.tsx`
- `src/components/ConstellationLegend.tsx` (optional but recommended)
- `src/lib/constellation.ts` (types + scoring + transforms)
- `src/lib/constellation-db.ts` (DB query helpers, server-only)
- `src/app/api/constellation/route.ts`

Modify:

- `src/components/BottomNav.tsx` (add “Constellation” tab/icon)
- `src/store/useStore.ts` (constellation-specific UI state if needed)
- `src/app/globals.css` (constellation utility classes/effects)
- `AGENTS.md` if architecture/workflow docs need updates

If new dependency is required, add minimal stable deps only.

---

## API Contract (Target)

`GET /api/constellation?bookmarks=starry-night,les-demoiselles`

Response shape:

```ts
type ConstellationNode = {
  id: string;
  label: string;
  kind: "bookmarked_on_view" | "related_archive" | "hub";
  source: "curated" | "db" | "api";
  imageUrl?: string;
  momaUrl?: string;
  artist?: string;
  date?: string;
  department?: string;
  classification?: string;
  onView?: boolean | null;
  score?: number;
  reasons?: string[];
};

type ConstellationEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
  reason: string;
};

type ConstellationResponse = {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  meta: {
    bookmarkCount: number;
    relatedCount: number;
    truncated: boolean;
    dataSources: string[];
  };
};
```

---

## Performance Constraints

- Initial render target: sub-2s for typical bookmark counts (<= 20 bookmarks).
- Limit first graph payload to a manageable node count (e.g., 120 max), with predictable cap logic.
- Use memoization and stable object identities to reduce re-renders.
- Avoid layout thrashing in animation loop.

---

## Accessibility & UX Requirements

- Keyboard reachable controls (zoom, reset, open/close panel).
- Visible focus states.
- Reduced-motion support for graph animation and transitions.
- Alt text and meaningful labels for images/icons/buttons.
- Color usage must not be the only encoding of node type (shape/border/legend too).

---

## Testing Expectations

Add targeted tests for new logic:

- `src/lib/constellation.ts` scoring functions:
  - artist matches score highest
  - mixed criteria weighting works correctly
  - era parsing handles malformed dates safely
- API route basic contract tests (if test setup exists)
- At minimum, verify build + lint + typecheck pass

Do not add new test frameworks; use existing project tooling.

---

## Delivery Checklist

1. Implement all files and wiring above.
2. Run:
   - `pnpm run lint`
   - `pnpm run build`
   - also ensure npm compatibility remains intact (`package-lock.json` stays valid if changed)
3. Confirm new nav tab works and route loads.
4. Confirm graph shows bookmarks + related nodes.
5. Confirm detail panel opens with metadata.
6. Confirm graceful behavior when API token is missing/invalid.
7. Update docs (`AGENTS.md` and/or README) for new architecture and data flow.

---

## Output Format Required from You (Codex)

When done, provide:

1. Summary of what was built.
2. List of files created/modified.
3. Notes on algorithm decisions and thresholds.
4. Validation output (lint/build/tests).
5. Any follow-up recommendations (small, actionable).

