# `scripts/draft/` — cheap example-sentence drafting

Draft the `kind: sentence` beats of a module's IR with a local model, for free,
and spend paid tokens only where they buy something.

## The split, and why it is this split

| tier | cost | does | measured on |
|---|---|---|---|
| `frames.mjs` (plain JS) | free | **all Japanese syntax** | grammaticality is guaranteed, not sampled |
| local model (Ollama) | free | picks which taught words combine; writes the English gloss | 12/12 unique in 55s (shisa-70b) |
| `ja-lexicon-judge` agent (Fable) | ~pennies, **once** | classifies the taught inventory into pools | 225 words, reused by every module after |
| main agent (Opus) | expensive | designs the frame; reads a sample | one frame per module |

The load-bearing idea is that judgment is applied to the **inventory** — a few
hundred words, classified once, committed to disk — and not to the **output**,
which is unbounded. A wrong word in a pool is one fix that repairs every module
authored afterwards. A wrong sentence is one fix, forever, for each one.

## Three attempts, measured on this repo's own vocabulary gate

1. **Free-form prompt** listing all 603 taught words → **1 / 12 usable.** Shisa
   writes fluent Japanese and ignores the word list; a model tuned for fluency
   optimises against the one constraint that matters here.
2. **JSON-schema `enum` over every output token** → **0 untaught words, 0
   usable sentences.** 「このアメリカのおいしいケンとたべてみる」 — "delicious
   Ken". Constraining a free-text field to a token list removes the model's
   ability to form a sentence at all.
3. **Slot-filling (this directory)** → **12 / 12 grammatical, 100% unique.**
   Grammar is a JS template, vocabulary is an `enum` per slot, and the model is
   left with the one job it is good at: choosing combinations that mean
   something.

The conclusion from (2) is not "constrained decoding does not work". It is that
the constraint was on the wrong thing.

## Usage

```bash
# 1. Classify the taught inventory (once per band; local model, ~40s)
node scripts/draft/classify.mjs qwen3:4b scripts/draft/semantic-pools.json

# 2. Audit that classification with the ja-lexicon-judge agent, and commit the
#    result. Do not skip this — see "the inventory is the product" below.

# 3. Draft
node scripts/draft/generate.mjs m31                      # human-readable
node scripts/draft/generate.mjs m31 --yaml               # IR beats, paste-ready
node scripts/draft/generate.mjs m31 --model qwen --rounds 5   # faster, blander
```

Requires Ollama on `localhost:11434`. `--model shisa` (default) is slower and
picks markedly better pairings — doctor→medicine, friend→present — where
`--model qwen` produces "I give a boat to a person". Local inference is free, so
oversample and throw away rather than tuning for first-pass yield.

## Adding a module

Add a frame to `frames.mjs`. A frame is: the slot pools each grammatical role
draws from, a builder per variant, and the module's hard rules **expressed as
narrowed pools rather than as validation**.

That last part is the design rule worth keeping. m31's spine states the ban
"あげる cannot point at me (×わたしにあげる)". An earlier version detected it
after the fact and rejected 4 of 8 candidates. The shipped version gives あげる
a receiver pool containing no inside person, so the error is unreachable and the
yield is 100%. Prevention where the rule is mechanical; validation only for what
a pool cannot express.

Japanese is assembled from space-separated phrase chunks — 「この りょうりを
たべてみる。」 — because the build-tile step splits on those spaces. Use the `j()`
helper; never concatenate.

## The inventory is the product

Every hand-written blocklist in this project has leaked, in the same way, four
times: `ー` (U+30FC) read as punctuation so every taught loanword scored as
untaught; a zsh `for` over an unquoted string that silently matched nothing; a
`pos === "noun"` filter that returned zero rows; and a regex object filter that
let `がくせい` through and produced 「ちちは ともだちに がくせいを あげます」 —
"my father gives a student to a friend".

So `semantic-pools.json` enumerates a decision per word rather than matching a
pattern, and it is a committed file so it can be read and checked. When output
looks wrong, fix the pool, not the sentence.

`classify.mjs` gets the easy half right and the world-knowledge half wrong — it
put けいたい (mobile phone) in `person`, marked まど (window) giftable, and
declined to use `portable-object` at all. That is what the Fable audit pass is
for, and why the local classification is a draft rather than the artifact.

## What still needs a human

Nothing in this pipeline checks that a combination is *pedagogically* apt, only
that it is legal and plausible. 「アメリカじんは わたしに シャワーを くれます」
is a grammatical sentence about being given a shower. Read a sample before
pasting into an IR — and when you find one, ask first whether the pool is wrong.

---

## Spanish (added 2026-08-18)

`morph-es.mjs` · `frames-es.mjs` · `inventory-es.mjs` · `generate-es.mjs`

```bash
node scripts/draft/inventory-es.mjs m8     # what the learner has been taught
node scripts/draft/generate-es.mjs m8 --model qwen3:4b --n 12
node scripts/draft/verify-morph.mjs        # MUST pass before trusting a draft
```

### The one structural difference from Japanese

A ja frame CONCATENATES invariant chunks — あげます is あげます whoever the
subject is. A Spanish frame must INFLECT, so `build()` calls into
`morph-es.mjs` instead of joining strings. Agreement and conjugation stop being
things a draft can get wrong.

Counter-intuitively this makes Spanish **easier** to draft than Japanese, not
harder: more of its grammar is mechanical, so more of it moves into JS where it
is guaranteed rather than sampled.

`verify-morph.mjs` cross-checks every form in `morph-es.mjs` against the app's
own `es/conjugationTables.ts` — 150 forms, 10 verbs, present + preterite +
imperfect. Two sources of truth that silently disagree is worse than one that
is wrong: without this check the pipeline can draft a sentence the app will
later conjugate differently in a ConjugationGrid, and the learner watches the
app contradict its own lesson.

> Its first run reported 15 mismatches, all on the last verb. Every one was the
> parser reading past the end of `ES_VERB_ENTRIES` into
> `ES_CONJUGATION_FORM_LABELS`, whose values ("yo (present)") match the same
> key pattern. **Check the instrument before believing its verdict** — the same
> lesson the `ー`-stripping bug taught on the ja side.

### Measured, 2026-08-18 (es m8, qwen3:4b, three runs)

| | |
|---|---|
| Spanish grammaticality | **12 / 12 every run** — guaranteed by the frame, not sampled |
| Passed the frame's residual checks | 8 / 12 |
| Time | ~10s per 12 sentences, free |

**Read the output; do not quote the score.** The first run scored 10/12 and the
honest number was lower, in both directions at once:

- Two "failures" were the FRAME being wrong — «ellos cocinan» and «yo canto»
  are perfectly good Spanish, and the frame only had two transitivity
  categories when Spanish needs three.
- One PASS was «tú trabajas el carro» — "you work the car" — because `trabajar`
  was missing from the intransitive set.
- One sentence the frame BUILT was ungrammatical: «ellos llegan nunca». A
  postposed `nunca` requires a preceding `no`. Fixed by splitting the adverb
  pool by position, which moved the rule into JS where it belongs.

### What the iteration actually taught

Three of the defects found along the way were the CHECKS, not the model:
`ustedes` glossed "You" is correct English and my rule demanded "You all";
«ellos cocinan» is good Spanish and the frame had only two transitivity
categories; a mass noun takes no English article and the rule keyed on the
Spanish determiner. **Residual checks need as much iteration as the content
does**, and a check that fires often is as likely to be wrong as the output.

One was worse than a wrong check — it was a check that never ran. The
gloss-drops-the-adverb rule read `frame.lastFreq`, which no driver ever
assigned, so it was dead code. Wiring it up showed the model omits the
frequency adverb from the English on **12 of 12** sentences, and «yo nunca
descanso» glossed "I rest" is a meaning INVERSION.

The response was not to keep the check. **A defect the model produces every
time is not something to detect, it is something to stop being able to
produce** — so `gloss()` now composes the adverb into the English from the
adverb the frame already placed, and the model supplies only the core clause.
Same division of labour as everywhere else: what we know, we build.

Current state, es m8, qwen3:4b, 12 sentences:

| | |
|---|---|
| Spanish grammaticality | 12/12 |
| Adverb present and correctly placed in the gloss | 12/12 (composed, not sampled) |
| Semantic pairing + article quality | ~6–10/12 |
| Token Miss Rate, 129-sentence batch | **0.00%** |

The residual defect class is **bare English glosses** ("I
study book", "He looks at computer"). That is expected and structural: `en` is
the one field the frame does not build, so it is the one field a check must
police — and it is exactly where the paid verify tier earns its cost.

---

## Thermal governance

`throttle.mjs` · `runner.mjs` · `bench-thermal.mjs`

Long local-inference runs cook the laptop. There is no user-level API to cap
the GPU clock on Apple Silicon, so the only honest lever is **duty cycling**:
after a generation that took D seconds, sleep `D * (1/duty - 1)`. Inference is
a square wave — full tilt or idle — so sustained package power tracks the duty
cycle closely.

```bash
node scripts/draft/bench-thermal.mjs --model qwen3:4b --duty 0.8 --minutes 2
nohup node scripts/draft/runner.mjs jobs.json --duty 0.8 > run.log 2>&1 &
```

### Measured, 2026-08-18 (M5 Max, 12P + 6E cores)

| run | duty | calls | wall | tok/s busy | tok/s wall | OS thermal warning |
|---|---|---|---|---|---|---|
| qwen3:4b, 1 min | 0.8 | 27 | 61s | 141.6 | 113.2 | none |
| shisa-70b, 15 min | **0.8** | 221 | 902s | **12.0** | 9.6 | **none** |
| shisa-70b, 15 min | **1.0 (control)** | 267 | 904s | **11.8** | 11.8 | **none** |

The governor is exact: achieved duty 0.799 and 0.800 against a 0.8 target.

**But run the control before you believe the cap is doing anything.** The
unthrottled run is the interesting one. If sustained load were thermally
limiting this machine, the duty-1.0 run's *busy* tok/s would have decayed below
the duty-capped run's. It did not — **11.8 vs 12.0 tok/s, which is noise** — and
neither run made `pmset` record a thermal event.

So, honestly: **on this machine the 0.8 cap cost 21% throughput (9.6 vs 11.8
tok/s wall) and bought no measurable thermal headroom.** Fifteen minutes of
sustained 70B inference did not throttle it at all. Keep the cap if you want it
for fan noise, battery draw on AC, or headroom while you are using the laptop
for something else — those are real reasons and the governor delivers the cap
precisely. Do not keep it believing it prevents throttling that was measured
not to happen.

Two limits on that claim, stated rather than buried: fifteen minutes may be too
short for a slow thermal soak, and `pmset -g therm` records OS-level throttling
events, not GPU clock. A finer instrument (`macmon`, which needs no sudo, unlike
`powermetrics`) would show frequency behaviour directly. `pmset` only writes a
record when the OS actually throttles, so an empty record is a real negative —
but it is a coarse one.

Levers, ranked by measured effect:

1. **duty cycle** — the only one that bounds SUSTAINED power. Works, exactly.
2. **`num_thread`** — capped to `round(12 * duty)`. Real but small: it governs
   prompt processing, and token generation is GPU-bound and ignores it.
3. **`taskpolicy -b`** — background QoS on the CLIENT process. The heat is in
   the `ollama` server, which we do not spawn, so this is near-zero. Listed for
   honesty, not effect.
4. **`num_gpu` (fewer layers on GPU)** — **do not use this to cool.** It moves
   work to the CPU, which is slower AND hotter per token.

`runner.mjs` holds the duty cycle across a whole QUEUE, not just within one
job, and is resumable: a job whose output file already exists is skipped, so a
run killed by a closed lid does not re-burn the GPU on work already done.

---

## Traps that cost a run each

- **Ollama's MLX path silently ignores `format`.** [ollama/ollama#16563](https://github.com/ollama/ollama/issues/16563),
  open since 2026-06-06. A schema-constrained request to an `-mlx` tag returns
  **200 and prose**. MLX is roughly 2× faster at decode — and taking that trade
  would destroy this pipeline invisibly, because the whole design rests on the
  schema. **Pin non-MLX tags.** Speed is not the constraint here: a slot-choice
  response is ~50 tokens. `batch-es.mjs` aborts loudly after three unparseable
  rounds rather than writing an empty corpus.
- **`think: false` must be set at the API level.** Reasoning models route
  schema-constrained output into `thinking` and return an EMPTY `response`.
  `/no_think` in the prompt is not sufficient, and the symptom looks like a
  broken endpoint rather than a truncation.
- **`num_ctx` defaults low** (2048–4096 depending on version) no matter what
  the model advertises. Set it explicitly or a long prompt is silently cut.
- **Constrained decoding buys structure, not correctness.** The Structured
  Output Benchmark ([arXiv 2604.25359](https://arxiv.org/html/2604.25359v1),
  2026-04-28) measured JSON pass rates above 84% for all 21 models against a
  best *value* accuracy of 80.4% — a persistent 15–25 point gap — and found
  schema-constrained decoding moved value accuracy by −0.007 to +0.033.
  Essentially nothing. This is external corroboration of the split this
  directory is built on: the frame supplies structure, and the paid tier is
  what checks whether the words mean anything.

## Verification, not classification

`tmr.mjs` implements **Token Miss Rate** — the share of emitted tokens above
the learner's level — from *Toward Beginner-Friendly LLMs for Language
Learning* (Findings of EACL 2026). Their result: prompting alone fails to hold
a CEFR level; decoding-time control moved TMR from **17.2% → 8.0%**.

```bash
node scripts/draft/tmr.mjs drafts/es-m8.json m8
```

Measured on the first 158-sentence es m8 batch: **TMR 0.39%**, one offending
token. That token was `café`, which the m8 frame listed in its object pool and
which the course does not teach until **m10** — a TEACH-FIRST violation no
residual check could catch, because the sentence containing it is perfectly
correct Spanish.

TMR is the detector; `assertFrameVocabIsTaught()` in `frames-es.mjs` is the
fix, and it now runs as `node scripts/draft/frames-es.mjs`. A pool validated
against the taught inventory cannot emit an untaught word at all.

**Do NOT gate on a CEFR classifier.** Fine-tuned transformer readability
classifiers collapse out of domain — QWK **0.830 in-domain → 0.085
cross-domain** ([BEA 2026](https://aclanthology.org/2026.bea-1.52/)). Generated
drill sentences are a different domain from the textbooks those classifiers are
trained on. TMR is a lookup against our own taught inventory, so it cannot
drift out of domain: the inventory *is* the domain.

---

# The generic driver (2026-08-18, es-m17 wave)

`generate.mjs` and `generate-es.mjs` each hard-code one frame's slot names.
`draft.mjs` reads them off the frame, so a new module — or a new language — is
a frame file and nothing else.

```bash
# free-form: the model picks any combination
node scripts/draft/draft.mjs es-a2:m17 --model qwen3:4b --rounds 60 --n 20 --duty 0.8

# coverage: one request per verb, one pick per person  ← use this
node scripts/draft/draft.mjs es-a2:m17 --duty 0.8 --cover --merge

# assemble the module (pedagogy lives in emit-es-m17.mjs, not in the model)
node scripts/draft/emit-es-m17.mjs > src/features/languages/es/curriculum/m17.ts
```

A frame implements four things: `slots` (→ the JSON schema), `rules` (prompt
lines that decide whether a combination is good), `build(pick)` (→ `{es, en}`,
throwing rather than emitting Spanish it cannot vouch for), and `check(pick)`
(residual complaints, never grammar). Plus `vocabSurfaces()` so
`assertFrameVocabIsTaught` can run BEFORE a token is spent.

## `--cover` exists because volume is not coverage

Measured on m17. Free-form, 60 rounds: **84 unique sentences covering 13 of the
78 (verb, person) cells the lessons needed.** 65 cells fell through to
frame-fill, so the model contributed almost nothing to the shipped file despite
a healthy-looking pool. Coverage mode — pin one verb in the schema enum, ask for
one pick per person — did **24 requests in 45 seconds, pool to 251, frame-fill
to 15**. Adding rounds would never have fixed it; the marginal free-form round
returns near-duplicates.

Two settings follow from the two jobs: coverage wants the most natural object
for a fixed verb (`--temp 0.6`), free-form wants spread (`1.0`). Same model.

## Report what the model did NOT do

`emit-es-m17.mjs` prints every FRAME-FILLED cell to stderr. A pipeline that
quietly substitutes its own deterministic output for the model's stops being
measurable — the pool looks the same size either way.

## The prompt carries the per-verb object pools

The `object` enum in the schema is global (one enum per slot), so the model can
pair any verb with any object and the frame throws half of them away. Spelling
the per-verb pools out in the prompt took the rejection rate **50% → 0%**. Half
a run is cheaper to save in the prompt than in the schema.

## Traps this wave added to the list

- **`conjugate("llegar","yo","preterite")` returned «llegé».** -car/-gar/-zar
  rewrite the stem before a front vowel (busqué, llegué, empecé), and
  vowel-stem -er/-ir verbs take the y-change (leyó, leyeron, leíste). `ver` is
  irregular in the opposite direction: monosyllables take NO accent (vi, vio).
  A module that promises to throw rather than guess was guessing for five
  taught verbs.
- **A distractor tile equal to an answer token** oversupplies it and fails
  `buildTileFloor`. The emitter throws at generate time now.
- **`moduleIndex` returned −1 for an unlisted module**, which reads as "nothing
  is earlier than this" and silently empties every review draw. It throws now.
- **Read the generated file.** «Yo hablé el inglés ayer» — a language name
  after hablar/estudiar/aprender takes no article — passed every check and was
  caught by eye. The fix went in the frame's inventory, not in a new check.

---

## qwen3.5:122b-a10b-q4_K_M (added 2026-08-20) — the local JUDGE tier

81 GB on disk, MoE with 10B active so it decodes fast (~50 tok/tok-s class on
this machine), vision-capable, pinned to the non-MLX GGUF tag. Three
back-tests against artifacts the paid tier had already judged, all $0:

| task | qwen3:4b | qwen3.5-122B | notes |
|---|---|---|---|
| inventory classification vs audited pools | 58 cat / 25 gift errors | **25 cat / 13 gift** | same harness, 160s for 235 nouns; most residual "errors" are convention calls the pools' own notes admit are judgment (vehicles→other, honorifics) |
| visual QA screening (16 real captures, 8 corrupted-oracle contracts) | not attempted | **recall 8/8, FP 4/8 → 0/7 after prompt fix** | ~2-5s/step; the FPs were tile-count second-guessing + whitespace pedantry — telling the judge "ignore whitespace, a doubt a re-read resolves is not a violation" removed all of them WITHOUT costing recall (re-measured, same cases); handled 本+ほん furigana correctly (haiku's m30 failure mode) |
| ES gloss repair (12 drafted glosses, known adverb-drop class) | produced the defects | **11/12 correct repairs, 0 false corrections** | the 12th was prompt-induced literalism whose note correctly blamed the frame |

Division of labour update: **qwen3:4b still drafts** (schema adherence, speed —
the 08-18 A/B stands). **qwen3.5-122B is the local screening judge and
inventory classifier**; the frontier tier shrinks to auditing ITS output.
Do not switch the visual gate off haiku on n=16 — shadow-run the next module
wave (local judge alongside haiku, compare verdicts) before promoting it:

```bash
# per captured lesson of the wave — writes local-verdicts.json into the
# lesson's artifacts/visual-qa/ dir for comparison with the haiku verdicts
node scripts/draft/judge-visual.mjs qwen3.5:122b-a10b-q4_K_M --lesson ja-m34-neo-1
```

Promotion bar: across a full wave, the local judge misses NOTHING haiku
caught. Back-test mode (`judge-visual.mjs <model> <cases.json>`) re-checks
recall whenever the judge prompt changes — a prompt edit that softens FPs
must be re-measured against the mutation cases before it ships.

### The trap this wave added

**An enum in the schema is not a category list in the prompt.** classify.mjs
relied on `format`'s enum alone; the 122B answered with consecutive-run
garbage (ちち/はは/わたし all "food-drink", カメラ "animal") because it guessed a
label and constrained decoding rammed it onto the nearest enum token —
isolated calls with the categories IN THE PROMPT were 8/8 perfect, and the fix
took the full run 81→25 errors (even qwen3:4b improved 74→58). The schema
constrains structure; the prompt must carry the meaning. Same family as the
MLX/`think` traps above, and found the same way: check the instrument before
believing the verdict.
