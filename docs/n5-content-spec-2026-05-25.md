# N5 Content Spec — Full Coverage Plan (2026-05-25)

**Status:** STALE · **Last-verified:** 2026-07-17

Further staleness noted 2026-07-20 (§4). Superseded on module count and
ordering by the draft-4 spine (docs/spine-draft4-2026-07-26.md).

> ⚠️ Kanji sections (§ around lines 92–98) describe `kanji_intro`/`kanji_recognition`
> step types that don't exist and an SRS-state furigana fade that didn't ship; kanji
> shipped as render-time surface substitution from m8 with a module-window (unlock+2)
> furigana fade — see `src/features/languages/ja/secondScript/kanjiRollout.ts`.

Living document. Covers grammar, vocab, kanji, practice features, and module-by-module mapping for complete JLPT N5 coverage across M3-M30.

**Companion files:**
- `src/features/lesson/data/n5-grammar-points.json` — all N5 grammar points with module assignments + status
- `src/features/lesson/data/n5-module-vocab-map.json` — 553 future atoms mapped to target modules
- `docs/practice-features-spec-2026-05-25.md` — implementation specs for 6 practice features
- `docs/n5-content-spec-2026-05-25.md` — original roadmap (this spec supersedes it)
- `docs/n5-vocab-emoji-reference-2026-05-18.md` — emoji assignments for all 662 N5 words

**Audit findings (2026-05-25) — sequencing fixes applied:**
1. **CRITICAL: た-form moved after て-form.** Original spec had た at M10, て at M16 — reversed from ALL major textbooks (Genki, Minna). Fixed: M10 is polite past only (ました/でした), て-form formation moves to M13-M14 range, た-form taught as て→た derivative immediately after.
2. **HIGH: から (because) moved earlier.** Was at M28 (21 modules after learning verbs). Genki teaches it at Lesson 6. Fixed: move to M13-M14 alongside frequency/time grammar.
3. **HIGH: Kanji starts at M8, not M14.** Research consensus: Genki starts kanji at chapter 3 (~50 words). WaniKani is kanji-first. Waiting until M14 (~315 words) is 4-5x later than standard. Fixed: recognition-only kanji parallel track from M8, ~5-8 kanji per module.
4. **MODERATE: ので duplicate removed from M28.** Was listed in both M21 and M28. Keep at M21 only.
5. **MODERATE: あまり/ぜんぜん moved from M9 to M11.** These adverbs require negative predicates, which aren't taught until M11.
6. **MINOR: よ/ね noted for possible M6-M7 backfill.** Currently at M9, slightly late for sentence-final particles.

---

## 1. Current state (as of 2026-05-25)

### What's shipped (M1-M7 + sidequests)
- **196 vocab atoms** taught across M1-M7 + survival sidequest
- **17 grammar points** shipped (particles は/か/の/を/に/で/が/から, copula です/じゃない, demonstratives これ/それ/あれ/どれ, existence あります/います, verb forms dictionary + ます, numbers 1-10)
- **4 partial** grammar points (adjective exposure without conjugation, ください without て-form, どこ without ここ/そこ/あそこ, 人 counter without other counters)
- **553 future N5 atoms** cataloged in `ja-course-atoms.ts` with kana, kanji, romaji, emoji, blocked status

### What N5 demands
- **~800 vocab words** (600-800 depending on source)
- **~70-80 grammar points** (41-100 depending on how verb-form families are counted)
- **~100 kanji** (recognition-only at N5)
- **~42 hours** of in-app study time across 30 modules

### The gap
- **50 grammar points** missing
- **553 vocab atoms** unassigned to modules
- **100 kanji** unbuilt
- **7 counters** beyond 人 needed
- **Numbers 11-10,000** not taught
- **Practice features** for conjugation, speaking, reading passages not built

---

## 2. Backfill items (fix in existing M3-M7)

These should be patched before building M8+.

### 2.1 も (also) — backfill into M4

Unintentional omission. も is the 4th most common particle. Slot it into M4 after の, before demonstratives. Teaching pattern: "Xも Y です" (X is also Y). 2 sub-lesson steps: grammar_rule + 3 particle_cloze rotating は/も/の.

### 2.2 ここ/そこ/あそこ — backfill into M6

Only どこ (where?) is taught in M5. The location demonstrative set (here/there/over there) is a natural extension of M4's これ/それ/あれ and pairs with M6's location theme. Add to M6-1 or M6-2 alongside place nouns.

### 2.3 この/その/あの/どの — early M8 or backfill M4

The adnominal demonstratives ("this X / that X / which X") are the pre-noun cousins of これ/それ/あれ/どれ. Could backfill into M4-3 or slot as M8-1 opener. Recommendation: M8-1 opener — keeps M4 focused on の + noun demonstratives, and gives M8 a concrete grammar anchor before adjective conjugation.

---

## 3. Module-by-module plan (M8-M30)

### Module structure conventions
- **7-9 sub-lessons per module** (2 sub-lessons per topic cluster = intro + practice)
- **20-22 steps per sub-lesson** (matches shipped M1–M7; enforced band 12–25 per `sub-lesson-density.test.ts` — see `lesson-authoring-guide.md` §2). *(Was "10-15"; corrected 2026-06-30 to match the shipped density baseline.)*
- **2 SRS review lessons** per module (recognition-heavy #1, production-heavy #2)
- **1 story/dialogue lesson** per module
- **~25-35 new vocab atoms per module**
- **~3-5 new grammar points per module**

---

### M8 — i-Adjectives + Kanji parallel track begins

**Grammar:**
- この/その/あの/どの (adnominal demonstratives)
- い-adjective present affirmative (formal teaching, not just exposure)
- い-adjective negative: 〜くない (たかい → たかくない)
- と (and, with — noun connector: "コーヒーとパン")

**Vocab targets (~30 atoms):**
- i-adjectives: おおきい, ちいさい, たかい, やすい, あたらしい, ふるい, いい/よい, わるい, おいしい, まずい, あつい, さむい, つめたい, あたたかい/すずしい, ながい, みじかい, おもしろい, つまらない, むずかしい, やさしい, はやい, おそい, ちかい, とおい
- Concrete nouns for context: まち (town), しんぶん (newspaper), テスト (test)

**Kanji (parallel track, ~5-8 per module from here):**
First set: 一 二 三 四 五 六 七 八 九 十 (numbers — learner already knows いち through じゅう from M5). Recognition-only. Furigana shown by default, fades as recognition improves per SRS state. Kanji ONLY appear on words the learner already knows — never on new vocab.

**Kanji-in-lesson policy:**
- Kanji are introduced in dedicated kanji sub-lessons (1-2 per module) using `kanji_intro` + `kanji_recognition` step types
- In regular vocab/grammar lessons, kanji appears ONLY with furigana on words already taught: 水(みず), 本(ほん), 食(た)べる etc.
- Furigana scaffolding: always-on initially → hover-to-reveal after the kanji's SRS recognition state reaches "Good" interval ≥ 3d → hidden after interval ≥ 14d
- The `AnnotatedJa` component already supports furigana; the kanji display policy reads from SRS kanji recognition state
- Learner can override furigana display in Settings (already has `showAlphabetFurigana` toggle)

**New step types:** `dialogue_listen` (already built) used heavily here. `kanji_intro` + `kanji_recognition` (extend symbol_intro/recognition family — see practice-features-spec §2).

**Practice feature note:** Conjugation drill (Practice tab) ships here. Kanji recognition drill (Practice tab) ships here.

---

### M9 — na-Adjectives + Sentence-final particles

**Grammar:**
- な-adjective present: きれいです
- な-adjective negative: きれいじゃないです
- よ (emphasis: "It's delicious, you know!")
- ね (seeking agreement: "It's pretty, right?")

**Vocab targets (~25 atoms):**
- na-adjectives: きれい, しずか, にぎやか, ゆうめい, すき, きらい, じょうず, へた, げんき, ひま, たいへん, べんり, ふべん, だいじょうぶ, かんたん
- Supporting nouns: びょういん (hospital), としょかん (library), プール (pool)
- Adverbs: とても, すこし, ちょっと (NOTE: あまり/ぜんぜん deferred to M11 — they require negative predicates)

**Kanji (~6):** 大 小 高 安 新 古 (all anchor to i-adj already learned in M8: おおきい→大きい, ちいさい→小さい, etc.)

---

### M10 — Past tense (polite forms only — NO た-form)

**Grammar:**
- ます past: たべました
- です past: でした / じゃなかったです
- い-adj past: たかかった / たかくなかった
- な-adj past: きれいでした / きれいじゃなかったです

**NOTE:** た-form (plain past) is NOT taught here. It shares formation rules with て-form, so both are taught together at M14 (て first, た as derivative). M10 focuses solely on polite past forms which are regular and don't require the godan sound-change table.

**Vocab targets (~30 atoms):**
- Time words (past-oriented): きのう, おととい, せんしゅう, せんげつ, きょねん, おととし
- Daily activity verbs: おきる, ねる, あるく, はしる, およぐ, あそぶ, はたらく, べんきょうする, でかける

**Kanji (~6):** 日 月 年 今 先 来 (time kanji — anchor to きのう→昨日 is deferred, but 日→にち/び, 月→がつ/げつ, 年→ねん are wired to M12's time vocab which learners preview here)

**New step types:** `reading_passage` — first use. 3-5 sentence passage in past tense, comprehension MCQs. See practice-features-spec §3.

---

### M11 — Negation

**Grammar:**
- ます negative: たべません
- ます past negative: たべませんでした
- ない-form intro: たべない, のまない (casual negation)
- まだ + もう (still/already aspect markers)
- fill_blank step type woken up for verb-form drills

**Vocab targets (~25 atoms):**
- Frequency adverbs: いつも, よく, ときどき, たいてい, ぜんぜん, あまり (moved here from M9 — these require negative predicates: あまりたべません, ぜんぜんわかりません)
- Negation-context verbs: わかる, しる, もつ, かかる, いる (need)
- Time: いま, まいにち, まいしゅう, まいつき, まいとし

**Kanji (~5):** 人 子 女 男 学 (people — anchor to already-known がくせい→学生, おとこ→男, おんな→女 etc.)

**Practice feature note:** `self_explanation_mcq` deployed here — after particle_cloze with は vs が or ます vs ない, ask "why is this form correct?"

---

### M12 — Time & Calendar (clock + days only — months deferred to M13)

**Grammar:**
- Clock time: 〜じ (hours), 〜ふん/ぷん (minutes)
- Days of the week: げつようび through にちようび
- に (time): "さんじに あいます" (meet at 3:00)
- Numbers 11-99

**Vocab targets (~30 atoms — reduced from 42 by deferring months):**
- Clock: いちじ-じゅうにじ, はん (half), ごぜん, ごご
- Days: げつようび, かようび, すいようび, もくようび, きんようび, どようび, にちようび
- Time expressions: あさ, ひる, よる/ばん, ゆうがた, あした, あさって, こんしゅう, らいしゅう, ことし, らいねん

**Kanji (~6):** 時 分 半 百 千 万 (time + large numbers — anchor to じ→時, ふん→分, はん→半, ひゃく→百, せん→千, まん→万)

**Practice feature note:** Counter drill (Practice tab) ships here — practice irregular time readings (よじ not よんじ, くじ not きゅうじ).

---

### M13 — Months + Frequency + から (because)

**Grammar:**
- Months: いちがつ through じゅうにがつ (absorbed from old M12 — keeps M12 at ~30 vocab)
- Frequency spectrum: いつも → よく → ときどき → あまり〜ない → ぜんぜん〜ない
- から (time-based): "くじから ごじまで" (from 9 to 5)
- から (because — moved here from M28): "あめだから、いきません" (it's raining so I won't go)
- まで (until): pairs with から for time ranges

**NOTE:** から (because) moved from M28. Genki teaches it at Lesson 6. Students need causal reasoning much earlier than M28 — it's one of the highest-leverage grammar points. The time-based から ("from 9 to 5") and the reason から ("because it's raining") are taught in the same module since they share the particle. Lessons clearly differentiate the two uses.

**Vocab targets (~30 atoms):**
- Months: いちがつ through じゅうにがつ
- Routine verbs: おふろにはいる, シャワーをあびる, はをみがく, かおをあらう, ふくをきる, でんきをつける/けす
- Places (daily): かいしゃ, こうじょう, きっさてん

**Kanji (~5):** 火 水 木 金 土 (days-of-week kanji — anchor to かようび→火曜日 etc. Learner already knows the days from M12.)

---

### M14 — Te-form + Ta-form (Formation + Requests)

**Grammar:**
- て-form formation rules (Group 1 / Group 2 / Irregular) — THE core lesson
- た-form as て-form derivative: replace て→た, で→だ (taught immediately after て-form, not as a separate concept)
- 〜てください (request): まってください, みせてください
- Numbers 100-10,000: ひゃく, せん, まん

**NOTE:** て-form and た-form are co-taught here (matching Genki/Minna order). The godan sound-change table is taught ONCE for て-form, then た-form is presented as "same changes, swap て→た" — 5 minutes of instruction. This replaces the old M10 た-form + M16 て-form split that would have taught the table twice.

**Vocab targets (~25 atoms):**
- Request verbs: まつ, みせる, おしえる, てつだう, かす, とる
- Objects: でんわ, カメラ, しゃしん, かぎ, さいふ
- Large numbers: ひゃく, にひゃく, さんびゃく, せん, にせん, いちまん

**Kanji (~6):** 食 飲 見 聞 読 書 (verb kanji — anchor to すでに知っている verbs: たべる→食べる, のむ→飲む, みる→見る, きく→聞く, よむ→読む, かく→書く)

**New step types:** `verb_conjugation` — conjugation table drill. Show dictionary form, learner picks て-form. Critical for te-form mastery. See practice-features-spec §1.

**Counters:** 個 (general), 枚 (flat things), 本 (cylindrical things)

---

### M15 — Te-form applications + Wants & Desires

**Grammar:**
- 〜ている (progressive): たべている, べんきょうしている
- 〜てもいいです (permission): ここにすわってもいいですか
- V-stem + たい (want to do): たべたい, のみたい, いきたい
- がほしい (want a thing): みずがほしい
- けど/けれども (but — basic contrastive): たべたいけど、じかんがない

**NOTE:** ている and てもいい land here (one module after て-form formation in M14), giving learners immediate productive use of their new て-form knowledge. たい and ほしい round out the "express desires" theme.

**Vocab targets (~25 atoms):**
- Progressive context: すむ, もつ, しる
- Desire-context: りょうり (cooking), りょこう (travel), かいもの (shopping), さんぽ (walk/stroll)
- Hobbies preview: おんがく (music), えいが (movie), スポーツ (sports), ゲーム (game)
- Feelings: うれしい, かなしい, さびしい, たのしい

**Kanji (~5):** 行 来 入 出 休 (movement/state kanji — いく→行く, くる→来る, はいる→入る, でる→出る, やすむ→休む)

---

### M16 — Te-form Part 2 (Prohibition + Sequence + ないで)

**Grammar:**
- 〜てはいけません (prohibition): ここでたばこをすってはいけません
- 〜ないでください (negative request): さわらないでください
- 〜てから (after doing): しゅくだいをしてから、テレビをみる
- すき/きらい + のが (like/dislike doing): りょうりをするのがすきです

**Vocab targets (~25 atoms):**
- Permission/prohibition context: すわる, さわる, すう, とめる
- Sequence verbs: かえる, あらう, きがえる, しゅくだい
- Places: きょうしつ, じむしょ, エレベーター, かいだん

**Kanji (~5):** 上 下 中 前 後 (direction/position kanji — うえ→上, した→下, なか→中, まえ→前, うしろ→後ろ)

---

### M17 — Transportation & Directions

**Grammar:**
- で (means of transport): でんしゃでいく
- に (destination, full scope): えきにいく, にほんにいく
- へ (direction — interchangeable with に for movement)
- 〜までに (by the time/deadline)
- まえに (before): しゅっぱつのまえに

**Vocab targets (~30 atoms):**
- Transport: ふね, タクシー, バスてい, くうこう, きっぷ, のりもの
- Directions: まっすぐ, みぎ, ひだり, むこう, そば, ちかく, となり, あいだ
- Movement verbs: のる, おりる, わたる, まがる, とまる

**Practice feature note:** Speaking practice expanded — travel scenario dialogues where the learner speaks their part. Whisper-graded, Pimsleur-style. Could share infrastructure with Travel Sprint sidequest.

---

### M18 — Weather & Nature + でしょう

**Grammar:**
- でしょう (probability): あしたはあめでしょう
- 〜とおもいます (I think): さむいとおもいます
- Adjective + noun modification review (きれいなはな, あかいくるま)

**Vocab targets (~25 atoms):**
- Weather: てんき, はれ, くもり, あめ, ゆき, かぜ, あたたかい, すずしい, むしあつい
- Nature: やま, かわ, うみ, そら, はな, き, もり, にわ
- Seasons: はる, なつ, あき, ふゆ

---

### M19 — Family & People

**Grammar:**
- Family register system: うち vs よそ (my mother = はは, your mother = おかあさん)
- Counter: 〜さい/〜歳 (age)
- 〜にんかぞく (X-person family)

**Vocab targets (~30 atoms):**
- Family (plain/honorific pairs): ちち/おとうさん, はは/おかあさん, あに/おにいさん, あね/おねえさん, おとうと/おとうとさん, いもうと/いもうとさん, そふ/おじいさん, そぼ/おばあさん
- People: おとこのこ, おんなのこ, おとな, こども, あかちゃん, せいと, おまわりさん

---

### M20 — Body & Health

**Grammar:**
- 〜がいたい (hurts): あたまがいたい, おなかがいたい
- Adjective review with body context
- ので (because — softer than から): あたまがいたいので、くすりをのみます

**Vocab targets (~25 atoms):**
- Body: あたま, かお, め, みみ, はな(nose), くち, は(teeth), て, あし, おなか, せなか, ゆび, かみ(hair)
- Health: びょうき, くすり, いしゃ, びょういん, ねつ, かぜ(cold)
- Daily items: せっけん, タオル, ハンカチ, めがね

---

### M21 — Food & Restaurants (expanded)

**Grammar:**
- と (quotation): 「いただきます」というでしょう
- や (incomplete list): パンやたまごをかいます
- Counter: 〜はい/ぱい/ばい (cups/glasses)

**Vocab targets (~30 atoms):**
- Food: たまご, にく, とりにく, さかな, やさい, くだもの, パン, ごはん, おべんとう, りんご, みかん, バナナ
- Drinks: ぎゅうにゅう, ジュース, おちゃ, おさけ/ビール
- Utensils/dining: おさら, ちゃわん, はし, スプーン, フォーク, ナイフ, コップ, カップ

---

### M22 — Comparison

**Grammar:**
- 〜のほうが〜より (A is more than B): にほんのほうがアメリカよりちいさいです
- 〜のなかで〜がいちばん (most among): くだもののなかで、りんごがいちばんすきです
- どちら/どっち (which of two)

**Vocab targets (~25 atoms):**
- Comparison context: おなじ, ちがう, もっと, いちばん
- Country/city names for comparison context
- Abstract: じかん, もんだい, こたえ, しつもん

---

### M23 — Capability & Suggestions

**Grammar:**
- 〜のがじょうずです (good at doing)
- 〜のがへたです (bad at doing)
- 〜ましょう (let's do)
- 〜ませんか (shall we? — invitation)
- ことができる (can do — if time permits, edge N5)

**Vocab targets (~25 atoms):**
- Skills: うんてん (driving), ダンス (dance), ピアノ (piano), すいえい (swimming)
- Activities: うたう (sing), おどる (dance), ひく (play instrument)
- Social: パーティー, やくそく, しょうたい

---

### M24 — Hobbies & Activities

**Grammar:**
- 〜のがすきです (like doing): えいがをみるのがすきです
- 〜たり〜たりする (doing things like X and Y): ほんをよんだり、おんがくをきいたりする
- Counter: 〜かい/回 (times/occurrences)

**Vocab targets (~25 atoms):**
- Hobbies: え (painting), しゃしん (photos), つり (fishing), ハイキング, キャンプ, ジョギング
- Media: テレビ, ラジオ, ざっし, まんが, アニメ
- Actions: あつめる, つくる, なおす, みつける

---

### M25 — Plans & Intentions

**Grammar:**
- つもりです (intend to): にほんにいくつもりです
- 〜にいく (go to do): かいものにいく
- 〜ことがあります (have experienced): ふじさんにのぼったことがあります
- 〜とき (when): こどものとき

**Vocab targets (~25 atoms):**
- Plans context: よてい, けいかく, しゅっぱつ, とうちゃく, りょこう
- Experience context: がいこく, ビーチ, おんせん, まつり, はなび
- Life events: けっこん, そつぎょう, にゅうがく

---

### M26 — Explanatory & Excess

**Grammar:**
- 〜んです (explanatory): どうしたんですか / あたまがいたいんです
- 〜すぎる (too much): たべすぎた、のみすぎた

**NOTE:** から(because) moved to M13. ので stays at M20 (Body & Health context).

**Vocab targets (~20 atoms):**
- Reason context: つかれる, こまる, おくれる, まちがえる, わすれる
- States: ひま, いそがしい, たいへん, だいじょうぶ
- Conjunctions: だから, でも, しかし, それで, そして

---

### M27 — Modal Grammar + Remaining

**Grammar:**
- 〜なければならない / 〜なくちゃ (must do)
- 〜ほうがいい (should / better to)
- 〜く/〜になる (become — adj transformation)

**Vocab targets (~20 atoms):**
- Remaining verbs and nature words not yet placed
- Modal context: しなければならない, いかなければならない

---

### M28 — Consolidation + remaining kanji

**Grammar:**
- No new grammar — consolidation of M8-M27
- Remaining N5 kanji introduced on already-known words
- Cross-module review scenarios

**Vocab targets (~20 atoms):**
- Core 2K gap fill: highest-frequency words not in N5 list but needed for practical Japanese
- Common katakana loanwords: テーブル, ベッド, シャワー, エアコン

---

### M29 — N5 Mastery Capstone

**Grammar:**
- No new grammar — cumulative review
- Full N5 mock test simulation (vocab + grammar + reading + listening sections)
- Timed drill mode matching actual JLPT format (see practice-features-spec §6)

**Vocab targets:** None new — review only

**Practice feature note:** Mock test mode in Practice — timed N5 simulation with all 3 sections. Score breakdown. Replayable.

---

## 4. Vocab roll-up

| Module | Theme | New vocab | Kanji | Cumulative vocab |
|--------|-------|-----------|-------|-----------------|
| M3-M7 | (existing) | 196 | 0 | 196 |
| M8 | i-Adjectives + kanji start | ~30 | 10 (一-十) | ~226 |
| M9 | na-Adjectives | ~25 | 6 (大小高安新古) | ~251 |
| M10 | Polite past (no た-form) | ~30 | 6 (日月年今先来) | ~281 |
| M11 | Negation | ~25 | 5 (人子女男学) | ~306 |
| M12 | Time + days (no months) | ~30 | 6 (時分半百千万) | ~336 |
| M13 | Months + frequency + から(because) | ~30 | 5 (火水木金土) | ~366 |
| M14 | Te-form + ta-form + counters | ~25 | 6 (食飲見聞読書) | ~391 |
| M15 | ている + てもいい + wants | ~25 | 5 (行来入出休) | ~416 |
| M16 | Te-form Part 2 + すき/きらい | ~25 | 5 (上下中前後) | ~441 |
| M17 | Transportation | ~30 | 5 (北南東西左右) | ~471 |
| M18 | Weather & Nature + でしょう | ~25 | 5 (山川海雨花) | ~496 |
| M19 | Family | ~30 | 5 (父母兄姉友) | ~526 |
| M20 | Body & Health + ので | ~25 | 5 (口目耳手足) | ~551 |
| M21 | Food expanded | ~30 | 4 (魚肉茶店) | ~581 |
| M22 | Comparison | ~25 | 3 (長白黒) | ~606 |
| M23 | Capability + suggestions | ~25 | 3 (生先名) | ~631 |
| M24 | Hobbies | ~25 | 3 (電車駅) | ~656 |
| M25 | Plans + intentions | ~25 | 3 (校園国) | ~681 |
| M26 | Causality + んです | ~20 | 2 (外天) | ~701 |
| M27 | Modal + remaining grammar | ~20 | 2 (気語) | ~721 |
| M28 | Consolidation + remaining kanji | ~20 | remaining | ~741 |
| M29 | N5 capstone | 0 | 0 | ~741 |

**Gap to 800:** ~59 words. Fill from Core 2K by frequency. Candidates: common katakana loanwords, remaining everyday nouns, useful expressions not in the N5 list but high-frequency in real Japanese. Distribute across M22-M28 as "fluency layer" additions.

**Kanji total in spine:** ~93 across M8-M28 (recognition-only). Remaining ~7 N5 kanji go in a sidequest module or ★ review additions.

---

## 5. Grammar roll-up (revised 2026-05-25 post-audit)

| Module | New grammar points | Cumulative |
|--------|-------------------|------------|
| M3-M7 | 17 | 17 |
| Backfill | も, ここ/そこ/あそこ | 19 |
| M8 | この/その/あの/どの, i-adj present (formal), i-adj negative, と | 23 |
| M9 | na-adj present/negative, よ, ね | 27 |
| M10 | Polite past (ました/でした/i-adj past/na-adj past) — NO た-form | 31 |
| M11 | ない-form, ません, ませんでした, まだ/もう | 35 |
| M12 | Time に, numbers 11-99, counters 時/分 | 38 |
| M13 | Months, frequency, まで, から(time), **から(because)** | 43 |
| M14 | **て-form, た-form (derivative), てください**, numbers 100-10000, counters 個/枚/本 | 49 |
| M15 | **ている, てもいい**, たい, ほしい, けど | 54 |
| M16 | てはいけない, ないでください, てから, すき/きらい+の | 58 |
| M17 | へ, で(transport), までに, まえに | 62 |
| M18 | でしょう, とおもいます | 64 |
| M19 | Family register, 〜さい | 66 |
| M20 | がいたい, ので | 68 |
| M21 | と(quote), や, counter 杯 | 71 |
| M22 | より, いちばん, どちら | 74 |
| M23 | じょうず/へた, ましょう, ませんか | 77 |
| M24 | のがすき, たり〜たりする | 79 |
| M25 | つもり, にいく, ことがある, とき | 83 |
| M26 | んです, すぎる | 85 |
| M27 | なければならない, ほうがいい, になる | 88 |

**Final count: ~88 grammar points.** から(because) moved to M13, て/た consolidated at M14, ので stays at M20. Covers the full JLPT Sensei 84-point list + practical extras.

---

## 6. Kanji plan

**Distributed across M8-M28 (parallel track, ~5-8 per module):**

Kanji are introduced ONLY on words the learner already knows. Each module's kanji sub-lesson connects new characters to familiar vocabulary. Recognition-only — no productive writing required at N5.

| Module | Count | Characters | Anchor words (already known) |
|--------|-------|------------|------------------------------|
| M8 | 10 | 一二三四五六七八九十 | いち→一, に→二, ... じゅう→十 (from M5) |
| M9 | 6 | 大小高安新古 | おおきい→大きい, ちいさい→小さい (from M8) |
| M10 | 6 | 日月年今先来 | にちようび→日曜日, げつようび→月曜日 (from M12 preview) |
| M11 | 5 | 人子女男学 | がくせい→学生, おとこ→男 (from M3-M4) |
| M12 | 6 | 時分半百千万 | じ→時, ふん→分, はん→半 (from M12 grammar) |
| M13 | 5 | 火水木金土 | かようび→火曜日 (from M12), みず→水 (from M3) |
| M14 | 6 | 食飲見聞読書 | たべる→食べる, のむ→飲む (from M7) |
| M15 | 5 | 行来入出休 | いく→行く, くる→来る (from M7+) |
| M16 | 5 | 上下中前後 | うえ→上, した→下 (from M6 location vocab) |
| M17 | 6 | 北南東西左右 | directions (from M18 transport context) |
| M18 | 5 | 山川海雨花 | やま→山, かわ→川, うみ→海 (from M18-M19) |
| M19 | 5 | 父母兄姉友 | ちち→父, はは→母 (from M19-M20 family) |
| M20 | 5 | 口目耳手足 | くち→口, め→目, て→手 (from M20-M21 body) |
| M21 | 4 | 魚肉茶店 | さかな→魚, にく→肉 (from M21-M22 food) |
| M22-M28 | ~14 | 長白黒生先名電車駅校園国外天気語 | distributed with vocab themes |
| **Total** | **~93** | | |
| Sidequest | ~7 | remaining N5 kanji | optional enrichment |

**Furigana scaffolding (critical — how kanji appears in regular lessons):**

Kanji never appears "naked" on a word the learner hasn't seen before. The progression:

1. **Before kanji intro:** word appears in kana only (みず, たべる)
2. **After kanji intro (SRS interval < 3d):** word appears as 水(みず), 食(た)べる — furigana always visible
3. **After SRS interval ≥ 3d:** furigana shows on hover/tap only — learner expected to recognize
4. **After SRS interval ≥ 14d:** furigana hidden entirely (but always available in Settings toggle)

Implementation: `AnnotatedJa` already supports ruby rendering. Add a `kanjiMastery` lookup (from `lingo:kanji-practice` localStorage state) that controls furigana visibility per character. The Settings toggle `showAlphabetFurigana` overrides to always-show.

---

## 7. Practice features needed

These live in the Practice tab and are authored alongside the module content.

### 7.1 Conjugation Practice (build with M8, extend through M29)

**Surface:** Show a verb/adjective in base form. Learner picks or types the requested conjugation.

**Modes:**
- **i-adjective drill** (M8+): base → negative / past / past-negative
- **na-adjective drill** (M9+): base → negative / past / past-negative
- **Verb ます drill** (M10+): dictionary → ます / ました / ません / ませんでした
- **Verb ない drill** (M11+): dictionary → ない form
- **Verb て drill** (M16+): dictionary → て form (the big one)
- **Mixed mode** (M17+): random verb, random target form

**Implementation:** New route `/practice/conjugation`. Reuses MCQ rendering for pick-mode, text input for type-mode. Draws from course atoms tagged with verb group (Group 1 / Group 2 / Irregular). Tracks accuracy per verb × form.

**Unit test:** Assert conjugation table correctness for all shipped verbs. Test irregular readings (いく → いって, する → して, くる → きて).

### 7.2 Speaking Practice (expand from M8)

**Surface:** Pimsleur-style drills. Listen to a prompt, speak the response. Whisper-graded.

**Modes:**
- **Echo mode**: Hear a phrase, repeat it
- **Response mode**: Hear a question in Japanese, speak the answer
- **Scenario mode**: Travel/daily life situations (extends Travel Sprint infrastructure)

**Implementation:** New route `/practice/speaking`. Reuses `SpeakingStepView` rendering + Whisper grading. Generates prompts from course atoms + grammar patterns. Could share lesson infrastructure with Travel Sprint sidequests.

### 7.3 Reading Practice (build with M10)

**Surface:** Short passages (3-8 sentences) using known vocab + grammar. Comprehension MCQs.

**Implementation:** Requires `reading_passage` step type. New route `/practice/reading`. Passages curated per module level. Furigana toggle. Difficulty scales with module progress.

### 7.4 Listening Practice (expand from M8)

**Surface:** Multi-turn dialogues and monologues. Comprehension MCQs.

**Implementation:** Reuses `dialogue_listen` step type (already built). New route `/practice/listening`. Generates from a pool of scenario dialogues tagged by module level.

### 7.5 Counter Practice (build with M12)

**Surface:** Show an image (3 bottles, 2 dogs, etc.) + counter type. Learner picks the correct counter reading.

**Implementation:** MCQ-based. Special attention to irregular readings (さんぼん not さんほん, etc.). Reuses word_image_mcq rendering with counter-specific logic.

### 7.6 Mock Test (build with M30)

**Surface:** Full N5 simulation — Vocabulary (20 min), Grammar+Reading (40 min), Listening (30 min). Timed. Score breakdown.

**Implementation:** New route `/practice/mock-test`. Draws from the full atom pool. Reading passages and listening dialogues from a curated test bank. Timer UI.

---

## 8. Core 2K gap fill strategy

After placing all 553 N5 atoms + the existing 196 taught atoms = 749 atoms, we're at ~761 vocab by M29. The target is ~800.

**Strategy:** Pull the top ~40-50 highest-frequency words from the Core 2000 list that are NOT already in the N5 atom set. These tend to be:
- Common katakana loanwords used daily (テーブル, ベッド, シャワー, エアコン, コンビニ)
- High-frequency nouns missing from N5 lists (でんき, まど, かべ, ゆか, てんじょう)
- Common expressions (すみません variants, ちょっとすみません, しつれいします, おつかれさまです)

These go into M28-M29 as "fluency layer" additions, or into a "Daily Japanese" sidequest.

---

## 9. Sequencing concerns / things to move

### 9.1 も particle — fix now
Backfill into M4 or M5. Currently the most glaring omission.

### 9.2 Adjective exposure in M3 → formal teaching in M8
M3 exposes adjectives (あかい, あおい, おおきい) without conjugation rules. This is intentional — M8 formally teaches i-adj conjugation. No move needed, but M8's intro should acknowledge "you've seen these before."

### 9.3 から dual meaning
M5 ships から as "from" (origin). M13 teaches から as "because" (reason). These are genuinely different grammar points taught in the same module to leverage the shared particle. Lessons clearly differentiate the two uses with distinct examples and self_explanation_mcq follow-ups.

### 9.4 が existence-only → full subject marker
M6 teaches が through あります/います only. The full は vs が distinction is deferred. This is correct per the roadmap — forcing は/が contrast at M6 would be premature. The contrast emerges naturally as more grammar accumulates. Consider a dedicated は/が contrast lesson as a sidequest around M15.

### 9.5 build_sentence sunset
M5-M7 have `BUILD_SENTENCE_SUNSET_MODULES` which strips build steps. The 2026-05-18 rebuild removed this (empty set), but the mechanism exists. For M8+, substitute with `translate` (MCQ) + `listening_build` + `speaking` per the roadmap recommendation.

---

## 10. Implementation order

**Phase 1 — Backfill + Infrastructure (before M8 authoring)**
1. Backfill も into M4
2. Backfill ここ/そこ/あそこ into M6
3. Build conjugation practice surface (Practice tab)
4. Build `reading_passage` step type
5. Build `verb_conjugation` step type
6. Build `kanji_intro` / `kanji_recognition` step types

**Phase 2 — M8-M11 (Adjectives + Past + Negation + Kanji start)**
7. Author M8 content (i-adj + kanji numbers 一-十)
8. Author M9 content (na-adj + kanji 大小高安新古)
9. Author M10 content (polite past — NO た-form) + reading practice
10. Author M11 content (negation) + self_explanation_mcq deployment
11. TTS generation for M8-M11 vocab
12. Unit tests for M8-M11

**Phase 3 — M12-M16 (Time + Te-form + Desires)**
13. Author M12 (clock + days + kanji 時分半百千万)
14. Author M13 (months + frequency + から-because + kanji 火水木金土)
15. Author M14 (て-form + た-form — densest content + kanji 食飲見聞読書)
16. Author M15 (ている + てもいい + wants + kanji 行来入出休)
17. Author M16 (te-form pt2 + kanji 上下中前後)
18. Build counter practice
19. TTS + tests

**Phase 4 — M17-M21 (Transport + Weather + Family + Body + Food)**
20. Author M17-M21
21. Expand speaking practice
22. TTS + tests

**Phase 5 — M22-M29 (Comparison + Capability + Plans + Capstone)**
23. Author M22-M29
24. Build mock test mode
25. Core 2K gap fill
26. Final TTS + tests
27. Full N5 coverage audit

---

## 11. Open questions

1. **は/が contrast lesson** — dedicated sidequest, or woven into M15-M16 organically?
2. **Typed kana input** — Path A (MCQ-only translate) now, Path B (typed input) later? Or skip typed input entirely for N5?
3. **Kanji sidequest** — the remaining ~48 kanji after the 52 in-spine. Separate sidequest module or thread into ★ review lessons?
4. **Core 2K selection** — which specific words to pull? Need frequency data cross-referenced against existing atom set.
5. **Practice feature priority** — conjugation drill (M8) vs reading practice (M10) vs speaking expansion (M8)? All three are high-value but conjugation is probably highest-leverage.
