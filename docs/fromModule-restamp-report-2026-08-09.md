# fromModule re-stamp — analysis and migration plan (B071)

**Date:** 2026-08-09 · **Status:** PROPOSAL — dry-run only, NOTHING LANDED
**Instrument:** `scripts/restamp-from-module.mjs` (dry-run by default; `--apply` exists and was **not** run)
**Full diff:** `docs/fromModule-restamp-diff-2026-08-09.txt` (391 changed/ambiguous rows + controls)
**Supersedes as worklist:** the per-pack burn-down table in `docs/stale-reference-audit-2026-07-29.md` §3

Tree state observed while measuring (relevant because two waves landed today):
A1/A2 executed (m30 pilot retired — the m30 tile exists with **zero** content
lessons; 19 pilot atoms re-homed to `m49`/`thr-n4`/`future`; `CourseAtomSource`
union already carries the forward tags), and the **B088 pad-pool fix is in the
tree** (`buildTileFloor.ts` draws prior-module fill through
`getJaTaughtKanaBeforeModule` / `taughtVocab.ts`; a sibling agent was finishing
that work concurrently — every number below was measured against this state,
and the real ratchet instruments were re-run to confirm the baseline, see §1.3).

---

## 1. Derivation — how "true teaching site" was computed

`node scripts/restamp-from-module.mjs` boots the live app modules through Vite
SSR (the same compiled lessons the app serves — IR output, `mockLessons`,
`mockCourse`, the attribution index) and walks the live JA map in learner
order, m1/m2 row sub-lessons included (the `lessonAtomAttribution.test.ts`
walk). No re-invented scans; no substring matching of Japanese (Rule Zero —
matching is on atom ids, exact tile surfaces, and exact IR surfaces resolved
through `JA_PRIMARY_ATOM_BY_KANA`).

Evidence hierarchy per atom (earliest live site in course order wins):

1. **IR per-lesson `introduces`** (`curriculum/ir/mN.ir.json`) — the module
   compiler's own declaration of the teaching site (m6–m29).
2. **Kana-row anchor words** (`hiraganaCurriculum.ts` `anchorWords` +
   `build.answer`) and kana-lesson attributions (`introducedByLessonId` in
   `ja-m1-*`/`ja-m2-*` space, dead or alive) — the M1/M2 doctrine: **kana-lesson
   vocab WORDS count as taught and SRS-eligible**; only kana glyph drills are
   excluded.
3. **Live, resolvable, on-map `introducedByLessonId`** (isDeadAttribution
   semantics — a dangling pointer is ignored).
4. **First step whose `exercisedAtoms` names the atom id** — the compiler's own
   attribution; the same definition `fromModuleDrift.test.ts` ratchets.

Three evidence classes are deliberately **excluded from setting truth**:

- **Review exposure** — dedicated review/recap lessons and review-beat steps
  inside content lessons (`-rev-`, `-tail-` step ids). Intro-before-review is
  law; a review beat exercising a word is not a teaching site. (Found the hard
  way: ぎゅうにゅう is "exercised" by `ja-m3-neo-2-rev-lc`, an authored m2-word
  review tail — its real debut is the `ja-m5-neo-3` word-image MCQ.)
- **Tile-only exposure** — a tile can be a seeded distractor
  (`kanaWordIntroOrder`: "distractor exposure doesn't count"), and since B088
  the pad makes tiles render-time-variable. Tile-only atoms go to the
  ambiguous bucket, never to a re-stamp.
- **Reserved inflection surfaces** (rebuilt from `conjugationTables`
  `VERB_ENTRIES`/`ADJ_ENTRIES`, exactly as `grammarHelpers.reservedInflections`
  does) — した is 下 *and* する's past; きた is 北 *and* くる's past. IR
  `m11-neo-5` literally `introduces: ["した", "きた", "いった"]` (plain-past
  forms); resolving those to the 下/北 vocab atoms and re-stamping them to m11
  would recreate the exact collision `shouldWriteReviewLessonAtom` was built to
  kill. Such surfaces never resolve; such atoms are never auto-restamped.

### 1.1 Positive controls (run before any classification; the script refuses to emit a diff if any fails)

```
✓ わるい → m16 (ir-introduces ja-m16-neo-11)            — known m16 pack word
✓ よむ → multi-site {m1 kana-row anchor, m16 pack} — class ambiguous, no auto-restamp
✓ ちゃ → m8 (ir-introduces ja-m8-neo-5)                 — known m8 word
✓ こうえん → never-taught (m6 → future)                 — known-untaught (independently source-grepped:
                                                          no IR introduces, no m3–m5 authored use)
✓ ぎゅうにゅう → m5 (first-exercised ja-m5-neo-3)        — the requested negative control FAILED HONESTLY:
                                                          the 07-29 "untaught per the m8 walk" claim is stale;
                                                          ja-m5-neo-3-vmcq-gyuunyuu is a word-image debut
                                                          (hand-verified in m5-neo-a.ts). Replaced by こうえん.
✓ ちち → m17 (ir-introduces ja-m17-neo-1; was m8)        — the drift test's own hand-verified row
```

The よむ control is deliberately a *multi-site* control: よむ is BOTH the
ya-row anchor word ("よむ to read", taught by `ja-m1-ya-1`'s row) AND the m16
classroom-pack word its tag was re-homed to on 2026-07-30. The instrument must
find both and refuse to pick — that is the m1-doctrine-vs-pack-re-home tension,
and it is a human call (§2.5).

### 1.2 Instrument parity with the checked-in ratchets (measured, not assumed)

The real instruments were run on this tree (`STALE_REPORT=1 EXPOSURE_REPORT=1
npx vitest run fromModuleDrift atomExposureAudit lessonAtomAttribution` — all
green) and the analysis replicas reproduce them **exactly**:

| Instrument | Real (this tree) | Replica |
|---|---|---|
| fromModuleDrift | 225 (181 early / 44 late) of 521 exercised | 181 / 44 / 521 ✓ |
| atomExposureAudit never-graded | 183 / 664 | 183 / 664 ✓ |
| atomExposureAudit never-touched | 140 | 140 ✓ |
| atomExposureAudit graded-never-writes | 18 | 18 ✓ |
| lessonAtomAttribution graded-never-unlockable | 209 | 209 ✓ |
| lessonAtomAttribution dangling | 226 | 226 ✓ |
| grammarReviewPools gate flagged set | GATE_EXEMPTIONS (34 entries) | 34, identical keys ✓ |

(Note: current drift pins are 193/44 with headroom; the true measured baseline
after today's A1 is already 181/44 — the m30 pilot's retirement removed 12
early-tag rows.)

## 2. Classification — every JA course atom (932 registry rows)

| class | count | re-stamped by `--apply` | meaning |
|---|---|---|---|
| match | 491 | 0 | tag equals the earliest live teaching site — 264 module-tagged taught rows + 227 sentinel rows (`future`/`m49`/`thr-n4`/`sidequest`) already truthfully never-taught |
| kana-row | 51 | 1 | taught by an m1/m2 kana row; kept per doctrine (the 1: おちゃ m5→m2 — a yoon-row anchor word nothing else teaches) |
| restamp | 198 | 198 | taught, wrong module → re-stamped to the true module |
| never-taught | 152 | 152 | no live lesson introduces it → `"future"` sentinel (today's A2 precedent) |
| ambiguous | 40 | 0 | multi-site / conflicting / tile-only / off-map / sidequest — human ruling, listed with candidates |

**Total re-stamps: 351** — directions: 152 → `future`; 21 sentinel→mN (taught
`future`-tagged words like わかる/いう/ひこうき/ちかてつ entering the live
population); 39 to an earlier module (unlock-blocker fixes: かう m25→m5, きく
m24→m5, たべもの m21→m5, する m11→m5, くる m11→m5); 139 to a later module
(gate-dishonesty fixes: へや m6→m27, おかね m5→m27, としょかん m6→m19,
がっこう m6→m19, ちち/はは m8→m17, この/その/あの/どの m8→m17 — the live spine
genuinely defers determiners to m17, confirmed in `m17.ir.json` lesson
`m17-neo-7`).

Full row-by-row diff (with per-row evidence lesson ids):
`docs/fromModule-restamp-diff-2026-08-09.txt`. Re-generate any time with
`node scripts/restamp-from-module.mjs`.

### 2.5 The 40 ambiguous rows (the human worklist)

Buckets, verbatim list in the companion file:

1. **Off-map kata teaching (11)** — ビール, レストラン, ペン, コンビニ, トイレ,
   ジュース, ラーメン, テスト, テレビ, ナイフ, ニュース: only "taught" by the
   retired-but-registered `ja-mN-kata` lessons (deep-link doctrine keeps their
   unlock honored). Ruling needed: `future` (honest debt, kills their phantom
   pool presence) vs keep (preserves the deep-link unlock story). These 11 are
   the entire post-migration never-touched residual (§4).
2. **Kana-row vs content conflict (8)** — わたし(m4 tag; sites m1-row + m3 +
   m10-IR), たべる(m7; m2-row + m5), ごはん(m7; m2-row + m5 + m8-IR),
   すし(m7; m1-row + m5 — its forward-ref homograph behavior is load-bearing in
   `shouldWriteContentReviewAtom`'s docs), えき(m6; m1-row + m3), じゅう(m5;
   m2-row + m9), ほん/みず/かばん/これ/よむ-class rows where the tag matches a
   later real site.
3. **Sidequest phrases actually taught by the live map (7)** — です(m7-neo-4),
   はい(m7-neo-1-IR), ごめんなさい(m3-neo-5), いくらですか(m9-neo-4),
   いつ(m11-neo-9-IR), じゃないです(m29-neo-1-IR), どこですか(m19-neo-9).
   Re-homing changes the practice-content gate (sidequest reads as module 0 —
   always comprehensible) and placement seeding; product call.
4. **Inflection-surface collisions (2)** — した(下), きた(北): evidence exists
   but is untrusted by design (§1).
5. **Tile-only exposure (7)** — ネクタイ, よる, なぜ, し(四), え(絵),
   じゃ/じゃあ, せ(背): distractor-only appearances.
6. **Review-only exposure (1)** — では: graded only by `ja-m14-neo-review-3` —
   an intro-before-review content bug in its own right.

## 3. Consumer-by-consumer behavior diff (what changes if `--apply` lands)

Every consumer verified in code; two consumers beyond the briefed list were
found and traced (frequency deck, romajiLexicon phase flip; plus the kanji
surface trio).

### 3.1 D2 content-review gate (`reviewTailSrs.shouldWriteContentReviewAtom`)

Strictly-earlier-module check, runtime semantics (collision guard included):

- **24 atoms START advancing FSRS** (currently graded but never write). All are
  words the live course really teaches under a wrong/sentinel tag:
  わかる (future→m5, +7 write sites), いう (future→m5, +7),
  ちかてつ (future→m19, +14), きょうだい (future→m17, +10),
  ことば (future→m26, +10), ふる (future→m25, +8), ひこうき (future→m23, +5),
  うる (future→m9, +5), はたち (future→m17, +5), ふたつ (future→m9, +4)…
- **2 atoms STOP writing entirely**: せん (m14→m20, −1 site),
  ひろい (m8→m27, −2). Honest: their only current writes are premature
  (graded before the live course teaches them — B070-class dishonest grades).
- **164 atoms change write-site counts** — dominated by early-tag fixes:
  premature writes in/before the true teaching module stop, later spaced
  retrieval continues. Example: へや (m6→m27) keeps no m6–m26 writes it never
  should have had.

### 3.2 Dynamic review prefix pools (`scanReviewCandidates` → `getAtomsUpToModule`)

The candidate pool at every module shrinks to the truthful taught set
(SRS-eligible atoms; full table in the analysis dump):

| module | old | new | in/out |
|---|---|---|---|
| m5 | 121 | 110 | +16 / −27 |
| m8 | 237 | 182 | +15 / −70 |
| m11 | 336 | 263 | +20 / −93 |
| m17 | 477 | 380 | +21 / −118 |
| m22 | 600 | 452 | +15 / −163 |
| m29/m30 (full) | 664 | 533 | +21 / −152 |

The −152 are the never-taught words leaving every pool (they could only ever
appear as phantom candidates); the + column is late-tag words arriving where
they belong (m5 gains する/くる/いる/ある/かう/きく/わかる/いう/たべもの/のみもの…).
**Continuity note:** an existing learner's FSRS card for a word moved LATER
(へや due at m8) stops being selectable in that module's review prefix — the
card is orphaned until the true module. Unlock-store state itself is untouched,
so the flashcard deck keeps serving previously-unlocked cards (§3.5).

### 3.3 Placement seeding (`applyPlacementResult` — `seedModuleSet.has(atom.fromModule)`)

- **Full test-out:** 664 → 533 atoms seeded+unlocked. The **152 phantom seeds
  disappear** — this is most of A5's "164 atoms unlock that no lesson ever
  teaches" fixed at the data layer.
- **Newly seeded (21):** つくえ, ごにん, ふたつ, ちかてつ, どっち, シャツ, く,
  はたち, きょうだい, わかる, どうぶつ, うる, うるさい, つく, かみ, いう,
  ことば, あかい, おもい, ふる, ひこうき. Riskiest concrete example:
  **わかる** — a learner who tests out of m5+ now (correctly) gets a わかる
  flashcard seeded; today they never do, despite the course drilling it from
  `ja-m5-neo-7`.
- **Tier composition shifts:** an m1–m7 test-out goes 181 → 158; the m5 number
  atoms leave (いち/に/さん…さんにん/よにん are truthfully m9 — live m5 is
  Verbs I) and the real m5 verbs enter (ある, する, いる, くる, かう, きく,
  わかる, いう, たべもの, のみもの…). A learner placing at m7 today gets number
  flashcards for words the neo course teaches at m9, and NO cards for the m5
  verbs — the migration inverts both, truthfully.

### 3.4 Grammar-review comprehensibility gate (`grammarReviewPools.test.ts`)

The gate ratchets BOTH directions, so the migration **must** ship with the
exemption edits:

- **12 GATE_EXEMPTIONS become STALE (removable):** all 3 `ga-existence`, both
  `ni-location`, and 7 of the 9 `wo-object` entries — exactly the entries whose
  comment predicted "they clear when atom provenance is re-stamped".
- **3 NEW harvested failures need exemptions (or a point-module fix):**
  `counter-nin::ja-grev-nin-0/1/2` — the number atoms moved m5→m9 (truth), and
  the counter-nin point's module predates that.
- **BLOCKER — 40 AUTHORED (`ja-gpool-*`) steps fail the strict gate under the
  new tags**, and that test permits no exemption list by design. These are real
  B070-class findings the stale tags were masking: authored grammar-review
  sentences built on words the live course does not teach by the point's
  module. Word blame (full table in the analysis dump):
  ぎんこう/こうえん/まち/べんり/たいへん/はやい → **never taught at all** (→
  future); としょかん・がっこう (m6→m19), へや (m6→m27), とおい (m6→m20),
  この/その/あの (m8→m17), いつも/ときどき (m11→m22), から (m5→m15),
  あたま/いたい/おなか (m20→m22), せん/まん (m14→m20), います/よみます
  (legacy polite rows → future).
  **Second-order finding:** some grammar-point `module` values in
  `n5-grammar-points.json` are themselves old-course numbering
  (kono-sono-ano-dono says m8; the live spine teaches determiners in m17 per
  `m17.ir.json`) — the gate's other input needs the same truth pass. Options in
  §6/§7.

### 3.5 Flashcard-deck unlock paths (B068 machinery)

- **Course-walk unlockable atoms: 307 → 462** (+158 by walking the same
  course): the numbers (いち/さん/ご/よん/なな/きゅう/はち/ろく, ひとつ/みっつ/
  ふたつ), ぎゅうにゅう, きっぷ, あそぶ, なまえ, さんぽ, えんぴつ, かいもの,
  たべもの, みせ, やすい, たかい, うる, ちがう, いま, しる… all currently
  taught-and-stuck.
- **Graded-but-never-unlockable: 209 → 53.** The residual 53 decomposes:
  ~25 m1/m2 kana words whose row lessons carry no word-level
  `exercisedAtoms`/tiles (かめ, きのこ, ふね, いえ, ゆき, えび, ぞう…) — a
  separate content/attribution fix; the 11 off-map kata words + 7 sidequest
  phrases + した/きた held ambiguous; and a handful of multi-site holds
  (すし, ごはん, パン, コーヒー…).
- **Runtime landmine documented, not fixed here:** `getAtomsForLesson` returns
  the static index for any lesson with ≥1 static attribution and NEVER runs
  the fallback there — so a re-homed atom whose only teaching lesson also
  carries someone else's `introducedByLessonId` still cannot fallback-unlock
  (observed: いう, おしえる). Worth a B-item; the migration reduces but does
  not zero this class.

### 3.6 Pad pool (`buildTileFloor`, B088 state) and match-pairs fill

B088 already bounds the blast radius: prior-module fill must be in the
truthful taught set, so the migration mostly stops the *pool bookkeeping* from
lying. Net per-module usable fill pools move modestly both ways (m8 169→144,
m12 226→244, m27 402→419; full table in the analysis dump). Same-module fill
uses `fromModule === moduleId` + neo-attribution — re-stamped atoms change a
few same-module fills. **Consequence:** seeded distractor picks reshuffle in
many lessons → expect learner-visible tile-bank changes, snapshot churn, and
**B086 pin churn (4th occurrence)** in `drillPoolIsTaught`-style pins.

### 3.7 Trainer pins (`conjugationTables.ts` `introducedAtModule` — SEPARATE field, NOT migrated)

15 table entries now disagree with the re-stamped truth of their linked lemma
atom (B086 correlated drift; report-only): いく/みる/のむ entry 7 vs m5,
する/くる entry 6 vs m5, わかる entry 11 vs m5, かう entry 7 vs m5,
しる entry 11 vs m10, おしえる entry 14 vs m8, だいじょうぶ entry 9 vs m3,
はたらく entry 10 vs m7, あそぶ entry 10 vs m4, げんき entry 9 vs m2,
よむ entry 7 vs m16(held ambiguous), かす entry 99 vs m8. B086's own fix
("pin trainer unlocks to teaching modules, one measured migration") should
consume this table — in a follow-up, not this change.

### 3.8 Frequency deck (`frequencyAtoms.ts` — derived from `fromModule: "future"`)

- Population 224 → 355: **21 leave** (now course-taught — correct, their cards
  unlock the normal way), **152 enter** (honest never-taught debt becomes
  frequency-deck material — precisely that surface's design).
- **All 203 surviving cards change `frequencyRank` → `unlockModule`** (rank =
  registry position among future-tagged atoms, and the insertions/removals
  reshuffle every position). For learners with the frequency feature enabled,
  unlock pacing of existing frequency words shifts wholesale. If that matters,
  the rank derivation needs stabilizing (e.g. pin by atom id order at a dated
  snapshot) BEFORE the migration lands.

### 3.9 The rest of the traced consumers

- **`courseMapData.getModuleVocab`** — map-tile vocab counts/samples regroup:
  m8 56→24, m11 65→50, m18 16→3, m19 30→12, m28 0→7, m29 7→0 (declared ids
  still fold in). Tile copy that quotes counts will look different.
- **`vocabData` browser** — rows regroup by `moduleLabel`; "Upcoming" goes
  234→365.
- **`grammarSrs.getReachedModules`** — reached = modules with ≥1 unlocked atom,
  resolved through `fromModule`. Truthful after re-stamp, but an existing
  learner whose unlocks were placement-seeded phantom words can LOSE reached
  credit for a module whose only unlocked atoms moved away → some Track B
  points deactivate until a real lesson unlock. Small, self-healing, worth a
  release note.
- **Kanji surface trio** (`resolveEligibleKanjiAtomId`, `buildTileKanji`,
  `switchoverCandidate`) — 21 ex-future words become kanji-substitutable /
  switchover-eligible; 152 newly-future words stop. Latent sharp edge found:
  `switchoverCandidate.moduleIndexOf` digit-strips, so `"future"` → 0 and
  `"thr-n4"` → **4** — future-tagged atoms read as "unlocked at module 0" in
  its comparison. Harmless today (candidates are unlock-gated), but worth a
  guard when tags start moving.
- **`romajiLexicon.isPastKanaPhase`** — flips per-word romaji once any unlocked
  atom's tag is beyond m1/m2; unaffected in practice (plenty of m3+ tags
  remain).
- **`moduleCompiler` / `buildSrsReviewLesson` ReviewAtom views** — display
  metadata only; no behavior change.
- **`practice/content/gate.ts`** (curated content) — resolves through the
  normalized module (future → undefined → incomprehensible): curated items
  leaning on the 152 phantom words now fail honestly; same fix-the-content
  rule as §3.4.

## 4. Ratchet forecast (all measured with instrument-parity replicas, §1.2)

| Ratchet (file · pin) | Today | Post-apply | Direction |
|---|---|---|---|
| `fromModuleDrift` MAX_EARLY_TAG (193) | 181 measured | **43** | DOWN — residual = kana-row doctrine keeps (ねこ/やま m1, first-exercised m3…) + ambiguous holds |
| `fromModuleDrift` MAX_LATE_TAG (44) | 44 | **14** | DOWN — residual = ambiguous holds (えき, はな-flower, すし, たべる, した, では…) |
| `fromModuleDrift` ちち instrument control | present | **GONE — test must swap control** (suggest ねこ: tag m1, first-exercised ja-m3-neo-1, doctrine-stable) | test edit required in same change |
| `lessonAtomAttribution` MAX_DANGLING_ATTRIBUTIONS (226) | 226 | **226 — HOLDS** (migration never touches `introducedByLessonId`; separate cleanup) | hold |
| `lessonAtomAttribution` MAX_GRADED_NEVER_UNLOCKABLE (209) | 209 | **53** | DOWN |
| `atomExposureAudit` MAX_NEVER_GRADED (183) | 183 | **31** | DOWN (population change: never-taught words leave the audited set — that is the point) |
| `atomExposureAudit` MAX_NEVER_TOUCHED (140) | 140 | **11** | DOWN — residual = the 11 off-map kata ambiguity holds |
| `atomExposureAudit` MAX_GRADED_BUT_NEVER_WRITES (18) | 18 | **21 — RISES by 3** | UP, explained: ごにん/シャツ/せん/ひろい/あかい enter the audited population (future→mN or moved) and are graded only same-module — honest accounting, same class as today's +33 never-touched changelog entry; ありがとうございます and やる leave. Pin with changelog note. |
| `atomExposureAudit` population guard `rows.length > 600` | 664 | **533 — GUARD MUST DROP to ~500** | test edit required (this is the honest population: eligible atoms attributed to live modules) |
| `grammarReviewPools` GATE_EXEMPTIONS (34, two-direction) | 34 flagged = 34 exemptions | **25 flagged: remove 12 stale, add 3 (counter-nin)** | net DOWN; must ship in same change |
| `grammarReviewPools` authored strict gate (0 tolerance) | 0 failures | **40 failures — BLOCKER** until authored-pool content / stale point modules are fixed (§3.4) | must be resolved before/with landing |

Everything moves down or holds except the one explained +3 and the population
guard, which measures the same cleanup from the other side.

## 5. Risks — honest list

1. **The 40 authored-pool gate failures are a hard landing blocker.** They are
   pre-existing content defects (untaught words in authored review sentences)
   that stale tags green-lit. Fixing them properly is content work across
   ~17 grammar points, entangled with **stale grammar-point `module` values**
   (kono-sono-ano-dono m8 vs live m17). Landing the migration without this is
   impossible (the strict test allows no exemptions); rushing sentence rewrites
   to make a gate green is how quality regressions happen. Budget real
   authoring time.
2. **The diff is only as good as the evidence rules.** Places where judgment is
   coded, not measured: review-step exclusion, tile exclusion, the kana-row
   doctrine, reserved-inflection distrust, earliest-site-wins for multi-site
   words. All are documented in the script header and each disputed row landed
   in `ambiguous` rather than auto-restamped — but 351 rows will contain some
   number of wrong calls; the per-row evidence column exists so review is
   cheap. Spot-check top-frequency words before `--apply`.
3. **Learner-state discontinuities** (no stored SRS/unlock state is touched,
   but derived views shift): orphaned due-cards for later-moved words until
   their true module (§3.2); reached-modules shrink for placement-seeded
   learners (§3.9); frequency-deck unlock pacing reshuffles wholesale (§3.8 —
   consider stabilizing rank derivation first).
4. **Tile-bank reshuffle**: pad fill re-seeds in many lessons → learner-visible
   distractor changes, visual/snapshot churn, B086 trainer-pin churn, and the
   exposure audit's "touched" metric will wobble (its changelog already calls
   pad-touch phantom exposure).
5. **Ambiguity backlog**: 40 rows blocked on Spencer rulings; the drift
   ratchets cannot reach 0 until ruled (forecast 43/14 assumes all holds keep
   their current tags).
6. **The m1/m2 unlock gap survives** (~25 kana words remain
   graded-never-unlockable because row lessons carry no word-level evidence)
   — needs its own fix (emit `exercisedAtoms` from anchor-word steps, or
   re-point static attributions at live row sub-lesson ids).
7. **Two sibling waves landed today** (A1/A2, B088). All baselines here were
   re-measured on the post-landing tree (§1.2), but if either is amended,
   re-run the dry-run — the script re-derives from the live tree in ~1 min.

## 6. Recommended landing sequence

1. **Rulings pass (Spencer, ~40 rows):** the ambiguous bucket in the companion
   file, highest-value first: the 11 off-map kata words (ruling `future` takes
   never-touched to ~0), the 7 sidequest phrases, the 8 kana-row conflicts.
   Encode rulings as explicit overrides (extend the script with a small
   rulings map) so `--apply` stays reproducible.
2. **Grammar-point module truth pass + authored-pool content fix** (the §3.4
   blocker): correct stale `module` values in `n5-grammar-points.json` (each
   point should match the IR module that declares it), then rewrite the
   ~40 authored pool sentences onto taught vocabulary; re-run the dry-run
   analysis to confirm authored-strict = 0 and re-measure the exemption diff.
3. **One commit — the migration:**
   - `node scripts/restamp-from-module.mjs --apply` (expect 351 edits; the
     script aborts all-or-nothing on any drift),
   - ratchet updates with changelog notes: `fromModuleDrift` pins 193/44 →
     43/14 + swap the ちち control for ねこ; `atomExposureAudit` pins
     183/140/18 → 31/11/21 (+ the 18→21 explanation) and population guard
     600 → 500; `lessonAtomAttribution` 209 → 53 (226 dangling pin untouched);
     `GATE_EXEMPTIONS` −12/+3,
   - `npx vitest run` full suite; expect secondary movement to triage in:
     `m16-neo.test`, `kanjiCoverageAudit`, `recognitionExposure`,
     `buildTileFloor`/`matchPairsFloorDispatch` (pad picks), `learnerView` /
     visual snapshots, `derivedReviews`, `applyPlacement.test`.
4. **Walks to re-run after green:** `EXPOSURE_REPORT=1` + `STALE_REPORT=1`
   dumps re-archived; `npm run authoring-audit`; learner-sim walks on m5, m8,
   m11, m16, m17 (tile banks + unlock behavior changed most there — m17's
   headline family lessons finally unlock ちち/はは); a placement QA pass
   (full test-out seeds 533, m1–m7 seeds 158 with verbs-not-numbers).
5. **Follow-ups (separate changes):** B086 one-shot trainer-pin migration off
   the §3.7 table; the m1/m2 word-evidence fix; the dangling-attribution
   cleanup (226 pin ↓); frequency-rank stabilization if product wants stable
   pacing; a B-item for the static-attribution lesson-level fallback
   suppression (§3.5); packs for the 152 now-honestly-future words — the
   exposure dumps replace the drift table as the pack-wave worklist.

---

*Analysis artifacts (scratchpad, not committed): consumer-analysis.mjs/.txt,
gate-blame.mjs/.txt, restamp.json — regenerate via the script's `--json` flag.*
