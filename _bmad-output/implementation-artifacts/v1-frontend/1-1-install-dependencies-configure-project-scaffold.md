# Story 1.1: Install Dependencies & Configure Project Scaffold

Status: complete

## Story

As a developer,
I want all required dependencies installed and configured (shadcn/ui, Vitest, Lora + Inter fonts, design token baseline, `public/stories/` directory),
so that the project compiles cleanly and every subsequent story has a ready-to-use foundation.

## Acceptance Criteria

1. `npx shadcn@latest init` has been run and `components.json` is committed
2. `vitest` and `@vitest/ui` are installed as dev dependencies with a `vitest.config.ts` at project root that targets `engine/**/*.test.ts`
3. `app/layout.tsx` loads Lora (body) and Inter (UI) via `next/font/google` with no fallback to Geist
4. `app/globals.css` defines the full app shell `@theme` token set: `--color-bg: #0f0f0f`, `--color-surface: #1a1a1a`, `--color-text-primary: #f0ece4`, `--color-text-muted: #7a7672`, `--color-accent: #d4935a`, `--color-danger: #c0392b`, prose type scale (20px Lora body, Inter UI), and base reading layout (`max-width: 65ch`, `padding: 0 1.5rem`)
5. `public/stories/` directory exists in the repo (with a `.gitkeep` if empty)
6. `npm run dev` starts without errors; `npx vitest` runs without errors (0 tests is acceptable)

## Tasks / Subtasks

- [x] Install shadcn/ui and initialize (AC: 1)
  - [x] Run `npx shadcn@latest init` — select dark mode, CSS variables, and default slate palette (can override later)
  - [x] Verify `components.json` is created at project root
  - [x] Stage `components.json` for commit

- [x] Install Vitest (AC: 2)
  - [x] Run `npm install -D vitest @vitest/ui`
  - [x] Create `vitest.config.ts` at project root:
    ```typescript
    import { defineConfig } from 'vitest/config'
    export default defineConfig({
      test: {
        include: ['engine/**/*.test.ts'],
        environment: 'node',
      },
    })
    ```
  - [x] Verify `npx vitest run` executes without error (0 tests passes)

- [x] Replace default Geist fonts with Lora + Inter (AC: 3)
  - [x] Open `app/layout.tsx`
  - [x] Remove `Geist` and `Geist_Mono` imports from `next/font/google`
  - [x] Import `Lora` (subsets: `latin`, weights: `400`, `700`, `variable`) and `Inter` (subsets: `latin`, variable)
  - [x] Apply `lora.variable` as `--font-lora` and `inter.variable` as `--font-inter` on the `<html>` element
  - [x] Remove any references to `geistSans` or `geistMono` from className

- [x] Configure design tokens in `app/globals.css` (AC: 4)
  - [x] Replace existing `@theme` block (or add if absent) with the full token set:
    - App shell colors: `--color-bg: #0f0f0f`, `--color-surface: #1a1a1a`, `--color-text-primary: #f0ece4`, `--color-text-muted: #7a7672`, `--color-accent: #d4935a`, `--color-danger: #c0392b`
    - Typography: `--font-prose: var(--font-lora)`, `--font-ui: var(--font-inter)`
    - Prose scale: `--prose-font-size: 1.25rem` (20px), `--prose-line-height: 1.72`
    - Reading layout: `--reading-max-width: 65ch`, `--reading-padding: 0 1.5rem`
  - [x] Set `body` background to `var(--color-bg)` and color to `var(--color-text-primary)` as base styles
  - [x] Ensure no hardcoded hex values remain in component-level CSS

- [x] Create `public/stories/` directory (AC: 5)
  - [x] Create `public/stories/.gitkeep` (empty file so directory is tracked by git)

- [x] Verify everything works end-to-end (AC: 6)
  - [x] Run `npm run dev` — confirm no startup errors in terminal
  - [x] Open browser at localhost:3000 — confirm page loads with dark background (#0f0f0f)
  - [x] Run `npx vitest run` — confirm exits with 0 failures

## Dev Notes

- **Tailwind v4 critical:** This project uses Tailwind CSS v4. There is NO `tailwind.config.js` — design tokens go in `app/globals.css` under the `@theme` directive. Do NOT create a `tailwind.config.js` or `tailwind.config.ts` file.
- **Geist removal:** The `create-next-app` starter installs `next/font/local` Geist as default. You must fully replace it — remove the import, remove className references. Lora and Inter are both available via `next/font/google`.
- **shadcn/ui init:** During `npx shadcn@latest init`, it will ask about style (select "default"), base color (select "slate" or "zinc"), and CSS variables (select "yes"). The `components.json` stores shadcn configuration. Only the `Sheet` component is needed in v1 (CharacterSheet), but init must happen before any shadcn components can be added.
- **Font variable CSS:** The `next/font/google` variable fonts expose as CSS custom properties. Use `.variable` class on `<html>` to make them available. The `lora.variable` produces `--font-lora`, `inter.variable` produces `--font-inter`.
- **vitest.config.ts placement:** Must be at project root (same level as `package.json`). The `include` pattern `engine/**/*.test.ts` means engine tests are auto-discovered — no manual test file registration needed.

### Project Structure Notes

Files to create:
- `vitest.config.ts` (new file at project root)
- `public/stories/.gitkeep` (new directory + placeholder)
- `components.json` (auto-generated by shadcn init)

Files to modify:
- `app/layout.tsx` — replace Geist with Lora + Inter fonts
- `app/globals.css` — replace/extend `@theme` block with full token set

Files NOT to touch:
- `next.config.ts` — no changes needed
- `tsconfig.json` — no changes needed at this stage
- `package.json` — only modified automatically by npm install

### References

- [Source: architecture.md#Starter-Template-Evaluation] — shadcn/ui, Vitest, Lora + Inter still to add
- [Source: architecture.md#Frontend-Architecture] — Tailwind v4 CSS-first `@theme` approach
- [Source: architecture.md#Naming-Patterns] — CSS custom property names (`--color-bg`, `--color-surface`, etc.)
- [Source: project-context.md#Framework-Specific-Rules] — "Tailwind CSS 4.x — CSS-first: use `@theme` in `globals.css`, NOT `tailwind.config.js`"
- [Source: project-context.md#Framework-Specific-Rules] — "Fonts: Lora + Inter via `next/font/google` (Geist is the starter default — replace it)"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- shadcn/ui initialized with new-york style, neutral base color, CSS variables enabled
- Vitest v4 + @vitest/ui installed; config targets `engine/**/*.test.ts` with `passWithNoTests: true`
- Geist fonts fully removed, Lora (400/700) + Inter loaded via `next/font/google`
- Design tokens use indirection pattern: `--color-bg: var(--ts-bg)` in @theme, `--ts-bg: #0f0f0f` in `:root` (enables runtime theme overrides)
- Body base styles set via `@layer base` using tree-story CSS variables
- `public/stories/.gitkeep` created
- `npx tsc --noEmit` passes, `npx vitest run` exits clean (0 tests)

### File List

- `components.json` — new, shadcn/ui configuration
- `vitest.config.ts` — new, Vitest configuration
- `app/layout.tsx` — modified, Geist → Lora + Inter
- `app/globals.css` — modified, full @theme token set + body base styles
- `public/stories/.gitkeep` — new, directory placeholder
- `package.json` — modified, new dependencies (vitest, @vitest/ui, shadcn, etc.)
- `package-lock.json` — modified, lockfile update
- `lib/utils.ts` — new, shadcn auto-generated cn() utility
