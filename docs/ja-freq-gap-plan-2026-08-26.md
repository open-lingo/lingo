# JA frequency-vocabulary gap — closure plan

**Date:** 2026-08-26 · **Status:** PROPOSAL (design only; no content authored)
**Scope:** the ~110 real content-word gaps in the CEJC spoken top-500, plus the
13 never-unlock atoms, the taught-but-unregistered set, and the colloquial band.
**Reads against:** `docs/authoring-invariants-pinned.md` (50 invariants),
`docs/lesson-authoring-guide.md` §13, `docs/pedagogy-principles-2026-07-05.md`,
`CLAUDE.md` lenses, `docs/vocab-exposure-audit-2026-07-29.md` (AUTHORITATIVE —
this plan **continues** it, see §0.1), `docs/spine-n4.md`, `docs/register-teaching.md`.

---

## 0. The three things that change the brief

### 0.1 This is wave 2 of an existing, Spencer-approved programme — not a new one

`docs/vocab-exposure-audit-2026-07-29.md` is AUTHORITATIVE and already specifies
**exactly this mechanism**: one extra teaching lesson slotted into a shipped
module's IR, teaching 7–8 words in that module's own grammar. It lists **13
packs**; the ratchet history in `atomExposureAudit.test.ts` proves **6 shipped**
(m11 ×2, m13 ×1, m14 ×1, m16 ×2), moving the never-graded ratchet 220 → 173.

The two waves target **disjoint word sets**, and the difference is the entire
cost story:

| | B067 wave (packs 7–13, unbuilt) | This wave (frequency-gap packs) |
|---|---|---|
| Target | 96 words that **have registry rows** but no live lesson teaches | ~110 words with **no registry row at all** |
| `courseAtoms` row | exists | must be authored |
| TTS | "already done" (§3 of the audit; 28/28 spot-checked present from the old course) | **every clip is new** |
| Conjugation tables | already in `VERB_ENTRIES`/`ADJ_ENTRIES` where needed | ~20 verbs + ~7 adjectives **must be added** |
| Ripple risk | low (rows already tokenize) | **high** — new rows join the course-wide tokenizer |

**Sequencing consequence:** finish B067 packs 7–13 first. They are near-free,
they lower the ratchets, and they de-risk the machinery on words that cannot
ripple. Then run this wave.

### 0.2 The 151-row gap list contains ~34 rows that are not gaps

Verified by reading the IR corpus, not by matching. Correcting this matters
because seven of them are in the CEJC top-100 and would otherwise look like the
plan's biggest wins:

| Row | Reality |
|---|---|
| だ #2 | taught m3 (`desu-copula` m7, plain copula m3) |
| ね #5, よ #15 | taught m29 (`ne-agreement`, `yo-emphasis`) |
| た #6 | taught m11 (`ta-form`) |
| って #17 | taught m18 (`to-quotation`) |
| ます #30 | taught m7 (`masu-present`) |
| **ちゃう #46** | **taught m38 as PRODUCTION** (`chau`; spine D15 explicitly rejected recognition-only) |
| ば #72 | taught m37 (`ba-form`) |
| だけ #79 | taught m35 (`dake`) — IR `newAtom`, no registry row |
| たい #81 | taught m13 (`v-tai`) |
| ながら #235 | taught m36 (`nagara`) |
| すぎる #244 | taught m27 (`sugiru`) — the *lexical* 過ぎる "to pass" is a genuine gap |
| しまう #286 | taught m38 (`te-shimau`) — the *lexical* "put away" is a genuine gap |
| じ #115, つ #133 | counters taught **instantiated** (いちじ…じゅうじ at m11; ひとつ…みっつ at m9). Matcher artifact — the course never registers the bare counter morpheme. |
| ど #318, にち #218 | partial: こんど is m31, とおか is m30; the rest of each series is a real gap |
| てる #16 | **prose-only at m14** — the `te-iru` rule card names the contraction in text. Rule prose is invisible to the provenance guard, so it is a real gap on every *graded* surface. |
| おれ #83 | **recognition-capped at m10** (`m10.ir.yaml:30`), and has **no `courseAtoms` row** |

So the honest headline is **~110 real content-word gaps**, not 151, and the
function-word bucket is 8 genuine gaps (てる, さ, じゃん, っけ, わ, らしい,
なんか, なんて, ばかり, こそ, ずつ, みたい) rather than 22.

### 0.3 Two structural pre-emptions from `docs/spine-n4.md`

- **D16: never re-teach.** "If QA finds an N5 concept genuinely under-taught,
  the fix is that module's re-authoring, not a duplicate N4 module." A gap word
  that the spine already schedules for m39–m51 must **not** be pulled forward.
  This removes みたい / らしい / ようだ from this plan (m42 hearsay, m44 ようだ),
  なさる / いたす (m49/m50 keigo), and 〜な/〜ろ imperatives (m47).
- **m47 "opens the BOTTOM of the register scale."** The colloquial band has a
  designated home already. See §3.

---

## 1. Word-to-module assignment

### 1.1 The gate that decides placement

Per `CLAUDE.md`: *every content word must decompose into atoms already taught by
this point.* The machine form is the compiler's gate/precedence pass plus
`moduleBarGuards`' vocab-provenance test. **The reliable taught-prefix for module
N is `⋃_{k<N} mk.ir.json.newAtoms[].kana ∪ m6.ir.json.priorVocab ∪
JA_COURSE_FURNITURE_KANA`** — computed from the current IR files.

⚠️ Do **not** use `getJaTaughtKanaBeforeModule()` or `mN.ir.json.priorVocab` for
this: its `IR_BY_MODULE` map only covers m6–m31 (m32–m38 silently fall back to
the `courseAtoms.fromModule` path the file's own header calls "stale by
construction"), and the checked-in `priorVocab` for **m17, m18, m20, m21, m24,
m27, m28** is each ~75 words short of the true union (they are compile artifacts
frozen at whatever moment their module was last compiled — the tell is that
sizes go *down* between adjacent modules: m16=386 → m17=362). **Recompiling
those seven modules is the cheap durable fix and is wave-0 work.**

A gap word is placeable at module N when (a) its own decomposition is inside
that prefix, and (b) the module's *own* grammar is the natural machine for using
it. Criterion (b) is what makes this a re-cement lesson and not a flashcard dump,
and it is the criterion that actually drove every assignment below.

### 1.2 Capacity

Inv 25 caps a module at 15 lessons (11 teaching + 3 review + 1 challenge).
Current state, and headroom for insert lessons:

| Lessons today | Modules | Headroom each |
|---|---|---|
| 12 | m34, m35, m36, m37, m38 | 3 |
| 13 | m6, m7, m9, m10, m12, m15, m17–m32 (most) | 2 |
| 14 | m13, m14, m33 | 1 |
| **15 (full)** | **m8, m16** | **0** |
| 17 (already over) | **m11** | override in force |

m11 already ships 17 lessons. The override is documented in `m11.ir.yaml:16-21`:
*"The two slots past inv 25's 15-ceiling are the 2026-07-29 vocab-pack
insertions (B065/B067, Spencer-approved wave plan — packs slot INTO the
course)."* So the ceiling is negotiable **with an explicit IR note**, but this
plan does not need it: total headroom across m6–m38 is ~60 slots and the plan
spends 23.

### 1.3 The assignment

23 insert lessons. Each row states the module's own grammar the lesson
re-cements — that is the lesson's spine, and the new words are its carriers.

| # | Module · insert lesson | New words (CEJC rank) | Grammar RE-CEMENTED |
|---|---|---|---|
| F1 | **m6** · "What's around it" | まわり #469, まんなか #504, ばしょ #376, あいだ #373 | `spatial-relations`, `ni-location-location`, `arimasu`/`imasu`, ここ/そこ/あそこ, `location-qa` |
| F2 | **m9** · "Paying for it" | はらう #472, きゃく #397, いじょう #386, ずつ #407, ワイン #514 | `ikura-price`, `counter-tsu`, `numbers-1-10`, を-object, ください (m8) |
| F3 | **m10** · "Reaction sounds" | なるほど #132, ほら #92, オーケー #256, うそ #323, さすが #420 | `aizuchi`, `yes-no-register`, `chotto-softener`, `register-audience` |
| F4 | **m12** · "Big reactions" | すごい #49, うまい #197, おかしい #357, ふつう #142 | `i-adj-present/negative/past/past-negative`, `na-adj-present`, `dou-question` |
| F5 | **m17** · "こんな ひと — what kind of" | そんな #73, あんな #354, どんな #408, こんな (retag), いろんな #228, こう #48, たち #124, かれ #422 | `kono-sono-ano-dono`, `no-possession`, `counter-nin`, `family-register`, `dare` |
| F6 | **m18** · "Thinking and saying" | かんがえる #165, しゃべる #313, たとえば #223, ふう #185, けんきゅう #391 | `to-omoimasu`, `to-quotation` (って), `ta-form`, `ni-location` |
| F7 | **m19** · "How long, how far" | しゅうかん #479, かげつ #457, しゅう #510, とうきょう #306, まわる #384 | `counter-fun`, `kara-time`, `made-ni`, `e-direction`, `ni-iku` |
| F8 | **m20** · "Far more, roughly, the other way round" | ずっと #174, だいぶ #454, わりと #412, だいたい #243, らく #419, ぎゃく #262 | `yori-comparison`, ほうが, `numbers-100-10000`, `na-adj-present`, どっち/どちら |
| F9 | **m21** · "Mum, dad, and school" | ママ #247, パパ #281, おや #372, こうこう #325, ちゅうがく #503, しかも #341 | `ya-incomplete-list`, `to-and`, `family-register` (そと side), `tari-tari-suru`, `counter-nin` |
| F10 | **m22a** · "How you feel" | きもち #368, だいじ #355, ひどい #473, おこる #475, びっくり #335 | `ga-itai`, `wa-topic`, `naide-kudasai`, `te-mo-ii` |
| F11 | **m22b** · "How often, how much" | なかなか #334, まったく #417, たまに #442, ほとんど #415 | `frequency-adverbs` (いつも/ときどき/あまり), `nai-form` (the negative-polarity adverbs REQUIRE it), `counter-hon` |
| F12 | **m23** · "Back then" | むかし #211, さいきん #232, このあいだ #255, じだい #340, もともと #393, うける #342, こんかい #387, いちど/なんど (#318) | `koto-ga-aru`, `tsumori-desu`, `toki`, `te-kara`, `ta-form` |
| F13 | **m25** · "As I thought" | たしか #148, やっぱり #65 (RETAG; the corpus lists the lemma as やはり — teach the spoken やっぱり, gloss the formal やはり in the rule card, register **one** atom), いがい #370, ほんとう (#57, B067 220-set) | `deshou`/`darou`, `tabun-kitto`, `kana-wondering`, `to-omoimasu` contrast |
| F14 | **m26** · "In the whole world" | せかい #465, とくに #403, にんげん #406, ぶぶん #490, もっと + ほか (B067 pack 9) | `ichiban-superlative`, 〜の なかで, `yori-comparison`, `no-ga-suki` |
| F15 | **m27a** · "The reason it is" | わけ #109, ため #307, かんけい #296, じっさい #471, せいかつ #489 | `n-desu` (んだ/んです), どうして, `kara-because` |
| F16 | **m27b** · "It gets that way" | なくなる #333, どんどん #363, いきる #447, なんて #246 | `ku-ni-naru`/`ni-naru`, `sugiru`, `i-adj-present` |
| F17 | **m28** · "Properly, more or less" | ちゃんと #173, いちおう #196, めんどう #375, えらい #445, きほん #364 | `nakereba-naranai` (なきゃ), `hou-ga-ii`, `kara-because` |
| F18 | **m29** · "The rest of the enders" | じゃん #63, っけ #84, さ #32, わ #129 (recognition only) | `yo-emphasis`, `ne-agreement`, `janai-desu` (じゃん IS じゃない contracted), `register-audience`, `chotto-softener` |
| F19 | **m30** · "First, then, and get it done" | まず #264, さいご #261, れんらく #452, メール #492, かくにん #497, やく #507 | `te-oku`, `te-miru`, `mae-ni`, `kara-because` |
| F20 | **m32** · "Around then" | ころ #295, さっき #227, ひ(日) #143, けっきょく #221, ついたち/ふつか (#218) | `gurai-goro`, `tara`, `to-conditional`, `ni-time` (m11) |
| F21 | **m33** · "Left as it is" | あがる #314, のこる #388, すてる #481, まま #258 | `jidoushi-tadoushi` (が vs を), `te-iru-resultative` |
| F22 | **m35** · "Only, except, nothing but" | ばかり #350, いがい(以外) #463, ただ #217, こそ #399, ねがう #271 | `dake`, `shika-nai`, `favor-ladder`, `te-morau` |
| F23 | **m36** · "What it looks like" | かたち #344, かっこう #449, イメージ #430, あじ #347, にる #493, かんじる #502 | `sou-appearance`, `garu-tagaru`, `yasui-nikui`, `nagara` |

**Words that ride a B067 pack rather than a new lesson** (the pack is already
scheduled for that module; adding one word to it is free):

| Word | Rides | Why it fits |
|---|---|---|
| むり #251 | B067 pack 11 (m24, "Actions & plans") | m24 owns `potential-form`/`dekiru`. 「むりだ」 is the negative pole of the module's own point — 「できない」 said the way people actually say it. |
| もちろん (retag, §4.1) | B067 pack 11 (m24) | It answers a potential question: 「できる？」「もちろん。」 |
| なんで (`future`, unclaimed) | F15 (m27) | `n-desu`'s partner — どうして is taught at m27; なんで is its casual twin. |

**Sub-lesson-sized items — deepen beats, not new lessons** (D16-compliant: the
grammar is already owned, only the surface is unowned):

| Item | Home | Shape |
|---|---|---|
| てる #16 | m14 | The `te-iru` card already names it in prose. Promote to a **graded contrast**: one `listening-comp` pair (たべている / たべてる → same meaning, different register) in an existing teaching lesson, plus a `particle-cloze` with てる as the answer in `m14-neo-review-2`. One new atom (`kind: verb-form`, `derivedFrom: ている`). |
| もし #269 · ばあい #327 | m37 | `もし` is the conditional's adverb and `ばあい` its noun. Two sentence beats each in existing `ba-form`/`nara` lessons + a registry row for もし. |
| しまう (lexical) #286 · 過ぎる (lexical) #244 | m38 / m27 | One `sentence` beat each, contrasted against the auxiliary they already own. |

**Deferred, with the reason stated** (do not author these):

| Word | Why deferred |
|---|---|
| みたい #47, らしい #206, よう #101 | Spine owns them: m42 (hearsay 〜そうだ/って/らしい), m44 (ようだ/みたい/のように). D16 forbids pre-empting. **Also a live tokenizer hazard:** `m30.ir.yaml` bans みたい outright because 「かってみたい」 tokenizes to かって・みたい and credits m13's みる+たい. |
| なさる #290, いたす #482 | Keigo — spine m49/m50. |
| てき #125 (的) | N3-register suffix; also a **bound-morpheme hazard** (inv 41 — くん/さま/ちゃん precedent). |
| わけ #109 as 〜わけだ | The *noun* ships at m27 (F15); the modal construction is N3. |
| The full day-of-month series (みっか…はつか) | m11 is at 17 lessons. Two irregulars ride F20; the rest wait for an m11 override or an m11 re-author. |
| Colloquial band (12 words) | §3. |

**Coverage check.** The 23 packs + 4 deepen items + the 6 deferred rows account
for every non-artifact row in `gap-output.txt`'s CEJC-missing list. The residue
is the counter-morpheme artifacts (じ, つ, たち partially, ど, にち) which are
matcher noise, not learner gaps.

---

## 2. Lesson shapes

### 2.1 The precedent to copy

`ja-m16-neo-10` ("やさしい ほんを よむ — the classroom", B067 pack 5) is the
house shape for this lesson type and it already passes every gate. Its skeleton,
in IR beats:

```
rule (the module's own point, re-stated as a NEW variant — not a re-teach)
sentence ×9   (mode: build ×7, listening ×1, translate ×1)
particle-cloze ×2   ← recognition beats: the NEW WORD is the ANSWER
listening-comp ×2   ← recognition beats, reusing this lesson's own sentences
dialogue            ← 2-line closer
challenge           ← ≥3 grammar points in an unseen combination
reviewPool: [10 prior-module nouns]
```
The compiler then interleaves the middle, prepends image debuts, pads to 18–24
steps with filler, places the challenge in the `[N−8, N−3]` window, and closes on
the `match_pairs` grid. **Beat order is not step order** (inv 38) — never rely on
it for teach-first.

### 2.2 Template A — VOCAB-PACK RE-CEMENT (the default; 18 of 23 packs)

For packs whose words are nouns/verbs/adjectives with honest carriers.

| # | Beat | Notes |
|---|---|---|
| 1 | `rule` — a NEW `variant` of a grammar point the module already owns | Not a re-teach (D16). The variant states the point *through* the pack's theme: for F12, `koto-ga-aru` variant `distant-past` — "むかし + ことが ある is how you say you did it once, long ago." Pinned ahead of the interleaved middle. |
| 2–4 | `sentence`, `mode: build` ×3 | One per new imageable word. `build` is the ONLY intro-capable sentence mode (inv 37). Each carries a module-grammar `exercises:` tag. |
| 5 | `particle-cloze` with a NEW word as the `answer` | The **recognition beat** `recognitionExposure.test.ts` demands. Its factory credits only the answer, so this counts as recognition. Distractors must all be taught atoms (inv 40). |
| 6–8 | `sentence`, `mode: build` ×3 | Remaining new words; from ~m20 these must clear the §4g complexity floor (an adverbial, an の-modifier, or a clause boundary). |
| 9 | `listening-comp` reusing a sentence already authored in this lesson | Second recognition beat, **zero extra TTS**. |
| 10 | `sentence`, `mode: listening` | `listening_build`; sentence-level, never word-mora (inv 19, m5+). |
| 11 | `kanji` | 2–3 per module across all lessons; review-tier word only, never a just-introduced one (§4f). |
| 12 | `sentence`, `mode: translate` | At most ONE. `translate` is a late surface (inv 43). |
| 13 | `dialogue` (2–3 lines, 1 question) | Closer, never opener (inv 30). Graded on stated facts only (inv 22). Speakers from the persona canon (inv 21) and classified in `dialogueSpeakers.json` (inv 23). |
| 14 | `challenge` | ≥3 grammar points in a combination unseen in this module (inv 26). |
| — | `reviewPool:` 8–10 prior-module nouns | Spends into the closing `match_pairs` (≥6 pairs, word-only) + the filler rotation. Building a pool and not spending it is a defect (inv 18). |

Density: 14 authored beats → the compiler pads to 18–24. Practice-beat floor
(`density-short`) needs ≥6 of `sentence`/`particle-cloze`/`dialogue`/`sim`; this
has 11.

### 2.3 Template B — FUNCTION-WORD PACK (F3, F18, and the F11 adverbs)

Interjections, sentence-final particles and negative-polarity adverbs have no
honest image and no build-tile life. `word_image_mcq` is unavailable (inv 44 is
first-exposure-only and these are `imageable: false`), so the debut moves to
`listening-comp` + `speaking`, per guide §13.1.

| # | Beat | Notes |
|---|---|---|
| 1 | `rule` — the FUNCTION, quoted against a course sentence | Explanation budget: ~3 short lines, quoting the sentence (§2 of the guide). For F18: "じゃない, said fast, is じゃん — and it stops being a question and becomes a nudge: 「たかいじゃん」 = *that's expensive, right*." |
| 2 | `sentence`, `mode: build` | First graded exposure. For a sentence-final particle the particle is its **own tile** (inv 34). |
| 3 | `listening-comp` — "What does this mean?" | Plain prompt, no theatrics (inv 29). |
| 4 | `particle-cloze` — the new ender is the answer, alternatives are the module's OTHER enders | This is the deduction beat: よ / ね / じゃん / っけ are a closed contrast set the learner already half-owns. Legal because m29 introduces よ/ね, so a cloze over them is same-module (inv 5). |
| 5–6 | `sentence` ×2 | Contrast pairs — the same proposition with two different enders. |
| 7 | `listening-comp` — "Telling or asking?" / "Who is this said to?" | Single-chunk discrimination stays MCQ-legal (inv 28). |
| 8 | `sentence`, `mode: listening` | |
| 9 | **`sim`** | The payoff — an ender only exists as a TURN. See §2.5. |
| 10 | `dialogue` | |
| 11 | `challenge` | |

Constraint that bites here: **inv 46**. If any beat asks the learner to *pick a
register*, the options must all be words already met, and register scaffolding
only reaches a step through `kind: register` — which prose convention restricts
to m10 and m29. F3 and F18 are m10 and m29, so they are the two packs that may
legally use it. No other pack may.

### 2.4 Template C — PAIRED-CONTRAST PACK (F21, F16, F11)

For words that only mean anything against a partner already taught: あがる/あげる,
のこる/のこす, なくなる/なくす, ほとんど/ぜんぜん.

Identical to Template A, except beats 2–8 are authored as **minimal pairs** —
same sentence frame, one piece swapped, `exercises:` naming the module's own
contrast point. m33's `jidoushi-tadoushi` module is the exemplar for the shape.
Pairwise on introduction, N-way only on the module review (the
Carvalho & Goldstone ruling in `register-teaching.md`, which generalises).

⚠️ **F21 carries a live homograph hazard.** あがる ("go up") sits next to m31's
あげる ("give") and m33's あける/あく. Before shipping, check
`JA_PRIMARY_ATOM_BY_KANA` and dump every compiled tile in the course before and
after adding the row (the m22/m25 procedure) — that is what
`irAtomRegistration.test.ts`'s header means by "a human does the registration
with the tile diff in hand."

### 2.5 `dialogue_sim` below m34 — what it takes

**There is no module gate, no tier gate, and no prerequisite.** `compileModule`
is a pure function of one IR object; `ir.module` is used only to build ids and is
never compared to a number. The `sim` branch reads in full:

```ts
} else if (beat.kind === "sim") {
  const step = dialogueSim({ id: sid("sim"), scene: beat.scene,
    listenFirst: beat.listenFirst, turns: beat.turns.map(...) });
  if (beat.exercises?.length) step.exercisedGrammar = [...new Set(beat.exercises)];
  body.push(step);
}
```

`emit-tts-deck.mjs` walks every `ir/*.ir.json` unconditionally and routes sim NPC
lines by speaker, so an N5 sim gets audio automatically. **ES already ships
`dialogue_sim` from m1 and FR from m1** — the JA absence below m34 is purely
historical: the `kind: sim` emitter landed 2026-08-24, after m3–m33 were authored.

Four things a sub-m34 sim must satisfy:

1. **Not intro-capable — and harder than `dialogue`.** `dialogue_sim` is
   deliberately absent from even the base `INTRO_TYPES` set (`stepTaxonomy.ts`):
   *"a sim turn's NPC line can be masked (listenFirst) and its goal is English,
   so a word met mid-conversation was never taught."* Every multi-kana word in
   NPC lines, tiles, options and answers must already be taught — including the
   pack's own new words, which means **the sim goes late in the lesson, after
   their `build` debuts**. The compiler will not stop you; `moduleBarGuards`
   will, with `"<word>" debuts on non-intro step type dialogue_sim`.
2. **Register must match the module.** Below m20 the course is plain-majority
   (spine-draft4: "favor casual until roughly m16"; polite-production share
   ≤15% m7–m11, ≤20% m12–m15, ≤30% m16–m19, 50/50 from m20). A sim at m10 is a
   friend conversation; a sim at m24 may be either, cued.
3. **Speaker labels** must be in `dialogueSpeakers.json` or
   `dialogueSpeakerRegistry.test.ts` fails the build — the default is the female
   voice and that shipped silently wrong for m8–m10.
4. **No Track-A credit.** The compiler does not pass `exercisedAtomKanas` for a
   sim, so a compiled sim step carries no `exercisedAtoms`. It grades Track B
   grammar only. **Do not let the sim be a pack word's only "review" beat** —
   the atom-coverage floor (inv 14, ≥3 authored occurrences) will not count it.

**Recommendation:** put one sim in **every** insert lesson from m10 up, at
position ~9 of Template A/B. That is 21 new sims, roughly triples the course's
sim count (currently 11 across m34–m38), and directly answers "lets us use the
dialogue steps more." Below m10 the taught vocabulary is too thin for a
three-turn conversation to be anything but the words the learner just met, so F1
(m6) and F2 (m9) keep the plain `dialogue` closer.

### 2.6 Fully worked example — **F18, `ja-m29-neo-10` "The rest of the enders"**

Chosen because it is the highest-value single lesson in the plan (four CEJC
top-130 items — さ #32, じゃん #63, っけ #84, わ #129) and because it exercises
every hard constraint at once: function words with no image, register, a sim,
and a `kind: register` beat that is legal here and nowhere else.

**Home:** m29 "Register mastery + N5 capstone", 13 lessons today → 14. Position:
after `ja-m29-neo-9`, before `review-3`. Id `ja-m29-neo-10` (id ≠ position is
established precedent — see the m2 id landmine).

**Prior grammar it stands on:** `yo-emphasis`, `ne-agreement`, `janai-desu`
(all m29's own), `register-audience` (m7/m10), `chotto-softener` (m10),
`n-desu` (m27), `i-adj-present` (m12), `deshou-casual` (m25).

**New atoms (4):**

| kana | kind | gloss | imageable | why this word here |
|---|---|---|---|---|
| じゃん | particle | "…right?" (casual) | false | It **is** じゃない, contracted — m29 teaches `janai-desu` three lessons earlier. Deduction-first: the learner can reason to it. |
| っけ | particle | "…was it?" (recalling) | false | The recall-question ender. Pairs against か, owned since m7. |
| さ | particle | "…y'know" (filler) | false | The soft assertion ender. Pairs against よ. |
| わ | particle | "…" (soft emphasis) | false | **RECOGNITION ONLY** — gender/region-marked. Same posture as ぼく/おれ at m10 and だろう at m25. |

**Beat sequence** (14 authored beats → 20–22 compiled steps):

```yaml
- id: m29-neo-10
  role: teaching
  title: "「たかいじゃん」 — the enders you have not met yet"
  focus: "じゃん is じゃない said fast; っけ asks your own memory; さ softens
          an assertion — and わ you only need to recognise"
  introduces: [じゃん, っけ, さ, わ]
  beats:
```

| # | Beat | Content | Prior grammar re-used |
|---|---|---|---|
| 1 | `rule` · `janai-desu` variant `jan` | "「たかくないですか」 → 「たかくない？」 → 「たかいじゃん」. Same nudge, three registers deep. じゃん is not a new word: it is じゃない with the ない worn off." + `antiPattern: せんせい、たかいじゃん。` (why: friend-register ender to a teacher). Pinned before the interleaved middle — required, because a particle-substitution meaning is not inferable from one hearing (inv 24, も-class rule). | `janai-desu`, `register-audience` |
| 2 | `sentence` `mode: build` | 「この みせは たかいじゃん。」 / "That shop's expensive, right?" · tiles `["この","みせ","は","たかい","じゃん","です","ね"]` — じゃん is **its own tile** (inv 34); です and ね are real distractors, not filler (inv 35). | `kono-sono-ano-dono` (m17), `i-adj-present` (m12), `wa-topic` |
| 3 | `listening-comp` | audio 「この みせは たかいじゃん。」 · q "What does this mean?" · answer "That shop's expensive, right?" · distractors "That shop isn't expensive." / "Is that shop expensive?" / "That shop was expensive." — **wrong-polarity and wrong-sentence-type distractors**, the §13.7 shapes, not filler. | — |
| 4 | `rule` · `ka-question` variant `kke` | "か asks the world. っけ asks your own memory — 「なんじだっけ？」 is *what time was it again?*, and you are asking yourself as much as anybody." | `ka-question` (m7), `desu-past` (m11) |
| 5 | `sentence` `mode: build` | 「テストは あしたっけ？」 / "The test's tomorrow, isn't it?" | `ta-form`/`desu-past` (m11), noun predicate |
| 6 | `particle-cloze` | stem 「なんじ」 tail 「？」 · answer 「だっけ」 · options `["だっけ","だよ","だね"]` · en "What time was it again?" · explanation "だっけ digs into your own memory; だよ tells somebody; だね checks agreement." — **the recognition beat** (cloze credits only the answer) and the deduction beat in one. Legal: same-module contrast, inv 5. | `yo-emphasis`, `ne-agreement` |
| 7 | `rule` · `yo-emphasis` variant `sa` | "よ hands somebody news. さ just keeps the sentence warm — 「そうなんだよ」 insists; 「そうなんださ」… えー、そうなんだよ。" *(3 lines, quotes the course sentence, per the explanation budget.)* | `n-desu` (m27), `yo-emphasis` |
| 8 | `sentence` `mode: build` | 「きのうさ、ともだちと えいがを みたんだ。」 / "So yesterday I saw a film with a friend." — clears the §4g complexity floor (time adverbial + と-comitative + んだ). | `n-desu`, `ta-form`, `to-and`, `wo-object` |
| 9 | `register` (stage 2) | `audience: teacher` · `en: "Say that's expensive."` · `options: ["たかいじゃん","たかいですね","たかくないです","たかいね"]` · answer 「たかいですね」. **Stage 2 = picture + politeness meter, no cheat sheet.** The 4th option is the **opposite polarity** (たかくないです), never a 4th register. Every option is a word already met. Legal only because this is m29. | `register-audience`, `janai-desu`, `desu-copula` |
| 10 | `listening-comp` | audio 「きょうは あついわ。」 · q "Who is most likely saying this?" · answer "An older woman" · distractors "A schoolboy" / "A shop clerk to a customer" / "A teacher in class". **This is わ's entire treatment** — recognition, one beat, never a production target. | `i-adj-present` |
| 11 | `sentence` `mode: listening` | 「その えいがは おもしろかったっけ？」 — `listening_build`, sentence-level. | `i-adj-past` (m12), `kono-sono-ano-dono` |
| 12 | **`sim`** — "Coffee after class" | See below. | all four enders + `masenka` |
| 13 | `dialogue` (closer, 3 lines, 1 question) | Mika/Tom: 「あの みせ、たかいじゃん。」 / 「そうだね。でも おいしいよ。」 / 「じゃあ いこうっけ… いこうか。」 — the self-correction is the joke and the teaching point. Q: "What do they decide?" | `yo-emphasis`, `ne-agreement`, `deshou-casual` |
| 14 | `challenge` `mode: build` | 「きのうさ、ともだちと いった みせ、たかかったじゃん。」 / "So that shop I went to with a friend yesterday — it was expensive, right?" · `combines: [sa-filler, jan, relative-clause(m15), i-adj-past]` — **four points in a shape unseen in m29** (inv 26). | |
| — | `reviewPool` | `[みせ, えいが, ともだち, テスト, コーヒー, じかん, がっこう, ばんごはん]` — all prior-module nouns; spends into the closing `match_pairs` and the filler rotation. | |

**The sim, in full:**

```yaml
- kind: sim
  scene: { emoji: "☕", title: "After class", setting: "Ken catches you on the way out." }
  exercises: [jan, kke, masenka, yo-emphasis]
  turns:
    - npc: { speaker: "Ken", ja: "つかれたじゃん。コーヒー のむ？", en: "You look wiped. Coffee?" }
      goal: "Agree — you are tired."
      reply: { mode: choice, options: ["うん、つかれた。", "ううん、げんきだよ。", "はい、そうです。"],
               answer: "うん、つかれた。", alsoCorrect: [] }
      replyGloss: "Yeah, I'm beat."
      explanation: "To Ken, plain うん is the register. はい、そうです is polite and would
                    land oddly with a friend; ううん declines the premise."
    - npc: { speaker: "Ken", ja: "あの きっさてん、やすかったっけ？", en: "That café was cheap, wasn't it?" }
      goal: "Tell him it was actually expensive."
      reply: { mode: build, tiles: ["たかかった", "じゃん", "やすかった", "よ", "ね"],
               answer: "たかかったじゃん。" }
      replyGloss: "No — it was expensive, remember?"
      explanation: "じゃん pushes back with something you both know. たかかったよ would be
                    telling him news; たかかったね would agree with him, and he is wrong."
    - npc: { speaker: "Ken", ja: "じゃあ、どこに いく？", en: "Where shall we go, then?" }
      goal: "Suggest the shop near the station."
      reply: { mode: build, tiles: ["えき", "の", "ちかくの", "みせ", "に", "いこう", "で"],
               answer: "えきの ちかくの みせに いこう。" }
      replyGloss: "Let's go to the shop near the station."
      explanation: "Going TO a place takes に; で would name where an action happens."
```

Note what the sim is doing pedagogically: turn 2's build is the **only** step in
the lesson where the learner must choose じゃん over よ and ね *on meaning*, not
on form — and it is choosable, because m29 taught よ/ね and the explanation
names the fact Ken is wrong. That is the deduction-first lens working.

**Prompts audit:** every prompt is plain (inv 29). No scenario prose. The only
register cue in the lesson is beat 9's drawn audience, and it is graded (inv 48
— though see §4.4: `registerCueGrading.test.ts` would not actually catch a
regression here).

---

## 3. The register layer — recommendation

**The colloquial band:** 俺 #83, お前 #233, やつ #90, あいつ #476, ばか #436,
まじ #254, めちゃ #220, やばい #195, でかい #426, 食う #280, なんか #207
(+ じゃん, handled at m29 as ordinary grammar).

### 3.1 Recommendation

**Split it three ways. Do not build a "how people actually talk" module.**

| Band | Words | Where | Posture |
|---|---|---|---|
| **A. Register-neutral, wrongly filed as slang** | すごい, うまい, おかしい, ひどい, でかい, なんか | F4 (m12), F17 (m28), and one filler slot | **Teach as ordinary vocabulary now.** すごい is CEJC #49 and appears in *every* register including polite speech. でかい and なんか are casual but not rude. They belong in the vocab packs, not in a register lesson. |
| **B. Intensifiers, register-cued** | めちゃ, まじ, やばい | m38 (12 lessons → 3 slots), as **one insert lesson** riding `chau` — the module that already teaches the course's flagship contraction | **Teach for production, with a graded register cue.** These are the words a learner actually hears and cannot decode. Teach them as a **degree ladder against words already owned**: とても → すごく → めちゃ, and まじで as だ's emphatic. Inv 46 is satisfied because the contrast set (とても, すごく, ほんとうに) is already taught. |
| **C. Pronouns and insults** | 俺, お前, やつ, あいつ, ばか, 食う | **m47** (spine n4-18, unbuilt) | **Recognition only. Do not pull forward.** |

### 3.2 Why band C stays at m47 — three hard reasons, not taste

1. **The spine already owns it.** m47's `why` reads: *"The course's register
   machinery (m7/m10/m29) has only ever run between plain and polite — a
   two-point scale. This module opens the BOTTOM of the scale and m49–m50 open
   the top, in the same tier, so the capstone can drill the full range as one
   object."* Building a colloquial family earlier means m47 has nothing left to
   do, which is the D16 duplicate-module failure in the other direction.
2. **The type system has no room below "plain."**
   `registerAudiences.ts` declares `export type PolitenessLevel = 1 | 2 | 3;`
   with exactly four audiences (friend 1, teacher 2, grandmother 3, clerk 3), and
   `registerCheatSheet` dedups one row per level. A four-rung cline — rough /
   plain / polite / very polite — is a **typed code change** across
   `registerAudiences.ts`, the `register` beat type in `moduleCompiler.ts`, and
   both register tests. That is real work, and it should be done once, at m47,
   where m49/m50 will also need it, not bolted on early.
3. **Overturn risk is Spencer's, not an author's.** spine-n4 D8 flags the
   recognition-only ruling for 〜な/〜ろ as *"the decision most likely to be
   overturned in either direction — Spencer may want it cut entirely, or may
   want production for the sports/coaching register."* おれ is currently
   recognition-capped at m10 by an explicit audit ruling and has **no
   `courseAtoms` row at all**; おまえ appears nowhere in the course. Moving
   either to production overturns a standing pattern (だろう at m25, ら抜き at
   m24, ぼく/おれ through N5). That is a product call.

### 3.3 Pros and cons of the alternative (a dedicated colloquial module)

**For:** it is the one thing a learner asks for out loud; the band is coherent;
it would use `dialogue_sim` more heavily than anything else in the course; it
would be genuinely fun.

**Against:** it duplicates m47 (D16); it needs the four-rung cline built anyway;
`kind: register` is by prose convention an m10-and-m29-only mechanism and a third
site contradicts *"the machinery should get rarer as the course goes on"*; it
concentrates all the highest-overturn-risk decisions into one deliverable, so a
single Spencer ruling could void the whole module; and **inv 46 means every
colloquial word must be taught in an ordinary beat before it can be contrasted**
— so a colloquial module would need a preceding vocab pack anyway. The band-B/C
split gets ~70% of the learner value at ~20% of the risk.

### 3.4 If band C is pulled forward anyway

Do it as **three lessons inside m47 authored early**, not as a new module, and
budget: 1 new `REGISTER_AUDIENCES` row + `PolitenessLevel` widened to `0|1|2|3` +
`registerCheatSheet` dedup updated + `registerScaffoldIsolation.test.ts`
stage/highWater assertions extended + `registerCueGrading.test.ts` extended
(today it only inspects prompts matching `/say politely/i` or `/say to a friend/i`
and decides politeness with a ですます regex — **俺/お前/まじ carry no ですます
marker, so inv 48 would pass vacuously for the entire family**).

---

## 4. Mechanical fixes

### 4.1 The 13 never-unlock atoms — retag

`courseAtoms.ts` lines ~986–1002. These are registered, high-frequency, and
unreachable: `m49`/`m50`/`thr-n4` are not real modules, so the module-fallback
unlock path in `lessonAtomIndex.ts` can never fire, and the frequency deck's
`fromModule === "future"` filter excludes them, so the drip cannot serve them
either. They are the worst state an atom can be in: graded-capable, never
unlockable.

| Atom | Today | Action |
|---|---|---|
| やっぱり | `thr-n4` | **→ `m25`** — teach in F13. It is `deshou`'s natural partner ("as I thought"). CEJC #65. |
| もちろん | `thr-n4` | **→ `m24`** — teach in the B067 pack-11 slot. It answers a `potential` question ("できる？" "もちろん"). |
| べつに | `thr-n4` | **→ `m29`** — teach in F18. It is a register move, not a word. |
| ぜったい | `thr-n4` | **→ `m25`** — with たしか/たぶん/きっと in F13. |
| けいご, ていねい, しつれい, ためぐち, せんぱい, こうはい, じょうし, どうりょう, しりあい | `m49` | **Leave tagged `m49`.** They are correctly allocated to an unbuilt module. |

But the `m49` nine are still in the broken state today. Two options:

- **(a) Preferred — make the sentinel honest.** Keep `m49`, and add a
  ratchet test asserting that every atom whose `fromModule` names an *unauthored*
  module is on an explicit, shrink-only allowlist. That converts silent
  unreachability into a visible, named debt (the `FROZEN_UNREGISTERED` pattern
  from `irAtomRegistration.test.ts`, applied to the other arrow).
- (b) Retag all nine to `future`. This makes them reachable via the frequency
  drip immediately — but it also **re-ranks `JA_FREQUENCY_ATOMS`** (see §4.3),
  and it lies about their allocation. Not recommended.

**Also:** there is no `m50` in the registry at all (the CourseAtomSource union
declares it; zero rows use it). And six atoms sit on `future` with no spine unit
claiming them — なんで, どうしたの, きになる, おさななじみ, なかま, したしい.
なんで (casual "why") is worth pulling into F15 (m27, `n-desu`/どうして); the
rest can stay on the drip.

### 4.2 Taught-but-unregistered — register these rows

An atom with no `courseAtoms` row is invisible to the tokenizer *and* to SRS.
`irAtomRegistration.test.ts` is "the reverse arrow" that catches this for new
modules; these predate it or slipped through as `kind: particle`.

| Surface | Taught at | Action |
|---|---|---|
| もし | m37 (conditional adverb, used in sentences) | Register `kind: vocab`, `pos: adverb`, `fromModule: "m37"`, `blocked: true`. Add the two deepen beats (§1.3) so it has ≥3 authored occurrences (inv 14). |
| うそ | m1 (`m1-sa.ts` kana build word) | Register `fromModule: "m1"`, `introducedByLessonId: "ja-m10-neo-10"` (F3) — the **two-stage attribution** pattern from guide §13.8: kana shape at m1, vocab unit at m10. |
| だけ | m35 (`dake` grammar point, IR `newAtom`) | Register `kind: particle`, `fromModule: "m35"`. |
| って | m18 (`to-quotation`) | Register `kind: particle`, `fromModule: "m18"`. ⚠️ **Bound-morpheme hazard (inv 41)** — check what else in the corpus contains `って` (every て-form + っ collision) before shipping. Likely safest as `kind: particle` with a homograph ruling in `JA_PRIMARY_ATOM_BY_KANA`. |
| ながら | m36 (`nagara`) | Register `kind: particle`, `fromModule: "m36"`. |
| ちゃう | m38 (`chau`) | Currently handled orthographically as single-token surfaces (たべちゃった). Registering a bare ちゃう is the same hazard class as m30's とく (which is why とく ships as 「かっとく」「しとく」 whole atoms). **Recommend: leave unregistered**, and note the reason in the IR. |
| おれ | m10 (recognition only) | Register `fromModule: "m10"`, `blocked: true`, with a note that production is m47's call. Without a row it cannot even be a flashcard. |

### 4.3 Does the frequency drip need changing? — Yes, three things

**(a) The re-ranking ripple is real and untested.** `JA_FREQUENCY_ATOMS` is
derived, and the rank is *position in the filtered array*:

```ts
JA_COURSE_ATOMS.filter(a => a.fromModule === "future" && ...).map((atom, i) => {
  const frequencyRank = i + 1;
  ... unlockModule: frequencyRankToModule(frequencyRank, { lastModule: JA_FREQ_LAST_MODULE })
})
```

Every atom this plan re-homes off `future` **shifts the rank of every atom after
it**, and `frequencyRankToModule` buckets 20 per module — so roughly one in
twenty of the remaining 319 words changes its unlock module per re-home. This
plan re-homes ~10 (こんな, さがす-class strays, なんで, plus whatever the B067
packs claim). That is a learner-visible reshuffle of an opt-in deck, with no test
guarding it. This is `[[atom-registration-ripples-forward]]` applied to the
frequency deck rather than to tokenization.

**Fix:** stop deriving rank from array position. Give `future` atoms an explicit
`freqRank?: number` field, seeded once from the current derived order, and have
`frequencyAtoms.ts` read it. Rank then becomes stable under re-homing. ~30 lines
+ a one-off codemod. **Do this before wave 1**, or the wave silently churns the
deck.

**(b) `JA_FREQ_LAST_MODULE = 30` is eight modules stale.** The live course is
m38 and the N4 spine runs to m51. Overflow currently piles at m30, so a learner
at m38 sees nothing new. Bump to 38 now and wire it to the live module count.

**(c) The drip cannot close a registry gap, and should stop pretending to.** The
`frequencyAtoms.ts` header is honest about the proxy ("we have no corpus counts
for our own backlog words") but the effect is that the drip's rank ordering has
nothing to do with CEJC. Once this wave lands, the ~110 gap words become
*authored* atoms and leave the drip entirely — which is correct. The drip's
remaining job is the ~300 genuine backlog words, and for those the honest
improvement is to seed `freqRank` from `docs/data/ja-top500-cejc.json` +
`ja-neo-vocab.json`'s `priority` field where a word is in either list. Optional,
but it makes (a)'s fix carry real information instead of registry order.

### 4.4 Test/gate additions this wave should ship with

- **`registerCueGrading.test.ts` is keyed on two English strings.** It only
  inspects prompts matching `/say politely/i` or `/say to a friend/i`. Any new
  register cue phrased differently is unguarded. Extend it, or reuse the exact
  strings.
- **`taughtVocab.ts`'s `IR_BY_MODULE` stops at m31.** Extend to m38 (and to any
  insert lesson's module) or the gate silently falls back to the stale
  `fromModule` path.
- **Recompile the seven modules with stale `priorVocab`** (m17, m18, m20, m21,
  m24, m27, m28) — wave 0, one command each, no content change.

---

## 5. Course-wide sentence re-authoring — assessment

**Short answer: not needed, and it would be the wrong tool. Do a bounded
carrier-rotation pass instead, and only where the instrument says so.**

### 5.1 The evidence

`node scripts/exposure-audit.mjs` (run 2026-08-26, exit 0) over 40 TS files +
33 IR modules, 18,401 surfaces:

```
UNDER-exposed (CEJC top-150, <4 occurrences):
  #100  とる  ×1
OVER-exposed:
  ください ×368 (16.7× the median carrier)   ともだち ×403 (15.2× its CEJC share)
  みせ     ×318 (14.2×)                      あした   ×330 (13.6×)
  かばん   ×297 (13.5×)   … and 106 more above the bar
```

**Zero CRITICAL rows.** The taught set is well drilled. This is exactly what the
2026-07-29 audit concluded and it has not changed: *"the frequency problem is
which words are taught at all"*, and this script is blind to that by
construction ("taught + counted").

So a course-wide re-author would spend its whole budget re-arranging words the
learner already knows.

### 5.2 What IS worth doing, and what it costs

The over-exposure list is a real defect of a different kind — inv 27's
carrier-rotation flag: *">25 occurrences outside a word's home module flags
carrier rotation."* ともだち ×403 and かばん ×297 are the course reaching for the
same two nouns whenever it needs a subject.

**Bounded proposal — "carrier swap", ~1 wave, no new lessons:**

For the ~15 worst over-exposed carriers, swap **the subject noun only** in
sentences that are *outside the carrier's home module* and are not
comprehension-question stems. Each swap replaces a top-15 over-exposed noun with
a pack word from §1.3 that needs its second or third occurrence (inv 14's ≥3
floor). This is a targeted sed-shaped edit over `ir/*.ir.yaml` + recompile.

**Honest cost, and why it is not cheap:**

- **Every swapped sentence is a new TTS string.** `getTtsUrl` derives
  `sha256("ja:<text>")[:16]`; changing one noun changes the hash. A 300-sentence
  swap is ~300 new Nanami clips + their punctuation twins and sentence splits —
  call it **500–700 clips**, i.e. comparable to the entire insert-lesson wave.
- **`module-gate` stage 2 is whole-course scoped.** It diffs the *entire*
  9,120-card deck against the manifest, so one uncovered swapped sentence fails
  the gate for *every* module. There is no partial landing.
- Comprehension distractors, `explanation` text and `reviewPool` entries
  referencing the swapped noun must move with it, or the dialogue-fact guard
  (inv 22) and the gloss diagnostics fire.

**Verdict:** the insert-lesson approach covers the frequency gap on its own. Do
the carrier swap **as a separate, later wave**, scoped to ~15 nouns, and only
after the packs have landed — because the packs themselves introduce ~110 new
carriers, which mechanically dilutes the over-exposure ratios and may take a
third of the list under the bar for free. Measure again before spending.

---

## 6. New modules — needed?

**No, with one conditional.**

**Not needed for capacity.** 23 insert lessons against ~60 free slots in m6–m38,
and the m11 precedent shows the 15-ceiling is overridable with an IR note when
Spencer approves the wave.

**Not needed for coherence.** Every cluster in §1.3 has a module whose *own*
grammar is the natural machine for it — that is the assignment criterion, and it
held for every cluster without forcing. The one cluster with no natural N5/N4
home is the colloquial band, and it already has a designated module (m47).

**Actively harmful to add one.** spine-n4 D16 forbids duplicate modules, m39–m51
are fully specified (not merely reserved) with `teaches[]`/`vocab{}`/`spiralWith`
blocks ready to port into `spinePlan-n4.ts`, and inserting an unplanned m39 would
renumber a specified tier. It would also fight the "review lessons drill THIS
MODULE ONLY" rule (inv 25) — a frequency module drilling words from twenty
different grammatical contexts has no module-scoped review to author.

**The conditional:** if Spencer overturns spine-n4 D8 and wants the colloquial
band as *production* now rather than at m47, the right shape is still not a new
module — it is **authoring m47 early and out of order** (it has no hard
dependency on m39–m46 beyond て-form and plain/polite, both owned since m8/m7),
plus the `PolitenessLevel` widening in §3.4. That is a scheduling decision, not
a structural one.

---

## 7. Effort, sequencing, and what bites

### 7.1 Waves

| Wave | Content | Why first | Est. |
|---|---|---|---|
| **0 · Plumbing** | Recompile m17/m18/m20/m21/m24/m27/m28 IR (stale `priorVocab`); extend `taughtVocab.IR_BY_MODULE` to m38; add explicit `freqRank` to `future` atoms (§4.3a); bump `JA_FREQ_LAST_MODULE` 30→38; add the unauthored-module-allowlist ratchet (§4.1a); register the 6 taught-but-unregistered rows (§4.2) | Every later wave depends on the gate reading the right taught-prefix, and on re-homing not churning the frequency deck | **~1 day.** No new TTS. No new lessons. |
| **1 · Finish B067** | Packs 7–13 (m19 ×2, m17, m8*, m22, m24, m13/m14) | Words already have registry rows **and TTS**; ratchets go down immediately; de-risks the machinery on words that cannot ripple | **~4–6 days.** ~7 lessons, **near-zero new TTS**. *m8 is at 15 — needs an override note or a re-home. |
| **2 · The high-value five** | F18 (m29 enders), F5 (m17 こんな-family), F4 (m12 reactions), F3 (m10 reaction sounds), F8 (m20 degree adverbs) | 5 lessons buy ~27 CEJC words including 8 in the top-100. F18 alone is four top-130 items. Also the first sub-m34 sims — walk them before scaling. | **~5 days** + a Spencer walk. ~150–200 new clips. |
| **3 · The bulk** | F1, F2, F6, F7, F9, F10, F11, F12, F13, F14 | Ten packs, ~55 words | **~8–10 days.** ~300 clips. |
| **4 · N4-side** | F15, F16, F17, F19, F20, F21, F22, F23 + the m38 band-B intensifier lesson | Eight packs + one register lesson, ~40 words | **~8–10 days.** ~280 clips. |
| **5 · Deepen beats** | てる (m14), もし/ばあい (m37), しまう/過ぎる (m38/m27) | Cheap, D16-compliant, no new lessons | **~1 day.** ~20 clips. |
| **6 · Optional** | Carrier-swap pass (§5.2); `freqRank` seeded from CEJC | Only after measuring post-wave over-exposure | **TBD — measure first.** |

**Total: ~28–33 working days, 31 new lessons (7 B067 + 23 frequency + 1 register),
~750–800 new TTS clips.**

### 7.2 TTS volume — the honest number

The `ja` manifest holds **13,570 hashes + 66 overrides**; the main deck is
**9,120 cards**; `ja-keita` carries 917 dialogue overrides. Empirically that is
~30 clips per authored lesson once you count:

- every `sentence.ja`, `listening-comp.audio`, `dialogue.lines[].ja`,
  `sim.turns[].npc.ja` **and** `sim.turns[].reply.answer`;
- every `particle-cloze` assembled as `stem + answer + tail`;
- every `newAtoms[].kana`;
- **plus the post-processing expansion**: each multi-sentence line is split into
  per-sentence clips *and* keeps a whole-line fallback, and each string emits
  both a `clean()`-spaced form and a comma-deleted `bare` form.

So **~25–35 clips per new lesson**, ~750–800 for the wave. Each needs the
`lingo-data` round-trip: `node scripts/emit-tts-deck.mjs` → `cd ../lingo-data &&
python -m pipeline.tts.generate` (plus `--lang ja-keita` for male dialogue lines),
then stage mp3s in `tts-publish/` and ship the manifest **with** the objects.

**Four emitter traps that will produce silent mutes:**

1. **Only double-quoted YAML scalars match the regex battery.** A block scalar
   (`ja: |`), a single-quoted string, or a bare kana scalar is invisible. Authoring
   style is a silent TTS determinant.
2. **`kind: register` is in neither structured list.** The `.ir.json` walk has no
   `register` branch, and `options: [...]` is matched by nothing (`distractors:`
   has a handler; `options:` does not). **F18 beat 9 and F3's register beats will
   ship mute unless every option also appears as some other beat's `answer`/`ja`.**
   Concretely: author 「たかいですね」「たかくないです」「たかいね」 as sentence
   beats elsewhere in the lesson, or they have no audio.
3. **`module-gate` stage 2 checks only the main `ja` deck.** Keita/nanami dialogue
   decks are emitted but never coverage-checked — a male sim/dialogue line can be
   clipless and the gate stays green. Verify `ja-keita` by hand.
4. **Stage 2 is whole-course scoped**, so any module's uncovered sentence fails
   the gate for every module. Batch the TTS generate per wave, not per lesson.

### 7.3 Gates and ratchets — what flips

Run `npm run module-gate -- mN` per touched module, then the full suite. Expect:

| Gate | Effect | Action |
|---|---|---|
| `irAtomRegistration.test.ts` | **Fails by design** for every new lemma `newAtom` with no `courseAtoms` row. It deliberately does not auto-register. | Register by hand, **with the tile diff in hand** — dump every compiled tile in the course before and after adding rows and confirm the diff is empty (the m22/m25 procedure). This is the `[[atom-registration-ripples-forward]]` mitigation and it is not optional. |
| `moduleConformance.test.ts` | intro-before-review, no `info` steps, ends-gradeable | Template A/B/C satisfy all three by construction. |
| `moduleBarGuards` (`registerModuleBarGuards`) | vocab provenance, image-first, persona canon, sentence-repeat ≤3, reply-MCQ ban, `requireCapstone` | The one that will actually fire: **a pack word debuting inside the sim or the dialogue**. Order the beats so every new word has a `build` debut first (inv 37/38). |
| `atomExposureAudit.test.ts` | Ratchets `MAX_NEVER_GRADED = 183`, `MAX_NEVER_TOUCHED = 140`, `MAX_GRADED_BUT_NEVER_WRITES = 53` | These must go **DOWN** with every pack. Lower them in the same commit; a pack that doesn't move them taught nothing. |
| `recognitionExposure.test.ts` | Every `imageable: false` introduced word needs ≥1 recognition beat course-wide | This is why Templates A/B pin a `particle-cloze`-as-answer and a `listening-comp` per pack. Most §1.3 words are abstractions with no honest emoji, so **this gate binds on nearly every pack**. |
| `fromModuleDrift.test.ts` | Every `introduces:` kana must resolve to an atom whose `fromModule` is that module or an earlier introduction site | Set `fromModule` to the **teaching** module; leave `introducedByLessonId` **unset** (B067 trap 3 — setting it is how 234 dangling attributions happened, and a static entry suppresses the module-fallback unlock path). |
| `transformRulesets.test.ts` (inv 49) | A formation point ships with a rule table + transform card or it does not ship | None of these packs introduces a formation point. Safe. |
| `contentSafety.test.ts` (inv 50) | "Nobody likes a PERSON" | F10 (きもち/だいじ) and F9 (family) are the exposure. Screen every gloss. |
| `particleClozePlacement.test.ts` (inv 5) | True particle clozes only in the introducing module | F18's beat 6 is same-module (m29 owns よ/ね). **F11's negative-polarity adverbs must not be clozed against particles from earlier modules.** |
| `dialogueSpeakerRegistry.test.ts` (inv 23) | Every speaker label classified | Reuse Tom/Mika/Ken/Tanaka. No new speakers. |
| `kanaWordIntroOrder.test.ts` | kana-shape order | Only bites m1–m5; this wave touches none. |
| **Later modules' ratchets** | New atoms re-attribute tokens; a word registered for m12 can flip a token boundary in m26's sentences | **This is the wave's single biggest risk.** Mitigation: tile-diff per registration (above), and run the FULL suite (`npx vitest run`, not a scoped filter) before every push — six straight red CI runs came from scoped-only validation. `MODULE_GATE_FAST=1` skips it; never use it before pushing. |

### 7.4 Conjugation-table prerequisites (a real, separate cost line)

`ADJ_ENTRIES` holds 41 adjectives; `VERB_ENTRIES` holds 50 verbs. Words outside
them are invisible to the real-form lexicon the provenance guard reads — which is
**exactly why m12 cut すごい/こわい in the first place**:

> *"すごい/こわい are cut from the spine's high-frequency set: neither is in
> `ADJ_ENTRIES`, so their inflections are invisible to the real-form lexicon the
> provenance guard reads… adding the other two is a conjugation-table change,
> not an authoring one."* — `m12.ir.yaml`

**New `ADJ_ENTRIES` rows (7):** すごい, うまい, おかしい, ひどい, えらい, でかい
(band A) + na-adj めんどう. **New `VERB_ENTRIES` rows (~14):** かんがえる,
しゃべる, まわる, おこる, なくなる, いきる, あがる, のこる, すてる, にる,
かんじる, やく, はらう, うける.

Each row must be derived from the tables' own paradigm, never hand-written
(inv 49's discipline generalises). Budget **~1 day**, and schedule it in wave 0 —
F4 (m12) and F21 (m33) cannot compile-clean without it.

---

## 8. What I would ship first, if only one thing shipped

**Wave 0 + F18 (`ja-m29-neo-10`).**

Wave 0 because the frequency-deck re-ranking (§4.3a) is a live, untested,
learner-visible ripple that every subsequent wave triggers, and because seven
modules' gate inputs are currently ~75 words wrong.

F18 because it buys four CEJC top-130 items in one lesson, it is the lesson
Spencer will most immediately recognise as "how people actually talk," it is the
proof-of-concept for `dialogue_sim` below m34, and it is small enough to walk end
to end before 30 more lessons are built on its shape.

---

*Design only. No repo file was modified in producing this plan.*
