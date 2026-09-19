import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/features/lesson/data/useLessonContent", () => ({
  useAllContentReady: () => "ready",
  useContentRevision: () => 0,
}));

import PtQaM1Page from "./PtQaM1Page";

describe("PtQaM1Page — /pt/qa/m1 dev walk page", () => {
  it("renders '0 lessons' without throwing while curriculum/m1.ts's PT_M1_LESSONS is still empty", () => {
    render(<PtQaM1Page />);
    expect(screen.getByTestId("pt-qa-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("pt-qa-empty-state")).toHaveTextContent("0 lessons");
    // Does NOT mount the real step-renderer walker while there is nothing
    // to walk — no lesson-picker chrome, no StepRenderer.
    expect(screen.queryByText(/Restart lesson/i)).not.toBeInTheDocument();
  });

  it("shows the module heading so the route is identifiable as PT, not a stale generic scaffold page", () => {
    render(<PtQaM1Page />);
    expect(screen.getByText(/Módulo 1/)).toBeInTheDocument();
  });
});
