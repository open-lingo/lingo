# KO Curriculum M19–M24 — Worktree Report

Branch: `ko/content-m19-m24`. Authored Korean Modules 19–24 to the quality bar of
shipped KO M3–M18, continuing KO→JA parity. All 6 modules ship: **8 lessons each,
48 lessons total.**

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (only the pre-existing >500 kB chunk-size warning).
- `npx vitest run` — **1140 passed / 140 files**, including the 6 new guard tests
  (24 new assertions). No new failures introduced; the previously-noted
  `questionBank.test.ts` flake did not reproduce.

## Modules authored (theme = JA arc mirror; grammar = Korean's own)

Each KO module mirrors the **theme** of the same-numbered JA module, re-expressed
in Korean grammar (the established KO M13–M18 convention — KO does not copy JA's
heavy 14-sublesson narrative template; it uses the compact 8-lesson KO format:
info → phrase → sentenceMcq → cloze → listeningComp → build → translate → speaking,
closing each module with a mini-dialogue lesson + a mastery test).

| KO | Theme (from JA) | JA M# focus | KO grammar taught |
|----|------|------|------|
| M19 | Family & people | family register うち/よそ + 〜さい age + counting people | kinship terms; speaker-gender sibling split (형/오빠/누나/언니); in-group 우리 ('my'); 명 (people counter); 살 (age counter, 스물→스무) |
| M20 | Body & health | body/health + 〜がいたい + ので | body parts; 아프다 (ㅡ-irregular → 아파요) with [part]가/이 아파요; health vocab; (으)니까 reason-that-allows-a-command (KO match to ので) |
| M21 | Food & restaurants | と quotation + や list + cup counter | food + Korean dishes; 하고/(이)랑 listing-and-with; 잔 (cup counter); (이)라고 하다 (naming/quotation) |
| M22 | Comparison | のほうが/より + いちばん + なかで | 보다 (than, reversed order); 더/덜 (more/less); 제일/가장 (superlative); 중에서 (among); 어느 게 더 …? two-way question |
| M23 | Ability & suggestions | じょうず/へた + ましょう/ませんか | (으)ㄹ 수 있다/없다 (can/cannot); 잘하다/못하다 (good/bad at); (으)ㄹ까요? (shall we); (으)ㅂ시다 (let's, with a register caveat) |
| M24 | Hobbies & activities | のがすきです + たり…たり + 回 counter | hobby vocab; (으)ㄹ 줄 알다/모르다 (know how to — skill, vs M23 ability); 거나 (or, between verbs); 번 (times counter) + 일주일에 N 번 frequency |

## Wiring (same pattern as prior KO batches)

- `courseAtoms.ts` — added `m19`–`m24` to `KoAtomSource`; added `M19_VOCAB`…`M24_VOCAB`
  and spread them into `KO_COURSE_ATOMS`. Surfaces already registered in earlier
  modules are re-listed with `srsEligible: false` so the first-write-wins lookup
  keeps one canonical SRS card (아빠 M2, 오빠 M2, 우리 M1, 명 M5, 머리 M1, 코 M2,
  병원 M6, 고기 M1, 빵 M5, 하고 M9, 잔 M5).
- `mockLessons.ts` — imported `KO_M19_LESSONS`…`KO_M24_LESSONS`, built the per-module
  records, spread into `LESSONS`.
- `mockCourse.ts` — added `m19Lessons`…`m24Lessons` pathway arrays and the 6 module
  objects (titles, eyebrows, summaries, accents) to the KO course.
- 6 guard tests `m19.test.ts`…`m24.test.ts` mirroring `m18.test.ts` (8 lessons,
  ko/mXX tags, unique lesson ids, every pathway node resolves to content, unique
  step ids).

## Homograph collisions (intentional, flagged — NOT bugs)

The atom lookup is keyed by Hangul surface, first-write-wins. Three surfaces I use
with a *new* meaning already exist with an *earlier* meaning, so the new sense is
NOT re-registered (it would be ignored anyway) and `exercisedAtomSurfaces` resolves
to the earlier card. The lesson card itself renders correctly via the meaning text;
only the SRS atom-tag points at the homograph. Acceptable, but worth a native's eye:

1. **눈** — registered as 'snow' (M18). M20 teaches 눈 = 'eye'. Card renders "eye";
   SRS tag → the 'snow' atom.
2. **열** — registered as 'ten' (native number, M5). M20 teaches 열 = 'fever'. Card
   renders "fever"; SRS tag → the 'ten' atom.
3. **보다** — registered as the verb 'to see' (M7). M22 teaches 보다 = 'than'
   (particle). `exercisedAtomSurfaces: ["보다"]` → the verb atom.

If desired, a follow-up could disambiguate these with explicit `atomId` overrides
(the `phrase()` helper supports `opts.atomId`), but that needs new atom ids and is
out of scope for this content pass.

## NATIVE-REVIEW list (every flagged item)

All flags are inline `// NATIVE-REVIEW:` comments at the relevant step. These are
forms I'm confident are *correct* but want a native speaker to confirm for
naturalness / register / the right canonical target for a learner. None are guesses
about whether the Korean is valid — they're register/naturalness/edge-case checks.

**M19 (5):**
- `ko-m19-3-tr-myhome` — 우리 집은 저기예요: confirm topic 은 vs subject 이 both fine (both accepted).
- `ko-m19-6-q-broage` — 우리 오빠는 스무 살이에요 (female speaker): confirm 오빠 + 는 topic reads well.
- `ko-m19-6-tr-mymomthirty` — 마흔 (40) appears in info text only, not its own atom; accept as recognition or backfill 마흔.
- `ko-m19-7-q-howoldbro` — 형은 몇 살이에요? (male speaker): natural.
- (Implicit through info) speaker-gender sibling split — confirm the 형/오빠/누나/언니 mapping as taught.

**M20 (5):**
- `ko-m20-5-q-sicksomedicine` — 아프니까 약을 먹어요: 아프 is a vowel stem → 아프니까 (not 아프으니까); confirm reads as natural advice.
- `ko-m20-6-q-fevermedicine` — 나다 ('occur', as in 열이 나다) appears in example text only, not its own atom; 나니까 is the correct 으니까 form; confirm 열이 나니까 약을 먹어요.
- `ko-m20-7-q-wherehurts` — 어디가 아파요? (어디 as subject): natural clinic phrasing.
- `ko-m20-7-q-itsacold` — 감기예요 vs misspelling 감기에요: confirm teaching 예요.
- Homograph notes for 눈/열 (see above).

**M21 (3):**
- `ko-m21-5-q-calledkimchi` — 이거는 김치라고 해요: 김치 (vowel) → 김치라고; confirm topic 이거는 vs object 이거를.
- `ko-m21-5-q-namedminsu` — 이름이 민수라고 해요: confirm 이름이 vs 이름은; 민수라고 (vowel) natural for reporting a name.
- (이)라고 하다 generally — confirm 라고/이라고 split + 해요 as the canonical learner target (vs 그래요 etc.).

**M22 (5):**
- `ko-m22-3-q-mostexpensive` — 이게 (contraction of 이것이) as subject: confirm natural at this level vs fuller 이것이.
- `ko-m22-4-tr-amongfamily` — 크다 → 커요 covering 'tall' for people: confirm 아빠가 제일 커요 = 'tallest'.
- `ko-m22-5-q-whichmore` — 어느 게 더 비싸요? for a two-way choice (제일 implies 3+): confirm.
- `ko-m22-6-q-bestfood` — 한국 음식 ('Korean food'): confirm 음식 acceptable as recognition vocab here.
- Homograph note for 보다 (see above).

**M23 (4):**
- `ko-m23-5-q-letsgo` — 같이 갑시다: 가다 (vowel) → 갑시다 (not 가읍시다); register caveat (ㅂ시다 can sound pushy to seniors) is in the info step.
- `ko-m23-6-q-cantdrivelets` — 운전할 수 없으니까 같이 갑시다: 없다 → 없으니까; confirm 없으니까 (not 없어서) preferred when a suggestion follows.
- `ko-m23-7-q-whatdo` — 주말 ('weekend'): confirm acceptable as recognition vocab.
- (으)ㅂ시다 register — generally confirm the peer-vs-senior guidance as taught.

**M24 (5):**
- `ko-m24-2-q-dontknowdrive` — 모르다 (르-irregular) → 몰라요 (not 모르요): confirm 운전할 줄 몰라요.
- `ko-m24-3-q-readorlisten` — 듣다 (ㄷ-irregular) → 들어요; 읽거나 = 'or' vs 읽고 distractor = 'and then'. Confirm.
- `ko-m24-5-q-sometimesdraw` — 가끔 그림을 그려요: natural; 자주 distractor real word, wrong meaning.
- `ko-m24-6-q-hobbyismusic` — 음악 (consonant ㄱ) → 음악이에요; note 제 취미 is fine (hobby is not in-group kin, unlike 우리 엄마).
- (으)ㄹ 줄 알다 vs (으)ㄹ 수 있다 — confirm the skill-vs-possibility distinction as taught is the right learner framing.

## Remaining module count

JA tops out at **M27**. KO now reaches **M24**. Remaining to reach parity:
**KO M25, M26, M27** (3 modules). JA references for the spine:
- JA M25, M26, M27 source at `src/features/languages/ja/curriculum/m25.ts`…`m27.ts`.

## Scope note (honesty)

All six modules (M19–M24) were authored to the same depth and verified. I did not
have to cut scope. The forms taught are well-documented standard Korean; the
NATIVE-REVIEW flags above are naturalness/register confirmations, not uncertainty
about validity. No vocabulary was invented — every word is a real, common Korean
N4-ish item. The three homograph collisions are an artifact of the surface-keyed
atom registry and are flagged for a possible `atomId`-override follow-up.
