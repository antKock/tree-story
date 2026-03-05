# Story 1.5: Leaderboard Display on End Screen

Status: done

## Story

As a **player**,
I want to see a ranked list of other players' scores after finishing a story,
So that I can compare my result and feel part of a shared experience.

## Acceptance Criteria

1. When the end screen renders (completion or game over), score submission fires silently via `POST /api/stories/[id]/scores` with `{ playerName, score, isGameOver }` — fire-and-forget with `.catch(() => {})`, never awaited
2. The end screen content (score, tier text, replay button) renders immediately without waiting for any API response
3. When the leaderboard API returns entries within 5 seconds, a "Classement" section fades in (300ms opacity transition) below the existing end screen content — no layout shift
4. Each entry is a row with player name left-aligned and score right-aligned
5. The current player's own entry is highlighted: name in `--color-text-primary`, score in `--color-accent`, row with `--color-accent` background at ~10% opacity
6. Other entries use `--color-text-muted` with transparent background
7. Entries are ordered by score descending with no rank numbers shown
8. The leaderboard section has `aria-label="Classement des joueurs"` with semantic list markup (`role="list"`, each entry `role="listitem"`)
9. The current player's own entry has `aria-current="true"`
10. Player names are rendered as text content only — never as HTML
11. If the leaderboard API is unreachable, returns an error, or the 5-second timeout fires, the leaderboard section does not appear — no error message, no spinner, no broken UI

## Tasks / Subtasks

- [x] Create `components/LeaderboardEntry.tsx` (AC: #4, #5, #6, #10)
  - [x] Props: `playerName: string`, `score: number`, `isCurrentPlayer: boolean`
  - [x] Row layout: name left-aligned, score right-aligned
  - [x] Highlighted variant (current player): name `--color-text-primary`, score `--color-accent`, row bg `--color-accent` at 10% opacity
  - [x] Default variant: `--color-text-muted`, transparent bg
  - [x] `role="listitem"` and `aria-current="true"` when `isCurrentPlayer`
  - [x] Player name rendered as text content (never `dangerouslySetInnerHTML`)
  - [x] Styling: `padding: 0.75rem 1rem`, `border-bottom: 1px solid rgba(255,255,255,0.06)`, Inter font, 14px, `font-variant-numeric: tabular-nums` on score
- [x] Create `components/LeaderboardSection.tsx` (AC: #3, #7, #8, #9, #11)
  - [x] Props: `storyId: string`, `playerName: string`, `playerScore: number`
  - [x] On mount: fetch leaderboard with 5-second AbortController timeout
  - [x] Fetch function: `GET /api/stories/${storyId}/leaderboard`
  - [x] On success: set entries state, render with fade-in
  - [x] On any failure (network error, non-2xx, timeout): render nothing (return `null`)
  - [x] Fade-in: wrapper starts at `opacity: 0`, transitions to `opacity: 1` over 300ms when data arrives
  - [x] "Classement" label: Inter, `--color-text-muted`, above the list
  - [x] `aria-label="Classement des joueurs"` on the section
  - [x] List uses `role="list"`, entries rendered as `<LeaderboardEntry>` components
  - [x] Match current player by comparing `playerName` (case-sensitive) and `score` to identify their entry
- [x] Update `components/EndScreen.tsx` (AC: #1, #2)
  - [x] Add new props: `storyId: string`, `playerName: string`
  - [x] Fire score submission on mount via `useEffect` — fire-and-forget with `.catch(() => {})`
  - [x] Render `<LeaderboardSection>` below the replay button
  - [x] Pass `storyId`, `playerName`, `playerScore={engineState.score}` to LeaderboardSection
  - [x] Existing end screen content renders immediately — no waiting for API
- [x] Update `components/StoryReader.tsx` to pass new props to EndScreen
  - [x] Pass `storyId={config.id}` and `playerName={engineState.playerName}` to `<EndScreen>`

## Dev Notes

### Architecture Constraints

- **Fire-and-forget score submission**: NEVER await the POST. Use `.catch(() => {})` to silence errors. The end screen must render immediately (NFR3).
- **Graceful absence**: If the leaderboard fails to load, the end screen is indistinguishable from the pre-v2 product (NFR6). No error UI, no spinner, no skeleton.
- **No loading states**: The leaderboard fades in when ready or doesn't appear at all. No shimmer, no skeleton, no "Loading..." text.
- **Client-side components**: Both `LeaderboardSection` and `LeaderboardEntry` are `'use client'` components (they use `useState`, `useEffect`).
- **XSS prevention**: Player names rendered as text content only — use `{playerName}` in JSX (React escapes by default), never `dangerouslySetInnerHTML`.

### Leaderboard Fetch Pattern (Exact)

```typescript
// Inside LeaderboardSection
async function fetchLeaderboard(storyId: string): Promise<LeaderboardEntry[] | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`/api/stories/${storyId}/leaderboard`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
```

### Score Submission Pattern (Exact)

```typescript
// Inside EndScreen useEffect — fire-and-forget
fetch(`/api/stories/${storyId}/scores`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerName, score: engineState.score, isGameOver: engineState.isGameOver }),
}).catch(() => {})
```

### Player Matching Logic

To highlight the current player's entry:
```typescript
// Match by playerName AND approximate score (score in API response is integer from DB)
const isCurrentPlayer = (entry: LeaderboardEntry) =>
  entry.playerName === playerName && entry.score === Math.round(playerScore)
```

Note: Multiple entries may match if the same player replays. The highlight will apply to all matching entries — this is acceptable behavior.

### Fade-In Animation Pattern

```typescript
const [visible, setVisible] = useState(false)
const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

useEffect(() => {
  fetchLeaderboard(storyId).then(data => {
    if (data) {
      setEntries(data)
      // Trigger fade-in on next frame
      requestAnimationFrame(() => setVisible(true))
    }
  })
}, [storyId])

if (!entries) return null

return (
  <section
    aria-label="Classement des joueurs"
    style={{
      opacity: visible ? 1 : 0,
      transition: 'opacity 300ms ease',
    }}
  >
    {/* ... */}
  </section>
)
```

### Visual Layout Spec

```
┌─────────────────────────────────────┐
│          [End Screen Content]       │  ← Existing: paragraph, tier text, score, replay button
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Classement                         │  ← Inter, --color-text-muted, fades in
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ★ Léa                       87 ││  ← Highlighted: accent bg 10%, primary name, accent score
│  ├─────────────────────────────────┤│
│  │   Marc                       92 ││  ← Default: muted text, transparent bg
│  ├─────────────────────────────────┤│
│  │   Julie                      74 ││
│  ├─────────────────────────────────┤│
│  │   Thomas                     63 ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

Entry row styling:
- Full-width, `padding: 0.75rem 1rem`
- `border-bottom: 1px solid rgba(255,255,255,0.06)`
- Name: Inter 14px, left-aligned
- Score: Inter 14px, right-aligned, `font-variant-numeric: tabular-nums`
- Highlighted row: `background: color-mix(in srgb, var(--color-accent) 10%, transparent)` or equivalent rgba

Section styling:
- `padding: 1rem 1.5rem` within the reading column
- `margin-top: 2rem` (spacing below replay button)

### Existing EndScreen Props (Current)

```typescript
interface EndScreenProps {
  engineState: EngineState
  config: StoryConfig
  onReplay: () => void
}
```

Updated:
```typescript
interface EndScreenProps {
  engineState: EngineState
  config: StoryConfig
  storyId: string        // NEW — for API calls
  playerName: string     // NEW — for score submission + leaderboard matching
  onReplay: () => void
}
```

### StoryReader Updates

In `StoryReader.tsx`, the EndScreen render currently:
```tsx
<EndScreen engineState={engineState} config={config} onReplay={handleReplay} />
```

Updated:
```tsx
<EndScreen
  engineState={engineState}
  config={config}
  storyId={config.id}
  playerName={engineState.playerName}
  onReplay={handleReplay}
/>
```

### LeaderboardEntry Type (Client-Side)

```typescript
interface LeaderboardEntryData {
  id: string
  storyId: string
  playerName: string
  score: number
  isGameOver: boolean
  createdAt: string
}
```

This matches the API response from Story 1.4. No need for a shared types file — define locally in `LeaderboardSection.tsx`.

### Dependencies

- **Requires Story 1.1**: Supabase infrastructure
- **Requires Story 1.2**: `playerName` in `EngineState` (needed for score submission and player matching)
- **Requires Story 1.3**: Score submission API endpoint
- **Requires Story 1.4**: Leaderboard API endpoint

### Project Structure Notes

Files created:
1. `components/LeaderboardEntry.tsx` — NEW
2. `components/LeaderboardSection.tsx` — NEW

Files modified:
3. `components/EndScreen.tsx` — Add score submission + LeaderboardSection
4. `components/StoryReader.tsx` — Pass `storyId` and `playerName` to EndScreen

### Anti-Patterns to Reject

- Do NOT await the score submission — fire-and-forget only
- Do NOT show a loading spinner or skeleton for the leaderboard
- Do NOT show an error message if the leaderboard fails to load
- Do NOT add a "retry" button for failed leaderboard loads
- Do NOT use `dangerouslySetInnerHTML` for player names
- Do NOT add rank numbers to entries — vertical position communicates order
- Do NOT add medal/trophy/podium visual language
- Do NOT block end screen rendering while waiting for API responses

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Communication Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Component Strategy — LeaderboardSection]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Component Strategy — LeaderboardEntry]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Feedback Patterns]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Transition Patterns]
- [Source: components/EndScreen.tsx — current implementation]
- [Source: components/StoryReader.tsx — EndScreen render]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no issues encountered.

### Completion Notes List
- Created `LeaderboardEntry.tsx` with highlighted/default variants, ARIA attributes, text-only rendering
- Created `LeaderboardSection.tsx` with 5s AbortController timeout, fade-in animation, graceful absence on failure
- Updated `EndScreen.tsx` with fire-and-forget score submission via useEffect and LeaderboardSection render
- Updated `StoryReader.tsx` to pass `storyId` and `playerName` to EndScreen
- Score submitted as `Math.round(engineState.score)` for consistency with DB integer column
- Player matching uses case-sensitive name + rounded score comparison
- Build passes, all 144 existing tests pass (no regressions)

### File List
- `components/LeaderboardEntry.tsx` — NEW
- `components/LeaderboardSection.tsx` — NEW
- `components/EndScreen.tsx` — MODIFIED (score submission, LeaderboardSection integration)
- `components/StoryReader.tsx` — MODIFIED (pass storyId + playerName to EndScreen)
