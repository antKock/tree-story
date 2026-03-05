---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-tree-story-2026-03-01.md"
  - "tree-story-brief-by-claude.md"
  - "dubcamp-histoire-v08.md (first story — 53 paragraphs, 5 gauges: Énergie/Alcool/Fumette/Nourriture/Kiff, 4 player stats, weighted outcomes, festival setting)"
---

# UX Design Specification tree-story

**Author:** Anthony
**Date:** 2026-03-01

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

tree-story is a minimalist, mobile-first interactive story web app that strips away all the friction of classic gamebooks — no skeuomorphic UI, no fantasy aesthetic lock-in, no sustained reading sessions required. It takes the core appeal of Choose Your Own Adventure books (branching narrative, character progression, meaningful randomness) and redesigns it for someone who has 5 minutes on the metro. The platform is genre-agnostic by design, typographically-first, and built for dark mode as its primary aesthetic register — not as a feature, but as an identity.

### Target Users

**Primary — "Léa" (The Reluctant Reader)**
Early 30s, commutes by metro in 2–10 minute bursts. Reflexively opens Instagram rather than a book, though she's drawn to narrative. Not a gamer. Needs zero onboarding friction, no sense of "playing a game," and seamless session resumption. Her defining moment: reaching a story consequence from a choice made chapters earlier and immediately wanting to replay.

**Secondary — "Antoine" (The Content Author)**
Aspirational for v1; in practice, Anthony himself importing and configuring the first story (an open-source gamebook). The author interface must serve this use case first before attracting external contributors.

### Key Design Challenges

1. **Stat visualization without numbers** — The classic Fighting Fantasy model (Skill, Endurance, Luck as numeric values on a paper sheet) must be reimagined as a visual, narrative-feeling representation. The design language is open — progress bars, story-native labels, or something more inventive — but math must be invisible to the reader.
2. **Combat/luck moment design** — A single tension moment with one randomized outcome, presented entirely as narrative consequence. No dice metaphors, no visible arithmetic — just a beat that feels cinematic.
3. **Character sheet on demand** — Stats and inventory must be accessible without intruding on the reading flow. The sheet surfaces only when the player wants it, and disappears cleanly.
4. **Session resumption** — Returning after a 2-day gap must feel immediate and welcoming. The player is dropped back into the story, not into a menu or loading state.

### Design Opportunities

1. **Typography as identity** — This is a reading app first. World-class type choices and reading rhythm can be the signature differentiator from every game-coded competitor.
2. **Dark mode as aesthetic, not feature** — Designed for dark mode from the ground up, not adapted to it. It defines the emotional register of the entire product.
3. **The consequence reveal** — The moment a past choice surfaces as a present consequence is tree-story's most distinctive emotional beat. Designing this micro-interaction for delight and shareability is a high-leverage UX opportunity.

## Core User Experience

### Defining Experience

The core loop is singular: read a paragraph → tap a choice. Everything else in tree-story exists to support or enrich that loop. The critical beat is the moment between finishing a paragraph and committing to a choice — the decision beat. Too slow, too heavy, or too game-like and the player disengages. Getting this transition right is the product's most important UX challenge.

### Platform Strategy

- **Primary platform:** Mobile-first responsive web (touch, ~375px portrait viewport)
- **Default mode:** Dark mode as the primary visual experience, not a toggle
- **Persistence:** localStorage for auto-save — fully offline-capable during play, no network dependency
- **No authentication:** Zero account requirement for v1
- **No native app:** Web-only at launch; PWA packaging deferred to post-traction milestone

### Effortless Interactions

The following must require zero conscious effort from the player:

- **Session resumption** — Returning to the app places the player instantly mid-story, no loading screen, no menu, no "continue?" prompt
- **Choice tapping** — Immediate response, no confirmation dialog, no delay
- **Stat updates** — Happen invisibly in the background; player notices changes without ever being asked to act
- **Session end** — Nothing to do; auto-save is silent and complete

### Critical Success Moments

1. **First load** — Story begins without signup, tutorial, or preamble. Reading starts within 3 seconds of opening the URL.
2. **First choice** — The tap feels satisfying and the next paragraph arrives instantly. The player is in.
3. **The consequence reveal** — A choice made chapters earlier surfaces as a present story beat. Unexpected, emotionally resonant — this is the product's signature moment.
4. **Return after absence** — The player reopens the app after days away and is placed exactly where they stopped, mid-sentence. Zero re-orientation required.

### Experience Principles

1. **Reading first, mechanics second** — tree-story is a reading experience that happens to have stats, not a game that happens to have text.
2. **The UI disappears** — At its best, the player forgets they're using an app. Only the story exists.
3. **Every interaction is a story moment** — Choices, combat outcomes, and stat changes express themselves as narrative events, never as UI operations.
4. **Sessions have no seams** — Closing and reopening is indistinguishable from pausing. The experience is continuous.
5. **Mechanics are felt, not calculated** — Stats communicate through visual rhythm and narrative language, never through numbers or arithmetic.

## Desired Emotional Response

### Primary Emotional Goals

The target emotional register is not excitement or thrill — those belong to games. tree-story aims for:

1. **Absorbed** — The quiet state of being lost in a story. Not buzzing, not thrilled — just *in it*. The feeling of reading a great novel on a train and missing your stop. This is the north star.
2. **Curious** — The pull to find out what happens next, and what would have happened on the other path. Mild, persistent, irresistible.
3. **Agency without pressure** — The satisfying sense that choices matter, without the anxiety of "am I playing it wrong?" The player follows their gut. There is no optimal path they are failing to find.

### Emotional Journey Mapping

| Stage | Target emotion | Emotions to avoid |
|---|---|---|
| First discovery | Intrigue + zero friction | Overwhelm, "is this complicated?" |
| First paragraph/choice | Absorption | Feeling like a "gamer" |
| Combat/luck moment | One beat of tension → relief | Stress, confusion, visible math |
| End of a session | Mild satisfaction + gentle curiosity | Guilt for quitting, sense of lost progress |
| Consequence reveal | Surprise + delight | Predictability |
| Return after absence | Familiarity, warmth | Disorientation, re-onboarding |

### Micro-Emotions

- **Confidence** over Confusion — At every choice point, both options feel valid. No "right answer" anxiety.
- **Trust** over Skepticism — The app remembers the player. Nothing is ever lost. Invisible auto-save is a trust gesture.
- **Delight** over mere Satisfaction — The consequence reveal is a *surprise*, not an expected reward.
- **Belonging** — The story world feels relatable and real, not niche or inaccessible.

### Design Implications

- *Absorbed* → Typography-first layout with generous breathing room; near-zero visible UI chrome during reading
- *Curious* → Chapter endings that open rather than close; choices written as genuine narrative forks, not binary A/B options
- *Agency without pressure* → Choices written in narrative voice, never framed as risk levels or difficulty indicators; no "are you sure?" dialogs
- *Trust* → Silent auto-save with no confirmation; on return, instantly in the story with no prompts
- *Delight* → The consequence reveal designed as a quiet, unexpected story beat — not a pop-up reward, but a narrative moment that lands differently once recognized

### Emotional Design Principles

- **Never make the player feel like they're playing wrong** — Choices have consequences, not correct answers
- **Guilt-free sessions** — 3 minutes should feel complete, not abandoned
- **Invisible reliability** — The app earns trust by never drawing attention to its own mechanics
- **Earned surprise** — Delight moments are planted early and harvested late; never manufactured on demand

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**80 Days (Inkle Studios)** — Text-first interactive adventure, mobile-native. The gold standard for prose-driven branching narrative on mobile. Reading is the primary activity; choices appear as highlighted text woven into the prose flow, not as a separate UI element. The story never stops to ask "what will you do?" — it keeps moving and the player participates from within the stream of text. Directly relevant because tree-story is text-heavy and Léa is a reader first.

**Reigns** — Card-based narrative game with binary swipe choices. The defining UX contribution is its stat visualization: icon-bar pairs always visible at the top of the screen, no numbers, purely spatial. As choices are made, bars shift subtly. The player feels the consequence without any arithmetic. Also relevant for its complete absence of menus or loading states — the experience is continuous from launch.

**Pocket (dark mode)** — The benchmark for comfortable long-form reading on mobile. Typography-first, generous margins, zero chrome visible during reading (header hides on scroll). Trust earned by getting out of the way. Relevant for the reading rhythm and text rendering quality tree-story must match.

**Lifeline** — Minimalist text narrative where tension is created entirely through narrative framing, not through visual mechanics. Dangerous moments are described in prose; outcomes arrive as story beats. No dice metaphors, no animations — just language doing all the work.

**Alto's Odyssey** — Failure states presented gracefully and immediately, with no punishing modal, no recap, no "try again?" screen. Consequence without interruption. Relevant for how tree-story handles negative combat/luck outcomes.

**Headspace** — Short-session design done right. A 5-minute session is framed as complete and valid, not as a failed longer session. No guilt, no pressure to continue. Relevant for Léa's 2–10 minute metro bursts.

### Transferable UX Patterns

**Reading experience — 80 Days inline model (confirmed direction):**
Choices appear as highlighted, tappable text woven into the prose — not as a separate list or bottom sheet. The story flows continuously; the player participates from within the text stream. This preserves reading rhythm and avoids the "form-filling" feeling of numbered choice lists.

**Stat visualization — Reigns bar model (confirmed direction):**
Persistent stat bars (Skill, Endurance, Luck) always visible but non-intrusive. No numbers displayed. Bars fill and deplete visually in response to story events. Color and spatial position communicate status instantly; the player never needs to calculate.

**Tension moments — Lifeline narrative model:**
Combat and luck checks are presented as prose beats, not mechanical events. The outcome arrives as story language, not as a dice result or number change. The stat bar shifts are felt as narrative consequence.

**Failure/negative outcomes — Alto's graceful model:**
Negative outcomes (health loss, bad luck) are absorbed into the story flow without interruption modals, recap screens, or "try again?" prompts. The story continues; the consequence is the narrative.

**Session design — Headspace completeness model:**
Any session length is framed as valid and complete. No progress loss, no guilt indicators, no "you stopped mid-chapter" notifications. Closing is simply pausing.

### Anti-Patterns to Avoid

- **Numbered choice lists** (Choice of Games style) — Choices as "1. Go left / 2. Go right" feel like filling out a form, not making a story decision
- **Separate choice screens** — Breaking reading flow to present a distinct "choice moment" UI disconnects the player from the prose
- **Visible dice/randomness mechanics** — Any skeuomorphic dice roll animation or visible probability signals the game register, not the story register
- **Numeric stat displays** — Showing "Endurance: 14/26" requires arithmetic; the player should never need to do math
- **Onboarding gates** — Character creation, tutorials, or any screen before the first paragraph loads
- **Paywall/energy patterns** — Any friction that signals the app wants something from the player

### Design Inspiration Strategy

**Adopt:**
- 80 Days' inline choice model — choices as highlighted prose, not a separate UI component
- Reigns' persistent icon-bar stat visualization — always visible, no numbers, purely spatial

**Adapt:**
- Reigns' bar positioning — likely bottom of screen on mobile to keep the reading area clean (vs. Reigns' top positioning)
- Pocket's chrome-hiding behavior — the stat bar fades during deep reading and reappears on scroll-up or tap

**Avoid:**
- Any full-screen mechanic interruption (swipe cards, dice rolls, interstitial screens)
- All numeric display of character stats at any point in the player experience

## Design System Foundation

### Design System Choice

**Tailwind CSS + shadcn/ui**

### Rationale for Selection

tree-story's actual UI surface area is small and highly custom: story text, inline choice links, stat bars, a character sheet overlay, and an inventory list. None of these exist in any standard component library — they are purpose-built. What the project needs from a design system is *design tokens* (color, typography, spacing) and *behavioral primitives* (accessible overlays, focus management) — not pre-styled components.

- **Tailwind CSS** provides utility-first styling with zero visual fingerprint, first-class dark mode support, and a token system (colors, type scale, spacing) that can encode tree-story's entire visual language in one config file. Produces no recognizable third-party "look."
- **shadcn/ui** provides headless, accessible component primitives built on Radix UI — owned and styled by the project, not imported as a black box. Covers the behavioral layer (focus traps, keyboard navigation, accessible overlays) for the character sheet, inventory panel, and any future modals.
- Both integrate natively with Next.js. Zero heavy setup. Solo developer friendly.

Established design systems (Material, Ant Design) were ruled out for carrying a strong visual identity incompatible with a bespoke reading aesthetic. A fully custom system was ruled out as disproportionate for a personal project with a small UI surface area.

### Implementation Approach

- Tailwind config as the single source of truth for all design tokens: color palette, typography scale, spacing rhythm, dark mode variables
- shadcn/ui for interactive primitives only (Sheet, Dialog, Dropdown) — styled to match tree-story's visual language, not used out of the box
- All reading experience components (story text, inline choices, stat bars, chapter transitions) built as custom components on top of Tailwind

### Customization Strategy

- Define a custom color palette in `tailwind.config` — dark backgrounds, muted text hierarchy, single accent color for interactive choices
- Establish a typography scale using a single reading-optimized font family (to be chosen in visual foundation step)
- Override shadcn/ui component defaults completely — no shadcn visual defaults should be visible in the final product
- Design tokens drive all visual decisions; no hardcoded values in component files
- **Story-driven theming**: CSS custom properties on `:root` are updated at runtime from story config — palette, backgrounds, and accent colors are all story-authored, not app-level decisions

## Core Interaction Design

### Defining Experience

> *"Read a story. Tap a choice. Live with it."*

The core loop: encounter an inline choice woven into the prose → tap it → the next paragraph arrives instantly, the world having shifted quietly. The choice feels like punctuation, not an interruption. This is reading, not playing.

### User Mental Model

Léa's mental model is forward-moving: text arrives, she reads, more text arrives. She's conditioned by tap-to-advance content (Stories, articles) and has an intuitive sense of "choose → see what happens" from Choose Your Own Adventure exposure. What breaks the experience in every existing implementation is what happens *around* the choice — stat screens, numbered lists, dice animations. tree-story's job is to make the choice feel like the next sentence.

### Success Criteria

- The choice reads as part of the paragraph — discovered while reading, not presented as a separate prompt
- Tapping a choice delivers the next paragraph in under 200ms — feels like turning a page
- The reader never has to look away from the text column to make a decision
- Stat/gauge changes happen at the edge of attention — noticed, not demanded
- Weighted probabilistic outcomes are completely invisible to the player

### Novel vs. Established Patterns

**Established (adopted as-is):**
- Tap-to-advance is deeply familiar
- Inline highlighted text as a tappable element is how the web works

**Established (adapted):**
- RPG stat distribution at story start — accepted as a known convention; players recognise +/- point allocation. The novelty is that it is fully story-configured: skill names, count, and point budget come from the story definition, not the engine.

**Genuinely novel:**
- The consequence reveal — when a past choice surfaces chapters later. No mainstream equivalent. The signature UX moment tree-story owns.
- Story-driven visual theming — the color palette and atmosphere are authored per story and evolve with story progress. The app's visual identity is a narrative layer, not a fixed brand skin.

### Experience Mechanics

| Phase | What happens |
|---|---|
| **Story start** | Character profile screen: story-configured skills, fixed point budget, +/- or slider UI. Player allocates then begins. |
| **Arrival** | First paragraph visible immediately — no loading screen, no preamble after profile |
| **Reading** | Prose flows naturally; choice text appears inline, styled distinctly (accent color + underline) |
| **Decision** | Player taps choice text — brief tactile response, next paragraph arrives |
| **Gauge update** | Gauge bar(s) shift subtly at screen edge — no number, purely spatial. Story-defined gauge names and icons. |
| **Natural decay** | At story-defined nodes, gauges shift automatically regardless of choices — the world keeps moving |
| **Theme evolution** | At story-defined act transitions, CSS variables update — palette, atmosphere, and accent shift to reflect the story's current register |
| **Session end** | App closes — nothing happens, nothing is lost, no prompt |
| **Return** | App opens to exact paragraph, correct theme act — immediate, familiar |
| **Score reveal** | At story end, score gauge (e.g. Kiff) determines narrative outcome tier |

### Story-Agnostic Engine Principle

The player-facing UI declares nothing about what stats, gauges, mechanics, or visual identity exist. All of the following are story-configured, not hardcoded:

- Skill names, count, and point budget for character creation
- Gauge names, icons, initial values, and decay behaviour
- Whether a score gauge exists and how end-state tiers are defined
- **The full color palette** — applied via CSS custom properties at runtime from story config
- **Dynamic palette acts** — keyed to story progress nodes, allowing the visual environment to evolve as the story does (e.g. Dub Camp: midday warmth → golden hour → deep night → late-night intimacy)
- **Background treatment** (v2+, architecturally planned): texture, color wash, or atmospheric image per story or per act

tree-story is a reading engine. *Dub Camp* is the first story that runs on it — and defines its own visual world from morning to midnight.

## Visual Design Foundation

### Color System

The visual system has two layers: an **app shell** (story-agnostic defaults) and a **story theme** (CSS custom properties overwritten at runtime by story config).

**App shell defaults:**

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0f0f0f` | Near-black, warm tint — base background |
| `--color-surface` | `#1a1a1a` | Cards, overlays, panels |
| `--color-text-primary` | `#f0ece4` | Warm off-white — prose, primary labels |
| `--color-text-muted` | `#7a7672` | Secondary labels, gauges, timestamps |
| `--color-accent` | Story-defined | Interactive choices, highlights (app default: `#d4935a`) |
| `--color-danger` | `#c0392b` | Game over states, critical warnings |

**Dub Camp story theme — four act overrides:**

| Act | Trigger | Background | Accent | Register |
|---|---|---|---|---|
| Afternoon | §1–§16 | `#1a1208` (hot dark ochre) | `#e8a42a` (amber) | Warm, energetic |
| Golden hour | §20–§40 | `#160e0a` (deep amber-dark) | `#e8622a` (orange) | Rich, saturated |
| Night | §50–§60 | `#080810` (near-black blue) | `#7c5cbf` (electric purple) | High contrast, electric |
| Late night | §70 | `#0a0c0e` (cool dark) | `#4a7a8a` (teal-grey) | Desaturated, intimate |

All story themes are applied by updating CSS custom properties on `:root` at runtime. No component references hardcoded color values.

### Typography System

**Primary typeface: Lora** (Google Fonts, variable, free)
Humanist serif — literary without being academic. Excellent dark-background rendering at reading sizes. Works for both prose and highlighted inline choices without disrupting reading flow.

**Secondary typeface: Inter**
Used exclusively for mechanical UI elements (gauge labels, stat names, character profile screen, score reveal). Keeps game mechanics visually distinct from story prose.

**Type scale:**

| Element | Size | Line height | Family | Notes |
|---|---|---|---|---|
| Body prose | 17px | 1.75 | Lora | Core reading experience |
| Inline choice | 17px | 1.75 | Lora | Accent color + underline differentiates |
| Chapter marker | 13px | 1.4 | Inter | Uppercase, `letter-spacing: 0.1em`, muted |
| Gauge labels | 11px | 1.4 | Inter | Muted, minimal presence |
| Profile screen | 16px | 1.5 | Inter | Entire profile/creation screen uses Inter |

**Max line length:** `65ch` — optimal for long-form reading comfort on mobile.

### Spacing & Layout Foundation

- **Base unit:** 8px (Tailwind default scale)
- **Reading column:** single centered column, `max-width: 65ch`, `padding: 0 1.5rem`
- **Paragraph spacing:** `margin-bottom: 1.5rem` — the story breathes
- **Gauge bar:** fixed bottom strip, `height: 3rem` — present below reading threshold
- **Character sheet panel:** full-screen slide-up (shadcn `Sheet`) — overlays the story layer, does not replace it
- **No top navigation chrome** during active reading

### Accessibility Considerations

- Warm off-white (`#f0ece4`) on near-black (`#0f0f0f`) achieves **WCAG AA** contrast for body text at 17px
- Story-defined accent colors must pass a contrast check against their act background before being applied — enforced at story config validation time
- Font size minimum 17px for prose, 11px only for gauge labels (decorative, not content-critical)
- Touch targets for inline choices: minimum `44px` height via generous line-height and padding
- Gauge bars are supplementary information — all story-critical state is communicated through prose, never gauge-only

## Design Direction Decision

### Design Directions Explored

Five design direction variations were created and explored in the interactive HTML showcase (`ux-design-directions.html`):

- **V1 — Refined Base**: 18px Lora, tighter spacing, compact gauge strip
- **V2 — Large Left**: 20px Lora, generous spacing (20px side padding), rounded choice cards, full-width gauge strip — **selected**
- **V3 — Centered**: 18px Lora, centered text, narrower content column
- **V4 — Centered Large**: 22px Lora, centered text, very open layout
- **V5 — Accent Rows**: 20px Lora, choice cards with colored background accent rows

The directions were evaluated on four criteria: reading comfort in mobile dark mode, visual hierarchy (gauge → prose → choices), tap target clarity, and alignment with Léa's "just start reading" expectation.

### Chosen Direction

**V2 — Large Left**, with the following confirmed elements:

**Gauge strip** — Fixed at top of screen (`position: sticky; top: 0`). Each gauge rendered as: emoji icon (17px) centered above a horizontal bar (7px height, 4px border-radius). Four gauges displayed during play: ⚡ Énergie, 🍺 Alcool, 🌿 Fumette, 🍔 Nourriture. **Kiff (🎉) is hidden during play** — it is the score gauge and is revealed only on the end-of-game summary screen. No text labels in the gauge strip; the icons are self-explanatory.

**Prose** — 20px Lora serif, left-aligned, 1.72 line-height, max 65ch. Supports inline bold/italic from story JSON config. No chapter labels or section headers visible in the player UI — the story JSON may carry organising titles for the author's benefit only; the player sees only prose.

**Choice cards** — Rounded cards (8px radius), stacked vertically below the prose block. Each card is full-width, minimum 48px touch target height, with a subtle border (`1px solid rgba(255,255,255,0.08)`). Choices are **not** inline within the prose — they appear as a distinct card stack below the story block.

**Scroll behaviour** — Prose and choice cards share the same scroll flow (`overflow-y: auto`). The gauge strip is the only fixed element. On short paragraphs, choices are immediately visible below the fold. On long paragraphs (e.g. §50 Dubkasm, §60 La descente in Dub Camp), the player scrolls to the end of the prose to reach the choices. This mirrors natural reading behaviour and avoids split-scroll complexity.

### Design Rationale

V2 maximises reading comfort on a mobile dark screen: 20px Lora gives prose room to breathe without requiring the player to zoom or squint. Left-aligned text scans faster than centred text across multi-sentence paragraphs on a portrait mobile viewport. Rounded choice cards are immediately recognisable as tap targets without needing instructional labels — the visual weight and separation from prose does the work.

The fixed gauge strip at the top gives Léa a persistent status check she can glance at without interrupting reading flow. Placing it at the top (rather than bottom) means it is always available at the thumb's natural resting position without competing with the choice cards. Removing Kiff from the gauge strip preserves the end-of-game reveal moment — a designed emotional beat that should land as a surprise, not as a number the player has been tracking throughout play.

The decision to use cards below (rather than inline choices as referenced in earlier inspiration analysis) came from the nature of Dub Camp's actual choice text: full-sentence options that don't naturally integrate into a flowing prose paragraph. Cards give each option equal visual weight and eliminate the risk of the player skimming over an inline choice while reading.

### Implementation Approach

- **Gauge strip**: `position: sticky; top: 0` — rendered outside the scroll area, before the `scroll-area` div. Story config defines gauge count, icons (emoji), initial values, decay thresholds, and game-over conditions. Gauge values are reactive state driven by the story engine.
- **Scroll area**: Single `flex: 1; overflow-y: auto` container wrapping `<prose block>` followed by `<choice cards>`. No split-scroll, no fixed bottom bar for choices.
- **Prose rendering**: Markdown-lite subset (bold, italic) parsed from story JSON paragraph `content` field. Rendered as `<p>` blocks with Lora. Paragraph separators from multi-block content rendered as `margin-bottom: 1.5rem`.
- **Choice cards**: Rendered from story JSON `choices[]` array. Each card: full-width, `border-radius: 8px`, `border: 1px solid rgba(255,255,255,0.08)`, `padding: 16px 20px`, `min-height: 48px`. Card tap dispatches choice resolution to story engine and triggers paragraph transition.
- **Kiff tracking**: Accumulated in story engine state throughout the session. Not surfaced in gauge strip. Accessed by end-of-game summary component to determine narrative outcome tier.
- **Typography correction from step 8**: The confirmed prose size is **20px** (not 17px from the type scale table above). Inter remains for all mechanical UI elements. The type scale table in step 8 reflects initial values; this confirmed direction supersedes it for prose size.
