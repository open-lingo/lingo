import { describe, it, expect } from "vitest";
import { filterCommands } from "./filter";
import type { Command } from "./types";

const cmd = (over: Partial<Command>): Command => ({
  id: "x",
  label: "X",
  group: "G",
  perform: () => {},
  ...over,
});

const COMMANDS: Command[] = [
  cmd({ id: "home", label: "Home", showWhenEmpty: true }),
  cmd({ id: "journey", label: "Journey", keywords: "progress stats", showWhenEmpty: true }),
  cmd({ id: "lesson", label: "Vowels — あ い う", hint: "Module 1" }),
  cmd({ id: "beer", label: "ビール", hint: "beer", keywords: "biiru" }),
];

describe("filterCommands", () => {
  it("returns only always-on commands when the query is empty", () => {
    const out = filterCommands(COMMANDS, "  ");
    expect(out.map((c) => c.id)).toEqual(["home", "journey"]);
  });

  it("matches on label substring", () => {
    expect(filterCommands(COMMANDS, "home").map((c) => c.id)).toEqual(["home"]);
  });

  it("matches content hidden in the empty view once typed", () => {
    expect(filterCommands(COMMANDS, "module").map((c) => c.id)).toEqual(["lesson"]);
  });

  it("matches via keywords and hint, not just the label", () => {
    expect(filterCommands(COMMANDS, "biiru").map((c) => c.id)).toEqual(["beer"]);
    expect(filterCommands(COMMANDS, "progress").map((c) => c.id)).toEqual(["journey"]);
  });

  it("ranks label-prefix above keyword-only matches", () => {
    const list = [
      cmd({ id: "kw", label: "Settings", keywords: "beer" }),
      cmd({ id: "prefix", label: "Beer hall" }),
    ];
    expect(filterCommands(list, "beer").map((c) => c.id)).toEqual(["prefix", "kw"]);
  });
});
