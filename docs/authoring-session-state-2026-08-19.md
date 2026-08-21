# Working state — ES re-author + FR initial author (2026-08-19, fable session)

Continuation notes for the active /goal: "re-author ES and initial-author FR,
full JA-style suite." Written pre-compaction; supersedes nothing — the curated
record is `handoff-course-reauthoring-2026-08-19.md` (§6 has the settled
decisions), this file is the raw resume-point.

## Verified-done today (all suites green at time of writing)

- Full repo suite: **10,325 passed / 0 failed**, `tsc --noEmit` clean.
  (2026-08-20 re-run: 10,327 passed, 18 failed — ALL 18 in ja/ or ja-fed
  app tests, lingle-eb's in-flight work; es+fr trees fully green.)
- **ES m4 re-authored to zero debt (2026-08-20), AUTHORED BY SONNET** —
  Spencer asked for the JA m30 dispatch pattern to save tokens: Sonnet
  drafts the IR against a pinned brief + runs the gates itself (378k
  subagent tokens, ~30m, all gates green first review); fable reviews the
  IR + compiled output IN FULL, fixes the residue (4 non-gate defects: two
  prose errors — one a REPRODUCED July error the handoff flags — two muy
  atom-credit gaps, one overclaiming header), adds bespoke pins, runs the
  TTS chain. Economics row in docs/dispatch-economics-log.md. USE THIS
  PATTERN for m5+ — dispatch brief lives in the transcript; key elements:
  pinned atom inventory, exact debt lines, files-it-may-touch (3), gates
  it must run, "only esAudioCoverage may stay red", hard rules.
- **Gender canon in es moduleBarGuards** (2026-08-20): regular feminines of
  -o adjective atoms (sg+pl) canonicalize to the masculine — m4 teaches the
  rule, so alta/bonita/rojas are derived forms like plurals. Canon ONLY,
  never the real-form lexicon (lexicon route flipped ratchets in 6 modules;
  reverted, reason pinned in the guard). m4 unknownTokens fell 47→21 from
  the canon alone before re-authoring.
- **ES TTS delta chain re-run**: 66 new clips (m4 texts), es.json manifest
  byte-identical copy, tts-publish/es now 1,115 files (additive only).
- **ES m3 surgical retirement complete** — zero pinned debt; m1/m2/m3 all
  register debt-free. ES tree 465 green.
- **FR m1 complete end-to-end**: `fr/curriculum/ir/m1.ir.yaml` (judgment
  artifact; header records ladder + zero-translate decisions) →
  `scripts/compile-ir-fr.mjs m1` → `fr/curriculum/m1.ts` (read in full,
  twice-recompiled after lint-trap fixes). 27 atoms, 8 lessons, 5 placement
  items. FR tree: 102 passed, 1 env-gated skip.
- **FR gates all landed WITH m1, all zero, no debt parameter exists**:
  `fr/__tests__/moduleContentLints.ts`, `moduleBarGuards.ts` (apostrophe-aware
  tokenizer; atom-surface exemption in fullSentenceMcqs; no vosotros/
  progressive-gloss analogues — reasons in header), `fr/curriculum/
  fr-quality.test.ts` (silent_letter + liaison_listen join SELECTION_TYPES;
  gender_sort excluded like dialogue_listen), `frAudioCoverage.test.ts`
  (ratchet 0, GREEN, sanity floor 30 — m1 yields 46 unique texts),
  `frPromptComprehensibility.test.ts` (ratchet 0; strips «» spans before
  classification, so no ENGLISH_STOPWORDS needed), `emitTtsDeck.test.ts`
  (EMIT_FR_TTS_DECK), `fr/curriculum/m1.test.ts` (bespoke pins: zero
  translate, zero liaison_listen, ≥8 silent_letter, placement shape, hints on
  every atom, huit consonantOnset).
- **FR TTS chain done**: lingo-data `pipeline/tts/generate.py` gained fr
  (default fr-FR-DeniseNeural; SAMPLE_VOICES Denise+Henri; sample phrase
  exercises liaison/elision/h-aspiré: "Bonjour, c'est un plaisir. Les amis
  arrivent en haut à huit heures."). Deck 53 cards → 53 mp3s generated →
  `pipeline.tts.emit_manifest` (no --lang flag; emits ALL langs from
  out/tts/manifest.json) → `src/shared/tts/manifests/fr.json` byte-identical
  to `lingo-data/out/tts/manifest/fr.json` → 53 clips staged
  `tts-publish/fr/` (additive only, NEVER --delete; ships same deploy as
  manifest). lingo-data python is `.venv/bin/python`, bare `python` missing.
- **FR collector globs now exclude test files**: all three
  (`curriculum/index.ts`, `courseAtoms.ts`, `placementBank.ts`) use
  `["./…/m*.ts", "!./…/m*.test.ts"]` — `m1.test.ts` beside the module
  matched `m*.ts` and cycled back through mockLessons (FR_ALL_LESSONS
  undefined mid-evaluation).
- **Registration**: `FR_ALL_LESSONS` exported from fr/curriculum/index.ts
  (glob-derived); `mockLessons.ts` spreads FRENCH_LESSONS after
  SPANISH_LESSONS. Stale "empty course" pins updated:
  `frCurriculum.test.ts` (bank carries authored modules, screener = first
  items), `frEngine.test.ts` (NOT-selectable pin now cites the HUMAN
  blockers, asserts ttsManifest.count > 0).
- **Docs updated**: fr pin (Status ACTIVE; §7 items 4/5 done, matchPairsFloor
  resolved-differently — authoring-time ≥6 floor instead of render pad;
  item 6 still off), fr guide §9 (same), handoff §6 (FR m1 entry).
- IR lint-trap fixes made during authoring (recorded in IR comments): L2
  build tile pardon→bonjour (non-intro tile debut), q-cava-reply prompt
  de-leaked then de-production-framed ("Which phrase is the natural
  answer?"), q-nuit "Which phrase fits the moment?", métro→metro (accented
  char would classify an English prompt as French at ratchet 0).

## Cross-session constraint (lingle-eb, uds:/tmp/cc-socks/37384.sock)

Other session committed `mockCourse.ts` (imports `buildFrenchCourse` from
fr/curriculum) while fr/ is untracked → **HEAD does not build in a fresh
checkout. NOBODY PUSHES** until fr/ is committed with/before
mockCourse/registry. `mockLessons.ts` now has the same constraint (imports
FR_ALL_LESSONS). When Spencer asks for a commit: stage
src/features/languages/fr/ + src/shared/tts/manifests/fr.json +
tts-publish/fr/ + mockLessons.ts together/before mockCourse. They also
committed ja backlog/reviewQueue state — pull HEAD before touching
docs/backlog/items.yaml or reviewQueue.ts. Never `git add -A` (their ja work
is in-flight). Nothing committed by me; commits only when Spencer asks.

## Owed to Spencer (human checkpoints, not blockers for continuing)

1. **FR voice audition**: fr-FR-DeniseNeural (the generate.py fr sample
   phrase is built for this). Until then fr stays OUT of
   AVAILABLE_LEARNING_LANGUAGE_IDS (pin in frEngine.test.ts names this).
2. **FR m1 walk.**
3. **ES walk after the first re-authored verb-conjugation module** (JA trap
   #2 — owed before the verb-module pattern is replicated).

## Next queue (in order)

1. **ES m5 DONE (2026-08-20, Sonnet dispatch #2)** — first verb module, all
   gates zero, translate 0.077, 6 bespoke pins (27/27), TTS delta 46 clips
   (tts-publish/es 1,161), ES tree 476 green. Full entry in handoff §6.
   Reviewer catches: es-ir/assemble.mjs tile-casing bug (lower1 on every
   tile → «ana»; fixed sentence-initial-only; m2 recompiled — Diego/México/
   España tiles restored, m2 IR distractor tiles re-cased; m4 recompile
   byte-identical) + 3 identical niña retrievals varied. **NEXT: STOP.
   WALK CHECKPOINT — Spencer must walk m5 before m6+ replicates the verb
   pattern (JA trap #2). Do NOT dispatch m6 until the walk clears.**
2. ES m6…m16 same loop after Spencer's m5 walk clears the pattern.
3. **FR m2 (liaison module)** when ES queue allows: opens with mute-h vs
   h-aspiré contrast handed by m1 mastery's silent_letter on «huit»; every
   liaison_listen item ≥1 NON-linking junction (factory enforces); liaison
   audio must be auditioned (edge Denise's liaison rendering unverified).
   m2 unlocks typed steps ONLY if accentPolicy lands first (F5).
4. JA migration onto shared mcqDistractorLint core: deferred until lingle-eb's
   ja session lands.

## Rules that keep biting (verbatim reminders)

- Never raise MAX_UNCOVERED_TEXTS / any ratchet; fix = regen chain.
- tts-publish: only NEW clips, never --delete, manifest ships same deploy.
- npm run test:e2e:auth is interactive — never run.
- No dev servers. FLELex: do not email CENTAL. Trevor holds AWS creds.
- CWD drifts after `cd ../lingo-data` — use absolute paths.
- zsh chokes on `echo ===` inside compound commands.

## 2026-08-20 PM — commit checkpoint + Spencer redirect (word-first intro)

- Commit checkpoint executed on Spencer's ask: 3ca324cc (drafting pipeline),
  0881fb84 (ES wave: content+gates+compiler+corpus+manifest), 80315cd5 (fr
  residue: BCP47 + IR compiler), 404c67b5 (docs). HEAD verified in a detached
  worktree: tsc clean, es+fr+shared 584 passed. Remaining dirty files are all
  the other session's (app surface, ios, ja drafting).
- Spencer (on seeing m1 L1): phrasebook intro is bad teaching; compare ES
  against JA m3+ (post-script); "go back to individual words"; word MCQs are
  easy for Spanish. Analysis delivered: the gap is the CHOREOGRAPHY layer —
  ja moduleCompiler enforces image-first debuts (Spencer 2026-07-23 spec),
  debut precedence, no passive vocab cards; es IR is step-literal and m1
  debuts words on phrase cards (m5 under the dispatch brief is closest to
  conformant). Proposed: debut policy into esModuleBarGuards + es-ir
  assemble, m1 full re-author with chunk atoms split (bueno/día/tarde/
  noche...), retrofit m2–m4 opportunistically. AWAITING Spencer's scope
  answers before dispatching. m6+ remains blocked (m5 walk + this decision).

## 2026-08-20 PM(2) — anti-hollow-card wave (staged, UNCOMMITTED)

Spencer: passive "show and do nothing" steps feel hollow; wants interactive
replacements incl. the ja interaction simulator for es "with the english
translation below it, and then quiz the words/sentences", staged on the QA
page with UI/UX parity. Built and staged (all tests green: lesson 756, es
476, admin 29, tsc clean; NOT committed — Spencer reviews first):

- NEW step type `pretest_mcq` (guess-before-taught, pretesting effect —
  Kornell/Hays/Bjork 2009): English situation cue → guess among target
  phrases → reveal teaches. TEACH_STEP_KINDS (never grades, always reports
  true, wrong pick renders warning-tone not red). Files: types.ts,
  PretestMcqStepView.tsx (+6-test contract), StepRenderer, _stepPredicates,
  qaCatalog (order 16.5 + UNUSED pin), LessonStepPreviewPage fixture,
  admin stepCatalog row+shell. Intended to replace phrase_card for
  non-imageable debuts in the es word-first m1 re-author.
- ES dialogue_sim staged: dev/dialogueSim/parqueScenarioEs.ts (4 turns,
  every line verbatim m1/m5 shipped text so every clip exists; gloss-below
  is the step's existing contract; t4 shows alsoCorrectOptionIds) + lazy
  buildParqueQuiz() post-quiz (listening comp + vocabTextMcq + build via
  REAL es factories). DialogueSimPage now language-aware:
  /es/qa/dialogue-sim runs sim → quiz → done card; /ja unchanged (konbini).
- Follow-ups when adopted into content: es `dialogueVoices` roster (male
  speakers currently fall back to the single course voice), pretest_mcq
  authoring factory + IR emitter + bar checks (debut policy), unpin from
  UNUSED_STEP_TYPES.

## 2026-08-20 PM(3) — tap_the_word staged; PAUSED at Spencer's checkpoint

Spencer mid-build: "stop once you make the QA for 'pick the word' and then
we can decide to continue the rest and to change authoring guidelines."
Done and stopped there:

- NEW step type `tap_the_word` (graded active noticing, deduction contract
  in the type doc): types.ts, TapTheWordStepView (+7-test contract:
  radio single-select, set-equality grading, dashed missed-target, honest
  correctness), StepRenderer, qaCatalog 16.6 + UNUSED pin, admin
  stepCatalog, preview fixture, dedicated QA page
  src/features/lesson/dev/TapWordPage.tsx at /:lang/qa/tap-word with the
  3-example deduction ladder (cognate / morphology / tap-two), all
  sentences verbatim m5 shipped text (clips exist). App.tsx route added
  (App.tsx was clean — no cross-session collision). lesson+admin 792
  passed, tsc clean. UNCOMMITTED with the rest of the anti-hollow wave.
- Spencer prefs recorded in memory (step-type-doctrine): dialogue_sim is
  the favorite; image MCQ for single words + illustratable gendered vocab;
  deduction-first authoring of every guessable step; sims in more modules.
- DECIDED-PENDING (do NOT start until Spencer says): rewrite es authoring
  guidelines around the new arsenal; extend es IR emitters + factories
  (pretest/tap/sim) + bar-guard field scanning for the new shapes; then
  Sonnet re-dispatch of word-first m1; also earlier gender research plan
  (article-chunks, m4 callback card) awaits the same green light.

## 2026-08-20 PM(4) — word_map built on Spencer's live feedback; still PAUSED

Spencer loved tap_the_word, asked for (a) bigger English gloss on it
(done — text-lg/xl, comment cites the QA note) and (b) a NEW interlinear
mapping step "similar to match pairs process of elimination": English word
highlighted in turn → learner taps its Spanish word → glosses fill in
under the chips. Built as `word_map` on the full trail (types + view +
7-test contract + StepRenderer + qaCatalog 16.7 + UNUSED pin + admin
stepCatalog + preview fixture + dev/WordMapPage.tsx at /:lang/qa/word-map,
cross-linked from the tap-word page). Match-pairs conventions: 3-mistake
budget via exported MistakeDots (MatchPairsStepView now exports it), fail
reveals remaining glosses muted. Demo ladder: aligned 1:1 / CROSSING (gato
negro — adjective position taught by mapping) / phrase→one (I have →
tengo). All sentences verbatim m5 shipped text (clips exist). Test trap
recorded: full "@/shared/tts" mock breaks transitive hasTtsAudio import
when a view imports from MatchPairsStepView — use importOriginal partial
mock. lesson+admin 799 passed, tsc clean. Guidelines rewrite + m1
re-dispatch remain PAUSED at Spencer's checkpoint.

## 2026-08-20 PM(5) — gender color system + word_map placement analysis

Spencer: gender indicator by visual coloring for ANY gendered language
(blue/pink + grey for neuter), "where can we apply that"; word_map =
"good replacement or variant for sentence build … OR a pre-step before
build". Built/staged (uncommitted, still paused pre-guidelines):

- `src/shared/language/genderColor.ts` — language-agnostic palette
  (m sky / f pink / n zinc), GENDER_STYLE chip/text/dot/badge classes.
  Contract in the header: color never the sole carrier (pair with article
  or m/f/n marker), reveal-state only on graded steps, invariant words
  untinted (contrast IS the lesson), wean via per-language setting when it
  ships to course surfaces, promote to index.css tokens LATER (file is
  mid-edit in the concurrent session). Registry gender data already
  exists (EsAtom/FrAtom.gender "m"|"f").
- word_map integration: `tokenGenders?: Record<number,"m"|"f"|"n">` —
  solved chips + glosses light the gender hue instead of accent, so
  agreement chains («la casa … bonita») become visible. +1 contract test.
- dev/GenderColorPage.tsx at /:lang/qa/gender-color: palette legend,
  mock vocab cards (es/fr/de incl. neuter das Auto), dictionary-row mocks,
  and TWO live word_map demos (su casa es muy bonita — fem chain; el carro
  de mi abuelo es azul — masc chain with invariant azul untinted). All
  clip-backed m5 text. Cross-linked from word-map page. lesson+admin 800
  passed, tsc clean.
- Analysis for guidelines (pending green light): word_map as PRE-step
  before build (recognition→production ramp, i/i+2 spacing) for new
  sentence patterns; as build REPLACEMENT for direct-translation sentences
  (where English order makes build trivially guessable); build kept where
  order diverges. Bar work when content adopts: classify word_map in
  modality-mix/selection-run lints.

## 2026-08-20 PM(6) — guide audited + §13 doctrine written; L1 prototype walkable

Spencer: audit the es guide, write guidelines, author the new m1 LESSON 1
only ("we will go from there"), non-frustrating. Done:

- GUIDE AUDIT: §0 provenance held up except the phrase-card REVERSED entry
  — both its premises now false (emoji art path IS shared + pretest_mcq
  exists). Withdrawn in place; §13.2 image-MCQ-as-intro moved DROPPED→
  CARRIED; §5 topic template got a v1 NOTICE (positions 2/5/12 passive
  cards superseded; template v2 pending m1 verdict); §11 cleared-types
  list updated. NEW §13 "The interaction doctrine" — written language-
  agnostic to lift into the fr guide verbatim: no hollow steps; debut
  policy (imageable→image MCQ, else pretest, never passive card); sentence
  ramp (first view = word_map, return = build; word_map replaces build on
  aligned sentences); gender absorbed not announced (articles ride along,
  m4 callback, genderColor at reveal); deduction contract (anti-
  frustration); dialogue_sim = integration beat; FSRS = house rule, no new
  wiring; §13.8 lists the gate/emitter debt owed when content adopts.
- L1 PROTOTYPE: dev/esM1Lesson1.ts (12 steps, 5 words, doctrine calls
  documented per step) + dev/EsM1L1Page.tsx runner at /es/qa/m1-lesson-1.
  Uses REAL es factories for classic steps (m1 atoms), hand-authored new
  types; every audio text corpus-covered (zero TTS work). 4 doctrine pins
  in esM1Lesson1.test.ts (zero phrase cards, info only at 0, map→speak→
  hear ramp, no SRS). lesson+admin 804 passed, tsc clean.
- NEXT (after Spencer walks L1): template v2 + IR emitters/factories for
  new kinds + bar classification (§13.8) → full m1 Sonnet dispatch; lift
  §13 into fr guide.

## 2026-08-20 PM(7) — QA-frame container bug fixed (Spencer: "its cut off")

The ad-hoc dev frame (`flex h-full overflow-hidden`) lacked the shell's
`container-type: size`, so cqh-sized steps (word_image_mcq) computed
budgets from the VIEWPORT and overflowed 194px. Fix:
dev/DevStageFrame.tsx replicates the LessonShell contract (scroller with
[container-type:size] + py-4 + keep-native-scrollbar, data-lesson-stage
column inside SHELL_COLUMN); all five QA pages (m1-lesson-1, tap-word,
word-map, gender-color, dialogue-sim) swapped onto it. Verified live
against Spencer's running dev server via Playwright: scroller overflow 0px
at step 2, screenshot confirms grid + Check inside the 596px frame. tsc
clean, lesson suite green.

## 2026-08-20 PM(8) — pretest_mcq DEMOTED on Spencer's walk; micro-sim debut

Spencer on the L1 pretest step: "any narrative card is very miserable to
do or use… when the same thing can be done with a dialogue simulation."
Acted on everywhere: L1 step 5 is now a ONE-TURN micro-dialogue_sim (Ana
hands you a flower 🌼, goal "Thank her.", known-word distractors — same
pretesting-effect elimination, ~zero English reading). Guide §13.2 debut
table amended (non-imageable → micro-sim; pretest_mcq LAST RESORT with a
one-sentence prompt budget); §13.6 documents the two sim grain sizes
(full scenario = integration beat, micro-sim = debut). Deprecation noted
in types.ts doc + qaCatalog pin + step-type-doctrine memory. New L1 pin:
gracias debut is a 1-turn sim with a ≤6-word goal line; zero pretest
steps. lesson suite 776 green, tsc clean. Spencer also: scope other step
types for L1 + the course (delivered in-conversation: sim-heavy m1–m3,
gender_sort port for m4, odd_one_out + picture_sentence_mcq as the two
new-type candidates; dialogue_listen demoted to assessment contexts).

## 2026-08-20 PM(9) — walk feedback round 2: disclosure, tap floor, TTS verified

Three more Spencer notes, all acted on:
- WIN explanations collapse behind "View explanation" (Feedback.tsx
  disclosure — correct/flagged collapse, miss/soClose stay inline; +2
  Feedback tests). Benefits every step type passing explanation.
- The L1 tap_the_word («hola buenos días», 3 tokens) was "an MCQ in a
  costume" — replaced with the audio-prompt word MCQ (hear «adiós», pick
  the picture; meaningEn===option.word flips WordImageMcqStepView into
  audio mode). Tail reordered map→HEAR→SPEAK (recognition before
  production; test pin updated). tap_the_word LENGTH FLOOR (~≥5 tokens)
  recorded in types.ts + guide §13.5 companion rule ("simplest step that
  teaches it; the less reading the better") + memory.
- sí IS taught (step 7 emoji MCQ); «no» is the item with no own beat
  (debuts in the word_map as the cognate) — Spencer ruled the match-pairs
  elimination covers it; noted in the file header.
- TTS verified end-to-end: all 7 L1 texts hash into es.json AND exist at
  ../lingo-data/out/tts/es/<hash>.mp3 AND serve 200 audio/mpeg with
  X-Tts-Source: local through the running dev server (vite's serve-tts-
  locally middleware — local corpus first, so undeployed delta clips play
  in dev). lesson suite 779 green, tsc clean.

## 2026-08-20 PM(10) — the inline-author loop: m1 COMPLETE and walkable

Spencer: "inline crazy author the first module… do a loop of make lesson,
check against whats good and my mindset, make the next one, until the
normal authoring process can start." Plus the COGNATE RULE: cognates are
an aid never the mechanism (germans: no≠nein) — now guide §13.5, and L1
reworked (v3: «no» gets a real image-MCQ debut before the map).

DONE — all 8 lessons hand-authored, per-lesson checklist in
dev/esM1Lessons.ts (L1 in esM1Lesson1.ts):
  L1 first words (13 steps) · L2 courtesy via 2 micro-sims + «sí por
  favor» map · L3 greetings decomposed (map, map, BUILD the third;
  -os/-as noticed not taught) · L4 numbers 0-5 (counting maps debut
  tres/cero by elimination) · L5 6-10 + «y» debuting inside «seis y
  siete» · L6 hasta luego/mucho gusto sims + «o» map + first y/o cloze ·
  L7 full 4-turn integration sim + retrieval tail (first build-from-
  scratch of «no gracias») · L8 mastery, graded-only, every modality.
Page: /es/qa/m1-lesson-1 is now the MODULE walker (L1-L8 picker,
auto-advance). Tests: esM1Lessons.test.ts module-wide doctrine pins
(adjacency, match close, card budgets, sim goal-line ≤8 words, ≥3
audio-prompt MCQs, L8 graded-only) + reworked L1 pins. lesson+es 1281
passed, tsc clean.
TTS: supplementary deck lingo-data/data/test_decks/es-m1-proto.json (9
texts: sí por favor / uno dos tres / ocho y nueve / ¿sí o no? / buenos /
buenas / días / tardes / noches) → generate wrote 4 (5 cached) →
manifests re-emitted, es.json synced byte-identical, fr.json unchanged →
9 clips staged tts-publish/es (1,170 total) → dev-server serve verified
200 audio/mpeg. ALL module audio plays locally.

NEXT (the "normal process" handoff, pending Spencer's walk of L2-L8):
encode this module as the IR exemplar — template v2 + emitters/factories
for sim/map/audio-mcq kinds + §13.8 bar work → m2+ resume Sonnet
dispatches. Uncommitted with the rest of the wave.

## 2026-08-20 PM(11) — THE SELF-CUEING LAW (Spencer's sim-walk catch)

Spencer walked L1's gracias sim: Ana said «¡Hola!», he answered hola back
(correct pragmatics) and was marked wrong — "the real cue (the flower)
lived in scene PROSE… someone saying hello would warrant a hello back."
Same failure in L2's perdón sim (injured stranger cheerfully saying
«Buenos días»). Law now in guide §13.6: a sim turn's NPC line must ITSELF
create the reply slot (mirror / question / interjection), with 5 named
failure modes (natural-answer trap, prose-cued turn, tonal incoherence,
both-correct dodge on debuts, goal-as-translation). Fixes:
- L1 v4: gracias is imageable → image-MCQ debut like every picture word;
  L1 ships NO sim (14 steps). Pin updated.
- L2 v2: por favor debuts as 🤲 image MCQ; sims are now self-cueing —
  «¿Café?» → sí por favor / no gracias BOTH accepted (consolidation), and
  «¡Ay!» → perdón (the honest debut for the one emoji-less m1 word).
- L6: mucho gusto is a MIRROR exchange (npc says it, you say it back).
- L7 t3: «¿Sí o no?» build accepts BOTH «no gracias» and «sí por favor».
- NEW machine lint in esM1Lessons.test.ts: an option mirroring the NPC
  line may only be correct/alsoCorrect (the natural-answer trap, pinned).
- TTS: «¿café?» + «¡ay!» generated, manifest synced (fr unchanged), both
  staged (tts-publish/es 1,172).
lesson suite 816 green, tsc clean. Memory updated (self-cueing law).

## 2026-08-20 PM(12) — fresh-learner sim dispatch (4× Opus) on the m1 prototype

Spencer: revive the learner-sim pipeline ("you are learning this for the
first time"), opus agents, all angles; diagnosis to test: too much at
once, too little review (JA rhythm is the standard); mindset "teach so
they remember", not "show all the words". Found the pipeline via
docs/INDEX.md: learnerView.emit.test.ts + docs/learner-sim/ (the JA
185-finding walk). Built the es analogue:
dev/esM1LearnerView.emit.test.ts (ES_M1_LEARNER_VIEW=1) → answer-
stripped, shuffle-hardened docs/learner-sim/es-m1-proto.md (307 lines,
all step types incl. word_map/dialogue_sim rendered).
DISPATCHED 4 Opus agents in parallel, each in full fresh-learner
character (English-only, no jargon, phone): (1) confusion walk, (2)
memory/retention with honest next-day self-test + JA m3 rhythm
comparison, (3) ease/effort/flow + reading burden, (4) wildcard
(motivation arc, world coherence, speech confidence, missing pieces +
self-invented lenses). Findings in BLOCKER/CONFUSING/NIT taxonomy.
Awaiting completions; synthesis next, then module restructuring.

## 2026-08-20 PM(13) — learner-sim results: Spencer's diagnosis QUANTIFIED

All 4 Opus fresh-learner sims returned. Synthesis:
docs/learner-sim/es-m1-proto-FINDINGS.md (the working doc — read it
before touching the module). Headline: 48% of steps carry zero retrieval
demand; 1.5 retrievals/item; all 19 speaking steps are read-aloud (JA's
are cued recall); 0% unscaffolded production; 9 items never retrieved
outside their intro lesson; next-day self-test = ~4 NET new items from 8
lessons (9 of 12 "solid" were pre-known English). JA two-lane rhythm
(per-lesson off-topic review tails + dedicated review lesson) is the
missing machinery. Unanimous blockers: buenos/buenas trained toward a
FALSE rule (both trials answer buenas), digit-emoji answer keys incl.
mastery, L4-L5 quit trough, phonetics 100% taught / 0% tested, L7 open
tile-turns, perdón leftover-answer. Restructure plan R1-R10 in the
findings doc, priority-ordered. PAUSED for Spencer's read + the R10
scope decision (turn-2 cliff vocab) before the module rework.

## ═══ RESUME POINT (compaction 2026-08-20 evening) — ACTIVE TASK ONLY ═══

**Task: rework the m1 prototype per the learner-sim findings, continuing
the inline-author loop.** Blocked only on Spencer's R10 answer (turn-2
vocab — ¿cómo estás?/no entiendo/me llamo — into m1 or early m2). All
other R1-R9 are approved-in-spirit by the standing loop directive.

**THE CHECKLIST for the rework**: docs/learner-sim/es-m1-proto-FINDINGS.md
(R1-R10 priority-ordered; headline: 48% zero-retrieval steps, 1.5
retrievals/item, 0% unscaffolded production, net ~4 new items retained;
JA two-lane rhythm = review tails every lesson + dedicated review lesson
is the missing machinery; buenos/buenas trained toward FALSE rule; digit
emoji = answer key incl. mastery; phonetics 0% tested; L4-L5 quit trough).

**Files (all dev-scoped, ALL UNCOMMITTED, main branch, lingle-eb session
also active — explicit-path staging only):**
- Content: src/features/lesson/dev/esM1Lesson1.ts (L1 v4),
  esM1Lessons.ts (L2-L8 + per-lesson checklist header, NEW_TTS_TEXTS list)
- Tests: esM1Lesson1.test.ts, esM1Lessons.test.ts (doctrine pins:
  adjacency, match close, card budgets, sim goal ≤8 words, mirror-trap
  lint, L8 graded-only, ≥3 audio-prompt MCQs) — run:
  npx vitest run src/features/lesson
- Runner: EsM1L1Page.tsx at /es/qa/m1-lesson-1 (L1-L8 picker); frames use
  DevStageFrame (replicates LessonShell [container-type:size] contract)
- Learner view: esM1LearnerView.emit.test.ts —
  ES_M1_LEARNER_VIEW=1 npx vitest run src/features/lesson/dev/esM1LearnerView.emit.test.ts
  → docs/learner-sim/es-m1-proto.md. RE-EMIT after rework; optionally
  re-dispatch 1 opus fresh-learner confirmation walk (persona briefs in
  transcript; answer-stripped file only, BLOCKER/CONFUSING/NIT).

**Doctrine (guide §13, all Spencer-ratified today)**: no hollow steps;
image-MCQ debuts (even soft emoji); micro-sim debuts ONLY self-cueing
(NPC line creates the slot: mirror/question/«¡Ay!»; never prose-cued;
mirror of NPC line never a wrong option); pretest_mcq LAST RESORT;
tap_the_word ≥5 tokens; word_map = first sentence view (max ONE new word,
by elimination prompted last/card-fed), build on later encounter;
cognates aid never mechanism (German test); less reading the better; win
explanations collapse (Feedback disclosure); gender absorbed not
announced (genderColor reveal-layer exists).

**TTS chain for new texts**: add cards to
lingo-data/data/test_decks/es-m1-proto.json (11 cards now) → cd lingo-data
&& .venv/bin/python -m pipeline.tts.generate --provider edge --lang es →
.venv/bin/python -m pipeline.tts.emit_manifest → cp out/tts/manifest/es.json
→ lingo/src/shared/tts/manifests/es.json (cmp fr.json UNCHANGED) → copy
new mp3s ../lingo-data/out/tts/es/<hash>.mp3 → tts-publish/es/ (1,172 now,
additive ONLY). Dev server serves local clips (vite serve-tts-locally).
Hash = sha256("es:"+text)[:16].

**After the rework**: re-emit learner view → confirmation sim → Spencer
walks the module on /es/qa/m1-lesson-1 → then the normal-process handoff
(template v2 + IR emitters/factories for sim/map/audio-mcq + §13.8 bar
work → m1 compiles from IR → m2+ Sonnet dispatches).

## PM(14) — 2026-08-20 late evening: THE REWORK IS DONE (R1–R9 + R10 default)

Post-compaction continuation. Spencer said "continue" without answering
R10 — took the compression-consistent default: **turn-2 vocab (¿cómo
estás? / me llamo / no entiendo) HELD for early m2** (flagged to him as
reversible-additively). Then ran the full rework against
docs/learner-sim/es-m1-proto-FINDINGS.md:

**Engine (one addition):** `SpeakingStep.cue?: "recall"` — cued-recall
speaking. English cue shown big, Spanish hidden, NO autoplay, "Show
answer" reveals + plays; in the Whisper branch the card also reveals when
the first verdict lands. Implemented in types.ts + SpeakingStepView.tsx
(placeholder + recognized branches + ReferenceCard hidden mode with
per-language "Say it in Spanish" label). Default-off — live JA untouched.
es `speaking()` factory takes trailing `cue` param.

**Content (esM1Lesson1.ts v5 + esM1Lessons.ts rewritten, now NINE
lessons):** L1 15 steps (promise stated, vowel card cashed via
hear-adiós, sí retrieved by audio away from debut, ends speaking «no
gracias»); L2 (stranger says «¡Ay!» — Diego continuity, ¿/¡ delight
beats in collapsed sim explanations, tail hear-hola, ends recalling «no
gracias»); L3 (card teaches buenos/buenas pairing + NOT «buenas días»,
cloze-buenos/build-buenas/ear-buenos alternating trials, días glossed
'days', perdón's first audio retrieval, ends speaking «buenos días»);
L4 (soft-c card cashes at step 2 via lc-cero, cero map in natural order,
text-MCQ tres sin digits, tail recall por favor, ends counting 1–5);
L5 (stress line CUT, nueve debuts by map elimination, tail recall buenas
tardes + text-MCQ cuatro, ends counting 6–10); **CHECKPOINT (n=6, new)**
16 graded zero-new retrievals — seis/siete + cero/cinco + dos/diez +
tardes/noches by EAR, buenas cloze + buenos build, y cloze, both polite
sentences (recall speak + build), perdón audio; L6 (o-cloze on FRESH
«ocho o nueve», tail recall buenos días + lc-diez, ends recalling hasta
luego); L7 (Sofía says mucho gusto, «¿Café? ¿Sí o no?» real question,
build sí por favor, cloze-no, siete ear + y text + tardes ear trials,
recall perdón, ends speaking the full greeting); L8 mastery 15 steps
(every module item present, all wimcq audio-prompted, translate step
«sí por favor» = first typed production, buenos/buenas + y/o + seis
final trials, ENDS on 2-turn Ana goodbye sim). Titles are promises.

**Pins (esM1Lessons.test.ts rewritten):** 9 lessons; match in closing
zone (lessons end on wins); checkpoint+mastery graded-only + cardless;
module ends on dialogue_sim; mastery wimcqs all audio-prompted; ≥6
audio-prompt MCQs; ≥1 translate; RECALL LAW lint (cue:"recall" never
precedes a printed voicing, ≥6 recalls module-wide); buenos/buenas
alternation lint (≥2 cloze-buenos w/ buenas live, ≥1 reverse); mirror
trap + goal-terseness kept. L1 test → 15 steps. EsM1L1Page end-states
length-based. Emitter: translate + multiple_choice cases, recall
rendering, tap-to-hear note in header, map instructions stated once.

**TTS:** 5 new clips generated + staged (uno dos tres cuatro cinco ·
seis siete ocho nueve diez · ocho o nueve · ¿café? ¿sí o no? · adiós
hasta luego). Deck now 16 cards; manifest 2,422→2,427 (added exactly 5,
removed 0, fr.json byte-identical); tts-publish/es 1,172→1,177.

**Docs:** guide §13.9 (the retention rhythm — 8 laws + R10 scope note +
R9 engine backlog). Learner view re-emitted (123 steps, 0 unrendered).

**State: vitest lesson tree 814 passed / tsc clean.** Confirmation walk
(1 Opus fresh-learner) dispatched. NEXT: Spencer walks
/es/qa/m1-lesson-1 → normal-process handoff (§13.8 debt + IR emitters).

## PM(15) — 2026-08-20 late: confirmation walk + fix round

Single Opus fresh-learner confirmation walk on the reworked module came
back. VALIDATED: checkpoint = "best-designed unit in the module"; L7 T3
(«¿Café? ¿Sí o no?» open build) = "best step in the entire module"; the
L1 promise "landed"; recall spacing praised (por favor at ~25 steps =
"best-spaced ask"); L8.13 flipped-frame cloze called the pattern to
copy; "Ana is the retention mechanic." Next-day self-test: 16 produce /
10 recognize / 2 lost — app-attributable production ≈8 items (vs ~4
pre-rework, but the walk showed the number lane still didn't encode).

CAUGHT AND FIXED SAME SESSION:
- Number-debut giveaway (its top blocker: English prompt + digit emoji =
  answer printed next to the answer, 8 steps): L4/L5 debuts are now
  AUDIO-PROMPTED (card feeds the counting run once; clip is the
  question; tap-an-option-to-hear makes matching language-agnostic).
  L4 compressed 14→13. New MODULE-WIDE lint: any wimcq with digit
  options must be audio-prompted.
- Production redistribution (6 items never produced; gracias had 2
  slots): checkpoint recalls «seis» (not gracias); L8 recalls «mucho
  gusto» (previously only ever echoed) and «diez» (previously never
  produced — new printed speak-diez in L5 satisfies the recall law).
- L8 cloze reframed «hola, ___ días» (verbatim L3 repeat tested
  screen-memory); L3/L8 map glosses functional ("morning"), literal
  'good days' lives on card + reveal; L7 T1 accepts bare «hola»; L6
  hasta-luego goal no longer quotes the answer; 🌇→☀️ (thumbnail
  ambiguity); L3 card gloss "(good evening/night)" matches registry.
- NOT actioned (by design / already handled): typed-accent fear — the
  translate view already accepts accent-less es input with a nudge, and
  acceptedAnswers carries "si por favor"; L1 known-word cold-start is
  Spencer's ratified confidence gift; speaking density on-a-train =
  R9 engine backlog ("later" affordance), already recorded in §13.9.

State: lesson tree 815 passed / tsc clean; learner view re-emitted
(0 unrendered). No new TTS needed (all audio texts already in corpus).
NEXT: Spencer walks /es/qa/m1-lesson-1 (9 lessons on the picker).

## PM(16) — 2026-08-20: gender tints in-lesson + the interleaving restructure

Spencer (mid-turn): "we need the gender colors implemented in the
lessons but so far a big improvement" + the interleaving wisdom
("teaching all the numbers at once, in a row, is kind of boring …
4 + two random words, then the rest + random words, then a full review
lesson; applies to other courses and module spine design; ja m31
kureru/ageru same failure").

**Gender tints (done):** the three greeting maps carry
`tokenGenders` — L3 buenos días {m,m}, L3 buenas tardes {f,f}, L8 hola
buenos días {–,m,m} (hola untinted on purpose — the contrast is the
lesson). WordMapStepView now honors the genderColor.ts accessibility
contract: solved tinted chips pair the hue with the m/f/n letter badge
(view + test updated; the gloss placeholder is a NBSP — that burned one
edit round). Emitter renders the tint layer; new module pin: any map
showing buenos/buenas/días/tardes/noches must tint it correctly.

**Interleaving restructure (done):** numbers now 4/4/3 across L4/L5/L6,
each broken mid-lesson by an unrelated word — the hasta-luego sim moved
INTO L4, the mucho-gusto mirror sim INTO L5; L6 = ocho/nueve/diez + y +
o (y debuts in seis-y-siete map, nueve by elimination, o in
cuatro-o-cinco); old L6 (partings) dissolved; CHECKPOINT moved to
position 7 — after ALL teaching (Spencer's exact teach-some → teach-rest
→ full-review shape). ES_M1_CHECKPOINT_INDEX=7. CP recall-seis →
recall-ocho (ocho now printed-voiced L6.3); CP y-cloze options gain o;
L7 mc-y → mc-o. Titles updated (promises). Recorded as guide §13.9 law
9 + memory `interleave-dont-block-teach` (spine law for ALL courses —
flag JA m31 kureru/ageru block when that spine gets revisited).

**TTS:** +1 clip "uno dos tres cuatro" (L4 win) — manifest 2,427→2,428
additive, fr byte-identical, tts-publish/es 1,178. Deck 17 cards.

**State: lesson tree 816 passed / tsc clean; learner view re-emitted
(tint layer rendered, 0 unrendered).** NEXT: Spencer walks
/es/qa/m1-lesson-1 (9 lessons; checkpoint is now #7).

## PM(17) — 2026-08-21: ES m2 + FR m1v2/m2 authored (custom-author wave 2)

Spencer: "custom author … up to module 2 … model [French] after spanish …
get a good m1 and m2 in french for me to work through — way better test
of teaching." Authored inline, all §13/§13.9 laws + interleaving:

**ES m2 (esM2Lessons.ts, 10 lessons, 23 items):** identity module opening
on the m1 turn-2 cliff (R10 kit: ¿cómo estás?/bien/¿y tú?/no entiendo).
Escape-phrase sim = incomprehensible-NPC-line self-cueing debut, with a
2-turn PAYOFF sim (she slows down → you understand). soy/eres + él/ella +
maestro/maestra alternating trials; gender tints on él/ella/maestro/
maestra/señor maps; flags for countries; checkpoint at 8; café
integration (escape payoff mid-conversation); mastery ends on María, a
STRANGER. usted/formal deferred to m3. Pins: esM2Lessons.test.ts (40) —
incl. cross-module recall law (m1 voicings license m2 recalls).

**FR m1v2 (frM1Lessons.ts, 9 lessons):** ES m1v2 spine RE-DERIVED (not
translated): silent letters = the phonetics lane (L1 card cashes on
au revoir); bon/bonne via «bonne nuit»-vs-bonsoir (never «bon nuit»);
six/dix + un/non ear pairs; «Un café ?» plants «un»; ça va mirror sim =
L6 interleave break; world = Léa/Hugo/Emma. **FR m2 (frM2Lessons.ts,
10 lessons, 21 items):** identity module; CITIES not countries (Paris/
New York/Montréal — dodges du/des article minefield); étudiant/étudiante
= the gender pair BY EAR (silent t wakes up: DYAHN/DYAHNT); French keeps
pronouns (anti-Spanish note); Chloé = mastery stranger. Pins:
frProtoLessons.test.ts (74, both modules + cross-module recall law).

**Infra:** fr speaking() gained the `cue` recall param. Walker extracted
to ProtoModuleWalkerPage.tsx; EsM1L1Page is now a LANG DISPATCHER
(/es|fr/qa/m1-lesson-1) + new ProtoM2Page (/es|fr/qa/m2, route added in
App.tsx). Learner-view renderer extracted to learnerViewRender.ts;
emitters: es-m1 (refactored), es-m2 (ES_M2_LEARNER_VIEW), fr m1+m2
(FR_LEARNER_VIEW) → docs/learner-sim/{es-m2,fr-m1,fr-m2}-proto.md.

**TTS:** runtime scan (all audio surfaces incl. map-chip + option
tap-audio) → es +14 clips (manifest 2,428→2,442), fr +52 (53→105; NEW
deck lingo-data/data/test_decks/fr-proto.json; es deck now 31 cards).
tts-publish: es 1,192, fr 105 — all additive; ja/ko byte-identical.
Denise audition STILL OWED before fr goes near selectable.

**State: lesson tree 930 passed / tsc clean / all four learner views
emitted 0-unrendered / audio coverage scan: 0 missing both langs.**
DISPATCHED: 5 Opus fresh-learner walks (2× es m2 — m1-graduate persona;
3× fr m1+m2 — zero-French persona: confusion, retention, ease/flow).
NEXT: apply walk findings → Spencer walks /es/qa/m2, /fr/qa/m1-lesson-1,
/fr/qa/m2 (m1 es picker unchanged).

## PM(18) — 2026-08-21: five-walk sim pass + fix round (es m2 + fr m1/m2)

Five Opus fresh-learner walks returned (2× es m2 as m1-graduates, 3× fr
m1+m2 zero-French). Yields: es m2 ≈13 cold-produced next-day (no
entiendo strongest; café L9 = summit). fr m1 ≈5 course-earned items
(numbers chain-only), fr m2 ≈12+3 frames ("2.5× more productive than
m1"; étudiant/étudiante drill = "the explicit template"; L3 escape-
phrase payoff = "best-designed moment"; the intro→build-with-trap→
cloze→cold→cold chain named as THE retention mechanic).

FIXED same session, all four modules:
- ENGINE: audio-prompted word MCQs no longer preview option audio on
  tap (every walk: tap-preview = sound-diffing, deletes the step).
  Emitter header updated to match.
- WORLD: learner renamed SAM everywhere (was Diego/Hugo — both standing
  in their own scenes); hometown pinned (es: Estados Unidos, fr: New
  York); es L9 Carmen + fr L9 Inès ask the name (Sofía/Emma already
  knew it); Emma/Chloé spell «Enchantée»; María answers your «¿y tú?»
  and says goodbye in the mastery explanation.
- SIMS now TRAP the taught contrast in-scene (me llamo/te llamas,
  soy/eres, es/soy, je/tu forms) instead of offering two known-wrong
  m1 phrases.
- CHECKPOINTS: numbered + forward-pointing titles ("L7/L8 ✓ Checkpoint
  · Warm up for …" — the ✓-as-finish-line was a measured quit point);
  es m2 CP ends on a 2-turn stranger SIM (a conversation module's exam
  now contains a conversation); dup clozes/recalls swapped for España-
  y-México connector cloze + me-llamo-Sam build + señora recall.
- PRODUCTION HOLES: señora voiced (L3 + CP recall); fr merci beaucoup
  voiced (CP printed); fr «je ne comprends pas» + «comment tu
  t'appelles ?» get BUILDS before anything asks cold; m1 numbers get m2
  lanes (es: seis-y-siete lc + count recall in L9; fr: dix ear trial in
  L8 + «Un café ? Ou deux ?» — numbers enter a conversation, "deux
  s'il vous plaît" accepted).
- FR SOUND DEBT: L1 card no longer disproves itself with bonjour;
  oi=wah + French u + stress-caps convention taught; bonsoir/à bientôt/
  enchanté/comment-tu-t'appelles respelled on cards; ça va card-fed
  BEFORE its sim; numbers named "the loud exception"; isolated il/elle
  ear beat before sentence-level; d'où cloze moved pre-checkpoint.
- TINTS named at first appearance in all four modules (pink-f/blue-m
  families) + fr L7 card connects the audible -t rule to the colors.
- Typing warm-up: mid-module translate in es L6 (fr already had the
  L2 build ladder; graders were already accent/apostrophe-tolerant).

NOT actioned (Spencer's calls / backlog): speaking "later/in-public"
affordance (R9 — every walk's #1 real-world risk, now urgent);
integration lessons open on their big sim (flow walks want the payoff
at the END of L9-type lessons; mastery already ends on its sim);
L1 known-word cold-start kept (ratified confidence gift).

TTS: +4 es (Sam lines, España y México → 2,446) +4 fr (Sam lines, un
café ? ou deux ? → 109), additive; decks 35/56 cards; tts-publish es
1,196 / fr 109. State: lesson tree 930 passed, tsc clean, four learner
views re-emitted 0-unrendered, audio scan 0 missing.
NEXT: Spencer walks /es/qa/m1-lesson-1 · /es/qa/m2 · /fr/qa/m1-lesson-1
· /fr/qa/m2.

## PM(19) — 2026-08-21 · PROMOTION IN PROGRESS (Spencer's directive)

Spencer: Denise voice PASSED (audition closed). Counting audio comma-paced
(13 sites, 10 clips staged additively, manifests es 2450 / fr 114 installed).
DIRECTIVE: "kill whatever we had authored for spanish and french, promote
the QA modules as the true course content, save the spines and word lists
for now, stage everything for a commit to prod." No push. Stage EXPLICIT
paths only (lingle-eb dirty files untouchable: LessonShell.tsx, index.css,
ios/*, scripts/draft/frames.mjs, generate.mjs, docs/reports/authoring-audit.md).

PLAN (Explore agent mapped the surface — full report in transcript):
1. es/curriculum: git mv m1..m19.ts + m*.test.ts + ir/ → _archive/ (+README,
   JA precedent). scripts blind to _archive (readdir/single-segment globs).
2. New es/curriculum/m1.ts (dev/esM1Lesson1.ts+esM1Lessons.ts merged,
   sync-ified: static import courseAtoms THEN grammarHelpers) + m2.ts
   (esM2Lessons.ts). Each: ES_Mn_ATOMS (author — protos carry none),
   ES_Mn_LESSONS (ids es-m1-1..9 / es-m2-1..10, titles = PROTO_TITLES),
   ES_Mn_PLACEMENT {screener>=1, byModule>=3}. Copy old m1.ts atom()/circular
   import pattern.
3. Trim hand lists: curriculum/index.ts ES_MODULE_META + LESSONS_BY_MODULE;
   courseAtoms.ts imports + EsAtomSource union ("m1"|"m2") + getEsCourseAtoms
   spread; placementBank.ts; grammarHelpers ES_MODULE_ORDER; tiers.ts
   ES_SKILL_TIERS (rewrite for 2 modules); courseMapData COURSE_MILESTONES.es
   (index-keyed).
4. Generalize 8-lesson gates: es+fr moduleContentLints (exact 1..8 id array),
   both moduleBarGuards /-8$/ mastery exemption, es-quality + fr-quality
   TOPIC(1..7)/MASTERY(===8) split → per-module lesson counts.
5. Port dev suites → curriculum m1/m2.test.ts (registerEsModuleContentLints +
   barGuards + proto pins). Delete dev proto files; QA pages import curriculum.
6. fr: archive m1.ts + m1.test.ts; new m1.ts/m2.ts export FR_Mn_MODULE
   (FrModuleDef, no id — filename-derived) + FR_Mn_ATOMS (nouns need gender)
   + FR_Mn_PLACEMENT (FLAT array). Three globs pick up automatically.
   TIERS_BY_LANGUAGE += fr (getSkillTiers throws otherwise — fr IS selectable).
7. External pins: deriveModuleTestOut.test it.each m5/m10 → m1/m2; qaCatalog
   agreement_cloze+info coverage; reviewTailSrs pin needs es:hola fromModule
   m1; matchPairsPairCount >=6 (render pads); es-smoke needs es-m1-1 + hola
   (holds); frAudioCoverage zero-ratchet (proto clips all in manifest 114);
   frPromptComprehensibility=0; lessonAtomIndex: fr must stay []-atoms — do
   NOT add fr case to normalizedAtoms. gen-es-review-pool regen AFTER trim.
   docs/PROJECT_STATE.md update.
8. Full vitest + tsc green → stage explicit paths (lingo + lingo-data decks/
   manifests/tts-publish). Commit only on Spencer's word.

## PM(20) — 2026-08-21 · PROMOTION COMPLETE

Everything in PM(19)'s plan landed. The §13 m1/m2 are the REAL es and fr
courses; the July/August IR waves live in each language's
`curriculum/_archive/` (READMEs carry the ruling). Headlines:
- es: 19 modules archived; new curriculum/m1.ts (9 lessons, reused July
  atom list + placement) + m2.ts (10 lessons, 22 authored atoms, fresh
  placement); index/courseAtoms/placementBank/ES_MODULE_ORDER/tiers/
  milestones all trimmed to m1/m2. esReviewPool regenerated (47 atoms).
- fr: IR m1 archived; new m1.ts (+bon/soir/et/ou/café atoms) + m2.ts (19
  atoms); FR_SKILL_TIERS added (was a live crash: fr selectable with no
  tiers). Course decks re-emitted (es 346 / fr 126 cards).
- Gates taught the doctrine, not weakened: audio-prompted wimcq exempt
  from inv 44 + counted right in inv 24; 2-option both-taught clozes are
  discrimination trials (E2 exemption); word_map is intro-capable and its
  tokens collected (fr); kana display shadowed by audioText not demanded
  as clips; es-quality + fr-quality rewritten to the §13 contract
  (checkpoint zero-new at declared index, mastery ends on sim, no typed
  translate, tile+spoken production, 60% cross-module review floor);
  moduleContentLints/barGuards take expectedLessonCount / derive mastery.
- Dev protos DELETED; their 4 test suites ported into curriculum
  (m1/m2.test.ts es, fr-doctrine.test.ts). QA routes now serve the
  PROMOTED lessons through getMockLessonContent (real render pipeline).
  Learner-view emitters repointed at curriculum.
- Counting audio comma-paced ("uno, dos, tres"), 10 clips additive.
  Denise audition PASSED (Spencer). Sam/New York/Inès in both cast lists.
- Suite: 10,194 passed / 4 pre-existing failures in docClaimGuards (the
  concurrent session's CLAUDE.md rewrite dropped the XP phrasings — NOT
  ours). tsc clean.
- STAGED: lingo 226 files (explicit paths; concurrent session's files
  untouched: CLAUDE.md*, docs/INDEX.md, docs/reports/authoring-audit.md,
  ios/*, scripts/draft/*). *CLAUDE.md carries my course-state paragraph
  update but ALSO their full rewrite — left unstaged, needs an owner
  decision. lingo-data: 5 files staged (decks + generate.py).
- NOT DONE (next wave): IR emitters/factories for the new step kinds →
  m3+ authoring; R9 engine backlog (speaking "later" affordance first).
NO COMMIT yet — Spencer pulls that trigger.

## PM(21) — 2026-08-21 · COMMITTED

lingo main: `ba7ce113` (promotion, 227 files) + `80a09987` (in-flight
session state; CLAUDE.md rewrite kept green by restoring the XP claim
phrasings; .tsbuildinfo-gate gitignored). lingo-data: `7358743` (decks).
Working trees CLEAN. NOT pushed — nothing local is. New authoritative
doc: docs/course-design-learnings-2026-08-21.md (9 cross-course laws),
pointed to from CLAUDE.md. Session ends here; next session starts at:
IR emitters/factories for the new step kinds → m3+ dispatches; R9 engine
backlog (speaking "later" affordance first).
