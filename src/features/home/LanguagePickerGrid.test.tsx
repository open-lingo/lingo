import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

let visibleIds: readonly string[] = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
vi.mock("@/shared/hooks/useVisibleLearningLanguageIds", () => ({
  useVisibleLearningLanguageIds: () => visibleIds,
}));

import { LanguagePickerGrid } from "./LanguagePickerGrid";

describe("LanguagePickerGrid — the flag-grid switcher (Switch-language modal + landing page)", () => {
  it("pt is absent (not even a dimmed 'Soon' card) when not in the visible set — flag off, or flag on + not allow-listed", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS]; // no "pt"
    render(<LanguagePickerGrid onSelect={() => {}} />);
    expect(screen.queryByRole("button", { name: /Learn Portuguese/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Portuguese")).not.toBeInTheDocument();
  });

  it("pt is present and selectable when the visible set includes it — flag on + allow-listed", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
    render(<LanguagePickerGrid onSelect={() => {}} />);
    const ptButton = screen.getByRole("button", { name: /Learn Portuguese/i });
    expect(ptButton).toBeInTheDocument();
    expect(ptButton).not.toBeDisabled();
    // Not rendered as a dimmed "Soon" placeholder — it's a real, selectable option.
    expect(ptButton).not.toHaveTextContent("Soon");
  });

  it("other configured-but-unbuilt languages (e.g. German) still render dimmed 'Soon' — pt's absence-when-invisible is special-cased, not a general filter regression", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
    render(<LanguagePickerGrid onSelect={() => {}} />);
    const deButton = screen.getByRole("button", { name: /Learn German/i });
    expect(deButton).toBeDisabled();
    expect(deButton).toHaveTextContent("Soon");
  });

  it("existing available languages (ja/ko/es/fr) are unaffected by pt's visibility either way", () => {
    for (const ids of [
      [...AVAILABLE_LEARNING_LANGUAGE_IDS],
      [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"],
    ]) {
      visibleIds = ids;
      const { unmount } = render(<LanguagePickerGrid onSelect={() => {}} />);
      for (const name of ["Japanese", "Korean", "Spanish", "French"]) {
        const btn = screen.getByRole("button", { name: new RegExp(`Learn ${name}`, "i") });
        expect(btn).not.toBeDisabled();
      }
      unmount();
    }
  });
});
