# Needs Spencer — open decisions

Recorded 2026-08-19 12:00 MDT. Each item is blocked on a call only you can make.
Everything NOT on this list I am working through unattended.

## 1. matchPairsFloor orphan leak — suppress or teach?

Measured today: the floor pass adds 101 pairs course-wide; **8 cells show a word
no lesson in the course teaches** — ぎんこう (m6, 6 cells), おなじ (m27 L9),
しんぶん (m32 L6). The drawable orphan pool behind it is **116 atoms** (m6–m29;
worst: m19 ×14, m17 ×11, m21 ×11, m16 ×8). Only 3 surface in the default render
because only 101 grids run short — a learner's dynamic review prefix builds
different grids, so 116 is the ceiling, not 3.

Two fixes:
- (A) **Suppress** — freeze the 116 in an exemption set the ja fill pool skips,
  plus a ratcheting test that fails when a new atom is registered but taught
  nowhere. 8 cells swap to a different pool word; grids stay at floor.
- (B) **Teach them** — 116 atoms is real authoring work, spread over 14 modules.

I recommend (A) now and (B) as curriculum debt. **Not shipped — awaiting your call.**

## 2. m33 vocabulary set

m32's IR notes recommend m33 build its transitivity set from pairs whose
intransitive half is ALREADY taught — あく/あける (あける m14), はいる/いれる
(はいる m16), とまる/とめる (とまる adopted at m32) — rather than つく/つける.
Confirm before I author.

## 3. The は TTS decision — now a 60-second listening test

Six probe clips sent in-conversation (course voice, Nanami): **A** ordinary
topic は, **B** the reported ははは failure, **C** ordinary を, **D** ordinary へ,
**E** option #2 (kanji surface), **F** option #3 (forced わ).

**The one thing to listen for: is A correct?** If A, C and D are right, the
regeneration set is the **14** ははは sentences, not the 2,563 IR sentences that
carry は/へ/を in particle position. Then pick E or F.

Two things changed since the issue was filed:
- Swept へ and を: 4,336 distinct IR sentences, 1,519 with particle は, 1,231
  with を, 25 with へ, 14 with ははは.
- **Neither E nor F costs a manifest churn.** The doc said both change the hash
  key; that is only true of the pipeline's current single-field `Job`. Splitting
  `Job.text` (which keeps owning the hash) from a new `Job.speech` (what the
  synthesizer is fed) is four lines in `../lingo-data/pipeline/tts/generate.py`
  and makes the fix structural — わ can never reach the IR, because the alternate
  string lives in the generated deck. Written up in the issue doc.

## 4. Review queue

19 open entries at `/ja/qa/review`, 0 answered — R5, R6, R7, Q3.

## 5. 501 TTS clips staged, not uploaded

`tts-publish/ja/` holds 472 narration + 31 dialogue mp3s for m32, 0 removals.
Manifests already copied into the repo. Upload needs Trevor's AWS creds.
Until it runs, m32 audio 404s to the SPA shell.

## 6. One thing to eyeball, not decide

The second-row drag bug: step 1 of the recorded plan is applied
(`MeasuringStrategy.Always` on the build-tile `DndContext`, commit `9a3ec294`).
Typecheck and the 214 step-view tests pass, but **no test drives a two-row
drag**, so the gesture is unverified. Drag a tile from row 1 to row 2 on a
phone-width build step (m31 L1) and watch the other tiles. If it still jumps at
the row break, step 2 in `docs/todo-draggable-build-tiles.md` is next.

## 7. FYI — the full suite is red, and it is not the Japanese side

`esAudioCoverage.test.ts` fails: 825 Spanish audio texts have no manifest clip
against a ratchet of 719. That is the other session's in-flight Spanish work
(R2 in the review queue describes the 719; the count grew as more Spanish
content landed). Every other one of the 461 test files passes, and `module-gate
-- m32` is clean on its Japanese stages — including TTS coverage at 7552/7552,
so m32's staged clips are fully accounted for by the manifest.

Flagging it only so a red suite does not read as damage from this session's
commits. Nothing here touched Spanish.
