# Vocab exposure audit — words the live course never asks about, and never teaches

**Date:** 2026-07-29 · **Status:** AUTHORITATIVE (measurement checked in as a ratchet)
**Independently verified 2026-07-29** — an adversarial re-derivation reproduced
every §1/§5.1 figure except the never-touched count (96, not 99 — reconciled in
§5, detector hardened to match) and found the scope corrections in §5.2.
**Backlog:** B065 (the gap), B066 (side-quest surface), B067 (the slot-in plan),
**B068 (the unlock bug — read §5, it is more urgent than the rest of this doc)**
**Instrument:** `src/features/languages/ja/__tests__/atomExposureAudit.test.ts`
— `EXPOSURE_REPORT=1 npx vitest run atomExposureAudit` writes
`/tmp/ja-atom-exposure.txt` (never graded) and `/tmp/ja-atom-untouched.txt`
(never used at all).

Distinct from `scripts/exposure-audit.mjs`, which is frequency-weighted over
**taught** atoms and is blind to this by construction ("taught + counted"). It
currently reports zero under-exposed CEJC top-150 words — the taught set is well
drilled. The gap is entirely *which words are taught at all*.

## 1. The measurement

Walked the live JA map in learner order — 432 lessons, 7580 steps, 5455 carrying
`exercisedAtoms`.

| | count |
|---|---|
| SRS-eligible atoms attributed to a live module | 678 |
| **unlocked by walking the entire live course** | **208** |
| unlocked by nothing | 470 |
| never named by a graded step | **220** |
| …of those, surface never appears in ANY live lesson (not even as text) | **96** |
| …of those, attributed to a teach/`info` step instead | **0** |
| of the 216 real never-graded, in the **CEJC top-500** spoken-Japanese list | **73** (lemma-disambiguated; see §7 — earlier 78–82 counts included particle-row and homograph collisions) |
| graded but never advances FSRS (D2 same-module gate; 19 are m30, structural) | 37 |

### This is a coverage gap, not a reinforcement gap

The framing in the first two B065 filings was wrong. These are not words the
course teaches and under-drills — **the rewrite has not re-taught them.** Nothing
unlocks them, so the flashcard deck and the dynamic review pool (both filtered on
the unlock store) cannot reach them either. They are live only in the atom
registry, which still carries the pre-rewrite course's word list.

It is already a *known* state in one place: `curriculum/__tests__/m19-neo.test.ts`
("ships no untaught motion vocabulary") guards のる, おりる, つく, でる, かかる,
ひこうき, くうこう, こうえん, タクシー, まっすぐ, みぎ, ひだり so authors don't
reach for them — though note (audit correction) its corpus is **m19's own
lessons only**; the surrounding comment claims course-wide scope the assertion
doesn't have. のる/ひこうき also appear in `m19.ir.yaml` prose explicitly
recording that they were cut. What was never measured is how many words are in
that state.

**Module labels in the registry are legacy.** `atom.fromModule` refers to the
pre-rewrite numbering (`compile-ir.mjs` says so outright: "those tags are stale by
construction"). 右/左 carry `fromModule: m17`, but live m17 is "Family I" — live
m19 is the motion module. Do not read the `from` column as "where the course
teaches it"; nothing teaches it.

### Corrections to the earlier filings

- **"28 words"** — that measured only the 124 kanji-switchover words.
- **"the flashcard deck is their only surface"** — it is not a surface for them at
  all, because they are never unlocked.
- **"the numbers are an attribution gap"** — 四 and 七 *are* taught, under the
  registry ids `ja-m5-1-v-4` / `ja-m5-2-v-7`; the m13 rows `shi`/`shichi` are
  duplicate legacy rows. 二 genuinely is never drilled, and that one is
  deliberate: に is the particle too, and m11's IR documents the homograph care
  ("にじゅう is therefore never drilled"). にじ (2 o'clock) is in the 220 for the
  same reason.
- **Duplicate check (corrected by the independent audit):** 11 of the 220 share
  a surface with a taught atom. Genuinely the same word taught under another id —
  only **4**: いい/よい → `ii`, し → `ja-m5-1-v-4`, しち → `ja-m5-2-v-7`, and
  より、ほう → `p-yori`+`hou` (a composite whose parts are both taught; missed in
  the first pass). The rest are collisions of *different* words (は 歯/topic
  particle, はる 貼る/春, はな 鼻/花, かぜ 風邪/風, 二/に-particle) — and, contra
  the first draft, わたくし (distinct humble pronoun; the kana is never taught,
  only 私 collides) and 熱い (distinct word from taught 暑い) are NOT covered.
  So **216 of the 220 are real**.

### Why nothing unlocks them

`fallbackAtomsForLesson` attributes an atom to a lesson only when the lesson's
steps name it in `exercisedAtoms` or a tile (exact match — the old substring rule
was removed for crediting くる from くるま). No mention, no unlock. That is
correct behaviour; it just means the unlock ladder faithfully reports that the
words aren't used.

## 2. Priority: 73 of them are CEJC top-500

Not exotic breadth vocab. Worst offenders by verified spoken-frequency rank
(this table is over the **216 real never-graded**, not the 96 never-touched):

| rank | word | | rank | word |
|---|---|---|---|---|
| #57 | ほんとう really | | #151 | こんな such |
| #69 | ところ(所) place | | #154 | にん people-counter |
| #70 | 二 two *(deliberate — に homograph)* | | #155 | かた(方) person/way |
| #76 | あと(後) after | | #167 | おなじ(同じ) same |
| #89 | みんな everyone | | #176 | おおい(多い) many |
| #99 | はなし(話) talk | | #184 | はやい(早い/速い) early/fast |
| #100 | とる(取る/撮る) take | | #188 | たいへん very/tough |
| #103 | つかう(使う) use | | #209 | こども(子供) child |
| #104 | もつ(持つ) hold | | #219 | かわいい cute |
| #110 | かく(書く) write | | #238 | おぼえる(覚える) memorize |
| #111 | つくる(作る) make | | #252 | どうぞ please/here |
| #112 | じぶん(自分) oneself | | #260 | あう(会う) meet |
| #128 | また again | | #289 | ねる(寝る) sleep |

…plus 右 #496, 左 #491, 座る #423, 起きる #484, 洗う #487, 住む #402, 選ぶ #431,
止まる #477, 隣 #455, 夜 #358, 昼 #495, 年 #494. Full 73 in §7.

**⚠️ Rank-join hygiene (2026-07-29, third correction pass).** The CEJC file has
particle rows and duplicate-kana rows, and a kana-only join silently steals
their ranks. Artifacts removed from earlier drafts of this table: **歯 "#12"**
was topic-particle は (歯 the word is not in the CEJC-500 at all); **暗い
"#61"** was the extent-particle くらい; **し(四) "#75"** was the conjunction し
(the genuine 四 row is よん #121, covered by the taught atom); **わたくし
"#58"** was わたし's 私 row; **会う "#345"** was actually 合う's rank (会う is
#260); **止まる "#461"** was 泊まる's. Join on kana AND lemma, and exclude
`pos: particle` rows for vocab atoms.

## 3. The graceful slot-in

**The IR is the front door.** Per module: `curriculum/ir/mN.ir.yaml` declares
`newAtoms` + lessons → `node scripts/compile-ir.mjs mN` writes the committed
`mN.ir.json` → `compileModule()` builds `LessonContent[]` at load. So one extra
teaching lesson per module is an IR edit plus a recompile — no new machinery.

Four things must line up, and each is a real trap:

1. **Registry row, not IR-only.** An atom declared only in IR `newAtoms` is
   invisible to the module compiler's tokenizer *and* to SRS. The `ii` backfill
   comment in `courseAtoms.ts` is the postmortem: 「たべても いい」 tokenized to
   `たべて・も・<unknown>` and tripped the `unbuildable` gate. These 216 words
   already have registry rows — that part is free.
2. **`fromModule` must be the teaching module.** `getAtomsUpToModule` (the review
   pool) and the D2 gate both read it. A word taught in live m11 but tagged m12 is
   excluded from m11's reviews *and* never graded by D2 — taught, then untouchable.
   So re-homing a word means updating its `fromModule`.
3. **Unlock is automatic** once the lesson's steps name the atom in
   `exercisedAtoms`/tiles — **provided `fromModule` matches (trap 2) and the atom
   has no `introducedByLessonId`.** Prefer leaving that field unset: pointing it
   at the new lesson suppresses the fallback for that atom everywhere, and if the
   lesson is later renamed or dropped the atom becomes permanently unlockable —
   which is precisely how the 234 dangling attributions in §5.1 happened. This
   supersedes an earlier draft of this line that called setting it safe.
4. **The map tile is hand-maintained.** `mockCourse.ts` lists each module's lesson
   ids literally; a new lesson needs its entry there too.

**TTS is already done.** Spot-checked 28 of the cluster words (weekdays, 右/左,
子供/大人, tableware, どうぞ/どうも) against `src/pub/tts/manifest.json` — 28/28
present, from the old course's run. No emit/generate cycle needed.

### Proposed homes, by live module theme

| cluster | ~words | live module | note |
|---|---|---|---|
| weekdays + calendar (土日月火水木金曜日, 今週, 明後日, 夕方, 昼, 夜) | ~15 | **m11** Time I | m11's IR defers calendar points: "those arrive later" — this is the debt |
| directions + landmarks (右, 左, 横, 後ろ, 向こう, 道, 橋, 建物, 曲る, 渡る, 止まる, 降りる, まっすぐ) | ~18 | **m19** Getting around | the m19 guard test names these exact words; it would be relaxed as they land |
| family + people (子供, 大人, 男, 女, 男の子, 女の子, 皆さん, おじいさん, おばあさん, 結婚, 誕生日) | ~14 | **m17** Family I | |
| tableware + ordering (箸, カップ, コップ, スプーン, フォーク, お皿, お弁当, どうぞ, どうも, いかが) | ~13 | **m8** Asking for things / **m9** Numbers & purchases | どうぞ/どうも are request-register words, so m8 fits both halves |
| body + routine (歯, 磨く, 洗う, 起きる, 寝る, 走る, 座る, 朝御飯, お風呂, シャワー) | ~20 | **m22** Body/health for 歯; routine verbs into **m14** ている | ている is the natural carrier for a routine |
| adjectives (悪い, 易しい, 暗い, 熱い, 冷たい, 速い/早い, つまらない, まずい) | ~12 | **m12** Adjectives | |
| more/less + same (多い, 少ない, 同じ, もっと, いろいろ) | ~7 | **m20/m26** Comparisons | |
| connectives (しかし, でも, では, じゃ, そして, さあ) | ~8 | **m16** Connecting | |
| time expressions (今朝, 昨夜, 去年, 先月, 先週, 毎年, 毎月, 毎週, 毎朝, 毎晩, 今年, 来週, 来月, 来年) | ~16 | **m11** Time I / **m23** Experience & intent | 毎あさ already appears in six IRs — partly a registration gap |
| katakana loanwords (ドア, ペン, ノート, ナイフ, レストラン, コンビニ, クラス, ラジオ, エレベーター) | ~16 | the katakana row lessons already inside m11–m17 | rows exist; the loanwords are the natural drill content |
| verbs (貸す, 貼る, 閉める, 開ける, 使う, 覚える, 急ぐ, 直す, 運ぶ, 選ぶ, 片付ける, 会う, 住む, 持つ, 作る, 困る) | ~18 | **m24** Can & let's / **m29** capstone | |

Residual singletons (~25) that fit no cluster: 二 *(deliberate)*, 鼻, 風邪, 公園,
銀行, 町, 所, 外, 後, 次, 電気, 庭, 新聞, 雑誌, 絵, 意味, 留学生, あちら, そちら,
先, 辺.

## 4. Recommendation

**Lever (a) — code landed 2026-07-29, but it is DORMANT (see B069).**
`buildSrsReviewLesson` now reserves the new-card seats instead of merging them
into the due queue and shuffling down to `MAX_ATOMS`; and `composeAtomSteps`
stamps the target atom onto every step it builds. The second half mattered as
much as the first: the `speaking` production fallback (133 steps measured over
the m30 set) and the last-resort `listeningCompSentence` (104) emitted **no**
`exercisedAtoms`, and `shouldWriteSrs` needs a non-empty list — so a new card
that landed there stayed a new card forever and held a reserved seat every
review. Hardened after the independent code review: the homophone mis-credit is
now stripped (not just papered over), the degenerate blank-option MCQ can no
longer be emitted, the `MAX_ATOMS` hard cap is restored, and `kanji_reveal` is a
teach step (it fired the combo/chime as an always-correct graded step).

**The dormancy finding (independent review, D1, verified):** nothing on the live
JA map routes to `buildSrsReviewLesson`. The 73 live `ja-mN-neo-review-*`
lessons are **static IR-compiled lessons**; only the `ja-mN-review-1/2` id shape
reaches the dynamic builder (`mockLessons.ts:747`), and zero live lessons carry
it. So lever (a) — and the kana→kanji **switchover beat (B061)**, whose only
call site is inside this builder — ship no learner-visible behaviour until the
wiring lands. This also helps only words that are *unlocked*, i.e. not the 96.

**Lever (b) — the vocab-pack lessons.** One extra teaching lesson per module per
the table above, cheapest-first: m11 weekdays and m19 directions are the two most
visibly missing (a course that never asks 土曜日, 右 or 左 is a hole a learner
notices). Each pack is an IR edit + recompile + a map tile, with registry rows and
TTS already in place. See B067.

**Lever (c) — side quests** for what has no home in the spine (the katakana
loanword set, the residual singletons). Needs B066 first: quests are inert today
and grade nothing. They are also opt-in, so they answer "can I go learn this
properly", never "does the course teach this".

## 5. Verification pass, and the bigger bug it surfaced (2026-07-29, B068)

Spencer pushed back — "make sure those words are truly missed, maybe you are
seeing things wrong?" — and he was right to: the first absence detector had two
holes. It searched **kana only** and it used the raw `kana` field, so a variant
row like `いい / よい` could never match. Rebuilt with three independent detectors
over the compiled steps of all 427 live lessons that have content:

1. the atom id appearing verbatim as `"<id>"` in the step JSON
2. every **kana** variant, split on `/` and `、`
3. every **kanji** variant, same splitting

**96 atoms are absent by all three** — the independent audit's figure, which my
earlier 99 could not survive (it was not reproducible by any detector variant;
the audit also spot-checked 12 of the words by hand against every IR file with
zero false positives). The checked-in instrument originally used a weaker
single detector (unsplit kana only) and reported 100; it has been hardened to
the three-detector version and now measures **exactly 96**, ratcheted at 96.
Corrections the rebuild + audit produced:

- **1 false positive** in the earlier list — さき/先 *is* taught, in kanji.
- **4 atoms are referenced by id but never print their surface** (わすれる, かんじ,
  つかれる, さがす).
- **Known blind spot:** a single-kana word (は/歯) always reads as "present"
  because the particle は is everywhere. Its absence is real but unmeasurable
  by this instrument.
- Cross-check (audit-corrected): **94 of the 96 are tagged `in-course`** in
  `docs/data/ja-neo-vocab.json`, 1 `unallocated`, 1 (そうして/そして) absent from
  the file, **0 sidequest** — an earlier draft claimed 3 sidequest rows that do
  not exist. The rewrite's own plan says teach them.

### Do NOT use ja-neo-vocab.json's `currentModule` as a slot plan

It looks like one and it is stale. ちち/はは say `m8` while the live family module
is m17; あに says `m3` and あね says `m19`. Measured against the module that
actually unlocks each atom: 61 agree, 8 disagree, and the rest have no entry.

### §5.1 — 287 words are TAUGHT and never UNLOCKED (B068)

Chasing that mismatch found something worse than missing vocabulary. ちち and はは
are the headline words of live `ja-m17-neo-1` ("ちちと はは — the words for your
own family"). They are taught there, they are graded there, and they are **never
unlocked**, because their registry rows read
`fromModule: "m8", introducedByLessonId: "ja-m4-1-1"` — a lesson that no longer
exists.

Cross-tab over all 917 SRS-eligible atoms:

| | count |
|---|---|
| graded by a live lesson | 488 |
| unlocked by a live lesson | 208 |
| **graded but never unlocked** | **287** |
| `introducedByLessonId` → a lesson that does not exist | 234 |
| `introducedByLessonId` → a registered but off-map lesson | 20 |

ねこ, いぬ, ひと, なに, やま, あさ, さくら are all in the 287 — core words the neo
lessons drill repeatedly, attributed to deleted lessons (`ja-m1-l1`, `ja-m3-3`).

Two independent causes, both in `fallbackAtomsForLesson`
(`lesson/data/lessonAtomIndex.ts`): it only fires when `lessonToAtoms` has no
entry for the lesson, and it filters on
`!a.introducedByLessonId && a.fromModule === <lesson's module>`. So **(A)** a
dangling or off-map attribution suppresses the fallback forever, and **(B)** an
atom whose legacy `fromModule` differs from the live module teaching it can never
match — and the rewrite renumbered every module, so (B) is systemic.

Why it costs retention: unlock gates **both** review surfaces — the flashcard
course deck (`buildCourseDeck(unlockedIds)`) and every dynamic review pool
(`buildSrsReviewLesson` filters candidates on `getUnlockedAtomIds`). A lesson
grade still creates the FSRS card (`LessonPage` writes regardless of unlock), so
the card exists and can then never be selected again.

**It is already known in exactly one place.** `applyPlacement.ts` (~line 147):
"M8+ atoms carry module-level attribution only (no introducedByLessonId), so the
per-lesson unlock above can't reach them — unlock the seeded atoms directly or SRS
review lessons will skip them", followed by `unlockAtomIds(seededIds)`. That
workaround runs **only for placement-test takers**. A learner who starts from
scratch and walks the course never gets it.

A conformance test asserting that every `introducedByLessonId` names a registered
lesson would have caught the 234 on the day they broke. See B068 for fix options.

**Audit confirmations (2026-07-29):** the independent re-derivation reproduced
917 / 488 / 208 / 287 exactly, and confirmed 208 is not a zero-fallback
artifact (169 unlocked via the static `introducedByLessonId` index + 39 via the
fallback). One boundary correction: `applyPlacement.ts:150` is a genuine second
unlock path — a learner who *tests out* of m17 does unlock 右/左 — so "unlocked
by nothing" is true of the normal course walk only. And per B069, the "dynamic
review pool" half of the cost is currently theoretical: nothing on the live map
reaches `buildSrsReviewLesson`, so the flashcard course deck is the one live
surface the missing unlocks actually gate today.

**FIX SHIPPED (2026-07-29, option 2): 287 → 226.** `lessonAtomIndex.ts`
`isDeadAttribution` — an `introducedByLessonId` the lesson registry cannot
resolve is treated as unset, so the module fallback fires again for cause (A).
Positive-controlled: neutering the check reads 287 exactly. Both counts are now
ratcheted conformance tests in `lessonAtomAttribution.test.ts` ("attribution
integrity (B068)"): `MAX_DANGLING_ATTRIBUTIONS = 234`,
`MAX_GRADED_NEVER_UNLOCKABLE = 226`; `EXPOSURE_REPORT=1` dumps
`/tmp/ja-graded-never-unlockable.txt` and `/tmp/ja-dangling-attributions.txt`.
The 226 residual is cause (B) in both flavours (131 unattributed + 95
dead-attributed, all with a legacy `fromModule` whose live lessons never
surface the word) — cleared only by re-homing `fromModule` to the live teaching
module, which the pack wave does per pack (lower the ratchet in the same
commit). The 20 registered-but-off-map attributions stay honored deliberately:
those lessons remain deep-link completable.

## §5.2 — "Never taught by the course" ≠ "never shown to a learner" (B070)

The instrument walks **lesson content only**. The independent audit found three
live non-lesson surfaces it never scanned, and at least four of the 96 appear
there:

- **`grammarReviewPools.ts:141-143`** authors the `ni-time` pool steps with
  **にちようび / げつようび / どようび** — consumed by
  `useGrammarReviewSession.ts` (SRS write surface #5, `/practice/grammar/review`).
  `ni-time` is introduced in `m11.ir.json`, so any learner past m11 can be shown
  weekday words the course never taught.
- **`ja-reading-passages.ts:116`** (Practice hub) uses どようび and にちようび.
- **`placement/questionBank.ts:803-804`** uses こども.
- **4 of the 96 exist only in off-map, deep-linkable lessons** — コンビニ
  (`ja-m12-kata`), カップ (`ja-m6-kata`), ナイフ/ノート (`ja-m7-kata`/`ja-m8-kata`):
  retired katakana rows still registered in `LESSONS`, reachable via
  `learn/lessons/:id` but from no map tile.

**The gate defect underneath:** `grammarReviewPools.test.ts` gates authored pool
steps on "every content word decomposes into atoms with `fromModule` ≤ the
point's module". どようび's stale `fromModule: "m12"` **passes** that check —
the same stale legacy tagging §1 warns about is what green-lights showing an
untaught word. The test's own `GATE_EXEMPTIONS` comment concedes it "resolves
words through courseAtoms OLD-course fromModule tags". Until the gate resolves
through *live teaching* (e.g. the unlock index or this audit's instrument), it
cannot catch this class. Filed as B070.

## 6. The pack list (2026-07-29, post-audit — Spencer's 7–8 words/lesson ruling)

13 packs cover all 96 never-taught words. Ordering inside the wave follows the
rewrite plan's own `priority` field in `ja-neo-vocab.json` (its frequency + N5
blend) — the weekday/calendar block is the highest-priority debt in the file.
Words marked ⁺ are pulled from the 220 never-*graded* set to complete a cluster
(they appear as stray text somewhere but are never taught or drilled).
Home modules follow §3; every word already has a registry row and TTS.

| # | pack (home module) | words |
|---|---|---|
| 1 | **m11** Weekdays | にちようび, げつようび, かようび, すいようび⁺, もくようび⁺, きんようび, どようび⁺, こんしゅう |
| 2 | **m11** Relative time | ことし, きょねん, まいとし, せんしゅう, せんげつ, らいげつ, おととい, あさって |
| 3 | **m19** Directions | みぎ, ひだり, まっすぐ, まがる, わたる, おりる, むこう, みち |
| 4 | **m19** Around town | たてもの, かいだん, エレベーター, まち, にわ, きょうしつ, コンビニ |
| 5 | **m17** Family & people | こども, おとな, おんな, おんなのこ, おじいさん, おばあさん, たんじょうび, どなた |
| 6 | **m8** Serving & giving | どうぞ, どうも, おさら, コップ, カップ, ナイフ, おべんとう, カレー |
| 7 | **m14** Handling things | あける, しめる, もつ, ひく, とる(取る), とる(撮る), なくす |
| 8 | **m13** Morning routine | おきる, あらう, みがく, せっけん(soap — the vocab-plan file's "economy" gloss is wrong), シャワー, ゆうべ, いちにち, すぐに |
| 9 | **m22** Quantity & comparison | おおい, すくない, すこし, たくさん, もっと, ほか, いろいろ, ちょうど |
| 10 | **m16** Discourse & pointing | しかし, そうして/そして, さあ, また, ゆっくりと, はじめて, そちら, あちら |
| 11 | **m24** Actions & plans | あう, つくる, でかける, えらぶ, いそぐ, はこぶ, かたづける, かける |
| 12 | **m16** Habits & health | すう, たばこ, スポーツ, クラス, はしる, つめたい, たいせつ, けいかん |
| 13 | **m13/m14** School & post + residuals | きって, はがき, ノート, ところ, つぎ — pad to 7–8 with the top of the 220 wave (ほんとう #57, みんな #89, はなし #99, かわいい #219) |

Counts: packs 1–13 teach 96 + 3⁺ (+3–4 from the 220 in pack 13). Extending the
wave to the full 216-real never-graded set is ~15 further packs; measure again
with `EXPOSURE_REPORT=1 npx vitest run atomExposureAudit` after each module
lands — the ratchets (220 / 96) must go DOWN with every pack.

Per-pack mechanics: §3's recipe and its four traps, plus B067's constraint list
(leave `introducedByLessonId` unset; update `fromModule` to the teaching
module; relax the m19 guard test as pack 3 lands; map tile in `mockCourse.ts`).

## 7. Frequency deep-dive (2026-07-29, Spencer's three questions)

### 7.1 The 73 never-graded CEJC top-500 words

Lemma-disambiguated join (kana must match a kana variant, lemma preferred over
duplicate-kana rows, particle rows excluded). By rank: ほんとう57 所69 二70*
後76 みんな89 話99 取る/撮る100 使う103 持つ104 書く110 作る111 自分112
また128 こんな151 にん154 方155 同じ167 多い176 早い/速い184 たいへん188
子供209 悪い213 かわいい219 もっと224 意味226 次231 覚える238 かける242
ほか245 どうぞ252 会う260 読む273 向こう274 そちら279 先288 寝る289 今年292
ちょうど315 あちら331 去年339 少ない343 少し348 夜358 初めて374 開ける389
外396 住む402 熱い421 座る423 走る425 選ぶ431 困る434 横440 結婚441 引く443
男444 吸う448 隣455 たくさん466 止まる477 後ろ483 起きる484 洗う487
女の子488 左491 年494 昼495 右496 降りる500. (*二 stays deliberate.) Pack
coverage: all but ~20 of these are already in the §6 packs; the biggest words
NOT yet packed are the #100–#260 verb/abstract band — 使う, 書く, 読む, 自分,
同じ, 意味, 覚える, こんな, 方, 悪い, 早い/速い, たいへん, 先, 夜, 外, 男,
隣, 横, 困る, 結婚 — which needs ~3 more packs (a "core verbs II", an
"abstract basics", and a "positions/people" pack) or swaps into packs 11–13.

### 7.2 Important beyond the CEJC ranks

- **The weekday/calendar block is the single highest-priority debt by the
  course's own core-6k ordering** (weekdays are 6k #46–54; こんしゅう #65,
  らいねん #67, 一日 #39) — CEJC underrates them because spoken corpora
  compress dates, but no N5 learner survives without them. Packs 1–2 hold.
- **とても (6k #187) is never graded** — the default intensifier; まだ/もう
  band. Also ドア #247, なぜ #536, ニュース #561, 鼻 #385, 風邪 #392,
  弱い #238, 易しい #344, 近く #171, 貼る #193, 閉める #123, 電気 #600.
- **歯 is real but rank-invisible** (not in CEJC-500; kana-collides with
  topic-は in every instrument). Keep it in pack 8 on N5 grounds.
- **Registry-wide gaps (not just ungraded — NO atom exists, checked against
  all 914 registry surfaces with polite-form stem matching):** the giving
  verbs **もらう #98 / くれる #114** appear only in live m30 content and have
  no atom (あげる #171 has atom `ageru` — parked at `fromModule: "future"`, so
  outside every live population); **considerate-register basics** 頑張る #294, 怖い #214, 無理 #251,
  やめる #201, 考える #165, 例えば #223, もし #269, まず #264, ずっと #174,
  さっき #227, 最近 #232, 最初 #200, 結局 #221, 大体 #243, ちゃんと #173,
  この間 #255, 昔 #211, 頃 #295 — all CEJC top-300 with no registry row at
  all. Casual/slang rows (俺, やつ, やばい, まじ, めちゃ, 食う) are
  register-deliberate; the polite course can defer those.

### 7.3 Late-teaching findings (first-graded module vs frequency)

Caveat: first-*graded* lags first-*taught* by 1–2 modules (D2 grades
prior-module words only), and grammar-carrier words are sequenced by grammar,
correctly (こと/とき m15 nominalizers, ほう m20 comparisons, できる m24
potential). After removing those, the real stragglers among TAUGHT words:

- **ぜんぶ(全部) #137 and ぜったい(絶対) #181 first grade in m30** — the last
  module. 全部 is a survival word.
- **なる #39 first grades m27** — partly grammar-driven (に+なる), but #39
  spoken frequency argues for an earlier lexical intro.
- **たぶん #87 → m25, いっしょ(一緒) #160 → m24, いちばん #158 → m26,
  がっこう(学校) #194 → m19, お母さん #189 → m21.** がっこう/お母さん are
  thematically placed (Getting around / Family II) — defensible; たぶん and
  いっしょ have no structural reason to wait.
- **The giving trio (もらう #98, くれる #114, あげる #171) is effectively an
  m30 event** — the politeness machinery of daily Japanese arriving in the
  capstone. Worth a scoping decision of its own (new atoms + a grammar point,
  not a vocab pack).
- Distribution overall is healthy: of 187 taught CEJC-500 words, 63 grade by
  m7, 108 by m14 — the tail above is the exception, not the pattern.
