# Story 1.2: Define Engine TypeScript Interfaces

Status: complete

## Story

As a developer,
I want all shared TypeScript interfaces defined in `engine/types.ts`,
so that every subsequent engine implementation story works against a single, authoritative type contract with no ambiguity about field names or shapes.

## Acceptance Criteria

1. The file exports: `StoryConfig`, `StoryMeta`, `StatDefinition`, `GaugeDefinition`, `ActDefinition`, `DecayRule`, `Paragraph`, `Choice`, `WeightedOutcome`, `GaugeEffect`, `EndStateTier`, `EngineState`, `SaveState`, `StoryValidationError` (extends `Error`), `EngineError` (extends `Error`)
2. `EngineState` matches the canonical shape exactly: `{ storyId, paragraphId, gauges: Record<string, number>, stats: Record<string, number>, act: string, inventory: string[], score: number, isGameOver: boolean, gameOverParagraphId: string | null, isComplete: boolean }`
3. `SaveState` shape is: `{ storyId, version: number, savedAt: number, engineState: EngineState }`
4. `GaugeDefinition` includes: `id`, `name`, `icon`, `initialValue`, `isScore`, `isHidden`, `gameOverThreshold?: number`, `gameOverCondition?: 'above' | 'below'`
5. All fields use camelCase naming; all boolean flags use `is`/`has` prefix convention
6. `engine/types.ts` has zero imports from `components/`, `hooks/`, `app/`, or `lib/` — it is a pure type definition file
7. `npm run build` (or `tsc --noEmit`) passes with zero type errors

## Tasks / Subtasks

- [x] Create `engine/` directory and `engine/types.ts` file (AC: 1, 6)
  - [x] Create directory `engine/` at project root
  - [x] Create `engine/types.ts` with zero imports (pure type definitions only)

- [x] Define error classes (AC: 1)
  - [x] Export `class StoryValidationError extends Error` — used for story JSON config errors at startup
  - [x] Export `class EngineError extends Error` — used for runtime engine errors mid-story
  - [x] Note: These are distinct — never conflate them (StoryValidationError = config, EngineError = runtime)

- [x] Define stat and gauge types (AC: 1, 4, 5)
  - [x] Export `interface StatDefinition`: `{ id: string; name: string; description?: string; maxPerStat: number }`
  - [x] Export `interface GaugeDefinition`: `{ id: string; name: string; icon: string; initialValue: number; isScore: boolean; isHidden: boolean; gameOverThreshold?: number; gameOverCondition?: 'above' | 'below' }`
  - [x] Export `interface GaugeEffect`: `{ gaugeId: string; delta: number; statInfluence?: { statId: string; multiplier: number } }`
  - [x] Export `interface DecayRule`: `{ gaugeId: string; amount: number; statReductionId?: string; statReductionFormula?: string }`

- [x] Define story structure types (AC: 1)
  - [x] Export `interface WeightedOutcome`: `{ gaugeId: string; statId: string; goodEffects: GaugeEffect[]; badEffects: GaugeEffect[] }`
  - [x] Export `interface Choice`: `{ id: string; text: string; targetParagraphId: string; gaugeEffects?: GaugeEffect[]; weightedOutcome?: WeightedOutcome; inventoryAdd?: string[]; inventoryRemove?: string[] }`
  - [x] Export `interface Paragraph`: `{ id: string; content: string; choices: Choice[]; isGameOver?: boolean; isComplete?: boolean }`
  - [x] Export `interface ActDefinition`: `{ id: string; name: string; paragraphIds: string[]; theme: Record<string, string> }`
  - [x] Export `interface EndStateTier`: `{ minScore: number; maxScore: number; text: string }`

- [x] Define story meta and config types (AC: 1)
  - [x] Export `interface ExampleProfile`: `{ name: string; stats: Record<string, number>; description: string }`
  - [x] Export `interface StoryMeta`: `{ title: string; author: string; version: string; description?: string; exampleProfiles: ExampleProfile[] }`
  - [x] Export `interface StoryConfig`: `{ id: string; version: number; meta: StoryMeta; stats: StatDefinition[]; gauges: GaugeDefinition[]; acts: ActDefinition[]; decayNodes: string[]; decayRules: DecayRule[]; paragraphs: Record<string, Paragraph>; endStateTiers: EndStateTier[]; statPointBudget: number }`

- [x] Define engine state types (AC: 2, 3)
  - [x] Export `interface EngineState` with canonical shape:
    ```typescript
    interface EngineState {
      storyId: string
      paragraphId: string
      gauges: Record<string, number>       // key = GaugeDefinition.id, value [0-100]
      stats: Record<string, number>        // key = StatDefinition.id
      act: string                          // current act id
      inventory: string[]                  // item ids
      score: number                        // hidden score gauge value
      isGameOver: boolean
      gameOverParagraphId: string | null
      isComplete: boolean
    }
    ```
  - [x] Export `interface SaveState`: `{ storyId: string; version: number; savedAt: number; engineState: EngineState }`

- [x] Verify type correctness (AC: 7)
  - [x] Run `npx tsc --noEmit` — confirm zero type errors
  - [x] Verify no imports exist in `engine/types.ts` from `components/`, `hooks/`, `app/`, or `lib/`

## Dev Notes

- **Pure type file rule:** `engine/types.ts` must have ZERO imports from anywhere except possibly other type files. It is the type foundation that all other modules import from — it cannot import from downstream modules.
- **Record key convention (critical):** `EngineState.gauges` keys must always equal `GaugeDefinition.id` from the story config. Same for `stats` — always `StatDefinition.id`. Never use `name`, `label`, or display text as record keys. This is enforced throughout the engine and persistence layer.
- **Two error classes (critical distinction):** `StoryValidationError` = thrown during JSON config validation at startup, rendered in `DevErrorScreen`, never shown to players. `EngineError` = thrown during story runtime if something unexpected goes wrong mid-session. These serve different error handling paths.
- **Boolean flag convention:** All boolean fields use `is`/`has` prefix: `isScore`, `isHidden`, `isGameOver`, `isComplete`. Enforced throughout all interfaces.
- **Dub Camp reference:** `GaugeDefinition` maps to: `energie` (initial 100), `alcool` (initial 0), `fumette` (initial 0), `nourriture` (initial 50), `kiff` (initial 0, `isScore: true`, `isHidden: true`). The `kiff` gauge is the score gauge — its `isHidden: true` means it's excluded from the GaugeStrip display during play.
- **`statPointBudget`:** Added to `StoryConfig` — Dub Camp value is `8` (4 stats × max 4 each but total budget is 8).

### Project Structure Notes

Files to create:
- `engine/` directory (new)
- `engine/types.ts` (new — pure type definitions, no runtime code)

No existing files to modify in this story.

### References

- [Source: architecture.md#Format-Patterns] — Canonical `EngineState` shape, `SaveState` shape
- [Source: architecture.md#Naming-Patterns] — camelCase for interfaces, `is`/`has` prefix for booleans
- [Source: architecture.md#Structure-Patterns] — "Engine Module Rule: Nothing in `engine/` may import from `components/`, `hooks/`, or `app/`"
- [Source: epics.md#Story-1.2] — Full list of required exports
- [Source: project-context.md#Language-Specific-Rules] — "Two distinct error classes: `StoryValidationError` (config) vs `EngineError` (runtime)"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All 15 type exports implemented: StoryConfig, StoryMeta, StatDefinition, GaugeDefinition, ActDefinition, DecayRule, Paragraph, Choice, WeightedOutcome, GaugeEffect, EndStateTier, ExampleProfile, EngineState, SaveState, StoryValidationError, EngineError
- EngineState matches canonical shape exactly per architecture spec
- SaveState wraps EngineState with storyId, version, savedAt
- GaugeDefinition includes optional gameOverThreshold/gameOverCondition pair
- All boolean flags use is/has prefix convention
- Zero imports — pure type definition file
- `npx tsc --noEmit` passes clean

### File List

- `engine/types.ts` — new, all shared TypeScript interfaces and error classes
