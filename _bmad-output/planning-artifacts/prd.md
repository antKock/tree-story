---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation']
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

## Product Scope

### MVP

- Player name field at character creation
- Leaderboard shown at end-of-story (per story)
- Multi-story routing: `/<story-id>` loads a story, `/` shows story listing
- Server-side story JSON storage (replaces or supplements `public/stories/`)

### Growth Features (Post-MVP)

- Author dashboard for uploading/editing stories without code
- Leaderboard filtering (friends only, time-based)
- Player profiles / play history

### Vision (Future)

- Full in-browser story authoring tool
- Story sharing and publishing by external authors
- Cross-story player identity

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
