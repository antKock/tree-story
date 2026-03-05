---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-03-03'
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-tree-story-2026-03-01.md"
  - "_bmad-output/project-context.md"
  - "docs/story-format-spec.md"
  - "docs/tree-story-audit-v1.md"
  - "docs/dubcamp-histoire-v08.md"
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 4
classification:
  projectType: web_app_with_api_backend
  domain: general_entertainment_interactive_fiction
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - tree-story

**Author:** Anthony
**Date:** 2026-03-03

## Executive Summary

tree-story is a mobile-first interactive fiction web app that makes branching narrative fiction accessible to people who never intended to read a gamebook. Today it works: one story (Dub Camp) is live, fully playable end-to-end on a phone, with character creation, weighted outcomes, gauge-based progression, and localStorage persistence. No account, no tutorial, no friction.

This PRD covers the introduction of **server capabilities** — the first architectural shift from a fully static client-side app to a hybrid client-server product. Four features drive this shift: a **leaderboard** where players see how their score compares to others who finished the same story; **player name capture** at character creation to identify leaderboard entries; **live story updates** so story content can be changed without a git push (a stepping stone toward future author tooling); and **multi-story support** with unique URLs per story and a story listing screen when no story is specified.

The tone remains intimate: the leaderboard is a shared scoreboard between friends, not a competitive ranking. The server layer is infrastructure for growth — not a product pivot.

### What Makes This Special

tree-story's server capabilities are designed to be invisible to the player experience. A name field at character creation. A score comparison after finishing. A new story available at a different URL. None of these introduce friction, accounts, or onboarding gates. The architectural investment enables three growth vectors — social proof (leaderboard), content velocity (live updates), and content breadth (multi-story) — while preserving the zero-friction reading experience that defines the product.

## Project Classification

- **Project Type:** Web app with API backend — existing static Next.js SPA extended with server-side API
- **Domain:** Entertainment / interactive fiction — no regulatory or compliance concerns
- **Complexity:** Medium — the domain is simple but the architectural shift from static to client-server adds meaningful technical scope
- **Project Context:** Brownfield — extending an existing, shipped, working product

## Success Criteria

### User Success

- A player who finishes a story sees a leaderboard with other players' scores and names
- A player can access any story via its unique URL without confusion
- The landing screen shows all available stories when no specific story is in the URL

### Technical Success

- Story JSON can be updated without a git push or redeployment
- Server infrastructure is simple to operate — no dedicated database server to manage
- Existing localStorage-based save/resume continues to work unchanged

### Measurable Outcomes

- Leaderboard displays at least the player's score and rank among all completions for that story
- Story listing page loads and routes correctly for 2+ stories
- A story update is reflected live within minutes, not deploy cycles

## User Journeys

### Léa — Discovers the leaderboard

Léa finishes Dub Camp on the metro. The end screen shows her Kiff score: 87. Below it, a simple list — other players who finished, their names, their scores. She's 4th out of 12. "Pas mal." She screenshots it and sends it to the friend who shared the link. "T'as fait combien toi ?" The friend replies: "63, j'ai trop bu." Léa laughs. She considers replaying to beat the top score.

**Reveals:** Leaderboard UI on end screen, per-story ranking, score + name display, no account needed.

### Léa — Finds a second story

A week later, Léa remembers tree-story and opens the same URL. Instead of Dub Camp loading directly, she sees a screen listing two stories — Dub Camp (which shows a small "Terminé" badge) and a new one she hasn't played. She taps the new one. Character creation, new stats, new world. Same zero-friction experience.

**Reveals:** Story listing page at `/`, per-story URLs, completion state indicator, seamless transition to any story.

### New player — Arrives via direct story link

Someone shares `tree-story.app/dub-camp` in a group chat. A new player taps it. They land directly on Dub Camp's landing page — no story listing, no detour. They enter their name at character creation, play through, and see the leaderboard at the end.

**Reveals:** Direct story URL bypasses listing, name field at character creation (simple text input, not an account), seamless first experience preserved.

### Anthony — Updates a story live

Anthony notices a typo in paragraph s31 of Dub Camp. He edits the story JSON (through whatever admin mechanism exists — API call, simple upload form, or a CLI tool), and the fix is live within minutes. No git commit, no Vercel redeploy. Players loading the story after the update get the corrected version.

**Reveals:** Server-side story storage, story update mechanism, no-downtime content refresh, versioning considerations (what about players mid-session with cached content?).

### Journey Requirements Summary

| Capability | Revealed by |
|---|---|
| Leaderboard UI (end screen, per-story) | Léa — leaderboard |
| Player name capture at character creation | New player — direct link |
| Story listing page with completion state | Léa — second story |
| Per-story URL routing (`/<story-id>`) | New player, Léa — second story |
| Server-side story JSON storage + retrieval | Anthony — live update |
| Story update mechanism (API/upload) | Anthony — live update |
| Score submission API (name + score + story) | Léa — leaderboard |

## Web App + API Specific Requirements

### Technical Architecture Considerations

**Frontend (existing, extended):**
- Next.js App Router — remains an SPA with `"use client"` components for the engine
- Multi-story routing: `/<story-id>` for individual stories, `/` for story listing
- Server-side rendering for story pages — meta tags (title, description, OG image) for social preview when sharing links
- Story JSON fetched from server API instead of `public/stories/`

**API Backend (new):**
- Next.js API routes (or Route Handlers) — no separate backend service
- Simple REST endpoints, JSON format throughout
- Authentication: API key for admin endpoints (story upload/update); no auth for public endpoints (story fetch, leaderboard read, score submission)

### API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/stories` | Public | List all available stories (id, title, description, meta) |
| `GET` | `/api/stories/:id` | Public | Fetch full story JSON |
| `POST` | `/api/stories/:id` | API key | Upload or update a story JSON |
| `GET` | `/api/stories/:id/leaderboard` | Public | Get leaderboard entries for a story |
| `POST` | `/api/stories/:id/scores` | Public | Submit a score (name, score, storyId) |

### Data Storage

- Story JSON files: server-side storage (file system, S3-compatible, or database — to be decided in architecture)
- Leaderboard entries: lightweight persistent store (database or flat file — to be decided)
- No user accounts, no sessions, no cookies

### Implementation Considerations

- **No anti-abuse** on score submission for now (intimate audience)
- **Leaderboard loads once** on end screen — no WebSocket, no polling
- **SSR meta tags** on `/<story-id>` pages for social link previews (OG title, description, image)
- **Backward compatibility**: existing localStorage save/resume unchanged; engine continues to work client-side with story JSON fetched from API instead of static file
- **Score submission happens once** at story end (game over or completion) — client sends name + final score + story ID

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Incremental delivery in two phases. Phase 1 adds the social layer (leaderboard) on top of the existing static app with minimal server footprint. Phase 2 restructures content delivery for multi-story support. Each phase is independently shippable.

### Phase 1 — Leaderboard (MVP)

**Core delivery:**
- Player name field at character creation (stored in engine state)
- Score submission to server at story end (name + score + story ID)
- Leaderboard displayed on end screen (per-story, loaded once)
- API: `POST /api/stories/:id/scores` + `GET /api/stories/:id/leaderboard`

**What stays unchanged:**
- Story JSON still served from `public/stories/` (static)
- Single story, single URL, no routing changes
- localStorage save/resume unchanged
- Vercel static deployment unchanged

**Minimal server footprint:** Only the leaderboard API needs a server-side store. Story content remains static.

### Phase 2 — Multi-Story + Server-Side Stories

**Core delivery:**
- Story JSON served from server API instead of `public/stories/`
- Story upload/update via `POST /api/stories/:id` (API key auth)
- Multi-story routing: `/<story-id>` loads a story, `/` shows story listing
- SSR meta tags on story pages for social link previews
- API: `GET /api/stories` + `GET /api/stories/:id` + `POST /api/stories/:id`

**Depends on Phase 1:** Reuses the server infrastructure established for leaderboard.

### Phase 3 — Growth (Post-MVP)

- Author dashboard for uploading/editing stories without Postman
- Leaderboard filtering (time-based, friends)
- Player profiles / play history
- Completion badges on story listing

### Risk Mitigation

- **Technical risk:** Server infrastructure is new territory for this project. Mitigated by Phase 1 being a tiny surface area (two endpoints, one data table) — if something goes wrong, the blast radius is small.
- **Data loss risk:** Leaderboard data is nice-to-have, not critical. No user accounts at stake. Acceptable to lose scores in worst case.
- **Scope creep risk:** Each phase has a clear "done" boundary. Phase 1 ships without touching routing or story delivery. Phase 2 ships without touching leaderboard logic.

## Functional Requirements

### Player Identity

- FR1: Player can enter their name during character creation
- FR2: Player name is stored in engine state and persisted with the save

### Leaderboard (Phase 1)

- FR3: Player's score is submitted to the server when a story ends (completion or game over)
- FR4: Player can view a leaderboard of all players who finished the same story on the end screen
- FR5: Leaderboard displays each entry's player name, score, and rank
- FR6: Leaderboard entries are sorted by score descending

### Score Submission API (Phase 1)

- FR7: Client can submit a score entry (player name, score value, story ID) via API
- FR8: Server can return all leaderboard entries for a given story via API

### Story Delivery API (Phase 2)

- FR9: Client can fetch the full story JSON for a given story ID via API
- FR10: Client can fetch a list of all available stories (ID, title, description) via API
- FR11: Admin can upload or replace a story JSON via API (API key protected)

### Multi-Story Routing (Phase 2)

- FR12: Player can access a specific story via its unique URL (`/<story-id>`)
- FR13: Player arriving at the root URL (`/`) sees a listing of all available stories
- FR14: Story listing displays each story's title and description
- FR15: Player can select a story from the listing to begin playing it

### Social Link Preview (Phase 2)

- FR16: Story pages render server-side meta tags (OG title, description, image) for social sharing previews

### Existing Capabilities (Unchanged)

- FR17: Player's in-progress game state continues to be saved and restored via localStorage
- FR18: Engine continues to operate client-side with story JSON regardless of delivery source

## Non-Functional Requirements

### Performance

- NFR1: Story JSON fetch from API completes in under 1 second on a mobile connection
- NFR2: Leaderboard loads in under 1 second on the end screen
- NFR3: Score submission does not block the end screen from rendering — fire and forget or async

### Security

- NFR4: Story upload/update API endpoint is protected by API key — rejected without valid key
- NFR5: No user-submitted content is rendered as raw HTML (player names are text-only, no XSS vector)

### Reliability

- NFR6: If the leaderboard API is unreachable, the end screen still displays normally (score, tier text) — leaderboard section shows a graceful fallback
- NFR7: If the story fetch API is unreachable (Phase 2), the app degrades gracefully rather than showing a blank screen

### Compatibility

- NFR8: All new features work on mobile Safari and Chrome (the primary usage context)
- NFR9: Server-side changes do not break existing localStorage saves — a player mid-session before an update can finish their game
