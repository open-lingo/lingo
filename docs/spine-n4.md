# JLPT N4 curriculum spine — m30–m51

**Version:** n4-draft-1 (2026-07-27) · **Status:** LIVE (authoring source of truth for the N4 tier)
**Predecessor:** `src/features/lesson/dev/spinePlan.ts` (N5, draft-4) — m3–m29, ending at
s25 / m29 "Register mastery + N5 capstone". **N4 therefore starts at m30.**

Spencer delegated the open calls for this tier ("if you have questions on what we should do,
decide for me, document your decisions"). Every decision is made and recorded in §5.

**Unit shape.** Each unit below is a `SpineUnit` literal in the same shape as the N5 spine
(`id`, `title`, `emoji`, `teaches[]`, `why`, `parity[]`, `salvage`, `wave`, `vocab{count,
must, prefer, sidequest}`, `spiralWith`, optional `milestone`/`risks`). They are written as
`ts` blocks so they port into `spinePlan-n4.ts` verbatim when the tier is wired up.

**Parity-ref honesty note.** This session had no web-search budget. `Cure Dolly` refs are
VERIFIED against the transcript filenames in `research/cure-dolly/` (lesson numbers are real).
`Genki` chapter numbers are from memory of the Genki II contents (L13–L23) and carry a `✔?`
in the note where they are load-bearing but unverified — verify before they are quoted at
learners. `Tae Kim` refs cite SECTION TITLES, not numbers, because the N4-range numbering is
not something this session can verify; a title is checkable, an invented `§5.3` is not.

---

## §0 Module map (for `docs/RUN-PLAN-n4.md`)

| m | unit | title |
|---|---|---|
| 30 | n4-01 | て + helper I: 〜てみる / 〜ておく |
| 31 | n4-02 | Give & receive I: あげる・くれる・もらう (things) |
| 32 | n4-03 | Conditionals I: たら (と as the contrast) |
| 33 | n4-04 | Transitivity I: 自動詞/他動詞 — が vs を |
| 34 | n4-05 | Volitional: よう/おう + とおもう, ことにする |
| 35 | n4-06 | Give & receive II: 〜てくれる + asking favors |
| 36 | n4-07 | Looks like: 〜そう(appearance), 〜がる, 〜やすい/にくい, 〜ながら |
| 37 | n4-08 | Conditionals II: ば + なら |
| 38 | n4-09 | て + helper II: 〜てしまう/ちゃう + 〜ていく/〜てくる |
| 39 | n4-10 | Concession & reasons: 〜のに, 〜ても/〜でも, 〜し |
| 40 | n4-11 | Passive I: direct passive られる |
| 41 | n4-12 | Transitivity II: 〜てある + the pair families |
| 42 | n4-13 | Hearsay: 〜そうだ, 〜って, 〜らしい |
| 43 | n4-14 | How sure are you? かもしれない, はず, でしょう-deepen |
| 44 | n4-15 | ようだ / みたい / のように・のような |
| 45 | n4-16 | Causative させる |
| 46 | n4-17 | Timing & aspect: 〜間に, 〜うちに, 〜ところだ, 〜たばかり |
| 47 | n4-18 | Telling people what to do: 〜てほしい, 〜なさい, 命令形/禁止形 |
| 48 | n4-19 | Purpose & method: 〜ために, 〜ように(なる/する), 〜かた |
| 49 | n4-20 | Keigo I — 尊敬語: service Japanese in the wild |
| 50 | n4-21 | Keigo II — 謙譲語 + 〜させていただく (+ causative-passive) |
| 51 | n4-22 | N4 capstone |

Every module obeys inv 25: **12–15 lessons = 8–11 teaching + 3 review + 1 challenge**,
challenge lesson last, reviews at the module's first/middle/last thirds.

---

## §1 What N4 actually adds over N5

### §1.1 Already spent inside N5 — do NOT re-teach

The N5 rewrite is dict-form-first and pulled a large amount of nominal-N4 grammar forward.
Re-teaching any of it is a defect, not redundancy; where a tier-boundary spiral is wanted,
the N4 module carries a **deepen beat** and a `spiralWith` back-reference.

| Nominally N4 | Owned by | N4's job |
|---|---|---|
| potential form (full system, incl. ら抜き recognition) | m24 (s21) | reused as the *known shape* that makes passive teachable (m40) |
| relative / noun-modifying clauses, こと・の nominalizers, とき | m15 (s11) | spent everywhere; 間/うち/ところ ride it at m46 |
| 〜たことがある, 〜つもり | m23 (s22) | ことにする/ことになる extend it at m34 |
| から / ので / けど | m16 (s13) | のに is introduced as ので's minimal pair at m39 |
| 〜たり…たりする | m21 (s19) | — |
| ている (progressive vs resultative), てから, てもいい, てはいけない | m14 (n06b) | resultative gets its transitivity home at m33/m41 |
| でしょう / だろう / かな | m25 (n13) | deepened into the certainty ladder at m43 |
| んだ/んです, 〜すぎる, なる | m27 (s23) / m12 (s09) | すぎる deepens at m36 |
| なきゃ / なければならない, 〜たほうがいい | m28 (s24) | the frozen なければ is *unfrozen* into real ば at m37 |
| ましょう / ませんか / 〜ない？ | m24 (s21) | plain volitional is taught as its BASE at m34 |
| plain⇄polite register, casual enders, aizuchi, pronouns | m7 / m10 / m29 | keigo adds a second, orthogonal axis at m49–m50 |
| とおもう, という | m18 (n08) | hearsay そうだ / って / と言っていた join the family at m42 |
| comparisons のほうが / いちばん | m20 / m26 | ほど joins at m37 |

### §1.2 Corrections to the brief's inventory

Accuracy over agreement — five items in the request are misfiled:

1. **〜ので is not an N4 addition.** It ships at m16 with から and けど. What N4 owes is
   **〜のに**, and its whole pedagogic value is that it is ので's minimal pair — which is only
   available *because* ので is old. (〜し is correctly N4 and is unowned; it rides m39.)
2. **かもしれない is not "conditional-adjacent."** It is epistemic modality and belongs with
   だろう/でしょう (m25) and はず — one dimension, four rungs. Filing it near たら/ば invites
   exactly the cross-association the spine is built to avoid. It is at m43, not m32/m37.
3. **〜ば〜ほど is N3-leaning**, not core N4 (JLPT lists split on it; the N4-side lists that
   include it treat it as a fixed frame). Decision: kept as a **recognition rider** inside the
   ば module (m37), never a teaching beat of its own. ほど gets its atom there.
4. **〜はず is correctly N4**, but it is not conditional and not evidential — it is
   expectation-from-evidence, the top rung of the m43 ladder.
5. **〜そう × 2 is exactly right and is the single most important split in the tier.**
   Stem + そう (appearance, 降りそう) and plain clause + そうだ (hearsay, 降るそうだ) are
   different grammar with a shared surface. They are introduced **six modules apart** (m36 and
   m42) and meet exactly once, as a minimal-pair discrimination drill in the m51 capstone.

Genuinely N4, **missing from the brief**, and scheduled below:

- 〜ても / 〜でも / 疑問詞+でも・も (m39) — a major omission; concessive, not conditional.
- imperative 命令形 (行け) + prohibitive 〜な + 〜なさい (m47) — the bottom of the register scale.
- 〜てほしい (m47) — the other-person half of たい/ほしい, deliberately deferred out of m13.
- 〜がる / 〜たがる (m36) — closes the hole n05's binding authoring constraint left ("he wants"
  was BANNED in N5 because it requires たがっている; N4 owes the repair).
- 〜ずに / 〜ないで (m47), 〜やすい・にくい (m36), 〜かた(方) (m48).
- 〜ために / 〜ように / 〜ようになる / 〜ようにする (m48) — the "other よう".
- 〜ところだ, 〜たばかり, 〜間(に), 〜うちに, 〜まま, compound verbs はじめる/つづける/おわる (m46).
- ことにする / ことになる (m34).
- 〜ていく / 〜てくる (m38) — trajectory in space and time.
- 〜って / 〜と言っていた (m42).
- quantity & limit set: だけ, 〜しか〜ない, ばかり, ほど, ぐらい, ずつ, 〜め (drip, §4).

### §1.3 The genuine N4 inventory, by family

| Family | Items | Modules |
|---|---|---|
| て + helper verbs | てみる, ておく/とく, てしまう/ちゃう, ていく, てくる, てある | m30, m38, m41 |
| Giving & receiving | あげる・くれる・もらう × {noun, て-form, keigo tier} + favor ladder | m31, m35, m50 |
| Conditionals | たら, と, ば, なら (+ ば〜ほど recognition) | m32, m37 |
| Transitivity | 自動詞/他動詞 pairs, が/を diagnostic, ている-resultative, てある, families | m33, m41 |
| Voice | passive (direct + suffering-recognition), causative, causative-passive | m40, m45, m50 |
| Volition & decision | (よ)う, ようとおもう, ようとする, ことにする/ことになる | m34 |
| Evidential | そう(appearance), そうだ(hearsay), らしい, ようだ/みたい, のように | m36, m42, m44 |
| Epistemic | かもしれない, はず, でしょう-deepen, にちがいない(recognition) | m43 |
| Connectives | のに, ても/でも, し | m39 |
| Timing & aspect | ながら, 間(に), うちに, ところだ, たばかり, まま, はじめる/つづける/おわる | m36, m46 |
| Speech acts | てほしい, なさい, 命令形, 禁止形〜な, ずに/ないで | m47 |
| Purpose & method | ために, ように, ようになる/ようにする, かた, のに(purpose), までに | m48 |
| Manner suffixes | やすい/にくい, がる/たがる, すぎる(deepen) | m36 |
| Keigo | 尊敬語 (lexical + おVになる + 敬語られる), 謙譲語 (lexical + おVする), させていただく | m49, m50 |
| Quantity & limit | だけ, しか〜ない, ばかり, ほど, ぐらい, ずつ, 〜め | drip (§4) |

### §1.4 Scale — kanji and vocabulary

- **Kanji:** +~170 (cumulative ~300). At 21 content modules that is **~8 per module**, dripped
  (thread `thr-n4`, never a kanji module). N4 vocabulary is markedly more kanji-dense than N5,
  so the `kanji_reading` step ramps across the tier (§5 D11).
- **Vocabulary:** +~760 taught atoms (30–38 per module) + ~40 via the drip threads, for a
  **cumulative ~1,300–1,500** — which is the N4 target and, not coincidentally, the size of
  the ranked pool.
- **Pool status (verified 2026-07-27).** `docs/data/ja-neo-vocab.json` holds 1,505 entries:
  532 tagged `in-course`, **964 free** (771 with `currentModule: null` + 193 `future`).
  That covers the tier. `docs/data/ja-core6k-order.json` (3,000 ranked) is the backstop for
  the ~120 domain words the neo pool lacks (じゅんび #1202, つづける #1256, こわれる/こわす
  #1348/#1347, おとす #1374, ぬすむ #1356, ほめる #1943, かべ #1728, まもる #1471 …).
- **Words in NEITHER file — must be hand-added before m49/m50 author:** いらっしゃる,
  召し上がる, 伺う, 申す, 拝見する, お客さま, おっしゃる (in core6k at #2754 only). These are
  marked `†` in the `must` lists below.
- **Allocation caveat.** `currentModule` tags in the pool still reflect the OLD course for
  m11+, and the neo N5 allocation past m11 is not final. Every `must` list below is provisional
  until the owning N5 module ships; the pre-flight check is
  `node scripts/authoring-context.mjs m<N>`, which prints the real taught set (inv 16).

---

## §2 The spine

### m30 · n4-01 — て + helper I

```ts
{
  id: "n4-01",
  title: "て + helper I: 〜てみる / 〜ておく",
  emoji: "\u{1F9EA}",
  teaches: [
    "〜てみる 'do it and see' — the て-form (m8/m14) meets its first helper verb",
    "THE SCHEMA, which is the real content: て-form + a real verb whose meaning is bleached; the HELPER carries all the conjugation (食べてみる / 食べてみた / 食べてみない), the main verb never moves",
    "〜ておく preparation + leaving-as-is (よやくしておく / そのままにしておく); 〜とく contraction RECOGNITION only",
    "てみる's limits: it does not mean 'try to' (that is 〜ようとする, m34) — the classic learner error, taught as the antiPattern",
    "⟳ intro beat — てしまう/ていく/てくる deepen at n4-09; てある at n4-12",
  ],
  why: "N4 opens on ZERO new morphology. て has been owned since m8 and た since m11, so module one of a new tier is a confidence beat that simultaneously installs the SCHEMA every later module spends: giving/receiving's て-forms (m35), てある (m41), てしまう (m38), てほしい (m47), ていただく (m50). Front-loading the schema is what lets those modules teach one thing each instead of re-deriving 'te + verb' five times. Cure Dolly reaches てみる at L16 for the same reason (helpers are ordinary verbs, not grammar); we take the premise and move it earlier.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 16", note: "te-miru — 'try doing'" },
    { source: "Cure Dolly", ref: "lesson 21", note: "te-oku/te-aru — we take the ておく half only" },
    { source: "Genki", ref: "ch 13", note: "〜てみる ✔?" },
    { source: "Tae Kim", ref: "Trying something out with 〜てみる" },
  ],
  salvage: "New authoring. m8's て sound-change table is the rehash asset (thread rule: deepen beats open with a 60s rehash of the intro).",
  wave: 1,
  milestone: "N4 TIER OPENS",
  spiralWith: "n4-09",
  vocab: {
    count: 34,
    must: ["よやく", "しらべる", "きめる", "ならう", "つづける", "おくる"],
    prefer: ["じゅんび", "とりあえず", "さいしょ", "けっか", "こたえ", "しつもん", "せつめい", "れんしゅう"],
    sidequest: ["したみ", "こころみる"],
  },
}
```

### m31 · n4-02 — Give & receive I

```ts
{
  id: "n4-02",
  title: "Give & receive I: あげる・くれる・もらう (things)",
  emoji: "\u{1F381}",
  teaches: [
    "The three verbs as ORDINARY verbs moving objects — no て-forms in this module at all",
    "VIEWPOINT, which is the whole difficulty: くれる points at me/my side, あげる points away, もらう flips the subject to the receiver. The うち/そと axis the course has never needed until now",
    "Particles: に recipient (ともだちにあげる), から/に source for もらう — the one place a learner may choose either",
    "The hard ban: あげる cannot point at me (×わたしにあげる) — taught as the antiPattern",
    "くださる / いただく flagged as the honorific tier — RECOGNITION only, production at n4-21",
    "⟳ intro beat — the て-forms are n4-06, five modules out",
  ],
  why: "CEJC #98 もらう / #114 くれる / #171 あげる — top-120 spoken words the N5 audit already seeded receptively (s26 note), so the words are half-known and only the grammar is new. Grammar lands second in the tier because VIEWPOINT is the expensive part and deserves a module with no て-morphology competing for attention. This is the first cut of the 3-verbs × 2-directions × register problem: split on the DIRECTION axis first (here), the SCHEMA axis second (m35), the REGISTER axis last (m50) — never more than one axis per module.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 11", note: "compound sentences, kureru/ageru" },
    { source: "Cure Dolly", ref: "japanese-point-of-view-deconfused もらう・てもらう", note: "viewpoint framing" },
    { source: "Genki", ref: "ch 14", note: "あげる/くれる/もらう ✔?" },
    { source: "CEJC", ref: "#98 もらう, #114 くれる, #171 あげる" },
  ],
  salvage: "New authoring.",
  wave: 1,
  spiralWith: "n4-06",
  vocab: {
    count: 36,
    must: ["プレゼント", "おくる", "かす", "かりる", "おれい", "たんじょうび", "おかし"],
    prefer: ["おいわい", "てがみ", "はなたば", "きねん", "おみやげ", "しんせつ", "よろこぶ", "うれしい"],
    sidequest: ["おちゅうげん", "おせいぼ"],
  },
}
```

### m32 · n4-03 — Conditionals I

```ts
{
  id: "n4-03",
  title: "Conditionals I: たら (と as the contrast)",
  emoji: "\u{1F500}",
  teaches: [
    "たら = た-form + ら. ZERO new morphology (た since m11) — the tier's most useful conditional is also its cheapest",
    "たら covers both 'if' and 'when' — the ambiguity is a FEATURE and is taught as one",
    "と = automatic, invariable consequence: natural law, machines, directions (このボタンをおすと、ドアがあく)",
    "と's hard restriction, which IS the contrast lesson: the main clause cannot be a request, invitation, command or intention (×おすと、おしてください) — たら takes those",
    "〜たらどうですか / 〜たらいい suggestion riders",
    "ぐらい/ごろ get their atoms here (quantity drip; routines/time domain)",
    "⟳ intro beat — ば and なら are n4-08, five modules out; the 4-way contrast exists ONLY in the m51 capstone",
  ],
  why: "たら is the hub. Every other conditional in this tier is introduced against たら ALONE, pairwise — the same ruling the N5 spine made for register (RUN-PLAN standing decision 5: 'pairwise contrast on introduction, N-way only on review'). と ships here rather than later because it is たら's true minimal pair: same English gloss, one is deterministic, and its blocked main clauses give the pair a mechanical, drillable tell instead of a feel.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 30", note: "conditionals と — what textbooks don't tell you" },
    { source: "Cure Dolly", ref: "lesson 32", note: "たら/なら — なら withheld to n4-08" },
    { source: "Genki", ref: "ch 17", note: "たら ✔?" },
    { source: "Genki", ref: "ch 18", note: "と ✔?" },
  ],
  salvage: "New authoring. m17's directions dialogue and m18's weather sets are the natural carriers.",
  wave: 1,
  spiralWith: "n4-08",
  vocab: {
    count: 36,
    must: ["おす", "まわす", "しんごう", "こうさてん", "つく", "ふる"],
    prefer: ["ボタン", "きかい", "うごく", "とおる", "むこう", "ちかみち", "ぐらい", "ごろ", "はやく", "おそく"],
    sidequest: ["じどうドア", "かいさつ"],
  },
}
```

### m33 · n4-04 — Transitivity I

```ts
{
  id: "n4-04",
  title: "Transitivity I: 自動詞/他動詞 — が vs を",
  emoji: "\u{1F501}",
  teaches: [
    "The three facts (Cure Dolly's frame): every verb is one or the other; a 'pair' is TWO DIFFERENT VERBS, not a voice or a conjugation; the PARTICLE is the tell — ドアがあく / ドアをあける",
    "SIX pairs only, all concrete and demonstrable: あく/あける, つく/つける, きえる/けす, はじまる/はじめる, しまる/しめる, でる/だす",
    "自動詞 + ている = RESULTATIVE STATE (ドアがあいている) — m14's progressive-vs-resultative split finally gets the verb class that explains it",
    "The diagnostic drill is the assessment: given a verb, which particle? given a sentence, which verb?",
    "NOT here: 〜てある (n4-12), the morphological family table (n4-12), passive (n4-11). Pairs DRIP thereafter as domain vocab calls them (thread)",
  ],
  why: "The notorious wall, placed fourth because almost everything downstream is built on it: passive operates on a 他動詞 (m40), causative's を-vs-に split is a transitivity fact (m45), てある requires a 他動詞 and ている-resultative requires a 自動詞 (m41). It is introduced as a DIAGNOSTIC — 'which particle does this verb take?' — never as a 30-pair table, because the table IS the wall: it converts one rule into thirty memorizations. Six pairs is a module's honest carrying capacity; the remaining ~20 arrive one at a time with the domains that need them.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 15", note: "transitivity — the 3 facts that make it easy" },
    { source: "Genki", ref: "ch 18", note: "transitivity pairs ✔?" },
    { source: "Review", ref: "spine thr1 counter-drip principle", note: "same logic applied to pairs" },
  ],
  salvage: "New authoring. m14's ている unit is the rehash asset for the resultative beat.",
  wave: 1,
  spiralWith: "n4-12",
  risks: "The single highest-attrition module in the tier. If QA shows learners failing the diagnostic, the fix is FEWER pairs (four), not more explanation.",
  vocab: {
    count: 32,
    must: ["あく", "あける", "つく", "つける", "きえる", "けす", "はじまる", "はじめる", "しまる", "しめる", "でる", "だす"],
    prefer: ["でんき", "エアコン", "スイッチ", "かぎ", "きょうしつ", "かいぎ", "おと", "きゅうに"],
    sidequest: ["シャッター", "じどう"],
  },
}
```

### m34 · n4-05 — Volitional

```ts
{
  id: "n4-05",
  title: "Volitional: よう/おう + とおもう, ことにする",
  emoji: "\u{1F3AF}",
  teaches: [
    "Plain volitional by class: のもう / たべよう / しよう / こよう — presented as the BASE, with ましょう (m24) re-framed as the polite form derived FROM it (the course's thesis, applied to a form the learner already owns backwards)",
    "〜(よ)うとおもう intent — embeds in m18's とおもう with no new machinery",
    "〜(よ)うとする 'attempt' — RECOGNITION, plus the explicit contrast with てみる (m30), which learners collapse",
    "ことにする (I decide) vs ことになる (it gets decided) — the volition/no-volition pair, riding こと (m15) and なる (m12)",
    "Register pair for one speech act: casual 〜(よ)う？ / ませんか / ましょうか",
  ],
  why: "A payoff module by design, placed immediately after the transitivity wall as a breather: every piece attaches to something already owned (ましょう m24, とおもう m18, こと m15, つもり m23, なる m12), so the only new thing on screen is the volitional's own conjugation. It also has to precede n4-06, because the favor-request ladder there is only teachable by contrast with invitations (いっしょに行こう？ vs 手伝ってくれない？).",
  parity: [
    { source: "Cure Dolly", ref: "lesson 29", note: "ことにする / ことになる — the simple logic" },
    { source: "Genki", ref: "ch 15", note: "volitional + volitional + と思っている ✔?" },
    { source: "Tae Kim", ref: "Volitional form (let's)" },
  ],
  salvage: "New authoring; m24's ましょう/ませんか set is the rehash asset.",
  wave: 2,
  vocab: {
    count: 36,
    must: ["ゆめ", "よてい", "けっこん", "はたらく", "さがす", "やめる"],
    prefer: ["しょうらい", "もくひょう", "そつぎょう", "にゅうしゃ", "ひっこす", "ちょきん", "がんばる", "きぼう"],
    sidequest: ["しゅうしょくかつどう", "だんとりょく"],
  },
}
```

### m35 · n4-06 — Give & receive II

```ts
{
  id: "n4-06",
  title: "Give & receive II: 〜てあげる/てくれる/てもらう + asking favors",
  emoji: "\u{1F91D}",
  teaches: [
    "m30's schema × m31's verbs. NO new rule — one composition, drilled until it is reflex",
    "〜てくれる as the ordinary way to report a kindness (先生がおしえてくれた) — the highest-frequency member and the one English speakers under-produce",
    "〜てあげる's politeness trap: offering it upward sounds condescending (×先生に手伝ってあげます). Textbooks skip this; we teach it as the antiPattern",
    "〜てもらう = 'I got someone to…' — the viewpoint flip English has no verb for",
    "FAVOR REQUEST LADDER, register-graded, introduced PAIRWISE and only assembled N-way in the module's R3: 〜て / 〜てくれない？ / 〜てくれる？ / 〜てください (m8) / 〜てくれませんか / 〜てもらえますか",
    "だけ / 〜しか〜ない get their atoms here (limit drip: 'you're the only one who can help')",
    "⟳ deepen of n4-02 AND n4-01 — the module where both threads pay out at once",
  ],
  why: "The second axis of the give/receive split, four modules after the first (spiral spacing) and one module after the volitional so that requests can be contrasted with invitations instead of taught in a vacuum. This is also the tier's first real register payout: the course has owned plain⇄polite since m7, but a six-rung ladder for ONE speech act is the first time that machinery has had enough rungs to be interesting.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 11", note: "kureru/ageru + more te-form uses" },
    { source: "Cure Dolly", ref: "japanese-point-of-view-deconfused もらう・てもらう" },
    { source: "Genki", ref: "ch 16", note: "〜てあげる/てくれる/てもらう + 〜ていただけませんか ✔?" },
  ],
  salvage: "New authoring; m8's ください unit is the rehash asset for the ladder.",
  wave: 2,
  spiralWith: "n4-02",
  vocab: {
    count: 34,
    must: ["てつだい", "おねがい", "むかえ", "はこぶ", "なおす", "つれる"],
    prefer: ["やくにたつ", "たすかる", "こまる", "めいわく", "しんせつ", "たのみ", "だけ", "しか"],
    sidequest: ["おかげさま", "おそれいります"],
  },
}
```

### m36 · n4-07 — Looks like / attachment site

```ts
{
  id: "n4-07",
  title: "Looks like: 〜そう(appearance), 〜がる, 〜やすい/にくい, 〜ながら",
  emoji: "\u{1F440}",
  teaches: [
    "Stem / adj-stem + そう = 'looks like it will / looks tasty' (ふりそう, おいしそう, たかそう) — ATTACHES TO THE STEM, which is the only tell that separates it from hearsay",
    "The irregulars while the rule is fresh: いい→よさそう, ない→なさそう, negative 〜なさそう / 〜そうにない",
    "〜がる / 〜たがる — third-person desire (弟はいきたがっている). Closes the hole n05's binding constraint left: 'he wants' was BANNED in N5 because it needs たがる; this is the repair",
    "〜やすい / 〜にくい — stem + い-adjective, the same attachment site as たい (m13)",
    "〜ながら simultaneous action — also i-stem, so it belongs to this site, not to the timing module",
    "〜すぎる (m27) DEEPEN — same slot, harder spends (たべすぎる/しずかすぎる)",
    "NOT here: hearsay そうだ (n4-13, six modules out) — the separation is deliberate",
  ],
  why: "An ATTACHMENT-SITE module: everything on screen hangs off the i-stem / adjective-stem the learner has owned since m7, so the load is semantic rather than morphological — which is exactly the right shape for the module that has to carry five items. It also pays the tier's oldest debt (たがる) and gives すぎる its spiral beat.",
  parity: [
    { source: "Genki", ref: "ch 13", note: "〜そうです (looks like) ✔?" },
    { source: "Cure Dolly", ref: "lesson 24", note: "hearsay そうだ — cited for the contrast we deliberately do NOT teach here" },
    { source: "Cure Dolly", ref: "resolving-ambiguities-japanese ため-and-ながら" },
    { source: "Review", ref: "n05 authoring constraint", note: "たがる deferred out of N5 — repaid here" },
  ],
  salvage: "New authoring; m13's たい/ほしい unit is the rehash asset (same attachment site).",
  wave: 2,
  spiralWith: "n4-13",
  vocab: {
    count: 38,
    must: ["かなしい", "さびしい", "かるい", "おもい", "やわらかい", "かたい", "ふとる", "やせる"],
    prefer: ["こわい", "はずかしい", "つかれる", "ねむい", "あんぜん", "きけん", "じょうぶ", "べんり", "ふべん"],
    sidequest: ["きまずい", "めんどくさい"],
  },
}
```

### m37 · n4-08 — Conditionals II

```ts
{
  id: "n4-08",
  title: "Conditionals II: ば + なら",
  emoji: "\u{1F9E9}",
  teaches: [
    "ば off the e-stem — m7's stem grid pays out for the third time (いけば / たべれば / なければ / たかければ)",
    "UNFREEZING: the learner has already produced ば inside a frozen frame since m28 (なければならない / なきゃ). This module shows the frame was ば all along — the highest-value five minutes in the module",
    "ば's own restriction: an action-verb ば-clause blocks a request/command/invitation main clause (×たべれば、かってください). Its mechanical tell, exactly as と had one",
    "なら takes the TOPIC, not the timeline: 'if that's the case' (それなら / 日本にいくなら、きっぷをかったほうがいい) — the only conditional that can precede its own condition in time",
    "PAIRWISE, ALWAYS: ば vs たら, then なら vs たら. Never ば vs なら, never 4-way — that beat is the m51 capstone's alone",
    "〜ば〜ほど RECOGNITION rider (N3-leaning); ほど gets its atom here",
    "⟳ deepen of n4-03",
  ],
  why: "Five modules after conditionals I, deliberately non-adjacent. The four conditionals are mutually confusable in the same way は/が are, and the course already ruled on that class of problem: pairwise contrast on introduction, N-way only on review (RUN-PLAN standing decision 5). たら is the hub every newcomer is measured against, so a learner never holds more than two competing forms at once. The placement also exploits an accident of the N5 spine: m28 shipped a frozen ば, so this module gets to REVEAL a rule rather than add one.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 31", note: "the ば conditional — what it really means" },
    { source: "Cure Dolly", ref: "lesson 32", note: "たら/なら" },
    { source: "Genki", ref: "ch 22", note: "ば ✔?" },
    { source: "Genki", ref: "ch 13", note: "なら ✔?" },
  ],
  salvage: "New authoring; m28's なきゃ/なければならない set is the rehash asset.",
  wave: 2,
  spiralWith: "n4-03",
  vocab: {
    count: 34,
    must: ["ひつよう", "つごう", "まにあう", "おくれる", "れんしゅう", "ほど"],
    prefer: ["きそく", "ばあい", "じょうけん", "たしかめる", "ちょうど", "とにかく", "せっかく"],
    sidequest: ["きんし", "きょか"],
  },
}
```

### m38 · n4-09 — て + helper II

```ts
{
  id: "n4-09",
  title: "て + helper II: 〜てしまう/ちゃう + 〜ていく/〜てくる",
  emoji: "\u{1F30A}",
  teaches: [
    "〜てしまう — completion AND regret, contrasted ON THE SAME VERB (ぜんぶたべてしまった: proud or sorry, and how you tell)",
    "ちゃう / じゃう as PRODUCTION (not recognition): it is the majority casual form in the spoken corpora this course optimizes for, and the learner has been in plain form since m3",
    "〜ていく / 〜てくる — trajectory away/toward, in SPACE (もっていく/かってくる) and in TIME (ふえてきた / なっていく), which is the half textbooks under-teach",
    "くる's irregular て-chain gets its own beat (きて → もってきて)",
    "⟳ deepen of n4-01 — same schema, eight modules on, harder spends; opens with the mandatory 60s rehash",
  ],
  why: "The second helper beat, eight modules after the first, per the spiral spacing rule. It waits this long for a reason beyond spacing: てしまう's regret reading only exists over past events, and its natural spends are mistakes and losses — content the learner cannot narrate until た, なかった, から/ので and のに are all fluent. Placed immediately before passive so that 'something bad happened to me' has two grammars to reach for.",
  parity: [
    { source: "Cure Dolly", ref: "te-form-uses te-iru vs te-aru te-iku and te-kuru" },
    { source: "Genki", ref: "ch 18", note: "〜てしまう ✔?" },
    { source: "CEJC", ref: "spoken-corpus contraction frequency", note: "ちゃう as production, not recognition" },
  ],
  salvage: "New authoring; m30's contraction drills (してる) are the register precedent.",
  wave: 3,
  spiralWith: "n4-01",
  vocab: {
    count: 34,
    must: ["なくす", "こわれる", "こわす", "おとす", "ふえる", "へる", "なれる", "かわる"],
    prefer: ["まちがえる", "すぎる", "のこる", "たりる", "すすむ", "もどる", "しまう", "とちゅう"],
    sidequest: ["やらかす", "うっかり"],
  },
}
```

### m39 · n4-10 — Concession & reasons

```ts
{
  id: "n4-10",
  title: "Concession & reasons: 〜のに, 〜ても/〜でも, 〜し",
  emoji: "\u{1F643}",
  teaches: [
    "〜のに 'even though' — introduced as the MINIMAL PAIR of ので (m16): same shape, opposite job, and the の is the same nominalizer the learner has owned since m15",
    "のに's emotional colour (complaint, disappointment, reproach) — a register-adjacent nuance, cued explicitly on every production prompt, because a neutral のに does not exist",
    "〜ても concession — て (m8) + も (m3), both owned; the form is free and only the meaning is new",
    "〜でも on nouns; 疑問詞 + でも / も as the closed set it is (なんでも / だれでも / だれも〜ない)",
    "〜し listing reasons, with its 'and what's more' implicature (やすいし、おいしいし)",
    "⟳ deepen of m16's connective family",
  ],
  why: "The connective module N5 could not finish. m16 owned から/ので/けど; のに is ので's contrast partner and could only be introduced pairwise once ので was old — which is now. ても sits here rather than with the conditionals on purpose: it is semantically a CONCESSIVE, and adding a fifth '-if' form beside たら/と/ば/なら would manufacture exactly the N-way cross-association the conditional split exists to prevent.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 22", note: "ては / ても — topic-comment magic" },
    { source: "Genki", ref: "ch 22", note: "〜のに ✔?" },
    { source: "Genki", ref: "ch 23", note: "〜ても ✔?" },
    { source: "Genki", ref: "ch 13", note: "〜し ✔?" },
  ],
  salvage: "New authoring; m16's から/ので/けど unit is the rehash asset.",
  wave: 3,
  vocab: {
    count: 34,
    must: ["ねつ", "きたない", "ざんねん", "むり", "たいへん", "じゅうぶん"],
    prefer: ["いそがしい", "ひま", "しずか", "うるさい", "つまらない", "さいこう", "さいあく", "とくべつ"],
    sidequest: ["やむをえない", "しかたない"],
  },
}
```

### m40 · n4-11 — Passive I

```ts
{
  id: "n4-11",
  title: "Passive I: direct passive られる",
  emoji: "\u{1F61F}",
  teaches: [
    "Morphology by class: よまれる / たべられる / される / こられる — for ichidan verbs this is IDENTICAL to the potential form the course has owned since m24",
    "The homophony is the lesson, not the hazard: same shape, different FRAME. X が Y に V-られる. Particles disambiguate; context finishes the job",
    "Direct passive only: 先生にほめられた / さいふをぬすまれた (the possessed-object pattern, which is the everyday one)",
    "〜によって / 〜で for creation and cause (かかれた / つくられた) — RECOGNITION",
    "SUFFERING passive (あめにふられた) — RECOGNITION beat, production deferred to N3",
    "Forward flag: this same form has a THIRD job — honorific 尊敬語 (n4-20)",
    "⟳ deepen of m24's potential system",
  ],
  why: "After transitivity I, because passive is an operation on a 他動詞 and the が/を diagnostic is the prerequisite skill. Sixteen modules after potential, which is what makes the shared shape teachable rather than confusing: it is presented as a KNOWN form with a new particle frame — the one presentation that turns a collision into a saving. Teaching passive before potential (as most textbooks are forced to) throws that saving away.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 13", note: "passive conjugation debunked — 'not passive, not a conjugation'" },
    { source: "Cure Dolly", ref: "japanese-suffering-passive-finally-demystified" },
    { source: "Genki", ref: "ch 21", note: "passive ✔?" },
  ],
  salvage: "New authoring; m24's potential drills are the rehash asset.",
  wave: 3,
  spiralWith: "n4-16",
  vocab: {
    count: 36,
    must: ["ぬすむ", "しかる", "ほめる", "たのむ", "さそう", "よぶ"],
    prefer: ["けいさつ", "どろぼう", "はつめい", "けんきゅう", "ゆうめい", "たてる", "こわす", "きず"],
    sidequest: ["ひがい", "そうさ"],
  },
}
```

### m41 · n4-12 — Transitivity II

```ts
{
  id: "n4-12",
  title: "Transitivity II: 〜てある + the pair families",
  emoji: "\u{1F527}",
  teaches: [
    "〜てある: a 他動詞 with the を→が flip, describing a state someone LEFT ON PURPOSE (まどがあけてある)",
    "The minimal pair that is the whole module: まどがあいている (自動詞 + ている, m33) vs まどがあけてある (他動詞 + てある) — same English, different claim about intention",
    "〜ておく (m30, prep) vs 〜てある (the state that prep left behind) — the second half of the same story",
    "MORPHOLOGICAL FAMILIES as pattern-noticing over the six pairs already owned plus eight new: -aru/-eru, -ru/-su, -eru/-asu. Noticing, not a table to memorize",
    "⟳ deepen of n4-04 — eight modules on, per spiral spacing",
  ],
  why: "The transitivity deepen beat, and deliberately AFTER passive rather than before. てある and the passive both promote a non-agent into the が slot; once the passive frame is owned, ている / てある / られる can be taught as ONE coherent three-way contrast instead of three unrelated tricks learned months apart. This ordering is the reason the transitivity wall is survivable: the concept is introduced once cheaply (m33), then re-derived from a different direction when the learner has more machinery.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 21", note: "te-oku / te-aru — how to really understand them" },
    { source: "Cure Dolly", ref: "lesson 15", note: "transitivity — the rehash anchor" },
    { source: "Genki", ref: "ch 21", note: "〜てある ✔?" },
  ],
  salvage: "New authoring; m33's diagnostic drills are the rehash asset.",
  wave: 3,
  spiralWith: "n4-04",
  vocab: {
    count: 32,
    must: ["かべ", "はる", "かざる", "ならべる", "かたづける", "ならぶ"],
    prefer: ["じゅんび", "したく", "よてい", "メモ", "ポスター", "たな", "ひきだし", "つくえ"],
    sidequest: ["はいち", "せいとん"],
  },
}
```

### m42 · n4-13 — Hearsay

```ts
{
  id: "n4-13",
  title: "Hearsay: 〜そうだ, 〜って, 〜らしい",
  emoji: "\u{1F4FB}",
  teaches: [
    "Plain clause + そうだ 'I hear that…' — the attachment IS the tell (plain clause + そうだ vs STEM + そう, m36), drilled as a shape rule and never as a feel",
    "〜って casual quotative — m18's という finally gets its spoken skin (あした来るって)",
    "〜と言っていた reported speech WITH a source, contrasted with sourceless そうだ",
    "〜らしい 'apparently, by report' — introduced PAIRWISE against そうだ on source strength; never against みたい yet (n4-15)",
    "など rides here (listing what was reported)",
    "The そう-vs-そう minimal-pair drill is NOT in this module. It is the capstone's (m51)",
    "⟳ deepen of m18's quotation family",
  ],
  why: "Hearsay is a QUOTATION-family member, not an evidential orphan: it embeds a plain clause exactly like とおもう and という (m18), so it belongs beside them — and six modules away from the appearance そう it is confusable with. That distance is the entire point. Introducing ふりそう and ふるそうだ in one module manufactures a confusion the learner then spends years undoing; introducing them apart, with a single deliberate discrimination beat at the capstone, is the same medicine the register split used.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 24", note: "hearsay and guesses — そうだ / そうです" },
    { source: "Cure Dolly", ref: "lesson 25", note: "らしい made rational — rashii vs sou desu" },
    { source: "Cure Dolly", ref: "lesson 18", note: "って / という / とする" },
    { source: "Genki", ref: "ch 17", note: "〜そうです (hearsay) ✔?" },
  ],
  salvage: "New authoring; m18's とおもう/という unit and m25's weather domain are the assets.",
  wave: 4,
  spiralWith: "n4-07",
  vocab: {
    count: 34,
    must: ["じしん", "たいふう", "じこ", "ばんぐみ", "うわさ", "きじ"],
    prefer: ["ニュース", "しんぶん", "ほうそう", "きしゃ", "はっぴょう", "つたえる", "しらせる", "など"],
    sidequest: ["ひなん", "けいほう"],
  },
}
```

### m43 · n4-14 — Certainty ladder

```ts
{
  id: "n4-14",
  title: "How sure are you? かもしれない, はず, でしょう-deepen",
  emoji: "\u{1F3B2}",
  teaches: [
    "ONE dimension, four rungs, assembled as a ladder: かもしれない (possible) < でしょう/だろう (probable, m25 DEEPEN) < はず (expected, from evidence) < にちがいない (certain — RECOGNITION)",
    "はずだった (it was supposed to…) and はずがない (no way) — the two spends that make はず worth teaching",
    "かも as a casual sentence-ender (production; register-cued)",
    "Introductions are PAIRWISE (かもしれない vs でしょう, then はず vs でしょう); the four-rung ladder is a REVIEW object, not a teaching one",
    "⟳ deepen of m25's conjecture module",
  ],
  why: "Filed with でしょう/だろう, NOT with the conditionals — かもしれない is epistemic modality and its neighbours are probability expressions, not if-clauses (see §1.2). Placed one module after hearsay so the two questions a listener actually asks — 'how do you know?' (evidential) and 'how sure are you?' (epistemic) — sit adjacent and get explicitly distinguished, which is the confusion N4 learners actually report.",
  parity: [
    { source: "Genki", ref: "ch 14", note: "〜かもしれない ✔?" },
    { source: "Tae Kim", ref: "Things that should be a certain way (はず/べき)" },
    { source: "Review", ref: "n13 spine note", note: "だろう stays recognition + 何だろう self-talk; that ruling holds here" },
  ],
  salvage: "New authoring; m25's でしょう/たぶん set is the rehash asset.",
  wave: 4,
  spiralWith: "n4-15",
  vocab: {
    count: 32,
    must: ["やくそく", "たしか", "かならず", "ぜったい", "きっと", "もしかしたら"],
    prefer: ["よそう", "けっか", "せいこう", "しっぱい", "うたがう", "しんじる", "あんしん", "しんぱい"],
    sidequest: ["かくじつ", "みこみ"],
  },
}
```

### m44 · n4-15 — ようだ / みたい

```ts
{
  id: "n4-15",
  title: "ようだ / みたい / のように・のような",
  emoji: "\u{1F317}",
  teaches: [
    "ようだ — conjecture from DIRECT evidence I can point at (かぜをひいたようだ)",
    "みたい as its casual twin (register pair) — and the syntactic difference that trips everyone: みたい attaches to a BARE noun, ようだ needs の",
    "のように / のような simile (ゆめのようだ / こおりのようにつめたい)",
    "SYNTHESIS CARD: the four-way evidential map — そう(appearance) / そうだ(hearsay) / らしい / ようだ・みたい — assembled ONCE, here, now that all four have been introduced pairwise",
    "Explicit forward-flag: ように PURPOSE is a different job for the same morpheme (n4-19)",
    "⟳ deepen of n4-13 and n4-07",
  ],
  why: "Last evidential in, so this is where the family gets REASSEMBLED. The N5 spine established the principle at m16 ('sprinkling without reassembly is fragmentation') with the tense paradigm-synthesis card; evidentials are the N4 analogue — four items introduced in three different modules for good reasons, which creates an obligation to show them as one object exactly once.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 26", note: "the crystalline logic of Japanese similes — のように/のような" },
    { source: "Cure Dolly", ref: "lesson 25", note: "らしい vs そうです — the discrimination anchor" },
    { source: "Genki", ref: "ch 17", note: "〜みたいです ✔?" },
  ],
  salvage: "New authoring.",
  wave: 4,
  spiralWith: "n4-13",
  vocab: {
    count: 34,
    must: ["におい", "あじ", "かんじ", "きこえる", "みえる", "ようす"],
    prefer: ["こおり", "けむり", "かがみ", "にんぎょう", "そっくり", "にる", "ちがい", "とくちょう"],
    sidequest: ["ふんいき", "きざし"],
  },
}
```

### m45 · n4-16 — Causative

```ts
{
  id: "n4-16",
  title: "Causative させる",
  emoji: "\u{1F3AC}",
  teaches: [
    "Morphology by class: よませる / たべさせる / させる / こさせる — the second せる/られる pair off the a-stem, taught one wave after the passive it rhymes with",
    "MAKE vs LET is the PARTICLE, not the verb: 他動詞 → に (こどもにやさいをたべさせる), 自動詞 → を or に (こどもをあるかせる). Transitivity (m33/m41) is what makes this a rule and not a list",
    "〜させてください / 〜させてもらう permission-asking — rides m35's giving machinery",
    "The politeness danger, taught explicitly: causative aimed upward is almost always wrong. The repair (させていただく) is forward-flagged to n4-21",
    "NOT here: causative-passive (n4-21)",
    "⟳ deepen of n4-11's voice morphology",
  ],
  why: "After passive because the morphology rhymes (a-stem + れる/せる) and a learner who owns one gets the other at half price; after BOTH transitivity beats because the を/に split is a transitivity fact, not a causative fact. Note the ordering claim being made: passive before causative is not arbitrary — passive is the one that pays for itself immediately (m24's potential already taught the shape), so it goes first and finances the second.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 19", note: "causative + causative-passive — what they never tell you" },
    { source: "Cure Dolly", ref: "japanese-causative-verbs-how-they-really-work" },
    { source: "Genki", ref: "ch 22", note: "causative ✔?" },
  ],
  salvage: "New authoring; m40's passive drills are the rehash asset.",
  wave: 4,
  spiralWith: "n4-11",
  vocab: {
    count: 34,
    must: ["おや", "しゅくだい", "そうじ", "まかせる", "むりやり", "しかた"],
    prefer: ["せわ", "そだてる", "しつけ", "きそく", "めいれい", "ゆるす", "こまる", "ないしょ"],
    sidequest: ["きょういく", "ざんぎょう"],
  },
}
```

### m46 · n4-17 — Timing & aspect

```ts
{
  id: "n4-17",
  title: "Timing & aspect: 〜間に, 〜うちに, 〜ところだ, 〜たばかり",
  emoji: "\u{23F3}",
  teaches: [
    "〜間 (throughout) vs 〜間に (at some point within) — pairwise; both are the noun 間 taking a relative clause (m15), so no new syntax",
    "〜うちに 'before the window closes' — introduced against 間に only (あついうちにたべて)",
    "〜ところだ, three tenses of one noun: するところ / しているところ / したところ",
    "〜たばかり vs 〜たところ — pairwise; 'just did' by clock vs by feeling",
    "〜まま 'leaving it as it is' (つけたまま/そのまま) — the ておく/てある family's stative cousin",
    "COMPOUND VERBS: 〜はじめる / 〜つづける / 〜おわる — i-stem attachment again (⟳ deepen of n4-07's site)",
    "ばかり / ずつ / 〜め (ordinal) get their atoms here (quantity drip)",
  ],
  why: "A consolidation module, and openly so: five of its items are NOUNS (間・うち・ところ・ばかり・まま) taking the noun-modifying clauses the learner has owned since m15, so the module teaches one mechanism spent six ways rather than six mechanisms. That is why it can carry more items than a grammar module — it is exactly the 'vocab-and-consolidation' shape the N4 scoping doc predicted most late-tier modules would take. ながら was moved OUT of here into m36, where its i-stem attachment site actually lives.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 36", note: "ところ — the Japanese concept of place-grammar" },
    { source: "Cure Dolly", ref: "lesson 27", note: "ばかり meanings — logical pattern" },
    { source: "Genki", ref: "ch 21", note: "〜間に ✔?" },
  ],
  salvage: "New authoring; m15's relative-clause unit is the rehash asset.",
  wave: 5,
  spiralWith: "n4-07",
  vocab: {
    count: 34,
    must: ["あいだ", "うち", "ところ", "ばかり", "まま", "さいきん"],
    prefer: ["とちゅう", "つづく", "おわる", "はじめ", "ずつ", "そのまま", "きゅうに", "だんだん"],
    sidequest: ["いっしゅん", "ひさしぶり"],
  },
}
```

### m47 · n4-18 — Telling people what to do

```ts
{
  id: "n4-18",
  title: "Telling people what to do: 〜てほしい, 〜なさい, 命令形/禁止形",
  emoji: "\u{1F4E2}",
  teaches: [
    "〜てほしい 'I want YOU to' — the other-person half of たい/ほしい, which m13's binding constraint deliberately withheld",
    "〜なさい (i-stem) — parent, teacher and exam-paper register",
    "PLAIN IMPERATIVE いけ / たべろ / しろ and PROHIBITIVE いくな — RECOGNITION AND COMPREHENSION ONLY, production banned (signs, coaching, manga, quoted speech, song titles). See §5 D8",
    "〜ないで (please don't) and 〜ずに (without doing) — with せずに as the irregular that must be taught while the rule is fresh",
    "ONE speech act, SIX registers, contrasted pairwise and assembled only in R3: 〜な / 〜ろ / 〜なさい / 〜て / 〜てください / 〜ていただけませんか",
  ],
  why: "The course's register machinery (m7/m10/m29) has only ever run between plain and polite — a two-point scale. This module opens the BOTTOM of the scale and m49–m50 open the top, in the same tier, so the capstone can drill the full range as one object. Placed after the causative because 'make someone do X' and 'tell someone to do X' are the same social act at different distances, and the contrast is worth having adjacent.",
  parity: [
    { source: "Genki", ref: "ch 22", note: "〜なさい ✔?" },
    { source: "Genki", ref: "ch 20", note: "〜ないで ✔?" },
    { source: "Tae Kim", ref: "Making requests" },
  ],
  salvage: "New authoring; m14's ないでください set and m8's ください set are the rehash assets.",
  wave: 5,
  risks: "The imperative is register-loaded and can sound violent. Production ban is a deliberate safety call and the highest-overturn-risk decision in the tier (§5 D8).",
  vocab: {
    count: 32,
    must: ["きをつける", "まもる", "さわる", "すわる", "たつ", "ならぶ"],
    prefer: ["いそぐ", "しずかに", "だめ", "きんし", "ちゅうい", "あぶない", "やめる", "まっすぐ"],
    sidequest: ["どなる", "めいれいけい"],
  },
}
```

### m48 · n4-19 — Purpose & method

```ts
{
  id: "n4-19",
  title: "Purpose & method: 〜ために, 〜ように(なる/する), 〜かた",
  emoji: "\u{1F9ED}",
  teaches: [
    "〜ために (controllable goal, same subject) vs 〜ように (uncontrollable / potential / negative: わかるように, おくれないように) — the pair that decides which one the learner picks, taught as one decision",
    "〜ようになる (a change in what is possible — rides m24's potential) vs 〜ようにする (a change in what I choose to do)",
    "〜かた: i-stem + かた is a NOUN, so it takes の, not を (かんじのかきかた) — the error every learner makes once",
    "〜のに 'for the purpose of' (きるのにべんり) — the SAME string as m39's concessive のに, disambiguated by what follows it",
    "ため as a bare noun; までに deadline (m19's まで deepens)",
    "⟳ deepen of n4-15 — the OTHER よう, four modules later",
  ],
  why: "Deliberately four modules after ようだ/みたい so the two jobs of one morpheme are SPACED rather than stacked. Cure Dolly's L28 argues ように has a single underlying meaning across all its uses; we accept the unifying story and still split the beats, because a lesson called 'one key to all the main uses' is a concept dump in our module shape. The learner meets both halves and is then shown they were one thing — which is the spiral principle applied to a morpheme instead of a construction.",
  parity: [
    { source: "Cure Dolly", ref: "lesson 28", note: "ように — one key to all the main uses" },
    { source: "Cure Dolly", ref: "resolving-ambiguities-japanese ため-and-ながら" },
    { source: "Genki", ref: "ch 22", note: "〜ように / 〜ようになる ✔?" },
  ],
  salvage: "New authoring.",
  wave: 5,
  spiralWith: "n4-15",
  vocab: {
    count: 32,
    must: ["けんこう", "つかいかた", "よみかた", "もくてき", "ほうほう", "やくにたつ"],
    prefer: ["せつめい", "しらべかた", "たいせつ", "むだ", "こうか", "どりょく", "なれる", "までに"],
    sidequest: ["こうりつ", "しゅだん"],
  },
}
```

### m49 · n4-20 — Keigo I (尊敬語)

```ts
{
  id: "n4-20",
  title: "Keigo I — 尊敬語: service Japanese in the wild",
  emoji: "\u{1F647}",
  teaches: [
    "THE THIRD AXIS, stated outright: 丁寧語 (m7) is about the LISTENER; 尊敬語 is about the REFERENT. They are orthogonal — a plain-form sentence can be honorific, and a です・ます sentence can be blunt",
    "Lexical suppletives: いらっしゃる, おっしゃる, なさる, めしあがる, ごらんになる, ごぞんじ",
    "The productive frame: お/ご + i-stem + になる (おかきになる)",
    "HONORIFIC られる — the passive form's third job (m40 pays out again, at zero morphological cost)",
    "Shop / station / announcement Japanese as COMPREHENSION: いらっしゃいませ finally gets a legal home. It leaked into m5 as an untaught chunk and was purged; inv 33 says teach it or cut it, and this is where it is taught",
    "〜てくださる — the 尊敬 rung of m35's favor ladder",
  ],
  why: "Keigo must come after passive (honorific られる is then free), after giving/receiving (くださる is a giving verb), and after m47 opened the bottom of the register scale — so the axis is visibly a SCALE with the learner standing in the middle of it. Recognition-weighted by design: a learner HEARS keigo constantly and produces almost none, so module one is comprehension, and production waits for the humble forms that describe the learner's own actions.",
  parity: [
    { source: "Genki", ref: "ch 19", note: "honorific verbs (尊敬語) ✔?" },
    { source: "Tae Kim", ref: "Honorific and humble forms" },
    { source: "JF/Marugoto", ref: "service-encounter can-dos" },
  ],
  salvage: "The OLD m30 pilot's social-role atoms (せんぱい/こうはい/じょうし/どうりょう/しりあい/けいご) — authored in docs/n4-pilot-spine-2026-07-16.md for exactly this and never shipped.",
  wave: 6,
  milestone: "third register axis opens",
  spiralWith: "n4-21",
  vocab: {
    count: 36,
    must: ["いらっしゃる†", "おっしゃる†", "なさる", "めしあがる†", "おきゃくさま†", "てんいん"],
    prefer: ["うけつけ", "あんない", "じょうし", "せんぱい", "こうはい", "どうりょう", "けいご", "ていねい", "しつれい"],
    sidequest: ["ごらんください", "しょうしょうおまちください"],
  },
}
```

### m50 · n4-21 — Keigo II (謙譲語) + causative-passive

```ts
{
  id: "n4-21",
  title: "Keigo II — 謙譲語 + 〜させていただく (+ causative-passive)",
  emoji: "\u{1F3E2}",
  teaches: [
    "Humble suppletives: うかがう, もうす/もうしあげる, いたす, いただく, はいけんする, おる, ございます",
    "The productive frame: お/ご + i-stem + する (おもちします)",
    "〜ていただく / 〜ていただけませんか — the top rung of m35's favor ladder, arriving with the register that justifies it",
    "〜させていただく = causative (m45) + humble receiving (m35). The composition adults actually use to ask permission at work",
    "CAUSATIVE-PASSIVE させられる as its mirror ('was made to'): production capped to six high-frequency verbs, full system deferred to N3 (§5 D5)",
    "The misuse card: 二重敬語 and over-keigo are ERRORS, not extra politeness — taught as antiPattern",
  ],
  why: "Humble language is production-shaped (it describes the speaker's own actions), so it comes second and carries the module's production load, while m49 carried comprehension. This is also why causative-passive can wait until m50 and still land in one lesson: by here BOTH of its ingredients are owned, and させていただく gives it a real-world twin so it is not an isolated conjugation exercise. Any earlier placement would have made it a fourth voice form competing with passive and causative for the same week.",
  parity: [
    { source: "Genki", ref: "ch 20", note: "humble expressions (謙譲語) ✔?" },
    { source: "Cure Dolly", ref: "lesson 19", note: "causative-passive" },
    { source: "Tae Kim", ref: "Honorific and humble forms" },
  ],
  salvage: "New authoring; m35's ladder and m45's causative are the rehash assets.",
  wave: 6,
  spiralWith: "n4-20",
  vocab: {
    count: 34,
    must: ["うかがう†", "もうす†", "いたす", "いただく", "はいけん†", "ございます"],
    prefer: ["めんせつ", "ようじ", "れんらく", "しつれい", "おせわ", "しょうち", "かしこまる", "つごう"],
    sidequest: ["ごぶさた", "おそれいります"],
  },
}
```

### m51 · n4-22 — N4 capstone

```ts
{
  id: "n4-22",
  title: "N4 capstone",
  emoji: "\u{1F393}",
  teaches: [
    "THE FOUR-WAY CONDITIONAL: と / ば / たら / なら as a single discrimination object. This is the ONLY place in the tier where all four are offered at once — every introduction was pairwise, and this is the review the ruling always pointed at",
    "THE そう × そう MINIMAL PAIR: ふりそう vs ふるそうだ, drilled to reflex, fifteen modules after the first half was taught",
    "THE VOICE MATRIX on one verb: active / potential / passive / causative / causative-passive / honorific られる — one object, six cells",
    "THE REGISTER MATRIX end to end: 命令形 → plain → 丁寧 → 尊敬 → 謙譲, same content five ways",
    "The evidential + epistemic map (そう/そうだ/らしい/ようだ・みたい × かもしれない/でしょう/はず) revisited with all-new sentences",
    "CAPSTONE COVERAGE RULE (inherited from s25): every N4 concept reviewed with ALL-NEW sentences",
    "FAIL-ROUTING: a missed item points at its owning module's review (concept tags make this derivable)",
    "NO NEW ATOMS — inv 25 bans them in the challenge lesson; this whole module honours the same bar",
  ],
  why: "The tier deliberately withheld four N-way discriminations (conditionals, そう×2, the voice matrix, the register scale) because introducing them N-way is what produces cross-association. Withholding creates an obligation: there must be exactly one surface where they are legal, and this is it. Structurally identical to s25 (m29) — same coverage rule, same fail-routing — so the learner meets a familiar shape at the tier boundary.",
  parity: [
    { source: "Review", ref: "s25 note", note: "total coverage with fresh sentences + directed fail-routing — both binding here" },
    { source: "Cure Dolly", ref: "lesson 34", note: "understand any sentence — analysis technique, the capstone's framing" },
  ],
  salvage: "m29's capstone machinery (derived coverage + routing) extended over the N4 concept set.",
  wave: 6,
  milestone: "JLPT N4 COMPLETE",
  vocab: {
    count: 0,
    must: [],
    prefer: [],
  },
}
```

---

## §3 Sequencing rationale — the hard calls

### 3.1 The four conditionals: split 2 + 2, five modules apart, たら as the hub

**Decision: たら + と at m32; ば + なら at m37; four-way contrast ONLY at m51.**

The N5 spine already decided this class of question for register: *pairwise contrast on
introduction, N-way only on review* (RUN-PLAN standing decision 5; the same instinct produced
the は/が contrast lesson at m16 and the deliberate refusal to offer は↔が as build distractors,
inv 35). The reasoning transfers exactly. Presenting four near-synonymous conditionals together
optimizes for the wrong thing: it makes the DISTINCTIONS salient at the moment the learner has
no fluency in any of them, and every retrieval afterwards has to run a four-way disambiguation
that the learner cannot yet perform. The result is the classic N4 symptom — all four are
"recognized", none is produced.

The split is not arbitrary either:

- **たら is the hub** because it is morphologically free (た + ら, owned since m11) and
  semantically the widest. Every other conditional is introduced against たら alone.
- **と pairs with たら** because it is the true minimal pair — same gloss, deterministic
  reading — and it has a MECHANICAL tell (blocked main clauses: no request, command,
  invitation or intention), which converts a nuance question into a rule question.
- **ば pairs with たら** at m37, and its placement is opportunistic: m28 shipped ば inside the
  frozen frame なければならない, so this module *unfreezes* a form the learner has been
  producing for nine modules. That is a better first lesson than any explanation.
- **なら pairs with たら** because なら's distinguishing property is precisely that it does NOT
  order events in time — the one thing たら always does.
- **ば vs なら are never contrasted on introduction**, and the four never co-occur until m51.

Risk accepted: some learners will over-generalize たら for five modules. That is the intended
failure mode — over-using the most versatile form is recoverable; freezing up in front of a
four-way choice is not.

### 3.2 Transitivity: early, six pairs, taught as a diagnostic

**Decision: Transitivity I at m33 (fourth module of the tier); Transitivity II at m41.**

Transitivity is a wall for two reasons that have nothing to do with difficulty: it is usually
taught as a *vocabulary list* of 20–30 pairs, and it is usually taught *late*, after the
constructions that depend on it have already been half-learned without it. Both are fixable by
placement.

- **Early**, because it gates four downstream things: passive (m40) operates on 他動詞;
  causative's を/に split (m45) is a transitivity fact; てある (m41) requires 他動詞;
  ている-resultative (m14, already taught!) only makes sense with 自動詞. m33 is the earliest
  slot where the learner has て, た, ている and が/を fluently — i.e. everything the concept
  needs and nothing it doesn't.
- **A diagnostic, not a table.** The teaching object is the QUESTION 'which particle does this
  verb take?', not the pair list. Six pairs, all physically demonstrable (doors, lights,
  classes), is one module's honest capacity. The other ~20 pairs DRIP with the domains that
  need them (thread `thr-n4`), which is the counter-drip rule applied to verbs.
- **Two beats, eight modules apart**, and the second beat comes AFTER passive on purpose:
  てある and passive both promote a non-agent into the が slot, so once the passive frame is
  owned, ている / てある / られる becomes one three-way contrast rather than three tricks.

If QA shows the diagnostic failing, the correction is *fewer pairs*, not more explanation.

### 3.3 Passive → causative → (much later) causative-passive

**Decision: passive m40, causative m45, causative-passive m50 as one lesson inside Keigo II.**

- **Passive first**, because it is the one that pays for itself immediately: for ichidan verbs
  the passive form is IDENTICAL to the potential form the course has owned since m24. Sixteen
  modules of distance is what converts that homophony from a hazard into a saving — the form
  is already automatic, so the module can spend all its attention on the *frame*
  (X が Y に V-られる). Textbooks that teach passive before potential forfeit this entirely.
- **Causative second**, because its morphology rhymes with the passive off the same a-stem
  (れる/せる), and because MAKE-vs-LET is decided by the base verb's transitivity — which
  means it needs both transitivity beats behind it.
- **Causative-passive can wait, and should.** It is a composition of two owned things, not a
  new form, so teaching it early buys nothing and costs a fourth voice paradigm competing for
  the same week. At m50 it arrives with a *reason to exist*: 〜させていただく (causative +
  humble receiving) is the version adults actually say, and させられる is its mirror. One
  lesson, production capped to six high-frequency verbs, full productive system deferred to N3.
- Direct passive only in m40; the **suffering passive** (雨に降られた) is a recognition beat.
  It is the passive use learners hear most and produce least, and production of it requires a
  discourse sense (whose day was ruined) that is genuinely N3 work.

### 3.4 Giving & receiving: one axis per module, three modules

The problem is stated correctly in the brief — 3 verbs × 2 directions × register is a
three-dimensional object, and no module can introduce more than one dimension of it.

| Module | Axis introduced | Held constant |
|---|---|---|
| m31 (n4-02) | DIRECTION — who points at whom (うち/そと) | plain register; nouns only, no て-forms |
| m35 (n4-06) | SCHEMA — the て-forms, i.e. giving/receiving an ACTION | direction already owned; register introduced pairwise as a ladder |
| m50 (n4-21) | REGISTER — くださる / いただく / 〜ていただけませんか | direction and schema both automatic by now |

The m31 module deliberately contains **no て-forms at all**, which is only affordable because
m30 installed the て + helper schema separately; when m35 arrives, it introduces *zero* new
rules — it is a composition of two owned things, which is why it can afford to spend its
lessons on the six-rung request ladder instead. くださる/いただく appear as flagged recognition
in m31 and m35 and become production only in m50.

### 3.5 Keigo: what N4 adds on top of a course that already teaches register

The course has taught register explicitly since m7 and has a whole module on it (m10) plus a
mastery module (m29). What it has taught is **丁寧語** — a property of the *listener*
relationship, expressed by です・ます. That is one axis.

N4 adds a **second, orthogonal axis: referent honorification.** 尊敬語 elevates the person you
are talking ABOUT; 謙譲語 lowers yourself relative to them. This is the thing learners
systematically fail to see, because textbooks present keigo as "extra-polite ます" — a
higher rung on the axis they already know. It isn't. A plain-form sentence can be honorific
(先生、来る？ is wrong for politeness reasons but 先生がいらっしゃる is honorific regardless of
its ending), and です・ます can be blunt.

So N4's keigo modules add exactly three things:

1. **The axis itself**, stated as an axis and drilled as a 2×2 (plain/polite × neutral/honorific).
2. **The lexical suppletives** — a closed set of ~12 verbs that must be learned as vocabulary.
3. **Two productive frames** — お/ご + i-stem + になる (尊敬) and + する (謙譲).

Split into **recognition (m49)** and **production (m50)** because the two halves have opposite
usage profiles: a learner hears 尊敬語 constantly (shops, stations, announcements) and produces
almost none, while 謙譲語 is what they will actually need to *say* the first time they email a
professor or interview for a job. The recognition module also finally gives いらっしゃいませ a
legal home — it leaked into m5 as an untaught chunk, was purged, and inv 33 says teach it or
cut it.

Placement at the tier's end is forced by dependencies (honorific られる needs passive;
くださる needs the giving verbs; させていただく needs causative + もらう), and is convenient:
m47 opened the bottom of the register scale six modules earlier, so the capstone can drill
命令形 → plain → 丁寧 → 尊敬 → 謙譲 as one continuous object.

---

## §4 Threads — `thr-n4`

The N5 spine's `thr1` continues unchanged (glue-adverb drip, register drills, spiral beats,
end-of-lesson review floors, closed-class coverage checklist). N4's additions and changes:

```ts
{
  id: "thr-n4",
  title: "⟳ Continuous threads — N4 tier (not a module)",
  emoji: "\u{1F9F5}",
  teaches: [
    "KANJI DRIP: ~8 new kanji per module (~170 across the tier, cumulative ~300). Never a kanji module. N4 vocabulary is kanji-dense, so the drip is denser than N5's — but the unlock+2 furigana window and the FSRS-mastery rule (inv 3) are unchanged",
    "KANJI GOES SEMI-PRODUCTIVE: `kanji_reading` steps ramp from ~3/module at m30 to ~6/module by m45, always on ALREADY-UNLOCKED kanji and never on a just-introduced word. Typed kanji input remains banned forever (inv 2)",
    "TRANSITIVITY-PAIR DRIP: after m33's six pairs, each new pair arrives when a domain calls for it (こわれる/こわす with m38's mishaps, ならぶ/ならべる with m41's arrangement). Never a pair table",
    "COUNTER DRIP continues: 〜だい, 〜けん, 〜さつ, 〜そく, 〜はい arrive with the nouns that need them",
    "GLUE-ADVERB DRIP continues, N4-weighted: やっぱり, もちろん, べつに, なるべく, ぜひ, さっそく, どうしても, なんとか — 1-2 per module, never a block",
    "QUANTITY & LIMIT DRIP with NAMED OWNERS (closed-class coverage checklist — every item below has exactly one owning module): ぐらい/ごろ m32 · だけ + しか〜ない m35 · ほど m37 · など m42 · ばかり + ずつ + 〜め m46 · までに m48",
    "REGISTER DRILLS continue and widen: from m47 the scale runs 命令形 → plain → 丁寧, and from m49 → 尊敬 → 謙譲. Every production step still names its audience (inv 8)",
    "SPIRAL BEATS: every ⟳-linked pair is ≥4 modules apart in this tier (N5 used ≥3; N4 concepts are heavier and the tier is longer), and the deepen beat still OPENS with a 60s rehash of the intro",
    "CROSS-TIER DEEPENS: N4 modules carry deepen beats for N5 items rather than re-teaching them — すぎる (m36), でしょう (m43), ので (m39), ている (m33/m41), ましょう (m34), potential (m40), まで (m48), たい/ほしい (m47). Each is recorded as a spiralWith across the tier boundary",
    "LONGER DIALOGUES: N4 dialogues run 5-8 turns with register variation (N5 topped out at 2-4). No new step type needed — `dialogue_listen` already takes unbounded lines[]",
    "SENTENCE COMPLEXITY FLOOR RISES: from m30, production sentences carry ≥2 clauses on average (the m12+ connective ramp, inv 13, ratcheted once). Short-and-flat is a defect",
    "REVIEW FLOORS unchanged: ≥60% sentence-context, reviewMatchPairs as the sole word-level step, mined sentences only (inv 19)",
  ],
  why: "The N5 threads are load-bearing and stay. What changes in N4 is DENSITY (kanji, sentence length, dialogue length) and one genuinely new thread: transitivity pairs behave exactly like counters — a closed-ish set that must never be taught as a set.",
  parity: [
    { source: "Review", ref: "thr1", note: "the N5 thread block this extends" },
  ],
  salvage: "thr1's machinery entire; the kanji ladder and the drip lints already exist.",
  wave: 0,
  locked: true,
}
```

---

## §5 Open questions — and my decisions

Delegated per the run plan ("decide for me, document your decisions"). Each is stated, decided,
and reasoned. **Overturn risk** is my estimate of how likely Spencer is to reverse it.

**D1 — Module count and numbering. → 22 units, m30–m51.** (risk: medium)
21 content modules + 1 capstone. Alternatives were 12 dense modules (the 2026-07-16 scoping
doc's recommendation, ~45–50 atoms each) or ~27 thin ones. 22 is chosen because the module
SHAPE is now fixed at 12–15 lessons (inv 25) — with 8–11 teaching lessons per module, a
45-atom module means 4–5 new words per lesson on top of new grammar, which is the density that
produced the m7 "9 concepts in one module" audit finding. 22 modules is also almost exactly the
N5 tier's length, so the learner's sense of pace is continuous across the boundary.

**D2 — Vocab density. → 30–38 new atoms per module, ~760 total.** (risk: HIGH — most likely to
be overturned)
N5's neo modules run 12–26. This is a real increase and I am asserting it is safe because
(a) script acquisition is finished — no lesson budget goes to kana or romaji fade, (b) N4
vocabulary is heavily compound (けんきゅう, ほうそう, もくてき), so kanji-carrier learning is
shared across words, and (c) the ≥3-occurrence atom-coverage gate (inv 14) will fail loudly if
a module over-allocates. If m30–m32 come back with coverage-gate failures or QA reporting
overload, the correction is to drop to ~26 and add three modules, NOT to thin the reviews.

**D3 — Conditionals: split 2+2, five modules apart. → decided, see §3.1.** (risk: low)
Directly inherited from an existing Spencer ruling; the only judgment call is which pairs, and
たら-as-hub follows from morphology.

**D4 — Transitivity placement. → m33 (early), six pairs, diagnostic framing.** (risk: medium)
The competing view is "transitivity is hard, put it late". I reject it: late placement is
exactly why it becomes a wall, because passive/causative/てある get learned around it. The
risk I accept is that m33 is the tier's highest-attrition module. Mitigation is written into
the unit's `risks`: if it fails, cut to four pairs.

**D5 — Causative-passive. → keep it in N4, at m50, one lesson, production capped to six verbs.**
(risk: medium)
It is on N4 lists and it is cheap ONCE causative and passive are both owned. What is NOT cheap
is the discourse sense of when to use it, which is N3 work. Capping production is the
compromise; if authoring finds the cap unnatural, cut it to recognition entirely rather than
expanding it.

**D6 — Keigo depth and placement. → two modules at the tier's end, recognition then production.**
(risk: low) See §3.5.

**D7 — そう × 2 separation. → six modules apart (m36, m42), one discrimination beat at m51.**
(risk: low-medium)
The alternative — teach them together as a contrast — is what most textbooks do and is
defensible on discrimination-learning grounds. I am applying the course's own precedent
instead: pairwise contrast on introduction, N-way on review, and these two are not a natural
pair (one is an i-stem attachment, the other embeds a clause). They belong to different
families and are sequenced with their families.

**D8 — Imperative 命令形 / 禁止形. → TAUGHT at m47, comprehension and recognition only,
production banned.** (risk: HIGHEST)
Arguments for teaching: it is on every N4 list; it is unavoidable in signs, manga, sports and
quoted speech; and a learner who cannot parse 行くな is missing comprehension, not politeness.
Arguments for the production ban: these forms are genuinely rude in most situations a learner
will be in, and the course has a standing pattern of recognition-only for register-hazardous
forms (だろう at m25, ぼく/おれ through N5, ら抜き at m24). This is the decision most likely to
be overturned in either direction — Spencer may want it cut entirely, or may want production
for the sports/coaching register.

**D9 — 〜ば〜ほど. → recognition rider inside m37, not a teaching beat.** (risk: low)
It is N3-leaning and its frequency does not justify a beat. ほど itself is taught.

**D10 — New step types. → NONE required for this tier.** (risk: medium)
The 2026-07-16 scoping doc recommended building `conjugation_cloze`. Since then
`conjugation_transform` shipped (spec 2026-07-23) and covers produce-the-form drilling, and
`build` covers form-in-sentence-context production. Voice transformations (active→passive→
causative) are `conjugation_transform` plus `build`. I am NOT commissioning new step types for
N4; if the m40/m45 authoring cycle finds a genuine gap, that is the moment to reconsider, with
evidence.

**D11 — Does kanji go productive? → semi. `kanji_reading` (kanji→reading recall) ramps from
~3/module to ~6/module; typed kanji production stays banned forever.** (risk: low)
Reading recall is required for N4-density text; writing is not, and inv 2 forbids typed kanji
input outright.

**D12 — Map zone, tier registration, `mockCourse` wiring. → OUT OF SCOPE for this spine, and
blocking before m30 ships to learners.** (risk: low)
The 2026-07-16 recon found the load-bearing seam: `buildLayout` splits ALL stations into
exactly 3 geometric zones, so appending 22 N4 stations silently rebalances the N5 zones. The
zone model must move to tier-derived bands before N4 modules appear on the map. Authoring can
proceed ahead of it (the QA drive page at `/ja/qa` renders modules without the map), but this
is a real prerequisite for release, not a nice-to-have.

**D13 — The たがる debt. → repaid at m36.** (risk: low)
n05's binding authoring constraint banned third-person "wants" in N5 because it requires
たがる. m36 is the first module whose attachment site (i-stem) makes it free.

**D14 — Vocab allocation source of truth. → `docs/data/ja-neo-vocab.json` remains the ranked
pool; the ~120 missing domain words come from `ja-core6k-order.json`; the 7 keigo suppletives
are hand-added.** (risk: low)
All `must` lists here are PROVISIONAL until the neo N5 allocation past m11 is final; the
pre-flight is `node scripts/authoring-context.mjs m<N>` (inv 16).

**D15 — Contractions (とく, ちゃう). → とく recognition at m30; ちゃう PRODUCTION at m38.**
(risk: low)
ちゃう is the majority casual form in the spoken corpora this course optimizes for, and the
course has been plain-form-first since m3. Recognition-only would repeat the してる mistake
the N5 audit flagged (explained second-to-last, heard in episode one).

**D16 — Re-teaching N5 items that shipped thin. → never re-teach; attach a deepen beat.**
(risk: low)
Seven N5 items get cross-tier deepen beats (§4). If QA finds an N5 concept genuinely
under-taught, the fix is that module's re-authoring, not a duplicate N4 module.

**Most likely to be overturned, in order: D2 (vocab density), D8 (imperative production ban),
D5 (causative-passive scope).**
