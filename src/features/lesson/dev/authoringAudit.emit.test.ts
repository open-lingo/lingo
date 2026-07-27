import { describe, it } from "vitest";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileModule, type ModuleIR } from "../data/moduleCompiler";
import {
  TEACH_FIRST_INTRO_TYPES,
  jaSurfaces,
} from "../data/stepTaxonomy";
import { minDistractorsFor } from "../data/buildTileFloor";
import type { LessonContent, LessonStep } from "../types";

/**
 * BULK CONFORMANCE AUDIT (Spencer 2026-07-26 — `npm run authoring-audit`).
 *
 * Per-lesson re-reading of the invariants raises compliance; it does not
 * guarantee it (the m7-m10 cycle shipped 38 bare-word debuts and 58
 * translate-heavy lessons from agents that had the rules in-prompt). This
 * checks the MECHANICAL half of the law across every module at once,
 * independent of whoever authored it.
 *
 * It is a BACKSTOP, not a gate — it always passes and writes a report. The
 * hard gates live in `moduleBarGuards` / `moduleCompiler.diagnostics`. The
 * value here is the cross-module view: when the same invariant is flagged in
 * 3+ modules, the defect is the GUIDE or the COMPILER, not the author.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const IR_DIR = join(HERE, "../../languages/ja/curriculum/ir");
const OUT = join(HERE, "../../../../docs/reports/authoring-audit.md");

/** Inv 43: translate is <=15% of PRODUCTION. */
const PRODUCTION = new Set([
  "build_sentence",
  "translate",
  "speaking",
  "listening_build",
]);
const TRANSLATE_CEILING = 0.15;

/** Inv 45: types that should actually appear once a module has material for
 *  them. `word_image_mcq` is deliberately absent — its count is fixed by how
 *  many imageable words the module introduces (inv 44), so a floor would be
 *  meaningless. */
const FLOOR_TYPES = [
  "listening_comprehension",
  "multiple_choice",
  "speaking",
  "particle_cloze",
  "match_pairs",
];

type Finding = { inv: string; detail: string };

function auditModule(
  lessons: LessonContent[],
  newKana: string[],
): Finding[] {
  const out: Finding[] = [];
  const steps: LessonStep[] = lessons.flatMap((l) => l.steps);
  const byType = new Map<string, number>();
  for (const s of steps) byType.set(s.type, (byType.get(s.type) ?? 0) + 1);

  // ── inv 43: translate share of production
  const prod = steps.filter((s) => PRODUCTION.has(s.type)).length;
  const tr = byType.get("translate") ?? 0;
  const share = prod ? tr / prod : 0;
  if (share > TRANSLATE_CEILING)
    out.push({
      inv: "43 translate-ceiling",
      detail: `${(share * 100).toFixed(1)}% of production (${tr}/${prod}) — ceiling is 15%`,
    });

  // ── inv 45: usage floors
  for (const t of FLOOR_TYPES)
    if (!byType.get(t))
      out.push({ inv: "45 usage-floor", detail: `zero \`${t}\` steps in the whole module` });

  // ── inv 44: an imaged word is imaged ONCE, ever
  const imaged = steps.filter((s) => s.type === "word_image_mcq");
  const seenImage = new Map<string, number>();
  for (const s of imaged) {
    const rec = s as unknown as {
      options?: { id: string; word: string }[];
      correctOptionId?: string;
    };
    const w =
      rec.options?.find((o) => o.id === rec.correctOptionId)?.word ?? "?";
    seenImage.set(w, (seenImage.get(w) ?? 0) + 1);
  }
  for (const [w, n] of seenImage)
    if (n > 1)
      out.push({
        inv: "44 image-first-exposure-only",
        detail: `"${w}" imaged ${n}× — word_image_mcq is first exposure ONLY`,
      });

  // ── inv 30/33/37: a word's first appearance must be intro-capable.
  //    Scoped to the atoms THIS MODULE introduces — a prior-module word has
  //    no debut to get wrong here, and treating every token as a candidate
  //    just reports the entire vocabulary back.
  //    Matching is token-INITIAL (「ぼうしを」 counts for ぼうし) rather than
  //    substring, so いま ⊄ かいます. Errs toward false negatives.
  for (const kana of newKana) {
    const hit = steps.find((s) =>
      jaSurfaces(s as never).some((surface) =>
        surface
          .split(/[\s　]+/)
          .some((tok) => tok.startsWith(kana)),
      ),
    );
    if (hit && !TEACH_FIRST_INTRO_TYPES.has(hit.type))
      out.push({
        inv: "30/33/37 debut-step-type",
        detail: `"${kana}" first appears on \`${hit.type}\` (${hit.id})`,
      });
  }

  // ── inv 19/35: single-tile builds, and thin tile banks
  const singleTileIds: string[] = [];
  let thinBank = 0;
  for (const s of steps) {
    const rec = s as unknown as { correctOrder?: string[]; tiles?: string[] };
    if (!Array.isArray(rec.correctOrder)) continue;
    if (rec.correctOrder.length === 1) singleTileIds.push(s.id);
    else if (
      Array.isArray(rec.tiles) &&
      rec.tiles.length - rec.correctOrder.length <
        minDistractorsFor(rec.correctOrder.length)
    )
      thinBank++;
  }
  if (singleTileIds.length)
    out.push({
      inv: "19 single-tile-build",
      detail:
        `${singleTileIds.length} build steps have a ONE-tile answer — that is a ` +
        `word card, not a build: ${singleTileIds.join(", ")}`,
    });
  if (thinBank)
    out.push({
      inv: "35 build-tile-distractors",
      detail:
        `${thinBank} build steps are under the distractor floor AS AUTHORED. ` +
        `The central backfill in \`buildTileFloor\` repairs these at load, so ` +
        `nothing ships thin — this is AUTHORING DEBT, and inv 35 says to ` +
        `author the distractors anyway ("that backfill is exactly why authors ` +
        `stop noticing the bar").`,
    });

  return out;
}

describe("authoring audit (bulk conformance report)", () => {
  it("writes docs/reports/authoring-audit.md", () => {
    const files = readdirSync(IR_DIR)
      .filter((f) => f.endsWith(".ir.json"))
      .sort((a, b) => (parseInt(a.slice(1)) || 0) - (parseInt(b.slice(1)) || 0));

    const lines: string[] = [
      "# Authoring conformance audit",
      "",
      "Generated by `npm run authoring-audit`. This is a BACKSTOP over compiled",
      "output — the hard gates are `moduleBarGuards` and the compiler",
      "diagnostics. **When the same invariant appears in 3+ modules, fix the",
      "guide or the compiler, not the modules one at a time.**",
      "",
      "| module | steps | translate % | distinct types | findings |",
      "| --- | --- | --- | --- | --- |",
    ];
    const detail: string[] = [];
    const tally = new Map<string, number>();

    for (const f of files) {
      const name = f.replace(".ir.json", "");
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
      const lessons = compileModule(ir);
      const steps = lessons.flatMap((l) => l.steps);
      const prod = steps.filter((s) => PRODUCTION.has(s.type)).length;
      const tr = steps.filter((s) => s.type === "translate").length;
      const types = new Set(steps.map((s) => s.type)).size;
      const newKana = (ir.newAtoms ?? []).map((a) => a.kana);
      const findings = auditModule(lessons, newKana);
      // Count MODULES per invariant, not findings — "flagged in 3+ modules"
      // is the signal that the guide or compiler is the defect.
      for (const inv of new Set(findings.map((x) => x.inv)))
        tally.set(inv, (tally.get(inv) ?? 0) + 1);

      lines.push(
        `| ${name} | ${steps.length} | ${prod ? ((tr / prod) * 100).toFixed(1) : "0.0"}% | ${types} | ${findings.length || "—"} |`,
      );
      if (findings.length) {
        detail.push(`\n### ${name}\n`);
        for (const x of findings) detail.push(`- **inv ${x.inv}** — ${x.detail}`);
      }
    }

    const systemic = [...tally.entries()].filter(([, n]) => n >= 3);
    if (systemic.length) {
      lines.push("", "## Systemic — fix upstream, not per module", "");
      for (const [inv, n] of systemic)
        lines.push(`- **inv ${inv}** flagged in ${n} modules`);
    }
    lines.push("", "## Findings by module", ...detail);

    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, lines.join("\n") + "\n");
  });
});
