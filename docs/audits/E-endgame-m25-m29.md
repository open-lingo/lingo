# Endgame audit — m25-m29 (Weather conjecture, Superlatives, Explaining, Must/Should, Register mastery + N5 capstone)

Auditor lens: does the course END properly. Read m25-m29 whole plus HOW-TO-READ.md. All
"absence" claims below were grepped across the full 29-file corpus
(`docs/learner-sim/m1.md` … `m29.md`), not just the five files read, and checked for
false negatives from word-spacing/homophone collisions before being written up (two
suspected gaps — たことがある, どちら drilling — turned out to be present on closer
grep and were dropped).

---

## N5 / real-beginner coverage gaps (grepped against all 29 modules)

### No conditional grammar anywhere in the course — ば, たら, なら, verb-と are entirely absent
module/lesson/step: whole course
severity: major
effort: L
confidence: verified
evidence: `grep -nE 'いけば|すれば|あれば|いったら|たべたら|かったら|よければ'` across all `m*.md` → zero hits.
`grep -n 'なら'` (excluding なりません/ならない/なりましょう, i.e. the must-grammar) → zero hits.
`grep -n 'たら'` naive hits in m12/m21 are false positives from あたらしい/はたらく, confirmed
by inspecting each hit. なければ exists only as the fixed obligation phrase なければ
ならない (m28); the productive conditional ば is never taught standalone. No lesson anywhere
teaches "if it rains, ..." / "if you go, ..." in any of the four ordinary ways Japanese
does it.
why it matters: conditionals are how a beginner says "if/when X, then Y" for anything
that hasn't already happened — one of the most-used sentence shapes in real Japanese,
and completely unaddressed by course end.

### Giving/receiving verbs — あげる, もらう, くれる — never taught
module/lesson/step: whole course
severity: major
effort: L
confidence: verified
evidence: `grep -n 'あげる\|もらう\|くれる'` (plus kanji forms 上げる/貰う/呉れる, and
conjugated forms あげ[るまてた]/もらっ/もらい/くれ[るたて]) across all `m*.md` → zero hits
in every case.
why it matters: giving/receiving marks who benefits from an action and who the speaker
is loyal to — it is standard N5 grammar and shows up immediately in real gift-giving,
favour-asking, and thank-you exchanges. A learner who finishes this course has no way to
say "my brother gave me a watch" or "I got a bicycle from my father."

### ながら (simultaneous actions, "while doing X") never taught
module/lesson/step: whole course
severity: minor
effort: M
confidence: verified
evidence: `grep -c 'ながら'` across all `m*.md` → 0 in every file.
why it matters: standard N5 point ("I listen to music while I study") with no equivalent
elsewhere in the course's grammar set — nothing else lets a learner join two simultaneous
actions into one sentence.

### くらい / ぐらい (approximate amount) never taught
module/lesson/step: whole course
severity: minor
effort: S
confidence: verified
evidence: `grep -n 'くらい\|ぐらい'` across all `m*.md` → zero hits (checked for kanji
false-positives too; none).
why it matters: "about three o'clock," "about ten minutes" — a routine hedge on numbers
and time that a learner will need the first time they make plans, and the course has
taught numbers, time and duration (から/まで) extensively without ever giving this one
small, extremely common word.

### てはいけません (prohibition) is named once and never taught or drilled
module/lesson/step: m14 L6 (grammar_rule for ないでください)
severity: minor
effort: S
confidence: verified
evidence: the ONLY appearance of てはいけません/てはいけない in the whole course is one
clause inside a different rule card: "It is a REQUEST, softer than てはいけません, which
states the law — a friend says ここで たべないで ください, a sign says ここで たべては
いけません." (m14 L6). `grep -n 'はいけません\|はいけない'` across all modules returns
exactly this one line. There is no grammar_rule of its own, no build_sentence, no
translate, no listening step, no multiple_choice — anywhere — that drills it.
why it matters: "you must not" is a basic N5 form (a sign, a rule, a parent's
instruction) and it is mentioned by name but never actually taught; a learner who reads
carefully knows the word exists and has zero ability to produce or recognise it in a
real sentence.

### The illness module never teaches かぜ (a cold) or ひく (catch a cold)
module/lesson/step: m22 (whole module)
severity: minor
effort: S
confidence: verified
evidence: m22's word_image_mcq vocabulary set for the illness module is stomach, mouth,
illness/being ill, medicine, foot/leg, doctor (`grep -n 'word_image_mcq' m22.md`) — no
common-cold vocabulary. `grep -n 'ひく\|ひいた'` across all modules → zero hits (real
matches only; excluded やすい/ひくい false positives). かぜ itself IS taught in m22, but
only glossed as "wind" (🌬️ emoji, m22 L… multiple_choice), and it resurfaces meaning wind
again in m29 L3 — the far more common "catch a cold" sense of the same kana string is
never given at all.
why it matters: "I have a cold" is arguably the single most common health sentence a
beginner needs, and the module built specifically for health/illness vocabulary skips it
while spending a full multiple_choice slot on かぜ-as-wind instead — a near-miss that
would have been free to fix in the same module.

---

## Individual findings

### The でしょう/だろう/でしょ/かな conjecture family (all of m25) gets zero reinforcement in m26-m29
module/lesson/step: whole course, m25 vs m26-m29
severity: major
effort: M
confidence: verified
evidence: `grep -c 'でしょう'` on m26.md/m27.md/m28.md/m29.md → 0/0/0/0. `grep -c
'だろう'` on the same four files → 0/0/0/0. `grep -n 'でしょ[^う]'` (the casual tag
question でしょ) on the same four files → no hits. `grep -c 'かな'` (true hits, excluding
いかない/いかなきゃ/かならず false positives) on m26-m29 → 0 in every file. An entire
module's worth of grammar — the whole apparatus for hedging a claim (でしょう, だろう,
でしょ, かな) — is taught once in m25 and never appears again for the rest of the course,
including in the final "capstone."
why it matters: this is exactly the kind of item the audit is built to catch — heavy
investment in one module, then total silence for the four modules including the one
explicitly billed as reviewing "N5, all of it." A learner who was shaky on でしょう at the
end of m25 gets no further exposure before the course ends.

### いちばん (superlatives, all of m26) gets zero reinforcement in m27-m29
module/lesson/step: whole course, m26 vs m27-m29
severity: major
effort: M
confidence: verified
evidence: `grep -c 'いちばん'` on m27.md/m28.md/m29.md → 0/0/0. Superlative and (mostly)
comparative machinery goes untouched for the rest of the course after its home module.
why it matters: same defect as the でしょう finding above, on a second full module —
together they show that once a lesson-block finishes, the course's last fifth treats it
as closed rather than folding it into ongoing review.

### m29's "N5 capstone" billing does not actually integrate the two modules before it
module/lesson/step: m29 (whole module, esp. L13 "Challenge — N5, all of it, in front of somebody")
severity: major
effort: M
confidence: verified
evidence: m29's own intro text: "The last module of N5, and the one where you stop
learning new things and start choosing" — i.e. m29 is explicitly scoped to register
switching only. Consistent with that scope, m29 contains zero でしょう, zero いちばん,
zero なきゃ, and zero "ほうが いい" (all four greps return 0 — see coverage-gap and
finding above, plus `grep -c 'なきゃ'` on m29.md → 0 and `grep -c 'ほうが いい'` on
m29.md → 0). The only cross-module callback is the pre-existing ほうが…より comparison
frame reused once in the L13 challenge. Lesson 13 is titled "N5, all of it, in front of
somebody," which oversells what the lesson actually reviews.
why it matters: this is the direct answer to "does the ending land" — the course's
actual closing exercise is a register-consolidation drill (じゃない/んだ/よ/ね/ます-plain
switching), not a comprehensive synthesis of everything taught across 29 modules. A
learner finishing m29 has never been asked to produce a weather-conjecture sentence, a
superlative, or an obligation sentence inside the same "final exam" that claims to be
"N5, all of it."

### かな's own promised nuance ("a subtlety for later") is never delivered before the course ends
module/lesson/step: m25 L7 (grammar_rule for かな) — never resolved anywhere in m26-m29
severity: minor
effort: S
confidence: verified
evidence: m25 L7 rule card: "be careful of one thing: 「〜かな」 aimed straight at somebody
can land as a hint that you want them to do something, which is a subtlety for later."
かな never reappears (see conjecture-family finding above; `grep -c` for true かな hits
on m26-m29 = 0 in every file), so "later" never arrives — the course ends four modules
after making this promise.
why it matters: this is a promise-not-kept in the most literal sense the audit brief asks
for: text explicitly says "for later," and there is no later, because the course is
over.

### m29 L11 re-teaches ちょっと-as-softened-refusal almost verbatim from m10 L6, without citing it — unlike every other rule card in the module
module/lesson/step: m29 L11 vs m10 L6
severity: minor
effort: S
confidence: verified
evidence: m10 L6 grammar_rule ("Softening with ちょっと"): "ちょっと literally means 'a
little', but its real job is SOFTENING. On its own — ちょっと… — it is a polite refusal
that never says no... 「きょうは ちょっと。」 Today is… a bit difficult (trailing off = a
polite no)." m29 L11 grammar_rule ("「ばんは ちょっと。」 — saying no without saying it"):
"This is the last thing N5 owes you and it may be the most used word in the language.
ちょっと literally means a little... its real job is to take the edge off a sentence that
would otherwise be too direct... an invitation is refused like this: 「ばんは ちょっと。」
The sentence stops." Both teach the identical two facts (literal "a little" + trailing-off
refusal) with structurally identical example sentences (「きょうは ちょっと。」 /
「ばんは ちょっと。」). Every other m29 rule card explicitly cites its home module —
"You have been saying 「じゃない」 since module 12," "んだ and んです were module 27's
item," "たい from module 13" — but the ちょっと card cites nothing and is framed as new
("the last thing N5 owes you"), even though `grep -ln 'ちょっと' m*.md` shows it was
fully taught with 12 exercises back in m10.
why it matters: the course's own citation convention (always naming the module a callback
comes from) breaks exactly once, in the very last new-content lesson of the whole course,
and the break makes 19-modules-old material read as if it were the final new thing N5
has to offer — a small credibility problem right at the point where the course is trying
to feel like an arrival.

### A casual friend-to-friend dialogue uses the polite どちら instead of どっち, contradicting the register rule taught two modules earlier
module/lesson/step: m25 L5 step 11 (dialogue_listen)
severity: minor
effort: XS
confidence: verified
evidence: m25 L5: "Mika: なつと あき どちらが すき？ Tom: あき。すずしいから さんぽを
する。" Tom's reply is plain/casual (no です/ます), confirming a casual register for the
exchange, yet Mika's question uses どちら. m20 L11 explicitly teaches: "どちら is どっち's
polite twin... with a friend it is どっち, with a shop assistant or a stranger it is
どちら." Every other same-register dialogue in m25-m29 gets this right — e.g. m26 L5
"Tom: バスと ちかてつと どっちが やすい？" and m28 L10 "Tom: バスと ちかてつと どっちが
いい？" both correctly use どっち between the same casual characters.
why it matters: this is exactly the "clashing politeness" defect the audit brief flags —
a single dialogue line contradicts a rule the course itself taught and otherwise applies
consistently.

### The last module of the course introduces zero new grammar, by its own admission
module/lesson/step: m29 (whole module)
severity: minor
effort: — (design observation, not a bug to fix by itself)
confidence: verified
evidence: m29's intro text states outright: "The last module of N5, and the one where you
stop learning new things and start choosing." Cross-checked against content: じゃない
(m12), よ/ね (new but simple particles), んだ/んです (m27), ます negatives/past
(long-established), invitations via ~ませんか (built from existing ない-form + か),
ちょっと-refusal (m10, see finding above) — nothing in m29 is a new grammatical structure;
all of it is a register skin on forms already taught.
why it matters: directly answers "is the last module the hardest, or does it sag" — by
design it does not attempt to be the hardest module; m27 (んだ/すぎる/なる) and m28
(duty/advice/want-conflict) are denser grammar lessons than m29. That may be a deliberate
glide-path ending rather than an accident, but it means the course's difficulty curve
peaks two modules before the end and then coasts — worth Spencer's judgment call on
whether that's the intended shape for a capstone.
