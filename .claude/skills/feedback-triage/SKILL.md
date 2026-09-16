---
name: feedback-triage
description: How to pull, document, classify and dispatch a wave of TestFlight feedback for Open Lingo. Read BEFORE triaging tester items, writing a feedback ledger, or deciding what to send to Spencer. Covers the ASC pull and the item-numbering trap, checking the build field before reopening anything, the recurrence matrix, the research-doc format that works, server-log-first for sync items, classifying mechanical vs structural vs decision, and dispatching lanes that don't collide.
---

# Triaging a TestFlight wave

143 items in 11 days, and **four classes account for 53% of them**. The job is
not to answer 26 screenshots; it is to tell which of them are instances of a class
already analysed, so the wave produces one structural fix instead of nine knobs.

Read first: `docs/user-feedback/2026-09-15-recurring-complaints-rca.md` (the
recurrence matrix and the A–G structural fixes) and
`docs/spencer-product-sentiment.md` (predict his verdict from it, and update it
whenever he explains a why).

---

## 1. Pull

```bash
node scripts/asc/pull-feedback.mjs [outDir]     # default ./testflight-feedback
# app id 6805652204 is hardcoded; writes manifest.json + numbered .jpg shots
# raw API: node scripts/asc/asc.mjs /v1/apps/6805652204/betaFeedbackScreenshotSubmissions
```

**The numbering trap:** item numbers are API row `n + 1`, and the offset has
already drifted once — #86 was consumed by a prod chunk-load bug in the b12
ledger, so b13's 27 rows (86–112) became items #87–#113. **State the row→item
mapping explicitly in the doc header** so the next wave can line up.

Record, in the header: pull time, crash count, item count, the row→item mapping,
device, build number(s), the timestamp range, and the shot paths.

## 2. Check the build field before you reopen anything

Four items — **#59, #60, #65, #85** — were re-reports against a build that
predated the fix. They are not regressions. Made worse because status columns
aren't updated when fixes land: the b13 table still reads "open" for 14 shipped
items, so triage can't tell fixed from pending without reading git.

For every item that looks like a returning defect:

1. Read the item's `build` against the build the fix shipped in.
2. `git log --grep "TestFlight #<n>"` to find the fix commit.
3. If the build predates it, mark it **build-lag phantom**, not a regression.
4. **Update the status column in the same commit as the fix** (`release-lap` §6).

## 3. Class it against the matrix before diagnosing it

If the item's class is in the RCA recurrence matrix — tile sizing, furigana,
kanji surfacing, gloss/naturalness, audio, content selection, info-card fit — then
**a point fix is the wrong answer** and you should say so. The structural fix is
named in RCA §4 (A–G). Nine sizing commits in nine days each answered the latest
screenshot and each produced the next complaint; #137 finally asked for the spec
itself.

Also check §0 of the previous wave's doc: items already in flight must not be
re-dispatched. Two lanes fixing the same file is failure class C14.

## 4. Locate every item, or say you couldn't

Every row gets a `file:line` or an explicit "not located". Use `codebase-search`.

- **Deep-link and look.** `?step=N` is **0-indexed**; review lessons carry a
  dynamic prefix so the static index shifts — walk `?step=0…N` and build the step
  map. The b20 doc mapped all 18 steps of `ja-m34-neo-3` this way, which is why
  every item in that pull has a located step.
  Local: `npm run content:emit` then
  `VITE_DEV_AUTH_BYPASS=true npx vite --port 5399` (`npm run dev` pins 5173
  `--strictPort`; a bare `npx vite` without the emit serves stale content).
  Prod: the same path on `https://app.openlingoapp.com`.
- **Don't guess from the screenshot.** The #165 lane built a shared header for the
  listening views; the screenshot was the **speaking** step's prompt card.
- **Measure, don't read pixels off a JPEG.** And if you measure in Chromium, say
  so — see `mobile-ui-verify` §1. In one pull the emulator disagreed with the
  device on three separate items.
- **Two or three mechanisms can wear one costume.** "Where is my kanji" was three
  unrelated causes (a by-design kana-only step type, an irregular-verb stem
  mutation, and a step type with no annotation field at all). Don't batch them.

## 5. Sync, progress and state items: server logs first

Build 20 shipped a reconciliation fix and posted nothing. The **first** move was
CloudWatch, not a hypothesis: 33 `GET /progress/me` and six batch POSTs, all
tick-sized (112, 71, 62, 587, 658, 68 ms). A 100-row chunk takes seconds; none
appeared. That **proved** nothing reached the sync queue — before any theorising —
and ruled out network and server refusal in one step. Four client defects were
then found and fixed together.

- Get the server's evidence and the server's **declared limits** first. #144/#145
  was a 490-row batch against a cap of 100 (rejected in full, 422, before the
  handler) plus `durationSec: 1` against a floor of `max(5, steps)`.
- **Quantify before proposing a server change.** 490 rows × ~4 DynamoDB round
  trips ≈ 2,000 per invoke, 20–30 s against a 30 s timeout — so raising the cap
  would trade a fast 422 for a coin-flip 504 that re-runs on every retry. The
  chunking had to live on the client, and builds ≤18 could not be healed by any
  server change at all.
- **Correct the previous doc when you learn it was wrong.** b15 #123 was recorded
  as a placement-policy question and asked Spencer for his module history; b18 §3
  showed `applyPlacement.ts` credits passed **and assumed** modules (490 lessons
  from one m32 test-out) and nothing needed to be asked. Write the correction into
  the sheet.

## 6. The doc format that works

Follow `docs/user-feedback/2026-09-15-testflight-b15.md` /
`-b20.md`. It is a working sheet for walking the list with Spencer, not a report.

1. **Header** — pull method, counts, row→item mapping, crashes, shot paths.
2. **Where he was, in order** — the lesson(s) walked, with a step map table
   (`step | what | item`) verified against the dev server, and the module's
   `.ir.yaml:line`.
3. **"Measured, not guessed"** — one paragraph naming the engine, viewport and
   method for every number below, and stating explicitly where the device
   disagrees with the emulator, *because that disagreement is itself a finding*.
4. **§0 Already in flight — do not touch in this wave**, with the owning lane.
5. **§1 Table** — `# | Where | Class | Finding (one line, with file:line) | Size | Spencer?`
6. **§2 How to walk it with Spencer** — bucketed: answered / mechanical one lap /
   one structural fix that closes N items / needs one call each / device-only.
7. **§3 Per-item detail** — located step, source with file:line, local + prod
   links, class, answer or root cause, similar-issue count.
8. **§4 Cross-item themes** — the lettered rules where one fix closes several
   items, and where two items look alike and are not.
9. **§5 Decisions for Spencer** — each with your own stated position.

Status legend: `open` / `fixed <sha>` / `in progress (uncommitted)` /
`wontfix (reason)` / `discuss`.

## 7. Classify into five buckets

- **Answered / closed** — no change needed; record the answer anyway. #168 ("does
  the <5-tile fix cover this?") was a No with a reason: the predicate rejects
  `particle_cloze`, and 549 of 559 such beats have exactly 3 options by design.
- **Mechanical** — a located one-liner. Ship them as one lap.
- **Structural** — the item is a class. Name which RCA fix it belongs to and how
  many items it closes. One rule in b20 closed four.
- **Decision** — genuinely Spencer's call. Investigate it first and arrive with a
  position; do not surface anything that checking could have resolved.
- **Device-only** — cannot be closed from here. Say what the device run must show,
  in ≤6 lines he can follow, and name the slot you need.

Two items worth reporting even when the app is right: he is sometimes correct
against the code (a valid word order nobody authored as an alternate) and
sometimes the app is correct against his instinct (だす is the standard
collocation for 手紙). Report both — it shows the triage is reading Japanese, not
just diffing screenshots.

## 8. Dispatch lanes that don't collide

- Name **the owning file(s) per lane** and the files each lane must not touch.
  Two items in the same wave hit `BuildSentenceStepView` and
  `ListeningBuildStepView`; those are one lane, not two.
- `git status` first — a concurrent session may already be mid-fix on the same
  ask. b13 #92 found exactly that, with a code comment quoting the same item.
- Pass `model:` on every dispatch, and tell each lane to invoke
  `regression-classes` before reporting done. Full rules: `lane-briefing`.
- Tell lanes that share a defect class to compare notes before either ships — the
  ~200px-shorter device stage was behind two separate items in one wave.

## 9. Report the wave

Counts per class, which items are phantoms, the mechanical list with its single
lap, the structural fixes with the item counts they close, and the decision list
with your position on each. Then the one sentence that matters: which recurring
class this wave is *still* not fixing, and why.
