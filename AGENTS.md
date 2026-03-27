# AGENTS.md — MoMA Hackathon App

This project is part of the MoMA NYU Hackathon. It uses Next.js with breaking changes from your training data.

---

## Team

| Name | GitHub | Focus |
|------|--------|-------|
| Justin Johnso | [@justinjohnso](https://github.com/justinjohnso) | MoMA API integration, data layer |
| Ryan Rotella | [@ryrotella](https://github.com/ryrotella) | Interactive map, Wrapped experience, UI/UX |

---

## Framework Warning

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## App Summary

**MoMA Explorer** — A mobile-first web app for exploring the Museum of Modern Art.

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **State**: Zustand with localStorage persistence
- **Map**: react-leaflet with custom SVG floor plans (CRS.Simple)
- **Animations**: framer-motion
- **Sharing**: html-to-image + Web Share API

### Core Features

| Feature | Description |
|---------|-------------|
| Interactive Map | SVG floor plans for floors 2, 4, 5 with gallery pins, popups, 2D/3D toggle |
| Artwork Detail | Full metadata, real MoMA images, tags, bookmarking, dwell-time tracking |
| Constellation | Force-directed bookmark + archive graph with bottom sheet details |
| Wrapped Stories | 8-slide Spotify-style recap: stats, top artworks, Art DNA, personality |
| Visit Tracking | Session start/end, artwork views, dwell time, floors/galleries visited |
| Bookmarks | Persist favorites in localStorage |

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Homepage with CTA buttons and stats |
| `/map` | `map/page.tsx` | Floor map with tabs, 2D/3D toggle |
| `/artwork/[id]` | `artwork/[id]/page.tsx` | SSG artwork detail (57 pages) |
| `/constellation` | `constellation/page.tsx` | Force graph from bookmarks + archive relations |
| `/wrapped` | `wrapped/page.tsx` | Wrapped story experience |
| `/api/moma` | `api/moma/route.ts` | MoMA API proxy (for future live data) |
| `/api/constellation` | `api/constellation/route.ts` | Graph payload from curated + SQLite (+ optional API enrichment) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout + BottomNav
│   ├── globals.css           # Tailwind + Leaflet overrides + CSS vars
│   ├── map/page.tsx          # Map page + floor tabs + 2D/3D toggle
│   ├── artwork/[id]/page.tsx # Artwork detail (SSG)
│   ├── constellation/page.tsx# Constellation graph experience
│   ├── wrapped/page.tsx      # Wrapped entry point
│   └── api/
│      ├── moma/route.ts      # MoMA API proxy
│      └── constellation/route.ts # Constellation data API
├── components/
│   ├── FloorMap.tsx          # Leaflet map + pins + popups
│   ├── ArtworkDetail.tsx     # Artwork detail view
│   ├── ConstellationGraph.tsx# Force graph renderer + controls
│   ├── ConstellationDetailPanel.tsx # Bottom sheet metadata panel
│   ├── ConstellationLegend.tsx # Graph visual key
│   ├── WrappedStories.tsx    # 8-slide story experience
│   └── BottomNav.tsx         # Tab navigation
├── store/
│   └── useStore.ts           # Zustand store (bookmarks, sessions, visits)
├── lib/
│   ├── constellation.ts      # Types + scoring + transforms
│   └── constellation-db.ts   # SQLite server-only query helpers
└── data/
    ├── artworks.json         # 57 curated artworks with real image URLs
    └── galleries.json        # Gallery coordinates per floor
public/floors/
├── floor2.svg                # Floor 2 — 1980s–Present (blue)
├── floor4.svg                # Floor 4 — 1950s–1970s (pink)
└── floor5.svg                # Floor 5 — 1880s–1940s (tan)
```

---

## Data Schemas

### Artwork (`src/data/artworks.json`)

```typescript
interface Artwork {
  id: string;           // kebab-case slug, e.g. "starry-night"
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  gallery: string;      // e.g. "501"
  floor: number;        // 2, 4, or 5
  department: string;
  classification: string;
  thumbnail: string;    // MoMA image URL
  description: string;
  tags: string[];       // e.g. ["surrealism", "iconic", "landscape"]
  popularity: number;   // 1-100 for hidden gem detection
}
```

### Gallery Coordinates (`src/data/galleries.json`)

```typescript
interface GalleriesData {
  floors: {
    [floor: string]: {
      name: string;
      color: string;       // hex color for floor
      imageWidth: number;  // SVG dimensions
      imageHeight: number;
      galleries: {
        [galleryId: string]: { x: number; y: number }
      }
    }
  }
}
```

### Zustand Store (`src/store/useStore.ts`)

```typescript
interface AppState {
  // Bookmarks
  bookmarks: string[];
  toggleBookmark: (artworkId: string) => void;

  // Visit tracking
  currentSession: VisitSession | null;
  pastSessions: VisitSession[];
  startSession: () => void;
  endSession: () => void;
  recordArtworkView: (artworkId: string, gallery: string, floor: number) => void;
  updateDwellTime: (artworkId: string, seconds: number) => void;

  // Map state
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
}
```

Storage key: `moma-explorer-storage` (localStorage)

---

## Styling

### CSS Variables (`globals.css`)

```css
:root {
  --moma-red: #e4002b;
  --moma-black: #1a1a1a;
}
```

### Floor Colors

| Floor | Era | Color |
|-------|-----|-------|
| 2 | 1980s–Present | `#B8CCE4` (blue) |
| 4 | 1950s–1970s | `#F2C6C6` (pink) |
| 5 | 1880s–1940s | `#F2D6B3` (tan) |

### Leaflet Customizations

- Custom `.gallery-pin` styles for map markers
- Popup styling with rounded corners and shadows
- Isometric 3D mode with CSS perspective transforms

---

## Environment Variables

```bash
# .env.local (gitignored)
NEXT_PUBLIC_MOMA_API_TOKEN=your_token_here
```

**Note**: MoMA API token may be expired. Current artwork data sourced from MoMA GitHub CSV dataset. API proxy at `/api/moma` ready if token is refreshed.

---

## Quick Reference Commands

Both `npm` and `pnpm` are supported. Justin uses pnpm, Ryan uses npm.

```bash
# npm
npm install && npm run dev

# pnpm
pnpm install && pnpm run dev

# Other scripts (same for both)
npm/pnpm run build        # Production build
npm/pnpm run test         # Run tests
npm/pnpm run lint         # Lint code
```

**Note:** Both `package-lock.json` and `pnpm-lock.yaml` are committed. Keep both in sync.

---

## Dependencies

### Runtime
- `next` 16.2.1 — App framework
- `react` / `react-dom` 19.x — UI library
- `zustand` — State management with persistence
- `react-leaflet` / `leaflet` — Interactive maps
- `framer-motion` — Animations
- `html-to-image` — Screenshot generation for sharing
- `lottie-react` — Lottie animations (available, not yet used)
- `react-insta-stories` — Story UI (available, not yet used)

### Dev
- `tailwindcss` 4 + `@tailwindcss/postcss`
- `typescript` 5.x
- `eslint` + `eslint-config-next`

---

## About the Developer

- **Name**: Justin Johnso
- **GitHub**: justinjohnso, justinjohnso-itp, justinjohnso-tinker, justinjohnso-learn, justinjohnso-archive
- **Context**: NYU ITP graduate student; projects span physical computing, web development, creative coding, and embedded systems

---

## General Development Philosophy

1. **Clarity over cleverness** — code must be understandable by future-me and collaborators.
2. **Use working examples** as the basis for new code rather than writing from scratch.
3. **Event-driven, not polling** — prefer async patterns and notifications over busy-wait loops.
4. **Configuration in one place** — centralize constants; never duplicate magic numbers.
5. **Test early, test often** — write tests as you go, not as an afterthought.
6. **Commit as you go** — small, logical commits at each stable milestone.

---

## Code Conventions

### General
- **Naming**: `camelCase` for variables/functions, `PascalCase` for types/classes, `UPPER_CASE` for constants
- **Comments**: Sparingly — only for non-obvious logic or external constraints
- **Error handling**: Fail fast on init errors; return error types for recoverable failures
- **Logging**: Use structured logging with module-specific tags/prefixes

### JavaScript / TypeScript
- Use `const` by default; `let` only when reassignment needed; never `var`
- Prefer `async/await` over `.then()` chains
- Use TypeScript strict mode when possible
- ESLint + Prettier for formatting

---

## Related Project: MoMA API Playground

The sibling `_app_moma-api` directory contains an **Astro 6 + React 19** app for interactive API documentation.

**Key conventions from that project:**
- Keep endpoint definitions centralized in `src/lib/endpoints.ts`
- Keep API request logic centralized in `src/lib/api.ts`
- Prefer reusable typed interfaces from `src/lib/types.ts`
- Preserve accessibility: keyboard navigation, labels, and visible focus

---

## Known Issues

- **MoMA API token expired** — returns "Input or token is not valid". Artwork images sourced from GitHub CSV instead.
- **Some gallery assignments may be stale** — MoMA rotates works regularly.

---

## Git Workflow & Branch Hygiene

1. **No direct feature work on `main`** — always use feature branches
2. **Branch naming**: `feature/`, `fix/`, `refactor/`, `docs/` prefixes
3. **Commit messages**: Use conventional commits format: `type(scope): description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
4. **Small, atomic commits** — one logical change per commit
5. **Keep working trees clean** — commit or stash before context-switching

---

## Testing Requirements

- **All new logic requires tests** — this is non-negotiable
- **Test coverage**: Happy path + edge cases + error handling
- **Test naming**: Describe the behavior being tested
- **Mocking**: Mock external dependencies (APIs, databases, hardware)
- **Frameworks**: Jest or Vitest for JavaScript/TypeScript

---

## Security Practices

- **No hardcoded secrets** — use environment variables exclusively
- **Input validation** — validate and sanitize all external input
- **Dependencies** — run `pnpm audit` regularly
- **HTTPS only** — for all network communication
- **.env files** — never committed; always in `.gitignore`

---

## AI Assistant Guidelines

### When Working on This Code

1. **Ask clarifying questions** before making assumptions about ambiguous requirements
2. **Follow existing patterns** in the codebase over introducing new approaches
3. **Verify changes work** — run tests, build, lint before considering done
4. **DO NOT COMMIT** — never run `git commit` autonomously; I will review and commit manually
5. **DO NOT add Co-authored-by trailers** — if I ask you to draft a commit message, omit these entirely
6. **Update docs** if changes affect documented behavior

### Session History

**Record session progress in `docs/sessions/` at regular intervals.**

- **File naming**: `SESSION_YYYY-MM-DD_HHMM.md` (24-hour time)
- **Create/update** the session file:
  - At the start of a significant work session
  - After completing major features or milestones
  - Before ending a session (final summary)
- **Include**:
  - Date and approximate time span
  - What was built or changed
  - Architecture decisions made
  - Known issues or blockers
  - Next steps / priorities
- **Purpose**: Enables handoff between sessions, collaborators, or AI assistants without losing context

### Reference Repositories

Code in these GitHub organizations represents my canonical patterns:
- `github.com/justinjohnso`
- `github.com/justinjohnso-itp`
- `github.com/justinjohnso-tinker`
- `github.com/justinjohnso-learn`

When in doubt, check existing projects for established patterns.

---

## Workflow

1. Make surgical changes relevant to the request.
2. Run `pnpm build` to validate before finishing.
3. Update README/AGENTS when behavior or architecture changes.

---

*Last updated: March 2026*
