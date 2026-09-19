#!/usr/bin/env node
/**
 * stub-atoms.mjs <mN> [<mN>…] — write PROVISIONAL `courseAtoms.mN-lK.ts` files from the spine for every
 * non-checkpoint lesson of the named modules, so lessons of one module can be WRITTEN AND CHECKED IN PARALLEL:
 * `from-spec.mjs`/`check-lesson.mjs` read prior vocabulary from the real tree only, so lesson K's check needs
 * lessons 1..K-1's atom files to exist. Never overwrites a file that already exists; the real `from-spec.mjs`
 * run replaces each stub with the same words. Stubs are not imported anywhere (courseAtoms.ts is an explicit list).
 */
import { writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inheritFromSpine, allSpineLessons } from "../lib/spine.mjs";
import { emitAtomsTs } from "../lib/emitAtomsTs.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const ptDir = join(here, "../../../../src/features/languages/pt");
for (const mod of process.argv.slice(2)) {
  for (const l of allSpineLessons().filter((x) => x.moduleId === mod && !x.checkpoint)) {
    const k = Number(l.id.match(/-(\d+)$/)[1]);
    const path = join(ptDir, `courseAtoms.${mod}-l${k}.ts`);
    if (existsSync(path)) { console.log(`keep ${path}`); continue; }
    const spec = inheritFromSpine({ lesson: k, id: `pt-${mod}-l${k}`, spine: l.id }, "stub");
    writeFileSync(path, `// STUB from the spine (mech/stub-atoms.mjs) — replaced by from-spec.mjs; never commit.\n` + emitAtomsTs(spec, mod));
    console.log(`stub ${mod}-l${k}: ${spec.words.length} atoms`);
  }
}
