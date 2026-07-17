# ES course rewrite brief — bring es up to JA length/depth/question-design (2026-07-16)

You are rewriting the **step content** of ONE Spanish curriculum module file
(`src/features/languages/es/curriculum/mN.ts`) so it teaches like the Japanese
course, not like the current thin recognition-quiz. This brief is the contract.
Read it fully. The audit that motivated this is
`docs/es-content-quality-audit-2026-07-16.md`; the JA standard is
`docs/lesson-authoring-guide.md`; the reference JA module to imitate for *shape*
is `src/features/languages/ja/curriculum/m8.ts` (sub-lesson `M8_1_1`).

## The one-line goal
Each topic lesson (L1–L7) becomes **~18–22 retrieval-heavy steps** that: teach
2–4 things, drill them with VARIED steps (never an MCQ marathon), force
**production** (typed + spoken + built), land **one `selfExplain`** near the end
of grammar lessons, and close with a **compounding review tail** pulling
**earlier modules'** vocabulary/grammar. The lesson is fun because every step is
a chance to win; it teaches because every step makes the learner *retrieve*, not
re-read; it sticks because prior material keeps coming back.

---

## HARD CONSTRAINTS — breaking any of these breaks the build. Do not.

1. **Do NOT modify `ES_MN_ATOMS`** (the `atom({...})` array). Keep every atom,
   its exact `surface`, `meaningEn`, `gender`, `emoji`, `kind`, order. `courseAtoms.ts`,
   other modules, and tests depend on the exact set. You rewrite **lessons only**.
   You may keep/extend the local distractor-pool consts (e.g. `ROJO`, `CASA`).
2. **Keep exactly 8 lessons**, ids `es-mN-1` … `es-mN-8`, each with
   `moduleId: "mN"`, `languageId: "es"`, `courseId: "mock-1"`. Keep the
   `export const ES_MN_LESSONS = [M N_1 … M N_8]` array.
3. **L8 is the mastery test**: `title` EXACTLY `"MN Mastery Test"` (e.g.
   `"M4 Mastery Test"`), and **graded steps only** — no `infoStep`, no
   `phrase`/`vocab` passive cards, no `selfExplain` anchor-less teach. ~10–14
   graded steps sampling the whole module + 2–3 prior-module review items.
4. **Every module atom `surface` must appear literally in the module's steps**
   (a test greps for it). If you introduce an atom, drill it.
5. **Unique step ids** within each lesson; all ids prefixed `es-mN-...`.
6. **Keep `ES_MN_PLACEMENT`** exported and valid (you may leave it as-is).
7. **Correct Spanish only.** LatAm-neutral, `tú` default (`usted` where the
   module teaches it), correct accents and `¿ … ? ¡ … !`. Do not introduce errors.
   Preserve the existing (correct) grammar explanations' substance.
8. Keep the `import "./m{N-1}"` side-effect import (registers earlier atoms).

---

## DENSITY & VARIETY (the JA bar)

- **18–22 steps per topic lesson** (hard band 12–25). Mastery L8: 10–14.
- **No two adjacent steps of the same `type`.** (Machine-checked.)
- **No 3+ "selection" steps in a row.** These ALL count as one tap-one-of-N
  interaction: `sentenceMcq`, `vocabMcq`, `vocabTextMcq`, `cloze`,
  `agreementCloze`, `listeningCompSentence`, `selfExplain`, `dialogueListen`.
  Break every run of 2 with a **generation** step (`build`, `translateStep`,
  `speaking`, `listeningBuildSentence`) or a teach beat (`infoStep`).
- **≥6 distinct step types per lesson.**

## PRODUCTION (the biggest current failure — fix it everywhere)

- **≥2 generation steps per topic lesson**: at least one `translateStep` (TYPED
  free recall — the strongest tier) and at least one `speaking` or `build`.
  Put the hardest (typed translate / speaking on a full sentence) in the **back
  half** of the lesson.
- A lesson whose skill is inherently productive (conjugating, agreeing,
  ordering, giving directions) must make the learner **produce** that form, not
  only pick it.

## COMPOUNDING REVIEW (JA's #1 differentiator — currently absent)

- Every lesson **L2 onward** appends a **3–5 step review tail** drawing
  **earlier-module** atoms. Use the new helpers:
  - `reviewMatchPairs("es-mN-x-rev", "es-mN-x-seed", "mN", 6)` → a 6-pair grid of
    prior-module words. (`beforeModule` = this module's id `"mN"`; it draws only
    from modules *before* mN.)
  - `pickReviewSurfaces("es-mN-x-seed", "mN", 4)` → `string[]` of prior surfaces
    you can feed into a `cloze` carrier, a `sentenceMcq`, or a `build` to
    re-exercise old grammar in new sentences.
- Aim for at least **one review `matchPairs`** plus **one review
  production/recognition** step per lesson tail. Vary the seed per lesson so
  different words recur.
- **m1 is exempt** (nothing earlier to review) — spend that budget on production
  + variety instead.

## SELF-EXPLANATION (metacognition — currently zero)

- **Exactly one `selfExplain` per grammar-teaching lesson**, placed at
  **position N-1** (after the learner has committed the target 2–3 times).
- Anchor it to a form they JUST produced. Options:
  - `rule` = the correct reason (why the form is right),
  - `surface` = a plausible near-rule / heuristic that's *almost* right,
  - `distractor` = a **rule-citing-but-wrong** statement — a true-sounding
    near-rule, NEVER dismissible nonsense (a good distractor takes real thought
    to reject; "both mean the same, pick either" is banned).
  Provide `ruleExplanation` (the 1-sentence rule revealed after commit).
- Pure-vocab lessons (no new grammar) may skip it; use the slot for production.

## QUESTION DESIGN (de-leak — currently leaks in m4/m9)

- **NEVER hand the answer in the prompt.** BANNED:
  `sentenceMcq({ prompt: "La casa es ___ (big)", correctText: "grande",
  distractorsText: ["pequeño","nuevo","viejo"] })` — the "(big)" makes the
  Spanish decorative and the distractors eliminable.
- Instead, make the learner **read Spanish to choose**:
  - Cloze/MCQ prompts in **Spanish** with enough context to force one answer
    (`"Mi hermana mide dos metros. Es muy ___."` → alta), distractors plausible;
  - or a **comprehension** question (`"¿Qué significa 'la casa vieja'?"`);
  - or flip to **production** (`translateStep`/`build`) where the whole sentence
    must be generated.
- **Distractors** must be plausible: same category, real conjugated/agreeing
  forms, gender/person minimal pairs. Never nonsense, never wrong part of speech,
  never eliminable by the English gloss.
- **Carriers must be varied, natural, real-life sentences.** Do NOT reuse one
  frame (`"El X es ___"`, `"'X' — pick it"`, `"— pick the form that fits"`).
  Reuse earlier vocab to make sentences richer and more human.

## TEACHING & PASSIVE CARDS

- Teach grammar with a **tight, correct `infoStep`** (variant `"grammar"`): one
  idea + one concrete example. Do NOT front-load a full 6-person paradigm the
  lesson only drills three of. Cadence: teach → immediate retrieval → (more
  retrieval) → `selfExplain`.
- **Minimize passive `phrase`/`vocab` cards.** Where an atom has an emoji,
  introduce it via `vocabMcq` (image MCQ) directly instead of a passive card.
  When you do use a passive card:
  - it must be followed within 3 steps by a **graded** step exercising **its
    atom**, and that retrieval must not be ONLY adjacent (need a same-atom graded
    step at i+2 or i+3 as well — spaced, not massed);
  - **no `explanation` field on passive steps** (forbidden — test-checked).
- No two passive cards adjacent.

## FACTORY API (all from `"../grammarHelpers"`)

```
infoStep(id, title, body, variant?)                      // variant: "default"|"grammar"|"culture"|"win"
phrase(id, meaningEn, text, cultureNote?, {emoji?})      // == vocab; PASSIVE card
vocab(id, meaningEn, text, cultureNote?, {emoji?})
vocabMcq(idPrefix, {surface, meaningEn, emoji}, distractorPool[{surface,emoji}])  // image MCQ; target needs emoji
vocabTextMcq(id, targetSurface, distractorSurfaces[], promptOverride?)            // text MCQ for emoji-less words
sentenceMcq({id, prompt, promptAudioText?, correctText, distractorsText:[3], explanation?, exercisedAtomSurfaces?})
cloze(id, before, after, correctParticle, options[], meaningEn, audioText, explanation?, exercisedAtomSurfaces?)
agreementCloze(id, segments, meaningEn, audioText?, exercisedAtomSurfaces?)       // multi-blank agreement
build(id, prompt, target, tiles[], correctOrder[], exercisedAtomSurfaces?)        // PRODUCTION (word tiles + 1-2 distractor tiles)
translateStep({id, promptEn, acceptedAnswers[], audioText?, exercisedAtomSurfaces?})  // PRODUCTION, typed. Include accent-less + capitalized + trailing-period variants in acceptedAnswers.
speaking(id, targetPhrase, translation, exercisedAtomSurfaces?)                   // PRODUCTION, spoken
listeningBuildSentence({id, target, tiles[], correctOrder[], promptEn, exercisedAtomSurfaces?})
listeningCompSentence({id, audioText, correctMeaningEn, distractorsEn:[3], question?, exercisedAtomSurfaces?})
matchPairs(idPrefix, surfaces[])                          // ≥6 REGISTERED single-word surfaces; source↔gloss grid
dialogueListen({id, lines:[{speaker,text,audioText?}], questions:[{id,prompt,correctText,distractors:[3],explanation?}], transcriptRevealAfter?, exercisedAtomSurfaces?})  // L7 integration closer
selfExplain({id, anchorLabel, anchorAudioText?, question, rule:{text}, surface:{text}, distractor:{text}, ruleExplanation?})   // NEW — metacognition
// NEW review helpers:
reviewMatchPairs(idPrefix, seedId, "mN", 6)                         // prior-module grid
pickReviewSurfaces(seedId, "mN", n, {singleWord?, kinds?}) => string[]   // prior-module surfaces for carriers
```

Notes: `translateStep.acceptedAnswers` should include the accented form, an
accent-less variant, a capitalized variant, and a trailing-period variant (the
existing files show the pattern). `build`/`listeningBuild` `tiles` include the
correct words **plus 1–2 plausible distractor tiles**; `correctOrder` is the
answer subset. Keep sentences ≤ ~8 words (TTS + tile UX).

## RECOMMENDED LESSON SHAPE (adapt within the density band)

```
L1 (vocab/intro):  infoStep(open) → vocabMcq → speaking → vocab/vocabMcq …
                   → build → translateStep → listeningComp → (review tail from L2 on) → infoStep(win)
L2/L4 (grammar):   infoStep(grammar) → cloze → vocabMcq → cloze(rotated) → build
                   → translateStep → sentenceMcq → selfExplain(N-1) → speaking
                   → [review tail: reviewMatchPairs + 1 review production] → infoStep(win)
L3/L5 (topic):     vocab-in-context + interleaved recognition→production, selfExplain if grammar-bearing, review tail
L6 (listening):    sentence-level listeningComp + listeningBuild dominant, BUT still ≥1 speaking/build + review tail
L7 (integration):  dialogueListen (2 speakers, 3-4 lines, 1-3 Qs) + build + speaking + review tail
L8 (mastery):      graded-only, ~10-14, whole-module sample + prior-module review, mixed modalities
```

Close every topic lesson on an **identity-anchored win** `infoStep(variant:"win")`
("You can now describe anything you own or meet.") — not "agreement unlocked."

## SELF-CHECK before you finish
- [ ] 8 lessons, ids `es-mN-1..8`, L8 = `"MN Mastery Test"`, graded-only.
- [ ] Every topic lesson 18–22 steps, ≥6 step types, no adjacent same-type, no 3+ selection run.
- [ ] ≥2 production steps per topic lesson; ≥1 typed translate.
- [ ] One `selfExplain` at N-1 in each grammar lesson (plausible distractors).
- [ ] Review tail (L2+): ≥1 `reviewMatchPairs` + ≥1 prior-module review item, unique seeds.
- [ ] No answer-leaking prompts; distractors plausible; carriers varied & natural.
- [ ] Every `ES_MN_ATOMS` surface appears in steps; atoms array UNCHANGED.
- [ ] No `explanation` on passive steps; passive cards have spaced same-atom follow-up.
- [ ] Spanish correct. Reads like a real, human, fun lesson — not a bulk-generated quiz.

Return a concise summary of what you changed (per-lesson step counts, production
added, review tails added, selfExplains added, any judgement calls). Then STOP —
do not run the test suite (the orchestrator runs tsc + vitest across all modules).
