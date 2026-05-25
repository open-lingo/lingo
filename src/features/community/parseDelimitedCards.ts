/**
 * Tiny delimited-text parser for the "paste cards" import flow.
 *
 * Supports three modes — tab, comma, pipe — and a minimal subset of the
 * CSV grammar (RFC 4180-ish): double-quoted fields, escaped quotes via
 * `""`, embedded newlines inside quoted fields. Each row must have at
 * least 2 columns (front, back); extra columns are folded into ``note``.
 *
 * Why inline (~80 lines) instead of PapaParse: the dependency isn't
 * installed and the surface we need is small. If we ever add UI for
 * Anki .apkg imports we should switch — that path needs full RFC 4180.
 *
 * Returns ``{ rows, errors }`` so the UI can render both a preview AND
 * surface per-line warnings without throwing on malformed lines.
 */

export type DelimiterMode = "tsv" | "csv" | "pipe";

export type ParsedCardRow = {
  front: string;
  back: string;
  note?: string;
};

export type ParseResult = {
  rows: ParsedCardRow[];
  errors: { line: number; message: string }[];
};

function delimChar(mode: DelimiterMode): string {
  return mode === "tsv" ? "\t" : mode === "csv" ? "," : "|";
}

/**
 * Splits the input into records. Honors quoted fields when ``mode === "csv"``
 * (the only mode where embedded delimiters / newlines are common).
 * For TSV / pipe we use a simple per-line split since users virtually
 * never embed tabs or pipes inside a card field.
 */
function tokenize(input: string, mode: DelimiterMode): string[][] {
  const delim = delimChar(mode);
  if (mode !== "csv") {
    return input
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.split(delim));
  }

  // CSV state machine — handles quoted fields and embedded quotes/newlines.
  const records: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        cur.push(field);
        records.push(cur);
        cur = [];
        field = "";
        // CRLF — skip the LF
        if (ch === "\r" && input[i + 1] === "\n") i++;
      } else {
        field += ch;
      }
    }
  }
  // Flush trailing field
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    records.push(cur);
  }
  return records;
}

export function parseDelimitedCards(
  input: string,
  mode: DelimiterMode = "tsv",
): ParseResult {
  const rows: ParsedCardRow[] = [];
  const errors: { line: number; message: string }[] = [];
  if (!input.trim()) return { rows, errors };

  const records = tokenize(input, mode);
  records.forEach((cells, idx) => {
    const lineNo = idx + 1;
    // Drop fully-empty lines silently.
    if (cells.every((c) => c.trim() === "")) return;
    if (cells.length < 2) {
      errors.push({
        line: lineNo,
        message: "Need at least 2 columns (front, back).",
      });
      return;
    }
    const front = cells[0].trim();
    const back = cells[1].trim();
    if (!front || !back) {
      errors.push({
        line: lineNo,
        message: "Front and back are required.",
      });
      return;
    }
    const note =
      cells.length > 2
        ? cells
            .slice(2)
            .map((c) => c.trim())
            .filter(Boolean)
            .join(" · ")
        : undefined;
    rows.push({ front, back, ...(note ? { note } : {}) });
  });
  return { rows, errors };
}
