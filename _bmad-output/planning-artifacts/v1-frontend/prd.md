---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-03-01'
classification:
  projectType: web_app
  domain: general_entertainment_interactive_fiction
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-tree-story-2026-03-01.md"
  - "tree-story-brief-by-claude.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "dubcamp-histoire-v08.md"
workflowType: 'prd'
briefCount: 2
researchCount: 0
brainstormingCount: 0
projectDocsCount: 2
---

# Product Requirements Document - tree-story

**Author:** Anthony
**Date:** 2026-03-01

## Executive Summary

tree-story is a mobile-first interactive story web app that makes branching narrative fiction accessible to people who have never engaged with the gamebook format — and never intended to. Built for 2–10 minute reading sessions on a phone, in dark mode, with no account, no tutorial, and no onboarding gate, it takes the core mechanics of Choose Your Own Adventure (branching choices, character progression, weighted outcomes) and makes them completely invisible. The player reads. The story responds. The engine disappears.

The initial release ships one complete story: *Dub Camp*, a 53-paragraph festival-night narrative with 4 player stats, 5 gauges, 10 weighted outcome moments, and natural gauge decay tied to story progression. It is playable end-to-end from a public URL on a mobile browser without any account or install.

**Target user:** Léa — early 30s, metro commuter, reflexively opens Instagram not books. Drawn to narrative; repelled by the visual and cognitive weight of every existing gamebook implementation. Needs zero friction at every step: open the URL, start reading, close it, come back exactly where she left off.

### What Makes This Special

Every existing interactive fiction implementation exposes its machinery — numbered choice lists, numeric stat displays, dice metaphors, character creation gates before the first word of story. tree-story hides the engine entirely. Stats, gauges, weighted outcomes, and gauge decay are all fully story-configured via a JSON story definition: the engine is generic, each story defines its own mechanics, visual palette, and atmospheric progression. Players feel consequence without ever seeing the formula.

The product is deliberately not a game. There is no score to optimise, no correct path, no failure anxiety. Choices are narrative decisions, not strategic moves. The UI is typographically-first — Lora at 20px, dark-mode-native, max 65ch — designed to be indistinguishable from reading a well-designed article, except the story forks.

The consequence reveal — when a choice made chapters earlier surfaces as a present story beat — is the product's signature emotional moment. It is not marketed; it is discovered.

## Project Classification

- **Type:** Web app — Next.js, mobile-first responsive, localStorage persistence, no authentication
- **Domain:** Entertainment / Interactive Fiction
- **Complexity:** Medium — story engine mechanics (weighted outcomes, gauge systems, natural decay, runtime JSON-driven theming) within a standard web stack; no regulatory, compliance, or external integration requirements
- **Context:** Greenfield personal project, launching with one story for a small circle of friends

## Success Criteria

### User Success

- A player opens the URL on a mobile browser, reads the first paragraph, and makes their first choice without any onboarding, signup, or tutorial prompt
- A player can close the browser mid-story and return to the exact paragraph they left — no re-orientation, no "continue?" prompt, no lost progress
- At the end of a story (win or Game Over), the player is presented with their outcome and offered a clear path to replay from the beginning
- Stat and gauge changes are never experienced as interruptions — they are felt as story consequence, not as UI events
- A player completing a session of any length (3 minutes or 45) does not feel guilt or a sense of incomplete progress

### Business Success

For a personal project of this scope, business success is personal and qualitative:

- Anthony completes *Dub Camp* himself — on his phone, during actual short sessions — and enjoys it without reservations
- Anthony feels proud showing it to friends, not as a tech demo, but as something with genuine experience value
- 1–2 non-technical friends respond with genuine curiosity when shown the product
- **Growth trigger:** ~15 friends actively playing → triggers evaluation of native app packaging (PWA / app store)

What is **not** being measured: user acquisition, retention rates, DAU/MAU, revenue, story completion rates at scale.

### Technical Success

- **Transitions:** Choice resolution and next-paragraph render in under 200ms — the story feels continuous, not paginated
- **Persistence:** Progress auto-saved to localStorage after every choice; survives browser close, tab switch, and device lock
- **Offline:** Once the story assets are loaded, the session is fully playable without network connectivity
- **Mobile baseline:** Experience holds on a mid-range Android phone (Chrome) in real commute conditions — small screen, one hand, ambient light variation
- **Stability:** A player can complete a full story, including Game Over paths and replay, without hitting a broken or undefined state

### Measurable Outcomes

- [ ] At least one complete story playable end-to-end via a public URL
- [ ] All 4 player stats and 5 gauges update correctly throughout *Dub Camp*, including natural decay at major nodes
- [ ] All 4 Game Over paths reachable and handled — player shown outcome and offered replay
- [ ] Risk moments resolve without any visible arithmetic or probability signal
- [ ] Progress survives browser close and reopens at exact paragraph
- [ ] Experience passes a real-world mobile test (Anthony, on his phone, commute conditions)

## User Journeys

### Journey 1 — Léa: First-Time Player (Success Path)

Léa is on the metro, platform delayed, phone in hand. A friend's message contains a link — some kind of "interactive story thing." She taps it without context.

The URL opens directly to *Dub Camp*. No splash screen, no signup prompt. A short character creation screen asks her to distribute 8 points across four stats — Endurance, Stomach, Alcohol Resistance, Herb Resistance. She reads the example profiles, picks something that feels like her, taps Start.

The first paragraph loads. She reads. At the end, two rounded cards appear below the text — two choices, each a full sentence. She taps one by instinct. The next paragraph arrives immediately. She's in.

Three stops pass. She taps through four paragraphs. The gauge strip at the top shifts once — the ⚡ bar drops slightly after a concert sequence. She notices but doesn't break stride. The metro arrives; she locks her phone.

Two days later she opens the URL again. She's exactly where she stopped — mid-paragraph, mid-evening at the festival. No prompt, no reload screen. She reads a paragraph and a choice she made three chapters ago surfaces as a consequence in this one. She didn't see it coming. She wants to know what the other path looked like.

She finishes the story. Her Kiff score determines the outcome tier. She reads the result, smiles, and taps "Play Again."

**Capabilities revealed:** Direct URL entry to story, character profile creation screen, story reading + card choice UI, gauge strip with real-time updates, localStorage auto-save and resume, Game Over / end-of-story outcome screen, replay flow.

---

### Journey 2 — Léa: Game Over + Replay

It's the same evening. Léa made different choices this time — joined Brian in the transat at 13h, accepted every joint, drank on an empty stomach. At §40A a bad weighted outcome pushes her Alcool gauge past the threshold. The story shifts — not a popup, not a modal — just the next paragraph describes the floor becoming unsteady. A bénévole appears. She finds herself at the medical post.

The screen shows her Game Over state: a short narrative paragraph, her current Kiff score, and a single prompt: "Rejouer depuis le début?" She taps it. The character creation screen reappears. She redistributes her stats differently this time — more Alcohol Resistance — and starts again.

Nothing was lost. No error state, no confusion. The experience was complete even in failure.

**Capabilities revealed:** All Game Over paragraph branches handled as valid story states, Kiff score surfaced at end/Game Over, replay resets story state and returns to character creation, localStorage cleared correctly on replay.

---

### Journey 3 — Anthony: Story Authoring & Deployment (v1)

Anthony has a new story he wants to add — or an update to *Dub Camp*. The story exists as a structured markdown document (like `dubcamp-histoire-v08.md`): paragraphs, choices, gauge effects, weighted outcomes, game design notes.

He opens the JSON story format specification — a reference document that describes every field in the story config schema: paragraph structure, choice arrays, gauge definitions, stat definitions, weighted outcome format, decay rules, act-based palette configuration, Game Over flags, score gauge designation, and end-state tier definitions.

He pastes the story document and the JSON spec into an LLM prompt. The LLM produces a valid story JSON. Anthony reviews it against the spec, checks the paragraph IDs match the choice targets, validates the gauge math is consistent, and drops the file into the `/stories` directory of the repo. He deploys (or runs locally). The app reads the story config on load and *Dub Camp* is playable.

If the JSON is malformed or references a missing paragraph ID, the app surfaces a clear developer-facing error at load time (not a silent runtime failure mid-story).

**Capabilities revealed:** Story JSON format specification document (v1 deliverable, not a UI), story loader that reads and validates JSON config at startup, developer-facing error on invalid story config, `/stories` directory convention in repo.

---

### Journey Requirements Summary

| Capability Area | Revealed By |
|---|---|
| Character profile creation (story-configured stats) | Journey 1, 2 |
| Story reader: paragraph display, card choices | Journey 1, 2 |
| Gauge strip: story-configured gauges, real-time updates | Journey 1, 2 |
| Weighted outcome resolution (invisible to player) | Journey 1, 2 |
| Natural gauge decay at story-defined nodes | Journey 1, 2 |
| localStorage auto-save + seamless resume | Journey 1 |
| Game Over state: narrative paragraph + Kiff reveal + replay | Journey 2 |
| End-of-story outcome tiers + replay | Journey 1, 2 |
| Story state reset on replay | Journey 2 |
| **JSON story format specification document** | Journey 3 |
| Story JSON loader + startup validation | Journey 3 |
| Developer-facing error on invalid config | Journey 3 |
| Act-based color palette switching at runtime | Journey 1 |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Story-Driven Runtime Visual Theming**
The app has no fixed visual identity beyond typography and dark-mode defaults. Every story ships with a full color palette and a set of act-based theme overrides, applied via CSS custom properties at runtime from the story JSON. As the player progresses, the visual atmosphere evolves — *Dub Camp* moves from warm ochre afternoon through amber golden hour to electric purple night to desaturated late-night intimacy. No existing interactive fiction platform treats visual atmosphere as story-authored content.

**2. Fully Invisible Mechanics**
Existing gamebook apps hide *some* game mechanics from the player (probability values, internal dice results). tree-story hides *all* of it — weighted outcomes, gauge arithmetic, decay calculations, score accumulation — with zero numeric display to the player at any point during play. Every mechanical event is expressed purely as narrative consequence and visual gauge shift. The player never performs or observes arithmetic.

**3. Story-Agnostic Engine via JSON Configuration**
The engine makes no assumptions about story content: stat names, stat count, gauge names, gauge count, decay schedules, score gauges, weighted outcome formulas, end-state tier definitions, and visual palette are all defined in a story JSON file. A story about startup founders and a story about a festival night run on the same engine with no code changes. This architectural decision enables genre-agnostic positioning and future author extensibility.

### Validation Approach

- **Runtime theming:** *Dub Camp*'s four act transitions serve as the primary validation — if the palette switch is imperceptible as a "UI event" and feels like the story world shifting, the pattern works
- **Invisible mechanics:** Playtesting with non-technical friends who never notice gauge math or probability signals validates this; the bar is "they never think about numbers"
- **Agnostic engine:** A second story with meaningfully different mechanics (different stat set, different gauge count) validates the JSON schema is genuinely flexible, not just parameterised for one story

### Risk Mitigation

- **Runtime theming:** Story authors must validate accent color contrast against act backgrounds before publishing — enforced at JSON validation time, not runtime
- **Invisible mechanics:** Risk is that players feel outcomes are arbitrary rather than consequential; mitigated by writing story consequences that clearly reflect cause and effect in prose
- **Agnostic engine:** Risk is an overly complex JSON schema that makes authoring difficult; mitigated by the LLM-assisted translation workflow and a clear spec document

## Web App Specific Requirements

### Project-Type Overview

tree-story is a **Single Page Application** built with Next.js. All story navigation happens client-side with no page reloads during play. The app is stateless server-side — all player state lives in localStorage. Deployment is a standard static/SSR Next.js build; no backend API, no database, no authentication layer.

### Browser Matrix

| Browser | Platform | Priority |
|---|---|---|
| Chrome (mobile) | Android | Primary — must be flawless |
| Safari (mobile) | iOS | Secondary — must work correctly |
| Chrome (desktop) | macOS / Windows | Graceful — layout holds, not optimised |
| Safari (desktop) | macOS | Graceful — layout holds, not optimised |
| Firefox | Any | Not explicitly tested |

No IE, no legacy browser support. Minimum OS/browser versions: whatever ships current on a mid-range Android (Chrome auto-updates).

### Responsive Design

- **Primary viewport:** ~375px portrait (iPhone SE / mid-range Android baseline)
- **Reading column:** single centered column, `max-width: 65ch`, `padding: 0 1.5rem`
- **Desktop:** layout holds without breakage; reading column remains centered with generous side margins; no desktop-specific features or layouts planned for v1
- **Orientation:** portrait primary; landscape not explicitly supported but must not break
- **No horizontal scroll** at any supported viewport

### SEO Strategy

Not a priority for v1. The app is shared by direct link, not discovered via search. No SEO meta tags, structured data, or sitemap required. A basic `<title>` and `<meta description>` are sufficient.

### Implementation Considerations

- **Next.js app router** — static generation where possible; client components for story engine state
- **Tailwind CSS** — utility-first, design tokens in `tailwind.config`; no hardcoded color values in component files
- **shadcn/ui** — headless primitives only (Sheet for character panel, Dialog if needed); all visual defaults overridden
- **No server-side state** — player progress, story state, and character data live exclusively in localStorage
- **Story JSON validation** at app startup — malformed config or broken paragraph references surface a developer-facing error, not a silent runtime failure
- **CSS custom properties on `:root`** updated at runtime from story config for act-based theming — no component-level hardcoded colors

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the minimum to deliver the core emotional loop end-to-end: open URL → read a paragraph → tap a choice → feel consequence → close → resume exactly where you stopped. If that loop works and feels right on a mobile browser, v1 is done.

**Resource:** Solo developer (Anthony). No team dependencies, no external contributors in scope for v1.

**Constraint as design:** The MVP's tightness is intentional, not a compromise. Every feature cut is a friction cut for Léa.

### MVP Feature Set (Phase 1)

**Core user journeys supported:** Journey 1 (Léa: first-time player, success path), Journey 2 (Léa: Game Over + replay), Journey 3 (Anthony: story authoring and deployment).

**Must-Have Capabilities:**

*Player Interface*
- Character profile creation screen — fully story-configured: stat names, stat count, and point budget defined in story JSON; UI adapts to story definition, no hardcoded stat labels
- Story reader: paragraph display with Lora prose, card-based choices below the text block
- Gauge strip (sticky top): story-configured gauge count, emoji icons, horizontal fill bars — no numeric labels; Kiff gauge hidden during play
- Natural gauge decay: auto-applied at story-defined node triggers, invisible to player
- Weighted outcome resolution: probabilistic, fully invisible — no dice, no probability signals, no arithmetic shown
- Game Over states: narrative paragraph, Kiff score reveal, replay invitation
- End-of-story outcome tiers: score-based narrative result, replay invitation
- localStorage auto-save after every choice; seamless resume on return
- Act-based visual theming: CSS custom properties updated from story JSON at story-defined act transitions
- Dark mode as primary and default visual register

*Story Engine & Data*
- Story JSON loader: reads story config from `/stories` directory at app startup
- Story JSON validation: startup-time check for schema correctness and paragraph ID integrity; developer-facing error on failure; silent to players
- **JSON Story Format Specification:** a standalone reference document defining every field of the story config schema — paragraph structure, choice arrays, stat/gauge definitions, decay rules, weighted outcome format, act-based palette config, Game Over flags, score gauge designation, end-state tier definitions. Must be complete enough that an LLM can translate a structured story document into valid JSON without additional guidance. This is a v1 deliverable, not an implementation detail.

*Content*
- One story: *Dub Camp* — 53 paragraphs, 4 player stats, 5 gauges (⚡🍺🌿🍔🎉), 10 weighted outcomes, 4 Game Over endings, 4 act-based palette transitions

### Post-MVP Features

**Phase 2 (Growth)**
- End-of-story shareable summary card
- Second story (validates engine's story-agnostic claim with different mechanics)
- Story library / selection screen
- Author interface: in-browser story creation, tree visualisation, stat/gauge configuration
- Optional user accounts for cross-device progress sync

**Phase 3 (Expansion)**
- Native app packaging (PWA / app store) — triggered at ~15 active players
- Multiple authors publishing stories on the platform
- Replay path comparison ("what if I'd chosen differently?")
- World-state variables beyond character gauges

### Risk Mitigation Strategy

**Technical Risk — Story Engine (High)**
The state machine (paragraph graph traversal, gauge arithmetic, weighted outcome resolution, decay scheduling, act transition triggers) is the core complexity of v1. Risks: edge cases in gauge bounds (floor/ceiling), Game Over condition evaluation order, localStorage serialisation of complex state.

*Mitigation:* Build and test the engine in isolation before wiring the UI. Define the full data model (story state, player state, engine state) before writing component code. Validate against *Dub Camp*'s complete 53-paragraph graph, including all 4 Game Over paths, as the acceptance test suite.

**Technical Risk — JSON Schema Design (Medium)**
A poorly designed schema makes future story authoring painful and LLM translation unreliable. If the schema is too rigid, it can't accommodate a second story; if too loose, validation is meaningless.

*Mitigation:* Design the JSON schema with a second hypothetical story (different genre, different stat set) in mind before finalising it. The spec document is a v1 deliverable that must be authored and reviewed before *Dub Camp* is translated into JSON.

**Resource Risk — Solo Developer (Low)**
Single point of failure; no buffer for complexity overruns.

*Mitigation:* MVP scope is minimal by design. If scope must be cut further, the shareable card and desktop polish are the first to go. The engine and one working story on mobile is the irreducible core.

## Functional Requirements

### Story Onboarding & Profile Creation

- **FR1:** Player can create a character profile by distributing a fixed point budget across story-defined stats before beginning a story
- **FR2:** Player can view example profile archetypes during character creation to guide their allocation
- **FR3:** The character creation screen adapts to the story's configured stat names, stat count, and point budget — no hardcoded labels or fixed layout

### Story Reading & Navigation

- **FR4:** Player can read story paragraphs presented as flowing prose
- **FR5:** Player can select a choice from story-defined options to advance the narrative
- **FR6:** Player can access their character sheet (current gauge values and inventory) on demand without leaving the story
- **FR7:** Player can view their current inventory of items gained or lost through story events

### Game Engine — Gauges & Mechanics

- **FR8:** The system tracks and updates story-defined gauges in response to player choices
- **FR9:** The system applies natural gauge decay automatically at story-defined narrative nodes, independent of player choices
- **FR10:** The system resolves weighted probabilistic outcomes at story-defined tension moments — probability and weighting are never visible to the player
- **FR11:** Player stats influence gauge arithmetic and outcome weighting as defined by story configuration
- **FR12:** The system evaluates Game Over conditions at story-defined trigger points when gauges exceed configured thresholds
- **FR13:** The system tracks a designated score gauge throughout the session without displaying it to the player during play
- **FR14:** The system enforces inventory changes (items gained or lost) at story-defined events

### Story End & Replay

- **FR15:** Player is presented with a narrative outcome at story completion, determined by their score gauge value against story-defined result tiers
- **FR16:** Player is shown their score gauge value upon reaching a Game Over or story end
- **FR17:** Player can choose to replay the story from the beginning after completing it or reaching a Game Over
- **FR18:** The system resets all story state (gauges, paragraph position, inventory, character stats) when a player initiates a replay

### Session Persistence

- **FR19:** The system automatically saves player progress after every choice without any player action
- **FR20:** Player can resume a story session from the exact paragraph where they stopped, with all state fully restored
- **FR21:** Saved progress survives browser close, tab switch, and device lock
- **FR22:** Player can continue a story session without network connectivity after the initial story load
- **FR23:** All player state is stored locally on the player's device — no account, login, or network dependency required

### Visual Theming & Presentation

- **FR24:** The app applies a story-defined visual theme (color palette, accent color) at story load
- **FR25:** The system transitions to a new story-defined visual theme at story-defined act boundaries as the player progresses
- **FR26:** The app presents dark mode as the primary and default visual register
- **FR27:** The reading experience renders correctly on mobile viewport sizes as the primary display context

### Story Configuration & Authoring

- **FR28:** An author can define a complete story (paragraphs, choices, gauges, stats, outcomes, decay rules, palette) in a JSON configuration file maintained outside the app
- **FR29:** The system loads story configuration from a designated directory in the repository at startup
- **FR30:** The system validates a story JSON configuration at startup for schema correctness and referential integrity (e.g. all choice targets reference existing paragraph IDs)
- **FR31:** The system surfaces a clear error to the developer when a story configuration is invalid; this error is never shown to players
- **FR32:** Story configuration defines all gauge properties (names, icons, initial values, decay rules, Game Over thresholds) — the engine uses only these values, no hardcoded story-specific data
- **FR33:** Story configuration defines all player stat properties (names, count, point budget) — the character creation screen renders from these values with no hardcoded defaults
- **FR34:** Story configuration defines all weighted outcome parameters — the engine resolves outcomes from these without any hardcoded probability values
- **FR35:** A JSON Story Format Specification document exists as a standalone v1 deliverable, defining every field of the story schema with sufficient precision for an LLM to translate a structured story document into a valid JSON file without additional guidance

## Non-Functional Requirements

### Performance

- **NFR1:** Choice resolution and next-paragraph render complete within 200ms — measured from tap to fully rendered paragraph and updated gauge state
- **NFR2:** Act-based visual theme transition (CSS custom property update) completes within one rendering frame — imperceptible as a "UI event"
- **NFR3:** Story JSON and all required assets load in a single network round-trip on first open; all subsequent story navigation is purely client-side with no network calls
- **NFR4:** The app remains fully playable without network connectivity after initial story load — no mid-session dependency on external resources (CDN, analytics, fonts if not preloaded)
- **NFR5:** The app renders without layout breakage on viewports from 320px to 428px width (portrait mobile baseline)

### Accessibility

- **NFR6:** All prose text and UI labels meet WCAG AA contrast ratio (4.5:1 minimum) against their background in dark mode
- **NFR7:** All interactive elements (choice cards, replay button, character sheet trigger) have a minimum touch target height of 44px
- **NFR8:** Story-defined accent colors must satisfy WCAG AA contrast against their configured act background — validated at story JSON load time, not at runtime
- **NFR9:** Prose font size minimum is 20px; no content-critical information is communicated through colour alone

### Reliability

- **NFR10:** Player progress must not be lost due to normal browser behaviour — including close, refresh, back navigation, or switching tabs
- **NFR11:** A story engine error (invalid gauge state, missing paragraph reference, unexpected outcome) must never produce a silent failure mid-story; all unrecoverable errors surface as a defined fallback state
- **NFR12:** Story JSON validation failures at startup produce a clear developer-readable error message identifying the failing field or reference; the player-facing app is not loaded in an invalid state
