# Workshop agenda — from the 2026-07-12 live QA run

Companion to `qa-live-findings-2026-07-12.md` (per-note dispositions).
These are the items needing design decisions, with current status.

## A. grammar_rule redesign — PHASE 1 + REACTIVE BUILT (2026-07-12, E2E-verified)
Spencer's direction: productive teaching, not a reading wall.
- Rule card shows the rule + ONE example sentence, compact.
- 1-2 further example sentences appear INSIDE existing lesson formats
  (drills), not as more card text.
- Anti-rule shown as its own later exposure, possibly with examples that
  highlight the wrongness.
- Culture note "sprinkled" — reading walls impede gamification.
- Open idea: distribute one of each card across a module's 2-3 sub-lessons
  instead of front-loading a monolith.
- Key technical fact: `GrammarRuleStep` already stores rule / examples[] /
  antiPattern / cultureNote separately — micro-cards can derive from the
  SAME authored object; no content re-authoring for the card split itself.
- Research verdict (agent + transcript study, 2026-07-12):
  - Segmenting + worked-example fading + retrieval-first: solid evidence.
    Rule-first vs example-first: no winner — state the rule explicitly,
    either order. ≥3 interactive steps per static card; card ≤ ~50 words
    (238 wpm reading anchor); ONE example on the card, rest as drills.
  - Anti-pattern: NEVER first, never voiced/typed by the learner, one
    ✗-labeled exposure per session max. Best timing = reactive (fire when
    the learner makes the target error); fallback = once after the first
    practice block. Error-SPOTTING drills beat passive anti-cards
    (self-generated detection). Anti-pattern must recur in spaced review
    (one-shot negative evidence decays).
  - Culture notes: Spencer's instinct validated hard — JFZ ships 9 culture
    clips per BOOK; Cure Dolly ~zero. Non-blocking flavor only, ≤30 words,
    progressive disclosure is fine for culture (never for answer-critical
    info).
  - Placement trap: don't exile explanations outside the flow (Duolingo
    guidebook discoverability collapse + user revolt); dosage and placement
    are the fix, not deletion. Duolingo's own data: short grammar lessons
    2x errors, same completion, fewer later errors.
  - Cure Dolly's structural pattern: one-line thesis, ONE anchor sentence
    mutated 8-10 times, misconception woven in as the hook, model as
    refrain.
- LOCKED PROPOSAL (pending Spencer sign-off):
  Phase 1 (central post-pass in getMockLessonContent, zero re-authoring —
  all 37+ points inherit):
  1. Lessons render grammar_rule COMPACT (existing deck variant: title +
     rule + example #1). antiPattern/cultureNote stripped from the card.
  2. Derived ANTI-CARD (✗ struck wrong / ✓ right / one-line why) inserted
     after the 3rd gradable step of the point's lesson (static v1).
  3. Derived SPOT-THE-MISTAKE MCQ ("which is correct?" — tap only, never
     voiced/typed) opens the point's SECOND sub-lesson where one exists,
     else lands late in the same lesson.
  4. Culture note → one-line non-blocking flavor on lesson-complete +
     stays in the deck refresher.
  5. New conformance guard: every rule-card example must be drilled in the
     same lesson (m27 already passes).
  BUILT (Spencer approved reactive + flavor-chip variants): compact card
  in lessons (rule + example #1 + tap-to-expand culture chip); reactive
  ✗/✓ "Quick fix" card with rule flash, fired on the learner's actual
  error via reactiveGrammarTip tagging (deriveGrammarMicroSteps post-pass,
  once per point per session); derived spot-the-mistake MCQ at the end of
  each drill span (guaranteed single ✗-labeled exposure, never voiced,
  slot-rotated); all ~93 anti-patterned points inherit, zero re-authoring.
  E2E-verified on ja-m27-2-1. Remaining Phase 2: per-point knowledge page
  (compiled card+anti+culture, linked from lesson-complete);
  expertise-reversal fade (mastered points skip the card, reactive-only);
  anti-pattern resurfacing in the grammar deck's spaced review.
  Case study: ja-m27-2-1 — all 3 card examples already exist as drills in
  the same lesson; the monolith card is pure duplication today.

## B. Listening sentence expansion — WAVE COMPLETE (2026-07-12)
381/381 items converted by 5 parallel agents, zero skips; full suite 2,794
green; ratchet baselines zeroed (flat ban now) with -kata lessons exempt
(script acquisition); 299 new TTS clips generated post-wave.
Original scoping below for the record.
### (scoping record)
Audit result: listening_build is ALREADY sentence-first from M3 (only ~34
word-level stragglers, pockets in M5/M9/M10/M11); the real gap is
listening_comprehension — ~360 word-level items spread evenly across
M5-M27 (10-25 per module). M1-M4 word-level is correct (kana acquisition).
Landed: authoring rule in lesson-authoring-guide.md §4b + ratchet guard
(listeningGranularity.test.ts — per-module word-level counts can only go
DOWN; regression = hard fail).
Wave (needs go-ahead): per-module-band authoring dispatches converting
word-level lc items to sentence items (existing vocab in context, gate-
checked), burning the ratchet baseline down band by band; each band ends
with TTS emission for new sentences. Suggested order: M5-M8 (grammar spine
early, biggest exposure win) → M9-M17 → M18-M27. Rough size: ~390 items
total ≈ 4-6 authoring dispatches.

## POLISH BACKLOG (accumulating)
- "Why" cards pass-through: per-distractor why-wrong lines on cloze/MCQ
  items so wrong-answer feedback diagnoses the learner's actual pick
  (the full fault-diagnosis endgame beyond the reactive grammar tip).
- symbol_to_sound centering audit (from live QA run).
- Build-tile footprint packing (item C — awaiting specimen screenshot).

## C. Build-tile footprint — AWAITING SPECIMEN
Needs one screenshot of a wasteful build step from Spencer, then cap/pack
the tile bank like the match-card fix.

## D. particle_cloze usage policy — LANDED (2026-07-12)
Boundary chosen: a particle's clozes live within INTRO MODULE + 2; later
contrast drilling belongs to review lessons + grammar deck (interleaving
surfaces). Audit: 232 true-particle clozes, 82 late usages grandfathered
into a shrink-only exemption list (particleClozePlacement.test.ts —
new late usage = hard fail). Authoring rule in guide §4c. Adjust the +2
boundary in one place if Spencer wants it tighter/looser.

## E. phrase_card — CLOSED (2026-07-12, Spencer: "keep")
Shelved for authoring (guide §4b2); retained in engine; sole sanctioned
home is the /try preview opener (cold-visitor introduce-then-recall).
Survival sidequest (the other user) is already off the map.

## Standing authoring rules distilled from the run
1. Show the frame once; test only the differentiator.
2. Distractors must be cleanly wrong (no register-variant quasi-corrects).
3. Every cloze carries enough context to force exactly one answer.
4. Particles are always their own tiles (machine-enforced).
5. Content fits the viewer; inner-scroll only; CTA stays anchored.
