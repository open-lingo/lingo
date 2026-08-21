import type { LessonStep } from "@/features/lesson/types";

export type StepKind = LessonStep["type"];

export const STEP_KINDS: { value: StepKind; label: string; group: string }[] = [
  { value: "info", label: "Info", group: "Teach" },
  { value: "phrase_card", label: "Phrase card", group: "Teach" },
  { value: "pretest_mcq", label: "Pretest MCQ (guess-first)", group: "Teach" },
  { value: "tap_the_word", label: "Tap the word", group: "Drill" },
  { value: "word_map", label: "Word map (interlinear)", group: "Drill" },
  { value: "grammar_rule", label: "Grammar rule", group: "Teach" },
  { value: "multiple_choice", label: "Multiple choice", group: "Drill" },
  { value: "build_sentence", label: "Build sentence", group: "Drill" },
  { value: "match_pairs", label: "Match pairs", group: "Drill" },
  { value: "fill_blank", label: "Fill blank", group: "Drill" },
  { value: "translate", label: "Translate", group: "Drill" },
  { value: "particle_cloze", label: "Particle cloze", group: "Drill" },
  { value: "agreement_cloze", label: "Agreement cloze", group: "Drill" },
  { value: "aspect_choice_cloze", label: "Aspect choice cloze", group: "Drill" },
  { value: "gender_sort", label: "Gender sort", group: "Drill" },
  { value: "stress_pattern", label: "Stress pattern", group: "Listening" },
  { value: "silent_letter", label: "Silent letter", group: "Listening" },
  { value: "agreement_chain", label: "Agreement chain", group: "Drill" },
  { value: "liaison_listen", label: "Liaison listen", group: "Listening" },
  { value: "conjugation_cloze", label: "Conjugation cloze", group: "Drill" },
  { value: "conjugation_transform", label: "Conjugation transform", group: "Drill" },
  { value: "kanji_reading", label: "Kanji reading", group: "Drill" },
  { value: "self_explanation_mcq", label: "Self-explanation MCQ", group: "Drill" },
  { value: "word_image_mcq", label: "Word ↔ image MCQ", group: "Drill" },
  { value: "dialogue_listen", label: "Dialogue (listen)", group: "Listening" },
  { value: "dialogue_sim", label: "Dialogue (simulation)", group: "Listening" },
  { value: "listening_comprehension", label: "Listening comp.", group: "Listening" },
  { value: "listening_build", label: "Listening build", group: "Listening" },
  { value: "speaking", label: "Speaking", group: "Listening" },
  { value: "symbol_intro", label: "Symbol — intro", group: "Symbols" },
  { value: "symbol_trace", label: "Symbol — trace", group: "Symbols" },
  { value: "symbol_recognition", label: "Symbol — recognition", group: "Symbols" },
  { value: "symbol_production", label: "Symbol — production", group: "Symbols" },
  { value: "symbol_to_sound", label: "Symbol → sound", group: "Symbols" },
  { value: "row_test", label: "Row test", group: "Test" },
];

/** Skeleton for newly-inserted steps, by kind. Keeps shapes valid. */
export function newStepShell(kind: StepKind, id: string): LessonStep {
  const base = { id, hint: undefined } as const;
  switch (kind) {
    case "info":
      return { ...base, type: "info", body: "" };
    case "phrase_card":
      return { ...base, type: "phrase_card", kana: "", romaji: "", meaningEn: "" };
    case "pretest_mcq":
      return {
        ...base,
        type: "pretest_mcq",
        situationEn: "",
        options: [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
        correctOptionId: "a",
        reveal: { surface: "", meaningEn: "" },
      };
    case "tap_the_word":
      return {
        ...base,
        type: "tap_the_word",
        prompt: "",
        tokens: [],
        correctIndices: [],
      };
    case "word_map":
      return {
        ...base,
        type: "word_map",
        tokens: [],
        pairs: [],
      };
    case "grammar_rule":
      return { ...base, type: "grammar_rule", title: "", rule: "", examples: [] };
    case "multiple_choice":
      return {
        ...base,
        type: "multiple_choice",
        prompt: "",
        options: [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
        correctOptionId: "a",
      };
    case "build_sentence":
      return {
        ...base,
        type: "build_sentence",
        prompt: "",
        targetSentence: "",
        tiles: [],
        correctOrder: [],
        granularity: "word",
      };
    case "match_pairs":
      return { ...base, type: "match_pairs", prompt: "", pairs: [] };
    case "fill_blank":
      return { ...base, type: "fill_blank", sentence: "", blanks: [] };
    case "translate":
      return {
        ...base,
        type: "translate",
        sourceText: "",
        sourceLanguage: "target",
        acceptedAnswers: [""],
      };
    case "particle_cloze":
      return {
        ...base,
        type: "particle_cloze",
        prompt: { before: "", after: "" },
        correctParticle: "",
        options: [],
        meaningEn: "",
      };
    case "agreement_cloze":
      return {
        ...base,
        type: "agreement_cloze",
        segments: [],
        meaningEn: "",
      };
    case "aspect_choice_cloze":
      return {
        ...base,
        type: "aspect_choice_cloze",
        prompt: "",
        meaningEn: "",
        segments: [],
      };
    case "gender_sort":
      return {
        ...base,
        type: "gender_sort",
        buckets: [
          { id: "m", label: "el" },
          { id: "f", label: "la" },
        ],
        items: [],
      };
    case "stress_pattern":
      return {
        ...base,
        type: "stress_pattern",
        syllables: [],
        stressedIndex: 0,
        writtenForm: "",
        meaningEn: "",
        audioText: "",
      };
    case "silent_letter":
      return {
        ...base,
        type: "silent_letter",
        graphemes: [],
        silentIndices: [],
        meaningEn: "",
        audioText: "",
      };
    case "agreement_chain":
      return {
        ...base,
        type: "agreement_chain",
        head: { surface: "", meaningEn: "", featureLabel: "" },
        tokens: [],
        meaningEn: "",
      };
    case "liaison_listen":
      return {
        ...base,
        type: "liaison_listen",
        prompt: "",
        audioText: "",
        meaningEn: "",
        words: [],
        linkedJunctions: [],
      };
    case "conjugation_cloze":
      // Empty shell for shape only. Real steps must come from the
      // `conjugationCloze` factory (grammarHelpers) — answer + distractors
      // are engine-derived, never hand-authored.
      return {
        ...base,
        type: "conjugation_cloze",
        prompt: { before: "", after: "" },
        verb: "",
        form: "te",
        formLabel: "て form",
        options: [],
        correctOptionId: "",
        meaningEn: "",
      };
    case "conjugation_transform":
      // Empty shell for shape only. Real steps come from the
      // `conjugationTransform` factory — answer + distractors are
      // engine-derived; stage is resolved from the mastery cell at render.
      return {
        ...base,
        type: "conjugation_transform",
        base: "",
        baseGloss: "",
        targetGloss: "",
        form: "nai",
        formLabel: "ない form",
        verbClass: "godan",
        answer: "",
        distractors: [],
      };
    case "kanji_reading":
      // Empty shell: `promptAnnotation` still gets the furigana-OFF shape
      // (surface === reading) so an author who fills `kanji` by hand can
      // never accidentally float the answer. Prefer the `kanjiReading`
      // factory, which derives all of this from the atom.
      return {
        ...base,
        type: "kanji_reading",
        kanji: "",
        reading: "",
        promptAnnotation: [{ surface: "", reading: "" }],
        options: [],
        correctOptionId: "",
      };
    case "kanji_reveal":
      // Emitted by buildSrsReviewLesson only — which word is ready to be
      // introduced is a per-learner FSRS question, so it is not authorable. The
      // shell exists so the editor's exhaustive switch compiles, and it is
      // deliberately inert: no atomId means no latch on completion.
      return {
        ...base,
        type: "kanji_reveal",
        atomId: "",
        kana: "",
        kanji: "",
        gloss: "",
      };
    case "self_explanation_mcq":
      return {
        ...base,
        type: "self_explanation_mcq",
        anchor: { label: "" },
        question: "",
        options: [],
        correctOptionId: "",
      };
    case "word_image_mcq":
      return {
        ...base,
        type: "word_image_mcq",
        meaningEn: "",
        options: [],
        correctOptionId: "",
      };
    case "dialogue_listen":
      return { ...base, type: "dialogue_listen", lines: [], questions: [] };
    case "dialogue_sim":
      // PROTOTYPE (2026-07-29). Authorable in principle — a scenario is
      // hand-written content, unlike kanji_reveal — but the shell is empty
      // because every field is scenario-specific. Copy the konbini demo in
      // `lesson/dev/dialogueSim/konbiniScenario.ts` as the starting point.
      return {
        ...base,
        type: "dialogue_sim",
        scene: { emoji: "🏪", title: "" },
        turns: [],
      };
    case "listening_comprehension":
      return {
        ...base,
        type: "listening_comprehension",
        audioKey: "",
        question: "",
        options: [],
        correctOptionId: "",
      };
    case "listening_build":
      return {
        ...base,
        type: "listening_build",
        audioKey: "",
        prompt: "",
        targetSentence: "",
        tiles: [],
        correctOrder: [],
        granularity: "word",
      };
    case "speaking":
      return {
        ...base,
        type: "speaking",
        targetPhrase: "",
        translation: "",
        stubbed: true,
      };
    case "symbol_intro":
      return {
        ...base,
        type: "symbol_intro",
        payload: { symbol: "", romanization: "", ipa: "", hint: "" },
      };
    case "symbol_trace":
      return {
        ...base,
        type: "symbol_trace",
        payload: { symbol: "", romanization: "", ipa: "", hint: "" },
        showGuide: true,
        minCorrectAttempts: 1,
      };
    case "symbol_recognition":
      return {
        ...base,
        type: "symbol_recognition",
        payload: { symbol: "", romanization: "", ipa: "", hint: "" },
        options: [],
        correctOptionId: "",
      };
    case "symbol_production":
      return {
        ...base,
        type: "symbol_production",
        payload: { symbol: "", romanization: "", ipa: "", hint: "" },
        minCorrectAttempts: 1,
      };
    case "symbol_to_sound":
      return {
        ...base,
        type: "symbol_to_sound",
        payload: { symbol: "", romanization: "", ipa: "", hint: "" },
        options: [],
        correctOptionId: "",
      };
    case "row_test":
      return {
        ...base,
        type: "row_test",
        rowId: "",
        items: [],
        passThreshold: 0.7,
        maxRetries: 3,
      };
  }
}

function truncate(text: string, n = 56): string {
  if (!text) return "";
  return text.length <= n ? text : text.slice(0, n - 1) + "…";
}

export function summariseStep(step: LessonStep): string {
  switch (step.type) {
    case "info":
      return truncate(step.body);
    case "multiple_choice":
      return truncate(step.prompt);
    case "build_sentence":
      return truncate(step.targetSentence);
    case "fill_blank":
      return truncate(step.sentence);
    case "translate":
      return truncate(step.sourceText);
    case "phrase_card":
      return `${step.kana} — ${truncate(step.meaningEn)}`;
    case "grammar_rule":
      return truncate(step.title);
    case "particle_cloze":
      return truncate(`${step.prompt.before} __ ${step.prompt.after}`);
    case "agreement_cloze":
      return truncate(
        step.segments
          .map((s) => ("text" in s ? s.text : "__"))
          .join(""),
      );
    case "conjugation_cloze":
      return truncate(
        `${step.prompt.before}__${step.prompt.after} (${step.verb} → ${step.formLabel})`,
      );
    case "conjugation_transform":
      return truncate(`${step.base} → ${step.answer} (${step.formLabel})`);
    case "kanji_reading":
      return `${step.kanji} → ${step.reading}`;
    case "kanji_reveal":
      return `${step.kana} → ${step.kanji}`;
    case "match_pairs":
      return `${step.pairs.length} pair${step.pairs.length === 1 ? "" : "s"}`;
    case "dialogue_listen":
      return `${step.lines.length} line${step.lines.length === 1 ? "" : "s"}`;
    case "dialogue_sim":
      return `${step.scene.emoji} ${step.scene.title} · ${step.turns.length} turn${step.turns.length === 1 ? "" : "s"}`;
    case "symbol_intro":
    case "symbol_trace":
    case "symbol_recognition":
    case "symbol_production":
    case "symbol_to_sound":
      return step.payload.symbol;
    case "word_image_mcq":
      return truncate(step.meaningEn);
    case "listening_comprehension":
      return truncate(step.question);
    case "listening_build":
      return truncate(step.prompt);
    case "speaking":
      return truncate(step.targetPhrase);
    case "self_explanation_mcq":
      return truncate(step.question);
    case "gender_sort":
      return `${step.items.length} word${step.items.length === 1 ? "" : "s"} → ${step.buckets.map((b) => b.label).join(" / ")}`;
    case "stress_pattern":
      return `${step.syllables.join("·")} → ${step.writtenForm}`;
    case "silent_letter":
      return `${step.graphemes.join("")} · ${step.silentIndices.length} silent`;
    case "agreement_chain": {
      const n = step.tokens.filter((t) => t.kind === "slot").length;
      return `${step.head.surface} → ${n} slot${n === 1 ? "" : "s"}`;
    }
    case "row_test":
      return `row ${step.rowId} · ${step.items.length} item${step.items.length === 1 ? "" : "s"}`;
    default:
      return "";
  }
}
