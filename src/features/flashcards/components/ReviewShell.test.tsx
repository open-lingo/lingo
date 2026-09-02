/**
 * The review session's box. Two shapes, one component.
 *
 * `fitted={false}` (md and up) must reproduce the DOM the reviewer has always
 * had — centred `max-w-md` column, `space-y-4`, `relative` so the `lg:` detail
 * overlay can anchor to it — because Wave B is explicitly not allowed to move
 * the desktop layout.
 *
 * `fitted` (below md) is the lesson-shaped stage: fixed height, ONE inner
 * scroller which is also the `container-type: size` query container, and
 * `data-lesson-stage` on the child so `tests/mobile/stage-fit.mobile.spec.ts`
 * starts covering `/practice/flashcards/review`. That spec measures the stage's
 * PARENT (it assumes the parent is the scroller), so the parent-child shape
 * asserted below is load-bearing for the gate, not cosmetic.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReviewShell } from "./ReviewShell";

describe("ReviewShell", () => {
  it("fitted=false keeps the historical centred column and no stage hook", () => {
    const { container } = render(
      <ReviewShell fitted={false} toolbar={<div>bar</div>}>
        <p>card</p>
      </ReviewShell>,
    );
    expect(container.querySelector("[data-lesson-stage]")).toBeNull();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("justify-center");
    expect(root.className).toContain("min-h-0");
    const column = root.firstElementChild as HTMLElement;
    expect(column.className).toContain("relative");
    expect(column.className).toContain("max-w-md");
    expect(column.className).toContain("space-y-4");
    expect(column.firstElementChild?.textContent).toBe("bar");
  });

  it("fitted is a fixed-height shell with one size-query scroller", () => {
    const { container } = render(
      <ReviewShell fitted toolbar={<div>bar</div>} stageLabel="Review card">
        <p>card</p>
      </ReviewShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain(
      "h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]",
    );
    expect(root.className).toContain("pb-safe");
    expect(root.className).toContain("pt-safe");

    const stage = container.querySelector("[data-lesson-stage]") as HTMLElement;
    expect(stage).not.toBeNull();
    expect(stage.className).toContain("min-h-0");

    const scroller = stage.parentElement as HTMLElement;
    expect(scroller.className).toContain("overflow-y-auto");
    expect(scroller.className).toContain("[container-type:size]");
    expect(scroller.className).toContain("min-h-0");
    expect(scroller.getAttribute("aria-label")).toBe("Review card");
  });

  it("shares its height budget with the lesson shell", async () => {
    const { FITTED_SHELL_HEIGHT } = await import("@/shared/layout/fittedShell");
    const { SHELL_HEIGHT } = await import(
      "@/features/lesson/components/LessonShell"
    );
    expect(SHELL_HEIGHT).toBe(FITTED_SHELL_HEIGHT);
  });
});
