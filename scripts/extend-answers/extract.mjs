#!/usr/bin/env node
/**
 * Extend-answers lane — Step 1: mechanical extraction of every m12+ short
 * build answer (#139), with everything a local model needs to extend it.
 *
 * WHY THIS SHELLS OUT TO VITEST: the real data lives behind
 * `getMockLessonContent` (`src/features/lesson/data/mockLessons.ts`), which
 * imports `virtual:lesson-registry-bootstrap` — a Vite plugin seam
 * (vite.config.ts) that only resolves under Vite/vitest (empty module in a
 * real build, the eager registry under vitest/CONTENT_EMIT). Plain `tsx`
 * cannot resolve it (confirmed: `ERR_UNSUPPORTED_ESM_URL_SCHEME` even after
 * a custom `node:module` resolve hook — the module graph re-enters through
 * a path the hook doesn't see). Rather than hand-port `getMockLessonContent`
 * + `contentFloors.ts`'s predicates (exactly the duplication the brief warns
 * against), the actual extraction logic lives in a throwaway vitest test —
 * `src/features/languages/ja/__tests__/zzExtendAnswersHarness.test.ts` —
 * that imports the real `getMockLessonContent`, `isSentenceBuildStep`,
 * `answerTileCount`, `normalizeSentenceKey`, `primarySentenceOf` and
 * `makeGlobalTokenizer` (moduleCompiler.ts) directly, and this script drives
 * it via `npx vitest run --project curriculum <harness>`. That harness file
 * is NOT part of the permanent suite and should not be committed.
 *
 * Writes:
 *   <EXTEND_DIR>/rows.jsonl          one row per violating step
 *   <EXTEND_DIR>/extract-summary.json
 *
 * Row shape: {stepId, module, lessonId, beatRef:{file,line}, ja, tiles,
 *   tileCount, en, grammarIds, mode, politeness, availableWords,
 *   lessonSentences}
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";
fs.mkdirSync(EXTEND_DIR, { recursive: true });

const ROWS_OUT = path.join(EXTEND_DIR, "rows.jsonl");
const SUMMARY_OUT = path.join(EXTEND_DIR, "extract-summary.json");
const HARNESS = "src/features/languages/ja/__tests__/zzExtendAnswersHarness.test.ts";

const EXPECTED_TOTAL = 656; // content-floors-violations.md, 2026-09-15 baseline

console.log("extract.mjs: running the extraction harness under vitest...");
try {
  execFileSync(
    "npx",
    ["vitest", "run", "--project", "curriculum", HARNESS],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        EXTEND_MODE: "extract",
        EXTEND_ROWS_OUT: ROWS_OUT,
        EXTEND_SUMMARY_OUT: SUMMARY_OUT,
      },
      stdio: "inherit",
    },
  );
} catch (err) {
  console.error("extract.mjs: vitest harness failed:", err.message);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(SUMMARY_OUT, "utf8"));
console.log(`extract.mjs: ${summary.totalRows} rows written -> ${ROWS_OUT}`);
console.log("extract.mjs: per-module counts:");
for (const [m, n] of Object.entries(summary.perModule)) {
  console.log(`  ${m}: ${n}`);
}
if (summary.missingBeatMatch > 0) {
  console.log(
    `extract.mjs: WARNING ${summary.missingBeatMatch} rows had no yaml beat match (en/grammarIds/line will be empty for those).`,
  );
}

if (summary.totalRows !== EXPECTED_TOTAL) {
  console.log(
    `extract.mjs: NOTE total ${summary.totalRows} != violations-file baseline ${EXPECTED_TOTAL}. ` +
      "This can happen legitimately if a Sonnet authoring lane already fixed some rows since " +
      "content-floors-violations.md was generated (2026-09-15) — that's the gate's budget going " +
      "down, which is expected direction. Re-run `npx vitest run --project curriculum " +
      "src/features/languages/ja/__tests__/buildAnswerFloor.test.ts` to confirm the current count " +
      "before treating this as a bug.",
  );
} else {
  console.log(`extract.mjs: total ${summary.totalRows} matches the violations-file baseline. OK.`);
}
