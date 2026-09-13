import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Node-only projection of the JA IR files down to the two fields
 * `taughtVocab.ts` reads (`priorVocab`, `newAtoms[].kana`). Run by
 * `npm run content:emit`; `taughtVocab.generated.test.ts` re-runs it to
 * catch a stale committed JSON. Never imported by app code.
 */
export type TaughtVocabProjection = Record<
  string,
  { priorVocab?: string[]; newAtoms?: { kana: string }[] }
>;

export function projectTaughtVocab(irDir: string): TaughtVocabProjection {
  const out: TaughtVocabProjection = {};
  for (const f of readdirSync(irDir).sort()) {
    const m = /^(m\d+)\.ir\.json$/.exec(f);
    if (!m) continue;
    const ir = JSON.parse(readFileSync(path.join(irDir, f), "utf8")) as {
      priorVocab?: unknown;
      newAtoms?: unknown;
    };
    const entry: TaughtVocabProjection[string] = {};
    if (Array.isArray(ir.priorVocab)) entry.priorVocab = ir.priorVocab as string[];
    if (Array.isArray(ir.newAtoms)) {
      entry.newAtoms = (ir.newAtoms as { kana?: unknown }[])
        .filter((a) => a && typeof a === "object" && "kana" in a)
        .map((a) => ({ kana: a.kana as string }));
    }
    out[m[1]] = entry;
  }
  return out;
}
