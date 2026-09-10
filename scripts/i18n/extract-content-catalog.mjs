#!/usr/bin/env node
/**
 * Content-catalog extractor (KO-source learner program, rung 1a — §3c of
 * `docs/reverse-teaching-readiness-2026-07-29.md`).
 *
 * Walks a module's COMPILED lesson steps (the same shape every step view
 * renders — IR-compiled and hand-TS modules alike, since both produce the
 * identical `LessonContent` at runtime) and emits an anchor-keyed catalog of
 * every learner-facing English string in that module: atom glosses, step
 * prompts/hints/explanations, MCQ option text, match-pairs meaning targets,
 * and grammar-rule prose (rule / examples / anti-pattern / culture note).
 *
 * Deliberately does NOT parse IR YAML or touch `moduleCompiler.ts` — it
 * loads the same `getMockLessonContent` / `getMockCourse` machinery the app
 * itself calls at render time (mirrors `scripts/restamp-from-module.mjs`'s
 * Vite-SSR boot), so hand-authored (m3) and IR-compiled (m6, m7, …) modules
 * are extracted through one uniform path with no format-specific parsing.
 *
 * Usage:
 *   node scripts/i18n/extract-content-catalog.mjs ja m6
 *   node scripts/i18n/extract-content-catalog.mjs ja m7 --out src/shared/i18n/content
 *   node scripts/i18n/extract-content-catalog.mjs ja m6 --check   # staleness report only, no write
 *
 * Output: src/shared/i18n/content/<lang>/<moduleId>.en.json — see the
 * header comment on that emitted file (written below) for the schema, and
 * `docs/ko-source-rung1a-2026-09-10.md` for the anchor-scheme rationale.
 *
 * SCOPE (rung 1a): only lang="ja" is wired (the KO→JA pilot's target
 * course). Other languages exit with a clear "not wired yet" error rather
 * than emitting a silently-empty catalog.
 *
 * KNOWN LIMITATION (documented, not hidden): this is a targeted-shape
 * extractor, not a fully generic deep-walk over every one of the ~40 step
 * types in `src/features/lesson/types.ts`. It covers the field shapes named
 * in the rung-1a brief (atom glosses, prompts/hints/explanations, MCQ option
 * text, match-pairs meaning targets, grammar-rule prose, titles) plus the
 * common `StepBase` fields. A step type with a bespoke English-bearing field
 * this script doesn't yet know about will silently extract nothing for that
 * field — `docs/ko-source-rung1a-2026-09-10.md` lists the exact fields
 * covered per step type so a rung-1b pass can extend the allowlist rather
 * than rediscover it.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");

// ── CLI args ────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const [lang, moduleId] = positional;
const CHECK = argv.includes("--check");
const outFlagIdx = argv.indexOf("--out");
const OUT_DIR = resolve(
  ROOT,
  outFlagIdx !== -1 ? argv[outFlagIdx + 1] : "src/shared/i18n/content",
);

if (!lang || !moduleId) {
  console.error(
    "Usage: node scripts/i18n/extract-content-catalog.mjs <lang> <moduleId> [--check] [--out <dir>]",
  );
  process.exit(1);
}
if (lang !== "ja") {
  console.error(
    `lang "${lang}" is not wired yet — rung 1a only extracts "ja" (the KO→JA pilot target course). See docs/ko-source-rung1a-2026-09-10.md.`,
  );
  process.exit(1);
}

const sha256Hex16 = (s) =>
  createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

/**
 * Script-agnostic "is this instruction-language gloss text" test — the same
 * shape as the `matchPairsFloor.ts` / `jaSurfaceForms.ts` de-couplings in
 * this same rung: a Unicode letter present, with no Japanese script. Used
 * here to skip extracting JA-script field values that happen to sit next to
 * English ones (so e.g. a MatchPair's kana `source` is never mistaken for
 * learner-facing instruction text).
 */
function isGlossText(s) {
  return typeof s === "string" && /\p{L}/u.test(s) && !/[぀-ヿ一-鿿]/.test(s);
}

function hasJaScript(s) {
  return typeof s === "string" && /[぀-ヿ一-鿿]/.test(s);
}

// The full `kind` enum this extractor emits. Kept as an explicit allowlist
// (rather than inferring the set from usage) so a typo'd kind string at a
// call site fails loudly at extraction time instead of silently shipping a
// bogus classification into the catalog. Declared here (before the SSR
// boot section below, which calls `extract()`) — a `const` declared after
// the call site would throw a TDZ ReferenceError even though it's still
// "before" the function definition lexically.
const KINDS = new Set([
  "atom-gloss",
  "romaji-label",
  "mnemonic",
  "build-prompt",
  "ja-gloss",
  "instruction",
  "explanation",
  "title",
  "mcq-option",
]);

// ── Browser shims (mirrors scripts/restamp-from-module.mjs) ───────────────
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};
globalThis.window = globalThis.window ?? globalThis;
globalThis.addEventListener = globalThis.addEventListener ?? (() => {});
globalThis.removeEventListener = globalThis.removeEventListener ?? (() => {});
globalThis.dispatchEvent = globalThis.dispatchEvent ?? (() => true);
globalThis.matchMedia =
  globalThis.matchMedia ??
  (() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
globalThis.location = globalThis.location ?? {
  protocol: "http:",
  href: "http://localhost/",
  origin: "http://localhost",
  hostname: "localhost",
  pathname: "/",
  search: "",
  hash: "",
};
try {
  Object.defineProperty(globalThis, "navigator", {
    value: { language: "en-US", languages: ["en-US"], userAgent: "node" },
    configurable: true,
  });
} catch {
  /* keep the built-in */
}
globalThis.document = globalThis.document ?? {
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  documentElement: {
    classList: { add() {}, remove() {}, contains: () => false },
    style: {},
  },
  head: { appendChild() {} },
  body: { appendChild() {}, classList: { add() {}, remove() {} } },
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
};

// ── Boot the live machinery through Vite SSR ───────────────────────────────
const { createServer } = await import(
  pathToFileURL(join(ROOT, "node_modules/vite/dist/node/index.js")).href
);
const server = await createServer({
  root: ROOT,
  configFile: join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

let entries;
const realLog = console.log;
const realWarn = console.warn;
const realInfo = console.info;
console.log = () => {};
console.warn = () => {};
console.info = () => {};
try {
  const mockLessons = await server.ssrLoadModule(
    "/src/features/lesson/data/mockLessons.ts",
  );
  const mockCourse = await server.ssrLoadModule("/src/shared/domain/mockCourse.ts");
  const courseAtomsMod = await server.ssrLoadModule(
    "/src/features/languages/ja/courseAtoms.ts",
  );
  const kanaTableMod = await server.ssrLoadModule(
    "/src/shared/japanese/kanaTable.ts",
  );
  entries = extract({
    getMockLessonContent: mockLessons.getMockLessonContent,
    getMockCourse: mockCourse.getMockCourse,
    JA_COURSE_ATOMS: courseAtomsMod.JA_COURSE_ATOMS,
    KANA_ROMAJI: kanaTableMod.KANA_ROMAJI,
  });
} finally {
  console.log = realLog;
  console.warn = realWarn;
  console.info = realInfo;
  await server.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// Extraction
// ═══════════════════════════════════════════════════════════════════════════

function extract({ getMockLessonContent, getMockCourse, JA_COURSE_ATOMS, KANA_ROMAJI }) {
  /** @type {Map<string, {anchor:string, en:string, enSourceHash:string, kind:string, source:string[]}>} */
  const out = new Map();

  const add = (anchor, en, source, kind) => {
    if (!isGlossText(en)) return;
    const text = en.trim();
    if (!text) return;
    if (!KINDS.has(kind)) {
      throw new Error(
        `[extract-content-catalog] unknown kind "${kind}" for anchor "${anchor}" (source: ${source.join("/")}) — add it to KINDS or fix the call site.`,
      );
    }
    const existing = out.get(anchor);
    if (existing) {
      // Same anchor, different text is a real collision — surface it loudly
      // rather than silently keeping the first write.
      if (existing.en !== text) {
        realWarn(
          `[extract-content-catalog] anchor collision: "${anchor}" already has "${existing.en}", now also "${text}" (source: ${source.join("/")}) — keeping the first, please widen the anchor.`,
        );
      }
      existing.source.push(source.join("/"));
      return;
    }
    out.set(anchor, {
      anchor,
      en: text,
      enSourceHash: sha256Hex16(text),
      kind,
      source: [source.join("/")],
    });
  };

  // ── 1. Atom glosses — every atom this module introduces ─────────────
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.fromModule !== moduleId) continue;
    add(
      `${moduleId}/atom:${atom.kana}/gloss`,
      atom.meaningEn,
      ["atom", atom.kana, "meaningEn"],
      "atom-gloss",
    );
    if (atom.shortGloss) {
      add(
        `${moduleId}/atom:${atom.kana}/shortGloss`,
        atom.shortGloss,
        ["atom", atom.kana, "shortGloss"],
        "atom-gloss",
      );
    }
  }

  // ── 2. Lesson ids in this module, course order ───────────────────────
  const course = getMockCourse("ja");
  const mod = (course.modules ?? []).find((m) => m.id === moduleId);
  if (!mod) {
    realWarn(`[extract-content-catalog] module "${moduleId}" not found in getMockCourse("ja")`);
    return out;
  }
  const lessonIds = [];
  for (const l of mod.lessons ?? []) lessonIds.push(l.id);
  for (const g of mod.lessonGroups ?? []) for (const l of g.lessons ?? []) lessonIds.push(l.id);

  for (const lessonId of lessonIds) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson) {
      realWarn(`[extract-content-catalog] getMockLessonContent("${lessonId}") returned null — skipped`);
      continue;
    }

    if (lesson.title) {
      add(
        `${moduleId}/${lessonId}/en:${sha256Hex16(lesson.title)}`,
        lesson.title,
        [lessonId, "title"],
        "title",
      );
    }

    for (const step of lesson.steps ?? []) {
      extractStep(step, lessonId, add, KANA_ROMAJI);
    }
  }

  return out;
}

/** A `{ja, en}` (± romaji) example pair — grammar_rule examples/antiPattern. */
function isExampleShape(v) {
  return (
    v &&
    typeof v === "object" &&
    typeof v.ja === "string" &&
    typeof v.en === "string"
  );
}

function extractStep(step, lessonId, add, KANA_ROMAJI) {
  const stepId = step.id ?? "?";

  // Common StepBase fields.
  if (step.hint) {
    // Generic pre-answer nudge — UI chrome, not content being glossed.
    add(
      `${moduleId}/${lessonId}/en:${sha256Hex16(step.hint)}`,
      step.hint,
      [lessonId, stepId, "hint"],
      "instruction",
    );
  }
  if (step.explanation) {
    // NOTE (rung 1b, 2026-09-10): this anchor was missing the `${moduleId}/`
    // prefix every sibling field carries, so it keyed on a bare `lessonId`
    // — `resolveContentString`'s `moduleIdFromAnchor` would then treat the
    // LESSON id as a module id and never find a real `<moduleId>.<lang>.json`
    // catalog, silently dropping all `explanation` coverage forever. Fixed
    // to match `hint`/`body`/`title`/etc. Anchors from a catalog generated
    // before this fix won't match new runtime anchors (a fresh
    // `--check`/extract run picks up the corrected shape automatically —
    // no translated `explanation` entries existed yet to go stale).
    add(
      `${moduleId}/${lessonId}/en:${sha256Hex16(step.explanation)}`,
      step.explanation,
      [lessonId, stepId, "explanation"],
      "explanation",
    );
  }

  // A `prompt` string sitting directly on the step is the most common
  // shape across step types (MultipleChoice, BuildSentence, FillBlank,
  // ParticleCloze, …). When the step ALSO carries the JA sentence the
  // prompt is about (targetSentence / correctKana / audioText / ja), key
  // off that JA surface per §3c bullet 3; otherwise fall back to the
  // en-string hash per §3c bullet 4.
  //
  // Kind: a `build_sentence`/`listening_build` prompt is a "build" drill
  // instruction (gets the pinned "Build:"/"Build what you hear." drafter
  // treatment) → `build-prompt`. Any other JA-anchored prompt is a gloss of
  // that JA sentence → `ja-gloss` (mirrors the JA sentence's own register
  // per docs/ko-content-conventions-2026-09-10.md §1). A prompt with no JA
  // backing (pure UI instruction, e.g. "Pick the word for X") →
  // `instruction`.
  if (typeof step.prompt === "string") {
    const jaAnchor =
      step.targetSentence ?? step.correctKana ?? step.audioText ?? step.ja;
    const jaBacked = typeof jaAnchor === "string" && hasJaScript(jaAnchor);
    const anchor = jaBacked
      ? `${moduleId}/${lessonId}/ja:${jaAnchor}`
      : `${moduleId}/${lessonId}/en:${sha256Hex16(step.prompt)}`;
    const isBuildPrompt = step.type === "build_sentence" || step.type === "listening_build";
    const kind = isBuildPrompt ? "build-prompt" : jaBacked ? "ja-gloss" : "instruction";
    add(anchor, step.prompt, [lessonId, stepId, "prompt"], kind);
  }

  if (typeof step.body === "string") {
    // Info-step prose — explanatory body copy.
    add(
      `${moduleId}/${lessonId}/en:${sha256Hex16(step.body)}`,
      step.body,
      [lessonId, stepId, "body"],
      "explanation",
    );
  }
  if (typeof step.cultureNote === "string") {
    add(
      `${moduleId}/${lessonId}/en:${sha256Hex16(step.cultureNote)}`,
      step.cultureNote,
      [lessonId, stepId, "cultureNote"],
      "explanation",
    );
  }
  if (typeof step.title === "string") {
    add(
      `${moduleId}/${lessonId}/en:${sha256Hex16(step.title)}`,
      step.title,
      [lessonId, stepId, "title"],
      "title",
    );
  }

  // symbol_intro: kana mnemonic hint ("looks like a wave…"). Module-scoped
  // anchor (not lesson-scoped) mirroring the atom-gloss shape — see
  // `symbolIntroHintAnchor` in `src/shared/i18n/content/anchors.ts`, which
  // this MUST stay byte-identical to.
  if (step.type === "symbol_intro" && step.payload && typeof step.payload.hint === "string") {
    const symbol = step.payload.symbol;
    if (typeof symbol === "string" && symbol) {
      add(
        `${moduleId}/symbolIntro:${symbol}/hint`,
        step.payload.hint,
        [lessonId, stepId, "payload.hint"],
        "mnemonic",
      );
    }
  }

  // grammar_rule: rule prose + examples + antiPattern, keyed by
  // grammarPointId when the card maps to one (§3c bullet 2), else by
  // stepId (still stable — steps don't get reordered independent of the
  // lesson they live in for extraction purposes; a positional-id caveat is
  // noted in docs/ko-source-rung1a-2026-09-10.md).
  if (step.type === "grammar_rule") {
    const gp = step.grammarPointId ?? `step:${stepId}`;
    if (typeof step.rule === "string") {
      add(`${moduleId}/gp:${gp}/rule`, step.rule, [lessonId, stepId, "rule"], "explanation");
    }
    for (const ex of step.examples ?? []) {
      if (isExampleShape(ex)) {
        add(
          `${moduleId}/gp:${gp}/ex:${ex.ja}`,
          ex.en,
          [lessonId, stepId, "examples[].en"],
          "ja-gloss",
        );
      }
    }
    if (isExampleShape(step.antiPattern)) {
      add(
        `${moduleId}/gp:${gp}/ex:${step.antiPattern.ja}`,
        step.antiPattern.en,
        [lessonId, stepId, "antiPattern.en"],
        "ja-gloss",
      );
      if (typeof step.antiPattern.why === "string") {
        add(
          `${moduleId}/gp:${gp}/antipattern-why`,
          step.antiPattern.why,
          [lessonId, stepId, "antiPattern.why"],
          "explanation",
        );
      }
    }
  }

  // MCQ-family option text (multiple_choice, self_explanation_mcq, …).
  // `symbol_to_sound`'s options are ALWAYS romaji labels for its 2x2 kana
  // grid by that step type's own construction (docstring in
  // SymbolToSoundStepView.tsx) — unconditional `romaji-label`, no lookup
  // needed. Every other MCQ-family option is `mcq-option`.
  if (Array.isArray(step.options)) {
    for (const opt of step.options) {
      if (opt && typeof opt.text === "string") {
        const kind = step.type === "symbol_to_sound" ? "romaji-label" : "mcq-option";
        add(
          `${moduleId}/${lessonId}/en:${sha256Hex16(opt.text)}`,
          opt.text,
          [lessonId, stepId, `options[${opt.id ?? "?"}].text`],
          kind,
        );
      }
    }
  }

  // match_pairs meaning-grid targets (romaji/kana targets are skipped by
  // `add`'s isGlossText guard for romaji-vs-target mismatches, but a
  // romaji-mode pair — `pair.target` IS the exact romaji reading of
  // `pair.source` per KANA_ROMAJI — is NOT skipped by isGlossText (romaji is
  // Latin script), so it must be classified explicitly here. `m3-neo.ts`
  // proves `playAudioOnSelect` alone can't be used as the signal (it also
  // flags kana→English-MEANING match steps like "Squeezing past someone"),
  // so this does an exact case-insensitive KANA_ROMAJI[pair.source] vs
  // pair.target check instead. A match → `romaji-label` (verbatim-copy,
  // no-model-call territory for the drafter); anything else is treated as
  // a gloss of the JA source → `ja-gloss`.
  if (Array.isArray(step.pairs)) {
    for (const pair of step.pairs) {
      if (pair && typeof pair.target === "string") {
        const romaji =
          KANA_ROMAJI && typeof pair.source === "string" ? KANA_ROMAJI[pair.source] : undefined;
        const isRomajiLabel =
          typeof romaji === "string" && romaji.toLowerCase() === pair.target.trim().toLowerCase();
        add(
          `${moduleId}/${lessonId}/en:${sha256Hex16(pair.target)}`,
          pair.target,
          [lessonId, stepId, `pairs[${pair.id ?? "?"}].target`],
          isRomajiLabel ? "romaji-label" : "ja-gloss",
        );
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Output / --check
// ═══════════════════════════════════════════════════════════════════════════

const sortedEntries = [...entries.values()].sort((a, b) =>
  a.anchor < b.anchor ? -1 : a.anchor > b.anchor ? 1 : 0,
);

const catalog = {
  schema: 1,
  moduleId,
  lang,
  generatedAt: new Date().toISOString().slice(0, 10),
  entryCount: sortedEntries.length,
  entries: sortedEntries.map(({ anchor, en, enSourceHash, kind }) => ({
    anchor,
    en,
    enSourceHash,
    kind,
  })),
};

const langDir = join(OUT_DIR, lang);
const enPath = join(langDir, `${moduleId}.en.json`);
const koPath = join(langDir, `${moduleId}.ko.json`);

if (CHECK) {
  let ko = null;
  if (existsSync(koPath)) {
    try {
      ko = JSON.parse(readFileSync(koPath, "utf-8"));
    } catch (err) {
      console.error(`[check] could not parse ${koPath}: ${err.message}`);
      process.exit(1);
    }
  }
  const koByAnchor = new Map((ko?.entries ?? []).map((e) => [e.anchor, e]));
  let fresh = 0;
  let stale = 0;
  let missing = 0;
  const staleAnchors = [];
  const missingAnchors = [];
  for (const e of sortedEntries) {
    const koEntry = koByAnchor.get(e.anchor);
    if (!koEntry) {
      missing++;
      missingAnchors.push(e.anchor);
      continue;
    }
    if (koEntry.enSourceHash !== e.enSourceHash) {
      stale++;
      staleAnchors.push(e.anchor);
    } else {
      fresh++;
    }
  }
  console.log(`[check] ${moduleId} (${lang}): ${sortedEntries.length} en anchors`);
  console.log(`  fresh (ko matches current en):  ${fresh}`);
  console.log(`  stale (en changed since ko):    ${stale}`);
  console.log(`  missing (no ko entry yet):      ${missing}`);
  if (!ko) console.log(`  note: no ${koPath} found — every anchor reports "missing"`);
  if (staleAnchors.length) {
    console.log(`  stale anchors:\n${staleAnchors.map((a) => `    - ${a}`).join("\n")}`);
  }
  process.exit(0);
}

mkdirSync(langDir, { recursive: true });
writeFileSync(enPath, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
console.log(`[extract-content-catalog] ${moduleId} (${lang}): ${sortedEntries.length} anchors → ${enPath}`);
