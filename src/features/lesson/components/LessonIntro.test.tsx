/**
 * LessonIntro — renders the one-shot swirl overlay on mount, unmounts it
 * after the animation window, and renders nothing at all under reduced
 * motion (the in-app `root.dataset.reducedMotion` gate).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { LessonIntro } from "./LessonIntro";

afterEach(() => {
  cleanup();
  document.documentElement.dataset.reducedMotion = "";
});

describe("LessonIntro", () => {
  it("renders the swirl overlay on mount, then removes it after the animation", async () => {
    const { container } = render(<LessonIntro />);
    // overlay + both swirl rings present at start
    expect(container.querySelector(".lesson-intro-swirl")).not.toBeNull();
    expect(container.querySelector(".lesson-intro-veil")).not.toBeNull();

    // one-shot: the whole overlay unmounts when the ~900ms animation ends
    await waitFor(
      () => expect(container.querySelector(".lesson-intro-swirl")).toBeNull(),
      { timeout: 2000 },
    );
  });

  it("renders nothing when reduced motion is requested", () => {
    document.documentElement.dataset.reducedMotion = "true";
    const { container } = render(<LessonIntro />);
    expect(container.firstChild).toBeNull();
  });
});
