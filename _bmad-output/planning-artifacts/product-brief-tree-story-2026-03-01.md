---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ["tree-story-brief-by-claude.md"]
date: 2026-03-01
author: Anthony
---

# Product Brief: tree-story

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Target Users

### Primary Users

#### The Reluctant Reader — "Léa"

Léa is in her early 30s. She commutes to work by metro, with pockets of 2–10 minutes
scattered throughout her day — on the platform, waiting for a meeting to start, in a
queue. By reflex, she opens Instagram or scrolls the news. She's aware it's passive
time that leaves her feeling a little flat, but opening a book feels like a commitment
she can't make in that moment.

She buys books. They sit on her nightstand unread. She knows she'd like them if she
started. She's not a gamer, but she enjoys story-driven films and podcasts — she's
drawn to narrative, just not to formats that demand sustained attention.

When she makes a choice in a story, she goes with her gut. She wants to feel like
she's making the "right" call, following the character she identifies with — not
optimizing for the best statistical outcome. She'd never open a gamebook, but she
might tap through three chapters while the metro is delayed.

**What she needs from tree-story:**
- Zero onboarding friction: no account, no tutorial, just start reading
- A session she can abandon mid-chapter and resume exactly where she left off
- A UI that doesn't feel like a game or a library — just a clean reading experience
- Stories about situations she can relate to, not dungeons and dragons

**Her "aha" moment:** She reaches the end of a chapter arc, sees the consequence
of her choices, and thinks — "what if I'd chosen differently?" and immediately
starts again.

---

### Secondary Users

#### The Content Author — "Antoine" (future)

Antoine is a non-technical writer or narrative designer who has a story to tell in
branching format — perhaps a historical scenario, a workplace drama, a travel
adventure. He's comfortable with storytelling structure but not with code or complex
tools.

**Reality check (v1):** The author persona is aspirational. In practice, the initial
author is the product creator (Anthony), using the Author interface to load and
configure a known-good open-source gamebook as the first playable content. The
Author interface must work for this use case first. Attracting external authors is a
future growth lever, contingent on a compelling player experience existing first.

**The content bottleneck is the primary strategic risk of this project.** Without
good stories, the engine has nothing to run. The mitigation strategy for v1 is
seeding with an existing open-source book, converted into the tree-story story
format — either via the Author interface or an external AI-assisted workflow.

---

### User Journey

#### Léa's Journey with tree-story

**Discovery:** A friend shares their end-of-story summary on a messaging app. Léa
thinks "what is this?" and taps the link. It opens directly in her mobile browser —
no install, no signup.

**Onboarding:** She lands directly on the story — no signup screen, no tutorial
pop-up. The first chapter is short, the choice is clear, and she taps it. That's it.

**Core usage:** She plays in 3–5 minute bursts during her commute. The site remembers
exactly where she stopped. She doesn't feel pressure to "do more."

**Aha moment:** She hits a story consequence from a choice she made three chapters
ago. She didn't see it coming. She wants to know what the other path looked like.

**Long-term:** She finishes her first story, sees a summary of her character's
journey and stats, and shares it. She picks the next available story. She mentions
it to a friend as "this interactive story thing, it's actually cool."

---

**Platform note:** tree-story launches as a mobile-first responsive website (Next.js).
A native app release is a future consideration, contingent on meaningful player
traction (~15+ active players).

---

## Success Metrics

This is a personal, experimental project. Success metrics are intentionally simple
and human — they guide decisions without pretending this is a funded product.

### Launch Criteria (v1 "Done")

These must all be true before tree-story is considered shipped:

- [ ] At least one complete story is playable end-to-end via a public URL
- [ ] The player can complete a full story, with character progression and dice
      moments, without hitting broken states
- [ ] Progress is automatically saved — a player can close and resume without losing
      their place
- [ ] The experience works comfortably on a mobile browser in dark mode

### Personal Success Indicators

- **Anthony completes the story himself**, on his phone, in real mobile conditions
  (commute, short sessions), and enjoys it
- **Anthony feels proud showing it to friends** — not just as a tech demo, but as
  something with genuine experience value
- **1–2 non-technical friends react with genuine curiosity** ("oh interesting, I
  might try this") — even if they don't play immediately

### Growth Signal (future consideration)

- **~15 friends actively playing** → triggers evaluation of native app packaging
  (iOS/Android via PWA or app store submission)

### What We Are Not Measuring (deliberately)

- User acquisition numbers
- Retention rates or DAU/MAU
- Revenue or monetization
- Story completion rates at scale

These may become relevant if the project grows beyond its personal scope. For now,
they are noise.

---

## MVP Scope

### Core Features (v1)

#### Player Interface
- Read story paragraphs sequentially on mobile, dark mode default
- Make choices at branch points (directing to the next paragraph)
- **Character profile creation** at story start — player distributes a
  fixed number of points across story-specific stats (e.g. Endurance,
  Résistance alcool) that shape the playthrough
- Character sheet accessible on demand — displays all gauges visually;
  gauge names, icons, and count are defined per story (not hardcoded);
  gauges evolve automatically based on story choices and natural decay
- **Natural gauge decay** — gauges shift over time automatically at
  story-defined intervals, independent of player choices
- **Score gauge** — stories may define a score gauge (e.g. Kiff) that
  accumulates across the session and determines the end result
- Risk/chance resolution: a single tension moment with a weighted
  probabilistic outcome — no multi-round mechanics, no skeuomorphic dice,
  no visible arithmetic. The result is presented as narrative consequence,
  with weighting invisible to the player
- Inventory tracking (items gained or lost through story events)
- Progress auto-saved locally (localStorage) — resume exactly where
  you left off, no account required
- One story available at launch

#### Content Pipeline (v1, not a UI)
- Story content is loaded via a structured import format (e.g. JSON
  config) prepared outside the app — no in-browser authoring tool
- The first story is *Dub Camp* — an original festival-themed branching
  narrative (53 paragraphs, 5 gauges, 4 player stats, weighted outcomes)
  authored directly in the tree-story format

---

### Out of Scope for v1

- **Author interface**: No in-app story creation or editing UI
- **Story library**: Only one story at launch — no browsing or selection
- **User accounts**: No login, no cloud sync, no profiles
- **End-of-story summary / shareable card**: Noted as desirable, deferred
  to v2
- **Multiple combat types**: Single unified risk resolution mechanic
  across all story events
- **Native app**: Web-only at launch (responsive site, not app store)
- **Multiplayer or social features**: Solo play only
- **Fixed stat model**: Stats and gauges are story-defined, not hardcoded
  to a specific gamebook system (Skill/Endurance/Luck removed as defaults)

---

### MVP Success Criteria

The MVP is complete when:
- A player can start, play through, and finish Dub Camp via a public
  URL on a mobile browser
- Character profile creation works at story start (stat point distribution)
- All gauges (Énergie, Alcool, Fumette, Nourriture, Kiff) update correctly
  throughout the story, including natural decay at major nodes
- Risk moments resolve without requiring the player to do any manual
  calculation; weighted outcomes are invisible to the player
- Progress survives closing and reopening the browser
- The experience holds up in real mobile conditions (commute, short
  sessions, dark mode)

---

### Future Vision (v2+)

- **Author interface**: Full in-browser story creation and management —
  tree visualization, chapter editor, stat configuration, combat setup
- **Story library**: Multiple stories available, with a selection screen
- **End-of-story summary**: A shareable card showing the player's path,
  key choices, and final character state
- **User accounts**: Optional profiles for cross-device progress sync
  and play history
- **Native app**: PWA or app store packaging, triggered when ~15 active
  players are using the site regularly
- **Replay incentives**: "What if I'd chosen differently?" — explicit
  support for replaying with different paths highlighted
- **Story sharing**: Authors can publish and share stories with others

## Executive Summary

Tree Story is a minimalist interactive story app for mobile, built for people who were
never drawn to gamebooks — because they felt too overwhelming, too fantasy-heavy, or
too demanding of their time and attention.

It takes the core appeal of Choose Your Own Adventure books (branching narrative,
character progression, meaningful randomness) and strips away everything that created
friction: the skeuomorphic UI, the fantasy aesthetic lock-in, the physical dice and
paper sheets, the long uninterrupted reading sessions required.

The result is a clean, typographically-focused reading experience designed for 2–10
minute sessions — on a phone, in dark mode, while waiting for the bus. Stories can
be anything: a startup founder navigating their first year, friends planning a road
trip, an athlete preparing for a competition. The engine is genre-agnostic by design.

---

## Core Vision

### Problem Statement

People are curious about interactive fiction but never actually read gamebooks — not
because they dislike stories, but because the medium itself creates too many barriers:
overwhelming visual design borrowed from physical books, fantasy-only settings that
exclude huge audiences, and session structures that assume uninterrupted focus. Modern
apps that attempt this space either replicate these problems or bury the content under
monetization friction (paywalls, ads mid-story).

### Problem Impact

A generation of potential readers never discovers an experience they would genuinely
enjoy, because no app has bothered to make it feel modern, light, and accessible.
The format is compelling — branching narrative, meaningful choices, character
evolution — but it has never been designed for someone who just has 5 minutes on the
metro.

### Why Existing Solutions Fall Short

Current interactive story apps fall into two camps: they are either visually heavy
and skeuomorphic (realistic book UI, physical dice metaphors, paper character sheets),
or they are fantasy-locked with aesthetic languages that feel dated or niche. Games
like Reigns demonstrate that cleaner, swipe-driven interfaces with visual progress
indicators (rather than number-heavy stats) can be both engaging and broadly
accessible — but even Reigns doesn't solve the typography problem for long reading
sessions. No existing solution is simultaneously genre-agnostic, monetization-free,
session-length friendly, and visually modern.

### Proposed Solution

Tree Story is a web app (mobile-first, dark mode default) built around two
interfaces: a reader-focused Player interface optimized for short, comfortable story
sessions, and an Author interface for building and managing branching story trees.

The player progresses through chapters, makes choices, and encounters moments of
randomness — but the mechanical underpinning (stats, progression) is expressed
visually rather than mathematically. Instead of numeric scores, progress bars and
story-native labels communicate character state. The character evolves, and so does
the world around them (a company's morale, a team's fitness level). The exact visual
language for this progression is an open design challenge, informed by references
like Reigns.

### Key Differentiators

- **Genre-agnostic by design**: The engine supports any universe — no fantasy lock-in
- **Modern, typographically-first UI**: Clean and readable for long sessions; not
  skeuomorphic, not cluttered
- **Session-length aware**: Designed for 2–10 minute bursts, not uninterrupted reading
- **Visual stats, not math**: Character progression is felt, not calculated
- **No monetization friction**: No ads, no paywalls — personal and experimental
- **World-state evolution**: Not just the character evolves; the story's world state
  can be tracked (company growth, team morale, etc.)
