# Story 1.1: Supabase Infrastructure & Server Client

Status: review

## Story

As a **developer**,
I want to set up the Supabase schema, seed the existing story, and configure the server client,
So that all score and leaderboard API endpoints have a working data layer to build on.

## Acceptance Criteria

1. `@supabase/supabase-js` is installed in package.json
2. A `stories` table exists in Supabase with columns: `id` (text PK), `title` (text), `description` (text), `data` (jsonb), `created_at` (timestamptz), `updated_at` (timestamptz)
3. A `scores` table exists with columns: `id` (uuid PK auto-generated), `story_id` (text FK → stories.id), `player_name` (text), `score` (integer), `is_game_over` (boolean), `created_at` (timestamptz)
4. Dub Camp story JSON is seeded into the `stories` table from `public/stories/dub-camp.json`
5. `lib/supabase.ts` exports a single named `supabase` client created with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
6. `.env.local` and `.env.example` are created with the required env var keys
7. The app builds and runs without errors locally

## Tasks / Subtasks

- [x] Install `@supabase/supabase-js` (AC: #1)
  - [x] `npm install @supabase/supabase-js`
  - [x] Verify it appears in `package.json` dependencies
- [x] Create Supabase migration SQL (AC: #2, #3)
  - [x] Write SQL for `stories` table: `id` text PK, `title` text NOT NULL, `description` text NOT NULL DEFAULT '', `data` jsonb NOT NULL, `created_at` timestamptz DEFAULT now(), `updated_at` timestamptz DEFAULT now()
  - [x] Write SQL for `scores` table: `id` uuid PK DEFAULT gen_random_uuid(), `story_id` text NOT NULL REFERENCES stories(id), `player_name` text NOT NULL, `score` integer NOT NULL, `is_game_over` boolean NOT NULL DEFAULT false, `created_at` timestamptz DEFAULT now()
  - [x] Add index on `scores(story_id, score DESC)` for leaderboard queries
  - [x] Save migration SQL to `supabase/migrations/` or `docs/` for reference
- [x] Create seed script (AC: #4)
  - [x] Write a seed script or SQL that reads `public/stories/dub-camp.json` and inserts into `stories` table with id='dub-camp', title from `meta.title`, description from `meta.description`, data as full JSON
  - [x] Save seed script to `supabase/seed.sql` or equivalent
- [x] Create `lib/supabase.ts` (AC: #5)
  - [x] Single file with single named export: `supabase`
  - [x] Uses `createClient` from `@supabase/supabase-js`
  - [x] Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `process.env`
  - [x] Server-only — this file must never be imported by client components
- [x] Create environment variable files (AC: #6)
  - [x] `.env.example` with `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` (no values)
  - [x] `.env.local` with actual development values (already in .gitignore)
  - [x] Verify `.env.local` is in `.gitignore`
- [x] Verify build (AC: #7)
  - [x] Run `npm run build` — no errors
  - [x] Run `npm run dev` — app loads correctly

## Dev Notes

### Architecture Constraints

- **Server-only Supabase access**: `lib/supabase.ts` is imported ONLY by Route Handlers (`app/api/**/route.ts`) and server components. NEVER from `engine/`, `hooks/`, or `components/`.
- **No RLS policies**: All access uses the service role key. No Row Level Security needed.
- **No abstraction layers**: No `services/`, `repositories/`, or `controllers/` directories. Route Handlers call Supabase directly.
- **Single client instance**: One `createClient()` call in `lib/supabase.ts`, one named export.

### Implementation Pattern

```typescript
// lib/supabase.ts — exact pattern
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Database Schema — Exact SQL

```sql
-- stories table
CREATE TABLE stories (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- scores table
CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id text NOT NULL REFERENCES stories(id),
  player_name text NOT NULL,
  score integer NOT NULL,
  is_game_over boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for leaderboard queries
CREATE INDEX idx_scores_story_score ON scores(story_id, score DESC);
```

### Seed Data

The Dub Camp story at `public/stories/dub-camp.json` has:
- `id`: "dub-camp"
- `meta.title`: "Dub Crampe"
- `meta.description`: "Le Dub Camp. Pas besoin d'en dire plus..."

Seed SQL:
```sql
INSERT INTO stories (id, title, description, data)
VALUES (
  'dub-camp',
  'Dub Crampe',
  'Le Dub Camp. Pas besoin d''en dire plus...',
  '<full JSON from public/stories/dub-camp.json>'::jsonb
);
```

### Environment Variables

- `SUPABASE_URL` — The Supabase project URL (e.g., `https://xxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — The service role key (server-side only, never exposed to client)
- These are already configured in Vercel project settings for production
- `.env.local` for local development (already in `.gitignore` by Next.js default)

### Naming Conventions

- **Database columns**: `snake_case` — `story_id`, `player_name`, `is_game_over`, `created_at`
- **API responses** (later stories): `camelCase` — translation happens in Route Handlers
- **File naming**: `lib/supabase.ts` — consistent with existing `lib/utils.ts`

### Project Structure Notes

- `lib/supabase.ts` sits alongside existing `lib/utils.ts`
- Migration SQL goes in `supabase/migrations/` (new directory) or `docs/` — developer's choice
- No changes to existing code — this story is purely additive

### Anti-Patterns to Reject

- Do NOT use `SUPABASE_ANON_KEY` — server-only with service role key
- Do NOT create a client-side Supabase instance
- Do NOT add RLS policies (no need — all access is server-side)
- Do NOT create abstraction layers (services, repos) for the client
- Do NOT import `lib/supabase.ts` from any `'use client'` file

### References

- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 1.1]
- [Source: _bmad-output/project-context.md#Technology Stack & Versions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no issues encountered.

### Completion Notes List
- Installed `@supabase/supabase-js` v2.98.0
- Created migration SQL at `supabase/migrations/001_initial_schema.sql` with stories and scores tables plus leaderboard index
- Created seed SQL at `supabase/seed.sql` with Dub Camp story insert (ON CONFLICT upsert)
- Created `lib/supabase.ts` with single named export using service role key
- Created `.env.example` with required env var keys
- `.env.local` already covered by `.gitignore` (`.env*` pattern)
- Build verified: `npm run build` succeeds with no errors

### File List
- `lib/supabase.ts` — NEW
- `.env.example` — NEW
- `supabase/migrations/001_initial_schema.sql` — NEW
- `supabase/seed.sql` — NEW
- `package.json` — MODIFIED (added @supabase/supabase-js dependency)
- `package-lock.json` — MODIFIED (lockfile updated)
