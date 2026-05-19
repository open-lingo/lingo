# JLPT N5 Vocab → Emoji Reference (2026-05-18)

Reference for future M8-M30 curriculum authoring. **662 N5 words** sourced from [wkei/jlpt-vocab-api](https://github.com/wkei/jlpt-vocab-api). Emoji assignments produced by 4 Opus subagents in parallel, applying the same rubric as [`emoji-blocked-words-2026-05-18.md`](./emoji-blocked-words-2026-05-18.md).

## Pair with

- **[emoji-blocked-words-2026-05-18.md](./emoji-blocked-words-2026-05-18.md)** — the rubric + end-to-end authoring workflow. Read this first if you're authoring a new vocab word.
- **[n5-vocab-emoji-map-2026-05-18.json](./n5-vocab-emoji-map-2026-05-18.json)** — same 662 entries, machine-readable.

## Source files (single source of truth for runtime behavior)

| File | Role |
|---|---|
| `src/shared/assets/notoEmoji.ts` | `notoEmojiUrl(emoji)` URL resolver (zero-pads keycaps, routes regional-indicators to flag dir) + `lingoArtUrl(kana)` custom-art override |
| `src/features/lesson/data/_jaGrammarHelpers.ts` | `WORD_IMAGE_MCQ_BLOCKLIST` (set of kana that throw if targeted by visual MCQ) + `withoutMcqBlocked(pool)` (filters review pools before seeded pick) |
| `src/features/lesson/components/steps/WordImageMcqStepView.tsx` | View: tries `lingoArtUrl(opt.word) ?? notoEmojiUrl(opt.emoji)` |
| `src/pub/noto-emoji/svg/` | 155 vendored Noto SVGs (Apache 2.0, no attribution) |
| `src/pub/lingo-art/svg/` | 9 custom Lingo SVGs (MIT, no attribution) — desk, today, room, shop, photo, sky, hundred, magazine, which |
| `src/pub/region-flags/svg/` | Country flags (wave-style, public-domain via Noto third_party) |

## Stats

- **Total:** 662
- **Mapped (Noto emoji + style-OK):** 512 (77.3%)
- **Blocked (no honest visual referent — use phrase_card / cloze / listening):** 149 (22.5%)
- **No-fit (custom art needed):** 1 — テーブル "table" (no Noto table glyph; commission a custom SVG when M-whatever introduces it)
- **Noto URL HEAD-check:** 512/512 render (after ½ → 🌗 swap for 半 "half").

## How to use this doc

1. When authoring a new M8+ lesson, find your target vocab below.
2. If `blocked: false` and an emoji is listed, use it as the `emoji` field in your `RowWord` / `ReviewAtom`.
3. If `blocked: true`, the word is **image-MCQ-unsafe** — register it in `WORD_IMAGE_MCQ_BLOCKLIST` and teach via `phrase_card` / `particle_cloze` / `listening_build` / `dialogue_listen` only.
4. The same emoji may legitimately appear on multiple words at different specificity (朝 / 今朝 / 毎朝 all → 🌅). Author distractor pools per-lesson — don't try to globally disambiguate.
5. Cross-check against `_jaGrammarHelpers.ts` `M3_M7_REVIEW_POOL` for existing M1-M7 assignments before locking a choice.

## Mapped (512)

| Word | Kana | Meaning | Emoji | Note |
|---|---|---|---|---|
| 毎朝 | まいあさ | every morning | 🌅 | sunrise reads as morning |
| 問題 | もんだい | problem | ❓ | question mark as problem proxy |
| お茶 | おちゃ | green tea | 🍵 |  ⚠ already authored in M1-M7 |
| 黒 | くろ | black | ⬛ | black square |
| 台所 | だいどころ | kitchen | 🍳 | cooking pan stands in for kitchen |
| 葉書 | はがき | postcard | 📮 | postbox as proxy for postcard |
| ペン |  | pen | 🖊️ |  |
| ニュース |  | news | 📰 | newspaper as news proxy |
| 花瓶 | かびん | a vase | 🏺 | amphora — closest Noto vase |
| フォーク |  | fork | 🍴 |  |
| 引く | ひく | to pull | 🪝 | hook implies pulling |
| フィルム |  | roll of film | 🎞️ |  |
| 磨く | みがく | to brush teeth, to polish | 🪥 | toothbrush |
| 押す | おす | to push, to stamp something | 👆 | pointing/pushing finger |
| 売る | うる | to sell | 🏷️ | price tag as sell proxy |
| 電気 | でんき | electricity, electric light | 💡 | light bulb covers electric light |
| 病気 | びょうき | illness | 🤒 | face with thermometer |
| ポケット |  | pocket | 👖 | jeans as pocket proxy |
| はし |  | chopsticks | 🥢 |  |
| 英語 | えいご | English language | 🇺🇸 | US flag — wired via separate flag dir |
| 家 | いえ | house | 🏠 |  ⚠ already authored in M1-M7 |
| 暑い | あつい | hot | 🥵 | hot face |
| 遊ぶ | あそぶ | to play, to make a visit | 🎲 | die as play proxy |
| 取る | とる | to take something | 🤲 | open hands receiving |
| 九 | きゅう / く | nine | 9️⃣ |  |
| 奥さん | おくさん | (honorable) wife | 👰 | bride stands in for wife |
| 作文 | さくぶん | composition, writing | 📝 |  |
| 便利 | べんり | useful, convenient | 🛠️ | tools as useful proxy |
| 右 | みぎ | right side | ➡️ |  |
| 寒い | さむい | cold | 🥶 | cold face |
| あびる |  | to bathe, to shower | 🚿 |  |
| 十 | じゅう  とお | ten | 🔟 |  |
| 消す | けす | to erase, to turn off power | 🧽 | sponge as erase proxy |
| 近く | ちかく | near | 📍 | pin as near-here proxy |
| 七つ | ななつ | seven | 7️⃣ |  |
| テープレコーダー |  | tape recorder | 📼 | videocassette — closest cassette glyph |
| 目 | め | eye | 👁️ |  ⚠ already authored in M1-M7 |
| 空 | そら | sky | ☁️ | cloud as sky proxy ⚠ already authored in M1-M7 |
| 座る | すわる | to sit | 🪑 | chair as sitting proxy |
| 年 | とし | year | 📅 | calendar as year proxy |
| 男の子 | おとこのこ | boy | 👦 |  |
| 冷蔵庫 | れいぞうこ | refrigerator | 🧊 | ice cube as cold-storage proxy |
| カメラ |  | camera | 📷 |  |
| 玄関 | げんかん | entry hall | 🚪 | door as entry proxy |
| 違う | ちがう | to differ | ❌ | X as 'wrong/different' proxy |
| 危ない | あぶない | dangerous | ⚠️ |  |
| 言う | いう | to say | 💬 | speech bubble |
| 飲む | のむ | to drink | 🥤 | cup with straw |
| 練習 | れんしゅうする | to practice | 📓 | notebook as practice proxy |
| 黒い | くろい | black | ⬛ | adjective form of 黒 — shares glyph |
| 登る | のぼる | to climb | 🧗 | person climbing |
| 雨 | あめ | rain | 🌧️ |  |
| お皿 | おさら | plate, dish | 🍽️ | plate-with-utensils |
| 速い | はやい | quick | 💨 | dashing-away motion lines |
| お風呂 | おふろ | bath | 🛁 |  |
| 新しい | あたらしい | new | 🆕 |  |
| 茶色 | ちゃいろ | brown | 🟫 | brown square |
| コート |  | coat, tennis court | 🧥 | coat (primary sense) |
| 手紙 | てがみ | letter | ✉️ |  ⚠ already authored in M1-M7 |
| スプーン |  | spoon | 🥄 |  |
| 傘 | かさ | umbrella | ☂️ |  ⚠ already authored in M1-M7 |
| いい / よい |  | good | 👍 | thumbs up as good proxy |
| 電話 | でんわ | telephone | 📞 |  ⚠ already authored in M1-M7 |
| 勤める | つとめる | to work for someone | 💼 | briefcase as employment proxy |
| 安い | やすい | cheap | 🪙 | coin as cheap/small-money proxy |
| 道 | みち | street | 🛣️ | motorway as street proxy |
| バス |  | bus | 🚌 |  |
| クラス |  | class | 🏫 | school as class proxy |
| スポーツ |  | sport | ⚽ | soccer ball as sport proxy |
| 新聞 | しんぶん | newspaper | 📰 |  ⚠ already authored in M1-M7 |
| 庭 | にわ | garden | 🌳 | tree as garden proxy |
| 大きな | おおきな | big | 🐘 | elephant as big proxy |
| 辺 | へん | area | 🗺️ | map as area proxy |
| 番号 | ばんごう | number | 🔢 |  |
| 家族 | かぞく | family | 👨‍👩‍👧 | ZWJ family — renders in Noto |
| 下手 | へた | unskillful | 👎 | thumbs down as unskillful proxy |
| 料理 | りょうり | cuisine | 🍱 | bento as cuisine proxy ⚠ already authored in M1-M7 |
| カレー |  | curry | 🍛 |  |
| 六 | ろく | six | 6️⃣ |  ⚠ already authored in M1-M7 |
| 風邪 | かぜ | a cold | 🤧 | sneezing face ⚠ already authored in M1-M7 |
| 赤い | あかい | red | 🟥 | red square |
| 甘い | あまい | sweet | 🍬 | candy as sweet proxy |
| 西 | にし | west | 🧭 | compass — west direction |
| 五つ | いつつ | five | 5️⃣ |  |
| 建物 | たてもの | building | 🏢 |  |
| まっすぐ |  | straight ahead, direct | ⬆️ | up arrow as straight-ahead direction |
| 作る | つくる | to make | 🔨 | hammer as making/building proxy |
| 風 | かぜ | wind | 🌬️ | wind face ⚠ already authored in M1-M7 |
| 少し | すこし | few | 🤏 | pinching hand as small-amount proxy |
| 大学 | だいがく | university | 🎓 | graduation cap |
| シャツ |  | shirt | 👕 |  |
| 病院 | びょういん | hospital | 🏥 |  ⚠ already authored in M1-M7 |
| 会社 | かいしゃ | company | 🏢 | office building |
| スリッパ |  | slippers | 🥿 | flat shoe — closest slipper glyph |
| 地下鉄 | ちかてつ | underground train | 🚇 |  ⚠ already authored in M1-M7 |
| ページ |  | page | 📄 |  |
| 曇る | くもる | to become cloudy, to become dim | ☁️ | cloud — also used for 空 sky, mild collision |
| 辞書 | じしょ | dictionary | 📖 | open book ⚠ already authored in M1-M7 |
| 万年筆 | まんねんひつ | fountain pen | 🖋️ | fountain pen — exact match |
| 海 | うみ | sea | 🌊 | wave ⚠ already authored in M1-M7 |
| エレベーター |  | elevator | 🛗 |  |
| 夕方 | ゆうがた | evening | 🌇 | sunset over buildings |
| 声 | こえ | voice | 🗣️ | speaking head ⚠ already authored in M1-M7 |
| 撮る | とる | to take a photo or record a film | 📸 | camera with flash |
| 両親 | りょうしん | both parents | 👪 | family glyph implies parents |
| きれい |  | pretty, clean | ✨ | sparkles as clean/pretty proxy |
| どうぞ |  | please | 🙏 | folded hands |
| 好き | すき | likeable | ❤️ | heart |
| 静か | しずか | quiet | 🤫 | shushing face |
| 人 | ひと | person | 🧑 | gender-neutral person ⚠ already authored in M1-M7 |
| 覚える | おぼえる | to remember | 🧠 | brain |
| 休み | やすみ | rest, holiday | 😴 | sleeping face as rest proxy |
| 池 | いけ | pond | 🦆 | duck implies pond |
| 始まる | はじまる | to begin | ▶️ | play button as start proxy |
| 困る | こまる | to be worried | 😟 | worried face |
| ちゃわん |  | rice bowl | 🍚 | cooked rice in bowl |
| 疲れる | つかれる | to get tired | 😩 | weary face |
| 掃除 | そうじする | to clean, to sweep | 🧹 | broom |
| 賑やか | にぎやか | bustling, busy | 🎉 | party popper as lively proxy |
| 一つ | ひとつ | one | 1️⃣ |  |
| 財布 | さいふ | wallet | 👛 | purse — closest wallet glyph |
| 教える | おしえる | to teach, to tell | 👨‍🏫 | teacher ZWJ glyph |
| 朝御飯 | あさごはん | breakfast | 🍳 | fried egg — also used for 台所; mild collision |
| 飛ぶ | とぶ | to fly, to hop | 🕊️ | dove as flying proxy |
| 言葉 | ことば | word, language | 🔤 | ABC input symbol as language proxy |
| キロ / キログラム |  | kilogram | ⚖️ | balance scale as weight proxy |
| 赤 | あか | red | 🟥 | red square — shares with 赤い |
| デパート |  | department store | 🏬 |  |
| 帰る | かえる | to go back | 🏠 | home as return-destination cue |
| 卵 | たまご | egg | 🥚 |  |
| 低い | ひくい | short, low | ⬇️ | down arrow as low cue (weak; ⬆️ used for 上) |
| 時間 | じかん | time | ⏰ |  ⚠ already authored in M1-M7 |
| 上げる | あげる | to give | 🎁 | gift as giving cue |
| ふろ |  | bath | 🛁 |  |
| 生徒 | せいと | pupil | 🎒 | backpack as pupil cue |
| レストラン |  | restaurant | 🍽️ |  |
| 出す | だす | to put out | 📤 | outbox tray as put-out cue |
| かわいい |  | cute | 🥰 |  |
| 音楽 | おんがく | music | 🎵 |  |
| 歌 | うた | song | 🎤 | microphone as song cue (music note taken) ⚠ already authored in M1-M7 |
| いちばん |  | best, first | 🥇 |  |
| 咲く | さく | to bloom | 🌷 | tulip; avoid 🌸 per rubric (cherry blossom specific) |
| 山 | やま | mountain | ⛰️ |  ⚠ already authored in M1-M7 |
| テレビ |  | television | 📺 |  |
| 授業 | じゅぎょう | lesson, class work | 👨‍🏫 | teacher as class cue |
| 暖かい | あたたかい | warm | ☀️ | sun as warmth cue |
| セーター |  | sweater, jumper | 🧥 |  |
| 自転車 | じてんしゃ | bicycle | 🚲 |  ⚠ already authored in M1-M7 |
| ラジカセ / ラジオカセット |  | radio cassette player | 📻 |  |
| つける |  | to turn on | 💡 | lightbulb as turn-on cue |
| 学校 | がっこう | school | 🏫 |  ⚠ already authored in M1-M7 |
| 四 | し / よん | four | 4️⃣ |  |
| 入る | はいる | to enter, to contain | 🚪 | door as entering cue |
| 曇り | くもり | cloudy weather | ☁️ |  |
| 外国 | がいこく | foreign country | 🌏 | globe as foreign-country cue |
| どうも |  | thanks | 🙏 |  |
| 仕事 | しごと | job | 💼 |  |
| 窓 | まど | window | 🪟 |  |
| 晩 | ばん | evening | 🌆 |  |
| 難しい | むずかしい | difficult | 😖 | confounded face as difficulty cue |
| 村 | むら | village | 🏘️ |  |
| 鉛筆 | えんぴつ | pencil | ✏️ |  |
| 長い | ながい | long | 📏 | ruler as length cue |
| 生まれる | うまれる | to be born | 👶 |  |
| 雑誌 | ざっし | magazine | 📖 | open book as magazine proxy ⚠ already authored in M1-M7 |
| 国 | くに | country | 🗾 | Japan map as country cue (concrete shape) |
| おまわりさん |  | friendly term for policeman | 👮 |  |
| 今朝 | けさ | this morning | 🌅 | sunrise as morning cue (loses 'this' nuance — phrase context needed) |
| 晴れる | はれる | to be sunny | 🌞 |  |
| 夕飯 | ゆうはん | dinner | 🍽️ |  |
| 一緒 | いっしょ | together | 👫 |  |
| 立つ | たつ | to stand | 🧍 |  |
| 元気 | げんき | health, vitality | 💪 | flexed bicep as vitality cue ⚠ already authored in M1-M7 |
| 天気 | てんき | weather | ⛅ | sun-behind-cloud as generic weather cue |
| 医者 | いしゃ | medical doctor | 👨‍⚕️ |  |
| 七 | しち / なな | seven | 7️⃣ |  |
| はく |  | to wear, to put on trousers | 👖 | jeans as put-on-trousers cue |
| 戸 | と | Japanese style door | 🚪 |  |
| ノート |  | notebook, exercise book | 📓 |  |
| 今日 | きょう | today | 📅 | calendar as today cue ⚠ already authored in M1-M7 |
| 文章 | ぶんしょう | sentence, text | 📝 |  |
| 公園 | こうえん | park | 🏞️ |  ⚠ already authored in M1-M7 |
| 借りる | かりる | to borrow | 🤝 | handshake as borrow/lend cue (weak but acceptable) |
| 口 | くち | mouth, opening | 👄 |  |
| 持つ | もつ | to hold | ✊ | fist as holding cue |
| 上着 | うわぎ | jacket | 🧥 |  |
| 秋 | あき | autumn | 🍂 |  |
| 悪い | わるい | bad | 👎 |  |
| 青い | あおい | blue | 🟦 |  ⚠ already authored in M1-M7 |
| 住む | すむ | to live in | 🏠 | house as live-in cue |
| かける |  | to call by phone | 📞 |  |
| 忘れる | わすれる | to forget | 🤔 | thinking face as memory-lapse cue (weak) |
| お手洗い | おてあらい | bathroom | 🚻 |  |
| 写真 | しゃしん | photograph | 📷 |  ⚠ already authored in M1-M7 |
| ゼロ |  | zero | 0️⃣ |  |
| いろいろ |  | various | 🌈 | rainbow as variety cue |
| 会う | あう | to meet | 🤝 |  |
| 南 | みなみ | south | ⬇️ | down-arrow as south cue (map convention) |
| 着る | きる | to put on from the shoulders down | 👕 | shirt as put-on cue |
| 終る | おわる | to finish | 🏁 | checkered flag as finish cue |
| 読む | よむ | to read | 📖 |  ⚠ already authored in M1-M7 |
| 果物 | くだもの | fruit | 🍎 | apple as fruit cue |
| 止まる | とまる | to come to a halt | 🛑 |  |
| 着く | つく | to arrive at | 🛬 | landing plane as arrival cue |
| 大好き | だいすき | to be very likeable | ❤️ | heart as love cue |
| 妹 | いもうと | (humble) younger sister | 👧 | younger-girl approximation; sister relation context-dependent |
| 夏 | なつ | summer | 🌻 | sunflower as summer cue (☀️ taken for warm) |
| 今晩 | こんばん | this evening | 🌃 | night scene as evening cue (loses 'this' nuance) |
| 塩 | しお | salt | 🧂 |  |
| 欲しい | ほしい | want | 🤲 | cupped hands as wanting cue (weak) |
| 木 | き | tree, wood | 🌳 |  ⚠ already authored in M1-M7 |
| 薬 | くすり | medicine | 💊 |  |
| お菓子 | おかし | sweets, candy | 🍬 |  |
| まずい |  | unpleasant | 🤢 | nauseated face for bad-taste cue |
| お酒 | おさけ | alcohol, rice wine | 🍶 |  ⚠ already authored in M1-M7 |
| 動物 | どうぶつ | animal | 🐾 | paw prints as animal cue |
| 切符 | きっぷ | ticket | 🎫 |  |
| 呼ぶ | よぶ | to call out, to invite | 📣 | megaphone as call-out cue |
| 体 | からだ | body | 🧍 |  ⚠ already authored in M1-M7 |
| ゆっくりと |  | slowly | 🐢 | turtle as slowness cue |
| 大人 | おとな | adult | 🧑 |  |
| 歯 | は | tooth | 🦷 |  |
| 冬 | ふゆ | winter | ❄️ |  |
| 吹く | ふく | to blow | 💨 | wind-puff as blowing cue |
| 足 | あし | foot, leg | 🦶 |  |
| 箱 | はこ | box | 📦 |  |
| 八 | はち | eight | 8️⃣ |  ⚠ already authored in M1-M7 |
| 朝 | あさ | morning | 🌅 |  ⚠ already authored in M1-M7 |
| 有名 | ゆうめい | famous | ⭐ | star as fame cue |
| 近い | ちかい | near | 📍 | map pin as proximity cue (weak) |
| 時計 | とけい | watch, clock | ⌚ |  ⚠ already authored in M1-M7 |
| 午後 | ごご | afternoon | 🌇 | late-day cityscape as afternoon cue |
| 食べ物 | たべもの | food | 🍱 | bento as food cue |
| 降る | ふる | to fall, e.g. rain or snow | 🌧️ | rain cloud as falling-rain cue |
| 大使館 | たいしかん | embassy | 🏛️ | classical building as embassy cue |
| 上 | うえ | on top of | ⬆️ | up arrow as 'on top of' cue ⚠ already authored in M1-M7 |
| 五 | ご | five | 5️⃣ |  ⚠ already authored in M1-M7 |
| プール |  | swimming pool | 🏊 | swimmer as pool cue |
| 肉 | にく | meat | 🥩 |  |
| 零 | れい | zero | 0️⃣ |  |
| 豚肉 | ぶたにく | pork | 🥓 | bacon as pork cue |
| 広い | ひろい | spacious, wide | 🏜️ | open desert as spacious cue (weak) |
| 靴下 | くつした | socks | 🧦 |  |
| 一人 | ひとり | one person | 🧍 | single standing figure as one-person cue ⚠ already authored in M1-M7 |
| かぎ |  | key | 🔑 |  |
| 上手 | じょうず | skillful | 👌 | OK-hand as skillful cue |
| 牛肉 | ぎゅうにく | beef | 🐄 | cow as beef cue (🥩 taken for generic meat) |
| 話 | はなし | talk, story | 💬 |  |
| 毎晩 | まいばん | every night | 🌙 | moon as night cue (frequency lost — phrase context needed) |
| 三つ | みっつ | three | 3️⃣ |  |
| 吸う | すう | to smoke, to suck | 🚬 | cigarette as smoke cue |
| 銀行 | ぎんこう | bank | 🏦 |  ⚠ already authored in M1-M7 |
| 大切 | たいせつ | important | ❗ | exclamation as importance cue |
| 学生 | がくせい | student | 🎓 |  ⚠ already authored in M1-M7 |
| 部屋 | へや | room | 🚪 | door as room proxy; concrete spatial referent ⚠ already authored in M1-M7 |
| 昼御飯 | ひるごはん | midday meal | 🍱 | bento reads as midday meal |
| 下 | した | below | ⬇️ | directional concrete |
| 二つ | ふたつ | two | 2️⃣ |  |
| 百 | ひゃく | hundred | 💯 |  ⚠ already authored in M1-M7 |
| 地図 | ちず | map | 🗺️ |  |
| 八百屋 | やおや | greengrocer | 🥬 | leafy greens stand-in for greengrocer |
| ネクタイ |  | tie, necktie | 👔 |  |
| 乗る | のる | to get on, to ride | 🚗 | car as ride proxy |
| 弟 | おとうと | younger brother | 👦 | boy reads younger-male; pair w/ kanji |
| 緑 | みどり | green | 🟢 |  |
| とり肉 | とりにく | chicken meat | 🍗 |  |
| 軽い | かるい | light | 🪶 | feather = light weight |
| 帽子 | ぼうし | hat | 🎩 |  ⚠ already authored in M1-M7 |
| 丈夫 | じょうぶ | strong, durable | 💪 | flexed arm for strong/durable |
| 入れる | いれる | to put in | 📥 | inbox tray = put in |
| 二十歳 | はたち | 20 years old, 20th year | 🔞 | age-20 milestone; Japanese coming-of-age |
| 遠い | とおい | far | 🔭 | telescope = far / distant |
| 夏休み | なつやすみ | summer holiday | 🏖️ |  |
| 友達 | ともだち | friend | 👫 |  ⚠ already authored in M1-M7 |
| 横 | よこ | beside, side, width | ↔️ | horizontal arrow for side/width |
| 冷たい | つめたい | cold to the touch | 🧊 | ice cube |
| 夜 | よる | evening, night | 🌙 |  |
| トイレ |  | toilet | 🚽 |  |
| おなか |  | stomach | 🫃 |  |
| 暇 | ひま | free time | 🛋️ | couch = leisure/free time |
| 鳴く | なく | animal noise. to chirp, roar or croak etc. | 🐦 | bird as canonical chirper |
| 先生 | せんせい | teacher, doctor | 🧑‍🏫 |  ⚠ already authored in M1-M7 |
| 出口 | でぐち | exit | 🚪 | door — paired w/ kanji 出 |
| テープ |  | tape | 📼 |  |
| お姉さん | おねえさん | (honorable) older sister | 👩 | woman; kanji 姉 carries 'older' |
| 本 | ほん | book | 📖 |  ⚠ already authored in M1-M7 |
| 泳ぐ | およぐ | to swim | 🏊 |  |
| 灰皿 | はいざら | ashtray | 🚬 | cigarette as proxy; closest concrete |
| 門 | もん | gate | ⛩️ | torii reads as Japanese gate |
| 荷物 | にもつ | luggage | 🧳 |  |
| 書く | かく | to write | ✍️ |  |
| ホテル |  | hotel | 🏨 |  |
| 降りる | おりる | to get off, to descend | ⬇️ | down-arrow = descend |
| 重い | おもい | heavy | 🏋️ | weightlifter = heavy |
| 電車 | でんしゃ | electric train | 🚆 |  ⚠ already authored in M1-M7 |
| 痛い | いたい | painful | 🤕 |  |
| 話す | はなす | to speak | 🗣️ |  |
| りっぱ |  | splendid | ✨ | sparkles = splendid/admirable |
| つまらない |  | boring | 🥱 | yawn = boredom |
| 嫌 | いや | unpleasant | 🤢 | disgust face = unpleasant |
| 宿題 | しゅくだい | homework | 📝 |  |
| 死ぬ | しぬ | to die | 💀 |  |
| みんな |  | everyone | 👥 |  |
| 映画 | えいが | movie | 🎬 |  |
| 遅い | おそい | late, slow | 🐢 | turtle = slow |
| 耳 | みみ | ear | 👂 |  |
| 四つ | よっつ | four | 4️⃣ |  |
| 机 | つくえ | desk | 🪑 | chair-adjacent; closest furniture glyph (no desk emoji) ⚠ already authored in M1-M7 |
| 買う | かう | to buy | 🛒 |  |
| 開く | あく | to open, to become open | 🔓 | unlocked = becoming open |
| 教室 | きょうしつ | classroom | 🏫 | school; closest concrete |
| かばん |  | bag, basket | 👜 |  |
| マッチ |  | match | 🔥 | fire as match-strike proxy (no match-stick emoji) |
| 短い | みじかい | short | 📏 | ruler for length adjectives |
| 姉 | あね | (humble) older sister | 👩 | woman; kanji 姉 carries older cue ⚠ already authored in M1-M7 |
| 大勢 | おおぜい | great number of people | 👨‍👩‍👧‍👦 | family cluster = many people |
| 開ける | あける | to open | 🔓 | transitive open |
| 忙しい | いそがしい | busy, irritated | 😰 | anxious sweat = busy/overwhelmed |
| おばあさん |  | grandmother, female senior-citizen | 👵 |  |
| 店 | みせ | shop | 🏪 |  ⚠ already authored in M1-M7 |
| 北 | きた | north | 🧭 | compass for cardinal direction |
| ラジオ |  | radio | 📻 |  |
| すぐに |  | instantly | ⚡ | lightning = instant |
| 橋 | はし | bridge | 🌉 |  |
| 川 / 河 | かわ | river | 🏞️ |  ⚠ already authored in M1-M7 |
| バター |  | butter | 🧈 |  |
| もっと |  | more | ➕ | plus = more |
| 入口 | いりぐち | entrance | 🚪 | door + kanji 入 |
| 自動車 | じどうしゃ | automobile | 🚙 |  |
| 昼 | ひる | noon, daytime | ☀️ | sun = daytime |
| 色 | いろ | colour | 🎨 | palette = colour ⚠ already authored in M1-M7 |
| 黄色 | きいろ | yellow | 🟡 |  |
| 左 | ひだり | left hand side | 👈 |  |
| 野菜 | やさい | vegetable | 🥕 |  |
| シャワー |  | shower | 🚿 |  |
| 散歩 | さんぽする | to stroll | 🚶 |  |
| 三 | さん | three | 3️⃣ |  ⚠ already authored in M1-M7 |
| 消える | きえる | to disappear | 💨 | puff = vanish |
| 映画館 | えいがかん | cinema | 🎦 |  |
| いす |  | chair | 🪑 |  |
| 誕生日 | たんじょうび | birthday | 🎂 |  |
| 切る | きる | to cut | ✂️ |  |
| 洗う | あらう | to wash | 🧼 | soap = wash |
| グラム |  | gram | ⚖️ | scale = mass unit |
| 習う | ならう | to learn | 🎓 |  |
| 猫 | ねこ | cat | 🐱 |  ⚠ already authored in M1-M7 |
| 図書館 | としょかん | library | 📚 |  ⚠ already authored in M1-M7 |
| 大きい | おおきい | big | 🐘 | elephant = big (size adjective) |
| 歩く | あるく | to walk | 🚶 |  |
| ズボン |  | trousers | 👖 |  |
| たて |  | length, height | 📏 | ruler = measurement |
| カップ |  | cup | 🥤 |  |
| 頼む | たのむ | to ask | 🙏 | request gesture |
| お兄さん | おにいさん | (honorable) older brother | 👨 | man + kanji 兄 |
| 手 | て | hand | ✋ |  ⚠ already authored in M1-M7 |
| ええ |  | yes | ✅ |  |
| 花 | はな | flower | 🌸 |  ⚠ already authored in M1-M7 |
| 一 | いち | one | 1️⃣ |  ⚠ already authored in M1-M7 |
| 砂糖 | さとう | sugar | 🍬 | candy as sugar proxy |
| カレンダー |  | calendar | 📅 |  |
| 今 | いま | now | ⏰ | clock = now/time |
| 旅行 | りょこう | travel | ✈️ |  |
| 春 | はる | spring | 🌸 | cherry blossom = spring |
| 八つ | やっつ | eight | 8️⃣ |  |
| 町 | まち | town, city | 🏘️ |  |
| 渡す | わたす | to hand over | 🤝 | handshake/handoff |
| 青 | あお | blue | 🔵 |  |
| 白 | しろ | white | ⚪ |  |
| ベッド |  | bed | 🛏️ |  |
| 水 | みず | water | 💧 |  ⚠ already authored in M1-M7 |
| 楽しい | たのしい | enjoyable | 😄 |  |
| 御飯 | ごはん | cooked rice, meal | 🍚 |  ⚠ already authored in M1-M7 |
| 皆さん | みなさん | everyone | 👥 | synonym of みんな |
| おいしい |  | delicious | 😋 |  |
| ペット |  | pet | 🐕 | dog as canonical pet |
| 外 | そと | outside | 🌳 | tree = outdoors |
| おもしろい |  | interesting | 🤩 | starstruck = fascinated/interesting |
| 貸す | かす | to lend | 🤝 | handshake reads as exchange/lend |
| 早い | はやい | early | ⏰ | alarm clock for early |
| 弱い | よわい | weak | 🪶 | feather connotes weak/light |
| 洗濯 | せんたく | washing | 🧺 | laundry basket |
| 九つ | ここのつ | nine | 9️⃣ |  |
| 来年 | らいねん | next year | 📅 | calendar; pair with phrase context |
| 眼鏡 | めがね | glasses | 👓 |  ⚠ already authored in M1-M7 |
| 背 | せ | height, stature | 📏 | ruler for stature |
| 水曜日 | すいようび | Wednesday | 📅 | generic calendar |
| お金 | おかね | money | 💰 |  ⚠ already authored in M1-M7 |
| 同じ | おなじ | same | 🟰 | equals sign |
| 弾く | ひく | to play an instrument with strings, including piano | 🎹 | piano keys |
| 土曜日 | どようび | Saturday | 📅 | generic calendar |
| 階段 | かいだん | stairs | 🪜 | ladder; closest Noto for stairs |
| 煩い | うるさい | noisy, annoying | 📢 | loudspeaker = noisy |
| 半分 | はんぶん | half minute | 🌗 | half symbol \| swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half') |
| 背広 | せびろ | business suit | 🤵 | person in suit |
| 晴れ | はれ | clear weather | ☀️ | sun |
| 見せる | みせる | to show | 👀 | eyes — showing/look at this |
| 飲み物 | のみもの | a drink | 🥤 |  |
| 雪 | ゆき | snow | ❄️ |  ⚠ already authored in M1-M7 |
| 買い物 | かいもの | shopping | 🛍️ |  |
| 交差点 | こうさてん | intersection | 🚦 | traffic light for intersection |
| 駅 | えき | station | 🚉 | station emoji ⚠ already authored in M1-M7 |
| 大丈夫 | だいじょうぶ | all right | 👌 | OK sign |
| ボールペン |  | ball-point pen | 🖊️ |  |
| 勉強 | べんきょうする | to study | 📚 | books |
| 兄弟 | きょうだい | (humble) siblings | 👫 | two people; siblings |
| 封筒 | ふうとう | envelope | ✉️ |  |
| レコード |  | record | 💿 | optical disc; record-like |
| コーヒー |  | coffee | ☕ |  |
| 漢字 | かんじ | Chinese character | 🈶 | Japanese ideograph block |
| 喫茶店 | きっさてん | coffee lounge | ☕ | coffee cup; café |
| 子供 | こども | child | 🧒 |  |
| 女の子 | おんなのこ | girl | 👧 |  |
| 紙 | かみ | paper | 📄 |  |
| 字引 | じびき | dictionary | 📖 | open book |
| あさって |  | day after tomorrow | 📅 | calendar; pair with phrase context |
| 嫌い | きらい | hate | 🙅 | person gesturing no |
| 答える | こたえる | to answer | 🙋 | raising hand |
| 食堂 | しょくどう | dining hall | 🍽️ | plate with utensils |
| コピーする |  | to copy | 📑 | stacked copies |
| 働く | はたらく | to work | 💼 | briefcase |
| ドア |  | Western style door | 🚪 |  |
| 見る  観る | みる | to see, to watch | 👁️ |  |
| 交番 | こうばん | police box | 🚓 | police car; closest Noto for police context |
| ナイフ |  | knife | 🔪 |  |
| 辛い | からい | spicy | 🌶️ |  |
| 洋服 | ようふく | western-style clothes | 👔 | necktie/shirt |
| 晩御飯 | ばんごはん | evening meal | 🍱 | bento meal |
| 車 | くるま | car, vehicle | 🚗 |  ⚠ already authored in M1-M7 |
| もう一度 | もういちど | again | 🔁 | repeat arrow |
| ポスト |  | post | 📮 | postbox |
| 服 | ふく | clothes | 👕 | t-shirt |
| メートル |  | metre | 📏 | ruler |
| パン |  | bread | 🍞 |  |
| 半 | はん | half | 🌗 |  \| swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half') |
| 若い | わかい | young | 👶 | baby connotes young |
| 食べる | たべる | to eat | 🍽️ |  ⚠ already authored in M1-M7 |
| 四日 | よっか | four days, fouth day of the month | 4️⃣ | number 4 |
| 警官 | けいかん | policeman | 👮 |  |
| 伯父 / 叔父 | おじいさん | grandfather, male senior citizen | 👴 | older man |
| アパート |  | apartment | 🏢 | apartment building |
| 鳥 | とり | bird | 🐦 |  |
| タクシー |  | taxi | 🚕 |  |
| しょうゆ |  | soy sauce | 🍶 | sake bottle as closest condiment vessel; weak |
| 白い | しろい | white | ⬜ | white square |
| 待つ | まつ | to wait | ⏳ | hourglass |
| 行く | いく | to go | 🚶 | person walking |
| 角 | かど | a corner | 📐 | triangle ruler — corner/angle |
| 男 | おとこ | man | 👨 |  |
| ギター |  | guitar | 🎸 |  |
| 聞く | きく | to hear, to listen to, to ask | 👂 | ear |
| 走る | はしる | to run | 🏃 |  |
| お母さん | おかあさん | (honorable) mother | 👩 | woman; pair with phrase context |
| 強い | つよい | powerful | 💪 | flexed bicep |
| 魚 | さかな | fish | 🐟 |  |
| 切手 | きって | postage stamp | 📮 | postbox; no stamp emoji in Noto |
| 暗い | くらい | gloomy | 🌑 | new moon = dark |
| 出る | でる | to appear, to leave | 🚪 | door — leave/exit |
| 犬 | いぬ | dog | 🐕 |  ⚠ already authored in M1-M7 |
| 女 | おんな | woman | 👩 |  |
| 飛行機 | ひこうき | aeroplane | ✈️ |  |
| 日曜日 | にちようび | Sunday | 📅 | generic calendar |
| 午前 | ごぜん | morning | 🌅 | sunrise |
| 名前 | なまえ | name | 🪪 | ID card ⚠ already authored in M1-M7 |
| 丸い / 円い | まるい | round, circular | ⭕ | circle |
| 曲る | まがる | to turn, to bend | ↩️ | curved arrow |
| 鼻 | はな | nose | 👃 |  ⚠ already authored in M1-M7 |
| お弁当 | おべんとう | boxed lunch | 🍱 |  |
| コップ |  | a glass | 🥛 | glass of milk; closest |
| 結婚 | けっこん | marriage | 💍 | ring |
| 置く | おく | to put | 📥 | inbox tray — place/put |
| 渡る | わたる | to go across | 🚸 | pedestrian crossing |
| 伯母さん / 叔母さん | おばさん | aunt | 👩 | woman; pair with phrase for aunt context |
| 明い | あかるい | bright | 💡 | lightbulb |
| 家庭 | かてい | household | 🏠 | house |
| パーティー |  | party | 🎉 |  |
| スカート |  | skirt | 👗 | dress is closest Noto |
| 靴 | くつ | shoes | 👞 |  |
| ボタン |  | button | 🔘 | radio button |
| 今月 | こんげつ | this month | 📅 | calendar |
| 返す | かえす | to return something | ↩️ | return arrow |
| ストーブ |  | heater | 🔥 | fire — heater context; weak but concrete |
| 二人 | ふたり | two people | 👥 | two silhouettes ⚠ already authored in M1-M7 |
| 起きる | おきる | to get up | ⏰ | alarm clock — wake up |
| 古い | ふるい | old (not used for people) | 🏚️ | derelict house — old |
| 黄色い | きいろい | yellow | 🟨 | yellow square |
| 歌う | うたう | to sing | 🎤 | microphone |
| 飴 | あめ | candy | 🍬 |  |
| 寝る | ねる | to go to bed, to sleep | 🛏️ | bed |
| 質問 | しつもん | question | ❓ | question mark |
| 牛乳 | ぎゅうにゅう | milk | 🥛 |  |
| 二 | に | two | 2️⃣ |  ⚠ already authored in M1-M7 |
| 紅茶 | こうちゃ | black tea | 🍵 | teacup; pair with phrase |
| 出かける | でかける | to go out | 🚶 | person walking |
| 兄 | あに | (humble) older brother | 👦 | boy; pair with phrase context per rubric ⚠ already authored in M1-M7 |
| 留学生 | りゅうがくせい | overseas student | 🎓 | graduation cap |
| 月曜日 | げつようび | Monday | 📅 | calendar |
| 締める | しめる | to tie | 🎀 | ribbon |
| 熱い | あつい | hot to the touch | 🔥 | fire — hot |
| 郵便局 | ゆうびんきょく | post office | 🏤 | post office building ⚠ already authored in M1-M7 |
| 六つ | むっつ | six | 6️⃣ |  |
| 本棚 | ほんだな | bookshelves | 📚 | stacked books |
| 昨夜 | ゆうべ | last night | 🌙 | crescent moon |
| 外国人 | がいこくじん | foreigner | 🌍 | globe — foreign/abroad |
| 絵 | え | picture | 🖼️ | framed picture |
| 使う | つかう | to use | 🛠️ | tools — using |
| 休む | やすむ | to rest | 😴 | sleeping face — rest |
| テスト |  | test | 📝 | memo |
| たばこ |  | tobacco, cigarettes | 🚬 |  |
| 涼しい | すずしい | refreshing | 🍃 | leaf in wind — cool/refreshing |
| 昨日 | きのう | yesterday | 📅 | calendar; pair with phrase |
| せっけん |  | economy | 🧼 | soap — note: meaning field appears mislabeled (せっけん=soap) |
| 初め / 始め | はじめ | beginning | 🏁 | checkered flag — start |

## Blocked (149) — teach via phrase_card / cloze / listening / dialogue, never wordImageMcq

Add these kana to `WORD_IMAGE_MCQ_BLOCKLIST` when authoring their lessons.

| Word | Kana | Meaning | Why blocked |
|---|---|---|---|
| 並ぶ | ならぶ | to line up, to stand in a line | no single-glyph for line-up; abstract action |
| 頭 | あたま | head | brain reads as 'remember' (used for 覚える); no clean head-anatomy glyph |
| 一月 | ひとつき | one month | abstract duration; calendar reads as date not span |
| 閉める | しめる | to close something | door already used for 玄関; verb action not visualizable |
| たいへん |  | very | intensifier adverb |
| 中 | なか | middle | bullseye reads as 'target' not 'middle' |
| 六日 | むいか | six days, sixth day of the month | date concept — no clean visual |
| 狭い | せまい | narrow | no clean narrow glyph; left-right arrow reads as wide |
| 分かる | わかる | to be understood | lightbulb already used for 電気; understanding too abstract |
| 何 | なん / なに | what | interrogative — abstract grammar |
| 厚い | あつい | kind, deep, thick | polysemous abstract adjective |
| 毎月 | まいげつ / まいつき | every month | abstract recurrence |
| 閉まる | しまる | to close, to be closed | intransitive variant of 閉める — same physical event |
| 脱ぐ | ぬぐ | to take off clothes | necktie reads as clothing not removing; verb action not visualizable |
| 汚い | きたない | dirty | trash reads as 'garbage' not 'dirty' |
| 廊下 | ろうか | corridor | no corridor emoji in Noto |
| 要る | いる | to need | exclamation reads as 'attention' not 'need' |
| こっち |  | this person or way | demonstrative — spatial pronoun |
| 時々 | ときどき | sometimes | frequency adverb |
| どう |  | how, in what way | interrogative |
| 差す | さす | to stretch out hands, to raise an umbrella | polysemous action verb |
| どっち |  | which | interrogative pronoun |
| そば |  | near, beside | positional — abstract |
| どうして |  | for what reason | interrogative |
| 今年 | ことし | this year | deictic time expression |
| 初めて | はじめて | for the first time | abstract adverb |
| 毎週 | まいしゅう | every week | abstract recurrence |
| いつも |  | always | frequency adverb |
| なる |  | to become | cycle reads as 'refresh' not 'become' |
| 無くす | なくす | to lose something | abstract action |
| たぶん |  | probably | modal adverb |
| 東 | ひがし | east | compass already used for 西; can't distinguish east vs west via emoji |
| 私 | わたくし | (humble) I, myself | pronoun — rubric blocks pronouns |
| お父さん | おとうさん | (honorable) father | man glyph reads as 'man' not 'father'; rubric flags parent words |
| ほか |  | other, the rest | abstract relational word |
| 来週 | らいしゅう | next week | deictic time expression |
| 知る | しる | to know | lightbulb used elsewhere; cognition too abstract |
| 自分 | じぶん | oneself | reflexive pronoun |
| 薄い | うすい | thin, weak | polysemy: thin (paper) vs weak (tea/color); no single concrete referent |
| 高い | たかい | tall, expensive | polysemy flagged in rubric — tall vs expensive needs separate cards |
| はい |  | yes | interjection/function word |
| なぜ |  | why | question word / abstract grammar |
| 一日 | いちにち | (1) one day, (2) first of month | counter/date abstraction |
| いいえ |  | no | interjection/function word |
| 小さな | ちいさな | little | prenominal adjective; abstract size, no referent |
| さ来年 | さらいねん | year after next | temporal abstraction |
| いくら |  | how much? | question word |
| 温い | ぬるい | luke warm | subtle temperature distinction; no referent that reads as 'lukewarm' vs warm/hot |
| そうして / そして |  | and | conjunction / function word |
| どれ |  | which (of three or more) | demonstrative — rubric blocks |
| だんだん |  | gradually | adverb of degree; no referent |
| また |  | again, and | adverb/conjunction |
| とても |  | very | intensifier adverb; no referent |
| 一昨年 | おととし | year before last | temporal abstraction |
| 木曜日 | もくようび | Thursday | day-of-week label; needs text not image |
| もう |  | already | tense/aspect adverb |
| 五日 | いつか | five days, fifth day | day counter; abstract |
| そこ |  | that place | demonstrative — rubric blocks |
| どの |  | which | demonstrative — rubric blocks |
| それでは |  | in that situation | discourse connector |
| 来月 | らいげつ | next month | temporal abstraction |
| 先週 | せんしゅう | last week | temporal abstraction |
| ほんとう |  | truth | abstract noun; no concrete referent |
| 金曜日 | きんようび | Friday | day-of-week label; needs text |
| 多い | おおい | many | abstract quantifier; no canonical referent |
| キロ / キロメートル |  | kilometre | unit of measure; no referent |
| 二日 | ふつか | two days, second day of the month | day counter; abstract |
| 所 | ところ | place | abstract noun (per rubric: ところ explicitly flagged) |
| 一昨日 | おととい | day before yesterday | temporal abstraction |
| 二十日 | はつか | twenty days, twentieth | day counter; abstract |
| ください |  | please | polite-request auxiliary; function word |
| 易しい | やさしい | easy, simple | abstract adjective; homophone with 'kind' increases ambiguity |
| 誰 | だれ | who | question pronoun |
| 十日 | とおか | ten days, the tenth day | day counter; abstract |
| どちら |  | which of two | demonstrative — rubric blocks |
| 小さい | ちいさい | little | abstract adjective; no canonical referent |
| 今週 | こんしゅう | this week | temporal abstraction |
| 向こう | むこう | over there | spatial demonstrative |
| 去年 | きょねん | last year | abstract time reference; no visual referent |
| 火曜日 | かようび | Tuesday | weekday name — no glyph distinguishes |
| あなた |  | you | pronoun — rubric explicit block |
| 千 | せん | thousand | no canonical emoji for 1000; ambiguous with 100 |
| あまり |  | not very | abstract grammar adverb |
| 三日 | みっか | three days, third day of the month | no glyph for ordinal day-3 |
| どこ |  | where | interrogative demonstrative; abstract |
| 隣 | となり | next door to | spatial relation; no visual referent |
| 後ろ | うしろ | behind | spatial relation; arrow ambiguous with left |
| 先月 | せんげつ | last month | abstract time reference |
| じゃ / じゃあ |  | well then… | discourse particle |
| この |  | this | demonstrative — rubric block |
| 毎年 | まいねん / まいとし | every year | abstract time interval |
| 明日 | あした | tomorrow | abstract time reference |
| よく |  | often, well | adverb of frequency/manner; abstract |
| 万 | まん | ten thousand | no glyph for 10000; ambiguous |
| かかる |  | to take time or money | abstract verb of cost/duration |
| でも |  | but | conjunction |
| あっち |  | over there | demonstrative spatial — rubric block |
| ワイシャツ |  | business shirt | necktie already used; collision risk |
| ハンカチ |  | handkerchief | no handkerchief glyph; toilet paper misreads |
| いつ |  | when | interrogative |
| 全部 | ぜんぶ | all | quantifier abstract |
| など |  | et cetera | particle |
| 太い | ふとい | fat | polysemy fat/thick; person-emoji reads as body-shape; risky |
| やる |  | to do | generic verb; same meaning as する — polite-form duplicate per rubric |
| 七日 | なのか | seven days, the seventh day | no ordinal-day glyph |
| あれ |  | that | demonstrative — rubric block |
| 後 | あと | afterwards | abstract temporal adverb |
| 並べる | ならべる | to line up, to set up | no clean glyph for 'arrange in a row'; risk of confusion |
| しかし |  | however | conjunction |
| 八日 | ようか | eight days, eighth day of the month | no ordinal-day glyph |
| 九日 | ここのか | nine days, ninth day | no ordinal-day glyph |
| そっち |  | over there | demonstrative — rubric block |
| あの |  | that over there | demonstrative — rubric block |
| 毎日 | まいにち | every day | abstract time interval |
| 居る | いる | to be, to have (used for people and animals) | existence-of — rubric explicit block |
| できる |  | to be able to | modal/auxiliary verb; abstract |
| する |  | to do | generic abstract verb |
| ある |  | to be, to have (used for inanimate objects) | existence-of — rubric explicit block |
| いくつ |  | how many?, how old? | interrogative |
| 前 | まえ | before | polysemy: spatial 'in front' vs temporal 'before'; ambiguous |
| 来る | くる | to come | directional verb; arrow ambiguous with go/return |
| その |  | that | demonstrative — abstract grammar per rubric |
| ちょっと |  | somewhat | adverb/abstract degree marker |
| 先 | さき | the future, previous | abstract temporal/positional — no concrete referent |
| こんな |  | such | demonstrative determiner — abstract grammar |
| たくさん |  | many | abstract quantifier; no specific referent |
| ちょうど |  | exactly | abstract adverb; no concrete referent |
| これ |  | this | demonstrative — per rubric |
| ここ |  | here | spatial demonstrative — per rubric |
| 方 | かた | person, way of doing | polysemous abstract noun (per rubric) |
| では |  | with that... | particle/conjunction |
| 少ない | すくない | a few | abstract quantifier |
| 次 | つぎ | next | abstract ordinal/temporal — no concrete referent |
| 意味 | いみ | meaning | abstract noun — per rubric |
| 物 | もの | thing | abstract noun — per rubric |
| より、ほう |  | Used for comparison. | comparison particle — abstract grammar |
| それから |  | after that | conjunction — abstract grammar |
| あちら |  | there | spatial demonstrative — per rubric |
| いかが |  | how | interrogative adverb — abstract grammar |
| さあ |  | well… | interjection — no concrete referent |
| あそこ |  | over there | spatial demonstrative — per rubric |
| まだ |  | yet, still | tense/aspect adverb — abstract grammar |
| それ |  | that | demonstrative — per rubric |
| どなた |  | who | interrogative pronoun — per rubric |
| そちら |  | over there | spatial demonstrative — per rubric |
| 細い | ほそい | thin | abstract adjective; no clean Noto referent |
| 結構 | けっこう | splendid, enough | polysemous abstract adjective/adverb |
| こちら |  | this person or way | demonstrative — per rubric |
| 貼る | はる | to stick | no concrete Noto referent; pair with phrase |

## No-fit / needs custom art (1)

- **テーブル** () — table. no clean Noto table emoji; rely on custom art or phrase

## Sourcing

- Input: `https://jlpt-vocab-api.vercel.app/api/words/all?level=5` (snapshot 2026-05-18).
- Rubric: `docs/emoji-blocked-words-2026-05-18.md` + canonical Noto-only constraint (Apache 2.0).
- Subagent dispatches: 4 × Opus, 165-166 words each.
- Verified: 512/512 mapped URLs HEAD-check 200 against `cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main`.