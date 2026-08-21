# Course-wide design laws — distilled 2026-08-21

What the ES/FR restart taught that applies to EVERY course and was not
already written down. The per-step pedagogy lives in the authoring guides
(JA guide §13, ES guide §13 incl. the §13.9 retention laws); the lenses
live in CLAUDE.md. This file is the layer above those: how courses get
built, gated, and shipped. Each law names the incident that taught it —
delete a law only by naming a better one.

## 1. The learner-sim pass is a GATE, not a study

Before any human walks a module, fresh-persona agents walk the emitted
learner view (`features/lesson/dev/learnerViewRender.ts` + the
`*LearnerView.emit.test.ts` emitters) in character: a confusion walk, a
memory/next-day walk, an ease/flow walk, a wildcard. What they catch, no
lint can: the learner named after an NPC standing in their own scene,
tap-to-preview acting as an answer key, a checkpoint that reads as the
finish line two lessons early, a discrimination pair trained toward a
false always-answer-X rule, 48% of steps carrying zero retrieval demand.
Synthesize across walks, fix, re-emit, THEN hand it to a human. The 4-agent
es pass and the 5-agent es/fr pass each paid for themselves within an hour.

## 2. The human walk is the audition for everything riding it

One Spencer walk of fr m1 closed three things no machine could: the course
voice (Denise — passed), the recognizer writing "1 2 3 4" for a correctly
spoken «un deux trois quatre», and a tile bank whose most natural composed
answer («oui deux s'il vous plaît») graded wrong. Machine-green is the
floor, never the ship signal. Schedule the human walk as the LAST gate of
any module promotion, and treat every friction it finds as a defect, not
feedback.

## 3. Graders must invert whatever stands between the learner and the target

The same bug shipped independently three times in three scripts: Whisper
inverse-text-normalizes spoken numbers into digits, so the words the
learner actually said never string-match the target — JA (`numbersToKana`),
KO (`numbersToKorean`), then ES/FR (`numbersToRomance`, all in
`shared/speech/loose-match.ts`). The class, not the instance: ANY
normalizer in the path (digit ITN, accent folding, apostrophe variants,
kana/romaji) must be inverted target-aware before comparison, digits→words
only, no-op when the target has no matching form. When a new language
lands, budget its converter on day one — the bug WILL be there.

## 4. QA surfaces walk the render pipeline, never raw steps

The dev walkers originally served raw authored step arrays. Real lessons
go through `getMockLessonContent` — review-tail augmentation, match-grid
padding, tile floors, surface substitution — so raw-step QA silently
under-tests what learners see. All QA walkers now resolve through the
pipeline. Corollary of [[built-surface-drift]], one layer up: it is not
just bundles that drift; any parallel path to content drifts.

## 5. Promote or delete — a content fork rots in days

For two days the tree held two Spanish m1s and two French m1s (course
spine vs dev prototypes). Within hours of fr becoming selectable, the
course's own author walked the wrong one and diagnosed a regression that
did not exist. Content may exist in exactly ONE live place; the moment a
rewrite is accepted, promote it into the single source and archive the
old under `curriculum/_archive/` (labeled, referenced by nothing — the JA
ruling). Prototype status is a phase, not a home.

## 6. Gates evolve by education, not exemption counts

When doctrine legitimizes a new interaction mode, the lint learns to
RECOGNIZE the mode — with the incident dated in a comment — rather than
gaining a debt allowance. This restart taught the bars: audio-prompted
word MCQs are retrieval, not banned reuse (inv 44); a two-option cloze
whose options are both taught is a discrimination trial by design (pin
E2); a word_map is a debut (FR intro types); a cloze's confirmation audio
is not a surface exposure (inv 24). Debt numbers only shrink; sanity
FLOORS re-base explicitly (with the old number and why) when the
denominator changes, as when 19 modules became 2.

## 7. Module shape is derived from the module, never assumed by the gate

The 8-lesson assumption lived in FOUR gate files (`moduleContentLints`
×2, `moduleBarGuards` /-8$/ ×2, the quality tests' L1–7/L8 split) and all
fired at once when 9- and 10-lesson modules landed. Gates now take an
explicit `expectedLessonCount` and derive mastery (last lesson) and the
checkpoint (the module's own exported index). Any constant a gate shares
with content must come FROM the content's exports.

## 8. The learner is a named person and the world answers back

Every course carries a canonical learner persona — name (Sam) and
hometown — registered in the proper-name allowlists beside the NPC cast.
NPCs never lend the learner their name (the sim-pass's single worst
immersion break), sims trap the lesson's own contrast, and NPCs respond
to the learner's questions («¿y tú?» gets an answer). Cast and persona
are per-language data with the same provenance discipline as vocabulary.

## 9. Audio pacing is authored content

A counting run recorded as prose («un deux trois quatre») teaches less
than the same clip with pauses. The comma IS the pause in edge-tts, so
the comma lives in the authored text — display and clip share one string,
and the TTS hash follows it. When a clip should breathe, write the
breath into the content; never ship list audio as a run-on.
