# ES course content-quality audit vs JA (2026-07-16)

Comprehensive per-module audit of the authored Spanish (es) course (m1–m16, 16
modules × 8 lessons ≈ 128 lessons) against the JA `lesson-authoring-guide.md`,
the `es-course-spine-2026-07-13.md` contract, and the shipped JA course as the
quality reference. Follows up `es-ja-parity-2026-07-15.md` (which covered
*engine* parity) and the standing content-quality flag from 2026-07-15.

**Method:** 6 parallel audit agents — five reading modules m1–m3 / m4 (by hand) /
m5–m7 / m8–m10 / m11–m13 / m14–m16 step-by-step against a shared rubric, plus one
JA-contrast/engine-gap agent producing the quantitative backbone. Every finding
below carries a `file:line` and a quote.

---

## TL;DR — the verdict is not what the flag implied

The 2026-07-15 flag said the mass-authored es content is "really bad." After a
full read, that needs a **precise restatement**:

- **The Spanish is clean.** Across all 16 modules the auditors found **zero
  grammatical errors shipped as correct answers** — no wrong conjugations, no
  wrong gender, no bad agreement, accents/¿¡ consistently present, register
  (tú-default, LatAm, no vosotros drills) correct. The hardest, most-often-
  mistaught points are taught **correctly**: gustar as a flipped/pleasing verb
  (m10), the stem-change "boot" incl. the nosotros exception (m13), ser-vs-estar
  (m7), reflexive morphology + body-part articles (m15), hay-vs-está (m14),
  saber-vs-conocer (m16). Several grammar `infoStep`s are genuinely good.
- **The pedagogy is where it fails the JA bar.** The course abandons the
  retrieval-first architecture that makes JA work, and replaces it with a
  recognition quiz. That — not language errors — is what makes it "teach poorly."

So: **do not rewrite the Spanish. Rewrite the drill design.** The fixes are
structural and largely the same edit repeated across ~100 lessons.

---

## The quantitative backbone (JA vs ES, whole-course factory counts)

| Mechanism | JA | ES | Note |
|---|---:|---:|---|
| `selfExplain` (metacognitive "why is this right") | **305** | **0** | Not even imported in es. JA lands one at position N-1 of every grammar-drill lesson. |
| `grammarRule` (structured: examples[] + antiPattern + cultureNote) | **102** | **0** | ES teaches grammar via freeform `infoStep` prose (94 uses) — no worked examples, no anti-pattern, no interactive check. |
| `pickReviewAtoms` / cross-module REVIEW_POOL | **360** | **0** | JA's self-described **#1 differentiator vs Duolingo**. Absent from every es lesson. |
| `storyComprehension` (narrative + Q, ~1/module in JA §14) | **44** | **0** | ES's nearest analog is the shorter `dialogueListen` (12 uses). |
| Typical sub-lesson size | **~20 steps / 9 types / 11 production** (JA M8_1_1) | **~9 steps / 7 types / 3 production** (es-m8-1) | ES is ~half the density and roughly a *third* the production per lesson. |

Sources: `ja/curriculum/m8.ts:57-309` (reference sub-lesson), grep of factory
call counts across `ja/curriculum/*` vs `es/curriculum/*`.

### Root cause: ES is exempt from every quality guardrail

The JA guardrail tests in `src/features/lesson/data/` —
`sub-lesson-density.test.ts`, `atom-coverage.test.ts`,
`mcq-position-distribution.test.ts`, `ja-m3-m7-coverage.test.ts`,
`storyComprehension.test.ts`, `kanaReviewTails.test.ts` — **import only
`ja/curriculum/*`. Not one imports an `es/curriculum` module.** The es per-module
tests (`es/curriculum/mN.test.ts`) assert lesson counts/ids, passive-card
spacing, an answer-leak lint, and *same-module* atom coverage — but **no density
floor, no MCQ-position distribution, no cross-module-review requirement, and no
"never 3+ MCQ in a row" / "no adjacent same-type" check.** Nothing in CI forces
es toward the JA standard, so it drifted. **Fixing the tests is the highest-
leverage change** — it converts every finding below into a red build.

### Spine caveat (partial excuse, not full)

The `es-course-spine-2026-07-13.md` itself set a *lower* bar than the JA guide:
"6–9 steps per lesson," KO-style `infoStep` (no `grammar_rule`/`selfExplain`),
sanctioned phrase cards, review pool deferred to "phase 2." So some divergence is
**by-design**, and step-count / phrase-card-existence alone are not fair dings.
But the course also violates **its own spine ratchets** — chiefly the L2–L5
"recognition → production" rhythm (`spine:32`) — via the zero-production lessons
below.

---

## Systemic findings (ranked)

### 1. [MAJOR] Production starvation — ~20+ of ~96 topic lessons have ZERO production
No `build` / `translateStep` / `speaking` — pure tap-to-recognize. Worst: the
lessons whose entire purpose is a *productive* skill are recognition-only.

- m10-4 gusta-vs-gustan (`m10.ts:273-343`) — the number-agreement lesson; learner never *produces* "me gustan las naranjas," only picks it.
- m15-2 reflexive-verb intro (`m15.ts:157-207`) — introduces `me/te/se` forms with no production beat.
- m7-5 ser-vs-estar (`m7.ts:328-405`) — the module's core contrast, produced never.
- m16-4 survival directions (`m16.ts:307-381`) — learner never *says* `¿me puede ayudar?` / `siga derecho`, the phrases it exists to make sayable.
- Also: m1-3/1-4/1-5, m2-4, m3-2/3-3/3-4/3-5, m5-1/5-4/5-5/5-6, m6-1/6-3/6-6, m7-2/7-3/7-6, m11-6, m12-3/12-6, m13-6, m14-1/14-4/14-5.

Where production exists it's ~1 typed step/lesson vs JA's ~11.

### 2. [MAJOR] MCQ-marathon monotony — runs of 3–5 consecutive "tap one of N"
JA caps selection-MCQ runs at 2 (guide §2); es has no such guard. Every
`sentenceMcq`/`vocabMcq`/`vocabTextMcq`/`cloze`/`listeningComp` is the same
interaction. ~9–15 lessons violate; several 5-long:
- m1-4 `vocabMcq × 6` back-to-back (`m1.ts:284-289`); m1-5 `vocabMcq × 5`.
- m9-5 five consecutive `sentenceMcq` (`m9.ts:382-418`).
- m10-4 five consecutive selection steps (`m10.ts:305-341`).
- m16-4 five-in-a-row (`m16.ts:344-379`); m8 `sentenceMcq × 4` (`m8.ts:236-265`) and 5-run (`:385-419`).

The dominant loop is *show phrase card → tap the right option*, not *retrieve → produce*.

### 3. [MAJOR] No compounding cross-module review — 0 of ~96 lessons
JA's #1 differentiator. No `pickReviewAtoms`, no review pool anywhere in es.
Every `matchPairs` grid recycles only the **current** module's brand-new words
(e.g. `m8.ts:441` 8 m8 verbs; `m10.ts:397` 8 m10 foods; `m3.ts:224` 6 m3 nouns).
Prior-module atoms resurface only *incidentally* in carrier sentences, never as a
deliberate spaced-review rung. **Exception — the one place it's done right:**
m16's three Repaso lessons (`m16.ts:385-729`) genuinely weave m2–m15 (ser,
articles, tener…años, clock time, gustar, this/that, weather, reflexives; the
capstone grid samples one word per course-stretch). Proof the authors *can* do
it — it just wasn't built into the per-lesson tail.

### 4. [MAJOR] No metacognition (selfExplain: 0) & no structured grammar (grammarRule: 0)
Grammar is freeform `infoStep` prose. Sometimes an info-dump: m11-1 front-loads
all six `ir` forms in the opener though the lesson drills only three
(`m11.ts:116`). A pure stem-change module (m13) or a gustar module (m10) is the
textbook case for a "why does nosotros stay plain?" / "why gusta not gustas?"
self-explanation — absent from all. (Spine-deferred to phase 2, but it's a real
gap vs the JA bar Spencer is comparing against.)

### 5. [MAJOR] Answer-leaking MCQ prompts — localized, module-specific
Not universal (m8/m16 prompts are legitimate Spanish-comprehension tasks), but
concentrated where it does appear:
- **m4 adjectives:** `prompt: "La casa es ___ (big)"` with options grande/pequeño/nuevo/viejo (`m4.ts:121-128` and pervasive) — the "(big)" gloss makes the Spanish carrier decorative; the item is English→word matching.
- **m9 question words:** `"You ask WHY your friend studies English"` → `Por qué` (`m9.ts:399`); `"Ask which one is his"` → `Cuál` (`m9.ts:414`). Interrogatives tested as vocab recall, not usage.
- Milder leaks: `m12.ts:149` `"Pick 'this car' (carro is masculine)"` hands over the gender that decides este/esta; `m13.ts:208` "(tú)" pre-selects the person.

### 6. [MAJOR] Passive phrase-card reliance — the shelved intro pattern
`phrase()`/`vocab()` both emit `phrase_card`; the phrase→MCQ introduce-then-recall
pattern is the **default** vocab mechanism across all ~128 lessons — exactly what
JA §4b2 shelved ("vocabulary introduction happens through drills… never passive
phrase cards"). ~15–18 passive cards/module, often authored as adjacent pairs
(would fail JA's `previewLessons.test.ts` adjacency guard, which doesn't run on
es). Spine-sanctioned, but it's the mechanical reason the course feels flat.

### 7. [MINOR] Robotic carriers / machine-authored feel
The identical English tag **"— pick the form that fits."** is appended to ~30
prompts in m8–m10 alone; **"'X' — pick it."** is the reused frame across m1–m3;
the `"El/La X es ___"` frame repeats endlessly in m4. Reads as bulk-generated.

### 8. [MINOR] Adjacent same-`type` steps in ~20 of 24 lessons per batch
Paired `phrase` intros and paired MCQs recur everywhere. JA machine-forbids two
adjacent same-`type`; no equivalent guard fires on es.

### 9. [MINOR] Linguistic imprecisions (not blockers — the only language nicks found)
- m14 teaches `¿Cómo está el clima?` as *the* weather question (`m14.ts:282,290`); prescriptively `¿Qué tiempo hace?` — defensible LatAm colloquial but shipped as sole canonical form with no note.
- m16 "g" mnemonic (`m16.ts:138`) conflates epenthetic-g (`venir→vengo`) with c→g mutation (`hacer→hago`).
- Taught-not-drilled: `están` (m14), `para mí` (m10-2 info `m10.ts:480`), `¿cómo se llama usted?` (m2).
- Occasional explanation-leaks-ending nicks vs the spine's own ratchet (`m8.ts:242` "The we form always carries -amos" — answer is `caminamos`).

### 10. [MINOR] Single-voice TTS
ES dialogues play both speakers as one voice (Dalia) with a synthetic
`VoiceColor` detune/rate shift, not a second actor
(`DialogueListenStepView.tsx:119-137`). A real listening-quality shortfall;
per-card voice + Jorge clips is the phase-2 fix (`es-course-gaps-2026-07-13.md`).

---

## Per-module quick verdicts

| Mod | Topic | Zero-prod lessons | Worst MCQ run | Notes |
|---|---|---|---|---|
| m1 | Sonidos y saludos | 3/5 topic | 6× vocabMcq | Excellent vowel/stress info; number drills = flashcard grind |
| m2 | Presentaciones | 1 (m2-4) | 3-run | Strongest early module; ser drilled with real production in L2/3/5/7 |
| m3 | Género y artículos | 4/5 topic | 4-run | One `build` is degenerate (tiles == answer, `m3.ts:164`); grammar correct |
| m4 | Descripciones | m4-1 (pure recog) | — | Home of the "(big)" answer-leak; monotone `El X es ___` frame |
| m5 | Familia y posesión | 4/8 | 4-run | Clean tener; L4/L5 end without production |
| m6 | Números y tiempo | 3/8 | 5-run | Teaching low point — numbers = bare word-match MCQ |
| m7 | Estar y lugares | 4/8 | 5-run | ser/estar lesson (m7-5) is production-free; m7-3 teaches AND produces nothing |
| m8 | -ar present | 0 | 5-run | Paradigm recognized not produced; distractors are real forms (good) |
| m9 | -er/-ir + question words | thin | **5-run** (`:382`) | Most answer-leaking; interrogatives as vocab recall |
| m10 | gustar / food | 2 (m10-2,4) | 5-run | gustar taught *correctly*; agreement lesson has no production |
| m11 | Ir / transport | 1 (m11-6) | 2–3 | Info-dump opener (all 6 ir forms); clean |
| m12 | Demonstratives / prices | 2 (m12-3,6) | 4-run | Worst density discipline; haggling culture note is nice |
| m13 | Stem-changing verbs | 1 (m13-6) | 3-run | **Best-taught** — flawless boots, distractors drill the nosotros exception |
| m14 | Casa y clima | 3/6 topic | 3-run | hay/está info good; `están` taught-not-drilled |
| m15 | Mi rutina (reflexives) | 1 (m15-2) | — | Healthiest module; reflexives flawless; only m15-2 lacks production |
| m16 | De viaje + grand review | m16-4 | 5-run | **Capstone genuinely compounds m2–m15**; survival lessons recognition-only |

---

## Recommended remediation (priority order)

1. **Port the guardrail tests to es** (root cause). Add es coverage to
   `sub-lesson-density`, `mcq-position-distribution`, plus new es tests for
   "≥1 production step per topic lesson," "no 3+ consecutive selection-MCQ," "no
   adjacent same-type," and "each lesson's tail draws ≥N prior-module atoms."
   This turns the whole audit into a red build and prevents re-drift.
2. **Kill zero-production lessons** — inject one `build`/`translateStep`/`speaking`
   into each of the ~20 recognition-only lessons, prioritizing the ones whose
   skill is inherently productive (m10-4, m15-2, m7-5, m16-4).
3. **Break the MCQ marathons** — same edit as #2 does double duty: a production
   or teach beat between every pair of selection items.
4. **Build a compounding review tail** — port a `pickReviewAtoms`-equivalent
   review pool and append a 2–4 step prior-module tail to each lesson. m16's
   Repaso lessons are the in-repo template.
5. **De-leak the localized prompts** — m4 (drop the "(big)" parentheticals; make
   distractors force reading the carrier) and m9 (test interrogatives in usage,
   not English gloss).
6. **De-robotize carriers** — vary the "— pick the form that fits" / "'X' — pick
   it" frames; give sentences real, varied content.
7. **Phase 2 (spine-deferred, lower urgency):** add a `selfExplain`-equivalent to
   the es engine and land one per grammar-drill lesson; structured grammar cards;
   real two-voice TTS.

Items 1–3 are mechanical and repetitive across the corpus — a strong candidate
for a dedicated editorial/authoring wave (per the standing content-quality flag:
budget a REVIEW/EDIT pass as a first-class phase). The Spanish content itself
should be **preserved**, not rewritten.
