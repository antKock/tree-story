# Story 2.1: Story Config Loader & Validator

Status: done

## Story

As a developer,
I want `engine/storyValidator.ts` to load and validate a story JSON config at startup,
so that malformed configs or broken paragraph references surface a clear developer-facing error before the player experience ever loads.

## Acceptance Criteria

1. Validates the top-level shape matches `StoryConfig` (all required fields present and correctly typed)
2. Validates referential integrity: every `choice.targetParagraphId` references an existing key in `paragraphs`
3. Validates every ID in `decayNodes[]` references an existing paragraph ID
4. Validates every `actDefinition.paragraphIds[]` entry references an existing paragraph ID
5. If validation fails, throws `StoryValidationError` with a message identifying the specific failing field or reference
6. `app/page.tsx` fetches the story JSON via `fetch('/stories/dub-camp.json')`, passes it to the validator, and renders `<DevErrorScreen error={e} />` if `StoryValidationError` is caught — the player UI is never loaded in an invalid state (NFR12)
7. `DevErrorScreen.tsx` is a simple component that displays the error message — it is never rendered in a valid production state
8. `engine/storyValidator.ts` has no imports from `components/`, `hooks/`, or `app/`

## Tasks / Subtasks

- [x] Create `engine/storyValidator.ts` — structural validation (AC: 1, 5, 8)
  - [x] Import types from `engine/types.ts` only
  - [x] Export function `validateStoryConfig(data: unknown): StoryConfig` — takes raw parsed JSON, returns typed `StoryConfig` or throws
  - [x] Check top-level required fields exist: `id`, `version`, `meta`, `stats`, `gauges`, `acts`, `decayNodes`, `decayRules`, `paragraphs`, `endStateTiers`, `statPointBudget`
  - [x] Check field types (string, number, array, object as appropriate)
  - [x] Validate `meta.exampleProfiles` is array (can be empty)
  - [x] Check `stats` array has at least 1 entry, each with required `id`, `name`, `maxPerStat`
  - [x] Check `gauges` array has at least 1 entry, each with required `id`, `name`, `icon`, `initialValue`, `isScore`, `isHidden`
  - [x] Validate exactly one gauge has `isScore: true` (the score/kiff gauge)
  - [x] On any failure, throw `new StoryValidationError(\`Invalid story config: <specific message>\`)`

- [x] Add referential integrity validation (AC: 2, 3, 4, 5)
  - [x] Build a Set of all paragraph IDs from `paragraphs` object keys
  - [x] For each paragraph, for each choice: verify `choice.targetParagraphId` exists in Set — throw with message identifying which paragraph + choice ID if not
  - [x] For each ID in `decayNodes[]`: verify it exists in paragraph ID Set — throw with message if not
  - [x] For each act in `acts[]`: for each ID in `act.paragraphIds[]`: verify it exists in paragraph ID Set — throw with message if not
  - [x] For each gauge with `gameOverThreshold` defined: verify `gameOverCondition` is also defined (and vice versa)

- [x] Create `components/DevErrorScreen.tsx` (AC: 7)
  - [x] Simple client component displaying the error message
  - [x] Props: `{ error: Error }`
  - [x] Display error message prominently (use `--color-danger` for styling)
  - [x] Add label: "Story Configuration Error — Developer Only" to make clear this is never player-facing
  - [x] Style: dark background, monospace font for error message, no game UI elements

- [x] Update `app/page.tsx` to load and validate (AC: 6)
  - [x] Make the page an async server component (default in Next.js app router)
  - [x] Load story config via `fs.readFile` (server-side, avoids URL issues) — parses JSON, calls `validateStoryConfig`
  - [x] Call `validateStoryConfig(data)` — wrap in try/catch for `StoryValidationError`
  - [x] If `StoryValidationError` caught: return `<DevErrorScreen error={e} />`
  - [x] If valid: render the story reader UI (placeholder `<div>Story loads here</div>` is acceptable for this story — StoryReader is built in Epic 3)
  - [x] Pass validated `storyConfig` as prop to the story reader component when it exists

- [x] Verify no circular imports (AC: 8)
  - [x] Confirmed `engine/storyValidator.ts` only imports from `engine/types.ts`
  - [x] `npx tsc --noEmit` — zero errors

## Dev Notes

- **`unknown` input type:** `validateStoryConfig(data: unknown)` — the raw JSON from `fetch().json()` is `unknown`. Use type narrowing and explicit checks rather than type casting. Return the fully typed `StoryConfig` only after all checks pass.
- **Error message quality:** The error message must identify the specific failure point — not just "invalid config". Examples: `"Invalid story config: choice 'choice-2' in paragraph 's15a' references non-existent targetParagraphId 's99'"`. This is what NFR12 requires.
- **`app/page.tsx` fetch pattern:** In Next.js app router server components, `fetch` works but with a relative path may require the base URL. Use `process.env.NEXT_PUBLIC_BASE_URL` or hardcode `http://localhost:3000` for dev, or use `fs.readFile` for server-side JSON loading as an alternative. The simplest approach for a static JSON in `public/`: read it directly with `fs` in the server component to avoid URL issues.
  - Alternative: `import storyData from '@/../public/stories/dub-camp.json'` with `resolveJsonModule: true` in tsconfig (check if already enabled).
- **DevErrorScreen: never in production with valid JSON.** If `dub-camp.json` is valid, this component never renders. It's purely a developer safety net.
- **`cache: 'no-store'`:** During development, you may want fresh fetches. In production with a static JSON, the default Next.js caching is fine.
- **Minimal `app/page.tsx` for now:** This story only needs the fetch → validate → error-or-render structure. The actual `StoryReader` import comes in Story 3.4.

### Project Structure Notes

Files to create:
- `engine/storyValidator.ts` (new)
- `components/DevErrorScreen.tsx` (new)

Files to modify:
- `app/page.tsx` — add fetch + validate logic, replace default Next.js starter content

Prerequisites:
- Story 1.2 must be complete (`engine/types.ts` must exist with `StoryConfig`, `StoryValidationError`)

### References

- [Source: architecture.md#Error-Handling] — "Invalid story JSON at load → `storyValidator.ts` throws `StoryValidationError` → `<DevErrorScreen>` (never in prod if JSON is valid)"
- [Source: architecture.md#Component-Architecture] — `DevErrorScreen.tsx` described as "Config validation errors — never player-facing"
- [Source: architecture.md#Data-Flow] — `fetch('/stories/dub-camp.json') → storyValidator.ts → storyEngine.ts`
- [Source: project-context.md#Critical-Dont-Miss-Rules] — "DevErrorScreen is never player-facing — config errors only, dev environment only"
- [Source: epics.md#Story-2.1] — Full acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation, zero type errors on first pass.

### Completion Notes List

- Implemented `validateStoryConfig(data: unknown): StoryConfig` using exhaustive type guards and explicit field checking (no `any`, no casting)
- All 11 top-level required fields validated with type-specific checks
- Nested validation covers: meta/exampleProfiles, stats[], gauges[], acts[], decayRules[], paragraphs{}, endStateTiers[], choices[], gaugeEffects[], weightedOutcomes[]
- Exactly-one-score-gauge invariant enforced
- `gameOverThreshold`/`gameOverCondition` co-presence enforced on each gauge
- Referential integrity: choice targets, decayNodes entries, and act paragraphIds all checked against `Set<string>` of paragraph keys
- Error messages identify specific field path + value (e.g. `choice 'x' in paragraph 'y' references non-existent targetParagraphId 'z'`) — satisfies NFR12
- `app/page.tsx` uses `fs.readFile` (server-side) to avoid URL issues in Next.js App Router server components; handles ENOENT gracefully (story JSON not yet available in Epic 2)
- `DevErrorScreen.tsx` uses CSS custom properties (`--color-danger`, `--color-surface`) so it inherits design tokens without hardcoded colors
- Import boundary confirmed: `engine/storyValidator.ts` → `./types` only; `app/page.tsx` → `@/engine/storyValidator` + `@/engine/types` + `@/components/DevErrorScreen`
- `npx tsc --noEmit` passes with zero errors; `npx vitest run` exits cleanly (0 tests expected — test suite is Story 2.6)

### File List

- `engine/storyValidator.ts` — new, pure TypeScript validator
- `components/DevErrorScreen.tsx` — new, developer-only error display
- `app/page.tsx` — modified, now async server component with story loading + validation
