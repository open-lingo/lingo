import type { LessonContent } from "@/features/lesson/types";

/**
 * Produce a paste-ready TS module body for a lesson draft.
 *
 * Output mirrors the convention used in `src/features/lesson/data/mock-ja-*.ts`:
 *
 *   import type { LessonContent } from "@/features/lesson/types";
 *
 *   export const MOCK_LESSON_<UPPER>: LessonContent = { ... };
 *
 * The author is expected to copy this and either (a) drop it into a new
 * mock-*.ts file and register it in mockLessons.ts, or (b) diff against
 * the existing source. We do NOT write to disk.
 */
export function exportLessonAsTs(content: LessonContent): string {
  const upperId = content.id
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()
    .replace(/^_+|_+$/g, "");
  const literal = stringifyLessonLiteral(content, 0);
  return `import type { LessonContent } from "@/features/lesson/types";\n\nexport const MOCK_LESSON_${upperId}: LessonContent = ${literal};\n`;
}

function stringifyLessonLiteral(value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value
      .map((v) => padInner + stringifyLessonLiteral(v, indent + 1))
      .join(",\n");
    return `[\n${items},\n${pad}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const body = entries
      .map(([k, v]) => `${padInner}${safeKey(k)}: ${stringifyLessonLiteral(v, indent + 1)}`)
      .join(",\n");
    return `{\n${body},\n${pad}}`;
  }
  return JSON.stringify(value);
}

function safeKey(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
}
