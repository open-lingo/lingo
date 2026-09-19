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
