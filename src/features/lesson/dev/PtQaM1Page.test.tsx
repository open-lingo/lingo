import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockUseAllContentReady = vi.fn();
vi.mock("@/features/lesson/data/useLessonContent", () => ({
  useAllContentReady: () => mockUseAllContentReady(),
  useContentRevision: () => 0,
}));

import PtQaM1Page from "./PtQaM1Page";

describe("PtQaM1Page — /pt/qa/m1 dev walk page", () => {
  it("shows a loading state instead of mounting the walker while content is still in flight — PTQA 2026-09-18: pt's JSON isn't prefetched like es/fr's, so mounting ProtoModuleWalker before ensureAllContentLoaded() resolves stuck the page on a permanent false 'lesson complete' (its build effect never re-runs once content lands)", () => {
    mockUseAllContentReady.mockReturnValue("loading");
    render(<PtQaM1Page />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Loading course content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Restart lesson/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lesson complete/i)).not.toBeInTheDocument();
  });

  it("mounts the real walker with all 6 m1 lessons once content is ready", () => {
    mockUseAllContentReady.mockReturnValue("ready");
    render(<PtQaM1Page />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Módulo 1/)).toBeInTheDocument();
    expect(screen.getByText("L1")).toBeInTheDocument();
    expect(screen.getByText("L6")).toBeInTheDocument();
  });
});
