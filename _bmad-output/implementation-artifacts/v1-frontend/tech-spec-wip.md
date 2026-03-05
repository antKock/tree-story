---
title: 'Tree Story — UX & Engine Quick Fixes'
slug: 'ux-engine-quick-fixes'
created: '2026-03-03'
status: 'in-progress'
stepsCompleted: [1, 2]
tech_stack: ['Next.js 16', 'React 19', 'TypeScript 5', 'Tailwind CSS 4']
files_to_modify: ['components/GameShell.tsx', 'components/ProfileCreation.tsx', 'engine/gaugeSystem.ts', 'engine/types.ts']
code_patterns: ['phase-based state machine', 'localStorage persistence', 'gauge clamping']
test_patterns: []
---

# Tech-Spec: Tree Story — UX & Engine Quick Fixes

**Created:** 2026-03-03

## Overview

### Problem Statement

Three issues degrade the player experience: (1) refreshing the page loses game progress despite saves existing in localStorage, (2) skill profiles aren't presented prominently enough with custom being mixed in, (3) the score is artificially capped at 100 when the story config intends 200.

### Solution

Restore game state on mount from localStorage, redesign the skill selection to highlight all profiles equally with "Custom" as a distinct last option, and respect `maxValue` from gauge definitions instead of hardcoding 100.

### Scope

**In Scope:**
- Silent restore to story phase on refresh if valid save exists
- Skill page layout: presets + custom all prominent, custom last
- `maxValue` support in gauge clamping from story config

**Out of Scope:**
- Multi-slot saves
- New presets or stat rebalancing
- Changes to end-game tier thresholds

## Context for Development

### Codebase Patterns

- Phase-based state machine in `GameShell.tsx`: `landing → profile → story`
- Persistence via `engine/persistence.ts` using `tree-story:save` localStorage key
- All gauges clamped to `[0, 100]` in `engine/gaugeSystem.ts` — hardcoded, ignores config `maxValue`
- `useStoryEngine` hook loads save on init, but `GameShell` doesn't check for existing save to skip landing
- `ProfileCreation.tsx` has 3 `exampleProfiles` and manual stat allocator side by side

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `components/GameShell.tsx` | Phase state machine — controls landing/profile/story flow |
| `components/ProfileCreation.tsx` | Stat allocation and preset profiles UI |
| `engine/gaugeSystem.ts` | Gauge effect application and clamping logic |
| `engine/persistence.ts` | localStorage save/load/clear |
| `engine/types.ts` | TypeScript types for engine state and config |
| `hooks/useStoryEngine.ts` | Engine hook — initializes engine, manages persistence |
| `public/stories/dub-camp.json` | Story config with gauge definitions including `maxValue` |
| `components/EndScreen.tsx` | Score display and tier thresholds |

### Technical Decisions

- Restore silently on refresh — no "Welcome back" screen, skip landing entirely
- All profile options (presets + custom) equally prominent, custom positioned last
- `maxValue` read from `GaugeDefinition` in story config, defaulting to 100 if absent
- Non-score gauges also respect their `maxValue` if set (currently only kiff has it)

## Implementation Plan

### Tasks

_To be filled in Step 3_

### Acceptance Criteria

_To be filled in Step 3_

## Additional Context

### Dependencies

None — all changes are within existing codebase, no new packages needed.

### Testing Strategy

_To be filled in Step 3_

### Notes

- The story JSON already has `maxValue: 200` on the kiff gauge — the config is ready, the engine just ignores it
- End-game tiers already handle scores up to 9999 in their thresholds
