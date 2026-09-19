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
