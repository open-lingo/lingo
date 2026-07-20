# Lesson authoring guide

> **2026-07-20 REWRITE-ERA ADDENDUM (m3-neo pilot walk — READ FIRST).**
> [authoring-invariants-pinned.md](authoring-invariants-pinned.md) is the
> AUTHORITATIVE constraint set (25 invariants) and travels verbatim with
> every dispatch; where this guide disagrees, the invariants win. Deltas
> vs the guide body below:
> - **selfExplain is BANNED in ja** (metalinguistic quiz — Spencer
>   2026-07-19). Ignore every selfExplain slot in §2/§3/§4; understanding
>   is tested by USE (choice-under-contrast clozes, forced-choice).
> - **≥12 lessons per module from m4 on** (11 teaching + 1 review).
> - **Persona canon** (invariant 21): Tom=student/American/Mika's friend,
>   Mika=student/Japanese, Tanaka=the teacher, Ken=student/Japanese —
>   across ALL surfaces including slot-filler practice sentences.
> - **Dialogue questions grade on stated facts only** (invariant 22);
>   speaker labels are ROMANIZED (Tom/Mika/Ken/Tanaka).
> - **Sentence variety** (invariant 24): any primary sentence surface ≤3
>   uses per lesson; recycle earlier-module nouns as carriers; every
>   non-prior word's FIRST occurrence must be an intro-capable step.
> - **Production-framed prompts** ("pick your reply", "Say: …") are
>   generation steps, never sentence MCQs.
> - **Particle-substitution concepts (も-class): compact rule card BEFORE
>   first exposure** — meaning isn't inferable from one hearing.
>   Exposure-first stays right for inferable patterns (だ-class).
> - **Dialogue TTS**: real two voices (Keita for male speakers), raw
>   clips, per-sentence chaining (invariant 23).
> - **Machine enforcement**: every module test file calls
>   `registerModuleBarGuards(...)` — density, variety, sentence-repeat,
>   reply-MCQ ban, vocab provenance, persona canon all fail CI, plus
>   Gate 10 visual + continuity judging before Spencer walks it.


**Status:** LIVE · **Last-verified:** 2026-07-17

How to author a Lingo JA sub-lesson that passes every standard we've accumulated. Living doc — refine as new findings land.

> **Start with §4d and §4e.** The 2026-07-16 script-ladder wave changed what a ja lesson may
> contain: **ja ships ZERO `info` steps** and every lesson must **end on a gradeable step**.
> Several older sections here (§3's template bookends, §9, §13.5 step 4, §14.4's template) still
> describe the pre-purge shape and are marked stale inline — §4d wins where they conflict. The
> script ladder (romaji off at m7, kanji recognition at m8, furigana unlock+2, never
> romaji+kanji, no typed kanji) is in §4e, and the new `kanjiReading` step is in §4f.

**Read this before authoring any new JA lesson.** Read `docs/n5-content-spec-2026-05-25.md` (curriculum-level scope) + `docs/m3-m7-rebuild-spec-2026-05-18.md` (M3-M7 contract) + `docs/user-feedback/` (real-user evidence) for context. **Also read `docs/pedagogy-principles-2026-07-05.md`** — the binding rules for what explanations may claim about Japanese (が/は model, helpers-not-conjugation, structure-true glosses); this guide covers lesson mechanics, that one covers linguistic framing.

---

## 1. The one-paragraph contract

A Lingo JA sub-lesson is **20-22 retrieval-heavy steps** that introduce 2-4 new atoms (vocab or grammar), drill them with rotating-answer MCQs + 1 typed translate + 1 speaking, fold in a `selfExplain` at position N-1 (after the learner has committed 2-3 times), and close with a 3-5 step **compounding-review tail** drawing from prior modules' `M3_M7_REVIEW_POOL`. Every introduced atom must re-surface ≥3 times across the M3-M7 corpus. No same-answer cloze clusters, no auto-pass on speaking, no hardcoded MCQ slot, no match-pairs grid below 4 pairs. The lesson is fun because every step is a chance to win; it teaches because every step makes the learner retrieve, not re-read; it sticks because every prior atom you've seen comes back when you'd start forgetting.

---

## 2. Density bar (every sub-lesson)

| Dimension | Floor | Aim | Ceiling |
|---|---|---|---|
| Step count | 20 (aim, **not** the hard floor) | 21 | 22 (hard 25) |
| Distinct step types | 5 | 7-8 | — |
| Adjacent same-type | — | — | 0 (no two same-`type` steps in a row) |
| Consecutive selection-MCQs | — | — | 2 (never 3+ in a row, even if types differ) |
| Review-to-new ratio | 0.25 | 0.3 | — |
| Generation steps per sub-lesson | 1 | 2 (translate + speaking) | — |
| selfExplain per grammar-drill sub-lesson | 1 | 1 (at N-1) | 2 |
| Hard direction (translate / speaking) position | step 12+ | end | — |
| Sentence complexity (production targets, m20+) | ≥1 adverbial/clause/modifier — §4g | — | — |

> **Enforced band vs aim:** the only *hard* step-count gate is **12–25** (`sub-lesson-density.test.ts`); 20–22 is the density *aim*, not a floor. **Do not pad with filler (extra `phrase_card`s, re-read beats) to reach 20** — a tight 14-step lesson where every step earns its place beats a padded 21. (`n5-content-spec-2026-05-25.md` is aligned to this 20–22 aim as of 2026-06-30.)

> **Variety (two rules):** (1) **No two adjacent steps of the same `type`** — machine-enforced (`previewLessons.test.ts`). (2) **No more than two selection-MCQ steps in a row**, *even when their `type` differs*. Many types are the same interaction under the hood — `vocabMcq`, `sentenceMcq`, `particle_cloze`, `listeningCompSentence`, `self_explanation_mcq` are all "tap one of N." Rule (1) stops the identical repeat; this cap stops an MCQ marathon (three+ taps in a row reads as the same drill even with different type strings). Break a run with a generation step (`build`, `translateStep`, `speaking`) or a teach/`info` beat. *(Guidance, not yet a test — added 2026-06-30.)*

Hard guards (vitest):
- `src/features/lesson/data/sub-lesson-density.test.ts` — fails if any sub-lesson < 12 or > 25 steps.
- `src/features/lesson/data/atom-coverage.test.ts` — fails if any introduced atom has < 3 occurrences across the corpus.
- `src/features/lesson/data/mcq-position-distribution.test.ts` — fails if any MCQ-type's correct slot has > 55% concentration.
- `grammarHelpers.ts:assertNoSameAnswerCluster` — throws at import if a sub-lesson's cloze block has ≥3 consecutive same-particle answers.
- `grammarHelpers.ts:assertAnswerRotation(steps, minDistinct=2)` — throws at import if a sub-lesson's cloze block has < 2 distinct correct particles (3 for drill-only sub-lessons).

---

## 3. Sub-lesson template (M3-M7+)

This is the canonical shape. Adapt freely within the density bounds, but every section should be represented.

> **ja: the `[info: ...]` bookends below are STALE (§4d).** ja ships zero info steps and every
> lesson must end on a gradeable step. For ja, drop step 1 and open on the first teach/retrieval
> beat; drop step 20 and let the `reviewMatchPairs` at 18 close the lesson. The template is
> otherwise current, and stands whole for es/ko.

```
Sub-lesson N — <name> (target: 20-22 steps)

  1.  [info: open]      ja: OMIT (§4d). es/ko: one-line propulsion + audio cue.
                        NOT exposition. ("Three particles that put things AT, BY, and IN.")

  ── Atom introductions + immediate retrieval (8-10 steps) ──
  2.  grammar_rule      (ja: NOT a phrase_card trio — banned, §4b2)
  3.  vocabMcq         (target = atom-1, emoji from n5-vocab-emoji-reference)
  4.  listening_comp   (anchor word, EN distractors)
  5.  vocab            (atom-2)
  6.  vocabMcq         (target = atom-2)
  7.  particle_cloze   (carrier sentence introducing the new particle)
  8.  vocab            (atom-3)
  9.  listening_build  (anchor sentence in mora tiles)
  10. particle_cloze   (rotating answer — different from step 7's correct)

  ── Mid-block production + selfExplain at N-1 (4-6 steps) ──
  11. translateStep    (TYPED — highest-tier retrieval; see §5.2)
  12. sentenceMcq      (kana-sentence selection from English prompt)
  13. particle_cloze   (third answer particle — must hit ≥3 distinct across the block)
  14. selfExplain      (AFTER 2-3 commits, NOT immediate — see §5.3)
  15. speaking         (anchor sentence — Whisper-graded)

  ── Compounding review tail (4-6 steps from prior modules) ──
  16. vocabMcq         (prior-module atom, distractor pool also prior-module)
  17. listeningCompSentence (prior-module sentence)
  18. reviewMatchPairs  (4-6 pairs from prior pool — never < 4)
  19. particle_cloze   (prior-module grammar reuse — compounds across modules)

  20. [info: close-win] ja: OMIT (§4d) — the reviewMatchPairs at 18 is the close, and it must
                        be gradeable. es/ko: identity-anchored — "You can now ask where the
                        train station is."
```

Variations:
- **Vocab-only sub-lesson** (introduces a noun set, no new grammar): skip the `grammar_rule` + the second `selfExplain` slot. Reuse a prior-module particle in cloze carriers. Keep the same overall density.
- **Drill sub-lesson** (no new atoms — pure rotation/interleave practice): swap `grammar_rule` + `vocab` slots for more cloze + selfExplain + production steps. Density holds via wider variety.
- **Dialogue closer**: ONE `dialogue_listen` step replaces multiple individual listening + MCQ steps. Wrap with warm-up vocab + production + review tail to hit 20-22.
- **Mastery row test**: the `row_test` step is itself a 6-12 item drill; the lesson is just 3 steps total (info open + row_test + info close). Exempt from the density bar.

---

## 4. Step-type cheat sheet

Use the M3-M7 helpers in `grammarHelpers.ts`. Inline literals are a last resort (no slot rotation, no atom-coverage tracking).

| Goal | Use | Notes |
|---|---|---|
| Show a new vocab word | ~~`vocab(...)` / `phrase(...)`~~ | **BANNED in ja** — both produce `phrase_card`, which is shelved (§4b2). Zero call sites remain. Introduce via `vocabMcq` / `listeningCompSentence`+`speaking` / `build` instead. Still valid for es/ko. |
| Introduce a grammar concept | `grammarRule(...)` | Include 2-3 examples + antiPattern + cultureNote. **`antiPattern.ja` MUST be a full sentence forming a minimal pair with `examples[0].ja`** — `deriveGrammarMicroSteps` auto-injects a "One of these is wrong — pick the correct sentence" step pairing `examples[0].ja` (correct) against `antiPattern.ja` (wrong). A bare word fragment (`のみる`) paired against a full sentence is a giveaway that tests nothing; the wrong sentence must also be *unambiguously* wrong (avoid an anti-pattern that's a valid alternative reading — e.g. くる→きる fails because きる="wear" is a real word). m26/m27 do this right; m29 shipped bare fragments and had to be fixed. |
| Cloze a particle answer | `cloze(...)` | Authors pass options in any order; the factory rotates the correct slot deterministically. Must hit `assertAnswerRotation(steps, 2+)` across the block. |
| Visual MCQ on a vocab word | `vocabMcq(...)` | Distractors auto-drawn from the supplied pool. Throws if pool can't yield 3 emoji-bearing foils. Skips `WORD_IMAGE_MCQ_BLOCKLIST` kana. |
| Kana sentence selection from EN prompt | `sentenceMcq(...)` | Slot-rotated. Three explicit kana distractors. |
| Free-recall typed Japanese | `translateStep(...)` | TYPED input (NOT MCQ — accidental win per audit §3.4; preserve). Highest-tier retrieval. |
| Listening comp on a sentence | `listeningCompSentence(...)` | EN options, slot-rotated. |
| Listening + reassemble in mora tiles | `listeningBuildSentence(...)` | For ≥4-mora sentences. |
| Build a short sentence from word tiles | `build(...)` | Only for ≤4-mora sentences. ≥5-mora → use `translateStep` + `listeningBuildSentence` + `speaking` instead. |
| Production by voice | `speaking(...)` | Whisper-graded, 2-fail-then-choice flow. NOT stubbed in M3-M7 (was a bug, fixed 2026-05-18). |
| Match Japanese ↔ English | `reviewMatchPairs(...)` | Auto-padded to ≥4 pairs from `M1_REVIEW_POOL` if local pool is thin. |
| Multi-turn dialogue + comprehension MCQs | `dialogueListen(...)` | NEW 2026-05-18. Replaces the legacy `dialogueLesson()` phrase-card chain. Use for every module's dialogue closer (M3-7, M4-7, M5-7, M6-8, M7-8). |
| Metacognitive "why is X correct" | `selfExplain(...)` | Place at sub-lesson position N-1 — AFTER 2-3 commits, NOT immediate. Rule-citing-wrong distractor (not "obvious nonsense"). |
| Read a kanji word (kanji → kana) | `kanjiReading(...)` | **NEW 2026-07-16.** MCQ over kana readings. Atom-keyed (auto-tags `exercisedAtoms`), slot-rotated. Kanji surface resolves from the shipped rollout catalog, so it can't test a word the ladder hasn't cleared — a throw means "pick another word," not "work around it." Distractors default to generated near-misses. See §4f. |
| Chrome / framing card | `infoStep(...)` | **BANNED in ja** — see §4d. Still valid for es/ko. |

---

## 4b. Listening is sentence-first from M5 (Spencer, 2026-07-12)

Single-word "make what you hear" is the WEAKER form of both listening
types — from M5 onward, author `listening_build` with ≥ 3 tiles (a real
sentence, particle tiles separate per the particle-separation guard) and
prefer sentence transcripts for `listening_comprehension` ("hear the
sentence, pick what it means" — effectively a listening cloze for the
word in context). Word-level items stay legitimate in M1-M4 (kana
acquisition) and as occasional vocab-recognition drills, but they must
never grow a module's word-level count: `listeningGranularity.test.ts`
ratchets each M5+ module's count downward — lower the baseline when a
backfill wave lands, never raise it. New sentences need TTS emission
(`emit-tts-deck.mjs`) and must pass the comprehensibility gate.

## 4b2. phrase_card is shelved (Spencer, 2026-07-12)

Do not author new phrase_card steps. The type stays in the engine; its one
sanctioned home is the pre-auth /try preview opener (a cold visitor has
nothing to retrieve yet, so introduce-then-recall is legitimate THERE).
In-course vocabulary introduction happens through drills + the compact
grammar card, never passive phrase cards.

> **`vocab()` and `phrase()` ARE the phrase_card constructors** (`grammarHelpers.ts` — both
> return `type: "phrase_card"`). So this rule bans those two factories in ja, which is not
> obvious from their names. **ja curriculum now contains zero phrase_card steps and zero
> `vocab()`/`phrase()` call sites.** `phrase_card` is pinned in `UNUSED_STEP_TYPES`.
>
> **This makes the vocab-introduction rows of the older templates stale**: §3's
> `2. grammar_rule OR phrase_card trio` and §13.13's L1 `vocab × 5–8`. Introduce vocabulary via:
> - `vocabMcq(...)` — the image IS the introduction (§13.2; that pattern already says "NO bare
>   vocab card").
> - `listeningCompSentence(...)` + `speaking(...)` for atoms with no honest emoji (§13.1's rubric
>   — compound nouns, blocked abstractions).
> - `build(...)` for verbs/adjectives/pronouns per §13.1.
> - `grammarRule(...)` where a concept genuinely needs a compact teach card.
>
> m23–m27 are all post-purge and phrase_card-free — **copy what they actually do**, not what the
> templates below claim.

## 4c. Particle clozes are an introduction device (Spencer, 2026-07-12)

A TRUE particle cloze (all options are particles) may only be authored
within 2 modules of the drilled particle's introduction. Beyond that,
contrast work (は vs が…) belongs to review lessons and the grammar deck —
interleaving surfaces — not teaching lessons. Every cloze must show its
English gloss pre-answer (now automatic) and carry enough context to force
exactly one particle. `particleClozePlacement.test.ts` grandfathers the 82
existing late usages as a shrink-only list; new late usages hard-fail.

## 4d. ja ships ZERO `info` steps (2026-07-16 info-step purge)

**Do not author `info` steps in ja.** The info-step audit removed all 842 recap/preview
boilerplate cards and promoted the 20 genuine teaching cards to `grammar_rule`. ja now ships
zero, and two conformance tests hold the line:

- `ja/__tests__/moduleConformance.test.ts` — "no ja lesson contains an `info` step". Hard fail.
- Same file — **"every ja lesson has ≥1 step and ends with a gradeable step."** No lesson may
  terminate on a passive teach card (`info` / `grammar_rule` / `phrase_card` / `symbol_intro`).
  The last thing a learner touches must be a retrieval, not an exposition slide.

`info` is pinned in `UNUSED_STEP_TYPES` (`lesson/dev/qaCatalog.ts`) from the ja-scoped view. The
type stays in the engine — **es and ko still ship it** and their QA pages cover it.

> **This makes several older sections of this guide stale for ja.** §3's template opens on
> `[info: open]` and closes on `[info: close-win]`; §9 is entirely about authoring info win
> cards; §13.5 closes on an `infoStep`; §14.4's story template opens and closes on info. Those
> are the pre-purge shape. **Where they conflict with this section, this section wins.** Open
> with propulsion built into the first *retrieval*, and close on a gradeable step —
> `reviewMatchPairs` is the canonical closer (recognition-easy, almost-always-right, and
> gradeable, so it satisfies both §13.5's close-on-confidence instinct and the ends-gradeable
> gate).

## 4e. The script ladder — what authors must know (2026-07-16)

Romaji, kana, and kanji are on a **module-indexed ladder**. It is enforced in the renderer, not
by author discipline, but authoring against it wrongly produces steps that leak their own
answers. Constants are live — read them, don't memorise them:

| Constant | Value | File |
|---|---|---|
| `HIRAGANA_ROMAJI_OFF_MODULE` | **7** | `shared/settings/romajiAutoFlip.ts` |
| `KATAKANA_ROMAJI_OFF_MODULE` | **17** | same |
| `BUILD_TILE_ROMAJI_FADE_MODULE` | **5** | same |
| `KANJI_RECOGNITION_MODULE` | **8** | `ja/secondScript/kanjiRollout.ts` |
| `FURIGANA_WINDOW` | **2** | same (unlock+2 rolling window) |

The rules that bind authors:

- **Romaji dies entering m7** (katakana romaji persists to m17; build tiles fade romaji from m5).
- **Kanji recognition starts at m8**, applied by the `applyKanjiSurfaces` post-pass
  (`ja/secondScript/`). It is atom-id keyed and edits **only** `*Annotation` display fields —
  audio and grading are structurally untouched, which is why the ladder is safe to move.
- **Furigana rides a rolling unlock+2 window — as a FLOOR.** A kanji introduced at module N is
  guaranteed furigana for modules N and N+1, even if the atom was FSRS-mastered back when it
  displayed as kana. Past the window, furigana no longer drops unconditionally (the
  pre-2026-07-17 behavior): it stays until the atom is FSRS-mastered (see the §4e addendum —
  the same window-floor-OR-unmastered rule as build tiles). "Production" (bare kanji) therefore
  begins per-learner, at unlock+2 at the earliest.
- **NO typed kanji, ever.** Kana input is always accepted. Never author a step that requires
  producing kanji.
- **NEVER romaji + kanji together.** The `containsKanji` gate in `AnnotatedText` beats all
  settings. Furigana is **not** romaji and *does* float.

### 4e addendum — furigana is window-floor OR unmastered, on tiles AND sentences (Spencer 2026-07-17)

Build-tile banks (`build_sentence` + `listening_build`) are no longer kana-only. Once a tile
word's kanji is unlocked at the lesson's module, the tile **displays the kanji form**, with kana
furigana above it until the atom reaches FSRS mastery (both modalities ≥ 21 days) — "they NEED
the exposure."

The same ruling extends to **sentence kanji surfaces** (everything `applyKanjiSurfaces`
substitutes): furigana on a kanji segment is visible when the lesson module is **inside the
kanji's unlock+2 grace window** (the floor — it shows even for atoms mastered while they still
displayed as kana) **OR the segment's atom is not yet FSRS-mastered** (the extension — past the
window, furigana stays until the learner actually knows the word, instead of dropping
permanently). Mechanically, the pass now always keeps the kana `reading` on substituted
segments and stamps `furiganaWindowOpen`; `AnnotatedText`'s kanji branch applies the
window-OR-unmastered gate per learner. The one deliberate exception: `kanji_reading` prompts
render bare **always** — the factory emits `surface === reading === kanji`, so there is
structurally nothing to float (the reading IS the answer).

Mechanics authors should know:

- **Display-only.** `tiles`, `correctOrder`, and grading stay the KANA strings — keep authoring
  build banks in kana exactly as before; the renderer swaps the painted surface
  (`resolveBuildTileKanji` in `ja/secondScript/buildTileKanji.ts` + `BuildTileSurface`).
- **Same homograph safety as sentence kanji**: only tiles that pass
  `resolveEligibleKanjiAtomId` kanji-fy; ambiguous kana (はな, に, した…) stays kana.
- **Character-granularity builds are excluded** — kana decoding drills keep their kana tiles.
- **Furigana is per-learner** (mastery-gated), so a tile may legitimately render with or
  without it. Never romaji on a kanji tile (never-mix, as everywhere).
- **Furigana is okurigana-aligned** (Spencer QA 2026-07-17): the ruby covers only the kanji
  run — 飲(の)まない, never (のまない) over the whole word (`shared/japanese/okurigana.ts`,
  used by sentence surfaces, build tiles, and match tiles alike).
- **Real inflected tiles kanji-fy too** (same QA session: のまない stayed kana while its
  distractor のむ kanji-fied — an answer leak). Engine-enumerated conjugations of
  kanji-eligible verbs/い-adjectives resolve to kanji stem + inflected tail (のまない →
  飲まない, たかかった → 高かった) under the same eligibility/unlock gates; invented forms and
  homograph collisions never resolve.

## 4f. `kanji_reading` — closing the ladder (2026-07-16)

The kanji ladder (§4e) was **display-only**: kanji appeared, but reading them was never tested.
`kanjiReading(...)` closes that. Spencer's framing: reading gets tested *in the normal course as
words are introduced* — this is not an N4-only feature.

```ts
kanjiReading(idPrefix: string, target: ReviewAtom,
  opts?: { kanji?: string; distractors?: string[] }): KanjiReadingStep
```

**Direction is strictly kanji → kana.** The learner sees a kanji word and picks its reading.
Options are always pure kana (a kanji option would make it a spelling test — the factory throws).

Authoring rules:

- **Sprinkle, don't saturate** — 2-3 per module.
- **Review-tier, never on a just-introduced word.** Reading recall belongs on a surface the
  learner has met; review-tail atoms are ideal. Same principle as §13.6 (teach steps never grade).
- **Only on kanji the ladder has cleared.** The surface resolves from `KANJI_ELIGIBLE_ATOMS`;
  if the factory throws, the word isn't eligible — choose another, don't force `opts.kanji`.
- **Never put the reading in the prompt text.** The step guarantees the tested kanji renders
  bare — `promptAnnotation` is emitted in the furigana-OFF shape (`surface === reading`), so
  `AnnotatedText` floats no `<rt>` and `applyKanjiSurfaces` refuses to re-attach one. That
  guarantee is structural, but an author can still defeat it by writing the answer into the copy.
- Distractors default to generated near-misses (valid-but-wrong on/kun 水 みず→**すい**, wrong
  okurigana stem, rendaku slips) per §13.7. Hand-authored `opts.distractors` win outright. If the
  generator can't reach 3 plausible options it throws rather than ship filler.

Shipped and in use (3 steps in m29); **already unpinned** from `UNUSED_STEP_TYPES`. (This line
previously said "pinned — unpin when shipped"; that's done.)

## 4g. Sentence-complexity floor — production targets must ramp (2026-07-16)

Example sentences must get **richer as the course progresses**, and the ramp is real through
m3–m27 (copula → adverbials → tense/aspect → embedded clauses at m23 → multi-clause cause/effect
at m26 → conditionals at m27). The failure mode this rule guards against: authoring a *new*
module's sentences as bare **object-を-verb** frames — "ともだちを てつだう" — because the drill is
isolating one new conjugation. That instinct produces m7-level sentences at m29, below the
review-tail sentences sitting next to them. m29's form-introduction pairs did exactly this and
had to be re-enriched.

**The floor (applies to production-step targets — `translateStep`, `listeningBuildSentence`,
`speaking` — from ~m20 on):** each target sentence must carry **at least one** of:
- a time / place / manner adverbial (まいにち, としょかんで, ゆっくり),
- an の-modifier or goal-に phrase (ともだちの にもつを へやに…),
- a linked or subordinate clause (て / から / ので / けど / まえに / たら).

A bare S-を-V clause is under-spec for the tier **even when it isolates a new form** — put the new
verb form at the sentence's head and build one clause of context around it. **Richer, not
longer:** lengthening a flat clause (adding an adjective) does not satisfy the floor; adding a
clause boundary or a genuine modifier does. Stay within grammar taught by that module — the point
is to reuse what the learner already owns, not to smuggle in new grammar.

`build()` targets are exempt — they're capped at ≤4 mora (§4), so richness lives in the
translate/listening/speaking steps of the same pair, which is where it belongs.

> **This is guidance, not yet a machine gate.** No test asserts sentence complexity today. It
> matters most because **the exemplar module a tier copies propagates its sentence texture** —
> m29 is the N4 exemplar, so a flat m29 would have seeded flat sentences across all of N4. When
> you author or clone a module, check the exemplar's production targets against this floor first.

## 5. The five things authors get wrong (audit + tester pattern)

### 5.1 Hardcoding the correct MCQ slot
**Don't** ship an MCQ-type step with `correctOptionId: "correct"` in position 0 unless the factory handles rotation. Authors using `cloze` / `vocabMcq` / `sentenceMcq` / `selfExplain` / `listeningCompSentence` get rotation automatically. Inline literals (e.g., the per-module `particleMc` row-test helpers) must rotate using `slotFor(id, 4)` (exported from `grammarHelpers.ts`).

Regression guard: `mcq-position-distribution.test.ts` fails if any step type's correct slot concentration exceeds 55% across the corpus.

### 5.2 Wasting `translateStep` on word-bank prompts
`translateStep` ships TYPED INPUT (free-text textarea) — the strongest retrieval tier in the codebase. Authors sometimes underuse it because Q3 resolution in the roadmap said "Path A MCQ-only." That was overridden by the actual shipping behavior. **Use `translateStep` for every sub-lesson's free-recall slot.** Don't add word-bank options.

### 5.3 Firing `selfExplain` immediately after the first cloze commit
The CLT audit found this violates Kalyuga's expertise-reversal. After only 1 retrieval, the schema is at its most fragile — `selfExplain` lands when the learner is still encoding. **Place `selfExplain` at position N-1 of the drill cluster** — after 2-3 cloze/MCQ commits, when the schema has consolidated enough to introspect on.

### 5.4 Dismiss-on-sight `selfExplain` distractors
A distractor like `"は and が mean exactly the same thing — pick either one"` takes ≤0.5s to reject, degrading the step to recognition. Per Little & Bjork 2015 + Adesope 2017, the testing-effect gain requires plausible-but-wrong distractors. **Write distractors as rule-citing-but-wrong** (e.g., `"が introduces the answer to an implied wh-question"`) — true-sounding near-rules the learner could plausibly endorse.

### 5.5 Same-answer cloze monotony
`assertNoSameAnswerCluster` catches ≥3 *adjacent* same-particle answers, but a sub-lesson with 5 cloze items all answered with `は` still pattern-matches "always pick は." Use `assertAnswerRotation(steps, minDistinct=3)` after re-author. For sub-lessons that legitimately introduce ONE new particle (intro slot), relax to `minDistinct=2` with a `TODO(wave-N): tighten` comment.

---

## 6. Compounding review (the #1 differentiator vs Duolingo)

Every M3-M7 sub-lesson appends 3-5 review-tail steps drawing from `M3_M7_REVIEW_POOL` via `pickReviewAtoms(seedId, pool, n)`. The pool is additive across modules — each module appends its atoms with `fromModule: "m{N}"` so downstream modules can draw.

Every introduced atom **must re-surface ≥3 times** across the M3-M7 corpus. Atom-coverage test enforces this. M5+ atoms get extra scrutiny because there are fewer downstream modules to compound them.

**Module-specific notes:**
- **M3** atoms (です/か, は, basic sentence vocab) should appear in M4-M7 review tails. M3 itself only has M1+M2 to draw from for its own review tail.
- **M4** atoms (の, demonstratives, objects) should appear in M5-M7. Question word `だれ` is high-value — re-surface.
- **M5** atoms (numbers, counters, ください) have the **heaviest leakage** in the original M3-M7 — counter forms and `X です` duplicates often appeared once and never again. Collapse duplicates: teach bare counters once, use them in carrier sentences without re-introducing.
- **M6** atoms (locations, に/で/が) should appear in M7 verb-of-motion sentences (every motion verb takes a location particle — natural compounding).
- **M7** atoms: this note dates from when M7 was the last authored module. The shipped spine is now **M1–M27 (N5) + M28 capstone + M29 (first N4 module)** (`curriculum/m1*.ts … m29.ts`), so M7 *does* have downstream modules — the review pool (still named `M3_M7_REVIEW_POOL` for historical reasons) is imported by m8…m27, so M7 atoms can compound forward. Still author strong internal review tails, but the "must re-surface entirely within M7" constraint no longer holds.

**Cross-module compounding rule** (in the test): atoms introduced in an early module must appear in at least one later-numbered module's review tail. (Historically framed as "M3–M5 must compound in M6/M7"; with M8–M27 shipped, the same forward-compounding rule applies across the full spine — verify against `atom-coverage.test.ts` for the current enforced check.)

---

## 7. Audio, emoji, and surface-form conventions

### Emoji
- Use `docs/n5-vocab-emoji-reference-2026-05-18.md` for canonical emoji per N5 vocab word.
- 22.5% of N5 words are **blocked** (no honest visual referent — abstract concepts, pronouns, existence verbs). For these in ja, use `listeningCompSentence`+`speaking` / `build` / a `grammarRule` card / `particle_cloze` (within its 2-module window, §4c) — **NOT `phrase_card`** (banned, §4b2). Add to `WORD_IMAGE_MCQ_BLOCKLIST` if not yet there. (es/ko may still use `phrase_card`.)
- Same emoji can legitimately appear on multiple words at different specificity (朝 / 今朝 / 毎朝 all → 🌅). Author distractor pools per-lesson; don't try to globally disambiguate.

### Audio
- TTS pipeline: Edge-TTS (Nanami + Keita) via `getTtsUrl(text, lang)` + `playJaAudio(text)`. Honors silent-mode setting on auto-play (manual taps always play).
- For non-TTS audio (alphabet drills), `getAlphabetAudioUrl(audioKey)` + `playLocalAudio(url)` (volume-controlled).
- New audio additions: pre-generate via the Python TTS pipeline; commit the manifest entry alongside the lesson.

### Surface forms
- Atoms should be **bare kana** (e.g., `ペン`, `さんにん`), not `X です`-suffixed (e.g., `ペンです`, `さんにんです`). Surface forms with `です` are duplicative atoms in the coverage audit and bloat the count. Teach the bare noun + drill the `です` form in cloze stems.
- Romaji strings (`Spencer`, `amerikajin`, `FamilyMart`) leaked into supposedly-kana fields in the original rebuild. Use katakana (`ファミマ`) or wrap in a phrase that doesn't surface the romaji as a standalone atom.

---

## 8. Speech step gotchas

- Default `stubbed: false` for all whole-word + sentence speaking (sa-row through M7 dialogue closers). `stubbed: true` only for legacy M1 vowel placeholders and single-kana drills (Whisper grades sub-second audio poorly).
- 2-fail flow: after 2 fails, learner picks "Continue (skip, no pass)" OR "Keep trying." NO auto-pass.
- Per-error helper copy: see `SpeakingStepView.tsx:helperText` — already written. Add a new error path only when a real new failure mode appears.

---

## 9. Win cards (the close)

> **STALE FOR ja as of 2026-07-16 (§4d).** Win cards were `info` steps; ja ships zero, and every
> ja lesson must now **end on a gradeable step**. Close on `reviewMatchPairs` instead — the
> close-on-confidence intent (§13.5) survives, the exposition slide does not. The identity-anchored
> framing below is still the house voice wherever copy is written (grammar_rule cards, module
> summaries), and this section stands **as-is for es and ko**, which still ship `info`.

**Don't:** "は as topic marker — unlocked."
**Do:** "You can now point at things, name them, and ask whose they are."

Identity-anchored win copy (Cialdini Unity, audit synthesis §2.6). The learner self-categorizes — "I am someone who can do X in Japanese" — which is more durable than abstract concept-unlocking.

Pair with the upcoming wave's CelebrationToast wiring (audit §2.1) — when the win-card mount fires the toast, the somatic + verbal payoff compound.

---

## 10. Constraints (the "don't")

- **Don't** author `info` steps in ja — zero ship, conformance-tested (§4d).
- **Don't** end a ja lesson on a passive teach card — it must end on a **gradeable** step (§4d).
- **Don't** call `vocab()` / `phrase()` in ja — they emit the shelved `phrase_card` (§4b2).
- **Don't** author a particle cloze more than 2 modules after that particle's introduction (§4c).
- **Don't** require typed kanji, or render romaji alongside kanji (§4e).
- **Don't** put a kanji's reading in a `kanjiReading` prompt — the step exists to test it (§4f).
- **Don't** add new step types without a written spec entry (see roadmap §5 for the design template).
- **Don't** edit M1/M2 mock data unless a specific bug requires it. They're the density-bar reference + the kana-mastery on-ramp.
- **Don't** rewrite the legacy `dialogueLesson()` factory — it's still used by older code. Add to it; don't break it.
- **Don't** ship a sub-lesson without running `tsc --noEmit` + the full vitest suite. The hard guards exist for a reason.
- **Don't** delete external lesson IDs — they're referenced from `mockCourse.ts` + tests + (soon) flashcards + (soon) FSRS. Preserve `ja-m{N}-1` through `ja-m{N}-K`.
- **Don't** introduce surface-form duplicates as atoms (see §7).

---

## 11. The fastest way to author a new sub-lesson

1. Pick a target slot (`ja-m{N}-{n}`). Read the surrounding sub-lessons to know the curriculum context.
2. Open `curriculum/m{N}.ts` near the relevant `export const M{N}_{n}` block.
3. Copy the template in §3 above; fill in the atom-introduction section with your 2-4 new atoms.
4. Pull review-tail atoms from `pickReviewAtoms(\`ja-m{N}-{n}-rev\`, PRIOR_POOL, 5)`.
5. Wire each step using factories from `grammarHelpers.ts` — never inline literals.
6. Add the import-time guards: `assertNoSameAnswerCluster(M{N}_{n}.steps)` + `assertAnswerRotation(M{N}_{n}.steps, 2)` (or 3 for drill sub-lessons).
7. Run `npx tsc --noEmit` + the four relevant vitest files (density, atom-coverage, mcq-position, ja-m3-m7-coverage). All green = ship.
8. If your atoms aren't in `M3_M7_REVIEW_POOL`, add them with `fromModule: "m{N}"` so future modules can compound.

---

## 12. Living history

| Date | Change | Doc |
|---|---|---|
| 2026-05-18 | Density target raised 14-20 → 20-22 | spec §13.1 |
| 2026-05-18 | `dialogue_listen` step type shipped | wave-4 outline §3 |
| 2026-05-18 | `assertAnswerRotation` helper shipped | this guide §2 + §5.5 |
| 2026-05-18 | `padMatchPairsToTarget` shipped (never empty grids) | this guide §4 |
| 2026-05-18 | MCQ slot rotation hardened (Murmur3 finalizer) | this guide §5.1 |
| 2026-05-18 | Speaking step: 2-fail → user choice; persistent-error skip | this guide §8 |
| 2026-05-18 | Speaking step: sa-row + M3-M7 dialogue closers un-stubbed | this guide §8 |
| 2026-05-18 | Atom-coverage hard floor: ≥3 occurrences | this guide §2 + §6 |
| 2026-05-21 | Card-type → lexical category rubric locked | this guide §13.1 |
| 2026-05-21 | Image-MCQ-as-introduction pattern (vocabMcq BEFORE bare vocab) | this guide §13.2 |
| 2026-05-21 | Just-in-time grammar teach (RULE_MO in M3-7 inline) | this guide §13.3 |
| 2026-05-21 | Forced sentence_build replacing copula-cloze | this guide §13.4 |
| 2026-05-21 | Close-on-confidence step (matchPairs after dialogue peak) | this guide §13.5 |
| 2026-05-21 | Grading = review-only (teach steps never write SRS) — mechanism updated 2026-07-01 by D2 | this guide §13.6 |
| 2026-05-21 | `excludeFromSrs` + `isSrsEligibleAtom` filter on deck builder | courseAtoms.ts |
| 2026-05-21 | Particle-tile separation in build tile banks (open work) | this guide §13.10 |
| 2026-07-12 | Listening is sentence-first from M5 (ratchet, shrink-only) | this guide §4b |
| 2026-07-12 | `phrase_card` shelved — no new ones (pinned in `UNUSED_STEP_TYPES`) | this guide §4b2 |
| 2026-07-16 | ja hits **zero** phrase_cards — `vocab()`/`phrase()` are dead factories in ja | this guide §4b2 |
| 2026-07-12 | Particle clozes legal only within 2 modules of introduction | this guide §4c |
| 2026-07-16 | **ja ships ZERO `info` steps** (842 cut, 20 → `grammar_rule`) | this guide §4d |
| 2026-07-16 | **Every ja lesson must end on a gradeable step** (no closing exposition) | this guide §4d |
| 2026-07-16 | Script ladder: romaji off m7 / kanji recognition m8 / furigana unlock+2 | this guide §4e |
| 2026-07-16 | Never romaji+kanji; no typed kanji (kana input always accepted) | this guide §4e |
| 2026-07-17 | Build tiles display unlocked kanji, furigana until FSRS mastery; grading stays kana | this guide §4e addendum |
| 2026-07-17 | Sentence furigana: unlock+2 window is a FLOOR; past it, furigana stays until FSRS mastery (kanji_reading prompts stay bare) | this guide §4e addendum |
| 2026-07-16 | `kanji_reading` step shipped — kanji→kana reading recall | this guide §4f |
| 2026-07-16 | Sentence-complexity floor: production targets must ramp from ~m20 | this guide §4g |

---

## 13. Authoring patterns retrospective — 2026-05-21 M3 rewrite

The 2026-05-21 M3 rewrite landed a set of reusable patterns that should propagate to M4-M7 authoring. These are the things that worked — file them next to the per-step factory cheat sheet (§4) when you're authoring new content.

### 13.1 Card-type → lexical category rubric (locked)

Map atom lexical category to the dominant retrieval step type. Author the FIRST graded encounter using the matching step type; downstream encounters can vary.

| Lexical category | Dominant retrieval | Why |
|---|---|---|
| Concrete noun with canonical emoji (りんご, ねこ, ほん, コーヒー) | `vocabMcq` (image MCQ) | Image is unambiguous; recognition-first; survives mixed-age audience. |
| Compound noun without single-glyph emoji (にほんじん, アメリカじん) | `listeningCompSentence` (audio→meaning) + `speaking` | Composite — no clean image cue; audio carries the load. |
| Verb (たべる, のむ, みる) | `build` (forced single-answer tile bank) | Action images are ambiguous; tile-bank production drills the form. |
| Adjective (あおい, おおきい) | `build` (forced) — ja: NOT phrase_card (§4b2); es/ko may use phrase_card exposure + `sentenceMcq` | Color emoji exist (🟦) but the kana ↔ image mapping is weaker than nouns. Production-direction build is the safer choice. |
| Pronoun (わたし, あなた, これ/それ/あれ, なん) | `build` (forced) — never image_mcq | Rubric block: `WORD_IMAGE_MCQ_BLOCKLIST` in `grammarHelpers.ts`. Demonstrative-image cues are deeply context-dependent. |
| Function-phrase / greeting (すみません, こんにちは, おねがいします) | ja: `listeningCompSentence` + `speaking` (NOT phrase_card, §4b2); es/ko: `phrase_card` + `listeningCompSentence` | No image; oral function carries the meaning. |
| Particle (は, か, を, に, で, も) | `particle_cloze` | Form-focused practice in carrier sentences. Don't drill in a `particle_cloze` slot if the answer would be `です` — see §13.4. |
| Kanji-word — reading recall (M8+, once the atom's furigana window has closed) | `kanjiReading(...)` — **shipped 2026-07-16**, see §4f | Tests kanji→kana reading. Review-tier: only on a word the learner has already met. |
| Kanji-word — spelling recall (when productive) | `audio_spelling_mcq` (factory still to be built) on top of recognition | Tests sound→kanji-spelling — the **inverse** of `kanjiReading`, and a different step. Spelling-MCQ assumes sound↔meaning already bound. Not built; do not conflate the two. |

**Image-MCQ ceiling rule:** "bad image is worse than no image." If the kana ↔ image mapping is ambiguous (>1 valid interpretation), fall back to `listeningCompSentence` or `sentenceMcq`. Don't force image_mcq when the emoji doesn't disambiguate the meaning.

### 13.2 Image-MCQ-as-introduction pattern

For concrete-noun atoms, lead with `vocabMcq` BEFORE the bare `vocab` card. The image IS the introduction.

```ts
// PATTERN (M3-3 ねこ at curriculum/m3-v2.ts:525):
vocabMcq(
  "ja-m{N}-{n}-mcq-{atom}",
  { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m{N}" },
  POOL_M{N-1}_OR_M{N-2},
),
speaking("ja-m{N}-{n}-speak-{atom}", "ねこ", "Cat"),
// NO bare vocab card — the MCQ + speaking pair is the intro.
```

When this pattern is right:
- Atom has a clean emoji asset (cross-ref `docs/n5-vocab-emoji-reference-2026-05-18.md`).
- Atom hasn't been seen in the curriculum yet (this IS the formal teach).
- Distractor pool has 4+ atoms with emojis the learner can read.

When NOT to use it (keep the traditional `vocab → vocabMcq` pair):
- The atom has cultural context worth surfacing (e.g., コーヒー with the "ー is a long vowel mark" note).
- The atom is in a "people-words batch" where the vocab card carries shared explanation across multiple atoms.

### 13.3 Just-in-time grammar teach (don't pre-load particles in earlier modules)

When a new particle / grammar piece is needed in lesson X, formally teach it in lesson X — not in a future lesson. Then M(X+1)+ can weave it into example sentences without re-teaching.

Concrete: `RULE_MO` in M3-7 (`curriculum/m3-v2.ts:1331`). Pattern:

1. Lesson opens with warm-up and cumulative review on already-taught content.
2. Right before the construct is needed (the dialogue, the production block), ship `grammarRule({...})` with one `antiPattern` showing the broken form.
3. ONE contextual exposure (`phrase_card` showing the construct in use, no retrieval pressure).
4. The construct is used naturally in the next step (dialogue, sentence-build, etc.) — first real retrieval happens here.
5. ONE retrieval beat AFTER the use (`sentenceMcq` discriminating the new construct vs near-misses).
6. M(X+1)+ uses the construct in sentence examples without ever re-teaching it.

This is the "teach once, build subtly" cadence Spencer locked in. **Anti-pattern:** introducing a particle as a quiz answer in lesson X when it's never been formally taught. Forward-leak = test-before-teach.

### 13.4 Forced sentence_build replacing copula-cloze

Don't drill `です` (or any copula / sentence-ender that isn't grammatically a particle) in a `particle_cloze` slot. Doing so teaches the learner "です is one of the particles I pick" — Roediger & Marsh 2005 negative testing.

**Bad** (what the 2026-05-21 rewrite removed):
```ts
cloze(
  "...",
  "あれは いぬ", "。",
  "です",                            // <-- です as a "particle option"
  ["です", "は", "か", "の"],          // <-- mixed pool
  ...
),
```

**Good** (replace with forced sentence_build on the same target):
```ts
build(
  "...",
  "Build: 'That over there is a dog.'",
  "あれは いぬです",
  ["あれは", "いぬです", "これは", "ねこです"],
  ["あれは", "いぬです"],
),
```

Same target sentence, same retrieval beat, production direction, no negative-testing risk.

### 13.5 Close on confidence

The last cognitive step of a sub-lesson should be a step the learner is **likely to get right**, not the hardest production. The high-energy peak (dialogue, hard production) belongs in the middle of the lesson's second half; the close is recognition-easy.

Recommended closing tail order:
1. Peak: `dialogue_listen` / hardest `build` / `speaking` on a long target.
2. One short retrieval beat on the peak's atoms.
3. **`reviewMatchPairs` as the closer** — 4-6 pairs, recognition-easy, almost-always-right.
4. ~~`infoStep` (win variant)~~ — **dropped for ja 2026-07-16 (§4d).** `info` is banned and
   lessons must end gradeable, so `reviewMatchPairs` at step 3 **is** the close. This is
   arguably the better shape anyway: the learner's last act is a win they *earned*, not a slide
   telling them they won. es/ko still append the info win card.

The rewrite's M3-7 follows this exactly (`curriculum/m3-v2.ts:1477` dialogue → `:1539` mcq retrieval → `:1554` speaking → `:1561` matchPairs → `:1564` info-end).

### 13.6 Grading = review-only (the flip-side invariant)

> **2026-07-01 update (D2 shipped, vocab-only):** the ENFORCEMENT moved from
> lesson-scoped ("only ja-mN-review-1/2 write SRS") to atom-scoped: content
> sub-lesson steps now DO write Track A, but only for atoms whose
> `fromModule` is strictly earlier than the lesson's module and that aren't
> introduced by the lesson itself (`lesson/data/reviewTailSrs.ts`,
> `shouldWriteContentReviewAtom`). The invariant below — teach steps never
> grade, no same-day grading of just-introduced words — is unchanged; it is
> exactly what the new gate enforces. Track B grammar remains
> review-lesson-only.

Teach steps never write to SRS. The rule:

- An atom's first appearance in the curriculum is a **teach** step. Ungraded.
- An atom acquires SRS state the first time it appears in a step where `step.exercisedAtoms` resolves to a card that ALREADY has SRS state from a prior session — at which point it's a **review** step.
- A "review pool" must only sample from atoms that have been graded before. Drawing a never-taught atom into a review beat = test-before-teach.

Two practical consequences:
- Phase 4 of the vocab-SRS-unification plan (CLAUDE.md §"Vocab SRS unification") wires `gradeFromLesson` into LessonPage with this rule.
- The `exercisedAtoms` tagging phase (CLAUDE.md §2) determines which atom IDs each step writes to. Teach steps either don't tag, or tag with `gradeAsReview: false`.

### 13.7 Distractor plausibility

The 2026-05-21 audit found "MCQ ordering is off" was actually about **distractor quality**, not slot position (slot rotation is healthy via the Murmur3 finalizer). Fix-pattern:

| Distractor type | OK? |
|---|---|
| Semantically plausible near-miss (`せんせいですか` vs `せんせいの ですか` — different particle, different meaning) | ✅ |
| Same lexical category, different lexeme (`コーヒーです` vs `タクシーです`) | ✅ |
| Wrong sentence type (statement vs question) | ✅ — tests sentence-type discrimination |
| Word-order-impossible bait (`ですか せんせい`) | ❌ — solved by elimination |
| Random filler (`タクシーの コーヒー` for "It's a taxi") | ❌ — solved by elimination |

**Audio-MCQ rule:** distractors should share initial mora with the correct answer. If they don't, the test is reading-the-emoji-label not hearing-the-audio.

### 13.8 Atom registry discipline

Every atom used in lesson content must have its `introducedByLessonId` set in `src/features/languages/ja/courseAtoms.ts` pointing to its FIRST formal teach lesson. Two failure modes to avoid:

1. **Forward-leak**: atom is `fromModule: "m4"` (or no `introducedByLessonId`) but is used in M3 carrier sentences without formal teach. → Either backfill (atom moves to M3) or scrub from M3 (defer use to M4).
2. **Drift**: lesson code formally teaches an atom (adds a `grammar_rule` or `vocab` card) but the registry still tags it under the old module. → Always update both: lesson code + atom registry.

When you change a lesson to add a formal teach for a previously-forward-leaked atom, also:
- Update `fromModule` to the new module.
- Add `introducedByLessonId: "ja-m{N}-{n}"` pointing at the formal teach.
- Add a `note:` documenting the move so future auditors don't think it's an error.

**Two-stage attribution (kana introduced in one module, vocab introduced in another):** When an atom's kana shape is taught in module N but the word as a vocab unit lands in module M (M > N), set `fromModule: "m{N}"` AND `introducedByLessonId: "ja-m{M}-{n}"`. Example: `inu` (`いぬ`) and `neko` (`ねこ`) in `courseAtoms.ts:82-83` carry `fromModule: "m1"` (where the kana shapes ship) but `introducedByLessonId: "ja-m3-3"` (where they become drillable vocab). The compounding-review pool keys off `fromModule`; the curriculum-coverage tests key off `introducedByLessonId`. Both fields are load-bearing.

### 13.9 SRS pool filter (`isSrsEligibleAtom`)

`buildJaCourseDeck()` in `courseAtoms.ts` filters via `isSrsEligibleAtom`. Rules:

- `excludeFromSrs: true` → excluded (explicit opt-out for alphabet-trainer atoms).
- `kind: "particle"` → included (particles are single-kana but grammatically essential).
- Length-1 kana + no emoji + not a particle → excluded (alphabet-trainer territory).
- Everything else → included.

When adding a new atom: if it's a single-kana standalone word (like a numeral kana on its own), set `emoji` so the pool keeps it (the emoji disambiguates the meaning).

### 13.10 Particle-tile separation in build tile banks (shipped 2026-05-21)

In `build()` and `listeningBuildSentence()` tile banks, particles are separated from their host nouns. Pre-attached particles gave the answer away — the learner just picked the right chunk instead of choosing the particle.

**The pattern (across all M3-M7 build sites):**
```ts
// Particles as their own tiles — the learner must choose は and です:
tiles: ["わたし", "は", "にほんじん", "です", "がくせい"]
correctOrder: ["わたし", "は", "にほんじん", "です"]
```

**Particles that get their own tile:** は, が, を, に, で, の, から, か, です. (Yes — です gets separated as its own tile. It's a copula but for production-direction tile assembly, it's treated like a particle so the learner picks it.)

**Kept attached:** ます-form verbs (います, あります, いきます, たべます, のみます), ください, adjective stems (おおきい, あおい — adjective conjugation isn't formally taught until M8+, so the bare adjective form ships as a single tile).

The renderer's `JSON.stringify(placed) === JSON.stringify(step.correctOrder)` comparison handles either shape; display join works via the `granularity === "word"` space separator.

**Shipped scope (2026-05-21 sweep):** 45 `build()` calls + 13 `listeningBuildSentence()` calls + 4 row-test build payloads across M3-M7. Two builds intentionally ship with 7-token answers (`ja-m4-6-translate-s2` "Is that your bag?" and `ja-m4-6-s5` "Which is your dictionary?") — both are M4-6 production-cluster cards where the は + の + か compound is the entire pedagogical target.

### 13.11 Single-kana atoms live in the alphabet trainer, not the SRS deck

Single-kana atoms (え, き, つ as standalone "words") belong in the alphabet trainer on the Practice page — not in the cumulative vocab review queue. The SRS deck filter handles this automatically (§13.9). The implication for lesson authors:

- Don't add a single-kana atom to `M3_M7_REVIEW_POOL`. The compounding-review tail only draws multi-kana atoms.
- If you NEED a single-kana atom in a lesson (e.g., a hiragana spotlight in M2), keep it scoped to that lesson — don't tag it for cross-module re-exposure.
- Numerals like に (two) / ご (five) are special — they're single-kana but the emoji (2️⃣ / 5️⃣) disambiguates the meaning, so they stay in the deck.

### 13.12 The cloze rotation gold standard (M3-5)

Perfect rotation of particle answers across a cloze block. Pattern from M3-5 (`curriculum/m3-v2.ts:947-1067`):

- 6 clozes, answers alternate `は / か / は / か / は / か` — no two adjacent same.
- Each cloze surface position (beginning, middle, end of sentence) varies so the learner can't pattern-match on slot.
- Non-cloze interleavers (sentenceMcq, listeningBuild, speaking) break adjacency.

This is the shape any future drill-only sub-lesson should target. `assertAnswerRotation(steps, 3)` is the gate when the block introduces 3 distinct particles; `(steps, 2)` is the gate for 2-particle blocks. **Keep the gate matched to the actual block content** — drift between docstring promise and shipped gate (M3-4 ships 2 but docstring promises 3 as of this writing) is a known anti-pattern.

### 13.13 Canonical M8+ sub-lesson template (locked 2026-05-23)

Per the 2026-05-23 re-audit (`docs/curriculum-audit-vs-research-2026-05-21.md` + the M3-M7 template-consistency audit), M3-M7 converged on a recognizable 8-sub-lesson shape with documented divergences. Spencer's call: **lock this as the canonical template for M8+**. Variants distinguished by grammar-concept count.

#### 8-sub-lesson template (2 grammar concepts — matches M3 / M4 / M7)

| Pos | Role | Step factories |
|---|---|---|
| L1 | Vocab intro (≥5 new atoms) | ja: `vocabMcq` × 5–8 as the introduction (§13.2), `listeningComp`, `speaking`, `matchPairs` (review tail). **Not `vocab` × 5–8** — that authors banned phrase_cards (§4b2). |
| L2 | Grammar rule A + drill | `grammarRule` + `cloze` × 4–5 (rotating answers ≥2 distinct) + `sentenceMcq` × 1–2 + `listeningComp` + `selfExplain` at N-1 + 1 `build`/`speaking` + review tail |
| L3 | More vocab in context | `vocab` × 5 inside L2 carriers + `vocabMcq`/`listeningComp` interleave + 2–3 `cloze` on new vocab + 1 `build` + review tail |
| L4 | Grammar rule B + drill | Same shape as L2 |
| L5 | Interleaved drill (L2+L4) | 6 `cloze` rotating ≥2 distinct particles + `sentenceMcq` + `listeningComp` + `selfExplain` at N-1 + 1 `build` + review tail |
| L6 | Production | 4–6 `build` + 2–3 `speaking` + 1 `listeningBuild` + 1–2 `sentenceMcq` + 1 `selfExplain` (optional) + review tail |
| L7 | Comprehension closer | **EITHER** `dialogueListen` (2-speaker exchange, 2–4 lines + 1–3 questions) **OR** `storyComprehension` (single-voice narrative 1–8 lines + 1–3 questions + chained `build_sentence` response). Warmup vocab recap before; cumulative review tail after. |
| L8 | Row test ★ | Auto-built via `buildRowTest` |

#### 9-sub-lesson variant (3 grammar concepts — matches M6)

Insert an extra `RuleC + drill` at position 4 and an extra interleave at position 6. Closer slides to L8, row test to L9.

#### When to choose dialogueListen vs storyComprehension for L7

- **dialogueListen** — fits modules where the natural setting is a transactional exchange (café, directions, introductions). 2 speakers, 3-4 turns, comprehension MCQs only.
- **storyComprehension** — fits modules where the natural setting is a narrative (recounting a day, reading a short story, hearing a monologue). Single voice OR multi-voice without alternation, 1-8 lines, comprehension MCQs PLUS a chained `build_sentence` response (the learner answers what they'd say in reply).

Mix freely across the course. Both write SRS the same way (recognition modality on comprehension, production on the response build).

#### Tagging atoms for FSRS grading (Spencer's invariant)

Every graded step factory in `grammarHelpers.ts` accepts an `exercisedAtomKanas?: string[]` argument (or auto-resolves from `target.kana` for atom-keyed factories). When set, the step's `exercisedAtoms` populates and `LessonPage.handleStepComplete` advances FSRS state for those atoms. **Teach steps** (`phrase_card`, `info`, `grammar_rule`, `symbol_intro`, `teach`) NEVER write SRS — the `shouldWriteSrs(step)` gate in `_stepPredicates.ts` blocks them even if they accidentally carry `exercisedAtoms`. Sentence-level factories (`build`, `speaking`, `listeningBuildSentence`, `listeningCompSentence`, `sentenceMcq`, `translateStep`) require the author to pass the kana list. Atom-keyed factories (`vocabMcq`, `audioImageMcq`, `audioMeaningMcq`, `translationMcq`, `reviewMatchPairs`, `dialogueListen` via the `exercisedAtomKanas` option, `cloze` from `correctParticle`) auto-tag.

---

---

## 14. Story comprehension lessons

Story comprehension lessons are standalone, mid-module lessons that give the learner a longer listening experience — a short dialogue between two characters — broken into chunks with interleaved comprehension checks and production practice. They use **only vocabulary and grammar already introduced** earlier in the module (no new atoms).

### 14.1 Purpose

- Contextual review of grammar and vocab in a realistic conversation
- Longer-form listening (vs. the single-sentence drills in regular sub-lessons)
- Active engagement throughout — the learner answers questions and builds sentences between chunks
- A "reward" lesson that learners can look forward to mid-module

### 14.2 Placement

One per module, placed **mid-module** after the main grammar drills but before production-heavy and dialogue-closer lessons:

| Module | Placement | ID pattern |
|--------|-----------|------------|
| M3 | After M3-7-2 (end of module, before mastery test) | `ja-m3-9` |
| M4 | After M4-5-2 (after interleaved drills) | `ja-m4-story` |
| M5 | After M5-5-2 (after money talk) | `ja-m5-story` |
| M6 | After M6-6-2 (after 3-particle interleave) | `ja-m6-story` |
| M7 | After M7-6-2 (after compound sentences) | `ja-m7-story` |

### 14.3 Constraints

- **Only previously-learned material.** No new vocab, no new grammar. Every word in the story must have been introduced in an earlier lesson within this module or a prior module.
- **Formal/polite language only.** All sentences use です/ます forms.
- **Practical scenarios.** Meeting someone, ordering food, asking about daily life — not abstract grammar exercises.
- **Distinct from the module's dialogue_listen closer.** Each module already has a dialogue closer at lesson 7-8. The story lesson should use a different scenario.
- **No review tail.** Story lessons are pure comprehension/production — no `pickReviewAtoms` tail.

### 14.4 Template (12 steps)

> **ja: the info bookends are STALE (§4d)** — omit steps 1 and 12 and let step 11's `speaking`
> close it (gradeable ✓). Set the scene in the first `dialogue_listen`'s own framing instead.
> Stands whole for es/ko.

```
Story lesson — <scenario name> (target: 12 steps, ~5 min)

  1.  [info: open]           ja: OMIT (§4d). es/ko: set the scene. Name the characters,
                             describe the situation. One sentence.

  ── Scene 1 (3-4 dialogue lines, 2 MCQs) ──
  2.  dialogue_listen         First chunk of the conversation. 2 comprehension
                             MCQs. Transcript reveals after first answer.

  3.  build_sentence          Practice a key pattern from scene 1.
                             Must be a sentence heard in the dialogue.

  4.  sentenceMcq             Comprehension check — "How did X introduce
                             herself?" or "Which sentence means Y?"

  ── Scene 2 (3-4 dialogue lines, 2 MCQs) ──
  5.  dialogue_listen         Second chunk. Builds on scene 1 (same characters,
                             conversation continues). 2 MCQs.

  6.  particle_cloze          Grammar drill anchored in story context.
                             Use a sentence from the dialogue.

  7.  build_sentence          Practice another key pattern from scene 2.
      OR listening_build      Swap in listening_build for variety — learner
                             hears a story line and assembles it from tiles.

  ── Retrieval + production ──
  8.  listening_build         Hear a line from the story, build it from tiles.
      OR listening_comp       Pick the meaning of a replayed line.

  9.  speaking                Say a key line from the story aloud.

  10. sentenceMcq             Overall comprehension — "What do both characters
                             have in common?" or "Which particle does X?"

  11. speaking                Say another key line aloud.

  12. [info: win]             ja: OMIT (§4d) — step 11 closes it. es/ko: celebrate. Reference
                             what the learner just did in context ("You followed a real
                             conversation about X"). Tease the next lesson.
```

### 14.5 Step variety

Vary which step types appear in slots 7-8 across modules so the stories don't all feel identical:

| Slot | Options | Notes |
|------|---------|-------|
| 7 | `build_sentence`, `listeningBuildSentence` | Alternate between modules |
| 8 | `listeningBuildSentence`, `listeningCompSentence` | Alternate between modules |

Additional step types that work well in stories (for future longer stories):
- **`fill_blank`** — fill in a missing word from a story line
- **`selfExplain`** — after a tricky grammar point, ask "why was も used here?"
- **`listeningBuildSentence`** — hear a story line, assemble it (tests precise listening)

### 14.6 Dialogue authoring rules

- **3-4 lines per scene**, 2 scenes per story. Total: 6-8 dialogue lines.
- **2 MCQs per scene.** Exactly 3 distractors per question.
- **Speaker labels** are character names (ゆき, たけし, Staff), not "Speaker A."
- **Reuse the same characters** across the module's story and its dialogue closer if possible — builds familiarity.
- Use `transcriptRevealAfter: "first-answer"` (the default) so the learner can re-read after engaging.

### 14.7 Assertions

Story lessons must pass the same assertions as regular sub-lessons:

```typescript
assertNoConsecutiveSame(STORY.steps);
assertPassiveCardsHaveFollowup(STORY.steps);
assertNoExplanationOnPassive(STORY.steps);
assertExplanationDoesntLeakAnswer(STORY.steps);
```

They are **excluded** from `assertNoSameAnswerCluster` and `assertAnswerRotation` (which apply to cloze-heavy sub-lessons, not story flows).

### 14.8 Export and registration

```typescript
// In curriculum/mN.ts:
export const MN_STORY: LessonContent = { id: "ja-mN-story", moduleId: "mN", ... };

// In mockLessons.ts — import + register:
import { ..., MN_STORY } from "./mN";
// In LESSONS record:
"ja-mN-story": MN_STORY,
```

Add the story to the module's bottom-of-file assertion loop alongside the other lessons.

### 14.9 Future: longer stories (M8+)

The current 12-step / 2-scene template suits M3-M7 where grammar is still simple. For M8+ modules with richer grammar, stories can expand to:

- 3 scenes (3 `dialogue_listen` chunks)
- 16-18 steps total
- `build_sentence` responses where the learner "replies" to the story characters
- The existing `storyComprehension()` factory in `grammarHelpers.ts` composes `[dialogueListen(narrative), build_sentence]` — use it for narrative-format (non-dialogue) stories where speaker labels are suppressed.

---

*This guide is the condensed output of the M3-M7 rebuild waves (per `docs/n5-content-spec-2026-05-25.md` Q8 resolution) plus the 2026-05-21 M3 rewrite retrospective and the 2026-05-23 SRS modality / canonical template lock. Refine as new findings land.*

*Updated 2026-07-16 for the script-ladder wave (§4d info purge + ends-gradeable, §4e the romaji/kanji/furigana ladder, §4f the `kanjiReading` step) and the phrase_card zero-out (§4b2). Those changes stranded several older sections — §3, §9, §13.5, §13.13 L1 and §14.4 describe the pre-purge shape and are marked stale inline rather than deleted, because **es and ko still ship `info` and `phrase_card`** and those sections remain correct for them. The next author to touch this guide should consider splitting it into a shared core + per-language annexes; the ja/es/ko rules have diverged far enough that inline "ja: OMIT" markers are near their limit.*
