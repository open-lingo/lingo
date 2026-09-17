# Procedural QA — the question set, its tools, and how to use it

**Status:** LIVE · **Author:** project-review lane A7, 2026-09-17

Spencer's directive (`docs/tile-shrapnel-2026-09-17.md` §5b): before any further
authoring or content QA, agents work through a **procedurally fed question
set** — one question at a time, waited-for and graded yes/no, with a **tool**
behind every question rather than the model's memory. 2026 rubric-scoring
research backs this: binary atomic checklists agree with human judges far
better than holistic scores (`docs/project-review-2026-09-17.md` §2,
"Authoring/lexical"), and Duolingo runs deterministic structural gates before
any model or human review.

This doc is the protocol, the Q1–Q10 table with its tool per question, the
measured precision numbers, how to add a question, and what a lane must run
before submitting a lesson.

---

## 1. The protocol

1. Load the runtime JSON for the lesson/module under review (never IR/YAML —
   the runner reads what actually ships, `src/pub/content/v1/<lang>/`).
2. For every step, ask each question **in order**, one at a time. Each
   question is a pure function of the step (plus small course-wide context)
   returning `{question, answer: "yes"|"no"|"n/a", evidence: string[],
   enforced: boolean}`.
3. `enforced: true` means a `"no"` fails the build (CLI exit 1, CI red).
   `enforced: false` means the question still runs and reports, but a `"no"`
   is informational — surfaced, not blocking, because its measured false-
   positive rate is too high to trust as a hard gate (§3).
4. `"n/a"` means the question doesn't apply to this step's type/shape
   (e.g. Q4 on a `multiple_choice` step) — never silently skipped, always in
   the evidence.

Run it:

```bash
node scripts/qa/procedural/run.mjs --lang ja --lesson ja-m34-neo-7
node scripts/qa/procedural/run.mjs --lang ja --module m34
node scripts/qa/procedural/run.mjs --lang ja --module m34 --json   # machine-readable
node scripts/qa/procedural/run.mjs --lang ja --enforced-only        # skip informational questions (fast — ~19s/46 modules)
npm run qa:procedural -- --lang ja --module m34                     # same, via package.json
```

Prints a table — `step | Q1..Q10` (✓ yes / ✗ no / – n/a) — then one line per
`✗` with its evidence. Exits 1 if any **enforced** question is `✗` anywhere in
scope.

---

## 2. The question table

| # | Question | Tool (file) | Enforced? |
|---|---|---|---|
| Q1 | does the learner already know every content word in this step's answer and prompt? | `jaSurfaces` (`stepTaxonomy.ts`) + `gateResidual` (`gate.ts`), reused via a Vite SSR bridge — `scripts/qa/procedural/checks/q1-known-words.mjs` | **No** — informational |
| Q2 | does every tile boundary in a build/listen step fall on a word boundary the course knows? | the v2 whole-course-lexicon RETOKENIZE test from `moduleCompiler.ts`'s `diagnoseModule` shrapnel gate, promoted into a callable check over runtime tiles — `checks/q2-whole-word-tiles.mjs` + `lib/irLexicon.mjs` | **No** — informational |
| Q3 | does every tile carry at most one content morpheme (particles/aux/copula may attach)? | JA lexical sidecar (fugashi + unidic-lite) — `checks/q3-one-content-word-per-chunk.mjs` + `scripts/lexical/ja/` | **No** — informational |
| Q4 | is every particle its own tile? | ported from `particleTileSeparation.test.ts` — `checks/q4-particle-own-tile.mjs` | **Yes** |
| Q5 | is every distractor textually distinct from the correct answer? | literal-text identity over options, honoring `alsoCorrectOptionIds` — `checks/q5-distractor-not-correct.mjs` | **Yes** |
| Q6 | is ≥95% of a comprehension step's text known? | same tool as Q1 | **No** — informational (shares Q1's gap) |
| Q7 | does every spoken surface have a recorded TTS clip? | manifest-coverage rule ported from `manifest.ts`'s `resolveTtsPath`, plus the per-sentence fallback `DialogueListenStepView.tsx` actually plays with — `checks/q7-audio-exists.mjs` + `lib/ttsCoverage.mjs` | **Yes** |
| Q8 | do the compiler's own gloss/grammar-point diagnostics pass for this lesson? | `moduleCompiler.ts`'s `diagnoseModule`, called directly on the module's IR — `checks/q8-gloss-matches.mjs` | **Yes** |
| Q9 | does the lesson stay in the 10–25 step band with no 4+ run of selection-only steps? | ported from FR's `fr-quality.test.ts`, using the shared `SELECTION_TYPES` (`stepTaxonomy.ts`) instead of FR's local copy — `checks/q9-step-variety.mjs` | **Yes** |
| Q10 | does the step avoid a raw kanji surface outside its dedicated reveal type? | structural scan of kana-graded fields for CJK ideographs, excluding `kanji_reading`/`grammar_rule` — `checks/q10-no-kanji-before-intro.mjs` | **Yes** |

Every check exports `appliesTo(step, ctx)`, `run(step, ctx)`, and
`plant(step, ctx)` — the last produces a known-bad variant used by
`scripts/qa/procedural/checks.test.mjs` to prove the question can say "no".
`node --test scripts/qa/procedural/checks.test.mjs` — 11/11 passing.

### Why Q10 can't literally check "before its reveal"

The runtime JSON is **kana-first by design** — kanji is layered on at render
time, per learner, by `applyKanjiSurfaces()` based on that learner's actual
mastery, never baked into the shipped step. There is no static "kanji before
intro" instant to catch from a JSON file alone. Q10's static proxy is the
pinned invariant itself (`authoring-invariants-pinned.md` #2/#3: "Grading,
`tiles`, and `correctOrder` stay KANA — display-only"): a raw kanji character
in any kana-graded field outside `kanji_reading`/`grammar_rule` is a defect by
construction, whether or not it predates that word's reveal.

---

## 3. Measured precision — Q2 and Q3

Per the brief: measure Q2 and Q3 over **every** JA build/listen step, then
hand-audit a random 60-hit sample (or the full hit list, when smaller)
yourself and report true/false-positive judgments. Enforce only at ≥0.9
precision.

Command: `node scripts/qa/procedural/measure.mjs --out <path>` (batches the
whole course into ONE sidecar process spawn — `run.mjs`'s one-call-per-step
would take unreasonably long across ~4,100 steps).

**Two structural exclusions were found and fixed during measurement** (both
now baked into `appliesTo`/the vocabulary-collection loop in `run.mjs` and
`measure.mjs`): character-granularity kana-recognition drills (m1–m5, tiles
are individual alphabet characters, not words) and `picker: true`
register-choice steps (m29, tiles are whole competing PHRASES, not word
pieces). Both were category errors, not measurement noise — excluding them
took Q2 from 58 hits to 9.

| Question | Scope | Hits | Hand-audited | True positives | Precision | Verdict |
|---|---|---|---|---|---|---|
| Q2 | 4,138 applicable build/listen steps, 46 modules | 9 | all 9 | 2 | **~22%** | informational |
| Q3 | 4,140 build/listen steps, 46 modules | 653 | random 60 | 0 | **0%** | informational |

**Q2's 2 true positives** (both the same underlying finding, in two
lessons): `たべすぎた` (a `derivedFrom` verb-form atom) is used in **m27**
build steps as `たべ|すぎた|んだ`, but is not registered until **m36** — the
exact `やめて` defect class (a derived form used before its own
registration). The other 7 hits are coincidental substring collisions
between an unrelated registered atom (`そうです`, `なんだ`) and an ordinary
word+copula/word+から boundary it happens to overlap textually — a real,
previously undocumented gap in the "whole word ≥3 kana spans a boundary"
design: a whole registered word is not automatically a **content** word, so
grammar/discourse-marker atoms (`そうだ` "hearsay", `んです` "explanatory")
collide with unrelated ordinary text at course scale even though they never
collide in the single-sentence case the 2026-09-17 build-23 incident measured
them against. The original test (b) WHOLE-WORD SPAN test was dropped
entirely from this runner's Q2 for this reason — only test (a) RETOKENIZE
survives (see `checks/q2-whole-word-tiles.mjs`'s doc comment for the full
trace of what was tried and why).

**Q3's 0/60**: fugashi + unidic-lite POS tags alone are **not sufficient**
for "one content word per chunk". The 60-sample false positives cluster into
three classes, none of them the intended "two unrelated content words glued
into one tile" defect:

1. **Legitimate compounds that are one taught vocabulary item.**
   Prefix+noun honorifics (`おかあさん`, `おとうさん`, `おさけ`), noun-noun
   compounds (`ひこうき`, `たんじょうび`, `にちようび`, `はなたば`,
   `よやく`), and number+counter time words (`さんじ`, `ろくじ`, `じゅっぷん`)
   are all morphologically 2+ pieces but pedagogically one word.
2. **Grammatical constructions the POS scheme can't distinguish from
   content.** V-te + `いく`/`くる`/`しまう`/`みる` aspectual auxiliaries
   (`かってくる`, `たべてしまった`, `なっていく`), `される` passive,
   `すぎる` "too much", and the negative `ない`/`なかった` ending itself
   (UniDic tags it `形容詞`, i.e. content-looking, when it is functioning as
   a grammatical negation suffix).
3. **Plain kana-only tagger parse failures with no kanji anchor**
   (`いっぽん` → いっぽ+ん garbage; `のまない` → ま+ない garbage) — the exact
   pitfall `docs/tile-shrapnel-2026-09-17.md` §1 warned about, confirmed here
   even WITH the kanji-reconstruction mitigation, because these specific
   forms have no kanji atom to substitute in the first place.

**The real fix is out of scope for this lane**: a JMdict compound-entry
lookup (to recognize class 1 as single lexical entries) plus a richer
auxiliary-construction table (to exclude class 2). Both were named in the
original research brief (`docs/project-review-2026-09-17.md` §2) as the
intended stack; this lane implemented only the fugashi/UniDic half and the
measurement above is the evidence for why the JMdict half is not optional.

Q1 and Q6 share a different, simpler-to-state limitation: `gate.ts`'s
`gateResidual` models **vocabulary**, not **morphology** — it has no notion
of verb/adjective conjugation, so a step using a conjugated form of an
otherwise-known verb (volitional のもう, negative たべない, past かった…)
reports a false "unknown" residue for the ending. m34's own `grammar_rule`
step teaching the volitional form fails this way. Both are informational for
the same reason.

---

## 4. Top 10 real findings (by module)

From an enforced-only, full-course run (`node scripts/qa/procedural/run.mjs
--lang ja --enforced-only`, 2026-09-17):

| # | Module | Question | Finding |
|---|---|---|---|
| 1 | m27 (+m36) | Q2 (informational) | `たべすぎた` used as 3 tiles in m27 before its m36 registration — the `やめて`-class defect, a genuine repeat of the tile-shrapnel incident |
| 2 | m42 | Q10 | `ja-m42-neo-challenge-dlg-4` line 2 has a raw kanji (人) inside a `dialogue_listen` `kana` field — a kana-only grading field carrying real kanji, the exact "kana floating above identical kana" invariant violation |
| 3 | m46 | Q4 | `ja-m46-neo-3-s-3` tiles `きゅう`(known atom "nine") + `に` glue into "きゅうに" — likely a homograph coincidence with the adverb 急に "suddenly"; **the real `particleTileSeparation.test.ts` currently passes**, so this is either a stale LEXICALIZED allowlist in this port or a bundle/source drift — flagged for triage, not claimed as a confirmed content bug |
| 4 | course-wide | Q7 | **655 missing TTS clips** across `dialogue_listen`/`listening_comprehension` lines, independently confirmed against the manifest (Python sha256 cross-check, not just this tool) for both a very new module (m46) and a long-shipped one (m3, m20) — the pattern (multi-sentence dialogue lines, whole-line AND per-sentence forms both absent) matches CLAUDE.md's documented risk that "the emitter is regex-based over source text — a new factory shape or filename it does not match is skipped silently" against `dialogue_listen`'s `lines[].kana` shape specifically; needs a lane with `emit-tts-deck.mjs` access to confirm and fix |
| 5 | m9, m36, m42 | Q2 raw hits (informational, not counted as findings) | `そうです`/`そうだ`/`んです` collision class — not a content defect, but exposes a real gap in the "whole-word span" heuristic worth fixing in a future Q2 v3 (scope test (b) to `kind: vocab` content atoms only, excluding grammar/discourse-marker atoms) |
| 6 | m3–m46 (course-wide) | Q1/Q6 (informational) | Every conjugated verb/adjective form (volitional, negative, past, te-form) trips a false "unknown residue" — not itself a finding about content, but the measured evidence that `gate.ts` needs a conjugation-aware mode before Q1/Q6 can be enforced |
| 7 | m17 | Q2 raw hit (informational) | `なんにん` retokenized as なん\|に\|ん by this runner's `moduleVocabApprox` approximation — a measurement artifact (single-kana filler tiles from unrelated steps contaminating the module vocabulary), not a content defect; documents a known limitation of the `moduleVocabApprox` approximation in `lib/irLexicon.mjs` |
| 8 | m25 | Q2 raw hit (informational) | `なんだろう` retokenizes against the registered `なんだ` explanatory-copula atom (m27) — coincidental collision, same class as finding 5 |
| 9 | m1–m5 | Q2/Q3 category-error fix (already applied) | Character-granularity kana-recognition drills were contaminating both Q2 and Q3 before the `granularity !== "character"` exclusion — recorded here as the concrete "how to add a question" worked example (§5) |
| 10 | m29 | Q2/Q3 category-error fix (already applied) | `picker: true` register-choice steps (whole rival phrases as tiles) were contaminating `moduleVocabApprox` course-wide via one step (`ja-m29-neo-14-reg-6`) until excluded — same worked-example value as #9 |

Findings #1, #2, #3, #4 are the actionable content/audio items; #5–#10 are
tooling-precision findings that justify the informational/enforced split in
§3 and are the concrete backlog for improving Q2/Q3 later.

---

## 5. How to add a question

1. Create `scripts/qa/procedural/checks/qN-<slug>.mjs` exporting `id`,
   `question`, `enforced`, `appliesTo(step, ctx)`, `run(step, ctx)` (async,
   returns `{answer, evidence}`), and `plant(step, ctx)` (returns a
   known-bad variant of a real step).
2. Register it in `scripts/qa/procedural/index.mjs`'s `CHECKS` array.
3. Add a case to `scripts/qa/procedural/checks.test.mjs`: a real fixture step
   answers not-"no", the planted variant answers "no".
4. If the question needs a whole-course measurement before it can be
   enforced (the Q2/Q3 pattern), add it to `measure.mjs`, run it, hand-audit
   a sample, and record the precision table here **before** setting
   `enforced: true`.
5. Reuse before reinventing: check `lib/lexicon.mjs` (course atoms,
   `gateResidual`, `jaSurfaces`), `lib/irLexicon.mjs` (whole-course lexicon,
   chunk/tile tokenizing), `lib/ttsCoverage.mjs` (manifest resolution),
   `lib/kanjiReconstruct.mjs` (kana→kanji substitution for the sidecar) —
   and `lib/tsBridge.mjs`'s `loadTs(path)` to pull ANY other repo TS module
   (read-only) into a plain Node script without a new dependency.

---

## 6. Before submitting a lesson (the authoring-halt-lifting gate)

Until this doc says otherwise, a lane finishing lesson content must:

```bash
node scripts/qa/procedural/run.mjs --lang ja --module <mN>
```

and either see `no enforced-question failures`, or have every enforced
failure named and accounted for (fixed, or explicitly flagged to the lead
with the evidence line, per `regression-classes`' C8 doctrine — a human still
judges whether a flagged item is real). This is now also wired as
`src/test/proceduralQa.test.ts` (`npx vitest run
src/test/proceduralQa.test.ts`), which CI runs on every push touching
content. **That gate is currently RED** — it surfaces the real, pre-existing
findings in §4 (#2 the kanji leak, #4 the 655 missing clips chief among
them). This lane's mandate was to report findings, not fix content
(`.claude/skills/content-change/SKILL.md`'s doctrine plus this lane's own
file-ownership rule) — clearing the gate is the next lane's job, not a sign
the gate is broken.

---

## 7. What KO/ES/FR still need

This lane scoped JA only (the largest course, 46 modules). Per the original
research brief (`docs/project-review-2026-09-17.md` §2):

- **KO**: Kiwi (free, Node bindings) as the lexical analyzer; no KO
  acceptability dataset exists to calibrate a Q3-equivalent precision bar
  against, so budget for the same "measure before enforce" pass this lane
  ran for JA. KO has no IR compiler (hand-authored TS tables), so Q2's IR
  `lexiconKanas` source and Q8's `diagnoseModule` reuse have no equivalent —
  a KO port needs its own whole-course-vocabulary source and gloss-diagnostic
  tool, or those two questions stay JA-only.
- **ES/FR**: simplemma (MIT, 19MB) for lemmatization + Lexique 3.83
  (CC BY-SA) for frequency/POS facts. Both compile via IR
  (`compile-ir-es.mjs`/`compile-ir-fr.mjs`), so Q2/Q8's IR-reuse pattern
  ports directly. FR's `fr-quality.test.ts` is already the Q9 source for ES/FR
  too (this lane ported it FROM there for JA, not the other direction).
- **All three**: Q4 (particle-own-tile) and Q10 (kanji-before-intro) are
  JA-specific by construction (kana/kanji script mechanics) and have no
  direct KO/ES/FR equivalent — a KO/ES/FR question set replaces them with
  whatever each language's own recurring structural defect is (see each
  course's own `docs/*-authoring-invariants-pinned.md` /
  `fr-authoring-playbook.md` for candidates).

---

## 8. JA lexical sidecar — install and architecture

```bash
cd scripts/lexical/ja
uv venv .venv --python 3.11
uv pip install --python .venv/bin/python fugashi unidic-lite
```

Both packages are permissively licensed (fugashi: MIT; unidic-lite: BSD +
UniDic's own BSD-style license) — no GPL/CC BY-SA exposure, embeddable.

- `sidecar.py` — reads a JSON array of `{id, text}` from stdin, tags each
  with fugashi's UniDic tagger, writes `{id, tokens: [{surface, lemma, pos1,
  pos2, reading, start, end}]}` to stdout. `start`/`end` are character
  offsets into that item's OWN text.
- `sidecar.mjs` — Node wrapper: batches by distinct text (not by id — two
  steps sharing a sentence share one cache entry), shells out ONCE per batch
  of cache misses, caches results at `artifacts/lexical/ja/<sha1>.json`
  (gitignored). `tagBatch(items)` / `tagOne(text)`.
- **The kana-only over-segmentation pitfall** (measured, see
  `docs/tile-shrapnel-2026-09-17.md` §1 and confirmed independently here:
  `コーヒーをのもう` fed bare mis-tags のもう as の(particle)+もう(adverb
  "already") instead of the volitional verb form): mitigated by running the
  tagger on the KANJI-reconstructed surface when one is available
  (`scripts/qa/procedural/lib/kanjiReconstruct.mjs`, using each course
  atom's own `secondary` kanji spelling as an exact-match override
  dictionary before substitution) and mapping tagger token offsets back onto
  tile spans by character-overlap. This measurably helps (`仕事をやめて`
  tags correctly with kanji present; the bare-kana form does not) but does
  **not** fully close the gap — §3's false-positive classes 2 and 3 persist
  even with kanji reconstruction, because many of the offending forms
  (ない-endings, いっぽん, のまない) have no kanji atom to substitute in the
  first place.

`artifacts/lexical/ja/` is gitignored (repo-wide `artifacts/` rule).
`scripts/lexical/*/.venv/` is gitignored (added by this lane — was
previously uncovered, a 250MB venv risk).
