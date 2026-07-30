/**
 * DEAD LESSON-ID REFERENCE SCAN (stale-reference audit, 2026-07-29).
 *
 * Regression class: strings shaped like JA lesson ids that point at lessons
 * which no longer exist (the rewrite renamed `ja-m4-1-1`-era ids to
 * `ja-mN-neo-*`). Past instances: 234 dangling `introducedByLessonId` rows
 * (B068), GATE_EXEMPTIONS keys frozen against renamed clozes, doc prose
 * steering agents at deleted lessons.
 *
 * What it does: extracts every `ja-m<digits>[-...]` token from src/, docs/ and
 * scripts/, then resolves each against
 *   - the live registry (`getAvailableMockLessonIds()`),
 *   - the live JA course map (`getMockCourse("ja")`),
 *   - the one dynamic id family (`ja-m<N>-review-1/2` → buildSrsReviewLesson,
 *     currently DORMANT per B069 but code-resolvable),
 * accepting a token when it IS a live id, is a live id plus a suffix (step
 * ids, exemption keys), or is a live id family prefix (`ja-m11-neo`).
 * Everything else is DEAD.
 *
 * Two enforcement tiers (per the 2026-07-29 audit ruling):
 *   - RATCHET (fails CI): dead ids in QUOTED STRINGS in src/ — these are data
 *     fields, registry keys and test exemption keys, where a dead id silently
 *     disables behavior. Pin only goes DOWN.
 *   - REPORT-ONLY: dead ids in docs/ prose, comments and scripts/ — run
 *     `STALE_REPORT=1 npx vitest run staleLessonIdReferences` to dump the full
 *     bucketed list to /tmp/ja-stale-lesson-ids.txt.
 *
 * Positive controls below assert the pipeline flags a known-dead id and
 * passes a known-live one, so an "0 dead" result can be believed.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Directories never scanned (archives are ALLOWED to hold dead ids). */
const EXCLUDED_DIR_PARTS = [
  "node_modules",
  "dist",
  ".git",
  "_archive",
  `docs${path.sep}archive`,
  `src${path.sep}pub`,
  ".auth",
  "test-results",
  "playwright-report",
];

/**
 * Files whose whole PURPOSE is history — dead ids there are records, not
 * defects. Scanned, but bucketed as historical and never ratcheted.
 */
const HISTORICAL_PATH_PARTS = [
  `docs${path.sep}learner-sim`,
  `docs${path.sep}backlog`,
  `docs${path.sep}user-feedback`,
  "retrospective",
  "postmortem",
  "handoff-",
  "audit", // *-audit-*.md docs are measurement records of past states
  `docs${path.sep}tasks`,
  `docs${path.sep}superpowers`,
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mjs", ".json", ".yaml", ".yml"]);

/** This scanner (and its sibling report doc) quote dead ids on purpose. */
const SELF_PATHS = [
  `src${path.sep}__tests__${path.sep}staleLessonIdReferences.test.ts`,
  `docs${path.sep}stale-reference-audit-2026-07-29.md`,
];

const TOKEN_RE = /(?<![a-zA-Z0-9-])ja-m\d+(?:-[a-z0-9]+)*/g;
const DYNAMIC_REVIEW_RE = /^ja-m\d+-review-[12]$/;

type Bucket = "live" | "registered-off-map" | "dynamic-dormant" | "dead";

function buildResolver() {
  const registry = new Set(getAvailableMockLessonIds());
  const mapIds = new Set<string>();
  for (const mod of getMockCourse("ja").modules) {
    for (const lesson of mod.lessons) mapIds.add(lesson.id);
  }
  // Live STEP ids: step ids are free-form (ja-m3-neo-rev-cloze-mo lives in
  // lesson ja-m3-neo-review), so they must be collected, not inferred from
  // lesson-id prefixes. Registry lessons cover the map plus QA-only lessons.
  const stepIds = new Set<string>();
  for (const lessonId of registry) {
    const content = getMockLessonContent(lessonId);
    for (const step of content?.steps ?? []) {
      const id = (step as { id?: string }).id;
      if (id) stepIds.add(id);
    }
  }
  // Live ATOM ids: 89 course-atom ids are lesson-id-shaped relics of the
  // 2026-05-19 generator ("ja-m5-1-v-1" is the atom いち). They are stable
  // forever by contract — never stale, never lesson references.
  const atomIds = new Set(JA_COURSE_ATOMS.map((a) => a.id));
  const classify = (token: string): Bucket => {
    const resolvesIn = (ids: Set<string>): boolean => {
      if (ids.has(token)) return true;
      for (const id of ids) {
        if (token.startsWith(id + "-")) return true; // step id / exemption key
        if (id.startsWith(token + "-")) return true; // family prefix (ja-m11-neo)
      }
      return false;
    };
    if (atomIds.has(token)) return "live";
    if (stepIds.has(token)) return "live";
    if (resolvesIn(mapIds)) return "live";
    // Suffixed step references (exemption keys quote step ids verbatim, but a
    // doc may write "ja-m3-neo-rev-cloze-mo-1"-style sub-references).
    for (const id of stepIds) if (token.startsWith(id + "-")) return "live";
    if (resolvesIn(registry)) return "registered-off-map";
    if (DYNAMIC_REVIEW_RE.test(token)) return "dynamic-dormant";
    return "dead";
  };
  return { classify };
}

type Hit = {
  file: string; // repo-relative
  line: number;
  token: string;
  bucket: Bucket;
  quoted: boolean; // immediately preceded by a quote char → string literal
  historical: boolean;
};

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(REPO_ROOT, full);
    if (EXCLUDED_DIR_PARTS.some((p) => rel.includes(p))) continue;
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) yield full;
  }
}

function scan(): Hit[] {
  const { classify } = buildResolver();
  const hits: Hit[] = [];
  for (const root of ["src", "docs", "scripts"]) {
    const abs = path.join(REPO_ROOT, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const rel = path.relative(REPO_ROOT, file);
      if (SELF_PATHS.some((p) => rel === p)) continue;
      const historical = HISTORICAL_PATH_PARTS.some((p) => rel.includes(p));
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((text, i) => {
        for (const m of text.matchAll(TOKEN_RE)) {
          const bucket = classify(m[0]);
          if (bucket === "live") continue; // the overwhelmingly common case
          // Backticks deliberately NOT counted: `ja-m1-l1a` in a TS doc
          // comment is prose, not a string literal.
          const before = m.index! > 0 ? text[m.index! - 1] : "";
          hits.push({
            file: rel,
            line: i + 1,
            token: m[0],
            bucket,
            quoted: before === '"' || before === "'",
            historical,
          });
        }
      });
    }
  }
  return hits;
}

describe("stale lesson-id references", () => {
  const { classify } = buildResolver();

  it("positive control: known-dead ids classify as dead, known-live as live", () => {
    // ja-m4-1-1 and ja-m1-l6-ha are verified-deleted old-course ids
    // (regression classes 1 and 5 in the 2026-07-29 audit).
    expect(classify("ja-m4-1-1")).toBe("dead");
    expect(classify("ja-m1-l6-ha")).toBe("dead");
    // Live controls: a map lesson, a step-id suffix, and a family prefix.
    expect(classify("ja-m3-neo-1")).toBe("live");
    expect(classify("ja-m6-neo-9-cloze-7")).toBe("live");
    expect(classify("ja-m11-neo")).toBe("live");
    // The dormant dynamic-builder shape must NOT read as dead (B069).
    expect(classify("ja-m4-review-1")).toBe("dynamic-dormant");
  });

  it("extractor positive control: finds a planted dead id in text", () => {
    const planted = 'const x = "ja-m4-1-1"; // and prose mention of ja-m1-l6-ha';
    const tokens = [...planted.matchAll(TOKEN_RE)].map((m) => m[0]);
    expect(tokens).toEqual(["ja-m4-1-1", "ja-m1-l6-ha"]);
  });

  const hits = scan();

  it("RATCHET: dead lesson ids in quoted strings in src/ non-test code only go DOWN", () => {
    const offenders = hits.filter(
      (h) =>
        h.bucket === "dead" &&
        h.quoted &&
        h.file.startsWith("src") &&
        !h.historical &&
        // Test files quote id-shaped FIXTURES legitimately (predicate tests
        // construct synthetic ids); their load-bearing exemption lists are
        // covered by the report tier + their own shrink-only rules.
        !/\.test\.tsx?$|__tests__/.test(h.file) &&
        // courseAtoms.ts dangling `introducedByLessonId` rows are already
        // ratcheted by lessonAtomAttribution.test.ts (B068) and are burned
        // down per vocab pack — double-pinning them here would make every
        // pack landing edit two pins.
        !h.file.endsWith("courseAtoms.ts"),
    );
    // Pin measured 2026-07-29 twice (stable across the m11 pack churn).
    // Composition at pin time (26): QaTestDrivePage.tsx old-course deep
    // links (22), katakanaRows.ts row-a lessonId "ja-m3-1-1" (1),
    // reviewTailSrs.ts doc-comment example (1), mockCourse.ts side-quest
    // unlockAfter "ja-m2-complete" (2). Fix those, lower the pin; never
    // raise it.
    const MAX_DEAD_QUOTED_IN_SRC = 26;
    const rendered = offenders.map((h) => `${h.file}:${h.line} ${h.token}`);
    expect(
      rendered.length,
      "Dead lesson ids in src string literals — these silently disable the " +
        "behavior keyed on them. Fix the reference, don't raise the pin.\n" +
        rendered.join("\n"),
    ).toBeLessThanOrEqual(MAX_DEAD_QUOTED_IN_SRC);
  });

  it("report: bucketed dump when STALE_REPORT=1", () => {
    if (!process.env.STALE_REPORT) return;
    const dead = hits.filter((h) => h.bucket === "dead");
    const lines = [
      `dead lesson-id-shaped tokens (non-archive): ${dead.length}`,
      `  of which historical-record files: ${dead.filter((h) => h.historical).length}`,
      `registered-but-off-map tokens: ${hits.filter((h) => h.bucket === "registered-off-map").length}`,
      `dynamic-dormant (ja-mN-review-1/2) tokens: ${hits.filter((h) => h.bucket === "dynamic-dormant").length}`,
      "",
      "## DEAD — live-claim surfaces (fix these)",
      ...dead.filter((h) => !h.historical).map((h) => `${h.file}:${h.line}\t${h.token}${h.quoted ? "\t[quoted]" : ""}`),
      "",
      "## DEAD — historical-record files (leave unless the doc claims currency)",
      ...dead.filter((h) => h.historical).map((h) => `${h.file}:${h.line}\t${h.token}`),
      "",
      "## dynamic-dormant + registered-off-map",
      ...hits
        .filter((h) => h.bucket !== "dead")
        .map((h) => `${h.file}:${h.line}\t${h.token}\t[${h.bucket}]`),
    ];
    fs.writeFileSync("/tmp/ja-stale-lesson-ids.txt", lines.join("\n"));
    expect(true).toBe(true);
  });
});
