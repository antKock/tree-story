# Story 3.3: Gauge Strip

Status: ready-for-dev

## Story

As a player,
I want to see my current gauge states in a persistent strip at the top of the screen,
so that I can glance at my status without interrupting reading — and never have to calculate anything.

## Acceptance Criteria

1. `position: sticky; top: 0` — visible during scroll, never moves
2. Renders exactly the gauges from `storyConfig.gauges` where `isHidden === false` — the score gauge (Kiff) is never shown during play (FR13)
3. Each gauge renders as: emoji icon (17px, from `GaugeDefinition.icon`) centered above a horizontal fill bar (7px height, 4px border-radius)
4. Bar fill percentage maps directly to gauge value [0–100] — no numeric labels anywhere
5. Tapping anywhere on the gauge strip opens the CharacterSheet — this is the only trigger for CharacterSheet
6. The entire gauge strip is a touch target of at least 44px height (NFR7)
7. Gauge bar colors use `--color-accent` from the current act theme (FR24, FR25)

## Tasks / Subtasks

- [ ] Create `components/GaugeStrip.tsx` (AC: 1–7)
  - [ ] Mark with `"use client"` (receives engine state, handles tap)
  - [ ] Props: `{ gauges: Record<string, number>; config: StoryConfig; onOpenCharacterSheet: () => void }`

- [ ] Filter visible gauges (AC: 2)
  - [ ] `const visibleGauges = config.gauges.filter(g => !g.isHidden)`
  - [ ] Note: For Dub Camp, this shows: `energie`, `alcool`, `fumette`, `nourriture` (4 gauges) — `kiff` is hidden

- [ ] Render gauge row (AC: 3, 4, 7)
  - [ ] Container: `display: flex; gap: 8px; align-items: center` (or Tailwind equivalent)
  - [ ] For each visible gauge, render a column:
    - Emoji icon: `<span style={{ fontSize: '17px' }}>{gauge.icon}</span>`, centered horizontally
    - Fill bar:
      ```html
      <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', position: 'relative' }}>
        <div style={{
          width: `${gauges[gauge.id]}%`,
          height: '100%',
          borderRadius: '4px',
          background: 'var(--color-accent)',
          transition: 'width 150ms ease'
        }} />
      </div>
      ```
  - [ ] No numeric labels — fill percentage is the only visual indicator (FR — mechanics invisible)
  - [ ] Bar fill uses `--color-accent` — this is overridden per act by `themeManager.ts` at runtime

- [ ] Implement sticky positioning (AC: 1)
  - [ ] Outer wrapper: `position: sticky; top: 0; z-index: 10; background: var(--color-bg); padding: 8px 1.5rem`
  - [ ] This ensures the strip stays at top during prose scroll

- [ ] Implement tap-to-open CharacterSheet (AC: 5, 6)
  - [ ] Wrap entire strip in a button or clickable div: `onClick={onOpenCharacterSheet}`
  - [ ] Set `role="button"` and `aria-label="Open character sheet"` if using a div
  - [ ] Entire strip height must be at least 44px — verify with CSS `min-height: 44px`
  - [ ] No `cursor: pointer` is required on mobile but add for desktop usability

- [ ] Integrate GaugeStrip into StoryReader (preview — AC: 5)
  - [ ] `StoryReader.tsx` will render `<GaugeStrip>` and manage `charSheetOpen` state
  - [ ] Pass `onOpenCharacterSheet={() => setCharSheetOpen(true)}` as prop
  - [ ] Note: `StoryReader.tsx` is built in Story 3.4 — GaugeStrip can be standalone for now

## Dev Notes

- **`isHidden` filter is critical (FR13):** The Kiff gauge (`isScore: true`, `isHidden: true`) must NEVER appear in the GaugeStrip during play. Filter strictly by `g.isHidden === false`. The Kiff gauge appears in the CharacterSheet (Story 3.5) and at the EndScreen (Story 3.6) — not here.
- **`--color-accent` for bar fill:** The bar color is `var(--color-accent)`, which is overridden at runtime by `themeManager.ts` when act transitions occur. The gauge bar fill will automatically change color as acts progress — no component-level logic needed.
- **Tap target is the entire strip:** There is no separate "info button" — the whole GaugeStrip is the tap target for CharacterSheet. This means `onClick` must be on the outermost container, and the minimum height must be 44px.
- **Gauge value is `gauges[gauge.id]`:** The `gauges` prop is `Record<string, number>` keyed by `GaugeDefinition.id`. Access the value as `gauges[gauge.id]`. A missing gauge ID should default to 0 gracefully.
- **No inline calculations visible to player:** The strip shows only bar fills. No percentages, no numbers, no icons with values. This is intentional game design.
- **Background on sticky:** Apply `background: var(--color-bg)` to the sticky container so scrolling content doesn't bleed through.

### Project Structure Notes

Files to create:
- `components/GaugeStrip.tsx` (new)

Prerequisites:
- Story 1.2 (`engine/types.ts` — `GaugeDefinition`, `StoryConfig`)
- Story 3.1 (design tokens — `--color-accent`, `--color-bg`)
- Story 2.5 (`engine/themeManager.ts` — updates `--color-accent` on act transitions)

### References

- [Source: architecture.md#Component-Architecture] — "GaugeStrip: pure display, receives gauge array from engine state"
- [Source: epics.md#Story-3.3] — Full spec: 17px icons, 7px bars, sticky positioning, 44px touch target
- [Source: project-context.md#UI-constraints] — "CharacterSheet opens ONLY from GaugeStrip tap — no other trigger"
- [Source: architecture.md#Enforcement-Guidelines] — "Never display raw gauge numbers to the player"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
