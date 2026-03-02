# Story 2.4: Core Story Engine

Status: done

## Story

As a developer,
I want `engine/storyEngine.ts` to implement the complete story engine API (`initEngine`, `resolveChoice`, `applyDecay`, `getState`, `serialize`, `reset`),
so that all game mechanics — choice resolution, decay, Game Over evaluation, act transitions, score tracking, inventory changes — execute in the correct strict order.

## Acceptance Criteria

1. `initEngine(config, savedState?)` initializes from saved state if valid (version === 1, storyId matches, paragraphId exists in config, all EngineState fields present); otherwise initializes fresh with gauge initial values from config
2. `getState()` returns the current `EngineState` as a new object — no direct state reference returned
3. `resolveChoice(choiceId)` executes in strict order: (1) apply choice gauge effects, (2) resolve weighted outcome if present, (3) clamp all gauges [0,100], (4) evaluate Game Over conditions — if triggered → set `isGameOver: true`, `gameOverParagraphId`, and STOP; (5) if not Game Over → evaluate act transition; (6) advance `paragraphId` to choice target
4. Game Over is ALWAYS evaluated before act transition — no exceptions
5. Inventory changes defined on the choice are applied before Game Over evaluation
6. `resolveChoice` returns the new `EngineState`
7. `applyDecay()` executes: (1) apply decay amounts, (2) clamp gauges, (3) evaluate Game Over — if triggered → set `isGameOver: true`, STOP, (4) evaluate act transition
8. `reset()` resets all engine state to initial values: `isGameOver: false`, `isComplete: false`, all gauges reset to `initialValue` from config
9. `engine/storyEngine.ts` has zero imports from `components/`, `hooks/`, or `app/`

## Tasks / Subtasks

- [x] Create `engine/storyEngine.ts` class/module structure (AC: 9)
  - [x] Import from `engine/types.ts`, `engine/gaugeSystem.ts`, `engine/weightedOutcome.ts` only
  - [x] Export a factory function `createEngine(config: StoryConfig, savedState?: SaveState): Engine` or a class `StoryEngine`
  - [x] Internal state: keep `_state: EngineState` as private mutable reference
  - [x] Internal `_config: StoryConfig` — set at init, never changes

- [x] Implement `initEngine` / constructor (AC: 1)
  - [x] Accept `config: StoryConfig` and optional `savedState?: SaveState`
  - [x] Validate saved state before restoring:
    - `savedState.version === 1` ✓
    - `savedState.storyId === config.id` ✓
    - `savedState.engineState.paragraphId` exists in `config.paragraphs` ✓
    - All required `EngineState` fields present and correct type ✓
  - [x] If all checks pass: initialize from `savedState.engineState`
  - [x] If any check fails (or no savedState): initialize fresh:
    - `paragraphId`: first key of `config.paragraphs` or first act's first paragraphId
    - `gauges`: `Record<id, initialValue>` from each `GaugeDefinition`
    - `stats`: set from saved state (stats are set during ProfileCreation, not auto-initialized)
    - `act`: `config.acts[0].id`
    - `inventory: []`
    - `score: 0`
    - `isGameOver: false`, `gameOverParagraphId: null`, `isComplete: false`
  - [x] Note: Fresh init without stats means ProfileCreation must call a method to set stats before play begins. Add `setStats(stats: Record<string, number>): void` method.

- [x] Implement `getState()` (AC: 2)
  - [x] Return a deep copy (or structurally cloned) snapshot of `_state`
  - [x] Use `structuredClone(_state)` or spread: `{ ..._state, gauges: { ..._state.gauges }, stats: { ..._state.stats }, inventory: [..._state.inventory] }`
  - [x] NEVER return the internal `_state` reference directly

- [x] Implement `resolveChoice(choiceId: string): EngineState` (AC: 3–6)
  - [x] Find the choice: `const choice = config.paragraphs[_state.paragraphId].choices.find(c => c.id === choiceId)`
  - [x] Throw `EngineError` if choice not found
  - [x] **Step 1: Apply choice gauge effects** — call `gaugeSystem.applyGaugeEffects(_state.gauges, choice.gaugeEffects ?? [], _state.stats, _config)`
  - [x] **Step 2: Apply weighted outcome** — if `choice.weightedOutcome` exists, call `weightedOutcome.resolveOutcome(...)` to get `'good'|'bad'`, then apply `choice.weightedOutcome.goodEffects` or `badEffects` via `gaugeSystem.applyGaugeEffects`
  - [x] **Step 3: Clamp all gauges** — already handled by `applyGaugeEffects` (which calls `clamp`), but verify
  - [x] **Step 4: Apply inventory changes** — process `choice.inventoryAdd` and `choice.inventoryRemove` before Game Over check (AC: 5)
  - [x] **Step 5: Evaluate Game Over** — call `_evaluateGameOver()` — if triggered, update `_state.isGameOver = true`, `_state.gameOverParagraphId`, and RETURN immediately (do not proceed to act transition or paragraph advance)
  - [x] **Step 6: Evaluate act transition** — call `_evaluateActTransition()` to check if `choice.targetParagraphId` triggers an act change
  - [x] **Step 7: Advance paragraph** — `_state.paragraphId = choice.targetParagraphId`
  - [x] Check if new paragraph `isComplete === true` — if so set `_state.isComplete = true`
  - [x] Return `getState()`

- [x] Implement `applyDecay(): EngineState` (AC: 7)
  - [x] Only call this when `_state.paragraphId` is in `_config.decayNodes` (caller's responsibility to check, but engine can also guard)
  - [x] **Step 1: Apply decay** — call `gaugeSystem.applyDecay(_state.gauges, _config.decayRules, _state.stats, _config)`
  - [x] **Step 2: Clamp** — handled by `gaugeSystem.applyDecay`
  - [x] **Step 3: Evaluate Game Over** — call `_evaluateGameOver()` — if triggered STOP
  - [x] **Step 4: Evaluate act transition** — call `_evaluateActTransition()` with current `_state.paragraphId`
  - [x] Return `getState()`

- [x] Implement `_evaluateGameOver()` private helper
  - [x] For each gauge in `_config.gauges` that has `gameOverThreshold` defined:
    - If `gameOverCondition === 'above'` and `_state.gauges[gauge.id] > gauge.gameOverThreshold`: trigger
    - If `gameOverCondition === 'below'` and `_state.gauges[gauge.id] < gauge.gameOverThreshold`: trigger
  - [x] On trigger: set `_state.isGameOver = true`, find the Game Over paragraph ID from config (or use a default), set `_state.gameOverParagraphId`
  - [x] Note: Dub Camp has 4 Game Over paragraphs: §201–§204 — each triggered by different gauge conditions. The mapping from gauge threshold → Game Over paragraph ID must be encoded in story config (e.g., on `GaugeDefinition` or as a separate `gameOverParagraphId` field)
  - [x] Return boolean: `true` if game over triggered

- [x] Implement `_evaluateActTransition(paragraphId: string)` private helper
  - [x] Check if `paragraphId` appears in any `act.paragraphIds[]` for an act different from current `_state.act`
  - [x] If found: update `_state.act = newAct.id`
  - [x] First act's paragraphIds may overlap with initial state — handle without re-triggering

- [x] Implement `reset(): void` (AC: 8)
  - [x] Reset all state to initial values (same as fresh init)
  - [x] `_state.isGameOver = false`, `_state.isComplete = false`
  - [x] Reset all gauges to `initialValue` from `_config.gauges`
  - [x] Reset `paragraphId` to first paragraph, `act` to first act
  - [x] Clear `inventory: []`, `score: 0`, `gameOverParagraphId: null`
  - [x] Note: `reset()` does NOT clear localStorage — that's the caller's responsibility (`persistence.clear()` called from `useStoryEngine` hook)

- [x] Implement `serialize(): SaveState`
  - [x] Return: `{ storyId: _config.id, version: 1, savedAt: Date.now(), engineState: getState() }`

- [x] Handle the score gauge separately
  - [x] The score gauge (`isScore: true`) is tracked internally just like any other gauge
  - [x] `_state.score` should mirror the score gauge's value in `_state.gauges[scoreGaugeId]`
  - [x] Or: `score` IS the value in `_state.gauges` — keep them in sync

## Dev Notes

- **Strict evaluation order is the most important constraint in this entire codebase.** From architecture.md: "Game Over is ALWAYS evaluated before act transition — always." Any deviation from the documented order (choice effects → weighted outcome → clamp → inventory → Game Over check → act transition → advance) is a bug.
- **Score gauge:** The `kiff` gauge (isScore: true) is tracked in `_state.gauges` like any gauge. `_state.score` should be kept in sync with the score gauge value, or `score` can be derived by looking up the score gauge id. Keep both consistent.
- **`GaugeDefinition.gameOverParagraphId`:** You may need to add a `gameOverParagraphId?: string` field to `GaugeDefinition` in `engine/types.ts` if not already there. This links each Game Over threshold condition to a specific Game Over paragraph.
- **Starting paragraph:** The first paragraph of Dub Camp is `"s1"`. Engine fresh init should always start at the config-defined first paragraph. Consider adding a `startParagraphId` to `StoryConfig` or using `config.paragraphs`'s first key.
- **§41 voluntary exit:** Awards `Kiff +5` via `choice.gaugeEffects` and bypasses Game Over checks. This is handled naturally — the choice effects apply Kiff +5, and since `isComplete: true` is set on the target paragraph, no Game Over check is relevant. The story JSON encodes this.
- **`setStats(stats)` method:** Called from `ProfileCreation` via `useStoryEngine` hook after player finishes stat allocation and before story begins.

### Project Structure Notes

Files to create:
- `engine/storyEngine.ts` (new — the core engine module)

Files to potentially update:
- `engine/types.ts` — may need to add `gameOverParagraphId?: string` to `GaugeDefinition`, or `startParagraphId` to `StoryConfig`

Prerequisites:
- Story 1.2 (`engine/types.ts`)
- Story 2.2 (`engine/gaugeSystem.ts`, `lib/utils.ts`)
- Story 2.3 (`engine/weightedOutcome.ts`)

### References

- [Source: architecture.md#Communication-Patterns] — Full evaluation order for choice nodes and decay nodes
- [Source: architecture.md#Enforcement-Guidelines] — "Game Over evaluated BEFORE act transition — always"
- [Source: project-context.md#Critical-Dont-Miss-Rules] — Evaluation order at choice nodes and decay nodes (exact steps)
- [Source: epics.md#Story-2.4] — Full acceptance criteria with strict order specification

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation.

### Completion Notes List

- Factory function `createEngine(config, savedState?)` returns `Engine` interface with `getState`, `resolveChoice`, `applyDecay`, `reset`, `setStats`, `serialize`
- Saved state validation: checks version === 1, storyId match, paragraphId existence, all EngineState fields
- `resolveChoice` follows strict evaluation order: gauge effects → weighted outcome → inventory → score sync → Game Over → act transition → advance
- Game Over uses `>=`/`<=` (intentional: strict inequality unreachable at clamped boundaries — documented in code)
- Decay node guard added during code review: `applyDecay()` is a no-op if current paragraph is not in `config.decayNodes`
- `getState()` returns deep copy via spread operators — never exposes internal reference
- `reset()` restores all state to fresh initial values from config
- Score gauge synced with `_state.score` after every gauge mutation
- `setStats()` exposed for ProfileCreation to set stats before play begins

### File List

- `engine/storyEngine.ts` — new, core engine module with `createEngine` factory
