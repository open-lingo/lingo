> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Task: Particle Practice Page

**File:** `src/features/practice/ParticlePracticePage.tsx`
**Route:** `/practice/particles`
**Current state:** Stub — "coming soon"

## Goal

Interactive particle practice: show sentences with blanks, user picks the correct particle.

## Requirements

- Load particles from `getParticlesForLanguage(languageId)` (ko.json, ja.json)
- Show a sentence with a blank where the particle goes
- Multiple choice: show 4 particle options, one correct
- Score tracking: correct/total, streak
- After answering: show explanation (particle meaning + usage)
- "Next" button to advance
- Summary at end of round (e.g. 10 questions)

## Data

- Particles already exist in `src/features/practice/data/ko.json` and `src/features/practice/data/ja.json`
- Need practice sentences: create `src/features/practice/data/ko-sentences.json` and `src/features/practice/data/ja-sentences.json`
- Type: `{ sentenceTemplate: "학교__ 가요", correctParticleId: "에", translation: "I go to school" }`

## UI reference

- Center card layout (like `FlashcardTester`)
- Big sentence text, blank highlighted
- Multiple choice buttons below
- Green/red feedback on answer

## i18n

- Add `practice.particles.*` keys: title, score, next, summary, correct, incorrect

## Acceptance criteria

- [ ] Particle practice works for Korean and Japanese
- [ ] Shows sentence with blank, 4 choices
- [ ] Feedback on correct/incorrect with explanation
- [ ] Score tracking
- [ ] All strings use `t()`
- [ ] `npm run build` passes
