# Tree Story — JSON Story Format Specification v1

## Purpose

This document defines every field of the story JSON schema used by the Tree Story engine. Given this specification and a structured story source document, an LLM can produce a valid, complete `dub-camp.json` (or any story JSON) without asking clarifying questions.

## Quick Start

A story is a single JSON file with this top-level structure:

```json
{
  "id": "my-story",
  "version": 1,
  "meta": { ... },
  "statPointBudget": 8,
  "stats": [ ... ],
  "gauges": [ ... ],
  "acts": [ ... ],
  "decayNodes": [ ... ],
  "decayRules": [ ... ],
  "paragraphs": { ... },
  "endStateTiers": [ ... ]
}
```

Store the file at `public/stories/<id>.json`. The engine loads it on startup, validates it, and rejects invalid configs before the player UI ever loads.

---

## Top-Level Fields

### `id`
- **Type:** `string`
- **Required:** yes
- **Description:** Machine-readable story identifier. Use kebab-case. Must be unique if multiple stories are loaded.
- **Example:** `"dub-camp"`

### `version`
- **Type:** `number`
- **Required:** yes
- **Description:** Schema version. Currently always `1`.
- **Example:** `1`

### `meta`
- **Type:** `StoryMeta` object
- **Required:** yes
- **Description:** Human-readable story metadata. See [StoryMeta](#storymeta) below.

### `statPointBudget`
- **Type:** `number`
- **Required:** yes
- **Description:** Total points the player distributes across stats during character creation. Dub Camp value: `8`.
- **Example:** `8`

### `stats`
- **Type:** `StatDefinition[]`
- **Required:** yes
- **Description:** Player character stats. Each stat is allocated during character creation. See [StatDefinition](#statdefinition).

### `gauges`
- **Type:** `GaugeDefinition[]`
- **Required:** yes
- **Description:** Story gauges tracked throughout play (energy, alcohol, score, etc.). See [GaugeDefinition](#gaugedefinition).

### `acts`
- **Type:** `ActDefinition[]`
- **Required:** yes
- **Description:** Story acts, each with theme overrides applied when the player reaches a trigger paragraph. See [ActDefinition](#actdefinition).

### `decayNodes`
- **Type:** `string[]`
- **Required:** yes
- **Description:** Array of paragraph IDs at which natural gauge decay fires. Decay applies AFTER choice effects at the same node — never before.
- **Example:** `["s20", "s40", "s50", "s60", "s70"]`

### `decayRules`
- **Type:** `DecayRule[]`
- **Required:** yes
- **Description:** Per-gauge decay amounts applied at every decay node. See [DecayRule](#decayrule).

### `paragraphs`
- **Type:** `Record<string, Paragraph>`
- **Required:** yes
- **Description:** All story paragraphs keyed by their ID. Every `choice.targetParagraphId` must reference an existing key here. See [Paragraph](#paragraph).

### `endStateTiers`
- **Type:** `EndStateTier[]`
- **Required:** yes
- **Description:** Score-to-outcome mapping. At story completion, the player's score gauge value is matched against these tiers to select the narrative outcome. See [EndStateTier](#endstatetier).

---

## StoryMeta

```typescript
interface StoryMeta {
  title: string
  author: string
  version: string
  description?: string
  exampleProfiles: ExampleProfile[]
}
```

### `title`
- **Type:** `string`, required
- **Example:** `"Dub Camp"`

### `author`
- **Type:** `string`, required
- **Example:** `"Anthony"`

### `version`
- **Type:** `string`, required — human-readable version label
- **Example:** `"v0.8"`

### `description`
- **Type:** `string`, optional
- **Example:** `"Une soirée dont vous êtes le héros"`

### `exampleProfiles`
- **Type:** `ExampleProfile[]`, required
- **Description:** Example character builds displayed on the profile creation screen to help players understand the stat allocation.

#### ExampleProfile

```typescript
interface ExampleProfile {
  name: string
  description: string
  stats: Record<string, number>
}
```

- `name`: Display name of the profile — `"Le Bastien"`
- `description`: Short flavour label — `"fêtard endurant"`
- `stats`: Map of `statId → allocated value`. Keys must match `StatDefinition.id` values.

Dub Camp example profiles:
```json
[
  {
    "name": "Le Bastien",
    "description": "fêtard endurant",
    "stats": { "endurance": 4, "estomac": 0, "resistanceAlcool": 2, "resistanceFumette": 2 }
  },
  {
    "name": "Le Brian",
    "description": "vieux routard",
    "stats": { "endurance": 1, "estomac": 1, "resistanceAlcool": 3, "resistanceFumette": 3 }
  },
  {
    "name": "L'équilibré",
    "description": "premier festival",
    "stats": { "endurance": 2, "estomac": 2, "resistanceAlcool": 2, "resistanceFumette": 2 }
  }
]
```

---

## StatDefinition

```typescript
interface StatDefinition {
  id: string
  name: string
  description?: string
  maxPerStat: number
}
```

### `id`
- **Type:** `string`, required — camelCase, used as the key in `EngineState.stats` and in gauge effect formulas
- **Example:** `"endurance"`, `"resistanceAlcool"`

### `name`
- **Type:** `string`, required — display label shown during character creation
- **Example:** `"Endurance"`, `"Résistance alcool"`

### `description`
- **Type:** `string`, optional — explains what the stat affects
- **Example:** `"Chaque activité te coûte moins d'énergie"`

### `maxPerStat`
- **Type:** `number`, required — ceiling for a single stat allocation during character creation
- **Example:** `4`

Dub Camp stat definitions:
```json
[
  { "id": "endurance", "name": "Endurance", "description": "Chaque activité te coûte moins d'énergie", "maxPerStat": 4 },
  { "id": "estomac", "name": "Estomac", "description": "Tu as moins faim, et manger te remonte plus", "maxPerStat": 4 },
  { "id": "resistanceAlcool", "name": "Résistance alcool", "description": "Tu supportes plus avant que l'alcool te joue des tours", "maxPerStat": 4 },
  { "id": "resistanceFumette", "name": "Résistance fumette", "description": "Idem pour la fumette", "maxPerStat": 4 }
]
```

---

## GaugeDefinition

```typescript
interface GaugeDefinition {
  id: string
  name: string
  icon: string
  initialValue: number
  isScore: boolean
  isHidden: boolean
  gameOverThreshold?: number
  gameOverCondition?: 'above' | 'below'
}
```

### `id`
- **Type:** `string`, required — camelCase, key used in `EngineState.gauges`
- **Example:** `"energie"`, `"kiff"`

### `name`
- **Type:** `string`, required — display label
- **Example:** `"Énergie"`, `"Kiff"`

### `icon`
- **Type:** `string`, required — a single emoji rendered above the gauge bar in the UI
- **Example:** `"⚡"`, `"🎉"`

### `initialValue`
- **Type:** `number`, required — gauge value at the start of a fresh session [0–100]
- **Example:** `100` for Énergie, `0` for Alcool, `50` for Nourriture

### `isScore`
- **Type:** `boolean`, required — marks the score gauge. `true` for exactly one gauge (Kiff). Score value accumulates via `GaugeEffect` deltas and is revealed only at story end or Game Over.
- **Example:** `true` for Kiff, `false` for all others

### `isHidden`
- **Type:** `boolean`, required — when `true`, the gauge is excluded from the GaugeStrip display during play but shown in the CharacterSheet. The score gauge must have `isHidden: true`.
- **Example:** `true` for Kiff

### `gameOverThreshold`
- **Type:** `number`, optional — numeric boundary that triggers Game Over when crossed
- **Example:** `10` (trigger when Énergie < 10)

### `gameOverCondition`
- **Type:** `'above' | 'below'`, optional — direction of the threshold check
  - `'below'`: Game Over when `gaugeValue < gameOverThreshold` (e.g. Énergie runs out)
  - `'above'`: Game Over when `gaugeValue > gameOverThreshold` (e.g. Alcool overdose)
- **Example:** `"below"` for Énergie, `"above"` for Alcool

Dub Camp gauge definitions:
```json
[
  { "id": "energie", "name": "Énergie", "icon": "⚡", "initialValue": 100, "isScore": false, "isHidden": false, "gameOverThreshold": 10, "gameOverCondition": "below" },
  { "id": "alcool", "name": "Alcool", "icon": "🍺", "initialValue": 0, "isScore": false, "isHidden": false, "gameOverThreshold": 85, "gameOverCondition": "above" },
  { "id": "fumette", "name": "Fumette", "icon": "🌿", "initialValue": 0, "isScore": false, "isHidden": false },
  { "id": "nourriture", "name": "Nourriture", "icon": "🍔", "initialValue": 50, "isScore": false, "isHidden": false },
  { "id": "kiff", "name": "Kiff", "icon": "🎉", "initialValue": 0, "isScore": true, "isHidden": true }
]
```

---

## ActDefinition

```typescript
interface ActDefinition {
  id: string
  name: string
  paragraphIds: string[]
  theme: Record<string, string>
}
```

### `id`
- **Type:** `string`, required — camelCase act identifier
- **Example:** `"afternoon"`, `"goldenHour"`

### `name`
- **Type:** `string`, required — display label
- **Example:** `"Afternoon"`, `"Golden hour"`

### `paragraphIds`
- **Type:** `string[]`, required — when the player reaches any paragraph in this list, the act transitions and the `theme` is applied. Acts are evaluated in config order; once an act is activated it remains until a later act triggers.
- **Example:** `["s10"]` (transitioning into Afternoon when paragraph s10 is reached)

### `theme`
- **Type:** `Record<string, string>`, required — CSS custom property overrides applied to `:root`. Valid keys:
  - `--color-bg` — page background
  - `--color-surface` — card/surface background
  - `--color-text-primary` — main prose text
  - `--color-text-muted` — secondary/muted text
  - `--color-accent` — accent color (gauge bars, interactive elements)
  - `--color-danger` — danger/warning color

Dub Camp act definitions (with theme palette):
```json
[
  {
    "id": "afternoon",
    "name": "Afternoon",
    "paragraphIds": ["s10"],
    "theme": { "--color-bg": "#1a1208", "--color-accent": "#e8a42a" }
  },
  {
    "id": "goldenHour",
    "name": "Golden hour",
    "paragraphIds": ["s40"],
    "theme": { "--color-bg": "#160e0a", "--color-accent": "#e8622a" }
  },
  {
    "id": "night",
    "name": "Night",
    "paragraphIds": ["s60"],
    "theme": { "--color-bg": "#080810", "--color-accent": "#7c5cbf" }
  },
  {
    "id": "lateNight",
    "name": "Late night",
    "paragraphIds": ["s70"],
    "theme": { "--color-bg": "#0a0c0e", "--color-accent": "#4a7a8a" }
  }
]
```

---

## DecayRule

```typescript
interface DecayRule {
  gaugeId: string
  amount: number
  statReductionId?: string
  statReductionFormula?: string
}
```

Natural decay fires at every paragraph in `decayNodes`, AFTER choice effects on the same node.

### `gaugeId`
- **Type:** `string`, required — must match a `GaugeDefinition.id`

### `amount`
- **Type:** `number`, required — change applied to the gauge. Negative = reduction.
- **Example:** `-7` (Énergie loses 7 per decay node)

### `statReductionId`
- **Type:** `string`, optional — if present, the named stat reduces the decay magnitude using `statReductionFormula`.
- **Example:** `"estomac"`

### `statReductionFormula`
- **Type:** `string`, optional — formula string documenting the reduction calculation for the engine. Format: `"max(floor, base - statValue * multiplier)"`.
- **Example:** `"max(3, 10 - estomac * 1.5)"` — Nourriture decay is reduced by the Estomac stat; minimum decay is 3 regardless.

#### Probabilistic Decay Rule

A gauge can also have a probabilistic decay: a percentage chance that an additional amount is applied. Encode this as a separate `DecayRule` with a `probabilityChance` field:

```typescript
interface DecayRule {
  gaugeId: string
  amount: number
  probabilityChance?: number  // 0.0 to 1.0 — random roll, fires if Math.random() < probabilityChance
}
```

- **`probabilityChance`:** optional float `0.0–1.0`. If present, `Math.random()` is called; the decay fires only if the result is less than `probabilityChance`.

Dub Camp decay rules:
```json
[
  { "gaugeId": "energie", "amount": -7 },
  { "gaugeId": "alcool", "amount": -12 },
  { "gaugeId": "fumette", "amount": -8 },
  { "gaugeId": "nourriture", "amount": -10, "statReductionId": "estomac", "statReductionFormula": "max(3, 10 - estomac * 1.5)" },
  { "gaugeId": "energie", "amount": -8, "probabilityChance": 0.06 }
]
```

> **Note for §50 (heat penalty):** There is an additional universal `−10` Énergie penalty at §50 only. Encode this as a `gaugeEffects` entry on the choices at §50, or as a special `decayRule` with a `paragraphId` scope field. In Dub Camp, this is applied as an extra decay effect specific to that node.

---

## Paragraph

```typescript
interface Paragraph {
  id: string
  content: string
  choices: Choice[]
  isGameOver?: boolean
  isComplete?: boolean
}
```

### `id`
- **Type:** `string`, required — must match the object key in `paragraphs`
- **Dub Camp ID convention:** The source uses `§1`, `§15A`, `§EVT1`, `§201`, etc. Translate to JSON IDs as follows:
  - `§1` → `"s1"`
  - `§15A` → `"s15a"` (lowercase)
  - `§EVT1` → `"sEVT1"` (preserve EVT prefix, capitalize as in source)
  - `§201` → `"s201"`
  - `§40A` → `"s40a"` (lowercase suffix)
  - `§61C` → `"s61c"` (lowercase suffix)

### `content`
- **Type:** `string`, required — prose text of the paragraph. Supports markdown-lite inline formatting:
  - `**bold**` → bold
  - `*italic*` → italic
  - No other markdown (no headings, lists, code blocks)

### `choices`
- **Type:** `Choice[]`, required — player options displayed below the prose. Empty array `[]` if the paragraph is a terminal state (`isGameOver: true` or `isComplete: true`).

### `isGameOver`
- **Type:** `boolean`, optional — marks this paragraph as a Game Over terminal state. Displayed on the EndScreen with the Kiff score revealed.

### `isComplete`
- **Type:** `boolean`, optional — marks this paragraph as a successful story completion. Displayed on the EndScreen with score tier narrative.

---

## Choice

```typescript
interface Choice {
  id: string
  text: string
  targetParagraphId: string
  gaugeEffects?: GaugeEffect[]
  weightedOutcome?: WeightedOutcome
  inventoryAdd?: string[]
  inventoryRemove?: string[]
}
```

### `id`
- **Type:** `string`, required — unique within the paragraph; convention: `"<paragraphId>-a"`, `"<paragraphId>-b"`, etc.
- **Example:** `"s1-a"`, `"s1-b"`

### `text`
- **Type:** `string`, required — choice label shown on the choice card
- **Example:** `"Aller voir le programme avec Bastien"`

### `targetParagraphId`
- **Type:** `string`, required — must match an existing key in `paragraphs`. The validator checks referential integrity at startup.

### `gaugeEffects`
- **Type:** `GaugeEffect[]`, optional — gauge changes applied when this choice is selected. See [GaugeEffect](#gaugeeffect).

### `weightedOutcome`
- **Type:** `WeightedOutcome`, optional — probabilistic outcome attached to this choice. See [WeightedOutcome](#weightedoutcome).

### `inventoryAdd`
- **Type:** `string[]`, optional — item IDs added to the player's inventory when this choice is selected.
- **Example:** `["festival-bracelet"]`

### `inventoryRemove`
- **Type:** `string[]`, optional — item IDs removed from the player's inventory when this choice is selected.

---

## GaugeEffect

```typescript
interface GaugeEffect {
  gaugeId: string
  delta: number
  statInfluence?: {
    statId: string
    multiplier: number
  }
}
```

### `gaugeId`
- **Type:** `string`, required — must match a `GaugeDefinition.id`

### `delta`
- **Type:** `number`, required — amount added to the gauge. Positive = increase, negative = decrease. Result is always clamped to [0, 100].
- **Example:** `-15` (Énergie loses 15), `+5` (Kiff gains 5)

### `statInfluence`
- **Type:** optional object — if present, the final delta is modified by a player stat:
  - `statId`: must match a `StatDefinition.id`
  - `multiplier`: the stat value is multiplied by this and subtracted from the base delta magnitude (reducing cost)
  - Formula: `effectiveDelta = delta + (stats[statId] * multiplier)`
  - Example: `{ "statId": "endurance", "multiplier": 2 }` with `delta: -15` and `endurance: 3` → `effectiveDelta = -15 + (3 * 2) = -9`

---

## WeightedOutcome

```typescript
interface WeightedOutcome {
  gaugeId: string
  statId: string
  goodEffects: GaugeEffect[]
  badEffects: GaugeEffect[]
}
```

A weighted outcome is attached to a choice. When that choice is selected, the engine evaluates a risk formula and calls `Math.random()` to determine whether the good or bad outcome fires. **Neither the probability nor the risk value is ever shown to the player.**

### Risk Formula

```
Risk = gaugeLevel - (associatedStat × 15) + hungerModifier
```

Where:
- `gaugeLevel` = current value of `gaugeId` [0–100]
- `associatedStat` = player's allocated points in `statId`
- `hungerModifier`:
  - `+0` if `nourriture > 50`
  - `+10` if `nourriture` is 25–50
  - `+25` if `nourriture < 25`

### Probability Table

| Risk | Probability of good outcome |
|------|-----------------------------|
| < 30 | 90% |
| 30–55 | 60% |
| 55–75 | 40% |
| > 75 | 20% |

### Fields

### `gaugeId`
- **Type:** `string`, required — the gauge used to compute `gaugeLevel` in the risk formula
- **Example:** `"alcool"` (risk rises with alcohol level)

### `statId`
- **Type:** `string`, required — the stat that reduces risk
- **Example:** `"resistanceAlcool"`

### `goodEffects`
- **Type:** `GaugeEffect[]`, required — gauge changes applied when the good outcome fires
- **Example:** `[{ "gaugeId": "kiff", "delta": 10 }]`

### `badEffects`
- **Type:** `GaugeEffect[]`, required — gauge changes applied when the bad outcome fires
- **Example:** `[{ "gaugeId": "kiff", "delta": -5 }, { "gaugeId": "energie", "delta": -10 }]`

---

## Probabilistic Events (Random Branching)

Some paragraphs (e.g., §EVT1 in Dub Camp) use a 1-in-N random branch. Encode these using a special `weightedOutcome` on the choice that leads to the event:

- Set `goodEffects` to the effects for the normal path and `badEffects` to the rare path effects, or
- More precisely: model the random branch by setting the risk such that `Math.random()` produces the desired probability. For a 1-in-3 chance (33%), ensure the Risk formula results in the 30–55 range → 60% probability. If exact control is needed, use a dedicated `probabilityChance` field on the choice.

The Dub Camp §EVT1 event (1-in-3 chance of a bonus encounter) should be encoded with a `weightedOutcome` calibrated for ~33% success: set `gaugeId` to `"energie"` at a baseline that produces Risk in the 55–75 range → 40% probability, or adjust as needed for the intended story feel.

---

## EndStateTier

```typescript
interface EndStateTier {
  minScore: number
  maxScore: number
  text: string
}
```

At story completion (`isComplete: true`), the player's `score` gauge value (Kiff) is matched against these tiers. The matching tier's `text` is displayed as the narrative outcome.

### `minScore`
- **Type:** `number`, required — minimum score (inclusive) for this tier

### `maxScore`
- **Type:** `number`, required — maximum score (inclusive) for this tier. Use a large number (e.g. `9999`) for the open-ended top tier.

### `text`
- **Type:** `string`, required — narrative prose displayed on the EndScreen. Supports the same markdown-lite as paragraph `content`.

Dub Camp end-state tiers:
```json
[
  {
    "minScore": 100,
    "maxScore": 9999,
    "text": "Une soirée parfaite. Tu rentreras avec des souvenirs qui durent des années."
  },
  {
    "minScore": 70,
    "maxScore": 99,
    "text": "Bien jouée. Tu as su doser — quelques coups de mou, mais l'essentiel était là."
  },
  {
    "minScore": 40,
    "maxScore": 69,
    "text": "C'était bien, mais t'as senti que t'aurais pu faire mieux. La prochaine fois."
  },
  {
    "minScore": 0,
    "maxScore": 39,
    "text": "Dur. Tu as survécu, mais le Dub Camp t'a eu. Rejoue — tu sais maintenant ce qui t'attend."
  }
]
```

---

## Evaluation Order

The engine applies effects in this strict order at every choice node:

1. Apply `choice.gaugeEffects` (all GaugeEffect deltas)
2. Resolve `choice.weightedOutcome` if present (call `Math.random()`, apply `goodEffects` or `badEffects`)
3. Apply `choice.inventoryAdd` and `choice.inventoryRemove`
4. Clamp all gauges to [0, 100]
5. Evaluate Game Over conditions (in gauge config order) — if triggered: set `isGameOver: true`, set `gameOverParagraphId`, STOP
6. If no Game Over: evaluate act transition (check if new `paragraphId` is in any act's `paragraphIds`)
7. Advance `paragraphId` to `choice.targetParagraphId`
8. Persist state to localStorage

At **decay nodes**, after the above choice resolution, decay additionally fires:

1. Apply all `decayRules` (including probabilistic ones)
2. Clamp all gauges to [0, 100]
3. Evaluate Game Over — if triggered: set `isGameOver: true`, STOP
4. Evaluate act transition
5. Persist state

**Critical:** Game Over is ALWAYS evaluated before act transition. Decay fires AFTER choice effects. These orders are invariant.

---

## Worked Example — 3-Paragraph Mini-Story

A complete minimal story with 1 gauge, 1 stat, 1 weighted outcome, 1 Game Over, and 1 act transition:

```json
{
  "id": "sample-story",
  "version": 1,
  "meta": {
    "title": "A Short Adventure",
    "author": "Author Name",
    "version": "v1.0",
    "description": "A three-paragraph demonstration story.",
    "exampleProfiles": [
      {
        "name": "The Runner",
        "description": "high endurance",
        "stats": { "endurance": 3 }
      }
    ]
  },
  "statPointBudget": 3,
  "stats": [
    { "id": "endurance", "name": "Endurance", "description": "Reduces energy cost", "maxPerStat": 3 }
  ],
  "gauges": [
    {
      "id": "energy",
      "name": "Energy",
      "icon": "⚡",
      "initialValue": 100,
      "isScore": false,
      "isHidden": false,
      "gameOverThreshold": 10,
      "gameOverCondition": "below"
    },
    {
      "id": "score",
      "name": "Score",
      "icon": "🌟",
      "initialValue": 0,
      "isScore": true,
      "isHidden": true
    }
  ],
  "acts": [
    {
      "id": "act1",
      "name": "Morning",
      "paragraphIds": ["p1"],
      "theme": { "--color-bg": "#0f0f0f", "--color-accent": "#d4935a" }
    },
    {
      "id": "act2",
      "name": "Evening",
      "paragraphIds": ["p2"],
      "theme": { "--color-bg": "#080810", "--color-accent": "#7c5cbf" }
    }
  ],
  "decayNodes": ["p2"],
  "decayRules": [
    { "gaugeId": "energy", "amount": -10 }
  ],
  "paragraphs": {
    "p1": {
      "id": "p1",
      "content": "You stand at a crossroads. The path ahead looks **challenging** but promising.",
      "choices": [
        {
          "id": "p1-a",
          "text": "Take the easy path",
          "targetParagraphId": "p2",
          "gaugeEffects": [
            { "gaugeId": "energy", "delta": -5, "statInfluence": { "statId": "endurance", "multiplier": 1 } },
            { "gaugeId": "score", "delta": 10 }
          ]
        },
        {
          "id": "p1-b",
          "text": "Push through the hard path",
          "targetParagraphId": "p2",
          "gaugeEffects": [
            { "gaugeId": "energy", "delta": -25, "statInfluence": { "statId": "endurance", "multiplier": 3 } }
          ],
          "weightedOutcome": {
            "gaugeId": "energy",
            "statId": "endurance",
            "goodEffects": [{ "gaugeId": "score", "delta": 30 }],
            "badEffects": [{ "gaugeId": "energy", "delta": -20 }]
          }
        }
      ]
    },
    "p2": {
      "id": "p2",
      "content": "You reach the valley as evening falls. *The light is fading.*",
      "choices": [
        {
          "id": "p2-a",
          "text": "Rest and recover",
          "targetParagraphId": "pEnd",
          "gaugeEffects": [{ "gaugeId": "energy", "delta": 20 }]
        },
        {
          "id": "p2-b",
          "text": "Press on",
          "targetParagraphId": "pEnd",
          "gaugeEffects": [{ "gaugeId": "energy", "delta": -30 }]
        }
      ]
    },
    "pEnd": {
      "id": "pEnd",
      "content": "You reach your destination as the stars appear. The journey is complete.",
      "choices": [],
      "isComplete": true
    },
    "pDeath": {
      "id": "pDeath",
      "content": "Your energy gave out. You collapse, unable to continue.",
      "choices": [],
      "isGameOver": true
    }
  },
  "endStateTiers": [
    { "minScore": 30, "maxScore": 9999, "text": "A triumphant journey. You pushed through and emerged stronger." },
    { "minScore": 10, "maxScore": 29, "text": "You made it, but barely. Next time you'll know better." },
    { "minScore": 0, "maxScore": 9, "text": "A difficult journey. You survived — that counts for something." }
  ]
}
```

---

## Dub Camp Paragraph ID Reference

| Source notation | JSON id |
|----------------|---------|
| §1 | `"s1"` |
| §10–§16 | `"s10"` – `"s16"` |
| §15A, §15B | `"s15a"`, `"s15b"` |
| §16A, §16B, §16C | `"s16a"`, `"s16b"`, `"s16c"` |
| §20 | `"s20"` |
| §31–§33 | `"s31"` – `"s33"` |
| §40, §40A–§40E | `"s40"`, `"s40a"` – `"s40e"` |
| §41 | `"s41"` |
| §EVT1 | `"sEVT1"` |
| §50–§53 | `"s50"` – `"s53"` |
| §60, §60A, §60B | `"s60"`, `"s60a"`, `"s60b"` |
| §61–§63 | `"s61"` – `"s63"` |
| §61C | `"s61c"` |
| §70 | `"s70"` |
| §201–§204 | `"s201"` – `"s204"` |

---

## Dub Camp Special Cases

### Voluntary Exit at §41

§41 is the **voluntary exit** paragraph — a player can choose to leave early. This choice:
- Awards `Kiff +5`
- Bypasses all Game Over checks
- Leads to a `isComplete: true` paragraph

Encode as a choice with `gaugeEffects: [{ "gaugeId": "kiff", "delta": 5 }]` targeting a complete paragraph.

### §50 Heat Penalty

§50 has a universal `-10⚡` penalty in addition to normal decay. Add a dedicated entry in `decayRules` scoped to §50, or encode it as a `gaugeEffect` on all choices at §50. If using `decayRules`, add a `paragraphScope?: string` field to apply the rule only at that node.

### §EVT1 Random Event

§EVT1 fires with approximately 1-in-3 probability. Encode using `weightedOutcome` calibrated to ~33% success rate: use `gaugeId: "energie"` at a gauge level that falls in the 55–75 risk band → 40% probability (closest to 1-in-3).

### Game Over Paragraphs

- `§201` (`"s201"`) — Game Over: trop bu trop tôt (Alcool > 85)
- `§202` (`"s202"`) — Game Over: dans le gaz (energy exhaustion)
- `§203` (`"s203"`) — Game Over: alcool + low Nourriture
- `§204` (`"s204"`) — Game Over: épuisement

All four must have `"isGameOver": true` and `"choices": []`.
