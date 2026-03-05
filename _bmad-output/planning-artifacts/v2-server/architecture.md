---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-03-05'
inputDocuments:
  - "_bmad-output/planning-artifacts/v2-server/prd.md"
  - "_bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md"
  - "_bmad-output/planning-artifacts/v1-frontend/architecture.md"
  - "_bmad-output/project-context.md"
  - "docs/story-format-spec.md"
workflowType: 'architecture'
project_name: 'tree-story'
user_name: 'Anthony'
date: '2026-03-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

18 FRs across 5 capability areas. The most architecturally significant clusters are the Leaderboard group (FR3–FR8) and the Story Delivery API group (FR9–FR11), which together define the entire server surface area. FR3–FR8 introduce the first server-side data persistence (score entries) and the first public API endpoints. FR9–FR11 restructure content delivery from static files to a server API — the largest single architectural change in this PRD.

Player Identity (FR1–FR2) extends the existing engine state with a name field — a minor schema evolution. Multi-Story Routing (FR12–FR16) adds URL-based story selection and a landing page — primarily a frontend routing concern, but depends on the story listing API. Existing Capabilities (FR17–FR18) confirm that localStorage persistence and client-side engine operation are unchanged.

**Non-Functional Requirements:**

- **Performance (NFR1–NFR3):** Story JSON fetch and leaderboard load under 1 second on mobile. Score submission must not block end screen rendering — fire-and-forget.
- **Security (NFR4–NFR5):** API key protection for admin endpoints only. Player names rendered as text-only — no HTML injection vector.
- **Reliability (NFR6–NFR7):** Graceful degradation when any server endpoint is unreachable. The end screen renders without leaderboard; story fetch failure shows a meaningful fallback.
- **Compatibility (NFR8–NFR9):** Mobile Safari + Chrome primary targets. Existing localStorage saves must not break when new features are deployed.

**Scale & Complexity:**

- Primary domain: Web app with API backend — Next.js API routes extending existing SPA
- Complexity level: Medium — small API surface (5 endpoints, 2 data entities), but the static-to-server transition and brownfield integration add meaningful scope
- Estimated architectural components: ~5 new server-side concerns (API routing, data storage, story management, score/leaderboard, admin auth)

### Technical Constraints & Dependencies

- **Next.js 16.1.6 App Router** — API routes (Route Handlers) for the backend; server components for SSR meta tags; client components for engine state (unchanged)
- **Vercel deployment** — already in use; will add serverless functions for API routes
- **Supabase** — already in use; PostgreSQL for persistent data (scores, story metadata), potentially Supabase Storage for story JSON blobs
- **No user accounts, no sessions, no cookies** — hard constraint. Score submission is anonymous. Admin auth via Supabase service role key (server-side only).
- **Existing engine isolation** — `engine/` has zero server dependencies and must remain pure TypeScript
- **localStorage schema compatibility** — adding `playerName` (Phase 1) and evolving save keys for multi-story (Phase 2) must not break existing saves
- **Story JSON schema v1.5** — well-specified; server storage must preserve this format exactly

### Cross-Cutting Concerns Identified

| Concern | Affected Components |
|---|---|
| **API error resilience** | Leaderboard UI, story listing, story fetch — all degrade to absence, never error |
| **Supabase schema design** | Score table, story table/storage — straightforward but must be designed upfront |
| **Save state evolution** | Engine state (name field), persistence layer, multi-story save keys |
| **Story delivery migration** | Phase 1: static (`public/stories/`). Phase 2: Supabase. Transition must be seamless. |
| **Routing architecture** | Single URL → `/<story-id>` routing, landing page at `/`, SSR meta tags per story |
| **Admin authentication** | Supabase service role key for story upload/update — env var on Vercel, never client-side |

---

## Starter Template Evaluation

### Primary Technology Domain

Web app with API backend — extending an existing Next.js SPA with server-side API routes. Brownfield project; no new initialization required.

### Starter: Already Initialized (Brownfield)

The project was initialized with `create-next-app` and has been in production. The v2 server capabilities are an extension, not a new project.

**Existing Stack (unchanged):**

- **Language & Runtime:** TypeScript 5 + React 19 + Next.js 16 — App Router, server components where static, client components for engine state
- **Styling Solution:** Tailwind CSS v4 — CSS-first `@theme` directive in `globals.css`. Runtime theming via CSS custom properties.
- **Build Tooling:** Next.js built-in (Turbopack in dev). No additional configuration.
- **Testing Framework:** Vitest for engine unit tests.
- **Code Organization:** `app/` at root, no `src/` wrapper. Engine isolated in `engine/`.
- **Development Experience:** Hot reloading via Turbopack, TypeScript strict mode, ESLint 9.

**New dependencies for v2:**

- `@supabase/supabase-js` — Supabase client for Route Handlers (server-side only)
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Still provided by existing stack:**

- Next.js Route Handlers for API endpoints (no Express, no separate backend)
- Vercel serverless deployment for API routes (automatic with Next.js)
- Server components for SSR meta tags on story pages

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Supabase schema design: `stories` table with `jsonb` column for story data, `scores` table for leaderboard entries
- Server-only Supabase access: all calls via Next.js Route Handlers, no client-side Supabase
- Per-story localStorage keys with migration from v1 single-key format

**Important Decisions (Shape Architecture):**
- Page routing: `[storyId]/page.tsx` for SSR meta tags + client engine
- API Route Handler organization: nested under `api/stories/`

**Deferred Decisions (Post-MVP):**
- Caching strategy for story JSON (not needed at current scale)
- Rate limiting on public endpoints (intimate audience, no abuse concern)
- Story versioning / conflict resolution for concurrent edits (single admin)

### Data Architecture

**Supabase PostgreSQL — Two Tables**

`stories` table:
- `id` (text, PK) — matches story JSON `id` field (e.g. `"dub-camp"`)
- `title` (text) — for listing page
- `description` (text) — for listing page
- `data` (jsonb) — full story JSON blob
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

`scores` table:
- `id` (uuid, PK, auto-generated)
- `story_id` (text, FK → stories.id)
- `player_name` (text) — max 20 chars enforced at API level
- `score` (integer)
- `is_game_over` (boolean) — distinguishes completion from game over
- `created_at` (timestamptz)

No RLS policies needed — all access is server-side via service role key.

**localStorage Key Evolution:**
- Phase 1: Add `playerName` to existing `tree-story:save` schema
- Phase 2: Migrate to per-story keys: `tree-story:save:<storyId>`
- Migration: on first load, if `tree-story:save` exists and `tree-story:save:<currentStoryId>` does not, move the data and delete the old key

### Authentication & Security

- **Admin endpoints** (`POST /api/stories/[id]`): Protected by `SUPABASE_SERVICE_ROLE_KEY` — request must include `Authorization: Bearer <key>`. Checked in the Route Handler before any Supabase call.
- **Public endpoints**: No auth. Score submission is anonymous (name + score + storyId).
- **Player name sanitization**: Trim whitespace, enforce max 20 characters at API level. Rendered as `textContent` only — no XSS vector.
- **No CORS concerns**: API routes are same-origin (Next.js serves both frontend and API).

### API & Communication Patterns

**All Route Handlers, REST, JSON:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/stories` | Public | List stories (id, title, description, updated_at) |
| `GET` | `/api/stories/[id]` | Public | Fetch full story JSON |
| `POST` | `/api/stories/[id]` | Service key | Upload/replace story JSON |
| `GET` | `/api/stories/[id]/leaderboard` | Public | Get scores for a story (sorted desc) |
| `POST` | `/api/stories/[id]/scores` | Public | Submit a score entry |

**Error handling:** Route Handlers return standard HTTP status codes. Client-side code treats any non-2xx as "unavailable" — renders without the server data (absence over error).

**Supabase client:** Single server-side instance in `lib/supabase.ts`, created with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Imported by Route Handlers only.

### Frontend Architecture

**Routing structure:**
```
app/
  page.tsx                    → Landing page (/) — server component
  [storyId]/
    page.tsx                  → Story page — server component (SSR meta) + client engine
  api/
    stories/
      route.ts                → GET /api/stories
      [id]/
        route.ts              → GET/POST /api/stories/[id]
        leaderboard/
          route.ts            → GET leaderboard
        scores/
          route.ts            → POST score
```

**SSR strategy for `[storyId]/page.tsx`:**
- Server component fetches story metadata from Supabase (title, description) for OG meta tags
- Renders the client-side `StoryReader` component with story data passed as props
- `generateMetadata()` provides per-story OG title, description, image

**State management:** No change. Engine state via `useStoryEngine` hook + `useRef`. Player name added to engine state.

### Infrastructure & Deployment

- **Vercel**: Existing deployment. Route Handlers deploy as serverless functions automatically.
- **Supabase**: Existing project. Add `stories` and `scores` tables via Supabase dashboard or migration SQL.
- **Environment variables**: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set in Vercel project settings.
- **No new CI/CD**: Push to main → Vercel auto-deploys (unchanged).

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase schema (tables + seed Dub Camp story)
2. `lib/supabase.ts` server client
3. Phase 1 API routes: `POST scores`, `GET leaderboard`
4. Phase 1 frontend: name input, score submission, leaderboard display
5. Phase 2 API routes: `GET/POST stories`, `GET stories list`
6. Phase 2 frontend: `[storyId]` routing, landing page, SSR meta tags
7. Phase 2 localStorage migration to per-story keys

**Cross-Component Dependencies:**
- All Route Handlers depend on `lib/supabase.ts`
- Leaderboard UI depends on score submission API working first
- `[storyId]/page.tsx` depends on stories API (Phase 2)
- Landing page depends on stories list API (Phase 2)
- SSR meta tags depend on story metadata in Supabase (Phase 2)

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points: 8 identified

### Naming Patterns

**Database Naming (Supabase/Postgres — new for v2):**
- Tables: `snake_case`, plural — `stories`, `scores`
- Columns: `snake_case` — `story_id`, `player_name`, `created_at`, `is_game_over`
- Route Handlers translate from Postgres `snake_case` → API response `camelCase`

**API Route Handler Files:**
- Route files: `route.ts` in nested folders per Next.js App Router convention
- Supabase client: `lib/supabase.ts` — single file, single named export (`supabase`)
- API utilities: `camelCase` in `lib/` — consistent with existing `lib/utils.ts`

**API Response Field Naming:**
- All JSON response fields: `camelCase` — consistent with existing story JSON format and TypeScript conventions
- Example: `{ storyId, playerName, createdAt }` not `{ story_id, player_name, created_at }`

**Existing naming conventions (unchanged from v1):**
- React components: `PascalCase.tsx`
- Hooks: `camelCase` with `use` prefix
- Engine modules + utilities: `camelCase`
- TypeScript interfaces: PascalCase, no `I` prefix

### Structure Patterns

**Server code organization — no abstraction layers:**
- `lib/supabase.ts` — Supabase client only; no service classes, no repository pattern
- `app/api/stories/` — Route Handlers call Supabase directly; 5 endpoints do not justify abstraction
- No `services/`, `repositories/`, or `controllers/` directories

**New component placement:**
- `components/LeaderboardSection.tsx` — end screen addition
- `components/LeaderboardEntry.tsx` — single row component
- `components/LandingHero.tsx` — landing page hero section
- `components/StoryCard.tsx` — story listing card
- Modifications to existing: `components/ProfileCreation.tsx` (name input), `components/EndScreen.tsx` (leaderboard section)

### Format Patterns

**API Response Format — direct response, no wrapper:**
```typescript
// Success — direct JSON payload
Response.json(payload, { status: 200 })  // GET
Response.json(payload, { status: 201 })  // POST (created)

// Error — single error string
Response.json({ error: 'Story not found' }, { status: 404 })
Response.json({ error: 'Unauthorized' }, { status: 401 })
Response.json({ error: 'Internal server error' }, { status: 500 })
```

No `{ data, error }` wrapper. No envelope pattern. Direct payloads only.

**Supabase → API translation:**
```typescript
// Always translate: Postgres snake_case → response camelCase
const { data } = await supabase.from('scores').select('*')
return Response.json(data.map(row => ({
  id: row.id,
  storyId: row.story_id,
  playerName: row.player_name,
  score: row.score,
  isGameOver: row.is_game_over,
  createdAt: row.created_at,
})))
```

**EngineState — `playerName` addition (Phase 1):**
```typescript
interface EngineState {
  // ... all existing fields unchanged
  playerName: string  // added in v2 Phase 1; set at profile creation, never re-prompted
}
```

### Communication Patterns

**Score submission — fire-and-forget (never awaited):**
```typescript
// Client-side: no await, no .then(), catch silences all errors
fetch(`/api/stories/${storyId}/scores`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerName, score, isGameOver }),
}).catch(() => {})
```

**Leaderboard fetch — async with graceful absence:**
```typescript
// Client-side: returns null on any failure; component renders nothing if null
async function fetchLeaderboard(storyId: string): Promise<LeaderboardEntry[] | null> {
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`/api/stories/${storyId}/leaderboard`, { signal: controller.signal })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
```

**Admin auth pattern — check first, always:**
```typescript
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... proceed with operation
}
```

**Route Handler error handling — try/catch always:**
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from('stories').select('*').eq('id', params.id).single()
    if (error || !data) return Response.json({ error: 'Story not found' }, { status: 404 })
    return Response.json(transformToCamelCase(data))
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Process Patterns

**localStorage key migration (Phase 2):**
```typescript
// persistence.ts — run on first load in multi-story context
function migrateToPerStoryKey(storyId: string): void {
  const legacyKey = 'tree-story:save'
  const newKey = `tree-story:save:${storyId}`
  if (localStorage.getItem(legacyKey) && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, localStorage.getItem(legacyKey)!)
    localStorage.removeItem(legacyKey)
  }
}
```

**Player name truncation at API boundary:**
```typescript
// Route Handler — always trim and truncate before storing
const playerName = (body.playerName ?? '').trim().slice(0, 20)
```

### Enforcement Guidelines

**All AI Agents MUST:**
- Import `lib/supabase.ts` from Route Handlers and server components only — never from `engine/`, `hooks/`, or `components/`
- Translate Postgres `snake_case` columns to `camelCase` in all API responses
- Use direct JSON responses — no `{ data, error }` wrapper pattern
- Handle all API failures client-side as graceful absence — no error modals, no spinners, no retry
- Keep `playerName` in `EngineState` and persist it with the save state
- Check admin auth before any Supabase write in protected Route Handlers
- Wrap all Route Handler logic in try/catch with `{ error: '...' }` fallback
- Use `tree-story:save:<storyId>` key format for per-story localStorage (Phase 2)

**Anti-Patterns to Reject:**
- Creating `services/` or `repositories/` abstraction for 5 API routes
- Calling Supabase from client-side code (`use client` components or hooks)
- Using `{ data, error }` wrapper in API responses
- Showing error messages, loading skeletons, or retry UI for failed API calls
- Using `SUPABASE_ANON_KEY` — server-only with service role key is the pattern
- Adding leaderboard loading states or spinners (fade-in or nothing)
- Awaiting score submission (must be fire-and-forget)

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
tree-story/
├── package.json                        # + @supabase/supabase-js added
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts
├── .env.local                          # NEW — SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
├── .env.example                        # NEW — documented env vars (values redacted)
├── .gitignore
├── README.md
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── error.tsx
│   ├── page.tsx                        # MODIFIED — becomes landing page (/) server component
│   │
│   ├── [storyId]/                      # NEW — per-story route
│   │   └── page.tsx                    # NEW — server component: SSR meta + client StoryReader
│   │
│   └── api/
│       └── stories/
│           ├── route.ts                # NEW — GET /api/stories (list)
│           └── [id]/
│               ├── route.ts            # NEW — GET /api/stories/[id], POST /api/stories/[id]
│               ├── leaderboard/
│               │   └── route.ts        # NEW — GET /api/stories/[id]/leaderboard
│               └── scores/
│                   └── route.ts        # NEW — POST /api/stories/[id]/scores
│
├── components/
│   ├── StoryReader.tsx
│   ├── GaugeStrip.tsx
│   ├── ParagraphDisplay.tsx
│   ├── ChoiceCards.tsx
│   ├── CharacterSheet.tsx
│   ├── ProfileCreation.tsx             # MODIFIED — name input field added at top
│   ├── EndScreen.tsx                   # MODIFIED — LeaderboardSection added below score/tier
│   ├── DevErrorScreen.tsx
│   ├── LeaderboardSection.tsx          # NEW — async leaderboard, fades in or absent
│   ├── LeaderboardEntry.tsx            # NEW — single row: name left, score right
│   ├── LandingHero.tsx                 # NEW — hero section: illustration + headline + CTA
│   └── StoryCard.tsx                   # NEW — tappable story listing card
│
├── engine/                             # Pure TypeScript — zero React/server dependency
│   ├── types.ts                        # MODIFIED — playerName added to EngineState
│   ├── storyEngine.ts
│   ├── gaugeSystem.ts
│   ├── weightedOutcome.ts
│   ├── themeManager.ts
│   ├── persistence.ts                  # MODIFIED — per-story key migration (Phase 2)
│   ├── storyValidator.ts
│   └── storyEngine.test.ts
│
├── hooks/
│   └── useStoryEngine.ts               # MODIFIED — playerName wired into state + save
│
├── lib/
│   ├── utils.ts
│   └── supabase.ts                     # NEW — single Supabase server client (service role)
│
├── public/
│   └── stories/
│       └── dub-camp.json               # Phase 1: still served statically
│                                       # Phase 2: moved to Supabase, this file deprecated
│
└── docs/
    └── story-format-spec.md
```

### Architectural Boundaries

**Server Boundary (strict — new for v2):**
- `lib/supabase.ts` is imported ONLY by `app/api/**/route.ts` and `app/[storyId]/page.tsx`
- Never imported by `engine/`, `hooks/`, or `components/`

**Engine Boundary (unchanged from v1 — absolute):**
- `engine/` has zero imports from `components/`, `hooks/`, `app/`, `lib/`, or any server module
- Only `hooks/useStoryEngine.ts` calls engine methods

**Component Boundary (unchanged from v1):**
- `StoryReader.tsx` is the sole consumer of `useStoryEngine` — all children receive props
- `LeaderboardSection.tsx` receives `storyId` + `playerName` as props; fetches its own data

**Data Boundary:**
- Player state: `engine/` → `hooks/useStoryEngine.ts` → component props (unchanged)
- Leaderboard: `components/LeaderboardSection.tsx` → `GET /api/stories/[id]/leaderboard` → Supabase
- Score submission: `components/EndScreen.tsx` → `POST /api/stories/[id]/scores` → Supabase
- Story listing: `app/page.tsx` (server) → Supabase directly (no API hop needed from server component)
- Story data (Phase 2): `app/[storyId]/page.tsx` (server) → Supabase directly

### Requirements to Structure Mapping

| FR Group | Location |
|---|---|
| FR1–FR2 Player Identity (name) | `components/ProfileCreation.tsx`, `engine/types.ts`, `hooks/useStoryEngine.ts` |
| FR3–FR6 Leaderboard UI | `components/LeaderboardSection.tsx`, `components/LeaderboardEntry.tsx`, `components/EndScreen.tsx` |
| FR7–FR8 Score/Leaderboard API | `app/api/stories/[id]/scores/route.ts`, `app/api/stories/[id]/leaderboard/route.ts` |
| FR9–FR11 Story Delivery API | `app/api/stories/route.ts`, `app/api/stories/[id]/route.ts` |
| FR12–FR15 Multi-Story Routing | `app/[storyId]/page.tsx`, `app/page.tsx`, `components/LandingHero.tsx`, `components/StoryCard.tsx` |
| FR16 SSR Meta Tags | `app/[storyId]/page.tsx` (`generateMetadata()`) |
| FR17–FR18 Existing Capabilities | All `engine/` files (unchanged) |

### Data Flow

```
Phase 1 — Leaderboard:
EndScreen.tsx
  → fire-and-forget POST /api/stories/[id]/scores
  → app/api/stories/[id]/scores/route.ts → lib/supabase.ts → scores table

LeaderboardSection.tsx
  → GET /api/stories/[id]/leaderboard
  → app/api/stories/[id]/leaderboard/route.ts → lib/supabase.ts → scores table
  → camelCase response → fade-in on arrival, absent on failure

Phase 2 — Multi-story:
app/[storyId]/page.tsx (server component)
  → lib/supabase.ts → stories table (metadata + full data jsonb)
  → generateMetadata() for OG tags
  → renders <StoryReader storyData={...} />

app/page.tsx (server component)
  → lib/supabase.ts → stories table (id, title, description, updated_at)
  → renders <LandingHero /> + list of <StoryCard /> components

Admin story upload:
POST /api/stories/[id] (auth header checked first)
  → lib/supabase.ts → upsert stories table
```

### Development Workflow

- **Dev:** `npm run dev` — Turbopack; API routes run as local serverless via Next.js
- **Test:** `npx vitest` — engine tests only; no new test infrastructure required
- **Deploy:** Push to `main` → Vercel auto-deploys; Route Handlers become serverless functions automatically
- **Env vars:** `.env.local` for local development; Vercel project settings for production

---

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are compatible and conflict-free. Next.js 16 App Router + `@supabase/supabase-js` + Vercel serverless is a well-established, production-proven combination. Server-only Supabase access is coherent with Next.js Route Handlers — the service role key never leaves the server environment. Engine isolation (pure TypeScript) is completely unaffected by the server additions; the dependency arrow remains strictly one-way. Tailwind v4 + existing CSS custom properties cover all new UI surfaces without new tokens.

Phase separation is clean: Phase 1 (`app/page.tsx` unchanged, two new API routes, name input + leaderboard) and Phase 2 (routing restructure, multi-story, SSR meta tags) have no cross-contamination. The `app/[storyId]/page.tsx` server component follows the same data-passing pattern as the v1 `app/page.tsx` — source changes (Supabase instead of `public/stories/`), interface shape stays the same.

### Requirements Coverage Validation ✅

**Functional Requirements — all 18 FRs covered:**

| FR | Status | Location |
|---|---|---|
| FR1–FR2 Player name | ✅ | `engine/types.ts`, `ProfileCreation.tsx`, `useStoryEngine.ts` |
| FR3–FR6 Leaderboard UI | ✅ | `LeaderboardSection.tsx`, `LeaderboardEntry.tsx`, `EndScreen.tsx` |
| FR7–FR8 Score/Leaderboard API | ✅ | `scores/route.ts`, `leaderboard/route.ts` |
| FR9–FR11 Story Delivery API | ✅ | `stories/route.ts`, `stories/[id]/route.ts` |
| FR12–FR15 Multi-story routing + listing | ✅ | `[storyId]/page.tsx`, `app/page.tsx`, `LandingHero.tsx`, `StoryCard.tsx` |
| FR16 SSR meta tags | ✅ | `generateMetadata()` in `[storyId]/page.tsx` |
| FR17–FR18 Existing capabilities | ✅ | All `engine/` files unchanged |

**Non-Functional Requirements — all 9 NFRs covered:**

- NFR1–2 (sub-1s API): ✅ Simple Postgres queries, no joins, server-only path
- NFR3 (fire-and-forget): ✅ Explicit pattern with `.catch(() => {})` — never awaited
- NFR4 (API key auth): ✅ Authorization header check before any Supabase write
- NFR5 (no XSS): ✅ `textContent` only, player name sanitized at API boundary
- NFR6–7 (graceful degradation): ✅ `fetchLeaderboard` returns `null` on any failure — component simply absent
- NFR8 (mobile Safari + Chrome): ✅ No server changes affect client compatibility
- NFR9 (localStorage backward compat): ✅ Migration pattern preserves existing saves

### Implementation Readiness Validation ✅

All critical decisions documented with rationale. Patterns include concrete TypeScript code examples. 8 conflict points addressed with explicit anti-patterns. FR-to-file mapping complete. Implementation sequence is dependency-ordered (schema first, then API, then UI).

### Gap Analysis Results

**No critical gaps.** Two pre-implementation tasks to surface for the first story:

| Task | Priority |
|---|---|
| Create Supabase migration SQL for `stories` + `scores` tables | Critical — blocks all API stories |
| Seed Dub Camp story into `stories` table from `public/stories/dub-camp.json` | Critical — needed for Phase 1 testing |
| Handle `playerName` in `SaveState` version check (add to validation rules) | Important — ensures existing saves without `playerName` default gracefully |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 18 FRs + 9 NFRs analyzed for architectural implications
- [x] Complexity assessed: Medium — small API surface, meaningful brownfield transition
- [x] Technical constraints identified (engine isolation, localStorage compat, no accounts)
- [x] Cross-cutting concerns mapped (error resilience, schema design, save state evolution)

**✅ Architectural Decisions**
- [x] Data storage: Supabase PostgreSQL, `stories` + `scores` tables, `jsonb` for story data
- [x] Access pattern: server-only via service role key
- [x] localStorage evolution: per-story keys with migration
- [x] Routing: `[storyId]/page.tsx` + landing page at `/`
- [x] Admin auth: Authorization header with service role key

**✅ Implementation Patterns**
- [x] Database naming: `snake_case` columns → `camelCase` API responses
- [x] API format: direct JSON, no wrapper
- [x] Score submission: fire-and-forget with `.catch(() => {})`
- [x] Leaderboard fetch: 5s timeout, returns `null` on failure
- [x] Route Handler structure: try/catch, auth check first
- [x] 8 anti-patterns documented

**✅ Project Structure**
- [x] Complete directory tree with all new files labeled NEW/MODIFIED
- [x] Server boundary rule: `lib/supabase.ts` → Route Handlers + server components only
- [x] Engine boundary rule: unchanged and unaffected
- [x] Data flow diagrams for Phase 1 and Phase 2
- [x] FR-to-file mapping complete

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Clean phase separation — Phase 1 has minimal surface area; Phase 2 builds on Phase 1 infrastructure
- Server-only Supabase eliminates an entire class of security concerns
- Graceful degradation pattern is explicit and enforced through anti-patterns
- Engine isolation completely preserved — most battle-tested part of the codebase untouched
- Implementation sequence is dependency-ordered

**Areas for Future Enhancement (Post-MVP):**
- Caching layer for story JSON (when story count or traffic grows)
- Rate limiting on public endpoints (when audience grows beyond intimate circle)
- Story versioning / content diff for admin updates

### Implementation Handoff

**First Steps (in order):**
1. Create Supabase `stories` + `scores` tables (migration SQL)
2. Seed Dub Camp story into `stories` table
3. Add `@supabase/supabase-js` + create `lib/supabase.ts`
4. Implement Phase 1 API routes: `POST /api/stories/[id]/scores`, `GET /api/stories/[id]/leaderboard`
5. Implement Phase 1 frontend: name input in `ProfileCreation.tsx`, score submission + leaderboard in `EndScreen.tsx`
6. Add `playerName` to `EngineState`, `useStoryEngine.ts`, and `persistence.ts`
