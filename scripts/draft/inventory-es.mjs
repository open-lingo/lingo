/**
 * inventory-es.mjs — extract the taught Spanish inventory up to a module.
 *
 *   node scripts/draft/inventory-es.mjs m8
 *
 * The JA twin (`inventory.mjs`) reads one `courseAtoms.ts`. ES deliberately
 * keeps each module's atoms WITH the module (`curriculum/mN.ts` exports
 * `ES_MN_ATOMS`) so parallel authoring waves never touch the same file — see
 * the header of `es/courseAtoms.ts`. So this walks the curriculum instead.
 *
 * "Taught up to mN" is the whole point: a drafting frame may only draw from
 * words the learner has already met. That is invariant 33 (TEACH-FIRST) and
 * it is the one rule a local model cannot be trusted to respect on its own.
 */
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CURRICULUM = resolve(here, "../../src/features/languages/es/curriculum");

export async function esInventory(throughModule) {
  const limit = Number(String(throughModule).replace(/^m/, ""));
  if (!Number.isFinite(limit)) throw new Error(`bad module "${throughModule}"`);

  const files = (await readdir(CURRICULUM))
    .filter((f) => /^m\d+\.ts$/.test(f))
    .filter((f) => Number(f.slice(1, -3)) <= limit)
    .sort((a, b) => Number(a.slice(1, -3)) - Number(b.slice(1, -3)));

  const atoms = [];
  const seen = new Set(); // first-write-wins by surface, mirroring courseAtoms.ts
  for (const f of files) {
    const mod = f.slice(0, -3);
    const src = await readFile(join(CURRICULUM, f), "utf8");
    for (const [, body] of src.matchAll(/atom\(\{([^}]*)\}\)/g)) {
      const get = (k) => body.match(new RegExp(`${k}:\\s*"([^"]*)"`))?.[1];
      const surface = get("surface");
      if (!surface || seen.has(surface)) continue;
      seen.add(surface);
      atoms.push({
        surface,
        gloss: get("meaningEn") ?? "",
        pos: get("partOfSpeech") ?? "",
        gender: get("gender") ?? null,
        kind: get("kind") ?? "vocab",
        fromModule: get("fromModule") ?? mod,
      });
    }
  }
  return atoms;
}

/** Convenience selectors the frames use. */
export const byPos = (atoms, ...pos) => atoms.filter((a) => pos.includes(a.pos));
export const nouns = (atoms) => atoms.filter((a) => a.pos === "noun");
export const verbs = (atoms) => atoms.filter((a) => a.pos === "verb");

if (import.meta.url === `file://${process.argv[1]}`) {
  const mod = process.argv[2] ?? "m8";
  const atoms = await esInventory(mod);
  const counts = atoms.reduce((m, a) => ((m[a.pos] = (m[a.pos] ?? 0) + 1), m), {});
  console.log(`ES inventory through ${mod}: ${atoms.length} atoms`);
  console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join("\n"));
  console.log(`\nverbs: ${verbs(atoms).map((v) => v.surface).join(", ")}`);
  console.log(`\nnouns (${nouns(atoms).length}): ${nouns(atoms).map((n) => `${n.surface}(${n.gender ?? "?"})`).join(", ")}`);
}
