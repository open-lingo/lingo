# SRS / flashcard-deck / match-backfill unification — implementation plan

Status: PLAN (research complete; awaiting structural decisions before Ralph dispatch).
Author: Claude (Fable 5) + Spencer, 2026-06-13.

Two asks that turned out to be one change:
1. Match-pairs floor of 6 with occurrence/FSRS-weighted backfill (hits every review).
2. Flashcards don't populate — the course deck is a 5-card stub disconnected from the curriculum.

Both need the same foundation: **a real card model derived from `JA_COURSE_ATOMS`.**

---

## What we verified (research)

### Our architecture (code-explorer agent)
- **Two disconnected SRS systems:**
  - *Real:* curriculum **atoms** (`JA_COURSE_ATOMS`, ~250 atoms; ids `ja:biiru`). `unlockLessonAtoms` → `lingo:unlocked-atoms`; `buildSrsReviewLesson` reads/writes FSRS state keyed on atom ids; SRS store (`open-lingo-srs:v2`) keys on atom ids.
  - *Stub:* flashcard deck `ja-beginner.json` (5 cards `ja-1..5`) + `LESSON_TO_CARDS` (3 stale keys `m1-l0/l1/l2` that match NO real lesson id) → real learners unlock 0 cards. The flashcard-surface queue actually reads from the **backend** `deckResponses`, not even these JSONs.
- **Atom shape** (`courseAtoms.ts`): `{ id, kana, kanji?, romaji, meaningEn, emoji?, fromModule, introducedByLessonId?, kind, blocked?, excludeFromSrs?, note? }`. No example sentences / sentence audio / pitch today.
- **FSRS engine** (`engine/srs.ts`): `gradeFromLesson`, `reviewCard`, `isDue`, `getDueModalities`, stability/difficulty, recognition/production split. Target retention 0.95.
- **13 match_pairs construction sites** (full list below). Blast radius for floor-of-6.
- **Central post-pass point:** `getMockLessonContent` (`mockLessons.ts:807`) — but the `buildSrsReviewLesson` branch returns WITHOUT the existing post-passes, so a match-pad must cover both branches.

### Anki (research agent)
- `.apkg` = zip(SQLite `collection.anki21` + numbered media + `media` JSON manifest).
- Note types carry **templates**; recognition + production = **2 templates on one note**, distinguished on disk by `cards.ord`. Round-trip identity = `notes.guid` (derive deterministically from atom id).
- **FSRS state lives in `cards.data` JSON**, legacy SM-2 columns persist alongside. FSRS-6 = 21 params, default retention 0.9 (we use 0.95).
- **Kaishi 1.5k** (community gold standard) field model: Word, Reading, Word Furigana, Meaning, Sentence, Sentence Furigana, Sentence Meaning, **separate Word Audio + Sentence Audio**, Pitch Accent, Image, Notes. Recognition-dominant; target word highlighted in sentence; furigana stored as ruby + plain-kana opt-out.
- **Tango invariant:** a sentence only uses already-introduced vocab — matches our existing intro-before-use conformance.

---

## The 13 match_pairs sites (floor-of-6 blast radius)

| Site | File:line | Shape | Pairs today | Action |
|---|---|---|---|---|
| `vowelMatchPairs` | m1-l1.ts:274 | kana→romaji | 5 | pad to 6 (prior kana) |
| `matchKanaToRomaji` g/z/d/b/p rows | m2-*.ts (×10) | kana→romaji | 5 | pad to 6 (prior kana) |
| `matchKanaToRomaji` yoon rows | m2-yoon-*.ts (×8) | kana→romaji | **3** | pad to 6 (prior kana) — hard case |
| `reviewMatchPairs` M3 | m3-v2.ts (×14) | word→meaning | 4–5 | pad to 6 (FSRS/freq) |
| `reviewMatchPairs` M4–M7 | m4–m7.ts | word→meaning | 4–6 | pad where <6 |
| `reviewMatchPairs` M8–M27 | m8–m27.ts | word→meaning | 6 | OK |
| `reviewMatchPairs` in SRS review | buildSrsReviewLesson.ts:221 | word→meaning | ≤5 | pad to 6 (FSRS) |
| `buildMatchStep` (auto-builder) | lessonBuilder.ts:664 | kana→meaning | 4–6 | pad to 6 |
| `buildSubLessonMatchStep` | lessonBuilder.ts:850 | kana→meaning | 2–6 | pad to 6 |
| `buildRecapMatchItem` | buildRecapLesson.ts:109 | kana→meaning | 4–6 | pad to 6 |
| Row-test match | lessonBuilder.ts:1131 | kana→meaning | varies | pad to 6 |
| `buildModuleReview` dialogue | buildModuleReview.ts:244 | word→meaning | 4–6 | pad to 6 |
| Korean `matchBlockToSound` | _hangulRowHelpers.ts:304 | block→romaji | varies | out of scope (JA only now) |
| (exempt) m5 number grids, m7 conjugation | — | bespoke | 2–5 | EXEMPT (closed sets) |

**Approach:** one central pad pass (not 13 edits) in `getMockLessonContent`, covering both the static and `buildSrsReviewLesson` branches. Per grid:
- **kana→romaji / kana→meaning grids:** backfill from already-LEARNED kana/words of PRIOR rows (plenty by m2), confusable-biased (existing helper). Solves the yoon 3→6 case.
- **word→meaning grids:** backfill from prior unlocked atoms, weighted by FSRS weakness (low stability / overdue / high difficulty, read-only from the atom-keyed store) → falls back to corpus frequency / any-prior when the store is sparse (new learner, tests/SSR).
- **Exempt:** the 5 number/conjugation grids (closed sets); Korean (separate language).
- Deterministic by step-id seed on the fallback path; FSRS path is intentionally adaptive.
- **Read-only SRS in content lessons** (never `setCardState`) — honors "SRS writes only in review lessons."

Conformance guard: `matchPairsPairCount.test.ts` — every non-exempt `match_pairs` has ≥6 pairs (enumerate via `getMockCourse` like `symbolToSoundIntegrity.test.ts`).

---

## The deck unification (why flashcards don't populate)

> **ALREADY EXISTS (discovered iter 1):** `courseAtoms.ts` already has `buildJaCourseDeck({unlockedIds?})`, `courseAtomToFlashcard(atom)`, and `isSrsEligibleAtom(atom)`. They generate a deck (`id: "ja-course"`) from `JA_COURSE_ATOMS` with card ids = **bare** atom id (`biiru`, which canonicalizes to `ja:biiru`). So Phase 2 is NOT build-from-scratch — it is: (a) WIRE `buildJaCourseDeck` into the flashcard surface (`loadDeck`/`getDeckForPractice`/the queue) with unlock from `lingo:unlocked-atoms`; (b) ENRICH `courseAtomToFlashcard` with a mined example sentence + the fuller Kaishi field set + recognition/production template metadata + guid; (c) DELETE the stub (`ja-beginner.json` course wiring + `LESSON_TO_CARDS`); (d) add the conformance tests. Reuse the existing functions; don't duplicate.

**Make `JA_COURSE_ATOMS` the card source.** Each SRS-eligible atom → a card whose id IS the canonical atom id (`ja:biiru`). This:
- unifies the id scheme (deck ↔ SRS store ↔ review lessons all share `ja:X`);
- unlocks via the existing `lingo:unlocked-atoms` store (delete the stale `LESSON_TO_CARDS` + `ja-beginner.json`);
- makes the flashcard surface populate with real curriculum vocab, FSRS-scheduled, as lessons complete;
- gives the match-backfill the same pool it draws from.

### Card/note schema (Anki/Kaishi-aligned, MVP-filled)
Define the full field set so it's enrichable + .apkg-round-trippable later, but populate only what atoms have today:
| Field | MVP source | Later |
|---|---|---|
| atomId (→ guid) | `atom.id` | |
| Word | `atom.kanji ?? atom.kana` | |
| Reading | `atom.kana` / `atom.romaji` | |
| WordFurigana | — | ruby form |
| Meaning | `atom.meaningEn` | |
| Image | `atom.emoji` → notoEmojiUrl | custom art |
| WordAudio | `getTtsUrl(atom.kana)` | native VA |
| Sentence / SentenceMeaning / SentenceAudio | — | authored later |
| PitchAccent / Notes | `atom.note` | pitch data |
Two card templates (recognition ord 0, production ord 1) — recognition shipped first, production gated.

---

## Recommended phasing

- **Phase 1 — match-pairs floor of 6** (self-contained, test-verifiable). Central pad pass + FSRS/freq backfill + kana cross-row backfill + conformance test. Lowest risk, fixes the elimination hole, no surface changes.
- **Phase 2 — course deck from atoms.** `buildCourseDeck`, unify ids, wire the flashcard surface to it, delete the stub + stale map, conformance test (deck cards == SRS-eligible atoms; unlocked subset == unlock store). Makes flashcards real.
- **Phase 3 — Anki `.apkg` (LATER, not this Ralph).** Schema is designed round-trippable now; actual import/export needs the media-storage decision (no S3 pipeline yet — see flashcards-anki-scoping doc) + backend work. Defer.

---

## DONE (2026-06-13) — both phases complete; tsc clean; 1019 tests green

**Phase 1 — match-pairs floor of 6**
- `src/features/lesson/data/matchPairsFloor.ts` (NEW) — central, shape-aware pad pass: kana→romaji backfills from prior-introduced kana (confusable-biased, solves yōon 3→6); word→meaning backfills from prior atoms FSRS-weighted (read-only) → rarity → seeded fallback; dedupes sources; "other" grids (numbers/conjugation/Korean) exempt by shape.
- `src/features/lesson/data/mockLessons.ts` — wired the pad into BOTH branches of `getMockLessonContent` (+ memoized curriculum-wide context).
- `src/features/lesson/data/matchPairsPairCount.test.ts` (NEW) — floor + no-dupe conformance (one documented natural exception: first vowel lesson = 5 kana exist).
- Surfaced + fixed a pre-existing authoring bug: `ja-m8-1-1` review grid had すし twice.

**Phase 2 — course deck from atoms**
- `src/features/languages/ja/courseAtoms.ts` — `canonicalAtomId`; `courseAtomToFlashcard` now emits canonical (`ja:`) ids + accepts image/example; `buildJaCourseDeck` takes `examplesByCardId`/`imagesByCardId` and checks unlock by canonical id.
- `src/features/flashcards/data/courseDeck.ts` (NEW) — `buildEnrichedJaCourseDeck`: mines the shortest example sentence per atom from existing lessons, attaches emoji images, marks unlock from `lingo:unlocked-atoms`.
- `src/features/flashcards/useFlashcardDueSummary.ts` — injects the unlocked course-deck cards into the queue + `courseDecks` (the wiring that makes flashcards actually populate).
- `src/features/flashcards/data/ankiNoteSchema.ts` (NEW) — Kaishi-aligned note type, recognition(ord0)/production(ord1) templates, deterministic `atomNoteGuid`, `courseAtomToAnkiNote`. SCHEMA-ONLY (no `.apkg` I/O — deferred, media hosting unresolved).
- `src/features/flashcards/data/loadDeck.ts` — slimmed to the live exports (`getParticlesForLanguage`, `getDeckImageUrl`).
- DELETED stub: `src/features/flashcards/data/ja-beginner.json`, `src/features/flashcards/data/lessonCardMap.ts`.
- Tests (NEW): `courseDeck.test.ts` (cards↔atoms 1:1, canonical ids, unlock honored, mined sentences contain the word), `ankiNoteSchema.test.ts`.

NOT done (intentionally deferred): `.apkg` import/export I/O (needs media hosting + Trevor/backend); production-template gating; richer card content (pitch, sentence audio).

## Locked decisions (Spencer, 2026-06-13)
1. **Ralph scope: Phase 1 + 2 together.**
2. **Card model: MVP from atoms + sentence MINING from existing lessons.** Don't author new sentences. For each atom, scan existing lesson steps (`build_sentence.targetSentence`, `listening_comprehension.transcript`, listening_build targets, dialogue) for a sentence that USES the atom's word, prefer the shortest/earliest that uses only already-introduced vocab (Tango invariant), and attach it as the card's example sentence (+ its meaning/audio if available). No sentence found → card ships vocab-only. Full Kaishi schema still reserved for later enrichment.
3. **Deck source: client-generated from atoms** (`buildCourseDeck`). Cheapest at scale — zero marginal hosting/compute; it's static curriculum content already shipped in the JS bundle, computed once + cacheable. Backend stays for community/user decks + SRS sync only.
4. **`.apkg`: defer, schema-ready only.** Card/note schema is `guid`-from-atom-id, recognition/production template ords, FSRS-in-`data` shaped — round-trippable — but no import/export I/O this run (media-storage decision unresolved; see flashcards-anki-scoping doc).
5. **kana/yoon grids: cross-row backfill to 6** (my call) — pull already-learned kana from prior rows, confusable-biased. Solves the yoon 3→6 case.

Execution: handed to a Ralph loop against this spec. NOT in Ralph scope: the already-done romaji-fade (#1) + audio-MCQ-blank (#3) work from earlier this session — leave those untouched.
