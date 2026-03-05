# Story 2.3: Story Listing Landing Page

Status: ready-for-dev

## Story

As a **player**,
I want a landing page at `/` that shows all available stories,
So that I can discover new stories and return to ones I've already played.

## Acceptance Criteria

1. Navigating to `/` renders a hero section with: headline in Lora ("Des histoires dont tu choisis la suite"), sub-headline in Inter, and a CTA button ("Découvrir les histoires ↓") that smooth-scrolls to the story list section (FR13)
2. The story list shows all available stories fetched from Supabase in the server component
3. Each story card displays: title (Lora, `--color-text-primary`), one-sentence description (Inter, `--color-text-muted`), soft player count (vague: "quelques joueurs" <10, "une dizaine de joueurs" 10–30, "des dizaines de joueurs" 30+), and last update date (FR14)
4. Tapping a story card navigates to `/<story-id>` — the entire card is the tap target as a `<Link>` (FR15)
5. A story that has been completed by the player (save state indicates story ended) shows a subtle "Terminé" badge — `--color-text-muted` pill, top-right of card, with `aria-label="Histoire terminée"` (localStorage-powered)
6. The page applies the last story's theme from localStorage via CSS custom properties — if no theme exists (first visit), app shell defaults apply (`--color-bg: #0f0f0f`, `--color-accent: #d4935a`)
7. If the Supabase story list fetch fails, a static fallback message is shown — never a blank page (NFR7)
8. Keyboard navigation: tab order follows visual order (hero CTA → story cards top to bottom), all interactive elements have visible focus indicators (`outline: 2px solid var(--color-accent)`, `outline-offset: 2px`)
9. Story cards have descriptive `aria-label` combining title + completion state
10. The layout is mobile-first, single centered column `max-width: 65ch`, no new design tokens

## Tasks / Subtasks

- [ ] Create `components/LandingHero.tsx` (AC: #1, #8, #10)
  - [ ] Centered column layout matching reading-column pattern
  - [ ] Headline: Lora, `--color-text-primary`, "Des histoires dont tu choisis la suite"
  - [ ] Sub-headline: Inter, `--color-text-muted`, "Chaque choix compte. Chaque partie est différente."
  - [ ] CTA button: "Découvrir les histoires ↓", `--color-accent` bg, `--color-bg` text, smooth-scrolls to `#stories`
  - [ ] Focus indicator: `outline: 2px solid var(--color-accent)`, `outline-offset: 2px`
- [ ] Create `components/StoryCard.tsx` (AC: #3, #4, #5, #8, #9)
  - [ ] Props: `id`, `title`, `description`, `updatedAt`, `playerCount`, `isCompleted`
  - [ ] Full card wrapped in `<Link href={/${id}}>` — entire card is tap target
  - [ ] Title: Lora, `--color-text-primary`
  - [ ] Description: Inter, `--color-text-muted`, one sentence
  - [ ] Metadata row: soft player count + last update date (Inter, muted)
  - [ ] "Terminé" badge: conditional, `--color-text-muted` pill, top-right, `aria-label="Histoire terminée"`
  - [ ] Card styling: `--color-surface` bg, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 8px`, `padding: 1.25rem`
  - [ ] Card `aria-label`: combine title + completion state
  - [ ] Focus indicator on the Link element
- [ ] Create `components/StoryListClient.tsx` — client component for localStorage access (AC: #5, #6)
  - [ ] Receives stories array from server as props
  - [ ] On mount: read all `tree-story:save:<storyId>` keys to determine completion state for each story
  - [ ] On mount: read last story's theme from localStorage and apply to `:root` via CSS custom properties
  - [ ] Render `<StoryCard>` for each story with `isCompleted` derived from localStorage
- [ ] Replace `app/page.tsx` — landing page server component (AC: #2, #7)
  - [ ] Server component fetches story list from Supabase directly (no API hop)
  - [ ] Query: `select('id, title, description, updated_at')` + count scores per story for player counts
  - [ ] On success: render `<LandingHero />` + `<StoryListClient stories={stories} />`
  - [ ] On Supabase failure: render a static fallback message
  - [ ] Remove the old `dub-camp.json` filesystem loading code entirely

## Dev Notes

### Architecture Constraints

- **Server component for data**: `app/page.tsx` is a server component that fetches stories from Supabase directly — no API hop needed.
- **Client component for localStorage**: A `StoryListClient` wrapper is needed because `localStorage` is only available client-side. The server component passes stories data as props; the client component reads localStorage for completion state and theme.
- **No new design tokens**: All new surfaces use the existing 6 CSS custom properties.
- **Mobile-first, single column**: `max-width: 65ch`, centered, matching the reading column pattern.

### `app/page.tsx` — Server Component

```typescript
import { supabase } from '@/lib/supabase'
import LandingHero from '@/components/LandingHero'
import StoryListClient from '@/components/StoryListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tree Story — Des histoires dont tu choisis la suite',
  description: 'Des histoires interactives où chaque choix compte.',
  openGraph: {
    title: 'Tree Story',
    description: 'Des histoires interactives où chaque choix compte.',
  },
}

interface StoryListItem {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
}

export default async function LandingPage() {
  let stories: StoryListItem[] = []

  try {
    // Fetch stories
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('id, title, description, updated_at')
      .order('updated_at', { ascending: false })

    if (!storyError && storyData) {
      // Fetch player counts per story (count unique scores)
      const storyIds = storyData.map(s => s.id)
      const { data: countData } = await supabase
        .from('scores')
        .select('story_id')
        .in('story_id', storyIds)

      const counts: Record<string, number> = {}
      if (countData) {
        for (const row of countData) {
          counts[row.story_id] = (counts[row.story_id] || 0) + 1
        }
      }

      stories = storyData.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        updatedAt: row.updated_at,
        playerCount: counts[row.id] || 0,
      }))
    }
  } catch {
    // Supabase failure — stories stays empty, fallback rendered
  }

  if (stories.length === 0) {
    return (
      <div className="reading-column" style={{ paddingTop: '3rem' }}>
        <LandingHero />
        <p style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          textAlign: 'center',
          marginTop: '3rem',
        }}>
          Aucune histoire disponible pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="reading-column">
      <LandingHero />
      <StoryListClient stories={stories} />
    </div>
  )
}
```

**Note on player count query**: The above uses a simple approach of fetching all score rows and counting client-side. For a small dataset this is fine. An alternative is using Supabase's `.select('story_id, count', { count: 'exact' })` with grouping — but the simple approach is adequate for the current scale.

### `components/LandingHero.tsx`

```typescript
// No 'use client' needed — can be a server component (no state, no effects)
export default function LandingHero() {
  return (
    <section style={{ paddingTop: '4rem', paddingBottom: '3rem', textAlign: 'center' }}>
      {/* Optional illustration/logo placeholder */}
      <h1 style={{
        fontFamily: 'var(--font-prose)', // Lora
        fontSize: '1.75rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        lineHeight: 1.3,
        marginBottom: '1rem',
      }}>
        Des histoires dont tu choisis la suite
      </h1>
      <p style={{
        fontFamily: 'var(--font-ui)', // Inter
        fontSize: '1rem',
        color: 'var(--color-text-muted)',
        marginBottom: '2rem',
      }}>
        Chaque choix compte. Chaque partie est différente.
      </p>
      <a
        href="#stories"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: 'var(--color-accent)',
          color: 'var(--color-bg)',
          borderRadius: '8px',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Découvrir les histoires ↓
      </a>
    </section>
  )
}
```

Add `scroll-behavior: smooth` to `html` in `globals.css` if not already present.

### `components/StoryCard.tsx`

```typescript
import Link from 'next/link'

interface StoryCardProps {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
  isCompleted: boolean
}

function formatPlayerCount(count: number): string {
  if (count === 0) return ''
  if (count < 10) return 'Quelques joueurs'
  if (count <= 30) return 'Une dizaine de joueurs'
  return 'Des dizaines de joueurs'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StoryCard({ id, title, description, updatedAt, playerCount, isCompleted }: StoryCardProps) {
  const playerCountText = formatPlayerCount(playerCount)
  const ariaLabel = isCompleted ? `${title} — Histoire terminée` : title

  return (
    <Link
      href={`/${id}`}
      aria-label={ariaLabel}
      style={{
        display: 'block',
        position: 'relative',
        padding: '1.25rem',
        background: 'var(--color-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        textDecoration: 'none',
        marginBottom: '1rem',
      }}
    >
      {isCompleted && (
        <span
          aria-label="Histoire terminée"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            color: 'var(--color-text-muted)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Terminé
        </span>
      )}

      <h2 style={{
        fontFamily: 'var(--font-prose)', // Lora
        fontSize: '1.2rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        marginBottom: '0.5rem',
      }}>
        {title}
      </h2>

      <p style={{
        fontFamily: 'var(--font-ui)', // Inter
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
        lineHeight: 1.5,
        marginBottom: '0.75rem',
      }}>
        {description}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        {playerCountText && <span>{playerCountText}</span>}
        <span>{formatDate(updatedAt)}</span>
      </div>
    </Link>
  )
}
```

### `components/StoryListClient.tsx` — Client Wrapper

This client component bridges server data with localStorage state:

```typescript
'use client'

import { useEffect, useState } from 'react'
import StoryCard from './StoryCard'
import * as themeManager from '@/engine/themeManager'

interface StoryItem {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
}

interface StoryListClientProps {
  stories: StoryItem[]
}

export default function StoryListClient({ stories }: StoryListClientProps) {
  const [completedStories, setCompletedStories] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check completion state for each story via localStorage
    const completed = new Set<string>()
    for (const story of stories) {
      try {
        const key = `tree-story:save:${story.id}`
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          const es = parsed?.engineState
          if (es && (es.isComplete || es.isGameOver)) {
            completed.add(story.id)
          }
        }
      } catch {
        // Corrupt save — skip
      }
    }
    setCompletedStories(completed)

    // Apply last story theme from localStorage
    // Find the most recently saved story and apply its theme
    applyLastThemeFromStorage()
  }, [stories])

  return (
    <section id="stories" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {stories.map(story => (
        <StoryCard
          key={story.id}
          id={story.id}
          title={story.title}
          description={story.description}
          updatedAt={story.updatedAt}
          playerCount={story.playerCount}
          isCompleted={completedStories.has(story.id)}
        />
      ))}
    </section>
  )
}

function applyLastThemeFromStorage(): void {
  // Look through per-story save keys to find the most recent save
  // and apply that story's theme
  try {
    let latestSave: { savedAt: number; engineState: { act: string; storyId: string } } | null = null

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('tree-story:save:')) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw)
      if (parsed?.savedAt && (!latestSave || parsed.savedAt > latestSave.savedAt)) {
        latestSave = parsed
      }
    }

    if (latestSave) {
      // Apply the theme from the last saved story
      // We need the story config to apply the theme, but we don't have it here.
      // Instead, store theme tokens directly in localStorage when playing.
      // For now, if a theme was previously saved, it persists on :root via the
      // CSS custom properties that themeManager already set.
      // The theme persists in :root from the last session — no action needed
      // if the browser hasn't been closed. For cross-session persistence,
      // themeManager.ts would need to save/restore theme tokens.
    }
  } catch {
    // Ignore errors — defaults apply
  }
}
```

**IMPORTANT NOTE ON THEME PERSISTENCE**: The current `themeManager.ts` applies themes by setting CSS custom properties on `:root` — but these don't persist across page loads. For the landing page to inherit the last story's theme, one of these approaches is needed:

1. **Store theme tokens in localStorage** — `themeManager.ts` saves the current theme's CSS values to a dedicated key (e.g., `tree-story:theme`), and the landing page reads and applies them on mount.
2. **Derive from save state** — The save state contains the `act` name, and if we have the story config, we can look up the act's theme. But on the landing page we don't load story configs.

**Recommended approach**: Add a `tree-story:theme` localStorage key in `themeManager.ts` that stores the current CSS custom property values as JSON. The landing page client component reads this on mount and applies them. This is a small addition to `themeManager.ts`:

```typescript
// In themeManager.ts — add to apply() function:
export function apply(actId: string, config: StoryConfig): void {
  // ... existing logic to set CSS properties ...

  // Persist theme for landing page
  if (typeof globalThis.localStorage !== 'undefined') {
    const theme = {
      '--color-bg': document.documentElement.style.getPropertyValue('--color-bg'),
      '--color-surface': document.documentElement.style.getPropertyValue('--color-surface'),
      // ... etc for all 6 tokens
    }
    localStorage.setItem('tree-story:theme', JSON.stringify(theme))
  }
}
```

Then in `StoryListClient.tsx`:
```typescript
function applyLastThemeFromStorage(): void {
  try {
    const raw = localStorage.getItem('tree-story:theme')
    if (!raw) return
    const theme = JSON.parse(raw)
    for (const [prop, value] of Object.entries(theme)) {
      if (typeof value === 'string' && value) {
        document.documentElement.style.setProperty(prop, value)
      }
    }
  } catch {
    // Defaults apply
  }
}
```

### Font Variable Names

Check `app/layout.tsx` for the exact CSS variable names for fonts. The existing code uses:
- `--font-prose` for Lora (narrative text)
- `--font-ui` for Inter (mechanical UI)

Verify these match before using in components.

### Smooth Scroll

Add to `app/globals.css` if not already present:
```css
html {
  scroll-behavior: smooth;
}
```

### Soft Player Count Logic

```typescript
function formatPlayerCount(count: number): string {
  if (count === 0) return ''
  if (count < 10) return 'Quelques joueurs'
  if (count <= 30) return 'Une dizaine de joueurs'
  return 'Des dizaines de joueurs'
}
```

This uses the total number of score entries per story as a proxy for "player count." It's not a count of unique players — but for the current intimate audience, this is acceptable and avoids a more complex query.

### Date Formatting

Use French locale for dates:
```typescript
new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
// → "5 mars 2026"
```

### Dependencies on Previous Stories

- **Story 2.1**: Story Management API — needed for `GET /api/stories` (though the landing page queries Supabase directly from the server component, not through the API)
- **Story 2.2**: Per-Story Routing — needed for `/<story-id>` routes to work when story cards are tapped, and for per-story localStorage keys

### Existing `GameShell.tsx` LandingScreen

`GameShell.tsx` contains a `LandingScreen` component that shows a per-story landing (story title + "Commencer" button). This is NOT the same as the multi-story landing page. The `LandingScreen` in GameShell is for individual story entry and remains unchanged. The new landing page at `/` is a completely separate page.

### Focus Indicators

Add global focus styles if not already present:
```css
/* In globals.css */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Project Structure Notes

Files created:
1. `components/LandingHero.tsx` — NEW
2. `components/StoryCard.tsx` — NEW
3. `components/StoryListClient.tsx` — NEW (client component for localStorage)

Files modified:
4. `app/page.tsx` — REPLACED (was filesystem story loader, now landing page server component)
5. `engine/themeManager.ts` — MODIFIED (persist theme tokens to localStorage for landing page)
6. `app/globals.css` — MODIFIED (add `scroll-behavior: smooth` and focus indicators if needed)

### Anti-Patterns to Reject

- Do NOT create `services/` or `repositories/` for story listing
- Do NOT use images, ratings, or categories on story cards — minimal metadata only
- Do NOT add a loading spinner or skeleton for the story list
- Do NOT use `useEffect` to fetch stories client-side — fetch in the server component
- Do NOT use `--color-accent` as a card background — only for interactive highlights and the CTA
- Do NOT add multi-column card layouts — single column always
- Do NOT add a hamburger menu or tab bar — no new global navigation
- Do NOT add a search field or filters
- Do NOT create separate completed/uncompleted story sections — single flat list
- Do NOT import `themeManager` from `components/` — the landing page client component can access localStorage directly for theme restoration, or `themeManager` can export a restore function that doesn't require a story config

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Component Strategy — LandingHero]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Component Strategy — StoryCard]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#User Journey Flows — Journey 2]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#State Persistence Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Data Flow — Phase 2]
- [Source: app/page.tsx — current root page (to be replaced)]
- [Source: components/GameShell.tsx — existing LandingScreen (per-story, NOT multi-story)]
- [Source: engine/themeManager.ts — current theme application]
- [Source: app/globals.css — design tokens]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
