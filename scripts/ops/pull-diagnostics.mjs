#!/usr/bin/env node
// Pull one "Send diagnostics" document back out of CloudWatch by its
// 6-char code (A3b, 2026-09-17 — the Sync panel's "Send diagnostics"
// button shows this as "Tell Spencer: K7P4QX").
//
// Usage: node scripts/ops/pull-diagnostics.mjs <CODE>
// Needs an active AWS SSO session (see docs/aws-access-and-cost-guardrails.md)
// with read access to CloudWatch Logs — no write/IAM permissions needed.
//
// The server (lingo-core's app/telemetry/router.py::report_client_diagnostics)
// logs ONE JSON line per diagnostics POST to the `lingo.client_diag` logger
// (log group /aws/lambda/lingo-core, region us-west-1), keyed by this same
// code. This script greps that line back out with `aws logs
// filter-log-events` and writes the parsed JSON to
// artifacts/diagnostics/<CODE>.json (gitignored — see .gitignore's
// `artifacts/` entry).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOG_GROUP = "/aws/lambda/lingo-core";
const REGION = "us-west-1";
// Matches the server's alphabet (app/telemetry/router.py's
// DIAGNOSTICS_CODE_ALPHABET) — no 0/O/1/I. Case-insensitive on input since
// a human reading the code aloud may transcribe it lowercase.
const CODE_RE = /^[2-9A-HJ-NP-Z]{6}$/i;

const rawCode = process.argv[2];
if (!rawCode) {
  console.error("Usage: node scripts/ops/pull-diagnostics.mjs <CODE>");
  process.exit(1);
}
const code = rawCode.trim().toUpperCase();
if (!CODE_RE.test(code)) {
  console.error(`"${rawCode}" doesn't look like a diagnostics code (expected 6 chars, alphabet 2-9A-HJ-NP-Z — no 0/O/1/I).`);
  process.exit(1);
}

const outDir = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), "artifacts", "diagnostics");
mkdirSync(outDir, { recursive: true });

// `filter-log-events` with two quoted terms ANDs them (both substrings
// must appear on the line) — this narrows to `lingo.client_diag` lines
// that also mention this exact code, without needing a time window (the
// log group's own retention is the bound — see the observability doc).
const filterPattern = `"lingo.client_diag" "${code}"`;

let raw;
try {
  raw = execFileSync(
    "aws",
    [
      "logs",
      "filter-log-events",
      "--log-group-name",
      LOG_GROUP,
      "--filter-pattern",
      filterPattern,
      "--region",
      REGION,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (err) {
  console.error("aws logs filter-log-events failed — is the AWS SSO session active? (aws sso login)");
  console.error(err.stderr?.toString?.() ?? err.message);
  process.exit(1);
}

const { events } = JSON.parse(raw);
if (!events || events.length === 0) {
  console.error(`No lingo.client_diag line found for ${code} in ${LOG_GROUP} (${REGION}).`);
  console.error("The code is only ever logged once, at send time — if this was a while ago, check the log group's retention.");
  process.exit(1);
}

// Each event's `message` is the raw log line: `_configure_logging()`
// (lingo-core/app/main.py) formats every line as
// "%(asctime)s  %(name)s  %(message)s", and the logger call itself is
// `logger.warning(json.dumps(payload))` — so the JSON payload is
// everything from the first "{" onward, regardless of what Lambda/
// CloudWatch prepend ahead of it.
const docs = [];
for (const event of events) {
  const line = event.message ?? "";
  const braceIdx = line.indexOf("{");
  if (braceIdx === -1) continue;
  try {
    const payload = JSON.parse(line.slice(braceIdx));
    if (payload.code === code) docs.push(payload);
  } catch {
    // Not a parseable JSON tail — skip rather than crash the pull.
  }
}

if (docs.length === 0) {
  console.error(`Found ${events.length} matching log line(s) for ${code}, but none parsed as a lingo.client_diag payload with that exact code.`);
  process.exit(1);
}
// The code is server-generated fresh per request (see DIAGNOSTICS_CODE_ALPHABET's
// docstring) — a collision within the log group's retention window is
// possible but vanishingly unlikely; if it ever happens, keep the LAST
// (most recent) match rather than silently merging.
const doc = docs[docs.length - 1];
if (docs.length > 1) {
  console.error(`Warning: ${docs.length} lines matched code ${code} — using the most recent one.`);
}

const outPath = join(outDir, `${code}.json`);
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`Wrote ${outPath}`);
console.log(
  `device=${JSON.stringify(doc.device)}  sessionLog=${doc.sessionLog?.length ?? 0} events  hasLayoutTrace=${Boolean(doc.layoutTrace)}  hasTapReplay=${Boolean(doc.tapReplay)}  lastRequestId=${doc.lastRequestId ?? "-"}`,
);
