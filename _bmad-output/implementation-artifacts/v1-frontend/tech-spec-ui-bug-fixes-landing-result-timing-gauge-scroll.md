---
title: 'UI Bug Fixes — Landing Screen, Result Timing, Gauge UX, Scroll'
slug: 'ui-bug-fixes-landing-result-timing-gauge-scroll'
created: '2026-03-02'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 16 (App Router)', 'React 19', 'TypeScript 5 strict', 'Tailwind CSS 4 (CSS-first)', 'Vitest']
files_to_modify:
  - components/GameShell.tsx
  - components/GaugeStrip.tsx
  - components/ResultBlock.tsx
  - components/StoryReader.tsx
  - hooks/useStoryEngine.ts
  - engine/types.ts
  - app/globals.css
code_patterns:
  - 'All styles via inline style={{}} using CSS custom properties — no hardcoded colors in TSX files; CSS classes in globals.css are OK'
  - 'Phase management via useState<union string> in GameShell — existing pattern: profile | story'
  - 'StoryReader is the sole consumer of useStoryEngine; child components receive props only'
  - 'animKey (integer) incremented by resolveChoice to restart pill CSS animation via key={animKey}'
  - 'window.scrollTo() allowed in components; document.documentElement only in themeManager.ts'
test_patterns:
  - 'Vitest — co-located .test.ts files in engine/ only'
  - 'No React imports in engine tests — pure TypeScript only'
  - 'No new engine tests needed; all fixes are UI-layer'
---

# Tech-Spec: UI Bug Fixes — Landing Screen, Result Timing, Gauge UX, Scroll

**Created:** 2026-03-02

## Overview

### Problem Statement

Five UX/UI issues discovered during play-testing the tree-story game:

1. The game drops players directly into character creation with no introductory context or landing screen.
2. The result text and gauge delta pill from a player's choice appear one block too late — visible on the next-next block rather than the immediately following block.
3. The `ResultBlock` shows narrative outcome text but does not display gauge changes (+/- deltas) alongside it.
4. When a new story block appears, the browser scroll position lands on the action buttons rather than the top of the new content, forcing players to scroll up manually.
5. The gauge bar strip is too thin, icons are too crowded against the bar, and the +/- delta pill text is too small to read comfortably.

### Solution

Five targeted component/hook-level fixes with no architectural restructuring:

1. Add a `'landing'` phase to `GameShell` rendering a `LandingScreen` component (title + intro text + CTA).
2. Fix `animKey` propagation in `useStoryEngine` so the delta pill animation restarts correctly even when a decay node fires.
3. Extend `ResultBlock` to render gauge delta chips (icon + signed value) below the outcome text.
4. Add a `useEffect` in `StoryReader` that scrolls `window` to top on every `paragraphId` change.
5. Increase gauge bar height, icon-bar gap, and delta pill font size / add pill background in `globals.css`.

### Scope

**In Scope:**
- `LandingScreen` component in `GameShell.tsx` (title, intro text from `meta.introText ?? meta.description`, "Commencer" button)
- `animKey` fix in `hooks/useStoryEngine.ts`
- Gauge delta chips in `ResultBlock.tsx` (visible gauges only)
- Scroll-to-top `useEffect` in `StoryReader.tsx`
- GaugeStrip bar height, gap, and pill CSS improvements in `GaugeStrip.tsx` + `app/globals.css`
- Optional: `introText?: string` field on `StoryMeta` in `engine/types.ts`

**Out of Scope:**
- Story content changes (gauge effects on navigation-only choices like `s1-a`, `s10-a`)
- Any engine logic changes (`engine/storyEngine.ts` is not modified)
- Save/load flow redesign
- New story JSON files or `introText` content authoring

---

## Context for Development

### Codebase Patterns

- **No hardcoded color values in TSX component files** — use `var(--color-*)` custom properties. If a color can't be expressed with an existing CSS variable, add a CSS class to `app/globals.css` instead. Existing custom properties: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`.
- **Component communication**: all child components receive props from `StoryReader` only. `StoryReader.tsx` is the sole consumer of `useStoryEngine`.
- **Phase management** in `GameShell.tsx` via `useState<'profile' | 'story'>` — adding `'landing'` follows the existing pattern exactly.
- **`animKey`**: integer in `useStoryEngine`, incremented on `resolveChoice` via `setAnimKey(k => k + 1)`. Passed to `GaugeStrip` which puts it as `key={animKey}` on the delta pill `<span>` to force React to remount it and restart the `pill-fade` CSS animation. `applyDecay` does NOT currently increment `animKey` — this is the confirmed timing bug root cause for decay nodes.
- **`applyDecay` double-render**: `StoryReader` fires `applyDecay()` in a `useEffect` on `paragraphId` change when arriving at a decay node (`s20, s40, s50, s60, s70`). This triggers a second `commitState()` → `setEngineState()`, producing a second React render. `applyDecay` does NOT clear `lastGaugeDeltas` but also does NOT increment `animKey` → pill key is unchanged → React doesn't remount it → animation was already started in the first render and doesn't restart.
- **Scroll behavior**: `window.scrollTo()` is allowed in components. `document.documentElement` is restricted to `engine/themeManager.ts`.
- **Replay flow**: `project-context.md` says "navigate to ProfileCreation after reset." The landing screen intentionally overrides this — replay goes to `'landing'` instead.
- **Engine state fields**: `EngineState.lastOutcomeText: string | null` set in `resolveChoice` step 3; `EngineState.lastGaugeDeltas: Record<string, number> | null` set in step 6 — both BEFORE `paragraphId` advances in step 12. Engine is correct; the bug is purely in UI animation timing.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `components/GameShell.tsx` | Add `'landing'` phase, `handleBegin` handler, `LandingScreen` render branch |
| `components/ProfileCreation.tsx` | Reference — pattern for reading `config.meta.title`, `config.meta.description`, button styling |
| `components/StoryReader.tsx` | Add scroll-to-top `useEffect`; update `<ResultBlock>` call with `gaugeDeltas` + `gauges` props |
| `components/GaugeStrip.tsx` | Bar height `7px→10px`, gap `3px→6px`, pill font-size fix |
| `components/ResultBlock.tsx` | Add `gaugeDeltas` + `gauges` optional props; update null guard; render delta chips |
| `hooks/useStoryEngine.ts` | Add `setAnimKey(k => k+1)` inside `applyDecay` callback |
| `engine/types.ts` | Add optional `introText?: string` to `StoryMeta` interface |
| `engine/storyEngine.ts` | Reference only — no changes |
| `app/globals.css` | Update `.gauge-delta-pill` (font-size, background chip); add `.result-gauge-chip` |

### Technical Decisions

- **Landing intro text**: render `config.meta.introText ?? config.meta.description`. Add `introText?: string` to `StoryMeta` in `engine/types.ts` (optional field, backward-compatible — no JSON changes required).
- **`animKey` in applyDecay**: confirmed root cause for decay-node timing bug. Fix: add `setAnimKey(k => k + 1)` to the `applyDecay` callback in `useStoryEngine`. For non-decay blocks the behavior is unchanged. **Important asymmetry**: after this fix, the pill re-animates with `lastGaugeDeltas` from the preceding `resolveChoice` call — NOT the decay's own gauge changes. `applyDecay` in the engine intentionally does not set `lastGaugeDeltas` (decay is a silent background process; the pill should always reflect what the player's last choice did). This is correct and expected behavior.
- **Story content (Cause B)**: many early choices (`s1-a`, `s10-a`) have no `gaugeEffects` or `weightedOutcome` → `lastGaugeDeltas = null` → nothing to show. This is not a code bug. Document for content authors: add `gaugeEffects` to navigation-only choices if feedback is desired.
- **ResultBlock null guard**: update to `if (!text && !hasVisibleDeltas) return null` — show the block if there's outcome text OR non-zero visible gauge deltas.
- **Delta chip background**: add `.result-gauge-chip` class to `globals.css` using `color-mix(in srgb, currentColor 10%, transparent)` — adapts automatically to accent or danger color, no hardcoded values.
- **Pill background in globals.css**: CSS files may have hardcoded values (the rule applies to TSX files). Add `background: rgba(0,0,0,0.55)` to `.gauge-delta-pill` in `globals.css`.
- **Scroll behavior**: `'instant'` (not `'smooth'`) — smooth scrolling is disorienting during story paragraph transitions.
- **No engine changes**: `engine/storyEngine.ts` is not modified. The engine correctly sets `lastGaugeDeltas` before advancing `paragraphId`.

---

## Implementation Plan

### Tasks

- [x] **Task 1: Add scroll-to-top on paragraph transition**
  - File: `components/StoryReader.tsx`
  - Action: Add a new `useEffect` after the existing `useEffect` hooks (before the render return). Dependency array: `[engineState.paragraphId]`.
  - Notes: Use `window.scrollTo({ top: 0, behavior: 'instant' })`. This fires on every paragraph change, including the first render — that's correct (ensures consistent position). Do NOT add `engineState.paragraphId` to the existing decay `useEffect`; add a new, separate one.
  - Code:
    ```tsx
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, [engineState.paragraphId])
    ```

- [x] **Task 2: Fix delta pill animation timing at decay nodes**
  - File: `hooks/useStoryEngine.ts`
  - Action: In the `applyDecay` callback, add `setAnimKey(k => k + 1)` after `commitState()`.
  - Notes: Root cause — when arriving at a decay node, `applyDecay` fires via a `useEffect` in `StoryReader`, triggering a second React render. `animKey` is NOT incremented in this second render, so the pill `<span key={animKey}>` keeps the same key → React doesn't remount it → `pill-fade` animation (started in the first render) does not restart. Fix: increment `animKey` in `applyDecay` so the pill remounts after the decay render. **Important**: after this fix, the pill re-animates showing the CHOICE's `lastGaugeDeltas` values (set by `resolveChoice`), NOT the decay amounts — `applyDecay` in the engine intentionally does not set `lastGaugeDeltas`. This is correct: decay is a silent background process; the pill always shows what the player's last choice did. Remove the comment "applyDecay does NOT increment animKey — decay changes gauges silently" and replace with the clarification below.
  - Code:
    ```ts
    const applyDecay = useCallback(() => {
      engineRef.current!.applyDecay()
      commitState()
      // Increment animKey so the delta pill remounts and re-animates after decay.
      // The pill continues to show the most recent choice's lastGaugeDeltas (not decay amounts),
      // which is intentional — decay is a silent background process.
      setAnimKey(k => k + 1)
    }, [commitState])
    ```

- [x] **Task 3: Add gauge delta chips to ResultBlock — CSS class**
  - File: `app/globals.css`
  - Action: Add `.result-gauge-chip` CSS class after the existing `.gauge-delta-pill` block.
  - Notes: Use `color-mix()` so the background tint adapts automatically to whichever `color` value is set via inline `style` on the chip. Use 20% opacity for a perceptible but subtle tint (12% was too faint to be visible on dark backgrounds). `currentColor` resolves to the element's own `color` property (accent or danger), which IS set on the span via inline style — so `color-mix` will pick it up correctly.
  - Code:
    ```css
    .result-gauge-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.85rem;
      border-radius: 4px;
      padding: 2px 6px;
      background: color-mix(in srgb, currentColor 20%, transparent);
    }
    ```

- [x] **Task 4: Add gauge delta chips to ResultBlock — component**
  - File: `components/ResultBlock.tsx`
  - Action: Replace the entire file content with the implementation below.
  - Notes:
    - Import `GaugeDefinition` from `@/engine/types`.
    - `visibleDeltas` is computed once before the null guard to reuse in both the guard and the render.
    - The null guard checks both `text` (truthy non-empty string) and `visibleDeltas.length`. Note: `text` could theoretically be `""` (empty string from engine output) — the guard `!text` catches this correctly (empty string is falsy), preventing a blank `<p>` from rendering.
    - The "Résultat" label `<p>` is conditionally rendered only when `text` is a non-empty string (same `text &&` guard). When only gauge chips are present (no outcome text), the label is suppressed — no orphaned "Résultat" header.
    - `gaugeDeltas[g.id]` is guaranteed non-undefined and non-zero by the `visibleDeltas` filter, but TypeScript doesn't narrow through the filter closure — use `gaugeDeltas![g.id]` with the non-null assertion (safe because `visibleDeltas` is only populated when `gaugeDeltas` is non-null).
  - Code (complete file replacement):
    ```tsx
    'use client'

    import { renderMarkdownLite } from './renderMarkdownLite'
    import type { GaugeDefinition } from '@/engine/types'

    interface ResultBlockProps {
      text: string | null
      gaugeDeltas?: Record<string, number> | null
      gauges?: GaugeDefinition[]
    }

    export default function ResultBlock({ text, gaugeDeltas, gauges }: ResultBlockProps) {
      const visibleDeltas = (gaugeDeltas && gauges)
        ? gauges.filter(g => !g.isHidden && gaugeDeltas[g.id] !== undefined && gaugeDeltas[g.id] !== 0)
        : []

      if (!text && visibleDeltas.length === 0) return null

      const paragraphs = text ? text.split(/\n\n+/) : []

      return (
        <div
          className="reading-column"
          style={{
            borderLeft: '3px solid var(--color-accent)',
            paddingLeft: '1rem',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            background: 'var(--color-surface)',
            borderRadius: '0 4px 4px 0',
            padding: '0.75rem 1rem',
          }}
        >
          {text && (
            <p
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-accent)',
                margin: '0 0 0.5rem 0',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Résultat
            </p>
          )}
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="prose-text"
              style={{
                marginBottom: i < paragraphs.length - 1 ? '1em' : 0,
                marginTop: 0,
                fontSize: '1.05rem',
              }}
            >
              {renderMarkdownLite(para.trim())}
            </p>
          ))}
          {visibleDeltas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: text ? '0.75rem' : 0 }}>
              {visibleDeltas.map(g => {
                const delta = gaugeDeltas![g.id]
                return (
                  <span
                    key={g.id}
                    className="result-gauge-chip"
                    style={{ color: delta > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}
                  >
                    {g.icon} {delta > 0 ? '+' : ''}{Math.round(delta)}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )
    }
    ```

- [x] **Task 5: Wire new ResultBlock props in StoryReader**
  - File: `components/StoryReader.tsx`
  - Action: Update the single `<ResultBlock>` call (line 96 in the main game branch) to pass the new `gaugeDeltas` and `gauges` props.
  - Notes: There is exactly ONE `<ResultBlock>` in `StoryReader.tsx` — in the main game `return` block (the `<main>` element). The game-over/complete branch does NOT render a `<ResultBlock>` (it renders `EndScreen` instead) — do not add one there.
  - Code:
    ```tsx
    <ResultBlock
      text={engineState.lastOutcomeText}
      gaugeDeltas={engineState.lastGaugeDeltas}
      gauges={config.gauges}
    />
    ```

- [x] **Task 6: Add introText field to StoryMeta type**
  - File: `engine/types.ts`
  - Action: Add `introText?: string` to the `StoryMeta` interface after the `description` field.
  - Notes: Optional field — no JSON changes required for existing story files. The landing screen falls back to `meta.description` if absent.
  - Code:
    ```ts
    export interface StoryMeta {
      title: string
      author: string
      version: string
      description?: string
      introText?: string       // ← add this line
      exampleProfiles: ExampleProfile[]
    }
    ```

- [x] **Task 7: Add LandingScreen to GameShell**
  - File: `components/GameShell.tsx`
  - Action: Replace the entire file content with the implementation below.
  - Notes:
    - `LandingScreen` is defined at **module scope** (outside `GameShell`), not inside the function body. Defining it inside would cause React to treat it as a new component type on every render and unmount/remount it unnecessarily.
    - `'use client'` stays at the top of the file.
    - `StoryConfig` is already imported — `LandingScreen` uses it for its props type.
    - `handleReplay` now goes to `'landing'` instead of `'profile'`. The `resetEngine()` call happens inside `StoryReader`'s `onReplay` callback before propagating to `GameShell` — this is unchanged and correct. `setPendingStats(null)` ensures the next `ProfileCreation` → `handleStart` cycle starts clean.
  - Code (complete file replacement):
    ```tsx
    'use client'

    import { useState } from 'react'
    import type { StoryConfig } from '@/engine/types'
    import * as themeManager from '@/engine/themeManager'
    import ProfileCreation from './ProfileCreation'
    import StoryReader from './StoryReader'

    interface GameShellProps {
      config: StoryConfig
    }

    // Defined at module scope — NOT inside GameShell — to prevent React from
    // treating it as a new component type on every render (which would unmount/remount it).
    function LandingScreen({ config, onBegin }: { config: StoryConfig; onBegin: () => void }) {
      const introText = config.meta.introText ?? config.meta.description
      return (
        <div className="reading-column" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: 'var(--color-text-primary)',
            }}
          >
            {config.meta.title}
          </h1>
          {introText && (
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '1.05rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                marginBottom: '3rem',
              }}
            >
              {introText}
            </p>
          )}
          <button
            type="button"
            onClick={onBegin}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Commencer
          </button>
        </div>
      )
    }

    export default function GameShell({ config }: GameShellProps) {
      const [phase, setPhase] = useState<'landing' | 'profile' | 'story'>('landing')
      const [pendingStats, setPendingStats] = useState<Record<string, number> | null>(null)

      function handleBegin() {
        setPhase('profile')
      }

      function handleStart(stats: Record<string, number>) {
        setPendingStats(stats)
        setPhase('story')
      }

      function handleReplay() {
        themeManager.resetToDefaults()
        setPendingStats(null)
        setPhase('landing')
      }

      if (phase === 'landing') {
        return <LandingScreen config={config} onBegin={handleBegin} />
      }

      if (phase === 'profile') {
        return <ProfileCreation config={config} onStart={handleStart} />
      }

      return <StoryReader config={config} initialStats={pendingStats} onReplay={handleReplay} />
    }
    ```

- [x] **Task 8: Improve gauge bar height and icon spacing**
  - File: `components/GaugeStrip.tsx`
  - Action: Three inline style changes in the gauge column renderer.
  - Notes: The column flex container already has `gap: '3px'` — increase to `'6px'`. The bar track div has `height: '7px'` — increase to `'10px'`. Update `borderRadius` on both bar track and fill to `'5px'` (was `'4px'`) to match the new height proportionally.
  - Code:
    ```tsx
    // Column flex container: gap '3px' → '6px'
    gap: '6px',

    // Bar track div: height '7px' → '10px', borderRadius '4px' → '5px'
    height: '10px',
    borderRadius: '5px',

    // Bar fill div: borderRadius '4px' → '5px'
    borderRadius: '5px',
    ```

- [x] **Task 9: Improve delta pill readability**
  - File: `app/globals.css`
  - Action: Update the `.gauge-delta-pill` CSS class — increase font-size from `0.7rem` to `0.85rem` and add a dark semi-transparent background chip with padding.
  - Notes: Background goes in the CSS class (not inline in the component) to comply with the no-hardcoded-colors-in-TSX rule. `rgba(0,0,0,0.55)` is fine in a `.css` file.
  - Code:
    ```css
    .gauge-delta-pill {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;          /* was 0.7rem */
      font-weight: 700;
      white-space: nowrap;
      animation: pill-fade 2s ease forwards;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.55);   /* new — improves contrast */
      border-radius: 4px;                  /* new */
      padding: 1px 5px;                    /* new */
    }
    ```

### Acceptance Criteria

- [x] **AC1 — Scroll to top on paragraph transition**
  - Given: the player is viewing a block with choices at the bottom of the viewport
  - When: the player selects a choice and the next block renders
  - Then: the page scrolls to the top of the window instantly, showing the beginning of the new block's text without requiring manual scrolling

- [x] **AC2 — Delta pill animates immediately at decay nodes**
  - Given: the player makes a choice at a block that produces gauge changes AND the destination block is a decay node (s20, s40, s50, s60, s70)
  - When: the new block appears (including after `applyDecay` fires)
  - Then: the gauge delta pill is visible and animating (not already faded from the previous render cycle)

- [x] **AC3 — ResultBlock shows gauge delta chips**
  - Given: the player made a choice that modified one or more visible gauges (e.g., +15 Énergie, -10 Alcool)
  - When: the ResultBlock is rendered on the following block
  - Then: delta chips appear below the outcome text, each showing the gauge icon, a `+` or `-` sign, and the rounded integer delta value
  - And: chips for gauges with no change (delta = 0) are NOT shown
  - And: hidden gauges (e.g., `kiff`) are NOT shown

- [x] **AC4 — ResultBlock renders with deltas even when outcome text is absent**
  - Given: the player made a choice with `gaugeEffects` but no `weightedOutcome` (no outcome text)
  - When: the following block renders
  - Then: the ResultBlock renders with the gauge delta chips only (no "Résultat" label and no text paragraphs if `lastOutcomeText` is null, only the chips)

- [x] **AC5 — Landing screen on first load**
  - Given: the user navigates to the game URL (fresh load or hard refresh)
  - When: the page loads
  - Then: the landing screen displays with the story title and the intro text (from `meta.introText` if present, else `meta.description`)
  - And: a "Commencer" button is visible and clickable
  - When: the user clicks "Commencer"
  - Then: the character creation (ProfileCreation) screen replaces the landing screen

- [x] **AC6 — Landing screen on replay**
  - Given: the player has reached the end screen (game over or story complete)
  - When: the player clicks the replay/restart button
  - Then: the landing screen appears (not the character creation screen directly)

- [x] **AC7 — Gauge bar visual improvement**
  - Given: the GaugeStrip is visible during gameplay
  - Then: the gauge bars are visibly taller than before (~10px vs the previous 7px)
  - And: there is clear vertical space between the emoji icon and the gauge bar
  - And: the +/- delta pill text is legible with improved contrast (dark background chip visible behind the text)
  - And: the pill still fades out after approximately 2 seconds

---

## Additional Context

### Dependencies

- No new npm packages required
- `GaugeDefinition` is already exported from `engine/types.ts` — no new exports needed
- `color-mix()` CSS function: supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+) — safe to use
- Tasks 4–5 depend on Task 3 (CSS class must exist before the component uses it)
- Task 7 depends on Task 6 (optional but preferred — `introText` type must exist if the field is used)
- Task 9 should be done alongside or after Task 8 (both affect GaugeStrip visuals)
- AC3/AC4 depend on AC2 being in place (correct delta data must be present for chips to show the right values)

### Testing Strategy

**Manual play-test sequence (covers all ACs):**

1. Load the app → verify landing screen appears with title + description (AC5)
2. Click "Commencer" → verify ProfileCreation appears (AC5)
3. Select stats and start game → play through first 3 blocks
4. After each choice: scroll position should be at top (AC1)
5. Navigate to a block with gauge effects (e.g., choose food at s12 → s15): verify delta chips appear in ResultBlock (AC3)
6. Navigate to a decay node (s20) from a block with gauge effects: verify delta pill animates correctly (AC2)
7. Play until a game-over or complete state → click replay → verify landing screen appears (AC6)
8. Inspect GaugeStrip visually: bar height, icon spacing, pill legibility (AC7)

**Edge cases to verify manually:**
- Choice with `gaugeEffects` but no `weightedOutcome` → ResultBlock shows chips only, no outcome text (AC4)
- Hidden gauge (`kiff`) delta is NOT shown in ResultBlock chips (AC3)
- Pill fades out after 2 seconds at non-decay blocks (no regression)

**No engine tests needed** — all changes are UI-layer only. The engine's `resolveChoice` and `applyDecay` logic is not modified.

## Review Notes
- Adversarial review completed
- Findings: 10 total, 5 fixed, 5 skipped
- Resolution approach: auto-fix
- Fixed: F2 (missing trailing newline), F4 (dead paddingLeft override), F5 (non-null assertion replaced with guard), F6 (autoFocus on Commencer button), F9 (minHeight corrected to 48px)
- Skipped: F1 (spec-aligned double-animation), F3 (architectural — out of scope), F7 (spec approves first-render scroll), F8 (content-contract), F10 (React stable setter)

### Notes

- **`introText` content**: The current `meta.description` ("Une soirée dont vous êtes le héros") is brief. If a richer landing screen intro is desired, add `"introText": "..."` to `public/stories/dub-camp.json` under `meta`. The type definition supports it; the landing screen will render it automatically.
- **Cause B (story content)**: Navigation-only choices (`s1-a` "C'est parti", `s10-a` "Tu vas te baigner au lac") have no gauge effects by design — they're transitional. The player won't see a ResultBlock or delta chips after these clicks. This is correct behavior; it only feels like a delay because the first feedback arrives at `s15`. If the content author wants immediate feedback, add `gaugeEffects` to those choices in `dub-camp.json`.
- **AC4 clarification**: When `lastOutcomeText` is null but deltas exist, the "Résultat" label header is NOT rendered (chips only). The complete `ResultBlock` code in Task 4 implements this via `{text && <p>Résultat</p>}` — the label is guarded by `text` being a non-empty string.
- **ResultBlock in game-over/complete branch of StoryReader**: The game-over / complete branch at the top of `StoryReader` also renders `GaugeStrip` but does NOT render a `ResultBlock`. This is intentional — the EndScreen handles end-state display. No change needed there.
