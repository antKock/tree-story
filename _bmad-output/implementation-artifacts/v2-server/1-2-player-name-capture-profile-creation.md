# Story 1.2: Player Name Capture at Profile Creation

Status: done

## Story

As a **player**,
I want to enter my name at the start of character creation,
So that my score on the leaderboard is personally identified as mine.

## Acceptance Criteria

1. A required name input field appears at the top of the profile creation screen with label "Comment tu t'appelles ?" and placeholder "Ton prénom"
2. The input has `font-size: 16px` (prevents iOS Safari zoom), `autocomplete="given-name"`, and is linked to its label via `htmlFor`/`id`
3. The "Commencer" button (preset profile cards) and "Commencer l'aventure" button (custom mode) are disabled (`opacity: 0.4`, `pointer-events: none`) when the name input is empty
4. Buttons become enabled as soon as any non-empty name is entered
5. `playerName` is stored in `EngineState` and persisted to localStorage with the save state
6. The player is never prompted for their name again on resume
7. An existing save state with no `playerName` field (pre-v2 save) resumes normally — `playerName` defaults to empty string

## Tasks / Subtasks

- [x] Add `playerName` to `EngineState` in `engine/types.ts` (AC: #5)
  - [x] Add `playerName: string` field to `EngineState` interface
- [x] Update `engine/storyEngine.ts` (AC: #5, #7)
  - [x] Initialize `playerName: ''` in the default engine state (in `createEngine`)
  - [x] When restoring from `SaveState`, read `playerName` from saved `engineState` — default to `''` if missing (backward compat)
  - [x] Add `setPlayerName(name: string)` method to the `Engine` interface that sets `playerName` on internal state
- [x] Update `engine/persistence.ts` (AC: #5, #6, #7)
  - [x] `playerName` is already part of `EngineState` and serialized automatically — no persistence code changes needed unless adding validation
  - [x] In `load()`, do NOT reject saves missing `playerName` — the field defaults to `''` in engine init (backward compat)
- [x] Update `hooks/useStoryEngine.ts` (AC: #5)
  - [x] Expose `setPlayerName(name: string)` from the hook
  - [x] `setPlayerName` should call the engine method, then `commitState()` (persist + theme)
- [x] Update `components/ProfileCreation.tsx` (AC: #1, #2, #3, #4)
  - [x] Add `playerName` state: `const [playerName, setPlayerName] = useState('')`
  - [x] Accept new prop: `onStart: (stats: Record<string, number>, playerName: string) => void`
  - [x] Add name input at the top of BOTH modes (`choose` and `custom`), BEFORE profile cards / stat allocator
  - [x] Input specs: label "Comment tu t'appelles ?", placeholder "Ton prénom", `font-size: 16px`, `autocomplete="given-name"`, `htmlFor="player-name"` on label, `id="player-name"` on input, `required` attribute
  - [x] Input styling: full-width, `height: 44px`, `padding: 0 1rem`, `background: var(--color-surface)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 8px`, `font-family: var(--font-ui)`, focus: `border-color: var(--color-accent)`
  - [x] Disable all "Commencer" / profile selection buttons when `playerName.trim() === ''`
  - [x] In `choose` mode: disable each preset profile card button and the "Personnaliser" button when name is empty — `opacity: 0.4`, `pointer-events: none`
  - [x] In `custom` mode: disable "Commencer l'aventure" when name is empty OR `remaining !== 0`
  - [x] Pass `playerName.trim()` to `onStart` along with stats
- [x] Update `components/GameShell.tsx` (AC: #5, #6)
  - [x] Update `handleStart` to accept `(stats: Record<string, number>, playerName: string)`
  - [x] Store `playerName` in state alongside `pendingStats`
  - [x] Pass `playerName` to `StoryReader` as a new prop
- [x] Update `components/StoryReader.tsx` (AC: #5, #6)
  - [x] Accept `playerName?: string` prop
  - [x] In the `useEffect` that applies `initialStats`, also call `setPlayerName(playerName)` if `playerName` is truthy and not yet applied (use same ref guard pattern as `statsApplied`)
  - [x] This ensures `playerName` is set once on first render and persisted via `commitState()`

## Dev Notes

### Architecture Constraints

- **Engine boundary**: `playerName` lives in `EngineState` — it's engine state, persisted with the save, just like `score` or `gauges`
- **Engine isolation**: No React, no server imports in `engine/` files
- **Immutable state**: Engine returns new state objects — never mutate in place
- **After every engine mutation**: `setEngineState()` → `persistence.save()` → `themeManager.apply()` (via `commitState()`)

### Existing Code Patterns to Follow

**ProfileCreation.tsx current flow:**
```
choose mode: preset cards → onStart(sanitizeProfile(profile.stats))
custom mode: +/- allocator → onStart(stats)
```

**Updated flow:**
```
choose mode: name input + preset cards → onStart(sanitizeProfile(profile.stats), playerName.trim())
custom mode: name input + +/- allocator → onStart(stats, playerName.trim())
```

**GameShell.tsx current flow:**
```
handleStart(stats) → setPendingStats(stats) → setPhase('story')
```

**Updated flow:**
```
handleStart(stats, playerName) → setPendingStats(stats) + setPendingPlayerName(playerName) → setPhase('story')
```

**StoryReader.tsx initialization pattern (existing):**
```typescript
// Stats applied once via ref guard — follow same pattern for playerName
const statsApplied = useRef(false)
useEffect(() => {
  if (initialStats && !statsApplied.current) {
    setStats(initialStats)
    statsApplied.current = true
  }
}, [initialStats, setStats])
```

### Name Input Visual Spec

```
┌─────────────────────────────────────┐
│ Comment tu t'appelles ?             │  ← Inter, --color-text-primary, margin-bottom: 0.5rem
│ ┌─────────────────────────────────┐ │
│ │ Ton prénom                      │ │  ← 16px, 44px height, --color-surface bg
│ └─────────────────────────────────┘ │
│                                     │  ← margin-bottom: 1.5rem before next section
│ Choisis ton profil                  │
│ ┌─────────────────────────────────┐ │
│ │ Le Fêtard                       │ │  ← disabled (opacity 0.4) when name empty
│ └─────────────────────────────────┘ │
```

### Backward Compatibility (Critical)

- Pre-v2 saves have no `playerName` in `EngineState`
- `persistence.load()` must NOT reject these saves — they are valid
- `createEngine()` must default `playerName` to `''` when restoring from a save missing the field
- On resume, `GameShell.hasActiveGame()` returns `true` → goes straight to `'story'` phase → player is never re-prompted for their name
- `playerName` will be `''` for resumed pre-v2 saves — this is acceptable (leaderboard will show empty name)

### Testing Considerations

- Test that `playerName` persists across save/load cycle
- Test backward compat: load a save without `playerName` → should not crash, should default to `''`
- Test that the "Commencer" buttons are disabled when name is empty
- Test that name is trimmed before being stored (no leading/trailing whitespace)

### Project Structure Notes

Files modified (in order):
1. `engine/types.ts` — Add `playerName` to `EngineState`
2. `engine/storyEngine.ts` — Initialize `playerName`, add `setPlayerName` method
3. `hooks/useStoryEngine.ts` — Expose `setPlayerName`, wire to `commitState`
4. `components/ProfileCreation.tsx` — Add name input, update `onStart` signature
5. `components/GameShell.tsx` — Pass `playerName` through to `StoryReader`
6. `components/StoryReader.tsx` — Apply `playerName` on mount

No new files created. All modifications to existing files.

### Anti-Patterns to Reject

- Do NOT store `playerName` outside of `EngineState` (e.g., in a separate localStorage key)
- Do NOT create a separate name input component — it's a simple `<input>` integrated into `ProfileCreation.tsx`
- Do NOT add validation beyond "non-empty" — no min/max length, no character restrictions at the UI level (API-level truncation happens in Story 1.3)
- Do NOT add error text or red borders — the disabled button is the only validation indicator
- Do NOT prompt for name on resume — the name is part of the save state

### References

- [Source: _bmad-output/planning-artifacts/v2-server/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/v2-server/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Component Strategy — NameInput]
- [Source: _bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md#Form Patterns]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: engine/types.ts — EngineState interface at line 169]
- [Source: components/ProfileCreation.tsx — current implementation]
- [Source: components/GameShell.tsx — handleStart at line 97]
- [Source: hooks/useStoryEngine.ts — commitState pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- TypeScript strict mode required `unknown` double-cast for backward compat check on `playerName` field

### Completion Notes List
- Added `playerName: string` to `EngineState` interface
- Engine `freshState()` initializes `playerName: ''`; backward-compat restores missing field to `''`
- Added `setPlayerName()` to Engine interface + implementation
- Hook exposes `setPlayerName` wired to `commitState()`
- Name input with label, placeholder, `autocomplete="given-name"`, `font-size: 16px` (iOS zoom prevention)
- Buttons disabled (`opacity: 0.4`, `pointer-events: none`) when name empty in both choose and custom modes
- Name passed through GameShell → StoryReader → engine via ref-guarded useEffect
- Build passes, all 144 existing tests pass (no regressions)

### File List
- `engine/types.ts` — MODIFIED (added `playerName` to `EngineState`)
- `engine/storyEngine.ts` — MODIFIED (init, backward compat, `setPlayerName` method)
- `hooks/useStoryEngine.ts` — MODIFIED (expose `setPlayerName`)
- `components/ProfileCreation.tsx` — MODIFIED (name input, disabled buttons, updated `onStart` signature)
- `components/GameShell.tsx` — MODIFIED (`pendingPlayerName` state, pass to StoryReader)
- `components/StoryReader.tsx` — MODIFIED (accept `playerName` prop, apply via ref guard)
