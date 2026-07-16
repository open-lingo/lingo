import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
  useLangPath: () => (p: string) => `/es/${p}`,
  useLang: () => "es",
}));

// Learner mid-course: M9 reached — hablar/comer/ser unlocked, poder (M13)
// and hacer (M16) ahead-of-path (advisory chips, still clickable).
vi.mock("@/features/practice/useCourseLevel", () => ({
  useCourseLevel: () => 9,
}));

import { ConjugationGridPage } from "./ConjugationGridPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/es/practice/conjugation"]}>
      <ConjugationGridPage />
    </MemoryRouter>,
  );
}

describe("ConjugationGridPage (happy path, real loader data)", () => {
  it("renders tense tabs, class-grouped verbs, and the person grid preview", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Conjugation grid", level: 1 })).toBeInTheDocument();
    // Tense tabs from the grid config.
    expect(screen.getByRole("radio", { name: "presente" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "pretérito" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "imperfecto" })).toBeInTheDocument();
    // Verb picker grouped by conjugation class, fed by the real ES entries.
    expect(screen.getByText("-ar verbs")).toBeInTheDocument();
    expect(screen.getByText("Irregular")).toBeInTheDocument();
    expect(screen.getByText("hablar")).toBeInTheDocument();
    expect(screen.getByText("ser")).toBeInTheDocument();
    // Ahead-of-path verbs wear an advisory module chip (never disabled).
    expect(screen.getByText("M13")).toBeInTheDocument(); // poder
    expect(screen.getByText("hacer").closest("button")).toBeEnabled();
    // Person labels in the preview grid come from ES_CONJUGATION_FORM_LABELS.
    expect(screen.getByText("él / ella / usted")).toBeInTheDocument();
    expect(screen.getByText(/vosotros/)).toBeInTheDocument();
  });

  it("shows the advisory note when an ahead-of-path verb is selected", () => {
    renderPage();
    fireEvent.click(screen.getByText("poder").closest("button")!);
    expect(
      screen.getByText("Recommended from Module 13 — open anyway."),
    ).toBeInTheDocument();
    // Still startable — advisory, not a hard block.
    expect(screen.getByRole("button", { name: /Drill poder · presente/ })).toBeEnabled();
  });

  it("runs a full 6-cell drill round to the summary and retries", () => {
    renderPage();
    fireEvent.click(screen.getByText("hablar").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Drill hablar · presente/ }));

    // Drill view: round title + the question card.
    expect(screen.getByRole("heading", { name: "hablar · presente" })).toBeInTheDocument();

    // Answer all 6 cells via the keyboard path (1 = first option, Enter = next).
    for (let i = 0; i < 6; i++) {
      fireEvent.keyDown(document, { key: "1" });
      fireEvent.keyDown(document, { key: "Enter" });
    }

    expect(screen.getByText("Round complete")).toBeInTheDocument();
    expect(screen.getByText(/\/ 6 correct/)).toBeInTheDocument();

    // Retry rebuilds a fresh round of the same verb × tense.
    fireEvent.click(screen.getByRole("button", { name: "Drill again" }));
    expect(screen.getByRole("heading", { name: "hablar · presente" })).toBeInTheDocument();
    expect(screen.queryByText("Round complete")).not.toBeInTheDocument();
  });

  it("runs a mix round across unlocked verbs of the chosen tense", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "imperfecto" }));
    fireEvent.click(screen.getByRole("button", { name: /Mix round — random cells · imperfecto/ }));
    expect(screen.getByRole("heading", { name: "Mix · imperfecto" })).toBeInTheDocument();

    for (let i = 0; i < 6; i++) {
      fireEvent.keyDown(document, { key: "1" });
      fireEvent.keyDown(document, { key: "Enter" });
    }
    expect(screen.getByText("Round complete")).toBeInTheDocument();
  });
});
