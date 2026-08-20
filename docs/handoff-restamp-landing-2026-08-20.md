# Handoff — R1 restamp landing + tonight's closed threads (2026-08-20, ~21:45)

Written for the post-compaction continuation. Everything below is ESTABLISHED —
do not re-derive, re-measure, or re-read the sources listed unless the tree has
moved under you. Spencer's parting instruction: he will eyeball the fresh diff
("I will take a look here once we reconnect") — that is R1 option (b). Nothing
lands until he speaks.

## THE ONE PENDING DECISION

R1 restamp landing. Spencer reviews `docs/restamp-rows.json` (regenerate with
`node scripts/restamp-from-module.mjs` if stale — dry-run is the default; it
also prints the human diff). The 38 `ambiguous` rows are what needs his eye;
his R2 default already rules the rest: **"count the word as taught the moment
its introduced"** — kana-row anchors count (verified: anchor words carry
kana+romaji+meaning and are graded — `hiraganaCurriculum.ts` ya-row ~line 540),
exercise-alone does NOT count.

## R1 — state of proof (all DONE, recorded on B104; do not redo)

- Instrument `scripts/restamp-from-module.mjs`: fresh classes = 559 match,
  51 kana-row, 155 restamp, 136 never-taught→future, **37
  exercised-never-introduced** (new class; 9 first-exercised by m32/m33
  themselves), 38 ambiguous. Policy changes landed: `vmcq-debut` counts as
  introduction; exercise-only refuses to restamp; printers throw on unknown
  classes (that bug HID the 37 on the first run). Emits
  `docs/restamp-rows.json` (untracked, regenerable).
- Independent audit `scripts/audit-restamp-rows.mjs` (committed): **0 evidence
  failures across all 291 changing rows.** Reverse check: 1 authored
  used-before-taught site (ぎゅうにゅう dealt by `ja-m4-neo-review`'s match
  step, one module before its m5 vmcq debut) + 14 derived pad sites
  (self-heal). Two early audit "failures" were auditor bugs, both fixed:
  compiled IR lesson ids lack the `ja-` prefix; compound kana rows split on
  `、` as well as `/`.
- **Applied-suite fallout (measured, worktree + APFS-cloned node_modules;
  `git apply` of the patch, full vitest): 22 failures, three classes:**
  1. inv-30: ~12 imageable words restamped INTO m11–m27 debut on
     grammar_rule/build, need authored word_image_mcq debuts — あるく,
     いちばん, いっしょ, おにいさん, くうこう, ごぜん, しごと, ちち, て, ふゆ,
     へや (+1 in m11). This IS Spencer's "teach the word properly given the
     new tag" work.
  2. Comprehensibility gates: `grammarReviewPools.test.ts` (authored pool
     steps + frozen harvested debt), `content.test.ts` (ja stories +
     conversations + gloss level), `sceneVocabGate.test.ts`.
  3. Mechanical pins: `fromModuleDrift.test.ts` truth table,
     `applyKanjiSurfaces.test.ts` anchor unlocks, `DictionaryModal.test.tsx`
     initialWord.
  Regenerate the applied state with `node scripts/restamp-from-module.mjs
  --apply` (all-or-nothing write to ja/courseAtoms.ts; verified-unique edits;
  never touches introducedByLessonId or conjugationTables).
- Devil's-advocate retirements (evidence recorded, don't re-litigate):
  placement shrink spread thin (worst m19 −14, m17 −12, m21 −13; no test-out
  collapse); dormancy ≈ nil (deck gates on unlock state from play
  history/credits, not raw labels — `courseDeck.ts` ~line 100); kana-row
  stickiness fine; churn mechanical.
- Landing sequence after Spencer's GO: (1) rule the 38 ambiguous by the R2
  default, escalate only the residue; (2) triage the 37
  exercised-never-introduced — を/する/くる-class rows are instrument blind
  spots (grammar-card intros in hand modules), the rest join the R16
  teach-them wave; the 9 m32/m33 leaks get in-module intros where natural
  (こうえん → m32 directions lesson, introduces at m32.ir.yaml:403); (3)
  --apply; (4) author the ~12 vmcq debuts (IR front door, then TTS via the
  m33-wave flow); (5) fix comprehensibility-gate hits; (6) update the three
  pins; (7) THE GUARD: a test that re-derives labels from the live course and
  fails on any drift — this is what kills the こうえん class forever; (8)
  full suite green; (9) point matchPairsFloor's ja fill at the truthful
  accessor (B102 rides this landing).

## R17 は/wa — CLOSED (issue doc has the full record; don't reopen)

Root cause: `emit-tts-deck.mjs`'s trailing-。 strip defeats the TTS
front-end's segmentation; sentence-initial ははは reads as laughter. NOT a
voice/service problem; byte output is nondeterministic (5 runs, 5 md5s) so
**only whisper or ears judge clips** (faster-whisper "small", lingo-data venv).
Whisper-audited all 16 shipped ははは clips: 5 failed, repaired kanji-fed,
verified 母は, staged in tts-publish/ja (1,112 files now). Durable fix:
`Job.text` owns hash/manifest, `Job.speech` feeds the voice, via
`lingo-data/pipeline/tts/speech_overrides_ja.json` (all 16 pinned).
**Finding for the full-regen decision: partial kanji (母は + kana rest) still
failed 2 of 5 — only full-sentence kanji + 。 is reliable.** F (forced わ)
rejected permanently. Trevor: 5 keys OVERWRITE live objects → CloudFront
invalidation required (README + needs-spencer). Full kanji-fed corpus regen =
separate undecided project: ~12.3k clips, ~4–5h local, ~600MB re-upload, full
invalidation or v2 path, needs reviewed kanji renderings per sentence
(homophone risk — こうえん→公園/講演).

## Tree / coordination state (verify with git status before acting)

- **DO NOT PUSH.** HEAD (local, main 47 ahead of origin) doesn't build in a
  fresh checkout: my commit of `mockCourse.ts` carries lingle-17's
  `import { buildFrenchCourse } from "@/features/languages/fr/curriculum"`
  while `fr/` is untracked. lingle-17 ACKNOWLEDGED (cross-session message):
  they will stage fr/ + fr manifest + tts-publish/fr + the mockLessons FR
  spread together-with-or-before mockCourse/registry. Their status: FR m1
  landed, their suite green at 10,325 with my HEAD underneath. They pull HEAD
  state of reviewQueue.ts / items.yaml before editing.
- Lesson learned (also in auto-memory): when slicing commits in this shared
  tree, grep EVERY staged file's diff for es/fr/foreign hunks — mockCourse
  slipped through tonight.
- Untracked-by-design: docs/restamp-rows.json, docs/restamp-audit-report.json
  (regenerable), main-tree ES/FR files (lingle-17's), scripts/draft/*.
- courseAtoms.ts is CLEAN at HEAD (the applied restamp was reverted; patch
  regenerable via --apply, copy also at session scratchpad
  restamp-applied.patch while this session lives).

## Verdict ledger (2026-08-20 export ingested — reviewQueue.ts + backlog note: fields)

15 entries resolved with Spencer's verbatim (R1 R2 R3 R4 R5 R6 R8 R9 R10 R11
R12 R14 Q1 Q2 Q4). Open: R7 (Trevor creds), R13 (parked), R15 (research then
discuss — kanji catalog 明帰薬熱), R17→now closed except Trevor's
invalidation, Q3 (status-bar emulator check). Landed tonight besides R1/R17
work: Q4 QA-page fix + binding link test; R10 stage-tail 5cqh (measured);
R11 pbxproj committed; B107 filed; B098/B097/B099/B056 closed.

## Still-queued work (priority order after the R1 landing)

1. R3 ない-form lesson — LEAD: m28's own rule card says "the ない-form you
   have had since module 6" (m28.ir.yaml:259) vs R3's claim it's never taught
   before m29. Resolve the contradiction first (where does ない actually first
   appear?), then use the existing conjugation-teaching design, "a good bit
   sooner", my pick of module. R3's queue link ja-m29-3-1 is a dead pilot id.
2. R4 particle mix-up pass (B089) — per-cloze failure node + simpler
   two-particle explanations; m33's appended-clause style is prior art.
3. m34 authoring (must re-cement m33's glance block — ratchet in
   m33-neo.test.ts is vacuous until ir/m34.ir.yaml exists).
4. R15 research note; Q3 emulator check; full-kanji-regen decision doc.

## Commands that matter (don't rediscover)

- Instrument dry-run: `node scripts/restamp-from-module.mjs`
- Apply: `node scripts/restamp-from-module.mjs --apply`
- Audit: `node scripts/audit-restamp-rows.mjs` (exit 1 only on evidence fails)
- Whisper a clip: faster-whisper in `../lingo-data/.venv` (model "small",
  language="ja"); TTS regen: `.venv/bin/python -m pipeline.tts.generate
  --lang ja --provider edge` (kokoro is NOT installed; Nanami = edge voice)
- Deck emit: `node scripts/emit-tts-deck.mjs` (side effect: writes decks)
- Isolated suite check: worktree + `cp -c -R node_modules <wt>/` (APFS clone;
  symlinked node_modules breaks Vite's module runner) — needs untracked fr/
  copied in until lingle-17 commits.

## GROUP-4 RULING (Spencer, 2026-08-20 post-compaction) — sidequest words

Spencer: "most of those get taught in the course; any that aren't get scoped
into normal modules (maybe a plain lesson); the travel side quest exists for
other things. Work within the authoring guidelines / module IR. WAIT for his
GO before running any changes."

Investigated: ALL SEVEN are already taught by the live course — no new
content authoring needed. The instrument was blind to hand-authored primers
and rule-card teaching. The plan, per word:

| word | goes to | mechanism |
|---|---|---|
| はい | m7 | already in `introduces: [たべます, のみます, はい]` (m7.ir.yaml:148) — pure restamp |
| いつ | m11 | ir-introduces ja-m11-neo-9 — pure restamp |
| じゃないです | m29 | ir-introduces ja-m29-neo-1 — pure restamp |
| です | m7 | add です to `m7-neo-4`'s introduces (m7.ir.yaml:241; its first beat IS "です — the noun's polite finish", line 243) + restamp |
| いくらですか | m9 | add to `m9-neo-4` "Yen and how much" introduces (m9.ir.yaml:202, currently [いくら, ひゃく]) + restamp |
| どこですか | m19 | add to `m19-neo-9` introduces (m19.ir.yaml:655, currently []) + restamp. Line-658 comment already knows the phrase is registered (build step avoided tiling it — leave the step alone) |
| ごめんなさい | m3 | hand module: taught by ja-m3-neo-5 phrases lesson (m3-neo.ts:1159 — audio primer :1195 + speaking :1201 + scenario match). Registry edit: fromModule m3, introducedByLessonId → ja-m3-neo-5 |

- All 7 also need `introducedByLessonId` repointed off the DELETED
  `ja-sidequest-survival-phrases` (attr status "dangling" on every row —
  today these words likely never unlock into the SRS deck at all; the fix is
  learner-visible). Dangling pointer ⇒ nothing relies on the fallback path ⇒
  the CLAUDE.md repoint landmine is clear for all seven.
- おねがいします / こんにちは / わかりました stay `sidequest-survival`
  (already classed match/keep, "sidequest sentinel, truthful as-is") — they
  wait for the remade travel quest, per Spencer's ruling.
- IR compile after edits: `node scripts/compile-ir.mjs m7 m9 m19` (verify the
  compiler accepts a multi-word phrase kana in an introduces list — all
  current entries are single words).
- ⚠️ Fallout caveat: these 7 were classed ambiguous/keep in the measured
  worktree run, so the 22-failure count does NOT include them. です/はい are
  extremely common tokens; dict-form-first means pre-m7 content should be
  clean of です, but the post-ruling worktree suite is the proof — re-run it.
- Groups 1–3 and 5–8 defaults were proposed to Spencer in the same exchange
  and not objected to; confirm them in the GO message before applying.
