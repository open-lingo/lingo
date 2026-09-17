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
node scripts/qa/procedural/run.mjs --lang ja --enforced-only        # skip informational questions (fast — ~20-22s/46 modules cold, ~1s warm — see §8b)
node scripts/qa/procedural/run.mjs --lang ja --informational-summary  # print Q1/Q6 finding counts (report-only; moved out of vitest, §6)
node scripts/qa/procedural/run.mjs --lang ja --no-cache              # bypass the verdict cache (§8b) for this run
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
| Q2 | does every tile boundary in a build/listen step fall on a word boundary the course knows? | v3 (2026-09-17, lane A7c): JMdict + the whole-course atom lexicon, boundary-scan with an independent-word escape — `checks/q2-whole-word-tiles.mjs` + `lib/irLexicon.mjs`'s `chunkBoundaryHits` + `lib/jmdict.mjs` | **Yes** (promoted from informational — §3) |
| Q3 | does every tile carry at most one content morpheme (particles/aux/copula may attach)? | v3 (2026-09-17, lane A7c): JMdict + course atoms + an explicit auxiliary/deconjugation table first, the JA lexical sidecar (fugashi + unidic-lite) only as a last-resort fallback — `checks/q3-one-content-word-per-chunk.mjs` + `lib/tileMorphology.mjs` + `lib/jaDeconjugate.mjs` + `scripts/lexical/ja/` | **Yes** (promoted from informational — §3) |
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
`node --test scripts/qa/procedural/checks.test.mjs` — 10/12 passing, 1
skipped (Q3, JA lexical sidecar not installed on this machine — see §8),
1 pre-existing failure (Q2 "should apply to its own fixture step",
confirmed pre-existing and reproduced identically before lane A9's Q9
changes — out of this lane's file-ownership scope, not investigated
further here). 2026-09-17, lane A9 added the Q9 kana-row-exemption case
(§4a) to this file.

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

### v2 (fugashi/heuristics alone, 2026-09-17 lane A7)

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
word+copula/word+から boundary it happens to overlap textually.

**Q3's 0/60**: fugashi + unidic-lite POS tags alone are **not sufficient**
for "one content word per chunk". The 60-sample false positives clustered
into three classes, none of them the intended "two unrelated content words
glued into one tile" defect:

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

The real fix named at the time: a JMdict compound-entry lookup (class 1)
plus a richer auxiliary-construction table (class 2). §3v3 below is that
fix.

### v3 (JMdict-first, 2026-09-17 lane A7c) — PROMOTED to enforced

`scripts/lexical/ja/fetch-jmdict.mjs` fetches JMdict (EDRDG, via the
`jmdict-simplified` JSON republish) and builds a compact surface index
(`artifacts/lexical/jmdict/index.json`, 236,546 kana readings / 229,019
kanji surfaces, common-word flag + POS per surface) — see §8a for the
licence/attribution note. Both Q2 and Q3 were rewritten to consult this
index (plus the course atom lexicon) FIRST, falling back to the fugashi
tagger only for whatever a dictionary-first pass can't resolve.

| Question | Scope | Hits | Audited | True positives | Precision v2 → v3 | Verdict |
|---|---|---|---|---|---|---|
| Q2 | 4,123 applicable build/listen steps, 46 modules | 2 | all 2 | 2 | ~22% → **100%** | **enforced**, baseline 2 |
| Q3 | 4,125 build/listen steps, 46 modules | 0 | n/a (nothing to audit) | — | 0% → **vacuous (0/0)** | **enforced**, baseline 0 |

**Q2 v3's definition** (`checks/q2-whole-word-tiles.mjs`, `lib/irLexicon.mjs`'s
`chunkBoundaryHits`): for each boundary between two adjacent shipped tiles,
find the narrowest contiguous run of tiles spanning it that, joined, is (a)
a JMdict **common** entry or a course atom (the whole-course `lexiconKanas`
∪ this module's shipped tile vocabulary — the SAME source v2 used, not the
narrower `getNormalizedCourseAtoms` set, because `derivedFrom` verb-form
atoms like `たべすぎた` are IR-only by design and never appear there); flag
the boundary UNLESS (b) the two pieces immediately flanking it are BOTH
independently valid words themselves (any JMdict entry, the whole-course
atom lexicon, or the unfiltered course-atom set — the last needed for short
registered atoms like the 2-kana `ぷん` counter, which `lexiconKanas`'
length-≥3 filter drops). (b) is the fix over v2's dropped test (b): a real
word spanning a boundary is only shrapnel if the pieces on either side
​aren't real words too.

Re-running found exactly the **same 2 hits as v2, and nothing else** — both
`たべすぎた` (m27, before its m36 registration; the same lesson's regular and
review-lesson copies, hence "2 hits" for one underlying defect). The 7 false
positives (`そうです`/`そうだ`/`んです`/`なんだ` colliding with an unrelated
word+copula boundary) all dropped, because in every one of those cases both
flanking pieces (そう/です, なん/だろう, etc.) ARE independently valid JMdict
words — condition (b) now correctly reads that as "two real words meeting,"
not "one real word cut in half." **The two previously-true positives
survive and the false ones drop, exactly as the brief predicted.**

Two debugging notes worth recording (both caught by re-running against real
content, not by inspection):
- An `isIndependentWord` that also allowed `moduleVocabApprox` (any tile
  shipped anywhere in the module) is **vacuously true for the two tiles
  flanking every boundary**, since those tiles are themselves shipped tiles
  by construction — this version produced 0 hits course-wide (silently
  wrong, not "clean"). `moduleVocabApprox` stays in condition (a) only.
- `なんぷん` ("how many minutes") tiled as なん|ぷん flagged shrapnel
  because `ぷん` (a deliberately-registered 2-kana counter atom, "the
  rendaku half of the minute counter") is too short for the whole-course
  lexicon's ≥3-kana filter and has no JMdict entry of its own (only its
  base reading `ふん` does) — fixed by adding the unfiltered course-atom set
  to condition (b).

**Q3 v3's definition** (`lib/tileMorphology.mjs`'s `decomposeTile`, full
resolution order in its doc comment): per tile, in order —
1. The whole tile (as shipped, or its course-atom kanji reconstruction) is
   a JMdict entry, a course atom, or JA "course furniture" (character names
   / bare interjections — `moduleCompiler.ts`'s `JA_COURSE_FURNITURE_KANA`,
   which is in none of JMdict/atoms/JMdict-adjacent lists since proper
   nouns live in a separate EDRDG database, JMnedict, not fetched here) →
   1 content morpheme. Closes false-positive class 1 (legitimate
   compounds) and most of class 3 (`いっぽん`, a JMdict entry outright).
2. `tryDeconjugate` (`lib/jaDeconjugate.mjs`) recovers a JMdict/atom
   dictionary form via the standard ない/なかった・ます-stem・たい・すぎる・
   passive-causative（れる/られる・せる/させる）・volitional・て/た
   (with godan onbin: いて→く, いで→ぐ, して→す, って→う/つ/る,
   んで→ぬ/ぶ/む, tried against JMdict) reverse-conjugation table → 1
   content morpheme. Closes the rest of class 3 (`のまない` → のむ) and the
   ない/すぎる/passive slice of class 2.
3. Split at each て/で occurrence: does the LEFT half deconjugate to a
   content verb AND the RIGHT half deconjugate to one of the **aspectual
   auxiliary lemmas** `いく`/`くる`/`しまう`/`みる`/`おく`/`ある`/`いる`
   (tagger pos1 `動詞`, but function here by SYNTACTIC POSITION, not lemma
   alone — a bare tile `いく` with no preceding て-form verb is still
   content) → 1 content morpheme. Closes the "V-te + aux" slice of class 2
   for tiles that glue verb+aux into one chunk (`たべてしまった`,
   `かってくる`).
4. Prefix/suffix split: a JMdict/atom/deconjugatable prefix with the
   remainder fully covered, greedy longest-match, by an explicit
   **auxiliary-surface table** (particles — tagger pos1 `助詞`, all
   subtypes; copula — `だ`/`です`/`である`/`じゃ`/`でした`/`でしょう`;
   conjugation endings — `て`/`で`/`た`/`だ`/`ない`/`なかった`/`ます`/
   `ました`/`ません`/`ませんでした`/`たい`/`たかった`/`たくない`/
   `たくなかった`) → 1 content morpheme.
5. Fallback: the fugashi tagger (kanji-reconstructed input, as v2 used),
   excluding tagger pos1 `助詞`/`助動詞`/`補助記号`/`記号`/`接尾辞`/
   `接頭辞` (v2's set **plus `接頭辞`** — a bare honorific prefix, e.g. お in
   おかあさん, is never itself a content word; v2 omitting it was part of
   class 1) as function, with the same literal-surface overrides as step 4
   for a mis-tagged bare `ない`/`なかった`/etc. tile. Adjacent content-token
   RUNS are merged; a run built from 2+ raw tagger tokens is checked for an
   internal JMdict/atom two-word split (both halves ≥2 kana, both
   independently valid) before being counted as 1 — a run built from
   exactly ONE tagger token is never re-split (single JMdict/atom entries
   routinely contain a coincidentally-valid short substring — `ある` =
   あ+る, both independently real JMdict entries — re-splitting single
   tokens was the single largest false-positive source measured while
   building this, ~440 of the first v3 pass's 877 raw hits).
6. Sentence-final punctuation (`。？！、`) is stripped from the tile before
   any of the above — the shipped tile array attaches it directly to the
   last tile of a step (`ある？`, `いく。`), and neither JMdict nor the
   deconjugation table include punctuation.

Re-running against the whole course gave **0 hits** — every one of v2's 653
resolved (mostly via step 1, since every offending case measured — the
class-1 compounds AND the `derivedFrom` grammatical derivations `すぎる`/
`そう`/`やすい`/`たがる`/`つづける`/`される` (`ちいさすぎる`, `ふりそう`,
`あるきやすい`, `いきたがっている`, `よみつづける`, `そうさされた`) — turned
out to be registered whole-course-lexicon atoms too, the same source Q2
uses). **This precision number is honest about being vacuous, not proof of
recall**: with 0 hits there is nothing to hand-audit for false positives (a
0/0 rate isn't the same claim as Q2's audited 2/2), so the promotion rests
on (a) the resolution order being dictionary-fact-first rather than
tagger-guess-first, and (b) a capability check, not a course scan — a
synthetic tile combining two unrelated real words (e.g. がっこう+びょういん
glued into one tile) is still correctly flagged as 2 content morphemes
(also exercised by `checks.test.mjs`'s planted-defect case). Baselined at
0 — any future true finding is a content bug to report and fix, not to fold
into the baseline (`regression-classes` C7).

Q1 and Q6 share a different, simpler-to-state limitation, untouched by this
lane's scope: `gate.ts`'s `gateResidual` models **vocabulary**, not
**morphology** — it has no notion of verb/adjective conjugation, so a step
using a conjugated form of an otherwise-known verb (volitional のもう,
negative たべない, past かった…) reports a false "unknown" residue for the
ending. m34's own `grammar_rule` step teaching the volitional form fails
this way. Both remain informational for the same reason (measured
2026-09-17: Q1 3,880 / Q6 737 findings course-wide, both dominated by this
one class).

---

## 4. Top 10 real findings (by module)

From an enforced-only, full-course run (`node scripts/qa/procedural/run.mjs
--lang ja --enforced-only`, 2026-09-17):

| # | Module | Question | Finding |
|---|---|---|---|
| 1 | m27 (+m36) | Q2 (enforced) | ~~`たべすぎた` used as 3 tiles in m27 before its m36 registration — the `やめて`-class defect, a genuine repeat of the tile-shrapnel incident~~ — **FIXED 2026-09-17 (lane A7d)**: not the `やめて` shape (which genuinely needed a new atom at its first use). m27 already registers and teaches the compositional atoms `すぎる`/`すぎた` (ます-stem attachment; `たべすぎたんだ` is m27's own flagship worked example), and m27's IR is explicit that verb + すぎる is ALWAYS two compositional tiles, never a frozen whole atom. m36 mistakenly re-registered `たべすぎた` as its own `derivedFrom` verb-form atom (over-applying the そう/やすい/にくい/ながら/がる/たがる "attachment surfaces are atoms" rule, which doesn't apply to すぎる composites) — that competing whole-word atom is what made the whole-course lexicon read m27's correct `たべ｜すぎた` split as shrapnel. Removed the redundant m36 registration (`ir/m36.ir.yaml`; `ふとった` stays, it's a genuinely new m36 verb); m36's own beat now tiles compositionally off m27's atoms too (`おかし｜を｜たべ｜すぎた｜から｜ふとった`). Recompiled m27–m46 (lexiconKanas ripple only — diffs are exactly "remove one string from the whole-course array" per module, confirmed by hand). Q2 finding count 2→0; baseline lowered in the same commit. |
| 2 | m42 | Q10 | ~~`ja-m42-neo-challenge-dlg-4` line 2 has a raw kanji (人) inside a `dialogue_listen` `kana` field~~ — **FIXED 2026-09-17 (lane A7b, `c86f8651`)**: confirmed a plain authoring slip in the IR (`ir/m42.ir.yaml`), corrected 人→ひと, recompiled m42 (+ m43-m46, no ripple), re-emitted. Finding count now 0. |
| 3 | m46 | Q4 | ~~`ja-m46-neo-3-s-3` tiles `きゅう`(known atom "nine") + `に` glue into "きゅうに"~~ — **FIXED 2026-09-17 (lane A7b, `9ef006e6`)**: not a content bug and not a stale allowlist (the PARTICLES/LEXICALIZED/NAIDE_UNIT sets were byte-identical to the real test's). The port's ATOM SOURCE was wrong: it used `getNormalizedCourseAtoms`'s kana-normalized `.display` instead of the real gate's own `getLanguageModule("ja").courseAtoms.map(a => a.surface ?? a.kana)`. Number atoms register with a KANJI `surface` (よん's is `"四"`, no `kana` field) — the real test's `??` never falls back to kana for them, so it never matches よん/なん/きゅう as stems; the normalized set does, over-triggering on real conjugated forms that share a kana prefix (よんで = te-form of よむ "read", not よん+で; なんで = "why", not なん+で). 5 findings (m16, m30×2, m39, m46) → 0, confirmed against `particleTileSeparation.test.ts` (0 violations, unchanged). Fix: `scripts/qa/procedural/lib/lexicon.mjs`'s `getCourseAtomSurfaces`. |
| 4 | course-wide | Q7 | ~~**655 missing TTS clips**~~ — **CORRECTED 2026-09-17 (lane A7b, `544afc97`): true count is 1, not 655.** Verified against the RUNTIME resolution (`DialogueListenStepView.tsx` passes the same `kana`/`audioText` field Q7 checked to `getTtsUrl`) rather than trusting the count: `hasTtsClip` mirrored only `manifest.ts`'s bare `resolveTtsPath` (direct sha256 hash match), but every real call site uses `src/shared/tts/index.ts`'s `getTtsUrl`, which wraps that with fallback passes `resolveTtsPath` alone lacks — strip trailing sentence punctuation (`。.?!…`) and retry, strip ALL internal+trailing punctuation and retry, and (JA only) a hiragana-twin lookup for a lone katakana glyph. 654 of the 655 findings were authored text carrying a trailing `。` the generated deck strips — computing the runtime hash for 5 of them by hand confirmed all 5 resolve fine. The ONE genuinely missing clip: `ja-m42-neo-challenge-dlg-4` line 2 (Mika's line) — the same step as row 2 above, still absent after the kanji fix. Its per-line play button renders **disabled** (`opacity-40`, unclickable — `lineAudioAvailable`/`audioOk` in `DialogueListenStepView.tsx`), not silently tappable; the autoplay sequence still calls `playLineAudio` for it, which resolves near-instantly with no sound (JA never falls back to speech synthesis — `canSynthesize("ja")` is `false` by design), so the learner hears line 1, a silent gap, line 3. Fix: `scripts/qa/procedural/lib/ttsCoverage.mjs`, pinned against the real `getTtsUrl` by `src/test/ttsCoverageParity.test.ts` (20 real lines, all four resolution paths). |
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

## 4a. Q9 exemption: kana-row micro-lessons (2026-09-17, lane A9)

Q9's original run flagged 4 lessons, all in JA module 1, all for the
step-count half of the question ("outside the 10-25 band"), none for the
selection-run half:

| lesson | steps | evidence |
|---|---|---|
| `ja-m1-ya-1` | 6 | outside the 10-25 band |
| `ja-m1-ya-2` | 8 | outside the 10-25 band |
| `ja-m1-wa-1` | 6 | outside the 10-25 band |
| `ja-m1-wa-2` | 9 | outside the 10-25 band |

**Question: exempt by design, or pad to 10 steps?**

Read `fr-quality.test.ts`'s own rationale (top-of-file doctrine comment,
`src/features/languages/fr/curriculum/fr-quality.test.ts`): the 10–25 band
is a **density** rule for FR's "teaching lesson" archetype — a lesson that
teaches vocab/grammar and needs 10–25 steps of practice variety so the
`variety` half of the same rule (no 2 adjacent same-type steps, no 4+
consecutive selection-only steps) has room to do its job. It targets a
lesson shape built around teaching MULTIPLE new items with repeated
practice, not a single atomic fact.

JA module 1's kana-introduction lessons are a different, deliberately
smaller archetype. Every one of the 57 `ja-m1-<row>-<n>` lessons (confirmed
by grepping every such lesson id in the curriculum — `ha`, `ka`, `sa`,
`ta`, `na`, `ma`, `ya`, `ra`, `wa`, `l1` (vowels), and 4 dakuten/yōon
segments) follows an explicit "1+1+1 split" documented in each row file's
own header comment (e.g. `m1-ya.ts`, `m1-wa.ts`): **one new kana symbol
plus one anchor word per sub-lesson.** や-row and わ-row are the two
shortest — 3 kana each (Japanese has no distinct yi/ye, and を/ん are
special-use-only) — so their sub-lessons naturally land at 6-9 steps: intro
→ trace → recognition → word-image-MCQ → listening-build →
symbol-to-sound, and stop. Rows with 5 kana (ka, sa, ta, na, ha, ma, ra)
produce more steps per sub-lesson and were never flagged; the vowel row
(`l1`, 5 vowels) runs ~18 steps/sub-lesson, comfortably inside the band.

Padding や-1 (6 steps) to 10+ would mean either (a) repeating the SAME
symbol/word pair through more step types than the content supports — this
repo's own step-type doctrine bans hollow cards (`docs/...step-type-doctrine`
memory: "no hollow cards") — or (b) teaching content that belongs to a
LATER sub-lesson early, which breaks the deliberate 1-new-thing-at-a-time
pacing the row's own header comment argues for. Neither is a real fix;
both would make the lesson worse to hit a number designed for a different
lesson shape.

**Decision: exempt by design.** `checks/q9-step-variety.mjs`'s `appliesTo`
now skips any lesson id matching `^ja-m1-[a-z0-9]+(?:-[a-z]+)*-[1-3]$` (the
kana-row naming convention above) — not just the step-count sub-check, the
whole question, since the variety/selection-run half targets the same
"long teaching lesson" archetype and a 6-9 step micro-lesson was never
going to meaningfully trip it either. Baseline lowered 4 → 0
(`src/test/proceduralQa.baseline.json`) — the ratchet only allows a
baseline to fall, never rise (`regression-classes` C7), so this is a
tightening, not a relaxation of anything real.

Three-sentence justification (as asked): (1) the FR density rule targets a
lesson that teaches several items with repeated practice, and JA's kana-row
lessons deliberately teach exactly one; (2) every one of the flagged
lessons already has a from-source design doc explaining the exact step
count it produces, so this isn't an accidental gap, it's the intended
shape; (3) padding would violate the no-hollow-cards doctrine or break the
one-new-symbol-at-a-time pacing the row files themselves document as the
point — there is no version of "pad it" that's actually an improvement.

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
content.

**2026-09-17, lane A7b: the gate is now GREEN, and is a RATCHET, not a
single boolean.** A7's original count (`anyEnforcedFail`, one boolean across
every enforced question) was two-thirds a checker bug, not real content debt
— verifying against the runtime found Q7's 655 was really 1 (§4 #4) and
Q4's 5 was really 0 (§4 #3); Q10's genuine 1 (§4 #2) was fixed in the IR.
The gate now compares each enforced question's finding COUNT against a
committed baseline (`src/test/proceduralQa.baseline.json` —
`{question: count}`, current true counts: `Q2:2, Q3:0, Q4:0, Q5:0, Q7:1,
Q8:0, Q9:4, Q10:0`) and fails only when a count EXCEEDS its baseline — never
on the pre-existing count itself (`regression-classes` C7: a count may
never rise). Q9's 4 (m1 kana-row lessons outside the 10-25 step band) is
pre-existing, untouched by this lane (out of its file-ownership scope), and
baselined as findings to fix later, not silently dropped. Q2's 2
(`たべすぎた` used in m27 before its m36 registration — §3v3) is likewise
pre-existing content debt, reported here, not fixed (out of this lane's
file-ownership scope: content JSON / IR YAML / compiled modules). A future
lane that fixes Q2's 2, Q7's remaining 1, or Q9's 4 must LOWER the baseline
in the same commit — raising it requires the C7 proof (stated cause,
re-measurement not new debt, flagged explicitly), never a quiet re-baseline.

**2026-09-17, lane A7c: Q2 and Q3 PROMOTED from informational to enforced**
(§3's v2 → v3 precision table) — both rewritten dictionary-first against
JMdict + the course atom lexicon instead of heuristics/tagger-POS alone.
Performance: the ratchet test (enforced-only, all 46 modules) measured
20.0s wall (`npx vitest run src/test/proceduralQa.test.ts --reporter=verbose`,
this machine) — under the 30s budget in the brief, achieved by pre-warming
the JA sidecar's on-disk cache with ONE batched spawn per `run.mjs`
invocation (`sidecar.mjs`'s `tagBatch`) instead of letting Q3's tagger
fallback spawn a fresh `fugashi.Tagger()` per cache-miss tile; measured
COLD (a fresh, emptied `artifacts/lexical/ja/` cache, simulating CI) this
collapsed the run from 36.5s to 20.2s.

**2026-09-17, lane A7c, perf follow-up**: a lead note reported the LOCAL
combined `proceduralQa.test.ts` wall time (the ratchet above + the
informational report this file used to also contain) at ~83s of an ~91s
local suite (lane A5a's preflight-tuning measurement) — the sidecar
pre-warm fixed the ratchet's own budget but not the combined local number.
Two fixes, both applied (§8b, §1):

1. **Per-module verdict cache** (`lib/verdictCache.mjs`,
   `artifacts/qa/procedural/verdicts/`, gitignored): `run.mjs` now caches
   each module's full per-step results, keyed by a hash of (lang, module
   id, mode, the module's OWN content, every `checks/*.mjs`+`lib/*.mjs`
   source file, and the JMdict index fingerprint) — ANY of those changing
   invalidates the cache automatically (verified: editing one check file
   forces a cold recompute; reverting it restores the cache hit). Measured
   full-course enforced-only run: **22.4s cold → 1.0s warm** (this
   machine). This helps REPEATED local runs (vitest re-run, CLI re-run)
   against unchanged content — it does **not** help a fresh CI checkout
   (`artifacts/` is gitignored, so CI is always cold); the CI timeout
   (`FULL_RUN_TIMEOUT_MS` in `proceduralQa.test.ts`) is therefore
   UNCHANGED, not lowered.
2. **Informational report moved out of vitest** — it was already
   `skipIf(CI)` (report-only, for a human), so removing it from
   `proceduralQa.test.ts` entirely costs CI nothing and removes ~35s from
   every local run of that file. It's now a plain CLI flag: `npm run
   qa:procedural -- --lang ja --informational-summary` (§1). Verified to
   print the same counts the old vitest test did (`Q1:3880, Q6:737`).

Combined effect, measured (`npx vitest run src/test/proceduralQa.test.ts
--reporter=verbose`, this machine, cache emptied first): **22.0s cold →
1.15s warm** (was one file with two tests, ~57-63s combined, informational
included; now one test, the ratchet, with the cache above).

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
- **2026-09-17 update**: JA's Q2/Q3 now also lean on JMdict (§3v3, §8a) —
  a KO/ES/FR port of either question needs an equivalent open dictionary
  with headword + common-word-flag + POS data (KO: no single obvious
  JMdict-equivalent identified yet, worth a short spike before committing
  to Kiwi-alone; ES/FR: Wiktionary data dumps are the closest open
  equivalent to JMdict's shape, unverified for this use).
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

---

## 8a. JMdict — fetch, index, and attribution (2026-09-17, lane A7c)

Q2 v3 and Q3 v3 (§3) both need real dictionary facts — "is this a word,"
"is it common," roughly "what part of speech" — which fugashi/UniDic's POS
tags alone don't carry (a tag says a token LOOKS like a noun/verb, not
whether a given SURFACE is an attested Japanese word). JMdict is the
standard open Japanese-English dictionary for exactly this.

**Source, licence, pin** (see `scripts/lexical/ja/fetch-jmdict.mjs`'s header
for the full citation, repeated here per the task's "JMdict attribution"
requirement):

- **Data**: JMdict, compiled and maintained by The Electronic Dictionary
  Research and Development Group (EDRDG), James William Breen, Monash
  University — <https://www.edrdg.org/>. Licensed under **Creative Commons
  Attribution-ShareAlike Licence (V4.0)** —
  <https://www.edrdg.org/edrdg/licence.html>. Attribution is required
  whenever the data (or a derivative, like this compact index) is used or
  redistributed; this doc, `fetch-jmdict.mjs`'s header comment, and
  `THIRD_PARTY_LICENSES.md` (whichever gets touched next for the shipped
  app's own attributions — the JMdict index itself never ships to the
  client, it's a build/QA-time-only artifact under `artifacts/`, so no
  runtime attribution surface currently needs one) are where this
  attribution lives — do not strip it when reusing the index elsewhere.
- **Republish used**: `jmdict-simplified`
  (<https://github.com/scriptin/jmdict-simplified>), a public-domain
  tool/format wrapper around the same EDRDG data, flattened to JSON (the
  upstream JMdict is XML with entity-reference tags, awkward to parse from
  plain Node without a dependency this lane didn't want to add).
- **Pinned release**: `jmdict-eng` `3.6.2+20260914172325` (built from the
  2026-09-14 JMdict snapshot), asset `jmdict-eng-3.6.2+20260914172325.json.tgz`,
  fetched 2026-09-17, sha256
  `89496f64e1af931211b391e6f3f32fa36bafd55a5450fca10d3fd4d3cc6c2396`
  (`fetch-jmdict.mjs` refuses to proceed on a mismatch).
- **Not included**: JMnedict (the separate EDRDG proper-names database) —
  course character names (たなか/ケン/ミカ/トム/タナカ) aren't in JMdict
  proper; Q3 v3 instead reuses `moduleCompiler.ts`'s own
  `JA_COURSE_FURNITURE_KANA` list (§3v3 step 1) rather than fetching a
  second dictionary for five names and six interjections.

**What's built**: `node scripts/lexical/ja/fetch-jmdict.mjs` downloads +
sha256-verifies the tarball, extracts the raw JSON (117MB, 218,776
entries), and compacts it to `artifacts/lexical/jmdict/index.json` (~19MB:
236,546 kana-reading surfaces + 229,019 kanji surfaces, each mapped to its
JMdict entry id(s), deduped POS tags, and a common-word flag) — dropping
glosses/examples/cross-references, which Q2/Q3 never read. Both
`artifacts/lexical/jmdict/` (the index AND the raw download) and
`scripts/lexical/*/.venv/` stay gitignored, matching the existing
`artifacts/lexical/ja/` sidecar-cache convention — physically inside the
repo tree, never committed. `scripts/qa/procedural/lib/jmdict.mjs` is the
read-only lookup layer (`hasKanaEntry`, `isCommonKanaEntry`,
`hasKanjiEntry`, `lookupKana`) every Q2/Q3 check goes through.

---

## 8b. Per-module verdict cache (2026-09-17, lane A7c perf follow-up)

`scripts/qa/procedural/lib/verdictCache.mjs`. Every `run.mjs` invocation
(CLI or the vitest ratchet's subprocess call) computes a module's FULL set
of per-step results (never a partial "enforced-only" subset — the
`--enforced-only` flag still skips computing informational questions when
there's a MISS, exactly as before this cache existed; only a HIT changes
behavior) and caches it, keyed by a hash of:

- `lang`, `moduleId`, `mode` (`"enforced"` or `"full"` — kept separate so
  an enforced-only cache entry is never accidentally reused for a full
  scan or vice versa),
- the module's own runtime-JSON content (`JSON.stringify` of the loaded
  module),
- a hash of EVERY `scripts/qa/procedural/checks/*.mjs` +
  `scripts/qa/procedural/lib/*.mjs` + `index.mjs` source file (broad on
  purpose — a new file or an edit anywhere in the checker logic
  invalidates every cached verdict, so a stale cache can never mask a real
  behavior change; verified: editing one check file forces a cold
  recompute on the next run, reverting it restores the cache hit),
- `lib/jmdict.mjs`'s `jmdictFingerprint()` (the JMdict index's size+mtime
  — a rebuilt/updated index invalidates too).

Cache files live at `artifacts/qa/procedural/verdicts/<key>.json`
(gitignored, same convention as the sidecar and JMdict caches).
`--lesson`-scoped runs never read or write it (a lesson subset isn't the
module's full verdict set); `--no-cache` bypasses it for one run.

**Why this doesn't help CI**: CI always starts from a fresh checkout, and
`artifacts/` is gitignored — every CI run is a cache MISS, paying exactly
the cost it always did. The cache's value is entirely for REPEATED runs
within one workspace (a human iterating locally, or vitest/CLI re-runs
against unchanged content) — this is why `proceduralQa.test.ts`'s CI
timeout was NOT lowered (§6).
