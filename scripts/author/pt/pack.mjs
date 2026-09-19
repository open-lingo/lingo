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
  MAX_USES_PER_SENTENCE, MAX_SELECTION_RUN, MAX_NEW_WORDS, PT_CONTRACTIONS, PT_ALLOW_WORDS,
} from "./lib/rules.mjs";
import { appendSpecFormat, appendAtomFields, appendTaughtVocab, appendLessonBriefs } from "./lib/packSections.mjs";

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
w(`- \`ir/m1.ir.yaml\` exists (lane PTINT/PTR1-L6); \`check.sh\` runs \`compile-ir-pt.mjs m1 --check\``);
w(`  for real. Its unconditional "last lesson must end on a sim" complaint is downgraded to`);
w(`  INFO by \`check.sh\` itself (not the compiler, which this lane may not edit) whenever the`);
w(`  lesson being checked is NOT the module's final lesson (arg 2, default 6) — a per-lesson`);
w(`  check on a non-final lesson can never satisfy a whole-module law and isn't a content defect.`);
w(`- A sim's \`scene\` (emoji/title/setting) isn't spec-configurable yet; the generator defaults`);
w(`  to a generic 💬 + the lesson title.`);
w(`- The generated \`map\` step only pairs tokens that match a registered \`words:\` surface —`);
w(`  a bare persona name (e.g. "Sam") goes unmapped unless you also list it as a word.`);
w(`- \`taught-vocab-residual\` (PTGRADE finding 3) needs an \`allow:\` list for every function word`);
w(`  your sentences use that isn't itself a taught atom — CLOSED set only (below); a content`);
w(`  word must be a real atom (\`words:\`/\`recall:\`), never allow-listed (round-3 fix, PTGRADE2 #3c).`);
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
w(`- imageMcq: max 2 per lesson, never adjacent, only on a noun's debut. Every \`pos: noun\` word`);
w(`  needs \`emoji\` (vendored) or \`imageable: false\` + \`imageableReason\` — generator refuses else.`);
w(`- Every lesson closes: \`sim\` -> \`matchLit\` (>= ${MATCH_PAIR_FLOOR} pairs) -> \`speakLit\`-win.`);
w(`  \`dialogue:\` (>= 1 turn) is REQUIRED on every spec — the generator refuses to emit without`);
w(`  it, and \`check.sh\` independently FAILS a non-checkpoint lesson with no \`sim\` step on disk.`);
w(`- Step-count band: ${STEP_COUNT_MIN}-${STEP_COUNT_MAX}.`);
w(`- Gloss-aspect rule: the English gloss must carry the form's aspect lexically`);
w(`  (preterite = simple past, never "was going"/"used to"; no progressive; \`ir + inf\``);
w(`  glosses "going to X", never "will X") — one line in \`grammar\`/\`info\`, never left implicit.`);
w(`- Ser/estar minimal pairs get an explicit \`antiPattern\` (design doc §3).`);
w(`- \`allow:\` closed set: {${[...PT_ALLOW_WORDS].join(", ")}} — anything else must be a real atom.`);
w(`- \`uses:\` credits atoms (words:/recall:) for answer-floor + FSRS; \`allow:\` is a prose-only`);
w(`  pass-through for the residual check — a function word never belongs in \`uses:\`.`);
w();
appendSpecFormat(w);
appendAtomFields(w);
appendLessonBriefs(w);
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
