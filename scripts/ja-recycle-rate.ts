/**
 * JA sentence-recycling audit (2026-09-09, Spencer's ask).
 *
 * "See if we can do a targeted re-authoring to include at least ~20% of
 * sentences using previous verbs and previous nouns and previous
 * adjectives; there has to be a way to programmatically find that;
 * especially where we aren't really teaching many new verbs OR we are
 * teaching additive forms like ておく or て-forms with things."
 *
 * Method (same shape as `rep-audit-2026-09-09`'s
 * `docs/ja-n4-repetition-audit-2026-09-09.md`, which this script's header
 * comment was asked to follow): compile every module through the REAL
 * `compileModule()` (`src/features/lesson/data/moduleCompiler.ts`) —
 * m6-m38 from `ir/mNN.ir.json`, m3-m5 from their hand-written `-neo.ts`
 * modules (they predate the IR pipeline), m1-m2 from their per-row
 * hand-written `.ts` files (kana decoding drills; included for
 * completeness but structurally carry almost no ≥3-chunk sentences, so
 * their recycle numbers are near-vacuous — see the "insufficient data"
 * floor below).
 *
 * Run via `npx vite-node` (plain `tsx` breaks on `import.meta.env` in
 * `shared/config/marketing.ts`, exactly the failure rep-audit hit and
 * documented) — vite-node resolves the `@/` alias and env shims the same
 * way the app does:
 *
 *   npx vite-node scripts/ja-recycle-rate.ts                # full course
 *   npx vite-node scripts/ja-recycle-rate.ts --module m31    # one module
 *   npx vite-node scripts/ja-recycle-rate.ts --json          # JSON to stdout
 *
 * A "sentence" = a distinct ANSWER-POSITION Japanese string with >=3
 * space-separated chunks (`isSentence` in `ja-recycle-lib.ts`, identical to
 * `moduleCompiler.ts`'s own filler-dedup heuristic). "Answer position"
 * follows the "grade answers, not foils" rule (this course's own finding
 * on file): a `multiple_choice` step contributes its CORRECT option only,
 * never the distractor foils; a `dialogue_sim` reply contributes the
 * graded canonical answer, never a wrong choice option. Exposure channels,
 * matching rep-audit's own definition exactly: `build_sentence
 * .targetSentence`, `listening_build.targetSentence`,
 * `listening_comprehension.transcript`, `translate.acceptedAnswers[0]`
 * (the JA side — `sourceText` is the English prompt), every
 * `dialogue_listen` line, every `dialogue_sim` turn's NPC line + graded
 * reply, and a `multiple_choice` step only when its correct option is
 * itself a full sentence. `grammar_rule` card EXAMPLES are deliberately
 * excluded (rep-audit's list excludes them too) — they are presented rule
 * illustrations, not something the learner produces or is graded on.
 *
 * Classification: every token in a sentence is resolved against a GLOBAL
 * atom registry built by merging `courseAtoms.ts` (authoritative POS enum,
 * ground truth for m1-m5) with every `ir/mNN.ir.json`'s `newAtoms` (kind ->
 * verb/noun/adjective bucket, ground truth for which module first taught a
 * word since `courseAtoms.fromModule` is KNOWN STALE for many m6+ atoms —
 * see `moduleCompiler.ts`'s own comment on `priorVocab`). A verb-form/
 * adjective-form atom (a conjugated surface the IR declares separately,
 * e.g. たべました `derivedFrom` たべる) resolves to its LEMMA's first-taught
 * module before the "earlier module?" check — this is what makes an
 * additive-form module (て-form, たら, ば, volitional, …) correctly count
 * as recycling the base verb even though the conjugated surface is new.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { compileModule, makeGlobalTokenizer, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import { JA_COURSE_ATOMS, JA_COURSE_ATOMS_BY_KANA } from "@/features/languages/ja/courseAtoms";
import type { LessonContent, LessonStep } from "@/features/lesson/types";

import {
  analyzeSentence,
  classSlotSkeleton,
  isAdditiveLesson,
  isSentence,
  summarize,
  type AtomMeta,
  type Classifier,
  type PosClass,
  type SentenceStat,
} from "./ja-recycle-lib";

// m1/m2 hand-written kana-row files, imported eagerly so a single `Atom
// registry + tokenizer` scan can cover the WHOLE course (m1-m38), not just
// the IR-compiled tail. Individually named rather than glob/dynamic-import
// so nothing here can silently swallow a `.test.ts` sibling
// (glob-collectors-match-test-files is a standing landmine in this repo).
import * as M1_L1 from "../src/features/languages/ja/curriculum/m1-l1";
import * as M1_HA from "../src/features/languages/ja/curriculum/m1-ha";
import * as M1_KA from "../src/features/languages/ja/curriculum/m1-ka";
import * as M1_SA from "../src/features/languages/ja/curriculum/m1-sa";
import * as M1_TA from "../src/features/languages/ja/curriculum/m1-ta";
import * as M1_NA from "../src/features/languages/ja/curriculum/m1-na";
import * as M1_MA from "../src/features/languages/ja/curriculum/m1-ma";
import * as M1_YA from "../src/features/languages/ja/curriculum/m1-ya";
import * as M1_RA from "../src/features/languages/ja/curriculum/m1-ra";
import * as M1_WA from "../src/features/languages/ja/curriculum/m1-wa";
import * as M2_B from "../src/features/languages/ja/curriculum/m2-b";
import * as M2_D from "../src/features/languages/ja/curriculum/m2-d";
import * as M2_G from "../src/features/languages/ja/curriculum/m2-g";
import * as M2_P from "../src/features/languages/ja/curriculum/m2-p";
import * as M2_YOON_INTRO from "../src/features/languages/ja/curriculum/m2-yoon-intro";
import * as M2_YOON_RARE from "../src/features/languages/ja/curriculum/m2-yoon-rare";
import * as M2_YOON_SH_CH from "../src/features/languages/ja/curriculum/m2-yoon-sh-ch";
import * as M2_YOON_VOICED from "../src/features/languages/ja/curriculum/m2-yoon-voiced";
import * as M2_Z from "../src/features/languages/ja/curriculum/m2-z";
import { M3_NEO_LESSONS } from "../src/features/languages/ja/curriculum/m3-neo";
import { M4_NEO_LESSONS } from "../src/features/languages/ja/curriculum/m4-neo";
import { M5_NEO_LESSONS } from "../src/features/languages/ja/curriculum/m5-neo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CURRICULUM_DIR = join(ROOT, "src/features/languages/ja/curriculum");
const IR_DIR = join(CURRICULUM_DIR, "ir");
const IR_MODULE_NUMS = Array.from({ length: 33 }, (_, i) => i + 6); // m6..m38

// ── CLI args ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const moduleFlagIdx = argv.findIndex((a) => a === "--module" || a.startsWith("--module="));
let onlyModule: number | null = null;
if (moduleFlagIdx !== -1) {
  const raw = argv[moduleFlagIdx].includes("=")
    ? argv[moduleFlagIdx].split("=")[1]
    : argv[moduleFlagIdx + 1];
  const m = /^m?(\d+)$/.exec(raw ?? "");
  if (!m) {
    console.error(`--module expects e.g. "m31" or "31", got ${JSON.stringify(raw)}`);
    process.exit(1);
  }
  onlyModule = Number(m[1]);
}
const jsonMode = argv.includes("--json");

// ── Load every m6-m38 IR file's raw JSON once (cheap: just JSON, no compile) ──
// Needed for ALL modules regardless of --module: the "earlier module?" check
// for module 31 requires knowing what m6..m30 taught, so the global atom
// registry always scans the whole course.
type RawNewAtom = { kana: string; kind?: string; derivedFrom?: string };
type RawIr = { module: string; title: string; newAtoms?: RawNewAtom[]; lessons: { id: string; introduces?: string[] }[] };
const rawIrByModule = new Map<number, RawIr>();
for (const n of IR_MODULE_NUMS) {
  rawIrByModule.set(n, JSON.parse(readFileSync(join(IR_DIR, `m${n}.ir.json`), "utf8")));
}

// ── Global IR atom registry: kana -> {kind, derivedFrom, first module that
//    declared it as newAtoms}. First occurrence in ascending module order
//    wins (mirrors compile-ir.mjs's own priorVocab derivation). ──
type IrAtomMeta = { kind?: string; derivedFrom?: string; firstModule: number };
const irAtomMeta = new Map<string, IrAtomMeta>();
for (const n of IR_MODULE_NUMS) {
  for (const a of rawIrByModule.get(n)!.newAtoms ?? []) {
    if (!irAtomMeta.has(a.kana)) {
      irAtomMeta.set(a.kana, { kind: a.kind, derivedFrom: a.derivedFrom, firstModule: n });
    }
  }
}

function courseAtomModuleNum(fromModule: string): number | null {
  const m = /^m(\d+)$/.exec(fromModule);
  return m ? Number(m[1]) : null; // "future" / "thr-n4" / "sidequest-survival" -> null
}

function irKindToPos(kind: string | undefined): PosClass {
  if (kind === "verb" || kind === "verb-form" || kind === "tai-form") return "verb";
  if (kind === "adjective" || kind === "adjective-form" || kind === "adj-form") return "adjective";
  if (kind === "vocab") return "noun";
  return "other"; // particle, grammar-chunk, phrase, undefined
}

function resolveLemma(kana: string, depth = 0): string {
  if (depth > 4) return kana;
  const meta = irAtomMeta.get(kana);
  if (meta?.derivedFrom && meta.derivedFrom !== kana) return resolveLemma(meta.derivedFrom, depth + 1);
  return kana;
}

const classifyCache = new Map<string, AtomMeta>();
const classify: Classifier = (token) => {
  const cached = classifyCache.get(token);
  if (cached) return cached;

  // POS bucket: courseAtoms' vetted enum wins when the token itself (not
  // necessarily its lemma) is registered; otherwise fall back to the IR
  // newAtoms `kind` tag (covers the ~600+ conjugated/derived forms and
  // module-local words deliberately never registered in courseAtoms.ts).
  const ca = JA_COURSE_ATOMS_BY_KANA.get(token);
  const pos: PosClass = ca
    ? ca.pos === "verb"
      ? "verb"
      : ca.pos === "noun"
        ? "noun"
        : ca.pos === "adjective"
          ? "adjective"
          : "other"
    : irKindToPos(irAtomMeta.get(token)?.kind);

  // First-taught module: resolved through the LEMMA (derivedFrom chain) so
  // a conjugated form inherits its base verb/adjective's debut module. IR
  // first-occurrence wins over courseAtoms.fromModule on purpose — the
  // latter is documented-stale for m6+ atoms.
  const lemma = resolveLemma(token);
  let fromModule: number | null = null;
  const lemmaIr = irAtomMeta.get(lemma);
  if (lemmaIr) {
    fromModule = lemmaIr.firstModule;
  } else {
    const lemmaCa = JA_COURSE_ATOMS_BY_KANA.get(lemma);
    if (lemmaCa) fromModule = courseAtomModuleNum(lemmaCa.fromModule);
  }

  const meta: AtomMeta = { pos, fromModule };
  classifyCache.set(token, meta);
  return meta;
};

// ── Tokenizer vocab: union of every courseAtoms kana + every IR newAtoms
//    kana across the whole course, so conjugated/derived surfaces tokenize
//    as ONE piece instead of shattering into fragments. ──
const vocabKana = new Set<string>();
for (const a of JA_COURSE_ATOMS) vocabKana.add(a.kana);
for (const kana of irAtomMeta.keys()) vocabKana.add(kana);
const tokenize = makeGlobalTokenizer([...vocabKana].map((kana) => ({ kana })));

// ── Reverse index for "suggest an earlier-module replacement": every known
//    atom with a resolvable module, grouped by POS, sorted by fromModule
//    DESCENDING (most-recently-taught-earlier = freshest in memory first). ──
const atomsByPos: Record<Exclude<PosClass, "other">, { kana: string; fromModule: number }[]> = {
  verb: [],
  noun: [],
  adjective: [],
};
{
  const seen = new Set<string>();
  const add = (kana: string) => {
    if (seen.has(kana)) return;
    const meta = classify(kana);
    if (meta.pos === "other" || meta.fromModule == null) return;
    seen.add(kana);
    atomsByPos[meta.pos].push({ kana, fromModule: meta.fromModule });
  };
  for (const a of JA_COURSE_ATOMS) add(a.kana);
  for (const kana of irAtomMeta.keys()) add(kana);
  for (const list of Object.values(atomsByPos)) list.sort((a, b) => b.fromModule - a.fromModule);
}
function suggestEarlierReplacement(
  pos: Exclude<PosClass, "other">,
  currentModule: number,
  exclude: ReadonlySet<string>,
): string | null {
  for (const cand of atomsByPos[pos]) {
    if (cand.fromModule >= currentModule) continue;
    if (exclude.has(cand.kana)) continue;
    return cand.kana;
  }
  return null;
}

// ── Per-module lesson loading ────────────────────────────────────────────
function lessonContentsFromNamespace(ns: Record<string, unknown>): LessonContent[] {
  return Object.values(ns).filter(
    (v): v is LessonContent =>
      !!v && typeof v === "object" && !Array.isArray(v) && "id" in (v as object) && "steps" in (v as object),
  );
}

type ModuleBundle = { title: string; lessons: LessonContent[] };

function loadModule(n: number): ModuleBundle {
  if (n === 1) {
    return {
      title: "Hiragana rows (m1)",
      lessons: [M1_L1, M1_HA, M1_KA, M1_SA, M1_TA, M1_NA, M1_MA, M1_YA, M1_RA, M1_WA].flatMap(
        lessonContentsFromNamespace,
      ),
    };
  }
  if (n === 2) {
    return {
      title: "Katakana + dakuten/yōon rows (m2)",
      lessons: [M2_B, M2_D, M2_G, M2_P, M2_YOON_INTRO, M2_YOON_RARE, M2_YOON_SH_CH, M2_YOON_VOICED, M2_Z].flatMap(
        lessonContentsFromNamespace,
      ),
    };
  }
  if (n === 3) return { title: "m3 — plain sentences", lessons: M3_NEO_LESSONS };
  if (n === 4) return { title: "m4 — possession & pointing", lessons: M4_NEO_LESSONS };
  if (n === 5) return { title: "m5", lessons: M5_NEO_LESSONS };
  const ir = rawIrByModule.get(n);
  if (!ir) throw new Error(`no IR for m${n}`);
  const lessons = compileModule(ir as unknown as ModuleIR);
  return { title: ir.title, lessons };
}

// ── Answer-position sentence extraction ("grade answers, not foils") ─────
function correctOptionText(options: { id: string; text: string }[], correctOptionId: string): string | undefined {
  return options.find((o) => o.id === correctOptionId)?.text;
}

function answerSentencesForStep(step: LessonStep): string[] {
  const s = step as unknown as Record<string, unknown>;
  switch (step.type) {
    case "build_sentence":
      return typeof s.targetSentence === "string" ? [s.targetSentence] : [];
    case "listening_build":
      return typeof s.targetSentence === "string" ? [s.targetSentence] : [];
    case "listening_comprehension":
      return typeof s.transcript === "string" ? [s.transcript] : [];
    case "translate": {
      // sourceText is the ENGLISH prompt in this course (sourceLanguage is
      // always "native" in practice); the JA side is acceptedAnswers[0].
      if (s.sourceLanguage === "target" && typeof s.sourceText === "string") return [s.sourceText];
      const accepted = s.acceptedAnswers as string[] | undefined;
      return accepted && accepted.length ? [accepted[0]] : [];
    }
    case "multiple_choice": {
      const text = correctOptionText(
        (s.options as { id: string; text: string }[]) ?? [],
        s.correctOptionId as string,
      );
      return text ? [text] : [];
    }
    case "dialogue_listen": {
      const lines = (s.lines as { kana: string }[]) ?? [];
      return lines.map((l) => l.kana);
    }
    case "dialogue_sim": {
      const turns = (s.turns as { npc: { kana: string }; reply: Record<string, unknown> }[]) ?? [];
      const out: string[] = [];
      for (const turn of turns) {
        out.push(turn.npc.kana);
        const reply = turn.reply;
        if (reply.mode === "build" && typeof reply.answer === "string") {
          out.push(reply.answer);
        } else if (reply.mode === "choice") {
          const text = correctOptionText(
            (reply.options as { id: string; text: string }[]) ?? [],
            reply.correctOptionId as string,
          );
          if (text) out.push(text);
        }
      }
      return out;
    }
    default:
      return [];
  }
}

function distinctAnswerSentences(lesson: LessonContent): string[] {
  const seen = new Set<string>();
  for (const step of lesson.steps) {
    for (const ja of answerSentencesForStep(step)) {
      const trimmed = ja.trim();
      if (trimmed && isSentence(trimmed)) seen.add(trimmed);
    }
  }
  return [...seen];
}

function grammarPointIdsInLesson(lesson: LessonContent): string[] {
  const ids: string[] = [];
  for (const step of lesson.steps) {
    if (step.type === "grammar_rule") {
      const gp = (step as unknown as { grammarPointId?: string }).grammarPointId;
      if (gp) ids.push(gp);
    }
  }
  return ids;
}

// ── New-verb count per lesson: newAtoms of kind "verb" this lesson's IR
//    `introduces` first lists (m1-m5 have no such concept -> 0).
//
//    Keyed by ARRAY INDEX, not id string: `compileModule` prefixes every
//    compiled id with `ja-` (and renumbers review lessons), so a compiled
//    "ja-m31-neo-1" would never match a raw IR "m31-neo-1" by string
//    equality — verified empirically (every lesson silently reported 0 new
//    verbs on the first run). `compileModule` returns `ir.lessons.map(...)`,
//    so index i of the compiled array is always index i of the raw
//    `ir.lessons` array; that invariant is what this function relies on,
//    not any id-shape assumption. ──
function newVerbCountsByIndex(n: number): number[] {
  if (n < 6) return [];
  const ir = rawIrByModule.get(n)!;
  const verbKanaThisModule = new Set(
    (ir.newAtoms ?? []).filter((a) => a.kind === "verb").map((a) => a.kana),
  );
  return ir.lessons.map((l) => (l.introduces ?? []).filter((k) => verbKanaThisModule.has(k)).length);
}

// ── Per-lesson report row ────────────────────────────────────────────────
const MIN_SENTENCES_FOR_RANKING = 3;

type LessonRow = {
  moduleNum: number;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  steps: number;
  sentences: number;
  overallPct: number;
  verbPct: number;
  nounPct: number;
  adjPct: number;
  newVerbs: number;
  additive: boolean;
  stats: SentenceStat[];
  sentenceList: string[];
};

function buildRowsForModule(n: number): LessonRow[] {
  const { title, lessons } = loadModule(n);
  const newVerbCounts = newVerbCountsByIndex(n);
  return lessons.map((lesson, i) => {
    const sentenceList = distinctAnswerSentences(lesson);
    const stats = sentenceList.map((ja) => analyzeSentence(tokenize(ja), n, classify));
    const summary = summarize(stats);
    const gpIds = grammarPointIdsInLesson(lesson);
    const additive = isAdditiveLesson({
      grammarPointIds: gpIds,
      lessonTitle: lesson.title ?? "",
      moduleTitle: title,
    });
    return {
      moduleNum: n,
      moduleTitle: title,
      lessonId: lesson.id,
      lessonTitle: lesson.title ?? lesson.id,
      steps: lesson.steps.length,
      sentences: summary.totalSentences,
      overallPct: summary.overallRecyclePct,
      verbPct: summary.verbRecyclePct,
      nounPct: summary.nounRecyclePct,
      adjPct: summary.adjRecyclePct,
      newVerbs: newVerbCounts[i] ?? 0,
      additive,
      stats,
      sentenceList,
    };
  });
}

// ── Re-author candidate extraction for a flagged lesson ──────────────────
type Candidate = { sentence: string; note: string; suggestion: string | null };

function reauthorCandidates(row: LessonRow): Candidate[] {
  const skelGroups = new Map<string, string[]>();
  for (const ja of row.sentenceList) {
    const skel = classSlotSkeleton(tokenize(ja), classify);
    (skelGroups.get(skel) ?? skelGroups.set(skel, []).get(skel)!).push(ja);
  }
  const usedKana = new Set<string>();
  for (const ja of row.sentenceList) for (const t of tokenize(ja)) usedKana.add(t);

  const dupGroups = [...skelGroups.values()].filter((g) => g.length >= 2).sort((a, b) => b.length - a.length);

  const suggestFor = (ja: string): string | null => {
    const tokens = tokenize(ja);
    for (const t of tokens) {
      const meta = classify(t);
      if (meta.pos === "other") continue;
      const isEarlier = meta.fromModule != null && meta.fromModule < row.moduleNum;
      if (isEarlier) continue; // already recycled; not the slot to fix
      return suggestEarlierReplacement(meta.pos, row.moduleNum, usedKana);
    }
    return null;
  };

  const out: Candidate[] = [];
  if (dupGroups.length > 0) {
    const top = dupGroups[0];
    for (const ja of top.slice(0, 5)) {
      out.push({
        sentence: ja,
        note: `same-frame near-duplicate (${top.length} sentences share this skeleton)`,
        suggestion: suggestFor(ja),
      });
    }
  }
  if (out.length < 3) {
    // Fallback: sentences with the FEWEST earlier-module content words —
    // these are the ones dragging the lesson's recycle rate down even
    // without a literal duplicate frame.
    const ranked = [...row.stats]
      .map((s, i) => ({ s, ja: row.sentenceList[i] }))
      .filter(({ ja }) => !out.some((c) => c.sentence === ja))
      .sort((a, b) => Number(a.s.hasAnyEarlier) - Number(b.s.hasAnyEarlier));
    for (const { ja } of ranked) {
      if (out.length >= 5) break;
      out.push({
        sentence: ja,
        note: "no same-frame duplicate found; flagged for using only this lesson's own new vocabulary",
        suggestion: suggestFor(ja),
      });
    }
  }
  return out.slice(0, 5);
}

// ── Run ────────────────────────────────────────────────────────────────
const modulesToRun = onlyModule != null ? [onlyModule] : Array.from({ length: 38 }, (_, i) => i + 1);
const allRows: LessonRow[] = [];
for (const n of modulesToRun) allRows.push(...buildRowsForModule(n));

const rankable = allRows.filter((r) => r.sentences >= MIN_SENTENCES_FOR_RANKING);
const below20 = rankable
  .filter((r) => r.overallPct < 20)
  .sort((a, b) => {
    const aFlag = a.additive || a.newVerbs <= 2 ? 0 : 1;
    const bFlag = b.additive || b.newVerbs <= 2 ? 0 : 1;
    if (aFlag !== bFlag) return aFlag - bFlag;
    return a.overallPct - b.overallPct;
  });
// Verb-only cut, ascending. Kept SEPARATE from `below20` rather than folded
// in: the OR-across-classes "overall" metric is almost always saturated by
// noun reuse alone (this course's authorial convention seeds an earlier
// person/place/time noun into nearly every sentence for scene-setting), so
// "below 20% overall" under-reports the exact failure mode Spencer named —
// a module drilling 2-3 brand-new verbs with zero reuse of any earlier verb
// scores ~90-100% overall (nouns carry it) while verb-recycle sits at 0%.
// See this file's committed report for the worked example (m31).
const verbBelow20 = rankable.filter((r) => r.verbPct < 20).sort((a, b) => a.verbPct - b.verbPct);

if (jsonMode) {
  console.log(
    JSON.stringify(
      {
        modules: modulesToRun,
        rows: allRows.map(({ stats, sentenceList, ...rest }) => rest),
        below20: below20.map((r) => ({
          moduleNum: r.moduleNum,
          lessonId: r.lessonId,
          overallPct: r.overallPct,
          newVerbs: r.newVerbs,
          additive: r.additive,
          candidates: reauthorCandidates(r),
        })),
        verbBelow20: verbBelow20.map((r) => ({
          moduleNum: r.moduleNum,
          lessonId: r.lessonId,
          verbPct: r.verbPct,
          overallPct: r.overallPct,
          newVerbs: r.newVerbs,
          additive: r.additive,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// ── Markdown report ────────────────────────────────────────────────────
const fmt = (n: number) => `${n.toFixed(1)}%`;
const lines: string[] = [];
lines.push("# JA sentence-recycling audit — m1–m38 (2026-09-09)");
lines.push("");
lines.push(
  "Spencer's ask: find, programmatically, where lessons under-recycle previously " +
    'taught verbs/nouns/adjectives — "at least ~20% of sentences using previous ' +
    'verbs and previous nouns and previous adjectives" — especially additive-form ' +
    "modules (ておく, て-forms, たら, ば, volitional, …) and lessons that teach few " +
    "brand-new verb lemmas. Method, classification, and exposure-channel " +
    "definitions are in this script's header comment " +
    "(`scripts/ja-recycle-rate.ts`) and its pure classifier " +
    "(`scripts/ja-recycle-lib.ts`, unit-tested). **Read-only measurement — " +
    "no curriculum changes made by this script or this pass.**",
);
lines.push("");
lines.push(
  `Ranking floor: a lesson needs >= ${MIN_SENTENCES_FOR_RANKING} distinct answer-position ` +
    "sentences to be ranked at all (below that, a recycle percentage is not " +
    "meaningful) — m1/m2 kana-row lessons mostly fall under this floor and are " +
    "shown in their module tables with a sentence count but excluded from the " +
    '"below 20%" ranking.',
);
lines.push("");
lines.push(
  "**Hand-validated 2026-09-09** against the real compiled steps (dump script, " +
    "not committed): `ja-m4-neo-9` (hand-authored m4 — confirmed its 2 sentences " +
    'contain only くるま/かさ, both new to m4, so 0% is right, not a tokenizer ' +
    'gap); `ja-m31-neo-3` (confirmed the module\'s sole verb もらう/くれる is m31\'s ' +
    "own newAtom on every sentence, so 0% verb-recycle is the module drilling its " +
    'own new verb, not a classification miss); `ja-m30-neo-2` (confirmed て-form ' +
    "surfaces like のんで/たべて/きいて correctly resolve through `derivedFrom` to " +
    "their earlier-taught base verbs のむ/たべる/きく, which is the exact mechanism " +
    "additive-form modules needed to score high verb-recycle).",
);
lines.push("");

for (const n of modulesToRun) {
  const rows = allRows.filter((r) => r.moduleNum === n);
  if (rows.length === 0) continue;
  lines.push(`## m${n} — ${rows[0].moduleTitle}`);
  lines.push("");
  lines.push("| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const flag = r.sentences < MIN_SENTENCES_FOR_RANKING ? " _(insufficient data)_" : "";
    lines.push(
      `| ${r.lessonId}${flag} | ${r.steps} | ${r.sentences} | ${fmt(r.overallPct)} | ${fmt(r.verbPct)} | ${fmt(r.nounPct)} | ${fmt(r.adjPct)} | ${r.newVerbs} | ${r.additive ? "YES" : ""} |`,
    );
  }
  lines.push("");
}

lines.push("## Lessons below 20% overall recycle, ranked");
lines.push("");
lines.push(
  `${below20.length} of ${rankable.length} ranked lessons (>= ${MIN_SENTENCES_FOR_RANKING} sentences) ` +
    "are below 20%. Additive-form and few-new-verb (<=2 new verb lemmas) lessons " +
    "are sorted to the top of this list, then by ascending recycle%.",
);
lines.push("");
lines.push("| # | Module | Lesson | Recycle% | New verbs | Additive? |");
lines.push("|---|---|---|---|---|---|");
below20.forEach((r, i) => {
  const flagged = r.additive || r.newVerbs <= 2;
  lines.push(
    `| ${i + 1} | m${r.moduleNum} | ${r.lessonId}${flagged ? " ⚑" : ""} | ${fmt(r.overallPct)} | ${r.newVerbs} | ${r.additive ? "YES" : ""} |`,
  );
});
lines.push("");
lines.push("⚑ = additive-form grammar point or <=2 new verb lemmas taught (the two classes Spencer named).");
lines.push("");

lines.push("## Re-author candidates for the ⚑-flagged lessons below 20%");
lines.push("");
lines.push(
  "For each flagged lesson: up to 5 concrete sentences that are the best " +
    "re-author targets — same-frame near-duplicates of each other when the " +
    "lesson has any (a literal repeated syntactic skeleton with swapped " +
    "nouns/verbs), else the sentences built entirely from this lesson's own " +
    "brand-new vocabulary — plus one suggested earlier-module word (same POS, " +
    "most recently taught, not already used in this lesson) that could take a " +
    "content-word slot instead.",
);
lines.push("");
const flaggedBelow20 = below20.filter((r) => r.additive || r.newVerbs <= 2);
for (const r of flaggedBelow20) {
  lines.push(`### m${r.moduleNum} / ${r.lessonId} (${fmt(r.overallPct)} recycle, ${r.newVerbs} new verbs${r.additive ? ", additive" : ""})`);
  lines.push("");
  const candidates = reauthorCandidates(r);
  if (candidates.length === 0) {
    lines.push("_No answer-position sentences to sample from._");
  } else {
    for (const c of candidates) {
      lines.push(`- \`${c.sentence}\` — ${c.note}${c.suggestion ? ` — suggest swapping in **${c.suggestion}** (earlier-module, same class)` : ""}`);
    }
  }
  lines.push("");
}

lines.push("## Supplementary cut: verb-only recycle below 20%");
lines.push("");
lines.push(
  "The literal ask ranks by the OR-across-classes overall metric, and only " +
    `${below20.length} lesson qualifies below 20% course-wide (above) — this ` +
    "course's authorial convention seeds an earlier person/place/time noun " +
    "into nearly every sentence for scene-setting, so noun reuse alone " +
    'saturates "overall" almost everywhere (see m31 below: 80-100% overall ' +
    "on nearly every lesson). That masks the exact failure mode Spencer " +
    "named: a module drilling 2-3 brand-new verbs for 8-9 teaching lessons " +
    "can hit 0% VERB recycle while scoring 90%+ overall. This cut ranks by " +
    "verb-recycle% alone, no additive/new-verb re-sort — read it alongside " +
    "the per-module tables above, not as a replacement for the primary " +
    "ranking.",
);
lines.push("");
lines.push(`${verbBelow20.length} of ${rankable.length} ranked lessons are below 20% verb-recycle.`);
lines.push("");
lines.push("| Module | Lesson | Verb recycle% | Overall% | New verbs | Additive? |");
lines.push("|---|---|---|---|---|---|");
for (const r of verbBelow20.slice(0, 40)) {
  lines.push(
    `| m${r.moduleNum} | ${r.lessonId} | ${fmt(r.verbPct)} | ${fmt(r.overallPct)} | ${r.newVerbs} | ${r.additive ? "YES" : ""} |`,
  );
}
if (verbBelow20.length > 40) lines.push(`| … | (${verbBelow20.length - 40} more, see \`--json\`) | | | | |`);
lines.push("");

// The committed report is a FULL-COURSE artifact — a `--module` run is a
// scoped debug/re-check pass and must never silently overwrite it (this
// clobbered the real report once during development: a `--module m5` test
// run replaced the m1-m38 doc with a 1-module stub). Only a full run
// (no --module) writes to the canonical docs/ path; a scoped run prints
// the same markdown to stdout instead.
if (onlyModule == null) {
  const outPath = join(ROOT, "docs/ja-recycle-rate-2026-09-09.md");
  writeFileSync(outPath, lines.join("\n") + "\n");
  console.log(`wrote ${outPath.replace(ROOT + "/", "")}`);
} else {
  console.log(lines.join("\n"));
}
console.log(`${allRows.length} lessons compiled across ${modulesToRun.length} module(s); ${below20.length} below 20% recycle.`);
