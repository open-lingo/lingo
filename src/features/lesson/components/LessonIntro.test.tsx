/**
 * LessonIntro — renders the one-shot page-wipe overlay (curtain + vehicle)
 * on mount, unmounts it after the animation window, and renders nothing at
 * all under reduced motion (the in-app `root.dataset.reducedMotion` gate).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { LessonIntro } from "./LessonIntro";

afterEach(() => {
  cleanup();
  document.documentElement.dataset.reducedMotion = "";
});

describe("LessonIntro", () => {
  it("renders the curtain + train on mount, then removes them after the wipe", async () => {
    const { container } = render(<LessonIntro />);
    expect(container.querySelector(".lesson-wipe-curtain")).not.toBeNull();
    const vehicle = container.querySelector(".lesson-wipe-vehicle");
    expect(vehicle).not.toBeNull();
    // reuses the map's train mascot (an inline SVG)
    expect(vehicle?.querySelector("svg")).not.toBeNull();

    // one-shot: the whole overlay unmounts when the ~1.4s wipe ends
    await waitFor(
      () => expect(container.querySelector(".lesson-wipe-curtain")).toBeNull(),
      { timeout: 2200 },
    );
  });

  it("renders nothing when reduced motion is requested", () => {
    document.documentElement.dataset.reducedMotion = "true";
    const { container } = render(<LessonIntro />);
    expect(container.firstChild).toBeNull();
  });
});
