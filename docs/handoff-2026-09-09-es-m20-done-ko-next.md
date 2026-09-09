# Handoff 2026-09-09 (evening) — ES m17–m20 done locally; KO audit queue next

Supersedes the m19/m20 sections of `docs/handoff-2026-09-09-es-m17-m20.md`
(keep that file for the recipe, gate lessons and optimizations list).

## HARD RULE (Spencer, "an expensive mistake")
Never author bulk content inline in the main session. Lesson bodies go to
Sonnet subagents (`Agent(model: "sonnet")`), 1–2 lessons each, in parallel,
each iterating on `check-frag.sh` itself; the main session writes
spine/header/placement/test pins, gates, fixes ≤10-line residuals, ships.
Recorded in CLAUDE.md ("Never" list) and memory `es-author-with-sonnet-agents`.
m20 was the first module done this way — see "What it cost" below.

## State
| item | state | commit |
|---|---|---|
| m17 «Me levanto» | ON PROD (verified: bundle index-BKyRxjjN.js serves "Me levanto"/es-m17-8); red-main issue #5 CLOSED with that evidence | 290035db |
| m18 «Nosotros y ellos» | local green, NOT pushed | 880ce368 |
| m19 «Ayer hablé» | local green (pins fixed, 13 extra clips) | e86e17d1 |
| m20 «Fui, hice, tuve» | local green, ES suite 1425 tests, 224 clips | b8d3a613 |
| preflight | GREEN (exit 0, 12808 tests, CI-semantics build) on 83b82650 after a one-line practice-test fix | 83b82650 |

Local main is 8 commits ahead of origin/main. NOT pushed (Spencer decides; the
mobile session asked to be told before any push so its practice-wave merge
fetches first — message "Mobile app feedback fixes [fbedc0]").

## Push checklist (when Spencer says push)
1. Tell the mobile session you are pushing.
2. `git fetch && git rebase --autostash origin/main`
3. `npm run preflight > log 2>&1; echo $?` — read the exit code directly.
4. `git push origin main`; `gh run watch <deploy id> --exit-status`;
   `gh run view <id> --json conclusion`.
5. Prod fingerprint: entry chunk contains "Nosotros y ellos", "Ayer hablé",
   "Fui, hice, tuve"; sample 2 new clip hashes from `tts-publish/es/` →
   `https://app.openlingoapp.com/tts/es/<hash>.mp3` is audio/mpeg.
6. Update memory `es-course-state`.

## m20 — how it was built (the template for every future module)
- Fable: `m20-header.yaml`, `m20-placement.yaml`, `m20.test.ts`,
  `es-m20-brief.md` (the brief is reusable: swap the header/plan table).
- 5 Sonnet agents (L1+2, L3+4, L5+6, L7+9, L8+10) drafted from the brief;
  each ran `check-frag.sh` to FRAGMENT OK before reporting.
- First full-suite run: 6 content failures. Two were sent back to their
  agents via SendMessage (L8 26→20 steps; L4 selection marathon); four were
  ≤10-line fixes by Fable (bare atom surfaces «museo»→«el museo»; an inv-28
  full-sentence MCQ; two untracked words «hico», «todo»); one was a pin bug
  («trabajo» the noun matched the present-verb regex).
- A Sonnet linguistic reviewer read the assembled IR and found 4 real defects
  the gates cannot see (non-PRIOR words in NPC lines: tiempo/descansar/
  interesante/algo; «y hice» → «e hice»; a false info-card claim hago→hizo).
  ALWAYS run this reviewer pass; it is cheap and it caught a factual error.
- TTS chain run twice (217 + 0), then once more after the review (7).

## What it cost (for Spencer's optimization question)
- Sonnet drafting: ~750k tokens across 5 agents (117k–208k each) + ~380k
  for the two fix round-trips + 158k for the reviewer ≈ 1.3M Sonnet tokens.
- Fable: header/placement/pins/brief + triage — a fraction of the m19 inline
  cost, no compaction needed during m20.
- Wall clock: ~12 min drafting (parallel), ~3 min fixes, ~10 min TTS.
- Brief errors that cost a round-trip (fix the brief template next time):
  a win sentence with a non-PRIOR word («la cena»); `estoy/estás` listed as
  PRIOR when they are not; agents wrote bare noun surfaces in `atoms:` (say
  "atoms use the full registered surface, article included").

## Backlog carried
B109–B115, walk debt B111, hacer ruling B112 in every mN.test.ts; dead
`LINGO_CUSTOM_ART["es:mesa"]`; stale `conjugationTables.ts` comments;
m21+ unplanned (A2 continues: plural preterite, or imperfect).

## KO queue — from the mobile session (owner of none of these; all unstarted)
Source: cross-session message 2026-09-09 from "Mobile app feedback fixes".
KO m1–m27 live on prod + TestFlight (R1–R4 shipped 2026-09-02, head c98e79b1).
Payton is the KO QA tester; Spencer is not walking KO.
1. [HIGH] Audit the unaudited re-author delta: `docs/ko-release-audit-2026-09-01.md`
   predates R1–R4. Unreviewed: ko-m2-cv-1/2/3, ko-m2-bt-*, ko-m1-mix-1/2,
   빵 at m5 (ko-m5-3/ko-m5-5), and R2's 562 `unlockModule` moves in
   `src/features/languages/ko/**/frequencyAtoms*` (ingest
   `scripts/ingest-ko-frequency.mjs`, baseline `ko/__tests__/freqRankBaseline.json`).
   Shape: one Sonnet agent on `git diff 65c0944e..c98e79b1 -- src/features/languages/ko`.
2. [HIGH] m16–m27 never audited; gates `introBeforeGraded` and
   `koCompoundingReview` stop at m15 (`ko/__tests__/introBeforeGraded.test.ts`,
   `koCompoundingReview.test.ts`). Extend both to m27, fix what they catch.
3. [MED] Payton's findings in `docs/user-feedback/` (KO rows, if any); port the
   JA uncued-particle detector to KO (은/는/이/가/을/를 cloze prompts with no
   English cue) — memory `uncued-particle-prompts`.
4. [MED] 화요일/목요일 srsEligible without an intro card → intro card or flag.
5. [LOW] koCompoundingReview ratchet 0.6; m12 tight at 0.625 — author m12
   review carriers first (`curriculum/_reviewInterleave.ts`).
6. [LOW/LONG] 742 untaught grade-A words: `docs/ko-gap-audit-2026-08-26.md`,
   `docs/data/ko-graded-vocab.json`, B067 packs 7–13.
7. [LOW pipeline] lingo-data TTS manifest read-modify-write has no lock —
   serialize KO TTS with the other session's JA TTS.
Cautions: `aws sso login` before `pipeline.tts.upload`; CDN host is
app.openlingoapp.com, never the apex.
Mobile session ownership (avoid): lesson step views, ja/conjugation, practice/**,
ja m11/m30 IR, `src/features/lesson/moduleCompiler.ts` + lesson types (on
branch practice-wave-2026-09-09, unmerged — no compiler edits until it lands).
They are NOT touching es/**, ko/**, fr/**.

## Resume recipe for KO item 1 (do this the Sonnet way)
Spawn one Sonnet agent: read `docs/ko-release-audit-2026-09-01.md` for the
audit rubric, then `git diff 65c0944e..c98e79b1 --stat -- src/features/languages/ko`
and the listed lessons; report defects as `<lesson/step id>: <problem> → <fix>`.
Fable triages, applies ≤10-line fixes, sends the rest back. Then item 2:
extend the two gates to m27 (small test edits, Fable), run, hand findings to
Sonnet fixers per module.
