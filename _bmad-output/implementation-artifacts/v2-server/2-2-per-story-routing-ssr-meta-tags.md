# Story 2.2: Per-Story Routing with SSR Meta Tags

Status: review

## Story

As a **player**,
I want to access any story via its unique URL and share it with a rich link preview,
So that I can navigate directly to a specific story and friends see an informative preview when I share it.

## Acceptance Criteria

1. Navigating to `/<story-id>` (e.g., `/dub-camp`) renders the story page with story content fetched server-side from Supabase in `app/[storyId]/page.tsx`
2. The existing `GameShell` → `StoryReader` client component pipeline receives story data as props and operates unchanged
3. The engine continues to function entirely client-side (FR18)
4. Navigating to `/<story-id>` for a non-existent story shows a graceful fallback — no blank screen, no unhandled error (NFR7)
5. `generateMetadata()` in `app/[storyId]/page.tsx` provides OG meta tags: `og:title` (story title), `og:description` (story description) for social sharing previews (FR16)
6. A player with an existing save from before Epic 2 (using the legacy `tree-story:save` key), when loading `/<story-id>` for the first time, has their save migrated to `tree-story:save:<storyId>` — data preserved, old key removed (NFR9)
7. After migration, saves are stored and retrieved using `tree-story:save:<storyId>` going forward
8. The migration only runs if `tree-story:save` exists AND `tree-story:save:<storyId>` does NOT — no data loss in any scenario

## Tasks / Subtasks

- [x] Create `app/[storyId]/page.tsx` — server component with SSR meta tags (AC: #1, #2, #3, #4, #5)
  - [x] Server component fetches story from Supabase by `storyId` param
  - [x] `generateMetadata()` returns `og:title`, `og:description` from story metadata
  - [x] On success: validate story JSON with `validateStoryConfig()` and render `<GameShell config={storyConfig} />`
  - [x] On failure (story not found): render a graceful fallback message — not `notFound()`, just a friendly message
  - [x] On Supabase error: render a graceful fallback — never a blank page
- [x] Update `engine/persistence.ts` — per-story localStorage keys with migration (AC: #6, #7, #8)
  - [x] Change `SAVE_KEY` from a constant to a function: `getSaveKey(storyId: string): string` returning `tree-story:save:${storyId}`
  - [x] Keep legacy key constant: `LEGACY_SAVE_KEY = 'tree-story:save'`
  - [x] Add `migrateToPerStoryKey(storyId: string): void` — if legacy key exists and per-story key does not, move data and remove legacy key
  - [x] Update `save(engineState, storyId)` to use `getSaveKey(storyId)`
  - [x] Update `load(storyId)` to accept `storyId` parameter and use `getSaveKey(storyId)` — add `storyId` as required parameter
  - [x] Update `clear(storyId)` to accept `storyId` parameter and use `getSaveKey(storyId)`
- [x] Update all callers of persistence functions to pass `storyId` (AC: #3)
  - [x] `hooks/useStoryEngine.ts` — update `persistence.save()`, `persistence.load()`, `persistence.clear()` calls
  - [x] `components/GameShell.tsx` — update `persistence.load()` and `persistence.clear()` calls in `hasActiveGame()`
  - [x] Call `persistence.migrateToPerStoryKey(config.id)` in `GameShell` `useEffect` before checking for active game
- [x] Update `app/page.tsx` — remove the current story-loading logic (AC: #1)
  - [x] The root page will be replaced by the landing page in Story 2.3 — for NOW, redirect to `/dub-camp` or render a simple placeholder until Story 2.3 is implemented

## Dev Notes

### Architecture Constraints

- **Server component for SSR**: `app/[storyId]/page.tsx` is a server component — it can import from `@/lib/supabase` directly (no API hop needed). The `GameShell` client component receives `config` as a serialized prop.
- **Engine isolation preserved**: The engine still runs entirely client-side. The server component only fetches and validates the story JSON, then passes it to the client pipeline.
- **Supabase direct access**: From a server component, query Supabase directly — do NOT call `/api/stories/[id]`. Server components can use the Supabase client without going through Route Handlers.

### `app/[storyId]/page.tsx` — Implementation Pattern

```typescript
import { supabase } from '@/lib/supabase'
import { validateStoryConfig } from '@/engine/storyValidator'
import { StoryValidationError } from '@/engine/types'
import DevErrorScreen from '@/components/DevErrorScreen'
import GameShell from '@/components/GameShell'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ storyId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { storyId } = await params

  try {
    const { data } = await supabase
      .from('stories')
      .select('title, description')
      .eq('id', storyId)
      .single()

    if (!data) return { title: 'Tree Story' }

    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
      },
    }
  } catch {
    return { title: 'Tree Story' }
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { storyId } = await params

  try {
    const { data, error } = await supabase
      .from('stories')
      .select('data')
      .eq('id', storyId)
      .single()

    if (error || !data) {
      return (
        <div className="reading-column" style={{ paddingTop: '3rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>
            Cette histoire n&apos;existe pas.
          </p>
        </div>
      )
    }

    const storyConfig = validateStoryConfig(data.data)
    return <GameShell config={storyConfig} />
  } catch (e) {
    if (e instanceof StoryValidationError) {
      return <DevErrorScreen error={e} />
    }
    return (
      <div className="reading-column" style={{ paddingTop: '3rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>
          Impossible de charger cette histoire.
        </p>
      </div>
    )
  }
}
```

**CRITICAL**: In Next.js 16, `params` is a `Promise` — you MUST `await params` in both `generateMetadata()` and the page component.

### `engine/persistence.ts` — Migration Pattern

```typescript
const LEGACY_SAVE_KEY = 'tree-story:save'

function getSaveKey(storyId: string): string {
  return `tree-story:save:${storyId}`
}

export function migrateToPerStoryKey(storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return
  const legacyData = localStorage.getItem(LEGACY_SAVE_KEY)
  const newKey = getSaveKey(storyId)
  if (legacyData && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacyData)
    localStorage.removeItem(LEGACY_SAVE_KEY)
  }
}

export function save(engineState: EngineState, storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return
  const saveState: SaveState = {
    storyId,
    version: 1,
    savedAt: Date.now(),
    engineState,
  }
  localStorage.setItem(getSaveKey(storyId), JSON.stringify(saveState))
}

export function load(storyId: string): SaveState | null {
  if (typeof globalThis.localStorage === 'undefined') return null
  try {
    const item = localStorage.getItem(getSaveKey(storyId))
    // ... same validation as current code
  } catch {
    return null
  }
}

export function clear(storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return
  localStorage.removeItem(getSaveKey(storyId))
}
```

### Caller Updates — Breaking Change in `persistence` API

The `load()` and `clear()` functions gain a required `storyId` parameter. All callers must be updated:

**`components/GameShell.tsx`** — `hasActiveGame()` and `handleReplay()`:
```typescript
// BEFORE: persistence.load() / persistence.clear()
// AFTER:
function hasActiveGame(config: StoryConfig): boolean {
  const saved = persistence.load(config.id)
  // ... rest unchanged
  persistence.clear(config.id)
  // ...
}

// In useEffect — run migration BEFORE checking active game:
useEffect(() => {
  persistence.migrateToPerStoryKey(config.id)
  const active = hasActiveGame(config)
  // ...
}, [config])
```

**`hooks/useStoryEngine.ts`** — all persistence calls need `config.id`:
```typescript
// Wherever persistence.save() is called:
persistence.save(engineState, config.id)  // already passes storyId — verify this

// Wherever persistence.load() is called:
persistence.load(config.id)  // NEW: needs storyId

// Wherever persistence.clear() is called:
persistence.clear(config.id)  // NEW: needs storyId
```

### `app/page.tsx` — Transition Strategy

The current root page loads `dub-camp.json` from the filesystem. With multi-story routing, this page becomes the landing page (Story 2.3). For this story:

**Option A (recommended)**: Replace `app/page.tsx` with a simple placeholder/redirect that points to Story 2.3's work:
```typescript
import { redirect } from 'next/navigation'
redirect('/dub-camp')
```

**Option B**: Leave `app/page.tsx` unchanged temporarily — it will be fully replaced in Story 2.3.

Choose Option A if Story 2.3 will be implemented immediately after. Choose Option B if there may be a gap.

### Theme Persistence for Landing Page (Future)

The `themeManager` currently applies themes from the story config. For Story 2.3 (landing page), the landing page needs to read the last story's theme from localStorage. This is NOT in scope for Story 2.2 — but the per-story save key migration lays the groundwork.

### Existing Code Structure (What NOT to Break)

- `GameShell.tsx` manages the `'landing' | 'profile' | 'story' | 'loading'` phase flow — this is unchanged
- `StoryReader.tsx` is the sole consumer of `useStoryEngine` — this is unchanged
- Engine isolation: `engine/` has zero imports from `components/`, `hooks/`, `app/`, or `lib/` — this MUST remain true
- The `LandingScreen` component inside `GameShell.tsx` is the per-story landing (title + "Commencer" button) — NOT the multi-story listing landing page from Story 2.3

### Testing Considerations

- Verify existing 144 engine tests still pass (`npx vitest`)
- Verify the app builds (`npm run build`)
- Manual test: navigate to `/dub-camp` — should load the story from Supabase
- Manual test: navigate to `/nonexistent` — should show graceful fallback
- Manual test: with legacy `tree-story:save` in localStorage, navigate to `/dub-camp` — save should migrate to `tree-story:save:dub-camp`
- Manual test: share `/dub-camp` URL — should show OG tags in link preview

### Project Structure Notes

Files created:
1. `app/[storyId]/page.tsx` — NEW (server component + SSR meta)

Files modified:
2. `engine/persistence.ts` — per-story keys + migration function
3. `components/GameShell.tsx` — call `migrateToPerStoryKey()`, pass `storyId` to persistence
4. `hooks/useStoryEngine.ts` — pass `storyId` to persistence calls
5. `app/page.tsx` — simplified to redirect or placeholder

### Anti-Patterns to Reject

- Do NOT call `/api/stories/[id]` from the server component — query Supabase directly
- Do NOT use `notFound()` for missing stories — render a graceful fallback within the page
- Do NOT import `lib/supabase.ts` from any client component or hook
- Do NOT break the existing `persistence.save(engineState, storyId)` call signature — it already takes `storyId`
- Do NOT create a theme localStorage key separate from the save state — theme data lives within the save
- Do NOT introduce a loading spinner for story fetch — server component renders when ready
- Do NOT forget to run the migration BEFORE checking for active game in GameShell

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Data Architecture — localStorage Key Evolution]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Process Patterns — localStorage key migration]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Project Structure & Boundaries]
- [Source: app/page.tsx — current root page implementation]
- [Source: engine/persistence.ts — current persistence implementation]
- [Source: components/GameShell.tsx — current game shell implementation]
- [Source: hooks/useStoryEngine.ts — persistence caller]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — straightforward implementation.

### Completion Notes List
- Created `app/[storyId]/page.tsx` server component with `generateMetadata()` for OG tags and direct Supabase fetch. Uses discriminated union pattern to avoid JSX-in-try/catch lint issue.
- Refactored `engine/persistence.ts`: replaced single `SAVE_KEY` with `getSaveKey(storyId)` function (`tree-story:save:<storyId>`), added `migrateToPerStoryKey()` for legacy key migration, updated `load()` and `clear()` to require `storyId` parameter.
- Updated `components/GameShell.tsx`: calls `migrateToPerStoryKey(config.id)` before `hasActiveGame()` in useEffect, passes `config.id` to `persistence.load()` and `persistence.clear()`.
- Updated `hooks/useStoryEngine.ts`: passes `config.id` to `persistence.load()` and `persistence.clear()`.
- Updated existing persistence tests to use new per-story key format (`tree-story:save:storyId`).
- `app/page.tsx` replaced with landing page (implemented together with Story 2.3).
- All 157 tests pass, no new lint errors.

### Change Log
- 2026-03-05: Implemented Story 2.2 — Per-story routing with SSR meta tags and localStorage migration

### File List
- app/[storyId]/page.tsx (new)
- engine/persistence.ts (modified — per-story keys + migration)
- components/GameShell.tsx (modified — migration call + storyId params)
- hooks/useStoryEngine.ts (modified — storyId params to load/clear)
- engine/storyEngine.test.ts (modified — updated persistence tests for new API)
- app/page.tsx (modified — simplified; full landing page replacement done in Story 2.3)
