# N5 Content Spec — Full Coverage Plan (2026-05-25)

Living document. Covers grammar, vocab, kanji, practice features, and module-by-module mapping for complete JLPT N5 coverage across M3-M30.

**Companion files:**
- `src/features/lesson/data/n5-grammar-points.json` — all N5 grammar points with module assignments + status
- `src/features/lesson/data/n5-module-vocab-map.json` — 553 future atoms mapped to target modules
- `docs/curriculum-roadmap-n5-2026-05-18.md` — original roadmap (still valid, this spec refines it)
- `docs/n5-vocab-emoji-reference-2026-05-18.md` — emoji assignments for all 662 N5 words

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
- **10-15 steps per sub-lesson** (~4 min each)
- **2 SRS review lessons** per module (recognition-heavy #1, production-heavy #2)
- **1 story/dialogue lesson** per module
- **~25-35 new vocab atoms per module**
- **~3-5 new grammar points per module**

---

### M8 — i-Adjectives (い-adjective conjugation)

**Grammar:**
- この/その/あの/どの (adnominal demonstratives)
- い-adjective present affirmative (formal teaching, not just exposure)
- い-adjective negative: 〜くない (たかい → たかくない)
- と (and, with — noun connector: "コーヒーとパン")

**Vocab targets (~30 atoms):**
- i-adjectives: おおきい, ちいさい, たかい, やすい, あたらしい, ふるい, いい/よい, わるい, おいしい, まずい, あつい, さむい, つめたい, あたたかい/すずしい, ながい, みじかい, おもしろい, つまらない, むずかしい, やさしい, はやい, おそい, ちかい, とおい
- Concrete nouns for context: まち (town), しんぶん (newspaper), テスト (test)

**New step types:** `dialogue_listen` (already built) used heavily here

**Practice feature note:** Adjective conjugation drill in Practice tab — show base form, learner picks/types the requested conjugation (present → negative → past → past negative). Reusable for na-adj in M9, verbs in M10+.

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
- Adverbs: とても, すこし, ちょっと, あまり

**Practice feature note:** Same conjugation drill surface — extend to support na-adj pattern.

---

### M10 — Past tense

**Grammar:**
- ます past: たべました
- です past: でした / じゃなかったです
- い-adj past: たかかった / たかくなかった
- な-adj past: きれいでした / きれいじゃなかったです
- た-form (dictionary form past — conceptual intro, not て-form derivation yet)

**Vocab targets (~30 atoms):**
- Time words (past-oriented): きのう, おととい, せんしゅう, せんげつ, きょねん, おととし
- Daily activity verbs: おきる, ねる, あるく, はしる, およぐ, あそぶ, はたらく, べんきょうする, でかける

**New step types:** `reading_passage` — 3-5 sentence passage in past tense, comprehension MCQs. First use here.

**Practice feature note:** Reading practice in Practice tab — curated passages by module level, comprehension MCQs, furigana toggle. Reusable for all M10+ content.

---

### M11 — Negation

**Grammar:**
- ます negative: たべません
- ます past negative: たべませんでした
- ない-form intro: たべない, のまない (casual negation)
- まだ + もう (still/already aspect markers)
- fill_blank step type woken up for verb-form drills

**Vocab targets (~25 atoms):**
- Frequency adverbs: いつも, よく, ときどき, たいてい, ぜんぜん
- Negation-context verbs: わかる, しる, もつ, かかる, いる (need)
- Time: いま, まいにち, まいしゅう, まいつき, まいとし

**Practice feature note:** `self_explanation_mcq` deployed here — after particle_cloze with は vs が or ます vs ない, ask "why is this form correct?"

---

### M12 — Time & Calendar

**Grammar:**
- Clock time: 〜じ (hours), 〜ふん/ぷん (minutes)
- Days of the week: げつようび through にちようび
- Months: いちがつ through じゅうにがつ
- に (time): "さんじに あいます" (meet at 3:00)
- Numbers 11-99

**Vocab targets (~40 atoms — high-volume module):**
- Clock: いちじ-じゅうにじ, はん (half), ごぜん, ごご
- Days: げつようび, かようび, すいようび, もくようび, きんようび, どようび, にちようび
- Months: いちがつ through じゅうにがつ (compound number+month)
- Time expressions: あさ, ひる, よる/ばん, ゆうがた, あした, あさって, こんしゅう, らいしゅう, こんげつ, らいげつ, ことし, らいねん

**Practice feature note:** Clock reading drill in Practice — show analog/digital clock, pick/type the Japanese time reading. Counter drill — practice irregular time readings (よじ not よんじ, etc.).

---

### M13 — Frequency & Daily routines

**Grammar:**
- Frequency spectrum: いつも → よく → ときどき → あまり〜ない → ぜんぜん〜ない
- から (time-based): "くじから ごじまで" (from 9 to 5)
- まで (until): pairs with から for time ranges
- に (frequency): "いっしゅうかんに さんかい" (3 times a week)

**Vocab targets (~30 atoms):**
- Routine verbs: おふろにはいる, シャワーをあびる, はをみがく, かおをあらう, ふくをきる, でんきをつける/けす
- Places (daily): かいしゃ, こうじょう, きっさてん, こうえん
- Transport: でんしゃ, バス, じてんしゃ, くるま, ひこうき, ちかてつ

---

### M14 — Kanji Set 1 (Numbers + Time) + Numbers 100-10,000

**Grammar:**
- Numbers 100-10,000: ひゃく, せん, まん
- Counters: 個 (general), 枚 (flat things), 本 (cylindrical things)
- Kanji recognition: 一二三四五六七八九十百千万日月年時分半

**Vocab targets (~25 atoms):**
- Large numbers: ひゃく, にひゃく, さんびゃく, せん, にせん, いちまん
- Counter words with irregular readings
- Kanji anchor vocab (words that use the new kanji in context)

**New step types:** `kanji_intro` + `kanji_recognition` — extend symbol_intro/recognition family

**Practice feature note:** Kanji recognition drill in Practice — show kanji, pick reading or meaning. Flashcard-style with SRS. Counter practice — show "3 bottles" image, pick さんぼん vs さんほん vs さんぽん.

---

### M15 — Wants & Desires

**Grammar:**
- V-stem + たい (want to do): たべたい, のみたい, いきたい
- がほしい (want a thing): みずがほしい
- すき/きらい + のが (like/dislike doing): りょうりをするのがすきです
- けど/けれども (but — basic contrastive): たべたいけど、じかんがない

**Vocab targets (~25 atoms):**
- Desire-context: りょうり (cooking), りょこう (travel), かいもの (shopping), さんぽ (walk/stroll)
- Hobbies preview: おんがく (music), えいが (movie), スポーツ (sports), ゲーム (game)
- Feelings: うれしい, かなしい, さびしい, たのしい

---

### M16 — Te-form Part 1 (Formation + Requests + Progressive)

**Grammar:**
- て-form formation rules (Group 1 / Group 2 / Irregular)
- 〜てください (request): まってください, みせてください
- 〜ている (progressive): たべている, べんきょうしている
- を/で/に rotation with て-form verbs

**Vocab targets (~30 atoms):**
- Request verbs: まつ, みせる, おしえる, てつだう, かす, とる
- Progressive context: すむ, はたらく, もつ, しる
- Objects: でんわ, カメラ, しゃしん, かぎ, さいふ

**New step types:** `verb_conjugation` — conjugation table drill. Show dictionary form, learner picks て-form. Critical for te-form mastery.

**Practice feature note:** Conjugation practice in Practice tab — verb conjugation drill across all learned forms. Show dictionary form → pick ます/ない/た/て form. Track accuracy per verb group. This is the highest-leverage practice feature for N5.

---

### M17 — Te-form Part 2 (Permission + Prohibition + Sequence)

**Grammar:**
- 〜てもいいです (permission): ここにすわってもいいですか
- 〜てはいけません (prohibition): ここでたばこをすってはいけません
- 〜ないでください (negative request): さわらないでください
- 〜てから (after doing): しゅくだいをしてから、テレビをみる

**Vocab targets (~25 atoms):**
- Permission/prohibition context: すわる, さわる, すう, とめる, はいる, でる
- Sequence verbs: かえる, あらう, きがえる, しゅくだい
- Places: きょうしつ, じむしょ, エレベーター, かいだん

---

### M18 — Transportation & Directions

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

### M19 — Weather & Nature + でしょう

**Grammar:**
- でしょう (probability): あしたはあめでしょう
- 〜とおもいます (I think): さむいとおもいます
- Adjective + noun modification review (きれいなはな, あかいくるま)

**Vocab targets (~25 atoms):**
- Weather: てんき, はれ, くもり, あめ, ゆき, かぜ, あたたかい, すずしい, むしあつい
- Nature: やま, かわ, うみ, そら, はな, き, もり, にわ
- Seasons: はる, なつ, あき, ふゆ

---

### M20 — Family & People

**Grammar:**
- Family register system: うち vs よそ (my mother = はは, your mother = おかあさん)
- Counter: 〜さい/〜歳 (age)
- 〜にんかぞく (X-person family)

**Vocab targets (~30 atoms):**
- Family (plain/honorific pairs): ちち/おとうさん, はは/おかあさん, あに/おにいさん, あね/おねえさん, おとうと/おとうとさん, いもうと/いもうとさん, そふ/おじいさん, そぼ/おばあさん
- People: おとこのこ, おんなのこ, おとな, こども, あかちゃん, せいと, おまわりさん

---

### M21 — Body & Health

**Grammar:**
- 〜がいたい (hurts): あたまがいたい, おなかがいたい
- Adjective review with body context
- ので (because — softer than から): あたまがいたいので、くすりをのみます

**Vocab targets (~25 atoms):**
- Body: あたま, かお, め, みみ, はな(nose), くち, は(teeth), て, あし, おなか, せなか, ゆび, かみ(hair)
- Health: びょうき, くすり, いしゃ, びょういん, ねつ, かぜ(cold)
- Daily items: せっけん, タオル, ハンカチ, めがね

---

### M22 — Food & Restaurants (expanded)

**Grammar:**
- と (quotation): 「いただきます」というでしょう
- や (incomplete list): パンやたまごをかいます
- Counter: 〜はい/ぱい/ばい (cups/glasses)

**Vocab targets (~30 atoms):**
- Food: たまご, にく, とりにく, さかな, やさい, くだもの, パン, ごはん, おべんとう, りんご, みかん, バナナ
- Drinks: ぎゅうにゅう, ジュース, おちゃ, おさけ/ビール
- Utensils/dining: おさら, ちゃわん, はし, スプーン, フォーク, ナイフ, コップ, カップ

---

### M23 — Kanji Set 2 (Body + Family + Food + common verbs)

**Grammar:**
- Kanji recognition drill (no new grammar — consolidation)
- 人男女子父母兄姉口目耳手足食飲

**Vocab targets:** No new vocab — kanji anchor words drawn from M20-M22 vocab

---

### M24 — Comparison

**Grammar:**
- 〜のほうが〜より (A is more than B): にほんのほうがアメリカよりちいさいです
- 〜のなかで〜がいちばん (most among): くだもののなかで、りんごがいちばんすきです
- どちら/どっち (which of two)

**Vocab targets (~25 atoms):**
- Comparison context: おなじ, ちがう, もっと, いちばん
- Country/city names for comparison context
- Abstract: じかん, もんだい, こたえ, しつもん

---

### M25 — Capability & Suggestions

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

### M26 — Hobbies & Activities

**Grammar:**
- 〜のがすきです (like doing): えいがをみるのがすきです
- 〜たり〜たりする (doing things like X and Y): ほんをよんだり、おんがくをきいたりする
- Counter: 〜かい/回 (times/occurrences)

**Vocab targets (~25 atoms):**
- Hobbies: え (painting), しゃしん (photos), つり (fishing), ハイキング, キャンプ, ジョギング
- Media: テレビ, ラジオ, ざっし, まんが, アニメ
- Actions: あつめる, つくる, なおす, みつける

---

### M27 — Plans & Intentions

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

### M28 — Causality & Reasoning

**Grammar:**
- 〜から (because): あめだから、いきません
- 〜ので (because, softer): つかれたので、はやくねました
- 〜んです (explanatory): どうしたんですか / あたまがいたいんです
- 〜すぎる (too much): たべすぎた、のみすぎた

**Vocab targets (~20 atoms):**
- Reason context: つかれる, こまる, おくれる, まちがえる, わすれる
- States: ひま, いそがしい, たいへん, だいじょうぶ
- Conjunctions: だから, でも, しかし, それで, そして

---

### M29 — Kanji Set 3 (Verbs + Nature) + ない-form deepening

**Grammar:**
- 〜なければならない / 〜なくちゃ (must do)
- 〜ほうがいい (should / better to)
- 〜く/〜になる (become — adj transformation)
- Kanji: 見聞言行来食飲読書山川海雨花水火木金土

**Vocab targets (~20 atoms):**
- Remaining verbs and nature words not yet placed
- Kanji anchor words

---

### M30 — N5 Mastery Capstone

**Grammar:**
- No new grammar — cumulative review
- Full N5 mock test simulation (vocab + grammar + reading + listening sections)
- Timed drill mode matching actual JLPT format

**Vocab targets:** None new — review only

**Practice feature note:** Mock test mode in Practice — timed N5 simulation with all 3 sections. Score breakdown. Replayable.

---

## 4. Vocab roll-up

| Module | Theme | New vocab | Cumulative |
|--------|-------|-----------|------------|
| M3-M7 | (existing) | 196 | 196 |
| M8 | i-Adjectives | ~30 | ~226 |
| M9 | na-Adjectives | ~25 | ~251 |
| M10 | Past tense | ~30 | ~281 |
| M11 | Negation | ~25 | ~306 |
| M12 | Time & Calendar | ~40 | ~346 |
| M13 | Frequency | ~30 | ~376 |
| M14 | Kanji Set 1 | ~25 | ~401 |
| M15 | Wants & Desires | ~25 | ~426 |
| M16 | Te-form Part 1 | ~30 | ~456 |
| M17 | Te-form Part 2 | ~25 | ~481 |
| M18 | Transportation | ~30 | ~511 |
| M19 | Weather & Nature | ~25 | ~536 |
| M20 | Family | ~30 | ~566 |
| M21 | Body & Health | ~25 | ~591 |
| M22 | Food expanded | ~30 | ~621 |
| M23 | Kanji Set 2 | 0 | ~621 |
| M24 | Comparison | ~25 | ~646 |
| M25 | Capability | ~25 | ~671 |
| M26 | Hobbies | ~25 | ~696 |
| M27 | Plans | ~25 | ~721 |
| M28 | Causality | ~20 | ~741 |
| M29 | Kanji Set 3 | ~20 | ~761 |
| M30 | Capstone | 0 | ~761 |

**Gap to 800:** ~39 words. Fill from Core 2K by frequency. Candidates: common katakana loanwords, remaining everyday nouns, useful expressions not in the N5 list but high-frequency in real Japanese.

---

## 5. Grammar roll-up

| Module | New grammar points | Cumulative |
|--------|-------------------|------------|
| M3-M7 | 17 | 17 |
| Backfill | も, ここ/そこ/あそこ | 19 |
| M8 | この/その/あの/どの, i-adj negative, と | 22 |
| M9 | na-adj present/negative, よ, ね | 26 |
| M10 | Past tense (ます/です/i-adj/na-adj/た-form) | 31 |
| M11 | ない-form, ません, ませんでした, まだ/もう | 35 |
| M12 | Time に, numbers 11-99, counters 時/分 | 38 |
| M13 | Frequency, まで, から(time) | 41 |
| M14 | Numbers 100-10000, counters 個/枚/本 | 44 |
| M15 | たい, ほしい, すき/きらい+の, けど | 48 |
| M16 | て-form, てください, ている | 51 |
| M17 | てもいい, てはいけない, ないで, てから | 55 |
| M18 | へ, までに, まえに | 58 |
| M19 | でしょう, とおもいます | 60 |
| M20 | Family register, 〜さい | 62 |
| M21 | がいたい, ので | 64 |
| M22 | と(quote), や, counter 杯 | 67 |
| M24 | より, いちばん, どちら | 70 |
| M25 | じょうず/へた, ましょう, ませんか | 73 |
| M26 | のがすき, たり〜たりする | 75 |
| M27 | つもり, にいく, ことがある, とき | 79 |
| M28 | から(because), ので, んです, すぎる | 83 |
| M29 | なければならない, ほうがいい, になる | 86 |

**Final count: ~86 grammar points** — covers the full JLPT Sensei 84-point list + a few extras.

---

## 6. Kanji plan

**3 kanji modules (M14, M23, M29) + optional sidequest:**

| Module | Kanji count | Characters | Category |
|--------|-------------|------------|----------|
| M14 | 18 | 一二三四五六七八九十百千万日月年時分半 | Numbers + time |
| M23 | 16 | 人男女子父母兄姉口目耳手足食飲水 | Body + family + food |
| M29 | 18 | 見聞言行来読書山川海雨花火木金土上下 | Verbs + nature + directions |
| **Total in spine** | **52** | | |
| Sidequest | ~48 | 大小高安新古長白赤青北南東西中外前後左右入出休学校先生車電話 etc. | Common N5 remainder |

Recognition-only. No productive writing required at N5. The sidequest kanji module unlocks after M23 for learners who want to go deeper before M29.

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
M5 ships から as "from" (origin). M28 teaches から as "because" (reason). These are genuinely different grammar points. No conflict — just needs clear lesson copy distinguishing them.

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

**Phase 2 — M8-M11 (Adjectives + Past + Negation)**
7. Author M8 content (i-adj)
8. Author M9 content (na-adj)
9. Author M10 content (past tense) + reading practice
10. Author M11 content (negation) + self_explanation_mcq deployment
11. TTS generation for M8-M11 vocab
12. Unit tests for M8-M11

**Phase 3 — M12-M15 (Time + Kanji + Desires)**
13. Author M12-M15 content
14. Build kanji step types
15. Build counter practice
16. TTS generation
17. Unit tests

**Phase 4 — M16-M19 (Te-form + Transport + Weather)**
18. Author M16-M17 (te-form — the densest content)
19. Build verb_conjugation step type (if not done in Phase 1)
20. Author M18-M19
21. Expand speaking practice
22. TTS + tests

**Phase 5 — M20-M23 (Family + Body + Food + Kanji 2)**
23. Author M20-M23
24. TTS + tests

**Phase 6 — M24-M30 (Comparison + Capability + Plans + Capstone)**
25. Author M24-M30
26. Build mock test mode
27. Core 2K gap fill
28. Final TTS + tests
29. Full N5 coverage audit

---

## 11. Open questions

1. **は/が contrast lesson** — dedicated sidequest, or woven into M15-M16 organically?
2. **Typed kana input** — Path A (MCQ-only translate) now, Path B (typed input) later? Or skip typed input entirely for N5?
3. **Kanji sidequest** — the remaining ~48 kanji after the 52 in-spine. Separate sidequest module or thread into ★ review lessons?
4. **Core 2K selection** — which specific words to pull? Need frequency data cross-referenced against existing atom set.
5. **Practice feature priority** — conjugation drill (M8) vs reading practice (M10) vs speaking expansion (M8)? All three are high-value but conjugation is probably highest-leverage.
