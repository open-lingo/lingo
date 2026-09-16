---
name: regression-classes
description: The 15 failure classes that have recurred in Open Lingo, as a pre-claim checklist. Read this BEFORE saying a fix is done, complete, verified, green, shipped, or ready to push — and before reporting a lane finished. Each class names the incidents it caused, why it recurs, and the one check that catches it. Use when closing a TestFlight item, finishing a fix lane, or about to claim a test suite proves something.
---

# Regression classes — check before you claim done

143 TestFlight items in 11 days; four classes account for 53% of them, and all
four recur every build era. The analysis is
`docs/user-feedback/2026-09-15-recurring-complaints-rca.md` — read it if your
item's class appears below, because for those classes **another point fix is the
wrong answer**; the structural fix is in RCA §4 (A–G).

**How to use this:** find the class your change belongs to, run its check, and
put the check's OUTPUT in your report. "I checked" is not a check. If your
change spans two classes, run both.

---

## C1 — A sizing number measured in Chromium

**Recurred:** #55, #114, #117, #119, #124, #125, #137, #156, #157, #161.
Chromium reported the ruby box at 40.8px; WebKit measures 46.7px. Safe-area
insets are 0 in Playwright Chromium. The device stage is ~200px shorter than
any emulated one, so `cqh`-driven sizes never shrink when they should. #159
completes correctly in Chromium **and** in Playwright WebKit, and is cut in
half on the device.

**Check:** the number came from the 15 Pro Max / iPad Air simulator — run
`npm run sim:capture -- --route "<route>" --font-scale 100` (and again at
`125`) — and your report names the engine, surface and viewport it was taken
on. → `mobile-ui-verify`, numbers against `docs/mobile-sizing-spec.md`

## C2 — A fixed px value with a floor and no ceiling

**Recurred:** eight commits in nine days each answering the latest screenshot
(fb77a859→#55, c1faad87→#62, 1b5735c1→#69, 3e1b7f07→#87, 7ca257e4→#114/#117,
f76e7f51→#119/#124/#125/#137); b17's `a8624814` raised `--match-tile-h`
4.75→5.25rem and produced #157. #152: every tile pinned at the 45px floor with
34% of the screen dead. #156: there is no text-fitting code anywhere in `src/`.

**Check:** the value has both a floor and a ceiling per `docs/mobile-sizing-spec.md`
§3 (the FIT/FILL rule — shrink to `--tile-font-floor` before wrap, fill to
`--tile-font-ceiling` against a measured px stage), it lives in the sizing-token
registry, you re-shot every sibling tile surface — not only the one in the
screenshot — and confirmed with `npm run sim:capture -- --route "<route>"
--font-scale 100` (and `125`). → `mobile-ui-verify`

## C3 — A shared component fixed on one surface

**Recurred:** #124/#125 (`ListeningBuildStepView` never got the sizing system
`BuildSentenceStepView` has); #132 (the quick-fix modal diverged from
`RuleHintCard` on one CSS rule; `LessonIntro` and `TestRunner` share the gap);
#127 (stop-on-navigate added for lessons, test-out has its own calls); the FR
re-author silently discarding the ES standards.

**Check:** name every sibling — other courses, review/test-out contexts, the
mobile build, the other step types mounting this component — and state each as
inherited / ported / N-A. A fix is not done until the siblings are accounted
for. → `codebase-search` for finding them

## C4 — A green check that cannot fail

**Recurred:** authed Playwright routes asserted nothing (0 cookies, 273
skipped); the public-only flag left on in CI; a `vitest-stub.mjs` whose `it`
discarded its callback, so every doctrine pin passed while executing zero
assertions; the TTS emitter printing `wrote=0` as success; a local judge at 10%
precision because the rubric field map was wrong; `claude-local gemma` running
3.6–8.4 min and writing no file while reporting success.

**Check:** you fed the check a known-bad input and watched it fail, and you
assert the collection is non-empty before asserting on its contents. Note that
`vitest run` does not typecheck — only `npm run preflight` does.

## C5 — A write path with no buffer, no retry, and no visible state

**Recurred:** #144/#145 — test-out completions POSTed as one 490-row batch
against a server cap of 100, rejected in full (422, before the handler), with
`durationSec: 1` against a floor of `max(5, steps)`; the only trace was a
`console.warn` nobody could see. Then build 20's reconciliation failed four
more ways: it ran in a query function instead of an effect (so the half that
resolved first always won), counted draft rollups with `firstPassedAt: null` as
"the server already has it", swallowed a quota-refused localStorage write while
writing the done-marker anyway (one silent failure made permanent), and
reported nothing at all — ~30 silent skips found only by a CloudWatch query.

**Check:** the path buffers, retries, writes its marker only on confirmed
persistence, and prints a state line a human can read back verbatim. There is a
contract test pinned to the server's declared limits, not to your assumption of
them. Quantify before raising a server cap: 490 rows × ~4 DynamoDB round trips
≈ 2,000 per invoke, 20–30s against a 30s timeout — the chunking had to live on
the client.

## C6 — A compiled artifact edited, or read while stale

**Recurred:** committed `m14`/`m20`–`m37` `.ir.json` were stale against their
yaml (m17's vocab pack never propagated), so `priorVocab(m33)` was missing 15
words and `reviewWindowFloor` m39 read 34 where it should have read 50 — which
looked exactly like a regression. `05635129` hand-edited compiled `.ts` for
m4/m5/m7/m9/m10 emoji without touching the IR; the next recompile silently
reverted them. `dist/`, the sim app and the APK all served m38-era content while
carrying a current entry hash, so a "clean boot, does not reproduce" verdict was
taken on the wrong build.

**Check:** you edited the source (yaml/IR), you recompiled **every** module if a
module's vocab changed, and you fingerprinted the built surface for the NEWEST
module — not just the entry hash — before diagnosing anything about what is
live. → `content-change`

## C7 — A ratchet raised instead of lowered

**Recurred:** `reviewWindowFloor` m39 34→50 / total 607→623 (a re-measurement
caused by C6, but it presented as a raise); `unknownTokens` 104→105 from a
careless m15 rewrite; `SHORT_ANSWER_BUDGET` is lowered as lanes land, never
raised.

**Check:** the number went down. If it went up, you have a stated cause, you
have proven it is a re-measurement and not new debt, and you flagged it to
Spencer — his rule is never raise. Registering an atom in an early module
re-attributes its token course-wide and can flip a LATER module's ratchet: fix
the rippled module token-neutrally, don't raise its ratchet. → `content-change`

## C8 — Gates green, content unusable

**Recurred and never fixed — zero commits across the whole class:** #90, #91,
#116, #129, #135, #138, #139. The selection code has no floor on sentence
length, no dedupe across a session, and no level filter. #166/#167: 5 filler
vocab MCQs in 18 steps (28%) — the exact failure `recentVocabWindow.ts:108` was
written to prevent. #128: `reviewPool` entries with no `courseAtoms`
registration silently self-translate. 12 local-drafted m30 sentences once
scored 12/12 on the vocab gate and were all worthless.

**Check:** a taught-vocab residual check only proves "no untaught word". Pair it
with structural floors — at least one particle, a minimum length, and a
collapsed-skeleton comparison that flags N sentences built on one frame. Then a
human reads a sample: mechanical gates cannot tell you the particle is the
*right* particle. → `content-change`

## C9 — A named-word fix shipped without the pattern sweep

**Recurred every era:** #10/#13/#15/#19/#25–#28 → #72/#74/#76 → #97/#98/#102 →
#118/#121/#134. Each lap fixed the words in the screenshot. The course-wide
sweep (#72) has been on the to-do list since 2026-09-14 and has not run. When a
sweep finally ran it found 113 British "have got" forms across m25, m27–m32 and
m38 (169 replacements) and "an elevator"-class articles in 44 registry entries
and 58 IR gloss lines across 15 modules.

**Check:** you grepped the pattern across every module of every course, and you
ran the atom-collision check — あき "fall" had to be reverted because it collided
with おちる "fall". → `content-change`

## C10 — The cue is the answer

**Recurred:** #153 — register is taught 521 times and tested 8; all 3
"who is this addressed to?" beats have byte-identical option sets; all 5
register clozes are keyed on a ます/です ending, so the prompt gives the answer
away. The 4th option is also silently dropped on phones
(`MAX_LISTENING_MCQ_OPTIONS = 3`).

**Check:** the learner cannot answer from the prompt's own cue, the option sets
differ between beats, and the option count survives the phone cap.

## C11 — A harness artifact reported as a defect

**Recurred:** `?step` is 0-indexed and has been misread repeatedly; "missing
tile" at 390×844 is viewport clipping behind the fixed CHECK bar until re-shot
tall (~500×1250); #77 was shot in the wrong theme by a tool with no dark flag;
the `/:lang/qa` hub hung the renderer for minutes on `floors:true`; a
`navigator.vibrate` console intervention fired on every lesson mount; two
concurrent CDN sweeps tripped a 2,000-req/5-min WAF rule and were reported as a
site-wide outage and as 4,693 missing clips.

**Check:** you reproduced the symptom twice, on a surface you can name, before
filing it. Before declaring an outage: wait 5 minutes with zero traffic and
re-test two known assets. → `mobile-ui-verify` for the operator gotchas

## C12 — A re-report against a build that predates the fix

**Recurred:** #59, #60, #65, #85 — four "it came back" items that were build
lag. Made worse because status columns are not updated when a fix lands: the b13
table still reads "open" for 14 shipped items, so the next triage cannot tell
fixed from pending without reading git.

**Check:** you read the item's `build` field against the build the fix shipped
in, and you updated the ledger's status column in the same commit as the fix.
→ `feedback-triage`

## C13 — A deploy or build reported green without reading the conclusion

**Recurred:** two deploys failed on 2026-08-25 and were reported successful
twice — once from `gh run watch --exit-status | tail` (the pipe swallows the
exit code) and once from a 200 response serving stale content. `vite-plugin-pwa`
only hard-fails over-cap precache assets under `CI=true`, so a plain local build
looked green and shipped nothing. A single quote inside a single-quoted
what's-new string broke `asc-post19.sh` at line 15 with exit 127.

**Check:** you read the run CONCLUSION directly, and you verified prod by chunk
CONTENT on `app.openlingoapp.com` — not by a 200. → `release-lap`

## C14 — A lane that collided with another lane

**Recurred:** the local coder edited the MAIN checkout instead of the worktree
because its harness resolved cwd to the primary repo (stray uncommitted files on
main, discarded); `9d782f42` staged one file that imported an untracked file
from a concurrent session — it compiled in the dirty tree and broke a fresh
worktree build days later; b13 #92 found another session already mid-fix on the
same ask; a `/private/tmp` worktree vanished on a macOS update with ~25
uncommitted files.

**Check:** you staged explicit paths (never `git add -A`), you confirmed which
checkout received your edits, you scoped your gate run to your own directories
and stated which failures belong to other lanes' dirty files, and you committed
to the branch as the lane landed rather than at the end. → `lane-briefing`

## C15 — The wrong file diagnosed

**Recurred:** the #165 lane built a shared `ListenPromptHeader` for the
listening views — the screenshot was the SPEAKING step's prompt card, so the
whole lane missed. #163 was triaged as content and was app code
(`atomToReviewAtom` dropping `blocked` + `pos`). Two independent leniency lists
in two different files were both stale and neither was backfilled. #133/#138,
#141 and #134 look like one missing-kanji bug and are three unrelated
mechanisms. `ja.reviewLessonRe` matches no live lesson id, so 124 review lessons
silently auto-complete and nobody noticed.

**Check:** you proved the file you edited renders the thing in the screenshot —
by deep-linking `?step=N` and looking — and you searched for the second copy of
whatever you just fixed. #135 and #139 are the honest form of this: both were
recorded as "hits the limits of what a single screenshot can diagnose" rather
than guessed at. → `codebase-search`

---

## Before you report

- Name the class(es) above your change touches, and paste each check's output.
- If your item's class appears in the RCA recurrence matrix, say why your fix is
  the structural one and not the ninth knob.
- Anything you did not verify, say so in those words. "Fixed, unverified on
  device" is a useful report; "fixed" is not.
