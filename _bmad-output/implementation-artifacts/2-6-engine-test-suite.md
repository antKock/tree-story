# Story 2.6: Engine Test Suite

Status: ready-for-dev

## Story

As a developer,
I want a Vitest test suite in `engine/storyEngine.test.ts` that exercises the complete Dub Camp paragraph graph,
so that all gauge arithmetic, decay sequences, weighted outcome resolution, and Game Over conditions are verified before any UI is built.

## Acceptance Criteria

1. All tests pass with zero failures when `npx vitest run` is executed
2. All 4 Game Over paths are reachable: §201 (trop bu trop tôt), §202 (dans le gaz), §203 (alcool + low Nourriture), §204 (épuisement)
3. Gauge clamping: values never exceed 100 or fall below 0 regardless of input
4. Decay fires at all defined decay nodes (§20, §40, §50, §60, §70) and not at non-decay nodes
5. Decay fires AFTER choice effects on same-node choices
6. Game Over is evaluated BEFORE act transition in all cases
7. Nourriture decay respects Estomac stat formula `max(3, 10 − Estomac × 1.5)`
8. Voluntary exit §41 awards Kiff +5 and bypasses all Game Over checks
9. §EVT1 fires with 1-in-3 probability (mock `Math.random` to test both branches)
10. State serialization round-trips correctly: `serialize()` → `persistence.save()` → `persistence.load()` → `initEngine(config, savedState)` restores identical `EngineState`
11. Corrupt/mismatched saves return `null` from `persistence.load()`
12. Tests use a Dub Camp story config fixture matching the schema (full JSON translation comes in Epic 4)

## Tasks / Subtasks

- [ ] Create test fixture `engine/__fixtures__/dub-camp-fixture.ts` (AC: 12)
  - [ ] Export a minimal but representative `StoryConfig` fixture that mirrors Dub Camp mechanics
  - [ ] Must include:
    - All 4 stats: `endurance`, `estomac`, `resistanceAlcool`, `resistanceFumette` (maxPerStat: 4)
    - All 5 gauges: `energie` (100), `alcool` (0), `fumette` (0), `nourriture` (50), `kiff` (0, isScore, isHidden)
    - Decay nodes: `['s20', 's40', 's50', 's60', 's70']` with correct decay amounts
    - All 4 Game Over paragraphs (s201–s204) with trigger conditions
    - At least a sparse subset of paragraphs to test paths: s1, s10, s20, s40, s41, s50, s60, s70, sEVT1, s201, s202, s203, s204, and a completion paragraph
    - 4 act definitions with correct paragraphIds triggers and theme CSS overrides
    - End state tiers (4 tiers)
  - [ ] Note: This fixture does NOT need full 53-paragraph fidelity — it needs enough to exercise all mechanics. The full JSON comes in Epic 4.

- [ ] Create `engine/storyEngine.test.ts` with test file structure (AC: 1)
  - [ ] Import Vitest: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
  - [ ] Import engine and persistence modules
  - [ ] Import `dubCampFixture` from the fixtures file
  - [ ] Add `beforeEach` to reset engine state between tests

- [ ] Gauge clamping tests (AC: 3)
  - [ ] Test: applying a +1000 gauge effect results in gauge value === 100
  - [ ] Test: applying a -1000 gauge effect results in gauge value === 0
  - [ ] Test: applying +50 to a gauge at 80 results in 100, not 130
  - [ ] Test: applying -50 to a gauge at 30 results in 0, not -20

- [ ] Decay node tests (AC: 4, 5)
  - [ ] Test: `applyDecay()` changes gauge values when current paragraphId is in `decayNodes`
  - [ ] Test: calling `applyDecay()` when NOT at a decay node has no effect (or engine guards against it)
  - [ ] Test: at §20 (decay node), a choice that reduces energie + then applyDecay fires — net result = choice effects + decay (choice first, then decay)
  - [ ] Verify decay amount at §50 includes the universal `-10⚡` penalty

- [ ] Nourriture decay formula tests (AC: 7)
  - [ ] Test: with `estomac = 0`, Nourriture decay = 10 (max(3, 10-0) = 10)
  - [ ] Test: with `estomac = 4`, Nourriture decay = 4 (max(3, 10-6) = max(3,4) = 4)
  - [ ] Test: with `estomac = 6` (hypothetical), Nourriture decay = 3 (max(3, 10-9) = max(3,1) = 3 — floor at 3)
  - [ ] Test: Nourriture cannot go below 0 even with max decay

- [ ] Game Over path tests (AC: 2, 6)
  - [ ] Test §201 trigger: set `alcool` gauge to > threshold (e.g., 86), call `resolveChoice` → `engineState.isGameOver === true`, `gameOverParagraphId === 's201'`
  - [ ] Test §202 trigger: manipulate state to trigger "dans le gaz" condition (likely alcool + energie combination)
  - [ ] Test §203 trigger: alcool high + nourriture low → game over
  - [ ] Test §204 trigger: energie below threshold (exhaustion) → game over
  - [ ] Test: Game Over is evaluated BEFORE act transition (create a scenario where act transition would fire and verify it doesn't when Game Over triggers first)

- [ ] Voluntary exit §41 test (AC: 8)
  - [ ] Set up engine at §41 in Dub Camp (navigate there via choices in fixture)
  - [ ] Resolve the voluntary exit choice → `kiff` gauge increases by 5
  - [ ] Verify `isGameOver === false` (bypasses Game Over checks)
  - [ ] Verify `isComplete === true` (or appropriate completion state)

- [ ] §EVT1 probabilistic event test (AC: 9)
  - [ ] Use `vi.spyOn(Math, 'random')` to mock the random value
  - [ ] Set `Math.random` to return 0.1 (< 1/3) → §EVT1 fires (good path)
  - [ ] Set `Math.random` to return 0.9 (> 1/3) → §EVT1 does not fire (no-op or normal path)
  - [ ] Restore mock after test

- [ ] State serialization round-trip test (AC: 10)
  - [ ] Create engine, navigate to a mid-story paragraph with modified gauge state
  - [ ] Call `engine.serialize()` → get `SaveState`
  - [ ] Create a mock localStorage and call `persistence.save(engineState, storyId)`
  - [ ] Call `persistence.load()` → verify returns the same `SaveState`
  - [ ] Create new engine from config + loaded save → verify `getState()` matches original
  - [ ] Specifically check: paragraphId, all gauge values, stats, act, inventory, score

- [ ] Corrupt save tests (AC: 11)
  - [ ] Test: `persistence.load()` returns `null` when localStorage has invalid JSON
  - [ ] Test: `persistence.load()` returns `null` when save has `version: 2` (mismatch)
  - [ ] Test: `persistence.load()` returns `null` when `engineState.paragraphId` doesn't exist in config
  - [ ] Test: `persistence.load()` returns `null` when required `EngineState` field is missing
  - [ ] Test: `persistence.load()` returns `null` when localStorage key doesn't exist

- [ ] Weighted outcome mock tests
  - [ ] Mock `Math.random()` to return < threshold → good outcome (goodEffects applied)
  - [ ] Mock `Math.random()` to return > threshold → bad outcome (badEffects applied)
  - [ ] Verify correct effects applied in each case
  - [ ] Verify that neither probability values nor risk scores are accessible from outside the module

## Dev Notes

- **Fixture fidelity:** The test fixture doesn't need all 53 Dub Camp paragraphs — it needs enough paragraphs to trace the 4 Game Over paths and the §41 exit. Build the minimum viable fixture for test coverage. The full story translation in Epic 4 is separate.
- **`vi.spyOn(Math, 'random')` pattern:**
  ```typescript
  const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
  // ... test
  spy.mockRestore()
  ```
- **localStorage in Vitest:** Vitest runs in a Node.js environment by default. You'll need to mock `localStorage` since it doesn't exist in Node. Use `vitest-localstorage-mock` package, or define a simple in-memory mock:
  ```typescript
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
    }
  })()
  Object.defineProperty(global, 'localStorage', { value: localStorageMock })
  ```
- **No React imports in tests.** Engine tests are pure TypeScript. Zero React, Next.js, or DOM APIs (except the mocked localStorage above).
- **Test for all 4 Dub Camp Game Over paragraphs:** §201–§204 each have different trigger conditions. You'll need to find the exact gauge thresholds from the story format spec or epics.md to set up test preconditions.
- **`beforeEach` reset:** Each test should start with a fresh engine instance to avoid state leakage between tests.

### Project Structure Notes

Files to create:
- `engine/storyEngine.test.ts` (new)
- `engine/__fixtures__/dub-camp-fixture.ts` (new — test data only)

Prerequisites (all must be complete):
- Story 1.2 (`engine/types.ts`)
- Story 2.2 (`engine/gaugeSystem.ts`)
- Story 2.3 (`engine/weightedOutcome.ts`)
- Story 2.4 (`engine/storyEngine.ts`)
- Story 2.5 (`engine/persistence.ts`)
- Story 1.1 (`vitest.config.ts`)

### References

- [Source: architecture.md#Testing] — "Required coverage: all 4 Game Over paths triggerable, all gauge decay sequences, all 53 Dub Camp paragraphs reachable"
- [Source: project-context.md#Testing-Rules] — "`Math.random()` is used in weighted outcome resolution — mock or seed it in tests for determinism"
- [Source: epics.md#Story-2.6] — Full acceptance criteria with specific Game Over paths and decay nodes
- [Source: architecture.md#Enforcement-Guidelines] — All game mechanic rules that must be verified by tests

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
