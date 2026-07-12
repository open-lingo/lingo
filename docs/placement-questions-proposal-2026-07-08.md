# Placement / Test-Out Questions — Proposal for Review

_Generated 2026-07-08 from `src/features/placement/questionBank.ts`. These are the coverage-scaled test-out questions (one per grammar point) for the shipped JA course, m3–m17. Each was authored against the module's real curriculum and passed an adversarial JA-correctness check. **Review each below and write your notes in the `> Notes:` line** — flag anything unnatural, ambiguous, too easy/hard, or mis-tagged._

**How grading works now:** a module is *tested out* only if you meet its bar — modules with **<5 questions require a clean sweep (0 misses)**; **5+ questions allow 1 miss**. Wrong answers are named back to you in the gap report and queued into review.

---

## M3 — は / か / です / も — first sentences
_4 questions · pass = miss ≤ 0_

**1. は topic marker**  ·  `wa-topic`  ·  `pt-m3-wa`
- Type: fill-the-blank (cloze) — _I am a student._
- Sentence: わたし**〔___〕**がくせいです
- Options: **は** ✅, の, を, か
> Notes: 

**2. か question particle**  ·  `ka-question`  ·  `pt-m3-ka`
- Type: fill-the-blank (cloze) — _Are you a student?_
- Sentence: がくせいです**〔___〕**
- Options: **か** ✅, は, の, を
> Notes: 

**3. です (polite copula)**  ·  `desu-copula`  ·  `pt-m3-desu`
- Type: multiple choice
- Prompt: 'I am a teacher.' (polite) — which is correct?
- Correct: **わたしは せんせいです** ✅
- Distractors: わたしは せんせいか, わたしは せんせいの, わたしは せんせいを
> Notes: 

**4. も (also / too)**  ·  `mo-also`  ·  `pt-m3-mo`
- Type: multiple choice
- Prompt: 'I am also a teacher.' — which is correct?
- Correct: **わたしも せんせいです** ✅
- Distractors: わたしは せんせいです, わたしの せんせいです, わたしと せんせいです
> Notes: 

---

## M4 — の, これ/それ/あれ — possession & demonstratives
_3 questions · pass = miss ≤ 0_

**1. の (possession)**  ·  `no-possession`  ·  `pt-m4-no`
- Type: fill-the-blank (cloze) — _It's my book._
- Sentence: わたし**〔___〕**ほんです
- Options: **の** ✅, は, を, が
> Notes: 

**2. の for 'kind of' (nationality)**  ·  `no-kind`  ·  `pt-m4-nokind`
- Type: multiple choice
- Prompt: 'It's a Japanese car.' — which is correct?
- Correct: **にほんの くるまです** ✅
- Distractors: にほんは くるまです, にほんが くるまです, にほんで くるまです
> Notes: 

**3. これ / それ / あれ demonstratives**  ·  `kore-sore-are-dore`  ·  `pt-m4-kosoado`
- Type: multiple choice
- Prompt: 'That (near you) is a pen.' — which is correct?
- Correct: **それは ペンです** ✅
- Distractors: これは ペンです, あれは ペンです, どれは ペンです
> Notes: 

---

## M5 — numbers, ください, 人-counter, から — ordering
_4 questions · pass = miss ≤ 0_

**1. numbers 1–10**  ·  `numbers-1-10`  ·  `pt-m5-num`
- Type: multiple choice
- Prompt: How do you say '5' in Japanese?
- Correct: **ご** ✅
- Distractors: さん, よん, ろく
> Notes: 

**2. ください (ordering)**  ·  `kudasai`  ·  `pt-m5-kudasai`
- Type: multiple choice
- Prompt: 'Two waters, please.' — which is correct?
- Correct: **みず ふたつ ください** ✅
- Distractors: みず ふたり ください, みずの ふたつ ください, みず にこ ください
> Notes: 

**3. counter 人 (にん; irregular ひとり / ふたり)**  ·  `counter-nin`  ·  `pt-m5-nin`
- Type: multiple choice
- Prompt: 'There are two people.' — which counter is correct?
- Correct: **ふたり います** ✅
- Distractors: ににん います, ふたつ います, にじん います
> Notes: 

**4. から (origin / 'from')**  ·  `kara-origin`  ·  `pt-m5-kara`
- Type: fill-the-blank (cloze) — _I'm from America._
- Sentence: わたしは アメリカ**〔___〕**です
- Options: **から** ✅, まで, に, で
> Notes: 

---

## M6 — に / で / が location particles + ここ/そこ/あそこ
_4 questions · pass = miss ≤ 0_

**1. に for destination / location**  ·  `ni-location`  ·  `pt-m6-ni`
- Type: fill-the-blank (cloze) — _I go to school._
- Sentence: がっこう**〔___〕**いきます
- Options: **に** ✅, で, を, は
> Notes: 

**2. で for action setting**  ·  `de-action`  ·  `pt-m6-de`
- Type: fill-the-blank (cloze) — _I work at a convenience store._
- Sentence: コンビニ**〔___〕**はたらきます
- Options: **で** ✅, に, を, は
> Notes: 

**3. が existence (あります / います)**  ·  `ga-existence`  ·  `pt-m6-ga`
- Type: multiple choice
- Prompt: 'There is a cat.' — which uses the correct verb for living things?
- Correct: **ねこが います** ✅
- Distractors: ねこが あります, ねこを います, ねこに います
> Notes: 

**4. ここ / そこ / あそこ location pointers**  ·  `koko-soko-asoko`  ·  `pt-m6-koko`
- Type: fill-the-blank (cloze) — _Here is a park._
- Sentence: **〔___〕**は こうえんです
- Options: **ここ** ✅, そこ, あそこ, どこ
> Notes: 

---

## M7 — verbs + ます + を
_3 questions · pass = miss ≤ 0_

**1. を direct object**  ·  `wo-object`  ·  `pt-m7-wo`
- Type: fill-the-blank (cloze) — _I drink water._
- Sentence: みず**〔___〕**のみます
- Options: **を** ✅, は, が, に
> Notes: 

**2. dictionary → polite ます conjugation**  ·  `masu-form`  ·  `pt-m7-masu-conj`
- Type: multiple choice
- Prompt: What is the polite (ます) form of のむ (to drink)?
- Correct: **のみます** ✅
- Distractors: のむます, のみるます, のまます
> Notes: 

**3. polite ます-form in a sentence**  ·  `masu-polite`  ·  `pt-m7-masu-sentence`
- Type: multiple choice
- Prompt: 'I read a book.' (polite) — which is correct?
- Correct: **ほんを よみます** ✅
- Distractors: ほんを よむ, ほんを よむです, ほんが よみます
> Notes: 

---

## M8 — い-adjectives, この/その, と
_5 questions · pass = miss ≤ 1_

**1. この/その/あの adnominal demonstratives**  ·  `kono-sono-ano-dono`  ·  `pt-m8-kono-sono`
- Type: multiple choice
- Prompt: 'That camera (near you) is expensive.' — which is correct?
- Correct: **その カメラは たかいです** ✅
- Distractors: これ カメラは たかいです, この カメラは たかいです, あの カメラは たかいです
> Notes: 

**2. い-adjective present affirmative**  ·  `i-adj-present`  ·  `pt-m8-i-adj-present`
- Type: multiple choice
- Prompt: 'This coffee is hot.' — which is correct?
- Correct: **この コーヒーは あついです** ✅
- Distractors: この コーヒーは あついます, この コーヒーは あつです, この コーヒーは あついだ
> Notes: 

**3. い-adjective negative 〜くない**  ·  `i-adj-negative`  ·  `pt-m8-i-adj-neg`
- Type: multiple choice
- Prompt: 'This car isn't expensive.' — which is correct?
- Correct: **この くるまは たかくないです** ✅
- Distractors: この くるまは たかいくないです, この くるまは たかいじゃないです, この くるまは たかいです
> Notes: 

**4. irregular いい → よくない**  ·  `i-adj-negative-ii`  ·  `pt-m8-ii-yokunai`
- Type: multiple choice
- Prompt: 'This book isn't good.' — which is correct?
- Correct: **この ほんは よくないです** ✅
- Distractors: この ほんは いくないです, この ほんは いいくないです, この ほんは いいじゃないです
> Notes: 

**5. と connecting nouns (and)**  ·  `to-and`  ·  `pt-m8-to`
- Type: fill-the-blank (cloze) — _Coffee and bread, please._
- Sentence: コーヒー**〔___〕**パンを ください
- Options: **と** ✅, は, が, の
> Notes: 

---

## M9 — な-adjectives, よ/ね, が すき
_5 questions · pass = miss ≤ 1_

**1. な-adjective + な before a noun**  ·  `na-adj-present`  ·  `pt-m9-na-adj-present`
- Type: multiple choice
- Prompt: 'a pretty flower' — which is correct?
- Correct: **きれいな はな** ✅
- Distractors: きれいの はな, きれい はな, きれいい はな
> Notes: 

**2. な-adjective negative じゃないです**  ·  `na-adj-negative`  ·  `pt-m9-na-adj-neg`
- Type: multiple choice
- Prompt: 'This room isn't quiet.' — which is correct?
- Correct: **この へやは しずかじゃないです** ✅
- Distractors: この へやは しずかくないです, この へやは しずかいです, この へやは しずかです
> Notes: 

**3. Xが すきです (like)**  ·  `ga-suki`  ·  `pt-m9-ga-suki`
- Type: fill-the-blank (cloze) — _I like coffee._
- Sentence: コーヒー**〔___〕**すきです
- Options: **が** ✅, を, は, に
> Notes: 

**4. sentence-final よ (emphasis)**  ·  `yo-emphasis`  ·  `pt-m9-yo`
- Type: fill-the-blank (cloze) — _This tea is hot, I tell you!_
- Sentence: この おちゃは あついです**〔___〕**
- Options: **よ** ✅, ね, か, な
> Notes: 

**5. sentence-final ね (seeking agreement)**  ·  `ne-agreement`  ·  `pt-m9-ne`
- Type: multiple choice
- Prompt: You and a friend both look at a clean station. 'It's clean, isn't it?' — which is correct?
- Correct: **この えきは きれいですね** ✅
- Distractors: この えきは きれいですよ, この えきは きれいですか, この えきは きれいです
> Notes: 

---

## M10 — past tense (polite) — 4 parallel conjugations
_4 questions · pass = miss ≤ 0_

**1. verb polite past ました**  ·  `masu-past`  ·  `pt-m10-masu-past`
- Type: multiple choice
- Prompt: 'I ate sushi yesterday.' — which is correct?
- Correct: **きのう すしを たべました** ✅
- Distractors: きのう すしを たべます, きのう すしを たべでした, きのう すしを たべませんでした
> Notes: 

**2. copula past でした**  ·  `desu-past`  ·  `pt-m10-desu-past`
- Type: multiple choice
- Prompt: 'I was a student.' — which is correct?
- Correct: **がくせいでした** ✅
- Distractors: がくせいです, がくせいました, がくせいじゃなかったです
> Notes: 

**3. past tense of い-adjectives 〜かった**  ·  `i-adj-past`  ·  `pt-m10-i-adj-past`
- Type: multiple choice
- Prompt: 'The sushi was delicious.' — which is correct?
- Correct: **すしは おいしかったです** ✅
- Distractors: すしは おいしいでした, すしは おいしいです, すしは おいしくなかったです
> Notes: 

**4. past tense of な-adjectives 〜でした**  ·  `na-adj-past`  ·  `pt-m10-na-adj-past`
- Type: multiple choice
- Prompt: 'The park was pretty.' — which is correct?
- Correct: **こうえんは きれいでした** ✅
- Distractors: こうえんは きれいかったです, こうえんは きれいです, こうえんは きれいじゃなかったです
> Notes: 

---

## M11 — negation (ません, ない-form, まだ/もう)
_4 questions · pass = miss ≤ 0_

**1. polite negative ません**  ·  `masu-negative`  ·  `pt-m11-masen`
- Type: multiple choice
- Prompt: 'I don't eat bread.' — which is correct?
- Correct: **パンを たべません** ✅
- Distractors: パンを たべます, パンを たべました, パンを たべませんでした
> Notes: 

**2. polite past negative ませんでした**  ·  `masu-past-negative`  ·  `pt-m11-masen-deshita`
- Type: multiple choice
- Prompt: 'I didn't drink coffee yesterday.' — which is correct?
- Correct: **きのう コーヒーを のみませんでした** ✅
- Distractors: きのう コーヒーを のみません, きのう コーヒーを のみました, きのう コーヒーを のみませんです
> Notes: 

**3. plain ない-form (casual negative)**  ·  `nai-form`  ·  `pt-m11-nai-form`
- Type: multiple choice
- Prompt: What is the plain (casual) negative of のむ (to drink)?
- Correct: **のまない** ✅
- Distractors: のみない, のむない, のみません
> Notes: 

**4. もう (already) vs まだ (not yet)**  ·  `mada-mou`  ·  `pt-m11-mada-mou`
- Type: multiple choice
- Prompt: 'I already ate.' — which is correct?
- Correct: **もう たべました** ✅
- Distractors: まだ たべました, もう たべません, まだ たべません
> Notes: 

---

## M12 — time & calendar (hours, minutes, days)
_4 questions · pass = miss ≤ 0_

**1. 〜じ hours (irregular よじ)**  ·  `counter-ji`  ·  `pt-m12-counter-ji`
- Type: multiple choice
- Prompt: Which is the correct way to say 4 o'clock?
- Correct: **よじ** ✅
- Distractors: よんじ, しじ, しちじ
> Notes: 

**2. 〜ふん/ぷん minutes (voicing)**  ·  `counter-fun`  ·  `pt-m12-counter-fun`
- Type: multiple choice
- Prompt: Which is the correct way to say 3 minutes?
- Correct: **さんぷん** ✅
- Distractors: さんふん, さんぶん, さんぽん
> Notes: 

**3. Days of the week (〜ようび)**  ·  `days-of-week`  ·  `pt-m12-days-of-week`
- Type: multiple choice
- Prompt: Which is the correct word for Wednesday?
- Correct: **すいようび** ✅
- Distractors: すいよう, みずようび, すいび
> Notes: 

**4. に time marker**  ·  `ni-time`  ·  `pt-m12-ni-time`
- Type: fill-the-blank (cloze) — _I'll meet (you) at 3 o'clock._
- Sentence: さんじ**〔___〕**あいます
- Options: **に** ✅, を, で, へ
> Notes: 

---

## M13 — months, frequency, から (because), まで
_4 questions · pass = miss ≤ 0_

**1. 〜がつ months (irregular しがつ)**  ·  `months-gatsu`  ·  `pt-m13-months-gatsu`
- Type: multiple choice
- Prompt: Which is the correct word for April?
- Correct: **しがつ** ✅
- Distractors: よんがつ, しちがつ, よがつ
> Notes: 

**2. あまり〜ない frequency adverb**  ·  `frequency-adverbs`  ·  `pt-m13-frequency-adverbs`
- Type: multiple choice
- Prompt: Which sentence means 'I don't watch TV very often.'?
- Correct: **あまり テレビを みません** ✅
- Distractors: あまり テレビを みます, いつも テレビを みません, よく テレビを みません
> Notes: 

**3. から 'because'**  ·  `kara-because`  ·  `pt-m13-kara-because`
- Type: fill-the-blank (cloze) — _Because it's raining, I won't go._
- Sentence: あめ**〔___〕**、いきません。
- Options: **だから** ✅, から, まで, では
> Notes: 

**4. まで 'until' (time range)**  ·  `kara-time`  ·  `pt-m13-kara-time`
- Type: fill-the-blank (cloze) — _I work from 9 to 5._
- Sentence: くじから ごじ**〔___〕** はたらきます。
- Options: **まで** ✅, から, に, は
> Notes: 

---

## M14 — て-form + た-form + counters + big numbers (keystone)
_6 questions · pass = miss ≤ 1_

**1. て-form (Group 2 verbs)**  ·  `te-form`  ·  `pt-m14-te-form-g2`
- Type: multiple choice
- Prompt: て-form of たべる (to eat)?
- Correct: **たべて** ✅
- Distractors: たべって, たべた, たべんで
> Notes: 

**2. て-form (Group 1: む→んで)**  ·  `te-form`  ·  `pt-m14-te-form-g1-nde`
- Type: multiple choice
- Prompt: て-form of のむ (to drink)?
- Correct: **のんで** ✅
- Distractors: のみて, のんて, のって
> Notes: 

**3. て-form (Group 1: いく exception)**  ·  `te-form`  ·  `pt-m14-te-form-g1-iku`
- Type: multiple choice
- Prompt: て-form of いく (to go)?
- Correct: **いって** ✅
- Distractors: いいて, いきて, いんで
> Notes: 

**4. た-form (plain past)**  ·  `ta-form`  ·  `pt-m14-ta-form`
- Type: multiple choice
- Prompt: Plain past (た-form) of のむ (to drink)?
- Correct: **のんだ** ✅
- Distractors: のんで, のみた, のった
> Notes: 

**5. 〜てください (polite request)**  ·  `te-kudasai`  ·  `pt-m14-te-kudasai`
- Type: multiple choice
- Prompt: 'Please show me.' — which is correct?
- Correct: **みせてください** ✅
- Distractors: みせるください, みせました, みせています
> Notes: 

**6. counter 〜ほん (voicing さんぼん)**  ·  `counter-hon`  ·  `pt-m14-counter-hon`
- Type: multiple choice
- Prompt: 'Three (long, cylindrical things), please.' — which is correct?
- Correct: **さんぼん ください** ✅
- Distractors: さんほん ください, さんぽん ください, さんまい ください
> Notes: 

---

## M15 — て-form apps + wants (ている, たい, ほしい, てもいい, けど)
_5 questions · pass = miss ≤ 1_

**1. 〜ている progressive**  ·  `te-iru`  ·  `pt-m15-te-iru`
- Type: fill-the-blank (cloze) — _I'm drinking coffee right now._
- Sentence: いま コーヒーを のんで**〔___〕**。
- Options: **います** ✅, ます, いません, ました
> Notes: 

**2. 〜てもいいですか permission**  ·  `te-mo-ii`  ·  `pt-m15-te-mo-ii`
- Type: fill-the-blank (cloze) — _May I eat here?_
- Sentence: ここで たべて**〔___〕**いいですか。
- Options: **も** ✅, は, が, を
> Notes: 

**3. V-stem + たい (want to do)**  ·  `v-tai`  ·  `pt-m15-v-tai`
- Type: multiple choice
- Prompt: 'I want to eat sushi.' — which is correct?
- Correct: **すしを たべたいです** ✅
- Distractors: すしを たべますたい, すしを たべるたい, すしを たべたです
> Notes: 

**4. 〜がほしい (want a thing)**  ·  `ga-hoshii`  ·  `pt-m15-ga-hoshii`
- Type: fill-the-blank (cloze) — _I want water._
- Sentence: みず**〔___〕** ほしいです。
- Options: **が** ✅, を, に, は
> Notes: 

**5. けど 'but'**  ·  `kedo`  ·  `pt-m15-kedo`
- Type: fill-the-blank (cloze) — _I want to eat, but I don't have time._
- Sentence: たべたいです**〔___〕**、じかんが ないです。
- Options: **けど** ✅, から, まで, ので
> Notes: 

---

## M16 — prohibition / sequence / likes (てはいけません, ないでください, てから, のがすき)
_4 questions · pass = miss ≤ 0_

**1. 〜てはいけません prohibition**  ·  `te-wa-ikemasen`  ·  `pt-m16-te-wa-ikemasen`
- Type: fill-the-blank (cloze) — _You must not smoke._
- Sentence: たばこを すって**〔___〕**。
- Options: **はいけません** ✅, もいいです, ください, から
> Notes: 

**2. 〜ないでください negative request**  ·  `naide-kudasai`  ·  `pt-m16-naide-kudasai`
- Type: multiple choice
- Prompt: Which sentence means 'Please don't eat.'?
- Correct: **たべないでください** ✅
- Distractors: たべてはいけません, たべてください, たべません
> Notes: 

**3. 〜てから (after doing)**  ·  `te-kara`  ·  `pt-m16-te-kara`
- Type: fill-the-blank (cloze) — _After doing homework, I watch TV._
- Sentence: しゅくだいを して**〔___〕**、テレビを みます。
- Options: **から** ✅, はいけません, もいいです, ないで
> Notes: 

**4. 〜のがすき (nominalized like)**  ·  `suki-kirai-no`  ·  `pt-m16-suki-kirai-no`
- Type: fill-the-blank (cloze) — _I like listening to music._
- Sentence: おんがくを きく**〔___〕** すきです。
- Options: **のが** ✅, のを, のに, のは
> Notes: 

---

## M17 — transport & directions (で, へ, までに, まえに)
_4 questions · pass = miss ≤ 0_

**1. で for means of transport**  ·  `de-transport`  ·  `pt-m17-de`
- Type: fill-the-blank (cloze) — _I go by train._
- Sentence: でんしゃ**〔___〕**いきます
- Options: **で** ✅, に, を, へ
> Notes: 

**2. へ direction**  ·  `e-direction`  ·  `pt-m17-e-direction`
- Type: fill-the-blank (cloze) — _I head toward the station._
- Sentence: えき**〔___〕** いきます。
- Options: **へ** ✅, で, を, が
> Notes: 

**3. までに (by deadline)**  ·  `made-ni`  ·  `pt-m17-made-ni`
- Type: fill-the-blank (cloze) — _I'll be back by 5 o'clock._
- Sentence: ごじ**〔___〕** かえります。
- Options: **までに** ✅, まで, から, に
> Notes: 

**4. まえに (before)**  ·  `mae-ni`  ·  `pt-m17-mae-ni`
- Type: fill-the-blank (cloze) — _I wash my hands before the meal._
- Sentence: ごはんの**〔___〕** てを あらいます。
- Options: **まえに** ✅, あとで, から, まで
> Notes: 

---

_Total: 63 questions across 15 modules (m3–m17). m18–m27 remain 3-question stubs pending their course content._