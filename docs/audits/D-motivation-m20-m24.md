# Audit D — Motivation lens, m20-m24
Auditor stance: 15-year-old, four months in, anime fan, close to quitting.
Scope read in order: HOW-TO-READ.md, m20.md, m21.md, m22.md, m23.md, m24.md.
Cross-checks run against m1.md-m19.md via grep where noted.

---

### Every one of the 65 lessons in m20-m24 has exactly 7 or 8 build_sentence steps out of 18 — the lesson template never varies regardless of content
module/lesson/step: all lessons, m20 L1-L13, m21 L1-L13, m22 L1-L13, m23 L1-L13, m24 L1-L13
severity: major
effort: L
confidence: verified
evidence: ran an awk pass counting `[build_sentence]` steps per lesson block across all five files. Every single lesson (65/65, content lessons and reviews alike) landed at 7 or 8 build_sentence steps out of 18 total — never 6, never 9, never anything else. Full per-lesson counts recorded during the pass; e.g. m20 L1=7/18, m20 L9=8/18, m21 L9=8/18, m24 L13=8/18 — comparisons, family words, health, travel, and potential form all get the identical shape.
why it matters: a course that looks topically varied on the module list is mechanically the same 18-step worksheet every time — same ratio of drag-tiles to everything else, lesson after lesson for five modules straight. A learner four months in isn't reacting to "this lesson is boring," they're reacting to "every lesson is the same lesson wearing a new vocabulary list," and that fatigue compounds invisibly because no single lesson is the outlier to point at.

---

### self_explanation_mcq — the step type built to test WHY, not WHAT — appears zero times in 65 lessons
module/lesson/step: m20, m21, m22, m23, m24 — entire modules
severity: major
effort: M
confidence: verified
evidence: `grep -c '\[self_explanation_mcq\]' m20.md m21.md m22.md m23.md m24.md` returns 0 for all five files. This stretch is unusually rich in exactly the kind of conceptual traps self_explanation_mcq exists for: why いたい takes が and not を (m22 L1), why みえる differs from みられる (m24 L6), why つもり isn't たい (m23 L5), why とき's tense agrees with the main clause and not real-world time (m23 L9). Every one of these is tested only as "pick the meaning" or "fill the particle," never "explain why."
why it matters: the course has the tool to check whether a learner actually understood a subtle rule versus pattern-matched their way to a correct tile order, and for five straight modules it never reaches for it — on exactly the material where pattern-matching without understanding is most likely.

---

### conjugation_transform appears zero times in 65 lessons — no verb form, including the entirety of m24's potential form, is ever drilled in isolation
module/lesson/step: m20, m21, m22, m23, m24 — entire modules; sharpest in m24 (whole module is potential form)
severity: major
effort: M
confidence: verified
evidence: `grep -c '\[conjugation_transform\]' m20.md m21.md m22.md m23.md m24.md` returns 0 for all five files. のむ→のめる, たべる→たべられる, する→できる (m24 L1-L5), the て-form for てから (m23 L10), the plain-past for ことがある (m23 L1) — every new conjugation is only ever practiced pre-embedded inside a full sentence via build_sentence; the learner is never asked to just transform a bare verb and check the mechanical rule stuck before applying it in a sentence.
why it matters: without an isolated conjugation check, a learner who gets the sentence right by matching tiles to the English gloss can sail through an entire lesson on のめる without ever having to produce the -e-row-plus-る shift cold — which is the actual skill the module claims to teach.

---

### m20 Lessons 5-8 (72 steps) are four lessons straight of nothing but yen amounts and small-object counting, with zero character stakes
module/lesson/step: m20 L5, L6, L7, L8 (steps 1-18 each)
severity: major
effort: L
confidence: verified
evidence: L5 teaches hundreds (300/600/800 yen for ぼうし, とけい, めがね, じしょ), L6 teaches thousands (くつ, カメラ, じてんしゃ prices), L7 teaches the こ counter (たまご, きゅうり, もも, きのこ), L8 is a pure review of all three. Across 72 consecutive steps the only "content" is what something costs or how many of it there are — bus tickets, dictionaries, cameras, eggs, cucumbers, mushrooms, peaches.
why it matters: this is the single longest unbroken stretch of pure-commerce vocabulary in the five modules audited — no anime, no character conflict, no cultural payoff, just a shopping-till simulator for four lessons running. It's the part of the course most likely to be the exact moment a bored 15-year-old closes the app.

---

### Three modules running (m20, m21, m22) each burn a full lesson introducing yet another counter word via an identical template
module/lesson/step: m20 L7 (〜こ), m21 L6-L7 (〜はい / 〜にん), m22 L7 (〜ほん)
severity: minor
effort: M
confidence: verified
evidence: all four lessons share the exact same shape: a rule card walking through the same four irregular sound-change cells (いち/さん/ろく/はち or じゅう doubling/hardening), then a chain of build_sentence steps about buying or counting N of some object, ending in a "how many?" question form. Only the counter word and the nouns attached to it differ.
why it matters: counters genuinely need separate lessons, but three in a row using the identical rule-card-then-drill shape reads as the same lesson recycled with new nouns rather than three different lessons — exactly the kind of repetition a bored learner names as "didn't we just do this."

---

### はなす combined with quotative と + recipient に (m23 L11 step12) was never modeled — it cuts against the と=companion / に=recipient split m18 explicitly taught for this exact verb pair
module/lesson/step: m23 L11 step12 ("Build: I'll tell Tom I have worked abroad")
severity: minor
effort: S
confidence: suspected
evidence: tiles are こと|と|たべる|トム|で|が|がいこく|はなす|に|はたらいた|ある|くる|のむ, which only assembles into "がいこくで はたらいた ことが あると トムに はなす." m18 L9's rule card draws this exact contrast on this exact verb pair: "と marks the person you do it WITH: 「ミカと はなす」... に marks the person the words go TO" and pairs に explicitly with いう, not はなす. No rule card in m18 or m23 ever shows はなす taking a quoted-clause-と together with a に-marked recipient; every taught "tell X that ~" example in m23 uses いう instead (「あしたは いかない つもりだと ミカに いう」). The sentence is valid Japanese, but the specific combination is never modeled, and it reuses に on a verb the course only ever paired with と.
why it matters: the course spent a whole rule card sharpening exactly this と-vs-に distinction one module ago, then quietly asks the learner to produce a combination that blurs it back together, with no worked example to check against.

---

### The only two "I can actually do something now" payoff beats in this stretch arrive in the back half — the first ~39 lessons are comparison/counting/shopping/pharmacy content with no equivalent moment
module/lesson/step: m20 L1-L13, m21 L1-L13, m22 L1-L13 vs. m23 L7 (kanji reading set 2) and m24 (whole module)
severity: minor
effort: L
confidence: suspected
evidence: m23 L7's rule card explicitly names the payoff — "every one is a word you have already been reading for modules, quietly, with its kana floating overhead until the window closed. Now it reads cold" — and m24 is thematically built around new capability ("おさけが のめる" — I can drink now, I'm old enough). Nothing in m20-m22 has an equivalent beat; those three modules (39 lessons) are priced objects, list particles, family-address rules, and body-part grammar with no comparable "I leveled up" moment.
why it matters: if a learner drops out partway through the middle third of the course, they exit during the driest stretch and never reach the two moments in this run that would have told them the grind was worth it.

---

## Summary counts
- major: 4
- minor: 4
- blocker: 0
