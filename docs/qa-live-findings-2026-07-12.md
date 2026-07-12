# Live QA run — 2026-07-12 (Spencer's step-type test drive)

Dispositions for every note streamed from `/ja/qa`. **FIXED** = landed +
verified this session; **DISCUSS** = queued for a design conversation;
**AUTHORING** = direction for future content passes, no code change.

| Step / surface | Verdict | Disposition |
|---|---|---|
| info | good (card) | **FIXED-adjacent:** verified long bodies scroll inside the step scroller, window never scrolls (480px viewport test) — durable note left on the QA row. Survival Phrasebook sidequest **pulled from the map** (tile commented, lessons stay deep-linkable). |
| multiple_choice | good overall | **FIXED:** m27-2-1 "must take medicine" cloze had なくちゃ as a distractor in the same lesson that teaches なくちゃ as valid — quasi-correct distractor made it feel unanswerable. Swapped in both clozes; rule noted: distractors must be cleanly wrong. |
| build_sentence | good | **FIXED:** particle-tile separation — のが split into の+が (m16/m23, 14 sites), シャワーを and はを split (m13). Cloze options/answers deliberately keep combined particles. New conformance test `particleTileSeparation.test.ts` enforces the rule (with lexicalized allowlist: いつも, でも, もの, それから…) for build_sentence AND listening_build, forever. Tile-footprint styling: **DISCUSS** (with grammar_rule sizing). |
| match_pairs | 6 pairs good | **FIXED:** grid height capped (rows × 4.75rem) so cards stop stretching to fill tall viewports; short viewports still compress. |
| translate | good + systemic leniency gap | **FIXED:** (1) accepted-answer variant expander — leading わたしは/ぼくは topic droppable, pronoun swap, trailing です droppable (never after ん), trailing punctuation ignored (was silently required before!). (2) **Romaji typing shipped** — wanakana live-composes English letters → kana in the answer box (rung 1 of the typing ladder); grading reads the DOM at submit + final toKana pass. Verified: "senseidesu" and "bokuhasensei" pass, wrong content still fails. KO romanization input: future (no wanakana equivalent — needs the hangul compose engine from the keyboard plan). |
| listening_comprehension | good for now | **AUTHORING:** expand to sentence-level items ("fill-in-the-blank for the word" framing) — helps authoring + sentence exposure. |
| listening_build | good | **AUTHORING:** expand to sentences like build_sentence; particle-separation guard already covers this type. Word-level "make what you hear" is the weaker form — lean sentence-first in future authoring. |
| speaking | love it | **FIXED:** circular mic button → full-width bar ("Tap to speak" / "Listening — tap to stop"); mic-permission dialog now pre-prompts at step MOUNT whenever permission is undecided and the session isn't in silent/no-mic bypass. (Bar not verifiable headless — speech flag off in dev-verify env; check visually.) |
| symbol_intro | good | no action |
| symbol_trace | best type | no action |
| symbol_recognition | good | **FIXED:** "Pick the symbol for" prompt bumped a size (text-xl/2xl, romanization text-3xl). |
| symbol_to_sound | good | **POLISH backlog:** text/image element centering audit. |
| word_image_mcq | good | no action |
| phrase_card | keep, but no place currently | **AUTHORING/DISCUSS:** don't reach for it in new content; it stays in the engine (it's also the teach-successor used by /try preview step 1). |
| grammar_rule | too big, forces reading | **DISCUSS (explicitly requested):** split rule / right-way / wrong-way into smaller separate exposures instead of one big card. Redesign of the card + authoring format — needs a session. |
| particle_cloze | weak without context | **FIXED:** English gloss now shows PRE-answer on every surface (was deck-only). **AUTHORING:** treat particle_cloze as an introduction-phase step; prefer richer context steps later; some items have no single right particle without context — authoring rule: every cloze needs enough context to force the answer. |

## Cross-cutting
- Sizing/fit discipline ("content fits inside the viewer, CTA anchored"):
  verified for info + fixed for match_pairs; grammar_rule is the remaining
  offender → part of the grammar_rule redesign discussion.
- The live-notes pipe (QA page → vite middleware → watcher) worked as the
  feedback loop for this entire run.

## Placement test (post-run critique, with screenshot)
| Critique | Disposition |
|---|---|
| "Everything being 4-card MCQ is ugly — 4 of the same sentence where only a particle differs" | **FIXED:** `instantiateItem` now detects shared-frame options and renders them as a sentence-with-blank + chips (existing cloze UI) with the English intention shown above — same discrimination, one sentence. Genuinely-different options stay MCQs. Unit-tested incl. a live-bank conversion floor. |
| "Don't say 'we didn't test you, go do them' for older modules — assume known, vocab into SRS" | **FIXED:** assumed modules are now marked complete in `applyPlacementResult` (review lessons still stay available); vocab seeded to review as before. Result copy now reads "Credited from your level… anything shaky will resurface in reviews." |
| Result screen shows raw ids (m25, m19…) in the missed list; chips unsorted (M20 M1 M2) | **FIXED:** bare module ids resolve to "M19 — <title>" via the course; chips sort numerically. |
| Placement accuracy | Good per Spencer — no engine changes. |
