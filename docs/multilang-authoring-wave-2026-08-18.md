# Multi-language authoring wave — research, pipeline, and what to build next

**Status:** RESEARCH + LANDED WORK · **Date:** 2026-08-18
**Scope:** model research for the authoring pipeline · what French costs · what
Spanish needs next · new lesson types · adapting the ja authoring guide to es
and fr · a local-model drafting pipeline that runs in the background under a
thermal cap.

---

## 0. TL;DR

1. **French is an es-shaped module, and the engine cost is ~2k LOC, not ~15k.**
   Measured: es engine = **1,998 LOC**, ko = 7,001, ja = 15,385. The other 20k
   LOC in es is *curriculum content* — which is exactly the part the local
   pipeline exists to draft. `"fr"` is already in the `LanguageId` union, and
   `moduleConformance` is `describe.each(getAllLanguageIds())`, so a registered
   language inherits its identity gates for free.
2. **A live grading bug was found and fixed.** `normalizeTypedAnswer` did not
   fold U+2019, and NFKC does not do it either. iOS and macOS produce U+2019 by
   default. **17,531 English contractions** across the ja/es/ko curricula and
   **zero** smart apostrophes in authored content — so every learner typing a
   contraction on a stock keyboard was graded wrong. Fixed, tested, 70/70 green.
   French is unauthorable without this (elision puts an apostrophe in a large
   share of all typed answers).
3. **The es "make it real" wave is one publish step, not an authoring project.**
   The TTS regen already ran: **1,974 mp3s exist in `lingo-data`**, the shipped
   manifest carries **1,255**, and **719 of 1,879 course texts (38%) are still
   silent in the app**. Both quality gates the 08-09 scope doc asked for
   (`esAudioCoverage`, `esPromptComprehensibility`) **did land**. The audio did
   not get published.
4. **Two new step types earn their place; everything else is a
   parameterization.** `aspect_choice_cloze` (preterite/imperfect, passé
   composé/imparfait — the A2→B1 wall nobody engineers for) and
   `liaison_listen` (nothing in the engine models pronunciation across a word
   boundary). Both are built, registered, fixture'd, and typecheck clean.
5. **The local drafting pipeline now works for Spanish, and it is measurably
   good at the narrow thing it does.** 12/12 grammatical Spanish every run —
   guaranteed by the frame, not sampled — and **Token Miss Rate 0.39%** against
   the EACL 2026 paper's 17.2% baseline / 8.0% controlled result.
6. **The pass rate is still not the quality measure.** A 158-sentence batch
   scored 93% and contained «yo cocino el lápiz» ("I cook the pencil") and «tú
   hablas el teléfono». The fix was to narrow the *inventory*, not add checks.

---

## 1. Models — what changed, and what to do about it

Full sourcing in the research thread; the load-bearing items:

### The finding that would have silently destroyed the pipeline

**Ollama's MLX execution path ignores the `format` JSON-schema parameter.**
[ollama/ollama#16563](https://github.com/ollama/ollama/issues/16563), open since
2026-06-06. An `-mlx` tag returns **200 and prose**. MLX is ~2× faster at decode
([Ollama's own benchmark](https://ollama.com/blog/mlx)) — and taking that trade
would have turned 12/12 into 0/12 with no error anywhere.

**Action taken:** pinned to non-MLX tags; `batch-es.mjs` now aborts loudly after
three unparseable rounds instead of writing an empty corpus. Speed was never the
constraint here — a slot-choice response is ~50 tokens.

### Constrained decoding buys structure, not correctness

The Structured Output Benchmark ([arXiv 2604.25359](https://arxiv.org/html/2604.25359v1),
2026-04-28, 21 models) measured JSON pass rates **above 84% for every model**
against a best *value* accuracy of **80.4%** — a persistent 15–25 point gap —
and found schema-constrained decoding moved value accuracy by **−0.007 to
+0.033**. Essentially nothing.

This is external corroboration of the split this pipeline already runs on, and
it settles a tempting dead end: **tightening the schema further will not buy
more quality.** The frontier judge is load-bearing, not a nice-to-have.

### Candidate local models

Sizes are actual repo bytes, not estimates. All fit 128 GB comfortably.

| Model | Arch | 4-bit | Why |
|---|---|---|---|
| **Gemma 4 31B** | 30.7B dense | **17.65 GB** | Google ships **QAT** weights — trained to be 4-bit, not rounded after. 140+ languages. Led the SOB image track. |
| **Qwen3.8-27B** | 27B dense | **16.05 GB** | Released 2026-08-14. Strongest instruction-following numbers. |
| **Qwen3.5-122B-A10B** | 122B/10B active MoE | **69.6 GB** | **65.9 tok/s vs the 27B dense's 23.6** on this exact machine — 4.5× bigger and 2.8× faster, because decode is bandwidth-bound and only 10B params activate. |

Both currently-installed models are wrong for this work: `shisa-70b` is
Japanese-tuned (and measured at 12.0 tok/s here), `qwen3-coder-next` is a coder.
**Next step: A/B Gemma 4 31B QAT against Qwen3.8-27B on the real slot task.** At
16–18 GB both stay resident simultaneously.

### Mistral and French — the answer is no

Asked directly whether the French lab's open models are better at French. Four
independent lines say no, and one is Mistral's own model card (Ministral 3 14B
Multilingual MMLU **0.742 vs Qwen3 14B Base 0.754**). MMLU-ProX puts the Mistral
family "relatively lower" across 29 languages. **Do not pick Mistral for French
on reputation.** COLE (23 French NLU tasks, 94 models) is the one dataset that
could settle it and its PDF has no extractable text layer — worth a human with a
browser.

Its real finding does matter though: on French specifically, open-weight models
lag closed models by a wide margin. That argues for keeping French drafting
*narrowly slot-constrained* and leaning harder on the judge — which is the shape
already built.

### Judge tier

**Haiku 4.5 with prompt caching and the Batch API**, escalating disagreements to
Sonnet 5. ~**$24 per 10,000 twelve-sentence batches**. The cost spread across
every candidate is $5–$330 per 10,000 — irrelevant at this volume, so pick on
quality. Two design constraints from the 2026 judge literature:
- **Randomize candidate order.** Position bias is measurable; BabelJudge found
  order-consistency near-random (0.480) in the weakest language tested.
- **Judge grammar, not naturalness.** The AIED 2026 GEC study found LLMs strong
  on closed-class grammar (agreement, morphology — our exact failure mode) and
  weak on open-class semantics, and that **73.76% of corrections differing from
  gold were equally valid or preferred.** Do not build a gold-reference
  exact-match gate.

### Verification: use Token Miss Rate, not a CEFR classifier

`TMR = tokens above level / total tokens`, from *Toward Beginner-Friendly LLMs
for Language Learning* (Findings of EACL 2026). Prompting alone fails to hold a
level; their decoding-time control moved TMR **17.2% → 8.0%**.

**Implemented as `scripts/draft/tmr.mjs`. Measured on the first es m8 batch:
TMR 0.39%.**

And do **not** gate on a CEFR classifier: fine-tuned transformer readability
classifiers collapse out of domain, QWK **0.830 → 0.085**
([BEA 2026](https://aclanthology.org/2026.bea-1.52/)). Generated drill sentences
are a different domain from the textbooks those models are trained on. TMR is a
lookup against our own taught inventory, so it cannot drift: the inventory *is*
the domain.

---

## 2. Spanish — what actually landed, and what to do next

Measured against the working tree, not against the 08-09 plan.

| | State |
|---|---|
| Modules | 16 × 8 = **128 lessons**, hand-authored TS, ~20k LOC. No IR. |
| Gates that landed | `esAudioCoverage.test.ts`, `esPromptComprehensibility.test.ts` — **both exist and pass** |
| TTS | **719/1,879 texts (38%) silent in the app.** 1,974 mp3s sit in `lingo-data`; shipped manifest has 1,255 |
| Review lessons | **Not routed.** `REVIEW_LESSON_RE` matches `ja\|ko`, not `es`. No `es-mN-review-*` ids exist |
| Grammar SRS (Track B) | **Absent.** No `es-grammar-points.json` |
| Learner-sim walk | **Never run.** The ja walks found 185 findings / 53 blockers on content that passed its own tests |

**Ranked next actions:**

1. **Publish the audio.** The work is done; only the CDN upload and the manifest
   copy into `src/` are missing. This is the single largest quality delta
   available and it is not an authoring task. *(Outward-facing — needs your go.)*
2. **Run the first es learner-sim walk.** `learnerView.emit.test.ts:244`
   hardcodes `getMockCourse("ja")`. **That one line is the cheapest
   parameterization in the repo** and it unblocks the walk.
3. **Work the two ratchets down.** `MAX_UNCOVERED_TEXTS = 719` and
   `MAX_UNKNOWN_TOKEN_OCCURRENCES = 470` are *debt*, not passes. 229 of the
   unknown-token occurrences are in m1–m6, where a true beginner meets them.
4. **Then** the A2 past-tense tier — the strategic opening, and the reason
   `aspect_choice_cloze` now exists. The conjugation tables already carry
   preterite and imperfect, so its morphology is seeded.

---

## 3. French — what it would take

**French is an es-shaped module.** Same capability set, no script ladder, no
romanizer, no classifiers.

**Reusable with zero engine change:** `agreement_cloze` (the strongest prior
art — its type and view import nothing language-specific), `particle_cloze` for
articles and partitives, `word_image_mcq`, `match_pairs`, `build_sentence`
including its register scaffolds, `translate`, both listening types,
`dialogue_listen`, `self_explanation_mcq`, `accentFold` grading, derived
test-outs.

**Small parameterizations:** `BCP47.fr`, `SPEECH_LOCALES.fr`, the `AccentBar`
char set (13+ chars won't fit es's single row — needs a layout look, not just a
longer array), the `matchPairsFloor` fill branch (returns early unless ja/es, so
FR silently gets no grid padding), `getConjugationGridConfig("fr")`.

**Genuinely new:** `fr/` module files (~2k LOC), a FR elision-variant ruleset, a
per-language `accentPolicy` so `à`/`a` and `ou`/`où` can grade strictly while
ordinary accents stay lenient, a FR TTS emitter and manifest, and the quality
gates — **ported with the first module, not after the sixteenth.** That ordering
is the whole lesson of the es wave.

### The licensing situation is the real constraint

**There is no open, commercially-licensed CEFR-tagged wordlist for French or
Spanish.** FLELex and ELELex are CC BY-NC-SA. UniversalCEFR is CC BY-NC. The
Instituto Cervantes PCIC is all-rights-reserved and is the **highest legal risk
precisely because it is the most tempting** — free to read, and its terms
expressly forbid reproduction.

**Landmines that are commonly assumed free and are not:** Verbiste is GPL-2+ and
Debian applies it to the XML *data* (so the copyleft reaches your conjugation
tables — and both `mlconjug3` and `verbecc` credit it); `fred-jehle-spanish-verbs`,
the most-copied Spanish conjugation dataset, is CC BY-NC-SA 3.0; SUBTLEX-ESP is
CC BY-NC-SA 4.0; spaCy's `es_core_news_*` **model artifacts** are GPL-3.0 even
though the library is MIT; FreeLing is **AGPL**, whose §13 closes the SaaS
loophole.

**Clean stack to build French on:** **Morphalou 3.1** (LGPL-LR, 976,570 inflected
forms), **Grammalecte/Dicollecte** (MPL-2.0), **Lefff** (LGPL-LR), **Lexique 4**
(new in 2026, +34% forms, adds contextual diversity — a better difficulty proxy
than raw frequency), **kaikki.org** wiktextract. Note Lexique and kaikki are
BY-SA and share-alike propagates into a merged database — so use the LGPL-LR /
MPL-2.0 sources for the shipped tables and BY-SA data as an offline ranking
signal only.

**Highest-leverage single action: email UCLouvain/CENTAL about commercially
licensing FLELex + ELELex.** NC does not preclude a separate paid grant, and it
would collapse the largest gap in the French build in one conversation.

---

## 4. New lesson types

The house rule is **parameterize, don't fork**, and it held: of the candidate
mechanics, only two needed new types.

**`aspect_choice_cloze`** — preterite vs imperfect (es), passé composé vs
imparfait (fr). Not `conjugation_cloze`: there the distractor is
*morphologically wrong*, so the learner can win without reading the context.
Here **both options are perfectly formed** and the narrative decides. Graded
per-blank, and every blank shows its discourse reason **even when the learner
got it right** — a lucky guess has learned nothing. This is the A2→B1 wall the
competitive research found unclaimed.

**`liaison_listen`** — the learner hears a French phrase and taps the **gaps
between words** where linking occurs. Genuinely new because nothing in the
engine models a pronunciation that differs from the spelling *across a word
boundary*. «les amis» [le.za.mi] vs «les héros» [le.e.ʁo] — same spelling shape,
opposite behaviour. Silent junctions are authored deliberately: learners
over-apply liaison at least as often as they miss it.

**Deliberately not built:** a French agreement type, a gender cloze, an article
picker, a tu/vous type, accent placement, stress minimal pairs, gender sort,
typed dictation, picture description. All are parameterizations of what ships.

Both new types are pinned in `UNUSED_STEP_TYPES` so the coverage test fails
loudly the moment content adopts them.

### Visual QA — 16 rounds, and it found a shipped dead-end

A visual-polish pass measured both steps against the REAL lesson stage geometry
(desktop 672×579, phone 358×557), transplanting each step root into a box of
that size and reading `scrollHeight − clientHeight` — the stage-fit gate's own
metric — at both widths, both themes, and three states.

What it found and fixed:

- **A hard dead-end I shipped.** `liaison_listen` gated Check on `played`, and
  the play button is disabled when no clip exists — so with a missing manifest
  entry the learner could never leave the step. Check is now gated on
  `canCheck`.
- **Overflow.** Aspect ran 843px against a 557px stage post-Check (+286);
  liaison +178. Both now **0 vertical and 0 horizontal overflow at 1440×900 and
  390×844, light and dark.** Most of the fat was duplication — after grading,
  the corrected sentence already appears twice on screen, so the banner's
  "Correct answer" echo was a third copy.
- **The two defects I predicted in the brief were both real**: the lemma tags
  stacked above each chip pair read as debris and knocked every chip off the
  prose baseline (now inline), and the liaison junction read as a floating
  bordered circle (now a drawn undertie arc slung under the gap — dashed for an
  unclaimed gap, matching the house empty-slot idiom, solid for a claimed link).
- **CTA stability verified by measurement, not eye**: button top is identical
  before and after submit (507 phone / 523 desktop); the banner grows upward
  inside the bottom block.

**Not fixed, and stated rather than buried:**

- **375×667 (iPhone SE) still overflows** — aspect +55/+170, liaison 0/+176.
  The canonical reference `agreement_cloze` is +15/+169 on the same viewport,
  so this is **parity with the existing bar, not a regression**; that viewport
  is `legacy` in the mobile matrix and stage fit is advisory there.
- **No French TTS exists**, so only the audio-missing path could be verified.
  `liaison_listen` needs real recorded clips — browser speechSynthesis does not
  reliably liaise, which means a synthesized fallback teaches the wrong answer.

**Two behaviour changes want your sign-off:** (a) Check is no longer gated on
having played the audio when there is no clip — this is the dead-end fix, and
it does mean a learner can commit without listening in that case; (b) neither
banner echoes the correct answer any more, on the grounds that the graded
sentence above already is the answer key.

---

## 5. The local drafting pipeline

`scripts/draft/` — see its README for the full method.

**The split:** the frame (plain JS) owns all grammar; the local model only
chooses which taught words combine and writes the English gloss; a frontier
model verifies before anything reaches a learner.

**The Spanish-specific change:** a ja frame *concatenates* invariant chunks. A
Spanish frame must **inflect**, so `build()` calls a morphology layer instead of
joining strings. Counter-intuitively this makes Spanish **easier** to draft than
Japanese — more of its grammar is mechanical, so more of it moves into JS where
it is guaranteed.

`verify-morph.mjs` cross-checks all 150 forms against the app's own
`es/conjugationTables.ts`. **Its first run reported 15 mismatches and every one
was the instrument** — the parser read past the end of the array into the
display-labels map. Same lesson as the `ー`-stripping bug: check the instrument
before believing its verdict.

### What the numbers actually say

| | |
|---|---|
| Spanish grammaticality | **12/12 every run** — guaranteed, not sampled |
| Token Miss Rate (158 sentences) | **0.39%** (paper baseline 17.2%, controlled 8.0%) |
| Throughput | 158 unique sentences in **2.5 min**, free, at 80% duty |

**And the pass rate is still not the quality measure.** The 158-sentence batch
scored 93% and contained «yo cocino el lápiz» — "I cook the pencil". The fix was
**not** another check. Per-verb object pools make it *unreachable*: judgment
belongs in the inventory, which is a few dozen decisions made once, never in the
output, which is unbounded.

TMR's single offender was `café` — in the m8 pool, taught at **m10**. A
TEACH-FIRST violation no residual check could catch, because the sentence
containing it is perfectly correct Spanish. TMR is the detector;
`assertFrameVocabIsTaught()` is the fix.

---

## 6. Adapted authoring guides

- [`es-authoring-invariants-pinned.md`](es-authoring-invariants-pinned.md)
- [`fr-authoring-invariants-pinned.md`](fr-authoring-invariants-pinned.md)

Neither is a copy. Roughly a third of the 50 ja invariants concern scripts,
particles, or a morphological politeness ladder that these languages do not
have; porting them verbatim would import rules that cannot be obeyed and hide
the ones that genuinely do not exist yet.

**Each file's §0 accounts for all 50 ja invariants — carried, adapted, dropped
with a reason, or flagged NOT YET APPLICABLE.** That table is the correctness
claim. The most important entries:

- **The ja step-type bans INVERT for es.** ja ships zero `info` and zero
  `phrase_card` and bans `self_explanation_mcq`; es ships all three, and
  `es-quality.test.ts` *requires* ≥2 selfExplains per module. An agent that has
  read the ja pin will try to strip them.
- **Module shape differs and is not negotiable by preference.** ja is 12–15
  lessons with 3 reviews + a challenge; es is 8 (L1–L7 + mastery). Review
  routing does not exist for non-ja languages, so ja's review/challenge
  structure is *unauthorable* in es and fr today.
- **es has no IR.** `moduleCompiler.ts` imports `languages/ja/*` directly. So ja
  inv 38 ("beat order is not step order") does not apply — in es the array order
  *is* the step order.

---

## 7. Running it in the background under a thermal cap

`scripts/draft/throttle.mjs` (governor) · `runner.mjs` (resumable queue) ·
`batch-es.mjs` (oversampling driver) · `bench-thermal.mjs` (measurement).

There is no user-level API to cap the GPU clock on Apple Silicon, so the only
honest lever is **duty cycling**: after a generation of D seconds, sleep
`D × (1/duty − 1)`. `runner.mjs` holds the cycle across a whole queue, not just
within one job, and skips jobs whose output already exists — a run killed by a
closed lid resumes instead of re-burning the GPU.

### Measured (M5 Max, `Mac17,6`, 128 GB)

| run | duty | calls | wall | tok/s busy | tok/s wall | throttled |
|---|---|---|---|---|---|---|
| shisa-70b, 15 min | **0.8** | 221 | 902s | **12.0** | 9.6 | no |
| shisa-70b, 15 min | **1.0 (control)** | 267 | 904s | **11.8** | 11.8 | no |

**The governor is exact** — 0.800 achieved against a 0.8 target, and 0.799 on a
shorter qwen3:4b run.

**And the control says the cap was not needed.** If sustained load were
thermally limiting this machine, the unthrottled run's *busy* tok/s would have
decayed below the capped run's. It did not: 11.8 vs 12.0 is noise, and neither
run made `pmset` record a thermal event. **The 0.8 cap cost 21% throughput and
bought no measurable thermal headroom over fifteen minutes.**

Keep it if you want it for fan noise, battery draw, or headroom while using the
laptop for something else — all real reasons, and the cap is precise. It is set
to 0.8 by default because you asked for 0.8; it is a one-flag change either way.

Caveats stated rather than buried: 15 minutes may be too short for a slow
thermal soak, and `pmset -g therm` records OS throttling events, not GPU clock.
`macmon` (no sudo) would show frequency directly if you want the finer picture.

Also worth knowing: `taskpolicy` and `nice` govern **CPU scheduling and disk
I/O** and have no documented GPU dimension — "taskpolicy throttles inference" is
folklore. And lowering `num_gpu` to shed load is actively counterproductive: it
moves work to the CPU, which is slower *and* draws more sustained power.

---

# Addendum — the m17 wave (same day, later)

## What shipped

**`es-m17` — El pretérito. The first module of the A2 tier**, the arc
`es-authoring-scope-2026-08-09.md` §4 names as the strategic opening. 8
lessons, 154 steps, 29 atoms, drafted by a local model and assembled by script.

A1 (m1–m16) was already complete — 16 modules × 8 lessons, all authored — so
"the rest of Spanish" could only mean A2. That reading is stated here rather
than assumed.

| | |
|---|---|
| Sentence pool | **251 unique**, TMR **0.00%**, cost **$0**, drafted at 80% duty |
| Model-sourced vs frame-filled | 63 of 78 draws came from the pool; **15 frame-filled and named on stderr** |
| Gates | ES suite **23 files / 200 tests green**; `tsc --noEmit` clean |
| Shipped Spanish | 51 texts, 198 tokens, **TMR 0.00%** against the m17 inventory |
| Audio | **8 of 59** audio-bearing texts resolve to a clip — 51 silent (86%) |

## The pipeline got three parts it did not have

1. **`draft.mjs` — a generic slot-choice driver.** The old drivers hard-coded
   one frame's slot names each. This reads them off `frame.slots`, so a new
   module is a frame file and nothing else. French inherits it unchanged.
2. **Coverage mode (`--cover`).** Free-form drafting *clusters*: 60 rounds of
   "choose any combination" produced 84 sentences covering **13 of the 78**
   cells the lessons needed, so 65 fell through to frame-fill and the model
   contributed almost nothing to the file. Pinning one verb per request and
   asking for one pick per person took the pool to 251 and frame-fill to 15,
   in 45 seconds. **Coverage belongs in the loop, not in hope.**
3. **`scripts/gen-es-review-pool.mjs`.** `esReviewPool.ts` said to regenerate
   it with `scratchpad/gen-pool.mjs`, which no longer exists — a generated file
   whose generator nobody could run. It exists now, in the repo, and m17's
   atoms are in the pool.

## Four defects the wave found, all upstream of the output

- **`conjugate("llegar","yo","preterite")` returned «llegé».** Also *buscé,
  *empezé, *almorcé — five taught verbs — and `leer` gave *leió / *leieron,
  and `ver` gave *ví / *vió (RAE: monosyllables take no accent). A module that
  promised to throw rather than guess was guessing. Fixed with the -car/-gar/
  -zar orthographic rules and the vowel-stem y-change; `verify-morph.mjs` still
  passes 150/150 against the shipped tables.
- **«Yo hablé el inglés ayer.»** A language name after hablar/estudiar/aprender
  takes no article. Caught by *reading the generated file*, not by a check —
  and fixed in the frame's inventory, with `m17.test.ts` carrying the ratchet.
- **`moduleIndex("m17")` returned −1**, which reads as "nothing is earlier than
  this" and silently emptied every review draw in the module. It surfaced three
  frames away as a capstone-grid arity error. It now throws.
- **A build tile equal to an answer token.** `buildTileFloor` caught
  `es-m17-4-b-z` handing the learner two «escribimos» tiles for one slot. The
  emitter now throws at generate time instead.

Two of the four (the −1, the missing generator) were **instruments**, not
content — the same class as the three check-defects m8 turned up. That is now
four modules in a row where the measuring apparatus was the thing that broke.

## Two gates fired, and neither was appeased

- **Placement bank**: `moduleConformance` fails the build for an authored
  module with no screener item. m17 got 1 screener + 4 stage-2 items.
- **Prompt comprehensibility**: 470 → 476. The instrument's own `MODULE_ORDER`
  stopped at m16, so every m17 lesson was scored as knowing nothing. Fixing
  that left **3** genuine units, all the English word "preterite" inside
  prompts classified as Spanish because they contain «él/ella». That is the
  instrument mis-reading its input, so the term joined the existing English
  chrome allowlist (which already carries *form / word / sentence*) and
  **`MAX_UNKNOWN_TOKEN_OCCURRENCES` did not move.**

## Full-suite state, stated precisely

**12 files / 13 tests fail. None of them are ES, and none are mine.** They are
`languages/ja/*`, the IR-compiled paths, and the N4-tier assertions —
`mockCourse.test.ts` expects the N4 line to be `['m30','m31']` and finds
`['m30','m31','m32']`. `ir/m32.ir.yaml` was written at 21:01 today, during this
run, by a session that is not this one. m32-neo authoring is in flight in the
same tree.

Before the m17 work: `buildTileFloor` was in that list. After the fix it is
not. That is the only entry this wave was responsible for.

## Not done, and named rather than buried

- **m17 is live on the ES learn map right now.** `buildSpanishCourse()`
  includes any module with a non-empty lesson array, so authoring it shipped
  it. If A2 was meant to be gated behind a flag, that is a change, not a
  setting.
- **86% of m17 is silent.** Build-time regen, ≈$0, but publishing it is a
  deploy and has not been authorised.
- **The IR port for ES was worked around, not done.** `moduleCompiler.ts` is
  2,042 lines that import `JA_COURSE_ATOMS_BY_KANA` and carry romaji and kanji
  beats. m17 is generated hand-TS in the existing ES shape instead. Scope doc
  §8.2 asks the question; it is still open, and every further A2 module makes
  the answer more expensive.
- **m18–m20 are unwritten.** m18 (irregular preterite — fui/tuve/hice, plus the
  -car/-gar/-zar spelling beat m17 deliberately withheld), m19 (imperfect),
  m20 (aspect choice — which is what `aspect_choice_cloze` was built for and
  it still has no content).

---

## Addendum 2 (same day) — es-m18 and the ES IR pipeline

The m17 addendum above describes a module authored by a **hand-written**
assembler script (`assemble-es-m17.mjs`), which could author exactly one
module. m18 is the first Spanish module authored through an **IR**, which was
the outstanding half of the goal.

**What was built**

| file | role |
|---|---|
| `scripts/compile-ir-es.mjs` | the ES IR front door: validates, resolves the frame, emits `curriculum/mN.ts` |
| `scripts/draft/es-ir/assemble.mjs` | m17's assembler with the frame, pool and module id lifted to parameters |
| `scripts/draft/es-ir/templates.mjs` | the lesson SHAPES — `topic` (20 steps) and `free` |
| `src/features/languages/es/curriculum/ir/m18.ir.yaml` | the authored source. Judgment only. |
| `scripts/draft/frames-es-m18.mjs` | the m18 inventory — 18 verbs, tabled complements in both languages |

ES compiles YAML → **TypeScript source at build time**, not YAML → JSON →
runtime interpreter like ja. `ja/moduleCompiler.ts` is 94 KB of Japanese and
the parts that would survive a port are the parts ES already ships as
`grammarHelpers` factories. Trade-offs are documented at the top of
`compile-ir-es.mjs`.

**Measured**

- m18 pool drafted locally at **80% duty**: 83 sentences, 17 rounds, **33 s**,
  2 frame rejections, **$0 of Claude tokens**.
- Compiled output: 8 lessons, 33 atoms, 957 LOC.
- `npx tsc --noEmit` exit 0. Full suite **9738 passed / 1 failed**, the failure
  being the audio ratchet (below).

**Defects found by READING the generated file** — none of which any structural
check would have caught:

1. «Ustedes estuvieron en la playa» → *"You all **was** at the beach"*. The
   frame carried one flat English past form per verb; English "be" is the one
   verb that still inflects for person. Fixed with an `enByPerson` table.
2. «Yo pude ayer» → *"I was able to yesterday"*. `poder` is a modal whose
   complement is an infinitive, and this course has not taught modal +
   infinitive. **Removed from the frame entirely**; m18 teaches its forms at
   form level and the IR says so.

**Defects found by the gates**

3. `getEsCourseAtoms()` stopped at m16 — **m17 shipped without registering its
   atoms**, so its 29 preterite atoms were invisible to the SRS unlock index,
   the match-pairs floor, and the language module's published atom set for the
   module's entire life. Both m17 and m18 are now registered, and the aggregate
   carries a standing warning.
4. `moduleConformance`'s atom check was a hardcoded `/^m(1[0-6]|[1-9])$/` — a
   version stamp that had to be hand-edited per module and had silently gone
   stale. Now derived from `ES_MODULE_ORDER`.
5. `pagué` was registered as an atom with no step ever showing it (caught by
   the module's own atom-coverage guard).
6. A `match` step at template position 17 always collides with the
   `reviewMatch` at 18. The compiler now rejects it **by name** at compile time
   instead of letting vitest report a step index.

**Guards, negative-controlled.** `m18.test.ts` adds four bespoke guards. Two
were verified by injection: «tuvó» (a strong preterite with m17's accent) and
«lleguaste» (the yo-cell respelling carried into another cell) each fail the
intended guard and nothing else. The j-stem guard could not be isolated — a
propagated «dijeron»→«dijieron» regression is caught *earlier* by two existing
import-time assertions in `grammarHelpers`, because the wrong form is already
in a distractor list and collides. It stands as a backstop.

**Open:** `esAudioCoverage` is at **752/719**. m18's sentences have no clips.
The ratchet is deliberately not raised — the gate's own instruction is "regen
the TTS chain, then ratchet down, never up", and the upload needs AWS
credentials.

---

## Addendum 3 — ES m19 authored (the imperfect + the aspect rule)

**Shipped.** `ir/m19.ir.yaml` (596 lines) → `curriculum/m19.ts`, 8 lessons, 29
atoms, registered at all six code points (`EsAtomSource`, `getEsCourseAtoms`,
`ES_MODULE_ORDER`, `ES_PLACEMENT_BANK`, `ES_MODULE_META`, `LESSONS_BY_MODULE`).
Not on the learn map — that is the live-gating decision still owed, same as m17
and m18. `m19.test.ts`: **14 guards, all passing.** `tsc --noEmit` clean. Full
suite **1 failed / 9752 passed** — the sole failure is the ES audio ratchet
(now 825/719, deliberately not raised).

Pool drafted locally at **80% duty: 3 merged cover passes, 251 sentences, 0
rejected, ~135s, $0 in Claude tokens.**

### The design that makes an aspect error unreachable

m19's risk is unlike every previous ES module's: **an aspect error is
well-formed Spanish.** «Siempre hablé inglés» has correct agreement, a real
verb form and a real time expression, and it is wrong. No gate the course owns
can see it, and a residual check scoring aspect after the fact would be
guessing at the one thing the module exists to make certain.

So `frames-es-m19.mjs` **derives the tense from the time marker** rather than
accepting it as a parameter, and throws on a sentence carrying no marker at
all. A drafted m19 sentence physically cannot carry the wrong aspect. This is
the m18 «tuve un perro ayer» move applied to the fact m19 teaches.

The frame **composes on `es_m17`** (same verbs, same complements — only the
ending changes) and **borrows `ir` and `ver` from `es_m18`** for their
complement tables, so «iba» and «veía» get real sentences. «era» does not: its
complement is a bare role noun no frame in this course owns, so it is taught at
form level. Same call m18 made for «pude» — claim the form you can drill
honestly, do not manufacture a context for it.

### Six defects, four of them pre-existing and shipped

Two were found by **reading the compiled output**, which remains the only
instrument that finds this class:

1. **«You always all used to go to the park»** — the marker was inserted after
   word 1, on the reasoning that both languages open with a one-word subject.
   Spanish does; English's `ustedes` is "You all". Now the subject boundary is
   passed in and asserted.
2. **Frequency adverbs placed sentence-finally** — «Tú comprabas el libro
   nunca». Spanish puts them before the verb; English has its own rule and it
   does not match. Markers now carry `esPos`/`enPos`.

Four were **already in shipped or shippable content**:

3. **«el zapatos»** (m17's frame, m17's pool ×6, m19's pool). `esNoun` applied
   gender and not number. m17.ts never happened to draw the cell — luck, not
   design. Fixed with `ES_PLURAL`, plus a guard that makes the *next*
   undeclared plural a build error (verified: injecting «pantalones» stops the
   pipeline).
4. **«He saw television last month»** — shipped in m18.ts:469, in a
   listening-comprehension step where the English *is* the answer the learner
   picks. Not ungrammatical, so nothing could gate it. `ver` now carries
   `enByObject`; m18 recompiled and its 15 guards still pass.
5. **`esPromptComprehensibility`'s `MODULE_ORDER` stopped at m17** — so
   `known(m18)` and `known(m19)` were the *empty set* and every Spanish word
   those modules teach was billed as untaught debt. Same stale-version-stamp
   class as `moduleConformance`'s hardcoded regex, same fix: derived from
   `ES_MODULE_ORDER`. Ratchet **470 → 467**.
6. **`desayunar`** excluded from m19: its English is discontinuous ("had bread
   for breakfast"), so the habitual form composes to "would have breakfast
   bread". Same class as m18's «pagar». All 24 other verbs checked.

### Two pipeline primitives the module earned

- **`want: { tenseIs }`** on a draw. m19's first compile pinned `timeIs` on
  every step and **frame-filled 65 of 65 cells** — a pool fully drafted and
  then fully ignored, because an exact-marker filter almost never matches. The
  author's real claim is "this step must be imperfect", not "use «siempre»".
  65 → 48 → **22** after the fixes below.
- **Cover mode now narrows the OBJECT enum per verb**, not just the verb. The
  prompt already spelled the pairing out in prose; ir and ver still lost all
  ten of their cells, because their complements were not in the global enum at
  all. A value absent from the schema cannot be chosen; a rule in a prompt can
  be ignored. Rejections 10 → **0**.
- **`refresh-pool.mjs`** re-derives a pool's sentences from its current frame
  without redrafting, so a one-line inventory fix does not reshuffle a whole
  module. Used for all three fixed pools (m17: 6 restated, m18: 5, m19: 1).

### Guards, negative-controlled

Four bespoke guards in `m19.test.ts`, **all four verified by injection**:

| control | injected | guard that fired |
|---|---|---|
| A | «nosotros siempre hablamos inglés» | marker/aspect disagreement |
| B | time marker stripped from a sentence | every sentence carries a marker |
| C | atom surface «corrian» | -ía forms are written with their accent |
| D | «iabas», «vías» | regularised irregular in the corpus |

Two things the controls exposed in the *guards themselves*, both fixed:

- The sentence corpus read `audioText`, which only `particle_cloze` carries at
  runtime — so the aspect guard saw four sentences out of ~50 and **passed a
  module with a marker deliberately removed**. It now reads `targetSentence`,
  `targetPhrase`, `transcript` and `acceptedAnswers[0]` as well.
- The blocklist listed one regularised form per verb, and «iabas» slipped
  through *and* looked imperfect to guard 1 (it ends in -abas). Now full
  paradigms.

Removing `era` to test guard 4's first clause trips an import-time assertion in
`grammarHelpers` first. Reported as a backstop, not a verified detector — same
honesty as m18's j-stem control.

---

## Addendum 4 — model A/B: does a bigger local model author better Spanish?

Run 2026-08-18, all local, $0 Claude tokens, every model at `--duty 0.8`.
Task is the real one: `draft.mjs es-m19:m19 --cover --through m18`, one cover
pass, same frame, same schema, same seed order.

### The table everyone asks for

| model | wall sec | kept | rejected | cells | distinct pairs | tense mix |
|---|---|---|---|---|---|---|
| qwen3:4b | 47 | 125 | 0 | 125 | 85 | i:104 p:21 |
| gemma4:31b | 300 | 123 | 2 | 123 | 84 | i:54 p:69 |
| qwen3.8:27b | 152 | 122 | 3 | 122 | 90 | i:82 p:40 |

Read alone this table says "they are all the same, use the fast one." That
reading is right, but for the wrong reason, and the right reason is the useful
part.

**Cells are identical because cover mode makes them identical.** One request per
verb, one pick per person — coverage is a property of the LOOP, not of the
model. A table where every model scores ~123 is measuring the harness, not the
models. Do not quote it as a model comparison.

### The number that actually discriminates

Frame-fill: how many required cells the pool failed to supply, which the frame
then had to build itself. Same 1-pass baseline for both:

| model | frame-filled cells (lower is better) |
|---|---|
| qwen3:4b | **37** |
| gemma4:31b | **52** |

The 31B model is **41% worse** at the only job that matters, at **6.4× the wall
time**.

The cause is visible one column back in the first table. m19 is the imperfect;
the frame pins the tense; gemma still produced `i:54 p:69` — it drifted
majority-preterite on a module about the imperfect. Those preterite sentences
are well-formed Spanish and completely useless here, so they cover no required
cell and the frame builds those cells itself. qwen3:4b's `i:104 p:21` is not
better Spanish, it is better *instruction adherence to a pinned cell*.

### What this means for the pipeline

1. **Do not upgrade the drafting model.** qwen3:4b is fastest, has zero
   rejections, and covers the most cells. On this architecture, model capability
   is not the bottleneck; schema adherence is, and the small model has more of
   it, not less.
2. **This is the "judgment goes in the inventory" thesis, measured.** The
   architecture was built so a wrong sentence is unreachable rather than
   detectable. The consequence — unplanned, and only visible now — is that model
   choice became nearly irrelevant. A pipeline whose quality depends on which
   model you point at it has its judgment in the wrong place.
3. **Coverage is bought with passes, not parameters.** qwen3:4b frame-fill:
   37 (1 pass) → 22 (3 merged passes). Three passes of the 4B model cost ~135s
   and beat one pass of the 31B (300s) by 30 cells. Cheap iteration dominates
   expensive single-shot.
4. **The one axis where scale wins is pair diversity** (27b: 90 vs 85, +6%) —
   how many distinct verb×complement combinations appear. That is a
   *repetitiveness* metric, not a correctness one, and 6% does not buy 3.2× wall
   time. Revisit only if a module's sentences start reading samey.

### Caveat, stated plainly

This is one module, one language, one frame, single-seeded — n=1 per model. It
is strong enough to justify "don't upgrade the drafting model," which is a
decision to change nothing, and not strong enough to justify a claim about these
models in general. The gemma preterite drift in particular could be a prompt
artefact rather than a model property; nobody tried to prompt around it, because
the answer to "should we spend effort here" was already no.

---

## Addendum 5 — adapting the ja guide, and the FR engine's structural core

### The guide adaptation was not a writing task, it was an accounting one

The ES guide opens with a provenance block that states its own contract:

> "If you find a ja section not in one of these three tables, this file is
> incomplete. Say so rather than guessing."

That contract was unenforceable by hand, and it had already failed. The ja guide
gains sections over time (§4a2 arrived 2026-07-28, §4b2/§4c on 2026-07-12,
§4e–§4g on 2026-07-16) and a derived guide quietly stops being an adaptation and
becomes a snapshot. Same failure class as `MODULE_ORDER` frozen at m17, which
let two modules' prompts skip the comprehensibility gate entirely.

So the contract is now a test — `authoringGuideProvenance.test.ts`. It parses
every numbered heading out of the ja guide and requires each derived guide's
provenance block to name it (a child is covered by its parent's ruling; a parent
is not covered by one child). Control-verified: adding a `## 15.` to the ja
guide fails both derived guides by name.

**It found four real gaps in ES**, of which one was substantive:

- **§4b2 `phrase_card` is shelved — an unrecorded deliberate reversal.** ja bans
  the type, and — the part that is not obvious from the names — `vocab()` and
  `phrase()` ARE its constructors. **ES ships 69 `vocab()` call sites.** ES was
  doing the opposite of the parent guide with no entry saying so. The reason it
  is right is worth stating: ja could shelve the type because it had somewhere
  better to go, §13.2's image-MCQ where the emoji IS the introduction, and that
  destination does not exist for ES (the art pipeline is JA-only). Banning
  `vocab()` here would remove an introduction device and replace it with
  nothing. Now recorded as a REVERSED table with a revisit trigger.
- **§4g sentence-complexity floor** — carried, and *upgraded* (below).
- §12 living history, §13 the retrospective parent — mapped.

**FR had no accounting at all** — its §0 was prose about inheritance. It now
carries a two-level ledger: FR takes ES's ruling by default, and the table lists
only where French diverges. Writing it surfaced two findings that prose had
hidden:

- **ja's §4e script ladder is NOT droppable for French.** ES drops it correctly
  (Latin script throughout). But the ladder exists because the written and
  spoken systems come apart and the learner must climb between them — and that
  is exactly French's problem: silent finals, liaison, written-but-inaudible
  agreement. `silent_letter` / `liaison_listen` / `agreement_chain` are the
  French rungs and inherit the ladder's discipline.
- **`stress_pattern` is not a French step type.** It landed in the same wave and
  I had listed it as one. Its `accentRule` enum is `aguda | llana | esdrujula`
  and its worked minimal pair is `hablo` / `habló`. French stress is
  phrase-final and fixed — there is no word-level stress to hear, so a French
  `stress_pattern` step is unanswerable under pin §1. Corrected in the guide and
  in the pin; `fr/grammarHelpers.ts` omits it on purpose and says why.

### §4g: guidance in ja, a gate in Spanish

ja states the sentence-complexity floor and then says of it: *"This is guidance,
not yet a machine gate. No test asserts sentence complexity today."*

Spanish can assert it, because ES sentences are not hand-written — whether a
sentence carries an adverbial is a property of the frame's `slots`, not of an
author's discipline. `esSentenceComplexity.test.ts` reads each module's IR header
for its `frameFile`, imports that frame, and requires every production target
(`targetSentence` / `targetPhrase` / `transcript`) to carry one of that frame's
own time markers. Both the module list (glob over `ir/`) and the marker
inventory (the frame) are derived, so neither can go stale.

**Measured: 145/145 across m17, m18 and m19.** Control-verified by deleting one
marker from m19's frame — 11 targets go unaccounted and the gate fires.

The point is not the current number. It is that a future frame making `time`
optional would be invisible in review, because every sentence it produced would
still be correct Spanish.

### The FR engine's structural core

`fr` is now REGISTERED and deliberately NOT selectable. Registering is what puts
French under the shared gates: `moduleConformance` is
`describe.each(getAllLanguageIds())`, so French is checked from now rather than
from whenever someone remembers. Selectability stays off until
`frAudioCoverage` passes at zero — there is no `manifests/fr.json`, no clip has
been generated, and `liaison_listen`, whose entire content is a sound, would be
unanswerable.

Landed: `fr/courseAtoms.ts`, `fr/grammarHelpers.ts`, `fr/placementBank.ts`,
`fr/module.ts`, the `registry.ts` entry, `BCP47.fr`, `SPEECH_LOCALES.fr`, and
`frEngine.test.ts` (26 tests, every validator's refusal exercised).

**Two divergences from the ES engine, taken now because FR has no modules and
they are free:**

1. **The atom aggregate and placement bank are DERIVED by globbing
   `curriculum/m*.ts`.** ES hand-maintains a list of `...ES_M17_ATOMS` spreads
   and a hardcoded `EsAtomSource` union, and its own comment records the cost:
   m17 shipped without being added, so its 29 atoms were taught and then never
   scheduled. Adding an FR module file IS adding its atoms; a file whose
   `FR_M<n>_ATOMS` export number disagrees with its name throws.
2. **Elision is a property of the ATOM.** `elidesBefore()` derives it from
   spelling and the one unpredictable case, h aspiré, is declared once as
   `hAspire: true`. Callers must never test the first letter themselves, or the
   exception applies in some places and not others.

**The helpers validate at authoring time, and that is the whole design.** The
characteristic French defect is not an ungrammatical step, it is an
*unanswerable* one — a question whose answer cannot be heard, or a link a French
speaker does not pronounce. Those read as correct in every review and fail only
in a learner's ear. So `liaisonListen` refuses a link into an h-aspiré word and
refuses a liaison from a vowel-final word (no consonant to carry it);
`silentLetter` refuses a grapheme split that does not spell its own word and
refuses a silent index pointing at a space (an answer the learner cannot tap);
`genderSort` refuses an item printed with its article and refuses an item that
contradicts its own atom's gender; `aspectChoiceCloze` refuses a blank with no
`reason` and refuses a narrative whose blanks all resolve the same way.

Deliberately not built: the ~20 shared step factories, `fr/conjugationTables.ts`,
the drafting frames, the IR compiler, TTS. Porting the shared factories before a
module exists means guessing the parameter shapes its inventory will want, and
the ES set took two rewrites to settle. `matchPairsFloor`'s FR branch is likewise
blocked on CONTENT, not on the branch: the ES branch pads from the ES atom
registry, and FR's is empty, so a branch added now would pad from nothing.

---

## Addendum 6 — step-view QA, and one tradeoff that is Spencer's call

All six 2026-08-18 step types now have control-verified tests: `silent_letter`
and `agreement_chain` (13 tests, 5 controls) plus `liaison_listen`,
`gender_sort`, `stress_pattern` and `aspect_choice_cloze` (69 tests, 79
controls). Independently re-run: 82 tests pass, `tsc` exit 0.

The control discipline is the point, and it paid twice. It caught a **broken
assertion** in the new tests themselves — `toMatch(/\btext-3xl\b/)` also matches
inside `sm:text-3xl`, so the control fired nothing; rewritten as
`toContain("text-3xl sm:text-4xl")`. And two views turned out to have a real
movement defect that no amount of reading would have found.

### The defect: two views moved the answer key while grading it

`liaison_listen` and `aspect_choice_cloze` both used the `mt-auto` free-space
split, which collapses the instant the post-commit reveal lands. Measured:

| view | movement on submit, before | after |
|---|---|---|
| `liaison_listen` (every junction target) | dy **122.6px** @375×667 · **117.1px** @1280×800 | **0.0 / 0.0** |
| `aspect_choice_cloze` (the learner's own chips) | dy **183.7px**, dx **157.4px** @375×667 | **0.0 / 0.0**, both axes, both viewports |

Reference bar, measured identically: `silent_letter` and `agreement_chain` both
move 0.0px. `gender_sort`'s own source comment records that it rejected the
`mt-auto` split for exactly this reason ("measured 83px at 390x844") — these two
never got the same treatment. Both are now top-anchored, with the CTA keeping
its own `mt-auto`.

### THE TRADEOFF — needs a decision

Fixing the movement **increased post-commit overflow** at 375×667:
`liaison_listen` **26 → 42px**, `aspect_choice_cloze` **20 → 85px**. Both are 0
at 1280×800 and 0 pre-commit at every viewport, and both scroll under a sticky
CTA that does not move.

This trades one tracked problem for another: CLAUDE.md already tracks six step
types overflowing this scroller on a 375×667 phone (B091/B092). The judgement
taken was that *stability while being graded* beats *density while reading*,
because the moving elements were the answer key and the learner's own chips.
**It is a one-line revert per view if the call should go the other way.**

### Stated as unverified, not assumed

- `stress_pattern`'s long-form mid-word wrap. The size step-down, `hyphens-auto`
  and `lang="es"` are unit-tested and control-verified, but no fixture ships a
  long `writtenForm`, so the wrap was never reproduced in a browser.
- **These four types are in no shipped lesson** (`UNUSED_STEP_TYPES`), so
  `?step=N` deep-linking is impossible for them and the house mobile gate
  (`tests/mobile/stage-fit`) never sees them. The measurements above come from a
  reconstruction of the real `LessonShell` stage, calibrated against a real
  lesson on the same viewports — not from the shipped `LessonPage`.
- The mobile Playwright gate and `test:e2e:auth` were not run.

### Judged NOT defects (recorded so they are not re-litigated)

`gender_sort`'s 80px and `stress_pattern`'s 17px post-commit overflow — neither
moves anything, and the only way to reclaim the height is to move the placed
chips, which is the answer. The uniform −1px CTA shift on submit — present on
all six views including both reference siblings; sub-pixel rounding of
`bottom: 10cqh`, inside the house 1px epsilon. Tap targets — zero failures under
WCAG 2.2 SC 2.5.8 across all four views, both viewports, both states.
