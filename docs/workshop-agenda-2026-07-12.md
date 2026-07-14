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

## POST-PUSH REVIEW FINDINGS (2026-07-12 evening, 3 review agents over 13a7f22..4aeada9)

Fixed same evening (in working tree):
- Quick Fix modal keyboard leak: Enter advanced the lesson BEHIND the open
  modal and could never dismiss it (useLessonKeyboard preventDefault).
  Capture-phase swallow added; Enter/Esc/Space now dismiss.
- Placement cloze gloss truncated at apostrophes ("I don", "Let") on 9
  live items — greedy quote match now.
- Typed trailing 。/. failed correct translate answers — typed side now
  strips terminal punctuation like the authored side.
- placedIndex (romaji auto-off) now counts assumed modules, matching the
  assume-complete policy.
- m22 このまちのなかで×Kyoto/Hiroshima semantics fixed (みっつのまち);
  m13 かおを glue split; 294 missing TTS clips generated (courseAtoms now
  a scanned TTS source — review-tail draws can no longer go silent).
- Silent spot-drop now warns in dev (deriveGrammarMicroSteps).

### Grammar micro-teaching phase-2 additions (design work, not quick fixes)
- BACK-TO-BACK RULE CARDS (ja-m17-2-1 に/へ): first point's spot + tip
  vanish; its drills get the SECOND point's tip. Needs span markers or
  merged two-point handling. Highest-value fix of the batch.
- OVER-TAGGING: the tip span runs to end-of-lesson, so prior-vocab recap
  steps carry the grammar tip — a wrong recap match pops a non-sequitur
  Quick Fix AND burns the once-per-point budget. Needs a span boundary
  (stop at recap block) or exercisedGrammar tags on drills.
- SPOT PLACEMENT: 73/89 spots land after the recap block (end of lesson)
  instead of capping the drill span. Same root cause as over-tagging.
- Lessons at/over density 25 (ja-m19-5-2, ja-m27-4-1) silently get no
  spot; m17-2-1 loses one to the empty span. Now logged in dev; needs a
  per-anti-rule test assertion once placement is redesigned.
- "Got it — try again" copy lies: the wrong verdict is already committed;
  the retry actually comes in the replay tail. Reword or wire a real
  immediate retry.

### Placement phase-2
- Assumed-module completions are LOCAL-ONLY: server sync sends
  passedModules only, so a device switch resurrects the "go do them"
  state the policy was built to kill. Decide: sync assumed set (server
  schema change) or derive assumed on hydrate.
- Edge state passed=[] + assumed≠[] is inconsistently handled (script
  modules not auto-completed, result headline says "starting from the
  top" while the map shows credited modules).
- Cloze chip cosmetics: leading-space chips (pt-m5-kudasai), unnatural
  splits (そ/こ/あ/ど; 그+리고). Gradable but ugly — polish pass.

### Listening follow-up wave (small)
- ~31 literal word-level LCs the ratchet regex can't see (がつ months,
  はち, に, はな, もの, とうちゃく, まちがえる…) + 67 dynamic
  review-tail LCs. Convert + tighten heuristic to token-boundary.
- Tile-spacing style is inconsistent across bands (「ジュース は」 vs
  「せんせいは」) — cosmetic, wave-band artifact.
- m22 のほうが glued vs m27 ほう|が split — pick one policy.

### QA-page ralph audit (fixed same evening)
Dark-mode/token fixes, ?step=<type> deep links, fixture hash-scroll +
lazy-mount + per-Reset fresh ids, 2 missing fixtures (self_explanation_mcq,
dialogue_listen) + coverage test, named play tab, section progress counts,
jump-to-first-unmarked, per-language note storage, sendBeacon flush,
orphan-note export, middleware hardening, sidequest early-pick bug,
symbol_production mislabel (ships via kana learn flow), stories-flag dead
link, conjugation /train needs ?types=. Remaining page idea (unbuilt):
auto-mark rows visited when the play tab returns.

## DRIVE 2 RESULTS (2026-07-13 evening — full checklist walked, live-fixed)

All five re-verify rows + all four mechanics rows signed GOOD. Fixed
during the drive (each test-verified, hot-reloaded into the session):
1. build_sentence AUDIO LEAK — word builds auto-played the target
   sentence, turning production into transcription. Silent pre-answer
   now; model plays after submit; kana char-builds keep mount audio.
2. dialogue_listen turns OVERLAPPED (70ms/char estimate ≈ half Nanami's
   pace) — sequencer now chains on real clip end (playJaAudioToEnd).
3. Match grids drew SENTENCES via padMatchPairsFloor (phrase-kind atoms)
   — words-only filter + matchPairsWordOnly.test.ts flat guard.
4. Vocab page listed the same 24 phrase atoms as word tiles — filtered
   (kind facet now vocab|particle).
5. Review-lesson MCQs: word-only grids now center EVERY tile at one
   uniform size (≤2-char cutoff left とけい tiny next to blown-up に).
6. Test-outs WIRED TO DERIVED SETS (Spencer sign-off): 12 real lesson
   steps per module (was 3 bank items), miss budget 2 at ≥10 items,
   consecutive-wrong cutoff 3 for test-outs (2 would pass on partial
   evidence). deriveModuleTestOut TESTOUT_SIZE 10→12.
7. fc-review grade buttons shifted when the async image grew the card —
   image cards reserve height on both faces.
8. Conjugation hub: one click-through now flips ALL locked tiles to
   advisory (M-chip, fully usable); lock label restyled as pill.
9. Learn map now auto-centers the CONTINUATION POINT on load (scoped to
   the map scroll region; mobile falls back to scrollIntoView).
10. Story/dialogue voices: per-speaker detune/rate coloring + bold
    "X is speaking…" banner. Quick Fix modal type bumped per note.
11. Placement "falsely awarding" = progress pollution from earlier QA
    rows (placement only ADDS credit) — clean-slate recipe pinned on the
    row. RE-VERIFY on a cleared account.

### New backlog from drive 2
- Counters trainer: visual pass to conjugation-tile feel; typed
  PRODUCTION mode (pairs with typing-ladder rung 2).
- Reading/speaking: visual refresh; kanji-where-applicable display
  option; longer stories. Concept graded "amazing".
- Speaking step: replace circular mic button with a fill bar; prompt mic
  permission per occurrence when not bypassed (stale note, still open).
- Travel sprints: MORE of them; add a knows-the-words-already check
  (sidequests do teach in-lesson — verified).
- Story dialogue phase 2: REAL second TTS voice per speaker
  (lingo-core scripts/tts/add_alt_voice.py; manifest needs voice keys).
- Learn map: spacing rhythm between node types still inconsistent
  (continuation point fixed; spacing needs a design pass).
- SURFACE CULL (Spencer lean): /practice/particles reference +
  /practice/kanji page both "potential deprecate". fill_blank "good
  lesson but doesn't feel like it belongs anywhere" — retire lean.
- fc-manage: show a "no subscriptions yet — browse Community decks"
  empty state; verify the subscribe→manage flow end-to-end.
- Settings surfaces: untested ("too lazy, will surface later").
