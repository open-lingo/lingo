#!/usr/bin/env node
/**
 * Naturalness sweep — APPLY phase, Step 1: deterministic triage.
 *
 * NO MODEL CALLS. Reads rows-<set>.jsonl + verdicts-<set>.jsonl (as judged by
 * scripts/naturalness/judge.mjs) and splits every verdict="fix" row into
 * three buckets, based on what a 161-row Sonnet audit of the local judge
 * measured (see docs/spencer-product-sentiment.md "Japanese content" for the
 * product rules the judge is scoring against):
 *
 *   - "fix" precision overall ~42%
 *   - structure precision 28%, and within structure, any reason claiming the
 *     English gloss adds/invents a subject, object, possessive or article
 *     not in the Japanese is ~93% FALSE (the "fix" strips a required English
 *     function word and produces a fragment) — REJECT that specific claim
 *     shape, not the whole issue type.
 *   - register precision 50%; it wrongly flags grammatical-derivation
 *     parentheticals ("(on purpose)" for てある, "(affectionate)" for -ちゃん,
 *     "(familiar)" for -くん) as register notes. Real register bake-ins read
 *     "(polite)", "(to a teacher)", "Say politely:" — those are TRUE fixes.
 *   - british precision 86%; its one false class is "university" (fine US
 *     English) — everything else (shop→store, mobile→cell phone, ill→sick,
 *     haven't got→don't have, practise→practice, ...) applies clean.
 *   - verb-choice precision 100% (n=5, small sample, still auto-applies).
 *   - unnatural-ja precision 25% — it hallucinates errors on valid grammar.
 *     NEVER apply; always reject.
 *   - ~15% of rows carry a confidence value outside [0,1] (3/4/5 — the model
 *     emitting a 1-5 Likert scale instead of a 0-1 probability). For the two
 *     lowest-precision issue types plus register (structure/gloss/register)
 *     we don't trust a row we can't even trust the confidence field on;
 *     british/verb-choice are kept regardless (86%/100% precision, and the
 *     leak is orthogonal to what makes those two reliable).
 *
 * Usage:
 *   node scripts/naturalness/triage.mjs sentences
 *   node scripts/naturalness/triage.mjs words
 *
 * Reads:  <OUT_DIR>/rows-{words,sentences}.jsonl
 *         <OUT_DIR>/verdicts-{words,sentences}.jsonl (read AS-IS — the words
 *         file may still be growing under a concurrent judge.mjs re-run;
 *         this script takes whatever is on disk at read time and reports the
 *         count it saw, it does not wait or retry).
 * Writes: <OUT_DIR>/apply/mechanical-<set>.jsonl
 *         <OUT_DIR>/apply/rejected-<set>.jsonl
 *         <OUT_DIR>/apply/review-<set>.jsonl
 *         <OUT_DIR>/apply/triage-summary.json (merged across both sets if
 *         both have been run; this run's set is (re)written into it)
 *
 * No repo edits. Reads only the read-only extracted rows + judge verdicts.
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";
const APPLY_DIR = path.join(OUT_DIR, "apply");

// ---------------------------------------------------------------------------
// Classification rules
// ---------------------------------------------------------------------------

// Structure reasons claiming the EN gloss adds/invents a subject, object, or
// possessive it names explicitly ("adding 'I'", "does not contain a
// possessive 'my'", "lacks a subject", "violates Rule 3") OR an added
// article ("adding 'the'/'a'"). Verified against the actual 669 structure
// reasons in verdicts-sentences.jsonl: 355/669 (53%) match this shape; the
// other 314 are different structure complaints (added adverbial phrase,
// wrong tense/mood, wrong nuance) that the audit did NOT characterize as
// systematically false, so those still go to human review.
const STRUCTURE_STRIP_RE = new RegExp(
  "\\b(subject|object|possessive)\\b" +
    "|adding\\s+['\"]?(i|my|the|a|an)['\"]?\\b" +
    "|does(?:n't| not) contain\\s+(?:a |the )?['\"]?(i|my|the|a|an|subject|object|possessive)" +
    "|lacks?\\s+(?:a |the )?subject" +
    "|violates rule 3\\b",
  "i",
);

// Register reasons that flag a parenthetical naming a grammatical derivation
// or sense/nuance (not a formality/politeness level). Built from what
// actually appears in the data (checked both sets): "on purpose" (てある),
// "familiar" (-くん), "affectionate" (-ちゃん) — 3 rows, all in sentences.
// "honorific form" / "casual form" / "plain form" are also in scope per the
// brief but occur 0 times in the current data (verified) — kept in the
// regex so a future judge run that produces them is still caught. NOTE: bare
// "(honorific)" / "(polite)" / "(casual)" — without "form" — are NOT in this
// list on purpose: every such row in the data reads exactly like the
// confirmed-true "(polite)"/"(to a teacher)" pattern (a plain politeness
// note baked into the gloss), so they are real fixes, not this false class.
const REGISTER_GRAMMAR_PARENTHETICAL_RE =
  /\bon purpose\b|\bdeliberately\b|\bfamiliar\b|\baffectionate\b|\bhonorific form\b|\bcasual form\b|\bplain form\b/i;

// The audit's one false class inside "british": flagging "university" as
// British when it's fine US English. Everything else in the british issue
// (shop→store, mobile→cell phone, ill→sick, haven't got→don't have,
// practise→practice, exercise book→notebook, etc.) is real and mechanical.
const BRITISH_UNIVERSITY_RE = /\buniversity\b/i;

const MECHANICAL_ISSUES = new Set(["british", "verb-choice"]);
const CONFIDENCE_SENSITIVE_ISSUES = new Set(["structure", "gloss", "register"]);

function isBadConfidence(c) {
  return !(typeof c === "number" && !Number.isNaN(c) && c >= 0 && c <= 1);
}

function norm(s) {
  return (s ?? "").trim();
}

/** Returns { bucket: "mechanical"|"rejected"|"review", rejectReason? } */
function classify(row, v) {
  const replEn = norm(v.replacement_en);
  const en = norm(row.en);
  const replJa = norm(v.replacement_ja);
  const ja = norm(row.ja);

  // no-op: the "fix" doesn't actually change anything.
  if (replEn === en && (replJa === "" || replJa === ja)) {
    return { bucket: "rejected", rejectReason: "no-op: replacement_en equals en and replacement_ja is empty/unchanged" };
  }

  if (v.issue === "unnatural-ja") {
    return {
      bucket: "rejected",
      rejectReason: "issue=unnatural-ja: 25% precision, judge hallucinates errors on valid grammar — never apply",
    };
  }

  if (v.issue === "structure" && STRUCTURE_STRIP_RE.test(v.reason ?? "")) {
    return {
      bucket: "rejected",
      rejectReason:
        "structure: reason claims EN adds/invents a subject/object/possessive/article not in the JA — 93% FALSE per audit, replacement strips a required English function word and produces a fragment",
    };
  }

  if (isBadConfidence(v.confidence) && CONFIDENCE_SENSITIVE_ISSUES.has(v.issue)) {
    return {
      bucket: "rejected",
      rejectReason: `confidence ${JSON.stringify(v.confidence)} outside [0,1] on issue=${v.issue} (structure/gloss/register only — british/verb-choice are kept regardless)`,
    };
  }

  if (v.issue === "register" && REGISTER_GRAMMAR_PARENTHETICAL_RE.test(v.reason ?? "")) {
    return {
      bucket: "rejected",
      rejectReason:
        "register: parenthetical names a grammatical derivation/sense (on purpose / familiar / affectionate / honorific form / casual form / plain form), not a politeness level — judge conflated a real distinguisher with register",
    };
  }

  if (MECHANICAL_ISSUES.has(v.issue) && replEn !== "" && replEn !== en && replJa === "") {
    if (v.issue === "british" && BRITISH_UNIVERSITY_RE.test(v.reason ?? "")) {
      // The one british exclusion — falls through to review.
    } else {
      return { bucket: "mechanical" };
    }
  }

  return { bucket: "review" };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

function main() {
  const setName = process.argv[2];
  if (!["sentences", "words"].includes(setName)) {
    console.error("usage: node triage.mjs <words|sentences>");
    process.exit(1);
  }

  fs.mkdirSync(APPLY_DIR, { recursive: true });

  const rowsFile = path.join(OUT_DIR, `rows-${setName}.jsonl`);
  const verdictsFile = path.join(OUT_DIR, `verdicts-${setName}.jsonl`);
  const rows = loadJsonl(rowsFile);
  const verdicts = loadJsonl(verdictsFile);
  console.log(
    `triage.mjs[${setName}]: read ${rows.length} rows, ${verdicts.length} verdicts (read as-is; a concurrent judge.mjs run may still be appending)`,
  );

  const rowById = new Map(rows.map((r) => [r.id, r]));

  const mechanical = [];
  const rejected = [];
  const review = [];
  let missingRow = 0;
  let passCount = 0;

  for (const v of verdicts) {
    if (v.verdict !== "fix") {
      passCount++;
      continue;
    }
    const row = rowById.get(v.row_id);
    if (!row) {
      missingRow++;
      continue;
    }
    const { bucket, rejectReason } = classify(row, v);
    const base = {
      row_id: v.row_id,
      module: row.module,
      lesson: row.lesson,
      sourceFile: row.sourceFile,
      sourceLine: row.sourceLine ?? null, // present for words rows, absent (null) for sentences rows
      issue: v.issue,
      ja: row.ja,
      en: row.en,
      neighbours: row.neighbours,
      replacement_en: v.replacement_en,
      replacement_ja: v.replacement_ja,
      confidence: v.confidence,
      reason: v.reason,
    };
    if (bucket === "mechanical") mechanical.push(base);
    else if (bucket === "rejected") rejected.push({ ...base, rejectReason });
    else review.push(base);
  }

  review.sort((a, b) => (a.module === b.module ? a.row_id.localeCompare(b.row_id) : a.module.localeCompare(b.module)));
  mechanical.sort((a, b) => a.row_id.localeCompare(b.row_id));
  rejected.sort((a, b) => a.row_id.localeCompare(b.row_id));

  const writeJsonl = (file, arr) =>
    fs.writeFileSync(file, arr.map((o) => JSON.stringify(o)).join("\n") + (arr.length ? "\n" : ""));

  writeJsonl(path.join(APPLY_DIR, `mechanical-${setName}.jsonl`), mechanical);
  writeJsonl(path.join(APPLY_DIR, `rejected-${setName}.jsonl`), rejected);
  writeJsonl(path.join(APPLY_DIR, `review-${setName}.jsonl`), review);

  // ---- summary ----
  const fixRows = mechanical.length + rejected.length + review.length;
  const byIssue = {};
  for (const arr of [mechanical, rejected, review]) {
    for (const r of arr) {
      byIssue[r.issue] ??= { mechanical: 0, rejected: 0, review: 0 };
    }
  }
  for (const r of mechanical) byIssue[r.issue].mechanical++;
  for (const r of rejected) byIssue[r.issue].rejected++;
  for (const r of review) byIssue[r.issue].review++;

  const rejectedByReason = {};
  for (const r of rejected) {
    const key = r.rejectReason.split(":")[0].split("(")[0].trim();
    rejectedByReason[key] = (rejectedByReason[key] ?? 0) + 1;
  }

  const reviewByModule = {};
  for (const r of review) reviewByModule[r.module] = (reviewByModule[r.module] ?? 0) + 1;

  console.log(`\ntriage.mjs[${setName}]: total verdicts=${verdicts.length}  pass=${passCount}  fix=${fixRows}  missingRow=${missingRow}`);
  console.log(`  mechanical=${mechanical.length}  rejected=${rejected.length}  review=${review.length}  (sum=${mechanical.length + rejected.length + review.length})`);
  console.log("\n  per-issue breakdown:");
  console.log("  issue        mechanical  rejected  review  total");
  for (const [issue, c] of Object.entries(byIssue).sort()) {
    const total = c.mechanical + c.rejected + c.review;
    console.log(`  ${issue.padEnd(12)} ${String(c.mechanical).padStart(10)}  ${String(c.rejected).padStart(8)}  ${String(c.review).padStart(6)}  ${total}`);
  }
  console.log("\n  rejected by reason:");
  for (const [reason, n] of Object.entries(rejectedByReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${reason}`);
  }
  console.log("\n  review by module (top 15):");
  for (const [mod, n] of Object.entries(reviewByModule).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${String(n).padStart(4)}  ${mod}`);
  }

  // Merge into a combined triage-summary.json (one entry per set, so running
  // sentences then words doesn't clobber the other set's summary).
  const summaryFile = path.join(APPLY_DIR, "triage-summary.json");
  const summary = fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, "utf8")) : {};
  summary[setName] = {
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    totalVerdicts: verdicts.length,
    pass: passCount,
    fix: fixRows,
    missingRow,
    mechanical: mechanical.length,
    rejected: rejected.length,
    review: review.length,
    byIssue,
    rejectedByReason,
    reviewByModule,
  };
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`\ntriage.mjs[${setName}]: wrote apply/mechanical-${setName}.jsonl, apply/rejected-${setName}.jsonl, apply/review-${setName}.jsonl, apply/triage-summary.json`);

  // Sanity: no row_id in two buckets.
  const ids = new Set();
  let dupes = 0;
  for (const arr of [mechanical, rejected, review]) {
    for (const r of arr) {
      if (ids.has(r.row_id)) dupes++;
      ids.add(r.row_id);
    }
  }
  if (dupes > 0) {
    console.error(`triage.mjs[${setName}]: BUG — ${dupes} row_id(s) appeared in more than one bucket`);
    process.exit(1);
  }
  if (mechanical.length + rejected.length + review.length !== fixRows) {
    console.error(`triage.mjs[${setName}]: BUG — bucket counts don't sum to fix count`);
    process.exit(1);
  }
}

main();
