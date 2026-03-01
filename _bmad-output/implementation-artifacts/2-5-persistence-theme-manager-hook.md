# Story 2.5: Persistence, Theme Manager & useStoryEngine Hook

Status: ready-for-dev

## Story

As a developer,
I want `engine/persistence.ts`, `engine/themeManager.ts`, and `hooks/useStoryEngine.ts` implemented,
so that every engine state mutation is immediately persisted to localStorage, CSS custom properties are updated on `:root`, and React components receive reactive engine state without calling engine methods directly.

## Acceptance Criteria

1. `persistence.save(engineState, storyId)` writes `SaveState { storyId, version: 1, savedAt: Date.now(), engineState }` to `localStorage.setItem('tree-story:save', JSON.stringify(saveState))`
2. `persistence.load()` returns a validated `SaveState` or `null` — returning `null` silently for: missing key, JSON parse error, version ≠ 1, any required field missing or wrong type
3. `persistence.clear()` calls `localStorage.removeItem('tree-story:save')`
4. `themeManager.apply(act, storyConfig)` looks up `ActDefinition` for the given act id and calls `document.documentElement.style.setProperty(name, value)` for each CSS custom property in the act's `theme` object
5. `themeManager.ts` is the ONLY file in the codebase that calls `document.documentElement.style.setProperty`
6. `StoryReader` mounts and the engine is instantiated exactly once via `useRef` — never recreated on re-render
7. On mount: `persistence.load()` is called; if valid `SaveState` exists with matching `storyId` and existing `paragraphId` → init from saved state; otherwise fresh start (silent to player)
8. After every engine mutation (`resolveChoice`, `applyDecay`, `reset`): `setEngineState(engine.getState())`, `persistence.save()`, and `themeManager.apply()` are all called
9. The hook exposes: `{ engineState, resolveChoice, applyDecay, resetEngine, setStats }` — components never call engine methods directly

## Tasks / Subtasks

- [ ] Create `engine/persistence.ts` (AC: 1–3)
  - [ ] Import from `engine/types.ts` only
  - [ ] Export `const SAVE_KEY = 'tree-story:save'`
  - [ ] Export `function save(engineState: EngineState, storyId: string): void`
    - Build `SaveState`: `{ storyId, version: 1, savedAt: Date.now(), engineState }`
    - Call `localStorage.setItem(SAVE_KEY, JSON.stringify(saveState))`
  - [ ] Export `function load(): SaveState | null`
    - Try `localStorage.getItem(SAVE_KEY)` — if null/undefined return `null`
    - Try `JSON.parse(item)` — if throws return `null`
    - Validate: `parsed.version === 1` — if not return `null`
    - Validate: `parsed.storyId` is string — if not return `null`
    - Validate: `parsed.engineState` exists and has required shape (storyId, paragraphId, gauges, stats, act, inventory, score, isGameOver, gameOverParagraphId, isComplete) — if any missing return `null`
    - Return validated `SaveState`
    - Never throw — all errors return `null` silently
  - [ ] Export `function clear(): void`
    - Call `localStorage.removeItem(SAVE_KEY)`

- [ ] Create `engine/themeManager.ts` (AC: 4, 5)
  - [ ] Import from `engine/types.ts` only
  - [ ] This file is the ONLY place in the codebase with `document.documentElement.style.setProperty` calls
  - [ ] Export `function apply(actId: string, config: StoryConfig): void`
    - Find `act = config.acts.find(a => a.id === actId)`
    - If act not found: no-op (silently handle missing act)
    - For each entry in `act.theme` (a `Record<string, string>`): call `document.documentElement.style.setProperty(propertyName, value)`
    - CSS property names are the exact strings from the story config (e.g., `"--color-bg"`, `"--color-accent"`)
  - [ ] Guard against SSR: `if (typeof document === 'undefined') return` — Next.js server components don't have `document`

- [ ] Create `hooks/useStoryEngine.ts` (AC: 6–9)
  - [ ] `"use client"` directive at top (this is a React hook — client-only)
  - [ ] Import from `engine/storyEngine.ts`, `engine/persistence.ts`, `engine/themeManager.ts`, `engine/types.ts`
  - [ ] Export `function useStoryEngine(config: StoryConfig)`

  - [ ] Engine instantiation (AC: 6):
    ```typescript
    const engineRef = useRef<StoryEngine | null>(null)
    if (engineRef.current === null) {
      const savedState = persistence.load()
      engineRef.current = createEngine(config, savedState ?? undefined)
    }
    ```
    - Engine created exactly once — `useRef` guarantees no recreation on re-render

  - [ ] State initialization (AC: 7):
    ```typescript
    const [engineState, setEngineState] = useState<EngineState>(() => engineRef.current!.getState())
    ```
    - `useState` with initializer function — reads state once on mount

  - [ ] `useEffect` for initial theme application:
    ```typescript
    useEffect(() => {
      themeManager.apply(engineState.act, config)
    }, []) // run once on mount
    ```

  - [ ] After-mutation pattern (AC: 8) — create a helper:
    ```typescript
    const commitState = useCallback(() => {
      const newState = engineRef.current!.getState()
      setEngineState(newState)
      persistence.save(newState, config.id)
      themeManager.apply(newState.act, config)
    }, [config])
    ```

  - [ ] Expose `resolveChoice` (AC: 9):
    ```typescript
    const resolveChoice = useCallback((choiceId: string) => {
      engineRef.current!.resolveChoice(choiceId)
      commitState()
    }, [commitState])
    ```

  - [ ] Expose `applyDecay` (AC: 9):
    ```typescript
    const applyDecay = useCallback(() => {
      engineRef.current!.applyDecay()
      commitState()
    }, [commitState])
    ```

  - [ ] Expose `resetEngine` (AC: 9):
    ```typescript
    const resetEngine = useCallback(() => {
      persistence.clear()        // clear localStorage FIRST
      engineRef.current!.reset() // then reset engine state
      commitState()
    }, [commitState])
    ```

  - [ ] Expose `setStats` (for ProfileCreation):
    ```typescript
    const setStats = useCallback((stats: Record<string, number>) => {
      engineRef.current!.setStats(stats)
      commitState()
    }, [commitState])
    ```

  - [ ] Return: `{ engineState, resolveChoice, applyDecay, resetEngine, setStats }`

- [ ] Verify SSR safety
  - [ ] `engine/persistence.ts` uses `localStorage` — guard with `typeof window !== 'undefined'` check (or it's called from `useEffect`/event handlers which are client-only)
  - [ ] `engine/themeManager.ts` uses `document` — guard with `typeof document !== 'undefined'`
  - [ ] `hooks/useStoryEngine.ts` has `"use client"` — only runs in browser

## Dev Notes

- **Engine instance via `useRef`: critical.** The engine must be created exactly once. If you use `useState` or a plain variable for the engine, it will either be recreated on every render (plain variable) or cause re-render issues (state). `useRef` is the correct pattern — it persists across renders without causing re-renders.
- **`persistence.clear()` before `engine.reset()`:** The reset flow requires clearing localStorage first, then resetting the engine. This ensures a fresh page load won't restore the old state. From architecture: "Replay: `engine.reset()` + `localStorage.removeItem()` atomically; navigate to ProfileCreation ONLY after reset resolves."
- **`themeManager.ts` — only place with `document.documentElement`:** This is an absolute rule from architecture. Never access `document.documentElement` anywhere else. If you find yourself wanting to update CSS custom properties from a component, route it through `themeManager.apply()`.
- **`hooks/` directory:** Create `hooks/useStoryEngine.ts` at project root level (not inside `app/`). The `app/` directory is for Next.js app router files.
- **localStorage guards:** `localStorage` is not available during server-side rendering (SSR). Since `useStoryEngine` is a client hook (`"use client"`), calls to `persistence.load()` in the initial render are safe, but `persistence.ts` itself should guard against SSR if ever called server-side.
- **ProfileCreation integration (preview):** `setStats` is exposed from this hook and will be called by `ProfileCreation.tsx` (built in Story 3.2) after the player allocates stat points. The flow is: ProfileCreation calls `setStats()` → engine stores stats → StoryReader renders.

### Project Structure Notes

Files to create:
- `engine/persistence.ts` (new)
- `engine/themeManager.ts` (new)
- `hooks/useStoryEngine.ts` (new)

No files to modify in this story.

Prerequisites:
- Story 1.2 (`engine/types.ts`)
- Story 2.4 (`engine/storyEngine.ts` — the engine implementation)

### References

- [Source: architecture.md#Communication-Patterns] — "useStoryEngine Init Rule: Engine instantiated exactly once on mount via `useRef`"
- [Source: architecture.md#Format-Patterns] — localStorage key `tree-story:save`, `SaveState` shape, save restore validation rules
- [Source: architecture.md#Enforcement-Guidelines] — "`themeManager.ts` is the only engine file with DOM access (`document.documentElement`)"
- [Source: project-context.md#Framework-Specific-Rules] — "After every engine mutation, always call all three in order: setEngineState() → persistence.save() → themeManager.apply()"
- [Source: project-context.md#Critical-Dont-Miss-Rules] — localStorage key, corrupt save behavior, replay timing

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
