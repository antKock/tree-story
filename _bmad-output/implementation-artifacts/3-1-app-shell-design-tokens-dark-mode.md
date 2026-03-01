# Story 3.1: App Shell, Design Tokens & Dark Mode Foundation

Status: ready-for-dev

## Story

As a player,
I want the app to load with a correct dark mode visual foundation and the right typography,
so that the reading environment feels polished and intentional from the very first render.

## Acceptance Criteria

1. Background is `#0f0f0f` and prose text is `#f0ece4` — meeting WCAG AA contrast (NFR6)
2. Lora is applied to all prose content at 20px minimum; Inter is applied to all UI/mechanical elements (NFR9)
3. CSS custom properties `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-accent`, `--color-danger` are defined on `:root` and drive all color usage — no hardcoded hex values in component files
4. The reading column is centered with `max-width: 65ch` and `padding: 0 1.5rem`
5. The layout holds without horizontal scroll at 320px, 375px, and 428px viewport widths (NFR5)
6. Dark mode is the default — no light mode toggle, no `prefers-color-scheme` dependency for the base experience

## Tasks / Subtasks

- [ ] Verify and complete `app/globals.css` `@theme` tokens (AC: 1, 3)
  - [ ] Confirm (from Story 1.1) the `@theme` block defines all required tokens
  - [ ] Ensure all color tokens are present: `--color-bg: #0f0f0f`, `--color-surface: #1a1a1a`, `--color-text-primary: #f0ece4`, `--color-text-muted: #7a7672`, `--color-accent: #d4935a`, `--color-danger: #c0392b`
  - [ ] Add base CSS for body: `background-color: var(--color-bg); color: var(--color-text-primary)`
  - [ ] Verify no hardcoded hex values remain anywhere in CSS or component files

- [ ] Configure typography (AC: 2)
  - [ ] In `app/globals.css`, define CSS for prose elements: `font-family: var(--font-lora); font-size: 1.25rem; line-height: 1.72`
  - [ ] Define UI/mechanical elements class: `font-family: var(--font-inter)`
  - [ ] Add `html { font-family: var(--font-inter) }` as default (most elements are UI)
  - [ ] Add `.prose { font-family: var(--font-lora); font-size: 1.25rem; line-height: 1.72 }` utility class

- [ ] Configure reading column layout (AC: 4, 5)
  - [ ] Create a `.reading-column` or `.prose-container` CSS class (or Tailwind utility) with `max-width: 65ch; padding: 0 1.5rem; margin: 0 auto`
  - [ ] Ensure the main content area uses this class
  - [ ] Test at 320px: content fits within viewport without horizontal scroll
  - [ ] Test at 375px and 428px: no layout breakage

- [ ] Lock dark mode as default (AC: 6)
  - [ ] Ensure there is NO `prefers-color-scheme` media query that would change the theme
  - [ ] Ensure there is NO light mode CSS class or toggle
  - [ ] The `--color-bg: #0f0f0f` is always active regardless of OS preference
  - [ ] Note: act-based theme changes will be done via CSS custom property overrides at runtime (themeManager.ts) — but the DEFAULT dark theme is always set in CSS

- [ ] Update `app/layout.tsx` for proper metadata and font loading (AC: 1, 2)
  - [ ] Update `<html>` element: `className={\`${lora.variable} ${inter.variable}\`}`
  - [ ] Set `<meta name="theme-color" content="#0f0f0f">` for mobile browser chrome
  - [ ] Set `<meta name="viewport" content="width=device-width, initial-scale=1">` if not already present
  - [ ] Update page title in `metadata` export

- [ ] Visual test: verify rendering (AC: 1, 5)
  - [ ] Open `npm run dev` and check in browser dev tools
  - [ ] Set viewport to 320px — confirm no horizontal scroll, text is readable
  - [ ] Confirm background is #0f0f0f (dark, not white)
  - [ ] Confirm Lora is loaded (check font inspector in dev tools)
  - [ ] Confirm Inter is loaded for UI elements

## Dev Notes

- **Story 1.1 dependency:** This story builds on Story 1.1 which installs fonts and defines the `@theme` block. If Story 1.1 is complete, much of this is validation and refinement rather than new work.
- **Tailwind v4 `@theme` vs component CSS:** In Tailwind v4, the `@theme` directive in `globals.css` defines CSS custom properties that become Tailwind utility classes. You can use `bg-[--color-bg]` or `text-[--color-text-primary]` in components, OR just use the CSS custom properties directly in CSS. Both work — be consistent.
- **No hardcoded colors in components:** This is an absolute rule from architecture. Every color in the UI comes from a CSS custom property: `--color-bg`, `--color-surface`, `--color-text-primary`, etc. When act themes change, the CSS custom properties are overwritten by `themeManager.ts`, which automatically updates all components using those properties.
- **WCAG AA contrast:** The `#f0ece4` text on `#0f0f0f` background has a contrast ratio of approximately 14.6:1 — well above the 4.5:1 minimum. No accessibility issues.
- **`65ch` max-width:** The `ch` unit is the width of the "0" character in the current font. At 20px Lora, `65ch` ≈ 650–700px. This creates an optimal reading line length. The `padding: 0 1.5rem` ensures content doesn't touch screen edges on mobile.

### Project Structure Notes

Files to modify:
- `app/globals.css` — refine tokens, add base styles, reading column utilities
- `app/layout.tsx` — verify font setup, metadata, html classes

No new files to create in this story.

Prerequisites:
- Story 1.1 (fonts installed, initial `@theme` block created)

### References

- [Source: architecture.md#Naming-Patterns] — CSS custom property names
- [Source: architecture.md#Frontend-Architecture] — "Runtime theming via `document.documentElement.style.setProperty()` on CSS custom properties"
- [Source: epics.md#Story-3.1] — Full acceptance criteria (WCAG AA, viewport requirements)
- [Source: project-context.md#Framework-Specific-Rules] — "No hardcoded color values in component files — all colors via CSS custom properties on `:root`"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
