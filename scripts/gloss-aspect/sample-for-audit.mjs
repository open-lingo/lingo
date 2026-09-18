#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — Step 3 prep: build the Sonnet/lead-audit
 * sample. Mechanical, deterministic sampling only — the actual judgment
 * (agree/disagree) is done by hand.
 *
 * Pulls 30 rows from <lang>-findings.json: up to 24 "mismatch" verdicts
 * (stratified by form, proportional, min 1 per form present) + the rest
 * "ok" verdicts, to a total of 30 — so the audit measures both false
 * positives (an "ok" that's really wrong) and false negatives coverage
 * risk isn't invisible.
 *
 * Usage: node scripts/gloss-aspect/sample-for-audit.mjs ja
 */
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts/gloss-aspect");
const SAMPLE_SIZE = 30;

const SEED = 20260918;
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stratifiedMismatchSample(mismatches, n) {
  const byForm = new Map();
  for (const m of mismatches) {
    if (!byForm.has(m.form)) byForm.set(m.form, []);
    byForm.get(m.form).push(m);
  }
  const forms = [...byForm.keys()];
  const perForm = Math.max(1, Math.floor(n / Math.max(forms.length, 1)));
  const sample = [];
  for (const f of forms) {
    sample.push(...shuffle(byForm.get(f)).slice(0, perForm));
  }
  // top up / trim to exactly n (or as many as exist)
  if (sample.length < n) {
    const used = new Set(sample.map((s) => `${s.lessonId}|${s.ja}|${s.form}`));
    const rest = shuffle(mismatches.filter((m) => !used.has(`${m.lessonId}|${m.ja}|${m.form}`)));
    for (const r of rest) {
      if (sample.length >= n) break;
      sample.push(r);
    }
  }
  return shuffle(sample).slice(0, Math.min(n, sample.length));
}

function main() {
  const lang = process.argv[2];
  if (!lang) {
    console.error("usage: node scripts/gloss-aspect/sample-for-audit.mjs <lang>");
    process.exit(1);
  }
  const findingsFile = path.join(ARTIFACTS_DIR, `${lang}-findings.json`);
  if (!fs.existsSync(findingsFile)) {
    console.error(`sample-for-audit.mjs: no findings file at ${findingsFile} — run judge.mjs first`);
    process.exit(1);
  }
  const findings = JSON.parse(fs.readFileSync(findingsFile, "utf8"));
  const mismatches = findings.filter((f) => f.verdict === "mismatch");
  const oks = findings.filter((f) => f.verdict === "ok");

  const mismatchTarget = Math.min(mismatches.length, Math.round(SAMPLE_SIZE * 0.8));
  const mismatchSample = stratifiedMismatchSample(mismatches, mismatchTarget);
  const okSample = shuffle(oks).slice(0, SAMPLE_SIZE - mismatchSample.length);

  const auditRows = [...mismatchSample, ...okSample].map((f, i) => ({
    auditId: `audit-${i + 1}`,
    lessonId: f.lessonId,
    ja: f.ja,
    en: f.en,
    form: f.form,
    module: f.module,
    sourceFile: f.sourceFile,
    sourceLine: f.sourceLine,
    modelVerdict: f.verdict,
    modelRationale: f.rationale,
    modelProposedEn: f.proposed_en,
    // filled in by hand:
    leadAgree: null, // true | false
    leadNote: null,
  }));

  const outFile = path.join(ARTIFACTS_DIR, `audit-sample-${lang}.jsonl`);
  fs.writeFileSync(outFile, auditRows.map((r) => JSON.stringify(r)).join("\n") + (auditRows.length ? "\n" : ""));
  console.log(
    `sample-for-audit.mjs: ${findings.length} findings (${mismatches.length} mismatch, ${oks.length} ok) -> sampled ${mismatchSample.length} mismatch + ${okSample.length} ok = ${auditRows.length} rows -> ${outFile}`,
  );
}

main();
