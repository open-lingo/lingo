# KO Curriculum M4–M6 — Worktree Report

Branch: `ko/content-m4-m6`. Advances Korean→Japanese content parity by
authoring the next three N5-spine modules after the just-shipped KO Module 3.

## Modules authored

All three modules ship **8 lessons each**, matching KO M3's shape (M3 = 8
lessons: 7 content + mastery test). Each module's final lesson is a Mastery
Test; each ends the content arc with a mini-dialogue before the test.

| Module | Theme | Lessons | File |
|--------|-------|---------|------|
| M4 | Things & possession | 8 | `src/features/languages/ko/curriculum/m4.ts` |
| M5 | Numbers, counting & ordering | 8 | `src/features/languages/ko/curriculum/m5.ts` |
| M6 | Places & existence | 8 | `src/features/languages/ko/curriculum/m6.ts` |

### M4 — Things & possession (mirrors JA M4: の + これ/それ/あれ)
1. `ko-m4-1` Everyday objects — 책 / 펜 / 가방 / 의자 / 문
2. `ko-m4-2` 의 — the possessive particle (+ 제 = 저의)
3. `ko-m4-3` 이거 / 그거 / 저거 — three-way this/that deixis
4. `ko-m4-4` 이게 뭐예요? — asking what something is (이거+가 → 이게)
5. `ko-m4-5` 누구 거예요? — whose is it? + 제 거예요
6. `ko-m4-6` Sentence build — possession + demonstratives
7. `ko-m4-7` Mini-dialogue — at a shop, pointing things out
8. `ko-m4-8` M4 Mastery Test

### M5 — Numbers, counting & ordering (mirrors JA M5: native numbers + counters + ください)
1. `ko-m5-1` Native numbers 1–5 — 하나 둘 셋 넷 다섯
2. `ko-m5-2` Native numbers 6–10 — 여섯 일곱 여덟 아홉 열
3. `ko-m5-3` 주세요 — "please give (me)"
4. `ko-m5-4` Counters — 개 (things) / 명 (people) / 잔 (cups)
5. `ko-m5-5` 이거 한 개 주세요 — ordering + the pre-counter contractions
6. `ko-m5-6` 얼마예요? — asking the price (money reuses Sino numbers)
7. `ko-m5-7` Mini-dialogue — ordering at a cafe
8. `ko-m5-8` M5 Mastery Test

### M6 — Places & existence (mirrors JA M6: に/で/が + あります/います)
1. `ko-m6-1` Places — 집 / 학교 / 가게 / 식당 / 역
2. `ko-m6-2` 있어요 / 없어요 — there is / there isn't
3. `ko-m6-3` 에 — location of existence
4. `ko-m6-4` 에 vs 에서 — being (에 + 있어요) vs doing (에서 + verb)
5. `ko-m6-5` 이/가 + 있어요 — subject marking with existence
6. `ko-m6-6` 어디에 있어요? — asking where something is
7. `ko-m6-7` Mini-dialogue — finding your way around
8. `ko-m6-8` M6 Mastery Test

## N5 spine followed

The JA placement bank (`src/features/placement/questionBank.ts`) is JA-only;
it does **not** yet contain KO M4–M6 items. So the spine target is the JA
M4–M6 grammar arc declared there (M4 = の + これ/それ/あれ; M5 = native
numbers + ください + counters; M6 = に/で/が + existence あります/います),
re-expressed in Korean's own grammar:

- **M4**: possessive 의 (with the spoken contraction 제) + the three-way
  demonstrative 이거/그거/저거 (Korean has a 3-way deixis vs JA's effectively
  3-way これ/それ/あれ; mapped directly).
- **M5**: the NATIVE-Korean number set (distinct from M3's Sino set), the
  three highest-frequency counters 개/명/잔, the 1–4 pre-counter
  contractions (하나→한, 둘→두, 셋→세, 넷→네), and 주세요 for ordering.
- **M6**: existence verbs 있어요/없어요 (Korean uses ONE verb for living and
  non-living — simpler than JA's あります/います split, so that contrast was
  re-pointed at the 에 vs 에서 location-particle distinction instead), plus
  subject marking 이/가 and the question word 어디.

This is well-documented beginner / N5-equivalent (TOPIK I) Korean grammar.

## Supporting code changes

- **Atoms** (`src/features/languages/ko/courseAtoms.ts`): added `M4_VOCAB`,
  `M5_VOCAB`, `M6_VOCAB`; added the possessive particle 의 to
  `PARTICLE_ATOMS`; added `"m4" | "m5" | "m6"` to `KoAtomSource`; wired all
  three into `KO_COURSE_ATOMS`. Duplicate surfaces across modules (e.g.
  여기/거기 reused, the 이/저 demonstrative determiners colliding with the
  M1 number 이 and M3 pronoun 저) are deduped first-write-wins by the existing
  `KO_ATOMS_BY_SURFACE` map; the later copies are marked `srsEligible: false`.
- **Lesson registry** (`src/features/lesson/data/mockLessons.ts`): imported
  and spread `KO_M4/5/6_LESSONS` into the master `LESSONS` map.
- **Course pathway** (`src/shared/domain/mockCourse.ts`): added the m4/m5/m6
  lesson-node arrays and three module entries to the KO course (previously
  KO ended at M3).
- **Guard tests**: `m4.test.ts`, `m5.test.ts`, `m6.test.ts` — each asserts
  8 lessons, ko/mN tagging, unique lesson + step ids, and (the headline
  guard, mirroring `m3.test.ts`) that **every M4/M5/M6 pathway node resolves
  to real lesson content with at least one step**.

All emoji used in image MCQs were verified against the bundled Noto subset
(`src/pub/noto-emoji/svg`) at authoring time — no broken-image surfaces.

## Verification

- `npx tsc --noEmit` — clean (exit 0).
- `npm run build` — clean (exit 0).
- `npx vitest run` — **1068 tests passed / 122 files**, including the 19 new
  KO M4–M6 curriculum tests. (No new failures introduced. The happy-dom
  `AbortError` lines in stderr are teardown noise, not test failures.)

I could not take a live screenshot: the running dev server on :5173 serves
the main `lingo` repo, not this worktree, and the worktree has no `.auth`
state. Content is verified through the shared `StepRenderer` path that the
full vitest suite exercises, plus the per-node resolution guards.

## NATIVE-REVIEW flags (full list)

These are the spots where register / naturalness is genuinely uncertain and
a Korean speaker should confirm before shipping to learners. Each is also
flagged inline in the source.

1. **M4 demonstrative + noun particle-dropping (module-wide).** Four steps
   use a BARE demonstrative directly before a noun:
   - `ko-m4-3-build-thisbook` — 이거 책이에요
   - `ko-m4-6-build-mybook` — 이거 제 책이에요
   - `ko-m4-6-q-friendbag` — 저거 친구 가방이에요 (correct answer)
   - `ko-m4-7-build-thatbag` — 그거 가방이에요

   This is natural in casual spoken Korean, but a textbook may prefer the
   particle form (이건/이게 책이에요, etc.). Flagged in the `m4.ts` module
   header (NATIVE-REVIEW, module-wide) and inline at `ko-m4-3-build-thisbook`.
   If the particle form is preferred, those four steps + their tiles need
   updating.

Beyond that one register decision, the following are standard CONTENT-TODO
review asks (correctness believed solid, but worth a native pass), not
naturalness red-flags:

- **M3-inherited** (pre-existing, not introduced here): `m3.ts` header asks
  for a register-consistency review (해요 vs 합니다 mixing). M4–M6 stay
  consistently in the 해요-polite register (이에요/예요, 주세요, 있어요),
  which is the right level for these lessons.
- **M4**: 제 vs 저의 teaching order; shop mini-dialogue naturalness
  (`m4.ts` header CONTENT-TODO).
- **M5**: whether 개/명/잔 are the ideal first three counters for an
  N5-equivalent learner; cafe-ordering dialogue naturalness
  (`m5.ts` header CONTENT-TODO).
- **M6**: the 에 vs 에서 introduction order (a classic beginner confusion);
  wayfinding mini-dialogue naturalness (`m6.ts` header CONTENT-TODO).

I did NOT invent vocabulary or pad with filler. All vocab is high-frequency
N5-equivalent Korean; all grammar points are well-documented. M4, M5, and M6
were all authored to the M3 quality bar — none were dropped for lack of
confidence.

## Remaining for full JA parity

JA ships M1–M28 (`getMockCourse("ja")`): M1–M27 content modules + an M28 N5
Mastery capstone (28 modules total). KO now ships **M1–M6** (M1–M2 script,
M3 first phrases, M4–M6 from this work).

**Remaining KO modules for full JA N5 parity: M7 through M28 — 22 modules.**

Next up (following the JA arc) would be **M7** (ます-form / present-tense
verbs + the object particle 을/를; KO: 합니다/해요 verb conjugation + 을/를),
then continuing the N5 grammar progression through the M28 capstone.
