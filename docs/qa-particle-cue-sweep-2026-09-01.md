# Uncued sentence-final particles — ja course sweep (2026-09-01)

Spencer, testing ja m29: *"it keeps asking for desune but nothing indicates it,
we arent having any other acceptible gradings either, this is a miserable
failure point when testing out since answers are wrong."*

## The failure mode

An exercise's Japanese target carries a sentence-final particle — ね, よ, じゃん —
whose meaning the English prompt never encodes, **and** the acceptance set holds
only the particle-bearing form. So the learner reads "Say to a friend: The
wind's strong", answers 「かぜが つよい」 — an exact rendering of what was asked —
and is marked wrong, with no way to have known better.

These particles are precisely the ones that carry no proposition: they encode
stance toward the LISTENER (ね collects agreement, よ hands over news). The
English therefore has to carry that stance or the item is unanswerable. Contrast
politeness, which the "Say politely:" frame already cues.

## Why review never caught it

It is a drift between two halves of the SAME authoring pass. The rule-card
examples are cued correctly; the exercise prompts built from them dropped the
tag:

| | Japanese | English |
|---|---|---|
| rule card | `かぜが つよいね。` | "The wind's strong**, isn't it.**" |
| exercise  | `かぜが つよいね。` | "Say to a friend: The wind's strong" |

The lesson reads correct in isolation. It only fails when somebody answers it.
That is why it needs a machine, not another read-through.

## Scope

`node scripts/particle-cue-scan.mjs` (exit 1 on findings, `--json` for data):

- **138** particle-bearing targets across the ja IR modules
- **91 uncued (66%)** — よ 64, ね 27
- 13 modules; **m29 alone holds 59**, which is the worst possible place: m29 is
  the module that TEACHES よ and ね, so the particle is the lesson.

By module: m29 59 · m38 7 · m35 5 · m36 5 · m37 5 · m32 2 · m9 2 ·
m8/m10/m11/m30/m31/m34 1 each.

## The fix (NOT yet applied)

Two levers; they are not equivalent and the choice is per-case:

1. **Cue the prompt** — correct wherever the particle is the point (all of m29,
   and any lesson whose `introduces:` or `exercises:` names `ne-agreement` /
   `yo-emphasis`). The prompt must demand what the target supplies:
   ね → ", isn't it" / ", aren't they" / ", right" / ", then";
   よ → ", you know" / "just so you know" / "I'm telling you".
2. **Widen acceptance** — better where the particle is incidental (the scattered
   singletons in m30–m38), so both forms grade correct.

⚠️ m29 is a compiler-pipeline module: edit `curriculum/ir/m29.ir.yaml`, then
`node scripts/compile-ir.mjs m29`. Do NOT hand-edit the compiled lessons.

Worth deciding before the pass: whether `scoreAlternatives`/the build-tile
acceptance should treat a trailing ね/よ as OPTIONAL by default course-wide,
which would fix the grading half in one place and leave the prompt edits as a
pedagogy improvement rather than a correctness fix.

## Coverage and sibling parity

**The scan reads JA only.** It parses compiled IR JSON; ja has 33, es has YAML
only (8, no JSON), and ko/fr are hand-authored TS (58/21 files). So the 91 is a
complete count for JA and says nothing about the others.

Checked by hand instead — the sibling class is a tag question, not a particle:

| Course | Sibling form | Found | Status |
|---|---|---|---|
| es | `¿no?` / `¿verdad?` / `¿cierto?` | 0 | N-A today |
| ko | `네요` / `지요` / `죠` | 0 | N-A today |
| fr | `n'est-ce pas` / `, non ?` / `hein` | 0 | N-A today |

None of those courses has authored an agreement-seeking ender yet, so the class
cannot exist there. **Re-check when ko/fr/es reach the register tier** — the
defect is created by the same authoring move (rule card cues the tag, exercise
prompt drops it), not by anything Japanese-specific.

## Full offender list

particle-cue-scan: 138 particle-bearing targets, 91 with no cue in the prompt, across 13 modules

  ja/m29  (59)
    [yo] せんせい じかんが ありませんよ。
         prompt: Say politely: Teacher, there isn't any time
    [yo] なつやすみに がいこくに いくよ。
         prompt: Say to a friend: I'm going abroad in the summer holidays
    [yo] なつやすみに がいこくに いきますよ。
         prompt: Say politely: I'll be going abroad in the summer holidays
    [yo] ばんは とりにくを たべるよ。
         prompt: Say to a friend: I eat chicken in the evening
    [yo] にくを たべないから やさいを かうよ。
         prompt: Say to a friend: I don't eat meat, so I'll buy vegetables
    [yo] その ことばは わからないよ。
         prompt: Say to a friend: I don't know that word
    [yo] その おんがくは よかったよ。
         prompt: Say to a friend: That music was good
    [ne] ちょっと まってね。
         prompt: Say to a friend: Hang on a second
    [yo] つくえの うえに ある えんぴつは わたしのじゃないですよ。
         prompt: Say politely: The pencil on the desk isn't mine
    [yo] ゆきが ふるよ。
         prompt: Say to a friend: It's going to snow
    [yo] この おんがくは いいよ。
         prompt: Say to a friend: This music is good
    [yo] かぎは つくえの うえに あるよ。
         prompt: Say to a friend: The key's on the desk
    [yo] へやは せまいよ。
         prompt: Say to a friend: The room's narrow
    [yo] この きゅうりは やすかったよ。
         prompt: Say to a friend: These cucumbers were cheap
    [yo] つくえの したに めがねが あるよ。
         prompt: Say to a friend: Your glasses are under the desk
    [yo] ごごから かいものに いきますよ。
         prompt: Say politely: I'm going shopping this afternoon
    [yo] きっぷは たかいから いっしょに いきませんよ。
         prompt: Say politely: The tickets are expensive, so I'm not going with you
    [ne] この はなは きれいだね。
         prompt: Say to a friend: These flowers are pretty
    [ne] かぜが つよいね。
         prompt: Say to a friend: The wind's strong
    [ne] たなかさんは えいごが じょうずですね。
         prompt: Say politely: Tanaka, you're good at English
    [ne] あきは すずしいね。
         prompt: Say to a friend: Autumn is cool
    [ne] その くつは ちょっと ちいさいね。
         prompt: Say to a friend: Those shoes are a bit small
    [ne] ふゆの いけは さむいですね。
         prompt: Say politely: The pond in winter is cold
    [ne] たまごは やすいですね。
         prompt: Say politely: Eggs are cheap
    [ne] この てがみは ながいね。
         prompt: Say to a friend: This letter is long
    [ne] ふゆに なったから あきの はなは もう ないですね。
         prompt: Say politely: Winter has come, so the autumn flowers are gone now
    [yo] この さいふは ミカのじゃないよ。
         prompt: Say to a friend: This wallet isn't Mika's
    [ne] ごぜんの てんきは よかったね。
         prompt: Say to a friend: The weather was good this morning
    [ne] その じしょは ふるいですね。
         prompt: Say politely: That dictionary is old
    [yo] まどの まえに いすが ありますよ。
         prompt: Say politely: There's a chair in front of the window
    [ne] とりにくは ちょっと からいね。
         prompt: Say to a friend: The chicken is a bit spicy
    [yo] その ふくは おおきくないよ。
         prompt: Say to a friend: Those clothes aren't big
    [ne] この さんぽは ながいですね。
         prompt: Say politely: This walk is long
    [ne] ふゆの ばんは ながいですね。
         prompt: Say politely: Winter evenings are long
    [yo] ふゆの がいこくは さむいですよ。
         prompt: Say politely: Abroad is cold in winter
    [yo] がいこくに いきます。ちちも いきますよ。
         prompt: I'm going abroad. My father's going too.
    [yo] つくえが ふるいから おおきいのを かいたいんですよ。
         prompt: Say politely: The desk is old, so the thing is, I want to buy a big one
    [yo] ばんは さかなを たべませんよ。
         prompt: Say politely: I don't eat fish in the evening
    [yo] さいふに おかねが ないから ふゆまで かいものに いきませんよ。
         prompt: Say politely: There's no money in my wallet, so I'm not going shopping until winter
    [yo] ぎゅうにゅうを のんだから おなかは だいじょうぶだよ。
         prompt: Say to a friend: I drank the milk, so my stomach is fine
    [yo] ごぜんは ひまだったよ。
         prompt: Say to a friend: I was free this morning
    [yo] あきに ぼうしを かいましたよ。
         prompt: Say politely: I bought a hat in the autumn
    [ne] その くつは おおきくなかったね。
         prompt: Say to a friend: Those shoes weren't big
    [yo] いすの うえに ぼうしが ありますよ。
         prompt: Say politely: There's a hat on the chair
    [yo] ごぜんに たまごを かいましたよ。
         prompt: Say politely: I bought some eggs this morning
    [yo] この じしょが ほしいんですよ。
         prompt: Say politely: The thing is, I want this dictionary
    [yo] かぜが つよいんです。ごごは へやで おんがくを ききますよ。
         prompt: The thing is, the wind's strong. I'll listen to music in my room this afternoon.
    [yo] とりにくが からいから ぎゅうにゅうが ほしいんですよ。
         prompt: Say politely: The chicken is spicy, so the thing is, I want some milk
    [yo] ちょっと からいけど おいしいよ。
         prompt: Say to a friend: It's a bit spicy, but it's delicious
    [yo] ちょっと からいけど とりにくの ほうが おいしいと おもうよ。
         prompt: Say to a friend: It's a bit spicy, but I think the chicken is better
    [yo] そうだね。たかいけど いい ぼうしだよ。
         prompt: Yeah. It's expensive, but it's a good hat.
    [yo] この へやは ちょっと せまいから つくえを かわないよ。
         prompt: Say to a friend: This room is a bit narrow, so I won't buy a desk
    [yo] ごぜんに くつを かいましたよ。
         prompt: Say politely: I bought shoes this morning
    [yo] ばんは ぎゅうにゅうを のまないよ。
         prompt: Say to a friend: I don't drink milk in the evening
    [yo] たなかさんは えいごの せんせいなんですよ。
         prompt: Say politely: The thing is, Tanaka is the English teacher
    [ne] あきの かぜは すずしいね。
         prompt: Say to a friend: The autumn wind is cool
    [yo] その じしょは ふるいけど いいですよ。
         prompt: Say politely: That dictionary is old, but it's good
    [yo] ふゆの がいこくは さむいと おもうよ。
         prompt: Say to a friend: I think it's cold abroad in winter
    [yo] その おんがくは ながすぎるから ぼくは かわないよ。
         prompt: Say to a friend: That music is too long, so I won't buy it

  ja/m38  (7)
    [yo] もう してしまったよ。
         prompt: I already got it done.
    [ne] はやいね。
         prompt: That's fast.
    [yo] だいじょうぶだよ。
         prompt: It's okay.
    [yo] あめが ふりそうだから、もっていくよ。
         prompt: It looks like rain, so I'll take it with me.
    [ne] さむく なってきたね。
         prompt: It's been getting cold, hasn't it.
    [ne] うん、もう ふゆだね。
         prompt: Yeah, it's already winter.
    [ne] かんじに なれてきたね。
         prompt: You've gotten used to kanji, haven't you.

  ja/m35  (5)
    [ne] いいね。
         prompt: Nice.
    [yo] うん、いいよ。
         prompt: Sure, okay.
    [yo] はい、いいですよ。
         prompt: Sure, of course.
    [ne] いいね。
         prompt: Good idea.
    [yo] いいよ。
         prompt: Sure.

  ja/m36  (5)
    [ne] ちょっと おもいね。
         prompt: It's a bit heavy, though.
    [yo] うん。この じしょは わかりやすいよ。
         prompt: Yeah. This dictionary is easy to follow.
    [yo] だいじょうぶだよ。
         prompt: It'll be fine.
    [ne] そう、ねむそうね。
         prompt: I see, he does look sleepy.
    [ne] いいね。
         prompt: Sounds good.

  ja/m37  (5)
    [yo] じかんが ないよ。
         prompt: There's no time.
    [yo] いそげば、まにあうよ。
         prompt: If we hurry, we'll make it.
    [yo] うん、てつだうよ。
         prompt: Sure, I'll help.
    [yo] うん、いそげば、まにあうよ。
         prompt: Sure, if I hurry, I'll make it.
    [yo] ひつようなら、てつだうよ。
         prompt: If it's necessary, I'll help

  ja/m32  (2)
    [yo] そこを ひだりに まがると、みぎに ありますよ。
         prompt: Turn left there and it's on your right.
    [yo] いしゃに いったら いいですよ。
         prompt: You'd do well to go to a doctor.

  ja/m9  (2)
    [yo] ひゃくえんです。やすいですよ。
         prompt: A hundred yen. It's cheap.
    [yo] ひゃくえんです。やすいですよ。
         prompt: A hundred yen. That's cheap.

  ja/m10  (1)
    [yo] パンが やすいですよ。
         prompt: The bread is cheap.

  ja/m11  (1)
    [yo] じゅうごえんでした。やすいですよ。
         prompt: It was fifteen yen. That's cheap.

  ja/m30  (1)
    [yo] らいげつ じゅぎょうが ありますよ。
         prompt: There's a class next month.

  ja/m31  (1)
    [yo] らいげつ りょこうに いきますよ。
         prompt: I'm going on a trip next month.

  ja/m34  (1)
    [ne] え、そう？いいね。
         prompt: Huh, really? That's nice.

  ja/m8  (1)
    [yo] あそこですよ。
         prompt: It's over there.

