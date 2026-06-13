# Lesson Re-Author: Sentence Variety & Cloze Reduction

**Status:** Scoped, not started
**Priority:** High — directly impacts learner engagement
**Estimated scope:** ~25 modules (M3-M27), ~150-200 steps to rewrite

## Problem

1. **Same sentence recycled through multiple step formats.** A sentence like `すしを たべます` appears 7x in M7 — as cloze, build, speaking, listening, MCQ. Feels like busywork, not learning.
2. **Too much review-particle cloze.** Modules like M8 (70%), M19 (100%), M21 (76%) spend most of their cloze steps drilling particles from earlier modules (は, の, が) in isolated fill-in-the-blank. Should shift to sentence building.
3. **Intro→Practice overlap.** Practice sub-lessons reuse up to 66% of sentences from the intro (M12-1). Practice should use NEW sentences exercising the same grammar.

## Current state (measured)

### Sentence reuse within modules
| Module | Reuse % | Worst sentence | Times |
|--------|---------|---------------|-------|
| M3 | 45% | なまえは なんですか | 13x |
| M5 | 47% | コーヒー ふたつ ください | 9x |
| M7 | 44% | すしを たべます | 7x |
| M6 | 41% | トイレが ありますか | 7x |
| M17 | 43% | ごじまでに かえります | 10x |

### Review cloze ratio (flagged modules ≥40%)
| Module | Review cloze % | Worst particle |
|--------|---------------|----------------|
| M4 | 52% | 14x は |
| M5 | 47% | 7x は |
| M7 | 48% | 8x に |
| M8 | 70% | 14x は |
| M12 | 100% | 8x に |
| M17 | 61% | 6x で, 6x の |
| M19 | 100% | 18x は |
| M20 | 59% | 9x が |
| M21 | 76% | 12x を |

## Target metrics

- **Max sentence reuse:** No sentence appears >3x in a module (once in intro, once in practice, once in review tail — max)
- **Review cloze ratio:** ≤25% of cloze steps per module should drill OLD particles
- **Intro→Practice sentence overlap:** ≤15% — practice sub-lesson should exercise the same grammar with mostly NEW sentences
- **Cloze as % of all steps:** ≤10% per module (currently 6-17%)

## Approach

### For each module:

1. **Identify over-repeated sentences** (>3 uses)
2. **For each repeated sentence, keep 1-2 uses** in the most appropriate step type (usually the first intro + one retrieval)
3. **Replace removed uses with NEW sentences** that:
   - Exercise the same grammar point
   - Use vocabulary from the current module AND earlier modules
   - Are contextually varied (different subjects, objects, locations)
4. **Convert excess review-particle cloze to build/speaking/translation** steps:
   - The particle is still exercised (learner must place は correctly in the build)
   - But the format is richer (full sentence construction, not isolated blank)
5. **Ensure practice sub-lessons use fresh sentences** — same grammar, different content

### Sentence construction principles:

- **Pull cross-module vocab.** By M7: 163 words. By M19: 300+. Use them.
  - Example M7: instead of `すしを たべます` 7x, also use `ほんを よみます`, `みずを のみます`, `てがみを かきます`
- **Combine particles from multiple modules** in later lessons:
  - `がっこうで ほんを よみます` (M6 location + M7 object + M7 verb)
  - `ともだちと こうえんに いきます` (M4 と + M6 location + M7 verb)
- **One sentence → one comprehension check → move on.** Don't drill the same sentence 4 ways.

## Priority order

Worst offenders first:

1. **M8** (70% review cloze, 14x は) — highest review ratio
2. **M19** (100% review cloze, 18x は, sentence reuse 30%)
3. **M21** (76% review cloze, 12x を)
4. **M4** (52% review cloze, 46 total cloze — most cloze of any module)
5. **M17** (61% review cloze, 43% sentence reuse)
6. **M7** (48% review cloze, 44% sentence reuse)
7. **M3** (45% sentence reuse, 13x なまえは なんですか)
8. **M12** (100% review cloze but only 11 total — small)
9. **M20** (59% review cloze)
10. **M5** (47% sentence reuse, 47% review cloze)
11. Remaining modules (M6, M9-M11, M13-M16, M18, M22-M27) — spot-check and fix as needed

## Validation

After rewriting each module:
- Run `npm run test` — existing acceptance tests check step counts, type variety, etc.
- Spencer spot-checks the first module (suggest M8 as pilot) before bulk pass
- Verify no regression in TTS coverage (`scripts/emit-tts-deck.mjs`)

## M8 pilot — remaining issues (post-cloze-thinning)

1. **Noun concentration** — カメラ 18x, テスト 10x, コーヒー 8x as subjects. Only 19% of sentences use cross-module vocab. Diversify with M1-M7 nouns (犬, 猫, 公園, 学校, 図書館, 電車, 花, 山, etc.).
2. **M8-5-1 triple repeat** — `この テストは むずかしいです` appears 3x in a 9-sentence sub-lesson (build→listeningBuild→speaking). Swap one instance to a different noun.
3. **Structural monotony** — Nearly every sentence is `[この/その/あの] [noun]は [adj]です`. Mix in sentences that combine adjectives with M6-M7 grammar: `おおきい こうえんに いきます`, `あつい コーヒーを のみます`, `ちいさい いぬが います`.

## Available vocab pool (cumulative)

| After module | Total vocab | Key additions |
|-------------|-------------|---------------|
| M1 | 31 | Nature nouns (山, 海, 花, 犬, 猫) |
| M2 | 62 | Dakuten nouns (象, 豚, 鍵, 散歩, 家族) |
| M3 | 75 | People (先生, 学生, 友達) + katakana nouns |
| M4 | 100 | Objects (車, 傘, 辞書) + family (父, 母, 兄, 姉) |
| M5 | 123 | Numbers, counters, money |
| M6 | 144 | Locations (学校, 公園, 図書館, 駅, 病院) |
| M7 | 163 | Verbs (食べる, 飲む, 行く, 読む, 見る, 書く) |
| M8+ | 200+ | Adjectives, time, te-form, etc. |
