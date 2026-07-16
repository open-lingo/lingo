import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlacementResultScreen } from "./PlacementResultScreen";

// t() returns the inline defaultValue with {{var}} interpolation (mirrors the
// LearnCourseMap.test harness) so we assert the code's real copy, not keys.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      fb?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const s =
        typeof fb === "string" ? fb : (fb as { defaultValue?: string })?.defaultValue ?? _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_m, k) =>
        String((vars as Record<string, unknown>)[k] ?? ""),
      );
    },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/domain/mockCourse", () => ({
  getMockCourse: () => ({ modules: [] }),
}));

vi.mock("@/shared/components/Icon", () => ({
  Icon: ({ name }: { name: string }) => <i data-icon={name} />,
}));

const base = {
  skippedLessonCount: 0,
  seededAtomCount: 0,
  isTestOut: true,
  onContinue: () => {},
};

describe("PlacementResultScreen — test-out ✓/✗ strip", () => {
  it("fail: shows only pips + score, no answers, no auto-complete chips", () => {
    render(
      <PlacementResultScreen
        {...base}
        passedModules={[]}
        itemResults={[false, false, false]}
      />,
    );
    expect(screen.getByText("Not quite yet")).toBeTruthy();
    // Three ✗ pips, zero ✓ pips.
    expect(screen.getAllByLabelText("Incorrect")).toHaveLength(3);
    expect(screen.queryAllByLabelText("Correct")).toHaveLength(0);
    expect(screen.getByText("You got 0 of 3 correct.")).toBeTruthy();
    // No auto-complete chips on a fail.
    expect(screen.queryByText(/Also marked complete/i)).toBeNull();
  });

  it("pass: shows cleared state, mixed pips, and 'no XP' auto-complete chips", () => {
    render(
      <PlacementResultScreen
        {...base}
        passedModules={["m5"]}
        assumedModules={["m3", "m4"]}
        seededAtomCount={20}
        testOutModuleLabel="Numbers"
        itemResults={[true, true, true, true, true, true, true, true, true, true, false, false]}
      />,
    );
    expect(screen.getByText("Module cleared!")).toBeTruthy();
    expect(screen.getAllByLabelText("Correct")).toHaveLength(10);
    expect(screen.getAllByLabelText("Incorrect")).toHaveLength(2);
    expect(screen.getByText("You got 10 of 12 correct.")).toBeTruthy();
    // The modules before the tested one are surfaced as auto-completed (no XP).
    expect(screen.getByText(/Also marked complete \(no XP\)/i)).toBeTruthy();
    expect(screen.getByText("M3")).toBeTruthy();
    expect(screen.getByText("M4")).toBeTruthy();
  });

  it("does not render the strip when there are no item results", () => {
    render(
      <PlacementResultScreen {...base} passedModules={["m5"]} itemResults={[]} />,
    );
    expect(screen.queryByText(/of \d+ correct/i)).toBeNull();
  });
});
