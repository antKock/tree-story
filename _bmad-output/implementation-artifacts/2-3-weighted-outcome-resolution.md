# Story 2.3: Weighted Outcome Resolution

Status: ready-for-dev

## Story

As a developer,
I want `engine/weightedOutcome.ts` to resolve probabilistic outcomes using the risk formula from the story config,
so that tension moments produce a good or bad result with probabilities that correctly reflect the player's gauge state and stats — invisibly.

## Acceptance Criteria

1. `resolveOutcome(outcome, gauges, stats, config)` computes `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier`
2. The hunger modifier is: `+0` if Nourriture > 50, `+10` if 25–50, `+25` if < 25
3. Maps Risk to probability: `< 30 → 90% good`, `30–55 → 60%`, `55–75 → 40%`, `> 75 → 20%`
4. Calls `Math.random()` exactly once and returns `'good'` or `'bad'`
5. No probability values, risk scores, or random numbers are ever exposed outside this module
6. `engine/weightedOutcome.ts` has zero imports from `components/`, `hooks/`, or `app/`

## Tasks / Subtasks

- [ ] Create `engine/weightedOutcome.ts` (AC: 6)
  - [ ] Import from `engine/types.ts` only
  - [ ] Zero imports from `components/`, `hooks/`, or `app/`

- [ ] Implement `resolveOutcome` (AC: 1–5)
  - [ ] Signature: `resolveOutcome(outcome: WeightedOutcome, gauges: Record<string, number>, stats: Record<string, number>, config: StoryConfig): 'good' | 'bad'`
  - [ ] Extract `gaugeLevel = gauges[outcome.gaugeId]`
  - [ ] Extract `statValue = stats[outcome.statId]`
  - [ ] Compute hunger modifier:
    ```typescript
    const nourriture = gauges['nourriture'] ?? 50
    const hungerModifier = nourriture > 50 ? 0 : nourriture >= 25 ? 10 : 25
    ```
  - [ ] Compute risk: `const risk = gaugeLevel - (statValue * 15) + hungerModifier`
  - [ ] Map risk to good probability:
    ```typescript
    const goodProbability = risk < 30 ? 0.9 : risk <= 55 ? 0.6 : risk <= 75 ? 0.4 : 0.2
    ```
  - [ ] Call `Math.random()` exactly once: `const roll = Math.random()`
  - [ ] Return: `roll < goodProbability ? 'good' : 'bad'`
  - [ ] Return type is `'good' | 'bad'` — never expose `risk`, `goodProbability`, or `roll`

- [ ] Apply good/bad effects to gauges (AC: 1)
  - [ ] Note: `resolveOutcome` returns a string decision — the CALLER (`storyEngine.ts`) applies the effects using `gaugeSystem.applyGaugeEffects()`
  - [ ] This function's sole responsibility is the probability resolution — not effect application
  - [ ] Confirm: `outcome.goodEffects` and `outcome.badEffects` are arrays of `GaugeEffect` — applied by storyEngine

- [ ] Handle edge cases
  - [ ] If `outcome.gaugeId` not found in `gauges`: treat as `gaugeLevel = 0` (worst case risk calculation)
  - [ ] If `outcome.statId` not found in `stats`: treat as `statValue = 0` (no stat benefit)
  - [ ] Risk can be negative (high stat value, low gauge) — this is fine, it maps to 90% (< 30 branch)

## Dev Notes

- **Risk formula origin:** The formula `Risk = gaugeLevel − (stat × 15) + hungerModifier` is the Dub Camp game mechanic. In Dub Camp, the relevant gauge is typically `alcool` for drinking-related outcomes, and the relevant stat is `resistanceAlcool`. A player with `resistanceAlcool = 4` subtracts 60 from the gauge level — so even at Alcool 80, risk = 80 - 60 = 20, which maps to 90% good.
- **`Math.random()` exactly once:** The spec says exactly once per call. No retry loops, no multiple rolls.
- **For testing (Story 2.6):** `Math.random` will need to be mocked in tests to test both branches deterministically. The test suite will use `vi.spyOn(Math, 'random')` to control the roll.
- **Nourriture gauge ID:** In the hunger modifier calculation, look up the nourriture gauge by its `id` from the story config. In Dub Camp this is `"nourriture"`. To avoid hardcoding, you could pass the nourriture gauge ID as a config lookup, but since the hunger modifier is a Dub Camp-specific mechanic encoded in the story format spec, the `nourriture` id is the canonical lookup key.
- **Probability is invisible to players (NFR10 implies):** These probability values must never reach any UI layer. Only `resolveOutcome()` knows what probabilities were involved.

### Project Structure Notes

Files to create:
- `engine/weightedOutcome.ts` (new)

Prerequisites:
- Story 1.2 (`engine/types.ts` with `WeightedOutcome`, `GaugeEffect` types)
- Story 2.2 (`lib/utils.ts` with `clamp()` — not directly needed here but `storyEngine.ts` will use it)

### References

- [Source: architecture.md#Cross-Cutting-Concerns] — "Weighted outcome resolution: Engine — risk formula uses gauge levels + stat values + hunger modifier"
- [Source: epics.md#Story-2.3] — Full risk formula, probability table, hunger modifier values
- [Source: project-context.md#Engine-isolation] — "engine/ has ZERO imports from components/, hooks/, app/, or lib/"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
