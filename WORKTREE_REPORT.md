# KO M13–M18 — worktree report

Branch: `ko/content-m13-m18`

## Scope delivered

All six requested modules authored to the M3–M12 quality bar (8 lessons each,
~6–8 steps per lesson, info → phrase/vocab → MCQ/cloze/build → listening →
speaking, plus a mini-dialogue lesson and a mastery test per module). Each
module mirrors the corresponding JA M13–M18 grammar arc, re-expressed in
Korean's own grammar (NOT transliterated Japanese).

| KO module | Title | JA arc mirrored | Korean grammar taught |
|-----------|-------|-----------------|------------------------|
| **M13** | Months & frequency | JA M13 (months + frequency + から time/because) | Months (Sino + 월, incl. 유월/시월 irregulars), frequency spectrum 항상→자주→가끔→별로 안→전혀 안, ranges 부터/까지, sentence-linking 그래서 |
| **M14** | Connecting & requesting | JA M14 (te-form formation + てください + big numbers) | The two clause connectives 고 (and-then) and 아/어서 (sequence + because), 아/어 주세요 requests, big Sino numbers 백/천/만 + 원 prices |
| **M15** | Now, allowed, but | JA M15 (ている + てもいい + たい + けど) | Progressive 고 있어요, permission 아/어도 돼요 (ask + grant + refuse 안 돼요), contrast 지만 (고 싶어요 already shipped in M11) |
| **M16** | Rules & preferences | JA M16 (てはいけません + ないでください + てから + すき/きらい) | Prohibition (으)면 안 돼요, negative request 지 마세요, sequence 고 나서, transitive like/dislike 좋아하다/싫어하다 (+ 을/를 vs the M8 adjective 좋다) |
| **M17** | Getting around | JA M17 (で transport + に/へ destination + までに/まえに) | Transport vocab, means particle (으)로 (incl. the ㄹ→로 exception 지하철로), 타다 (을/를) / 내리다 (에서), directions 왼쪽/오른쪽/똑바로, spatial 까지 |
| **M18** | Weather & the future | JA M18 (weather/nature + でしょう + とおもいます) | Weather/season vocab, ㅂ-irregular 덥다→더워요/춥다→추워요, future (으)ㄹ 거예요 (= will/probably), impression 것 같아요 |

## Wiring (same mechanism as M7–M12)

- **Atoms:** `src/features/languages/ko/courseAtoms.ts` — added `m13`…`m18` to
  the `KoAtomSource` union, six new `M13_VOCAB`…`M18_VOCAB` arrays, and spliced
  them into `KO_COURSE_ATOMS`. Reused (did NOT re-declare) existing surfaces:
  비 (M1), 주세요/원 (M5), 역 (M6) — comments mark each reuse so first-write-wins
  in `KO_ATOMS_BY_SURFACE` stays clean.
- **Lessons:** `src/features/lesson/data/mockLessons.ts` — six imports + six
  `Object.fromEntries` records + six spreads into `LESSONS`.
- **Pathways:** `src/shared/domain/mockCourse.ts` — six `mNNLessons` title
  arrays + six module entries appended to the KO `modules` array.
- **Guards:** one `mNN.test.ts` per module (24 tests total) mirroring
  `m12.test.ts`: 8 lessons tagged ko/mNN, unique lesson ids, every pathway node
  resolves to content with ≥1 step, unique step ids per lesson.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (only the pre-existing chunk-size warnings).
- `npx vitest run` — **134 files, 1116 tests, all passing** (incl. the 24 new
  guards). The `DOMException AbortError` lines in the output are a happy-dom
  teardown artifact, not a test failure. No new failures introduced.

## Remaining M-count

**0 remaining** of the requested M13–M18. All six authored at full quality.

## NATIVE-REVIEW flags (full list)

These are points where the grammar is well-documented and the chosen form is
believed correct, but a native reviewer should confirm naturalness / register /
the exact canonical spelling, OR where a support word was used recognition-only
without its own atom. None are believed to be errors; they are honest
uncertainty markers.

### Register / naturalness / canonical-form confirmations
- **m13.ts** `별로 안 좋아요` — confirm it reads as "(it) is not really good"
  vs "I don't like it" (별로 안 좋아해요).
- **m13.ts** `자주 회사에 가요` item — both 자주 회사에 가요 and 회사에 자주
  가요 are natural; the distractor differs only by a `?`. Confirm not confusing.
- **m14.ts** `집에 가서 자요` vs `집에 가고 자요` — both grammatical; the item
  teaches the tight 아서 reading. Confirm the 가고 distractor reads as "looser"
  rather than outright wrong.
- **m14.ts** `봐 주세요` — spaced vs joined (봐주세요) both occur; confirm spaced
  is the right canonical target.
- **m15.ts** `가도 돼요?` — distractor uses the common 되요 misspelling; confirm
  teaching 돼요 as the sole correct spelling.
- **m15.ts** `앉아도 돼요?` — confirm 앉다 → 앉아도 (ㅏ harmony), not 앉어도.
- **m16.ts** `가지 마세요` — distractor 가지 마요 is a real casual variant;
  confirm the polite 마세요 is the right level to teach.
- **m16.ts** `보는 것을 좋아해요` — full form vs contraction 보는 걸; confirm full
  form is the canonical target and the 것이 distractor is correctly wrong.
- **m18.ts** `갈 거예요` / `올 거예요` — distractor uses the common 거에요
  misspelling; confirm 거예요 (from 것이에요) as sole correct spelling.
- **m18.ts** `올 것 같아요` — full vs spoken contraction 올 거 같아요; confirm
  full form is the right canonical target.
- **m18.ts** `추운 것 같아요` / `더운 것 같아요` — confirm the ㅂ-irregular
  adjective modifiers 추운/더운 are correct (not 추울/추워운).

### Support words used recognition-only (not registered as atoms)
Each is high-frequency and standard, used in a build/translate prompt or info
card without its own SRS atom (mirrors the M12 `만나요` precedent). Confirm
acceptable, or backfill as atoms:
- **m13.ts** 시험 (test/exam), 일하다→일해요 (to work).
- **m14.ts** 사다→사요 (to buy), 바쁘다→바빠서 (busy), 많이 (a lot),
  도와줘요 (plain "I help"), 시간 (time, in 시간이 없어요).
- **m15.ts** 졸리다→졸려요 (sleepy), 여기서 (here, 여기에서 contraction),
  앉다 (to sit).
- **m16.ts** 피우다 (to smoke, in 담배를 피우다), 걱정하다 (to worry),
  손 (hand) + 씻다 (to wash), 신발/벗다/들어오다 + 깨끗하다 (info card only),
  알겠어요 (got it, info card only).
- **m17.ts** 어떻게 (how), 다음 (next, info card only).
- **m18.ts** 내일 (tomorrow — 어제/오늘 are M10 atoms, 내일 the natural sibling;
  strong backfill candidate), 어때요 (how is it), 바람이 불다 (it's windy,
  info card only), 맑을/흐릴 거예요 (future of weather adjectives, build only).

### Meaning-overlap distractor to sanity-check
- **m18.ts** q-seemsdelicious distractor `맛있을 것 같아요` ("it'll probably be
  delicious", future guess) vs the present-tense answer `맛있는 것 같아요`. Both
  grammatical; defensible as a distractor because the prompt is present-tense,
  but a reviewer may prefer a clearly-wrong distractor.

## Strongest backfill recommendation
Register **내일 (tomorrow)** as an `m18` atom — it pairs with the already-taught
어제/오늘 (M10) and appears in the future-tense lessons. Low effort, high value.
