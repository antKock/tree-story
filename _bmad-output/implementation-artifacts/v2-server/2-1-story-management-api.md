# Story 2.1: Story Management API

Status: review

## Story

As a **developer and admin**,
I want API endpoints to list, fetch, and upload stories from Supabase,
So that story content is served from the server and can be updated live without redeployment.

## Acceptance Criteria

1. `GET /api/stories` returns `200 OK` with an array of story metadata objects: `{ id, title, description, updatedAt }` (camelCase) — the full `data` jsonb is NOT included in the list response
2. `GET /api/stories/[id]` returns `200 OK` with the full story JSON from the `data` column, as a valid story object the engine can consume — response time under 1 second (NFR1)
3. `GET /api/stories/[id]` for a non-existent story returns `404 Not Found` with `{ error: 'Story not found' }`
4. `POST /api/stories/[id]` with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` and a valid story JSON body upserts the story into the `stories` table — `title` and `description` extracted from the story JSON and stored in their respective columns
5. `POST /api/stories/[id]` returns `201 Created` with `{ id, title, description, updatedAt }`
6. `POST /api/stories/[id]` with a missing or invalid Authorization header returns `401 Unauthorized` with `{ error: 'Unauthorized' }` — no Supabase call is made (NFR4)
7. Any Supabase failure on any endpoint returns `500 Internal Server Error` with `{ error: 'Internal server error' }`
8. All Route Handlers are wrapped in try/catch — never an unhandled exception

## Tasks / Subtasks

- [x] Create `app/api/stories/route.ts` — GET list endpoint (AC: #1, #7, #8)
  - [x] Query `stories` table: `select('id, title, description, updated_at')`
  - [x] Map `snake_case` columns to `camelCase` response: `{ id, title, description, updatedAt }`
  - [x] Wrap in try/catch with `{ error: 'Internal server error' }` fallback
- [x] Create `app/api/stories/[id]/route.ts` — GET fetch + POST upload (AC: #2, #3, #4, #5, #6, #7, #8)
  - [x] GET handler: query `stories` table by `id`, return `data` column as response body
  - [x] GET handler: return `404` if story not found (`.single()` returns null/error)
  - [x] POST handler: check `Authorization` header FIRST — reject with `401` before any Supabase call
  - [x] POST handler: parse request body as JSON, extract `title` from `meta.title` and `description` from `meta.description`
  - [x] POST handler: upsert into `stories` table with `{ id, title, description, data: body, updated_at: new Date().toISOString() }`
  - [x] POST handler: return `201` with `{ id, title, description, updatedAt }`
  - [x] Both handlers wrapped in try/catch

## Dev Notes

### Architecture Constraints

- **Server-only Supabase**: Import `supabase` from `@/lib/supabase` — this module is ONLY for Route Handlers and server components. Never import in `engine/`, `hooks/`, or `components/`.
- **No abstraction layers**: No `services/`, `repositories/`, or `controllers/` directories. Route Handlers call Supabase directly.
- **Direct JSON response**: Use `Response.json(payload, { status })` — no `{ data, error }` wrapper pattern.
- **snake_case → camelCase**: Always translate DB column names to camelCase in API responses.

### Existing API Routes (Context)

Two API routes already exist from Epic 1:
- `app/api/stories/[id]/scores/route.ts` — `POST` score submission
- `app/api/stories/[id]/leaderboard/route.ts` — `GET` leaderboard

These follow the same patterns. Match their style exactly:
```typescript
// Standard Route Handler pattern (from existing code)
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // ... Supabase query + response
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**CRITICAL**: In Next.js 16, `params` is a `Promise` — you must `await params` before accessing properties. Check the existing `scores/route.ts` and `leaderboard/route.ts` for the exact pattern.

### GET /api/stories — List Endpoint

```typescript
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, description, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    return Response.json(
      data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        updatedAt: row.updated_at,
      }))
    )
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### GET /api/stories/[id] — Fetch Full Story

The response body is the raw `data` jsonb column — the full story JSON that the engine consumes. NOT wrapped in metadata.

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('stories')
      .select('data')
      .eq('id', id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    return Response.json(data.data)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### POST /api/stories/[id] — Upload/Replace Story

```typescript
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check FIRST — before any Supabase call
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Extract title and description from story JSON
    const title = body?.meta?.title ?? id
    const description = body?.meta?.description ?? ''

    const { error } = await supabase
      .from('stories')
      .upsert({
        id,
        title,
        description,
        data: body,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    return Response.json({ id, title, description, updatedAt: new Date().toISOString() }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Story JSON Structure Reference

The story JSON stored in `data` column follows the format in `docs/story-format-spec.md`. Key fields for extraction:
- `meta.title` — story title (e.g., "Dub Camp")
- `meta.description` — story description
- `id` — story identifier (e.g., "dub-camp")

### Supabase Client Reference

`lib/supabase.ts` already exists and exports a lazy-initialized `supabase` client:
```typescript
import { supabase } from '@/lib/supabase'
```

### Database Schema (Already Created in Epic 1)

```sql
-- stories table (already exists)
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dub Camp story is already seeded from Story 1.1
```

### Project Structure Notes

Files created:
1. `app/api/stories/route.ts` — NEW (GET list)
2. `app/api/stories/[id]/route.ts` — NEW (GET fetch + POST upload)

No files modified — these are new Route Handlers alongside the existing `scores/` and `leaderboard/` routes.

### Anti-Patterns to Reject

- Do NOT create a `services/storyService.ts` — Route Handlers call Supabase directly
- Do NOT use `{ data, error }` wrapper in API responses — direct JSON payloads only
- Do NOT include the full `data` jsonb in the list endpoint response — metadata only
- Do NOT skip the auth check or perform it after Supabase calls
- Do NOT use `SUPABASE_ANON_KEY` — server-only with service role key
- Do NOT use `Response.redirect()` or other patterns — always return JSON
- Do NOT forget `await params` — Next.js 16 params is a Promise

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Authentication & Security]
- [Source: app/api/stories/[id]/scores/route.ts — existing Route Handler pattern]
- [Source: app/api/stories/[id]/leaderboard/route.ts — existing Route Handler pattern]
- [Source: lib/supabase.ts — Supabase client]
- [Source: docs/story-format-spec.md — Story JSON structure]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — implementation was straightforward with no issues.

### Completion Notes List
- Implemented GET /api/stories list endpoint returning camelCase metadata (id, title, description, updatedAt) ordered by updated_at descending
- Implemented GET /api/stories/[id] returning raw story data from `data` jsonb column, with 404 for missing stories
- Implemented POST /api/stories/[id] with Bearer token auth check BEFORE any Supabase call, upsert with title/description extraction from meta, returns 201
- All handlers wrapped in try/catch returning 500 on any unhandled error
- Matched existing Route Handler patterns from scores/route.ts and leaderboard/route.ts exactly (await params, same import style)
- Added 13 unit tests covering all success paths, error paths, auth rejection, and edge cases (missing meta fallbacks)
- Updated vitest.config.ts to include `app/**/*.test.ts` and added `@` path alias resolution
- All 157 tests pass (including 13 new), no regressions. Lint errors are all pre-existing.

### Change Log
- 2026-03-05: Implemented Story 2.1 — Story Management API (GET list, GET fetch, POST upload) with full test coverage

### File List
- app/api/stories/route.ts (new)
- app/api/stories/route.test.ts (new)
- app/api/stories/[id]/route.ts (new)
- app/api/stories/[id]/route.test.ts (new)
- vitest.config.ts (modified — added app test include pattern and @ path alias)
