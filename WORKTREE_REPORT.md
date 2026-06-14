# KO Modules 7-12 — Worktree Report

Branch: `ko/content-m7-m12`. Authored the Korean curriculum for Modules 7-12
to the quality bar of the shipped KO M3-M6, continuing KO→JA content parity.

## Modules authored (6 modules, 48 lessons, 8 lessons each)

| KO module | Title | Mirrors JA arc | Korean grammar taught |
|-----------|-------|----------------|------------------------|
| **M7** | Verbs & the 해요 present | JA M7 (dictionary verbs + ます polite + を) | 가다/오다/먹다/마시다/보다/하다; 해요-style polite present (= future); 아요/어요 vowel split; 하다-verb pattern (공부해요); object particle 을/를 |
| **M8** | Describing things | JA M8 (い-adjective predicate + attributive) | Descriptive verbs (좋다/크다/작다/예쁘다/맛있다/비싸다) conjugate like verbs; ㅡ-drop (크다→커요, 예쁘다→예뻐요); attributive -(으)ㄴ (좋은 책, 큰 가방) |
| **M9** | Connecting things | JA M8 と (and/with) + JA M9 layering (よ/ね) | 하고 (and / with), formal 와/과, 도 (too/also, replaces the particle) |
| **M10** | The past tense | JA M10 (ました + でした) | Past 았어요/었어요/했어요 (verbs + adjectives); blends (갔어요/왔어요/봤어요); copula past 였어요/이었어요; 어제/오늘 |
| **M11** | Saying no & saying can't | JA M11 (ません / ない + can't) | 안 (don't), 못 (can't), the 하다 split (공부 안 해요), past negation, 고 싶어요 (want to) |
| **M12** | Time & the week | JA M12 (〜じ/〜ふん + days + に time) | 시 (native-number hours), 분 (Sino-number minutes), 반 (half), 몇 시예요?, days 요일, time particle 에 |

### Step shapes
Each module follows the M3-M6 template exactly: 8 lessons, ~5-7 graded steps
each, built from the KO grammar helpers (`infoStep`, `phrase`, `vocabMcq`,
`sentenceMcq`, `listeningCompSentence`, `cloze`, `build`, `translateStep`,
`speaking`). Teach steps carry no SRS weight; only graded factories tag atoms.

## Wiring (same touchpoints as M4-M6)
- **Atoms**: `courseAtoms.ts` — added `M7_VOCAB`…`M12_VOCAB` blocks + the
  `m7`…`m12` `KoAtomSource` values, appended to `KO_COURSE_ATOMS`. Duplicate
  surfaces that already existed (도/커피/빵/우유) are re-registered
  `srsEligible: false` so first-write-wins keeps one canonical SRS card.
- **Lessons**: `mockLessons.ts` — imported `KO_M7_LESSONS`…`KO_M12_LESSONS`,
  registered them into the `LESSONS` map.
- **Pathway**: `mockCourse.ts` — added `m7Lessons`…`m12Lessons` node arrays and
  six module definitions to the KO course.
- **Guard tests**: `m7.test.ts`…`m12.test.ts` — each asserts 8 lessons tagged
  ko/m{n}, unique lesson + step ids, and every pathway node resolves to content.
- **Art**: downloaded 3 missing Noto SVGs (🎬 1f3ac, 🍎 1f34e, 🥛 1f95b) into
  `src/pub/noto-emoji/svg/` so every emoji used in an image-MCQ / phrase card
  has bundled art. All other emoji were verified present before use.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run build` — clean.
- `npm run test:run` (full suite) — **128 files / 1092 tests pass**, including
  the 6 new guard tests (the AbortError lines are happy-dom teardown noise, not
  failures). No new failures introduced.

## NATIVE-REVIEW flags (consolidated)
Every flag is inline at its step with the same `// NATIVE-REVIEW:` text. All are
register/naturalness judgement calls on grammar that is itself well-documented —
none are uncertain *vocabulary*. None block shipping for a beginner audience;
a native speaker should confirm register before a polished release.

1. **M7 `ko-m7-7-q-whatdoing`** — 뭐 해요? drops the object particle 를. This is
   the natural spoken form; a textbook might prefer 뭐를 해요? / 무엇을 해요?.
2. **M8 `ko-m8-7-q-prettybut`** — 그런데 ('but / by the way') is used in the shop
   dialogue without a dedicated teach step. Confirm it's not ahead of an A2
   learner's level.
3. **M9 `ko-m9-7-q-metoocoffee`** — 저도 커피 주세요 drops the object particle
   before 주세요 (matches the M5 ordering register). Confirm vs the 를 form.
4. **M9 `ko-m9-7-tr-withfriend`** — 같이 ('together') appears only in the info
   card; the accepted-answer set keeps it optional so the learner isn't forced
   to produce an untaught word.
5. **M10 `ko-m10-7-q-whatdid`** — 뭐 했어요? drops 를 (parallels 뭐 해요? in M7);
   a textbook might use 뭐를 했어요? / 무엇을 했어요?.
6. **M11 `ko-m11-7-q-dontdrink`** — 커피 안 마셔요 drops the object particle;
   confirm vs 커피를 안 마셔요.
7. **M11 `ko-m11-7-q-canttoday`** — 오늘은 (topic-marked 'today' for contrast) is
   natural but slightly beyond the bare 오늘 taught in M10. Confirm it's not too
   far ahead for an A2 learner.
8. **M12 `ko-m12-7-tr-meetatthree`** — 만나요 ('let's meet'/'I meet') appears only
   in the info card and accepted-answer set; 만나다 isn't drilled as its own
   atom. Confirm it's acceptable as a recognition-only word here.

Each curriculum file's header comment also lists the module-level CONTENT-TODO
items (e.g. confirm the 아요/어요 split teaching order, the ㅡ-drop forms, the
native-hour / Sino-minute clock split) — those are sequencing judgement calls,
not language-correctness concerns.

## Parity status
- KO content modules complete after this branch: **M3-M12** (M1-M2 are the
  Hangul-script foundation; M3-M6 shipped previously; M7-M12 shipped here).
- JA reference arc runs through **M27** (M3-M27 authored on the JA side).
- **Remaining for full KO→JA parity: M13-M27 (15 modules).**

All M7-M12 work is well-documented N5→N4 Korean grammar, authored to the
established quality bar. No vocabulary was invented; every uncertain register
call is flagged above.
