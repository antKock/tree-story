# Story 3.4: Story Reader — Prose & Choice Cards

Status: done

## Story

As a player,
I want to read story paragraphs and tap a choice to advance the narrative,
so that the experience feels like reading a well-designed article that forks — not like playing a game.

## Acceptance Criteria

1. `ParagraphDisplay` renders the paragraph's `content` as flowing prose in 20px Lora, left-aligned, 1.72 line-height, `max-width: 65ch`
2. Prose supports markdown-lite inline formatting: `**bold**` and `*italic*` — no other markdown syntax
3. No chapter markers, section headers, or paragraph IDs are visible to the player
4. `ChoiceCards` renders each choice as a full-width card stacked vertically below the prose block with: `border-radius: 8px`, `border: 1px solid rgba(255,255,255,0.08)`, `padding: 16px 20px`, `min-height: 48px` (NFR7)
5. Tapping a card calls `resolveChoice(choiceId)` — no confirmation dialog, no delay
6. The next paragraph renders within 200ms of the tap (NFR1)
7. Prose and choice cards share the same scroll container — no split-scroll, no floating bottom bar
8. `StoryReader.tsx` is the sole consumer of `useStoryEngine` — all children receive engine state as props only

## Tasks / Subtasks

- [x] Create `components/ParagraphDisplay.tsx` (AC: 1–3)
  - [x] Props: `{ content: string }`
  - [x] Render in a `<div>` with class `.prose` (Lora, 20px, 1.72 line-height) from globals.css
  - [x] Apply markdown-lite rendering for `**bold**` → `<strong>` and `*italic*` → `<em>`:
    ```typescript
    function renderMarkdownLite(text: string): React.ReactNode[] {
      // Split on **bold** and *italic* patterns
      // Return array of React nodes: strings, <strong>, <em>
    }
    ```
  - [x] Simple regex approach (no markdown library needed):
    - Replace `**text**` with `<strong>text</strong>`
    - Replace `*text*` with `<em>text</em>` (careful: don't match `**` as italic)
  - [x] No paragraph IDs, section numbers, or metadata visible to player
  - [x] `max-width: 65ch; padding: 0 1.5rem` for reading column

- [x] Create `components/ChoiceCards.tsx` (AC: 4–6)
  - [x] Props: `{ choices: Choice[]; onChoiceSelect: (choiceId: string) => void }`
  - [x] Map over `choices` to render each as a `<button>`:
    ```css
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 16px 20px;
    min-height: 48px;
    width: 100%;
    text-align: left;
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-family: var(--font-lora); /* prose-like for choice text */
    ```
  - [x] `onClick={() => onChoiceSelect(choice.id)}`
  - [x] No confirmation dialog — immediate action on tap
  - [x] Stack vertically with `gap: 8px` between cards
  - [x] 200ms render target: since `resolveChoice` is synchronous in the engine, React re-render should happen immediately after state update (well under 200ms)

- [x] Create `components/StoryReader.tsx` — the root client component (AC: 7, 8)
  - [x] `"use client"` directive — this component manages engine state
  - [x] Props: `{ config: StoryConfig }`
  - [x] **Sole consumer of `useStoryEngine`**: `const { engineState, resolveChoice, applyDecay } = useStoryEngine(config)`
  - [x] Local state: `const [charSheetOpen, setCharSheetOpen] = useState(false)`
  - [x] Layout structure:
    ```tsx
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GaugeStrip
        gauges={engineState.gauges}
        config={config}
        onOpenCharacterSheet={() => setCharSheetOpen(true)}
      />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div className="reading-column">
          <ParagraphDisplay content={currentParagraph.content} />
          {!engineState.isGameOver && !engineState.isComplete && (
            <ChoiceCards
              choices={currentParagraph.choices}
              onChoiceSelect={resolveChoice}
            />
          )}
        </div>
      </main>
      <CharacterSheet
        open={charSheetOpen}
        onClose={() => setCharSheetOpen(false)}
        engineState={engineState}
        config={config}
      />
      {(engineState.isGameOver || engineState.isComplete) && (
        <EndScreen engineState={engineState} config={config} onReplay={resetEngine} />
      )}
    </div>
    ```
  - [x] Apply `applyDecay` at decay nodes: check if `engineState.paragraphId` is in `config.decayNodes` — if so, call `applyDecay()` in a `useEffect` when `paragraphId` changes
  - [x] Handle the decay timing: call `applyDecay()` AFTER the choice resolves and new paragraph renders

- [x] Handle decay node side effect (AC: — from architecture)
  - [x] `useEffect(() => { if (config.decayNodes.includes(engineState.paragraphId)) { applyDecay() } }, [engineState.paragraphId])`
  - [x] Note: This fires after rendering the new paragraph at a decay node. The decay effects will cause another state update and re-render with updated gauges.

- [x] Wire StoryReader into app flow
  - [x] In `app/page.tsx`: render `<StoryReader config={storyConfig} />` when phase === 'story'
  - [x] Pass validated `storyConfig` from the fetch + validate step

- [x] Ensure scroll behavior (AC: 7)
  - [x] Prose + choice cards are in the same `<main>` scroll container
  - [x] GaugeStrip is sticky at top (separate from scroll area)
  - [x] No split-scroll, no floating elements other than the gauge strip

## Dev Notes

- **`StoryReader` is the sole `useStoryEngine` consumer (critical).** From architecture: "StoryReader.tsx is the sole consumer of useStoryEngine — child components receive props only." Never import `useStoryEngine` in `GaugeStrip`, `ParagraphDisplay`, `ChoiceCards`, or any other component. Data flows as props.
- **200ms requirement (NFR1):** The pure TypeScript engine is synchronous — `resolveChoice()` runs in microseconds. The 200ms budget covers React state update + re-render + DOM paint. With React 19 and Next.js 16, this should be comfortably under budget. No special optimization needed.
- **Markdown-lite implementation:** Only `**bold**` and `*italic*` are supported. A simple regex parser is sufficient. If the prose content has `**text**`, render it as `<strong>text</strong>`. Be careful: match `**text**` before `*text*` to avoid treating bold markers as two separate italic markers.
- **Decay node timing:** Decay fires when the player ARRIVES at a decay node paragraph. The flow is: player taps choice → `resolveChoice()` → new paragraphId set → React renders new paragraph → `useEffect` fires with new paragraphId → if it's a decay node, `applyDecay()` is called → gauges update → React re-renders gauge strip. This is the correct "arrives at paragraph" semantics.
- **`isGameOver` and `isComplete` rendering:** When either is true, stop rendering `ChoiceCards` and instead show `EndScreen`. The `EndScreen` handles replay.
- **CharacterSheet integration:** `charSheetOpen` state is in `StoryReader` — it opens from GaugeStrip tap (prop callback) and closes from CharacterSheet's own close handler.

### Project Structure Notes

Files to create:
- `components/StoryReader.tsx` (new — the root client component)
- `components/ParagraphDisplay.tsx` (new)
- `components/ChoiceCards.tsx` (new)

Files to modify:
- `app/page.tsx` — import and render StoryReader after profile phase

Prerequisites:
- Story 2.5 (`hooks/useStoryEngine.ts`)
- Story 3.1 (design tokens)
- Story 3.3 (`GaugeStrip.tsx` — used inside StoryReader)
- Stories 3.5 and 3.6 (CharacterSheet, EndScreen — can stub initially)

### References

- [Source: architecture.md#Component-Architecture] — Full component tree and prop flow
- [Source: epics.md#Story-3.4] — Prose spec: 20px Lora, 1.72 line-height, 65ch; choice cards: 8px border-radius, rgba border, 48px min-height
- [Source: project-context.md#Framework-Specific-Rules] — "StoryReader.tsx is the sole consumer of useStoryEngine — child components receive props only"
- [Source: architecture.md#Enforcement-Guidelines] — "Never instantiate the engine more than once (never recreate on re-render)"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6
Code Review: claude-opus-4-6

### Debug Log References

### Completion Notes List

- StoryReader: sole consumer of useStoryEngine, manages charSheetOpen state
- ParagraphDisplay: Lora prose, markdown-lite (**bold** and *italic*), reading-column layout
- ChoiceCards: full-width cards with 48px min-height, 8px border-radius, Lora font
- Decay applied via useEffect when arriving at decay nodes (checks prevParagraphId ref)
- Game over / complete states conditionally render EndScreen instead of ChoiceCards
- Code review (2026-03-02): Fixed ChoiceCards font (now --font-prose), markdown regex, CSS variables

### File List

- `components/StoryReader.tsx` — root client component, sole useStoryEngine consumer
- `components/ParagraphDisplay.tsx` — prose rendering with markdown-lite
- `components/ChoiceCards.tsx` — choice card buttons
