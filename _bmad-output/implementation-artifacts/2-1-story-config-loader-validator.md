# Story 2.1: Story Config Loader & Validator

Status: ready-for-dev

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

- [ ] Create `engine/storyValidator.ts` — structural validation (AC: 1, 5, 8)
  - [ ] Import types from `engine/types.ts` only
  - [ ] Export function `validateStoryConfig(data: unknown): StoryConfig` — takes raw parsed JSON, returns typed `StoryConfig` or throws
  - [ ] Check top-level required fields exist: `id`, `version`, `meta`, `stats`, `gauges`, `acts`, `decayNodes`, `decayRules`, `paragraphs`, `endStateTiers`, `statPointBudget`
  - [ ] Check field types (string, number, array, object as appropriate)
  - [ ] Validate `meta.exampleProfiles` is array (can be empty)
  - [ ] Check `stats` array has at least 1 entry, each with required `id`, `name`, `maxPerStat`
  - [ ] Check `gauges` array has at least 1 entry, each with required `id`, `name`, `icon`, `initialValue`, `isScore`, `isHidden`
  - [ ] Validate exactly one gauge has `isScore: true` (the score/kiff gauge)
  - [ ] On any failure, throw `new StoryValidationError(\`Invalid story config: <specific message>\`)`

- [ ] Add referential integrity validation (AC: 2, 3, 4, 5)
  - [ ] Build a Set of all paragraph IDs from `paragraphs` object keys
  - [ ] For each paragraph, for each choice: verify `choice.targetParagraphId` exists in Set — throw with message identifying which paragraph + choice ID if not
  - [ ] For each ID in `decayNodes[]`: verify it exists in paragraph ID Set — throw with message if not
  - [ ] For each act in `acts[]`: for each ID in `act.paragraphIds[]`: verify it exists in paragraph ID Set — throw with message if not
  - [ ] For each gauge with `gameOverThreshold` defined: verify `gameOverCondition` is also defined (and vice versa)

- [ ] Create `components/DevErrorScreen.tsx` (AC: 7)
  - [ ] Simple client component displaying the error message
  - [ ] Props: `{ error: Error }`
  - [ ] Display error message prominently (use `--color-danger` for styling)
  - [ ] Add label: "Story Configuration Error — Developer Only" to make clear this is never player-facing
  - [ ] Style: dark background, monospace font for error message, no game UI elements

- [ ] Update `app/page.tsx` to load and validate (AC: 6)
  - [ ] Make the page an async server component (default in Next.js app router)
  - [ ] Fetch story config: `const res = await fetch('/stories/dub-camp.json', { cache: 'no-store' })` — Note: in server component, use absolute URL or relative path for fetch
  - [ ] Parse JSON: `const data = await res.json()`
  - [ ] Call `validateStoryConfig(data)` — wrap in try/catch for `StoryValidationError`
  - [ ] If `StoryValidationError` caught: return `<DevErrorScreen error={e} />`
  - [ ] If valid: render the story reader UI (placeholder `<div>Story loads here</div>` is acceptable for this story — StoryReader is built in Epic 3)
  - [ ] Pass validated `storyConfig` as prop to the story reader component when it exists

- [ ] Verify no circular imports (AC: 8)
  - [ ] Confirm `engine/storyValidator.ts` only imports from `engine/types.ts`
  - [ ] Run `npm run build` or `npx tsc --noEmit` — confirm zero errors

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

### Completion Notes List

### File List
