---
project_name: 'tree-story'
user_name: 'Anthony'
date: '2026-03-01'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Next.js** 16.1.6 — App Router; static server components where possible, `"use client"` for engine state
- **React** 19.2.3
- **TypeScript** 5.x — `strict: true`; no `any` anywhere in `engine/`
- **Tailwind CSS** 4.x — CSS-first: use `@theme` in `globals.css`, NOT `tailwind.config.js` (does not exist)
- **ESLint** 9.x — `eslint-config-next` flat config in `eslint.config.mjs`
- **Vitest** — to be installed; engine unit tests only (`npm install -D vitest`)
- **shadcn/ui** — to be installed via `npx shadcn@latest init`; used for Sheet component only
- **Path alias:** `@/*` → project root (no `src/` wrapper)

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- `strict: true` enforced — no `@ts-ignore`, no `any` (use `unknown` + type guards)
- All functions in `engine/` must have explicit return types — no inferred returns
- Interfaces: PascalCase, no `I` prefix (`StoryConfig`, not `IStoryConfig`)
- Enums: PascalCase name + PascalCase values (`GameOverReason.EnergyDepleted`)
- Constants: `SCREAMING_SNAKE_CASE`
- Record keys in `EngineState.gauges` and `.stats` are always `GaugeDefinition.id` / `StatDefinition.id` — NEVER `name` or `label`
- Two distinct error classes: `StoryValidationError` (config) vs `EngineError` (runtime) — never conflate
- `moduleResolution: "bundler"` — do not change to `node` or `node16`
- Path alias `@/*` maps to project root (no `src/` wrapper exists)

### Framework-Specific Rules (Next.js + React)

- `app/` at root — no `src/` wrapper; server components by default, `"use client"` only for engine state
- `useStoryEngine` hook: engine instantiated exactly once via `useRef` — never recreated on re-render
- `StoryReader.tsx` is the sole consumer of `useStoryEngine` — child components receive props only
- Components never call engine methods directly — only through hook-exposed functions
- After every engine mutation, always call all three in order: `setEngineState()` → `persistence.save()` → `themeManager.apply()`
- Engine state is immutable — engine returns new state objects, never mutates in place
- `document.documentElement` accessed ONLY in `engine/themeManager.ts` — never in components
- No hardcoded color values in component files — all colors via CSS custom properties on `:root`
- Fonts: Lora + Inter via `next/font/google` (Geist is the starter default — replace it)
- Design tokens in `app/globals.css` under `@theme` directive — this is the single source of truth

### Testing Rules

- Vitest only — engine unit tests exclusively; no E2E for v1
- Test files: co-located `.test.ts` suffix (`engine/storyEngine.test.ts`)
- Engine tests have zero React/Next.js imports — pure TypeScript only
- Required coverage: all 4 Game Over paths triggerable, all gauge decay sequences, all 53 Dub Camp paragraphs reachable
- `Math.random()` is used in weighted outcome resolution — mock or seed it in tests for determinism
- Test gauge clamping at boundaries: values that would go below 0, above 100, and exactly at limits
- Run with: `npx vitest` (no browser required)

### Code Quality & Style Rules

**File naming:**
- React components: `PascalCase.tsx`
- Hooks: `camelCase` with `use` prefix (`useStoryEngine.ts`)
- Engine modules + utilities: `camelCase` (`storyEngine.ts`, `clamp.ts`)
- Story JSON files: `kebab-case` (`dub-camp.json`)
- Types: PascalCase in `engine/types.ts`

**JSON story schema field naming:** `camelCase` for all fields; `is`/`has` prefix for booleans; plural nouns for arrays

**CSS custom property names (exact — no variations):**
`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger`
All on `:root` only — no component-scoped custom properties

**ESLint:** Flat config in `eslint.config.mjs` — do NOT add `.eslintrc` files

### Development Workflow Rules

- Dev: `npm run dev` (Turbopack); Tests: `npx vitest`; Lint: `npm run lint`
- Deploy: push to `main` → Vercel auto-deploys; branch PRs get preview URLs
- Story files: drop JSON in `public/stories/` — no build step needed to add stories
- Pre-implementation prerequisites (in order):
  1. `docs/story-format-spec.md` — must exist before authoring `dub-camp.json`
  2. `vitest.config.ts` — must exist before running engine tests
  3. `npx shadcn@latest init` — must run before implementing `CharacterSheet.tsx`

### Critical Don't-Miss Rules

**Engine isolation (absolute):**
- `engine/` has ZERO imports from `components/`, `hooks/`, `app/`, or `lib/`
- Only `hooks/useStoryEngine.ts` calls engine methods
- Only `engine/themeManager.ts` may access `document.documentElement`

**Evaluation order at a choice node (strict — do not reorder):**
1. Apply choice gauge effects
2. Apply weighted outcome (if present)
3. Clamp all gauges to `[0, 100]`
4. Evaluate Game Over (in config order) → if triggered: persist + STOP
5. Evaluate act transition → update `act`
6. Persist state

**Evaluation order at a decay node (decay fires AFTER choice effects):**
1. Choice effects + weighted outcome
2. Decay amounts
3. Clamp → Game Over check → act transition → persist

**Gauge rules:**
- Clamp immediately — never deferred
- Game Over evaluated BEFORE act transition — always
- Never display raw gauge numbers to the player

**localStorage:**
- Key: `tree-story:save` — single key, full snapshot, written after every mutation
- Corrupt/mismatched save → discard silently, start fresh (never tell the player)
- Replay: `engine.reset()` + `localStorage.removeItem()` atomically; navigate to ProfileCreation ONLY after reset resolves

**UI constraints:**
- CharacterSheet opens ONLY from GaugeStrip tap — no other trigger
- `DevErrorScreen` is never player-facing — config errors only, dev environment only

**Anti-patterns to reject outright:**
- Using `name` or `label` as record keys (always use `id`)
- Evaluating Game Over after act transition
- Firing decay before choice effects on same node
- Hardcoded colors in component files
- More than one engine instance (never recreate on re-render)
- Adding CharacterSheet triggers beyond gauge strip tap

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented — especially evaluation order and engine boundary rules
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge during implementation

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes or new patterns are established
- Remove rules that become obvious over time

Last Updated: 2026-03-01
