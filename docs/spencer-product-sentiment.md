# Spencer's product sentiment — how he decides, in his words

Purpose: predict his verdict before asking. Every triage of his feedback reads
this first. Every time he explains a *why* in a walk-through, add it here with
the item number and the quote. Started 2026-09-15 from the recurring-complaints
RCA (`docs/user-feedback/2026-09-15-recurring-complaints-rca.md`); the
"Talk-through" sections below are filled in as he goes through items.

Format per principle: **rule** — quote (item) — how to apply.

## Tiles and sizing

> Current values + rules live in `docs/mobile-sizing-spec.md`; entries below
> are history — his own words for *why*, not the numbers themselves.

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
- **Tile banks: revisit later; ghost + answer window now.** "For the tile
  banks, I think we can revisit those another time as long as everything
  fits on the screen for now. Maybe we look into tiles not leaving a ghost
  behind or something and dynamically scaling the answer window but leaving
  it bigger by default? Look into any psychology and accessibility and try
  to propose answers there." (2026-09-18). "Everything fits on the screen"
  is the current bar — not a redesign of the bank itself.
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
- **English glosses must carry the aspect the Japanese form carries.**
  "doesn't this imply the result happened?" (#200, on a ようとした sentence
  glossed with a plain "tried to" that reads as the completed-and-found-out
  aspect てみた actually carries). Apply: never gloss ようとした as bare
  "tried to X" — house wording is "was going to X," which correctly leaves
  the outcome open; "tried to" is てみた's English, not ようとした's.

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

> Current values + rules live in `docs/mobile-sizing-spec.md`; entries below
> are history.

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

- **Second dial-in (2026-09-15, saved from the QA page):** mobile plain tile
  18.3px word / 5×3.75px padding / 32px height floor; furigana 0.62em; ≤6-tile
  and listening tiers now scale off the plain tile too (the ≤6 tier's old
  cqh clamp was the reason his slider sat at the floor). "listening build…
  words don't fill vertically if no kanji. make sure it follows the other
  build types" → the kana-only growth rule applies to every build-type tile.
  Desktop untouched = the pre-dial-in numbers, restated in full so nothing
  mobile leaks upward.

- **Equal rows, then desktop follows the mobile vision.** "I want them equal,
  raise the floor… do a desktop pass… we have more room on desktop so scale
  appropriately closer to previous sizing before we did this pass." → the
  height floor is set to the kanji tile's height per breakpoint (45px mobile,
  51px desktop) so kana-only and kanji rows match; desktop keeps its larger
  pre-dial-in word/padding sizes but adopts the same structure (one row
  height, tiers scale off the plain tile, listen bank no taller than the
  tray). Rule: mobile is where he dials; desktop inherits the structure at
  desktop proportions, never the mobile numbers.

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

### Topic 4 — naturalness sweep + audio (#72 class, #93 #100 #106 #126 #127)

- **Local judge with replacements.** "yes local judge and even local judge
  replace if we can, have sonnet audit a few, but ideally a larger pass on
  words would be great… just the json, we can mechanically feed it things".
- **Kanji is the TTS source, always.** "kanji sources should be the default
  regardless and regenerate whatever I flagged where you can."

### Topic 5 — small verdicts (#122 #140, #141, #131, #136)

- **Grading accepts any proper alternate.** "accept whatever is proper grammar
  and has effectively the same meaning, local model pass might also be good
  for this." → a local-model pass proposes `alsoAccept` alternates for every
  build step (word order, adverb placement, wh-word position, topic drop);
  Sonnet audits; max 3 per step (memory `build-also-accepted`).
- **Follow native usage on kanji, explain on demand.** #141: "leave it if
  that's what natives do but maybe we make a note in one of the explains if
  they ever click it." こよう stays kana; the explanation mentions 来よう.
- **Rule tables drill the word on screen.** #131: "ideally show the drilled
  word's chips while they are learning." No alternate-example convention.
- **Lesson-complete = three buttons, Return goes home.** #136: "return should
  just take you back to the home page. target is 3 buttons… use your UI design
  to pick colors that fit in the theme and appropriate sizing." Fable owns
  the visual call; he sets the structure.

### Topic 6 — floors follow-ups (2026-09-16)

- **Speaking echo stays soft.** "ideally we do soft rule for speaking echo
  run-ins." A build followed by "say it aloud" is the production ladder; the
  reuse gate warns, never fails, on that pair.
- **Short answers get extended by the local model, mechanically.** "can we
  use a local model here? mechanical list of all words available and then
  slot in two more or something into the sentences?" → for each of the 656
  sub-5-tile answers (m12+): feed the sentence, its gloss, the exercised
  grammar point and the list of words taught by that module; the model
  extends to ≥ 5 tiles using ONLY those words; machine gates (taught-word
  check, tile count, grammar particle still present, no reuse within the
  lesson) filter; Sonnet audits a sample; Sonnet lanes patch the IR.
- **Rule it generalises to:** bulk content repair = local model with a
  closed word list + machine gates, not hand authoring.

### Topic 7 — iPad (2026-09-15)

- **Landscape = desktop, portrait = roomy mobile.** "iPad horizontal to
  mirror desktop UI with slightly bigger buttons and whatnot, and iPad
  vertical to just be the roomiest iteration of mobile we can get." So the
  layout tier is decided by orientation/width class, not by "touch = phone";
  portrait iPad must not flip to the desktop shell at 640px. Scoping doc:
  `docs/ipad-scoping-2026-09-15.md`. He tests on his own iPad from TestFlight
  (the binary is already universal).

### Architecture (2026-09-15)

- "standardize the class for tiles across everything and then populate them
  differently on load depending on step type… standardizing things with
  classes makes the app easier to contain, less code to handle, and easier to
  design language for me." One primitive per UI family, variants by data
  attribute, one CSS block, tokens dialled on the QA page. Prefer collapsing
  families over patching instances. Implementation lanes go to Opus when the
  change is structural; Sonnet for mechanical call-site swaps.

### Topic 8 — tiles do not resize while you build (#184, #185, 2026-09-17)

- #185: "Why does it size it weird like this? Pre shrinking? Cool animation and
  fit solution but not necessary here." A tile placed in the sentence must be
  the SAME size as the bank tile it came from; any size change on placement
  reads as a defect, however clever the fitting behind it. (It was a nested
  tray row shrink-wrapping the tile — a bug — but the verdict is broader: no
  visible re-fit during a build.)
- #184: "the dynamic font resizing is weird" — same rule from the other side:
  the stage must not re-negotiate mid-build. Space is reserved up front or
  reclaimed silently (spent tiles fold away after a moment); the font never
  steps while the learner is tapping.
- Predict: any future fit/fill change that makes a tile change size after
  the step has started is a NO, regardless of the geometry it saves. Verify
  with the multi-tap user simulation + frame capture before shipping, not a
  single settled capture.

### Topic 9 — tile ghost + answer window (2026-09-18)

- "For the tile banks, I think we can revisit those another time as long as
  everything fits on the screen for now. Maybe we look into tiles not
  leaving a ghost behind or something and dynamically scaling the answer
  window but leaving it bigger by default? Look into any psychology and
  accessibility and try to propose answers there." Research:
  `docs/tile-tray-ux-2026-09-18.md`. Findings: the huge-bank path (≥12
  tiles) already fades a spent tile to invisible with its footprint frozen
  (build 25) — that already matches "no ghost." The normal-bank path
  (98%+ of build steps) still leaves a dimmed, legible copy of the word in
  place indefinitely — that is the actual gap. The answer-window ask ("bigger
  by default, dynamically scaling") is already shipped as "THE ONE
  RESERVATION" (build 25): the tray reserves the exact height of the full
  answer, computed from the correct tiles, before the first tap, and never
  grows.

## General

- **Small things broadly affect everyone; "what would annoy a user" is the
  test.** A tile-tray fade or a few pixels of reserved height touch every
  learner on every build step — Spencer's own framing for prioritizing this
  kind of fix over a feature only some learners reach.
