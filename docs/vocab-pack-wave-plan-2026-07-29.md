# Vocab pack wave — plan & architecture (B065/B067 + quests)

**Date:** 2026-07-29 · **Status:** PLAN, approved direction (Spencer) — word
lists are DRAFT until locked per-module at authoring time
**Evidence base:** `vocab-exposure-audit-2026-07-29.md` (§6 packs, §7
frequency deep-dive) — independently verified numbers: 216 real never-graded,
96 never-touched, 73 CEJC top-500.
**Spencer's rulings (2026-07-29):** mixed-POS lessons ("beautifully merge some
of the verbs, and some of the nouns and adjectives into every inserted
lesson"); prefer slotting lessons INTO the course; 1–2 side quests for
nice-to-know vocab (anime pack named; work/animals as candidates) plus build
out the **Travel Sprint**; 7–8 words per lesson; frequency + N5 ordering;
follow authoring guidelines closely; QA-test, then run a Sonnet agent through.

## Design rule: mixed-POS packs

Every inserted lesson carries **2–3 verbs, 3–4 nouns, 1–2 adjectives/adverbs**
where the theme allows (calendar packs are legitimately noun-heavy). Why: a
lesson of 8 nouns cannot build sentences, and the review mix rules demand
sentence-context ≥60% — verbs are what make the pack's own words combinable
into SOV sentences with each other, not just with old vocabulary. Each pack's
verbs must be usable with its nouns in natural sentences (the self-check).

## Phase 1 — 16 in-course pack lessons (the priority)

Draft composition (final cut at authoring time with the module context pack;
per-module recipe + four traps in audit doc §3, B067):

| # | home | draft words (V=verb A=adj/adv) |
|---|---|---|
| 1 | m11 | ✅ SHIPPED 2026-07-29 (`ja-m11-neo-10` "The week — 〜ようび"): げつようび, かようび, すいようび, もくようび, きんようび, どようび, にちようび, あさって — no substitutions; all debut on the youbi-days rule card (📅 can't discriminate days, so no image MCQs); R1 extended to review them |
| 2 | m11 | ✅ SHIPPED 2026-07-29 (`ja-m11-neo-11` "This year, last year — the wider calendar"): ことし, きょねん, せんしゅう, せんげつ, らいげつ, まいとし, V:おぼえる(覚える, image-debut 🧠), A:はじめて — no substitutions; time-spans rule card; R3 extended to review them |
| 3 | m13 | ✅ SHIPPED 2026-07-29 (`ja-m13-neo-10` "けさ — the morning routine"): V:おきる, V:あらう, V:みがく, せっけん, シャワー, ゆうべ, けさ, A:はやい(早い) — no substitutions; asa-routine rule card (けさ/ゆうべ relative — no に); おきる/あらう/みがく un-parked into the trainer pools (99→13); せっけん's mislabeled "economy" meaningEn fixed; R3 extended (dict-form beats — SRS credit rides exact atom-kana matches); learner-sim 2026-07-29: ship-with-fixes, 0 BLOCKER — recognition beats added same day for おきる/ゆうべ (cloze-as-answer) + あらう/はやい (listening-comp), lesson now 23 steps (B083) |
| 4 | m14 | ✅ SHIPPED 2026-07-29 (`ja-m14-neo-10` "ドアを あけて — doors and lights"): V:あける, V:しめる, V:もつ, V:ひく, ドア, でんき, A:つめたい — no substitutions; akeru-shimeru rule card; new VERB_ENTRIES rows akeru/shimeru/hiku + motsu/tsumetai un-parked (→14) so the whole て-family is buildable; もっている taught as the stative "have" beside しっている; ドア's dead ja-m6-kata attribution deleted; R3 extended (same dict-form rule; a trailing ？ glues to the final token and drops its credit — statements only); learner-sim 2026-07-29: ship-with-fixes, 0 BLOCKER, SRS-collision lens clean — recognition beats added same day for あける (pair cloze) + しめる (dict-form listening-comp), lesson now 22 steps (B083) |
| 5 | m16 | V:かく, V:よむ, V:つかう, ノート, きょうしつ, クラス, いみ(意味), A:やさしい(易しい) |
| 6 | m16 | V:すう, V:はしる, たばこ, スポーツ, 歯, A:わるい, A:よわい |
| 7 | m17 | こども, おとな, おんな, おとこ, おんなのこ, おとこのこ, けっこん, V:あう(会う) |
| 8 | m17 | おじいさん, おばあさん, どなた, たんじょうび, みんな, かた(方), わたくし *(register note)* |
| 9 | m19 | みぎ, ひだり, よこ, A:まっすぐ, V:まがる, V:わたる, V:とまる, V:おりる |
| 10 | m19 | たてもの, かいだん, エレベーター, まち, みち, となり, コンビニ |
| 11 | m20 | A:おおい, A:すくない, A:すこし, たくさん, もっと, ほか, おなじ, ちょうど |
| 12 | m21 | どうぞ, どうも, おさら, コップ, カップ, おべんとう, カレー, V:つくる(作る) |
| 13 | m22 | はな(鼻), かぜ(風邪), V:ねる(寝る), V:すわる(座る), A:くらい(暗い), A:とても, A:たいへん |
| 14 | m23 | V:とる(取る), V:とる(撮る), V:かける, V:なくす, きって, はがき, ニュース |
| 15 | m24 | V:でかける, V:えらぶ, V:いそぐ, V:はこぶ, V:かたづける, じぶん(自分), A:いろいろ |
| 16 | m26 | また, しかし, そうして/そして, さあ, A:ゆっくりと, A:すぐに, ところ(所), つぎ(次), あと(後) |

Leftovers (そちら/あちら/むこう/そと/うしろ, よる/ひる/とし, こんな, こまる,
すむ, いちにち, おととい/おととし, けいかん, りゅうがくせい, まいばん/まいあさ
etc.) fold in where a pack runs short of 8, or seed a 17th pack — decide at
authoring time against the ratchet report.

**Per-pack mechanics (binding):** IR front door (`mN.ir.yaml` → compile) ·
registry row exists already (verify) · update `fromModule` to the teaching
module · **leave `introducedByLessonId` unset** · map tile in `mockCourse.ts` ·
relax the m19 guard test as pack 9/10 words land · TTS: verify manifest hits,
run emit+generate for any new sentences (emitter is regex-based and silent).
Authoring rules: `authoring-invariants-pinned.md` → `lesson-authoring-guide.md`
§13 (image-MCQ-as-intro, grading=review-only), pedagogy-principles, per-module
context pack (`node scripts/authoring-context.mjs mN`), sequential order
m11→m26.

## Phase 2 — side quests (BLOCKED by B066)

Side quests are inert today: routing maps empty, no SRS write surface,
quest-sourced atoms invisible to review pools. **B066 engine work lands
first**, then:

1. **Travel Sprint (`ja-travel-sprint`, existing tile)** — 4 Pimsleur-style
   listen-&-speak lessons. Natural content: the words m19 deliberately cut
   (のる, つく, でる, かかる, ひこうき, くうこう, タクシー, こうえん) + the 10
   existing `sidequest-survival` atoms. This is the highest-value quest: it
   houses real N5 words that lost the m19 seat-count fight.
2. **Anime Vocab (`anime-vocab`, existing tile)** — 12 nice-to-know words
   (せんぱい, せんせい already taught — dedupe against the registry first).
   New atoms needed; tag them so they never pollute course ratchets.
3. Candidates deferred until 1–2 ship: work vocab, common animals (tiles don't
   exist yet), festivals/gaming (tiles exist).

## Phase 3 — QA gates (every pack, before Spencer sees it)

1. `npm run module-gate -- mN` (vitest + TTS coverage + tsc).
2. Gate 10 visual QA: contracts → capture → judge (judges abort, never
   improvise on missing inputs).
3. Exposure ratchet MUST drop: `EXPOSURE_REPORT=1 npx vitest run
   atomExposureAudit`, lower `MAX_NEVER_GRADED`/`MAX_NEVER_TOUCHED` in the
   same commit as each pack.
4. Learner-sim: run the Sonnet agent as a zero-knowledge student through each
   new lesson + the module around it (positive-control the instrument first).
5. Backlog: `node scripts/backlog.mjs --check`; B065/B067 progress notes.

## Noted for later — simulation-style dialogue lessons (Spencer 2026-07-29)

Not part of this wave; recorded verbatim in intent. A simulation-style dialogue
that walks the learner through a real interaction ("shopfront emoji — worker
says: do you need a bag?") would suit the Travel Sprint especially, and course
lessons generally. Two possible homes: the planned **local-AI TTSD model
lesson**, or a playful scripted storefront format. Don't dumb it down. Also on
the table: improving the UI/UX of the existing dialogue lessons. Revisit when
Travel Sprint content is authored (post-B066).

## Dependencies & open rulings

- **B068** (287 taught-never-unlocked): ✅ SHIPPED 2026-07-29 — option 2
  (`isDeadAttribution` in lessonAtomIndex) + two ratcheted conformance tests,
  287 → 226. The 226 residual is legacy-`fromModule` mismatch; each pack's
  fromModule re-home lowers `MAX_GRADED_NEVER_UNLOCKABLE` — ratchet down in
  the same commit as the pack.
- **B069** (dormant `buildSrsReviewLesson`): independent of the packs, but the
  reserved-seat intake fix only matters once wired — decide alongside.
- **Giving verbs** (もらう/くれる/あげる, CEJC #98/#114/#171, today an m30
  event): separate scoping — new atoms + grammar point, NOT a vocab pack.
- **MAX_NEW raise**: still Spencer's call.
