#!/usr/bin/env node
/**
 * pack.mjs — generates `docs/pt-authoring-pack.md`, the ONE doc a PT
 * authoring lane reads (replaces re-reading the 8 docs PTAUTH-L1..L5 each
 * read separately — see the PTTOOL report for the measured 62% orientation
 * cost this exists to cut). Regenerate on demand; the generated file is
 * committed too (so a lane can read it without running this script first).
 *
 * Sections come from LIVE sources, never hand-copied: taught vocabulary
 * from `lib/taughtVocab.mjs` (scans the real `courseAtoms.m1-l*.ts` files),
 * the emoji lookup from `lib/emojiIndex.mjs` (scans the real vendored
 * `src/pub/noto-emoji/svg/` dir — too large to inline at 487 entries, so
 * it's written to a sidecar JSON and referenced, not embedded).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readTaughtVocab } from "./lib/taughtVocab.mjs";
import { buildEmojiIndex } from "./lib/emojiIndex.mjs";
import {
  STEP_COUNT_MIN, STEP_COUNT_MAX, TILE_FLOOR, MATCH_PAIR_FLOOR, ANSWER_FLOOR,
  MAX_USES_PER_SENTENCE, MAX_SELECTION_RUN, MAX_NEW_WORDS, PT_CONTRACTIONS,
} from "./lib/rules.mjs";
import { appendSpecFormat, appendAtomFields, appendTaughtVocab } from "./lib/packSections.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const ptDir = join(root, "src/features/languages/pt");

const taught = readTaughtVocab(ptDir);
const emojiIdx = buildEmojiIndex(join(root, "src/pub/noto-emoji/svg"));

mkdirSync(join(root, "docs"), { recursive: true });
const emojiPath = join(root, "docs/pt-emoji-index.generated.json");
writeFileSync(emojiPath, JSON.stringify([...emojiIdx.entries()].sort(), null, 1));

const lines = [];
const w = (s = "") => lines.push(s);

w(`# PT authoring pack (spec-first) — generated, do not hand-edit`);
w();
w(`Regenerate: \`node scripts/author/pt/pack.mjs\`. Source: docs/pt-course-design-2026-09-18.md`);
w(`§3/§4, the 5 \`PTAUTH-L*\` lane reports, \`scripts/draft/pt-ir/assemble.mjs\`.`);
w(`This is the ONE doc a spec-first PT lane reads before writing a spec.`);
w();
w(`## The loop`);
w(`1. Read this pack (you're doing it).`);
w(`2. Write \`specs/pt-m1-l<n>.yaml\` (~60 lines, format below).`);
w(`3. \`node scripts/author/pt/from-spec.mjs specs/pt-m1-l<n>.yaml\``);
w(`4. \`bash scripts/author/pt/check.sh <n>\``);
w(`5. Commit the two generated files + the spec.`);
w();
w(`## Known gaps (not this lane's job to fix — named so nobody re-discovers them)`);
w(`- No \`ir/m1.ir.yaml\` module-level base file exists yet (module/title/`);
w(`  expectedLessonCount/checkpoint/placement) — \`compile-ir-pt.mjs m1\` cannot run`);
w(`  end to end until one lands; \`check.sh\` skips that step by name until then.`);
w(`- L1/L3/L4/L5's real committed fragments each guessed a DIFFERENT top-level shape`);
w(`  before the fragment-merge compiler landed (L1: \`lesson:\`+\`newAtomSurfaces:\`; L3:`);
w(`  \`module:\`+\`lesson:\`; L4: flat \`lessonNumber:\`+\`newAtoms:\`; L5: flat \`n:\`+\`newAtoms:\`).`);
w(`  Only L2 and everything \`from-spec.mjs\` generates match the compiler's real`);
w(`  \`lesson:\` + \`atoms:\` schema — \`check.sh\` only checks THAT shape.`);
w(`- No \`speak\` role: a SPEC's only \`speakLit\` is the closing win — real hand-authored`);
w(`  lessons also print a NEW form's first voicing mid-lesson before it becomes a cloze`);
w(`  answer (retention-rhythm law 3). A sim's \`scene\` (emoji/title/setting) also isn't`);
w(`  spec-configurable yet; the generator defaults to a generic 💬 + the lesson title.`);
w(`- The generated \`map\` step only pairs tokens that match a registered \`words:\` surface —`);
w(`  a bare persona name (e.g. "Sam") goes unmapped unless you also list it as a word.`);
w();
w(`## Checklist (exact numbers the generator + check.sh enforce)`);
w(`- New atoms per lesson: <= ${MAX_NEW_WORDS}.`);
w(`- Intro-capable step kinds (a new atom's FIRST PRINTED appearance): info, phrase,`);
w(`  speakLit, buildLit, listenCompLit, imageMcq — never a distractor, never a sim`);
w(`  first, and \`map\` does NOT count (its opening sentence is transparent for this rule).`);
w(`- Every atom: >= ${ANSWER_FLOOR} answer positions across the lesson (build answer, cloze`);
w(`  blank, MCQ correct, listen answer, sim right option, match pair).`);
w(`- No two adjacent same-kind steps. No 4+ (max ${MAX_SELECTION_RUN} in a row) selection-only`);
w(`  run (imageMcq/textMcq/mcq/clozeLit are selection-only; buildLit/speakLit/`);
w(`  listenCompLit/sim/map/matchLit/agreementLit are not).`);
w(`- Any one sentence used <= ${MAX_USES_PER_SENTENCE}x across its roles.`);
w(`- buildLit tiles: >= ${TILE_FLOOR} unless the sentence is the grammar point's \`debut\`.`);
w(`- Contractions (${[...PT_CONTRACTIONS].slice(0, 8).join(", ")}, …) are CLOZE-ONLY —`);
w(`  never a build/listen-build tile, even on a sentence tagged \`build\` (the generator`);
w(`  forces these to \`cloze:\` automatically; \`assemble.mjs\`'s \`checkNoContractionTiles\``);
w(`  throws at compile time if one ever slips through).`);
w(`- imageMcq: max 2 per lesson, never adjacent, only on a noun's debut.`);
w(`- Every lesson closes: \`sim\` -> \`matchLit\` (>= ${MATCH_PAIR_FLOOR} pairs) -> \`speakLit\`-win.`);
w(`- Step-count band: ${STEP_COUNT_MIN}-${STEP_COUNT_MAX}.`);
w(`- Gloss-aspect rule: the English gloss must carry the form's aspect lexically`);
w(`  (preterite = simple past, never "was going"/"used to"; no progressive; \`ir + inf\``);
w(`  glosses "going to X", never "will X") — one line in \`grammar\`/\`info\`, never left implicit.`);
w(`- Ser/estar minimal pairs get an explicit \`antiPattern\` (design doc §3).`);
w();
appendSpecFormat(w);
appendAtomFields(w);
w(`## Vendored emoji`);
w(`${emojiIdx.size} glyphs vendored under \`src/pub/noto-emoji/svg/\`. Full glyph -> filename`);
w(`lookup: \`docs/pt-emoji-index.generated.json\` (regenerated by this script). Check before`);
w(`using an emoji in a spec: \`node -e 'import("./scripts/author/pt/lib/emojiIndex.mjs")`);
w(`.then(({buildEmojiIndex})=>console.log(buildEmojiIndex("src/pub/noto-emoji/svg").has("🎓")))'\``);
w(`— flags use \`src/pub/region-flags/svg/<ISO>.svg\` instead (not in this index).`);
w();
appendTaughtVocab(w, taught);
w(`## Persona / cast`);
w(`Learner: **Sam** (cross-course convention). NPCs: **Bia, Pedro, Rafael** (candidates,`);
w(`not locked — verify naturalness before authoring). Places: Brasil, São Paulo. Variant:`);
w(`pt-BR only (§3) — você-default, gerund \`estar + gerúndio\`, proclisis.`);
w();
w(`## Commands`);
w("```");
w(`node scripts/author/pt/from-spec.mjs specs/pt-m1-l<n>.yaml   # generate`);
w(`bash scripts/author/pt/check.sh <n>                          # gate`);
w(`node scripts/author/pt/pack.mjs                               # regenerate this pack`);
w("```");

writeFileSync(join(root, "docs/pt-authoring-pack.md"), lines.join("\n") + "\n");
console.log(`pack.mjs: docs/pt-authoring-pack.md (${lines.length} lines), docs/pt-emoji-index.generated.json (${emojiIdx.size} glyphs)`);
