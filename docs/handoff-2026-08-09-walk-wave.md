# Handoff — 2026-08-09 walk wave + retirement + pad fix

**Status:** LIVE session handoff · everything below is UNCOMMITTED on main (fast-walk-loop pattern; Spencer will call the commit shape).

## What happened today, in order

1. **Three subagent walks ran** (all reports in `docs/learner-sim/`):
   - `m8-rebuild-walk-2026-08-09.md` — zero-knowledge re-walk after the e02069a5 IR rebuild. Net positive (4/5 old BLOCKERs retired); its 5 CONFUSING findings were **fixed same-day in `ir/m8.ir.yaml`** (see the doc's Resolutions section — review-1 いって beats deleted, cuisine/water/by-you prompt fixes, きょう/さんぽ pulled from reviewPools). Module gate green on all mechanical stages.
   - `m16-packs-2026-08-09.md` — the owed pack walk. Both packs SHIP (0 BLOCKER). Its MAJOR became B088 (fixed, below).
   - `m30-n4-walk-2026-08-09.md` — evidence file FOR the ratified pilot retirement; do-not-fix-in-place. Its F5.1 ellipsis TTS bug fixed same-day (`…` added to both strip classes in `src/shared/tts/index.ts` `getTtsUrl`).

2. **A1+A2 of the N4 spec EXECUTED** (spec: `superpowers/specs/2026-08-06-n4-open-and-transform-teaching-design.md`; A3 authoring deliberately deferred by Spencer):
   - Pilot deleted (m30.ts + test, 15 mockLessons entries, map tile, COMPLEXITY_FLOORS m30 row). `ja-m30-people-at-work` passage kept.
   - N4 tier now carries ONE `comingSoon` placeholder tile ("て + helper I — 〜てみる / 〜ておく") — the spec assumed A1+A3 land together; this is the standalone-A1 adaptation.
   - 19 atoms re-homed: 4→`thr-n4`, 9→`m49` (しりあい moved there from the unowned set — spine's m49 salvage names it; m50 got zero), 6→`"future"`. `introducedByLessonId` deleted from all 19. The union extended was `CourseAtomSource` in courseAtoms.ts (spec's grammarHelpers:645 pointer was wrong).
   - Ratchets DOWN: MAX_DANGLING_ATTRIBUTIONS 227→226, MAX_GRADED_NEVER_UNLOCKABLE 223→209.
   - Learner-visible: three register stories' gate moved m30→m50 (leave the library until Keigo II); 5 pilot-only trainer verbs parked at `introducedAtModule: 99`.
   - A4 (placement tier 8) NOT executed — still owed when A3 lands.

3. **B088 FIXED** (backlog record updated): new truthful accessor `getJaTaughtKanaBeforeModule` in `src/features/languages/ja/curriculum/taughtVocab.ts` — IR modules use compiled `priorVocab`, no-IR modules fall back to isDeadAttribution-aware attribution; `pickFillTiles` (buildTileFloor.ts) filters JA pad picks through it. Regression tests pin the walks' leak words out (non-zero-scan guarded) + positive control that sibling-set distractors still fire. **Reuse candidates: B086 trainer pins, B070 gate; `matchPairsFloor.ts:398` has the same bug class, untouched.**
   - Exposure ratchets moved UP honestly (phantom exposure un-counted): never-touched 71→104 (B088) →140 (retirement), never-graded 173→183, each with dated changelog entries in `atomExposureAudit.test.ts`. MAX_GRADED_BUT_NEVER_WRITES 37→18 (down).

4. **Verification of the combined tree** (run twice — by the last agent and independently by the orchestrator): `npx tsc --noEmit` clean; `npx vitest run` → 430 files / 9217 tests passed, 0 failures. Learner views regenerated.

## Re-stamp analysis LANDED (2026-08-09 ~13:33) — decision pending

- Deliverables (analysis only; `--apply` never run, `src/` untouched by this work): `scripts/restamp-from-module.mjs` (dry-run default, all-or-nothing `--apply`, refuses to emit a diff if any of 6 positive controls fails) · `docs/fromModule-restamp-report-2026-08-09.md` · `docs/fromModule-restamp-diff-2026-08-09.txt` (391 rows with per-row evidence).
- Headline (932 atoms): match 491 · kana-row 51 · **351 total re-stamps** (152→"future", 21 sentinel→mN, 39 earlier, 139 later) · **40 ambiguous = human worklist**.
- Notable: negative control ぎゅうにゅう FAILED HONESTLY — the 07-29 "untaught" claim is stale; `ja-m5-neo-3-vmcq-gyuunyuu` is a live m5 word-image debut. Also: 40 authored `ja-gpool-*` steps fail the comprehensibility gate under true tags (pre-existing B070-class content bugs, entangled with stale grammar-point `module` values, e.g. kono-sono-ano says m8 but IR teaches m17).
- Landing sequence in report §6: rulings pass (40 rows) → point-module + authored-content fixes → one commit (apply + ratchet pins + gate exemptions) → full suite → re-run exposure/stale dumps, authoring audit, learner-sim walks m5/m8/m11/m16/m17 + placement QA. Land NOTHING until Spencer reviews; supersedes the per-pack burn-down plan IF approved.

## Owed / decisions queue

**The Spencer-facing version of this queue is now the IN-APP page `/:lang/qa/review`** (Spencer redirected the first markdown draft to the baked-in QA-page style, 2026-08-09). Entries live in `src/features/lesson/dev/reviewQueue.ts`; his verdicts mirror live to `/tmp/lingo-review-queue.json`. How-to: `docs/qa/README.md`. Agents: add new decisions/findings THERE per the in-file read-me. Coverage as of 2026-08-14: **R1–R15 + Q1–Q4** — R1–R7/Q1 from this wave, R8–R11/Q2–Q4 added by the later 08-09 sessions (mobile pass, ES wave), R12–R15 added 2026-08-14 porting the four pre-queue decision-needed backlog items (B079, B026, B056, B059). All still unanswered as of 2026-08-14; tree below still uncommitted, re-verified green (9,227 tests / 0 failures).

- **Spencer:** Auth0 re-auth (`npm run test:e2e:auth`, navigate to /login) — visual-QA gate blocked since the m8 fixes; B090 ない-form lesson placement (decision-needed); B089 particle-contrast rule-card pass go/scope; re-stamp go/no-go after the report; commit shaping for today's tree.
- **Trevor:** TTS CDN upload creds — blocks any future new-audio content (n4-01 authoring will need it; today's fixes deliberately used existing-corpus clips only).
- New backlog this session: B088 (fixed), B089, B090.
