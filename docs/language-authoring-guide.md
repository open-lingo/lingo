# Language Authoring Guide — Practice Features

> **Status note (2026-07-20):** Sections that frame Spanish as hypothetical future
> work ("When adding Spanish…") and the coverage table's "Korean conjugation — Not
> started" are STALE. Spanish shipped an A1 course (see `es-course-spine-2026-07-13.md`
> / `es-rewrite-brief-2026-07-16.md`) and Korean conjugation phase 1 shipped
> (`ko-conjugation-phase1-2026-07-15.md`). Read the per-feature checklists as
> language-agnostic guidance, not as a current status report.

How to bring a new language to full practice coverage. This covers the data files, infrastructure, and curriculum prerequisites needed for each practice feature.

## Architecture Overview

Practice features are split into **language-agnostic UI** (page components, stats, unlock gating) and **language-specific data** (content files, TTS, speech recognition). Adding a new language means creating data files and registering the language in the config — no UI changes needed.

```
src/features/practice/
├── data/
│   ├── practiceDataLoader.ts      # Routes language ID → data files
│   ├── ja-conjugation-tables.ts   # Japanese verb/adj forms
│   ├── ja-n5-kanji.ts             # Japanese kanji entries
│   ├── ja-reading-passages.ts     # Japanese reading passages
│   ├── ja-speaking-prompts.ts     # Japanese speaking prompts
│   ├── ja-counters.ts             # Japanese counter words
│   ├── ko-reading-passages.ts     # Korean reading passages
│   ├── ko-speaking-prompts.ts     # Korean speaking prompts
│   └── ko-counters.ts             # Korean counter classifiers
├── practiceUnlockConfig.ts        # Per-language feature unlock thresholds
├── practiceStats.ts               # Language-agnostic stats + SRS reader
├── useCourseLevel.ts              # Language-agnostic module level hook
├── ConjugationPracticePage.tsx     # Japanese-only (currently)
├── KanjiPracticePage.tsx           # Japanese-only
├── ReadingPracticePage.tsx         # Language-aware
├── SpeakingPracticePage.tsx        # Language-aware
└── CounterPracticePage.tsx         # Language-aware
```

---

## Per-Feature Authoring Checklist

### 1. Reading Practice

**Applicability:** All languages
**Data type:** `ReadingPassage` (defined in `ja-reading-passages.ts`)
**Curriculum prerequisite:** Enough vocab + grammar to write 3-8 sentence passages

To add for a new language:

- [ ] Create `{lang}-reading-passages.ts` exporting `ReadingPassage[]`
- [ ] Each passage needs: `id`, `level` (module number), `passage` (target language text), `questions` (2-3 MCQ with English prompts)
- [ ] Add import to `practiceDataLoader.ts` → `getReadingPassages()`
- [ ] Set unlock threshold in `practiceUnlockConfig.ts`

**What to keep in mind:**
- Passage text should only use vocab/grammar from the declared `level` and below
- Questions should test comprehension (who/what/where/when), not translation
- The furigana toggle only shows for Japanese — no action needed for other languages

---

### 2. Speaking Practice

**Applicability:** All languages (requires TTS pipeline)
**Data type:** `SpeakingPrompt` (defined in `ja-speaking-prompts.ts`)
**Curriculum prerequisite:** Any phrase the learner should be able to say

To add for a new language:

- [ ] Create `{lang}-speaking-prompts.ts` exporting `SpeakingPrompt[]`
- [ ] Each prompt needs: `id`, `targetPhrase`, `translation`, `mode` ("echo" or "response"), `minModule`
- [ ] Add import to `practiceDataLoader.ts` → `getSpeakingPrompts()`
- [ ] Add TTS lang mapping to `getTtsLang()` in `practiceDataLoader.ts`
- [ ] Add speech recognition lang to `getSpeechRecognitionLang()` in `practiceDataLoader.ts`
- [ ] Set unlock threshold in `practiceUnlockConfig.ts`

**Blockers:**
- TTS must work for the language — `playJaAudio(text, lang)` sends `lang` to the TTS backend. If the backend doesn't support the language, audio won't play (but the page still renders fine without it).
- Speech recognition uses Web Speech API — browser support varies by language. Works well for Japanese (`ja-JP`), Korean (`ko-KR`), Chinese (`zh-CN`), Spanish (`es-ES`), etc.

---

### 3. Counter Practice

**Applicability:** Languages with counter/classifier systems (Japanese, Korean, Chinese, Thai, etc.). Skip for languages without counters (English, Spanish, etc.).
**Data type:** `CounterDef` (defined in `ja-counters.ts`)
**Curriculum prerequisite:** Counter words introduced in course

To add for a new language:

- [ ] Create `{lang}-counters.ts` exporting `CounterDef[]`
- [ ] Each counter needs: `id`, `kanji` (symbol/character for display — works for any script), `meaning`, `readings` (1-10 with irregular flags), `introducedAtModule`, `examples`
- [ ] Add import to `practiceDataLoader.ts` → `getCounterDefs()`
- [ ] Set unlock threshold in `practiceUnlockConfig.ts`

**Note:** The `kanji` field name is a misnomer from the Japanese origin — it's really "display symbol" and works with any script (한, 개, etc.). A rename to `symbol` is a future cleanup.

---

### 4. Conjugation Practice

**Applicability:** Languages with verb conjugation (Japanese, Korean, Spanish, French, etc.)
**Data type:** `VerbEntry`, `AdjEntry` (defined in `ja-conjugation-tables.ts`)
**Curriculum prerequisite:** Verb conjugation taught in course

Currently Japanese-only. To add for a new language:

- [ ] Create `{lang}-conjugation-tables.ts` with language-specific types
- [ ] Define verb groups (e.g., Korean: regular/irregular; Spanish: -ar/-er/-ir)
- [ ] Define conjugation forms (e.g., Korean: 해요체, 합쇼체, 반말; Spanish: present/preterite/imperfect)
- [ ] Create `{Lang}ConjugationPracticePage.tsx` OR generalize the existing page
- [ ] Add to `practiceDataLoader.ts` → `hasConjugationData()`
- [ ] Add route and unlock config

**Why this isn't generic yet:** The form checkbox labels, category names, and distractor generation logic are tightly coupled to Japanese grammar. Korean conjugation has 7+ speech levels and different stem-change rules. A generic conjugation drill framework would need:
- Language-specific form definitions (not hardcoded "masu", "te", etc.)
- Language-specific distractor strategies
- Language-specific category labels

---

### 5. Kanji / Character Practice

**Applicability:** Languages with logographic/complex character systems (Japanese kanji, Chinese hanzi, potentially Korean hanja)
**Data type:** `KanjiEntry` (defined in `ja-n5-kanji.ts`)
**Curriculum prerequisite:** Characters formally introduced in course

Currently Japanese-only. To add for another language:

- [ ] Create `{lang}-characters.ts` with character entries
- [ ] Adapt reading types (Japanese has onyomi/kunyomi; Chinese has pinyin; Korean hanja has readings)
- [ ] Create or adapt the practice page
- [ ] Add to `practiceDataLoader.ts` → `hasKanjiData()`

**Note:** Korean's hanja (Chinese characters used in Korean) could use this system, but hanja is rarely taught to beginners and wouldn't be in early modules.

---

## Adding a New Language End-to-End

### Step 1: Register in `practiceUnlockConfig.ts`

Add a feature list for the language:

```typescript
const XX_FEATURES: PracticeFeatureConfig[] = [
  { id: "reading", unlockAtModule: N, title: "Reading", ... },
  { id: "speaking", unlockAtModule: N, title: "Speaking", ... },
  // only include features that apply to this language
];
```

Update `getPracticeFeatures()` to return the right list.

### Step 2: Create data files

At minimum: `{lang}-reading-passages.ts` and `{lang}-speaking-prompts.ts`. Add counters if the language has them.

### Step 3: Register in `practiceDataLoader.ts`

Add import and switch cases for the new language in each getter function.

### Step 4: Verify TTS + speech recognition

- Check that `playJaAudio(text, langCode)` works with the TTS backend for this language
- Check browser Web Speech API support for the language code

### Step 5: Test

- Switch to the language in the app
- Verify the Practice page shows the right skill drills (with correct lock states)
- Navigate to each practice feature and verify content loads
- Check that stats recording works (`lingo:practice-stats:v1` in localStorage)

---

## Infrastructure That's Already Language-Agnostic

| Component | Status | Notes |
|-----------|--------|-------|
| `practiceStats.ts` | Ready | Tracks any feature, any language |
| `useCourseLevel.ts` | Ready | Reads from LanguageContext |
| `practiceUnlockConfig.ts` | Ready | Per-language feature lists |
| `PracticePage.tsx` | Ready | Shows skill drills from `getPracticeFeatures(langId)` |
| MCQ UI patterns | Ready | All practice pages use the same button/card/stats components |
| Keyboard navigation | Ready | Number keys + Enter work universally |
| SRS reading (struggle weight) | Ready | `pickWeighted()` reads SRS state by atom ID |

## Current Language Coverage

| Feature | Japanese | Korean | Notes |
|---------|----------|--------|-------|
| Reading | 5 passages (M7) | 2 passages (M3) | Korean stubs — expand with curriculum |
| Speaking | 10 prompts (M3-M7) | 10 prompts (M1-M3) | Korean stubs — TTS support needed |
| Counters | 7 counters (M5-M7) | 4 classifiers (M3) | Korean stubs with 명/개/마리/잔 |
| Conjugation | 19 verbs + 15 adj (M7-M10) | Phase 1 shipped (`ko-conjugation-phase1-2026-07-15`) | — |
| Kanji | ~80 N5 kanji (M8-M15) | N/A | Not applicable to Korean |

## Future Languages

When adding Spanish, French, Mandarin, etc.:

- **Spanish/French:** Reading, Speaking, Conjugation (strong fit — regular verb tables). No counters or kanji.
- **Mandarin:** Reading, Speaking, Counters (classifiers like 个/本/只), Character practice (hanzi). Tonal speaking drills would be a new mode.
- **Thai:** Reading, Speaking, Counters (classifiers). Thai script practice could reuse the alphabet trainer.
- **Arabic:** Reading (RTL layout needed), Speaking. Verb conjugation (root + pattern system — very different from Japanese/Korean).
