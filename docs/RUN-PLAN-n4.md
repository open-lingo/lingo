# Overnight run — finish N5, then author to mid-N4

**Started 2026-07-27. Base commit `7e605ffd` (all prior work committed).**
Spencer: *"author up to mid way in n4 so I can start learning… don't ask me
for anything, do this efficiently, and do it well."* Decisions are mine to
make and document; he'll flag them later if he disagrees.

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
m10 n15 · m11 n04 · m12 s09 · m13 n05.

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

## Known-good metrics to hold

- full suite green (was 5598 passing at run start)
- translate ≤ 15% of production (currently 10.8–13.6%)
- single-tile builds ~0 (currently 3, all m10 register beats)
- ≥5 distinct step types per lesson (currently 11 per module)
- 0 word_image_mcq reuse

## Recurring traps (cost real time this session — do not re-learn)

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
- **`i % pool.length` is not rotation, it is repetition** once i exceeds the
  pool. Filler must track what it has already spent in the lesson.

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
| 14 | te-iru te-mo-ii te-wa-ikemasen naide-kudasai kudasai |
| 15 | dictionary-form toki mae-ni te-kara |
| 16 | kara-because node-because kedo kara-origin counter-mai **masu-past-negative** |
| 17 | family-register counter-sai counter-nin kono-sono-ano-dono |
| 18 | to-omoimasu to-quotation kanji-set-1 |
| 19 | e-direction ni-iku made-until made-ni kara-time **counter-fun** |
| 20 | yori-comparison numbers-100-10000 counter-ko |
| 21 | ya-incomplete-list to-and tari-tari-suru counter-hon |
| 22 | ga-itai frequency-adverbs mada-mou counter-hai |
| 23 | koto-ga-aru tsumori-desu kanji-set-2 |
| 24 | mashou masenka no-ga-jouzu no-ga-heta |
| 25 | deshou |
| 26 | ichiban-superlative |
| 27 | n-desu sugiru ku-ni-naru |
| 28 | nakereba-naranai hou-ga-ii kanji-set-3 |
| 29 | janai-desu yo-emphasis ne-agreement |

**When this table and `spinePlan.ts` disagree, the spine wins** and the table
gets edited — the table is a coverage ledger, not a curriculum. Already
reconciled: `masu-past-negative` m11→m16 (the spine defers ませんでした to the
connectives tile) and `counter-fun` m11→m19 (ぷん rendaku defers to the drip).

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
  synthesizing in lingo-core (`scripts/tts/gen_keita_dialogue.py`). Until then
  they fall back to the whole-line Nanami clip, i.e. no worse than today.
- **inv 35** ("build tiles carry no authored distractors") flags every IR
  module m6–m11 — the IR has no field to express it. This is a COMPILER/IR gap,
  not a module defect; the 3+-modules rule says fix the tooling, not the
  content.

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

- **NEVER** call `TaskOutput` with `block: true` on an agent, and never `Read`
  an agent's `.output` file. Both dump the agent's ENTIRE JSONL transcript into
  context — one such call cost ~7k tokens for zero information. Wait for the
  completion notification instead; it arrives on its own and carries only the
  agent's final report.
- Ask agents for **≤15-line reports, no file contents pasted**.
- Prefer `node -e` / `grep -c` one-liners that print a number over reading files.
- Generate a module's context pack only immediately before authoring it — the
  pack is derived from `courseAtoms.ts`, so pre-generating goes stale.
