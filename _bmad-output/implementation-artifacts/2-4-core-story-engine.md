# Story 2.4: Core Story Engine

Status: ready-for-dev

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

- [ ] Create `engine/storyEngine.ts` class/module structure (AC: 9)
  - [ ] Import from `engine/types.ts`, `engine/gaugeSystem.ts`, `engine/weightedOutcome.ts` only
  - [ ] Export a factory function `createEngine(config: StoryConfig, savedState?: SaveState): Engine` or a class `StoryEngine`
  - [ ] Internal state: keep `_state: EngineState` as private mutable reference
  - [ ] Internal `_config: StoryConfig` — set at init, never changes

- [ ] Implement `initEngine` / constructor (AC: 1)
  - [ ] Accept `config: StoryConfig` and optional `savedState?: SaveState`
  - [ ] Validate saved state before restoring:
    - `savedState.version === 1` ✓
    - `savedState.storyId === config.id` ✓
    - `savedState.engineState.paragraphId` exists in `config.paragraphs` ✓
    - All required `EngineState` fields present and correct type ✓
  - [ ] If all checks pass: initialize from `savedState.engineState`
  - [ ] If any check fails (or no savedState): initialize fresh:
    - `paragraphId`: first key of `config.paragraphs` or first act's first paragraphId
    - `gauges`: `Record<id, initialValue>` from each `GaugeDefinition`
    - `stats`: set from saved state (stats are set during ProfileCreation, not auto-initialized)
    - `act`: `config.acts[0].id`
    - `inventory: []`
    - `score: 0`
    - `isGameOver: false`, `gameOverParagraphId: null`, `isComplete: false`
  - [ ] Note: Fresh init without stats means ProfileCreation must call a method to set stats before play begins. Add `setStats(stats: Record<string, number>): void` method.

- [ ] Implement `getState()` (AC: 2)
  - [ ] Return a deep copy (or structurally cloned) snapshot of `_state`
  - [ ] Use `structuredClone(_state)` or spread: `{ ..._state, gauges: { ..._state.gauges }, stats: { ..._state.stats }, inventory: [..._state.inventory] }`
  - [ ] NEVER return the internal `_state` reference directly

- [ ] Implement `resolveChoice(choiceId: string): EngineState` (AC: 3–6)
  - [ ] Find the choice: `const choice = config.paragraphs[_state.paragraphId].choices.find(c => c.id === choiceId)`
  - [ ] Throw `EngineError` if choice not found
  - [ ] **Step 1: Apply choice gauge effects** — call `gaugeSystem.applyGaugeEffects(_state.gauges, choice.gaugeEffects ?? [], _state.stats, _config)`
  - [ ] **Step 2: Apply weighted outcome** — if `choice.weightedOutcome` exists, call `weightedOutcome.resolveOutcome(...)` to get `'good'|'bad'`, then apply `choice.weightedOutcome.goodEffects` or `badEffects` via `gaugeSystem.applyGaugeEffects`
  - [ ] **Step 3: Clamp all gauges** — already handled by `applyGaugeEffects` (which calls `clamp`), but verify
  - [ ] **Step 4: Apply inventory changes** — process `choice.inventoryAdd` and `choice.inventoryRemove` before Game Over check (AC: 5)
  - [ ] **Step 5: Evaluate Game Over** — call `_evaluateGameOver()` — if triggered, update `_state.isGameOver = true`, `_state.gameOverParagraphId`, and RETURN immediately (do not proceed to act transition or paragraph advance)
  - [ ] **Step 6: Evaluate act transition** — call `_evaluateActTransition()` to check if `choice.targetParagraphId` triggers an act change
  - [ ] **Step 7: Advance paragraph** — `_state.paragraphId = choice.targetParagraphId`
  - [ ] Check if new paragraph `isComplete === true` — if so set `_state.isComplete = true`
  - [ ] Return `getState()`

- [ ] Implement `applyDecay(): EngineState` (AC: 7)
  - [ ] Only call this when `_state.paragraphId` is in `_config.decayNodes` (caller's responsibility to check, but engine can also guard)
  - [ ] **Step 1: Apply decay** — call `gaugeSystem.applyDecay(_state.gauges, _config.decayRules, _state.stats, _config)`
  - [ ] **Step 2: Clamp** — handled by `gaugeSystem.applyDecay`
  - [ ] **Step 3: Evaluate Game Over** — call `_evaluateGameOver()` — if triggered STOP
  - [ ] **Step 4: Evaluate act transition** — call `_evaluateActTransition()` with current `_state.paragraphId`
  - [ ] Return `getState()`

- [ ] Implement `_evaluateGameOver()` private helper
  - [ ] For each gauge in `_config.gauges` that has `gameOverThreshold` defined:
    - If `gameOverCondition === 'above'` and `_state.gauges[gauge.id] > gauge.gameOverThreshold`: trigger
    - If `gameOverCondition === 'below'` and `_state.gauges[gauge.id] < gauge.gameOverThreshold`: trigger
  - [ ] On trigger: set `_state.isGameOver = true`, find the Game Over paragraph ID from config (or use a default), set `_state.gameOverParagraphId`
  - [ ] Note: Dub Camp has 4 Game Over paragraphs: §201–§204 — each triggered by different gauge conditions. The mapping from gauge threshold → Game Over paragraph ID must be encoded in story config (e.g., on `GaugeDefinition` or as a separate `gameOverParagraphId` field)
  - [ ] Return boolean: `true` if game over triggered

- [ ] Implement `_evaluateActTransition(paragraphId: string)` private helper
  - [ ] Check if `paragraphId` appears in any `act.paragraphIds[]` for an act different from current `_state.act`
  - [ ] If found: update `_state.act = newAct.id`
  - [ ] First act's paragraphIds may overlap with initial state — handle without re-triggering

- [ ] Implement `reset(): void` (AC: 8)
  - [ ] Reset all state to initial values (same as fresh init)
  - [ ] `_state.isGameOver = false`, `_state.isComplete = false`
  - [ ] Reset all gauges to `initialValue` from `_config.gauges`
  - [ ] Reset `paragraphId` to first paragraph, `act` to first act
  - [ ] Clear `inventory: []`, `score: 0`, `gameOverParagraphId: null`
  - [ ] Note: `reset()` does NOT clear localStorage — that's the caller's responsibility (`persistence.clear()` called from `useStoryEngine` hook)

- [ ] Implement `serialize(): SaveState`
  - [ ] Return: `{ storyId: _config.id, version: 1, savedAt: Date.now(), engineState: getState() }`

- [ ] Handle the score gauge separately
  - [ ] The score gauge (`isScore: true`) is tracked internally just like any other gauge
  - [ ] `_state.score` should mirror the score gauge's value in `_state.gauges[scoreGaugeId]`
  - [ ] Or: `score` IS the value in `_state.gauges` — keep them in sync

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

### Completion Notes List

### File List
