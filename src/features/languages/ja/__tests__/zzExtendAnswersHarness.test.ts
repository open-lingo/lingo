/**
 * THROWAWAY TOOLING HARNESS — not part of the permanent suite, not to be
 * committed. Lives here only because it must match the `curriculum` vitest
 * project's include glob (`src/features/languages/**\/*.{test,spec}.{ts,tsx}`)
 * to get access to `getMockLessonContent` (which resolves the
 * `virtual:lesson-registry-bootstrap` import that only exists under Vite/
 * vitest — plain `tsx` cannot resolve it).
 *
 * Driven by scripts/extend-answers/{extract,gate}.mjs via
 * `npx vitest run --project curriculum <this file>` with env vars:
 *   EXTEND_MODE=extract  -> sweep m12+ short build answers, write rows.jsonl
 *   EXTEND_MODE=gate     -> read rows.jsonl + a proposals file, mechanically
 *                            validate candidates, write patches/rejects
 *
 * See scripts/extend-answers/README (none — see extract.mjs/gate.mjs headers)
 * for the lane this feeds: docs/user-feedback (#139) short-answer extension.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import {
  answerFloorApplies,
  answerTileCount,
  isSentenceBuildStep,
  normalizeSentenceKey,
  primarySentenceOf,
} from "@/features/lesson/data/contentFloors";
import { makeGlobalTokenizer } from "@/features/lesson/data/moduleCompiler";

const REPO_ROOT = process.cwd();
const IR_DIR = path.join(REPO_ROOT, "src/features/languages/ja/curriculum/ir");
const VOCAB_FILE = path.join(
  REPO_ROOT,
  "src/features/languages/ja/curriculum/taughtVocab.generated.json",
);

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function stripRegisterCue(en: string): string {
  return en.replace(/^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i, "").trim() || en;
}

function politenessOf(ja: string): "polite" | "plain" {
  const stripped = normalizeSentenceKey(ja);
  return /(です|ます)$/.test(stripped) ? "polite" : "plain";
}

const yamlCache = new Map<string, string[]>();
function yamlLinesFor(moduleId: string): string[] {
  if (!yamlCache.has(moduleId)) {
    const file = path.join(IR_DIR, `${moduleId}.ir.yaml`);
    yamlCache.set(
      moduleId,
      fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n") : [],
    );
  }
  return yamlCache.get(moduleId)!;
}

type BeatMeta = { en: string; grammarIds: string[]; mode: string; line: number };

/**
 * Find the yaml beat for a lesson+sentence by content match (normalised),
 * scoped to the lesson's own block (from its `- id: <bare>` line to the next
 * one at the same indent). Falls back to null when no unique match is found
 * (logged by the caller, not fatal).
 */
function findLessonBlockStart(lines: string[], lessonId: string): number {
  // Review lessons get a COMPUTED compiled id (`ja-<moduleId>-neo-review[-N]`)
  // that does not match the yaml's own `- id: <moduleId>-neo-rN` label
  // (moduleCompiler.ts: `reviewId = ... \`${moduleId}-neo-review-${idx+1}\``
  // vs the authored `m12-neo-r1`) — locate the Nth `role: review` block by
  // POSITION instead of by id text, mirroring the compiler's own indexing.
  const reviewMatch = /-neo-review(?:-(\d+))?$/.exec(lessonId);
  if (reviewMatch) {
    const wantIdx = reviewMatch[1] ? parseInt(reviewMatch[1], 10) - 1 : 0;
    let seen = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*-\s*id:\s*\S/.test(lines[i])) {
        // A new lesson block starts here; check if IT is a review block by
        // peeking the next couple of lines for `role: review`.
        for (let j = i + 1; j < lines.length && j < i + 4; j++) {
          if (/^\s*-\s*id:\s*\S/.test(lines[j])) break;
          if (/role:\s*review/.test(lines[j])) {
            seen++;
            if (seen === wantIdx) return i;
            break;
          }
        }
      }
    }
    return -1;
  }
  const bareLessonId = lessonId.replace(/^ja-/, "");
  return lines.findIndex((l) => new RegExp(`^\\s*-\\s*id:\\s*${bareLessonId}\\s*$`).test(l));
}

function findBeat(moduleId: string, lessonId: string, ja: string): BeatMeta | null {
  const lines = yamlLinesFor(moduleId);
  if (lines.length === 0) return null;
  const startIdx = findLessonBlockStart(lines, lessonId);
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^\s{2}-\s*id:\s*\S/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const targetKey = normalizeSentenceKey(ja);
  const matches: BeatMeta[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i];
    if (!/kind:\s*sentence/.test(line)) continue;
    const jaM = /ja:\s*"((?:[^"\\]|\\.)*)"/.exec(line);
    if (!jaM) continue;
    if (normalizeSentenceKey(jaM[1]) !== targetKey) continue;
    const enM = /en:\s*"((?:[^"\\]|\\.)*)"/.exec(line);
    const exM = /exercises:\s*\[([^\]]*)\]/.exec(line);
    const modeM = /mode:\s*(\w+)/.exec(line);
    matches.push({
      en: enM ? enM[1] : "",
      grammarIds: exM
        ? exM[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      mode: modeM ? modeM[1] : "build",
      line: i + 1,
    });
  }
  if (matches.length === 0) return null;
  // Ambiguous (duplicate sentence in one lesson) — return the first; the
  // extractor flags this via matches.length in its own bookkeeping below.
  return matches[0];
}

type Row = {
  stepId: string;
  module: string;
  lessonId: string;
  beatRef: { file: string; line: number | null };
  ja: string;
  tiles: string[];
  tileCount: number;
  en: string;
  grammarIds: string[];
  mode: string;
  politeness: "polite" | "plain";
  availableWords: string[];
  lessonSentences: string[];
};

// ---------------------------------------------------------------------------
// EXTRACT
// ---------------------------------------------------------------------------

function runExtract() {
  const outFile = process.env.EXTEND_ROWS_OUT!;
  const vocab: Record<string, { priorVocab: string[]; newAtoms: { kana: string }[] }> =
    JSON.parse(fs.readFileSync(VOCAB_FILE, "utf8"));

  const rows: Row[] = [];
  const inScope = new Map<string, number>();
  let ambiguousBeats = 0;
  let missingBeats = 0;

  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    if (!answerFloorApplies(lesson.moduleId)) continue;

    const lessonSentenceKeys = new Set<string>();
    for (const s of lesson.steps as LessonStep[]) {
      const { key, tokens } = primarySentenceOf(s);
      if (tokens >= 2 && key) lessonSentenceKeys.add(key);
    }

    for (const step of lesson.steps as LessonStep[]) {
      if (!isSentenceBuildStep(step)) continue;
      inScope.set(lesson.moduleId, (inScope.get(lesson.moduleId) ?? 0) + 1);
      const tiles = answerTileCount(step);
      if (tiles >= 5) continue; // ANSWER_TILE_FLOOR, inlined to avoid a second import

      const ja = step.targetSentence;
      const beat = findBeat(lesson.moduleId, lessonId, ja);
      if (!beat) missingBeats++;

      const mv = vocab[lesson.moduleId];
      const availableWords = mv
        ? [...new Set([...mv.priorVocab, ...mv.newAtoms.map((a) => a.kana)])]
        : [];

      const selfKey = normalizeSentenceKey(ja);
      const lessonSentences = [...lessonSentenceKeys].filter((k) => k !== selfKey);

      rows.push({
        stepId: step.id,
        module: lesson.moduleId,
        lessonId,
        beatRef: {
          file: `src/features/languages/ja/curriculum/ir/${lesson.moduleId}.ir.yaml`,
          line: beat?.line ?? null,
        },
        ja,
        tiles: step.correctOrder,
        tileCount: step.correctOrder.length,
        en: beat ? stripRegisterCue(beat.en) : "",
        grammarIds: beat?.grammarIds ?? [],
        mode: step.type === "listening_build" ? "listening" : "build",
        politeness: politenessOf(ja),
        availableWords,
        lessonSentences,
      });
    }
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

  const perModule = new Map<string, number>();
  for (const r of rows) perModule.set(r.module, (perModule.get(r.module) ?? 0) + 1);

  fs.writeFileSync(
    process.env.EXTEND_SUMMARY_OUT!,
    JSON.stringify(
      {
        totalRows: rows.length,
        perModule: Object.fromEntries([...perModule.entries()].sort()),
        missingBeatMatch: missingBeats,
        ambiguousBeats,
        inScopeTotal: [...inScope.values()].reduce((a, b) => a + b, 0),
      },
      null,
      2,
    ),
  );
}

// ---------------------------------------------------------------------------
// GATE
// ---------------------------------------------------------------------------

type Candidate = {
  ja: string;
  en: string;
  tiles: string[];
  added: string[];
  confidence: number;
  note?: string;
};
type Proposal = { stepId: string; candidates: Candidate[]; retry?: boolean };

const FREE_MORPHEME_HINT = /^(だ|な|です|ます|ません|でした|ではない|じゃない|た|て)$/;

// 2026-09-15 lead audit finding: the OLD rule (a) tokenized the candidate
// with the real compiler tokenizer and then checked each resulting TOKEN
// against availableWords/originalTiles/FREE_MORPHEME_HINT. That is unsafe
// for an UNKNOWN word that happens to decompose into particle-like kana —
// とても (not in any m12 availableWords list) tokenized to と/て/も, all
// three individually "free" (と/も are real particles, て matched
// FREE_MORPHEME_HINT), so the whole made-up word sailed through and even
// inflated the tile count. Fixed by checking at the BUNSETSU level, before
// any fine-grained tokenization, using the authored word-boundary spaces
// (the same boundary the compiler tokenizer treats as authoritative) —
// see gateCandidate() below.

/** Particles a bunsetsu may end in — longest match first so から/まで/より
 *  aren't mistaken for a shorter substring particle. Source: the brief's
 *  explicit list (moduleCompiler.ts's own PARTICLES is a superset used for
 *  fine-grained tokenization; this coarser bunsetsu-level list is deliberately
 *  the lead's named set). */
const TRAILING_PARTICLES = ["から", "まで", "より", "は", "が", "を", "に", "で", "と", "も", "の", "へ", "か", "ね", "よ"].sort(
  (a, b) => b.length - a.length,
);

/** Bare subject/object pronouns — the lead's named set (2026-09-15 audit).
 *  A real Japanese speaker drops the subject; extending a short sentence by
 *  prepending one of these is padding, not a content addition. */
const PRONOUNS = new Set(["わたし", "ぼく", "あなた", "かれ", "かのじょ", "わたしたち"]);

function stripTrailingParticle(bunsetsu: string): string {
  for (const p of TRAILING_PARTICLES) {
    if (bunsetsu.length > p.length && bunsetsu.endsWith(p)) return bunsetsu.slice(0, -p.length);
  }
  return bunsetsu;
}

function bunsetsuOf(ja: string): string[] {
  return ja.trim().split(/[\s　]+/).filter(Boolean);
}

/** Runs of >=2 CONSECUTIVE single-character tokens in a fine-grained
 *  tokenization, each run rendered as its concatenated string — the shape
 *  an unknown word takes when it accidentally decomposes into particles/
 *  bound morphemes (とても -> と+て+も). */
function singleKanaRuns(tokens: string[]): string[] {
  const runs: string[] = [];
  let cur = "";
  for (const t of tokens) {
    if (t.length === 1) {
      cur += t;
    } else {
      if (cur.length >= 2) runs.push(cur);
      cur = "";
    }
  }
  if (cur.length >= 2) runs.push(cur);
  return runs;
}

type GateResult = { ok: boolean; reasons: string[]; tiles: string[] };

/**
 * Gate ONE candidate against ONE row. Pure (no file IO) so it can be unit
 * tested directly — see the "gate regression" describe block below.
 */
function gateCandidate(row: Row, cand: Candidate, acceptedInLesson: Set<string>): GateResult {
  const reasons: string[] = [];
  const availSet = new Set(row.availableWords);

  // --- (a) closed-list checks, BEFORE any fine-grained tokenization -------
  const origBunsetsu = bunsetsuOf(row.ja);
  const origStems = new Set(origBunsetsu.map(stripTrailingParticle));
  for (const b of origBunsetsu) origStems.add(b); // also allow the untouched original bunsetsu verbatim

  const candBunsetsu = bunsetsuOf(cand.ja);
  const unknownStems: string[] = [];
  for (const b of candBunsetsu) {
    const stem = stripTrailingParticle(b);
    if (availSet.has(stem) || origStems.has(stem) || availSet.has(b) || FREE_MORPHEME_HINT.test(stem)) continue;
    unknownStems.push(stem);
  }
  if (unknownStems.length > 0) {
    reasons.push(`unknown-word:${unknownStems.join(",")}`);
  }

  const addedNotListed = (cand.added ?? []).filter((w) => !availSet.has(w));
  if (addedNotListed.length > 0) {
    reasons.push(`added-not-in-list:${addedNotListed.join(",")}`);
  }

  // 2026-09-15 lead audit finding #2: with unknown-word/kana-run closed, the
  // model's new failure mode was PADDING with a bare subject pronoun
  // (わたしは) instead of a real content addition — natural Japanese drops
  // the subject, and stacking it onto an already-topic-marked sentence
  // produces a double-topic no native speaker says (m27: わたしは あしたは …).
  const pronounPad = (cand.added ?? []).filter((w) => PRONOUNS.has(w));
  if (pronounPad.length > 0) {
    reasons.push(`pronoun-padding:${pronounPad.join(",")}`);
  }
  const topicMarkedBunsetsu = candBunsetsu.filter((b) => b.length > 1 && b.endsWith("は"));
  if (topicMarkedBunsetsu.length >= 2) {
    reasons.push(`double-topic:${topicMarkedBunsetsu.join(",")}`);
  }

  // Lead audit finding: "ここ で どれが …" — で emitted as its OWN bunsetsu
  // instead of attached to ここ. A bunsetsu that is nothing but a bare
  // particle is never a legal authored word boundary in this course.
  const orphanParticles = candBunsetsu.filter((b) => TRAILING_PARTICLES.includes(b));
  if (orphanParticles.length > 0) {
    reasons.push(`orphan-particle:${orphanParticles.join(",")}`);
  }

  // (f) tail-preserved — lead audit finding: "slot in two more" means WORDS
  // go in, not clauses appended after a fixed expression. The original
  // sentence's FINAL bunsetsu (its predicate or fixed expression, e.g.
  // おめでとう) must still be the candidate's final bunsetsu, ignoring a
  // trailing ？/。. Catches a run-on like m31's
  // "あねの たんじょうび おめでとう ケーキを たべる".
  const stripEndPunct = (s: string): string => s.replace(/[？?。]+$/, "");
  const origLast = stripEndPunct(origBunsetsu[origBunsetsu.length - 1] ?? "");
  const candLast = stripEndPunct(candBunsetsu[candBunsetsu.length - 1] ?? "");
  if (origLast !== candLast) {
    reasons.push(`tail-preserved:${candLast}!=${origLast}`);
  }

  // Only tokenize (fine-grained) once we need it — for the kana-run check
  // and for the real tile count/list used by every later rule.
  const tokenizer = makeGlobalTokenizer(row.availableWords.map((k) => ({ kana: k })));
  const candTiles = tokenizer(cand.ja);
  const origTiles = tokenizer(row.ja); // re-tokenize with THIS row's vocab so both sides use one tokenizer

  const origRuns = new Set(singleKanaRuns(origTiles));
  const candRuns = singleKanaRuns(candTiles);
  const newRuns = candRuns.filter((r) => !origRuns.has(r));
  if (newRuns.length > 0) {
    reasons.push(`kana-run:${newRuns.join(",")}`);
  }

  // If (a) failed, don't bother computing downstream rules against a
  // tile list we already know is contaminated by an unknown word.
  if (reasons.length > 0) {
    return { ok: false, reasons, tiles: candTiles };
  }

  // --- (b) tileCount 5-9 ----------------------------------------------------
  if (candTiles.length < 5 || candTiles.length > 9) {
    reasons.push(`tileCount ${candTiles.length} outside [5,9]`);
  }

  // --- (c) original content kept + grammar form present --------------------
  const missingOriginal = row.tiles.filter((t) => !FREE_MORPHEME_HINT.test(t) && !candTiles.includes(t));
  if (missingOriginal.length > 0) {
    reasons.push(`original content token(s) dropped: ${missingOriginal.join(", ")}`);
  }

  // --- (d) normalised key not equal to any lessonSentences or other accepted patch
  const candKey = normalizeSentenceKey(cand.ja);
  if (row.lessonSentences.includes(candKey)) {
    reasons.push("duplicates another sentence already in the lesson");
  }
  if (acceptedInLesson.has(candKey)) {
    reasons.push("duplicates another accepted patch in the same lesson");
  }

  // --- (e) politeness ending unchanged --------------------------------------
  if (politenessOf(cand.ja) !== row.politeness) {
    reasons.push(`politeness changed (${row.politeness} -> ${politenessOf(cand.ja)})`);
  }

  return { ok: reasons.length === 0, reasons, tiles: candTiles };
}

function runGate() {
  const rowsFile = process.env.EXTEND_ROWS_OUT!;
  const proposalsFile = process.env.EXTEND_PROPOSALS_IN!;
  const patchesOut = process.env.EXTEND_PATCHES_OUT!;
  const rejectsOut = process.env.EXTEND_REJECTS_OUT!;

  const rows: Row[] = fs
    .readFileSync(rowsFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const rowById = new Map(rows.map((r) => [r.stepId, r]));

  const proposals: Proposal[] = fs
    .readFileSync(proposalsFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  const patches: unknown[] = [];
  const rejects: unknown[] = [];
  const acceptedKeysByLesson = new Map<string, Set<string>>();

  for (const prop of proposals) {
    const row = rowById.get(prop.stepId);
    if (!row) {
      rejects.push({ stepId: prop.stepId, reasonCode: "unknown-row", reason: "stepId not in rows.jsonl" });
      continue;
    }
    const lessonKey = row.lessonId;
    if (!acceptedKeysByLesson.has(lessonKey)) acceptedKeysByLesson.set(lessonKey, new Set());
    const acceptedInLesson = acceptedKeysByLesson.get(lessonKey)!;

    let accepted: Candidate | null = null;
    const candidateReasons: string[] = [];

    for (const cand of prop.candidates ?? []) {
      const result = gateCandidate(row, cand, acceptedInLesson);
      if (result.ok) {
        accepted = { ...cand, tiles: result.tiles };
        break;
      }
      candidateReasons.push(result.reasons.join("; "));
    }

    if (accepted) {
      acceptedInLesson.add(normalizeSentenceKey(accepted.ja));
      patches.push({
        stepId: row.stepId,
        module: row.module,
        lessonId: row.lessonId,
        beatRef: row.beatRef,
        oldJa: row.ja,
        oldEn: row.en,
        oldTiles: row.tiles,
        newJa: accepted.ja,
        newEn: accepted.en,
        newTiles: accepted.tiles,
        added: accepted.added,
        confidence: accepted.confidence,
        note: accepted.note ?? "",
      });
    } else {
      rejects.push({
        stepId: row.stepId,
        module: row.module,
        lessonId: row.lessonId,
        reasonCode: "no-candidate-passed",
        reasons: candidateReasons,
        eligibleForRetry: !prop.retry,
      });
    }
  }

  fs.mkdirSync(path.dirname(patchesOut), { recursive: true });
  fs.writeFileSync(patchesOut, patches.map((p) => JSON.stringify(p)).join("\n") + (patches.length ? "\n" : ""));
  fs.writeFileSync(rejectsOut, rejects.map((r) => JSON.stringify(r)).join("\n") + (rejects.length ? "\n" : ""));

  fs.writeFileSync(
    process.env.EXTEND_SUMMARY_OUT!,
    JSON.stringify(
      { proposalsSeen: proposals.length, accepted: patches.length, rejected: rejects.length },
      null,
      2,
    ),
  );
}

// ---------------------------------------------------------------------------
// GATE REGRESSION — always runs (not gated behind EXTEND_MODE). Reproduces
// the two real failures the lead's 2026-09-15 audit found in the first
// smoke run's patches.jsonl, to prove gateCandidate() rejects both now.
// ---------------------------------------------------------------------------

function minimalRow(overrides: Partial<Row>): Row {
  return {
    stepId: "test-step",
    module: "m0",
    lessonId: "ja-m0-neo-1",
    beatRef: { file: "", line: null },
    ja: "",
    tiles: [],
    tileCount: 0,
    en: "",
    grammarIds: [],
    mode: "build",
    politeness: "plain",
    availableWords: [],
    lessonSentences: [],
    ...overrides,
  };
}

describe("gateCandidate regression (real audit findings, 2026-09-15)", () => {
  it("rejects the m12 とても candidate (unknown word decomposes into free particles/stems)", () => {
    const row = minimalRow({
      stepId: "ja-m12-neo-1-s-0",
      module: "m12",
      lessonId: "ja-m12-neo-1",
      ja: "やまは おおきい",
      tiles: ["やま", "は", "おおきい"],
      politeness: "plain",
      // real m12 availableWords includes あそこ but NOT とても (confirmed
      // against the real taughtVocab.generated.json m12 entry).
      availableWords: ["やま", "おおきい", "あそこ"],
    });
    const cand: Candidate = {
      ja: "あそこの やまは とても おおきい",
      en: "The mountain over there is very big.",
      tiles: ["あそこ", "の", "やま", "は", "と", "て", "も", "おおきい"],
      added: ["あそこ", "の", "とても"],
      confidence: 0.9,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("unknown-word:"))).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("added-not-in-list:") && r.includes("とても"))).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("kana-run:"))).toBe(true);
  });

  it("rejects the m24 わたしは candidate (added array not verbatim in availableWords, even though the stem わたし is legit)", () => {
    const row = minimalRow({
      stepId: "ja-m24-neo-5-s-2",
      module: "m24",
      lessonId: "ja-m24-neo-5",
      ja: "ぜんぜん りょうりが できない",
      tiles: ["ぜんぜん", "りょうり", "が", "できない"],
      politeness: "plain",
      // real m24 availableWords includes わたし (confirmed) but the model's
      // `added` array glued the topic marker on: ["わたしは"], not ["わたし"].
      availableWords: ["ぜんぜん", "りょうり", "できない", "わたし"],
    });
    const cand: Candidate = {
      ja: "わたしは ぜんぜん りょうりが できない",
      en: "I can't cook at all.",
      tiles: ["わたし", "は", "ぜんぜん", "りょうり", "が", "できない"],
      added: ["わたしは"],
      confidence: 1,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("added-not-in-list:") && r.includes("わたしは"))).toBe(true);
    // The bunsetsu-stem check alone would NOT have caught this one (わたし
    // is legit) — this proves the added-verbatim check is load-bearing on
    // its own, not merely redundant with the stem check.
    expect(result.reasons.some((r) => r.startsWith("unknown-word:"))).toBe(false);
  });

  it("still accepts a genuinely good candidate built only from availableWords", () => {
    const row = minimalRow({
      stepId: "ja-m12-neo-1-s-0",
      module: "m12",
      lessonId: "ja-m12-neo-1",
      ja: "やまは おおきい",
      tiles: ["やま", "は", "おおきい"],
      politeness: "plain",
      availableWords: ["やま", "おおきい", "あそこ", "きょう"],
    });
    const cand: Candidate = {
      ja: "きょう あそこの やまは おおきい",
      en: "That mountain over there is big today.",
      tiles: ["きょう", "あそこ", "の", "やま", "は", "おおきい"],
      added: ["きょう", "あそこ"],
      confidence: 0.9,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects the m27 わたしは candidate (pronoun-padding + double-topic, real 2026-09-15 smoke output)", () => {
    const row = minimalRow({
      stepId: "ja-m27-neo-1-s-2",
      module: "m27",
      lessonId: "ja-m27-neo-1",
      ja: "あしたは いそがしいんだ",
      tiles: ["あした", "は", "いそがしい", "んだ"],
      politeness: "plain",
      availableWords: ["あした", "いそがしい", "わたし"],
    });
    const cand: Candidate = {
      ja: "わたしは あしたは いそがしいんだ",
      en: "I'm busy tomorrow.",
      tiles: ["わたし", "は", "あした", "は", "いそがしい", "んだ"],
      added: ["わたし"],
      confidence: 0.9,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("pronoun-padding:") && r.includes("わたし"))).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("double-topic:"))).toBe(true);
  });

  it("rejects the m26 orphan-particle candidate (で emitted as its own bunsetsu instead of attached to ここ)", () => {
    const row = minimalRow({
      stepId: "ja-m26-neo-11-s-6",
      module: "m26",
      lessonId: "ja-m26-neo-11",
      ja: "どれが いちばん おもい？",
      tiles: ["どれ", "が", "いちばん", "おもい？"],
      politeness: "plain",
      availableWords: ["どれ", "いちばん", "おもい", "ここ"],
    });
    const cand: Candidate = {
      ja: "ここ で どれが いちばん おもい？",
      en: "Here, which one is the heaviest?",
      tiles: ["ここ", "で", "どれ", "が", "いちばん", "おもい？"],
      added: ["ここ"],
      confidence: 0.9,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("orphan-particle:") && r.includes("で"))).toBe(true);
  });

  it("accepts ここで written as one bunsetsu (the correct shape for the same addition)", () => {
    const row = minimalRow({
      stepId: "ja-m26-neo-11-s-6",
      module: "m26",
      lessonId: "ja-m26-neo-11",
      ja: "どれが いちばん おもい？",
      tiles: ["どれ", "が", "いちばん", "おもい？"],
      politeness: "plain",
      availableWords: ["どれ", "いちばん", "おもい", "ここ"],
    });
    const cand: Candidate = {
      ja: "ここで どれが いちばん おもい？",
      en: "Here, which one is the heaviest?",
      tiles: ["ここ", "で", "どれ", "が", "いちばん", "おもい？"],
      added: ["ここ"],
      confidence: 0.9,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects a run-on that appends a clause after the fixed expression (m31 lead audit finding)", () => {
    const row = minimalRow({
      stepId: "ja-m31-neo-3-s-7",
      module: "m31",
      lessonId: "ja-m31-neo-3",
      ja: "あねの たんじょうび おめでとう",
      tiles: ["あね", "の", "たんじょうび", "おめでとう"],
      politeness: "plain",
      availableWords: ["あね", "たんじょうび", "おめでとう", "ケーキ", "たべる"],
    });
    const cand: Candidate = {
      ja: "あねの たんじょうび おめでとう ケーキを たべる",
      en: "Happy birthday to my older sister, I'll eat cake.",
      tiles: ["あね", "の", "たんじょうび", "おめでとう", "ケーキ", "を", "たべる"],
      added: ["ケーキ", "たべる"],
      confidence: 0.7,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("tail-preserved:"))).toBe(true);
  });

  it("accepts a candidate that keeps おめでとう as the final bunsetsu", () => {
    const row = minimalRow({
      stepId: "ja-m31-neo-3-s-7",
      module: "m31",
      lessonId: "ja-m31-neo-3",
      ja: "あねの たんじょうび おめでとう",
      tiles: ["あね", "の", "たんじょうび", "おめでとう"],
      politeness: "plain",
      availableWords: ["あね", "たんじょうび", "おめでとう", "ほんとうに"],
    });
    const cand: Candidate = {
      ja: "あねの たんじょうび ほんとうに おめでとう",
      en: "Happy birthday to my older sister, really!",
      tiles: ["あね", "の", "たんじょうび", "ほんとうに", "おめでとう"],
      added: ["ほんとうに"],
      confidence: 0.85,
      note: "",
    };
    const result = gateCandidate(row, cand, new Set());
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

// Self-skips unless EXTEND_MODE is explicitly set, so a concurrent session's
// unrelated `npm run test:run` / full curriculum sweep never fails on this
// file (it is driven only by scripts/extend-answers/{extract,gate}.mjs,
// which always set EXTEND_MODE). Uncommitted, throwaway — delete once the
// extend-answers lane's authoring passes are done.
describe.skipIf(!process.env.EXTEND_MODE)("zzExtendAnswersHarness (throwaway tooling, not shipped)", () => {
  it("runs the requested mode", () => {
    const mode = process.env.EXTEND_MODE;
    if (mode === "extract") runExtract();
    else if (mode === "gate") runGate();
    else throw new Error(`EXTEND_MODE must be 'extract' or 'gate', got ${JSON.stringify(mode)}`);
    expect(true).toBe(true);
  });
});
