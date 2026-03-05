# Story 4.2: End-to-End Validation & Mobile Play Test

Status: skipped

## Story

As a player (Anthony),
I want to play Dub Camp end-to-end on my phone — including a Game Over path and a full completion — under real commute conditions,
so that every journey in the PRD is verified as working before v1 is considered done.

## Acceptance Criteria

1. Journey 1 (first-time player, success path): URL opens → profile creation → reading → choices → gauge updates visible → session close and resume at exact paragraph → story completion → score tier narrative displayed
2. Journey 2 (Game Over + replay): a path to each of the 4 Game Over endings (§201–§204) is reachable → Game Over narrative shown → Kiff score revealed → replay returns to fresh ProfileCreation
3. Journey 3 (authoring): `dub-camp.json` was produced by giving only `dubcamp-histoire-v08.md` + `docs/story-format-spec.md` to an LLM — confirming the spec is complete enough without additional guidance (FR35)
4. Mobile play test confirms on mid-range Android Chrome:
   - App opens directly to story — no splash, no signup
   - Choice tap → next paragraph renders within 200ms (NFR1)
   - Act transitions Afternoon → Golden hour → Night → Late night are imperceptible as UI events (NFR2)
   - Session close and reopen lands at exact paragraph with correct act theme, no prompt (FR20, FR21)
   - Layout holds at 375px portrait — no horizontal scroll, no breakage (NFR5)
   - All gauge bars update correctly and Kiff is never visible during play (FR13)
   - App is fully playable offline after first load (NFR4)
5. `npx vitest run` passes with zero failures after `dub-camp.json` is added (no regressions)

## Tasks / Subtasks

- [ ] Pre-test: Deploy to Vercel (AC: 4)
  - [ ] Push all code to `main` branch — Vercel auto-deploys
  - [ ] Wait for deployment to complete (check Vercel dashboard or `gh` CLI)
  - [ ] Note the production URL

- [ ] Journey 1: First-time player success path (AC: 1)
  - [ ] Open app URL on mobile Chrome (fresh session, no prior save)
  - [ ] Verify: ProfileCreation screen shows correctly (stats, point budget, example profiles)
  - [ ] Allocate stats (choose an example profile or custom allocation)
  - [ ] Tap Start → verify StoryReader loads with §1 content
  - [ ] Read and make 5+ choices — verify gauge bar updates after each choice
  - [ ] Close the browser tab mid-story
  - [ ] Reopen the URL → verify: arrives at exact paragraph where closed, same act theme, no loading prompt
  - [ ] Continue to story completion → verify EndScreen with score tier narrative and Kiff reveal
  - [ ] ✅ PASS or ❌ FAIL with notes

- [ ] Journey 2: Game Over paths and replay (AC: 2)
  - [ ] Path to §201 ("trop bu trop tôt"): make choices that maximize Alcool early → verify §201 Game Over narrative
  - [ ] Verify: Kiff score shown at Game Over
  - [ ] Tap Replay → verify: arrives at fresh ProfileCreation, no stat allocation persisted, no old save
  - [ ] Attempt path to §202 ("dans le gaz"): verify §202 Game Over narrative
  - [ ] Attempt path to §203 (alcool + low Nourriture Game Over): verify §203 narrative
  - [ ] Attempt path to §204 (épuisement/Énergie): verify §204 narrative
  - [ ] Note: not all 4 paths need to be hit in one session — track which are verified
  - [ ] ✅ PASS or ❌ FAIL with notes

- [ ] Journey 3: FR35 spec validation (AC: 3)
  - [ ] Confirm that `dub-camp.json` was created using only `dubcamp-histoire-v08.md` + `docs/story-format-spec.md`
  - [ ] Document whether LLM required any additional clarifications during translation
  - [ ] If LLM required guidance: identify what was missing in spec, update `docs/story-format-spec.md`
  - [ ] ✅ PASS (spec sufficient) or ❌ FAIL (spec incomplete — needs update)

- [ ] Performance checks (AC: 4 — NFR1, NFR2)
  - [ ] Tap a choice and visually confirm next paragraph appears instantly (< 200ms feel)
  - [ ] Navigate to an act transition (e.g., paragraph that triggers Golden Hour act): confirm background color changes are imperceptible as a UI event (single frame, no animation lag)

- [ ] Offline test (AC: 4 — NFR4)
  - [ ] Load app on mobile with WiFi on
  - [ ] Turn off WiFi/data (airplane mode)
  - [ ] Make several choices — verify app continues working
  - [ ] Verify: no network errors, no broken images, no loading states
  - [ ] Turn WiFi back on — verify everything still works

- [ ] Layout check (AC: 4 — NFR5)
  - [ ] Verify at 375px portrait: no horizontal scroll
  - [ ] Verify all text is readable (20px minimum prose)
  - [ ] Verify choice cards are full-width and easily tappable
  - [ ] Verify gauge strip is sticky and visible during scroll

- [ ] GaugeStrip verification (AC: 4 — FR13)
  - [ ] During play: confirm Kiff/score gauge never appears in GaugeStrip
  - [ ] Open CharacterSheet (tap GaugeStrip): confirm Kiff IS visible here
  - [ ] Close CharacterSheet: confirm return to story with no state change

- [ ] Run regression tests (AC: 5)
  - [ ] Run `npx vitest run` after `dub-camp.json` is in place
  - [ ] Confirm zero failures
  - [ ] If any failures: investigate and fix before marking story complete

- [ ] Document test results
  - [ ] Record pass/fail for each journey
  - [ ] Note any bugs found with repro steps
  - [ ] Open GitHub issues for any bugs that need fixing
  - [ ] This story is COMPLETE only when all 3 journeys pass and Vitest passes with 0 failures

## Dev Notes

- **This is a manual testing story.** Most tasks involve human verification on a real device, not code writing. Some code fixes may be required if bugs are found.
- **Testing on Android Chrome:** This is the primary target (from PRD: "mid-range Android Chrome, commute conditions"). Test on real hardware if possible. Chrome DevTools device simulation is acceptable as a secondary check.
- **If bugs are found:** Fix them, re-deploy, re-test. Don't mark this story complete until all journeys pass.
- **FR35 spec validation (Journey 3):** This is a meta-test of the spec quality, not just the JSON. If the LLM translation required asking questions or making interpretive decisions not covered by the spec, update the spec. The goal is that any LLM could produce the JSON from only those two documents.
- **Performance expectations:** The 200ms target is for synchronous engine + React re-render. This should be comfortably met with pure TS engine. If you observe slowness, profile with Chrome DevTools.
- **Offline after first load:** After opening the app once with network, the browser caches the HTML, JS, CSS, and fonts. The story JSON is also cached. Turn off network and verify the app continues to function with only localStorage for state.
- **Act transitions:** The Dub Camp story has 4 acts. The transitions should be seamless — just a CSS custom property update that changes background color and accent color. No loading, no animation, just an imperceptible instant change.

### Project Structure Notes

No new files to create in this story.

Possible fixes in any existing file if bugs are found.

Prerequisites (ALL must be complete before this story can start):
- Epic 1 (Story 1.1 + 1.2 + 1.3)
- Epic 2 (Stories 2.1–2.6)
- Epic 3 (Stories 3.1–3.6)
- Story 4.1 (`public/stories/dub-camp.json` authored and validating)
- Vercel deployment active (connected to GitHub main)

### References

- [Source: architecture.md#Development-Workflow] — "Deploy: `git push origin main` → Vercel auto-deploy"
- [Source: epics.md#Story-4.2] — Full acceptance criteria including all 4 Game Over paths and offline requirements
- [Source: architecture.md#Requirements-Overview] — NFR1 (200ms), NFR2 (single-frame transitions), NFR4 (offline), NFR5 (320–428px)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
