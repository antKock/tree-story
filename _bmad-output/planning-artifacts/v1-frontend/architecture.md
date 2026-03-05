---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-03-01'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-tree-story-2026-03-01.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - dubcamp-histoire-v08.md
workflowType: 'architecture'
project_name: 'tree-story'
user_name: 'Anthony'
date: '2026-03-01'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

35 FRs across 7 capability areas. The most architecturally significant cluster is the Game Engine group (FR8–FR14), which defines the core state machine: gauge tracking and arithmetic, natural decay at story-defined nodes, weighted probabilistic outcome resolution, stat influence on weighting, Game Over threshold evaluation, hidden score gauge tracking, and inventory change enforcement. These are not UI requirements — they are pure engine logic that must be isolated, tested, and validated against Dub Camp's 53-paragraph graph before any UI is wired.

The Story Configuration group (FR28–FR35) establishes that the engine must be fully data-driven: no hardcoded story values anywhere. The JSON Story Format Specification (FR35) is a v1 deliverable, not an implementation note.

**Non-Functional Requirements:**

- **Performance (NFR1–NFR5):** 200ms choice resolution end-to-end; act transition in one rendering frame; story assets in one network round-trip; fully offline after initial load; layout holds 320px–428px
- **Accessibility (NFR6–NFR9):** WCAG AA contrast in dark mode; 44px minimum touch targets; story accent colors validated at config load time, not runtime; minimum 20px prose
- **Reliability (NFR10–NFR12):** Progress survives all normal browser behaviour; no silent engine failures mid-story; invalid story config produces a developer-readable error at startup and never loads the player experience

**Scale & Complexity:**

- Primary domain: Client-side SPA with a custom story engine layer
- Complexity level: Medium — engine logic is the complexity spike; infrastructure is minimal (no backend, no auth, no external APIs)
- Estimated architectural components: ~7 distinct concerns

### Technical Constraints & Dependencies

- **Next.js app router** — confirmed in PRD; static generation where possible, client components for engine state
- **Tailwind CSS + shadcn/ui** — confirmed in UX spec; Tailwind config as single token source; shadcn/ui for behavioral primitives (Sheet for character panel) only
- **localStorage only** — all player state client-side; no server-side state whatsoever
- **No authentication, no external APIs, no analytics** — fully self-contained
- **Google Fonts (Lora + Inter)** — must be preloaded to satisfy NFR4 (offline after first load)
- **CSS custom properties on `:root`** — runtime theme updates; no component-level hardcoded colors

### Cross-Cutting Concerns Identified

| Concern | Affected Components |
|---|---|
| **Story engine state** (gauges, paragraph position, stats, act, inventory, score) | Engine, persistence, rendering, theme manager, end-state resolver |
| **localStorage serialization** | Persistence layer, replay/reset flow, resume detection |
| **Story config validation** | Loader, developer error surface — runs at startup, blocks app if invalid |
| **CSS custom properties runtime updates** | Theme manager, gauge rendering, act transition detection |
| **Weighted outcome resolution** | Engine — risk formula uses gauge levels + stat values + hunger modifier |
| **Gauge bounds enforcement** | Engine — all gauge values must clamp to [0, 100]; Game Over evaluation order matters |
| **Error boundaries** | Engine (invalid state), loader (malformed JSON, missing paragraph refs), rendering (undefined paragraph) |
| **Dub Camp-specific engine realities** | Non-sequential paragraph IDs; probabilistic random event (§EVT1, 1-in-3); voluntary early exit (§41); 4 distinct Game Over paths with different threshold conditions |

---

## Starter Template Evaluation

### Primary Technology Domain

Client-side SPA with a custom story engine layer — Next.js app router, all player state in localStorage, no backend.

### Starter: Already Initialized via create-next-app

The project was initialized with `create-next-app`. No new initialization required.

**Initialization Command (already run):**
```bash
npx create-next-app@latest tree-story --typescript --tailwind --eslint --app
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript 5 + React 19 + Next.js 16 — app router, server components where static, client components for engine state.

**Styling Solution:** Tailwind CSS v4 — CSS-first configuration via `@theme` directive in `globals.css`. This is the design token source of truth (replaces `tailwind.config.js` from v3). Runtime theming via `document.documentElement.style.setProperty()` on CSS custom properties — compatible with the story act-transition system.

**Build Tooling:** Next.js built-in (Turbopack in dev). No additional configuration required.

**Testing Framework:** Not included — to be added (Vitest for story engine unit tests).

**Code Organization:** `app/` at root, no `src/` wrapper. App router file conventions apply.

**Development Experience:** Hot reloading via Turbopack, TypeScript strict mode, ESLint 9.

**Still to add:**
- shadcn/ui: `npx shadcn@latest init` — Sheet for character panel
- Lora + Inter via `next/font/google` — replace default Geist
- `public/stories/` directory for JSON story configs
- Vitest for engine unit testing

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Story engine architecture: pure TypeScript module, React as thin rendering layer
- Story config loading: `public/stories/` + fetch, JSON files
- localStorage design: single key `tree-story:save`, full state snapshot

**Important Decisions (Shape Architecture):**
- Hosting: Vercel (already connected to GitHub)
- Testing: Vitest for engine unit tests only

**Deferred Decisions (Post-MVP):**
- E2E testing (Playwright) — post-v1
- State management evolution (Zustand/Redux) — only if pure engine approach proves limiting
- Story library / multi-story selection UI — Phase 2

### Data Architecture

**localStorage — Single Key, Full State Snapshot**
- Key: `tree-story:save`
- Shape: `{ storyId, paragraphId, gauges, stats, act, inventory, score }`
- Written after every choice (atomic); wiped in full on replay
- On restore: validate key fields exist and storyId matches loaded story config; surface developer error if corrupt, start fresh if player-facing
- Provided by Starter: No

**Story Config Loading — `public/stories/` + fetch**
- Story JSON files live in `public/stories/` (e.g. `public/stories/dub-camp.json`)
- Fetched client-side at story start; validated against schema before engine init
- Supports future story library: add JSON file, no build step required
- Aligns with LLM-assisted authoring workflow (Journey 3): output is a JSON file, dropped directly into `public/stories/`
- Provided by Starter: No

### Authentication & Security

Not applicable. No authentication, no backend, no user data leaves the device. All state is local and ephemeral.

### API & Communication Patterns

Not applicable. No API. The only "communication" is:
- `fetch('/stories/dub-camp.json')` at story start (one request, then offline)
- `localStorage.setItem()` / `localStorage.getItem()` for persistence

### Frontend Architecture

**Story Engine — Pure TypeScript Module**
- The story engine is a framework-agnostic TypeScript module with no React dependency
- Responsible for: paragraph resolution, gauge arithmetic (with bounds clamping [0,100]), weighted outcome resolution (risk formula + Math.random()), natural decay application at story-defined nodes, Game Over condition evaluation, act transition detection, score tracking
- Exposes a clean API surface: `initEngine(storyConfig, savedState?)`, `resolveChoice(choiceId)`, `applyDecay()`, `getState()`, `serialize()`, `reset()`
- React adapter: a single `useStoryEngine` hook that holds engine instance in a ref, exposes reactive state via `useState`, and handles localStorage sync
- Theme manager: reads act from engine state, updates CSS custom properties on `document.documentElement` — called from the hook after every state change
- Provided by Starter: No

**Component Architecture**
- App shell (server component): loads story config, renders layout
- StoryReader (client component): owns `useStoryEngine`, renders gauge strip + prose + choice cards
- GaugeStrip: pure display, receives gauge array from engine state
- ParagraphDisplay: renders prose content (markdown-lite: bold/italic)
- ChoiceCards: renders choices array, dispatches tap to engine
- CharacterSheet (shadcn Sheet): slides up on demand, shows stats + all gauges
- EndScreen: displays score tier narrative + replay CTA
- Provided by Starter: Partial (shadcn Sheet)

### Infrastructure & Deployment

**Hosting: Vercel**
- Already connected to GitHub repository
- Push to main = production deployment, automatic
- Free tier covers v1 scope entirely
- Preview URLs per branch for testing before merge

**Testing: Vitest (engine only)**
- Vitest for pure TypeScript engine module unit tests
- Test surface: gauge arithmetic, decay application, weighted outcome resolution, Game Over threshold evaluation (all 4 paths), state serialization, act transition detection
- Acceptance criterion: all 53 Dub Camp paragraphs reachable, all 4 Game Over paths triggerable, all gauge decay sequences correct
- No E2E testing for v1
- Install: `npm install -D vitest`

### Decision Impact Analysis

**Implementation Sequence:**
1. Define story JSON schema + validate against Dub Camp structure
2. Build pure TS engine module + Vitest test suite (validate against full Dub Camp graph)
3. Build `useStoryEngine` hook (localStorage sync + theme manager wired in)
4. Build UI components (GaugeStrip, ParagraphDisplay, ChoiceCards, CharacterSheet, EndScreen)
5. Wire fonts (Lora + Inter via `next/font`), design tokens (`globals.css` `@theme`)
6. Add shadcn/ui (`npx shadcn@latest init`), configure Sheet
7. Translate Dub Camp story document → JSON using spec
8. End-to-end play test on mobile

**Cross-Component Dependencies:**
- Engine module has no dependencies — built and tested first
- `useStoryEngine` hook depends on engine module + localStorage
- Theme manager depends on engine state (act field)
- All UI components depend on `useStoryEngine`
- EndScreen depends on story config (score tiers) + engine state (score value)
- CharacterSheet depends on story config (stat definitions) + engine state

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points: 14 identified

### Naming Patterns

**File & Directory Naming:**
- React components: PascalCase files (`StoryReader.tsx`, `GaugeStrip.tsx`)
- Hooks: camelCase with `use` prefix (`useStoryEngine.ts`)
- Engine modules: camelCase (`storyEngine.ts`, `gaugeSystem.ts`, `themeManager.ts`)
- Utilities: camelCase (`clamp.ts`, `weightedRandom.ts`)
- Types/interfaces: PascalCase in dedicated files (`engine/types.ts`)
- Test files: co-located with `.test.ts` suffix (`storyEngine.test.ts`)
- Story JSON files: kebab-case (`dub-camp.json`)

**TypeScript Naming:**
- Interfaces: PascalCase, no `I` prefix (`StoryConfig`, `EngineState`, `GaugeDefinition`)
- Types: PascalCase (`WeightedOutcome`, `ActTheme`, `SaveState`)
- Enums: PascalCase with PascalCase values (`GameOverReason.EnergyDepleted`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_STAT_POINTS = 8`)

**JSON Story Schema Field Naming:**
- All fields: camelCase (`paragraphId`, `gaugeEffects`, `weightedOutcome`, `actTrigger`)
- Boolean flags: `is`/`has` prefix (`isGameOver`, `isScoreGauge`, `hasWeightedOutcome`)
- Arrays: plural nouns (`choices`, `gauges`, `stats`, `decayNodes`)

**Record Key Conventions (critical for save state compatibility):**
- `EngineState.gauges` keys = `GaugeDefinition.id` from story config — always
- `EngineState.stats` keys = `StatDefinition.id` from story config — always
- `EngineState.inventory` items = item id strings as defined in story config — always
- Never use `name`, `label`, or any other field as a record key

**CSS Custom Property Naming:**
- App shell tokens: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`
- Story act overrides: same property names — story config overwrites app defaults
- No component-scoped custom properties; all on `:root`

### Structure Patterns

**Engine Module Rule:** Nothing in `engine/` may import from `components/`, `hooks/`, or `app/`. Dependency arrow is one-way: `app → hooks → engine`.

### Format Patterns

**Engine State Shape (canonical):**
```typescript
interface EngineState {
  storyId: string
  paragraphId: string
  gauges: Record<string, number>    // key = GaugeDefinition.id, value [0–100]
  stats: Record<string, number>     // key = StatDefinition.id, value [0–maxPoints]
  act: string                       // current act id
  inventory: string[]               // item ids as defined in story config
  score: number                     // hidden score gauge value
  isGameOver: boolean
  gameOverParagraphId: string | null
  isComplete: boolean
}
```

**localStorage Save Shape:**
```typescript
interface SaveState {
  storyId: string
  version: number          // v1 for all initial implementation
  savedAt: number          // Date.now()
  engineState: EngineState
}
```
Key: `tree-story:save` — single key, always overwritten whole.

**Save Restore Validation Rules (all conditions → discard save, start fresh, silent to player):**
- `SaveState.version !== 1`
- `SaveState.storyId !== loadedStory.id`
- Restored `paragraphId` not found in story config paragraphs
- Any required `EngineState` field is missing or wrong type

**Story JSON — Top-Level Shape:**
```typescript
interface StoryConfig {
  id: string
  version: number
  meta: StoryMeta
  stats: StatDefinition[]
  gauges: GaugeDefinition[]      // includes isScore, isHidden flags
  acts: ActDefinition[]          // id, paragraphIds[], theme CSS var overrides
  decayNodes: string[]           // paragraph IDs that trigger decay
  decayRules: DecayRule[]        // per-gauge decay amounts
  paragraphs: Record<string, Paragraph>
  endStateTiers: EndStateTier[]  // score ranges → narrative outcomes
}
```

### Communication Patterns

**useStoryEngine Init Rule:**
- Engine instantiated exactly once on mount via `useRef` — never recreated on re-render
- If valid `SaveState` exists AND `storyId` matches AND `paragraphId` exists in config → init with saved state; otherwise init fresh (silent to player)

**Engine ↔ React (via useStoryEngine hook):**
- After every engine mutation: `setEngineState(engine.getState())`, `persistence.save(engine.serialize())`, `themeManager.apply(state.act)`
- Components never call engine methods directly — only through hook-exposed functions

**Gauge Updates — Immutable + Immediate Clamping:**
- Engine always returns new state objects, never mutates in place
- Clamp immediately: `Math.min(100, Math.max(0, value))` — never deferred

**Evaluation Order at a Choice Node (strict):**
1. Apply choice gauge effects
2. Apply weighted outcome resolution (if present)
3. Clamp all gauges to [0, 100]
4. Evaluate Game Over conditions (in config order)
5. If Game Over → set `isGameOver: true`, `gameOverParagraphId`, persist, STOP
6. If NOT Game Over → evaluate act transition, update `act` if changed
7. Persist state

**Evaluation Order at a Decay Node (strict — decay fires after choice effects):**
1. Apply choice gauge effects + weighted outcome (if same-node choice)
2. Apply decay amounts per `decayRules`
3. Clamp all gauges to [0, 100]
4. Evaluate Game Over conditions
5. If Game Over → set `isGameOver: true`, `gameOverParagraphId`, persist, STOP
6. If NOT Game Over → evaluate act transition
7. Persist state

**CharacterSheet Trigger:** Tapping anywhere on GaugeStrip opens CharacterSheet. No other trigger point exists.

**Replay Timing:** Engine stays in terminal state until player taps replay CTA. `engine.reset()` clears engine state AND `localStorage.removeItem('tree-story:save')` atomically. Navigation to ProfileCreation happens after reset resolves — never before.

### Process Patterns

**Error Handling:**

| Error Type | Handler | Player Sees |
|---|---|---|
| Invalid story JSON at load | `storyValidator.ts` throws `StoryValidationError` | `<DevErrorScreen>` (never in prod if JSON is valid) |
| Missing paragraph ID in config | Validator catches at load time | `<DevErrorScreen>` |
| Corrupt/mismatched localStorage | `persistence.ts` returns `null` | Fresh story start, silent |
| Missing paragraph ID at runtime | Engine throws `EngineError` | Error boundary → replay CTA |
| Gauge out of bounds | Never thrown — clamp silently | Nothing |

**TypeScript Strictness:** `strict: true` in `tsconfig.json`. No `any` in engine code. All engine functions have explicit return types.

### Enforcement Guidelines

**All AI Agents MUST:**
- Keep `engine/` free of React imports
- Clamp gauge values immediately at calculation
- Evaluate Game Over before act transitions — always
- Apply decay after choice effects on same-node choices — never before
- Use `GaugeDefinition.id` / `StatDefinition.id` as record keys — always
- Write engine state to localStorage after every mutation — never batch
- Use `StoryValidationError` for config errors, `EngineError` for runtime errors
- Name CSS custom properties exactly as specified
- Never display raw gauge numbers to the player
- Never instantiate the engine more than once (`useRef` pattern)

**Anti-Patterns to Reject:**
- Engine importing from `components/` or `hooks/`
- Using gauge `name` or `label` as record keys instead of `id`
- Deferring gauge clamping
- Evaluating Game Over after act transition
- Firing decay before choice effects on same node
- `document.documentElement` accessed outside `themeManager.ts`
- Hardcoded color values in component files
- Navigating to ProfileCreation before `engine.reset()` resolves
- Adding CharacterSheet triggers beyond the gauge strip tap

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
tree-story/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts                    # to add
├── .gitignore
├── README.md
│
├── app/                                # Next.js app router
│   ├── globals.css                     # @theme tokens, CSS custom props, base styles
│   ├── layout.tsx                      # Root layout — Lora + Inter fonts, metadata
│   ├── page.tsx                        # Entry: fetch story config → validate → render
│   └── error.tsx                       # Next.js error boundary for runtime EngineErrors
│
├── components/                         # React UI only — no engine logic
│   ├── StoryReader.tsx                 # Root client component — owns useStoryEngine
│   ├── GaugeStrip.tsx                  # Sticky gauge bar — tap target for CharacterSheet
│   ├── ParagraphDisplay.tsx            # Prose renderer (markdown-lite: bold/italic)
│   ├── ChoiceCards.tsx                 # Choice card stack — dispatches taps to engine
│   ├── CharacterSheet.tsx              # shadcn Sheet — stats + all gauges on demand
│   ├── ProfileCreation.tsx             # Stat point distribution — story-configured
│   ├── EndScreen.tsx                   # Score tier narrative + replay CTA
│   └── DevErrorScreen.tsx             # Config validation errors — never player-facing
│
├── engine/                             # Pure TypeScript — zero React dependency
│   ├── types.ts                        # All shared types (StoryConfig, EngineState, etc.)
│   ├── storyEngine.ts                  # Core: init, resolveChoice, applyDecay, getState, reset
│   ├── gaugeSystem.ts                  # Gauge arithmetic, clamping [0,100], decay
│   ├── weightedOutcome.ts              # Risk formula + Math.random() resolution
│   ├── themeManager.ts                 # document.documentElement CSS custom prop updates
│   ├── persistence.ts                  # localStorage read/write/validate (tree-story:save)
│   ├── storyValidator.ts               # JSON schema + paragraph ID integrity check
│   └── storyEngine.test.ts             # Vitest — full Dub Camp graph coverage
│
├── hooks/
│   └── useStoryEngine.ts               # React adapter: useRef engine + useState for render
│
├── lib/
│   └── utils.ts                        # clamp(), shared utilities
│
├── public/
│   └── stories/
│       └── dub-camp.json               # Dub Camp story config
│
└── docs/
    └── story-format-spec.md            # FR35: JSON schema reference for story authors
```

### Architectural Boundaries

**Engine Boundary (strict isolation):**
- `engine/` has no imports from `components/`, `hooks/`, `app/`, or `lib/`
- Only `hooks/useStoryEngine.ts` calls engine methods
- `themeManager.ts` is the only engine file with DOM access (`document.documentElement`)

**Component Boundary:**
- Components receive data as props from `useStoryEngine` only
- `StoryReader.tsx` is the sole consumer of `useStoryEngine` — all children receive props
- `DevErrorScreen.tsx` rendered by `app/page.tsx` on config failure only

**Data Boundary:**
- Player state: `engine/` → `hooks/useStoryEngine.ts` → component props
- Persistence: `hooks/useStoryEngine.ts` → `engine/persistence.ts` → localStorage
- Story config: `app/page.tsx` (fetch) → `engine/storyValidator.ts` → `hooks/useStoryEngine.ts`
- Theme: `hooks/useStoryEngine.ts` → `engine/themeManager.ts` → `:root` CSS custom properties

### Requirements to Structure Mapping

| FR Group | Location |
|---|---|
| FR1–FR3 Profile Creation | `components/ProfileCreation.tsx` |
| FR4–FR7 Story Reading | `components/StoryReader.tsx`, `ParagraphDisplay.tsx`, `ChoiceCards.tsx`, `CharacterSheet.tsx` |
| FR8–FR14 Game Engine | `engine/storyEngine.ts`, `gaugeSystem.ts`, `weightedOutcome.ts` |
| FR15–FR18 End & Replay | `components/EndScreen.tsx` + engine reset logic |
| FR19–FR23 Persistence | `engine/persistence.ts` + `hooks/useStoryEngine.ts` |
| FR24–FR27 Visual Theming | `engine/themeManager.ts` + `app/globals.css` |
| FR28–FR35 Story Config | `engine/storyValidator.ts`, `public/stories/`, `docs/story-format-spec.md` |

### Data Flow

```
fetch('/stories/dub-camp.json')
  → storyValidator.ts  (schema + paragraph ID integrity)
  → storyEngine.ts     (init with config + optional SaveState)
  → useStoryEngine.ts  (expose reactive state to React)
  → StoryReader.tsx    (render GaugeStrip + ParagraphDisplay + ChoiceCards)

On choice tap:
  storyEngine.ts  (resolveChoice → gauge effects → weighted outcome
                  → clamp → Game Over check → act transition)
  → persistence.ts    (serialize → localStorage.setItem)
  → themeManager.ts   (update :root CSS custom properties)
  → setEngineState()  → React re-render
```

### Development Workflow

- **Dev:** `npm run dev` — Turbopack hot reload
- **Test:** `npx vitest` — engine tests in isolation, no browser required
- **Deploy:** `git push origin main` → Vercel auto-deploy

---

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are compatible. Next.js 16 + React 19 + TypeScript 5 + Tailwind v4 are current and conflict-free. The pure TS engine pattern is consistently reflected across decisions, patterns, and structure. Tailwind v4's CSS-first `@theme` approach is fully compatible with the runtime CSS custom property theming system. Evaluation order (choice → decay → Game Over → act transition) is consistent across communication patterns and the engine API definition.

### Requirements Coverage Validation ✅

All 35 functional requirements are architecturally supported and mapped to specific files. All 12 non-functional requirements are addressed: 200ms resolution via synchronous pure-TS engine, single network round-trip via fetch + next/font preload, offline capability via no post-load network dependencies, WCAG AA via config-time contrast validation.

FR35 (JSON Story Format Specification) is explicitly surfaced as `docs/story-format-spec.md` and called out as a pre-implementation deliverable.

### Implementation Readiness Validation ✅

- All critical decisions documented with rationale
- Engine state interface fully specified with canonical TypeScript shapes
- Evaluation orders documented as strict sequences — no ambiguity
- 14 potential conflict points identified and resolved in patterns
- Record key conventions explicit (id field, not name/label)
- Save restore validation rules fully specified
- Complete project tree with all files named and purposed
- FR-to-file mapping table complete

### Gap Analysis Results

**Implementation Tasks (not architectural gaps):**

| Task | Priority |
|---|---|
| Author `docs/story-format-spec.md` (FR35) | Critical — blocks Dub Camp JSON translation |
| Run `npx shadcn@latest init` | Important — needed for CharacterSheet |
| Create `vitest.config.ts` | Important — needed for engine tests |
| Wire Lora + Inter in `app/layout.tsx` | Important — typography foundation |
| Create `public/stories/` and translate Dub Camp → JSON | Critical — v1 content |

No architectural gaps requiring design changes before implementation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (35 FR + 12 NFR)
- [x] Scale and complexity assessed (Medium — engine is the spike)
- [x] Technical constraints identified (no backend, localStorage, offline)
- [x] Cross-cutting concerns mapped (14 conflict points)

**✅ Architectural Decisions**
- [x] Engine architecture: pure TS module, framework-agnostic
- [x] Story config: public/stories/ + fetch + JSON
- [x] Persistence: single localStorage key, full state snapshot
- [x] Hosting: Vercel (already connected)
- [x] Testing: Vitest for engine only

**✅ Implementation Patterns**
- [x] Naming conventions (files, TS, JSON fields, CSS custom props, record keys)
- [x] Evaluation orders (choice nodes, decay nodes — strict sequences)
- [x] Engine boundary and import rules
- [x] Error handling matrix (4 error types, developer-facing only)
- [x] Replay timing and reset sequence
- [x] CharacterSheet trigger (gauge strip only)
- [x] useStoryEngine init rule (once, useRef)
- [x] 14 anti-patterns documented

**✅ Project Structure**
- [x] Complete directory tree with all files named
- [x] Component boundaries (StoryReader as sole useStoryEngine consumer)
- [x] Data flow diagram (fetch → validate → init → choice → persist → render)
- [x] FR-to-file mapping table

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Engine isolation (pure TS, no React coupling) makes it independently testable
- Strict evaluation order rules prevent the most dangerous class of engine bugs
- Record key conventions prevent save state incompatibility across agent implementations
- FR35 spec doc surfaced as a pre-implementation deliverable, not an afterthought
- Dub Camp story file used as concrete validation reference throughout

**Areas for Future Enhancement (post-MVP):**
- Seeded random for reproducible weighted outcome testing
- Story library: `public/stories/index.json` manifest + selection UI
- PWA service worker for stronger offline guarantees
- E2E test suite (Playwright) once story content stabilizes

### Implementation Handoff

**First Steps (in order):**
1. Author `docs/story-format-spec.md` — FR35, blocks all content work
2. Create `vitest.config.ts` + write engine unit tests against Dub Camp mechanics
3. Implement `engine/` modules (types → gaugeSystem → weightedOutcome → storyEngine)
4. Run `npx shadcn@latest init`; implement `hooks/useStoryEngine.ts`
5. Build components; wire fonts and design tokens
6. Translate Dub Camp → `public/stories/dub-camp.json`
7. Mobile play test (Anthony, real commute conditions)
