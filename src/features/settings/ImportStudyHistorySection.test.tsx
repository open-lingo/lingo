import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// i18n: return the defaultValue string so copy renders without an i18n instance.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: unknown) =>
      typeof defaultValue === "string" ? defaultValue : key,
  }),
}));

// Keep unlock side effects out of the smoke test.
vi.mock("@/features/lesson/data/unlockLessonAtoms", () => ({
  unlockAtomIds: vi.fn(() => 0),
}));

import { ImportStudyHistorySection } from "./ImportStudyHistorySection";

const exportJson = JSON.stringify({
  version: 1,
  language: "ja",
  source: "anki",
  exportedAt: "2026-07-07T18:00:00Z",
  items: [
    { expression: "水", reading: "みず", evidence: { class: "active", intervalDays: 60, reps: 4, lapses: 0 } },
    { expression: "ぜったいにないことば", evidence: { class: "active", intervalDays: 5, reps: 1, lapses: 0 } },
  ],
});

beforeEach(() => {
  localStorage.clear();
});

describe("ImportStudyHistorySection", () => {
  it("renders the file picker in the idle state", () => {
    render(<ImportStudyHistorySection />);
    expect(screen.getByText("Import from Anki")).toBeInTheDocument();
    expect(screen.getByText("Choose export file (.json)")).toBeInTheDocument();
  });

  it("parses a chosen file and renders the preview counts", async () => {
    const { container } = render(<ImportStudyHistorySection />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([exportJson], "known.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    // Preview stage renders its labelled stat tiles + the apply toggle/button.
    expect(await screen.findByText("Match words")).toBeInTheDocument();
    expect(screen.getByText("Already tracked")).toBeInTheDocument();
    expect(screen.getByText("Unlock matched words")).toBeInTheDocument();
    // 2 items in, 1 matches an atom, 1 is beyond the course.
    expect(screen.getByText("2")).toBeInTheDocument(); // total items
    expect(screen.getByText("0")).toBeInTheDocument(); // already tracked
  });

  it("surfaces a parse error for malformed input", async () => {
    const { container } = render(<ImportStudyHistorySection />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["{ not json"], "bad.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
