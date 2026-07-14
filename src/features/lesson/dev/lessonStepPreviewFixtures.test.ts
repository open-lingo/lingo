import { describe, expect, it } from "vitest";
import { fixtures } from "./LessonStepPreviewPage";
import { ALL_STEP_TYPES } from "./qaCatalog";

/**
 * The QA test-drive page emits a `/lesson-preview#step-<type>` link for
 * EVERY step type, and the previewer's hash-scroll silently no-ops on a
 * missing anchor — so a fixture gap turns into a dead link a tester can't
 * distinguish from "page broken". Found live 2026-07-12:
 * self_explanation_mcq and dialogue_listen had no fixtures.
 */
describe("lesson step previewer fixtures", () => {
  it("covers every step type exactly once", () => {
    const types = fixtures().map((f) => f.type);
    expect(new Set(types).size).toBe(types.length);
    expect([...types].sort()).toEqual([...ALL_STEP_TYPES].sort());
  });
});
