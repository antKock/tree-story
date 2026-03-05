# Quick Spec 1.7: Name Input Screen Polish

Status: done

## Summary

Batch of small CSS and component fixes to bring the name input / profile creation screen closer to the UX design spec. No new features — purely visual and interaction polish.

## Changes

### G12 — Profile card selected state (Medium)

**Current**: Clicking a profile card immediately starts the game (`onStart` fires).
**Target**: Clicking a profile card selects it (accent border + subtle tint). A separate "Commencer" button confirms the selection and starts the game.

- Add `selectedProfile` state to track which profile is selected (or `null`)
- Selected card: `border-color: var(--color-accent)`, `background: color-mix(in srgb, var(--color-accent) 6%, transparent)`
- Unselected cards remain clickable to change selection
- Add "Commencer" button below profiles — disabled until both name is entered AND a profile is selected
- Button styling: same as current replay button (accent bg, full-width, 48px, weight 600)
- The "Commencer" button replaces the current behavior where clicking a profile card triggers `onStart`

**Files**: `components/ProfileCreation.tsx` (or wherever profile cards are rendered)

### G13 — Profiles heading style (Small)

**Current**: "Choisis ton profil" rendered as `h2` at 1.1rem, weight 600.
**Target**: Inter 0.7rem (≈11px), uppercase, `letter-spacing: 0.12em`, `--color-text-muted` — label style, not heading style.

**Files**: Same component as G12

### G11 — Name input transparent background (Small)

**Current**: `background: var(--color-surface)` (filled card look).
**Target**: `background: transparent`, `border: 1px solid rgba(255,255,255,0.12)`, `padding: 14px 16px`.

**Files**: Same component, name input styling

### G14 — "Personnaliser" as text link (Small)

**Current**: Full card button matching profile cards.
**Target**: Underlined text link — `"Personnaliser les stats →"`, `font-size: 0.85rem`, `color: var(--color-text-muted)`, `text-decoration: underline`, no background, no border, no padding matching cards.

**Files**: Same component, customize button

### G16 — Name input padding (Small)

**Current**: `height: 44px`, `padding: 0 1rem`.
**Target**: `padding: 14px 16px` (more generous vertical breathing room). Remove fixed `height` — let padding determine height.

**Files**: Same component, name input styling

## Out of Scope

- G9 (story-themed background) — requires schema/theming work, deferred to Step 3
- G10 (profile header with story title) — requires story metadata at name screen, deferred to Step 3
- G15 (focus accent color) — will resolve automatically when story theming is added

## Dev Notes

- All changes are in the profile creation component — single file modification
- G12 is the only behavioral change; the rest are CSS-only
- Keep existing validation: name required for button to enable
- Preserve all existing ARIA attributes and accessibility features
- `font-size: 16px` on name input must be preserved (prevents iOS Safari zoom)

## Dev Agent Record

### Implementation Notes

- G12: Added `selectedProfile` state (index or null). Profile cards now select on click instead of immediately starting. Added "Commencer" button below profiles, disabled until name + profile both selected. `confirmSelection()` reads selected profile, sanitizes stats, and calls `onStart`.
- G13: Changed "Choisis ton profil" from `<h2>` to `<div>` with label styling: 0.7rem, uppercase, letter-spacing 0.12em, muted color.
- G11 + G16: Name input changed from `background: var(--color-surface)`, `height: 44px`, `padding: 0 1rem` to `background: transparent`, `padding: 14px 16px`, no fixed height. Border updated to `rgba(255,255,255,0.12)`.
- G14: "Personnaliser" card button replaced with underlined text link: "Personnaliser les stats →", 0.85rem, muted color, no background/border/card padding.
- All existing ARIA attributes preserved, `font-size: 16px` preserved for iOS Safari.

### Completion Notes

All 5 gap fixes implemented in single file. Build passes, all 144 tests pass with no regressions.

## File List

- `components/ProfileCreation.tsx` — modified (G11, G12, G13, G14, G16)

## Senior Developer Review (AI)

**Reviewer:** Anthony | **Date:** 2026-03-05 | **Outcome:** Approved (with fixes applied)

**Issues Found:** 0 Critical, 2 Medium, 1 Low (all fixed)

| # | Severity | File | Issue | Fix Applied |
|---|----------|------|-------|-------------|
| M3 | Medium | ProfileCreation.tsx:73 | No `maxLength` on name input — API truncates silently | Added `maxLength={20}` to input |
| M5 | Medium | ProfileCreation.tsx:47 | `confirmSelection` accesses array without bounds check | Added bounds guard before array access |
| L3 | Low | ProfileCreation.tsx:14 | Focus state managed via React state instead of CSS `:focus` | Documented — inline styles require this pattern, no code change |

All 5 gap fixes (G11, G12, G13, G14, G16) verified as implemented. Build passes, 144 tests pass.

## Change Log

- 2026-03-05: Second code review — fixed 1 issue (L2: custom mode stats now sanitized via sanitizeProfile before onStart). All 5 gap fixes re-verified, status → done.
- 2026-03-05: Code review — fixed 3 issues (M3, M5, L3 documented). All gap fixes verified, status → done.
- 2026-03-05: Implemented name input screen polish — profile card selected state with Commencer button (G12), label-style heading (G13), transparent input background (G11), text link for Personnaliser (G14), generous input padding (G16).
