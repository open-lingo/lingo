> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Phase 1.5 — Sentence Practice Step (sprinkle X です sentences)

Status: spec ready to implement. Fires after Phase 1 lands.

User directive: "for the lessons, as we get further in, we need small
sentence practice sprinkled in a bit more (aoi learned, same lesson
later, 'It's blue.' and they get aoi, desu, akai, other things for the
multi select)."

---

## TL;DR

Add a `sentencePractice?: SentencePractice[]` field to `RowDef`. The
existing `BuildSentenceStep` type (already supports `prompt` + tiles +
`targetSentence` + `granularity: "word"`) is reused — no new step type
needed. `lessonBuilder` emits one extra `build_sentence` step per entry,
inserted mid-lesson (after the anchor teach steps, before the final
match+build).

Only fires from **na-row onward** (earliest the learner has the kana
needed for です). Cold-start ka-row/sa-row/ta-row skip this entirely.

---

## Data shape

```ts
export type SentencePractice = {
  /** English prompt shown to the learner. */
  prompt: string;
  /** Target JA sentence with spaces between tile boundaries. */
  target: string;
  /** Correct tile order (matches target tokenization). */
  correctOrder: string[];
  /** Decoy tiles mixed into the bank (same word-class as target tiles). */
  decoys: string[];
};

export type RowDef = {
  // ...existing fields
  sentencePractice?: SentencePractice[];
};
```

Tokenization: granularity is "word" (one tile per word/particle), not
"character". The existing `BuildSentenceStepView` already renders
word-granularity tiles correctly.

---

## Content per row (cumulative-kana validated)

### na-row (first row with です available)

```ts
sentencePractice: [
  {
    prompt: "It's a cat.",
    target: "ねこ です",
    correctOrder: ["ねこ", "です"],
    decoys: ["いぬ", "なつ"],
  },
]
```

### ha-row

```ts
sentencePractice: [
  {
    prompt: "It's a flower.",
    target: "はな です",
    correctOrder: ["はな", "です"],
    decoys: ["ほし", "ひと"],
  },
]
```

### ma-row

```ts
sentencePractice: [
  {
    prompt: "It's an ear.",
    target: "みみ です",
    correctOrder: ["みみ", "です"],
    decoys: ["もも", "あめ"],
  },
]
```

### ya-row

```ts
sentencePractice: [
  {
    prompt: "It's a mountain.",
    target: "やま です",
    correctOrder: ["やま", "です"],
    decoys: ["ゆき", "ゆめ"],
  },
]
```

### ra-row

```ts
sentencePractice: [
  {
    prompt: "It's a bird.",
    target: "とり です",
    correctOrder: ["とり", "です"],
    decoys: ["さくら", "はる"],
  },
]
```

### wa-row (introduces particle を and ん)

```ts
sentencePractice: [
  {
    prompt: "I'm Japanese.",
    target: "わたし は にほんじん です",
    correctOrder: ["わたし", "は", "にほんじん", "です"],
    decoys: ["ほん", "を"],
  },
]
```

Note: introducing the particle は (pronounced "wa" when grammatical) is
a teachable moment — the learner just met わ for "wa" and は for "ha";
showing は = topic-particle = "wa" earns a small pedagogy note in the
lesson info wrap-up.

### ga-row (greeting drill — pays off the genki anchor)

```ts
sentencePractice: [
  {
    prompt: "I'm well. (How are you? answer)",
    target: "げんき です",
    correctOrder: ["げんき", "です"],
    decoys: ["いちご", "ごはん"],
  },
]
```

### za-row

```ts
sentencePractice: [
  {
    prompt: "It's water.",
    target: "みず です",
    correctOrder: ["みず", "です"],
    decoys: ["かぜ", "ぞう"],
  },
]
```

### da-ba-row (particle を payoff)

```ts
sentencePractice: [
  {
    prompt: "I eat bread.",
    target: "ぱん を たべる",
    correctOrder: ["ぱん", "を", "たべる"],
    decoys: ["みず", "ともだち"],
  },
]
```

(NOTE: ぱん uses ぱ from pa-row. da-ba lands BEFORE pa-row in m2
ordering — so use a da-ba-only sentence instead:)

**Corrected da-ba sentence:**

```ts
sentencePractice: [
  {
    prompt: "It's a friend.",
    target: "ともだち です",
    correctOrder: ["ともだち", "です"],
    decoys: ["でんわ", "ぶた"],
  },
]
```

### pa-row

```ts
sentencePractice: [
  {
    prompt: "I eat bread.",
    target: "ぱん を たべる",
    correctOrder: ["ぱん", "を", "たべる"],
    decoys: ["みず", "ともだち"],
  },
]
```

### Yōon rows (yo-sh-ch and yo-g-j)

```ts
// yo-sh-ch
sentencePractice: [
  {
    prompt: "It's tea.",
    target: "おちゃ です",
    correctOrder: ["おちゃ", "です"],
    decoys: ["しゃしん", "しゅみ"],
  },
]

// yo-g-j
sentencePractice: [
  {
    prompt: "It's ten.",
    target: "じゅう です",
    correctOrder: ["じゅう", "です"],
    decoys: ["じょうず", "ぎゅうにゅう"],
  },
]
```

---

## lessonBuilder integration

Insert the sentence-practice steps **after the anchor teach steps** but
**before the wrap-up match + build**. Order:

1. intro info
2. per-kana cycle (intro → teach pair)
3. **sentence practice (NEW, optional)** ← one build_sentence per entry
4. match pairs (lesson capstone)
5. final build_sentence (single-word production drill)
6. wrap-up info

For each `SentencePractice` entry, emit:

```ts
{
  type: "build_sentence",
  prompt: entry.prompt,
  targetSentence: entry.target,
  tiles: shuffle([...entry.correctOrder, ...entry.decoys]),
  correctOrder: entry.correctOrder,
  granularity: "word",
  // audioKey resolved via getTtsUrl(entry.target) if manifest has it
}
```

---

## TTS regen for sentence-practice phrases

Sentences are full phrases — must be in the TTS manifest. Add to the
phrase-deck emit so `gen_phrases.py` picks them up.

Phrases to generate (deduped):
- ねこ です
- はな です
- みみ です
- やま です
- とり です
- わたし は にほんじん です
- げんき です
- みず です
- ともだち です
- ぱん を たべる
- おちゃ です
- じゅう です

---

## Open design questions (defer to user)

1. **Sentence repetition cadence**: should a sentence reappear in the
   NEXT lesson too, per the Phase 2b carry-over pool? (Recommendation:
   yes, once Phase 2b lands.)
2. **Sentence audio playback**: auto-play on step mount, or wait for
   user tap? (Recommendation: tap-to-play for sentences — autoplay is
   nice for single kana, intrusive for full phrases.)
3. **Particle は pronounced "wa" callout**: add a one-line info note in
   the wa-row wrap-up clarifying は as a particle ≠ は as the syllable.
   (Recommendation: yes — small note in the existing wrap-up info step,
   no new step needed.)

---

## Verification

After implementation:
- `npm run build` clean
- `npm run test:run` all pass
- Manifest contains the 12 new sentence audio entries
- Manual smoke test: load na-row lesson, complete to step where
  sentence-practice fires, confirm tile bank shows all 5 tiles
  (target+decoy) in shuffled order
