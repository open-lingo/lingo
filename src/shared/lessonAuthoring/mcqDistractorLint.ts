/**
 * Language-agnostic MCQ distractor-quality lint — the portable core of the
 * JA "Gate 5" (`languages/ja/__tests__/moduleContentLints.ts`, retrospective
 * 2026-07-17 §4). Extracted 2026-08-19 for the ES/FR gate ports so each
 * language stops re-implementing the identical mechanics; what differs per
 * language is injected through `DistractorLintParams`:
 *
 *   - `wordToken`: what counts as a target-language token (echo-back check).
 *   - `realFormLexicon` + `isMeaningCuedFormPicker`: the invented-form check
 *     on single-answer form pickers, where "real form" is a per-language
 *     lexicon (atoms + conjugation output).
 *
 * Checks carried from the JA original, defect provenance preserved:
 *   (a) options are non-empty and unique — kills duplicate distractors and
 *       distractor === correct;
 *   (b) `correctOptionId` resolves to an option;
 *   (c) no identical trailing "(tag)" across ALL options — a tag on every
 *       option discriminates nothing (the m29 "(plain)" defect, fix 81ce834);
 *   (d) echo-back: no distractor equals a full target-language token quoted
 *       in the prompt (the m29 のみます defect, fix 25b1f46);
 *   (e) single-answer build/listening pickers: tiles unique, correct tile
 *       present — and for meaning-cued form pickers every tile must be a
 *       REAL form from the lexicon (fix 5910e13).
 *
 * NOT ported here (JA-specific, stays in the JA file): the invented-form
 * blocklist derived from masu-stem mutations, and the derivation-drill
 * exemption heuristics — both are shapes of Japanese morphology. A language
 * needing an equivalent derives its own blocklist and filters before calling.
 *
 * The JA file still runs its own copy — migrating it onto this core is
 * deferred until the in-flight m33 authoring session lands (edit-collision
 * avoidance, noted in docs/handoff-course-reauthoring-2026-08-19.md).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";

export type DistractorLintFailure = {
  lessonId: string;
  stepId: string;
  problem: string;
};

export type ChoiceSet = {
  stepId: string;
  prompt: string;
  options: string[];
  correct: string | undefined;
};

/** Normalize a step's answer options into { prompt, options, correct }.
 *  Operates on the SHARED step types, so it is language-agnostic. */
export function choiceSets(step: LessonStep): ChoiceSet[] {
  const s = step as never as Record<string, unknown>;
  switch (step.type) {
    case "multiple_choice":
    case "self_explanation_mcq": {
      const options = (s.options as Array<{ id: string; text: string }>) ?? [];
      return [{
        stepId: step.id,
        prompt: String(s.prompt ?? s.question ?? ""),
        options: options.map((o) => o.text),
        correct: options.find((o) => o.id === s.correctOptionId)?.text,
      }];
    }
    case "listening_comprehension": {
      const options = (s.options as Array<{ id: string; text: string }>) ?? [];
      return [{
        stepId: step.id,
        prompt: String(s.question ?? ""),
        options: options.map((o) => o.text),
        correct: options.find((o) => o.id === s.correctOptionId)?.text,
      }];
    }
    case "word_image_mcq": {
      const options = (s.options as Array<{ id: string; word: string }>) ?? [];
      return [{
        stepId: step.id,
        prompt: String(s.meaningEn ?? ""),
        options: options.map((o) => o.word),
        correct: options.find((o) => o.id === s.correctOptionId)?.word,
      }];
    }
    case "particle_cloze": {
      const prompt = s.prompt as { before: string; after: string };
      return [{
        stepId: step.id,
        prompt: `${prompt.before} ___ ${prompt.after}`,
        options: (s.options as string[]) ?? [],
        correct: s.correctParticle as string,
      }];
    }
    case "dialogue_listen": {
      const questions =
        (s.questions as Array<{
          id: string;
          prompt: string;
          options: Array<{ id: string; text: string }>;
          correctOptionId: string;
        }>) ?? [];
      return questions.map((q) => ({
        stepId: `${step.id}#${q.id}`,
        prompt: q.prompt,
        options: q.options.map((o) => o.text),
        correct: q.options.find((o) => o.id === q.correctOptionId)?.text,
      }));
    }
    default:
      return [];
  }
}

export type DistractorLintParams = {
  /** Global regex matching one target-language token, for the echo-back
   *  check (JA: kana/kanji runs; ES/FR: accented Latin words). */
  wordToken: RegExp;
  /** Minimum token length for echo-back to fire (JA used 2 to skip bare
   *  particles; Latin languages want 3+ to skip articles/copulas). */
  echoMinLength?: number;
  /** Every real surface the course knows (atoms + conjugation output).
   *  Enables check (e) on meaning-cued form pickers. */
  realFormLexicon?: ReadonlySet<string>;
  /** Is this single-answer picker meaning-cued (no target-language quote in
   *  the prompt, so wrong-derivation non-words are NOT its pedagogy)? */
  isMeaningCuedFormPicker?: (prompt: string) => boolean;
  /** Per-language exemption from the echo-back check — the analogue of the
   *  JA derivation-drill exemption. E.g. ES conjugation drills ("Pick the yo
   *  preterite of hablar.") deliberately offer the quoted lemma unchanged as
   *  the didn't-conjugate error mode. Return true to allow the echo. */
  allowEchoDistractor?: (ctx: {
    prompt: string;
    distractor: string;
    correct: string | undefined;
  }) => boolean;
};

/** Run the distractor lint over one lesson. Returns failures; empty = clean. */
export function lintMcqDistractorsCore(
  lesson: LessonContent,
  params: DistractorLintParams,
): DistractorLintFailure[] {
  const failures: DistractorLintFailure[] = [];
  const fail = (stepId: string, problem: string) =>
    failures.push({ lessonId: lesson.id, stepId, problem });
  const echoMin = params.echoMinLength ?? 2;

  for (const step of lesson.steps) {
    for (const cs of choiceSets(step)) {
      if (cs.options.some((o) => !o || !o.trim())) fail(cs.stepId, "empty option text");
      if (new Set(cs.options.map((o) => o.trim())).size !== cs.options.length) {
        fail(cs.stepId, `duplicate options: [${cs.options.join(" | ")}]`);
      }
      if (cs.correct === undefined) {
        fail(cs.stepId, "correctOptionId resolves to no option");
      }
      if (cs.options.length >= 2) {
        const tags = cs.options.map((o) => /\(([^)]*)\)\s*$/.exec(o.trim())?.[1]);
        if (tags.every((t) => t !== undefined) && new Set(tags).size === 1) {
          fail(
            cs.stepId,
            `every option carries the same trailing "(${tags[0]})" — tag discriminates nothing`,
          );
        }
      }
      const promptTokens = new Set(
        (cs.prompt.match(new RegExp(params.wordToken.source, "g")) ?? []).map((t) =>
          t.toLowerCase(),
        ),
      );
      for (const o of cs.options) {
        if (o === cs.correct) continue;
        const w = o.trim().replace(/[。！？.!?]$/, "").toLowerCase();
        if (w.length >= echoMin && promptTokens.has(w)) {
          if (
            params.allowEchoDistractor?.({
              prompt: cs.prompt,
              distractor: o,
              correct: cs.correct,
            })
          ) {
            continue;
          }
          fail(cs.stepId, `distractor "${o}" echoes a word quoted in the prompt`);
        }
      }
    }

    const s = step as never as Record<string, unknown>;
    if (
      (step.type === "build_sentence" || step.type === "listening_build") &&
      Array.isArray(s.correctOrder) &&
      (s.correctOrder as string[]).length === 1
    ) {
      const tiles = (s.tiles as string[]) ?? [];
      if (new Set(tiles).size !== tiles.length) {
        fail(step.id, `duplicate picker tiles: [${tiles.join(" | ")}]`);
      }
      if (!tiles.includes((s.correctOrder as string[])[0])) {
        fail(step.id, "correct tile missing from picker tiles");
      }
      const prompt = typeof s.prompt === "string" ? s.prompt : "";
      if (
        params.realFormLexicon &&
        params.isMeaningCuedFormPicker &&
        params.isMeaningCuedFormPicker(prompt)
      ) {
        const invented = tiles.filter(
          (t) => !params.realFormLexicon!.has(t.replace(/[。.!?]$/, "").toLowerCase()),
        );
        if (invented.length > 0) {
          fail(
            step.id,
            `meaning-cued form picker offers invented forms [${invented.join(", ")}] — ` +
              "distractors must be real forms from the course lexicon (JA QA fix 5910e13 class)",
          );
        }
      }
    }
  }
  return failures;
}
