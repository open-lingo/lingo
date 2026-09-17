/**
 * Procedural QA RATCHET gate (2026-09-17 project review — lane A7 drafted
 * the questions, lane A7b converted this into a ratchet and corrected Q4/Q7 —
 * `docs/procedural-qa-2026-09-17.md`).
 *
 * A count may never rise (repo doctrine — `regression-classes` C7). This
 * gate runs the ENFORCED procedural-QA questions (`scripts/qa/procedural/`)
 * over every lesson in the emitted runtime JSON, PER LANGUAGE, and fails
 * ONLY when a language's enforced question's finding count EXCEEDS that
 * language's committed baseline (`proceduralQa.baseline.json`, now shaped
 * `{ja: {...}, ko: {...}, es: {...}, fr: {...}}` — lane A7e, 2026-09-17) —
 * never on the pre-existing count itself. The JA baseline and its history
 * are UNCHANGED by A7e (see the entries below this one for that history);
 * this comment only records what A7e added.
 *
 * over every JA lesson in the emitted runtime JSON and fails ONLY when an
 * enforced question's finding count EXCEEDS its committed baseline
 * (`proceduralQa.baseline.json`) — never on the pre-existing count itself.
 * That baseline is today's TRUE count, corrected 2026-09-17 (A7's original
 * 655 Q7 findings were a checker bug — the ported `hasTtsClip` mirrored only
 * `resolveTtsPath`'s direct hash lookup, not the full `getTtsUrl` fallback
 * chain every real call site uses; true count is 1, see
 * `scripts/qa/procedural/lib/ttsCoverage.mjs` and
 * `docs/procedural-qa-2026-09-17.md` §3/§4) and Q4's original 5 findings
 * were the port using a different, over-sensitive atom source than the real
 * `particleTileSeparation.test.ts` gate it claims to mirror (fixed to 0, see
 * `scripts/qa/procedural/lib/lexicon.mjs`'s `getCourseAtomSurfaces`). Q10's
 * one finding (a raw kanji in a kana-graded dialogue field, m42) was a plain
 * authoring slip, fixed in the IR — baseline 0. Q9's original 4 findings
 * (m1's ya/wa kana-row lessons, outside the 10-25 step band) were judged
 * exempt by design, not a defect (2026-09-17, lane A9 — see
 * docs/procedural-qa-2026-09-17.md): JA module 1's whole `ja-m1-<row>-<n>`
 * kana-introduction family deliberately teaches one symbol + one anchor word
 * per sub-lesson, a different lesson archetype than the vocab/grammar
 * "teaching lesson" the FR density doctrine was written for. Q9 now skips
 * that lesson-id pattern entirely (`checks/q9-step-variety.mjs`); baseline 0.
 *
 * 2026-09-17, lane A7e: ported the runner + baseline shape to KO/ES/FR
 * (`docs/procedural-qa-2026-09-17.md`'s per-language section has the full
 * precision tables and "chunk" definitions). Summary:
 *   - Q4 and Q10 are JA-only by construction (particle-tile mechanics,
 *     kanji/kana script mechanics) — always `n/a` for ko/es/fr, never
 *     counted here.
 *   - Q8 is JA-only for now (`loadIr` reads JA's IR dir unconditionally;
 *     ko has no IR compiler, es/fr have no committed `ir.json`) — `n/a`
 *     for ko/es/fr, future work per the doc §7.
 *   - Q2 (word-boundary integrity) is REDEFINED for ko/es/fr — these
 *     courses sanction multi-word tiles for fixed expressions/chunked
 *     conjugations (`es-lesson-authoring-guide.md` §14,
 *     `fr-authoring-playbook.md`), so JA's sub-word-morpheme rule doesn't
 *     port; instead it's a mechanical "do the tiles reconstruct the target
 *     sentence exactly" check (`lib/wordChunk.mjs`'s `sentenceReconstructs`,
 *     KO variant strips all whitespace since KO particles/copula attach to
 *     the preceding word with no space by normal orthography). Measured 0
 *     hits across ko/es/fr (1,610 applicable steps total) — enforced,
 *     baseline 0 for all three.
 *   - Q3 (one content word per tile) is likewise redefined
 *     (`contentWordCount`/`koContentMorphemeCount`) — ES measured 0/0
 *     (vacuous, nothing to audit); FR measured 13/13 TRUE on a full hand
 *     audit (100% precision) — enforced, baselined at 13 (pre-existing,
 *     out of this lane's file-ownership scope to fix: coherent-but-fully-
 *     compositional multi-word tiles like "mangé de gâteau", m18); KO
 *     measured 0/8 TRUE (0% precision — every hit was a grammaticalized
 *     construction Kiwi's POS tags alone can't resolve, or a legitimate
 *     idiom, the same v2-vs-v3 gap JA closed with JMdict + deconjugation,
 *     no KO equivalent exists yet) — stays INFORMATIONAL for KO only
 *     (`q3-one-content-word-per-chunk.mjs`'s `enforced` export is a
 *     per-language FUNCTION, resolved by `index.mjs`'s `resolveEnforced` —
 *     the one place in the runner that distinction is read).
 *   - Q9 ported unchanged (already language-generic) — baselined as-
 *     measured, pre-existing content debt, not fixed here: ko 191 (many
 *     short symbol/row drill lessons outside the 10-25 band, the same
 *     class as JA's 4), fr 6, es 0.
 *
 * Perf (this machine, cold — `rm -rf artifacts/qa/procedural/verdicts`
 * first): ja ~22.4s, ko ~0.8s, es ~0.8s, fr ~0.8s — combined ~24.8s local.
 * CI is ~4x slower per the JA-only comment below (~90-100s combined
 * estimate) — still under the existing 150s-per-language budget with
 * ko/es/fr's ~30s timeouts adding negligible risk. Each language is its
 * own `it()` so a timeout/failure in one doesn't hide the others.
 *
 * 2026-09-17, lane A7f — APPLICABLE FLOORS (docs/procedural-qa-2026-09-17.md
 * § Vacuity on CI): a question whose sidecar/artifact is missing has
 * `appliesTo()` return `false` for every step, so it reports 0 findings and
 * passes — green and vacuous looked identical (`prove-the-verifier-can-fail`
 * memory rule). The baseline's shape is now `{question: {max, minApplicable}}`
 * — `max` is the existing finding-count ceiling (unchanged), `minApplicable`
 * is a floor on how many steps the question actually got to grade (answered
 * "yes"/"no", not "n/a") for an ENFORCED question, ~95% of the true measured
 * count so ordinary content edits don't trip it. Below the floor fails with
 * a message naming the likely missing sidecar/artifact (`missingArtifactHint`
 * below) — this is what makes a JMdict-less or venv-less CI run red instead
 * of silently green.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import baseline from "./proceduralQa.baseline.json";

const ROOT = join(__dirname, "../..");
const RUN_SCRIPT = join(ROOT, "scripts/qa/procedural/run.mjs");
// CI runners are ~4× slower than the M5 Max (19 s local → 43 s+ on GitHub); budget for the
// full course there, so the newest-5 fallback stays the exception, not the CI default. NOT
// lowered by the verdict cache below — CI always starts cold (fresh checkout, artifacts/
// gitignored), so a cache miss pays the same cost it always did.
const FULL_RUN_TIMEOUT_MS = 150_000;
// ko/es/fr measured <1s each locally (no JA-scale sidecar warm-up cost —
// ES/FR need no subprocess for Q3 at all, KO's course is a fraction of
// JA's size); 30s is generous headroom for CI variance without eating
// into JA's dedicated budget.
const SMALL_COURSE_TIMEOUT_MS = 30_000;

type Finding = { lessonId: string; stepId: string; evidence: string[] };
type QaReport = {
  rows: {
    lessonId: string;
    stepId: string;
    stepType: string;
    results: Record<string, { answer: string; evidence: string[]; enforced: boolean }>;
  }[];
  anyEnforcedFail: boolean;
  failsByQuestion: Record<string, Finding[]>;
};

function moduleIds(lang: string): string[] {
  const manifest = JSON.parse(
    require("node:fs").readFileSync(join(ROOT, "src/pub/content/v1/manifest.json"), "utf8"),
  );
  return manifest.languages[lang].modules.map((m: { id: string }) => m.id);
}

// Output goes to a file (`--out`), not stdout: a large captured-error
// stdout has been observed truncated (Node child_process quirk on the
// non-zero-exit path) — a file read has no such cap.
function runProceduralQa(lang: string, args: string[], timeoutMs?: number): QaReport {
  const scratch = mkdtempSync(join(tmpdir(), "procedural-qa-"));
  const outPath = join(scratch, "report.json");
  try {
    execFileSync(
      process.execPath,
      [RUN_SCRIPT, "--lang", lang, "--out", outPath, ...args],
      { encoding: "utf8", cwd: ROOT, timeout: timeoutMs, stdio: ["ignore", "ignore", "pipe"] },
    );
  } catch (err) {
    // Non-zero exit (enforced failures) still writes the file before
    // exiting — only re-throw if the file truly never landed (timeout,
    // crash before the write).
    const e = err as { signal?: string | null };
    if (!existsSyncSafe(outPath)) throw err;
    void e;
  }
  const report = JSON.parse(readFileSync(outPath, "utf8"));
  rmSync(scratch, { recursive: true, force: true });
  return report;
}

function existsSyncSafe(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

/** Full-course run, with the same "fall back to the newest 5 modules on
 *  timeout" defensive scoping the original gate used, so CI hardware
 *  variance never produces a silent narrowing — the scope used is always
 *  logged. */
function runFullCourse(lang: string, extraArgs: string[], timeoutMs: number): { report: QaReport; scope: string } {
  const all = moduleIds(lang);
  const newest5 = all.slice(-5);
  try {
    const report = runProceduralQa(lang, extraArgs, timeoutMs);
    return { report, scope: `all ${all.length} modules` };
  } catch {
    console.warn(
      `[proceduralQa] ${lang}: full-course run did not finish within budget; falling back to the newest 5 modules (${newest5.join(", ")})`,
    );
    const merged: QaReport = { rows: [], anyEnforcedFail: false, failsByQuestion: {} };
    for (const m of newest5) {
      const r = runProceduralQa(lang, [...extraArgs, "--module", m]);
      merged.rows.push(...r.rows);
      merged.anyEnforcedFail = merged.anyEnforcedFail || r.anyEnforcedFail;
      for (const [qid, fails] of Object.entries(r.failsByQuestion)) {
        (merged.failsByQuestion[qid] ??= []).push(...fails);
      }
    }
    return {
      report: merged,
      scope: `newest 5 modules (${newest5.join(", ")}) — fallback, full course exceeded ${timeoutMs}ms`,
    };
  }
}

const LANGUAGES: { lang: string; timeoutMs: number }[] = [
  { lang: "ja", timeoutMs: FULL_RUN_TIMEOUT_MS },
  { lang: "ko", timeoutMs: SMALL_COURSE_TIMEOUT_MS },
  { lang: "es", timeoutMs: SMALL_COURSE_TIMEOUT_MS },
  { lang: "fr", timeoutMs: SMALL_COURSE_TIMEOUT_MS },
];

type QuestionBaseline = { max: number; minApplicable: number };
const baselineByLang = baseline as Record<string, Record<string, QuestionBaseline>>;

/**
 * Which sidecar/artifact a question's non-vacuous `appliesTo()` depends on,
 * per language — used only to make a floor-miss message actionable. Purely
 * descriptive (mirrors each check's own `appliesTo`/`naReason`, not a new
 * source of truth): JA's Q2/Q3 need the JMdict index, Q3 additionally needs
 * the JA fugashi/unidic-lite sidecar; every other floored question is
 * structural (no external sidecar) — a floor miss there means content
 * itself shrank, not a missing artifact.
 */
function missingArtifactHint(lang: string, qid: string): string {
  if (lang === "ja" && qid === "Q2") {
    return (
      "likely missing artifacts/lexical/jmdict/index.json — run " +
      "`node scripts/lexical/ja/fetch-jmdict.mjs` (or check LINGO_LEXICAL_PYTHON_JA / LINGO_LEXICAL_PYTHON isn't pointed at a bogus path — Q2 itself needs only the JMdict index, not the sidecar venv)"
    );
  }
  if (lang === "ja" && qid === "Q3") {
    return (
      "likely missing artifacts/lexical/jmdict/index.json (`node scripts/lexical/ja/fetch-jmdict.mjs`) " +
      "and/or the JA sidecar venv at scripts/lexical/ja/.venv (`cd scripts/lexical/ja && uv venv .venv --python 3.11 " +
      "&& uv pip install --python .venv/bin/python -r ../requirements-ja.txt`, pins in scripts/lexical/requirements-ja.txt) " +
      "— or LINGO_LEXICAL_PYTHON_JA / LINGO_LEXICAL_PYTHON pointed at a path with no working interpreter there"
    );
  }
  return (
    "no external sidecar backs this question's applicability — a floor miss here means module content itself " +
    "shrank (fewer build/listen/lesson steps in scope), not a missing artifact; check --module scope and the emitted content"
  );
}

describe("procedural QA ratchet (enforced questions, per language)", () => {
  for (const { lang, timeoutMs } of LANGUAGES) {
    it(
      `${lang}: no enforced question's finding count exceeds its committed baseline, and none falls below its applicable-steps floor`,
      () => {
        const { report, scope } = runFullCourse(lang, ["--enforced-only"], timeoutMs);
        console.log(`[proceduralQa] ${lang} scope: ${scope}`);

        const counts: Record<string, number> = {};
        for (const [qid, fails] of Object.entries(report.failsByQuestion)) counts[qid] = fails.length;
        console.log(`[proceduralQa] ${lang} counts: ${JSON.stringify(counts)}`);

        // Applicable-steps floor (2026-09-17, lane A7f): tally, per enforced
        // question, how many steps got a real "yes"/"no" verdict (not
        // "n/a") — `report.rows` already carries every step's per-question
        // result, so this needs no change to run.mjs's output shape. A
        // question whose sidecar/artifact is missing answers "n/a" for
        // every step (`appliesTo()` false everywhere), so this count
        // collapses toward 0 exactly when the ratchet above would
        // otherwise stay silently green.
        const applicableCounts: Record<string, number> = {};
        for (const row of report.rows) {
          for (const [qid, res] of Object.entries(row.results)) {
            if (!res.enforced) continue;
            if (res.answer !== "n/a") applicableCounts[qid] = (applicableCounts[qid] ?? 0) + 1;
          }
        }
        console.log(`[proceduralQa] ${lang} applicable: ${JSON.stringify(applicableCounts)}`);

        const baselineMap = baselineByLang[lang] ?? {};
        const regressions: string[] = [];
        const qids = new Set([...Object.keys(counts), ...Object.keys(baselineMap)]);
        for (const qid of qids) {
          const count = counts[qid] ?? 0;
          const allowedBaseline = baselineMap[qid];
          const maxAllowed = allowedBaseline?.max ?? 0;
          if (count > maxAllowed) {
            const findings = (report.failsByQuestion[qid] ?? [])
              .map((f) => `    - ${f.lessonId}/${f.stepId}: ${f.evidence.join("; ")}`)
              .join("\n");
            regressions.push(
              `${qid}: ${count} finding(s), exceeds committed baseline ${maxAllowed} (see src/test/proceduralQa.baseline.json's "${lang}.${qid}.max")\n${findings}`,
            );
          }
          if (allowedBaseline) {
            const applicable = applicableCounts[qid] ?? 0;
            if (applicable < allowedBaseline.minApplicable) {
              regressions.push(
                `${qid}: only ${applicable} applicable step(s), below the committed floor ${allowedBaseline.minApplicable} ` +
                  `(src/test/proceduralQa.baseline.json's "${lang}.${qid}.minApplicable") — ${missingArtifactHint(lang, qid)}`,
              );
            }
          }
        }

        expect(
          regressions,
          `procedural-QA ratchet tripped for ${lang} (${scope}) — either a finding count rose above its committed ` +
            `ceiling, or a question's applicable-steps count fell below its committed floor (the question went vacuous — ` +
            `see 'prove the verifier can fail' / docs/procedural-qa-2026-09-17.md § Vacuity on CI). ` +
            `Either fix the new finding(s)/restore the missing sidecar or artifact, or prove the change is a ` +
            `re-measurement (not new debt/not new vacuity) and update the baseline explicitly (regression-classes C7):\n\n` +
            regressions.join("\n\n"),
        ).toEqual([]);
      },
      timeoutMs + 60_000,
    );
  }
});
