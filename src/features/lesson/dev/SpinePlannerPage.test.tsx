/**
 * Spine planner (/ja/spine-plan) contract: tiles render in saved order,
 * verdicts/notes persist to localStorage, hover cards carry the parity
 * evidence, and a stale saved order survives draft-tile additions
 * (unknown ids dropped, new ids appended) — the page is the design doc
 * for the dict-form-first rewrite, so losing notes is losing the review.
 */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SpinePlannerPage from "./SpinePlannerPage";
import { SPINE_UNITS } from "./spinePlan";

const STORAGE_KEY = "lingo:spine-plan:v1";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("SpinePlannerPage", () => {
  it("renders every draft unit as a tile, in order", () => {
    render(<SpinePlannerPage />);
    for (const u of SPINE_UNITS) {
      expect(screen.getByTestId(`spine-tile-${u.id}`)).toBeTruthy();
    }
    const first = screen.getByTestId(`spine-tile-${SPINE_UNITS[0].id}`);
    expect(first.textContent).toContain("#1");
  });

  it("hover card carries teaches/why/parity for a unit", () => {
    render(<SpinePlannerPage />);
    const verbUnit = SPINE_UNITS.find((u) => u.id === "s05")!;
    const card = screen.getByTestId("hover-card-s05");
    expect(card.textContent).toContain(verbUnit.teaches[0]);
    expect(card.textContent).toContain("Tae Kim");
    expect(card.textContent).toContain("§3.4");
  });

  it("verdict click + note persist to localStorage", () => {
    render(<SpinePlannerPage />);
    const tile = screen.getByTestId("spine-tile-s05");
    fireEvent.click(
      Array.from(tile.querySelectorAll("button")).find(
        (b) => b.textContent === "keep",
      )!,
    );
    fireEvent.click(
      Array.from(tile.querySelectorAll("button")).find((b) =>
        b.textContent?.startsWith("note"),
      )!,
    );
    fireEvent.change(tile.querySelector("textarea")!, {
      target: { value: "verbs must stay before adjectives" },
    });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.items.s05.verdict).toBe("keep");
    expect(saved.items.s05.note).toBe("verbs must stay before adjectives");
  });

  it("hardens a stale saved order: unknown ids dropped, new tiles appended", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: "old",
        general: "keep this",
        order: ["s05", "ghost-id", "s03"],
        items: { s05: { verdict: "keep", note: "" } },
      }),
    );
    render(<SpinePlannerPage />);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.order[0]).toBe("s05");
    expect(saved.order[1]).toBe("s03");
    expect(saved.order).not.toContain("ghost-id");
    // every draft unit still present exactly once
    expect([...saved.order].sort()).toEqual(
      SPINE_UNITS.map((u) => u.id).sort(),
    );
    expect(screen.getByDisplayValue("keep this")).toBeTruthy();
  });
});
