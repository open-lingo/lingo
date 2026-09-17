# Build-tile shrapnel: why や|目|手 keeps happening, and how to close the class

TestFlight #183 (build 23, 2026-09-17): `ja-m34-neo-6-challenge`
「しごとを やめて、ちょきんを はじめることにした。」 compiled to the tiles
しごと|を|**や|め|て**|ちょきん|を|はじめる|こと|にした. やめて (quit, te-form) was
cut into や (particle), め (目 "eye", m22) and て (手 "hand", m22) — and because a
tile's kanji surface is keyed on its atom, the learner saw 目 and 手 in a sentence
about quitting a job.

Spencer: "is it authoring wrong? Do we have a shit compiler? This stuff keeps
happening." Answer: the authoring is fine (the sentence is spaced correctly, and
やめて IS registered — in m36). The compiler is doing exactly what it was written to
do, and what it was written to do is the defect.

## 1. The mechanism

`src/features/lesson/data/moduleCompiler.ts` → `makeTokenizer`:

1. The lexicon for module N = N's own `newAtoms` + `priorAtoms` from **earlier**
   modules + six hard-coded lists (PARTICLES, NAMES, INTERJ, STEMS, COPULA,
   POLITE_ENDINGS).
2. Authored spaces are word boundaries. Inside a chunk the tokenizer is **greedy
   longest-match** over that lexicon. Whatever is left over is covered by any shorter
   entries that fit.
3. The buildability gate (`unbuildable`) rejects a chunk only if some fragment is
   **unknown**. A cover made entirely of known atoms passes, however absurd.

So any gap in the lexicon turns into visible shrapnel, and gaps are structural:

- Inflected forms are registered one surface at a time by hand (438 `derivedFrom`
  atoms across the course). Every form an author uses before it is registered is a
  gap. やめて is registered in m36; m34 cannot see it.
- Single-kana content words exist (め, て, き, は, ひ, え…) and act as universal
  filler: any leftover kana matches one of them.
- The only boundary signal is the author's space; nothing checks that the pieces
  inside a chunk add up to the word the author wrote.

## 2. This is the fourth time

| Date | Surface | Shred | Fix that shipped |
|---|---|---|---|
| 2026-07-27 | かいません | かい・ま・せん (せん = 千) | `POLITE_ENDINGS` list + the `unbuildable` gate lost its `length > 1` escape |
| 2026-07 (m15) | ふるかった | ふる (to fall) + かった (bought) | `priorAtoms` carried into later modules; m15 avoided nine words |
| 2026-09-16 (#173) | とおもう | とお (ten) + もう | m34 respaced; gate `fusedToOmouTileSplit.test.ts` — **for that one surface** |
| 2026-09-17 (#183) | やめて | や + め (目) + て (手) | this lap |

Each fix closed the instance. None closed the class. The #173 gate I wrote yesterday is
the clearest example: it fails on adjacent とお,もう tiles and nothing else. That is
the pattern behind "we have this regression so often": a point fix per incident, no
course-wide measurement, no gate on the invariant that was actually violated.

## 3. What I measured today (and what did not work)

- **Morphological analyzers are not an oracle for kana-only text.** kuromoji
  (already in `node_modules`) run over all 3,528 JA build steps reports 806 "tile
  boundary inside a morpheme" violations — almost all false: it reads じゅぎょう as
  じ|ゅぎょう and げつようび as げ|つよう|びに. IPADIC/UniDic models are trained on
  mixed-script text; our IR is kana-first by design. SudachiPy/fugashi are not
  installed and share the weakness on kana input. Verdict: not usable as the gate
  without kanji surfaces on the input.
- **Lexical heuristics without a function-word tag are noisy.** "≥2 content atoms
  in one chunk" flags 858 chunks; "a ≤2-kana `vocab` atom used as a fragment" flags
  461 — because ので, けど, えん, さん, ちゃ are all registered as `kind: vocab`.
  The lexicon has no POS/function-word tag. That is exactly the gap the queued
  **lexical sidecar** (JMdict POS + Sudachi facts) was written to fill.
- **The precise signature is "a token boundary cuts a word the course knows."**
  やめ (stem of やめる) spans the boundary in や|め|て; おも (stem of おもう) spans
  the boundary in とお|もう; かいま spans かい|ま|せん. たなか|さん|は and みせ|で
  are not flagged (the boundaries sit exactly on word edges). This needs the
  **whole-course** lexicon (earlier AND later modules), which the compiler never had.

Measured (sonnet lane, 2026-09-17): the first version of that rule — boundary cuts a
known word **or its stem** (K minus its last kana) — proved it fails on the やめて step
and then produced 1,195 hits course-wide, 1,184 of them false: two-kana stems collide
with ordinary seams everywhere (いかが 230, いけば 135, んです 85 …). Stems are out.
The 11 true hits were **two more shreds shipping today**, both the #173 comma-vs-space
class: m32/m33 「おすときかいが」→ おす|とき|かい|が (とき steals き from きかい, the
lesson's own new word, 8 beats) and 「…とおとが」→ …|とお|と|が (とお steals お from
おと, 3 beats). Rule v2 = (retokenizing with the whole-course lexicon gives a different
split) OR (a whole word of ≥3 kana spans a boundary); numbers in the ledger.

## 4. Options

**A. Whole-course lexicon + shrapnel gate (this lap).** `compile-ir.mjs` attaches
`lexiconKanas` (every atom kana from every module); `diagnoseModule` emits
`shrapnel` when a boundary cuts a known word or its stem. Closes every case where
the course knows the word somewhere. Cost: ~150 lines, one recompile of m34–m46.
Does not close a form nobody ever registered.

**B. One content word per chunk, by construction (next lap, the structural close).**
The authoring convention already says a space-delimited chunk is one word plus its
function tokens. Make the compiler enforce that shape: inside a chunk, tokens must be
`[content]? [function]*`. If the content part is not a registered atom, emit it as
**one whole tile** (やめて) with no kanji surface and an `unregistered-form` warning
that names the lemma if it can be derived — never as fragments. Shrapnel becomes
impossible to emit. Requires a complete function-token classification (particles,
copula, endings, けど/ので/とき/よう/でしょう/いる-aux…), which is the POS tag from
the lexical sidecar. Cost: sidecar ~1 day (already scoped in
`fb16-research/lexicon-sidecar-brief.md`) + ~1 day compiler and re-gate.

**C. External analyzer as the segmentation oracle.** Rejected by measurement above.
Would only work if the IR carried kanji surfaces for every sentence.

**D. Content sweep driven by A's table.** Register the missing forms in the module
that first uses them (the やめて fix is the template), recompile, re-gate.

## 5. Recommendation

Ship A + D now (build 24 with the orientation lock and the #184 tray fix). Schedule
B behind the lexical sidecar; B is the change that makes this class unrepresentable
instead of merely detected. And a process rule for me: the second time a class
repeats, the fix must include a course-wide measurement and a gate on the invariant,
not on the surface.

## 5b. Process: the procedural question set (Spencer, 2026-09-17 — blocks all authoring)

Spencer's directive after this incident: before any further authoring or content QA,
agents must work through a **procedurally fed question set**, one question at a time,
waiting for each answer and grading it yes/no — "does it do X?", "does the learner
know these words yet / are they taught?" — with a tool behind every question rather
than the model's memory. For this class the questions are literally: *is every word in
this chunk taught by this module or earlier? is every surface form (て/た/ない/ます)
registered? do the tiles equal the words the author wrote?* Each of those maps to a
tool we now have or are building: the whole-course lexicon (A), the tokenizer preview,
the shrapnel gate. The protocol is the durable fix for "we have this regression so
often"; the gates are its instruments.

## 6. The other two build-23 items

- **#182 orientation.** Fixed in `AppDelegate.swift` (`supportedInterfaceOrientationsFor`:
  phone → portrait, pad → all). Not in Info.plist, because Capacitor's
  `CAPBridgeViewController.setScreenOrientationDefaults` reads the generic
  `UISupportedInterfaceOrientations` key for every idiom and ignores `~ipad` — a
  portrait-only plist would have locked the iPad too. Simulator verification in the
  ledger.
- **#184 "dynamic font resizing is weird."** A bank of 12+ tiles (`hugeBank`, 293 JA
  + 74 ES build steps) skips the tray's full-answer reservation (b14, #114/#117), so
  the tray grows row by row while the learner builds. Since build 22, FILL sizes the
  tiles to the free space at step start; the growing tray then overflows the stage
  and the shrink branch fires mid-build — rows stay equal, everything gets smaller.
  Shipped in build 24: huge banks reserve ONE tray row up front (measured on the sim:
  the first tap no longer changes any geometry, fitScale stays 1.25) and spent bank
  tiles collapse after 350 ms (Spencer's suggestion) so later rows are paid for by the
  bank. Normal banks keep the full ghost reservation.
