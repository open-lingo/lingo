# KO M25-M27 — final module parity report

Branch: `ko/content-m25-m27`. Authored the final three Korean curriculum
modules, completing **KO module parity with JA (M1-M27)**.

## Modules authored (8 lessons each, 7 content + 1 mastery test)

### M25 — Plans & intentions (JA M25: つもり / にいく / ことがある / とき)
Re-expressed in Korean's own grammar:
- ko-m25-1 Travel vocab I — 여행 / 계획 / 출발 / 도착 / 외국
- ko-m25-2 Event vocab II — 온천 / 축제 / 결혼 / 졸업
- ko-m25-3 **(으)려고 하다** — intend to / plan to  (↔ つもりです)
- ko-m25-4 **(으)러 가다** — go (in order) to do  (↔ にいく)
- ko-m25-5 **(으)ㄴ 적이 있다 / 없다** — have / have never (experience)  (↔ ことがあります)
- ko-m25-6 **(으)ㄹ 때 / 았을 때** — when (doing / when did), with the
  present↔past tense contrast  (↔ とき)
- ko-m25-7 Mini-dialogue — planning a trip
- ko-m25-8 M25 Mastery Test

### M26 — Explaining & excess (JA M26: んです / すぎる / connective set)
- ko-m26-1 Trouble verbs — 피곤하다 / 늦다 / 잊어버리다 / 실수
- ko-m26-2 Connectives — 그래서 / 하지만 / 그리고 / 그런데
- ko-m26-3 **거든요** — explaining a reason / new info  (↔ explanatory んです)
- ko-m26-4 **너무** — too / excessively (excess reading)  (↔ すぎる)
- ko-m26-5 **아/어서** — so / because (cause→result in one sentence)
- ko-m26-6 Putting it together — explaining why
- ko-m26-7 Mini-dialogue — why are you late?
- ko-m26-8 M26 Mastery Test

### M27 — Modal grammar (JA M27: なければならない / ほうがいい / く・になる)
- ko-m27-1 Goal vocab — 결정하다 / 약속 / 준비 / 연습 / 시험
- ko-m27-2 Health vocab — 건강 / 조심하다 (+ reuse 병원 / 약 / 운동)
- ko-m27-3 **아/어야 되다** — must / have to  (↔ なければならない)
- ko-m27-4 **는 게 좋다** — it's better to / should  (↔ ほうがいい)
- ko-m27-5 **아/어지다** — become (gradual, on adjectives)  (↔ 〜くなる/になる adj.)
- ko-m27-6 **이/가 되다** — become (a noun)  (↔ 〜になる noun) + recap
- ko-m27-7 Mini-dialogue — giving advice
- ko-m27-8 M27 Mastery Test

## JA arc mirrored
Each KO module re-expresses the verified JA M25-M27 grammar focus
(confirmed from `src/features/languages/ja/curriculum/m25.ts`/`m26.ts`/`m27.ts`
header arcs) in Korean's own grammar rather than transliterating. Vocab
themes match (travel/events; trouble/connectives; goals/health/modality).

## Wiring (same pattern as prior KO batches)
- `courseAtoms.ts`: added m25/m26/m27 to `KoAtomSource`; new vocab atoms for
  the three modules (reusing existing 운동/병원/약/그래서/의사/선생님/좋다/날씨
  surfaces, which resolve via the first-write-wins surface map — no dupes).
- `mockLessons.ts`: imported `KO_M25/26/27_LESSONS`, built per-module Records,
  spread into the lesson registry.
- `mockCourse.ts`: added `m25/26/27Lessons` pathway arrays + three module
  entries after m24 in the KO course.
- One guard test per module (`m25/26/27.test.ts`), mirroring `m24.test.ts`:
  8 lessons, ko/m-tagged, unique lesson ids, every pathway node resolves to
  content, unique step ids per lesson.

## Verification
- `npx tsc --noEmit` — clean (exit 0).
- `npm run build` — clean.
- `npx vitest run` — 143 files / 1152 tests passing, incl. the 12 new
  M25-M27 guards. (No pre-existing failures introduced; the happy-dom
  AbortError teardown noise is unrelated and non-failing.)

## NATIVE-REVIEW flags (every uncertain register/naturalness call)
All grammar taught is well-documented intermediate Korean (TTMIK lvl 2-4
territory); 거든요's explanatory/new-info nuance was web-verified. Flags below
are naturalness/register confirmations, not suspected errors:

M25:
- m25-2 `결혼해요` — 결혼하다 → 결혼해요 as a stated plan/event; confirm reads natural.
- m25-3 `일본에 가려고 해요` — 가다 vowel stem → 가려고 (not 가으려고); confirm natural intention.
- m25-3 `내년에 여행하려고 해요` — 내년 + 여행하려고 해요 natural for a stated plan.
- m25-4 `영화를 보러 가요` — 보다 vowel stem → 보러 (not 보으러); confirm 'go to watch'.
- m25-4 `온천에 가요` — place noun + 에 (destination); confirm natural.
- m25-5 `일본에 간 적이 있어요` — past modifier 간 for experience (not 가는/갈); confirm.
- m25-6 `여행할 때 사진을 찍어요` — present/general 'when' → (으)ㄹ 때; confirm natural.
- m25-6 `어렸을 때 축제에 갔어요` — 어렸을 때 vs 어릴 때 both occur; past best
  matches English 'when I was a child'; confirm preferred form.

M26:
- m26-1 `피곤해요` / `늦었어요` — adjective/past forms; confirm read natural.
- m26-2 `약을 먹다` collocation ('take medicine'); 그리고 = neutral 'and' (그래서
  'so' also logically plausible — confirm 그리고 best fits).
- m26-3 `피곤하거든요` — 거든요 explanatory vs 지만/고; confirm.
- m26-3 `병원에 갔거든요` — past explanatory 갔 + 거든요; 그래서 can't be a stem
  suffix (distractor); confirm.
- m26-4 `너무 피곤해요` / `너무 비싸요` — 너무 placement before adjective; excess reading; confirm.
- m26-5 `늦어서` / `피곤해서` / `아파서` — no 았/었 before 서, past on final verb;
  아프다 (ㅡ) → 아파서; confirm all read natural.
- m26-7 `왜 늦었어요?` — 왜 + past for 'why were you late?'; confirm.

M27:
- m27-1 `연습해요` — 연습하다 → 연습해요; confirm.
- m27-2 `조심하세요` — standard polite 'be careful / take care'; confirm.
- m27-3 `가야 돼요` / `먹어야 돼요` / `해야 돼요` — bright/dark vowel + 하다 handling;
  되다~하다 interchangeable; confirm naturalness.
- m27-4 `운동하는 게 좋아요` / `약을 먹는 게 좋아요` — present modifier + 게 좋아요
  for advice; contrast with 어야 돼요 (must); confirm.
- m27-5 `좋아져요` / `건강해져요` — 아/어지다 bright vowel + 하다 (해져요); confirm.
- m27-5 `날씨가 추워져요` — 춥다 ㅂ-irregular → 추워져요 ('gets cold'); confirm.
- m27-6 `의사가 되고 싶어요` — 의사 vowel-ending → 가 되다 (not 의사이); confirm.
- m27-7 `쉬면 건강해져요` — 쉬다 + 면 ('if') → 쉬면; 건강해져요; confirm natural.

Reused vocab assumed already taught (verified present in courseAtoms or
earlier modules): 의사, 선생님, 좋다, 날씨, 비싸다, 아프다, 죄송하다, 길, 막히다,
배, 쉬다, 왜, 면, 내년, 지금, 밥, 학교, 집, 일본/한국. If any of 막히다/길/배가
아프다 register reads off, flag in review — they appear only in info-step
example sentences and distractors, not as new taught atoms.

## Parity status
**KO module parity is COMPLETE: M1-M27 authored, matching JA M1-M27.**
