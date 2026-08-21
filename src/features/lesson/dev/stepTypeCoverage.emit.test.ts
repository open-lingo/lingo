/**
 * STEP-TYPE COVERAGE MAP — the reachability index for the ux-loop step pass.
 *
 * The mobile gate's route matrix visits 2 step types out of 36. This walks the
 * WHOLE lesson registry (every language) through the same content pipeline the
 * app renders, and records one reachable (lessonId, stepIndex) per step type,
 * so the step pass can deep-link `?step=N` to a real instance of each.
 *
 * Runs under vitest so the vite alias + content pipeline are identical to the
 * app (vite-node is not reliable here — same reason visualQaContracts.emit uses
 * vitest). Gated behind an env flag so the normal suite never pays for it:
 *
 *   STEP_COVERAGE_EMIT=1 npx vitest run \
 *     src/features/lesson/dev/stepTypeCoverage.emit.test.ts
 *
 * Output: artifacts/ux-loop/step-coverage.json
 *   { generatedAt, byType: { <stepType>: { lessonId, stepIndex, lang, stepId } },
 *     missing: string[], counts: { <stepType>: n } }
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildLessonContracts } from "./visualQaContracts";
import { getAvailableMockLessonIds } from "../data/mockLessons";
import type { StepType } from "../types";

const ENABLED = process.env.STEP_COVERAGE_EMIT === "1";

// The canonical 36 (types.ts). We report which of these never appear so a gap
// is loud, not silent.
const ALL_STEP_TYPES: StepType[] = [
  "info", "multiple_choice", "build_sentence", "match_pairs", "fill_blank",
  "translate", "listening_comprehension", "listening_build", "speaking",
  "symbol_intro", "symbol_trace", "symbol_recognition", "symbol_production",
  "symbol_to_sound", "word_image_mcq", "phrase_card", "pretest_mcq",
  "tap_the_word", "word_map", "grammar_rule", "particle_cloze",
  "agreement_cloze", "aspect_choice_cloze", "gender_sort", "stress_pattern",
  "silent_letter", "agreement_chain", "liaison_listen", "conjugation_cloze",
  "conjugation_transform", "kanji_reading", "kanji_reveal",
  "self_explanation_mcq", "dialogue_listen", "dialogue_sim", "row_test",
];

const langOf = (lessonId: string) => lessonId.split("-")[0];

describe.runIf(ENABLED)("step-type coverage — emit", () => {
  it("indexes one reachable route per step type across every course", () => {
    const ids = getAvailableMockLessonIds();
    const byType: Record<string, { lessonId: string; stepIndex: number; lang: string; stepId: string }> = {};
    const counts: Record<string, number> = {};
    const skipped: { lessonId: string; err: string }[] = [];

    // Deterministic order so the chosen representative is stable run-to-run.
    for (const lessonId of [...ids].sort()) {
      let set;
      try {
        set = buildLessonContracts(lessonId);
      } catch (e) {
        skipped.push({ lessonId, err: String(e).slice(0, 100) });
        continue;
      }
      for (const step of set.steps) {
        const st = step.stepType;
        if (!st) continue;
        counts[st] = (counts[st] ?? 0) + 1;
        if (!byType[st]) {
          byType[st] = {
            lessonId,
            stepIndex: step.stepIndex,
            lang: langOf(lessonId),
            stepId: step.stepId,
          };
        }
      }
    }

    const missing = ALL_STEP_TYPES.filter((t) => !byType[t]);
    const out = {
      generatedAt: new Date().toISOString(),
      lessonsScanned: ids.length,
      lessonsSkipped: skipped,
      byType,
      counts,
      missing,
    };

    const dir = path.resolve(__dirname, "../../../../artifacts/ux-loop");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "step-coverage.json"), JSON.stringify(out, null, 2));

    // eslint-disable-next-line no-console
    console.log(
      `[step-coverage] ${Object.keys(byType).length}/${ALL_STEP_TYPES.length} types reachable; ` +
        `missing: ${missing.join(", ") || "none"}; skipped ${skipped.length} lessons`,
    );
    expect(Object.keys(byType).length).toBeGreaterThan(0);
  });
});

// Always-on guard so this file can't rot silently even when not emitting.
describe("step-type coverage — sanity", () => {
  it("the canonical list has 36 entries and no dupes", () => {
    expect(ALL_STEP_TYPES.length).toBe(36);
    expect(new Set(ALL_STEP_TYPES).size).toBe(36);
  });
});
