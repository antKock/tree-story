# Story 1.3: Author JSON Story Format Specification (FR35)

Status: ready-for-dev

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

- [ ] Create `docs/story-format-spec.md` with document header and introduction (AC: 1, 7)
  - [ ] Add title, purpose, and usage instructions (describe that this doc + a story source = LLM can produce valid JSON)
  - [ ] Include a quick-start section explaining the overall JSON structure

- [ ] Document top-level `StoryConfig` fields (AC: 1)
  - [ ] `id` (string, required) — machine-readable story identifier, kebab-case, e.g. `"dub-camp"`
  - [ ] `version` (number, required) — schema version, currently `1`
  - [ ] `meta` (StoryMeta, required) — story metadata object
  - [ ] `statPointBudget` (number, required) — total points player distributes, e.g. `8`
  - [ ] `stats` (StatDefinition[], required) — player character stats array
  - [ ] `gauges` (GaugeDefinition[], required) — story gauges array
  - [ ] `acts` (ActDefinition[], required) — story acts with theme overrides
  - [ ] `decayNodes` (string[], required) — paragraph IDs where natural decay fires
  - [ ] `decayRules` (DecayRule[], required) — per-gauge decay amounts
  - [ ] `paragraphs` (Record<string, Paragraph>, required) — all story paragraphs keyed by ID
  - [ ] `endStateTiers` (EndStateTier[], required) — score ranges to outcome narratives

- [ ] Document `StoryMeta` and `StatDefinition` fields (AC: 1)
  - [ ] `StoryMeta`: `title`, `author`, `version` (string), `description?`, `exampleProfiles`
  - [ ] `ExampleProfile`: `name`, `description`, `stats` (Record<statId, number>)
  - [ ] `StatDefinition`: `id` (camelCase), `name` (display), `description?`, `maxPerStat`
  - [ ] Dub Camp stat examples: `endurance`, `estomac`, `resistanceAlcool`, `resistanceFumette`

- [ ] Document `GaugeDefinition` fields (AC: 1, 5)
  - [ ] All fields: `id`, `name`, `icon` (emoji), `initialValue`, `isScore`, `isHidden`
  - [ ] Game Over fields: `gameOverThreshold?`, `gameOverCondition?: 'above' | 'below'`
  - [ ] Explain: `isHidden: true` = excluded from GaugeStrip display during play (but shown in CharacterSheet)
  - [ ] Explain: `isScore: true` = the hidden score gauge (Kiff); its value revealed only at end/game over
  - [ ] Dub Camp examples: energie (initial 100, threshold < 10), alcool (initial 0, threshold > 85), kiff (isScore: true, isHidden: true)

- [ ] Document `ActDefinition` and theme system (AC: 4)
  - [ ] `id` (string), `name` (string), `paragraphIds` (string[]) — paragraph IDs that trigger this act when reached
  - [ ] `theme` (Record<string, string>) — CSS custom property overrides applied to `:root`
  - [ ] Explain: When player reaches any paragraph in `paragraphIds`, the act transitions and `theme` is applied
  - [ ] Document valid CSS custom property keys: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`
  - [ ] Dub Camp act palette examples:
    - Afternoon: `{ "--color-bg": "#1a1208", "--color-accent": "#e8a42a" }`
    - Golden hour: `{ "--color-bg": "#160e0a", "--color-accent": "#e8622a" }`
    - Night: `{ "--color-bg": "#080810", "--color-accent": "#7c5cbf" }`
    - Late night: `{ "--color-bg": "#0a0c0e", "--color-accent": "#4a7a8a" }`

- [ ] Document natural decay system (AC: 3)
  - [ ] `decayNodes` array: list of paragraph IDs where decay fires (Dub Camp: `["s20","s40","s50","s60","s70"]`)
  - [ ] `DecayRule` fields: `gaugeId`, `amount` (negative delta), `statReductionId?`, `statReductionFormula?`
  - [ ] Document Dub Camp decay amounts:
    - Énergie: `-7`
    - Alcool: `-12`
    - Fumette: `-8`
    - Nourriture: formula `max(3, 10 − Estomac × 1.5)` (stat reduction reduces decay)
    - Passive ⚡ risk: 6% chance of `-8` energie (encoded as probabilistic decay rule)
  - [ ] Explain: Decay fires AFTER choice effects at the same node — never before

- [ ] Document weighted outcome resolution (AC: 2)
  - [ ] `WeightedOutcome` fields: `gaugeId` (gauge to assess risk against), `statId` (stat that reduces risk), `goodEffects` (GaugeEffect[]), `badEffects` (GaugeEffect[])
  - [ ] Risk formula: `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier`
  - [ ] Hunger modifier: `+0` if Nourriture > 50, `+10` if 25–50, `+25` if < 25
  - [ ] Probability table: Risk < 30 → 90% good; 30–55 → 60%; 55–75 → 40%; > 75 → 20%
  - [ ] Clarify: These probabilities and risk values are NEVER shown to the player

- [ ] Document `Paragraph` and `Choice` fields (AC: 1)
  - [ ] `Paragraph`: `id` (string, matches key), `content` (prose text, supports `**bold**` and `*italic*`), `choices` (Choice[]), `isGameOver?`, `isComplete?`
  - [ ] `Choice`: `id`, `text`, `targetParagraphId`, `gaugeEffects?`, `weightedOutcome?`, `inventoryAdd?`, `inventoryRemove?`
  - [ ] `GaugeEffect`: `gaugeId`, `delta` (positive or negative number), `statInfluence?`
  - [ ] Note: `targetParagraphId` must reference an existing key in `paragraphs` — validator will catch mismatches
  - [ ] Paragraph ID convention for Dub Camp: use `s` prefix + section number (e.g., `"s1"`, `"s15a"`, `"sEVT1"`, `"s201"`)

- [ ] Document `EndStateTier` fields (AC: 1)
  - [ ] `minScore`, `maxScore`, `text` (narrative prose displayed at story end)
  - [ ] Explain: Player's `score` gauge value (Kiff) is matched against tiers at story completion
  - [ ] Dub Camp tiers: 100+ pts, 70–99, 40–69, < 40

- [ ] Add complete worked example (AC: 6)
  - [ ] Create a 3-paragraph mini-story JSON with:
    - 1 gauge (e.g., `energy`, initial 100, Game Over if < 10)
    - 1 stat (e.g., `endurance`, max 4)
    - 1 weighted outcome on a choice
    - 1 Game Over paragraph
    - 1 complete ending paragraph
    - 1 act transition
  - [ ] Show complete valid JSON from `id` through `endStateTiers`
  - [ ] Annotate each section with brief comments (use `// comment` notation in the worked example prose, not in actual JSON)

- [ ] Final review: LLM readability test (AC: 7)
  - [ ] Re-read the spec imagining you are an LLM that has never seen this codebase
  - [ ] Verify every field mentioned in `engine/types.ts` is documented
  - [ ] Verify Dub Camp paragraph ID format is clear (§1 → `"s1"`, §15A → `"s15a"`, §EVT1 → `"sEVT1"`)
  - [ ] Verify the probabilistic event encoding (§EVT1, 1-in-3 probability) is documented

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

### Completion Notes List

### File List
