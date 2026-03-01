---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
completedAt: '2026-03-01'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# tree-story - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for tree-story, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Player can create a character profile by distributing a fixed point budget across story-defined stats before beginning a story
FR2: Player can view example profile archetypes during character creation to guide their allocation
FR3: The character creation screen adapts to the story's configured stat names, stat count, and point budget — no hardcoded labels or fixed layout
FR4: Player can read story paragraphs presented as flowing prose
FR5: Player can select a choice from story-defined options to advance the narrative
FR6: Player can access their character sheet (current gauge values and inventory) on demand without leaving the story
FR7: Player can view their current inventory of items gained or lost through story events
FR8: The system tracks and updates story-defined gauges in response to player choices
FR9: The system applies natural gauge decay automatically at story-defined narrative nodes, independent of player choices
FR10: The system resolves weighted probabilistic outcomes at story-defined tension moments — probability and weighting are never visible to the player
FR11: Player stats influence gauge arithmetic and outcome weighting as defined by story configuration
FR12: The system evaluates Game Over conditions at story-defined trigger points when gauges exceed configured thresholds
FR13: The system tracks a designated score gauge throughout the session without displaying it to the player during play
FR14: The system enforces inventory changes (items gained or lost) at story-defined events
FR15: Player is presented with a narrative outcome at story completion, determined by their score gauge value against story-defined result tiers
FR16: Player is shown their score gauge value upon reaching a Game Over or story end
FR17: Player can choose to replay the story from the beginning after completing it or reaching a Game Over
FR18: The system resets all story state (gauges, paragraph position, inventory, character stats) when a player initiates a replay
FR19: The system automatically saves player progress after every choice without any player action
FR20: Player can resume a story session from the exact paragraph where they stopped, with all state fully restored
FR21: Saved progress survives browser close, tab switch, and device lock
FR22: Player can continue a story session without network connectivity after the initial story load
FR23: All player state is stored locally on the player's device — no account, login, or network dependency required
FR24: The app applies a story-defined visual theme (color palette, accent color) at story load
FR25: The system transitions to a new story-defined visual theme at story-defined act boundaries as the player progresses
FR26: The app presents dark mode as the primary and default visual register
FR27: The reading experience renders correctly on mobile viewport sizes as the primary display context
FR28: An author can define a complete story (paragraphs, choices, gauges, stats, outcomes, decay rules, palette) in a JSON configuration file maintained outside the app
FR29: The system loads story configuration from a designated directory in the repository at startup
FR30: The system validates a story JSON configuration at startup for schema correctness and referential integrity (e.g. all choice targets reference existing paragraph IDs)
FR31: The system surfaces a clear error to the developer when a story configuration is invalid; this error is never shown to players
FR32: Story configuration defines all gauge properties (names, icons, initial values, decay rules, Game Over thresholds) — the engine uses only these values, no hardcoded story-specific data
FR33: Story configuration defines all player stat properties (names, count, point budget) — the character creation screen renders from these values with no hardcoded defaults
FR34: Story configuration defines all weighted outcome parameters — the engine resolves outcomes from these without any hardcoded probability values
FR35: A JSON Story Format Specification document exists as a standalone v1 deliverable, defining every field of the story schema with sufficient precision for an LLM to translate a structured story document into valid JSON without additional guidance

### NonFunctional Requirements

NFR1: Choice resolution and next-paragraph render complete within 200ms — measured from tap to fully rendered paragraph and updated gauge state
NFR2: Act-based visual theme transition (CSS custom property update) completes within one rendering frame — imperceptible as a "UI event"
NFR3: Story JSON and all required assets load in a single network round-trip on first open; all subsequent story navigation is purely client-side with no network calls
NFR4: The app remains fully playable without network connectivity after initial story load — no mid-session dependency on external resources (CDN, analytics, fonts if not preloaded)
NFR5: The app renders without layout breakage on viewports from 320px to 428px width (portrait mobile baseline)
NFR6: All prose text and UI labels meet WCAG AA contrast ratio (4.5:1 minimum) against their background in dark mode
NFR7: All interactive elements (choice cards, replay button, character sheet trigger) have a minimum touch target height of 44px
NFR8: Story-defined accent colors must satisfy WCAG AA contrast against their configured act background — validated at story JSON load time, not at runtime
NFR9: Prose font size minimum is 20px; no content-critical information is communicated through colour alone
NFR10: Player progress must not be lost due to normal browser behaviour — including close, refresh, back navigation, or switching tabs
NFR11: A story engine error (invalid gauge state, missing paragraph reference, unexpected outcome) must never produce a silent failure mid-story; all unrecoverable errors surface as a defined fallback state
NFR12: Story JSON validation failures at startup produce a clear developer-readable error message identifying the failing field or reference; the player-facing app is not loaded in an invalid state

### Additional Requirements

**From Architecture:**
- Project already initialized via `create-next-app` (TypeScript 5 + React 19 + Next.js 16, Tailwind CSS v4, App Router) — no starter setup needed in Epic 1 Story 1, but dependencies to add are: shadcn/ui (`npx shadcn@latest init`), Vitest (`npm install -D vitest`), Lora + Inter via `next/font/google`
- `public/stories/` directory must be created for JSON story config files
- `docs/story-format-spec.md` (FR35) must be authored as a pre-implementation deliverable before Dub Camp JSON is translated — blocks content work
- Engine module must be pure TypeScript with zero React dependency — `engine/` directory enforces a strict unidirectional dependency boundary (`app → hooks → engine`)
- localStorage key: `tree-story:save` — single key, full state snapshot; written after every choice, wiped on replay
- Strict evaluation order at choice nodes: (1) apply choice gauge effects, (2) apply weighted outcome, (3) clamp gauges [0,100], (4) evaluate Game Over conditions, (5) if Game Over → set isGameOver + stop, (6) evaluate act transition, (7) persist state
- Strict evaluation order at decay nodes: (1) apply choice effects + weighted outcome, (2) apply decay, (3) clamp gauges, (4) evaluate Game Over, (5) if Game Over → stop, (6) evaluate act transition, (7) persist state
- Vercel deployment already connected to GitHub — push to main triggers auto-deploy
- TypeScript strict mode (`strict: true`), no `any` in engine code, all engine functions have explicit return types
- `vitest.config.ts` must be created; engine tests must cover all 53 Dub Camp paragraphs, all 4 Game Over paths, all gauge decay sequences
- Save restore validation: discard save silently (start fresh) if version ≠ 1, storyId mismatch, paragraphId not in config, or any required EngineState field missing/wrong type

**From UX Design:**
- Gauge strip: `position: sticky; top: 0` — rendered outside the scroll area above prose; emoji icons (17px) centered above 7px-height bars; no numeric labels; Kiff gauge hidden during play
- Choice cards: rendered as a stacked card block below the prose (not inline); full-width, 8px border-radius, 1px border (`rgba(255,255,255,0.08)`), `padding: 16px 20px`, `min-height: 48px`
- Prose: 20px Lora serif, left-aligned, 1.72 line-height, `max-width: 65ch`, `padding: 0 1.5rem`; markdown-lite bold/italic support
- Single scroll area containing prose block + choice cards; gauge strip is the only fixed/sticky element
- CharacterSheet triggered exclusively by tapping anywhere on the gauge strip — no other trigger points
- Dark mode as primary and default visual register; app shell color tokens: `--color-bg: #0f0f0f`, `--color-surface: #1a1a1a`, `--color-text-primary: #f0ece4`, `--color-text-muted: #7a7672`, `--color-accent: story-defined`, `--color-danger: #c0392b`
- Dub Camp act palette overrides: Afternoon (`#1a1208` bg / `#e8a42a` accent), Golden hour (`#160e0a` / `#e8622a`), Night (`#080810` / `#7c5cbf`), Late night (`#0a0c0e` / `#4a7a8a`)
- Inter for all mechanical UI elements (gauge labels, stat names, profile screen, score reveal); Lora for all prose
- Story resume on return: player dropped back into exact paragraph, correct act theme applied, no prompts or loading screen

### FR Coverage Map

FR1: Epic 3 — Character profile creation screen, story-configured stats
FR2: Epic 3 — Example profile archetypes displayed during character creation
FR3: Epic 3 — Profile screen adapts to story-defined stat names, count, point budget
FR4: Epic 3 — Story paragraphs rendered as flowing prose
FR5: Epic 3 — Player selects a choice from story-defined options
FR6: Epic 3 — Character sheet accessible on demand without leaving the story
FR7: Epic 3 — Inventory visible in character sheet
FR8: Epic 2 — Engine tracks and updates gauges in response to choices
FR9: Epic 2 — Natural gauge decay applied at story-defined nodes
FR10: Epic 2 — Weighted probabilistic outcome resolution, invisible to player
FR11: Epic 2 — Player stats influence gauge arithmetic and outcome weighting
FR12: Epic 2 — Game Over condition evaluation at story-defined trigger points
FR13: Epic 2 — Hidden score gauge tracked throughout session
FR14: Epic 2 — Inventory changes enforced at story-defined events
FR15: Epic 3 — Narrative outcome presented at story completion per score tiers
FR16: Epic 3 — Score gauge value shown at Game Over or story end
FR17: Epic 3 — Player can replay from beginning after completion or Game Over
FR18: Epic 2 — Full story state reset on replay initiation
FR19: Epic 2 — Auto-save to localStorage after every choice
FR20: Epic 2 — Resume from exact paragraph with all state fully restored
FR21: Epic 2 — Saved progress survives browser close, tab switch, device lock
FR22: Epic 2 — Fully playable offline after initial story load
FR23: Epic 2 — All player state stored locally, no account or network dependency
FR24: Epic 3 — Story-defined visual theme applied at story load
FR25: Epic 3 — Act-based theme transitions at story-defined boundaries
FR26: Epic 3 — Dark mode as primary and default visual register
FR27: Epic 3 — Reading experience correct on mobile viewport sizes
FR28: Epic 4 — Author defines complete story in JSON config outside the app
FR29: Epic 2 — Story config loaded from public/stories/ at startup
FR30: Epic 2 — Story JSON validated for schema correctness and referential integrity
FR31: Epic 2 — Developer-facing error on invalid story config; never shown to players
FR32: Epic 2 — All gauge properties defined in story config; engine uses no hardcoded values
FR33: Epic 2 — All stat properties defined in story config; profile screen renders from config
FR34: Epic 2 — All weighted outcome parameters defined in story config
FR35: Epic 1 — JSON Story Format Specification document as standalone v1 deliverable

## Epic List

### Epic 1: Story Format Specification & Project Foundation
The JSON story format spec (FR35) is authored and complete — sufficient for an LLM to translate a structured story document into valid JSON without additional guidance. All project dependencies (shadcn/ui, Vitest, Lora + Inter fonts, design token baseline, `public/stories/` directory) are installed and configured. Engine TypeScript interfaces are defined in `engine/types.ts`. The project compiles cleanly and is ready for engine implementation.
**FRs covered:** FR35
**NFRs addressed:** Architectural foundation for all NFRs

### Epic 2: Story Engine — Core Mechanics & Persistence
The complete pure TypeScript story engine is implemented and fully verified. All gauge arithmetic, natural decay, weighted outcome resolution, Game Over threshold evaluation (all 4 Dub Camp paths), hidden score tracking, inventory management, localStorage persistence, story config loading, and schema validation work correctly. The `useStoryEngine` React hook wires the engine to the component layer. The Vitest test suite covers all 53 Dub Camp paragraphs, all 4 Game Over paths, and all decay sequences.
**FRs covered:** FR8–FR14, FR18–FR23, FR29–FR34
**NFRs addressed:** NFR1 (200ms — synchronous pure-TS engine), NFR3–4 (offline after load — persistence layer), NFR10–12 (reliability, no silent failures, dev error on invalid config)

### Epic 3: Player Experience — Complete UI
The complete player-facing interface is implemented: character profile creation (story-configured), story reader with prose and choice cards, sticky gauge strip, on-demand character sheet, end screen with score tier reveal, replay flow, dark mode as default, act-based visual theming via CSS custom properties, and full mobile responsiveness. The experience holds on a 375px portrait viewport with no layout breakage.
**FRs covered:** FR1–FR7, FR15–FR17, FR24–FR27
**NFRs addressed:** NFR2 (single-frame theme transitions), NFR5 (320–428px layout), NFR6–9 (WCAG AA, touch targets, font size, colour-not-only)

### Epic 4: Dub Camp — Live Story
`dubcamp-histoire-v08.md` is translated into a valid `public/stories/dub-camp.json` using the FR35 spec. The JSON passes schema validation and all paragraph ID integrity checks. All 4 act palette transitions, all 10 weighted outcome moments, all 4 Game Over paths, and the voluntary exit (§41) are exercised in the live app. The experience is verified end-to-end on a real mobile device (Anthony, commute conditions).
**FRs covered:** FR28
**NFRs addressed:** End-to-end validation of all NFRs under real conditions

---

## Epic 1: Story Format Specification & Project Foundation

The JSON story format spec (FR35) is authored and complete — sufficient for an LLM to translate a structured story document into valid JSON without additional guidance. All project dependencies (shadcn/ui, Vitest, Lora + Inter fonts, design token baseline, `public/stories/` directory) are installed and configured. Engine TypeScript interfaces are defined in `engine/types.ts`. The project compiles cleanly and is ready for engine implementation.

### Story 1.1: Install Dependencies & Configure Project Scaffold

As a developer,
I want all required dependencies installed and configured (shadcn/ui, Vitest, Lora + Inter fonts, design token baseline, `public/stories/` directory),
So that the project compiles cleanly and every subsequent story has a ready-to-use foundation.

**Acceptance Criteria:**

**Given** the project is initialized via `create-next-app`
**When** the setup story is complete
**Then** `npx shadcn@latest init` has been run and `components.json` is committed
**And** `vitest` and `@vitest/ui` are installed as dev dependencies with a `vitest.config.ts` at project root that targets `engine/**/*.test.ts`
**And** `app/layout.tsx` loads Lora (body) and Inter (UI) via `next/font/google` with no fallback to Geist
**And** `app/globals.css` defines the full app shell `@theme` token set: `--color-bg: #0f0f0f`, `--color-surface: #1a1a1a`, `--color-text-primary: #f0ece4`, `--color-text-muted: #7a7672`, `--color-accent: #d4935a`, `--color-danger: #c0392b`, prose type scale (20px Lora body, Inter UI), and base reading layout (`max-width: 65ch`, `padding: 0 1.5rem`)
**And** `public/stories/` directory exists in the repo (with a `.gitkeep` if empty)
**And** `npm run dev` starts without errors; `npx vitest` runs without errors (0 tests is acceptable)

### Story 1.2: Define Engine TypeScript Interfaces

As a developer,
I want all shared TypeScript interfaces defined in `engine/types.ts`,
So that every subsequent engine implementation story works against a single, authoritative type contract with no ambiguity about field names or shapes.

**Acceptance Criteria:**

**Given** `engine/types.ts` is created
**When** the story is complete
**Then** the file exports: `StoryConfig`, `StoryMeta`, `StatDefinition`, `GaugeDefinition`, `ActDefinition`, `DecayRule`, `Paragraph`, `Choice`, `WeightedOutcome`, `GaugeEffect`, `EndStateTier`, `EngineState`, `SaveState`, `StoryValidationError` (extends `Error`), `EngineError` (extends `Error`)
**And** `EngineState` matches the canonical shape exactly: `{ storyId, paragraphId, gauges: Record<string, number>, stats: Record<string, number>, act: string, inventory: string[], score: number, isGameOver: boolean, gameOverParagraphId: string | null, isComplete: boolean }`
**And** `SaveState` shape is: `{ storyId, version: number, savedAt: number, engineState: EngineState }`
**And** `GaugeDefinition` includes: `id`, `name`, `icon`, `initialValue`, `isScore`, `isHidden`, `gameOverThreshold?: number`, `gameOverCondition?: 'above' | 'below'`
**And** all fields use camelCase naming; all boolean flags use `is`/`has` prefix convention
**And** `engine/types.ts` has zero imports from `components/`, `hooks/`, `app/`, or `lib/` — it is a pure type definition file
**And** `npm run build` (or `tsc --noEmit`) passes with zero type errors

### Story 1.3: Author JSON Story Format Specification (FR35)

As a story author (Anthony),
I want a complete `docs/story-format-spec.md` reference document that defines every field of the story JSON schema,
So that I can translate `dubcamp-histoire-v08.md` into a valid `dub-camp.json` using an LLM prompt without needing any additional context or guidance.

**Acceptance Criteria:**

**Given** `docs/story-format-spec.md` is created
**When** the document is complete
**Then** every field in `StoryConfig` (from `engine/types.ts`) is documented with: field name, TypeScript type, whether required or optional, description of purpose, and a concrete example value
**And** the spec documents the weighted outcome risk formula: `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier` and the probability table (Risk < 30 → 90%, 30–55 → 60%, 55–75 → 40%, > 75 → 20%)
**And** the spec documents natural decay: which paragraph IDs trigger decay, and the amounts per gauge (`Énergie -7`, `Alcool -12`, `Fumette -8`, `Nourriture -10` reduced by `max(3, 10 − Estomac × 1.5)`, plus 6% passive risk of `-8⚡`)
**And** the spec documents act definition: how `paragraphIds[]` triggers act transitions and how `theme` overrides CSS custom properties
**And** the spec documents Game Over conditions: both threshold-based (`gaugeLevel > threshold`) and probabilistic (e.g. §50 heat: 20% chance if `⚡ < 22%`)
**And** the spec includes a complete worked example showing a 3-paragraph mini-story with 1 gauge, 1 stat, 1 weighted outcome, and 1 Game Over condition as valid JSON
**And** an LLM given only `dubcamp-histoire-v08.md` and this spec document could produce a valid `dub-camp.json` without asking any clarifying questions

---

## Epic 2: Story Engine — Core Mechanics & Persistence

The complete pure TypeScript story engine is implemented and fully verified. All gauge arithmetic, natural decay, weighted outcome resolution, Game Over threshold evaluation (all 4 Dub Camp paths), hidden score tracking, inventory management, localStorage persistence, story config loading, and schema validation work correctly. The `useStoryEngine` React hook wires the engine to the component layer. The Vitest test suite covers all 53 Dub Camp paragraphs, all 4 Game Over paths, and all decay sequences.

### Story 2.1: Story Config Loader & Validator

As a developer,
I want `engine/storyValidator.ts` to load and validate a story JSON config at startup,
So that malformed configs or broken paragraph references surface a clear developer-facing error before the player experience ever loads.

**Acceptance Criteria:**

**Given** a JSON file exists in `public/stories/`
**When** `storyValidator.ts` processes the file
**Then** it validates the top-level shape matches `StoryConfig` (all required fields present and correctly typed)
**And** it validates referential integrity: every `choice.targetParagraphId` references an existing key in `paragraphs`
**And** it validates every ID in `decayNodes[]` references an existing paragraph ID
**And** it validates every `actDefinition.paragraphIds[]` entry references an existing paragraph ID
**And** if validation fails, it throws `StoryValidationError` with a message identifying the specific failing field or reference
**And** `app/page.tsx` fetches the story JSON via `fetch('/stories/dub-camp.json')`, passes it to the validator, and renders `<DevErrorScreen error={e} />` if `StoryValidationError` is caught — the player UI is never loaded in an invalid state (NFR12)
**And** `DevErrorScreen.tsx` is a simple component that displays the error message — it is never rendered in a valid production state
**And** `engine/storyValidator.ts` has no imports from `components/`, `hooks/`, or `app/`

**Given** a story JSON config contains `ActDefinition[]` with theme overrides
**When** `storyValidator.ts` processes the act definitions
**Then** for each `ActDefinition`, it validates that the `theme` accent color satisfies WCAG AA contrast ratio (4.5:1 minimum) against the `theme` background color
**And** if any act fails the contrast check, it throws `StoryValidationError` identifying the failing act id and the computed contrast ratio
**And** this validation runs at startup alongside all other config checks — never at runtime during play (NFR8)

### Story 2.2: Gauge System — Arithmetic, Clamping & Decay

As a developer,
I want `engine/gaugeSystem.ts` to implement all gauge arithmetic including bounds enforcement and natural decay,
So that gauge values always stay within [0, 100] and decay fires correctly at story-defined nodes.

**Acceptance Criteria:**

**Given** a `GaugeDefinition[]` from story config and a `gauges: Record<string, number>` state
**When** `applyGaugeEffects(gauges, effects, stats, config)` is called
**Then** it applies each `GaugeEffect` delta to the correct gauge keyed by `GaugeDefinition.id`
**And** it applies stat influence to gauge arithmetic as defined by story config (e.g. Endurance reduces energy cost)
**And** all resulting values are immediately clamped to [0, 100] — never deferred
**And** the function returns a new `Record<string, number>` — it never mutates in place

**Given** the current paragraph ID is in `storyConfig.decayNodes`
**When** `applyDecay(gauges, decayRules, stats, config)` is called
**Then** it applies each `DecayRule` delta to the correct gauge (keyed by `GaugeDefinition.id`)
**And** Nourriture decay is reduced by `max(3, 10 − Estomac × 1.5)` as per Dub Camp rules
**And** the passive 6% risk of `-8⚡` is evaluated using `Math.random()`
**And** all values are clamped to [0, 100] after decay
**And** the function returns a new state object — no mutation

**Given** any gauge arithmetic operation
**When** a computed value would exceed 100 or fall below 0
**Then** `clamp(value, 0, 100)` in `lib/utils.ts` is always the enforcement mechanism — no inline bounds checks elsewhere

### Story 2.3: Weighted Outcome Resolution

As a developer,
I want `engine/weightedOutcome.ts` to resolve probabilistic outcomes using the risk formula from the story config,
So that tension moments produce a good or bad result with probabilities that correctly reflect the player's gauge state and stats — invisibly.

**Acceptance Criteria:**

**Given** a `WeightedOutcome` definition from a paragraph in story config
**When** `resolveOutcome(outcome, gauges, stats, config)` is called
**Then** it computes `Risk = gaugeLevel − (associatedStat × 15) + hungerModifier`
**And** the hunger modifier is: `+0` if Nourriture > 50%, `+10` if 25–50%, `+25` if < 25%
**And** it maps Risk to probability: `< 30 → 90% good`, `30–55 → 60%`, `55–75 → 40%`, `> 75 → 20%`
**And** it calls `Math.random()` exactly once and returns `'good'` or `'bad'`
**And** no probability values, risk scores, or random numbers are ever exposed outside this module
**And** `engine/weightedOutcome.ts` has zero imports from `components/`, `hooks/`, or `app/`

### Story 2.4: Core Story Engine

As a developer,
I want `engine/storyEngine.ts` to implement the complete story engine API (`initEngine`, `resolveChoice`, `applyDecay`, `getState`, `serialize`, `reset`),
So that all game mechanics — choice resolution, decay, Game Over evaluation, act transitions, score tracking, inventory changes — execute in the correct strict order.

**Acceptance Criteria:**

**Given** a validated `StoryConfig` and optional `SaveState`
**When** `initEngine(config, savedState?)` is called
**Then** if `savedState` is valid (version === 1, storyId matches, paragraphId exists in config, all EngineState fields present) → engine initializes from saved state
**And** if `savedState` is invalid or absent → engine initializes fresh with gauge initial values from config, act from first act definition
**And** `getState()` returns the current `EngineState` as a new object — no direct state reference returned

**Given** the engine is initialized and a choice is made
**When** `resolveChoice(choiceId)` is called
**Then** it executes in strict order: (1) apply choice gauge effects, (2) resolve weighted outcome if present, (3) clamp all gauges [0,100], (4) evaluate Game Over conditions in config order — if triggered → set `isGameOver: true`, `gameOverParagraphId`, and STOP, (5) if not Game Over → evaluate act transition, (6) advance `paragraphId` to choice target
**And** Game Over is ALWAYS evaluated before act transition — no exceptions
**And** inventory changes defined on the choice are applied before Game Over evaluation
**And** `resolveChoice` returns the new `EngineState`

**Given** the current paragraph is a decay node
**When** `applyDecay()` is called
**Then** it executes: (1) apply decay amounts, (2) clamp gauges, (3) evaluate Game Over — if triggered → set `isGameOver: true`, STOP, (4) evaluate act transition
**And** decay fires AFTER choice effects on the same node — never before

**Given** the player initiates replay
**When** `reset()` is called
**Then** all engine state resets to initial values: `isGameOver: false`, `isComplete: false`, all gauges reset to `initialValue` from config
**And** `engine/storyEngine.ts` has zero imports from `components/`, `hooks/`, or `app/`

### Story 2.5: Persistence, Theme Manager & useStoryEngine Hook

As a developer,
I want `engine/persistence.ts`, `engine/themeManager.ts`, and `hooks/useStoryEngine.ts` implemented,
So that every engine state mutation is immediately persisted to localStorage, CSS custom properties are updated on `:root`, and React components receive reactive engine state without calling engine methods directly.

**Acceptance Criteria:**

**Given** `engine/persistence.ts` is implemented
**When** `persistence.save(engineState, storyId)` is called
**Then** it writes `SaveState { storyId, version: 1, savedAt: Date.now(), engineState }` to `localStorage.setItem('tree-story:save', JSON.stringify(saveState))`
**And** `persistence.load()` returns a validated `SaveState` or `null` — returning `null` silently for: missing key, JSON parse error, version ≠ 1, any required field missing or wrong type
**And** `persistence.clear()` calls `localStorage.removeItem('tree-story:save')`

**Given** `engine/themeManager.ts` is implemented
**When** `themeManager.apply(act, storyConfig)` is called
**Then** it looks up the `ActDefinition` for the given `act` id and calls `document.documentElement.style.setProperty(name, value)` for each CSS custom property in the act's `theme` object
**And** `themeManager.ts` is the ONLY file in the codebase that calls `document.documentElement.style.setProperty`

**Given** `hooks/useStoryEngine.ts` is implemented
**When** `StoryReader` mounts
**Then** the engine is instantiated exactly once via `useRef` — never recreated on re-render
**And** on mount: `persistence.load()` is called; if valid `SaveState` exists with matching `storyId` and existing `paragraphId` → init from saved state; otherwise fresh start (silent to player)
**And** after every engine mutation (`resolveChoice`, `applyDecay`, `reset`): `setEngineState(engine.getState())`, `persistence.save()`, and `themeManager.apply()` are all called
**And** the hook exposes: `{ engineState, resolveChoice, applyDecay, resetEngine }` — components never call engine methods directly

### Story 2.6: Engine Test Suite

As a developer,
I want a Vitest test suite in `engine/storyEngine.test.ts` that exercises the complete Dub Camp paragraph graph,
So that all gauge arithmetic, decay sequences, weighted outcome resolution, and Game Over conditions are verified before any UI is built.

**Acceptance Criteria:**

**Given** `engine/storyEngine.test.ts` exists
**When** `npx vitest run` is executed
**Then** all tests pass with zero failures
**And** the test suite covers:
- All 4 Game Over paths are reachable: §201 (trop bu trop tôt), §202 (dans le gaz), §203 (alcool + low Nourriture), §204 (épuisement)
- Gauge clamping: values never exceed 100 or fall below 0 regardless of input
- Decay fires at all defined decay nodes (§20, §40, §50, §60, §70) and not at non-decay nodes
- Decay fires AFTER choice effects on same-node choices
- Game Over is evaluated BEFORE act transition in all cases
- Nourriture decay respects Estomac stat formula `max(3, 10 − Estomac × 1.5)`
- Voluntary exit §41 awards Kiff +5 and bypasses all Game Over checks
- §EVT1 fires with 1-in-3 probability (mock `Math.random` to test both branches)
- State serialization round-trips correctly: `serialize()` → `persistence.save()` → `persistence.load()` → `initEngine(config, savedState)` restores identical `EngineState`
- Corrupt/mismatched saves return `null` from `persistence.load()`
**And** tests use a Dub Camp story config fixture matching the schema (full JSON translation comes in Epic 4)

---

## Epic 3: Player Experience — Complete UI

The complete player-facing interface is implemented: character profile creation (story-configured), story reader with prose and choice cards, sticky gauge strip, on-demand character sheet, end screen with score tier reveal, replay flow, dark mode as default, act-based visual theming via CSS custom properties, and full mobile responsiveness.

### Story 3.1: App Shell, Design Tokens & Dark Mode Foundation

As a player,
I want the app to load with a correct dark mode visual foundation and the right typography,
So that the reading environment feels polished and intentional from the very first render.

**Acceptance Criteria:**

**Given** the app loads in a browser
**When** the page renders
**Then** the background is `#0f0f0f` and prose text is `#f0ece4` — meeting WCAG AA contrast (NFR6)
**And** Lora is applied to all prose content at 20px minimum; Inter is applied to all UI/mechanical elements (NFR9)
**And** CSS custom properties `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger` are defined on `:root` and drive all color usage — no hardcoded hex values in component files
**And** the reading column is centered with `max-width: 65ch` and `padding: 0 1.5rem`
**And** the layout holds without horizontal scroll at 320px, 375px, and 428px viewport widths (NFR5)
**And** dark mode is the default — no light mode toggle, no `prefers-color-scheme` dependency for the base experience

### Story 3.2: Character Profile Creation Screen

As a player,
I want to distribute stat points across story-defined stats before the story begins,
So that my character feels like mine and I understand (without instructions) how the session will play differently.

**Acceptance Criteria:**

**Given** the app has loaded a valid story config
**When** the ProfileCreation screen renders
**Then** it displays exactly the stats defined in `storyConfig.stats` — no hardcoded stat names, no hardcoded count (FR3)
**And** it shows the total point budget from `storyConfig.statPointBudget` with a live remaining-points counter
**And** each stat has `+` and `−` controls that are disabled at 0 (floor) or at `maxPerStat` from config (ceiling)
**And** the Start button is enabled only when all points are allocated (remaining === 0)
**And** example profiles from `storyConfig.meta.exampleProfiles` are displayed to guide allocation (FR2)
**And** tapping Start passes the stat allocation to `useStoryEngine` and advances to the StoryReader
**And** all controls meet the 44px minimum touch target height (NFR7)
**And** the screen uses Inter for all labels and controls — no Lora on the profile screen

### Story 3.3: Gauge Strip

As a player,
I want to see my current gauge states in a persistent strip at the top of the screen,
So that I can glance at my status without interrupting reading — and never have to calculate anything.

**Acceptance Criteria:**

**Given** the StoryReader is active
**When** the gauge strip renders
**Then** it is `position: sticky; top: 0` — visible during scroll, never moves
**And** it renders exactly the gauges from `storyConfig.gauges` where `isHidden === false` — the score gauge (Kiff) is never shown during play (FR13)
**And** each gauge renders as: emoji icon (17px, from `GaugeDefinition.icon`) centered above a horizontal fill bar (7px height, 4px border-radius)
**And** bar fill percentage maps directly to gauge value [0–100] — no numeric labels anywhere (FR — mechanics invisible)
**And** tapping anywhere on the gauge strip opens the CharacterSheet — this is the only trigger for CharacterSheet
**And** the entire gauge strip is a touch target of at least 44px height (NFR7)
**And** gauge bar colors use `--color-accent` from the current act theme (FR24, FR25)

### Story 3.4: Story Reader — Prose & Choice Cards

As a player,
I want to read story paragraphs and tap a choice to advance the narrative,
So that the experience feels like reading a well-designed article that forks — not like playing a game.

**Acceptance Criteria:**

**Given** the engine state has a current paragraph ID
**When** `ParagraphDisplay` renders
**Then** it renders the paragraph's `content` as flowing prose in 20px Lora, left-aligned, 1.72 line-height, `max-width: 65ch`
**And** it supports markdown-lite inline formatting: `**bold**` and `*italic*` — no other markdown syntax
**And** no chapter markers, section headers, or paragraph IDs are visible to the player

**Given** the current paragraph has a `choices[]` array
**When** `ChoiceCards` renders
**Then** it renders each choice as a full-width card stacked vertically below the prose block
**And** each card has: `border-radius: 8px`, `border: 1px solid rgba(255,255,255,0.08)`, `padding: 16px 20px`, `min-height: 48px` (NFR7)
**And** tapping a card calls `resolveChoice(choiceId)` — no confirmation dialog, no delay
**And** the next paragraph renders within 200ms of the tap (NFR1)
**And** prose and choice cards share the same scroll container — no split-scroll, no floating bottom bar
**And** `StoryReader.tsx` is the sole consumer of `useStoryEngine` — all children receive engine state as props only

### Story 3.5: Character Sheet & Inventory

As a player,
I want to view my full character state (all gauges, stats, and inventory) on demand without leaving the story,
So that I can check where I stand without being pulled out of the reading experience.

**Acceptance Criteria:**

**Given** the player taps the gauge strip
**When** the CharacterSheet opens
**Then** it slides up as a shadcn `Sheet` overlay — it overlays the story screen, it does not replace it
**And** it shows ALL gauges including the score gauge (Kiff) as fill bars — no raw numbers (FR6)
**And** it shows all player stats with their allocated values using Inter typography
**And** it shows the current inventory as a list of item names — empty state shows a neutral message if no items (FR7)
**And** tapping outside the sheet or a close control dismisses it and returns to the story
**And** opening and closing the sheet triggers no engine state changes or localStorage writes

### Story 3.6: End Screen & Replay Flow

As a player,
I want to see my outcome when the story ends — and replay immediately if I want to,
So that reaching a Game Over or story completion feels like a complete experience, not a dead end.

**Acceptance Criteria:**

**Given** `engineState.isGameOver === true`
**When** `EndScreen` renders
**Then** it displays the narrative Game Over paragraph content from `gameOverParagraphId` as prose
**And** it reveals the Kiff score value for the first time (FR16)
**And** it displays a single replay CTA — no other navigation chrome

**Given** `engineState.isComplete === true`
**When** `EndScreen` renders
**Then** it matches `engineState.score` against `storyConfig.endStateTiers` and displays the matching narrative outcome text as prose (FR15)
**And** it reveals the Kiff score value (FR16)
**And** it displays a replay CTA

**Given** the player taps the replay CTA
**When** the replay flow executes
**Then** `resetEngine()` is called first — engine state resets AND `persistence.clear()` is called atomically
**And** navigation to `ProfileCreation` happens ONLY after `reset()` resolves — never before
**And** the player arrives at a fresh `ProfileCreation` screen with no trace of the previous session (FR18)

---

## Epic 4: Dub Camp — Live Story

`dubcamp-histoire-v08.md` is translated into a valid `public/stories/dub-camp.json` using the FR35 spec. The JSON passes schema validation and all paragraph ID integrity checks. All 4 act palette transitions, all 10 weighted outcome moments, all 4 Game Over paths, and the voluntary exit (§41) are exercised in the live app. The experience is verified end-to-end on a real mobile device (Anthony, commute conditions).

### Story 4.1: Translate Dub Camp to JSON

As a story author (Anthony),
I want `public/stories/dub-camp.json` authored from `dubcamp-histoire-v08.md` using the `docs/story-format-spec.md` reference,
So that the Dub Camp story is machine-readable by the engine with all 53 paragraphs, mechanics, and theming fully encoded.

**Acceptance Criteria:**

**Given** `dubcamp-histoire-v08.md` and `docs/story-format-spec.md` exist
**When** `public/stories/dub-camp.json` is authored (via LLM-assisted translation + manual review)
**Then** the JSON passes `storyValidator.ts` schema validation with zero errors at app startup
**And** all 53 paragraphs are present as keys in `paragraphs` — §1, §10–§16, §15A, §15B, §16A–§16C, §20, §31–§33, §40, §40A–§40E, §41, §EVT1, §50–§53, §60, §60A, §60B, §61–§63, §61C, §70, §201–§204
**And** all 10 weighted outcome moments are encoded with correct gauge associations and risk formula parameters
**And** all 4 stat definitions are present: `endurance`, `estomac`, `resistanceAlcool`, `resistanceFumette` — each with `maxPerStat: 4`, total `statPointBudget: 8`
**And** all 5 gauge definitions are present: `energie` (initial 100), `alcool` (initial 0), `fumette` (initial 0), `nourriture` (initial 50), `kiff` (initial 0, `isScore: true`, `isHidden: true`)
**And** the 3 example profiles are encoded in `meta.exampleProfiles`: Le Bastien (4/0/2/2), Le Brian (1/1/3/3), L'équilibré (2/2/2/2)
**And** decay nodes are `['s20', 's40', 's50', 's60', 's70']` with correct amounts per gauge including the §50 universal `-10⚡` heat penalty
**And** all 4 act definitions are present with correct `paragraphIds[]` triggers and CSS custom property theme overrides matching the UX spec palette
**And** the 4 end-state tiers are encoded: 100+ pts, 70–99, 40–69, < 40
**And** every `choice.targetParagraphId` resolves to an existing paragraph key (validator confirms this)

### Story 4.2: End-to-End Validation & Mobile Play Test

As a player (Anthony),
I want to play Dub Camp end-to-end on my phone — including a Game Over path and a full completion — under real commute conditions,
So that every journey in the PRD is verified as working before v1 is considered done.

**Acceptance Criteria:**

**Given** `dub-camp.json` is live in the deployed Vercel app
**When** the end-to-end validation is run
**Then** Journey 1 (first-time player, success path) is completable: URL opens → profile creation → reading → choices → gauge updates visible → session close and resume at exact paragraph → story completion → score tier narrative displayed
**And** Journey 2 (Game Over + replay) is completable: a path to each of the 4 Game Over endings (§201–§204) is reachable → Game Over narrative shown → Kiff score revealed → replay returns to fresh ProfileCreation
**And** Journey 3 (authoring) is confirmed: `dub-camp.json` was produced by giving only `dubcamp-histoire-v08.md` + `docs/story-format-spec.md` to an LLM — confirming the spec is complete enough without additional guidance (FR35)
**And** the mobile play test confirms on mid-range Android Chrome:
- App opens directly to story — no splash, no signup
- Choice tap → next paragraph renders within 200ms (NFR1)
- Act transitions Afternoon → Golden hour → Night → Late night are imperceptible as UI events (NFR2)
- Session close and reopen lands at exact paragraph with correct act theme, no prompt (FR20, FR21)
- Layout holds at 375px portrait — no horizontal scroll, no breakage (NFR5)
- All gauge bars update correctly and Kiff is never visible during play (FR13)
- App is fully playable offline after first load — fonts and story assets preloaded (NFR4)
**And** `npx vitest run` passes with zero failures after `dub-camp.json` is added (no regressions)
