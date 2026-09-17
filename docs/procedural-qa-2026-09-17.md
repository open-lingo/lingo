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
| Q1 | does the learner already know every content word in this step's answer and prompt? | `jaSurfaces` (`stepTaxonomy.ts`) for JA, the generic field-based `stepSurfaces` (`lib/surfaces.mjs`) for KO/ES, both feeding `gateResidual` (`gate.ts`) — reused via a Vite SSR bridge — `scripts/qa/procedural/checks/q1-known-words.mjs`. `n/a` for FR (no atom adapter — §11). | **No** — informational, all languages |
| Q2 | does every tile boundary in a build/listen step fall on a word boundary the course knows? | v3 (2026-09-17, lane A7c): JMdict + the whole-course atom lexicon, boundary-scan with an independent-word escape — `checks/q2-whole-word-tiles.mjs` + `lib/irLexicon.mjs`'s `chunkBoundaryHits` + `lib/jmdict.mjs`. KO/ES/FR (2026-09-17, lane A7e): redefined as a mechanical tiles-reconstruct-the-sentence check, no dictionary — `lib/wordChunk.mjs`'s `sentenceReconstructs`, §9-§11. | **Yes**, all 4 languages (promoted from informational — §3, §9-§11) |
| Q3 | does every tile carry at most one content morpheme (particles/aux/copula may attach)? | v3 (2026-09-17, lane A7c): JMdict + course atoms + an explicit auxiliary/deconjugation table first, the JA lexical sidecar (fugashi + unidic-lite) only as a last-resort fallback — `checks/q3-one-content-word-per-chunk.mjs` + `lib/tileMorphology.mjs` + `lib/jaDeconjugate.mjs` + `scripts/lexical/ja/`. Ported to KO/ES/FR (2026-09-17, lane A7e) with a redefined chunk-level meaning for space-tokenized courses — `lib/wordChunk.mjs`, §9-§11. | **Yes for JA/ES/FR** — **informational for KO only** (per-language `enforced` function, §9/§12; promoted for JA/ES/FR — §3/§10/§11) |
| Q4 | is every particle its own tile? | ported from `particleTileSeparation.test.ts` — `checks/q4-particle-own-tile.mjs` | **Yes for JA** — **n/a for KO/ES/FR** (JA-only by construction, `naReason` explains why — §7) |
| Q5 | is every distractor textually distinct from the correct answer? | literal-text identity over options, honoring `alsoCorrectOptionIds` — `checks/q5-distractor-not-correct.mjs` | **Yes**, all 4 languages (already language-generic, ported unchanged — §9-§11) |
| Q6 | is ≥95% of a comprehension step's text known? | same tool as Q1 | **No** — informational, all languages (shares Q1's gap and its FR n/a) |
| Q7 | does every spoken surface have a recorded TTS clip? | manifest-coverage rule ported from `manifest.ts`'s `resolveTtsPath`, plus the per-sentence fallback `DialogueListenStepView.tsx` actually plays with — `checks/q7-audio-exists.mjs` + `lib/ttsCoverage.mjs` | **Yes**, all 4 languages (`hasTtsClip(lang, text)` was already language-generic — §9-§11) |
| Q8 | do the compiler's own gloss/grammar-point diagnostics pass for this lesson? | `moduleCompiler.ts`'s `diagnoseModule`, called directly on the module's IR — `checks/q8-gloss-matches.mjs` | **Yes for JA** — **n/a for KO/ES/FR** (no compiled `ir.json`/gloss-diagnostic tool for those languages yet — §7) |
| Q9 | does the lesson stay in the 10–25 step band with no 4+ run of selection-only steps? | ported from FR's `fr-quality.test.ts`, using the shared `SELECTION_TYPES` (`stepTaxonomy.ts`) instead of FR's local copy — `checks/q9-step-variety.mjs` | **Yes**, all 4 languages (already language-generic — §9-§11 for the KO/FR baselines) |
| Q10 | does the step avoid a raw kanji surface outside its dedicated reveal type? | structural scan of kana-graded fields for CJK ideographs, excluding `kanji_reading`/`grammar_rule` — `checks/q10-no-kanji-before-intro.mjs` | **Yes for JA** — **n/a for KO/ES/FR** (kanji/kana script mechanics are JA-only — §7) |

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

**Correction (2026-09-17, lane A7e):** Q2's 2 (`たべすぎた`) was FIXED by lane
A7d (see §4 finding #1's strikethrough) — the committed baseline was
lowered to `Q2:0` at that time; this section's prose above still says
`Q2:2` (never updated) — trust `src/test/proceduralQa.baseline.json` over
this paragraph. That file's shape also changed in this lane, from
`{question: count}` to `{ja: {question: count}, ko: {...}, es: {...}, fr:
{...}}` — see §9-§11 for the KO/ES/FR ports.

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

**STATUS (2026-09-17, lane A7e): DONE** — `run.mjs`/`measure`-equivalent
scans, sidecars, and the ratchet now cover ko/es/fr. §9 (Korean), §10
(Spanish), §11 (French), §12 (sidecar install + Lexique attribution) below
have the full per-language precision tables, "chunk" definitions, and
findings. This section is kept as the ORIGINAL pre-A7e scoping note (what
the research brief predicted) — read it as history, not current status;
where it turned out wrong, the correction is inline.

Per the original research brief (`docs/project-review-2026-09-17.md` §2):

- **KO**: Kiwi (free, Node bindings) as the lexical analyzer; no KO
  acceptability dataset exists to calibrate a Q3-equivalent precision bar
  against, so budget for the same "measure before enforce" pass this lane
  ran for JA. KO has no IR compiler (hand-authored TS tables), so Q2's IR
  `lexiconKanas` source and Q8's `diagnoseModule` reuse have no equivalent —
  a KO port needs its own whole-course-vocabulary source and gloss-diagnostic
  tool, or those two questions stay JA-only.
  — **Confirmed correct.** Used `kiwipiepy` (the Python binding, not a Node
  package — "Kiwi... Node bindings" undersold it: the Python binding is the
  one that installs cleanly offline via `uv pip`, mirroring the JA sidecar's
  own Python-via-uv pattern rather than adding an npm dependency). Q2/Q3 use
  the whole-course course-atom set (`getCourseAtomSurfaces`, already
  language-generic via `registry.ts`) instead of an IR lexicon — no IR
  needed after all, since course atoms alone cover the same "whole-course
  known word" role `lexiconKanas` played for JA. Q8 stays JA-only (§7 below,
  unchanged call).
- **ES/FR**: simplemma (MIT, 19MB) for lemmatization + Lexique 3.83
  (CC BY-SA) for frequency/POS facts. Both compile via IR
  (`compile-ir-es.mjs`/`compile-ir-fr.mjs`), so Q2/Q8's IR-reuse pattern
  ports directly. FR's `fr-quality.test.ts` is already the Q9 source for ES/FR
  too (this lane ported it FROM there for JA, not the other direction).
  — **Partly wrong, corrected 2026-09-17 (lane A7e):** ES has committed
  YAML IR (`src/features/languages/es/curriculum/ir/*.ir.yaml`) but no
  committed `.ir.json` the way JA does — `compile-ir-es.mjs` compiles
  straight to a TS module, never a JSON artifact this bridge can read. FR's
  ONLY `ir/` directory is `_archive/` — off every live path. Neither
  language has the artifact Q8's `loadIr` needs, so Q8 stays `n/a` for
  ko/es/fr too (§9-§11) — this is now explicit in code
  (`q8-gloss-matches.mjs`'s `appliesTo`/`naReason`), where it was
  previously an unguarded landmine: calling `loadIr("m1")` for an ES/FR
  `ctx.moduleId` would have silently resolved JA's OWN `m1.ir.json` (ids
  collide across courses) and fed `diagnoseModule` the wrong language's IR
  entirely — caught and fixed before it ever ran, not found as a live bug.
  simplemma + Lexique were used as described; the "no IR needed" note above
  (KO) turned out to apply to Q2/Q3 for ES/FR too — course atoms sufficed.
- **2026-09-17 update**: JA's Q2/Q3 now also lean on JMdict (§3v3, §8a) —
  a KO/ES/FR port of either question needs an equivalent open dictionary
  with headword + common-word-flag + POS data (KO: no single obvious
  JMdict-equivalent identified yet, worth a short spike before committing
  to Kiwi-alone; ES/FR: Wiktionary data dumps are the closest open
  equivalent to JMdict's shape, unverified for this use).
  — **Turned out unnecessary.** ES/FR are space-tokenized, so Q2's real
  question became "do tiles reconstruct the sentence at word boundaries"
  (mechanical, no dictionary) rather than "is this span a real word" —
  see §10/§11's "chunk" definitions for why a JMdict-shaped dictionary was
  never the right tool for this half of the redefinition. Lexique fills the
  FR frequency/POS role JMdict's POS tags played for JA; simplemma's
  dictionary-membership check is installed and available (§12) but not
  load-bearing for the current pass/fail boundary — see §11's precision
  writeup for exactly where it is and isn't used.
- **All three**: Q4 (particle-own-tile) and Q10 (kanji-before-intro) are
  JA-specific by construction (kana/kanji script mechanics) and have no
  direct KO/ES/FR equivalent — a KO/ES/FR question set replaces them with
  whatever each language's own recurring structural defect is (see each
  course's own `docs/*-authoring-invariants-pinned.md` /
  `fr-authoring-playbook.md` for candidates).
  — **Confirmed correct; no replacement built this lane.** Both stay `n/a`
  for ko/es/fr with an explicit reason (`naReason` exports on both checks)
  rather than a silent generic "not applicable" — per the protocol's own
  "n/a always in the evidence" doctrine (§1). No KO/ES/FR-specific
  replacement question was scoped or built here; each course's own
  recurring defect class (if any) is still open work, not a regression.

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

---

## 9. Korean — precision, findings, sidecar (2026-09-17, lane A7e)

**Tool**: Kiwi (`kiwipiepy`, the Python binding — installs offline via
`uv pip` after one fetch, same pattern as the JA sidecar; no npm package
was added). Licence: **LGPL v3** (the underlying Kiwi C++ library and the
`kiwipiepy` binding both ship that licence — `Copyright (c) 2017,
bab2min`). Used exactly like Grammalecte elsewhere in this repo's doctrine:
invoked as a **subprocess** by a QA-only sidecar script, never imported
into shipped app code — no distribution/linking obligation is triggered.
Install: §12.

**"Chunk" for KO**: unlike ES/FR, KO is NOT purely space-tokenized —
Korean 표준 띄어쓰기 (standard word-spacing) attaches a particle or the
copula (조사/이다 — 은/는/이/가/을/를/에서/부터/까지/이에요/예요...) DIRECTLY
to the preceding noun with **no space** ("학생이에요" = 학생 "student" +
이에요 copula, one orthographic word/어절), even though a genuine BUILD
exercise deliberately tiles the stem and its particle/copula SEPARATELY so
the learner practices choosing the right one — the exact same pedagogical
move as JA's Q4 (particle gets its own tile). So KO sits between JA
(sub-word morpheme boundaries matter, no spaces at all) and ES/FR (pure
word boundaries, particles/prepositions are separate space-delimited
words): Q2 for KO compares the tiles-joined-with-NO-space against the
target sentence with all spaces stripped too (`lib/wordChunk.mjs`'s
`sentenceReconstructs`, KO branch) rather than the ES/FR word-joined rule.
Q3 uses Kiwi's own morphological tags directly (content POS vs
particle/ending/copula tags — `koContentMorphemeCount`), the direct KO
analogue of JA's fugashi fallback, arguably a better fit than a hand table
since Kiwi already segments KO's agglutination the way UniDic does for JA.

### Precision table (Korean)

| Q | Scope (applicable) | Hits | Audited | True | Precision | Verdict |
|---|---|---|---|---|---|---|
| Q2 | 58 build/listen steps, 27 modules | 0 | — | — | vacuous (0/0) | **enforced**, baseline 0 |
| Q3 | 49 build/listen steps, 27 modules | 8 | all 8 | 0 | **0%** | **informational** (see below) |
| Q9 | 270 lessons | 191 | n/a (structural, not audited item-by-item) | — | — | **enforced**, baseline 191 (pre-existing, see below) |

**Q2's 0 hits** came only after the space-stripping fix above — the
word-joined ES/FR rule false-flagged 5/58 steps (tiles `["학생","이에요"]`
for `"학생이에요"` — a correct, intended particle/copula split, not a
defect) before that fix.

**Q3's 8 hits, 0 true (hand-audited, all 8):**
1. `일하고 나서` / `씻고 나서` (m16) — the grammaticalized **"V-고 나서"**
   ("after doing V") construction; 나서 functions as a connective here, not
   independent content — the exact KO analogue of JA's v2 "class 2"
   (V-te + aspectual auxiliary the POS scheme alone can't distinguish from
   content).
2. `있을 거예요` (m18) — the **"-을 거예요" future/conjecture** construction
   (것/거 "thing" + 이에요 copula, grammaticalized); 거 tags as a bound
   noun (NNB) but is not real content here.
3. `할 줄 알아요` (m24) — the **"-(으)ㄹ 줄 알다"** ("know how to V")
   fixed grammatical pattern; 줄 (NNB, "way/method") is part of the
   construction, not an independent noun.
4. `열이 나요` (m20) — "have a fever," a coherent idiomatic
   subject+verb clause (fever + occur), the KO analogue of the FR "café
   est fermé" class (§11) — grammatically two morphemes, pedagogically one
   short idiom.
5. `잘해요.` ×2 (m23) — 잘하다 ("to be good at / do well") is usually
   taught as ONE compound verb even though 잘(adverb)+하다(verb) are two
   morphemes — the KO analogue of JA's v2 "class 1" legitimate compound.
6. `엄마, 아빠,` / `그리고 저요` (m19) — a coordinated list ("mom, dad, ...
   and me too"); two independently real nouns listed together, not
   accidental shrapnel.

None of the 8 is the intended defect class (two UNRELATED content words
glued with no grammatical reason). This mirrors JA's own v2 finding
exactly: Kiwi's POS tags alone, without a KO-specific auxiliary-
construction table and a real dictionary (JMdict's KO-equivalent, not
identified — §7), can't distinguish a grammaticalized pattern or a fixed
compound from real two-word shrapnel. **Kept informational for KO only**
— `q3-one-content-word-per-chunk.mjs`'s `enforced` export is a
per-language function (`(ctx) => ctx?.lang !== "ko"`), resolved by
`index.mjs`'s new `resolveEnforced` helper (the one place this
per-language distinction is read; every other check's `enforced` stays a
plain boolean, unchanged contract). The finding count is still tracked in
the baseline (`ko.Q9`-style ratchet discipline) so a genuinely NEW class of
KO shrapnel would still show up as a count rise for a human to look at —
"informational" means a "no" doesn't fail CI on its own, not that
regressions go untracked. Promotion path: a KO-equivalent of JMdict (§7)
plus an auxiliary-construction table (거예요/줄 알다/고 나서/...), mirroring
JA's v2→v3 promotion exactly.

**Q9's 191, structural not per-lesson:** unlike JA (4 findings, all m1
kana-row lessons — one narrow class) or FR (6, all module-closing recap
lessons), KO's 191 failures are spread 6-8 per module across ALL 27
modules (`m1`: 2, `m2`: 3, `m3`-`m27`: 6-8 each) — 97 pure step-count-band
violations, 86 both step-count AND a 4+ selection-only run, 8 selection-
run-only. This reflects the KO course's own lesson-granularity house
style: many short, focused sub-lessons per module (`ko-m8-5`, `ko-m8-6`,
`ko-m8-7`, ...) rather than JA/ES/FR's fewer, longer teaching lessons —
Q9's 10-25 step band was tuned against FR's own lesson shape
(`fr-quality.test.ts`, §2) and doesn't fit KO's. This is a **course-
structure characteristic, not 191 individual authoring slips** — reported
here as a single pattern-level finding, baselined at 191 (pre-existing,
untouched by this lane, out of its file-ownership scope: KO lesson
content). A future KO-focused lane should decide whether to (a) re-author
toward longer lessons, or (b) give KO its own step-band constant the way
this doc's Q9 doc-comment already reasons about "teaching lesson" kind —
either is a real content/product decision, not a tooling fix.

---

## 10. Spanish — precision, findings, sidecar (2026-09-17, lane A7e)

**Tool**: simplemma (MIT, ~19MB, installs offline via `uv pip`) for
lemmatization + dictionary-membership (`is_known`). Install: §12. No
Spanish frequency/POS dataset is bundled — SUBTLEX-ESP's licence is
unclear per the research brief, so it was **not fetched**; ES's Q3
content/function classification uses a small closed-class table
(`FUNCTION_WORDS_ES` — articles, prepositions, clitic/subject pronouns,
conjunctions) instead, the direct ES analogue of JA's Q4 PARTICLES table.

**"Chunk" for ES**: purely space-tokenized, and the authoring guide
(`docs/es-lesson-authoring-guide.md` §14) explicitly sanctions **multi-
word tiles** for fixed expressions and build alternates («ahora voy a la
playa» reorders, «también» either side) — so a chunk here is "whatever the
authors tiled together," and the two questions this redefines are:
Q2 = do the tiles, joined word-for-word, exactly reconstruct
`targetSentence` (a tile that fragments a single orthographic word, e.g.
"corr"+"iendo" instead of "corriendo," fails this — a multi-word tile
like «buenas noches» does not, since the reconstruction is still exact);
Q3 = does any tile carry 2+ independent CONTENT words, once glue (the
function table) and a registered whole-course atom (the fixed-expression
escape — «por favor», «buenas noches» are both course atoms) are excluded.
Two structural exclusions, found and fixed during measurement (see §11 for
the identical FR classes, discovered on the larger/richer FR hit set and
ported back here): a NUMBER+unit-noun phrase («cuarenta euros», none found
in ES but the rule is shared code) counts as one pedagogical unit, and a
capitalized word is read as a proper noun (comprehension-neutral, never
counted as content).

### Precision table (Spanish)

| Q | Scope (applicable) | Hits | Audited | True | Precision | Verdict |
|---|---|---|---|---|---|---|
| Q2 | 1,101 build/listen steps, 38 modules | 0 | — | — | vacuous (0/1,101) | **enforced**, baseline 0 |
| Q3 | 1,101 build/listen steps, 38 modules | 0 | — | — | vacuous (0/1,101) | **enforced**, baseline 0 |
| Q9 | 379 lessons | 0 | — | — | — | **enforced**, baseline 0 |

**No findings.** Every ES build/listen step's tiles already reconstruct
the target sentence exactly and carry at most one content word (the atom
escape covers every genuine multi-word tile measured — «buenas noches»,
«por favor», «tengo que», «je vais»-equivalents). Unlike FR (§11), no
grammaticalized multi-word construction pattern (passé-composé-style
auxiliary chunks) appears un-registered in the ES corpus at this pass —
either ES's course doesn't use that pattern as heavily yet, or its chunk
atoms are more consistently registered. Not investigated further (out of
this lane's "report, don't fix" scope, and there is nothing TO report —
zero findings). Q1/Q6 (informational) both run cleanly for ES (`gate.ts`'s
`getNormalizedCourseAtoms("es")` has a real adapter, unlike FR — §1 below).

---

## 11. French — precision, findings, sidecar (2026-09-17, lane A7e)

**Tools**: simplemma (MIT, as ES) + **Lexique 3.83** (CC BY-SA 4.0) for
FR-specific frequency/POS facts (`cgram` — grammatical category). Fetch +
attribution: §12. FR's Q3 `classifyWord` checks the same closed-class
table as ES first (`FUNCTION_WORDS_FR`), then falls back to Lexique's
`cgram` (ART/PRE/PRO/CON = function) for anything the table doesn't
resolve (`lib/lexique.mjs`'s `isFunctionWord`).

**"Chunk" for FR**: same definition as ES (§10) — space-tokenized,
multi-word tiles sanctioned for fixed expressions and, per
`fr-authoring-playbook.md`'s own language, **chunked conjugations**
("verbs are CHUNKS... until the m11 checkpoint" for `avoir`-based
constructions like «j'ai mangé», continuing past m11 for the négation
frame and `venir de` near-past). This mattered concretely: FR exercises
this multi-word-tile allowance far more than ES, which is why FR's audit
below found real classes ES didn't.

### Precision table (French)

| Q | Scope (applicable) | Hits | Audited | True | Precision | Verdict |
|---|---|---|---|---|---|---|
| Q2 | 451 build/listen steps, 26 modules | 0 | — | — | vacuous (0/451) | **enforced**, baseline 0 |
| Q3 | 281 build/listen steps (after the phrase-choice-bank exclusion, see below) | 13 | all 13 | 13 | **100%** | **enforced**, baseline 13 |
| Q9 | 253 lessons | 6 | n/a (structural) | — | — | **enforced**, baseline 6 |

**Q3 measurement history — four false-positive classes found and fixed
before the audited 13, all now baked into `lib/wordChunk.mjs` (shared by
ES/KO where applicable):**

1. **Atom-priority bug** (263 → 139 hits): the first pass checked
   course-atom membership BEFORE the function-word table, so a word like
   "un" (article) or "je" (subject pronoun) — ALSO separately registered
   as a course atom (numbers, early-module pronoun vocab) — misclassified
   as content. Fixed by checking the function table first.
2. **Number+unit-noun phrases** (139 → 87 hits): «quarante euros», «cent
   euros», «trois heures» — a cardinal number + a currency/time unit noun
   is one pedagogical price/time unit, the direct FR analogue of JA's
   number+counter class-1 ruling (さんじ "3 o'clock"). `isNumberPhrase`
   recognizes a FR cardinal-number regex (covering compounds like
   "quatre-vingt-dix-neuf") + a small unit-noun set (euro/cent/mille/
   heure/...).
3. **avoir/être auxiliary forms** (87 → 48 hits): "c'est", "il est",
   passé-composé "je suis allé" / "j'ai mangé" — ambiguous by surface
   form alone (full verb vs. copula vs. auxiliary), added to the function
   table since the downside (missing a genuine 1-content-word tile) never
   fires (a tile needs 2+ content words to flag at all).
4. **Proper nouns by capitalization** (48 → 46, then interacting with the
   avoir/être fix down further): "le sac de **Thomas**" — a capitalized
   surface reads as a name (comprehension-neutral, the ES/FR script-level
   analogue of `gate.ts`'s curated JA/KO `PROPER_NOUNS` list — FR/ES names
   aren't centrally registered the way JA/KO's are, so this is automatic
   by casing rather than a curated table).
5. **Phrase-choice banks** (48 → 13 hits, the final and largest single
   cut): steps like `fr-m13-8-build-2` (tiles `["je n'ai pas de sœur",
   "et toi ?", "je n'ai pas de frère", "j'ai une sœur"]`) are a
   DISCRIMINATION exercise between competing WHOLE-CLAUSE tiles, not a
   word-level build — the FR/ES analogue of JA's `picker: true`
   register-choice exclusion (§3, finding #10) which this lane's own
   research had already flagged as the exact category-error pattern to
   watch for. Detected structurally (`isPhraseChoiceBank`): any
   DISTRACTOR tile (not used in `correctOrder`) whose own word count is
   at least half the target sentence's — a genuine word-level bank's
   distractors are short (one word); a phrase-choice bank's distractors
   are full alternate clauses by construction. Excluded from `appliesTo`
   with a specific `naReason`, not folded into the function table.

**The remaining 13, hand-audited TRUE (all 13):**

| Lesson | Step | Tile | Reading |
|---|---|---|---|
| fr-m14-2 | build-hiersoirq | «hier soir ?» | adverb+noun time compound |
| fr-m15-9 | build-tudejavisite | «visité le parc ?» | verb+object VP |
| fr-m16-10 | build-2 | «tu n'as pas mangé» | negation+verb |
| fr-m18-1 ×2, m18-2 ×2, m18-5, m18-9, m18-10 | build-\* | «mangé de gâteau/fromage/pizza/chocolat» | verb+partitive-object |
| fr-m24-4 | build-jusdepommebaguette | «un jus de pomme» | noun+de+noun compound |
| fr-m26-3, m26-9 | build-toursmaison | «une cuisine et un jardin» | coordinated noun list |

Every one is a **coherent, fully-compositional short verb-phrase or
noun-phrase** (never two grammatically unrelated content words forced
together) — the same "gray area" class §9 names for KO's own false
positives, except here the judgment call goes the OTHER way: these ARE
counted as true findings, because Q3's question is literally "does this
tile carry at most one content word," and by that strict reading the
answer is factually "no" — these are real, if minor, GRANULARITY
findings: gluing "mangé" (ate) to its food object, or "visité" to its
place object, denies the learner a chance to place each content word
independently, the same testing-value argument the whole procedural-QA
programme is built on. **Not fixed here** (out of this lane's file-
ownership scope — content JSON/IR), reported for a future authoring lane;
baselined at 13 per the C7 ratchet doctrine (a future fix must LOWER the
baseline in the same commit that lowers the true count, not just resolve
CI).

**Q9's 6**, unlike KO's 191 (§9) or JA's 4 (m1 kana rows, one class), are
ALL module-closing recap lessons (`fr-m11-10`, `fr-m12-10`, `fr-m19-10`
through `fr-m22-10` — the `-10` slot), 6-9 steps each, below the 10-25
teaching-lesson band by design (a short recap, not a full lesson) — the
FR analogue of the SAME "review/recap/challenge" carve-out Q9's own
`isTeaching` regex already grants for ids CONTAINING those words, except
these ids don't literally contain "recap"/"review" so the regex misses
them. A tooling fix (broaden the regex, or key off lesson POSITION within
a module) is plausible future work; not made here (baselined as-is,
pre-existing, out of scope).

**Q1/Q6 (informational) are `n/a` for EVERY FR step, not computed at
all**: `gate.ts`'s `getNormalizedCourseAtoms("fr")` has no adapter in
`normalizedAtoms.ts`'s `buildAtomsFor` switch (`ja`/`ko`/`es` cases exist,
`fr` falls to the `default: return []` branch) — FR is "registered but not
selectable" per `registry.ts`'s own comment (gated off
`AVAILABLE_LEARNING_LANGUAGE_IDS` separately), and nobody has yet wired a
`fromFrAtom` adapter the way ES/KO/JA each have one. Computing Q1/Q6
against an always-empty atom list would report EVERY non-trivial FR
surface as 100% unknown — not a real signal, pure noise — so both checks
short-circuit to `n/a` with that reason for `lang === "fr"` specifically
(`q1-known-words.mjs`/`q6-coverage-95.mjs`). This is a real gap in
`normalizedAtoms.ts` (out of this lane's file-ownership scope —
`src/features/**`), not a procedural-QA bug; fixing it would need a
`fromFrAtom` adapter mirroring `fromEsAtom`'s shape.

---

## 12. KO/ES/FR lexical sidecars — install, architecture, attribution (2026-09-17, lane A7e)

Mirrors the JA sidecar's layout (§8) — a `fetch-*.mjs` for any downloaded
resource (sha256-pinned), a Python `sidecar.py` invoked as a subprocess, a
Node `sidecar.mjs` wrapper that batches + caches, and an on-disk cache
under `artifacts/lexical/<lang>/` (gitignored, already covered by the
repo-wide `artifacts/` rule — no `.gitignore` change was needed this
lane). `scripts/lexical/*/.venv/` was already gitignored broadly enough
(`scripts/lexical/*/.venv/`, added by the JA lane) to cover `ko/`, `es/`,
`fr/` automatically.

### Korean (`scripts/lexical/ko/`)

```bash
cd scripts/lexical/ko
uv venv .venv --python 3.11
uv pip install --python .venv/bin/python kiwipiepy
```

`kiwipiepy` 0.23.2 (pulls in `kiwipiepy-model` 0.23.0, `numpy`, `tqdm`).
Licence: **LGPL v3** (Kiwi, `Copyright (c) 2017, bab2min`,
<https://github.com/bab2min/Kiwi>) — used only as a QA-time subprocess,
never imported into shipped app code (same posture as Grammalecte
elsewhere in this repo). `sidecar.py` reads `{id, text}` JSON from stdin,
tokenizes with `Kiwi().tokenize()`, writes `{id, tokens: [{surface, tag,
start, end}]}`. `sidecar.mjs` batches + caches under
`artifacts/lexical/ko/<sha1>.json`, same shape as the JA wrapper. No KO
frequency/POS dataset was fetched — Kiwi's tag set alone was sufficient
for Q3's content/function split (§9); a future KO frequency source, if
wanted, is a separate spike (no single obvious candidate identified,
matching the original research brief's own uncertainty here).

### Spanish / French (`scripts/lexical/es/`, `scripts/lexical/fr/`)

```bash
cd scripts/lexical/es   # or scripts/lexical/fr
uv venv .venv --python 3.11
uv pip install --python .venv/bin/python simplemma
```

`simplemma` 2.0.0. Licence: **MIT** (Adrien Barbaresi, 2021 — see
`.venv/lib/python3.11/site-packages/simplemma-2.0.0.dist-info/licenses/
LICENSE`), ~19MB (lemmatization dictionaries bundled as package data, no
separate download). `sidecar.py` (the same source file, kept as two
literal per-language copies matching the JA sidecar's per-directory
convention, not a shared import — each language's venv is independently
recreatable) reads `{id, text}` + a `lang` argv (`es`/`fr`), tokenizes with
`simplemma.simple_tokenizer`, and reports `{surface, lemma, isKnown}` per
token via `simplemma.lemmatize`/`simplemma.is_known`. `sidecar.mjs`
batches + caches under `artifacts/lexical/<es|fr>/<sha1>.json`.

**Not currently load-bearing for the Q2/Q3 pass/fail boundary** (§10/§11
explain why — the redefined "chunk" questions turned out to be either
mechanical (Q2) or table/Lexique-driven (Q3's content/function split));
installed, tested end-to-end (`node -e "...tagBatch(...)"` — verified
against real Spanish/French sentences), and available for a future check
that needs a real dictionary-membership or lemma-normalization fact.

### Lexique 3.83 (`scripts/lexical/fr/fetch-lexique.mjs`)

```bash
node scripts/lexical/fr/fetch-lexique.mjs           # fetch if missing, (re)build index if stale
node scripts/lexical/fr/fetch-lexique.mjs --force    # re-download + rebuild
```

- **Source**: Lexique (<http://www.lexique.org>) — New, Pallier,
  Brysbaert, Ferrand et al., a French lexical database (~140,000
  orthographic forms) with lemma, grammatical category (`cgram`),
  gender/number, and corpus frequency (subtitle + book corpora) per entry.
- **Licence**: **CC BY-SA 4.0** (the release zip's own
  `README-Lexique.txt`: "License: CC BY SA40.0"). Attribution is required
  whenever the data (or a derivative, like this compact index) is used or
  redistributed — this doc and `fetch-lexique.mjs`'s own header comment
  are where that attribution lives; do not strip either when reusing the
  index elsewhere. Cite: New, B., Pallier, C., Brysbaert, M., Ferrand, L.
  (2004), "Lexique 2: A New French Lexical Database," *Behavior Research
  Methods, Instruments, & Computers*, 36(3), 516-524.
- **Pinned release**: `http://www.lexique.org/databases/Lexique383/
  Lexique383.zip`, fetched 2026-09-17, sha256
  `e181d132b3b0d3d87efc98d376968441b517353933011cebea5366321a6024e6`
  (`fetch-lexique.mjs` refuses to proceed on a mismatch).
- **What's built**: downloads + sha256-verifies the zip, extracts
  `Lexique383.tsv` (142,694 rows, 35 columns), compacts to
  `artifacts/lexical/lexique/index.json` (125,653 distinct orthographic
  forms, each mapped to its `{lemme, cgram, freq, isLemma}` entries —
  dropping phon/syll/morphoder/etc columns this lane never reads).
  `scripts/qa/procedural/lib/lexique.mjs` is the read-only lookup layer
  (`lookupOrtho`, `hasOrtho`, `isFunctionWord`) FR's Q3 check goes
  through. Both `artifacts/lexical/lexique/` (the index AND the raw
  download) stay gitignored, matching every other sidecar-cache
  convention in this repo.

### Per-language `enforced` — a new mechanism (2026-09-17, lane A7e)

Every check's `enforced` export was a plain boolean before this lane. Q3
is now the first (and, as of this lane, only) check where it's a
**function** `(ctx) => boolean` — KO's Q3 measured precision doesn't clear
the 0.9 bar (§9), so KO's answers stay informational while JA/ES/FR's stay
enforced, using the SAME check code and finding logic. `index.mjs`'s new
`resolveEnforced(check, ctx)` is the one place this is read; every other
reader (the CLI table, `run.mjs`'s `anyEnforcedFail`,
`printInformationalSummary`) consumes the already-resolved `enforced`
boolean on each step's RESULT object, so nothing else needed to change.
Future questions that need this: export `enforced` as a function instead
of a boolean, and document the precision split in this doc the way §9
does for Q3/KO.

---

## 13. Vacuity on CI (2026-09-17, lane A7f)

**What was vacuous.** Every enforced question's `appliesTo(step, ctx)`
returns `false` for every step when the artifact/sidecar it needs isn't
present — JA's Q2/Q3 need `artifacts/lexical/jmdict/index.json`
(`jmdictAvailable()`), Q3 additionally needs the JA fugashi/unidic-lite
sidecar venv (`sidecarAvailable()`), KO's Q3 needs the kiwipiepy venv. CI
(`.github/workflows/ci.yml`, `deploy.yml`) never created a Python venv or
fetched JMdict/Lexique before this lane, so on every CI run those
questions answered `"n/a"` for every one of their ~4,000-8,000 applicable
JA steps and passed with **0 findings** — not because content is clean,
but because nothing was graded. Green and vacuous looked identical
(`prove-the-verifier-can-fail` memory rule; `docs/gate-vacuity-2026-09-17.md`
§5's rule: "a new check ships with a planted-failure test").

**The fix has two parts** (§1/§2 below), verified for real on CI, not
just locally (§3).

### §1 — applicable-steps floors

`src/test/proceduralQa.baseline.json`'s shape changed from
`{question: count}` to `{question: {max, minApplicable}}`. `max` is the
existing finding-count ceiling, unchanged for every entry. `minApplicable`
is a floor on how many steps the question actually got to grade (answered
`"yes"`/`"no"`, not `"n/a"`) for an ENFORCED question — set to
`Math.floor(measured × 0.95)`, so an ordinary content edit (a lesson
added/removed, a step's type changed) has ~5% headroom before it trips,
but a sidecar/artifact going missing — which collapses the applicable
count toward 0 — cannot hide.

Measured (this machine, sidecars/artifacts present, 2026-09-17) vs. the
committed floor:

| Lang | Q | Applicable (measured) | Floor (`minApplicable`, 95%) |
|---|---|---|---|
| ja | Q2 | 4,123 | 3,916 |
| ja | Q3 | 4,134 | 3,927 |
| ja | Q4 | 4,241 | 4,028 |
| ja | Q5 | 3,849 | 3,656 |
| ja | Q7 | 8,148 | 7,740 |
| ja | Q8 | 543 | 515 |
| ja | Q9 | 576 | 547 |
| ja | Q10 | 8,586 | 8,156 |
| ko | Q2 | 58 | 55 |
| ko | Q5 | 864 | 820 |
| ko | Q7 | 828 | 786 |
| ko | Q9 | 270 | 256 |
| es | Q2 | 1,101 | 1,045 |
| es | Q3 | 1,101 | 1,045 |
| es | Q5 | 2,504 | 2,378 |
| es | Q7 | 4,272 | 4,058 |
| es | Q9 | 379 | 360 |
| fr | Q2 | 451 | 428 |
| fr | Q3 | 281 | 266 |
| fr | Q5 | 1,413 | 1,342 |
| fr | Q7 | 2,115 | 2,009 |
| fr | Q9 | 259 | 246 |

(ES's applicable counts weren't in the original brief's measured list —
measured here for the first time: `node scripts/qa/procedural/run.mjs
--lang es --enforced-only --json`, summed over `report.rows` for every
`enforced` question with `answer !== "n/a"`.)

`src/test/proceduralQa.test.ts` computes these counts itself from
`report.rows` (already returned by `run.mjs` — no change to `run.mjs`'s
output shape was needed) and fails with a message naming the likely
missing sidecar/artifact (`missingArtifactHint`) when a count falls below
its floor. Every other floored question (Q4/Q5/Q7/Q8/Q9/Q10 for JA, all of
KO/ES/FR's floored questions) has no external sidecar dependency — a floor
miss there means module content itself shrank, not a missing artifact,
and the message says so.

**To raise/lower a floor:** re-measure (`node scripts/qa/procedural/run.mjs
--lang <lang> --enforced-only --json`, sum `answer !== "n/a"` per enforced
question over `report.rows`), take 95% of the new true count, and update
`minApplicable` in the same commit that explains why applicable steps
changed (more/fewer lessons, a step-type change) — same C7 ratchet
discipline as `max` (`regression-classes` C7): never raise a ceiling or
lower a floor without a stated cause.

**Deliberate-failure proof** (`LINGO_LEXICAL_PYTHON_JA`, added this lane —
see §2's sidecar env-override note): pointed at a nonexistent interpreter,
`sidecarAvailable()` for JA returns `false`, so Q3's `appliesTo` (which
needs `sidecarAvailable() && jmdictAvailable()`) returns `false` for every
step and the whole-course run cold-cache took 21.6s and printed:

```
 × ja: no enforced question's finding count exceeds its committed baseline,
   and none falls below its applicable-steps floor
   → procedural-QA ratchet tripped for ja (all 46 modules) — either a
     finding count rose above its committed ceiling, or a question's
     applicable-steps count fell below its committed floor (the question
     went vacuous — see 'prove the verifier can fail' / this doc's
     § Vacuity on CI). Either fix the new finding(s)/restore the missing
     sidecar or artifact, or prove the change is a re-measurement (not
     new debt/not new vacuity) and update the baseline explicitly
     (regression-classes C7):

Q3: only 0 applicable step(s), below the committed floor 3927
(src/test/proceduralQa.baseline.json's "ja.Q3.minApplicable") — likely
missing artifacts/lexical/jmdict/index.json
(`node scripts/lexical/ja/fetch-jmdict.mjs`) and/or the JA sidecar venv at
scripts/lexical/ja/.venv (`cd scripts/lexical/ja && uv venv .venv
--python 3.11 && uv pip install --python .venv/bin/python -r
../requirements-ja.txt`, pins in scripts/lexical/requirements-ja.txt) —
or LINGO_LEXICAL_PYTHON_JA / LINGO_LEXICAL_PYTHON pointed at a path with
no working interpreter there
```

ja.Q2 (which needs only the JMdict index, not the sidecar) stayed green in
the same run, confirming the floor is per-question, not a blanket "JA
broke" signal. A second proof renamed `artifacts/lexical/jmdict` itself
(simulating a missing/never-fetched index): both ja.Q2 and ja.Q3 dropped
to 0 applicable and failed, each with its own artifact-specific hint.
Both proofs reverted; the suite is green again (`npx vitest run
src/test/proceduralQa.test.ts` — 4/4 passing).

### §2 — CI installs the sidecars for real

`.github/workflows/ci.yml`'s `unit-tests` job (both shards — it's one job
definition under a `matrix:`, so this runs identically in each) and
`.github/workflows/deploy.yml`'s `build` job now run, before the vitest
step:

1. `actions/setup-python@v5` (Python 3.11).
2. `astral-sh/setup-uv@v10.1.0` (pinned to an exact release — the action
   only publishes floating major tags through `v7`; `v8`+ are exact-version
   tags only, confirmed via `gh api repos/astral-sh/setup-uv/tags`; a bare
   `@v10` failed the first CI attempt with "unable to find version v10")
   with `enable-cache: true` and `cache-dependency-glob` pointed at
   `scripts/lexical/requirements-{ja,ko}.txt` — this warms uv's own
   wheel/build cache so a repeat `uv pip install` resolves near-instantly.
3. `actions/cache@v4` for `artifacts/lexical/{jmdict,lexique}`, keyed on
   `hashFiles('scripts/lexical/ja/fetch-jmdict.mjs',
   'scripts/lexical/fr/fetch-lexique.mjs')` — those two files carry the
   sha256 pins, so the key changes exactly when the pinned release does.
4. Fresh JA/KO venvs every run (`uv venv .venv --python 3.11 && uv pip
   install --python .venv/bin/python -r ../requirements-{ja,ko}.txt`) —
   created new each run rather than cached as a directory, to avoid venv
   path-portability pitfalls; cheap because the wheels come from uv's
   cache (step 2).
5. `node scripts/lexical/ja/fetch-jmdict.mjs` + `node
   scripts/lexical/fr/fetch-lexique.mjs`, skipped when step 3 was a cache
   hit (`if: steps.lexical-artifacts-cache.outputs.cache-hit != 'true'`).

**Both pinned deps installed cleanly on the runner** — JA's `fugashi`
1.5.2 / `unidic-lite` 1.0.8 and KO's `kiwipiepy` 0.23.2 (+
`kiwipiepy-model` 0.23.0, `numpy` 2.4.6, `tqdm` 4.70.1) all have prebuilt
wheels for the `ubuntu-latest` runner's platform/Python combination — no
"no wheel available, needs a C compiler" failure to work around. KO's
floor stays at the full measured value (§1); no reduced floor was needed.

`scripts/lexical/{ja,ko,es,fr}/sidecar.mjs`'s Python-interpreter path is
now env-overridable: `LINGO_LEXICAL_PYTHON_JA` / `_KO` / `_ES` / `_FR`
(per-language), or `LINGO_LEXICAL_PYTHON` (applies to every sidecar that
doesn't have its own override set) — falling back to the existing
repo-relative `<sidecar-dir>/.venv/bin/python` default when neither is
set. CI doesn't need this (the default path is exactly where the new
workflow steps install to); it exists for the deliberate-failure proof
above and for any environment that keeps the interpreter somewhere else.

### §3 — verified for real on CI

Branch `lane/A7f`, pushed to `origin` and opened as a draft PR against
`feedback-2026-09-14` (open-lingo/lingo#10) — `ci.yml`'s `on:` block is
`push: branches: [main]` + `pull_request:` (no base-branch filter on the
latter), so a PR against any base triggers it; `feedback-2026-09-14` had
to be pushed to `origin` first for the PR to have a valid base (it only
existed locally in worktrees before this lane — a non-main push, allowed
per this lane's brief).

**First (cold-cache) CI run** — `ci` run
[35277581223](https://github.com/open-lingo/lingo/actions/runs/35277581223),
commit `740053cb`, both `unit-tests` shards **passed**. The new sidecar
step block's real wall time on an `ubuntu-latest` runner, cold (no
`actions/cache` hit yet for either the uv wheel cache or the JMdict/Lexique
artifacts):

- Shard 1: `setup-python` start 21:36:59.690 → `fetch-lexique` done
  21:37:25.782 = **26.1s**.
- Shard 2: `setup-python` start 21:36:57.429 → `fetch-lexique` done
  21:37:21.235 = **23.8s**.

Both shards raced to save the `lexical-artifacts-*` cache key; shard 2 won
(`Cache saved with key: lexical-artifacts-7e577aaf...`), shard 1 got the
expected "another job may be creating this cache" warning (not a
failure — `actions/cache` treats this as a no-op, not an error). Both
shards independently saved the uv wheel cache
(`setup-uv-2-x86_64-unknown-linux-gnu-ubuntu-24.04-3.11.16-...`).

**Gate job output on the runner** (shard 1's log, where
`proceduralQa.test.ts` landed — vitest shards by file, this file wasn't
split across shards), confirming every language's applicable counts clear
their floors on a real GitHub-hosted runner, not just this machine:

```
[proceduralQa] ja scope: all 46 modules
[proceduralQa] ja counts: {"Q7":1}
[proceduralQa] ja applicable: {"Q5":3849,"Q4":4241,"Q7":8148,"Q10":8586,"Q2":4123,"Q3":4134,"Q9":576,"Q8":543}

[proceduralQa] ko scope: all 27 modules
[proceduralQa] ko counts: {"Q9":191}
[proceduralQa] ko applicable: {"Q9":270,"Q5":864,"Q7":828,"Q2":58}

[proceduralQa] es scope: all 38 modules
[proceduralQa] es counts: {}
[proceduralQa] es applicable: {"Q9":379,"Q5":2504,"Q7":4272,"Q2":1101,"Q3":1101}

[proceduralQa] fr scope: all 26 modules
[proceduralQa] fr counts: {"Q9":6,"Q3":13}
[proceduralQa] fr applicable: {"Q9":259,"Q5":1413,"Q7":2115,"Q2":451,"Q3":281}

 ✓ app src/test/proceduralQa.test.ts (4 tests) 114122ms
```

Every applicable count is bit-identical to this lane's local measurement
(§1's table) — the runner's fugashi/kiwipiepy/JMdict/Lexique resolve the
exact same content the same way this machine does. `typecheck` and
`gates-nonempty` also passed on the same run, confirming the new workflow
steps didn't break either.

**Second (warm-cache) run**: [FILL IN — cached-run seconds once a second
push/run lands].
