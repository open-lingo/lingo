# KO friends-release audit — m1–m15 (2026-09-01)

**Question:** is each module LEARNABLE end-to-end (comprehensibility, intro-before-graded,
audio present, no broken/hollow steps) — not whether it's polished. Verdicts separate
"blocks a friends-release" from "quality debt we can ship with."

**Method / coverage:** read-only audit of the working tree (includes the uncommitted
2026-08-26 Tier-1 fixes). m3–m15: **every lesson of every module read in full** (each is a
single hand-authored file, 8–9 lessons; no sampling needed). m1/m2: structural read —
m1-intro + the Tier-1 diffs read in full, row lessons audited via `_hangulRowHelpers`
call-sites and targeted greps, batchim + review lessons read in full; I did NOT walk every
generated row-lesson step. Audio: **100% of audio-bearing strings** (listening-comp
`audioText`, speaking targets, build targets, translate `audioKey`) in m4–m15 checked
programmatically against `src/shared/tts/manifests/ko.json` (sha256(`ko:`+text)[:16] at
16-char-aligned offsets). m1–m3 audio not re-checked (covered by the 2026-08-26 audit).
Tests: `npx vitest run --project curriculum src/features/languages/ko` →
**32 files, 369 tests, all passing** (2.8s).

Companion docs (not re-derived): `ko-authoring-infra-gap-2026-08-26.md`,
`ko-gap-audit-2026-08-26.md` (coverage: top-100 32%, top-500 20%, grade-A 27%).

---

## 1. Per-module verdict table

| Mod | Theme | Verdict | Coverage | Notes |
|---|---|---|---|---|
| m1 | Hangul: vowels + plain consonant rows | **ship-ok** | structural + Tier-1 diffs verified | Tier-1 fixes in tree (intro block-geometry rewrite; 미→무 word swap). No cross-row review/capstone/confusables — debt (§3). |
| m2 | Hangul: aspirated/tense/y-vowels + [t]-batchim | **ship-ok** | structure + batchim/review/y-vowel lessons read; rows via helpers | 30 lessons (was 27; batchim lessons added), un-interleaved row march — grind risk, debt. Compound vowels explicitly deferred and never picked up (§3 — the seam defect). Batchim = [t]-group only. |
| m3 | First phrases (copula, 은/는, Sino 1–10) | **ship-ok** | full read | Tier-1 rebuild verified: 이-subj idSuffix, 학생/선생님 standalone intros, split-then-drill numbers, all-new mastery test, `introBeforeGraded` gate green. Depends on untaught ㅔ/ㅖ glyphs (§3). |
| m4 | Things & possession (의/제, 이거·그거·저거) | **ship-ok** | full read | Clean intro-before-graded. NATIVE-REVIEW flags on bare-demonstrative register (debt). 2 audio misses (1 listening-comp). |
| m5 | Native numbers, counters, 주세요, 얼마예요 | **fix-inline** | full read | 커피 leans on an m2 reading-word exposure only (no semantic re-intro before 커피-builds); 원 used as distractor 2 lessons before its intro. Fix: 커피 phrase card in m5-5, reorder 원. 3 audio misses incl. the m5-7 listening comp. |
| m6 | Places, 있어요/없어요, 에 vs 에서, 이/가 | **ship-ok** | full read | Clean. 먹어요 pre-taught here before m7 formalizes it (fine). 3 audio misses (speaking/build + 1 lc). |
| m7 | Verbs + 해요 present + 을/를 | **ship-ok** | full read | Clean; audio 10/10 present. Best module of the band. |
| m8 | Adjectives (predicate, ㅡ-drop, attributive) | **ship-ok** | full read | 그런데 is dialogue-context-only (acceptable recognition intro). "좋은 책이 좋아요" is an awkward drill sentence (debt). 2 audio misses (no lc). |
| m9 | Connectors 하고 / 와·과 / 도 | **fix-inline** | full read | **빵 graded (MCQ + listening) with no intro anywhere in the course** — its atom claims `fromModule:"m5"` but m5 never teaches it (attribution drift). 우유 is OK (fully drilled in m2). Fix: 빵 phrase card in m9-1 + correct the atom. 2 audio misses incl. m9-7 lc. |
| m10 | Past tense (verbs, adjectives, copula) | **ship-ok** | full read | Clean. 3 audio misses (translate/speaking/build only — no lc). |
| m11 | Negation 안/못, 하다-split, 고 싶어요 | **ship-ok** | full read | 네/아니요 come only from the survival sidequest (`fromModule:"sidequest-survival"`) — deducible in context, debt note. m11-7 lc clip missing (fallback voice). |
| m12 | Time (시/분/반), days, time-에 | **fix-inline** | full read | **토요일 graded cold** — MCQ correct answer with only an info-card mention (월/수/금/일요일 got phrase cards; 화/목/토 did not). 만나요 required in a translate step, taught only in the dialogue info card. Fix: 2 phrase cards or retarget the MCQ. 2 audio misses. |
| m13 | Months, frequency, 부터/까지, 그래서 | **fix-inline** | full read | **운동 graded in m13-2 listening (항상 운동해요) three lessons before its intro card in m13-5** — in-module order violation. 비가 와요 (rain idiom) must be *produced* in a translate step; 비 was taught as an m1 reading word but the 와요-idiom only appears in an info card. Fix: move 운동 card into m13-2, add a rain-idiom phrase card. 시험/일해요 recognition-only support words (flagged inline, acceptable). |
| m14 | 고 / 아·어서, big numbers, 아·어 주세요 | **fix-inline** | full read | **자요 ("sleep") never taught anywhere** (atom registered at m15, `srsEligible:false`) yet m14-1's listening comp requires distinguishing "eat then sleep" from "sleep then eat" — unanswerable without knowing 자요. Fix: 자다/자요 phrase cards in m14-1 (S). "밥을 먹어서 가요" cloze teaches a sequence-어서 reading natives would render with 먹고 — needs native review (debt). |
| m15 | 고 있어요, 아·어도 돼요, 지만 | **ship-ok** | full read | m15-5 info claims 지만 is "the in-clause version of M13's 하지만" — 하지만 was never taught (it was only a distractor); one-line text fix. m15-7 lc clip missing. 쉬다 properly introduced. |

**Summary: 0 module-level BLOCKERs, 5 fix-inline (m5, m9, m12, m13, m14), 10 ship-ok.**
The two release blockers are course-level (§2 #1–#2). All fix-inline items are individually
S-sized (a phrase card, a reorder, or a text line).

Two structural graces keep the gaps above from being blockers: RR romanization is always
on for KO (`fadeOnMastery:false`), so every Hangul string is decodable even where jamo
teaching is missing; and KO audio falls back to browser `speechSynthesis` when a manifest
clip is absent (JA is recordings-only; KO is not), so missing clips degrade rather than
silence a step — on devices WITH a Korean system voice.

## 2. Ranked blocker / fix list (course-level, across m1–m15)

1. **BLOCKER — KOGL attribution absent in-app** (§5). The NIKL-derived
   `ko/frequencyAtoms.ts` (2,998 atoms, KOGL Type 1) ships in the bundle and powers the
   frequency drip; KOGL Type 1 requires source credit. The only in-app Attributions
   surface (`src/features/settings/SettingsSectionPanel.tsx`, "Attributions" group,
   ~line 508) credits KanjiVG + Hangul stroke data only. **Fix:** add a
   "출처: 국립국어원 (National Institute of Korean Language), KOGL Type 1" line (with
   link) to that group. **Effort: S** (one JSX paragraph + i18n key).
2. **BLOCKER-adjacent — TTS coverage holes, m4–m15: 26 of 163 audio-bearing strings have
   no manifest clip (~16%)**, including **6 listening-comprehension steps** where audio IS
   the exercise: m4-7 (저거 책이에요), m5-7 (커피 두 잔 주세요), m6-7 (친구가 학교에
   있어요), m9-7 (커피하고 빵 주세요), m11-7 (커피 안 마셔요), m15-7 (여기 앉아도 돼요?).
   These fall back to the platform voice — a different speaker mid-lesson, and silence on
   a device with no Korean voice installed. The rest of the 26 are speaking/build/translate
   playback (degraded, tolerable). **Fix:** `node scripts/emit-ko-tts-deck.mjs` →
   `python -m pipeline.tts.generate` (lingo-data) → upload + manifest regen. **Effort: S/M**
   (mechanical; the pipeline exists; note new audio must ship WITH its manifest).
3. **Compound vowels never taught** (§3, Tier-2 confirmed). ㅔ/ㅖ appear in the copula
   이에요/예요 from m3 lesson 3 onward, 예쁘다/예뻐요 (m8), 게/거예요 (m4), 계세요 (m3),
   돼요 (m15) — the single biggest m2→m3 seam defect. Not a friends-release blocker
   *only because* RR readings are always visible; the learner can't sound the glyphs out
   themselves. **Fix:** one compound-vowel lesson (ㅐ ㅔ ㅖ ㅘ ㅝ ㅢ minimum) appended to
   m2 + row-drill steps. **Effort: M.** Highest-value pedagogy fix on the list.
4. **Intro-before-graded batch (the 5 fix-inline modules)**: 빵 (m9, + fix the false
   `fromModule:"m5"`), 자다/자요 (m14), 운동 order (m13), 비가 와요 idiom (m13),
   토요일/만나요 (m12), 커피/원 (m5). **Effort: S each, ~S/M total.** Then **extend
   `ko/__tests__/introBeforeGraded.test.ts`'s `MODULE_LESSONS` table from m3-only to
   m3–m15** (S) — the gate is built to be extended and would have caught every one of
   these mechanically. (Caveat: it keys on owned `fromModule === moduleId` vocab atoms, so
   the 빵-class cross-module case also needs the atom attribution fixed to be caught.)
5. **No review-interleave machinery anywhere in KO** (§3, Tier-2 confirmed). Zero
   `pickReview*`/pool/tails; exactly one review lesson in the whole course (`ko-m2-review`).
   Modules never resurface earlier material except by accidental vocabulary reuse.
   **Ship-with debt** for a friends release (SRS flashcards partially compensate), but
   retention will visibly sag by m10+. **Fix:** port the ES pattern
   (`gen-ko-review-pool.mjs` → `koReviewPool.ts` → `pickReviewSurfaces` + ratchet).
   **Effort: M–L** (punch-list #4 in the infra-gap doc).
6. **m2 is a 30-lesson un-interleaved row march** (Tier-2 confirmed; was 27, now 30 with
   the batchim lessons). Learnable but the most likely place a friend churns.
   Interleave-don't-block-teach applies. **Ship-with debt; Effort M** (resequencing).
7. **Batchim taught at ~1/7 depth** (Tier-2 confirmed): the [t]-group lesson exists and is
   good; ㄱ/ㄴ/ㄹ/ㅁ/ㅂ/ㅇ codas are named in one info card only, and 연음/liaison is
   never taught (the RR annotator *applies* liaison — 학년→hangnyeon — so the learner
   hears/sees it without explanation). **Ship-with debt; Effort M.**
8. **Placement bank covers m1–m3 only** — a friend with prior Korean cannot place past m3
   and must grind 30+ Hangul lessons or test out manually. **Ship-with debt; Effort M**
   (per-module items + conformance-test update).
9. **No KO audio-coverage gate** (§4) — nothing fails a build when a lesson references an
   unclipped string; that's exactly how the 26 holes in #2 accumulated silently.
   **Fix:** a manifest-membership test over the same string-scrape the emitter uses, or
   `module-gate --lang=ko` stage 2. **Effort: S.**
10. **Native-speaker review pass never done** (every m3–m15 file carries CONTENT-TODO /
    NATIVE-REVIEW flags; e.g. 먹어서-vs-먹고 in m14-2, bare-demonstrative register in m4,
    m15-5's false 하지만 back-reference). **Ship-with debt for friends; do before public.**

## 3. Tier-2 confirmations for m1–m3 (all still hold) + release calls

| Tier-2 item | Confirmed? | Evidence | Call |
|---|---|---|---|
| Compound vowels never taught, used from m3 on | **YES** | m2.ts:29 + m2 review info: "Compound vowels (ㅐ ㅔ ㅘ ㅝ) … are next"; no lesson anywhere teaches them; m3's 이에요/예요/계세요 all contain ㅔ/ㅖ. `alphabetConfig` lists a `vowels-compound` reference section (conformance-tested) but no curriculum lesson drills it. | **Debt, near-blocker** — shippable to friends only because RR never fades; fix first after the two blockers (§2 #3). |
| Batchim ~1/7 depth, no 연음 | **YES** | m2.ts:498–637: [t]-group lessons only; the other six codas get one info sentence; liaison never taught (but IS applied by the RR annotator, moduleConformance.test.ts:101). | **Debt.** Learners can read the taught vocab; they'll mispronounce novel codas. |
| No review-interleave machinery | **YES** | Zero grep hits for `pickReview|reviewPool|ReviewTail|reviewMatchPairs` under `ko/`; single `ko-m2-review` lesson. | **Debt** (§2 #5). SRS deck is the only compounding surface. |
| m1 lacks cross-row review/capstone/confusables | **YES** | No review/capstone lesson in m1-rows/m1-vowels (only a comment explaining the 3+3 split); contrast JA's `priorRowReviewTail` machinery. | **Debt.** m2's full review partially backfills. |
| m2 un-interleaved row march | **YES** | 30 lessons (m2.test.ts:16), straight row sequence. | **Debt** (§2 #6). |
| Tier-1 fixes present in tree | **YES** | `ko:이-subj` (courseAtoms.ts:167); m3 학생/선생님 standalone intros (m3.ts:173–174); numbers split-then-drill (m3.ts:384+); all-new mastery test (m3.ts:476+); m1-intro geometry rewrite + 미→무 (uncommitted diffs); `introBeforeGraded.test.ts` new, green. | Verified; **still uncommitted** — commit before release or the built bundle won't carry them ([[built-surface-drift]]). |

## 4. Gates inventory — what KO enforces by machine today

**KO has (all green, 32 files / 369 tests):**
- `ko/__tests__/introBeforeGraded.test.ts` — intro-before-graded, **m3 only** (extendable table).
- `ko/__tests__/moduleConformance.test.ts` — identity, `ko:` namespacing, particles/classifiers/
  conjugation slots, alphabet sections, placement m1–m3, ADR-011 omissions, RR liaison sanity.
- `ko/__tests__/koSiblingSets.test.ts` — sibling-set shape.
- `curriculum/mN.test.ts` ×27 — shape guards only: lesson count, unique lesson/step ids,
  moduleId/languageId tagging, every mockCourse pathway node resolves to content.
- Shared generic module conformance (ADR-001 contract).

**KO lacks (JA/ES equivalents exist):**
- **Audio-coverage gate — absent** (finding, §2 #9). JA has `audioCoverage.test.ts` +
  module-gate stage 2 (both JA-hardcoded); ES has its smoke; KO has nothing — confirmed by
  grep and by the 26 live holes.
- Intro-before-graded beyond m3 (JA: conformance + `kanaWordIntroOrder`; ES: quality suite).
- Untaught-distractor / distractor-debut guards (JA IR pipeline).
- Density / no-adjacent-same / generation-minimums / compounding-review ratchet
  (ES `es-quality` + `es-course-integrity`, 365 LOC — the port is punch-list #2).
- Exposure audit, atom-registration ratchet, accepted-answer collisions, homograph
  teaching gates (JA).
- Placement full-coverage ratchet (ES conformance asserts full coverage; KO asserts m1–m3).
- Learner-sim walk + smoke (ES-hardcoded walker; zero `docs/learner-sim/ko-*`).
- `module-gate` one-command verdict (JA-only paths).

## 5. KOGL attribution status: **ABSENT — release blocker**

- Required credit: 출처: 국립국어원 (KOGL Type 1 source attribution) for the NIKL corpus
  ranks + learner grades embedded in `src/features/languages/ko/frequencyAtoms.ts` (the
  credit exists only as a source-code comment, frequencyAtoms.ts:4 — not rendered).
- Grep of all app surfaces (`출처|국립국어원|KOGL|NIKL` across src/): no render-path hit.
  The Settings → More info → **Attributions** group
  (`src/features/settings/SettingsSectionPanel.tsx:508–539`) renders MIT + KanjiVG +
  Hangul-stroke credits only. No about/credits page elsewhere.
- **Fix (S):** add the NIKL/KOGL line to that Attributions group before ship. If the
  FR wave lands Lexique/Grammalecte content, their credits belong in the same group
  ([[fr-lexical-licences]]).

---

*Audit performed read-only against the 2026-09-01 working tree; no code changed. Test
run: `npx vitest run --project curriculum src/features/languages/ko` — 32 files,
369 tests, 0 failures.*
