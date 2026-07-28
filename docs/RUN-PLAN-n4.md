# Overnight run — finish N5, then author to mid-N4

**Started 2026-07-27. Base commit `7e605ffd` (all prior work committed).**
Spencer: *"author up to mid way in n4 so I can start learning… don't ask me
for anything, do this efficiently, and do it well."* Decisions are mine to
make and document; he'll flag them later if he disagrees.

## ⏵ RESUME HERE (state as of 2026-07-27, after the m27 commit)

**Last commit: `cc8f6906` (m27). Working tree clean apart from the guard commit
that follows it.**

- **DONE and committed: m11–m27.** QA verdict SHIP for m20–m25; **m26's QA came
  back FIX and the fix is committed** (`e425ff17`). Remaining N5 points: **6** —
  three each in m28 and m29. Suite **8022 passing**, audit rows m26/m27
  `findings = —`.
- **IN FLIGHT, two agents dispatched together:** Sonnet QA on m27's three
  review lessons + challenge ONLY, and the **m28** authoring agent (spine tile
  s24, "Must & should: なきゃ/なければ, ほうがいい"; ledger row
  `nakereba-naranai hou-ga-ii kanji-set-3`). Expect m28's files to mirror
  m27's, plus `src/pub/tts`. `courseAtoms.ts` should NOT appear; if it does,
  read the diff before staging.
- **NEXT after m28 lands**, in this order:
  1. `node scripts/compile-ir.mjs m28 && npx tsc --noEmit && npx vitest run && npm run authoring-audit`
     — the m28 row must read `findings = —`; `systemic` may be 1.
     **Never pipe vitest through `tail` and trust the exit code** — the pipe
     returns tail's status, which is how a 1-test failure read as EXIT=0 here.
     Redirect to a file and grep the summary line.
  2. Verify every guard the agent changed is a real false positive, and any
     tokenization claim, by dumping tiles/`exercisedAtoms` yourself. Seven
     cycles running the headline claim needed correcting; m26's and m27's both
     held up under checking, but only checking showed that.
  3. Commit m28 (`git add -A` will sweep in anything else uncommitted —
     stage m28's files explicitly), then
     `node scripts/authoring-context.mjs m29 > docs/context/m29-context.md`
  4. Dispatch Sonnet QA on m28 review+challenge ONLY, and the m29 authoring
     agent, in ONE message so they run concurrently.
- **REMAINING:** m28, m29 to finish N5, then m30–m40 for mid-N4. ~1 hour per
  module cycle, measured.
- **QA IS WORTH ITS COST AND THE VERDICT IS NOT THE POINT.** m26 got six
  consecutive SHIP verdicts' worth of confidence and still shipped a challenge
  lesson that was half recycled. The Sonnet pass found it; no gate did. What
  came out of that one finding: a fix in m26, the same defect found and fixed
  in m27 before it shipped, and a course-wide guard
  (`challengeNovelty.test.ts`) that found eleven more modules with it.
- **m28 EXISTS in the new spine** (tile s24, "Must & should: なきゃ/なければ,
  ほうがいい"; ledger `nakereba-naranai hou-ga-ii kanji-set-3`). The INDEX
  landmine "m28 does not exist (m27→m29)" describes the ARCHIVED course only.
  m29 is tile s25, the N5 capstone.

### Standing hazards, learned the hard way

- **A check that matches nothing looks exactly like a check that passes.**
  Rule Zero (never substring-match Japanese) is one instance; the other is
  reading a field that does not exist. `speaking` keeps its answer in
  `targetPhrase`, `translate` in `acceptedAnswers` (an ARRAY), builds in
  `tiles`/`correctOrder`. There is no `targetSentence` on either. I shipped a
  course-wide scan on `targetSentence` that reported clean while three
  defects were live. Assert a non-zero scanned count in every guard.
- **A module guard over authored surfaces cannot see compiler-generated
  content.** Two instances: `buildTileFloor` backfills distractor tiles the
  IR never wrote (m23's した), and the filler generator draws production
  targets from the review pool (m23/m24's bound enders). Guard COMPILED
  output when it matters.
- **`COMPLEXITY_FLOORS` values for un-authored modules were measured on the
  ARCHIVED old course** and are meaningless for the neo module. Every one of
  m23/m24/m25 had to be raised. Check before trusting, and never lower.
- Stale docs describe archived modules by the same id — the old m26 was a
  "problems" module, not comparisons. Prefer the spine over prose.

Brief boilerplate that must stay in every authoring brief: the carrier-fatigue
list, "run TTS in the FOREGROUND, no watcher shells", "if a guard fires assume
YOUR content is wrong", and Rule Zero (never substring-match Japanese).

## The loop (one module at a time, strictly in order)

```
node scripts/authoring-context.mjs m<N> > docs/context/m<N>-context.md
→ dispatch ONE authoring agent (context pack + pinned invariants + spine unit)
→ node scripts/compile-ir.mjs m<N>
→ npx vitest run            (must be 0 failures)
→ npm run authoring-audit   (module row must be clean)
→ Sonnet QA agent on REVIEW + CHALLENGE lessons ONLY (Spencer's scoping)
→ TTS: emit-tts-deck + generate
→ git commit
```

Never skip the test gate. A module is not done until the FULL suite is green —
partial success has burned this project repeatedly.

## Module map (spine draft-4 → module number)

Authored: m3 s03 · m4 s04 · m5 s05 · m6 n06a · m7 s07 · m8 n02 · m9 n03 ·
m10 n15 · m11 n04 · m12 s09 · m13 n05 · m14 n06b · m15 s11 · m16 s13 · m17 n07 ·
m18 n08 · m19 s15 · m20 n09 · m21 s19 · m22 s17 · m23 s22 · m24 s21.

| m | unit | title |
|---|---|---|
| 11 | n04 | Time I + plain past た (compound numbers) |
| 12 | s09 | Adjectives as mini-predicates (い + な) |
| 13 | n05 | Wanting: たい + ほしい |
| 14 | n06b | て-form II: ている + permission/prohibition |
| 15 | s11 | Relative clauses + こと/の + とき |
| 16 | s13 | Connecting: から/ので, ranges, なかった |
| 17 | n07 | Family I: your side (うち) |
| 18 | n08 | Saying & thinking: とおもう + という |
| 19 | s15 | Getting around: motion particles |
| 20 | n09 | Comparisons I: のほうが…より |
| 21 | s19 | Listing: や, たり (+ Family II) |
| 22 | s17 | Body, health & help |
| 23 | s22 | Experience & intent: たことがある, つもり |
| 24 | s21 | Can & let's: potential, ましょう |
| 25 | n13 | Conjecture: でしょう/だろう + weather |
| 26 | n14 | Comparisons II: いちばん + なかで |
| 27 | s23 | Explaining: んだ/んです, すぎる, なる |
| 28 | s24 | Must & should: なきゃ, ほうがいい |
| 29 | s25 | Register mastery + N5 capstone |

### N4 (spine now written — `docs/spine-n4.md`, 22 units, m30–m51)

| m | unit | title |
|---|---|---|
| 30 | n4-01 | て+helper I: てみる / ておく |
| 31 | n4-02 | Give & receive I: あげる・くれる・もらう (things) |
| 32 | n4-03 | Conditionals I: たら (と as contrast) |
| 33 | n4-04 | Transitivity I: 自動詞/他動詞 — が vs を |
| 34 | n4-05 | Volitional: よう/おう + とおもう, ことにする |
| 35 | n4-06 | Give & receive II: てくれる + favors |
| 36 | n4-07 | Looks like: そう(appearance), がる, やすい/にくい, ながら |
| 37 | n4-08 | Conditionals II: ば + なら |
| 38 | n4-09 | て+helper II: てしまう/ちゃう + ていく/てくる |
| 39 | n4-10 | Concession & reasons: のに, ても/でも, し |
| 40 | n4-11 | Passive I: direct passive られる |

**"Mid N4" = through m40 (n4-11).** m41–m51 are out of scope for this run.

Three spine calls worth knowing (full rationale in `spine-n4.md` §3/§5):
transitivity lands **early at m33** as a particle *diagnostic* (it gates
passive, causative, てある and resultative ている); conditionals split 2+2 five
modules apart with **たら as the sole hub** (every newcomer contrasted against
たら alone, 4-way only in the capstone — same ruling as register); and
**causative-passive is rehomed to m50** inside 謙譲語 via させていただく, so it
arrives as a composition of owned parts rather than a new form.

## Progress (updated after each module lands)

| | |
|---|---|
| authored this run | m11 m12 m13 m14 m15 m16 m17 m18 m19 m20 m21 m22 m23 m24 m25 m26 m27 |
| N5 grammar points left | **6** of 103 (was 74 at run start) — three each in m28, m29 |
| suite | 8022 passing, 0 failing |
| translate share | 8.1–13.6% (ceiling 15%); m27 = 9.9% |
| distinct step types | 10–12 per module (m24 = 10: it introduces no imageable word, so it ships no `word_image_mcq`, and kanji-set-3 is m28's row) |
| audit findings | **0 module-specific** for every module except m10 (1, its register single-tile builds, by design). The course-wide inv-35 debt now has its OWN column and is no longer counted as a per-module finding — see the audit-signal fix of 2026-07-27. `findings = —` means clean. |
| QA verdicts | m20 SHIP · m21 SHIP · m22 SHIP · m23 SHIP · m24 SHIP · m25 SHIP (six clean modules running; every earlier module had at least one defect, almost always a compiler bug rather than content). m26 QA in flight. **A SHIP verdict is not the same as a clean module** — the はいる mis-gloss and the bound-ender production targets both shipped through a SHIP verdict, and were found later by course-wide scans. QA reads four lessons; the scans read all thirteen. |
| untaught words shipping as options | **0** |
| spoken surfaces with no clip | **0** of ~1,700 |

QA has found a defect in nearly every module, and **almost every one was a
compiler or tooling bug rather than a content bug** — run-on sentence fusion,
the さん/三 homograph, filler repetition, the kana→atom twin maps, distractor
pools drawing on future vocabulary, prior IR vocabulary being invisible, five
separate silent-audio classes. Sonnet reading four lessons per module is
comfortably the highest-yield step in the loop; do not drop it to save tokens.

The authoring agents have been right and the BRIEF wrong three times running
(m15 とき tense, m16 made-until, m17 the そと family set). "The spine wins, and
you say so in your report" is doing real work — keep that line in every brief.

## ⚑ Open questions for Spencer (NOT decided by me)

- **inv 35 authoring debt** — 99 build steps across all modules are under the
  distractor floor as authored; `buildTileFloor` backfills them so nothing
  ships thin. Is the backfill sufficient, or should authors write the
  distractors anyway? The bar came from your own QA note, *"we give them the
  answer a little too easy"*, which is why I have not relaxed it myself.
- **ら抜き in the flashcard deck (m24).** The course teaches たべれる / みれる
  for RECOGNITION and bans them as production targets — enforced by a guard in
  `m24-neo.test.ts`. But both atoms are SRS-eligible, so they enter the vocab
  deck, and a card prompting EN→JA would ask the learner to PRODUCE ら抜き —
  the one thing the design forbids. The lesson-side ban cannot see the deck.
  Three options: leave it (recognition value outweighs it), set
  `excludeFromSrs` (recognition then decays after m24), or make the deck
  direction per-atom. This is a curriculum call, not a mechanical one.
- **Overlapping two authoring agents** for throughput — trades correctness
  margin for speed. Currently one authoring agent at a time, with QA for the
  previous module running alongside it.

## Standing decisions (mine, documented per instruction)

1. **Module shape** stays inv 25: 12–15 lessons = 8–11 teaching + 3 review +
   1 challenge, challenge lesson last.
2. **Katakana rows** are wired at module level for m7–m11 only (2/module).
   From m12 katakana is assumed known and appears in ordinary vocabulary.
3. **Register scaffolds fade.** They belong to m10 and to s25/m29 (register
   mastery). Do NOT reach for them elsewhere — `registerScaffoldIsolation`
   enforces this.
4. **QA scope**: Sonnet QA agent reads only each module's REVIEW and CHALLENGE
   lessons (Spencer's explicit scoping, for token cost).
5. **One new register/politeness word per lesson**; pairwise contrast on
   introduction, N-way only on review.
6. **Plain-form-first** throughout; です・ます is the layered politeness
   register, never the default production target.

## Rule-breaking prevention added this session (keep extending)

Mechanical guards beat reminders. Every one of these replaced a rule agents
had been ignoring:

- `stepTaxonomy.ts` — one copy of INTRO_TYPES / kana projection, so the
  compiler and the guards cannot disagree.
- `registerScaffoldIsolation.test.ts` — register machinery cannot leak into
  ordinary lessons, and must fade.
- `registerCueGrading.test.ts` (inv 48) — a register-cued prompt must not
  accept the other register.
- `npm run authoring-audit` — cross-module; **3+ modules flagging the same
  invariant means fix the GUIDE or the COMPILER, not the modules.**
- Compiler diagnostics (bare-word debut, translate-heavy, challenge novelty,
  unknown grammar point) fail the build rather than warn.
- `challengeNovelty.test.ts` (2026-07-27) — a challenge lesson may not re-run
  a sentence met in two other lessons of the same module. The compiler's own
  `challenge-not-novel` check keys on the BEAT kind and compares only the
  grammar-point SET, so byte-identical text passed for as long as inv 26 has
  existed. Scoped to what the learner PRODUCES OR HEARS (`targetPhrase` /
  `acceptedAnswers` / `correctOrder` / `transcript`) — scanning `jaSurfaces`
  instead reports 138 hits, mostly cloze fragments and rule-card examples
  being practised later, which is good teaching. A guard that flags good
  teaching gets deleted.

## Known-good metrics to hold

- full suite green (was 5598 passing at run start)
- translate ≤ 15% of production (currently 10.8–13.6%)
- single-tile builds ~0 (currently 3, all m10 register beats)
- ≥5 distinct step types per lesson (currently 11 per module)
- 0 word_image_mcq reuse

## Recurring traps (cost real time this session — do not re-learn)

### RULE ZERO — never match a Japanese substring. Match a TILE or an ATOM.

This is the single most repeated bug in the project: **eight distinct sites so
far**, found one at a time, each one silent, each one reaching the learner.
Japanese has no spaces, so `haystack.includes(word)` is not a word test — it is
"do these characters occur anywhere", which in this language is almost always
yes.

| site | what it did |
|---|---|
| `compile-ir` priorVocab | ので matched inside のです → untaught word marked known |
| `honorificAtomTagging` | さん matched inside さんぷん → honorific credited as 三 |
| `moduleBarGuards` image-first | は matched inside 歯 → every は read as a debut |
| m11 time guard | ごじ matched inside ごじゅう |
| m22 body guard | からだ matched inside unrelated surfaces |
| m19 stem check | substring match on stems mis-read くる's negative |
| m21 `たり` guard | した matched inside しました → **banned a whole tense** |
| `lessonAtomIndex` fallback | くる⊂くるま, とし⊂としょかん, はん⊂ごはん, いま⊂います, いい⊂いいえ → **57% of m8+ atom attributions were false**, scheduling SRS reviews for words no lesson taught |

The compiler already computes the right answer and hands it to you: a step's
`tiles` are the tokenizer's own segmentation, and `exercisedAtoms` is literally
"which atoms this step exercises". Ask those. If a check must reason about raw
text, anchor it — `^`, `$`, a following particle — and say in a comment why that
anchor is sound.

The reason this keeps happening is that the wrong version PASSES: a substring
match is a superset, so it never fails a build, it just quietly does the wrong
thing. Treat any new `.includes(` on Japanese text as a defect until proven
otherwise.

- A bare cardinal cannot quantify a noun in Japanese (`ほんが ご ある` ✗).
  Counters only: 〜つ (inanimate), 〜人, 〜匹, 〜えん.
- `reviewPool` asserts "already known" — putting an untaught word there is a
  silent leak (ひゃく, うえ/なか, パーティー all shipped this way).
- The `rule:` prose on a grammar card is mixed-script and INVISIBLE to
  provenance; only `examples:` count as an introduction.
- Prompts with an internal sentence period trip the inv-29 theatrics guard.
- Changing any Japanese text requires a TTS regen or the line ships silent.
- **Two silent-line classes the emitter could not see, both fixed 2026-07-27
  in `scripts/emit-tts-deck.mjs` (m12 cycle):** (a) `moduleCompiler.clean()`
  strips 。、？！ before a sentence becomes a step's `targetSentence`, and
  `getTtsUrl` deliberately has no ？-fallback, so every IR-authored QUESTION
  build was mute — m11 shipped four. The emitter now writes a
  punctuation-stripped twin beside the ？-bearing key, which keeps dialogue
  contour intact. (b) An atom declared in the IR but NOT registered in
  courseAtoms got no clip at all, so m12's whole conjugation ramp (the
  transform card plays its own answer) plus its match tiles and speaking
  filler would have been silent. The emitter now reads `newAtoms[].kana`.
- **A guard that runs on already-cleaned text cannot see punctuation bugs.**
  Every check ran after `clean()` stripped 。, which is exactly why 10 run-on
  build steps shipped unnoticed. When adding a guard, ask what the input has
  already had removed from it.
- **Homograph atoms mis-credit SRS silently.** さん(honorific) counted as 三,
  に(particle) as 二, ごじ ⊂ ごじゅう. The symptom is never an error — it is a
  word that quietly stops being scheduled. Check `exercisedAtoms` when adding
  any short atom.
- **An IR-ONLY atom from an earlier module is invisible to a later module's
  compiler.** `moduleCompiler`'s tokenizer knows courseAtoms ∪ THIS module's
  `newAtoms` — nothing else — so m13/m14 surfaces that live only in their own IR
  (おいしかった, やすかった, したい, しって, すんで, はたらいて, およいで …)
  shatter into junk tiles inside m15 (「おいしかった」 → おい/し/かった). Two
  failure modes, one loud and one SILENT: a >1-char fragment trips
  `unbuildable`, but a split into pieces that all happen to be atoms does not —
  「ふるかった」 tokenized to ふる (to fall) + かった (bought) and mis-credited
  SRS with no error anywhere. m14 fixed one instance by backfilling いい into
  courseAtoms; m15 avoided the class instead (it uses only surfaces the registry
  or the conjugation lexicon actually knows). Before authoring, tokenize every
  sentence with the COMPILER's vocabulary, not the guard's — the guard also
  reads `getRealFormLexicon()` and will not see this.
- **A new short atom re-tokenizes the ENTIRE course, not just its module.**
  m16 registered ので and broke an m7 sentence — 「ケンさんのです」 re-read as
  ので+す. Registering a short particle-like surface is a course-wide change;
  run the full suite afterwards and read failures as tokenization damage,
  not as unrelated breakage. Same family as ごじ ⊂ ごじゅう.
- **A gloss can be wrong while the Japanese is right, and QA of the
  Japanese will never catch it.** みる was glossed "read" 16 times across
  m13 and m15 — よむ is taught in no module. Check the PAIRING.
  `verbGlossFidelity.test.ts` now does; keep its list short so a failure
  always means something real (a きく="ask" rule was drafted and deleted —
  「〜さんに きく」 genuinely IS "ask", and a guard that cries wolf teaches
  authors to route around the suite).
- **`i % pool.length` is not rotation, it is repetition** once i exceeds the
  pool. Filler must track what it has already spent in the lesson.
- **A particle + the copula can FUSE into an unrelated atom.** m19 wrote
  「じゅうじ ごふんからだ」 and 「くじからだから」 — から + だ tokenizes as からだ,
  the m2 atom for "body", so the build tiled 「からだ」 and FSRS credited a
  vocabulary word the sentence never used. Nothing errors: the fragment IS a
  real atom, which is exactly the silent shape ふるかった/ごじ⊂ごじゅう have. The
  fix is authorial — から is followed by a verb or by まで, never by だ — and the
  general rule is to DUMP THE COMPILED TILES of a new module and read them as a
  vocabulary list before shipping. Every junk or homograph tile is visible there
  in one glance and invisible everywhere else.
- **A cloze frame that ends in the bare copula だ fails the grammar-deck
  comprehensibility gate.** That gate strips atoms and `TAUGHT_ENDINGS`, and だ
  is in neither, so 「…が すきだ」 reads as unexplained vocabulary on a point
  whose words it entirely owns (m21's や cloze, 2026-07-27). End a cloze frame
  on a verb.
- **An authored `listening-comp` beat must not re-use a `sentence` beat's exact
  audio.** `reviewFiller` re-presents authored sentences as comprehension items,
  so the collision ships the same audio twice in one lesson and
  `reviewFillerVariety.test.ts` fails (m21, two beats).
- **A kana already owned by an interjection cannot become a counter.** 「はい」
  is the m3 survival atom for "yes" and `JA_COURSE_ATOMS_BY_KANA` is last-wins,
  so the 杯 counter could not be registered under it — every 〜はい cell had to
  become a whole atom instead (m21). Before registering any counter, check
  whether its kana is already spoken for.
- **A registered survival PHRASE tiles whole and can eat the lesson's own
  skill.** 「どこですか」 is one atom (sidequest-survival), so m19's
  「すみません えきは どこですか」 built as three tiles with どこですか intact —
  in the lesson whose entire point is that a polite question REQUIRES か. No
  guard fires (it is a legitimate atom). Same class as いくらですか. Either pick a
  surface that decomposes or make the beat `mode: translate`, which is typed and
  has no tiles.
- **A particle_cloze is HARVESTED into the grammar-review deck**, whose
  comprehensibility gate resolves every word through `courseAtoms` — and the
  character names have no atom rows. A cloze frame containing ミカ / トム / ケン /
  たなか therefore lands in GATE_EXEMPTIONS as "too advanced". Write cloze frames
  with common nouns instead.
- **An adjective absent from `ADJ_ENTRIES` has no inflections ANY lexicon here
  can see.** いたい is not in the conjugation tables, so 「いたくない」 tokenizes to
  the junk fragment いた + く + ない and trips `unbuildable`; 「いたかった」 is the
  same shape. Third instance of the class (m12 すごい/こわい, m13 ほしくない, now
  m22 いたい) and the fix is always authorial — m22 says "it doesn't hurt" with
  だいじょうぶ / げんき, which is what a Japanese speaker says anyway. Check
  ADJ_ENTRIES before planning a lesson around an adjective's negative or past.
- **A ONE-CHARACTER new atom cannot get an image debut.** `moduleCompiler`'s
  precedence machinery gates a step on the atoms it surfaces via
  `needsGate = t.length > 1 && …`, so a 1-char atom has no gate and its
  `word_image_mcq` can be sequenced AFTER its first sentence use — which the
  image-debut diagnostic then (correctly) reports. て 手 hit this in m22 and
  ships `imageable: false`. The length-1 escape is there to stop particles being
  gated; loosening it is a course-wide reordering, so it was NOT done.
- **A rule card STEALS the picture of any imageable word it names.** A
  `kind: rule` beat compiles to a PINNED grammar_rule ahead of the interleaved
  middle, so a word its own card must mention can never debut on a
  `word_image_mcq`. m21 stated this for おさけ (keep the word OUT of the card);
  m22 hit the unavoidable direction — a card about 〜が いたい must say いたい —
  so いたい and ねつ ship `imageable: false` instead.
- **An authored `listening-comp` audio must not equal ANY `sentence` beat's ja
  in the same lesson.** The m21 note said this; m22 shows the failure is
  NON-DETERMINISTIC from the author's side — `reviewFiller` re-presents the
  lesson's own sentences, so a collision only fails the build when the filler
  happens to pick that sentence. Nine of m22's LCs collided and only three
  failed. Scan the IR for the collision rather than trusting the suite.

- **The plain past is a MINEFIELD of registered homographs, and m23 measured it
  rather than assuming.** 「した」 (する) is the m17 atom for 下 "below" and
  「きた」 (くる) is the m17 atom for 北 "north", so 「〜した ことが ある」 tiles
  した and credits the wrong word with nothing erroring. 「あった」 is
  unregistered and must STAY unregistered — ある's past and 会う's past share the
  kana, so a row for either silently mis-credits the other. 「はいった」
  fragments to はい + った (the m3 interjection eating the stem) — the same
  greedy-match class as きょうは|いかない. The safe plain-past atoms are the m11
  set (たべた のんだ きいた みた かった あそんだ いった わかった) plus m23's
  のった / およいだ / はたらいた, every one of which was checked against the whole
  corpus for zero prior occurrences before registration.
- **The ます-STEM is a minefield too, and it is the same class one layer down
  (m24, 2026-07-27).** Registering a bound suffix (m24 did it for ましょう, so
  every taught verb gets a volitional for one atom) makes the TILE a stem —
  「たべましょう」 → たべ + ましょう, the shape m19's 〜に いく already ships. That
  is only safe when the stem is not itself a registered word, and SIX common
  verbs fail: する→**し** is 四 "four", くる→**き** is 木 "tree", かう→**かい**
  is 貝 "shell", まつ→**まち** is 町 "town", つく→**つき** is 月 "moon",
  はなす→**はなし** is 話 "talk". Register the whole form instead when the stem
  collides (m24 registered しましょう, 5 chars, so longest-match beats し) or
  drop the verb. Also check `VERB_ENTRIES` before assuming a stem EXISTS:
  きく is absent from it, so きき is not a stem at all and 「ききましょう」
  shattered into き|き|ましょう. Same check applies to ません — only the ８ ます-
  negatives that have atom rows can carry ませんか, so およぎません fragments.
- **The POTENTIAL form has its own homograph list (m24).** かう→**かえる** is
  帰る "to go back" (m14 row), かく→**かける** is 掛ける "to call by phone"
  (m14 row), つく→**つける** is 付ける "to turn on". Those three verbs cannot
  appear in the potential anywhere until the course has a disambiguation
  mechanism. いける is SAFE despite いけ 池 and いけません — longest-match settles
  it — but that was verified by dumping compiled tiles, not by reading code.
- **A word can be in the context pack, in courseAtoms, AND untaught.** m23
  caught はやい that way (the pack lists it; no neo module teaches it) and also
  では — an ATOM meaning "with that…" that nothing teaches, which 「うみでは」
  fuses で + は into. Same family as からだ ⊃ から + だ and ので ⊂ のです. The
  cheap check is to tokenize every authored surface with the COMPILER's
  vocabulary and then test each token against `priorVocab`; it takes one script
  and it found both in one pass.

**TTS owed:** the boundary fix changed ~10 build targets (`です。` now appears
in tiles/audioKey). Run emit-tts-deck + generate at the next quiet point.

## N5 coverage checklist (measured 2026-07-27)

`n5-grammar-points.json` holds **103** points. m6–m10 touch **29**. The
remaining **74** are the acceptance criterion for finishing N5 — a module is
only "done" against the spine when its share of these is taught, and N5 is
complete when this list is empty. Re-run:

```
node -e 'const fs=require("fs");const pts=JSON.parse(fs.readFileSync("src/features/lesson/data/n5-grammar-points.json","utf8"));const ids=(Array.isArray(pts)?pts:Object.values(pts)[0]).map(p=>p.id);const d="src/features/languages/ja/curriculum/ir/";const t=new Set();for(const f of fs.readdirSync(d).filter(x=>x.endsWith(".ir.yaml"))){const s=fs.readFileSync(d+f,"utf8");for(const m of s.matchAll(/grammarPointId:\s*([a-z0-9-]+)/g))t.add(m[1]);for(const m of s.matchAll(/(?:exercises|combines):\s*\[([^\]]*)\]/g))m[1].split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>t.add(x));}console.log(ids.filter(i=>!t.has(i)).join(" "))'
```

### Assignment — which module owes which points

Decided 2026-07-27 so no point falls through the gap between modules. Each
authoring brief cites its row; the module is not done until every id in it
appears in the IR. Counters/kanji sets are spread deliberately (a module that
teaches four counters at once is a table, not a lesson).

| m | grammar point ids owed |
|---|---|
| 11 | ta-form masu-past desu-past numbers-11-99 counter-ji ni-time | ✅ |
| 12 | i-adj-present i-adj-negative na-adj-present na-adj-negative i-adj-past i-adj-past-negative na-adj-past | ✅ |
| 13 | v-tai ga-hoshii suki-kirai-no no-ga-suki | ✅
| 14 | te-iru te-mo-ii te-wa-ikemasen naide-kudasai kudasai **mada-mou** | ✅
| 15 | dictionary-form toki mae-ni te-kara | ✅
| 16 | kara-because node-because kedo kara-origin counter-mai **masu-past-negative** **made-until** | ✅
| 17 | family-register counter-sai counter-nin kono-sono-ano-dono | ✅
| 18 | to-omoimasu to-quotation kanji-set-1 | ✅
| 19 | e-direction ni-iku made-ni kara-time **counter-fun** | ✅
| 20 | yori-comparison numbers-100-10000 counter-ko | ✅
| 21 | ya-incomplete-list to-and tari-tari-suru **counter-hai** | ✅
| 22 | ga-itai frequency-adverbs **counter-hon** | ✅
| 23 | koto-ga-aru tsumori-desu kanji-set-2 | ✅
| 24 | mashou masenka no-ga-jouzu no-ga-heta | ✅
| 25 | deshou |
| 26 | ichiban-superlative |
| 27 | n-desu sugiru ku-ni-naru |
| 28 | nakereba-naranai hou-ga-ii kanji-set-3 |
| 29 | janai-desu yo-emphasis ne-agreement |

**When this table and `spinePlan.ts` disagree, the spine wins** and the table
gets edited — the table is a coverage ledger, not a curriculum. Already
reconciled: **`counter-hai` m22→m21 and `counter-hon` m21→m22 (2026-07-27)** —
spine tile s19 names the cup counter in so many words ("Cup counter はい/ぱい/ばい
drips with drinks vocab"), and it belongs there for a reason the ledger can't
see: m21 is the LISTING module, so 「コーヒーを にはい と ケーキを…」 is the
counter earning its place inside the grammar being taught, not a drip bolted on.
本 has no such affinity and moves to m22, where it drips as ordinary vocabulary.
Also reconciled: `masu-past-negative` m11→m16 (the spine defers ませんでした to the
connectives tile) and `counter-fun` m11→m19 (ぷん rendaku defers to the drip).

**A FIFTH reconciliation, m16 (2026-07-27) — `made-until` m19 → m16, and
`kara-time` stays at m19.** spinePlan s13 lists "から…まで" in so many words,
while spinePlan s15 (m19) lists only "で means / に arrival / へ direction;
までに". The SPAN therefore belongs beside the から m16 already owns, and
splitting から…まで across two modules would teach half a pair twice — the same
argument m14/m15 used to keep まえに and てから together. The SPINE wins and the
ledger row MOVED, exactly as this table's own rule requires. `kara-time` does
NOT move: m16 spends から on clock times, but the card that teaches it is
`kara-origin` ("から marks where something STARTS — a place or a time"), and
m19 keeps the formal time-particle tile where it sits beside に-time and へ.
Two more m16 notes: **months ship as ONE atom, がつ** (twelve month atoms would
make the module a vocabulary table, and every month builds compositionally from
a number the learner owns; にがつ/じゅうにがつ are deliberately unused because に
is the documented homograph trap), and **ぜんぜん lands as vocabulary, not as
`frequency-adverbs`** — that id stays on m22's row, while the spine's own
GLUE-ADVERB DRIP line asks for adverbs as vocab, never as a block. m16 also
RE-TEACHES `wa-topic` (the spine's "は vs が contrast — が's deepen beat"; the
registry has no `wa-vs-ga` id and inv 42 forbids inventing one) and `nai-form`
(the plain past negative なかった has no id of its own, and なかった IS the ない
form with an い-adjective ending swapped). Neither row moves — a re-teach is not
a re-assignment.

**A SEVENTH note, m18 (2026-07-27) — the ledger row is unchanged and the
spine is followed, with ONE deliberate under-delivery.** spinePlan n08 lists
"んだ explanatory — RECOGNITION preview". m18 names it in ROMAJI in L9's
rule-card prose and puts it on NO graded surface, for two mechanical reasons:
inv 33 forbids a dialogue being a word's first exposure (so a "preview" would
have to be a real intro step, i.e. teaching it), and registering んだ is a
COURSE-WIDE tokenizer change of exactly the class that broke m7 when m16
registered ので — 「いくんだ」 and 「ごはんだ」 sit on the same fault line.
`n-desu` keeps its m27 row, where the production lesson lives. Everything else
n08 asks for lands as written; でしょう stays at m25 because the spine itself
puts it in n13.

**Also m18: THREE new atoms and ZERO new courseAtoms rows.** むずかしい,
たのしい and はなす all already had registry rows with stale old-course tags,
so declaring them in `newAtoms` (the m15/m16/m17 move) adds nothing to the
course-wide tokenizer — the m16-ので regression class cannot arise. Two
homographs are banned as surfaces for the usual mis-credit reason: **いった is
never "said"** (it is the registered past of いく, "went") and **きた is never
"came"** (it is 北, "north", m17), so reported speech stays non-past and the
past lives on the QUOTED verb, which is where the module wants it anyway.
Six points are RE-TAUGHT rather than re-assigned (`masu-present`, `nai-form`,
`desu-copula`, `ta-form`, `ni-location`, `ka-question`) because the row owes
only three ids across nine teaching lessons and inv 42 forbids inventing new
ones. No ledger row moved.

**An EIGHTH note, m19 (2026-07-27) — the ledger row is unchanged and there is
NO spine deviation.** spinePlan s15 asks for "で means / に arrival / へ
direction; までに" plus "Positions; asking strangers (obligatory-polite register
realism)", and all of it ships. The register-realism half is L9, where every
production prompt carries a "Say politely:" cue and the answers are です / ます /
か — an ORDINARY lesson under inv 8, not a `kind: register` beat, because
standing decision 3 confines that machinery to m10 and m29. "Positions" is read
as the navigation vocabulary and the question words that ask for it (L8); the
spatial nouns うえ/した/なか/まえ stay m6's and m15's.

**`ni-iku` was authored, paying off m13's deferral.** m13's note deferred it to
this row for a tooling reason — a bare ます-stem existed in no lexicon — and the
stem fix landed the day before. 「たべに いく」 now tokenizes as たべ + に + いく
and builds as three tiles, which is also the pedagogy. **「かいに いく」 is
banned**: かい is a registered atom (貝 "shell", m1), so a かい tile would
mis-credit SRS — the さん/三 and に/二 class. 「かいものに いく」 carries the
shopping sense.

**Minutes: ふん, ぷん and じゅっぷん are atoms; いっぷん / ろっぷん / はっぷん are
PROSE.** The compositional cells (さんぷん よんぷん ごふん ななふん きゅうふん
なんぷん) all build from a number the learner owns, exactly as m16 built months
from がつ and m17 ages from さい; the three geminating cells that do NOT
decompose are named in the L5 card's prose, where `jaSurfaces` is blind to them.
**じゅっぷん is the one exception with a row of its own** — ten-minute intervals
are what timetables run on, and a minutes lesson that cannot say "ten minutes"
is not teaching the counter. **にふん is banned** (the に/二 homograph). A guard
in `m19-neo.test.ts` reads every 〜ふん/〜ぷん surface and checks the counter
against the number in front of it.

**Four new courseAtoms rows — へ, ふん, ぷん, じゅっぷん — and all four were
checked for retokenization damage first (the m16-ので class).** へ is ALREADY in
`moduleCompiler`'s PARTICLES list, so the row changes no tokenization anywhere,
and the corpus contains zero occurrences of へ outside m19 (へや / たいへん /
へた / へん are each strictly longer, consumed whole by longest-match, and none
is taught). ふん / ぷん / じゅっぷん are substrings of no registered atom and
occur in no existing curriculum surface. The other eight new atoms — がっこう,
としょかん, かえる, びょういん, でんしゃ, バス, ちかてつ, あるく — already had
registry rows under stale tags and are declared in `newAtoms` only to fix their
provenance, the m15–m18 move.

**Two atoms ship `imageable: false` on purpose, and こうえん was cut.** かえる is
🏠 (also いえ, すむ) and あるく is 🚶 (also いく, さんぽ) — a debut picture that
names a taught word better than it names the answer is a trick question, and the
debut MCQ draws distractors from exactly that met pool. Both debut on a rule
card instead. こうえん had no workaround (🏞️ is かわ, m1), so としょかん 📚 and
びょういん 🏥 took the place slots; their emoji are unique across the registry.
のる was cut too (🚗 is くるま, and のる is in no NEO module's taught set).

**Two guards were adjusted, both removing FALSE positives only (m19):**
(a) `honorificAtomTagging`'s NUMERAL_CONTEXT gained ぷん — 「さんぷん」 genuinely
DOES exercise 三, exactly as 「さんまい」/「さんがつ」/「さんさい」 do, and that
list carries a comment telling each module to extend it. (b) GATE 7's m19
complexity floor was recalibrated 0.51 → 0.80: the old value was measured on the
archived people-and-family m19, while the neo module measures 72/86 = .837
because a journey sentence carries means + destination + time by construction.
Raised, never lowered, per that block's own rule.

**A third finding is a real constraint on future modules, not a guard bug:** a
particle_cloze is HARVESTED into the grammar-review deck, whose
comprehensibility gate resolves every word through `courseAtoms` — and the
character names have no atom rows. So a cloze frame must not contain ミカ / トム
/ ケン / たなか, or it lands in GATE_EXEMPTIONS. m19's へ cloze says 「きょうは
うみへ いく」 for that reason.

**PAST 〜たり WAS RESTORED BY THE ORCHESTRATOR (m21, 2026-07-27) — a guard
banned a tense when the real constraint was one word.** The authoring agent
ruled that 「〜たり 〜たり した」 must not ship, which is CORRECT: した is the
registered m17 atom 下 "below", so a bare した tile mis-credits SRS. But it then
wrote the guard as `/たり[^。？]*した/` — a substring match — and shipped every
たり sentence in the module non-past. 「しました」 contains した and was rejected
along with it. That cost the highest-frequency form of the whole pattern: 〜たり
〜たり しました is what answers "what did you do at the weekend?", and a learner
would have met the construction only in the present.

Verified against the compiler before touching anything: 「しました」 emits ONE
tile, `しました`, and its exercisedAtoms are `[yasumi, p-wa, eiga, p-wo, mitari,
ongaku, p-wo, kiitari]` — `shita` appears nowhere, so nothing is mis-credited.
The ban is on した, not on the past. Both guards now say what they mean: the
した check matches a TILE (which is what SRS credits) instead of a substring,
and the closure check accepts する / します / しました / しません, because する is a
VERB and carries the tense — 「…きいたり しました」 is the same closure in the
past, not a missing one.

L7 gained a build beat and a listening item in the polite past, and the rule
card now teaches that する carries the tense for the whole list. The prompts
NAME the register (inv 48) rather than accepting both, because plain した really
is unavailable — so this is the one place where the register carve-out is
carrying a tooling limit rather than a pedagogical one. **This is the sixth
distinct site of substring-matching-on-Japanese** (ので⊂のです, さん⊂さんぷん,
は⊂歯, ごじ⊂ごじゅう, からだ, now した⊂しました). Whenever a check reasons about
Japanese, match a TILE or an ATOM, never a substring.

**A TENTH note, m21 (2026-07-27) — the ledger row is unchanged and there is NO
spine deviation.** spinePlan s19 asks for "や partial list vs と complete;
たりする alternatives (た-form spend)", "FAMILY II: others'-family honorifics —
listed, compared, drilled against Family I" and "Cup counter はい/ぱい/ばい drips
with drinks vocab". All of it ships. **FIVE points are RE-TAUGHT rather than
re-assigned**, because the row owes four ids across nine teaching lessons and
inv 42 forbids inventing new ones: `family-register` (m17 taught the うち half
and the spine always meant the そと half to land here), `no-possession` (m4 — の
is the ENTIRE disambiguation between the two family sets), `counter-nin` (m17 —
a counter is only learned once you have to CHOOSE one, so 〜にん comes back
beside 〜はい), `suki-kirai-no` (m13 — 「Aや Bが すきだ」 is where an open list is
most naturally spoken) and `kudasai` (m14 — ordering drinks is where a cup
counter is actually used). No ledger row moved.

**THE CUP COUNTER IS ALL WHOLE CELLS, and it was FORCED, not chosen.** 「はい」
is already an atom — the m3-era interjection "yes" (`ja-surv-hai`) — and
`JA_COURSE_ATOMS_BY_KANA` is LAST-WINS, so registering the counter under the
same kana would flip every one of the ~66 existing 「はい」 surfaces in the course
and silently re-credit SRS. No cell can therefore compose from number + counter
the way m19 composed さん + ぷん and m20 composed ご + ひゃく. Six cells get rows
of their own — いっぱい, さんばい, よんはい, ごはい, ろっぱい, なんばい — and
にはい is banned TWICE OVER (the documented に/二 homograph, and に + はい
tokenizing into the numeral plus the interjection). ななはい / はっぱい /
きゅうはい / じゅっぱい are named in the L5 card's PROSE, which is mixed-script
and invisible to `jaSurfaces`; readings follow `classifiers.ts`, the repo's
shipped counter table, which is why 8 is はっぱい and はちはい appears nowhere.
**Consequence: `honorificAtomTagging`'s NUMERAL_CONTEXT needed NO new entry** —
さん never tokenizes out of a whole 「さんばい」, so 三 is never credited from it,
exactly the note m20 left for さんびゃく / さんぜん. The brief predicted
ばい/はい/ぱい would have to be added; the whole-atom decision is what made that
unnecessary, and **no guard was touched in this cycle at all**.

**「〜たり 〜たり した」 IS BANNED — した is 下.** A past たり list wants した on
the end, and 「した」 is the registered m17 atom for "below". A past list would
tile a direction word and credit the wrong atom with no diagnostic anywhere —
the ふるかった / からだ / ごじ⊂ごじゅう class. Every たり list in m21 is NON-PAST
and closes with する; the た-form is still spent, because it is where たり comes
from and the L7 card derives it in prose from たべた / のんだ / みた / きいた.

**THIRTEEN new courseAtoms rows — や, いっぱい, さんばい, よんはい, ごはい,
ろっぱい, なんばい, たべたり, のんだり, みたり, きいたり, あそんだり, いったり —
and all thirteen were checked for retokenization damage FIRST (the m16-ので
class), by dumping every compiled tile in the whole ja course before and after.
The diff was confined to m30's seeded distractor slots; zero tokenization
changed anywhere.** や is the one-character case: the tokenizer is
longest-match-first, so every や-bearing atom in the registry (やま / やすい /
やさい / やる / やすみ / なつやすみ / へや / にぎやか …) is strictly longer and is
consumed whole. The 〜たり forms are registered for the same reason the て-forms
(たべて, m8) and the plain pasts (のんだ, m11) are: without a row the SRS
annotator cannot resolve the surface, so a whole lesson's production credits
nothing. The other seven m21 atoms — おかあさん / おとうさん / おにいさん /
おねえさん (stale m19 tags), など, コーヒー, おさけ (stale m21 tags) — already had
rows and are declared in `newAtoms` only to fix provenance, the m15-m20 move.

**FAMILY II ships `imageable: false`, all four, and every family surface names
WHOSE family it is.** 👩 is shared by おかあさん, おねえさん and MET あね; 👨 by
おとうさん and おにいさん — and more fundamentally a picture cannot express
"whose", which is the only thing separating Family II from Family I. So all four
debut on rule cards, where the register fact can be stated in words. Grading
runs ONE WAY ONLY: a humble word offered for somebody else's family is flatly
wrong (「ミカの はは」 ✗) and is a legitimate distractor, whereas an honorific
used about your own family is merely informal — so おかあさん is never offered as
a wrong answer against はは. Machine-checked in `m21-neo.test.ts`, along with the
possessor rule.

**と is NEVER a distractor against や.** 「うみと やまが すきだ」 and 「うみや
やまが すきだ」 are BOTH correct Japanese — they differ in whether the list is
finished, which a tile picker cannot express — so offering と would mark a right
answer wrong, the same reasoning inv 35 uses for は↔が. The contrast is taught
and drilled by PRODUCTION with the English saying which list is meant; the ONE
true particle_cloze in the module is や's in L1, with を and から as distractors.
`particleClozePlacement` already carried `や: 21`, so it needed no edit.

**A cloze frame must not end in the bare copula だ.** The grammar-review deck's
comprehensibility gate strips atoms and `TAUGHT_ENDINGS`, and だ is in neither —
so 「うみや やまが すきだ」 flagged as too-advanced on a point whose whole
vocabulary it owns. m21's や cloze says 「うみや やまに いく」 instead. Same class
as the m19 no-character-names finding, and worth adding to the trap list.

**An authored `listening-comp` beat should not re-use a `sentence` beat's exact
audio.** `reviewFiller` re-presents authored sentences as comprehension items,
so a collision ships the same audio twice in one lesson
(`reviewFillerVariety.test.ts`). Two m21 beats hit it and were given their own
sentences.

**GATE 7 recalibrated for m21, 0.40 → 0.70.** The old floor was measured on the
archived old-course m21; the neo module measures 64/88 = .727, because a list
names two things plus a predicate by construction and most beats hang a clause
on m16's から / けど. Raised, never lowered, per that block's own rule.

**Carrier note for m21 (inv 27), against the REPAIRED exposure audit.** With the
audit finally reading the IR corpus, 59 words sit above their frequency-justified
share (みせ ×254, ほん ×260, ともだち ×234, ごはん ×222, きのう ×201, えき ×135)
and only one is under. A listing module is structurally a noun generator, so
m21's lists deliberately run on the course's UNDER-spent stock — いけ, かわ, そら,
ゆき, さくら, つき, ほし, ふね, かめ, きのこ, きゅうり, もも, かぎ, けいたい,
えんぴつ, かさ, くつ, ぼうし — plus the drinks vocabulary, which is new material
and cannot be over-exposed. **はいる was NOT used**: the coordinator's note lists
it as taught, but it is in no earlier module's `priorVocab`, and the same is true
of いしゃ / へや / こうえん / ノート / たくさん / なる / とり / おなか / くち /
みみ / くすり / びょうき / あめ / せいと — every one of which the CONTEXT PACK
lists as known. The pack is built from `courseAtoms` attribution and overstates;
`priorVocab` is the compiler's truth. All of them are avoided, and
`m21-neo.test.ts` holds the line.

**AN ELEVENTH note, m22 (2026-07-27) — the ledger row is unchanged and there
is NO spine deviation.** spinePlan s17 asks for "〜がいたい (いたい #275); body
parts (あたま #329, おなか #405)" and "Pharmacy/help dialogues; ないでください
spend". All of it ships. **SIX POINTS ARE RE-TAUGHT rather than re-assigned**,
because the row owes three ids across nine teaching lessons and inv 42 forbids
inventing new ones: `wa-topic` (m3 — 「わたしは あたまが いたい」 is the first
place は and が must be chosen in the SAME clause), `ga-existence` (m6 — 「ねつが
ある」 is where が-existence is finally the natural English mismatch),
`masu-present` (m7 — describing symptoms to a doctor is a です・ます situation by
construction), and three of m14's: `kudasai` (a pharmacy is where you ask for
something), `naide-kudasai` (the spine's own named spend) and `te-mo-ii`
(permission is the other end of prohibition — 「たべても いい？」 and 「たべないで
ください」 are one contrast, not two lessons). m14 owns the request/permission
machinery and health is the domain where it is actually used. No ledger row
moved.

**は "tooth" and かぜ "a cold" never appear, per Spencer's pre-brief ruling, and
て "hand" DOES — verified rather than assumed.** The brief flagged て as
unchecked: it is a registered atom and the て-form is everywhere, so a bare て
tile would credit 手 on every 「たべて」 in the course. **Checked against the
compiler by dumping every `correctOrder` in every compiled IR module: ZERO bare
て tiles course-wide, and the only tiles ending in て are the whole registered
て-forms** (いって / おしえて / かって / きいて / きて / しって / して / たべて /
はたらいて / まって / みせて / みて). The tokenizer is longest-match-first and
every て-form the course uses has its own atom row, so a bare て is only ever
emitted where an author writes it. て is taught in L2 and `m22-neo.test.ts`
holds the line: a bare て tile must be followed by a case particle.

**A PRE-EXISTING MIS-ATTRIBUTION, reported not papered over.**
`lessonAtomIndex`'s M8+ fallback attributes an atom to a lesson by
`JSON.stringify(lesson.steps).includes(surface)` — a SUBSTRING match — for every
atom whose `fromModule` equals that lesson's module and which has no
`introducedByLessonId`. The whole archived Body & Health vocabulary still
carries `fromModule: "m20"` (て / め / みみ / あし / くち / あたま / おなか /
くすり / びょうき / いたい / いしゃ / は), so the m20-neo comparison lessons are
today credited with introducing all of them — 「ゆうめい」 contains め, and every
lesson in the course contains て. m22 did NOT retag those rows: `fromModule`
also drives the kanji-rollout unlock module and the image-first guard's
"module-new" set, so moving twelve rows is a course-wide change that belongs in
its own commit with the tile dump run before and after. The seventh distinct
site of substring-matching-on-Japanese in this repo.

**EIGHT new courseAtoms rows — ねつ, のど, いっぽん, さんぼん, ろっぽん, なんぼん,
よんほん, ごほん — and all eight were checked for retokenization damage FIRST
(the m16-ので class), by dumping every compiled tile in the whole ja course
before and after registering them. The diff was EMPTY: zero tokenization changed
anywhere.** The other fourteen m22 atoms already had rows under stale
old-course tags — いたい / あたま / おなか / め / みみ / くち / て / びょうき /
くすり / いしゃ (m20), いつも / ときどき (m11), あまり (m9), あし (m20) — and are
declared in `newAtoms` only to fix their provenance, the m15-m21 move. That
matters twice here: `courseAtoms.test.ts` catches a duplicate id, but a second
by-kana row would ALSO have been resolved silently by the last-wins map.

**THE 本 CELLS ARE ALL WHOLE ATOMS, and it was forced exactly as m21's 〜はい
was.** 「ほん」 is already the m3 atom for "book" (~488 corpus occurrences) and
`JA_COURSE_ATOMS_BY_KANA` is LAST-WINS, so registering the counter under that
kana would flip every one of them. Nothing composes — 「ごほん」 would tokenize as
ご (5) + ほん (book) and tile a library — so six cells get rows of their own.
**「にほん」 is banned THREE times over**: the documented に/二 homograph, に +
ほん splitting into numeral + "book", and 「にほん」 being the registered atom for
JAPAN. ななほん / はっぽん / きゅうほん / じゅっぽん live in the L7 card's
mixed-script prose. Readings follow `classifiers.ts`. Consequence: さん never
tokenizes out of a whole 「さんぼん」, so 三 is never credited and
`honorificAtomTagging` needed no edit (NUMERAL_CONTEXT already lists ぼん).
**NO GUARD WAS TOUCHED IN THIS CYCLE.**

**NINE WORDS SHIP WITHOUT A PICTURE and only seven with one, for two mechanical
reasons that generalize.** (a) A `kind: rule` beat compiles to a PINNED step
ahead of the interleaved middle, so a word its own card must NAME can never
debut on a `word_image_mcq` — that is m21's おさけ rule running the other way,
and it costs いたい and ねつ their pictures. (b) An emoji already spoken for by a
MET word makes the debut a trick question (the m19 かえる/あるく ruling): 👁️ is
also みる and 👂 is also きく, so め and みみ debut on the L2 card. あたま is
registry-blocked (🧠 belongs to おぼえる) and のど has no honest glyph at all.
**て is a THIRD, new reason**: `moduleCompiler`'s `needsGate` requires
`t.length > 1`, so a one-character atom gets no precedence gate and its picture
cannot be held ahead of its first sentence use — the diagnostic caught it and
て went `imageable: false` rather than the length-1 escape being loosened.
The seven that DO get pictures — おなか 🫃, くち 👄, びょうき 🤒, くすり 💊,
あし 🦶, いしゃ 👨‍⚕️ — have emoji unique in the registry.

**NO NEGATIVE OR PAST いたい ANYWHERE — the m12/m13 adjective-lexicon class,
third instance.** いたい is absent from `ADJ_ENTRIES`, so 「いたくない」 tokenizes
to いた + く + ない and trips `unbuildable`; 「いたかった」 is the same. The fix is
authorial rather than a registry change: "it doesn't hurt" is said with
だいじょうぶ / げんき, which is what a Japanese speaker says anyway. For the same
reason ある stays non-past in plain form (「あった」 has no row) — a symptom you
are describing is current by definition.

**REGISTER: every production prompt names its audience.** The brief's rule is
that a prompt which does not name one must accept BOTH renderings; a build
step's tile bank can only ever spell one, so the honest way to satisfy it is to
cue every beat whose answer depends on register. L1-L5 and L7 are plain, L6 is
the clinic and is cued "Say politely:" throughout, and L9-L11 run on ください /
ないでください / 〜ても いい, which `registerCueGrading` reads as POLITE — so
those carry "Ask politely:" or no cue rather than a friend cue that would
contradict the grader. Two dialogue roles were added to
`dialogueSpeakers.json` (Doctor, Pharmacist, both neutral) and
`m22-neo.test.ts` extends m21's たなか rule to them: a student never answers a
white coat in plain form.

**GATE 7 recalibrated for m22, 0.56 → 0.86.** The old floor was measured on the
archived old-course m22 (なかで…いちばん); the neo module measures 77/86 = .895,
because a symptom sentence is three tiles long by construction — exactly the
flat texture the gate exists to stop — so nearly every beat hangs a reason
clause on m16's から / けど, which is also how a symptom is actually spoken.
Raised, never lowered, per that block's own rule.

**Carrier note for m22 (inv 27).** A body-parts module is a noun generator the
way a listing module is, so the carriers are deliberately the under-spent stock:
ちゃ, ぎゅうにゅう, コーヒー, おさけ, すし, パン, えんぴつ, かさ, けいたい, き,
やま, かわ, めがね, じゅぎょう, きっさてん, だいがく, かいしゃ. みず appears
exactly twice, both times because a bottle of water is what a pharmacy hands
you. みせ appears once. **Words the context pack lists as known but `priorVocab`
does not** — and which are therefore avoided — include へや, こうえん, ノート,
たくさん, せいと, やさい, にく, あめ, さいふ, はなし, ひこうき, たいへん,
まいにち / まいあさ / まいばん (which the frequency lesson would have wanted),
ひく, みがく, なる, とり, たつ, うたう, かく, のる, でる, せっけん, ペン, そば
and ちかく. The pack overstates; `priorVocab` is the compiler's truth.

**A NINTH note, m20 (2026-07-27) — the ledger row is unchanged and there is
NO spine deviation.** spinePlan n09 asks for "AのほうがBより pattern; ほう (#66)
taught AS VOCAB with it", "どっち (casual) / どちら (polite) — register pair" and
"⟳ intro beat — いちばん superlatives deepen later". All of it ships, and
**いちばん is deliberately ABSENT**: n09 is the INTRO beat of the comparison
spiral and n14 (m26) is its deepen beat, which is the whole point of the s20
split. `ichiban-superlative` keeps its m26 row. Six points are RE-TAUGHT rather
than re-assigned, because the row owes only three ids across nine teaching
lessons and inv 42 forbids inventing new ones: `wa-topic` (m3, the reduced
「AはBより〜」), `to-and` (m8, the closed pair a comparison question asks about),
`ikura-price` (m9, prices as the only place a beginner meets thousands),
`na-adj-present` (m12, な-adjectives keeping だ inside the frame), `mo-also`
(m3, 「AもBも〜けど」 as the concession move) and `masu-present` (m7, どちら's
register home). No ledger row moved.

**はやい is NOT taught, and the m20 brief's headline sentence 「でんしゃの ほうが
バスより はやい」 does not ship.** はやい is a homograph with a course-wide ruling
against it: `JA_PRIMARY_ATOM_BY_KANA` resolves the bare kana to `hayai-early`
(早い "early", ⏰) rather than `hayai` (速い "quick", 💨). A はやい surface glossed
"fast" would therefore credit SRS to the wrong sense — the はな/鼻 class — and ⏰
already belongs to MET じかん and いま, so an image debut would draw distractors
that name the picture better than the answer does. Flipping the ruling to suit
one module is not a guard fix in the false-positive direction, so it was not
done; **ちかい 📍 and とおい 🔭 carry the comparison instead**, alongside the
prior adjective stock.

**Numbers: the five sound-change cells are WHOLE ATOMS, the regular ones
COMPOSE.** さんびゃく / ろっぴゃく / はっぴゃく / さんぜん / はっせん do not
decompose (さん + ひゃく never surfaces; ろっ and はっ are not atoms), so each
gets a row — the same call m19 made for じゅっぷん, and it also means さん never
tokenizes out of them, so 三 is never mis-credited. Everything regular builds
from a number the learner owns: 「ごひゃくえん」, 「きゅうひゃく」, 「よんせん」,
「いちまん」. **にひゃく / にせん / にこ are banned** for the documented に/二
reason. The 〜こ cells that geminate — いっこ / ろっこ / はっこ / じゅっこ — are
PROSE ONLY (mixed script, invisible to `jaSurfaces`), exactly as m17 handled
issai/hassai/jussai and m19 ippun/roppun/happun. `m20-neo.test.ts` carries a
guard that reads every 〜ひゃく/〜びゃく/〜ぴゃく/〜せん/〜ぜん surface and checks
the counter against the number in front of it.

**EIGHT new courseAtoms rows — ほう, より, こ, さんびゃく, ろっぴゃく, はっぴゃく,
さんぜん, はっせん — and all eight were checked for retokenization damage FIRST
(the m16-ので class), by dumping every compiled tile in the whole ja course
before and after registering them.** The diff was confined to m30's seeded
distractor slots; zero tokenization changed anywhere. **こ is the one-character
case the trap list warns about**, and it is safe only because the tokenizer is
longest-match-first: every こ-bearing atom in the registry (ここ / これ / この /
こと / こない / こえ / こめ / こうえん / きのこ / ねこ / こちら / けっこう /
がっこう / としょかん …) is strictly longer and is consumed whole. The other
seven m20 atoms — ちかい / とおい (m6), どっち / どちら, せん / まん (m14),
たまご (m21) — already had rows under stale tags and are declared in `newAtoms`
only to fix their provenance, the m15-m19 move.

**Words avoided on purpose, and why the reason is mechanical.** せんせい appears
NOWHERE in m20: the bulk audit's debut check is token-INITIAL
(`tok.startsWith(kana)`), so a 「せんせい」 token would register as the debut of
せん (1000) on whatever step happened to carry it. The same check is why L1's
rule card deliberately contains 「この みせの ほうが やすい」 — it makes the
FIRST こ-initial token in the module land on a grammar_rule, which is
intro-capable. The stale old-course `fromModule: "m20"` tags on the archived
Body & Health vocabulary (あし / いたい / みみ / くち / おなか / くすり / いしゃ
/ びょうき / みがく / ひく / せっけん / ゆっくりと / たくさん / あたま — the
spine rehomes that domain to s17 = m22) are avoided for the same class of
reason.

**THREE guards were adjusted, all removing FALSE positives only (m20):**
(a) `moduleBarGuards`' image-first check now skips a HOMOGRAPH LOSER — an atom
whose kana does not resolve to it through `JA_COURSE_ATOMS_BY_KANA`. 歯 "tooth"
shares は with the TOPIC PARTICLE and carries a stale old-course m20 tag, so
every は the tokenizer emits (i.e. every lesson in the course) read as 歯
debuting on whatever step came first; an atom a token can never identify cannot
have a debut to get wrong. Same class as the m18 fix that made this check
tokenize instead of substring-match, and the length-1 escape used elsewhere
cannot help because the atom IS one character. (b) `particleTileSeparation`'s
LEXICALIZED allowlist gained この and こと — both only decompose because m20
registers こ, both are tiled WHOLE by longest match, and neither is ever
assembled from こ + a particle. Same class as the もも/もの entries already
there. (c) `honorificAtomTagging`'s NUMERAL_CONTEXT gained こ, because
「さんこ」 genuinely DOES exercise 三, exactly as 「さんぷん」/「さんまい」 do.
**One guard was TIGHTENED**: `particleClozePlacement`'s PARTICLE_INTRO_MODULE
had no entry for より at all, so `intro === undefined` made every より cloze in
every module skip the ratchet; it now reads `より: 20`.

**A COMPILER DEFECT was fixed at the source, and it was flagged in 15 modules
(m20 cycle).** `reviewFiller`'s sentence-comprehension filler re-presents the
lesson's own sentences as "What does this sentence mean?" items using the beat's
`en` as the OPTION TEXT — but a beat's `en` IS its prompt (inv 39), so it may
open with a register cue (inv 8). **164 listening-comp options across m5-m20 read
"Say politely: …" as an answer to a meaning question**, which is both wrong and a
giveaway, since only the authored sentence carries a cue. `sentencePairs` now
stores a MEANING (`meaningOf` strips a `<Directive …>:` prefix); the build prompt
keeps its cue. 164 → 2, and both survivors are colon-less m5/m8 authoring, not
the systematic class. This is the RUN-PLAN's own 3+-modules rule applied.

**`scripts/exposure-audit.mjs` IS BLIND TO EVERY IR MODULE, and the carrier note
that opened this cycle was measured on a partial corpus.** It globs
`curriculum/m*-neo*.ts`, which for m6-m20 are thin compiler wrappers containing
no Japanese at all — so its "3336 surfaces" are m3/m4/m5/m30 only, and its one
UNDER-exposed row (じかん #130 ×1) cannot move no matter what a later module
does. m20 spends じかん anyway (three authored sentences plus three review
pools, inv 27), but the SCRIPT needs to read `ir/*.ir.yaml` before its output
means anything for m6+. Carried debt, not a module defect.

**VERIFICATION OF THE m20 CYCLE (orchestrator, 2026-07-27).** Guard relaxations
are where a bad call hides, so both course-wide changes were re-derived rather
than accepted on the agent's report. (a) The `meaningOf` strip rewrites **640
beats**, not the 164 quoted — that figure counted OPTIONS, a different
denominator. Every one of the 640 removes a genuine register cue (checked by
requiring the stripped prefix to name a register: politely / to a friend / to a
teacher / …); **zero** strip real meaning, and the 15 colon-bearing survivors are
all clock times (8:10, 7:05), correctly untouched. (b) The homograph-loser
exemption lets through **exactly 17 atoms** — precisely the
`JA_PRIMARY_ATOM_BY_KANA` ruling set, no more. Both accepted.

**NEW GUARD — `homographTeaching.test.ts`, the other half of the exemption.**
Relaxing image-first for losers is right (an atom no token can identify has no
debut to get wrong), but it opens a hole: a module could now teach 「あめ =
candy」 and the guard would stay silent, while the tokenizer credited 雨 "rain".
The lesson would render perfectly, mark the learner correct, and schedule the
wrong atom — 飴 could never come up for review, because nothing can reference it.
So image-first stops demanding the impossible and this stops anyone authoring it:
any `word_image_mcq` answering with a ruled kana must teach the sense the kana
resolves to. It ships with a non-vacuity test (`sensesAgree("candy","rain")` is
false) because the course currently has no offenders and a guard that can only
pass is worthless. **Standing consequence: a losing sense is UNTEACHABLE until
the course has a disambiguation mechanism (a kanji surface, or a compound).**
N4 health vocabulary wants かぜ "a cold" and は "tooth" — both losers — so this
decision has to be made before that module, not during it.

**GATE 7 recalibrated for m20, 0.53 → 0.76.** The old floor was measured on the
archived Body & Health m20; the neo module measures 69/87 = .793, because a
comparison names TWO things plus a predicate by construction and most beats hang
a second clause on m16's から / けど. Raised, never lowered, per that block's own
rule.

**Carrier note for m20 (inv 27):** `exposure-audit` now reports exactly ONE
under-exposed CEJC top-150 word, じかん (#130, ×1). It belongs in m20's tails
and carriers.

**NEW TOOLING from the m18 cycle — `kind: kanji`, an IR beat that emits
`kanji_reading`.** Three rows owe a kanji set (m18/m23/m28) and the IR could
not express one: the only authored kanji step in the course was m30's,
hand-written in TS. The beat is a thin front door onto the SHIPPED factory
(`grammarHelpers.kanjiReading`) — surface + unlock gate from
`KANJI_ELIGIBLE_ATOMS`, distractors from `readingDistractors` — and it THROWS
rather than degrading, because a silently-dropped kanji step is a coverage
hole nothing else can see. `emit-tts-deck.mjs` learned it in the same change.
m18 spends it on eight glyphs (人 水 食べる 行く 聞く 分かる 新しい 高い), all
on already-taught words unlocked at m9–m15 so they read BARE at m18, sprinkled
five/one/one/one across L8, L9, review-3 and the challenge rather than walled
into one lesson.

**Three guards were WRONG rather than the content (m18, 2026-07-27) — the
3+-modules rule applied early because each defect was structural:**
(a) `moduleBarGuards`' image-first check substring-matched `JSON.stringify(step)`
against every atom kana, so the ONE-CHARACTER atom き (木, stale old-course m18
tag) "debuted" on the first step containing きく / きょう / きっさてん — it now
tokenizes, the same lesson `moduleCompiler`'s own image-debut diagnostic
learned ("いま is a substring of かいます"). (b) `jaSurfaces` did not scrub
`kanji_reading.options`, so the factory's deliberate MIS-readings counted as
vocabulary (じん reported as an untracked word, き extracted out of じきべる) —
they are now scrubbed beside `conjugation_transform.distractors`, the same
class for the same reason. (c) GATE 8's motion-futurate allowlist is a
substring match on stems, and くる's negative こない/こなかった shares no
characters with くる, so "I don't think he's coming" — the gloss invariant 17
explicitly licenses — was flagged as wrong-aspect. All three make the guards
report fewer FALSE positives and cannot mask a real one.

**A SIXTH note, m17 (2026-07-27) — the ledger row is unchanged; the SPINE
overrode the authoring brief on the SIZE of the vocabulary.** The m17 brief asked
for BOTH family word sets in one module (ちち/はは/あに/あね/おとうと/いもうと
*and* おとうさん/おかあさん/おにいさん/おねえさん). spinePlan n07 says the
opposite in so many words — "YOUR-family terms only (はは/ちち/あに/あね…)" — and
its `why` is Spencer's note verbatim: "the honorific others'-side words wait for
Family II so learners never hold two words for 'mother' at once". Family II is
already this table's m21 (tile s19, "Listing: や, たり (+ Family II)"), whose own
spine entry says "others'-family honorifics drilled against Family I". **The
SPINE WINS** and no row moves: m17 ships the うち set only, and no そと word is a
graded surface anywhere in it (machine-checked in `m17-neo.test.ts`). The brief's
other half — "you address your OWN parents as おとうさん/おかあさん" — is still
taught, in the L1 rule card's PROSE in ROMAJI, where `jaSurfaces` (kana-only) is
blind to it: the register fact lands without putting a Family II word on a tile.
Five points are RE-TAUGHT rather than re-assigned, because the row owes only four
ids across nine teaching lessons and inv 42 forbids inventing new ones:
`no-possession` + `kore-sore-are-dore` + `dare` (m4), `ga-existence` (m6) and
`numbers-11-99` (m11). **Also not shipped: any age on a sound-change cell.**
〜さい geminates on 1, 8 and 10, and a ROUND ten inherits it (jussai, sanjussai,
gojussai), so 「ごじゅうさい」 on a build tile would install a reading nobody uses
— the first draft shipped three of them and the module's own guard caught it. The
ages that reach a tile are 6, 9, 17, 19, 45, 53, 63 plus はたち. `にさい`/
`にじゅう`-anything is banned for the separate に-homograph reason.

**One reconciliation goes the OTHER way (m12, 2026-07-27).** spinePlan s09
pulls なる (く/になる) forward from s23; the ledger keeps `ku-ni-naru` at m27
and m12 shipped WITHOUT it. This is a tooling limit, not a curriculum call:
the く-stem (たかく) exists in no lexicon the guards read — ADJ_ENTRIES stores
only the four full cells and courseAtoms stores no inflections — so
`たかく なる` either trips the compiler's unbuildable gate or forces inflected
stems into the atom registry, the exact regression m11 documented for ました.
The に-side (しずかに なる, げんきに なる) tokenizes cleanly today, so なる can
land whole as soon as a く-stem lexicon exists; splitting it in half at m12
would have been worse than deferring it. Also deferred from s09 by the
ledger's own rows, not by m12: すき/きらい (m13, beside が-marked ほしい/たい)
and よ/ね (m29, the sentence-final-particle tile). すごい/こわい were cut —
neither is in ADJ_ENTRIES, so their inflections are invisible to the
provenance guard's real-form lexicon; おいしい/いい/おもしろい carry the
frequency win instead. どう DID land, as vocabulary rather than a rule card
(the registry has no point for it, and inv 42 forbids inventing one).

**A SECOND spine deviation, m13 (2026-07-27) — `ni-iku` stays at m19.**
spinePlan n05 lists "にいく purpose-of-motion (stem + にいく)"; the ledger
assigns `ni-iku` to m19 (s15). The spine normally wins, and this row is NOT
being edited to match it, for a tooling reason identical to m12's なる: the
bare ます-stem (たべ, のみ) is a surface no lexicon in this repo knows.
`getRealFormLexicon()` stores whole ChainForm outputs, never stems, and
courseAtoms stores no inflections — so 「たべに いく」 either trips the
compiler's unbuildable gate or forces stems into the atom registry, the
exact regression m11 documented for ました. m19 already owns
e-direction/made-ni/kara-time and is where にいく can land whole once a
stem lexicon exists. Also deferred from n05 by m13 itself: **ほしくない /
ほしかった**, because ほしい is absent from ADJ_ENTRIES and its inflections
are therefore invisible to the real-form lexicon (〜たくない carries the
negative wish instead). m13 DOES re-teach m12's `i-adj-negative` /
`i-adj-past` / `i-adj-past-negative` cards with たい as the base — that
reuse IS the module's argument, and the ledger rows are unchanged.

**A FOURTH note, m15 (2026-07-27) — the ledger row is unchanged; the SPINE
overrode the authoring brief on one point.** spinePlan s11 says "とき (#62)
temporal clauses — MATCHED-TENSE sentences only in this beat (audit: 行くとき vs
行ったとき relative-tense flip is a documented trap; the contrast belongs to the
s22 deepen)". The m15 brief asked for the flip ("〜る とき = before/while, 〜た
とき = after"). **The spine wins**: every とき sentence in m15 keeps its two
halves in the same tense, and the flip stays on m22's row. Machine-checked by a
matched-tense guard in `m15-neo.test.ts`. Three points are also RE-TAUGHT here
rather than re-assigned, because the registry has no id for "relative clause"
and inv 42 forbids inventing one: `dictionary-form` (m7's citation form, which
is exactly why the ledger put it on m15's row), `ta-form` (m11) for the past
clause, and `ga-existence` (m6) for the clause-internal subject. こと rides
m13's `no-ga-suki` — こと and の are one construction with two skins, and
`koto-ga-aru` (EXPERIENCE) stays on m23. No ledger row moved. **Not taught in
m15: past-tense ADJECTIVE predicates** (おいしかった / やすかった / たかかった /
おもしろかった) — see the new recurring trap below; the module uses non-past
adjective predicates with past clauses instead, which isolates the
relative-clause skill anyway.

**A THIRD reconciliation, m14 (2026-07-27) — `mada-mou` m22 → m14, and
`te-kara` stays at m15.** spinePlan n06b lists もう/まだ as "the canonical
ている spend (もう食べた / まだ食べていない)", while the ledger had `mada-mou`
on m22 (s17, body & health), where it is a bolt-on with no domain link.
まだ〜ていない is not a temporal-adverb fact — it IS the negative ている, so it
cannot be taught before m14 and should not wait five modules after it. The
SPINE wins and the ledger row moved, exactly as this table's own rule
requires. The same spine line also says "Sequencing clauses with て; てから":
m14 teaches the SEQUENCING half (L9, a second `te-form` card — clause linking
is what buys the module its sentence-complexity ramp, inv 13), but `te-kara`
stays on m15's row, where the ledger pairs it with `mae-ni`/`toki`. "After
doing X" and "before doing X" are one contrast; splitting them across two
modules teaches half a pair twice. **Also NOT taught in m14: かく/たつ/うたう**
— the context pack lists them as known because the pack's word list is built
from courseAtoms attribution, but no NEO module has ever introduced them, and
the taught-set the guards use comes from prior neo LESSONS. かいて would have
been the natural fourth ramp verb.

### Scheduled tooling fix — STEMS — SUPERSEDED, see "DONE — stems" below

Deleted 2026-07-27 rather than left in place: this section still read
"deliberately not done yet … must land before m19", which was true when written
and false by the time m19 shipped. Two sections describing the same work in
opposite tenses is the context-rot failure this run is supposed to be auditing,
and a stale instruction is worse than no instruction — an agent reading top-down
would have believed stems were still missing and re-deferred around them.

Current state: stems landed, `ni-iku` was authored in m19, and of the two
deferrals it caused, **m13's 〜に いく is PAID** and **m12's 〜く なる is not
debt** — the ledger assigns `ku-ni-naru` to m27, so it is scheduled work, not
something owed back to m12.

### DONE 2026-07-27 (was the quiet-window batch)

- ✅ TTS is current end to end, including the Keita clips the speaker-routing
  fix owed. `emit-tts-deck` → `generate` → `gen_dialogue_voices`.
- ✅ **The vocab-leak class is closed at the source.** `ir.priorVocab` (built by
  `compile-ir.mjs` from earlier modules, NOT from the stale `fromModule` tags)
  is now what "already known" means, so pools cannot reach forward into
  vocabulary the learner has not met. `untaughtOptions.test.ts` holds it at 0.
  This also caught that a ramp card prints its BASE as a given — m14 was
  drilling すむ, a verb taught in no module, invisible to every debut guard
  because a given is not an introduction.

### DONE 2026-07-27 — stems (was the last blocker before m19)

`getRealFormLexicon()` AND the compiler's tokenizer/`unbuildable` gate now
know verb ます-stems and い-adjective く-stems. 〜に いく (m19), 〜すぎる (m27)
and N4's 〜ながら / 〜やすい・にくい / 〜たがる (m36) are unblocked, and the two
deferrals it caused (m12 〜く なる, m13 〜に いく) can be revisited whenever
their modules are next touched.

It was safe to land mid-authoring because the tokenizer is longest-match-
first: a shorter entry can only win where nothing longer matched, i.e.
exactly where an unrecognized fragment was already being emitted.

### RULING — a homograph LOSER is not teachable, so は "tooth" and かぜ "a cold" are out of N5

Decided 2026-07-27, before m22 (Body & Health) was briefed, because that is the
module that wants both words and finding out mid-authoring would have cost a
cycle.

Seventeen kana resolve to one atom by ruling (`JA_PRIMARY_ATOM_BY_KANA`). The
LOSER of each pair cannot be identified by any token, so it can never accrue SRS
credit — and `homographTeaching.test.ts` (added this cycle) now fails the build
if a word-image MCQ teaches a sense the kana does not resolve to. Health
vocabulary is where that first bites:

- **は "tooth" — permanently out.** は is the TOPIC PARTICLE. Nothing short of a
  kanji surface can disambiguate it, and no toothache sentence is worth a tile
  that mis-credits the most common particle in the language.
- **かぜ "a cold" — out of N5.** m7 already teaches かぜ = WIND
  (「かぜが あります」 = "there's a breeze", which is correct Japanese — checked,
  not assumed). Teaching a second sense in kana would contradict prior learning
  AND credit kaze-wind. 「ねつが あります」 covers being ill without it.

**Do not "fix" either by flipping a ruling in `JA_PRIMARY_ATOM_BY_KANA`.** That
silently rewrites every existing use of the word — the change is course-wide and
invisible, which is exactly the class of bug this run keeps finding.

The rest of the domain is clear: あたま, おなか, め, みみ, あし, からだ, くすり,
びょうき, いたい, げんき all resolve uniquely, and のど, ねつ, くび, ゆび, せなか,
こし are unclaimed. **て "hand" is UNVERIFIED** — it is a registered atom and the
て-form is everywhere, so if a て-form verb ever emits a bare て tile it is a
silent mis-credit of the same class; m22 was told to check rather than assume.

Teaching a losing sense stays blocked until the course has a disambiguation
mechanism — a kanji surface, or a compound that the longest-match tokenizer
consumes whole. That is a real decision for N4, not a bug to fix.

### Carrier fatigue — WHICH WORDS NOT TO REACH FOR (measured 2026-07-27)

`scripts/exposure-audit.mjs` was blind to every IR module (it globbed
`m*-neo*.ts`, which from m6 on are empty compiler wrappers) and was therefore
reporting on m3/m4/m5/m30 while implying the whole course. **Fixed** — it now
reads `ir/*.ir.yaml`, counting only learner-facing keys, never declarations like
`kana`/`introduces`, which a module could otherwise use to inflate its own
reinforcement score. Corpus went 3336 → 9494 surfaces.

Fixing it exposed the same bug one level up: the OVER-exposure rule was a flat
`> 25 occurrences`, calibrated on the four-module corpus, so against the real
one it flagged うん, から, これ — CEJC ranks 1, 21, 33. A rank-1 word appearing
constantly is not fatigue, it is Japanese. **Over-exposure is now a RATIO**:
observed share vs Zipf-expected share from CEJC rank (and, for words outside
the top-500, vs the median carrier). Corpus-size independent, so it stays true
as the course grows.

**The result is a real finding, and it applies to every module from m21 on.**
These carriers are used far past what their own frequency justifies — reach for
something else when a sentence needs a noun:

| word | uses | over-use |
|---|---|---|
| みせ | 254 | 21.3× |
| ともだち | 234 | 16.5× |
| ほん | 260 | 14.6× |
| ごはん | 222 | 14.6× |
| いる | 271 | 13.8× |
| きのう | 201 | 12.9× |
| あたらしい | 130 | 12.8× |
| えき | 135 | 12.2× |
| かばん | 186 | 8.9× the median carrier |

59 words are above the bar in total. The course is not wrong to use concrete
nouns — it needs imageable carriers — but nine words carrying a fifth of every
sentence is the "student/teacher ×10" pattern Spencer flagged on 2026-07-20,
and it makes sentences feel same-y long before a learner can say why.
Meanwhile only ONE word is under-exposed course-wide (はいる #88 ×2), so the
problem is concentration, not coverage.

**Re-measured after m21 — the guidance works, but slowly.** m21 was given this
table mid-flight and added 477 surfaces while the heavy carriers grew by only
1–9 each (みせ +3, ごはん +1); a module leaning on them normally would have added
~20 apiece. So briefing it changes authoring behaviour. What it cannot do is
move the RATIOS (21.3× → 20.7× for みせ): nine modules of accumulated
concentration will not be diluted by one module, so treat the table as a "spend
elsewhere" list, not a debt that later modules can pay off.

**Under-exposed words to spend, refreshed after m21: もの (#56, ×2) and はいる
(#88, ×2).** もの was NOT flagged before m21 — its count fell because m21 added
のみもの and longest-match correctly stopped crediting the もの inside it. That is
the audit working as intended, not a regression.

### Carried debt (batch later, do not derail a module for these)

- ~~m8–m10 dialogue speaker labels are kana → male speakers got the Nanami
  voice.~~ FIXED 2026-07-27, and not the way it was reported: the invariant
  always named the kana forms, so the *code* was wrong, not the content. The
  roster moved to `dialogueSpeakers.json` (one file, read by both the runtime
  view and the emitter, which were hand-copied twins) and
  `dialogueSpeakerRegistry.test.ts` now fails on any unclassified speaker.
  89 lines were affected — トム 28, たけし 27, たなか 22, ケン 9, けん 2,
  たなかさん 1. **Still owes a Keita generation pass** — emit-tts-deck will
  now route those lines into the ja-keita deck, but the clips themselves need
  synthesizing in lingo-core. **SETTLED 2026-07-27 — verified, not assumed.**
  The script named here (`gen_keita_dialogue.py`) does not exist; the real one
  is `gen_dialogue_voices.py`, and every module cycle has been running it. The
  emitted `ja-keita-dialogue` deck holds 586 male-speaker lines and the TTS
  manifest holds 600 `ja-keita:` keys; **0 of the 586 are missing a clip**, the
  89 legacy m8–m10 lines included. Nanami needs no prefix — she is the base
  `ja` voice. Nothing owed here.
- **inv 35** ("build tiles carry no authored distractors") flags every IR
  module m6–m11 — the IR has no field to express it. This is a COMPILER/IR gap,
  not a module defect; the 3+-modules rule says fix the tooling, not the
  content.
- ~~**`scripts/exposure-audit.mjs` reads only `curriculum/m*-neo*.ts`**~~ —
  FIXED in the m21 cycle; it reads `ir/*.ir.yaml` now and the corpus went
  3336 → 9494 surfaces. See the carrier-fatigue section.
- **⏳ IN THE TREE, UNCOMPILED: all eleven replacements are already written into
  the nine `*.ir.yaml` files** (2026-07-27, during the m28 quiet window). A YAML
  edit is INERT until `compile-ir.mjs` regenerates the `.ir.json` the tests
  read, which is why they could be drafted while an authoring agent was running
  its own suite. **To finish, after m28 is committed:** compile m13 m15 m16 m18
  m20 m21 m23 m24 m25 → run each module's own test file → empty out
  `KNOWN_DEBT` in `challengeNovelty.test.ts` (it should go to zero, not shrink)
  → `emit-tts-deck` + `generate` (11 new sentences need clips, and
  `audioCoverage.test.ts` fails without them) → full suite → commit.
  Two drafts were struck by the collision check before being applied
  (「さくらを みた ことが ある」 and 「あきは たぶん すずしいでしょう」 already existed),
  and m23's replacement had to be done by line number because the original
  string appears twice in that file — once in the teaching lesson, once in the
  challenge, which IS the defect.
- **ELEVEN challenge lessons re-run a sentence the learner already met twice.**
  Superseded and made precise 2026-07-27 by `challengeNovelty.test.ts`, which
  is now a hard gate with these eleven listed as `KNOWN_DEBT` — the list may
  shrink and can never grow, so m28+ cannot add a twelfth. Each is ONE sentence
  swap in a challenge lesson, keeping the grammar tags:
  `m13 s-6` · `m15 s-7` · `m16 s-7` · `m18 lc-9` · `m18 lc-10` · `m20 lc-9` ·
  `m21 lc-8` · `m23 s-7` · `m24 lc-9` · `m24 s-7` · `m25 s-7`.
  Do this in a quiet window with ONE agent — nine modules' IR files, no shared
  guard files, and TTS run once at the end by the orchestrator. The method that
  works (learned the hard way on m26): dump the module's full sentence
  inventory FIRST, then draft, because three of my four m26 drafts collided
  with sentences already in the module or tripped its fatigued-carrier list.
  A further **fifteen** challenge sentences appear in exactly ONE other lesson;
  those are deliberately NOT flagged — hearing in the challenge what you built
  in lesson 7 is a modality shift, which is review working as intended.
- ~~**Two challenge lessons reuse a taught sentence verbatim**~~ (found 2026-07-27
  by a course-wide scan of compiled production targets):
  `m15.ir.yaml:597` repeats 「うみで およぐ ことが すきだ。」 from `m15-neo-4`, and
  `m23.ir.yaml:698` repeats 「うみで およいだ ことが ないけど かわで およいだ ことが
  ある。」 from `m23-neo-2`. **Replacements already drafted** (checked against
  each module's own challenge beats so the vocabulary is attested — still
  verify against the module's full sentence inventory before applying, which is
  how three m26 drafts got struck): m15 → 「じゅぎょうに いく まえに うたを きく
  ことが すきだ。」 (translate; まえに + こと + すき), m23 → 「くうこうで はたらいた
  ことが ないけど ホテルで はたらいた ことが ある。」 (keeps the contrastive
  ことがない/ことがある frame, which is the beat's whole point). Inv 26 says
  longer-but-familiar is not a challenge,
  but the compiler's `challenge-not-novel` diagnostic keys on the **beat kind**
  (`capstone`/`challenge`) and checks only the grammar-point COMBINATION — an
  ordinary `kind: sentence` beat sitting inside the challenge LESSON is never
  checked, and identical text passes as long as the point set differs. Rewrite
  the two beats with new sentences, then add the ratchet: no sentence in a
  challenge lesson may equal one authored earlier in the same module.
  **Scope first, before spending time on it:** the same scan says the pattern
  is otherwise the intended review ladder (teaching → review-1/2 → review-3),
  and **m22–m26 have zero sentences appearing in 3+ lessons** — later authoring
  already fixed itself. 35 such sentences exist course-wide, all in m10–m21,
  and only these two touch a challenge.

### Course-wide scans run 2026-07-27 — record the CLEAN results too

Ran during the m27 quiet window, over compiled output for all 397 ja lessons.
Recorded so nobody pays to re-derive them, and because a clean scan is only
worth anything if you can see what it actually looked at:

- **Answer-in-prompt leaks, `multiple_choice`: 0** of **615** steps checked.
  Token-matched, never substring (Rule Zero). No MCQ hands the learner its own
  answer in the prompt text.
- **Same answer+type twice inside ONE lesson: 4**, of 3,314 answers scanned —
  `ja-m1-yoon-intro-2` (きょう, a kana drill, deliberate), `ja-m10-neo-1`
  (はい, the register picker ladder — two beats legitimately answer はい), and
  two genuine ones: `ja-m6-neo-4` builds 「ほんがある」 at s-0 and s-4, and
  `ja-m7-neo-2` builds 「ともだちがきます」 at s-3 and s-7. Trivial, pre-IR-era,
  batch whenever m6/m7 are next touched.
- **Sentence repeated across 3+ lessons of one module: 35**, all in m10–m21 and
  all the intended teaching → review-1/2 → review-3 ladder. **m22–m26: zero.**

The scan that found the two challenge repeats above is the same one; it reads
`targetPhrase` / `acceptedAnswers[0]` / `correctOrder.join("")`, i.e. the three
real answer fields, and asserts a non-zero scanned count. Copy it, don't
rewrite it from memory.

Untouched at run start (74): janai-desu kara-origin kudasai counter-nin
dictionary-form kono-sono-ano-dono i-adj-present i-adj-negative to-and
na-adj-present na-adj-negative yo-emphasis ne-agreement masu-past desu-past
i-adj-past i-adj-past-negative na-adj-past ta-form masu-past-negative
mada-mou ni-time numbers-11-99 counter-ji counter-fun frequency-adverbs
made-until kara-time numbers-100-10000 counter-ko counter-mai counter-hon
kanji-set-1 v-tai ga-hoshii suki-kirai-no kedo te-iru te-mo-ii
te-wa-ikemasen naide-kudasai te-kara e-direction made-ni mae-ni deshou
to-omoimasu family-register counter-sai ga-itai node-because to-quotation
ya-incomplete-list counter-hai kanji-set-2 yori-comparison ichiban-superlative
no-ga-jouzu no-ga-heta mashou masenka no-ga-suki tari-tari-suru tsumori-desu
ni-iku koto-ga-aru toki kara-because n-desu sugiru nakereba-naranai
hou-ga-ii ku-ni-naru kanji-set-3

## Token discipline for this run (learned the hard way)

- **Tell every authoring agent NOT to spawn a background watcher shell to poll
  for TTS.** `scripts.tts.generate` is synchronous — it prints
  `wrote=N cached_skipped=N failed=0` and exits. Both the m20 and m21 agents
  started poll loops anyway; the loops outlived the work, got reaped one by one,
  and each reaping fired a task-notification that woke the orchestrator with
  nothing to do. Three wasted turns per module, every module. Add the line "run
  the TTS commands in the foreground; do not background them or poll for them"
  to the brief.

- **NEVER** call `TaskOutput` with `block: true` on an agent, and never `Read`
  an agent's `.output` file. Both dump the agent's ENTIRE JSONL transcript into
  context — one such call cost ~7k tokens for zero information. Wait for the
  completion notification instead; it arrives on its own and carries only the
  agent's final report.
- Ask agents for **≤15-line reports, no file contents pasted**.
- Prefer `node -e` / `grep -c` one-liners that print a number over reading files.
- Generate a module's context pack only immediately before authoring it — the
  pack is derived from `courseAtoms.ts`, so pre-generating goes stale.
