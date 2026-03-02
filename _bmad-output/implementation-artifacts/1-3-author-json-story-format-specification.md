# Story 1.3: Author JSON Story Format Specification (FR35)

Status: complete

## Story

As a story author (Anthony),
I want a complete `docs/story-format-spec.md` reference document that defines every field of the story JSON schema,
so that I can translate `dubcamp-histoire-v08.md` into a valid `dub-camp.json` using an LLM prompt without needing any additional context or guidance.

## Acceptance Criteria

1. Every field in `StoryConfig` (from `engine/types.ts`) is documented with: field name, TypeScript type, whether required or optional, description of purpose, and a concrete example value
2. The spec documents the weighted outcome risk formula: `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier` and the probability table (Risk < 30 → 90%, 30–55 → 60%, 55–75 → 40%, > 75 → 20%)
3. The spec documents natural decay: which paragraph IDs trigger decay, and the amounts per gauge (`Énergie -7`, `Alcool -12`, `Fumette -8`, `Nourriture -10` reduced by `max(3, 10 − Estomac × 1.5)`, plus 6% passive risk of `-8⚡`)
4. The spec documents act definition: how `paragraphIds[]` triggers act transitions and how `theme` overrides CSS custom properties
5. The spec documents Game Over conditions: both threshold-based (`gaugeLevel > threshold`) and probabilistic (e.g. §50 heat: 20% chance if `⚡ < 22%`)
6. The spec includes a complete worked example showing a 3-paragraph mini-story with 1 gauge, 1 stat, 1 weighted outcome, and 1 Game Over condition as valid JSON
7. An LLM given only `dubcamp-histoire-v08.md` and this spec document could produce a valid `dub-camp.json` without asking any clarifying questions

## Tasks / Subtasks

- [x] Create `docs/story-format-spec.md` with document header and introduction (AC: 1, 7)
  - [x] Add title, purpose, and usage instructions (describe that this doc + a story source = LLM can produce valid JSON)
  - [x] Include a quick-start section explaining the overall JSON structure

- [x] Document top-level `StoryConfig` fields (AC: 1)
  - [x] `id` (string, required) — machine-readable story identifier, kebab-case, e.g. `"dub-camp"`
  - [x] `version` (number, required) — schema version, currently `1`
  - [x] `meta` (StoryMeta, required) — story metadata object
  - [x] `statPointBudget` (number, required) — total points player distributes, e.g. `8`
  - [x] `stats` (StatDefinition[], required) — player character stats array
  - [x] `gauges` (GaugeDefinition[], required) — story gauges array
  - [x] `acts` (ActDefinition[], required) — story acts with theme overrides
  - [x] `decayNodes` (string[], required) — paragraph IDs where natural decay fires
  - [x] `decayRules` (DecayRule[], required) — per-gauge decay amounts
  - [x] `paragraphs` (Record<string, Paragraph>, required) — all story paragraphs keyed by ID
  - [x] `endStateTiers` (EndStateTier[], required) — score ranges to outcome narratives

- [x] Document `StoryMeta` and `StatDefinition` fields (AC: 1)
  - [x] `StoryMeta`: `title`, `author`, `version` (string), `description?`, `exampleProfiles`
  - [x] `ExampleProfile`: `name`, `description`, `stats` (Record<statId, number>)
  - [x] `StatDefinition`: `id` (camelCase), `name` (display), `description?`, `maxPerStat`
  - [x] Dub Camp stat examples: `endurance`, `estomac`, `resistanceAlcool`, `resistanceFumette`

- [x] Document `GaugeDefinition` fields (AC: 1, 5)
  - [x] All fields: `id`, `name`, `icon` (emoji), `initialValue`, `isScore`, `isHidden`
  - [x] Game Over fields: `gameOverThreshold?`, `gameOverCondition?: 'above' | 'below'`
  - [x] Explain: `isHidden: true` = excluded from GaugeStrip display during play (but shown in CharacterSheet)
  - [x] Explain: `isScore: true` = the hidden score gauge (Kiff); its value revealed only at end/game over
  - [x] Dub Camp examples: energie (initial 100, threshold < 10), alcool (initial 0, threshold > 85), kiff (isScore: true, isHidden: true)

- [x] Document `ActDefinition` and theme system (AC: 4)
  - [x] `id` (string), `name` (string), `paragraphIds` (string[]) — paragraph IDs that trigger this act when reached
  - [x] `theme` (Record<string, string>) — CSS custom property overrides applied to `:root`
  - [x] Explain: When player reaches any paragraph in `paragraphIds`, the act transitions and `theme` is applied
  - [x] Document valid CSS custom property keys: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`
  - [x] Dub Camp act palette examples:
    - Afternoon: `{ "--color-bg": "#1a1208", "--color-accent": "#e8a42a" }`
    - Golden hour: `{ "--color-bg": "#160e0a", "--color-accent": "#e8622a" }`
    - Night: `{ "--color-bg": "#080810", "--color-accent": "#7c5cbf" }`
    - Late night: `{ "--color-bg": "#0a0c0e", "--color-accent": "#4a7a8a" }`

- [x] Document natural decay system (AC: 3)
  - [x] `decayNodes` array: list of paragraph IDs where decay fires (Dub Camp: `["s20","s40","s50","s60","s70"]`)
  - [x] `DecayRule` fields: `gaugeId`, `amount` (negative delta), `statReductionId?`, `statReductionFormula?`
  - [x] Document Dub Camp decay amounts:
    - Énergie: `-7`
    - Alcool: `-12`
    - Fumette: `-8`
    - Nourriture: formula `max(3, 10 − Estomac × 1.5)` (stat reduction reduces decay)
    - Passive ⚡ risk: 6% chance of `-8` energie (encoded as probabilistic decay rule)
  - [x] Explain: Decay fires AFTER choice effects at the same node — never before

- [x] Document weighted outcome resolution (AC: 2)
  - [x] `WeightedOutcome` fields: `gaugeId` (gauge to assess risk against), `statId` (stat that reduces risk), `goodEffects` (GaugeEffect[]), `badEffects` (GaugeEffect[])
  - [x] Risk formula: `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier`
  - [x] Hunger modifier: `+0` if Nourriture > 50, `+10` if 25–50, `+25` if < 25
  - [x] Probability table: Risk < 30 → 90% good; 30–55 → 60%; 55–75 → 40%; > 75 → 20%
  - [x] Clarify: These probabilities and risk values are NEVER shown to the player

- [x] Document `Paragraph` and `Choice` fields (AC: 1)
  - [x] `Paragraph`: `id` (string, matches key), `content` (prose text, supports `**bold**` and `*italic*`), `choices` (Choice[]), `isGameOver?`, `isComplete?`
  - [x] `Choice`: `id`, `text`, `targetParagraphId`, `gaugeEffects?`, `weightedOutcome?`, `inventoryAdd?`, `inventoryRemove?`
  - [x] `GaugeEffect`: `gaugeId`, `delta` (positive or negative number), `statInfluence?`
  - [x] Note: `targetParagraphId` must reference an existing key in `paragraphs` — validator will catch mismatches
  - [x] Paragraph ID convention for Dub Camp: use `s` prefix + section number (e.g., `"s1"`, `"s15a"`, `"sEVT1"`, `"s201"`)

- [x] Document `EndStateTier` fields (AC: 1)
  - [x] `minScore`, `maxScore`, `text` (narrative prose displayed at story end)
  - [x] Explain: Player's `score` gauge value (Kiff) is matched against tiers at story completion
  - [x] Dub Camp tiers: 100+ pts, 70–99, 40–69, < 40

- [x] Add complete worked example (AC: 6)
  - [x] Create a 3-paragraph mini-story JSON with:
    - 1 gauge (e.g., `energy`, initial 100, Game Over if < 10)
    - 1 stat (e.g., `endurance`, max 4)
    - 1 weighted outcome on a choice
    - 1 Game Over paragraph
    - 1 complete ending paragraph
    - 1 act transition
  - [x] Show complete valid JSON from `id` through `endStateTiers`
  - [x] Annotate each section with brief comments (use `// comment` notation in the worked example prose, not in actual JSON)

- [x] Final review: LLM readability test (AC: 7)
  - [x] Re-read the spec imagining you are an LLM that has never seen this codebase
  - [x] Verify every field mentioned in `engine/types.ts` is documented
  - [x] Verify Dub Camp paragraph ID format is clear (§1 → `"s1"`, §15A → `"s15a"`, §EVT1 → `"sEVT1"`)
  - [x] Verify the probabilistic event encoding (§EVT1, 1-in-3 probability) is documented

## Dev Notes

- **This document is FR35 — a standalone v1 deliverable.** It must be complete before Epic 4 (translating Dub Camp to JSON). The entire purpose is to enable an LLM to translate `dubcamp-histoire-v08.md` into valid `dub-camp.json` without additional guidance.
- **Paragraph IDs in Dub Camp:** The source document uses §1, §15A, §EVT1, §201 etc. In JSON, these become `"s1"`, `"s15a"`, `"sEVT1"`, `"s201"`. The spec must document this translation convention explicitly.
- **Probabilistic decay:** The 6% passive `−8⚡` risk and the §EVT1 1-in-3 random event are both probabilistic. The spec must explain how to encode these (they use weighted outcome mechanics with `Math.random()`-based resolution).
- **§50 heat penalty:** There is a universal `-10⚡` penalty at §50 in addition to normal decay. This is a special decay rule that needs to be documented as a paragraph-specific additional decay amount.
- **Voluntary exit §41:** Awards `Kiff +5` and bypasses all Game Over checks — needs its own explanation as a `choice` with `gaugeEffects` on the score gauge.
- **The worked example must be syntactically valid JSON** — no trailing commas, no comments (keep comments in the surrounding prose, not in the JSON block itself).

### Project Structure Notes

Files to create:
- `docs/story-format-spec.md` (new document)

The `docs/` directory should already exist (it's listed in the project structure from architecture). If not, create it.

### References

- [Source: architecture.md#Project-Structure] — `docs/story-format-spec.md` described as "FR35: JSON schema reference for story authors"
- [Source: epics.md#Story-1.3] — Full acceptance criteria with specific decay formulas and probability tables
- [Source: architecture.md#Format-Patterns] — `StoryConfig`, `EngineState`, `SaveState` canonical shapes
- [Source: engine/types.ts] — All interface definitions (must be complete from Story 1.2)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Complete spec document at `docs/story-format-spec.md` covering all StoryConfig fields
- Risk formula, probability table, hunger modifier all documented with concrete examples
- Natural decay system documented including probabilistic 6% passive energy drain
- Act definition with theme CSS custom property override system documented
- Game Over conditions documented for all 4 Dub Camp paths
- Complete worked example: 3-paragraph mini-story with valid JSON (energy gauge, endurance stat, weighted outcome, game over, act transition)
- Dub Camp paragraph ID translation table (§1→"s1", §15A→"s15a", §EVT1→"sEVT1")
- Special cases documented: §41 voluntary exit, §50 heat penalty, §EVT1 random event, all 4 Game Over paragraphs
- Probabilistic decay rule with `probabilityChance` field documented (extends base DecayRule)

### File List

- `docs/story-format-spec.md` — new, FR35 JSON schema reference for story authors
