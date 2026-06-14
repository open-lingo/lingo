import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Command } from "./types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

const perform = vi.fn();
const commands: Command[] = [
  { id: "home", label: "Home", group: "Navigation", perform, showWhenEmpty: true },
  { id: "appearance", label: "Appearance", group: "Settings", keywords: "theme", perform, showWhenEmpty: true },
  { id: "beer", label: "ビール", hint: "beer", group: "Vocab", keywords: "biiru", perform },
];

vi.mock("./useCommands", () => ({ useCommands: () => commands }));

import { CommandPalette } from "./CommandPalette";

function open() {
  render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
  fireEvent.keyDown(window, { key: "k", metaKey: true });
}

describe("CommandPalette", () => {
  beforeEach(() => perform.mockReset());

  it("is hidden until ⌘K is pressed", () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows only always-on commands before typing", () => {
    open();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.queryByText("ビール")).not.toBeInTheDocument();
  });

  it("surfaces content (vocab/lessons) once a query is typed", () => {
    open();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "biiru" } });
    expect(screen.getByText("ビール")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("runs the active command on Enter", () => {
    open();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "home" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(perform).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    open();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
