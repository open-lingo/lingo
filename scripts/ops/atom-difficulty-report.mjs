#!/usr/bin/env node
// Weekly per-word difficulty report (T7, lane STATS, 2026-09-18).
//
// Spencer: "how often do people fail X word, how easy are others…
// more statistical data tracking here is future scope but answers this
// better than we can." This reads the `lingo.atom_outcome` CloudWatch
// stream lingo-core's `POST /telemetry/outcomes` writes (see
// `../../docs/atom-outcome-telemetry-2026-09-18.md` for the full event
// contract) and prints a table of the hardest words (by fail rate,
// n >= 20) plus the 10 easiest.
//
// Usage: node scripts/ops/atom-difficulty-report.mjs [--days 7] [--lang ja]
// Needs an active AWS SSO session (see docs/aws-access-and-cost-guardrails.md)
// with read access to CloudWatch Logs — no write/IAM permissions needed.
//
// NOT RUN LIVE by this lane — AWS SSO was expired at authoring time. The
// query builder (`buildOutcomesQuery`) and table formatter
// (`formatDifficultyTable`) below are unit-tested on a fixture
// (`atom-difficulty-report.test.mjs`); the `aws logs start-query`/
// `get-query-results` round trip in `main()` is exercised only by that
// manual "run it for real once SSO is back" step — same caveat
// `pull-diagnostics.mjs` carries for its own `aws` calls.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const LOG_GROUP = "/aws/lambda/lingo-core";
export const REGION = "us-west-1";
export const DEFAULT_MIN_N = 20;
export const DEFAULT_DAYS = 7;
export const EASIEST_COUNT = 10;

/**
 * Build the Logs Insights query string. One query answers both halves of
 * the report (hardest + easiest) — the JS formatter below does the
 * sort/slice on the full result set rather than issuing two queries.
 *
 * `atomIds` rides the log line as a JSON array (never answer text — see
 * `AtomOutcomeItem`'s no-free-text contract), so this uses Insights'
 * `unnest` command (confirmed against AWS's own docs, 2026-09-18 —
 * `fields jsonParse(...) as list | unnest list into item`) to explode one
 * event into one row per atom it exercised before aggregating — a step
 * that exercises 2 atoms counts toward both.
 *
 * `sum(correct = "false")` for the fail count is the standard CloudWatch
 * Insights conditional-count idiom (boolean coerces to 0/1 in a numeric
 * aggregation) — UNVERIFIED against a real result set by this lane (SSO
 * expired); spot-check the first real run's `fails`/`attempts` against a
 * hand count before trusting the fail-rate column.
 *
 * `pct(msToAnswer, 50)` is the median — Insights has no `median()`
 * function, `pct(field, 50)` is its documented equivalent.
 */
export function buildOutcomesQuery({ lang } = {}) {
  const langFilter = lang ? `\n| filter lang = "${lang}"` : "";
  return [
    "fields @timestamp, @message",
    '| filter @message like /"type": "atom_outcome"/' + langFilter,
    '| parse @message /"lang":\\s*"(?<lang>[^"]*)"/',
    '| parse @message /"correct":\\s*(?<correct>true|false)/',
    '| parse @message /"msToAnswer":\\s*(?<msToAnswer>\\d+)/',
    '| parse @message /"atomIds":\\s*(?<atomIdsJson>\\[[^\\]]*\\])/',
    "| fields jsonParse(atomIdsJson) as atomIdsList",
    "| unnest atomIdsList into atomId",
    "| stats count() as attempts, sum(correct = \"false\") as fails, pct(msToAnswer, 50) as medianMs by atomId, lang",
    "| sort attempts desc",
    "| limit 1000",
  ].join("\n");
}

/**
 * `aws logs get-query-results` returns `{results: [[{field, value}, ...], ...]}`.
 * Flatten each row into a plain object and coerce the numeric columns —
 * every value comes back as a string from the CLI's JSON.
 */
export function parseInsightsResults(raw) {
  const results = raw?.results ?? [];
  return results.map((row) => {
    const obj = {};
    for (const { field, value } of row) obj[field] = value;
    return {
      atomId: obj.atomId ?? "",
      lang: obj.lang ?? "",
      attempts: Number(obj.attempts ?? 0),
      fails: Number(obj.fails ?? 0),
      medianMs: Number(obj.medianMs ?? 0),
    };
  });
}

/**
 * Pure formatter: rows -> `{ hardest, easiest, table }`. Filters to
 * `n >= minN` itself (defense in depth — correct even if a future query
 * variant stops filtering server-side), sorts hardest-first by fail rate
 * (ties broken by attempts desc — more data first), and takes the
 * `easiestCount` lowest-fail-rate rows for the second table.
 */
export function formatDifficultyTable(
  rows,
  { minN = DEFAULT_MIN_N, easiestCount = EASIEST_COUNT } = {},
) {
  const eligible = rows
    .filter((r) => r.attempts >= minN)
    .map((r) => ({ ...r, failRate: r.attempts > 0 ? r.fails / r.attempts : 0 }));

  const hardest = [...eligible].sort(
    (a, b) => b.failRate - a.failRate || b.attempts - a.attempts,
  );
  const easiest = [...eligible]
    .sort((a, b) => a.failRate - b.failRate || b.attempts - a.attempts)
    .slice(0, easiestCount);

  const table = renderTable(hardest);
  const easiestTable = renderTable(easiest, { heading: `\n10 easiest (n >= ${minN}):` });

  return { hardest, easiest, table: table + easiestTable };
}

function renderTable(rows, { heading } = {}) {
  const header = "atomId".padEnd(32) + "lang".padEnd(6) + "n".padStart(6) + "  fail%".padStart(8) + "  medianMs".padStart(11);
  const lines = rows.map((r) => {
    const failPct = (r.failRate * 100).toFixed(1) + "%";
    return (
      r.atomId.padEnd(32) +
      r.lang.padEnd(6) +
      String(r.attempts).padStart(6) +
      failPct.padStart(8) +
      String(r.medianMs).padStart(11)
    );
  });
  const body = [header, ...lines].join("\n");
  return heading ? `${heading}\n${body}` : body;
}

// ── CLI entry (not covered by the fixture tests) ────────────────────────

function parseArgs(argv) {
  let days = DEFAULT_DAYS;
  let lang;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--days") days = Number(argv[++i]);
    else if (argv[i] === "--lang") lang = argv[++i];
  }
  return { days, lang };
}

async function main() {
  const { days, lang } = parseArgs(process.argv.slice(2));
  const query = buildOutcomesQuery({ lang });
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - days * 24 * 60 * 60;

  console.log(`Query (paste into CloudWatch Logs Insights console, log group ${LOG_GROUP}, region ${REGION}):\n`);
  console.log(query);
  console.log("");

  let queryId;
  try {
    const startRaw = execFileSync(
      "aws",
      [
        "logs",
        "start-query",
        "--log-group-name",
        LOG_GROUP,
        "--start-time",
        String(startTime),
        "--end-time",
        String(endTime),
        "--query-string",
        query,
        "--region",
        REGION,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    queryId = JSON.parse(startRaw).queryId;
  } catch (err) {
    console.error("aws logs start-query failed — is the AWS SSO session active? (aws sso login)");
    console.error(err.stderr?.toString?.() ?? err.message);
    process.exit(1);
  }

  // Poll until Complete. CloudWatch queries typically finish in a few
  // seconds for a 7-day window at this log group's volume; 30 attempts *
  // 2s = 1 minute ceiling before giving up.
  let raw;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const resultsRaw = execFileSync(
      "aws",
      ["logs", "get-query-results", "--query-id", queryId, "--region", REGION],
      { encoding: "utf8" },
    );
    raw = JSON.parse(resultsRaw);
    if (raw.status === "Complete") break;
    if (raw.status === "Failed" || raw.status === "Cancelled") {
      console.error(`Query ${raw.status}: ${JSON.stringify(raw)}`);
      process.exit(1);
    }
  }
  if (raw?.status !== "Complete") {
    console.error(`Query did not complete within the polling window (last status: ${raw?.status}).`);
    process.exit(1);
  }

  const rows = parseInsightsResults(raw);
  const { hardest, table } = formatDifficultyTable(rows);
  console.log(table);

  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), "artifacts", "atom-difficulty");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${dateStr}-${lang ?? "all"}.json`);
  writeFileSync(outPath, JSON.stringify({ days, lang: lang ?? null, generatedAt: new Date().toISOString(), rows: hardest }, null, 2));
  console.log(`\nWrote ${outPath}`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
