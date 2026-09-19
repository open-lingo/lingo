# Mechanical authoring for PT — frames × classes × collocation, model as judge (2026-09-18, Fable)

Spencer's thesis (2026-09-18 late): "language is very mechanical, that's why mad-libs work; further word
classifications let us pull words mad-libs style; the agent only gets a small list of adverbs and
connectors; they keep pulling words until they get one that is coherent." This doc records the evidence
gathered the same night and the design that follows from it. Companion: `docs/pt-spine-2026-09-18.md`.

## 1. Evidence

**Raw mad-libs (frames × bank, ranked by word frequency only)** — spike on m1 G3 «SUBJ ter ART NOUN» and
G5 «gosto de X»: top candidates were «Eu tenho um tempo», «Eu gosto de pai», «Eu gosto de problema».
Grammatical, gender-correct, and wrong. Frequency of a word says nothing about whether it fits the slot.
Nonsense rate ≈ 1/3 at 24 nouns; it grows with the bank.

**Collocation from the free Brazilian corpus** — OPUS OpenSubtitles2018 pt_BR mono (2.1 GB gz, 60 M lines
streamed; `scripts/lexical/pt/build-ngrams.py`; tables in `artifacts/lexical/pt/{bigrams,trigrams}.tsv`,
count ≥ 10; full tables in `lingo-data/`). What follows each verb frame IS the slot class, ranked:

- `tenho um` → encontro, plano, problema, amigo, filho, trabalho, compromisso, presente, emprego
- `tenho uma` → ideia, pergunta, coisa, surpresa, reunião, proposta, filha, mensagem, vida
- `gosto de` → você, ser, pensar, fazer, ver, ficar, falar, trabalhar
- `vou para` → casa, lá (+ article forms → o/a + place)
- `estou` → tentando, falando, fazendo, feliz, cansado, pronto, trabalhando (state adjectives + gerunds)

**Scoring the same spike by weakest-link trigram count** (accept ≥ 200, judge 20–199, discard < 20):

| frame | candidates | accept | judge | discard | what the discard band caught |
|---|---|---|---|---|---|
| G3 ter | 96 | 57 | 21 | 18 | «um filha», «um pizza» (agreement), «tenho um hospital», «tenho um café» |
| G5 gostar de | 36 | 7 | 22 | 7 | «gosto de gato / casa / carro / amigo / tempo» |

«Eu tenho um tempo» landed in the judge band (73), as designed. Known metric weaknesses to fix in the
build: raw counts favour frequent words («gosto de família» 619 vs «gosto de música» 126) — use an
association score (count / √unigram) alongside the count; and the bare-noun-after-`de` pattern needs
4-gram context to see the article («gosto **da** minha família»).

## 1b. Tests run 2026-09-18 late (all re-runnable: `scripts/author/pt/mech/prove.py`, `candidates.py`)

| # | test | result | verdict |
|---|---|---|---|
| 1 | weakest-link trigram bands, hand sentences vs random fills | hand 6/28 accept; random 60/200 accept | FAIL — proper nouns and clause boundaries zeroed real sentences |
| 1b | backed-off LM (stupid backoff, wildcards for proper nouns, clause split) | hand 24/28 accept, 1 discard («olá! Eu sou Sam»); random 183/200 accept | fluency only — does NOT discriminate slot nonsense |
| 2 | slot PMI vs the frame (`tenho um`, `tenho uma`, `gosto de`, `vou para`, `estou muito`) on known fillers vs 40 random words | recall 0.86–1.00, false accept 0.00–0.10 | PASS — this is the discriminator |
| 3 | article context after `de` / `para` | «gosto de música» 126 > «da música» 78; «da minha família» 348 > «de minha família» 30; «para o hospital» 2533 vs bare 2 | PASS — the tables see the article |
| 4 | word tracking: exposure + graded-position ledger per atom across m1 from the emitted JSON | found the 3 L1–L3 words the L6 checkpoint never recalls (Califórnia, onde, país); 0 cold words | PASS — "due for recall" is mechanical |
| 5 | mad-libs author: blank content words in the 28 hand sentences → typed frames | 27 frames; refill yield 24 % naive, 12 % governor-aware, and the governor-aware passes read as real sentences | PASS with the governor fix |
| 6 | verb–object slot (`assistir pizza`) | pair PMI on verb→object removed all 3 nonsense pairings | PASS |
| 7 | local model (gemma4-31b, raw JSON mode) as classifier / judge | JSON looped/truncated; 0 usable classification rows; judge parsed 8/20 + 10/20 | NOT PROVEN — use the existing rubric harness (`claude-local judge`), not a raw prompt |
| 8 | end-to-end: Sonnet arranges L3 + L5 from the candidate lists (pick-from-N, seeded dialogue), Opus grades vs hand | lane PTMECH running | pending |

Lessons: (a) frequency ≠ fit; the frame decides. (b) Score every slot against its GOVERNING verb + article, not
the two words before it. (c) The LM is a fluency gate for connectors/articles, never the coherence gate.
(d) Frames can be harvested from any hand-authored course by blanking — ES/FR/JA have thousands of sentences.

## 1c. End-to-end grade, wide arm (PTGRADE3, Opus, 4 calls / 76k tokens / 4 min)

Hand 62/70 vs mechanical-wide 37/70 (L3 32 vs 20, L5 30 vs 17). The SENTENCES were not the problem — every
graded sentence came from the ACCEPT band and 7 of 8 errors are generator- or arrangement-side:
- generator: hollow one-word debut cards («Tenho.», «Tem.», «Gosta.») from the contrastSet debut role; the
  agreementLit segment missing its leading space («umgato» — same defect as round-2 L3); the contrast MCQ prompt
  prints its own answer and pads with «olá»; identical sentence in consecutive steps (listen→cloze, speak→build);
  sim with a generic 💬 scene and no per-turn explanation; a listen prompt glossed as a question.
- arrangement (model): «falar» never debuted before being graded; the -ar/-er/-ir preview absent; object-less
  «gosto de falar»; untaught Pedro/ela in options (subject list defect, fixed).
- candidates: only 4-word frames for L3, so no build sentence reached the 5-tile floor without the debut tag.
Conclusion: with the sentence layer mechanical, the step-builder is now the quality ceiling → PTTOOL5 list below.

**PTTOOL5 (generator):** no bare-form phrase cards (debut a contrast form inside a ≥3-word sentence); agreementLit
segment spacing; contrast-MCQ prompt never names the answer, distractors from the contrast set only; no identical
sentence on adjacent steps (rotate sentences across roles); sim scene/emoji + explanation per turn from the spine
scene; grammar-point coverage check (every contrastSet member graded ≥2 steps, every taught verb ending gets a
cloze); listen prompts keep the source sentence type. **Candidates:** add 5–7-word compound frames per lesson;
mark debut-eligible rows; require every lesson word to appear in ≥1 ACCEPT row or report the gap.

## 1d. Narrow-brief arms (2026-09-19 00:xx) and what they proved

| arm | brief | calls | tokens | min | gate |
|---|---|---|---|---|---|
| wide-EN | skill + pack + design doc, 30-call cap | 38 | 145k | 10.0 | PASS |
| narrow-EN (first) | one prompt + assemble + run.sh | 8 | 76k | 2.4 | FAIL — runner hid the generator error |
| narrow-EN (fixed) | same, runner prints errors, prompt carries build rules | 10 | 106k | 5.7 | PASS (4 attempts L3, 2 L5) |
| narrow-PT (first) | Portuguese instructions, pre-fix prompt | 11 | 87k | 3.7 | FAIL — tile floor |
| narrow-PT (fixed) | Portuguese instructions | 11 | 106k | 5.8 | FAIL at cap — answer floor, uses/allow |

Every retry in every arm was a SCHEDULING constraint the generator enforces after the fact: build ≥5 tiles unless
debut, ≥3 graded positions per lesson word, function words in `allow:` not `uses:`, contrast-set members each
clozed, no adjacent identical sentence. None of these needs language judgment. **The arrangement is a set-cover
problem**: choose 8–10 candidate sentences such that every role is filled and every lesson word reaches its
floor — solvable mechanically (greedy or ILP over the candidate list) BEFORE any model call. The model then gets
an arrangement that already passes, and its residual job is: judge-band sentences, glosses, the dialogue, the why
line. Expected: first-try PASS, 1–2 calls, ≈25–30k tokens, and the prompt-language question becomes testable on
quality alone (both PT arms died on scheduling, not Portuguese).

## 1e. Mechanical arrangement (2026-09-19 ~01:00) — PASS with zero model calls

`scripts/author/pt/mech/arrange.py` (greedy set-cover over the ACCEPT band: roles + ≥3 graded positions per lesson
word + contrast clozes) and `arrange-loop.py` (run the generator and the checker, parse the one error line, apply
the mechanical fix it names — add a sentence using the short word, insert a spacer of another role, tag a debut,
move a function word to allow —, repeat). L3: PASS in 3 rounds (9 sentences); L5: PASS in 2 rounds (9 sentences).
Dialogue and `why:` were borrowed from the narrow-EN Sonnet run; everything else is mechanical. Model tokens for
the sentence layer: 0. Remaining model job per lesson = dialogue (3 turns) + why line + gloss check of ~10 lines.
Known quality gaps to put into the arranger's objective (not the model's): penalise frame reuse (L3 chose three
«… e um/uma …» compounds), prefer subject/noun diversity, first gloss only for multi-gloss words.

## 1f. Grades (Opus, narrow brief ≈4 calls / 80k each)

| version | L3 | L5 | total | model cost to produce |
|---|---|---|---|---|
| hand (shipped) | 32–34 | 30–32 | 62–66 / 70 | 14–20 min + 52–90 calls per lesson |
| wide Sonnet arm | 20 | 17 | 37 / 70 | 145k tokens, 38 calls, 10 min |
| narrow Sonnet arm | 21 | 18 | 39 / 70 | 106k tokens, 10 calls, 5.7 min |
| mechanical arrangement + borrowed dialogue | 18 | 13 | 31 / 70 | 0 tokens for sentences (dialogue reused) |

Both graded machine versions lose the SAME way: ≈60 % of lost points are generator-side (phrase cards from bare
forms, MCQ prompt containing its answer, cloze options from a pool instead of the contrast set, `meaningEn`
leaking into sentence glosses, empty/template `why`, adjacent duplicates, no intro scheduled for a verb whose
first appearance is graded) and ≈40 % arrangement-side (one sentence in five roles, «você» declaratives chosen
as statements, the blandest sentence as the win line, dialogue turns whose keyed answer does not answer the
prompt, an off-syllabus cliffhanger seed). Grader's own estimate: generator fixes alone lift a machine lesson to
≈52/70; the rest is arranger objective (diversity, question-shape for você, richest first-person line as win)
and a dialogue the model must actually write against the question asked.

### PTGRADE5 read-out (mechanical arrangement, 31/70)
10 of its 13 deduction classes are the same generator defects as the two Sonnet arms (bare-form phrase cards,
template `why`, `meaningEn` concatenated into sentence glosses, off-domain image distractors, grammar paragraph
as MCQ stem, listen floods with sibling answers as distractors, adjacent duplicates, graded step accepted as a
debut, no step type for um/uma / de / -ar-er-ir, atom metadata not shared across files). The 3 arrangement
classes: sim options not checked for "exactly one answers the goal", sim replies not responsive to their turn,
«você» declaratives picked as drill sentences. Also: the arranger let irmã/pizza debut inside a graded build (the
loop only repairs the first word the checker names) and picked a five-step negation run — both objective terms.

**Decision (Fable, 2026-09-19 01:30):** the machine path is blocked on the step builder, not on the model or the
sentences. Order of work: (1) PTTOOL5 generator fixes (§1c list + the 10 above); (2) arranger objective: frame
diversity, no «você» declaratives as statements, debut-eligible intro step for every lesson word before any graded
use, no same-kind runs > 2, recall quota for consolidation lessons, win = richest first-person line; (3) the model
call shrinks to dialogue + why + gloss check, with a mechanical "exactly one option answers the goal" check on the
sim; (4) re-grade. Targets: ≥52/70 after (1), ≥60/70 after (2)+(3). Then the prompt-language experiment reruns on
the dialogue task alone.

## 1g. Pass 3 — the model call is dialogue-only; model × prompt-language × deliberation (PTGRADE6, Opus, dialogue + why only, /60)

Same pass-2 arrangement under every arm; only the sim and why differ. Prompt ≈430 words, ≤4 calls.

| arm | tokens | calls | min | L3 | L5 | /60 | grader's one line |
|---|---|---|---|---|---|---|---|
| hand (A) | — | — | — | 28 | 28 | **56** | scenes named, per-turn explanations, distractors drawn from OTHER grammar the learner owns |
| Sonnet, EN prompt (B) | 57k | 3 | 1.5 | 19 | 19 | 38 | clean but a drill with a speaker name on it |
| Sonnet, PT prompt (C) | 59k | 5 | 1.6 | 21 | 19 | 40 | most spoken openers; one real error (dropped «de» in «gosto de pizza, não música») |
| Opus, EN prompt (D) | 53k | 5 | 2.0 | 20 | 20 | 40 | cleanest Portuguese, but both wrong options start with «Bia» in 5 of 6 turns (positional tell) |
| Sonnet, EN + "think at length" (E) | 65k | 5 | 2.5 | 25 | 24 | **49** | the only arm that writes a conversation: t3 repeats back what the learner built; distractor types vary |

Findings. (1) The deliberation instruction is the strongest lever: +9 points for +12 % tokens. (2) Prompting in
Portuguese buys openers and register (+2) but introduced the only grammatical error; keep it, gate it. (3) Opus
was cheaper in tokens than Sonnet on the same prompt and error-free, but not better at the conversational moves;
on a 430-word task the extra reasoning has nothing to reason about. (4) 8 of every arm's 11–18 missing points are
the template `why` — the arms' own why lines never reached the IR because the generator overwrites them (PTTOOL5
item 2); with that fix the grader expects E "within a couple of points" of hand. (5) Reasoning effort cannot be
set per subagent call from the session; E approximates it with an instruction. A real effort level needs an agent
definition (loads at session start).
Decision: model call = Sonnet with the deliberation instruction, Portuguese-language prompt, mechanical sim-check
gate (vocab, one responsive option, tiles, goal ≤ 8 words, and a «gostar … não <noun>» dropped-de lint); Opus stays
the grader. Re-grade whole lessons once PTTOOL5 lands.

## 1h. Passes 1–3 together, full-lesson grade (PTGRADE7): hand 62/70, final pipeline 35/70 — NOT moved

Despite 11 builder fixes, an arranger objective and the best dialogue arm, the whole-lesson score stayed in the
31–39 band. The grader's list is the NEXT layer of template defects, most of them in Fable's own mech scripts:
- gloss composition: "to watch movie" (no article/plural repair) at six surfaces — `candidates.py`;
- transitive verbs used object-less («Bia gosta de assistir») and promoted to map/phrase/speak — frame library needs
  a transitivity class (assistir, comer, ter need objects in these frames);
- odd-but-grammatical carriers («Você tem uma família?», «tem uma família») — needs a "said-as-such" filter:
  score the whole clause against the corpus (4-gram or exact-clause count), not only the slot;
- `why` is one string per contrast pair applied to both clozes (assemble.py puts the model's why into `note`) —
  needs a per-blank why (tenho-why vs tem-why);
- buildLit ships zero distractor tiles; listenCompLit distractors not matched by person/sentence type;
  imageMcq pool still off-field (atoms carry no `class` yet); phrase/speak/win emit the same sentence under
  different tags (dedupe only covers adjacent steps); a 'debut' on an audio-only listen step does not count.
What DID change: every new builder rule was absorbed by the loop mechanically; the model call is 66k tokens per
lesson and passes its own gate; nothing in the sentence layer needs a model. What did not: the blind grade,
because each grade exposes the next ten template defects, and the hand lessons sit at 62–66.
Honest read (2026-09-19 03:20): the machine path is a long tail of template quality. Two ways forward — (a) keep
fixing templates ten at a time, ~1 grade per pass, probably 3–4 more passes to reach ≥52; (b) invert: hand-author
sentences + dialogue (the 14–20 min lane, 62–66/70) and keep the mechanical layer as GATES + candidate
suggestions, which already removes the agreement/slot/scheduling errors from hand work. (b) ships module 2 next
week; (a) is the investment for modules 3+. Spencer decides.

## 1i. Hybrid pass (2026-09-19 03:00): the model writes the whole spec, the machine gates it — 47–56/70

Spencer's call after §1h: one more test suite, then the best method for m2–m4. The hybrid inverts §1e: a narrow
≈900-word prompt (`mech/write-prompt.py`: spine row, vocabulary walls, the checker's rules, output shape) and the
model writes sentences + dialogue itself; `mech/verify.sh` = `spec-lint.py` (vocab walls, roles, debut-on-cloze,
build floor, duplicate keys, LM gibberish floor, dialogue shape, `--fix-allow`) → generator + check.sh in scratch →
`sim-check.py --spec`. Four arms on m1 L3+L5, blind Opus grade (PTGRADE8, same rubric as PTGRADE7):

| Version | L3 | L5 | /70 | calls | tokens | repairs by lead |
|---|---|---|---|---|---|---|
| A hand | 34 | 32 | **66** | — | — | — |
| D Opus, EN prompt, 15 corpus suggestions | 28 | 28 | **56** | 9 | 116k | 0 |
| E Sonnet, EN, no suggestions | 24 | 28 | 52 | 13 | 111k | 2 |
| C Sonnet, PT prompt, suggestions | 24 | 26 | 50 | 12 | 84k | 4 |
| B Sonnet, EN, suggestions | 23 | 24 | 47 | 12 | 134k | 3 |

Read: the blind grade moved from the 31–39 band (§1f–§1h) to 47–56. Opus is both the best writer (+4 over the
next arm, most idiomatic Portuguese, the only arm that blanked um/uma) and the cheapest lane (no repairs).
Corpus suggestions did not help Sonnet (47 with vs 52 without). The residual vs hand (66) is now mostly
generator-side and shared by every arm: twin phrase debut cards (FIXED: one card, both atoms), `why: ""` on
non-contrast clozes (FIXED: per-sentence `why:` passes through), article pair never blanked (prompt rule added),
third-person statements as learner replies (prompt rule added), imageMcq pool without an animal, listen distractors
lifted from other steps' glosses (open). Arm failures the lead repaired mechanically became tooling: invented `win:`
(prompt forbids), cliffhanger quoted verbatim (prompt paraphrases), closed words not in `allow:` (`--fix-allow`),
duplicate top-level keys (lint), identical listen distractor sets (scheduler repair converged — fixed + test).
**Decision: m2–m4 are written by Opus lanes, EN prompt, no suggestions, one lesson per lane, `verify.sh` as the
gate, spine v2 (8-word cap enforced).** Cost per lesson ≈ 116k tokens / 9 calls / ~10 min.

## 2. The pipeline

1. **Classification, once.** Bank rows (`scripts/author/pt/data/pt-wordbank.json`) gain `classes`:
   nouns {person, kin, place+article, place−article, food, drink, possession, activity, time, abstract},
   verbs {object class, preposition, motion, state}, adjectives {state→estar, property→ser}, closed adverb/
   connector lists by function. Bootstrapped from `scripts/author/pt/data/slot-classes.json` (the corpus
   answer for 18 A1 frames), completed by ONE model pass over the 2,500 lemmas in batches of 200 (~30k
   tokens), reviewed by Fable for the top 300.
2. **Frames per grammar point** (G1–G24 in the spine), 2–4 each, typed slots, agreement filled from the
   bank + the spine's verb cells; compound frames = two same-subject frames joined by a connector.
3. **Draw until coherent.** Candidates = frames × lesson-allowed words (spine + taught set), scored by
   rank × collocation × spine bonus (unlocks a §2 phrase); accept above the high bar mechanically,
   discard below the low bar mechanically, send only the middle band to the judge; redraw against any
   role/coverage constraint (needs a `na` build sentence, needs the contrast sibling) instead of rewording.
4. **One judge call per lesson** (Sonnet, or the local gemma/qwen judge at zero cost with Sonnet
   spot-checks): ~40 scored candidates with composed glosses → keep/reject with a reason, gloss fixes,
   the 3 wrong sim replies, the why lines. ≈ 8k in / 2k out.
5. **Rejections become flags.** Every reject reason («tempo takes no article here») writes a class flag
   on the word, so the judge band shrinks module over module.
6. The existing generator + `check.sh` + blind grade are unchanged. Dialogue stays written (short) — it
   is the retention hook.

## 3. Numbers

| | today (spec-first Sonnet lane) | mechanical + judge |
|---|---|---|
| tokens / lesson | ~100k (orientation + check loops) | ≤ 20k (one call + one retry) |
| wall / lesson | 2–5 min | < 1 min generate + 1 judge call |
| prompt size at m8 | grows with the taught list | constant (candidates only) |
| nonsense reaching the gates | agent-dependent | discard band removes agreement + slot errors for free |

## 4. Build plan (≈ 1.5 days)

- Fable: frame library G1–G24 (~10 min/point), class review (30 min), scoring thresholds.
- Sonnet lane PTFRAMES: candidate generator + scorer + judge-call + `classes` bootstrap script; proof on
  m1 L3 + L5 against the shipped hand lessons (nonsense rate, tokens, blind grade), then m2 L1 from the spine.
- Same machinery ports to ES/FR unchanged (Romance classes); JA/KO swap agreement for particle tables.
