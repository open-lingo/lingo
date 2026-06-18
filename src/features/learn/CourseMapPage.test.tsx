import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      fb?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const s = typeof fb === "string" ? fb : (fb as { defaultValue?: string })?.defaultValue ?? _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        String((vars as Record<string, unknown>)[k] ?? ""),
      );
    },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
  useLang: () => "ja",
}));

// No lessons completed → module 1 is current, the rest locked.
vi.mock("./hooks/useCompletedLessonIds", () => ({
  useCompletedLessonIds: () => [],
}));

import { CourseMapPage } from "./CourseMapPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ja/learn/course"]}>
      <CourseMapPage />
    </MemoryRouter>,
  );
}

describe("CourseMapPage", () => {
  it("renders a node per module with the page heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /the whole journey/ }),
    ).toBeInTheDocument();
    // Module badge labels M1, M2 appear as node discs.
    expect(screen.getAllByText("M1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("M2").length).toBeGreaterThan(0);
  });

  it("defaults the selection to the current module", () => {
    renderPage();
    // Current module (m1) title surfaced in both the top summary and the
    // detail panel headings (both are level-2).
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.length).toBeGreaterThan(0);
    expect(
      headings.some((h) => h.textContent?.includes("The first 46 sounds")),
    ).toBe(true);
  });

  it("updates the selection summary when a different module is selected", () => {
    renderPage();
    // Click the M3 node (button containing the M3 disc label).
    const m3Disc = screen.getAllByText("M3")[0];
    const button = m3Disc.closest("button")!;
    fireEvent.click(button);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(
      headings.every((h) => h.textContent?.includes("First sentences")),
    ).toBe(true);
  });

  it("toggles between detailed and simple views", () => {
    renderPage();
    // Detailed view shows module summaries inline; switching to Simple hides them.
    const simpleBtn = screen.getByRole("radio", { name: "Simple" });
    fireEvent.click(simpleBtn);
    expect(simpleBtn).toHaveAttribute("aria-checked", "true");
  });

  it("renders authored fluency milestones along the trail", () => {
    renderPage();
    // JA milestone anchored at module index 1.
    expect(screen.getByText("Read all of Hiragana")).toBeInTheDocument();
  });

  it("shows a Go to module CTA in the detail panel", () => {
    renderPage();
    expect(screen.getByText("Go to module")).toBeInTheDocument();
  });

  it("offers a back-to-Learn link", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /back to learn/i });
    expect(back).toHaveAttribute("href", "/ja/learn");
  });

  it("simple view collapses node detail (distinct from detailed)", () => {
    renderPage();
    // Detailed view renders the module title in the top summary, the side
    // detail panel, AND the node card → 3 occurrences.
    const detailedCount = screen.getAllByText("The first 46 sounds").length;
    fireEvent.click(screen.getByRole("radio", { name: "Simple" }));
    // Simple view is a minimap: node titles collapse to disc-only, so the
    // node-card occurrence drops away — strictly fewer than detailed.
    const simpleCount = screen.getAllByText("The first 46 sounds").length;
    expect(simpleCount).toBeLessThan(detailedCount);
    expect(
      screen.getByText("Dot marks a milestone module"),
    ).toBeInTheDocument();
  });
});
