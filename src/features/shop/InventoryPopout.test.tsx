/**
 * TestFlight #161: "Inventory page overflow above status bar" — the popout
 * is a hand-rolled duplicate of `shared/components/ui/Sheet`'s `side="right"`
 * shape (kept separate because it deliberately skips Sheet's dim backdrop),
 * and it shipped without Sheet's top safe-area handling. Under
 * `viewport-fit=cover` on iOS the panel is `h-full` inside a `fixed inset-0`
 * layer, so with no top padding the header renders flush against the top
 * edge and the title sits behind the status bar/notch.
 *
 * This pins the fix at the render level: the dialog panel must carry the
 * `pt-safe` utility (`padding-top: max(env(safe-area-inset-top), 0px)`,
 * `tailwind.config.js`) so real devices push the header below the safe area
 * while browser tabs / desktop (inset 0) are visually unchanged.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { InventoryPopout } from "./InventoryPopout";

function renderPopout() {
  return render(
    <I18nextProvider i18n={i18n}>
      <InventoryPopout open onClose={() => {}}>
        <p>Body</p>
      </InventoryPopout>
    </I18nextProvider>,
  );
}

describe("InventoryPopout", () => {
  it("renders the panel with top safe-area padding (TestFlight #161)", () => {
    renderPopout();
    const panel = screen.getByRole("dialog");
    expect(panel.className).toContain("pt-safe");
  });

  it("renders title and body when open", () => {
    renderPopout();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <InventoryPopout open={false} onClose={() => {}}>
          <p>Body</p>
        </InventoryPopout>
      </I18nextProvider>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });
});
