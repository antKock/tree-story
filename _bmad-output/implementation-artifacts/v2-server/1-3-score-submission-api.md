# Story 1.3: Score Submission API

Status: review

## Story

As a **developer**,
I want a POST endpoint that accepts and stores a player's score entry,
So that finished game results are persisted server-side for leaderboard display.

## Acceptance Criteria

1. A POST request to `/api/stories/[id]/scores` with body `{ playerName, score, isGameOver }` inserts a new row into the `scores` table when the story ID exists
2. `playerName` is trimmed and truncated to 20 characters before storage
3. The response is `201 Created` with the created score entry in camelCase JSON: `{ id, storyId, playerName, score, isGameOver, createdAt }`
4. A POST request for a non-existent story ID returns `404 Not Found` with `{ error: 'Story not found' }`
5. A Supabase failure returns `500 Internal Server Error` with `{ error: 'Internal server error' }`
6. This is a public endpoint — no auth check applies

## Tasks / Subtasks

- [x] Create Route Handler file (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `app/api/stories/[id]/scores/route.ts`
  - [x] Implement `POST` function
  - [x] Parse request body as JSON: `{ playerName, score, isGameOver }`
  - [x] Sanitize `playerName`: `(body.playerName ?? '').trim().slice(0, 20)`
  - [x] Verify story exists: `supabase.from('stories').select('id').eq('id', params.id).single()`
  - [x] If story not found → `Response.json({ error: 'Story not found' }, { status: 404 })`
  - [x] Insert score: `supabase.from('scores').insert({ story_id: params.id, player_name: playerName, score: body.score, is_game_over: body.isGameOver ?? false }).select().single()`
  - [x] Transform response to camelCase
  - [x] Return `Response.json(camelCaseEntry, { status: 201 })`
  - [x] Wrap entire function in try/catch → `Response.json({ error: 'Internal server error' }, { status: 500 })`

## Dev Notes

### Architecture Constraints

- **Route Handler pattern**: All logic in the route file, no abstraction layers
- **Server-only**: Imports `lib/supabase.ts` which uses service role key
- **Direct JSON response**: No `{ data, error }` wrapper — direct payload
- **snake_case → camelCase**: DB columns are `snake_case`, API response is `camelCase`
- **try/catch always**: Every Route Handler wrapped in try/catch with generic error fallback

### Exact Implementation Pattern

```typescript
// app/api/stories/[id]/scores/route.ts
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Sanitize player name
    const playerName = (body.playerName ?? '').trim().slice(0, 20)

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', id)
      .single()

    if (storyError || !story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Insert score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        story_id: id,
        player_name: playerName,
        score: body.score,
        is_game_over: body.isGameOver ?? false,
      })
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Transform to camelCase
    return Response.json({
      id: data.id,
      storyId: data.story_id,
      playerName: data.player_name,
      score: data.score,
      isGameOver: data.is_game_over,
      createdAt: data.created_at,
    }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Next.js 16 Route Handler Params

In Next.js 16, route handler `params` is a `Promise` — it must be `await`ed:
```typescript
// CORRECT — Next.js 16
{ params }: { params: Promise<{ id: string }> }
const { id } = await params

// WRONG — Next.js 14/15 pattern (will not work)
{ params }: { params: { id: string } }
```

### File Structure

```
app/
  api/
    stories/
      [id]/
        scores/
          route.ts    ← NEW (this story)
```

### Player Name Sanitization

Sanitization happens at API boundary, not in the client:
- `trim()` — remove leading/trailing whitespace
- `.slice(0, 20)` — enforce max 20 characters
- No character restrictions — any Unicode is accepted
- Empty string after trim is allowed (pre-v2 saves may have `playerName: ''`)

### Testing Approach

Test manually with curl:
```bash
# Success case
curl -X POST http://localhost:3000/api/stories/dub-camp/scores \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Léa", "score": 87, "isGameOver": false}'

# Non-existent story
curl -X POST http://localhost:3000/api/stories/nonexistent/scores \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Test", "score": 50, "isGameOver": false}'
```

### Dependencies

- **Requires Story 1.1**: `lib/supabase.ts` must exist, `stories` and `scores` tables must be created, Dub Camp must be seeded
- **Required by Story 1.5**: The leaderboard display will use fire-and-forget calls to this endpoint

### Anti-Patterns to Reject

- Do NOT add auth checks — this is a public endpoint (auth is only on story upload in Epic 2)
- Do NOT use `{ data, error }` wrapper in response — direct JSON payload
- Do NOT create a `services/` or `controllers/` layer
- Do NOT add rate limiting (intimate audience, not needed yet)
- Do NOT validate score range — the engine handles score calculation, the API just stores it

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Project Structure & Boundaries]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Build failed with "supabaseUrl is required" because Supabase client was created at module scope during build (no env vars). Fixed by making `lib/supabase.ts` use a Proxy for lazy initialization.

### Completion Notes List
- Created `app/api/stories/[id]/scores/route.ts` with POST handler
- Implements all ACs: story verification, player name sanitization (trim + 20 char limit), score insertion, camelCase response, 201/404/500 status codes
- Uses Next.js 16 async params pattern
- Updated `lib/supabase.ts` to use lazy initialization via Proxy to avoid build-time env var requirement
- Build passes, all 144 existing tests pass

### File List
- `app/api/stories/[id]/scores/route.ts` — NEW
- `lib/supabase.ts` — MODIFIED (lazy initialization via Proxy)
