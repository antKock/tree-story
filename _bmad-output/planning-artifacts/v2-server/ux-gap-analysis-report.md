# UX Gap Analysis Report: Design Spec vs Implementation

**Source design:** `ux-design-directions-server.html` (V1 Design Directions)
**Scope:** Leaderboard (V2 Highlighted Card Row), Landing Page (V3 Atmospheric Hero), Name Input (V1 Inline + Presets)
**Date:** 2026-03-05
**Analyst:** Sally, UX Designer

---

## Executive Summary

The implementation closely follows the design system foundations (color tokens, typography, layout column). However, several intentional design decisions from the spec were simplified or omitted during development. **17 gaps** were identified, ranked by user-facing impact.

| Severity | Count |
|----------|-------|
| Critical (blocks design intent) | 2 |
| High (noticeable visual/UX difference) | 5 |
| Medium (polish/detail deviation) | 6 |
| Low (minor cosmetic) | 4 |

---

## 1. LEADERBOARD SCREEN

### What the spec defined (V2 Highlighted Card Row)
- End screen context block: tier emoji (48px), tier label (Lora 22px), score display with accent-colored value, italic tier text (Lora 16px)
- Gradient divider between end-screen and leaderboard
- Leaderboard header: "Ceux qui ont fini" (Inter 11px uppercase)
- Entries: card-row layout with `border-radius: 8px`, `padding: 12px 16px`
- Current player row: purple-tinted background (`rgba(124,92,191,0.12)`), purple border, primary-color name, purple-accent score
- Other entries: flat with transparent border
- Story-themed background (Dub Camp night: `--dub-bg: #080810`)
- Dub Camp accent: `--dub-accent: #7c5cbf` (purple)

### What was actually implemented
- End screen: score gauge icon (24px) + gauge name (uppercase) + large score (2rem, `--color-accent`), inside a surface-colored card
- No tier emoji, no tier label (Lora 22px), no italic tier text block
- Tier text exists but rendered as paragraph prose, not as a visually distinct centered block
- Leaderboard header: "Ceux qui ont fini" label exists (Inter 0.85rem)
- Entries: flat rows with `border-bottom: 1px solid rgba(255,255,255,0.06)` — **not** card-style rounded rows
- Current player: `color-mix(in srgb, var(--color-accent) 10%, transparent)` — uses **app accent** (warm tan #d4935a), not story-specific purple
- No gradient divider between end screen and leaderboard
- Background: inherits page background, not story-themed `--dub-bg`

### Gaps

| # | Gap | Severity | Detail |
|---|-----|----------|--------|
| **G1** | No story-specific theme on leaderboard | **Critical** | Spec uses story's end-act theme (purple Dub Camp night). Implementation uses generic app-shell accent (#d4935a). The leaderboard was designed to feel like part of the story's ending, not a generic app feature. |
| **G2** | End screen tier presentation missing | **High** | Spec shows a prominent centered block: large emoji (48px) + tier label in Lora 22px + score with accent color + italic tier flavor text. Implementation shows a score card with gauge icon + number only. Tier text is rendered as body prose, losing the celebratory visual hierarchy. |
| **G3** | Flat rows instead of card rows | **Medium** | Spec uses `border-radius: 8px`, `padding: 12px 16px` per entry (card feel). Implementation uses flat border-bottom dividers (list feel). Functional but less visually distinct. |
| **G4** | No gradient divider | **Low** | Spec has a `linear-gradient` divider between end-screen context and leaderboard. Implementation has no visual separator. |
| **G5** | Current player highlight uses wrong color family | **High** | Spec: `rgba(124,92,191,0.12)` purple tint with purple border. Implementation: `color-mix(--color-accent 10%)` using warm tan. This is tied to G1 — the story theme isn't applied. |

---

## 2. LANDING PAGE

### What the spec defined (V3 Atmospheric Hero + Illustration)
- Hero section with subtle gradient: `linear-gradient(180deg, rgba(212,147,90,0.06) 0%, transparent 100%)`
- Illustration placeholder: 80x80px rounded-square with gradient background and large emoji (36px)
- Brand title: "tree-story" in Lora 32px, 600 weight
- Pitch text: Lora 17px, muted color, max-width 280px
- CTA button: outlined style (border only, no fill), accent-colored text, `border: 1px solid rgba(212,147,90,0.3)`, hover fills with 8% accent
- Stories section: "Histoires disponibles" label (Inter 11px uppercase)
- Story cards: title in Lora 22px, italic description in Lora 15px, meta row with soft player count + relative date + "Terminé" badge
- Story cards separated by `border-bottom: 1px solid rgba(255,255,255,0.04)` with first-child also having `border-top`
- Theme persistence: returning visitors see last story's theme colors via localStorage

### What was actually implemented

**The landing page has NOT been implemented.** The current `app/page.tsx` directly loads and renders a single story (`dub-camp.json`), bypassing any multi-story landing page. The implementation spec exists (`2-3-story-listing-landing-page.md`) but the components (`LandingHero`, `StoryCard`, `StoryListClient`) have not been created.

### Gaps

| # | Gap | Severity | Detail |
|---|-----|----------|--------|
| **G6** | Landing page not implemented at all | **Critical** | The entire V3 Atmospheric Hero landing page is missing. No hero section, no story listing, no CTA. The app loads directly into the single story. This is the single largest UX gap. |
| **G7** | No multi-story navigation | **High** | Without the landing page, there is no way to browse or select between multiple stories. The architecture supports it (Supabase stories table exists), but no UI surfaces it. |
| **G8** | No theme persistence for returning visitors | **Medium** | The spec calls for localStorage-based theme recall so the landing page greets returning visitors in their last story's colors. Not implemented. |

---

## 3. NAME INPUT SCREEN

### What the spec defined (V1 Inline with Preset Profiles)
- Story-themed background: `--dub-golden-bg: #160e0a` (warm dark brown)
- Profile header: story title in `--dub-golden-accent` (#e8622a, orange-red) + subtitle "Crée ton personnage" (Inter 12px uppercase)
- Name label: "Comment tu t'appelles ?" (Inter 14px, muted)
- Name input: transparent background, `border: 1px solid rgba(255,255,255,0.12)`, `padding: 14px 16px`, `font-size: 16px`, focus border = `--dub-golden-accent`
- Profiles label: "Choisis ton profil" (Inter 11px uppercase, letter-spacing 0.12em)
- Profile cards: `background: var(--color-surface)`, `padding: 16px 20px`, `border-radius: 8px`, with `.selected` state showing `border-color: --dub-golden-accent` + subtle orange background tint
- "Personnaliser les stats" as an underlined text link at the bottom
- Requires both name AND selected profile to proceed (implicit from "Commencer" button)

### What was actually implemented
- Background: inherits `--color-bg` (#0f0f0f), **not** story-themed golden background
- No profile header with story title + "Crée ton personnage" subtitle
- Name label: "Comment tu t'appelles ?" — **matches spec**
- Name input: `background: var(--color-surface)` (filled, not transparent), `height: 44px`, `padding: 0 1rem`, focus border = `var(--color-accent)` (generic tan, not golden-accent)
- Profiles heading: "Choisis ton profil" as `h2` at 1.1rem 600 weight — **close but not uppercase 11px**
- Profile cards: styling matches well (`16px 20px` padding, 8px radius, surface bg)
- **No selected state** — clicking a profile immediately starts the game (fires `onStart`), no intermediate selection+confirm step
- "Personnaliser" is a full card button, not an underlined text link
- Validation: name required (cards disabled when empty) — **matches intent**

### Gaps

| # | Gap | Severity | Detail |
|---|-----|----------|--------|
| **G9** | No story-themed background on name screen | **High** | Spec uses `--dub-golden-bg` (#160e0a) for a warm, immersive feel. Implementation uses the generic app shell background. Breaks the "you're entering this story's world" moment. |
| **G10** | Missing profile header (title + subtitle) | **High** | Spec shows the story title ("Dub Camp") in golden-accent color with "Crée ton personnage" subtitle. Implementation jumps straight to the name field. Loses story identity and narrative framing at character creation. |
| **G11** | Name input has filled background instead of transparent | **Medium** | Spec: `background: transparent` with subtle border. Implementation: `background: var(--color-surface)` (filled card). Minor but affects the visual lightness of the form. |
| **G12** | No profile card selected state | **Medium** | Spec shows a `.selected` state (accent border + tint). Implementation bypasses selection — clicking a profile immediately starts the game. This removes the deliberate "review before committing" moment. |
| **G13** | Profiles heading style differs | **Medium** | Spec: Inter 11px uppercase, 0.12em letter-spacing (label style). Implementation: Inter 1.1rem (≈17.6px), weight 600 (heading style). Much larger and bolder than intended. |
| **G14** | "Personnaliser" is a card, not a text link | **Low** | Spec: underlined text link "Personnaliser les stats →". Implementation: full card button matching profile cards. Functional but elevates the customize option to the same visual weight as profiles. |
| **G15** | Focus accent uses generic color | **Low** | Spec: focus border = `--dub-golden-accent` (#e8622a). Implementation: `var(--color-accent)` (#d4935a). Close in warmth but different hue — orange-red vs warm tan. |
| **G16** | Name input padding differs | **Low** | Spec: `padding: 14px 16px` (generous vertical). Implementation: `height: 44px`, `padding: 0 1rem` (less vertical breathing room). |

---

## Ranked Gap Summary (by priority for remediation)

| Rank | ID | Screen | Gap | Severity | Effort |
|------|-----|--------|-----|----------|--------|
| 1 | G6 | Landing | Landing page not implemented | Critical | Large |
| 2 | G1 | Leaderboard | No story-specific theme on leaderboard | Critical | Medium |
| 3 | G10 | Name Input | Missing profile header (title + subtitle) | High | Small |
| 4 | G9 | Name Input | No story-themed background | High | Small |
| 5 | G5 | Leaderboard | Player highlight uses wrong color family | High | Small |
| 6 | G2 | Leaderboard | End screen tier presentation missing | High | Medium |
| 7 | G7 | Landing | No multi-story navigation | High | Large (tied to G6) |
| 8 | G12 | Name Input | No profile card selected state | Medium | Medium |
| 9 | G13 | Name Input | Profiles heading style differs | Medium | Small |
| 10 | G3 | Leaderboard | Flat rows instead of card rows | Medium | Small |
| 11 | G8 | Landing | No theme persistence for visitors | Medium | Medium |
| 12 | G11 | Name Input | Filled input background | Medium | Small |
| 13 | G14 | Name Input | Customize link is a card | Low | Small |
| 14 | G15 | Name Input | Focus accent generic color | Low | Small |
| 15 | G16 | Name Input | Input padding differs | Low | Small |
| 16 | G4 | Leaderboard | No gradient divider | Low | Small |

---

## What Matches Well

Despite the gaps, several foundational elements were implemented faithfully:

- **Color tokens** — Root CSS variables match the spec exactly (`#0f0f0f`, `#1a1a1a`, `#f0ece4`, `#7a7672`, `#d4935a`)
- **Typography system** — Lora for prose, Inter for UI, loaded via Next.js font optimization
- **Reading column layout** — `max-width: 65ch` with `0 1.5rem` padding, centered
- **Profile card structure** — Padding, border-radius, surface background, font choices all match
- **Name validation** — Both name required + point allocation mirrors the spec's "both required" rule
- **Profile presets** — All three profiles (Le Fetard, Le Routard, L'Equilibre) match with correct stats and descriptions
- **Leaderboard data flow** — Fire-and-forget score POST + delayed fetch + fade-in animation is well-executed
- **Accessibility** — ARIA attributes, semantic markup, focus indicators exceed spec requirements
- **Graceful degradation** — Leaderboard silently disappears on fetch failure, matching the "never break the end screen" philosophy

---

## Recommendations

### Quick Wins (1-2 hours total)
Fix G10, G9, G13, G15, G16, G11, G4 — small styling changes that bring screens much closer to spec.

### Medium Effort (half-day)
Fix G1+G5 together (story theme on leaderboard), G2 (tier presentation), G12 (selected state), G3 (card rows).

### Large Effort (multi-day)
G6+G7 (landing page) is the biggest missing piece and should be its own epic/story.
