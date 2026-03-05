# Story 1.4: Leaderboard API

Status: review

## Story

As a **developer**,
I want a GET endpoint that returns all score entries for a story sorted by score descending,
So that the frontend can display a ranked leaderboard.

## Acceptance Criteria

1. A GET request to `/api/stories/[id]/leaderboard` for a story with scores returns `200 OK` with an array of entries sorted by `score` descending
2. Each entry contains: `id`, `storyId`, `playerName`, `score`, `isGameOver`, `createdAt` (all camelCase)
3. A GET request for a story with no scores returns `200 OK` with an empty array `[]`
4. A GET request for a non-existent story ID returns `404 Not Found` with `{ error: 'Story not found' }`
5. A Supabase failure returns `500 Internal Server Error` with `{ error: 'Internal server error' }`

## Tasks / Subtasks

- [x] Create Route Handler file (AC: #1, #2, #3, #4, #5)
  - [x] Create `app/api/stories/[id]/leaderboard/route.ts`
  - [x] Implement `GET` function
  - [x] Verify story exists: `supabase.from('stories').select('id').eq('id', params.id).single()`
  - [x] If story not found → `Response.json({ error: 'Story not found' }, { status: 404 })`
  - [x] Fetch scores: `supabase.from('scores').select('*').eq('story_id', params.id).order('score', { ascending: false })`
  - [x] Transform each row from `snake_case` to `camelCase`
  - [x] Return `Response.json(entries)` (200 is default)
  - [x] Wrap in try/catch → `Response.json({ error: 'Internal server error' }, { status: 500 })`

## Dev Notes

### Exact Implementation Pattern

```typescript
// app/api/stories/[id]/leaderboard/route.ts
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', id)
      .single()

    if (storyError || !story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Fetch scores sorted by score descending
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('story_id', id)
      .order('score', { ascending: false })

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Transform to camelCase
    const entries = (data ?? []).map(row => ({
      id: row.id,
      storyId: row.story_id,
      playerName: row.player_name,
      score: row.score,
      isGameOver: row.is_game_over,
      createdAt: row.created_at,
    }))

    return Response.json(entries)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Next.js 16 Route Handler Params

Same as Story 1.3 — `params` is a `Promise` in Next.js 16:
```typescript
{ params }: { params: Promise<{ id: string }> }
const { id } = await params
```

### File Structure

```
app/
  api/
    stories/
      [id]/
        leaderboard/
          route.ts    ← NEW (this story)
        scores/
          route.ts    ← Created in Story 1.3
```

### Query Performance

The `idx_scores_story_score` index (created in Story 1.1) covers this query:
```sql
SELECT * FROM scores WHERE story_id = $1 ORDER BY score DESC
```
No additional optimization needed for current scale.

### Testing Approach

```bash
# Scores exist
curl http://localhost:3000/api/stories/dub-camp/leaderboard

# No scores (empty array)
curl http://localhost:3000/api/stories/dub-camp/leaderboard
# → [] (after fresh seed with no scores)

# Non-existent story
curl http://localhost:3000/api/stories/nonexistent/leaderboard
# → { "error": "Story not found" }
```

### Dependencies

- **Requires Story 1.1**: `lib/supabase.ts`, `stories` and `scores` tables
- **Benefits from Story 1.3**: Having scores in the table to test against
- **Required by Story 1.5**: Frontend leaderboard display fetches from this endpoint

### Anti-Patterns to Reject

- Do NOT add pagination — the audience is intimate, full list is fine
- Do NOT add auth — this is a public endpoint
- Do NOT use `{ data, error }` wrapper in response
- Do NOT add filtering parameters (by date, by player) — not needed for MVP
- Do NOT limit the number of results — the list is expected to be short

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Implementation Patterns & Consistency Rules]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no issues encountered.

### Completion Notes List
- Created `app/api/stories/[id]/leaderboard/route.ts` with GET handler
- Implements all ACs: story verification, scores sorted by score DESC, camelCase transformation, empty array for no scores, 404/500 error responses
- Uses Next.js 16 async params pattern
- Leverages `idx_scores_story_score` index from Story 1.1
- Build passes, all 144 existing tests pass

### File List
- `app/api/stories/[id]/leaderboard/route.ts` — NEW
