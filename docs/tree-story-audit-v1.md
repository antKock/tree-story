# Tree Story — Spec, Engine & Dub Camp Config Audit

This document synthesizes the full analysis of the Tree Story JSON format, the engine that consumes it, and the "Dub Camp" story configuration. Recommendations are written generically so they apply to any story using this format.

---

## 1. Identified Bugs

### Bug 1 — Player sees all possible outcomes instead of just the resolved one

**Symptom:** When a paragraph has a `weightedOutcome`, the player reads the text for every possible result ("Result A… / Result B…") before the roll is even resolved. Only the mechanical effects (gauge deltas) change behind the scenes.

**Root cause:** The spec does not support narrative text inside `WeightedOutcome`. Each outcome's text is hardcoded into the paragraph's `content` field. The engine displays the full `content`, then resolves the roll silently.

**Impact:** Breaks immersion. The player knows there are two possible results but can't tell which one actually happened. The suspense of the roll is destroyed.

### Bug 2 — No visual feedback for applied effects

**Symptom:** When a choice applies `gaugeEffects` or a `weightedOutcome` is resolved, the player sees no indication of what changed. Gauge bars update silently — no animation, no recap like "+15 ⚡" or "-10 🍔".

**Root cause:** The spec does not specify any visual feedback behavior. The engine updates gauges without notification.

**Impact:** The player doesn't understand the consequences of their choices, making the gauge system opaque and strategic decisions impossible to calibrate.

---

## 2. Spec Limitations

### 2.1 — No conditional text per outcome

`WeightedOutcome` only contains `GaugeEffect[]` for good/bad. There is no field for narrative text associated with each result.

### 2.2 — Locked to 2 outcomes (good/bad)

The current structure enforces a good/bad binary. Some narrative situations require 3+ possible results (amazing / decent / failed).

### 2.3 — No combinatorial score multiplier

The story design includes a score multiplier based on the combination of multiple gauges (e.g., alcohol + weed both in a "sweet zone" → ×1.4 on score gains). The spec has no concept of a conditional multi-gauge multiplier. All effects marked "depending on your state" in the story are currently ignored.

### 2.4 — Game Over thresholds are global only

The spec only defines a single `gameOverThreshold` per gauge, applied everywhere. The story design has different Game Over thresholds depending on the paragraph (e.g., energy < 20% early in the story vs < 8% late at night). This cannot be expressed currently.

### 2.5 — No multi-gauge conditional Game Over

Some Game Overs depend on a combination of two gauges + a probability (e.g., alcohol > 60% AND food < 20% → 22% chance of GO). The spec does not support composite conditions.

### 2.6 — No random branching (optional events)

Some paragraphs should only appear with a certain probability (e.g., 1-in-3 chance of encountering a bonus event). The spec has no mechanism for a paragraph that can be "skipped" randomly. The current workaround (always routing through the paragraph but varying effects) makes the player read the event text every time, even when "nothing happens."

### 2.7 — `gameOverParagraphId` not formalized

The JSON uses a `gameOverParagraphId` field on `GaugeDefinition` to redirect to the appropriate narrative Game Over paragraph. This field does not exist in the spec — it is potentially ignored by the engine.

### 2.8 — No visual feedback specification

The spec does not describe how the engine should display the effects of choices to the player (animations, toasts, popups, etc.).

---

## 3. Recommendations

### Category A — Spec Evolution

#### A.1 — Replace good/bad with an outcomes array (PRIORITY 1)

Replace the `goodEffects`/`badEffects` structure with a generic `outcomes` array:

```typescript
interface WeightedOutcome {
  gaugeId: string
  statId: string
  outcomes: OutcomeBranch[]
}

interface OutcomeBranch {
  id: string              // "a", "b", "c"...
  label?: string          // debug / editor tooling
  maxRisk: number         // risk threshold (engine iterates in order, picks first match)
  text: string            // narrative text displayed if this outcome is rolled
  effects: GaugeEffect[]  // mechanical effects
}
```

How it works: the engine computes the risk score, rolls `Math.random()`, and iterates through `outcomes` to find the result. The paragraph's `content` only contains the intro text (shared across all outcomes). The outcome-specific text lives in `outcome.text`.

**Example with 2 outcomes:**

```json
"weightedOutcome": {
  "gaugeId": "energie",
  "statId": "endurance",
  "outcomes": [
    {
      "id": "a",
      "maxRisk": 55,
      "text": "You find a perfect spot mid-crowd. Close enough to feel it, far enough to breathe. An hour of pure bliss.",
      "effects": [
        { "gaugeId": "energie", "delta": -15, "statInfluence": { "statId": "endurance", "multiplier": 2 } },
        { "gaugeId": "kiff", "delta": 18 }
      ]
    },
    {
      "id": "b",
      "maxRisk": 100,
      "text": "You're stuck, it's hot, you can barely move. Still good, but you come out drained.",
      "effects": [
        { "gaugeId": "energie", "delta": -30, "statInfluence": { "statId": "endurance", "multiplier": 2 } },
        { "gaugeId": "kiff", "delta": 11 }
      ]
    }
  ]
}
```

**Example with 3 outcomes:**

```json
"outcomes": [
  { "id": "a", "maxRisk": 30,  "text": "Incredible. A magical moment.",         "effects": [...] },
  { "id": "b", "maxRisk": 70,  "text": "Decent, nothing special.",               "effects": [...] },
  { "id": "c", "maxRisk": 100, "text": "The sound is bad, you leave quickly.",    "effects": [...] }
]
```

#### A.2 — Add `gameOverParagraphId` to `GaugeDefinition`

Formalize the field already used in the JSON:

```typescript
interface GaugeDefinition {
  // ... existing fields ...
  gameOverParagraphId?: string  // narrative paragraph shown when this gauge triggers GO
}
```

#### A.3 — Add a combinatorial score multiplier system

New top-level field `scoreMultipliers`:

```typescript
interface ScoreMultiplierRule {
  conditions: GaugeCondition[]  // all must be true (AND)
  multiplier: number            // applied to every delta on the score gauge
}

interface GaugeCondition {
  gaugeId: string
  min?: number
  max?: number
}
```

Example:
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

The engine applies the first matching rule (in array order) to every `GaugeEffect` targeting the `isScore: true` gauge.

#### A.4 — Add contextual Game Over per paragraph

New optional field on `Choice` or `Paragraph`:

```typescript
interface ContextualGameOver {
  gaugeId: string
  threshold: number
  condition: "above" | "below"
  probability?: number           // 0.0–1.0, default 1.0
  targetParagraphId: string      // narrative GO paragraph
}
```

Example:
```json
"contextualGameOver": [
  { "gaugeId": "energie", "threshold": 20, "condition": "below", "targetParagraphId": "s204" }
]
```

#### A.5 — Add conditional random branching

New optional field on `Choice`:

```typescript
interface ConditionalBranch {
  probability: number            // 0.0–1.0
  targetParagraphId: string      // alternate paragraph if the roll succeeds
}
```

If the roll succeeds, the player is redirected to `targetParagraphId` instead of `choice.targetParagraphId`. Enables optional random events without forcing the player through them.

#### A.6 — Add multi-gauge composite Game Over rules

New top-level field `compositeGameOverRules`:

```typescript
interface CompositeGameOverRule {
  paragraphScope?: string[]       // paragraphs where the rule is evaluated (all if absent)
  conditions: GaugeCondition[]    // AND — all must be true
  probability?: number            // 0.0–1.0
  targetParagraphId: string
}
```

#### A.7 — Specify visual effect feedback

Add a normative section to the spec describing required engine behavior when applying effects:

- After resolving a choice, the engine MUST display a visual summary of gauge changes (e.g., "+15 ⚡", "-10 🍔").
- Gauge bars MUST animate transitions.
- If an outcome was rolled, the outcome's text MUST be displayed after the paragraph's content, visually distinct (e.g., boxed, different color).
- Critical negative effects (approaching a GO threshold) MUST be visually flagged (flash, danger color).

---

### Category B — Engine Improvements

| # | Improvement | Detail |
|---|---|---|
| B.1 | **Display effect feedback** | After each choice, show applied gauge deltas ("+15 ⚡", "-10 🍔") with animation. |
| B.2 | **Only display the resolved outcome's text** | When a `weightedOutcome` is resolved, display `outcome.text` for the rolled result — not the others. The paragraph `content` is the intro text; the outcome is the result text. |
| B.3 | **Implement `scoreMultipliers`** | Evaluate multiplier rules on every `GaugeEffect` targeting the score gauge. |
| B.4 | **Implement `gameOverParagraphId`** | When a gauge triggers GO, redirect to the corresponding narrative paragraph. |
| B.5 | **Implement contextual Game Over** | Evaluate `contextualGameOver` on the current paragraph after applying effects, before global GO checks. |
| B.6 | **Implement conditional branching** | Evaluate `conditionalBranch` on choices — if the roll succeeds, redirect to the alternate paragraph. |
| B.7 | **Animate gauge bars** | CSS transitions on width changes, red flash on danger, green flash on gain. |

**Updated evaluation order (replaces the "Evaluation Order" section in the spec):**

1. Apply `choice.gaugeEffects`
2. Resolve `choice.weightedOutcome` if present → apply `effects` from the rolled outcome
3. Apply `scoreMultipliers` to any delta targeting the score gauge
4. Apply `choice.inventoryAdd` / `inventoryRemove`
5. Clamp all gauges to [0, 100]
6. Evaluate `contextualGameOver` on the current paragraph — if triggered: GO, STOP
7. Evaluate global Game Over (gauge `gameOverThreshold` values) — if triggered: GO to `gameOverParagraphId`, STOP
8. Evaluate `compositeGameOverRules` — if triggered: GO, STOP
9. Evaluate `conditionalBranch` — if roll succeeds: redirect to alternate paragraph
10. Otherwise: advance to `choice.targetParagraphId`
11. Evaluate act transition
12. Display visual effect feedback
13. Persist state

At **decay nodes**, after choice resolution:
1. Apply all `decayRules` (including probabilistic ones)
2. Clamp, evaluate GO, persist

---

### Category C — Story-to-JSON Translation Fixes (Dub Camp)

These corrections apply to `dub-camp.json` specifically, but illustrate patterns to check for any new story.

| # | Fix | Detail |
|---|---|---|
| C.1 | **Extract A/B texts from `content`** | Once the spec supports `outcomes[].text` (A.1), move "Result A / Result B" texts from `content` into the `outcomes`. Keep only the shared intro text in `content`. Affected paragraphs: s11, s15a, s31, s40a, s40d, s51, s60a, s61, sEVT1. |
| C.2 | **Fix `statInfluence.multiplier`** | Currently `0.1` everywhere (negligible impact: Endurance 4 → 0.4 pt reduction). Change to `2` or `3` for meaningful impact (Endurance 4 → 8-12 pt reduction on a -28 cost). |
| C.3 | **Add `statInfluence` to food gains** | The story mentions "(Stomach bonus)" on all meals. Add `{ "statId": "estomac", "multiplier": 3 }` to food `gaugeEffects` so the Stomach stat amplifies food gains. |
| C.4 | **Remove the food < 5 Game Over** | The story does not have a direct GO from low food. Low food worsens roll outcomes (via `hungerModifier`) and can trigger the alcohol+food combo GO. The static `gameOverThreshold: 5` on the food gauge was invented — remove it. |
| C.5 | **Fix §EVT1 routing** | Currently the player always passes through sEVT1. §40A/B should point to §40C with a `conditionalBranch` at 33% toward sEVT1 (requires A.5). |
| C.6 | **Check the §50 double penalty** | The JSON applies -10 energy (heat) on all §50 choices, AND §50 is a decay node (-7 energy from decay). The player takes -17 minimum. Verify whether this is intentional or whether the heat penalty should replace normal decay at this node. |
| C.7 | **Make single-choice buttons narrative** | Buttons like "Return to camp", "See what happens next" on single-choice paragraphs are generic. Replace with immersive context-specific text ("You walk out smiling", "You head back toward the bass"). |

---

## 4. Recommended Prioritization

**Phase 1 — Fix the bugs (immediate player experience impact):**
1. A.1 + B.2: Outcomes system with text → only display the resolved result
2. B.1 + B.7: Visual feedback and gauge animations
3. C.1: Migrate A/B texts into outcomes
4. C.2 + C.3: Fix multipliers so stats have real impact

**Phase 2 — Story fidelity:**
5. A.3 + B.3: Combinatorial score multipliers
6. A.2 + B.4: Formalize `gameOverParagraphId`
7. C.4 + C.5: Fix routing and false Game Over

**Phase 3 — Advanced mechanics:**
8. A.4 + A.6 + B.5: Contextual and composite Game Over
9. A.5 + B.6: Conditional random branching
10. C.6 + C.7: Polish (double penalty, narrative buttons)
