# Spencer's product sentiment — how he decides, in his words

Purpose: predict his verdict before asking. Every triage of his feedback reads
this first. Every time he explains a *why* in a walk-through, add it here with
the item number and the quote. Started 2026-09-15 from the recurring-complaints
RCA (`docs/user-feedback/2026-09-15-recurring-complaints-rca.md`); the
"Talk-through" sections below are filled in as he goes through items.

Format per principle: **rule** — quote (item) — how to apply.

## Tiles and sizing

- **Legibility first, box second.** "we didn't shrink the furigana small
  enough here and instead shrunk the other hiragana and kanji, needed to be
  the other way around" (#87). Never shrink the word to hold a box height.
- **One tile height across every build-type surface; furigana does not
  change it.** "ANY build step is so inconsistent in sizing on cells… the
  height of every tile should be the same, furigana should not change that"
  (#137). Sizing changes are re-shot on every tile surface, not one.
- **No visible reading = big word.** Kana-only tiles and mastered-kanji
  tiles fill the band a reading would occupy (#117, #119, build-16 to-do).
- **Measure on his phone, not Chromium.** 15 Pro Max simulator, real WebKit,
  real SRS state (b14 "why missed"). A number from headless Chromium is not
  a measurement.
- **Take Duolingo's tile sizing and alignment, never its colours** (#69,
  memory `duolingo-reference-scope`).
- **No scroll inside a step when it can be avoided.** "There should be no
  scroll here… scroll needs to be deactivated if someone is moving a tile"
  (#89). Dead space is a defect: "look at all the wasted padding" (#143).

## Japanese content

- **Closest 1-to-1 English gloss, US English, no register baked into the
  answer.** "we need to use the CLOSEST English 1-1 word translation" (#76);
  "Cheese are bad, chikatetsu is subway" (#19); "we just need the plain
  translation" (#15).
- **Speak like an average 30-year-old.** "we need to make sure our Japanese
  is based on currently used verbiage… we ideally want people speaking like
  your average 30 year old" (#98). Primary verb first (電話する before
  かける).
- **A new sentence per step type; never the simple form after the hard
  one.** "I was just asked this question in a different font" (#138); "the
  simple version is useless since they just learned it" (#135).
- **Build steps are never shorter than five tiles at this level.** "At this
  point they should NEVER be shorter than 5 tiles" (#139). *Open: answer
  tiles or bank tiles — see talk-through.*
- **Low-module filler does not belong in advanced work.** "they don't belong
  in more advanced course work outside of review" (#91, #116).
- **Accept valid Japanese.** Word-order and adverb-placement alternates that a
  native would say must pass (#21, #122, #140); grade answers, not the one
  authored string.
- **Explain the why on a miss.** "Can we get the card to explain why?"
  (#121). A rejected answer should teach, not just reject.
- **Kanji should follow the learner, not the module.** After test-outs he
  expects kanji everywhere the learner has earned it (#115, #120, #133,
  #141). *Open: N5 catalog scope and cloze options — see talk-through.*
- **One clip per surface, from kanji.** Homophones must not share a clip;
  TTS input is the kanji surface (#93, #106).

## Review and SRS

- **Anki semantics.** "remember how Anki works I should have infinite
  reviews" (#113); nothing he marked today is served again today.
- **Known words are not reviewed.** Tested-out words at ≥90 days are known
  and suppressed (#80); いいえ has no business in advanced review (#116).
- **Deck hygiene.** No inflected forms as cards (#17); no near-duplicate
  register pairs at beginner levels without a reason (#108–#111).

## Screens and chrome

- **Every surface fits a notch phone without horizontal scroll** (#38, #43).
- **Info and rule cards fit the screen or scroll; one row per word, rule
  aligned to the kana ending it explains** (#131, #132, #39).
- **Use the space: show the English when they get it right** (#142).
- **Test-outs: no image MCQ, no repeated sentence, no audio bleed** (#92,
  #129, #127).

## Process (how he wants the loop run)

- **Quantify risk as numbers**, not assurances (memory
  `quantify-risk-before-shipping`).
- **Cheap labour out, Fable verifies** (memory `outsource-cheap-labor`);
  Fable never bulk-authors inline.
- **Fix the class, not the instance.** "look for similar issues please" (#19)
  — every fix ships with a sweep for its siblings.
- **Say why it was missed.** He asks for the honest accounting, not the fix
  alone (b14).
- **One push per lap; preflight only for code** (2026-09-15).

## Talk-through log (2026-09-15, b15 items)

Filled in as we go: item, his verdict, the reason in his words, the rule it
generalises to.

### Topic 1 — one tile height (#137, #143, #119)

- **Verdict:** build the tile QA page now. Match-pair tiles may be their own
  height "as long as they are uniform and fit on the page with no scroll".
  Do NOT touch match sizing until he has dialled build tiles in on the page:
  "wait for me to zero in my build tiles sizing first".
- **What the page must do, his words:** "views of desktop and mobile,
  potentially different sliders for each, dynamically updating so I can dial
  it in. size it same physical dimension as my phone too if we can relative
  to my mac."
- **Rule it generalises to:** sizing is dialled by Spencer on a live page
  with real components, per breakpoint, at physical scale — not set by Fable
  from a screenshot. Fable ships the dial, Spencer turns it, Fable commits
  the numbers. Any future sizing complaint routes to the QA page first.

### Topic 2 — kanji follows the learner (#115, #120, #133, #141, #119)

- **No kanji ceiling.** "any taught kanji should surface, no ceiling, if they
  have learned it through our 2 or something kanji steps, then they should
  see it on EVERY occurrence of the word." The N5 anchor list is not the
  limit; the course's own kanji-teaching steps are. 時計 surfaces once 計 is
  taught. Irregular forms inherit (来よう once 来る is shown).
- **Kanji on cloze options too.** "I think we need kanji on them, kanji was
  likely removed due to authoring issues where you wouldn't be able to insert
  them correctly BUT find a way to do it and make it believable and a good
  distractor." Display kanji + reading on options; distractors must stay
  plausible in kanji (a fake conjugation must still look like one).
- **Reading visible until mastered; test-out seeding counts as mastery past
  its threshold.** "they need to see the reading until they master it AND we
  use the X days seeding I mentioned earlier to count when a word is mastered,
  if tested past its kanji teaching, show kanji regardless and then only hide
  reading for words mastered (those moved past X day with test-out math)."
  So: kanji = taught-by-position (position includes tested-out modules);
  reading hidden = mastered by real reviews OR seeded interval ≥ the #80
  "known" threshold (90 d). Seeded below the threshold keeps the reading.
- **Rule it generalises to:** learner state drives display, content drives
  eligibility. One policy function for every surface; never a per-surface
  gate again.

### Topic 3 — content floors (#139, #138, #135, #91, #116, #129, #90)

- **Answer length floor.** "5 tiles in the answer, and yeah m11 is good for a
  cutoff — at LEAST 5 tiles in the answer in anything after m11." Floor is on
  the ANSWER, not the bank; applies to build steps in modules after m11.
- **Sentence reuse spacing.** "one sentence should NEVER be less than two steps
  between re-uses even if the step type is different, and ideally we keep the
  space greater than 2 steps where we can." A gate, not a style note: same
  normalised sentence within a lesson needs ≥ 2 steps between occurrences,
  more when possible. Test-outs: never the same sentence twice (#129).
- **Review window + FSRS half.** Look-back of 6 modules for in-lesson review
  and filler pools unless the word is due: "yeah that should be perfect and
  THEN we can add half of the lesson as fsrs seeded reviews, the same way we do
  the review lesson tails, so half recent things, half fsrs learnings." The
  review portion of a lesson = half recent (last 6 modules), half FSRS-due.
- **Rule it generalises to:** selection code carries explicit floors and
  windows; "the pool had it" is never a reason a step was served.

### Architecture (2026-09-15)

- "standardize the class for tiles across everything and then populate them
  differently on load depending on step type… standardizing things with
  classes makes the app easier to contain, less code to handle, and easier to
  design language for me." One primitive per UI family, variants by data
  attribute, one CSS block, tokens dialled on the QA page. Prefer collapsing
  families over patching instances. Implementation lanes go to Opus when the
  change is structural; Sonnet for mechanical call-site swaps.
