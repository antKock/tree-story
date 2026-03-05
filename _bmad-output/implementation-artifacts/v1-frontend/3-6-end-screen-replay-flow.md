# Story 3.6: End Screen & Replay Flow

Status: done

## Story

As a player,
I want to see my outcome when the story ends — and replay immediately if I want to,
so that reaching a Game Over or story completion feels like a complete experience, not a dead end.

## Acceptance Criteria

1. On `isGameOver === true`: displays the narrative Game Over paragraph content from `gameOverParagraphId` as prose, reveals the Kiff score value (FR16), displays a single replay CTA
2. On `isComplete === true`: matches `engineState.score` against `storyConfig.endStateTiers` and displays the matching narrative outcome text as prose (FR15), reveals the Kiff score value (FR16), displays a replay CTA
3. Tapping replay CTA: calls `resetEngine()` first — engine state resets AND `persistence.clear()` called atomically; navigation to ProfileCreation happens ONLY after `reset()` resolves — never before (FR18)
4. Player arrives at a fresh `ProfileCreation` screen with no trace of the previous session after replay

## Tasks / Subtasks

- [x] Create `components/EndScreen.tsx` (AC: 1–4)
  - [x] `"use client"` directive
  - [x] Props: `{ engineState: EngineState; config: StoryConfig; onReplay: () => void }`

- [x] Handle Game Over rendering (AC: 1)
  - [x] If `engineState.isGameOver === true`:
    - Look up paragraph: `const paragraph = config.paragraphs[engineState.gameOverParagraphId!]`
    - Render paragraph content as prose (using `ParagraphDisplay` or the same Lora prose styles)
    - Show Kiff score: `const kiffGauge = config.gauges.find(g => g.isScore); const kiffValue = engineState.gauges[kiffGauge!.id]`
    - Display: e.g. "Kiff: {kiffValue}" or render the score gauge as a fill bar with its value revealed
  - [x] Use `ParagraphDisplay` component for prose rendering consistency

- [x] Handle Story Complete rendering (AC: 2)
  - [x] If `engineState.isComplete === true`:
    - Find matching tier: `const tier = config.endStateTiers.find(t => engineState.score >= t.minScore && engineState.score <= t.maxScore)`
    - Render `tier.text` as prose via `ParagraphDisplay`
    - Show Kiff score value (same pattern as Game Over above)
  - [x] Handle edge case: if no tier matches (score out of range), show a fallback message

- [x] Render score reveal (AC: 1, 2 — FR16)
  - [x] This is the FIRST time Kiff/score is shown to the player during the session
  - [x] Display clearly: score gauge name + value
  - [x] Style the score reveal prominently — use `--color-accent` for emphasis
  - [x] Consider showing as a fill bar (consistent with GaugeStrip aesthetic) plus the numeric value (this is the special score reveal moment)

- [x] Render Replay CTA (AC: 3, 4)
  - [x] Single button: "Rejouer" or "Play Again"
  - [x] Full-width, min-height 44px, styled with `--color-accent` background
  - [x] `onClick={handleReplay}`
  - [x] `handleReplay`:
    ```typescript
    const handleReplay = () => {
      onReplay()  // calls resetEngine() which: (1) persistence.clear(), (2) engine.reset()
      // navigation to ProfileCreation is handled by the parent (StoryReader/page.tsx)
    }
    ```
  - [x] After `onReplay()`: the engine state resets, `isGameOver` and `isComplete` become false, and the parent re-renders ProfileCreation
  - [x] Verify: navigation to ProfileCreation only after reset resolves (synchronous reset means this is immediate)

- [x] Wire EndScreen into StoryReader (AC: 3, 4)
  - [x] In `StoryReader.tsx`: when `isGameOver || isComplete`, render `<EndScreen>`
  - [x] Pass `onReplay={() => { resetEngine(); setPhase('profile') }}` or equivalent
  - [x] The reset sets engine state to fresh init → React re-renders → parent shows ProfileCreation
  - [x] If phase state is in `app/page.tsx`: emit an event/callback that resets phase to 'profile'

- [x] Ensure no game chrome during EndScreen
  - [x] GaugeStrip: consider hiding or keeping visible during end screen (UX call — keep it if it shows the final state, but it's acceptable either way)
  - [x] ChoiceCards: must NOT render during Game Over or Complete state
  - [x] No navigation chrome — just the narrative outcome and the replay button

## Dev Notes

- **Score reveal timing (FR16):** Kiff/score is tracked throughout but hidden from the GaugeStrip and only revealed at Game Over or completion. This is the first time the player sees it. Make it feel meaningful — not just a number but a contextual reveal.
- **Tier matching:** `endStateTiers` has `minScore` and `maxScore` ranges. Make sure the logic handles: score = 100 in a tier with `maxScore: 100`, score = 0 in a tier with `minScore: 0`. Test edge cases.
- **Replay atomicity:** From architecture: "Replay: `engine.reset()` + `localStorage.removeItem()` atomically; navigate to ProfileCreation ONLY after reset resolves." The `resetEngine()` function from `useStoryEngine` handles both: it calls `persistence.clear()` then `engine.reset()`. Since this is synchronous, the navigation (phase change) can happen immediately after — there's no async gap.
- **Anti-pattern: navigate before reset.** Never call navigation (set phase to 'profile') BEFORE calling `resetEngine()`. If you navigate first, the old engine state might persist for a frame. Always reset first, then navigate.
- **Dub Camp Game Over paragraphs:** §201–§204 are in `config.paragraphs` and have `isGameOver: true`. Their `content` field contains the narrative text for that Game Over path. The `EndScreen` renders this content.
- **Dub Camp end state tiers:** 4 tiers based on Kiff (score) value. The tier text is narrative prose — render it with `ParagraphDisplay` for consistent typography.

### Project Structure Notes

Files to create:
- `components/EndScreen.tsx` (new)

Files to modify:
- `components/StoryReader.tsx` — add EndScreen rendering, handle replay phase transition

Prerequisites:
- Story 1.2 (`engine/types.ts`)
- Story 2.5 (`hooks/useStoryEngine.ts` — `resetEngine` method)
- Story 3.1 (design tokens)
- Story 3.4 (`StoryReader.tsx`, `ParagraphDisplay.tsx`)

### References

- [Source: architecture.md#Communication-Patterns] — "Replay Timing: Engine stays in terminal state until player taps replay CTA. `engine.reset()` clears engine state AND `localStorage.removeItem()` atomically. Navigation to ProfileCreation happens after reset resolves — never before."
- [Source: architecture.md#Enforcement-Guidelines] — "Navigating to ProfileCreation before `engine.reset()` resolves" is an anti-pattern to reject
- [Source: epics.md#Story-3.6] — Full acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6
Code Review: claude-opus-4-6

### Debug Log References

### Completion Notes List

- EndScreen: renders Game Over paragraph content or completion tier text via ParagraphDisplay
- Score reveal: shows Kiff gauge icon + numeric value with --color-accent styling
- Replay CTA: calls onReplay → resetEngine() + themeManager.resetToDefaults() + setPhase('profile')
- Reset order: persistence.clear() → engine.reset() → theme reset → navigate to ProfileCreation
- Code review (2026-03-02): Fixed EndScreen content rendering, CSS variables. Added theme reset on replay.

### File List

- `components/EndScreen.tsx` — game over / completion display with score reveal and replay
