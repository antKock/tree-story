# 🌳 Product Brief — Tree Story

## Concept
A responsive web app inspired by "Choose Your Own Adventure" books. The user reads an interactive story, makes choices, rolls dice, and evolves their character. The goal is to offer short, immersive sessions — primarily on mobile — with a minimalist and sober style, as a counterpoint to existing apps that are often visually heavy, locked into a fantasy aesthetic, paywalled, or ad-supported.

The project is also a personal experiment with BMAD and vibe coding.

---

## Two Interfaces

### 🎮 Player Interface (v1 priority)
- **Mobile-first** usage
- **Dark mode** mandatory — reading comfort, long sessions
- Read chapters, make choices, progress through the story
- Roll dice at key moments (combat, events)
- View and manage the character sheet
- Automatic progress saving (resume where you left off)

### ✍️ Author Interface (v1 also)
- Import an existing story (from a PDF)
- Create a story from scratch within the app
- Visualize the story tree (arborescence)
- Configure chapters, choices, monsters, and dice mechanics

---

## Game Mechanics

### Story Structure
A story is a **tree of chapters**. Each chapter leads to either:
- A **mandatory continuation** (no choice)
- A **multiple choice** where the player picks from available options

### Character Sheet
Present in **all stories** (not optional). Composed of:
- Name
- Character summary / description
- Hit points
- Level
- Skills (with skill level — varies per story)
- Item inventory

The character sheet evolves during the game (level-ups, items, injuries…).

### Dice
Present in **all stories**. Used at key moments: monster combat, obstacle navigation, narrative events. The dice result influences the story's outcome.

---

## Visuals
Stories, characters, and monsters can have **associated illustrations**. The overall style remains minimalist — visuals are a complement, not the core of the experience.

---

## Users

### V1 — Solo, no account
- Local play, no authentication
- Progress saved automatically (localStorage or equivalent)

### Future versions
- Player account creation
- Multiple players with distinct profiles
- Potentially: story sharing between authors

---

## Positioning
- **Sober and minimalist** — the player imagines and visualizes the story in their head
- **Native dark mode** — not an option, the default mode
- **Mobile-first** — optimized for comfortable reading on a phone
- **No ads, no paywall** — personal / experimental project
- **Genre-agnostic** — not necessarily fantasy; the engine must support any universe

---

## Planned Stack
Next.js (App Router) + Tailwind CSS — consistent with existing project habits.
