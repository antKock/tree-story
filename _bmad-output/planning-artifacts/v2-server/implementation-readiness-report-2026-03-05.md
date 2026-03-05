# Implementation Readiness Assessment Report

**Date:** 2026-03-05
**Project:** tree-story (v2-server)

---

## Document Inventory

| Document | File | Status |
|---|---|---|
| PRD | `v2-server/prd.md` | Found |
| Architecture | `v2-server/architecture.md` | Found |
| UX Design | `v2-server/ux-design-server-capabilities.md` | Found |
| Epics & Stories | — | **MISSING** |

**stepsCompleted:** [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]

---

## PRD Analysis

### Functional Requirements

| ID | Requirement | Phase |
|---|---|---|
| FR1 | Player can enter their name during character creation | 1 |
| FR2 | Player name is stored in engine state and persisted with the save | 1 |
| FR3 | Player's score is submitted to the server when a story ends (completion or game over) | 1 |
| FR4 | Player can view a leaderboard of all players who finished the same story on the end screen | 1 |
| FR5 | Leaderboard displays each entry's player name, score, and rank | 1 |
| FR6 | Leaderboard entries are sorted by score descending | 1 |
| FR7 | Client can submit a score entry (player name, score value, story ID) via API | 1 |
| FR8 | Server can return all leaderboard entries for a given story via API | 1 |
| FR9 | Client can fetch the full story JSON for a given story ID via API | 2 |
| FR10 | Client can fetch a list of all available stories (ID, title, description) via API | 2 |
| FR11 | Admin can upload or replace a story JSON via API (API key protected) | 2 |
| FR12 | Player can access a specific story via its unique URL (`/<story-id>`) | 2 |
| FR13 | Player arriving at the root URL (`/`) sees a listing of all available stories | 2 |
| FR14 | Story listing displays each story's title and description | 2 |
| FR15 | Player can select a story from the listing to begin playing it | 2 |
| FR16 | Story pages render server-side meta tags (OG title, description, image) for social sharing previews | 2 |
| FR17 | Player's in-progress game state continues to be saved and restored via localStorage | Existing |
| FR18 | Engine continues to operate client-side with story JSON regardless of delivery source | Existing |

**Total FRs: 18** (8 Phase 1, 8 Phase 2, 2 Existing)

### Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR1 | Performance | Story JSON fetch from API completes in under 1 second on a mobile connection |
| NFR2 | Performance | Leaderboard loads in under 1 second on the end screen |
| NFR3 | Performance | Score submission does not block the end screen from rendering — fire and forget or async |
| NFR4 | Security | Story upload/update API endpoint is protected by API key — rejected without valid key |
| NFR5 | Security | No user-submitted content is rendered as raw HTML (player names are text-only, no XSS vector) |
| NFR6 | Reliability | If leaderboard API is unreachable, end screen still displays normally — graceful fallback |
| NFR7 | Reliability | If story fetch API is unreachable (Phase 2), the app degrades gracefully |
| NFR8 | Compatibility | All new features work on mobile Safari and Chrome |
| NFR9 | Compatibility | Server-side changes do not break existing localStorage saves |

**Total NFRs: 9**

### Additional Requirements / Constraints

- No anti-abuse on score submission (intimate audience assumption)
- Leaderboard loads once on end screen — no WebSocket, no polling
- No user accounts, no sessions, no cookies
- Score submission happens once at story end
- Phase 3 items explicitly out of scope (author dashboard, leaderboard filtering, player profiles, completion badges)

### PRD Completeness Assessment

The PRD is well-structured with clear phasing, user journeys that reveal requirements organically, and explicit API endpoint definitions. Requirements are numbered and traceable. The separation between Phase 1 (leaderboard) and Phase 2 (multi-story + server-side stories) is clean with clear boundaries. Risk mitigation is documented. No ambiguities or gaps detected in the PRD itself.

---

## Epic Coverage Validation

### CRITICAL: No Epics Document Found

No epics & stories document exists for v2-server. All FRs lack traceable implementation coverage.

### Coverage Matrix

| FR | Requirement | Epic Coverage | Status |
|---|---|---|---|
| FR1 | Player can enter their name during character creation | NOT FOUND | MISSING |
| FR2 | Player name stored in engine state and persisted | NOT FOUND | MISSING |
| FR3 | Score submitted to server when story ends | NOT FOUND | MISSING |
| FR4 | Player can view leaderboard on end screen | NOT FOUND | MISSING |
| FR5 | Leaderboard displays name, score, and rank | NOT FOUND | MISSING |
| FR6 | Leaderboard sorted by score descending | NOT FOUND | MISSING |
| FR7 | Client can submit score entry via API | NOT FOUND | MISSING |
| FR8 | Server returns leaderboard entries via API | NOT FOUND | MISSING |
| FR9 | Client can fetch full story JSON via API | NOT FOUND | MISSING |
| FR10 | Client can fetch list of all stories via API | NOT FOUND | MISSING |
| FR11 | Admin can upload/replace story JSON via API | NOT FOUND | MISSING |
| FR12 | Player accesses story via unique URL | NOT FOUND | MISSING |
| FR13 | Root URL shows story listing | NOT FOUND | MISSING |
| FR14 | Story listing displays title and description | NOT FOUND | MISSING |
| FR15 | Player can select story from listing | NOT FOUND | MISSING |
| FR16 | SSR meta tags for social sharing | NOT FOUND | MISSING |
| FR17 | localStorage save/restore unchanged | NOT FOUND | MISSING |
| FR18 | Engine operates client-side regardless of source | NOT FOUND | MISSING |

### Coverage Statistics

- Total PRD FRs: 18
- FRs covered in epics: 0
- Coverage percentage: **0%**

### Recommendation

Epics and stories must be created before implementation can begin. The PRD's phased structure provides a natural epic breakdown:
- **Epic 1 (Phase 1):** Leaderboard — FR1-FR8
- **Epic 2 (Phase 2):** Multi-Story + Server-Side Stories — FR9-FR18

---

## UX Alignment Assessment

### UX Document Status

**Found:** `v2-server/ux-design-server-capabilities.md` (53,275 bytes, comprehensive)

### UX ↔ PRD Alignment: FULLY ALIGNED

All 18 FRs and all 9 NFRs are addressed in the UX specification. User journeys in UX match PRD use cases (Léa — leaderboard, Léa — second story, new player — direct link, Anthony — live update). The UX spec adds significant design detail (component specs, emotional design, anti-patterns) without contradicting or exceeding PRD scope.

### UX ↔ Architecture Alignment: FULLY ALIGNED

Architecture supports all UX requirements:
- Leaderboard fade-in pattern: `fetchLeaderboard` returns `null` on failure, component renders nothing
- Name input: `playerName` in `EngineState`, 20-char sanitization at API boundary
- Theme persistence: localStorage CSS custom properties, existing token system
- "Terminé" badge: derived from save state, no new localStorage key
- Story card metadata: `stories` table has `updated_at`, player count derivable from `scores` table
- Graceful degradation: "absence over error" principle enforced in both UX and architecture

### Minor Observations (Non-blocking)

1. **Soft player count on story cards** — UX specifies vague counts ("quelques joueurs"), but no dedicated API field or endpoint for this. Derivable from `scores` table via `COUNT` aggregation in the stories list endpoint. Implementation detail, not a gap.

### Alignment Issues

None identified. PRD, UX, and Architecture are well-aligned across all requirements.

### Warnings

None.

---

## Epic Quality Review

### NOT POSSIBLE — No Epics Document

No epics & stories document exists for v2-server. This step cannot validate epic structure, story sizing, dependencies, or acceptance criteria.

### Findings

**Critical Violation:**
- No epics or stories have been created — 0 epics validated, 0 stories assessed
- This is a **blocking gap** for implementation readiness

### Remediation

Epics and stories must be created using the `create-epics-and-stories` workflow. The PRD and architecture provide sufficient detail:

**Suggested structure:**
- **Epic 1 (Phase 1 — Leaderboard):** "Player sees how their score compares to others" — FR1-FR8
  - Story candidates: Supabase schema + score submission API, name input in profile creation, leaderboard display on end screen
- **Epic 2 (Phase 2 — Multi-Story):** "Player discovers and plays multiple stories" — FR9-FR18
  - Story candidates: Story delivery API, multi-story routing, landing page with story listing, SSR meta tags, localStorage migration

**Brownfield indicators to include:**
- Integration with existing engine state (`playerName`)
- localStorage migration story for per-story keys
- Backward compatibility verification story

---

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK** — One blocking gap prevents implementation readiness.

### Assessment Summary

| Area | Status | Finding |
|---|---|---|
| PRD | PASS | Complete, well-structured, 18 FRs + 9 NFRs clearly defined with phasing |
| Architecture | PASS | Comprehensive, all FRs/NFRs covered, implementation patterns with code examples |
| UX Design | PASS | Thorough, fully aligned with PRD and architecture, component specs ready |
| Epics & Stories | **FAIL** | Document does not exist — 0% FR coverage, no implementation plan |
| UX ↔ PRD Alignment | PASS | Full alignment, no contradictions |
| UX ↔ Architecture Alignment | PASS | Full alignment, architecture supports all UX patterns |

### Critical Issues Requiring Immediate Action

1. **No Epics & Stories document** — This is the single blocking issue. Without epics and stories, there is no implementation plan, no story-level acceptance criteria, no dependency ordering, and no way to track progress. All 18 FRs have 0% coverage.

### What's Working Well

The planning foundation is strong:
- PRD is clear, well-phased, and has traceable numbered requirements
- Architecture document is implementation-ready with TypeScript code patterns, anti-patterns, directory structure, and FR-to-file mapping
- UX spec is comprehensive with component specs, interaction flows, emotional design principles, and accessibility considerations
- All three documents are tightly aligned — no contradictions or gaps between them

### Recommended Next Steps

1. **Create the epics and stories document** using the `create-epics-and-stories` workflow. The PRD's Phase 1/Phase 2 structure maps directly to two user-value epics. The architecture's implementation sequence provides the story ordering.
2. **Re-run this readiness check** after epics are created to validate FR coverage, story quality, and dependency ordering.
3. **Begin implementation** once epics pass the readiness check — the PRD, architecture, and UX documents are ready.

### Final Note

This assessment identified **1 critical issue** (missing epics document) across **6 assessment areas**. The PRD, architecture, and UX design are in excellent shape — well-aligned, comprehensive, and implementation-ready. The only gap is the missing epics & stories document, which is the bridge between planning and implementation. Create it, and v2-server is ready to build.

**Assessment conducted:** 2026-03-05
**Assessor:** Implementation Readiness Workflow (PM/SM)
