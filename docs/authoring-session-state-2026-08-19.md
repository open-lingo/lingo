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
