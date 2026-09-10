import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// FR-parallel happy-path test — mirrors ConjugationGridPage.test.tsx (ES) with
// the FR loader wired in via useLang mock. Confirms getConjugationGridConfig,
// FR_VERB_ENTRIES and the lang-threaded UI components all cooperate for a
// second tabular-grid language, the way the ES suite proved out the shape.

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const s =
        opts && typeof opts.defaultValue === "string" ? opts.defaultValue : key;
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ""));
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/fr/${p}`,
  useLang: () => "fr",
}));

// Learner mid-course: M12 reached — être/avoir/aimer/parler/habiter unlocked,
// manger (M14) and visiter (M15) ahead-of-path (advisory chips, still
// clickable — mirrors the ES mock's poder/hacer).
vi.mock("@/features/practice/useCourseLevel", () => ({
  useCourseLevel: () => 12,
}));

import { ConjugationGridPage } from "./ConjugationGridPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/fr/practice/conjugation"]}>
      <ConjugationGridPage />
    </MemoryRouter>,
  );
}

describe("ConjugationGridPage — fr (happy path, real loader data)", () => {
  it("renders tense tabs, class-grouped verbs, and the person grid preview", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Conjugation grid", level: 1 })).toBeInTheDocument();
    // Tense tabs from the FR grid config — only 2, no imperfect/preterite.
    expect(screen.getByRole("radio", { name: "présent" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "passé composé" })).toBeInTheDocument();
    // Verb picker grouped by conjugation class, fed by the real FR entries.
    // FR only ever populates "-er verbs" and "Irregular" — no -ar/-ir groups.
    expect(screen.getByText("-er verbs")).toBeInTheDocument();
    expect(screen.getByText("Irregular")).toBeInTheDocument();
    expect(screen.queryByText("-ar verbs")).not.toBeInTheDocument();
    expect(screen.queryByText("-ir verbs")).not.toBeInTheDocument();
    expect(screen.getByText("parler")).toBeInTheDocument();
    expect(screen.getByText("être")).toBeInTheDocument();
    // Ahead-of-path verbs wear an advisory module chip (never disabled).
    expect(screen.getByText("M14")).toBeInTheDocument(); // manger
    expect(screen.getByText("M15")).toBeInTheDocument(); // visiter
    expect(screen.getByText("manger").closest("button")).toBeEnabled();
    // Person labels in the preview grid come from FR_CONJUGATION_FORM_LABELS —
    // only 3 persons, no regional note (unlike ES's vosotros).
    expect(screen.getByText("il / elle / on")).toBeInTheDocument();
    expect(screen.getByText("je")).toBeInTheDocument();
    expect(screen.getByText("tu")).toBeInTheDocument();
  });

  it("shows the advisory note when an ahead-of-path verb is selected", () => {
    renderPage();
    fireEvent.click(screen.getByText("manger").closest("button")!);
    expect(
      screen.getByText("Recommended from Module 14 — open anyway."),
    ).toBeInTheDocument();
    // Still startable — advisory, not a hard block.
    expect(screen.getByRole("button", { name: /Drill manger · présent/ })).toBeEnabled();
  });

  it("runs a full 3-cell drill round to the summary and retries", () => {
    renderPage();
    // Default verb at M12: parler (introducedAtModule 11, the latest unlocked).
    fireEvent.click(screen.getByText("parler").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Drill parler · présent/ }));

    // Drill view: round title + the question card.
    expect(screen.getByRole("heading", { name: "parler · présent" })).toBeInTheDocument();

    // Answer all 3 cells (je/tu/il) via the keyboard path (1 = first option, Enter = next).
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(document, { key: "1" });
      fireEvent.keyDown(document, { key: "Enter" });
    }

    expect(screen.getByText("Round complete")).toBeInTheDocument();
    expect(screen.getByText(/\/ 3 correct/)).toBeInTheDocument();

    // Retry rebuilds a fresh round of the same verb × tense.
    fireEvent.click(screen.getByRole("button", { name: "Drill again" }));
    expect(screen.getByRole("heading", { name: "parler · présent" })).toBeInTheDocument();
    expect(screen.queryByText("Round complete")).not.toBeInTheDocument();
  });

  it("runs a mix round across unlocked verbs of the chosen tense", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "passé composé" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Mix round — random cells · passé composé/ }),
    );
    expect(screen.getByRole("heading", { name: "Mix · passé composé" })).toBeInTheDocument();

    // Mix rounds are MIX_ROUND_SIZE (6) cells, clamped to what's available —
    // 5 unlocked verbs × 3 persons = 15 cells at M12, well above 6.
    for (let i = 0; i < 6; i++) {
      fireEvent.keyDown(document, { key: "1" });
      fireEvent.keyDown(document, { key: "Enter" });
    }
    expect(screen.getByText("Round complete")).toBeInTheDocument();
  });
});
