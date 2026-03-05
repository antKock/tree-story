# Story 3.2: Character Profile Creation Screen

Status: done

## Story

As a player,
I want to distribute stat points across story-defined stats before the story begins,
so that my character feels like mine and I understand (without instructions) how the session will play differently.

## Acceptance Criteria

1. Displays exactly the stats defined in `storyConfig.stats` — no hardcoded stat names, no hardcoded count (FR3)
2. Shows the total point budget from `storyConfig.statPointBudget` with a live remaining-points counter
3. Each stat has `+` and `−` controls that are disabled at 0 (floor) or at `maxPerStat` from config (ceiling)
4. The Start button is enabled only when all points are allocated (remaining === 0)
5. Example profiles from `storyConfig.meta.exampleProfiles` are displayed to guide allocation (FR2)
6. Tapping Start passes the stat allocation to `useStoryEngine` and advances to the StoryReader
7. All controls meet the 44px minimum touch target height (NFR7)
8. The screen uses Inter for all labels and controls — no Lora on the profile screen

## Tasks / Subtasks

- [x] Create `components/ProfileCreation.tsx` (AC: 1–8)
  - [x] Mark with `"use client"` (interactive component)
  - [x] Props: `{ config: StoryConfig; onStart: (stats: Record<string, number>) => void }`
  - [x] Initialize local state: `const [allocation, setAllocation] = useState<Record<string, number>>(() => Object.fromEntries(config.stats.map(s => [s.id, 0])))`
  - [x] Compute: `const remaining = config.statPointBudget - Object.values(allocation).reduce((sum, v) => sum + v, 0)`
  - [x] Compute: `const canStart = remaining === 0`

- [x] Render stat list (AC: 1, 3, 7)
  - [x] Map over `config.stats` to render each stat row
  - [x] Each row shows: stat `name` (from `StatDefinition.name`), current allocation value, `−` button, `+` button
  - [x] `−` button: disabled when `allocation[stat.id] <= 0`
  - [x] `+` button: disabled when `allocation[stat.id] >= stat.maxPerStat` OR when `remaining <= 0`
  - [x] Each button minimum height: 44px (use `min-h-[44px]` or equivalent CSS)
  - [x] Increment: `setAllocation(prev => ({ ...prev, [stat.id]: prev[stat.id] + 1 }))`
  - [x] Decrement: `setAllocation(prev => ({ ...prev, [stat.id]: prev[stat.id] - 1 }))`

- [x] Render point budget counter (AC: 2)
  - [x] Display: `Points remaining: {remaining}` or similar
  - [x] Style remaining in `--color-accent` when > 0, `--color-text-muted` (or success color) when = 0

- [x] Render example profiles (AC: 5)
  - [x] Map over `config.meta.exampleProfiles`
  - [x] Display each profile: `name`, `description`, and stat values
  - [x] Make profiles tappable: tapping a profile sets `allocation` to the profile's `stats` values
  - [x] Example profiles for Dub Camp: "Le Bastien" (4/0/2/2), "Le Brian" (1/1/3/3), "L'équilibré" (2/2/2/2)

- [x] Render Start button (AC: 4, 6)
  - [x] Disabled when `remaining !== 0`
  - [x] Enabled (and styled with `--color-accent`) when `remaining === 0`
  - [x] On tap: call `props.onStart(allocation)`
  - [x] Minimum height: 44px

- [x] Apply typography (AC: 8)
  - [x] All text on this screen uses Inter (mechanical/UI context)
  - [x] No Lora on this screen — it's stat allocation, not prose reading

- [x] Wire ProfileCreation into app flow
  - [x] In `app/page.tsx` (or a new route): render `<ProfileCreation config={storyConfig} onStart={handleStart} />`
  - [x] `handleStart(stats)` → call `setStats(stats)` from `useStoryEngine` hook → navigate to StoryReader
  - [x] Since `useStoryEngine` is in `StoryReader.tsx` (the sole hook consumer), pass `onStart` as a callback that navigates to a "story" view
  - [x] Consider: use local `useState` in `app/page.tsx` or a shared parent to toggle between `ProfileCreation` and `StoryReader` views. Simple boolean state: `const [phase, setPhase] = useState<'profile' | 'story'>('profile')`

## Dev Notes

- **Story config drives everything:** The profile screen must render from `config.stats` — no hardcoded stat names. For Dub Camp: `endurance`, `estomac`, `resistanceAlcool`, `resistanceFumette`. For any other story: whatever stats that story defines.
- **Stat point budget:** Dub Camp has `statPointBudget: 8` with `maxPerStat: 4`. So max 8 points total, each stat 0–4. Example: Le Bastien = 4+0+2+2=8.
- **Tapping example profile:** When a player taps an example profile, it fills in their allocation exactly. Check that the profile's stat values sum to `statPointBudget` (they should — validate in config). If the profile has different stats than the current config, handle gracefully.
- **Phase management:** The simplest approach to manage profile → story transition is a `phase` state in the parent (`app/page.tsx`). When `onStart` is called with stats: (1) call `engine.setStats(stats)`, (2) set `phase = 'story'`. The `StoryReader` renders when `phase === 'story'`.
- **`setStats` in hook:** The `useStoryEngine` hook (Story 2.5) exposes `setStats`. This must be called before the player can make story choices. The engine stores stats in `_state.stats` for use in gauge calculations.
- **Touch targets:** Every interactive element (stat +/- buttons, profile cards, Start button) must have at least 44px height. Use `min-h-[44px]` Tailwind class. This satisfies NFR7.

### Project Structure Notes

Files to create:
- `components/ProfileCreation.tsx` (new)

Files to modify:
- `app/page.tsx` — add phase management, render ProfileCreation conditionally

Prerequisites:
- Story 1.1 (project scaffold)
- Story 1.2 (`engine/types.ts` — `StoryConfig`, `StatDefinition`)
- Story 2.5 (`hooks/useStoryEngine.ts` — `setStats` method)
- Story 3.1 (design tokens, typography — for Inter font)

### References

- [Source: architecture.md#Component-Architecture] — `ProfileCreation.tsx` described as "Stat point distribution — story-configured"
- [Source: epics.md#Story-3.2] — Full acceptance criteria
- [Source: project-context.md#Critical-Dont-Miss-Rules] — "CharacterSheet opens ONLY from GaugeStrip tap"
- [Source: epics.md#Epic-4] — Dub Camp example profiles: Le Bastien (4/0/2/2), Le Brian (1/1/3/3), L'équilibré (2/2/2/2)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6
Code Review: claude-opus-4-6

### Debug Log References

### Completion Notes List

- ProfileCreation.tsx: renders stats from config.stats, point budget from config.statPointBudget
- +/- buttons with 44px touch targets, disabled at 0/maxPerStat boundaries
- Example profiles from config.meta.exampleProfiles, tappable to apply allocation
- Start button enabled only when remaining === 0
- All Inter typography (no Lora on profile screen)
- GameShell.tsx: manages profile → story phase transitions, theme reset on replay
- Code review (2026-03-02): Fixed hardcoded hex values, CSS variables. Code review (2026-03-02): Added theme reset on replay flow.

### File List

- `components/ProfileCreation.tsx` — stat point distribution UI
- `components/GameShell.tsx` — phase management (profile → story)
- `app/page.tsx` — renders GameShell with validated config
