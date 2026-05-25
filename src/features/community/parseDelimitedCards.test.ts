/**
 * Tests for the paste-import parser. Covers each delimiter mode plus the
 * messy edge cases real users hit: empty rows, missing columns, quoted
 * fields with embedded commas / quotes / newlines (CSV mode).
 */
import { describe, expect, it } from "vitest";
import { parseDelimitedCards } from "./parseDelimitedCards";

describe("parseDelimitedCards", () => {
  it("parses simple TSV", () => {
    const { rows, errors } = parseDelimitedCards(
      "neko\tcat\ninu\tdog\n",
      "tsv",
    );
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { front: "neko", back: "cat" },
      { front: "inu", back: "dog" },
    ]);
  });

  it("parses CSV with quoted fields and embedded commas", () => {
    const { rows, errors } = parseDelimitedCards(
      'こんにちは,"hello, hi"\n猫,cat\n',
      "csv",
    );
    expect(errors).toEqual([]);
    expect(rows[0]).toEqual({ front: "こんにちは", back: "hello, hi" });
    expect(rows[1]).toEqual({ front: "猫", back: "cat" });
  });

  it("CSV handles escaped quotes via doubled quotes", () => {
    const { rows } = parseDelimitedCards('say,"she said ""hi"""\n', "csv");
    expect(rows[0]).toEqual({ front: "say", back: 'she said "hi"' });
  });

  it("CSV handles embedded newlines inside quotes", () => {
    const { rows } = parseDelimitedCards(
      'verse,"line one\nline two"\nfront,back\n',
      "csv",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].back).toBe("line one\nline two");
  });

  it("parses pipe-delimited", () => {
    const { rows } = parseDelimitedCards("a|b\nc|d", "pipe");
    expect(rows).toEqual([
      { front: "a", back: "b" },
      { front: "c", back: "d" },
    ]);
  });

  it("skips empty lines", () => {
    const { rows, errors } = parseDelimitedCards(
      "neko\tcat\n\n\ninu\tdog",
      "tsv",
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
  });

  it("reports a 1-based line error when a row has fewer than 2 columns", () => {
    const { rows, errors } = parseDelimitedCards("only-one\ngood\tone", "tsv");
    expect(errors).toEqual([
      { line: 1, message: expect.stringMatching(/at least 2 columns/i) },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ front: "good", back: "one" });
  });

  it("reports an error when front or back is blank", () => {
    const { rows, errors } = parseDelimitedCards("\tbackOnly\nfront\t", "tsv");
    expect(rows).toEqual([]);
    expect(errors).toEqual([
      { line: 1, message: expect.stringMatching(/required/i) },
      { line: 2, message: expect.stringMatching(/required/i) },
    ]);
  });

  it("folds additional columns into note", () => {
    const { rows } = parseDelimitedCards(
      "neko\tcat\tanimal\thousehold\n",
      "tsv",
    );
    expect(rows[0]).toEqual({
      front: "neko",
      back: "cat",
      note: "animal · household",
    });
  });

  it("returns empty result for empty input", () => {
    expect(parseDelimitedCards("", "tsv")).toEqual({ rows: [], errors: [] });
    expect(parseDelimitedCards("   \n\n   ", "tsv")).toEqual({
      rows: [],
      errors: [],
    });
  });

  it("normalizes CRLF line endings", () => {
    const { rows } = parseDelimitedCards("a\tb\r\nc\td\r\n", "tsv");
    expect(rows).toEqual([
      { front: "a", back: "b" },
      { front: "c", back: "d" },
    ]);
  });
});
