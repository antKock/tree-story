# Story 2.2: Gauge System — Arithmetic, Clamping & Decay

Status: ready-for-dev

## Story

As a developer,
I want `engine/gaugeSystem.ts` to implement all gauge arithmetic including bounds enforcement and natural decay,
so that gauge values always stay within [0, 100] and decay fires correctly at story-defined nodes.

## Acceptance Criteria

1. `applyGaugeEffects(gauges, effects, stats, config)` applies each `GaugeEffect` delta to the correct gauge keyed by `GaugeDefinition.id`, applies stat influence to gauge arithmetic as defined by story config, clamps all values to [0, 100] immediately, returns a new `Record<string, number>` without mutating input
2. `applyDecay(gauges, decayRules, stats, config)` applies each `DecayRule` delta, applies Nourriture decay reduction formula `max(3, 10 − Estomac × 1.5)`, evaluates the passive 6% risk of `-8⚡` using `Math.random()`, clamps all values to [0, 100], returns a new state object without mutation
3. `clamp(value, 0, 100)` in `lib/utils.ts` is always the enforcement mechanism — no inline bounds checks elsewhere in the codebase

## Tasks / Subtasks

- [ ] Create `lib/utils.ts` with `clamp()` utility (AC: 3)
  - [ ] Export `function clamp(value: number, min: number, max: number): number`
  - [ ] Implementation: `Math.min(max, Math.max(min, value))`
  - [ ] This is the single place where gauge bounds are enforced — all gauge arithmetic goes through this

- [ ] Create `engine/gaugeSystem.ts` (AC: 1, 2)
  - [ ] Import from `engine/types.ts` and `lib/utils.ts` only
  - [ ] Zero imports from `components/`, `hooks/`, or `app/`

- [ ] Implement `applyGaugeEffects` (AC: 1)
  - [ ] Signature: `applyGaugeEffects(gauges: Record<string, number>, effects: GaugeEffect[], stats: Record<string, number>, config: StoryConfig): Record<string, number>`
  - [ ] Create a shallow copy of `gauges` — never mutate the input object
  - [ ] For each `GaugeEffect`:
    - Find the gauge by `effect.gaugeId`
    - If `effect.statInfluence` exists: multiply delta by `(1 - stats[statInfluence.statId] * statInfluence.multiplier)` or similar formula from config — apply stat-reduced delta
    - If no stat influence: apply delta directly
    - Clamp result with `clamp(value, 0, 100)`
  - [ ] Return the new gauges object
  - [ ] Handle missing gauge IDs gracefully (skip or warn, never throw)

- [ ] Implement `applyDecay` (AC: 2)
  - [ ] Signature: `applyDecay(gauges: Record<string, number>, decayRules: DecayRule[], stats: Record<string, number>, config: StoryConfig): Record<string, number>`
  - [ ] Create a shallow copy of `gauges`
  - [ ] For each `DecayRule`:
    - If rule has `statReductionId` and `statReductionFormula`:
      - Evaluate formula string OR use the encoded formula for Nourriture: `amount = -Math.max(3, 10 - stats[statReductionId] * 1.5)` (negative because decay)
      - This is the Estomac stat reduction: higher Estomac stat = less Nourriture decay
    - For the passive ⚡ risk (6% chance of `-8` energie): check `rule.isPassiveRisk` flag (or equivalent encoding), then `if (Math.random() < 0.06) { apply -8 to energie }`
    - Apply clamped decay: `clamp(gauges[rule.gaugeId] + delta, 0, 100)`
  - [ ] Return the new gauges object without mutating input

- [ ] Unit test setup for gauge system (no test file required in this story, covered in Story 2.6)
  - [ ] Verify manually that: applying `+200` to a gauge at 100 clamps to 100
  - [ ] Verify: applying `-200` to a gauge at 0 clamps to 0
  - [ ] Verify: Nourriture with Estomac=4: decay = `max(3, 10 - 4*1.5) = max(3, 4) = 4`
  - [ ] Verify: Nourriture with Estomac=0: decay = `max(3, 10 - 0) = 10`

## Dev Notes

- **Immutability is critical:** Every function must return a NEW object — never mutate the input `gauges` record. The engine depends on this for correct state tracking and React re-render triggering.
- **`clamp` from `lib/utils.ts` — no exceptions:** Even if it seems obvious to write `Math.min(100, Math.max(0, value))` inline, always import and call `clamp()` from `lib/utils.ts`. This makes it easy to audit gauge clamping.
- **Nourriture decay formula:** The `DecayRule` for Nourriture in Dub Camp uses the formula `max(3, 10 - Estomac * 1.5)`. With Estomac=0: `-10`. With Estomac=4: `-max(3, 4) = -4`. With Estomac=6: `-max(3, 1) = -3` (floor at 3). The `statReductionFormula` field in `DecayRule` should encode this or it can be a special case.
- **Passive ⚡ risk encoding:** The 6% passive energie risk is a special decay rule. It's probabilistic (uses `Math.random()`). In `DecayRule`, you may encode this as `{ gaugeId: "energie", amount: -8, passiveRiskChance: 0.06 }`. The exact field name should match `engine/types.ts`.
- **Stat influence on `GaugeEffect`:** The `statInfluence` field on `GaugeEffect` is for choice-based stat interactions (e.g., Endurance reduces energy cost of a choice). The formula is story-defined — check `GaugeEffect.statInfluence.multiplier` for the coefficient.
- **§50 universal heat penalty:** A `-10⚡` special penalty at §50 is in addition to normal decay. This is likely encoded as a paragraph-specific `GaugeEffect` on the choice (or as an extra `DecayRule` specifically for §50). The validator and engine will handle its application; this story just needs the arithmetic to work correctly.

### Project Structure Notes

Files to create:
- `lib/utils.ts` (new — `clamp()` utility)
- `engine/gaugeSystem.ts` (new)

Prerequisites:
- Story 1.2 (`engine/types.ts` with `GaugeEffect`, `DecayRule`, `StoryConfig` types)

### References

- [Source: architecture.md#Communication-Patterns] — "Gauge Updates — Immutable + Immediate Clamping: Engine always returns new state objects, never mutates in place. Clamp immediately."
- [Source: architecture.md#Enforcement-Guidelines] — "Clamp gauge values immediately at calculation. Use `GaugeDefinition.id` as record keys."
- [Source: epics.md#Story-2.2] — Full acceptance criteria including Dub Camp decay formulas
- [Source: project-context.md#Gauge-rules] — "Clamp immediately — never deferred"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
