# Follow-ups

One-line follow-ups discovered while finishing the social/community surfaces.
Each entry: `file:line — note`.

## Backend contracts the frontend is waiting on

- `lingo-core` POST `/social/threads/{thread_id}/messages` — frontend composer
  (`src/features/social/sections/MessagesSection.tsx:128`) appends locally only;
  drafts evaporate on reload until backend ships the send endpoint.
- `lingo-core` POST `/social/threads/with/{user_id}` — opens-or-fetches the
  thread between two users; today the frontend "Message" affordance on a
  friend row deep-links to `/messenger/{friend_id}` and lets the messenger
  fall back to the most recent thread when no match exists.
- `lingo-core` GET `/social/suggestions[?lang=…]` — until it ships,
  `useFriendSuggestions` (`src/features/social/hooks/useSocial.ts:308`)
  synthesizes suggestions from `/quest-targets` minus current friends/requests.

## Frontend cleanups deferred (low priority)

- `src/features/social/hooks/useSocial.ts:143` — the `useSocial()` bundle hook
  stays mock-backed for `SocialHeader` and `home/SocialCard`. Move both
  consumers onto the granular hooks so the bundle can be deleted.
- `src/features/community/ContentBrowserPage.tsx:530` — TODO comment about a
  flagged-off route; resolve when the route lands or remove the flag entirely.
- `src/features/community/CommunityRightRail.tsx:13` — `MOCK_TOP_CONTRIBUTORS`
  / `MOCK_TRENDING_TAGS` inline mocks; replace once the community contributors
  + tags endpoints exist.
- `src/features/home/restructured/{AccountOverviewCard,QuestsCard,RecentPracticeTile,CommunityStrip}.tsx`
  — read from `mockHomeData.ts`; wire to real progress endpoints when the
  home restructure picks up backend work.
- ~~`useQuests.ts` localStorage swap~~ — DONE 2026-06-13: hook is
  server-authoritative against the real `app/quests/` backend (the
  2026-05-25 "backend shipped" claim was false — that agent died
  uncommitted). Remaining: client-side application of `adFreeMinutes`
  claim rewards; friend-quest generation.
- `src/features/profile/PublicProfilePage.tsx` — relies on
  `friendship_status` from `social.getPublicProfile`. If a user has never
  triggered the social cache yet, all profiles show "Add friend". Acceptable
  for MVP but worth an eager prefetch in `AuthMenu` on app start.
- `src/features/social/components/ProfilePreviewPopover.tsx` (the older one)
  routes to `/u/<user.name>` (display name), not username — names with spaces
  404. One-line fix to use `username` instead.
- `src/features/community/PeoplePage.tsx` — never landed (friend-discovery
  agent crashed mid-write). Only its seed `maintainerAuth0Id` deck
  attribution survived. Pick up the find-friends browser scope when ready.

## Theme tokens

- `src/shared/styles/tokens.css` stores color values as hex strings
  (`--color-accent: #059669`). Tailwind v3's alpha-modifier syntax
  (`bg-accent/80`) requires the source to be a channel triple
  (`5 150 105`) + `rgb(var(--color-accent) / <alpha-value>)` in
  `tailwind.config.js`. Today every `bg-/text-/border-{accent|warning|
  success|error}/<N>` class silently emits no CSS. Patched two visible
  offenders (`WeekSparkline`, `PracticeHubSection`); the proper sweep is
  one commit affecting tokens.css + presets.ts + web-adapter.ts +
  tailwind.config.js. Resurrects every `*-token/<N>` class app-wide.

## UI primitive migration

- ⚠️ **LOST WORK (verified 2026-07-20):** the `refactor/ui-primitives-
  consolidation` branch is GONE — no local or remote ref, and commit
  `a7690d5` no longer exists as a git object (`git cat-file -t a7690d5` →
  "Not a valid object name"). It is unrecoverable in this repo; do NOT try to
  pull it. The modal-stack migration was NEVER done another way: legacy
  `ConfirmModal` / `ModalBase` / `ModalBackdrop` still ship alongside the new
  `Modal` / `Dialog`, with live call sites remaining (`ConfirmModal.tsx`,
  `ModalBackdrop.tsx` + consumers in admin/ads/social/learn). The migration
  must be REDONE from scratch when prioritized — treat this as an open task,
  not a recoverable commit.

## Lesson UI polish ledger (M1–7 walkthrough, 2026-06-13)

### DONE this session (uncommitted, pending Spencer review)
- Empty SRS review (`ja-mN-review-1/2` with nothing due) no longer awards XP / marks the node complete — `isEmptyReviewLesson` guard in `LessonPage.tsx` + `emptyReviewGuard.test.ts`. Redirects to Learn, hides the XP chip.
- SymbolIntro single-glyph dead-space: content centered in space above the CTA (`flex-1 + justify-center`).
- CTA harmony: SymbolTrace / SymbolProduction / DialogueListen now anchor the Check button at the standard y≈749 (added a `flex-1` spacer) instead of floating ~130px high. DialogueListen banner no longer nudges the CTA on commit.

### OPEN — deferred, don't forget
- **Match-pairs shouldn't use full sentences** as match items — looks tacky. Prefer single words / short phrases. (Spencer flagged.)
- **SymbolIntro residual top dead-space**: centering leaves an equal gap above the glyph; Spencer suspects it may be a light-mode perception thing. Revisit.
- **Correct-answer celebration is brief (1100ms `CELEBRATE_MS`)** — fast clickers barely register it. Optional: bump duration or make it more felt. (Affirmation exists in every graded view; not missing.)
- **CTA anchor unverified on Translate / FillBlank** — measured Trace/Production/Dialogue + 6 anchored views; these two share the top-stacked root pattern but weren't reached. Check they hit y≈749.
- **Trace CHECK is clickable on an empty canvas** → scores 0% / burns an attempt. Could disable until `hasStrokes`.
- Cosmetic: generic globe icon reused on every `infoStep` open card; double romaji (per-kana ruby + transliteration line) on grammar/example cards; particle を shows ruby "o" but line "wo" (harmless convention mismatch).
- Row-test "3 dots" = mistake indicator (`MAX_TEST_MISTAKES`), not progress — could be clearer to a first-timer.

## M9–M15 review (2026-06-13)
- GRAMMAR: accurate across all 7 modules incl. the famous traps (te-form う/つ/る→って + いく→いって + かえる; month しがつ/しちがつ/くがつ; minute ごふん-not-ぷん; いい→よかった; が-marking for すき/じょうず; な-adj じゃない-not-くない). Wrong forms are consistently used as deliberate distractors/antiPatterns with explicit callouts. No content bugs found.
- COVERAGE GAP (not a bug): the conformance guards (atom-coverage, moduleConformance, mcq-position-distribution, kanaWordIntroOrder) stop at M7. M8–M15 grammar is correct but NOT machine-protected for intro-before-review / density / atom re-surfacing / MCQ-slot distribution. Consider extending the test ranges to M8–M15 (watch the m[3-7] hardcode landmine).

## Curriculum rigor + retention architecture — NEEDS DEEPER LOOK (2026-06-13)
Two items from the M9–M15 review discussion, both deferred for a dedicated pass:

1. **Machine-guard the whole course (not just M1–M7).** Extend the conformance
   suites — atom-coverage, moduleConformance, mcq-position-distribution,
   kanaWordIntroOrder, sub-lesson-density — to cover M8–M15 (and stay generic as
   the course grows). These tests encode the research constraints
   (intro-before-review, ≥1 cued/free-recall, slot rotation, atom re-surfacing
   ≥3×); leaving M8–15 uncovered means compliance rests on author discipline.
   ⚠ Watch the `m[3-7]` / range-hardcode landmine when widening ranges.

2. **Retention on-ramp / SRS population (higher leverage).** SRS state is written
   ONLY in the optional review-lesson nodes (Spencer's invariant). A learner who
   does the 6 content sub-lessons but skips the 2 review nodes gets ~3–7 *massed*
   encounters and NOTHING scheduled in FSRS → decays to recognition that fades in
   ~a week (learning-science-foundation §4.5). Need a deep dive on getting atoms
   into FSRS earlier without breaking "reviews are the only graded surface," plus
   cross-day spacing nudges (the §4.4 "come back tomorrow" gating already
   recommended). Research basis: Cepeda 2006 (spacing ratio), Roediger & Karpicke
   2006, Nation (~8–15 encounters for durable vocab; lessons supply ~5–7).
   NOTE: lessons are correctly sized per CLT (2–4 atoms) — do NOT fatten them;
   "more depth" = more spacing + more generative processing, not more atoms.

## Daily-review quest (retention 1b) — frontend DONE + Trevor handoff (2026-06-14)
FRONTEND (committed, lingo): `FlashcardTester` reports the session's review count to the daily-reviews quest ONCE on session-end (batched), and auto-completes it when the learner is caught up (`useFlashcardDueSummary().dueCount === 0`) so few-card days aren't stuck at 8/20.
LINGO-CORE (UNCOMMITTED — left in Trevor's working tree, NOT pushed): added the `daily-reviews` quest (unit "reviews", target 20) to `app/quests/logic.py` + updated `tests/test_quests.py` (62 pass). ⚠ `app/quests/` is entirely untracked in lingo-core (Trevor's WIP), so I left my edit in the working tree rather than split the module across commits — **Trevor: commit my logic.py + test change with the rest of the quest module.**
TREVOR / remaining backend coordination:
- **Swap when nothing's due at day start:** the quest generator can't see the client-side SRS due-count, so the reviews quest always generates. A learner with 0 due cards who never opens flashcards sees 0/20 all day. Options: client reports due-count when fetching quests (so the server can swap/skip), or accept the auto-complete-on-open behavior.
- **Trust:** the bump endpoint trusts the client `delta` (a client could over-report reviews). Add server-side sanity bounds if it matters.
- **adFreeMinutes** reward application is still unwired (pre-existing, per lingo-core CLAUDE.md).

## SRS storage unification — ARCHITECTURE DIRECTION (Spencer 2026-06-14, no changes yet)
Storing SRS state in different places is wasteful. Anything with an SRS component (vocab, grammar points, sentences) should be **treated as a flashcard and live in the deck system** — one store, one scheduler — instead of a separate store per concept.
- Today there are multiple SRS stores: Track A vocab `open-lingo-srs:v2`, Track B grammar `open-lingo-srs-grammar:v1` (added this session), plus the per-module `moduleReviewSchedule`. That's the fragmentation to undo.
- When we do MORE grammar SRS: fold grammar points (and sentence items) into the deck system as card types, so they schedule + sync through the same path as vocab cards. The Track B `grammarSrs.ts` store is a deliberate stopgap — migrate it into a "grammar deck" once the deck system can hold non-word cards.
- Also applies to the COURSE: the course deck (`courseDeck.ts`) and grammar/sentence reviews should all be one deck-backed SRS surface, checked for consistency.

## m6-neo Gate 10 walk notes (2026-07-23, pre-Spencer-walk)
Gate PASS ×6 stages; 12 lessons judged (per-step contracts + continuity). Fixed
before handoff: match-pair card overflow (long teaching glosses pushed pair 6
below the fold in ~6 lessons) — `shortGloss` IR field + `gloss-long` compiler
diagnostic + capture-wipe now preserves contracts.json + judge protocol got an
ABORT-don't-improvise rule after judges fabricated missing contracts.
**Rulings wanted from Spencer during the walk:**
- **Door renders in two scripts inside m6:** distractor tiles use m2's
  hiragana atom どあ while other tile banks pull the old-course katakana atom
  ドア (`doa-door` vs `doa` in courseAtoms). Same word, two scripts, sometimes
  one lesson apart. Pick a canonical m6 form (script ladder says どあ) or
  bless the mix.
- **Long-vowel romaji gap:** ジュース annotates as "ju _ su" — the ー mark gets
  no romaji syllable under kana-faithful annotation. Fine, or should ー carry
  a macron/hyphen?
- **Romaji grouping ruling (queued from walk):** annotation is per-kana
  (み=mi な=na い=i), Hepburn would word-group ("minai"). Per-kana is the
  standing kana-scaffold design; if Spencer wants word-grouped romaji it's a
  global annotation change — needs a ruling, not a spot fix.
- **DONE during walk (2026-07-23):** きょうたべない now grades correct
  (temporal-adverb は-drop in expandAcceptedAnswers); Quick Fix cards on
  typed translate steps only fire when the learner's answer actually
  contains the tip's anti-pattern (reactiveTipGate.ts) — a different
  mistake no longer gets an unrelated grammar lecture.
- **Transform cards SHIPPED into m6 (2026-07-23, spec conjugation-transform-spec-2026-07-23.md):**
  new `conjugation_transform` step type; mastery cells `conj:<form>:<class>`
  live INSIDE the grammar FSRS store (recognition/production modalities —
  no new store); compiler auto-emits the ramp from IR `conjugation` blocks
  (m6-neo-1/2/3) + ungraded type-tease; rule cards restyled (sentence list
  + bolded transforms + shared rule-table grid). PENDING Spencer's try:
  if good → update authoring methodology (language-authoring-guide +
  invariants) to require the ramp for conjugated-word teaching and offer
  the step type for regular vocab exposure (Duolingo-style).
- **Walk fixes round 2 (2026-07-23 late):** (a) tokenizer respects authored
  word boundaries — はい no longer greedy-matches across きょうは|いかない;
  new ENFORCED `unbuildable` compiler diagnostic guarantees every build/
  listening surface tokenizes to known units (the quality gate Spencer
  asked for). (b) IR beats gained `alsoAccept` (それが わからない grades
  correct pre-が) and `pitfall` (targeted reactive tip that fires only when
  the typed answer contains the trap — それを わからない gets the "わかる
  never takes を" card). Both are generic mechanisms for future modules.
- **Walk fixes round 3 (2026-07-23 night):** (a) all 16 m6 dialogue
  questions rewritten — plain English, vocab-echoing options ("No — he
  won't drink", never "He'll pass"), 4 real choices each; the
  dialogue-distractor-synth diagnostic is now ENFORCED (no synthesized
  fillers allowed). (b) Image-MCQ ruling: the picture quiz is a word's
  FIRST-EVER appearance and never repeats — review fillers no longer emit
  image MCQs for taught words (いく repeat = dead reps), imageable new
  words get a pinned debut MCQ ahead of ramp/middle, and the enforced
  `image-debut` diagnostic guards both order and the module-wide repeat ban.
- **Walk fixes round 4 (2026-07-24):** (a) type-tease card CUT from the
  compiler (redundant beside sentence-typing translates; word-typing waits
  for FSRS graduation — supersedes the research-suggested ungraded tease;
  `ungraded` variant kept for manual authoring). (b) Typed translate steps
  now DEFER to the final third of the lesson ("more repetitions before
  typing") — interleaver gained deferTypes + urgency rule + a post-pass
  adjacency repair. (c) Stranded-focus bug: transform typed input AND
  translate textarea now autoFocus — mid-lesson keystrokes were going to
  <body> ("typing isn't working").
- **Walk fixes round 5 (2026-07-24):** (a) しない/たべない etc. registered as
  course atoms (excludeFromSrs — conj cells own their retention; blocked —
  not imageable) → romaji lexicon now word-groups them: tiles read
  "shinai", never "shi nai". NOTE: capture screenshots still show per-kana
  (fresh capture profile is pre-kana-phase); real sessions group. (b) New
  CHALLENGE lesson ja-m6-neo-challenge — the old modules' "final
  challenge" revived: 10 authored beats combining は+の+で+に+が, negatives,
  existence, spatial words; 8 new TTS clips generated (edge/Nanami).
  (c) Existence pitfalls: きのこを ある / かめを いる get targeted "ある/
  いる never take を" tips; natural reorders (かめは いけに いる) grade
  correct via alsoAccept. (d) 〜ないで tiles pattern-exempted from the
  particle-separation guard (m16 family surfaced when the atoms landed).
  FOLLOW-UP: neo modules m3-m5 have no challenge lesson yet — add when
  their next content wave runs.

## Fable full-capture sweep (2026-07-24) — 13 forks, ~45 findings, batch applied
FIXED (compiler/systemic): review fillers never drill particles, use short
glosses (no more answer-leaking "negative of いる" prompts), and never
TYPED-recall the lesson's own new words; buildTileFloor fill policy —
no particles (composable extensions), no 〜ます/です register traps, no
deictics on tiny answers, no old-course same-module atoms in neo lessons,
no later-lesson atoms; transform rule table masks rows whose canonical IS
the drilled verb (する card no longer prints する→しない); transform MCQ
distractors rank the anti-pattern first and never serve real registered
words (いない collision); RuleBody splits only before Latin sentence
starts (orphan-bullet fix); compiler romanizes を as "o"; grader adds
topic-ADD variants (わたしは/ぼくは) for topicless statements.
FIXED (content): ~20 alsoAccept widenings, 3 new pitfalls (ぴあのを ある /
うまを いる / いぬが ない animacy), bare-verb builds got real carriers,
challenge dialogue reauthored (was a verbatim dupe of L10's), L8/L4/L5/
L10/challenge clozes recarried + option sets sharpened (で trap added,
defensible は removed), L11 rule-card template brackets rewritten, gloss
family consistency (みる "to watch, to look at", なか "inside", あそぶ
"to play", あそこ/これ/それ/あれ shortGlosses).
OPEN RULINGS for Spencer: (1) polite-accept policy — should うまが います
grade correct ("correct — polite form" flag)?; (2) どあ/ドア now collides
INSIDE one lesson (m6-neo-11 s-1 vs s-5) — pick a script; (3) small-bank
tile layout (≤3 tiles render as giant rows); (4) challenge lessons: pad
pool is plain review — author more multi-concept beats?; (5) composable-
extension guard beyond particle-exclusion (full check is expensive).
- **Walk fixes round 6 (2026-07-24 early AM):** (a) BUILD steps now grade
  through expandAcceptedAnswers (seeded from targetSentence) — きょう
  これを しない with は left in the bank grades correct; listening builds
  stay exact (you build what you heard). Regression test
  BuildSentenceLeniency.test.tsx. (b) L4 capstone accepts あそこに/
  あそこは renderings ("over there" in the EN was steering learners into
  them). LESSON: EN naturalness rewrites must never imply content absent
  from the JA answer. (c) Match pairs are words-only (Spencer: "が is not
  a word") — particles filtered from the match draw, pool pads from the
  rest.

## Spencer's 5 open rulings — ALL RESOLVED + shipped (2026-07-24)
The five items left open by the Fable sweep, answered and implemented. m6
module-gate PASS (tests/TTS/tsc/CI-parity green) after each.

1. **Accept every correct rendering.** "if people use polite form it should
   be accepted, we need as many grammatically correct or close translations
   of the sentence as possible to be correct… let me think of as many other
   ways I can say this." → new `languages/ja/jaAcceptedForms.ts`, wired into
   `expandAcceptedAnswers` (so BOTH typed translate and tile builds get it):
   - **Register**: plain→polite generated from `VERB_ENTRIES.forms`
     (dictionary→masu, nai→masu-neg, ta→masu-past) + the ある/いる suppletives
     (ない→ありません, いない→いません). Longest-suffix match so こない→きません
     never degrades to ない→ありません; phrase-boundary guard so はいる isn't
     read as は+いる. Polite questions gain か.
   - **Scrambling**: particle-marked phrases permute freely, predicate stays
     final, の-linked tokens stay glued (ミカの かめは is ONE chunk). This
     DERIVES the reorders that were previously hand-listed in `alsoAccept`.
   - Rules compose through the existing fixpoint queue, capped at 600.
   **RESOLVED same day** — Spencer: "politeness flag will never be a choice,
   we will accept either answer, show them both, and then start grading on it
   later in the course, maybe module 20 or so." So:
   - `REGISTER_GRADED_FROM_MODULE = 20`. `expandAcceptedAnswers` takes
     `{ moduleIndex }` (from the existing `useLessonModuleIndex` context) and
     drops the register widening at m20+. Scrambling is NOT gated — word
     order stays free forever. A null module (practice decks, previews) stays
     permissive.
   - **Show them both**: `registerPairFor()` returns both renderings whichever
     one the learner typed, and TranslateStepView surfaces it as
     "Both work — plain X, polite Y".
   - That note needed a NEW Feedback tone. `flagged` renders the AMBER
     warning palette (it means "correct, but you slipped" — missing accents).
     A register pair is not a correction, so amber would mark one rendering
     as the lesser one, contradicting "never a choice". Added `Feedback.note`
     — informational line that keeps the SUCCESS palette. Regression test in
     `Feedback.test.tsx` pins both tones.
   - Nominal predicates got the copula too: かめは そこ ⇄ かめは そこです,
     ぼうしは どこ？ ⇄ ぼうしは どこですか？ (the course teaches casual
     copula-drop before です exists). Verb forms are excluded — たべないです is
     NOT the polite of たべない.
   VERIFIED in the running app (ja-m6-neo-1?step=translate): typing the
   never-taught polite しゃしんを みません grades Correct! in green with the
   pair shown; the plain answer shows the same pair.
2. **どあ → katakana.** Bigger than one word: FOUR loanwords existed as two
   atoms each — hiragana kana-drill spellings from m2 (どあ ぱん ぺん ぴあの)
   and the real katakana words (ドア パン ペン, + no ピアノ atom). New
   `CourseAtom.kanaDrillOnly` flag excludes them from build fill AND
   match-pair draws; m6's 10 authored uses swapped to native words
   (ぱん→きゅうり/ほん, ぴあの→ふね, ぺん→ぼうし/かさ), 11 new TTS clips. m2 keeps
   them as pure decoding targets. FOLLOW-UP: m7+ should assume these are
   unavailable until katakana lands; ピアノ has no atom at all yet.
3. **Small-bank tiles.** Root cause was TWO bugs. (a) `isSingleAnswerPicker`
   in BuildSentenceStepView copied MultipleChoiceStepView's *look* but not
   its GRID — 3 options stretched down a 260-520px single column as giant
   rows. Now mirrors MCQ (2x2 + auto-rows-fr at 4 options, height scaled to
   count below that). (b) The four offenders were single-tile builds, a shape
   Spencer banned for generators back on 2026-07-17 — m6's IR authored them
   as one-word sentences (のまない。/いかない。/わからない。/こない。). Given
   carriers (わたしは のまない など) + `minDistractorsFor(1)` raised 2→3 so any
   future picker fills a clean 2x2.
4. **Challenge lessons.** "we need more complicated ones, using at least 3-4
   grammar points in a way they havent seen before." The authored beats were
   already 4-5 points; the dilution was compiler padding. Added 4 STRETCH
   beats covering combinations L1-11 never make: spatial + ANIMATE negative
   (ミカの ねこは いすの うえに いない), possessive + deixis + negative existence
   (ケンの くるまは あそこに ない), なか with a natural place (うまは かわの なかに
   いない), だれの question through a spatial relation. All reuse taught atoms
   and taught grammar — novel COMBINATIONS, not new grammar. They land in the
   sentence miner, so they port into later review pools for free.
   FOLLOW-UP: m3-m5 still have no challenge lesson.
5. **Composable extensions — resolved by INVERSION.** Spencer: "particle
   distractors are good and so are other words, if there is a time stated,
   add ashita and kyou, if there is a color, include multiple, we want them
   to have to think for these sentences and not entirely deductively reason
   their way out. they need to work the right muscle." So instead of a bank
   guard, widen the grader (item 1) and make banks HARDER:
   - Lifted the blanket particle ban in `buildTileFloor`.
   - New `languages/ja/jaSiblingSets.ts`: semantic sets (time, colour,
     animal, person, place, object, food, spatial, deictics, verb forms,
     counters, numbers) + `JA_PARTICLE_CONTRASTS` as explicit SAFE pairs.
     は↔が is deliberately absent — swapping them usually yields correct
     Japanese, so offering が against a は answer would mark a right answer
     wrong. に↔で and を-on-existence ARE real contrasts and are offered.
   - Fill is sibling-first, falling back to the old random prior-atom draw.
   Measured effect on m6: `これを しない` now banks それ/あれ/どれ; `ほんが ある`
   banks じてんしゃ/けいたい/えんぴつ; `ねこが いる` banks うま/かめ/えび;
   `きょうは いかない` banks あさ. Elimination no longer solves them.
   NOT YET FIRING: the course has exactly one colour (あおい) and no あした/
   きのう up to m6, so those two of Spencer's examples can't trigger until
   those atoms land — the sets already list them, so they start working
   automatically.

---

## "SO CLOSE" near-miss retry on challenge lessons (Spencer 2026-07-26 — NOT BUILT, noted)

Challenge-lesson beats are deliberately long, multi-grammar-point sentences
(inv 25/26: ≥3 points, unseen shape). Failing a 7-tile build because ONE
particle tile is wrong grades the whole integration attempt as a miss, which
is both demoralising and diagnostically wrong — the learner demonstrably
assembled the structure.

Wanted: when a `build_sentence` / `listening_build` answer is within a small
edit distance of `correctOrder` (candidate rule: exactly one tile wrong, on a
surface of ≥5 tiles), show a "so close" state and give ONE retry to fix that
tile before grading.

Open questions for when this is picked up:
- Does the retry attempt grade as `hard` (FSRS) or as a pass? Leaning `hard`
  — it IS a partial failure, and Track A/B both read the rating.
- Scope: challenge lessons only, or every capstone/challenge STEP too? The
  same argument applies to the per-lesson challenge step (inv 26).
- Does it interact with max-acceptance grading (`alsoAccept` renderings)?
  Near-miss must be computed against the CLOSEST accepted rendering, not
  just `correctOrder`, or scrambled-but-valid answers get flagged as errors.
- One tile wrong on a 5-tile sentence is 20% — tune the threshold against
  real answers before shipping a fixed rule.

## 2026-07-28 — Spencer QA walk (m7), open notes

1. **Overhaul `translate`, or repoint `listening_build` at English.** Two
   directions, not yet chosen, nothing touched:
   (a) make typed translation more Duolingo-like;
   (b) change `listening_build` so the learner hears the JAPANESE and builds
   the ENGLISH, with words blanked/unblanked the way the dialogue step masks
   its transcript. Decide before either is built — (b) changes what the step
   type means everywhere it is already authored.
2. **`particle-cloze` is done — treat it as finished, not as a template.**
   Spencer, on ja-m7-neo-3: the step type is polished and complete. Nothing
   to change there, and it carries no instruction to author more of them.
3. **Typed production is now thin in m11/m12.** Killing the word-typing
   filler dropped translate share to 2.4% (m11) and 3.4% (m12) — under one
   typed step per sub-lesson, against a guide target of one per sub-lesson.
   The fix is more authored `mode: translate` SENTENCE beats in those two
   modules, not restoring word-typing. Every other module sits at 9-11%.

FIXED same day: dialogue speaker chips rendered the NAME as bare text, so
ケン and トム — katakana, a script still being taught at m7 — gave the learner
no way to tell who was speaking. The chip goes through `AnnotatedText` now
and picks up the per-script romaji policy for free.
