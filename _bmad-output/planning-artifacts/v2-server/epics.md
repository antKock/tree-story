---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments:
  - "_bmad-output/planning-artifacts/v2-server/prd.md"
  - "_bmad-output/planning-artifacts/v2-server/architecture.md"
  - "_bmad-output/planning-artifacts/v2-server/ux-design-server-capabilities.md"
---

# tree-story - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for tree-story v2 server capabilities, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Player can enter their name during character creation
FR2: Player name is stored in engine state and persisted with the save
FR3: Player's score is submitted to the server when a story ends (completion or game over)
FR4: Player can view a leaderboard of all players who finished the same story on the end screen
FR5: Leaderboard displays each entry's player name, score, and rank
FR6: Leaderboard entries are sorted by score descending
FR7: Client can submit a score entry (player name, score value, story ID) via API
FR8: Server can return all leaderboard entries for a given story via API
FR9: Client can fetch the full story JSON for a given story ID via API
FR10: Client can fetch a list of all available stories (ID, title, description) via API
FR11: Admin can upload or replace a story JSON via API (API key protected)
FR12: Player can access a specific story via its unique URL (`/<story-id>`)
FR13: Player arriving at the root URL (`/`) sees a listing of all available stories
FR14: Story listing displays each story's title and description
FR15: Player can select a story from the listing to begin playing it
FR16: Story pages render server-side meta tags (OG title, description, image) for social sharing previews
FR17: Player's in-progress game state continues to be saved and restored via localStorage
FR18: Engine continues to operate client-side with story JSON regardless of delivery source

### NonFunctional Requirements

NFR1: Story JSON fetch from API completes in under 1 second on a mobile connection
NFR2: Leaderboard loads in under 1 second on the end screen
NFR3: Score submission does not block the end screen from rendering — fire and forget or async
NFR4: Story upload/update API endpoint is protected by API key — rejected without valid key
NFR5: No user-submitted content is rendered as raw HTML (player names are text-only, no XSS vector)
NFR6: If the leaderboard API is unreachable, the end screen still displays normally (score, tier text) — leaderboard section shows a graceful fallback
NFR7: If the story fetch API is unreachable (Phase 2), the app degrades gracefully rather than showing a blank screen
NFR8: All new features work on mobile Safari and Chrome (the primary usage context)
NFR9: Server-side changes do not break existing localStorage saves — a player mid-session before an update can finish their game

### Additional Requirements

**From Architecture:**
- Supabase PostgreSQL with two tables: `stories` (id, title, description, data jsonb, created_at, updated_at) and `scores` (id uuid, story_id, player_name, score, is_game_over, created_at)
- Server-only Supabase access via service role key — no client-side Supabase, no RLS
- Single Supabase client in `lib/supabase.ts` — imported only by Route Handlers and server components
- API response format: direct JSON payloads, no `{ data, error }` wrapper
- snake_case DB columns → camelCase in all API JSON responses
- Score submission: fire-and-forget with `.catch(() => {})` — never awaited
- Leaderboard fetch: 5-second AbortController timeout, returns null on any failure
- Player name sanitization: trim whitespace + max 20 characters at API boundary
- Per-story localStorage keys (`tree-story:save:<storyId>`) with migration from legacy `tree-story:save` key (Phase 2)
- New dependency: `@supabase/supabase-js`
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- No abstraction layers: no services/, repositories/, controllers/ directories
- Route Handlers always wrapped in try/catch with `{ error: '...' }` fallback
- Admin auth: Authorization header checked before any Supabase write

**From UX Design:**
- Leaderboard: fade-in 300ms opacity transition, no loading skeleton/spinner, player's own entry highlighted with `--color-accent` background at 10% opacity
- Leaderboard section label: "Classement" in Inter, `--color-text-muted`; entries are name left / score right
- No rank numbers — vertical position communicates order
- Name input: required field, label "Comment tu t'appelles ?", placeholder "Ton prénom", 16px font (prevents iOS zoom), `autocomplete="given-name"`, Commencer button disabled until name entered
- Name input sits at top of profile creation, before preset profile cards
- Landing page: hero section with illustration + headline (Lora: "Des histoires dont tu choisis la suite") + CTA ("Découvrir les histoires") that smooth-scrolls to story list
- Story cards: title (Lora), one-sentence description (Inter, muted), soft player count (vague: "quelques joueurs" etc.), last update date, optional "Terminé" badge (localStorage-powered)
- Theme continuity: landing page reads last story theme from localStorage, applies CSS custom properties
- All new surfaces: mobile-first, single centered column `max-width: 65ch`, no new design tokens
- Accessibility: WCAG 2.1 AA, semantic HTML, `aria-label` on leaderboard section, `aria-current="true"` on player's own entry, visible focus indicators
- No loading states, no success states, no error messages — absence over error

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Name input at profile creation |
| FR2 | Epic 1 | Name persisted in engine state + save |
| FR3 | Epic 1 | Score submitted at story end |
| FR4 | Epic 1 | Leaderboard displayed on end screen |
| FR5 | Epic 1 | Leaderboard shows name, score, rank |
| FR6 | Epic 1 | Leaderboard sorted by score descending |
| FR7 | Epic 1 | POST /api/stories/:id/scores endpoint |
| FR8 | Epic 1 | GET /api/stories/:id/leaderboard endpoint |
| FR9 | Epic 2 | GET /api/stories/:id — fetch story JSON |
| FR10 | Epic 2 | GET /api/stories — list all stories |
| FR11 | Epic 2 | POST /api/stories/:id — upload/replace story (API key) |
| FR12 | Epic 2 | `/<story-id>` routing |
| FR13 | Epic 2 | `/` landing page with story listing |
| FR14 | Epic 2 | Story listing shows title + description |
| FR15 | Epic 2 | Story cards are tappable to begin playing |
| FR16 | Epic 2 | SSR OG meta tags on story pages |
| FR17 | Epic 1 | localStorage save/resume verified unchanged |
| FR18 | Epic 1 | Engine operates client-side with API-sourced JSON |

## Epic List

### Epic 1: Player Identity & Social Leaderboard

Players can enter their name at character creation, finish a story, and see how their score compares to other players on the end screen. The full server infrastructure (Supabase, API routes) is established in this epic.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR17, FR18
**Additional scope:** Supabase schema setup, `@supabase/supabase-js` dependency, `lib/supabase.ts`, environment variables

### Epic 2: Multi-Story Experience & Live Updates

Players can discover stories from a landing page, navigate to any story by URL, and share social link previews. An admin can update story content live without redeploying. The app supports 2+ stories seamlessly.

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16
**Additional scope:** Per-story localStorage key migration, `app/[storyId]/page.tsx` routing restructure

---

## Epic 1: Player Identity & Social Leaderboard

Players can enter their name at character creation, finish a story, and see how their score compares to other players on the end screen. The full server infrastructure (Supabase, API routes) is established in this epic.

### Story 1.1: Supabase Infrastructure & Server Client

As a **developer**,
I want to set up the Supabase schema, seed the existing story, and configure the server client,
So that all score and leaderboard API endpoints have a working data layer to build on.

**Acceptance Criteria:**

**Given** the project has no Supabase integration
**When** setup is complete
**Then** `@supabase/supabase-js` is installed in package.json
**And** a `stories` table exists in Supabase with columns: `id` (text PK), `title` (text), `description` (text), `data` (jsonb), `created_at` (timestamptz), `updated_at` (timestamptz)
**And** a `scores` table exists with columns: `id` (uuid PK auto-generated), `story_id` (text FK → stories.id), `player_name` (text), `score` (integer), `is_game_over` (boolean), `created_at` (timestamptz)
**And** Dub Camp story JSON is seeded into the `stories` table from `public/stories/dub-camp.json`
**And** `lib/supabase.ts` exports a single named `supabase` client created with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
**And** `.env.local` and `.env.example` are created with the required env var keys
**And** the app builds and runs without errors locally

### Story 1.2: Player Name Capture at Profile Creation

As a **player**,
I want to enter my name at the start of character creation,
So that my score on the leaderboard is personally identified as mine.

**Acceptance Criteria:**

**Given** a player opens the profile creation screen
**When** the screen renders
**Then** a required name input field appears at the top of the screen with label "Comment tu t'appelles ?" and placeholder "Ton prénom"
**And** the input has `font-size: 16px` (prevents iOS Safari zoom), `autocomplete="given-name"`, and is linked to its label via `htmlFor`/`id`
**And** the "Commencer" button is disabled (opacity 0.4, pointer-events none) when the name input is empty
**And** the "Commencer" button becomes enabled as soon as any non-empty name is entered

**Given** a player enters their name and starts the story
**When** the engine state is initialized
**Then** `playerName` is stored in `EngineState` and persisted to localStorage with the save state
**And** the player is never prompted for their name again on resume

**Given** an existing player with a save state that has no `playerName` field (pre-v2 save)
**When** they resume their save
**Then** the game resumes normally without crashing — `playerName` defaults to an empty string

### Story 1.3: Score Submission API

As a **developer**,
I want a POST endpoint that accepts and stores a player's score entry,
So that finished game results are persisted server-side for leaderboard display.

**Acceptance Criteria:**

**Given** a POST request to `/api/stories/[id]/scores` with body `{ playerName, score, isGameOver }`
**When** the story ID exists in the `stories` table
**Then** a new row is inserted into the `scores` table with the submitted data
**And** `playerName` is trimmed and truncated to 20 characters before storage
**And** the response is `201 Created` with the created score entry in camelCase JSON (`{ id, storyId, playerName, score, isGameOver, createdAt }`)

**Given** a POST request for a non-existent story ID
**When** the endpoint processes the request
**Then** the response is `404 Not Found` with `{ error: 'Story not found' }`

**Given** a Supabase failure
**When** the endpoint is called
**Then** the response is `500 Internal Server Error` with `{ error: 'Internal server error' }` — never a crash or unhandled exception

**Given** a POST request without the `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` header
**When** the endpoint is called
**Then** — this is a public endpoint, no auth check applies here (auth is only on the story upload endpoint)

### Story 1.4: Leaderboard API

As a **developer**,
I want a GET endpoint that returns all score entries for a story sorted by score descending,
So that the frontend can display a ranked leaderboard.

**Acceptance Criteria:**

**Given** a GET request to `/api/stories/[id]/leaderboard`
**When** the story exists and has score entries
**Then** the response is `200 OK` with an array of entries sorted by `score` descending
**And** each entry contains: `id`, `storyId`, `playerName`, `score`, `isGameOver`, `createdAt` (all camelCase)

**Given** a GET request for a story with no score entries
**When** the endpoint is called
**Then** the response is `200 OK` with an empty array `[]`

**Given** a GET request for a non-existent story ID
**When** the endpoint is called
**Then** the response is `404 Not Found` with `{ error: 'Story not found' }`

**Given** a Supabase failure
**When** the endpoint is called
**Then** the response is `500 Internal Server Error` with `{ error: 'Internal server error' }`

### Story 1.5: Leaderboard Display on End Screen

As a **player**,
I want to see a ranked list of other players' scores after finishing a story,
So that I can compare my result and feel part of a shared experience.

**Acceptance Criteria:**

**Given** a player reaches the end screen (completion or game over)
**When** the screen renders
**Then** the score submission fires silently in the background via `POST /api/stories/[id]/scores` with `{ playerName, score, isGameOver }` — using fire-and-forget with `.catch(() => {})`, never awaited
**And** the end screen content (score, tier text, replay button) renders immediately without waiting for any API response (NFR3)

**Given** the leaderboard API returns entries within 5 seconds
**When** data arrives
**Then** a "Classement" section label (Inter, `--color-text-muted`) fades in with a 300ms opacity transition below the existing end screen content — no layout shift
**And** each entry is a card row with player name left-aligned and score right-aligned
**And** the current player's own entry is highlighted: name in `--color-text-primary`, score in `--color-accent`, row with `--color-accent` background at ~10% opacity
**And** other entries use `--color-text-muted` with transparent background
**And** entries are ordered by score descending with no rank numbers shown
**And** the leaderboard section has `aria-label="Classement des joueurs"` with semantic list markup (`role="list"`, each entry `role="listitem"`)
**And** the current player's own entry has `aria-current="true"` (NFR8)
**And** player names are rendered as text content only — never as HTML (NFR5)

**Given** the leaderboard API is unreachable, returns an error, or the 5-second AbortController timeout fires
**When** the end screen renders
**Then** the leaderboard section does not appear — the end screen is indistinguishable from the pre-v2 product (NFR6)
**And** no error message, spinner, skeleton, or broken UI element is shown

---

## Epic 2: Multi-Story Experience & Live Updates

Players can discover stories from a landing page, navigate to any story by URL, and share social link previews. An admin can update story content live without redeploying. The app supports 2+ stories seamlessly.

### Story 2.1: Story Management API

As a **developer and admin**,
I want API endpoints to list, fetch, and upload stories from Supabase,
So that story content is served from the server and can be updated live without redeployment.

**Acceptance Criteria:**

**Given** a GET request to `/api/stories`
**When** stories exist in the `stories` table
**Then** the response is `200 OK` with an array of story metadata objects: `{ id, title, description, updatedAt }` (camelCase) — the full `data` jsonb is not included in the list response

**Given** a GET request to `/api/stories/[id]`
**When** the story exists
**Then** the response is `200 OK` with the full story JSON from the `data` column, as a valid story object the engine can consume
**And** response time is under 1 second on a standard connection (NFR1)

**Given** a GET request to `/api/stories/[id]` for a non-existent story
**When** the endpoint processes the request
**Then** the response is `404 Not Found` with `{ error: 'Story not found' }`

**Given** a POST request to `/api/stories/[id]` with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` and a valid story JSON body
**When** the request is processed
**Then** the story is upserted into the `stories` table (insert or replace)
**And** `title` and `description` are extracted from the story JSON and stored in their respective columns
**And** the response is `201 Created` with `{ id, title, description, updatedAt }`

**Given** a POST request to `/api/stories/[id]` with a missing or invalid Authorization header
**When** the request is processed
**Then** the response is `401 Unauthorized` with `{ error: 'Unauthorized' }` — no Supabase call is made (NFR4)

**Given** any Supabase failure on any endpoint
**When** the request is processed
**Then** the response is `500 Internal Server Error` with `{ error: 'Internal server error' }`

### Story 2.2: Per-Story Routing with SSR Meta Tags

As a **player**,
I want to access any story via its unique URL and share it with a rich link preview,
So that I can navigate directly to a specific story and friends see an informative preview when I share it.

**Acceptance Criteria:**

**Given** a player navigates to `/<story-id>` (e.g., `/dub-camp`)
**When** the page loads
**Then** the story page renders with story content fetched server-side from Supabase in `app/[storyId]/page.tsx`
**And** the existing `StoryReader` client component receives story data as props and operates unchanged
**And** the engine continues to function entirely client-side (FR18)

**Given** a player navigates to `/<story-id>` for a non-existent story
**When** the page loads
**Then** a graceful fallback is shown — no blank screen, no unhandled error (NFR7)

**Given** the `generateMetadata()` function in `app/[storyId]/page.tsx`
**When** a story URL is shared on social platforms
**Then** the OG meta tags include `og:title` (story title), `og:description` (story description), and `og:image` if available (FR16)

**Given** a player has an existing save from before Epic 2 (using the legacy `tree-story:save` key)
**When** they load `/<story-id>` for the first time after the migration
**Then** the persistence layer runs `migrateToPerStoryKey(storyId)`: if `tree-story:save` exists and `tree-story:save:<storyId>` does not, the data is moved to the new key and the old key is removed
**And** the player's save is preserved — they can resume their game without data loss (NFR9)

**Given** a player's save now uses the `tree-story:save:<storyId>` key format
**When** they play and save progress
**Then** saves are stored and retrieved using `tree-story:save:<storyId>` going forward

### Story 2.3: Story Listing Landing Page

As a **player**,
I want a landing page at `/` that shows all available stories,
So that I can discover new stories and return to ones I've already played.

**Acceptance Criteria:**

**Given** a player navigates to `/`
**When** the page loads
**Then** a hero section renders with: an illustration/logo element, headline in Lora ("Des histoires dont tu choisis la suite"), sub-headline in Inter, and a CTA button ("Découvrir les histoires ↓") that smooth-scrolls to the story list section (FR13)
**And** the story list shows all available stories fetched from Supabase in the server component
**And** each story card displays: title (Lora, `--color-text-primary`), one-sentence description (Inter, `--color-text-muted`), soft player count (vague: "quelques joueurs" <10, "une dizaine de joueurs" 10–30), and last update date (FR14)
**And** tapping a story card navigates to `/<story-id>` — the entire card is the tap target as a `<Link>` (FR15)

**Given** a player has previously completed a story (their save state indicates the story has ended)
**When** the landing page loads
**Then** that story's card shows a subtle "Terminé" badge (derived from localStorage, `--color-text-muted` pill, top-right of card) with `aria-label="Histoire terminée"`

**Given** a player's last story theme is stored in localStorage
**When** the landing page mounts
**Then** the CSS custom properties from that theme are applied to `:root` — the page inherits the last story's color palette
**And** if no localStorage theme exists (first visit or cleared storage), app shell defaults apply (`--color-bg: #0f0f0f`, `--color-accent: #d4935a`)

**Given** the Supabase story list fetch fails
**When** the page renders
**Then** a static fallback message is shown — never a blank page (NFR7)

**Given** a player using keyboard-only navigation
**When** they tab through the landing page
**Then** tab order follows visual order: hero CTA → story cards top to bottom
**And** all interactive elements have visible focus indicators (`outline: 2px solid var(--color-accent)`, `outline-offset: 2px`)
**And** story cards have descriptive `aria-label` combining title + completion state
