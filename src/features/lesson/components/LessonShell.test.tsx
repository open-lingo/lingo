/**
 * The shell's SHRINK CHAIN, as a contract.
 *
 * A flex item's default `min-height: auto` is its content height, so a single
 * missing `min-h-0` anywhere between the fixed-height shell and a step view
 * silently disables shrinking for everything below it. The scroller carried
 * `min-h-0` from the start; the stage column inside it did not, and that one
 * omission is why `dialogue_listen` could not give space back on a short
 * window — its answer options ended 48px below the fold and its Check button
 * 152px below (measured 900×700, 2026-08-06).
 *
 * The failure mode is what makes this worth a test: nothing throws, nothing
 * looks wrong in the component, and the defect only appears on a viewport
 * short enough to matter. Assert both links of the chain.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LessonShell } from "./LessonShell";

afterEach(() => {
  cleanup();
});

function stage(): HTMLElement {
  const el = document.querySelector("[data-lesson-stage]");
  if (!el) throw new Error("stage not found");
  return el as HTMLElement;
}

describe("LessonShell shrink chain", () => {
  it("gives the stage scroller and the stage column both min-h-0", () => {
    render(
      <LessonShell stageLabel="Exercise">
        <p>step</p>
      </LessonShell>,
    );
    const column = stage();
    const scroller = column.parentElement!;

    // The scroller: only scroll area, and the size query container step views
    // measure `cqh`/`cqw` against.
    expect(scroller.className).toContain("min-h-0");
    expect(scroller.className).toContain("overflow-y-auto");
    expect(scroller.className).toContain("[container-type:size]");

    // The column: the link that was missing. Without it the scroller's height
    // never reaches the step view, and a step that opts into shrinking can't.
    expect(column.className).toContain("min-h-0");
    expect(column.className).toContain("flex-1");
  });

  it("keeps one shared measure across header, stage and footer", () => {
    render(
      <LessonShell header={<p>hdr</p>} footer={<p>ftr</p>} stageLabel="Exercise">
        <p>step</p>
      </LessonShell>,
    );
    // Forking the measure is the defect this shell exists to prevent — the
    // test-out runner's hand-rolled copy rendered option tiles 717px wide.
    expect(stage().className).toContain("max-w-2xl");
    expect(screen.getByText("hdr").parentElement!.className).toContain("max-w-2xl");
  });
});
