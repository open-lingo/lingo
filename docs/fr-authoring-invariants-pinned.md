# PINNED authoring invariants (fr) — paste VERBATIM into every FR dispatch

**Status:** ACTIVE — m1 authored (frameless IR), all gates green at zero,
audio staged; fr still NOT selectable (voice unauditioned) · **Created:**
2026-08-18 · **First module:** 2026-08-19
**Adapted from:** [authoring-invariants-pinned.md](authoring-invariants-pinned.md) (ja)
and [es-authoring-invariants-pinned.md](es-authoring-invariants-pinned.md)

> **Read the status line.** There is no `src/features/languages/fr/`. `"fr"` is
> in the `LanguageId` union and nothing else exists. So this file does two jobs
> the ja and es pins do not: it states the authoring rules, AND it states what
> must be BUILT before those rules can be obeyed. §7 is the build list, and
> nothing in §1–§6 is authorable until the items it depends on land.
>
> The strategic reason to write this now rather than after the code: es shipped
> 719 silent texts and unreadable module-2 prompts because its gates were
> ported *after* its content. Both defects were invisible to every test that
> existed at the time. **Port the gates with the first module, not after the
> sixteenth.**

---

## 0. Provenance

French is an **es-shaped** language module, not a ja-shaped one. It is Latin
script, morphology-heavy, has no second script, no particles, and no
classifiers. Its `LanguageModule` capability set is the same as Spanish's:
`conjugation`, `particles` (articles and prepositions), `vocabArt`,
`placementBank`, `ttsManifest`, `speaking` — and it omits `alphabetConfig`,
`secondScript`, `readingAnnotation`, `romanizer`, `classifiers`,
`symbolMastery`.

- **Carried from the es pin unchanged:** E1 (step-type bans invert — fr ships
  `info`/`phrase_card`/`self_explanation_mcq`, but passive cards stay rationed),
  E2 (`particle_cloze` = articles/prepositions, intro-only), E5 (complexity
  ramps morphologically), E7 (gloss discipline), E8 (comprehensibility is a
  hard gate), E10 (clitics and articles are their own tiles — with a much
  longer contraction list, see F4), E11 (hand-authored, array order IS step
  order), and the whole ja CARRIED block listed in the es pin §0.
- **Dropped, same reasons as es:** ja 1/2/3/20 (script ladder, furigana),
  ja 48 (graded register cue).
- **New for French — the rules below.** French's difficulty is not its
  morphology tables, which are ordinary. It is that **spelling and sound part
  company**, and that a beginner cannot segment spoken French into words. Every
  invariant in §1 exists because of that one fact.

---

## 1. Sound vs spelling — the French-specific core

**F1. LIAISON IS CONTENT, not pronunciation polish.** «les amis» is
[le.za.mi] and «les héros» is [le.e.ʁo] — identical spelling shape, opposite
behaviour. A learner who cannot hear a linked consonant cannot find word
boundaries at all, which means every listening step in the course silently
depends on this skill.
- Teach it explicitly with `liaison_listen` (the step type exists; the learner
  taps the JUNCTIONS where linking occurs). Do not leave liaison to be absorbed.
- **Author silent junctions on purpose.** Learners over-apply liaison at least
  as often as they miss it. An item made only of linked junctions teaches "link
  everything", which is a worse error than linking nothing. Every
  `liaison_listen` item must contain at least one junction that does NOT link:
  h aspiré (les héros), «et» (which never links forwards), singular
  noun + adjective.
- `liaison_listen` **requires recorded audio**. Browser `speechSynthesis` does
  not reliably liaise, so an item that falls back to synthesis is teaching the
  learner the wrong answer. Gate it on manifest coverage, not on best effort.

**F2. ELISION IS OBLIGATORY, so it is never an "accepted variant".** «je ai»
is not informal French, it is not French. `le/la → l'`, `je → j'`, `de → d'`,
`que → qu'`, `ne → n'`, `me/te/se → m'/t'/s'`, `si → s'` (before *il* only).
- Author the elided form as **the** answer. Do not put the unelided form in
  `acceptedAnswers` — accepting it teaches that it is a choice.
- Do put the unelided form in DISTRACTORS. It is the single most common
  beginner error and it is exactly the contrast worth drilling.
- **Grading depends on a fix that landed 2026-08-18.** `normalizeTypedAnswer`
  now folds U+2019 and the other apostrophe look-alikes to ASCII `'`. Before
  that, a learner on iOS or macOS — where smart punctuation is ON by default —
  typed `j’ai`, was compared against the authored `j'ai`, and was marked wrong
  for a keyboard setting. French is unauthorable without this; verify it is
  still in `src/shared/speech/loose-match.ts` before authoring a typed step.

**F3. h aspiré is lexical and must be taught per-word.** There is no rule. «le
héros» but «l'homme»; «les héros» [le.e.ʁo] but «les hommes» [le.zɔm]. Any atom
beginning with `h` carries its aspiré status as data at introduction, and the
first item that uses it contrasts it against a mute-h word. A course that
introduces `héros` without contrasting `homme` has taught nothing about h.

**F4. Contractions are single tiles; elisions are single tiles; nothing else
is.** This is es E10 with a longer exception list, and the list is closed:
- **Single tile** (French spells them as one word): `au` (à+le), `aux` (à+les),
  `du` (de+le), `des` (de+les), and every elided form (`l'ami`, `j'ai`,
  `qu'il`, `d'un`). Splitting these asks the learner to build a string French
  does not write.
- **Separate tiles**: articles (le/la/les/un/une/des-partitive), object and
  reflexive pronouns (me/te/le/lui/nous/vous/leur/se), prepositions, and
  **both halves of negation** — `ne` and `pas` are two tiles, because placing
  them around the verb is the skill.

**F5. Accents that change the word are not "accepted-but-flagged".** The
engine's `accentFold` accepts a diacritic-stripped answer and flags it, and
that policy is right for Spanish, where an accent almost always marks stress on
a word that is otherwise unambiguous. It is **wrong** for the French minimal
pairs where the accent IS the word: `a`/`à`, `ou`/`où`, `sur`/`sûr`,
`du`/`dû`, `la`/`là`.
- **LANDED 2026-08-20:** `frModule.accentPolicy` names the five pairs (folded
  keys) and `gradeTypedAnswer` refuses to accent-fold across them, both
  directions (`ou` for `où` fails; so does `là` for `la`), while ordinary
  accents stay lenient-with-nudge (`tres` for `très` still passes, flagged).
  Threaded via `accentPolicyFor(language.id)` in `TranslateStepView`; pinned
  by `fr/__tests__/accentPolicy.test.ts` + the gradeTypedAnswer suite in
  `shared/speech/loose-match.test.ts`. Typed steps on these pairs are now
  authorable. (The former rule: drill them only with `multiple_choice` /
  `agreement_cloze`.)

## 2. Gender and agreement

**F6. Gender is taught WITH the article, always, from the first exposure.**
French gender is less predictable than Spanish (no reliable -o/-a signal), and
a noun learned bare is a noun learned wrong. Every noun's debut surface shows
`un/une` or `le/la` — never the bare noun. `word_image_mcq` options carry the
article too, or the step is teaching half a word.

**F7. Agreement drills use `agreement_cloze`, which needs no new engine code.**
The type and its view import nothing language-specific. Article + noun +
adjective agreement is exactly the shape it was built for, and it grades the
set all-or-nothing, which is correct: agreement is a sentence property.

**F8. Adjective position is a real choice and belongs in `build_sentence`.**
Most French adjectives follow the noun; the BAGS set (Beauty, Age, Goodness,
Size — `beau`, `jeune`, `bon`, `grand`, `petit`, `nouveau`) precedes it, and a
few change meaning by position (`ancien`, `propre`, `cher`). Do not teach this
with an MCQ over two orderings — that is a recognition step for a production
skill. Build it.

## 3. Register — tu / vous

**F9. tu/vous is binary and social, and it is taught by choosing among known
words.** ja inv 46 and es E3 carry unchanged in principle.
- The `build_sentence` register scaffolds (`picker`, `audienceEmoji`,
  `audienceLabel`, `politenessHint`, `referenceTable`, `frameBefore/After`)
  are language-neutral FIELDS and can be hand-authored for French. What does
  NOT exist is the emitter: `REGISTER_AUDIENCES` lives in `languages/ja/` and
  the only producer is a JA-only IR beat. **Hand-author the fields; do not wait
  for a pipeline.**
- `politenessHint` is documented as a 3-level scale for Japanese 丁寧度. French
  is binary — use levels 1 and 3, or relabel. Cosmetic, but be consistent.
- State the audience in the prompt whenever it changes the answer (ja inv 8).
- **vous is also plural.** A step that treats `vous` as purely a formality
  marker will teach a false rule. Contrast the two uses explicitly.

## 4. Negation, and the register split nobody teaches

**F10. Author written `ne … pas` and TEACH that speech drops `ne`.** «je sais
pas» is what a learner will actually hear, and a course that only ever presents
`ne … pas` leaves them unable to parse ordinary spoken French. Author the full
form as the production target; use the reduced form in `listening_comprehension`
and `dialogue_listen` where a speaker is being casual, and say so once in a
rule card. Do not silently mix them — a listening item whose transcript drops
`ne` while a build step demands it, with no explanation between them, reads as
an inconsistency.

## 5. Prompts, glosses, comprehensibility

**F11. es E8 carries with full force, and French makes it harder.** Every word
in a PROMPT must be met or on the closed function-word allowlist. French
prompts are more dangerous than Spanish ones because so many high-frequency
words are elided or contracted, and a learner who has met `de` and `le` has NOT
automatically met `du`. **Treat every contraction and elision as its own
lexical item for comprehensibility purposes.**

**F12. Gloss the tense honestly.** French present covers English simple and
progressive («je parle» = "I speak" / "I am speaking") — the same trap as es
E7. The A2 pair is passé composé vs imparfait, and it is the same discourse
contrast Spanish has: use `aspect_choice_cloze`, gloss the passé composé as
simple past and the imparfait as "used to" / "was …ing", and never flatten both
to "walked".

## 6. Module shape

**F13. Follow the es shape until there is evidence to do otherwise.** 8 lessons
per module (L1–L7 teaching + L8 mastery), 14–25 steps per teaching lesson,
8–16 graded-only steps in the mastery test, no two adjacent same-type steps,
never 3+ consecutive selection MCQs, ≥2 generation steps and ≥1 typed-or-spoken
per lesson. This is not a claim that es's shape is optimal — it is that
fr should not invent a third shape while es and ja already disagree.
**Do not import ja's 12–15 lesson module or its review/challenge structure:
review-lesson routing does not exist for non-ja languages.**

---

## 7. BUILD LIST — what must exist before §1–§6 can be obeyed

Ordered by what blocks what. Verdicts are from the 2026-08-18 engine audit.

**Already reusable, zero engine change:** `agreement_cloze`, `particle_cloze`,
`word_image_mcq`, `match_pairs`, `build_sentence` incl. register scaffolds,
`translate`, `listening_comprehension`, `listening_build`, `dialogue_listen`,
`self_explanation_mcq`, `speaking`, derived test-outs (`sectionOf` already
handles arbitrary language prefixes), and the shared `accentFold` grading path.

**Landed 2026-08-18:** apostrophe folding in `normalizeTypedAnswer` (F2);
`liaison_listen` step type + view (F1); `aspect_choice_cloze` step type + view
(F12).

**Landed 2026-08-18, later the same day — the engine's structural core:**

| What | Where | Note |
|---|---|---|
| `BCP47.fr = "fr-FR"` | `shared/tts/index.ts` | was falling through to bare `"fr"` |
| `SPEECH_LOCALES.fr` | `SpeakingStepView.tsx` | was falling back to `{web:"fr"}` |
| `fr/courseAtoms.ts` | atom registry + `elidesBefore()` | see the two divergences below |
| `fr/grammarHelpers.ts` | the 5 FR-usable step factories | `silentLetter`, `liaisonListen`, `agreementChain`, `genderSort`, `aspectChoiceCloze` — each validates at authoring time |
| `fr/placementBank.ts` | glob-derived aggregate | empty until a module exists |
| `fr/module.ts` + `registry.ts` | **fr is REGISTERED** | and deliberately NOT selectable |
| `fr/__tests__/frEngine.test.ts` | 26 tests | every validator's refusal is exercised |

**Two divergences from the ES engine, both taken deliberately while FR has no
modules and they are free:**

1. **The atom aggregate and the placement bank are DERIVED by globbing
   `curriculum/m*.ts`, not hand-maintained.** ES keeps a literal list of
   `...ES_M17_ATOMS` spreads plus a hardcoded `EsAtomSource` union, and its own
   comment records the cost: m17 shipped without being added, so its 29 atoms
   were taught and then never scheduled. Same failure shape as a `MODULE_ORDER`
   frozen at m17 silently exempting two modules from a gate. Adding a French
   module file IS adding its atoms. A module file whose `FR_M<n>_ATOMS` export
   number disagrees with its file name throws.
2. **Elision is a property of the ATOM.** `elidesBefore()` derives it from
   spelling; the one unpredictable case, h aspiré, is declared once via
   `hAspire: true` on the atom. Callers must never test the first letter
   themselves, or the exception applies in some places and not others.

**Registered ≠ selectable.** `AVAILABLE_LEARNING_LANGUAGE_IDS` still excludes
`fr` (item 6 below). Registering early is what puts French under the shared
gates — `moduleConformance` is `describe.each(getAllLanguageIds())` — from now
rather than from whenever someone remembers.

**Correction to the step-type inventory:** `stress_pattern` is **not** a French
type, despite landing in the same wave. Its `accentRule` enum is
`aguda | llana | esdrujula` and its worked minimal pair is `hablo` / `habló`.
French stress is phrase-final and fixed, so there is no word-level stress to
hear and a French `stress_pattern` step is unanswerable under §1. FR-only:
`silent_letter`, `liaison_listen`, `agreement_chain`. Shared with ES:
`gender_sort`, `aspect_choice_cloze`.

**Small parameterizations (each is a line or a small table):**

| Item | Where | Note |
|---|---|---|
| ~~`BCP47.fr`~~ | ~~`shared/tts/index.ts`~~ | **DONE** — `fr-FR`, not bare `fr`: a bare tag lets the platform pick any French voice, and fr-CA differs from fr-FR in exactly the vowels a beginner is learning to hear |
| ~~`SPEECH_LOCALES.fr`~~ | ~~`SpeakingStepView.tsx`~~ | **DONE** — `{web:"fr-FR", whisper:"fr"}` |
| AccentBar char set | `lesson/components/AccentBar.tsx` | Hard-codes 9 Spanish chars, gated on `id === "es"`. FR needs `é è ê ë à â ù û î ï ô ç œ` — 13+, which will not fit one row; the layout needs a look, not just a longer array |
| ~~`matchPairsFloor` fill branch~~ | `lesson/data/matchPairsFloor.ts` | **Resolved differently 2026-08-19:** no FR branch, deliberately. The FR `matchPairs` factory enforces the ≥6-pair floor at AUTHORING time, so grids render full with no render-side synthesis. |
| `getConjugationGridConfig("fr")` | `practice/conjugation-grid/gridConfig.ts` | Returns `null` for anything but `es`; `EsTenseId`/`EsPersonId` need widening |

**Genuinely new code:**
1. `fr/conjugationTables.ts`, `fr/courseAtoms.ts`, `fr/grammarHelpers.ts`,
   `fr/module.ts`, and the `registry.ts` entry. (es's engine half is **1,998
   LOC** — that is the realistic size of this, not the 15k ja carries.)
2. A FR `expandAcceptedAnswers` ruleset for elision variants. The JA file is
   100% JA-specific; its ARCHITECTURE (fixpoint variant queue, `MAX_VARIANTS`
   guard) is a clean template, its rules are not reusable.
3. ~~A per-language `accentPolicy` threaded into `gradeTypedAnswer`~~ —
   **DONE 2026-08-20**, shaped as a protected-form INVENTORY rather than a
   lenient/strict switch (a switch could not keep `très` lenient while
   failing `ou`): `AccentPolicy.protectedFoldedForms` on the LanguageModule,
   five F5 pairs in `fr/module.ts`, threaded via `accentPolicyFor` in
   `TranslateStepView`. See F5 above for the tests that pin it.
4. ~~A FR TTS deck emitter + `manifests/fr.json`~~ — **DONE 2026-08-19** (ES
   data-walk pattern; edge `fr-FR-DeniseNeural`; 53 m1 clips staged in
   `tts-publish/fr/`, additive only; manifest byte-identical in both repos).
   The Denise voice is NOT yet human-auditioned.
5. ~~The gates, ported WITH the first module~~ — **DONE 2026-08-19, all at
   zero:** `frAudioCoverage` (ratchet 0, green), `frPromptComprehensibility`
   (ratchet 0), `fr-quality.test.ts`, and the per-module
   `moduleContentLints.ts` + `moduleBarGuards.ts` pair. The FR bar guards
   carry NO debt parameter — no pre-gate content exists to pin, and the type
   system deliberately cannot express a pinned violation. `moduleConformance`
   picks fr up via `describe.each(getAllLanguageIds())`.
6. `AVAILABLE_LEARNING_LANGUAGE_IDS` in `shared/domain/languageConfig.ts` — the
   last switch, and deliberately last. STILL OFF: the audio gate passes at
   zero (2026-08-19), so the remaining blockers are human — Spencer's audition
   of the Denise voice and a walk of m1 — plus a one-module course being thin
   ground for a public switch.

**Deliberately NOT on this list:** a "French agreement" step type, a "gender
cloze", an "article picker", or a "tu/vous" step type. All four already exist
as `agreement_cloze` / `particle_cloze` / `build_sentence`+register-fields. The
house rule is **parameterize, don't fork**, and French is the language most
likely to tempt an author into forking, because its surface feels unfamiliar
while its mechanics do not.
