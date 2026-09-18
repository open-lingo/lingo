# Judge calibration — 2026-09-17 (lane A5d)

Local LLM judges (Ollama, this Mac) grade lesson naturalness. Prior sweeps
put them at roughly 0.5 precision / 0.88 recall on planted defects after
rubric fixes (project memory: `local-model-stack`), with ES doing much
better (0.94 precision, `qwen3.8-27b-256k` + thinking) than KO/JA (a v1 run
landed ~10% precision on KO/JA, calling standard Revised Romanization
wrong and denying real vocabulary). This lane builds a **measurement**
first — a labelled calibration set + a kappa harness — before touching any
shipped prompt, per Spencer's rule: never quote a pass rate unread, and
every judge change reports kappa on the calibration set before shipping.

## What's being measured

A narrower question than the shipped `judge.mjs` (which grades English
glosses against several rule categories for JA). Here the judge answers ONE
question per row: **is this `<lang>` sentence, as written, natural** —
grammatically correct, idiomatic, no calque, register-consistent? Binary
verdict (`natural` / `unnatural`) against a Sonnet-5-labelled calibration
set, scored with precision/recall/Cohen's kappa (positive class =
`unnatural`, i.e. the defect the judge should catch).

## The calibration sets — and their caveat

`scripts/naturalness/calibration/<lang>.json`, one file per JA/KO/ES/FR, 48
rows each:

- **40 real rows**: sampled (fixed seed, reproducible —
  `extract-sentences.mjs --seed 5d`) from target-language sentences pulled
  out of the *emitted* lesson content at `src/pub/content/v1/<lang>/`
  (`build_sentence.targetSentence`, `dialogue_sim`/`dialogue_listen` lines,
  `translate.acceptedAnswers[0]`, cloze/agreement sentences — see the field
  map at the top of `extract-sentences.mjs`). Each one read and labelled
  `natural`/`unnatural` + a one-line reason by Claude Sonnet 5 (this lane),
  **not a native speaker**.
- **8 planted rows**: a real course sentence, hand-corrupted into an
  unambiguous grammar violation (wrong particle, subject-verb disagreement,
  missing elision, wrong auxiliary, etc.), always labelled `unnatural` at
  full confidence — "wrong by construction." No pre-existing
  naturalness-shaped planted-error benchmark was found in the repo (the
  `scratchpad/judge-bench/` set from 2026-09-13 plants *lesson-level defect
  claims* for a different judging task — "is this judge's claimed defect
  real" — not "is this sentence natural"; its shape doesn't transfer, so
  these 8-per-language rows were constructed fresh for this lane).

**Say this plainly:** these are **model labels, not native-speaker
labels**. Every JA and KO row (real and planted) is marked
`low_confidence: true` in the JSON — Sonnet 5 reads JA/KO well above a
beginner level but is not a native speaker, and the project's own history
here is a warning sign: a prior local-judge run confidently called standard
Revised Romanization wrong. ES/FR rows are `low_confidence: false` (fluent
reading). Treat KO/JA kappa numbers in this doc as a **first-pass estimate
of judge behavior relative to a strong non-native reader**, not a
certified ground truth — the standing to-do (`ja-authoring-next`,
`ko-course-state` memory) to get a native-speaker pass on any of this
still stands.

**A real, load-bearing finding from doing the labelling by hand:** of the
40 real JA sentences and 40 real KO sentences sampled, **zero** were judged
unnatural — both courses have had heavy audit passes already (project
memory: JA m39–m46 triage, KO gates + particle-cue wave). ES and FR, which
have had less walk coverage, turned up real defects on ordinary reading:
gender/number agreement slips (`me duele el mano`, `son caro`), a
subject-verb mismatch (`se lavo`), a wrong auxiliary/participle-agreement
pair (`il est allée`), and one that looks like a straight copy/paste bug
(`je n'habite pas le chocolat` sitting next to the correct `je n'aime pas
le chocolat` in the same lesson). **Consequence for this calibration set:**
JA/KO real-defect recall is untested by construction (no real positives to
miss) — only the 8 planted rows test recall for those two languages, and
those are deliberately easy (obvious breakage, not the subtle single-field
defects — a wrong kanji gloss, a fused-katakana typo, a mis-split tile —
that the 2026-09-13 JA validation showed local judges reliably miss, 0/8
recall). **A perfect kappa on this JA/KO set is a ceiling effect from the
planted rows being easy, not evidence the judge would catch a real subtle
defect.** ES/FR kappa is the more informative number in this report because
real, subtle, naturally-occurring defects are actually in the set.

**Correction (2026-09-18, lane CALIB):** the ES/FR "real defects" paragraph
above is wrong. Reading every one of the 7 flagged sentences (`me duele el
mano`, `son caro`, `se lavo`, `il est allée`, `je n'habite pas le
chocolat`) against their IR/TS source found **six were deliberately wrong
`dialogue_sim` reply options** (`m30.ir.yaml`'s `wrong1: "sí, se lavo las
manos"`; `m22.ir.yaml`'s `wrong2: "sí, soy siempre muy bueno"`; `m13.ts`'s
`wrong-habite: "non, je n'habite pas le chocolat"`; `m16.ts`'s
`wrong-spelling: "il est allée au parc"` — the exact silent-gender pair
that module exists to teach; `m24.ts`'s `wrong-gender: "oui, c'est
ouverte"`; `m5.ts`'s `tuaimes: "oui tu aimes la ville"`), each id-tagged as
a foil testing the learner's discrimination, per `content-change` skill
§6 / project memory "grade answers, not every string." (`me duele el mano`
and `son caro` are separately the calibration set's own *planted* rows —
Sonnet-hand-corrupted synthetic test data, never written into the course —
so they were never candidates to fix either.) The seventh, `sam y Luis
querían ir al cine, por eso hacían la tarea` (es-m25-9), IS a real graded
`build_sentence` target, but is a **defensible imperfect-tense choice**
matching its own paired English gloss ("were doing homework") and the
module's documented design (header: "NO TENSE RESTRICTION ON
«porque»/«por eso»"), not an isolated slip. **Net: zero of the seven were
genuine content defects.**

Root cause: `scripts/naturalness/calibration/extract-sentences.mjs`
sampled every `dialogue_sim` `turn.reply.options[].text`, correct answer
and foils alike, with no filter for `correctOptionId` — fixed 2026-09-18
(now only the option matching `correctOptionId` is sampled). Re-running
the fixed extractor against the full ES/FR emitted content and
cross-referencing by text against the currently-committed (unchanged)
`calibration/{es,fr}.json` found **8 of the 40 ES real rows and 8 of the
40 FR real rows (16 of 80, 20%) were foil-sourced** — most were labelled
`natural` (a wrong-context foil can still read as grammatical) and simply
diluted the "real sentence" pool; only the six named above were also
labelled `unnatural`. **Consequence: the ES/FR real-defect-recall claim
this document makes is untested, the same way it already says JA/KO's
is** — up to 16 of the 80 "real, naturally-occurring" rows a judge was
scored against were never natural-language content the course intended to
teach, they were foils by design. The labelled `es.json`/`fr.json` files
are committed calibration data and were **not** rewritten; a future
re-run/re-labelling of the ES/FR set with the fixed extractor (and a
resulting kappa re-measurement) is open work, not done here.

## The four prompt variants (`scripts/naturalness/prompts.mjs`)

| Variant | What changes | Citation (project review, Testing/QA + Authoring/lexical lanes) |
|---|---|---|
| `baseline` | Today's shape: ask for `verdict` + `reason`, verdict field first in the schema. | — |
| `rationale-first` | Same question, but the JSON schema declares `reason` BEFORE `verdict`, forcing the rationale to be generated first. | rationale-before-verdict prompting lifts judge/human kappa ~0.55→0.75. |
| `binary-checklist` | Decomposes "natural?" into 5 yes/no questions (word choice, particle/agreement, verb form, word order, register) and DERIVES the verdict (unnatural iff any question fails), instead of one holistic call. | binary atomic checklists agree with humans far better than holistic scores (2026 rubric papers) — the same citation backing the procedural-QA set. |
| `fewshot` | `rationale-first` + 5 hand-picked labelled examples per language, held out from the 48-row evaluation set (not reused, to avoid contaminating the score). | few-shot calibration helped Gemma-class models (+11.8 pp) and HURT small Qwen — tracked per model below, not assumed. |

## Models under test

Per `.claude/skills/lane-briefing/SKILL.md` §6 (verbatim, applied via
`kappa.mjs`'s `MODEL_THINK` map): `num_ctx` explicit at 262144 for every
call (never the Ollama 4096 default); `think:false` for the 122B judge
(`qwen3.5-judge-256k`); thinking ON for `gemma4-31b-256k` and
`qwen3.8-27b-256k`; temperature 0.1.

## How to run

```bash
# one combo
node scripts/naturalness/kappa.mjs --model gemma4-31b-256k:latest --lang ja --prompt rationale-first

# a model across languages/variants, sequentially (checks `ollama ps` itself before every call)
scripts/naturalness/run-grid.sh "gemma4-31b-256k:latest" "ja,ko,es,fr" "baseline,rationale-first,binary-checklist,fewshot"

# report table from everything run so far
node scripts/naturalness/summarize-kappa.mjs
```

Results append to `artifacts/naturalness/kappa-<date>.jsonl` (gitignored);
`summarize-kappa.mjs` de-dupes to the latest record per (model, lang,
variant) and prints the table + best-variant-by-kappa per (model, lang).

## Results

Full grid run 2026-09-17: 3 models × 4 languages × 4 variants = 48/48
combinations, each over the full 48-row calibration set (40 real + 8
planted). Raw records: `artifacts/naturalness/kappa-2026-09-17.jsonl`
(gitignored — regenerate the table any time with
`node scripts/naturalness/summarize-kappa.mjs`).

| model | lang | variant | precision | recall | kappa | seconds | planted |
|---|---|---|---|---|---|---|---|
| gemma4-31b-256k | es | baseline | 100.0% | 90.9% | **0.939** | 200.9 | 8/8 |
| gemma4-31b-256k | es | rationale-first | 100.0% | 90.9% | 0.939 | 231.8 | 8/8 |
| gemma4-31b-256k | es | binary-checklist | 100.0% | 81.8% | 0.874 | 466.3 | 8/8 |
| gemma4-31b-256k | es | fewshot | 100.0% | 90.9% | 0.939 | 222.2 | 8/8 |
| gemma4-31b-256k | fr | baseline | 92.3% | 100.0% | **0.946** | 184.1 | 8/8 |
| gemma4-31b-256k | fr | rationale-first | 92.3% | 100.0% | 0.946 | 324.5 | 8/8 |
| gemma4-31b-256k | fr | binary-checklist | 100.0% | 91.7% | 0.943 | 432.1 | 8/8 |
| gemma4-31b-256k | fr | fewshot | 100.0% | 91.7% | 0.943 | 244.8 | 8/8 |
| gemma4-31b-256k | ja | baseline | 100.0% | 100.0% | **1.000** | 161.7 | 8/8 |
| gemma4-31b-256k | ja | rationale-first | 100.0% | 100.0% | 1.000 | 240.1 | 8/8 |
| gemma4-31b-256k | ja | binary-checklist | 100.0% | 87.5% | 0.921 | 637.6 | 7/8 |
| gemma4-31b-256k | ja | fewshot | 100.0% | 100.0% | 1.000 | 228.4 | 8/8 |
| gemma4-31b-256k | ko | baseline | 80.0% | 100.0% | 0.864 | 220.7 | 8/8 |
| gemma4-31b-256k | ko | **rationale-first** | 100.0% | 100.0% | **1.000** | 236.6 | 8/8 |
| gemma4-31b-256k | ko | binary-checklist | 100.0% | 100.0% | 1.000 | 358.8 | 8/8 |
| gemma4-31b-256k | ko | fewshot | 100.0% | 100.0% | 1.000 | 217.8 | 8/8 |
| qwen3.5-judge-256k (122B) | es | baseline | 100.0% | 100.0% | 1.000\* | 32.1 | 8/8 |
| qwen3.5-judge-256k (122B) | es | rationale-first | 100.0% | 90.9% | **0.939** | 47.5 | 8/8 |
| qwen3.5-judge-256k (122B) | es | binary-checklist | 100.0% | 81.8% | 0.874 | 64.1 | 8/8 |
| qwen3.5-judge-256k (122B) | es | fewshot | 100.0% | 90.9% | 0.939 | 43.8 | 8/8 |
| qwen3.5-judge-256k (122B) | fr | baseline | 91.7% | 100.0% | 0.938\* | 33.1 | 8/8 |
| qwen3.5-judge-256k (122B) | fr | rationale-first | 100.0% | 91.7% | **0.943** | 45.8 | 8/8 |
| qwen3.5-judge-256k (122B) | fr | binary-checklist | 100.0% | 75.0% | 0.817 | 62.7 | 6/8 |
| qwen3.5-judge-256k (122B) | fr | fewshot | 100.0% | 100.0% | 1.000 | 40.7 | 8/8 |
| qwen3.5-judge-256k (122B) | ja | baseline | 57.1% | 100.0% | 0.654 | 64.0 | 8/8 |
| qwen3.5-judge-256k (122B) | ja | **rationale-first** | 100.0% | 100.0% | **1.000** | 46.8 | 8/8 |
| qwen3.5-judge-256k (122B) | ja | binary-checklist | 100.0% | 100.0% | 1.000 | 70.4 | 8/8 |
| qwen3.5-judge-256k (122B) | ja | fewshot | 100.0% | 100.0% | 1.000 | 44.0 | 8/8 |
| qwen3.5-judge-256k (122B) | ko | baseline | 60.0% | 75.0% | 0.591 | 42.1 | 6/8 |
| qwen3.5-judge-256k (122B) | ko | **rationale-first** | 100.0% | 75.0% | **0.833** | 40.4 | 6/8 |
| qwen3.5-judge-256k (122B) | ko | binary-checklist | 100.0% | 75.0% | 0.833 | 64.2 | 6/8 |
| qwen3.5-judge-256k (122B) | ko | fewshot | 100.0% | 75.0% | 0.833 | 33.2 | 6/8 |
| qwen3.8-27b-256k | es | baseline | 100.0% | 81.8% | 0.874 | 168.9 | 7/8 |
| qwen3.8-27b-256k | es | rationale-first | 100.0% | 90.9% | **0.939** | 258.0 | 8/8 |
| qwen3.8-27b-256k | es | binary-checklist | 100.0% | 72.7% | 0.804 | 212.0 | 7/8 |
| qwen3.8-27b-256k | es | fewshot | 100.0% | 72.7% | 0.804 | 128.9 | 7/8 |
| qwen3.8-27b-256k | fr | baseline | 83.3% | 83.3% | 0.778 | 166.8 | 7/8 |
| qwen3.8-27b-256k | fr | rationale-first | 90.9% | 83.3% | 0.829 | 190.5 | 7/8 |
| qwen3.8-27b-256k | fr | **binary-checklist** | 100.0% | 91.7% | **0.943** | 274.4 | 8/8 |
| qwen3.8-27b-256k | fr | fewshot | 100.0% | 83.3% | 0.882 | 222.1 | 8/8 |
| qwen3.8-27b-256k | ja | baseline | 100.0% | 100.0% | **1.000** | 216.9 | 8/8 |
| qwen3.8-27b-256k | ja | rationale-first | 100.0% | 100.0% | 1.000 | 246.5 | 8/8 |
| qwen3.8-27b-256k | ja | binary-checklist | 100.0% | 87.5% | 0.921 | 346.3 | 7/8 |
| qwen3.8-27b-256k | ja | fewshot | 100.0% | 100.0% | 1.000 | 218.0 | 8/8 |
| qwen3.8-27b-256k | ko | baseline | 100.0% | 87.5% | **0.921** | 156.6 | 7/8 |
| qwen3.8-27b-256k | ko | rationale-first | 100.0% | 87.5% | 0.921 | 248.5 | 7/8 |
| qwen3.8-27b-256k | ko | binary-checklist | 85.7% | 75.0% | 0.763 | 312.9 | 6/8 |
| qwen3.8-27b-256k | ko | fewshot | 100.0% | 75.0% | 0.833 | 166.9 | 6/8 |

**Bold** = best-by-kappa variant for that (model, lang). `\*` = the record
had missing rows excluded from the metric (see below) — treat that number
as less trustworthy than one with 0 missing, even where it's numerically
higher.

**All 12 (model, lang) pairs clear kappa ≥ 0.6** on this calibration set —
including KO/JA, where prior sweeps on the harder lesson-defect-finding
task saw ~0.1–0.5 precision. Read this together with the ceiling-effect
caveat above: JA/KO have no real unnatural rows in the set, so JA/KO kappa
here mostly reflects "does the judge avoid false-positiving on clean real
sentences" + "does it catch 8 unsubtle planted breaks" — a real but
narrower bar than the subtle single-field defects the project's other JA
audits target.

**A reliability anomaly worth flagging, not modeled by the kappa
number itself:** `qwen3.5-judge-256k` (122B) baseline on ES (9/48 rows
missing) and FR (10/48 rows missing) silently failed to return valid JSON
for entire batches — `kappa.mjs` excludes those rows from precision/
recall/kappa rather than counting them as passes (`computeMetrics`'s
`missing` field, unit-tested), so the reported 1.000/0.938 numbers are
computed on the ~19–21% of rows that DID answer, not the full set. Both
`rationale-first` runs for the same (model, lang) pairs returned 0 missing
rows. This is circumstantial (n=2) but consistent with rationale-first's
schema being easier for a think:false model to fill in without truncating.

**Rationale-first's biggest wins are exactly where the literature predicts
them** (a large model with room to improve, not one already at ceiling):
`qwen3.5-judge-256k`/ja **0.654 → 1.000 (+0.346)** and
`qwen3.5-judge-256k`/ko **0.591 → 0.833 (+0.242)** — both far above the
+0.1 bar. `gemma4-31b-256k`/ko also clears it: **0.864 → 1.000 (+0.136)**.
Everywhere baseline was already ≥0.92, no variant meaningfully beat it
(consistent with a ceiling effect, not evidence the technique doesn't
work).

**Fewshot helped Gemma-class, hurt small(er) Qwen — confirmed on real
data, not just cited:** `gemma4-31b-256k`/ko fewshot = 1.000 (tied for
best); `qwen3.8-27b-256k`/ko fewshot = **0.833, WORSE than its own
baseline (0.921)** — a real -0.088 regression on the identical calibration
rows. `qwen3.8-27b-256k`/es fewshot (0.804) also underperformed its own
rationale-first (0.939) on the same rows. This matches the Testing/QA
lane's citation precisely.

**Binary-checklist is the most expensive variant by a wide margin** (2–4×
baseline wall time — `gemma4-31b-256k`/ja: 637.6s vs 161.7s baseline) and
its only clear win is `qwen3.8-27b-256k`/fr (0.778 → 0.943, +0.165). It
does NOT map mechanically onto `judge.mjs`'s existing schema (see
Decision) — decomposing "is this gloss/sentence OK" into 5 fixed yes/no
questions fits a narrow single-question task like this one, not
`judge.mjs`'s existing 7-category issue taxonomy (gloss/verb-choice/
british/register/structure/unnatural-ja/other) without a real redesign.

## Decision

**`judge.mjs`'s shipped prompt is left unchanged.** Applying the rule
literally: `judge.mjs` only judges **Japanese** content (`ATOMS_FILE` /
`IR_DIR` are hardcoded to `features/languages/ja/...`), and its default
model is `gemma4-31b-256k` (`NATURALNESS_MODEL` env var, unset ⇒ gemma4).
For that actual (model, lang) pair — `gemma4-31b-256k` / ja — **baseline is
already at kappa = 1.000** on this calibration set; there is no room for
any variant to clear the +0.1 bar, and none did (rationale-first and
fewshot tie at 1.000, binary-checklist is worse at 0.921). No change is
justified by the data actually collected for the actually-shipped
configuration, so none was made — per Spencer's explicit instruction this
session ("do NOT change the shipped judge prompt unless a variant already
shows ≥ +0.1 kappa on the rows you have").

**Recorded for the next time `NATURALNESS_MODEL` is pointed at the 122B
judge for a JA (or KO) sweep** (the project's own history has done this —
see `local-model-stack` memory): `rationale-first` (schema field order
`reason` before `verdict`, everything else identical to `judge.mjs`'s
current shape) lifted `qwen3.5-judge-256k` kappa by **+0.346 on JA** and
**+0.242 on KO** on this set — a large, mechanically trivial change
(reorder two JSON-schema property declarations) if that model is used
again. This is a recommendation, not an applied change, because it isn't
what `judge.mjs` ships with today.

**Binary-checklist and fewshot are not recommended as `judge.mjs`
defaults even where they won**, because (a) binary-checklist doesn't fit
the existing multi-category schema without redesigning it, wasn't asked
for here, and costs 2–4× the wall time for a comparable or worse kappa in
most cells; (b) fewshot actively hurt `qwen3.8-27b-256k` on two of four
languages, so it is not a safe universal default — per-model behavior,
exactly as the citation warned.

## Time budget

Each (model, lang) pair's 4-variant sweep: `gemma4-31b-256k` averaged
~17–29 min per language (mildly over the 20-minute guideline on
`binary-checklist`'s slower calls; not stopped because the run was already
committed to completing when this was noticed — flagged here rather than
silently absorbed). `qwen3.5-judge-256k` (think:false) was dramatically
faster, 32–70s per call, ~2–4 min per language for all 4 variants.
`qwen3.8-27b-256k` fell in between, ~10–20 min per language. Total wall
time for the full 48-combination grid: roughly 2.5 hours, run entirely
sequentially (`kappa.mjs`'s `waitForModelSlot` checked `ollama ps` before
every call; no lane collision observed). One mid-run failure: `kappa.mjs`'s
original 50-row single-batch default hit Node's undici 300s
headers-timeout on a slow `binary-checklist` call — fixed by dropping the
default batch size to 20 and adding a one-retry-then-report-missing path
(both committed; see `kappa.mjs` history).

## The rule going forward

**Every judge prompt change reports kappa on the calibration set before
shipping.** If a variant beats the shipped baseline by ≥0.1 kappa for a
given model, that becomes the model's default (`judge.mjs --prompt`,
default unset = baseline unless overridden here); otherwise the shipped
prompt is left alone and this doc says so explicitly rather than shipping
a change nobody measured. Re-run `kappa.mjs` on this same calibration set
any time `judge.mjs`'s `SYSTEM_PROMPT` or schema changes, and append the
new numbers to this table rather than replacing it, so the trend is
visible.
