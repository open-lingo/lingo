// Tests for the code-reference auditor — catches CLAUDE.md / docs citing source
// paths that no longer resolve (the romaji→romanization rename class of drift).
//
// The pure core `auditCodeRefs` takes the doc text + the set of repo-relative
// paths that exist + a map of sibling-repo paths, and partitions every code
// reference it finds into: ok (resolves in-repo), crossRepo (resolves in a named
// sibling repo — fine), placeholder (glob / <slot> / mN template — not a real
// link), and missing (a real citation that resolves nowhere — real drift).
//
// Doctrine: this is DETERMINISTIC ground truth. No model in the path.
import { test } from "node:test";
import assert from "node:assert/strict";
import { auditCodeRefs, extractCodeRefs, isCodePlaceholder } from "./code-ref-audit.mjs";

const REPO = [
  "src/shared/settings/romanizationAutoFlip.ts",
  "src/features/lesson/data/moduleCompiler.ts",
  "scripts/compile-ir.mjs",
];
const SIBLINGS = { "lingo-data": ["pipeline/tts/generate.py"] };

test("extractCodeRefs pulls only backticked source paths", () => {
  const refs = extractCodeRefs(
    "See `src/foo/bar.ts` and `baz.tsx`, run `scripts/x.mjs`, style in `a.css`, " +
      "and `pipeline/tts/generate.py`. Ignore prose and `not_a_path` and `Foo.bar()`.",
  );
  assert.ok(refs.includes("src/foo/bar.ts"));
  assert.ok(refs.includes("baz.tsx"));
  assert.ok(refs.includes("scripts/x.mjs"));
  assert.ok(refs.includes("a.css"));
  assert.ok(refs.includes("pipeline/tts/generate.py"));
  assert.ok(!refs.includes("not_a_path"));
  assert.ok(!refs.includes("Foo.bar()"));
});

test("extractCodeRefs survives code fences / backtick imbalance and finds later inline paths", () => {
  // A triple-backtick fence + an odd inline backtick earlier must not desync the
  // span pairing so that a clean `path.ts` later in the doc goes unseen.
  const text =
    "Example:\n```ts\nconst x = `template`;\n```\n" +
    "Then read `src/shared/settings/romanizationAutoFlip.ts` for the constants.";
  const refs = extractCodeRefs(text);
  assert.ok(
    refs.includes("src/shared/settings/romanizationAutoFlip.ts"),
    `expected the post-fence path; got ${JSON.stringify(refs)}`,
  );
});

test("extractCodeRefs finds a path embedded in a multi-word inline span", () => {
  const refs = extractCodeRefs("Compile with `node scripts/compile-ir.mjs mN` first.");
  assert.ok(refs.includes("scripts/compile-ir.mjs"), `got ${JSON.stringify(refs)}`);
});

test("extractCodeRefs preserves leading underscores (_archive, _consonantRowHelpers)", () => {
  // Underscore-prefixed files are common here; the surrounding-punctuation trim
  // must NOT strip a leading `_` (it is Unicode connector punctuation).
  const refs = extractCodeRefs("see `_consonantRowHelpers.ts` and `_archive/m17.ts`.");
  assert.ok(refs.includes("_consonantRowHelpers.ts"), `got ${JSON.stringify(refs)}`);
  assert.ok(refs.includes("_archive/m17.ts"), `got ${JSON.stringify(refs)}`);
});

test("isCodePlaceholder flags globs, angle slots, and mN/mX templates", () => {
  assert.equal(isCodePlaceholder("languages/ja/curriculum/m*.ts"), true);
  assert.equal(isCodePlaceholder("features/<domain>/foo.ts"), true);
  assert.equal(isCodePlaceholder("curriculum/mN.ir.yaml"), true);
  assert.equal(isCodePlaceholder("curriculum/mX-neo.ts"), true);
  assert.equal(isCodePlaceholder("src/shared/settings/romanizationAutoFlip.ts"), false);
});

test("a renamed file is MISSING (real drift), the real name is OK", () => {
  const doc =
    "Read the constants in `shared/settings/romajiAutoFlip.ts`. " +
    "The real module is `src/shared/settings/romanizationAutoFlip.ts`.";
  const r = auditCodeRefs({ docText: doc, repoFiles: REPO, siblingRepos: SIBLINGS });
  const missing = r.missing.map((m) => m.ref);
  const ok = r.ok.map((m) => m.ref);
  assert.ok(missing.includes("shared/settings/romajiAutoFlip.ts"));
  assert.ok(ok.includes("src/shared/settings/romanizationAutoFlip.ts"));
});

test("a citation resolves by path SUFFIX (docs cite partial paths)", () => {
  // CLAUDE.md often writes `shared/settings/romanizationAutoFlip.ts` (no src/).
  const r = auditCodeRefs({
    docText: "`shared/settings/romanizationAutoFlip.ts`",
    repoFiles: REPO,
    siblingRepos: SIBLINGS,
  });
  assert.equal(r.missing.length, 0);
  assert.equal(r.ok.length, 1);
});

test("a cross-repo path is crossRepo, not missing", () => {
  const r = auditCodeRefs({
    docText: "TTS gen lives in `pipeline/tts/generate.py`.",
    repoFiles: REPO,
    siblingRepos: SIBLINGS,
  });
  assert.equal(r.missing.length, 0);
  assert.equal(r.crossRepo.map((m) => m.ref).includes("pipeline/tts/generate.py"), true);
});

test("a sibling-repo path written WITH the repo-name prefix resolves as crossRepo", () => {
  // CLAUDE.md cites the other repo as `lingo-core/app/srs/schemas.py`, but the
  // sibling's own file list is repo-relative ("app/srs/schemas.py"). The audit
  // must strip a leading "<repoName>/" before matching, or it false-positives.
  const r = auditCodeRefs({
    docText: "Backend mirror: `lingo-core/app/srs/schemas.py`.",
    repoFiles: REPO,
    siblingRepos: { "lingo-core": ["app/srs/schemas.py"] },
  });
  assert.equal(r.missing.length, 0, `false positive: ${JSON.stringify(r.missing)}`);
  assert.ok(r.crossRepo.map((m) => m.ref).includes("lingo-core/app/srs/schemas.py"));
});

test("placeholders are partitioned out, never counted missing", () => {
  const r = auditCodeRefs({
    docText: "Content in `languages/ja/curriculum/m*.ts` and `features/<domain>/x.ts`.",
    repoFiles: REPO,
    siblingRepos: SIBLINGS,
  });
  assert.equal(r.missing.length, 0);
  assert.equal(r.placeholders.length, 2);
});

test("a missing ref carries a nearest-basename hint when one exists", () => {
  const r = auditCodeRefs({
    docText: "`shared/settings/romajiAutoFlip.ts`",
    repoFiles: REPO,
    siblingRepos: SIBLINGS,
  });
  const m = r.missing.find((x) => x.ref === "shared/settings/romajiAutoFlip.ts");
  assert.ok(m);
  // same basename stem family → suggest the renamed file
  assert.ok(m.nearest && m.nearest.endsWith("romanizationAutoFlip.ts"));
});

test("clean doc with only resolvable refs yields zero missing", () => {
  const r = auditCodeRefs({
    docText: "`src/features/lesson/data/moduleCompiler.ts` and `scripts/compile-ir.mjs`.",
    repoFiles: REPO,
    siblingRepos: SIBLINGS,
  });
  assert.equal(r.missing.length, 0);
  assert.equal(r.ok.length, 2);
});
