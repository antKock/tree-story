---
title: 'Tree Story v1.5 — Full Audit Implementation'
slug: 'tree-story-v1-5-full-audit'
created: '2026-03-02'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 16 App Router', 'React 19', 'TypeScript strict', 'Tailwind CSS 4', 'Vitest']
files_to_modify:
  - engine/types.ts
  - engine/weightedOutcome.ts
  - engine/storyEngine.ts
  - engine/gaugeSystem.ts
  - engine/storyValidator.ts
  - engine/persistence.ts
  - engine/storyEngine.test.ts
  - engine/__fixtures__/dub-camp-fixture.ts
  - hooks/useStoryEngine.ts
  - components/StoryReader.tsx
  - components/GaugeStrip.tsx
  - app/globals.css
  - public/stories/dub-camp.json
  - docs/story-format-spec.md
files_to_create:
  - components/ResultBlock.tsx
code_patterns:
  - 'Engine isolation: engine/ has zero imports from components/hooks/app'
  - 'Engine returns new immutable state — never mutates in place'
  - 'After every mutation: setEngineState → persistence.save → themeManager.apply'
  - 'Gauge keys always use GaugeDefinition.id — never name or label'
  - 'CSS custom properties on :root only, no component-scoped vars'
test_patterns:
  - 'Vitest, co-located .test.ts, zero React imports in engine tests'
  - 'vi.spyOn(Math, "random") for deterministic outcome tests'
  - 'createEngine(config, savedState) pattern for testing from mid-story state'
---

# Tech-Spec: Tree Story v1.5 — Full Audit Implementation

**Created:** 2026-03-02

## Overview

### Problem Statement

The current v1.0 engine has two critical bugs: (1) when a paragraph has a `weightedOutcome`, the player reads all possible outcome texts before the roll is resolved — the suspense is destroyed; (2) gauge changes from choices happen silently with no visual feedback, making the gauge system opaque and strategic decisions impossible to calibrate. Beyond the bugs, the engine has significant spec limitations: outcomes are binary (good/bad only, no multi-outcome support, no per-outcome narrative text), there is no combinatorial score multiplier system, no contextual or composite Game Over rules, and no conditional random branching. The `dub-camp.json` story file has data quality issues: A/B result texts are embedded in paragraph content instead of outcomes, `statInfluence.multiplier` is set to `0.1` everywhere (in the additive formula this saves only 0.4 pts — negligible), food gains have no stomach stat bonus, there is a false food Game Over threshold not in the original design, and sEVT1 routing is always triggered rather than probabilistic. The `story-format-spec.md` is incomplete: it describes the `statInfluence` formula as additive (`delta + stat × multiplier`) but the engine implements it as multiplicative (`delta × (1 - stat × multiplier)`). These must be reconciled.

### Solution

Implement all three phases from the audit document `docs/tree-story-audit-v1.md`:
- **Phase 1** — Fix the 2 bugs: replace the binary `WeightedOutcome` structure with a generic `outcomes` array supporting per-outcome narrative text; add floating delta pills above gauge bars for visual feedback; fix the `statInfluence` formula to additive and update multipliers to 2
- **Phase 2** — Story fidelity: add combinatorial score multiplier rules, fix dub-camp.json data errors
- **Phase 3** — Advanced mechanics: contextual Game Over per paragraph, composite multi-gauge Game Over rules, conditional random branching

### Scope

**In Scope:**
- A.1: Replace `goodEffects`/`badEffects` with `outcomes: OutcomeBranch[]` in `WeightedOutcome` type and resolver
- B.2: Display only the resolved outcome's `text` in a distinct `ResultBlock` component; `lastOutcomeText: string | null` and `lastGaugeDeltas: Record<string, number> | null` added to `EngineState`
- B.1 + B.7: Floating delta pills above gauge bars via CSS `@keyframes`; danger flash on critical drops
- C.1: Migrate A/B texts from `content` into `outcomes[].text` in dub-camp.json (s11, s15a, s31, s40a, s40d, s51, s60a, s61, sEVT1)
- C.2: Fix `statInfluence` formula from multiplicative to additive in `gaugeSystem.ts`; update multipliers in dub-camp.json from `0.1` to `2`
- C.3: Add `statInfluence: { statId: "estomac", multiplier: 3 }` to food gauge effects in dub-camp.json
- A.3 + B.3: Add `scoreMultipliers?: ScoreMultiplierRule[]` to `StoryConfig`; engine evaluates after weighted outcome, before clamping
- C.4: Remove `gameOverThreshold: 5`/`gameOverCondition: "below"` from `nourriture` in dub-camp.json; update test
- C.5: Add `conditionalBranch` at §40A/B (33% probability → sEVT1) in dub-camp.json
- A.4 + B.5: Add `contextualGameOver?: ContextualGameOver[]` to `Paragraph`; evaluate after clamping, before global GO
- A.5 + B.6: Add `conditionalBranch?: ConditionalBranch` to `Choice`; evaluate after all GO checks
- A.6: Add `compositeGameOverRules?: CompositeGameOverRule[]` to `StoryConfig`; evaluate after global GO
- C.6: Verify §50 double penalty (-10 choice + -7 decay = -17 minimum); document intent — do NOT change unless intentional per original design
- C.7: Replace generic single-choice button text in dub-camp.json with immersive context-specific text
- Update `storyValidator.ts` for all new types
- Update `docs/story-format-spec.md` — all new fields, corrected formula, updated evaluation order

**Out of Scope:**
- New stories beyond dub-camp
- New UI screens (ProfileCreation, EndScreen changes)
- Backend, authentication, user accounts
- E2E tests (engine unit tests only per project-context.md)
- Visual redesign beyond delta pills and result block

## Context for Development

### Codebase Patterns

- Next.js 16 App Router, React 19, TypeScript strict (`no any`, explicit return types in `engine/`), Tailwind CSS 4 (`@theme` in `globals.css` — no `tailwind.config.js`)
- `engine/` is fully isolated — zero imports from components/hooks/app/lib
- `useStoryEngine` hook is the sole bridge; `StoryReader.tsx` is the sole consumer of the hook
- Engine returns new immutable state objects via `deepCopyState` — never mutates in place
- After every engine mutation in the hook: `setEngineState()` → `persistence.save()` → `themeManager.apply()`
- `engineRef.current` is created exactly once via `useRef` — never recreated on re-render
- Gauge keys always use `GaugeDefinition.id` — never `name` or `label`
- CSS custom properties on `:root` only: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`
- No hardcoded color values in component files
- All transitions/animations via CSS (`transition`, `@keyframes`) — no JS timers in render

### Key Technical Findings

**1. `resolveOutcome` return type changes from `'good' | 'bad'` to `OutcomeBranch`**

Current caller in `storyEngine.ts` (lines 145–149):
```typescript
const result = resolveOutcome(...)  // returns 'good' | 'bad'
const effects = result === 'good' ? choice.weightedOutcome.goodEffects : choice.weightedOutcome.badEffects
```
After change:
```typescript
const branch = resolveOutcome(choice.weightedOutcome, gauges, stats, config)
_state.lastOutcomeText = branch.text
_state.gauges = applyGaugeEffects(_state.gauges, branch.effects, _state.stats, config)
```

**2. `lastOutcomeText` and `lastGaugeDeltas` live in `EngineState`**

Both fields are cleared to `null` at the START of every `resolveChoice` call, then populated during execution. They persist to localStorage but are cleared on next choice — acceptable.

**3. `statInfluence` formula: fix from multiplicative to additive — with a floor**

Current `gaugeSystem.ts` line 22: `delta = delta * (1 - statValue * multiplier)`
Fixed with sign-safe floor:
```typescript
let delta = effect.delta
if (effect.statInfluence) {
  const statValue = stats[effect.statInfluence.statId] ?? 0
  const adjusted = delta + (statValue * effect.statInfluence.multiplier)
  // For negative deltas (costs): stat can reduce to zero but never flip sign (no healing from movement)
  // For positive deltas (gains): stat can increase the gain freely
  delta = delta < 0 ? Math.min(0, adjusted) : adjusted
}
```
This means: a stat can make an energy cost free (delta → 0) at high values, but never turn a cost into a gain. Food gains with `estomac` still increase freely (positive delta). Test at line 63: `delta=-20, endurance=4, multiplier=2` → `adjusted = -20 + 8 = -12`, `min(0, -12) = -12` → `energie = 88`. Assertion unchanged. ✅

**4. `resolveOutcome` algorithm for `outcomes[]` — clean N-outcome implementation**

Risk computation stays identical. Map risk to `goodProbability` (same 4-band table, values 0.9/0.6/0.4/0.2). Then partition the `[0, 1)` roll range: outcome[0] gets `[0, goodProbability)`, the remaining outcomes split `[goodProbability, 1)` equally. This is perfectly backward-compatible for 2-outcome (outcome[1] gets the entire bad zone). `maxRisk` values on `OutcomeBranch` are NOT used by the selection algorithm — they serve only as documentation/calibration markers and the validator enforces the last is ≥ 100 for completeness.

**Exact implementation for Task 3:**
```typescript
const r = Math.random()
const n = outcome.outcomes.length
if (n === 1) return outcome.outcomes[0]
if (r < goodProbability) return outcome.outcomes[0]
// distribute remaining probability equally among outcomes[1..n-1]
const badZoneWidth = (1 - goodProbability) / (n - 1)
const badIndex = 1 + Math.floor((r - goodProbability) / badZoneWidth)
return outcome.outcomes[Math.min(badIndex, n - 1)]
```
For 2 outcomes: `badZoneWidth = 1 - gP`, `badIndex = 1 + Math.floor((r - gP) / (1 - gP))`. Since `r - gP` is in `[0, 1-gP)`, `Math.floor` always gives 0, so `badIndex = 1`. Identical to old behavior. ✅

**5. Score multiplier evaluation point — correct timing**

`scoreMultipliers` evaluate the gauge snapshot at the START of `resolveChoice` (before any effects are applied) to check conditions. The multiplier then scales the combined score delta from BOTH `choice.gaugeEffects` AND the weighted outcome `branch.effects`. Implementation approach:
1. Before applying any effects, snapshot current gauge values for condition checking
2. Collect all GaugeEffect objects from choice.gaugeEffects + branch.effects into one list
3. Find any effect targeting the score gauge (`isScore: true`)
4. Evaluate `scoreMultipliers` conditions against the pre-choice snapshot (first matching rule wins)
5. Scale the score gauge effect's delta by the multiplier
6. Then pass the full modified effects list to `applyGaugeEffects` once

**6. `dub-camp-fixture.ts` will fail TypeScript compilation after types change**

The fixture uses `WeightedOutcome` directly. After removing `goodEffects`/`badEffects`, the fixture must be updated to `outcomes: OutcomeBranch[]` or it will not compile. The `storyEngine.test.ts` `resolveOutcome` tests must also be updated — they spy on `Math.random()` and check `toBe('good')` / `toBe('bad')`. After type change these must check `branch.id === 'a'` or `branch.text` instead.

**7. Delta pills: CSS-only, no timers**

`GaugeStrip` receives `gaugeDeltas: Record<string, number> | null` prop. When non-null, renders a pill element per changed gauge. The pill element has a CSS class with `animation: pill-fade 2s ease forwards`. A `key` prop on the pill container (e.g., `key={animKey}` incremented each resolution) forces React to unmount+remount, restarting the animation even if gauges change in the same direction twice in a row.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `engine/types.ts` | Add `OutcomeBranch`, update `WeightedOutcome`, add new mechanic types, add fields to `EngineState`/`StoryConfig`/`Paragraph`/`Choice` |
| `engine/weightedOutcome.ts` | Change return type to `OutcomeBranch`; update resolver algorithm |
| `engine/storyEngine.ts` | New 14-step evaluation order (Steps 0–13); score multipliers, contextual GO, composite GO, conditional branching |
| `engine/gaugeSystem.ts` | Fix `statInfluence` formula line 22 (multiplicative → additive) |
| `engine/storyValidator.ts` | Replace `validateWeightedOutcome`; add validators for all new types |
| `engine/persistence.ts` | Update `isValidSavedState`-equivalent logic to not reject saves missing `lastOutcomeText`/`lastGaugeDeltas` |
| `engine/storyEngine.test.ts` | Update `resolveOutcome` tests; remove s203 GO test; update statInfluence test; add new mechanic tests |
| `engine/__fixtures__/dub-camp-fixture.ts` | Update `WeightedOutcome` shape to `outcomes[]`; add multiplier=2 to energy effects |
| `hooks/useStoryEngine.ts` | Expose `lastOutcomeText` and `lastGaugeDeltas` in hook return |
| `components/StoryReader.tsx` | Add `<ResultBlock>` below `<ParagraphDisplay>`; pass `lastGaugeDeltas` to `<GaugeStrip>` |
| `components/GaugeStrip.tsx` | Add `gaugeDeltas` prop and delta pills overlay |
| `components/ResultBlock.tsx` | **NEW** — styled block for outcome text with `renderMarkdownLite` |
| `app/globals.css` | Add `@keyframes pill-fade` |
| `public/stories/dub-camp.json` | All C.1–C.7 data fixes |
| `docs/story-format-spec.md` | Updated spec with all new field sections and corrected formula |

### Technical Decisions

1. **`lastOutcomeText` in `EngineState`** — simplest path; engine is single source of truth; no hook-level state needed for outcome text
2. **Delta pills pure CSS** — `@keyframes pill-fade` + `key` re-mount, no JS timers; React 19 batches `setEngineState` and `setAnimKey` into one render so pills appear correctly on first render
3. **`resolveOutcome` probability-partition algorithm** — outcome[0] gets `[0, goodProbability)`, remaining outcomes split `[goodProbability, 1)` equally; `maxRisk` on branches is documentation-only, not used for selection; perfectly backward-compatible for 2-outcome case
4. **Score multiplier in `resolveChoice`** — conditions evaluated against pre-choice gauge snapshot; multiplier applied to combined score delta (choice + branch effects) BEFORE `applyGaugeEffects` writes anything; keeps `gaugeSystem` pure
5. **`storyValidator` new fields optional** — `scoreMultipliers`, `compositeGameOverRules`, `contextualGameOver`, `conditionalBranch` all accepted when absent; no breaking change for existing stories WITHOUT `weightedOutcome` — stories WITH `weightedOutcome` using `goodEffects`/`badEffects` will fail validation (expected: they need to migrate to `outcomes[]`)
6. **Each GO evaluation step is an early return** — every "STOP" in the evaluation order means `return engine.getState()` immediately; subsequent steps do not execute

---

## Implementation Plan

### Tasks

- [ ] **Task 1: Update `engine/types.ts` — add all new types and update existing interfaces**
  - File: `engine/types.ts`
  - Action:
    1. Add `OutcomeBranch` interface before `WeightedOutcome`:
       ```typescript
       export interface OutcomeBranch {
         id: string
         label?: string
         maxRisk: number
         text: string
         effects: GaugeEffect[]
       }
       ```
    2. Replace `WeightedOutcome` body — remove `goodEffects`/`badEffects`, add `outcomes: OutcomeBranch[]`:
       ```typescript
       export interface WeightedOutcome {
         gaugeId: string
         statId: string
         outcomes: OutcomeBranch[]
       }
       ```
    3. Add new mechanic interfaces:
       ```typescript
       export interface GaugeCondition {
         gaugeId: string
         min?: number
         max?: number
       }
       export interface ScoreMultiplierRule {
         conditions: GaugeCondition[]
         multiplier: number
       }
       export interface ContextualGameOver {
         gaugeId: string
         threshold: number
         condition: 'above' | 'below'
         probability?: number
         targetParagraphId: string
       }
       export interface ConditionalBranch {
         probability: number
         targetParagraphId: string
       }
       export interface CompositeGameOverRule {
         paragraphScope?: string[]
         conditions: GaugeCondition[]
         probability?: number
         targetParagraphId: string
       }
       ```
    4. Add to `Paragraph` interface: `contextualGameOver?: ContextualGameOver[]`
    5. Add to `Choice` interface: `conditionalBranch?: ConditionalBranch`
    6. Add to `StoryConfig` interface: `scoreMultipliers?: ScoreMultiplierRule[]` and `compositeGameOverRules?: CompositeGameOverRule[]`
    7. Add to `EngineState` interface: `lastOutcomeText: string | null` and `lastGaugeDeltas: Record<string, number> | null`
  - Notes: This task will break `engine/__fixtures__/dub-camp-fixture.ts` and the `resolveOutcome` tests at compile time. Fix them in Tasks 3 and 6 immediately after.

- [ ] **Task 2: Fix `engine/gaugeSystem.ts` — `statInfluence` formula**
  - File: `engine/gaugeSystem.ts`
  - Action: Replace lines 19–25 of `gaugeSystem.ts` with the sign-safe additive formula:
    ```typescript
    let delta = effect.delta
    if (effect.statInfluence) {
      const statValue = stats[effect.statInfluence.statId] ?? 0
      const adjusted = delta + (statValue * effect.statInfluence.multiplier)
      // Negative delta (cost): stat reduces cost toward zero but never flips sign
      // Positive delta (gain): stat amplifies gain freely
      delta = delta < 0 ? Math.min(0, adjusted) : adjusted
    }
    result[effect.gaugeId] = clamp(result[effect.gaugeId] + delta, 0, 100)
    ```
  - Notes: `multiplier` in dub-camp.json updated to `2` in Task 13; fixture updated to `2` in Task 6. Test at line 63: `delta=-20, endurance=4, multiplier=2` → `adjusted=-12`, `min(0,-12)=-12` → `energie=88`. Assertion unchanged ✅. Update test comment only. For food effects (C.3), `delta` is positive so the floor branch is never taken — `estomac` freely amplifies food gains.

- [ ] **Task 3: Update `engine/weightedOutcome.ts` — new return type and algorithm**
  - File: `engine/weightedOutcome.ts`
  - Action: Rewrite `resolveOutcome` to return `OutcomeBranch` instead of `'good' | 'bad'`:
    ```typescript
    import type { WeightedOutcome, OutcomeBranch, StoryConfig } from './types'

    export function resolveOutcome(
      outcome: WeightedOutcome,
      gauges: Record<string, number>,
      stats: Record<string, number>,
      _config: StoryConfig
    ): OutcomeBranch {
      const gaugeLevel = gauges[outcome.gaugeId] ?? 0
      const statValue = stats[outcome.statId] ?? 0
      const nourriture = gauges['nourriture'] ?? 50
      const hungerModifier = nourriture > 50 ? 0 : nourriture >= 25 ? 10 : 25
      const risk = gaugeLevel - (statValue * 15) + hungerModifier
      const goodProbability = risk < 30 ? 0.9 : risk <= 55 ? 0.6 : risk <= 75 ? 0.4 : 0.2

      const r = Math.random()
      const n = outcome.outcomes.length

      if (n === 1) return outcome.outcomes[0]

      // outcome[0] occupies [0, goodProbability)
      if (r < goodProbability) return outcome.outcomes[0]

      // Remaining outcomes[1..n-1] split [goodProbability, 1) equally
      const badZoneWidth = (1 - goodProbability) / (n - 1)
      const badIndex = 1 + Math.floor((r - goodProbability) / badZoneWidth)
      return outcome.outcomes[Math.min(badIndex, n - 1)]
    }
    ```
  - Notes: For 2-outcome case: `badZoneWidth = 1 - gP`, `Math.floor((r - gP) / (1 - gP))` always yields 0 when `r ∈ [gP, 1)`, so `badIndex = 1`. Identical behavior to original good/bad. `maxRisk` field on `OutcomeBranch` is not used in selection — it documents the intended risk calibration and is validated (last ≥ 100) but not evaluated at runtime.

- [ ] **Task 4: Update `engine/storyEngine.ts` — new 14-step evaluation order (Steps 0–13) and new mechanics**
  - File: `engine/storyEngine.ts`
  - Action:
    1. Update `deepCopyState` to carry forward the existing values: `lastOutcomeText: state.lastOutcomeText` and `lastGaugeDeltas: state.lastGaugeDeltas ? { ...state.lastGaugeDeltas } : null` (do NOT initialize to null — deep copy must preserve current state)
    2. Update `freshState()` to include `lastOutcomeText: null, lastGaugeDeltas: null`
    3. Add helper `evaluateContextualGameOver(paragraph, gauges)` — iterates `paragraph.contextualGameOver`, checks condition + optional probability, sets `_state.isGameOver`/`_state.paragraphId`
    4. Add helper `evaluateCompositeGameOverRules(paragraphId, gauges)` — iterates `config.compositeGameOverRules`, checks `paragraphScope` (if set), all conditions, optional probability, sets GO state
    5. Add helper `evaluateScoreMultipliers(baseDelta, scoreGaugeId)` — finds first matching rule, returns `baseDelta * multiplier`
    6. Rewrite `resolveChoice` body with the new 14-step order (Steps 0–13). **"STOP" means `return engine.getState()` immediately — do not execute any subsequent steps.**
       ```
       Step 0:  Clear lastOutcomeText = null, lastGaugeDeltas = null
       Step 1:  Snapshot prevGauges for delta computation (copy current gauge values)
       Step 2:  Apply choice.gaugeEffects (accounting for scoreMultipliers on score gauge deltas)
       Step 3:  Resolve choice.weightedOutcome → apply branch.effects (with scoreMultipliers on score deltas); store branch.text in lastOutcomeText
       Step 4:  Apply inventoryAdd/inventoryRemove
       Step 5:  Clamp all gauges to [0, 100]
       Step 6:  Compute lastGaugeDeltas (diff prevGauges vs _state.gauges after clamping)
       Step 7:  Evaluate contextualGameOver on current paragraph → if triggered: set GO state, STOP (early return)
       Step 8:  Evaluate global gameOver thresholds → if triggered: set GO state, STOP (early return)
       Step 9:  Evaluate compositeGameOverRules → if triggered: set GO state, STOP (early return)
       Step 10: Evaluate conditionalBranch → if roll < probability: set targetId = branch.targetParagraphId
       Step 11: Evaluate act transition with targetId
       Step 12: Advance _state.paragraphId to targetId
       Step 13: Sync score; check isComplete
       ```
    7. (Persistence lenience is handled in Task 7b — no changes to `isValidSavedState` needed in this task)
  - Notes: The score multiplier must intercept the delta BEFORE it is written to gauges. Practical implementation: collect all deltas first, apply multiplier to the score gauge delta, then write. Alternatively, apply score multiplier inside the `applyGaugeEffects` call by pre-computing. Cleanest: compute score deltas from choice.gaugeEffects, find first matching scoreMultiplier rule, scale score delta, then build the modified effects list before calling `applyGaugeEffects`.

- [ ] **Task 5: Update `engine/storyValidator.ts` — validate new types**
  - File: `engine/storyValidator.ts`
  - Action:
    1. Replace `validateWeightedOutcome` — remove `goodEffects`/`badEffects` validation, add `outcomes` array validation:
       - Require `outcomes` is a non-empty array
       - Each `OutcomeBranch`: require `id` (string), `maxRisk` (number 0–100), `text` (string), `effects` (GaugeEffect[])
       - Validate last entry's `maxRisk >= 100`
       - Optional: `label` (string)
    2. Add `validateOutcomeBranch(data, context)` helper
    3. Add `validateGaugeCondition(data, context)` helper: `gaugeId` (string), optional `min`/`max` (numbers)
    4. Add `validateScoreMultiplierRule(data, context)` helper
    5. Add `validateContextualGameOver(data, context)` helper
    6. Add `validateConditionalBranch(data, context)` helper
    7. Add `validateCompositeGameOverRule(data, context)` helper
    8. In `validateParagraph`: optionally parse `contextualGameOver` array if present
    9. In `validateChoice`: optionally parse `conditionalBranch` if present
    10. In `validateStoryConfig` (main export): optionally parse `scoreMultipliers[]` and `compositeGameOverRules[]` if present; pass them through in the return object
    11. Update referential integrity checks: validate `contextualGameOver[].targetParagraphId`, `conditionalBranch.targetParagraphId`, `compositeGameOverRules[].targetParagraphId` all exist in `paragraphs`
  - Notes: All new top-level fields (`scoreMultipliers`, `compositeGameOverRules`) are optional — validator must not throw if absent. Same for `contextualGameOver` on paragraph and `conditionalBranch` on choice. Add `scoreMultipliers` and `compositeGameOverRules` to the returned `StoryConfig` object.

- [ ] **Task 6: Update `engine/__fixtures__/dub-camp-fixture.ts` — new WeightedOutcome shape**
  - File: `engine/__fixtures__/dub-camp-fixture.ts`
  - Action:
    1. Find all paragraphs in the fixture that have a `weightedOutcome` (search for `goodEffects`/`badEffects`)
    2. Replace each with `outcomes: OutcomeBranch[]` format. Example for `c10b` (the weighted outcome fixture paragraph):
       ```typescript
       weightedOutcome: {
         gaugeId: 'alcool',
         statId: 'resistanceAlcool',
         outcomes: [
           {
             id: 'a',
             maxRisk: 60,
             text: 'Good outcome.',
             effects: [{ gaugeId: 'kiff', delta: 5 }],
           },
           {
             id: 'b',
             maxRisk: 100,
             text: 'Bad outcome.',
             effects: [{ gaugeId: 'alcool', delta: 10 }],
           },
         ],
       }
       ```
    3. Update all `statInfluence.multiplier` values from `0.1` to `2` in the fixture
    4. Keep the `sEVT1` fixture entry with the same effects — just convert to new shape
    5. Add a `conditionalBranch` entry to at least one fixture choice so that `conditionalBranch` tests (Task 7) have a fixture paragraph to run against. Example on the `c10b` choice leading out:
       ```typescript
       conditionalBranch: { probability: 0.33, targetParagraphId: 'sAlt' }
       ```
       (Add a minimal `sAlt` paragraph to the fixture with no choices — just content — to satisfy referential integrity)
  - Notes: The fixture `storyId` is `'dub-camp-test'`. The fixture paragraphs are minimal — only touch the `weightedOutcome` shape, not the content or routing.

- [ ] **Task 7: Update `engine/storyEngine.test.ts` — fix broken tests and add new ones**
  - File: `engine/storyEngine.test.ts`
  - Action:
    1. **Update `Weighted Outcome Resolution` describe block** (lines 175–250):
       - Update the `outcome` fixture object to use `outcomes: OutcomeBranch[]` shape
       - Change all `expect(result).toBe('good')` to `expect(result.id).toBe('a')` (or check `result.text`)
       - Change all `expect(result).toBe('bad')` to `expect(result.id).toBe('b')`
    2. **Update `statInfluence` test comment** (line 63): change comment from `delta = -20 * (1 - 4 * 0.1) = -20 * 0.6 = -12` to `delta = -20 + (4 * 2) = -12` — assertion value `88` stays the same
    3. **Remove the `triggers §203 (nourriture too low)` test** (lines 499–524) — the food GO threshold is removed in C.4
    4. **Add `Score Multipliers` describe block**:
       - Test: score multiplier applied when all conditions met
       - Test: score multiplier NOT applied when one condition unmet
       - Test: first matching rule wins (not all rules)
    5. **Add `Contextual Game Over` describe block**:
       - Test: contextual GO fires when gauge crosses threshold at that paragraph
       - Test: contextual GO does NOT fire at a different paragraph
       - Test: contextual GO takes priority over global GO (fires first, uses contextual `targetParagraphId`)
       - Test: contextual GO with `probability: 0.5` fires when `Math.random() < 0.5`, does NOT fire otherwise
    6. **Add `Conditional Branching` describe block**:
       - Test: player routes to `conditionalBranch.targetParagraphId` when roll < probability
       - Test: player routes to `choice.targetParagraphId` when roll >= probability
    7. **Add `Composite Game Over` describe block**:
       - Test: GO fires when all conditions met AND probability roll succeeds
       - Test: GO does NOT fire when one condition unmet
       - Test: GO does NOT fire when conditions met but probability roll fails
       - Test: `paragraphScope` restricts rule to specific paragraphs only
    8. **Update `lastOutcomeText` and `lastGaugeDeltas` tests**:
       - Test: `lastOutcomeText` is set after weighted outcome resolves
       - Test: `lastOutcomeText` is `null` after a choice with no weighted outcome
       - Test: `lastOutcomeText` is cleared to `null` at start of every `resolveChoice`
       - Test: `lastGaugeDeltas` reflects correct delta after choice with gauge effects
  - Notes: All new tests must use `createEngine(config, savedState)` pattern with mid-story state injection. All `Math.random` spies must be restored with `spy.mockRestore()` in the test.

- [ ] **Task 7b: Update `engine/persistence.ts` — lenient deserialization for new fields**
  - File: `engine/persistence.ts`
  - Action:
    1. Read `engine/persistence.ts` to understand the existing `isValidSavedState` (or equivalent) validation logic
    2. Locate the check that validates a saved state object before restoring it
    3. Make the check lenient for the two new fields: `lastOutcomeText` and `lastGaugeDeltas` — these fields should be treated as optional (default to `null` if absent in saved state). Old saves from v1.0 that lack these fields must not be rejected.
    4. If the validation checks an explicit list of required keys, add the two new keys with `null` defaults rather than making them required
  - Notes: This task is a guard against a migration failure: a user who played the game in v1.0 and reloads in v1.5 should not see "saved state invalid" error. The `isGameOver`/`isComplete`/`paragraphId` fields and gauge values are the true required fields — `lastOutcomeText` and `lastGaugeDeltas` are ephemeral display state. Task ordering: complete after Task 1 (types) so the type definitions are stable.

- [ ] **Task 8: Update `hooks/useStoryEngine.ts` — expose outcome text and deltas**
  - File: `hooks/useStoryEngine.ts`
  - Action: The hook's `return` statement currently returns `{ engineState, resolveChoice, applyDecay, resetEngine, setStats }`. The `lastOutcomeText` and `lastGaugeDeltas` are already in `engineState` (added in Task 1). No hook changes are strictly required — `StoryReader` can read them from `engineState.lastOutcomeText` and `engineState.lastGaugeDeltas`. However, add a `animKey` counter to force pill re-mount on every choice:
    ```typescript
    const [animKey, setAnimKey] = useState(0)
    // In resolveChoice callback, after commitState():
    setAnimKey(k => k + 1)
    ```
    Return `animKey` from the hook so `StoryReader` can pass it to `GaugeStrip`.
  - Notes: `commitState` already calls `setEngineState` which triggers re-render. The `animKey` is the only new state needed. `lastOutcomeText` and `lastGaugeDeltas` flow through `engineState`. **`applyDecay` does NOT call `setAnimKey`** — decay changes gauges silently with no pills (decay is a background tick, not a player choice). **`resetEngine` does NOT reset `animKey`** — the counter keeps incrementing across sessions; this is intentional (no pills on fresh game, no animation flash at start). React 19 batches the `setEngineState` + `setAnimKey` calls in `resolveChoice` into a single render — pills appear correctly on the first render without a two-render race.

- [ ] **Task 9: Create `components/ResultBlock.tsx` — new outcome text display**
  - File: `components/ResultBlock.tsx` (new file)
  - Action: **First read `components/ParagraphDisplay.tsx`** to get the exact `renderMarkdownLite` implementation to copy. Then create component:
    ```typescript
    'use client'
    // Inline copy of renderMarkdownLite from ParagraphDisplay.tsx (not worth a shared util for two usages)

    interface ResultBlockProps {
      text: string | null
    }

    export default function ResultBlock({ text }: ResultBlockProps) {
      if (!text) return null
      // Split on double newlines, render each paragraph
      // Wrap in a styled div: left border using --color-accent, background --color-surface
      // Label: small muted text "Résultat" or no label
    }
    ```
  - Notes: The component renders `null` when `text` is null — no conditional in the parent needed, just always render `<ResultBlock text={engineState.lastOutcomeText} />`. Use inline styles with CSS custom properties — no hardcoded colors.

- [ ] **Task 10: Add CSS animation to `app/globals.css`**
  - File: `app/globals.css`
  - Action: Add `@keyframes pill-fade` after the existing `:root` and `@theme` blocks:
    ```css
    @keyframes pill-fade {
      0% { opacity: 1; transform: translateY(0); }
      70% { opacity: 1; transform: translateY(-4px); }
      100% { opacity: 0; transform: translateY(-8px); }
    }
    ```
    Add a `.gauge-delta-pill` utility class:
    ```css
    .gauge-delta-pill {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7rem;
      font-weight: 700;
      white-space: nowrap;
      animation: pill-fade 2s ease forwards;
      pointer-events: none;
    }
    ```
  - Notes: The class uses `animation: pill-fade 2s ease forwards` — `forwards` keeps the element at `opacity: 0` after animation ends. React will remove it on next render when `lastGaugeDeltas` is reset to null.

- [ ] **Task 11: Update `components/GaugeStrip.tsx` — add delta pills overlay**
  - File: `components/GaugeStrip.tsx`
  - Action:
    1. Add props: `gaugeDeltas?: Record<string, number> | null` and `animKey?: number`
    2. Inside the gauge `<div>` map (per gauge), add a relative positioning wrapper
    3. For each gauge, if `gaugeDeltas` has a non-zero entry for this gauge ID, render a pill:
       ```tsx
       {gaugeDeltas && gaugeDeltas[gaugeDef.id] !== undefined && gaugeDeltas[gaugeDef.id] !== 0 && (
         <span
           key={animKey}
           className="gauge-delta-pill"
           style={{
             color: gaugeDeltas[gaugeDef.id] > 0 ? 'var(--color-accent)' : 'var(--color-danger)',
           }}
         >
           {gaugeDeltas[gaugeDef.id] > 0 ? '+' : ''}{Math.round(gaugeDeltas[gaugeDef.id])}
         </span>
       )}
       ```
    4. Make the outer gauge `<div>` `position: relative` to anchor the absolute pill
  - Notes: `key={animKey}` on the pill span forces React to unmount and remount it whenever `animKey` changes, restarting the CSS animation even for identical delta values. `var(--color-danger)` for negative, `var(--color-accent)` for positive.

- [ ] **Task 12: Update `components/StoryReader.tsx` — wire ResultBlock and delta props**
  - File: `components/StoryReader.tsx`
  - Action:
    1. Add import: `import ResultBlock from './ResultBlock'`
    2. Destructure `animKey` from `useStoryEngine` (added in Task 8)
    3. Pass to `GaugeStrip`: `gaugeDeltas={engineState.lastGaugeDeltas} animKey={animKey}`
    4. Render `<ResultBlock text={engineState.lastOutcomeText} />` between `<ParagraphDisplay>` and `<ChoiceCards>` in the main content area
    5. Apply the same changes to the Game Over/complete branch (the `return` at line 46) — pass `gaugeDeltas` to `GaugeStrip` there too
  - Notes: `ResultBlock` renders `null` when text is null, so no conditional wrapper needed.

- [ ] **Task 13: Update `public/stories/dub-camp.json` — Phase 1 & 2 data fixes**
  - File: `public/stories/dub-camp.json`
  - Action:
    **C.1 — Migrate A/B texts from `content` into `outcomes[].text`** for paragraphs s11, s15a, s31, s40a, s40d, s51, s60a, s61, sEVT1:
    - Remove "Résultat A: …" and "Résultat B: …" text blocks from `content`; keep only the shared intro text
    - Move each result text to the corresponding `outcome.text` field
    - Convert `goodEffects`/`badEffects` to `outcomes: [{id:'a', maxRisk:60, text:'...', effects:[...]}, {id:'b', maxRisk:100, text:'...', effects:[...]}]`
    - The exact `maxRisk` value for outcome `a` should reflect the 60% threshold for medium-risk scenarios; adjust per paragraph's intended feel

    **C.2 — Fix `statInfluence.multiplier`**: Change all occurrences of `"multiplier": 0.1` to `"multiplier": 2` throughout the file

    **C.3 — Add `statInfluence` to food gains**: On all choices that increase `nourriture` gauge (food items), add `"statInfluence": { "statId": "estomac", "multiplier": 3 }` to those `GaugeEffect` entries

    **C.4 — Remove food Game Over**: From the `nourriture` gauge definition, remove `"gameOverThreshold": 5`, `"gameOverCondition": "below"`, and `"gameOverParagraphId": "s203"`. Keep the `s203` paragraph intact (used by composite GO rule)

    **C.6 — Verify §50 penalty**: Check each choice in `s50`. If choices have `-10 energie` AND `s50` is in `decayNodes` (it is — decay = -7), total = -17. Per `story-format-spec.md` note: "§50 has a universal -10⚡ penalty in addition to normal decay" — this is intentional. Document it with a JSON comment-style key (e.g., ensure it matches the spec) — do NOT remove.

    **C.7 — Replace generic button text**: Find all single-choice paragraphs with generic text like `"Continuer"`, `"Retour au camp"`, `"Voir ce qui se passe"`. Replace with contextually immersive text. Examples: `"Tu rentres au camp, sourire aux lèvres"`, `"Tu te lèves et tu files vers les basses"`, `"Tu prends l'air quelques instants"`
  - Notes: The dub-camp.json file is large (~700+ lines). Make changes carefully to preserve all other structure. After editing, validate JSON syntax with: `node -e "JSON.parse(require('fs').readFileSync('public/stories/dub-camp.json','utf8')); console.log('JSON valid')"`. Then run `npx vitest run` to catch any validator errors.

- [ ] **Task 14: Update `public/stories/dub-camp.json` — Phase 3 data additions**
  - File: `public/stories/dub-camp.json`
  - Action:
    **C.5 — Add `conditionalBranch` at §40A/B for sEVT1**:
    - **First read `public/stories/dub-camp.json` and locate paragraphs `s40a`, `s40b`, and `s40c`** to understand their current structure and which choices lead where before adding conditionalBranch entries.
    - On choices in `s40a` and `s40b` that currently route unconditionally to `s40c` (or wherever they lead after the golden hour events):
    - Add `"conditionalBranch": { "probability": 0.33, "targetParagraphId": "sEVT1" }` to those choices
    - This gives a 33% chance of being routed to the bonus event sEVT1 instead of normal routing

    **Composite Game Over rule for alcool+nourriture**:
    - Add top-level `"compositeGameOverRules"` array:
      ```json
      "compositeGameOverRules": [
        {
          "conditions": [
            { "gaugeId": "alcool", "min": 60 },
            { "gaugeId": "nourriture", "max": 20 }
          ],
          "probability": 0.22,
          "targetParagraphId": "s203"
        }
      ]
      ```

    **Score multipliers**:
    - Add top-level `"scoreMultipliers"` array:
      ```json
      "scoreMultipliers": [
        {
          "conditions": [
            { "gaugeId": "alcool", "min": 20, "max": 55 },
            { "gaugeId": "fumette", "min": 20, "max": 55 }
          ],
          "multiplier": 1.4
        },
        {
          "conditions": [
            { "gaugeId": "alcool", "min": 75 }
          ],
          "multiplier": 0.5
        }
      ]
      ```
  - Notes: These additions require Tasks 1, 4, and 5 to be complete first (types and validator must support new fields).

- [ ] **Task 15: Update `docs/story-format-spec.md` — reflect all v1.5 changes**
  - File: `docs/story-format-spec.md`
  - Action:
    1. **Update `statInfluence` section**: Replace the formula `effectiveDelta = delta + (stats[statId] * multiplier)` description to clarify it correctly (this formula is now the actual engine formula after C.2 fix). Update example to use `multiplier: 2`.
    2. **Replace `WeightedOutcome` section**: Remove `goodEffects`/`badEffects`; document new `outcomes: OutcomeBranch[]` structure with the `OutcomeBranch` sub-interface; show JSON example with 2 outcomes and 3 outcomes; document the selection algorithm
    3. **Add `GaugeCondition` section** with field documentation
    4. **Add `ScoreMultiplierRule` section** — document `conditions[]` (AND logic) and `multiplier`; add JSON example
    5. **Add `ContextualGameOver` section** — document all fields including optional `probability`; add JSON example
    6. **Add `ConditionalBranch` section** — document as optional `Choice` field; add JSON example for the sEVT1 pattern
    7. **Add `CompositeGameOverRule` section** — document `paragraphScope` (optional), `conditions[]` (AND), `probability`; add JSON example
    8. **Update `Paragraph` interface** block to include `contextualGameOver?: ContextualGameOver[]`
    9. **Update `Choice` interface** block to include `conditionalBranch?: ConditionalBranch`
    10. **Update `StoryConfig` Quick Start** block to include `scoreMultipliers` and `compositeGameOverRules` as optional fields
    11. **Replace `Evaluation Order` section** with the new 14-step order (Steps 0–13; plus decay node order unchanged)
    12. **Update `GaugeDefinition` example** to remove `gameOverThreshold` from `nourriture`
  - Notes: Update the worked example story at the bottom to use the new `outcomes[]` format — it currently uses the old `goodEffects`/`badEffects` shape which must be migrated.

---

### Acceptance Criteria

- [ ] **AC 1 — Outcome text: only resolved result shown**
  Given a paragraph choice with a `weightedOutcome` containing 2 outcomes (text A and text B), when the player selects that choice and the engine resolves it, then ONLY the text of the rolled outcome appears in the `ResultBlock` below the paragraph content — not both texts

- [ ] **AC 2 — Outcome text: cleared on next navigation**
  Given the `ResultBlock` is displaying an outcome text, when the player selects any choice to advance to the next paragraph, then `ResultBlock` renders nothing on the new paragraph (regardless of whether the new paragraph has a weighted outcome)

- [ ] **AC 3 — Delta pills appear after choice with gauge effects**
  Given a choice applies `gaugeEffects: [{ gaugeId: 'energie', delta: -15 }]`, when the player selects it, then a pill `"-15"` (in danger color) appears above the ⚡ gauge bar and fades out via CSS animation within ~2 seconds

- [ ] **AC 4 — Delta pills reflect combined effects (choice + outcome)**
  Given a choice with `gaugeEffects: [{ gaugeId: 'kiff', delta: 10 }]` and a `weightedOutcome` that on good branch adds `{ gaugeId: 'kiff', delta: 8 }`, when the good outcome is rolled, then the pill shows the combined delta above the kiff gauge (sum of all kiff effects applied during that choice resolution)

- [ ] **AC 5 — `statInfluence` additive formula**
  Given a gauge effect `{ gaugeId: 'energie', delta: -20, statInfluence: { statId: 'endurance', multiplier: 2 } }` and `endurance: 4`, when applied, then the effective delta is `-20 + (4 × 2) = -12` — energie decreases by 12, not 20

- [ ] **AC 6 — Score multiplier scales kiff gain when conditions met**
  Given `scoreMultipliers: [{ conditions: [{ gaugeId: 'alcool', min: 20, max: 55 }, { gaugeId: 'fumette', min: 20, max: 55 }], multiplier: 1.4 }]`, and alcool=35 and fumette=30 (both in range), when a choice applies `kiff: +10`, then kiff increases by 14 (10 × 1.4)

- [ ] **AC 7 — Score multiplier NOT applied when one condition unmet**
  Given the same score multiplier rule, when alcool=35 but fumette=10 (fumette out of range), then a `kiff: +10` effect increases kiff by exactly 10 (unmodified)

- [ ] **AC 8 — Contextual Game Over triggers at the right paragraph**
  Given paragraph `sX` has `contextualGameOver: [{ gaugeId: 'energie', threshold: 20, condition: 'below', targetParagraphId: 'sGO' }]`, and a choice at `sX` drops `energie` to 15, when the player selects that choice, then `isGameOver: true` and `paragraphId: 'sGO'` result

- [ ] **AC 9 — Contextual Game Over does NOT fire at other paragraphs**
  Given the same contextual GO rule only on `sX`, when the player is at paragraph `sY` (which has no contextualGameOver) and drops energie to 15, then contextual GO does NOT fire (only global GO threshold applies)

- [ ] **AC 10 — Contextual Game Over takes priority over global GO**
  Given a paragraph with `contextualGameOver` targeting `sContextGO`, and a global gauge GO condition also triggered, when both fire simultaneously, then contextual GO wins — `paragraphId` is `sContextGO`, not the global GO paragraph

- [ ] **AC 11 — Conditional branch redirects when roll succeeds**
  Given a choice with `conditionalBranch: { probability: 0.33, targetParagraphId: 'sAlt' }` and `choice.targetParagraphId: 'sNormal'`, when `Math.random()` returns `0.20` (< 0.33), then `paragraphId` advances to `sAlt`

- [ ] **AC 12 — Normal advance when conditional branch roll fails**
  Same choice, when `Math.random()` returns `0.50` (≥ 0.33), then `paragraphId` advances to `sNormal`

- [ ] **AC 13 — Composite Game Over triggers on multi-gauge condition**
  Given `compositeGameOverRules: [{ conditions: [{ gaugeId: 'alcool', min: 60 }, { gaugeId: 'nourriture', max: 20 }], probability: 0.22, targetParagraphId: 's203' }]`, when alcool=65, nourriture=15, and `Math.random()` returns `0.10` (< 0.22), then `isGameOver: true` and `paragraphId: 's203'`

- [ ] **AC 14 — Composite GO does NOT trigger when one condition unmet**
  Same rule, when alcool=65 but nourriture=30 (above max: 20), then composite GO does NOT trigger regardless of random roll

- [ ] **AC 15 — Composite GO does NOT trigger when probability roll fails**
  Same rule, when alcool=65 and nourriture=15 (conditions met), but `Math.random()` returns `0.80` (≥ 0.22), then composite GO does NOT trigger

- [ ] **AC 16 — Nourriture false GO removed from dub-camp.json**
  Given the updated dub-camp.json with nourriture's `gameOverThreshold` removed, when nourriture reaches 0 through decay alone (with no composite GO conditions met), then NO Game Over is triggered

- [ ] **AC 17 — 3-outcome weighted resolution selects correct branch**
  Given a `weightedOutcome` with `outcomes: [{id:'a', maxRisk:30, text:'Amazing'}, {id:'b', maxRisk:70, text:'Decent'}, {id:'c', maxRisk:100, text:'Bad'}]` and risk in the 30–55 range (goodProbability = 0.6), when `Math.random()` returns `0.65` (≥ 0.6), then outcome `b` is selected (algorithm: `badZoneWidth = (1-0.6)/2 = 0.2`, `badIndex = 1 + Math.floor((0.65-0.6)/0.2) = 1 + 0 = 1`) — outcome `b`'s text "Decent" is displayed, NOT "Amazing" or "Bad"

- [ ] **AC 18 — Old `goodEffects`/`badEffects` JSON rejected by validator**
  Given a story JSON with `weightedOutcome: { gaugeId: 'x', statId: 'y', goodEffects: [], badEffects: [] }`, when `validateStoryConfig` is called, then `StoryValidationError` is thrown with a message referencing `outcomes`

- [ ] **AC 19 — Validator accepts absent optional new fields**
  Given a valid v1.0 story JSON that has NO `weightedOutcome` entries anywhere AND no `scoreMultipliers`, `compositeGameOverRules`, `contextualGameOver`, or `conditionalBranch` fields, when `validateStoryConfig` is called with the updated validator, then validation succeeds without errors. (Note: AC 18 and AC 19 are NOT contradictory — AC 18 covers stories that have `weightedOutcome` with the old shape; AC 19 covers stories that have no `weightedOutcome` at all. A v1.0 story WITH old-shape `weightedOutcome` would fail, as expected.)

- [ ] **AC 20 — `lastOutcomeText` null at start and after non-outcome choices**
  Given a fresh engine state, when a choice with no `weightedOutcome` is resolved, then `engineState.lastOutcomeText` is `null` in the resulting state

---

## Additional Context

### Dependencies

- **No new npm packages required** — no external library additions
- Task ordering: Tasks 1–7b (engine layer) must complete before Tasks 8–12 (UI layer)
- Task 13 (Phase 1 JSON data) can be started after Task 1 (types) is done — the engine will validate the updated JSON
- Task 14 (Phase 3 JSON data) depends on Task 5 (validator supports new fields) and Task 4 (engine supports new mechanics)
- Task 15 (spec doc) can be done last, after all implementations are verified

### Testing Strategy

**Engine unit tests (Vitest):**
- Run with `npx vitest` from project root
- All engine tests are in `engine/storyEngine.test.ts`
- Zero React/Next.js imports in test file
- `Math.random` mocked via `vi.spyOn(Math, 'random').mockReturnValue(n)` — always restore with `spy.mockRestore()`
- New tests follow the `createEngine(config, savedState)` pattern for mid-story setup

**Manual testing checklist after implementation:**
- [ ] Start a fresh game in dub-camp; navigate to s11 (the lake paragraph); make the choice; verify ONLY one outcome text appears in a distinct block (not both "Résultat A / Résultat B")
- [ ] Verify gauge bars animate smoothly and delta pills appear above the changed gauges after each choice
- [ ] Verify delta pills fade out after ~2s
- [ ] Verify `ResultBlock` is gone on the next paragraph
- [ ] Allocate max Endurance (4); navigate to an energy-costing choice; verify energy loss is reduced (additive formula)
- [ ] Verify sEVT1 is NOT always triggered from §40A/B — only roughly 1-in-3 times
- [ ] Verify the `nourriture` gauge can reach 0 without triggering a Game Over (food false GO removed)

### Notes

- `gameOverParagraphId` (audit A.2/B.4) is already implemented in v1.0 — skip
- GaugeStrip already has `transition: 'width 150ms ease'` on bar fill — this animates bar width changes; the delta pills are additive enhancement
- §50 double penalty (-10 choice + -7 decay = -17 total) is documented as intentional in `story-format-spec.md` — do NOT remove in C.6
- Keep `s203` paragraph in dub-camp.json even after removing nourriture's threshold — it is now the composite GO target for the alcool+nourriture combo
- **Design tradeoff — nourriture GO removal (C.4):** Removing the `gameOverThreshold: 5` from nourriture means food reaching 0 never directly kills the player. This is intentional: the original design uses food as an indirect danger that worsens weighted-outcome rolls (via `hungerModifier`) and triggers composite GO only when ALSO very drunk (alcool > 60% + nourriture < 20% + 22% probability roll). This is more nuanced than an instant death threshold, but means a player can survive at 0 food indefinitely if they avoid alcohol. Accept this tradeoff — it matches the original Dub Camp narrative design.
- `dub-camp-fixture.ts` uses TypeScript types directly — the TypeScript compiler enforces shape correctness at build time; `npm run dev` or `npx tsc` will catch any leftover `goodEffects`/`badEffects` references
- The `storyEngine.test.ts` `resolveOutcome` tests currently check `toBe('good')` / `toBe('bad')`. After Task 3, these must check `result.id` or `result.text` — simple one-line changes per test
- Pre-mortem risk: the score multiplier logic in `storyEngine.ts` is complex (must intercept before `applyGaugeEffects` writes to gauge). The cleanest approach is to pre-compute the score delta, apply multiplier, then build a modified effects list before calling `applyGaugeEffects` — avoid trying to post-process after clamping
