# Beginner audit — m1-m7 (persona: 62-year-old absolute-beginner learner-sim)

Read in full, in order: HOW-TO-READ.md, m1.md, m2.md, m3.md, m4.md, m5.md, m6.md, m7.md.
Items already on the "known" exclusion list are not repeated here.

---

### ある/いる's polite forms (あります/ありません) are used as graded answers before ever being taught, and nothing flags that ある is an exception to the taught る-verb rule
module/lesson/step: m7 L11 step 10 (build_sentence, "There's a class today"), m7 L11 step 13 (build_sentence, "There's no class today"), m7 L14 step 8 (listening_build, AUDIO かぜが あります)
severity: blocker
effort: S
confidence: verified
evidence: m7 L3's only conjugation rule card ("Every verb, politely — the three classes", m7.md:87-93) enumerates る-verbs (みる), う-verbs (いく, かう, きく) and the two irregulars (する, くる) — ある and いる are never mentioned. `grep -n 'あります\|ありません' m5.md m6.md m7.md` shows あります first appearing as the correct answer at m7.md:463, with no grammar_rule anywhere in m1-m7 covering it (`grep -n grammar_rule m7.md` lists 7 cards, none is about ある/いる). Worse, ある superficially LOOKS like a る-verb (ends in -aru, and the taught rule for る-verbs is demonstrated only with -iru/-eru examples), so a learner applying the pattern they were just taught would produce the wrong form (あます) and have no way to know they'd been trapped by an exception the course never named.
why it matters: I finally learned the "drop る, add ます" trick and felt proud of it, and then the app wants あります out of nowhere — the trick I was just taught would have given me the wrong word, and nobody warned me ある was the exception.

### きく tested for its "ask a person" sense (に-marked) right after being told to ignore that sense
module/lesson/step: m7 L13 step 11 (particle_cloze, "たなかさんに ___か。" meaning "Will you ask Tanaka? (polite)")
severity: blocker
effort: S
confidence: verified
evidence: m5 L7's grammar_rule card (m5.md:377-381) says outright: "きく does double duty — listening to sounds and asking questions are the same verb in Japanese. For now, keep it on songs and sounds." Every other きく example through m5-m7 uses を with a thing (うたを きく, そらを みる pattern). Then m7.md:552-554 graded particle_cloze requires picking ききます for "ask Tanaka," with たなかさんに (person + に) as the frame — a construction never taught, using a particle (に for the person asked) that's the opposite of every きく example the learner has drilled.
why it matters: the app told me point-blank not to worry about that meaning yet, so when it shows up on a real question two modules later I have no idea whether I forgot something or the app broke its own promise.

### それ、なん？ tested and credited as correct after the course explicitly deferred なん to "later"
module/lesson/step: m4 L11 step 1 (dialogue_listen, "Tom: それ、なん？"), m4 L12 step 7 (multiple_choice, correct answer それ、なん？)
severity: blocker
effort: XS
confidence: verified
evidence: m4 L3's grammar_rule card (m4.md:128-134) says: "'What' has two sounds in Japanese: なに on its own, なん when fused to what follows. This module only needs なに — the fused shapes arrive with their own patterns." `grep -n 'なん' m1.md...m7.md` shows なん is never taught (no symbol_intro/word_image_mcq/grammar_rule target) anywhere in m1-m7 — its only other appearances are as a throwaway distractor tile (m5.md:217) and a wrong-answer option (m7.md:443). Yet m4 L12 step 7's multiple_choice ("Ask what it is") offers それ、なん？ as the credited correct answer, and それ、なに？ (the form actually taught) is not even among the options.
why it matters: the course told me flat out I wouldn't need this yet, then a review quiz makes me pick the very form it said to skip, over the form it did teach me — I'd have no way to know which one was right.

### いくら ("how much") used and tested with zero teaching moment
module/lesson/step: m5 L6 step 2 (dialogue_listen, "Tom: これ、いくら？"), m5 L6 step 3 (listening_comprehension, graded, immediately after)
severity: blocker
effort: XS
confidence: verified
evidence: `grep -n 'いくら' m1.md...m7.md` returns exactly two lines, both in m5 L6 (m5.md:305, m5.md:313) — no symbol_intro, word_image_mcq, or grammar_rule ever introduces it. The very next step grades comprehension of the word ("Q: What does これ、いくら？ mean? A) Whose is this? B) How much is this? ...") with no prior exposure at all. This is the same defect class as the already-flagged "m3 survival phrases first met as a graded listening question," recurring here with a new word in a later module — the fix evidently wasn't applied course-wide.
why it matters: I'm asked to grade myself on a word I have literally never seen before — that's not a quiz, that's a guess, and I'll blame myself for "not remembering" something I was never shown.

### m1's very first を rule card breaks its own script and vocabulary rules to illustrate the particle
module/lesson/step: m1 L29 step 1 (grammar_rule, "を — the particle kana")
severity: major
effort: XS
confidence: verified
evidence: m1.md:846-849 reads: "· パン を たべる — I eat bread. · みず を のむ — I drink water." パン is written in KATAKANA — a script the course never even names as existing until m2 L27 (m2.md:917, "You will learn to read katakana row by row from module 7") and doesn't teach for reading until m7 L1/L9. たべる, みず, and のむ are not taught as vocabulary until m2 L11, m2 L4, and m5 L3 respectively (`grep` confirms all three). The same word for bread is later taught in HIRAGANA as ぱん (m2.md:444), so the course contradicts its own script convention for this exact word one module later. The example also writes "パン を たべる" with spaces around を, while every real sentence from m5 onward is written solid, no spaces (ごはんを たべる) — a second, smaller inconsistency in the same two lines.
why it matters: I've spent 28 lessons proving I can sound out hiragana, and the very card that's supposed to teach me my first grammar particle throws characters at me I've never seen, using words I've never learned, translated but not explained — I came away trusting the か and です rule cards but not this one.

### いけ (pond) re-introduced as a "first exposure" word after already being taught and tested in m1
module/lesson/step: m6 L8 step 7 (word_image_mcq, "(pond)")
severity: minor
effort: XS
confidence: verified
evidence: m1 L5 already required correctly identifying いけ's meaning via graded listening_comprehension (m1.md:153-155, "AUDIO: いけ ... A) pond B) face C) shell D) station") and listening_build (m1.md:156-158). Per HOW-TO-READ, word_image_mcq marks "a word's FIRST exposure in the course... If a word arrives here, that is the course introducing it" — but いけ arrives there again in m6 L8 (m6.md:367-369), five modules after the learner was already graded on knowing it.
why it matters: it's a small thing, but it makes me wonder if the app remembers what it already taught me — being re-"introduced" to a word I answered correctly five modules ago is a little unsettling, like the course forgot me.

### かばん glossed as "bag, basket" — basket is not a meaning of かばん
module/lesson/step: m6 L10 step 8 (multiple_choice, "Pick the word for 'bag, basket'")
severity: minor
effort: XS
confidence: suspected
evidence: m6.md:464-465. Every other occurrence of かばん across m1-m7 (dozens) glosses it simply as "bag." かばん means bag/case (school bag, briefcase); a basket is かご, an unrelated word never introduced in this course. This is the only place "basket" appears attached to かばん.
why it matters: if I ever needed to actually ask for a basket, this course just quietly taught me the wrong word for it.

### Every [translate] step's prompt repeats the word "Translate" twice
module/lesson/step: pervasive, e.g. m3 L1 step 12 ("Translate into Japanese: Translate: It's a dog."), m4 L1 step 12, m5 L1 step 10 — 34 occurrences across m1-m7
severity: minor
effort: XS
confidence: suspected
evidence: `grep -c 'Translate into Japanese: Translate' m1.md...m7.md` = 34. Every single [translate] step in the corpus reads "Translate into Japanese: Translate: <sentence>" — the instruction word appears twice back to back. This may be an artifact of how this learner-sim doc was assembled rather than what the live app shows (per HOW-TO-READ's warning that the emitter has stripped/mangled things before), so I'm flagging it as suspected rather than verified against the real UI.
why it matters: if this is really what I'd see on screen, it reads like the app stuttered — small, but every single translate exercise, every single lesson, reminds me this thing was assembled by machine.
