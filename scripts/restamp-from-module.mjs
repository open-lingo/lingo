#!/usr/bin/env node
/**
 * fromModule RE-STAMP MIGRATION (B071 — bulk correction of stale provenance).
 *
 *   node scripts/restamp-from-module.mjs                 # DRY-RUN (default): full diff, no writes
 *   node scripts/restamp-from-module.mjs --json <path>   # + machine-readable derivation dump
 *   node scripts/restamp-from-module.mjs --apply         # re-stamp courseAtoms.ts IN PLACE
 *
 * WHAT IT DOES
 * ------------
 * `courseAtoms.ts` `fromModule` is OLD-course provenance ("stale by
 * construction" — compile-ir.mjs), yet it is load-bearing in live code: the D2
 * content-review gate, every `getAtomsUpToModule` pool (dynamic review
 * prefix, pad fill, match-pairs fill), placement seeding
 * (`applyPlacementResult`), the module-fallback unlock path, the grammar-review
 * comprehensibility gate, kanji-surface eligibility, and the map/vocab UIs all
 * read it. This script derives every JA atom's TRUE teaching site on the LIVE
 * map and proposes (dry-run) or performs (--apply) the re-stamp.
 *
 * DERIVATION (reuses the live machinery — no re-invented scans)
 * ------------------------------------------------------------
 * Boots the real app modules through Vite SSR (same code the app runs — the
 * IR-compiled lessons, `getMockLessonContent`, the course map, the attribution
 * index) and walks the live map in learner order, exactly like the checked-in
 * instruments (`fromModuleDrift.test.ts`, `atomExposureAudit.test.ts`,
 * `lessonAtomAttribution.test.ts` — m1/m2 row sub-lessons included). Evidence
 * per atom, strongest first:
 *
 *   1. IR per-lesson `introduces` (compiled mN.ir.json — the module compiler's
 *      own declaration of the teaching site), surfaces resolved to atoms by
 *      EXACT variant match + the JA_PRIMARY_ATOM_BY_KANA homograph ruling
 *      (Rule Zero: never substring-match Japanese).
 *   2. A live, resolvable, on-map `introducedByLessonId` (isDeadAttribution
 *      semantics: a dangling pointer is ignored).
 *   3. First step whose `exercisedAtoms` names the atom id (the compiler's own
 *      attribution — the drift ratchet's definition of the real teaching site).
 *
 * Tile evidence is recorded but NEVER sets truth on its own: a tile can be a
 * seeded distractor, and "distractor exposure doesn't count" is the
 * kanaWordIntroOrder law. The pad pass (B088) makes tiles render-time-variable
 * anyway.
 *
 * CLASSIFICATION (docs/fromModule-restamp-report-2026-08-09.md §2)
 * ---------------------------------------------------------------
 *   match         fromModule equals the earliest live teaching site → no-op.
 *   kana-row      taught by an m1/m2 kana row (M1/M2 vocab WORDS are taught +
 *                 SRS-eligible per CLAUDE.md §SRS — kana GLYPH drills are the
 *                 only exclusion). Kept unless the tag itself is wrong.
 *   restamp       taught, wrong module → re-stamp to the true module.
 *   never-taught  no live lesson introduces it → re-stamp to the "future"
 *                 sentinel (the 2026-08-09 A2 precedent: truthful until
 *                 something teaches it).
 *   ambiguous     multi-site / conflicting / tile-only / off-map-only /
 *                 sidequest evidence → NO action; listed with candidates for a
 *                 human ruling.
 *
 * --apply re-stamps ONLY `restamp`, `kana-row`(wrong-tag) and `never-taught`
 * rows, verifies every edit target uniquely before writing, and writes the
 * file once (all-or-nothing). It NEVER touches `introducedByLessonId` (the
 * dangling-attribution ratchet is a separate cleanup) and NEVER touches
 * `conjugationTables.ts` `introducedAtModule` (separate field — B086).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_ATOMS_PATH = path.join(
  ROOT,
  "src/features/languages/ja/courseAtoms.ts",
);
const IR_DIR = path.join(ROOT, "src/features/languages/ja/curriculum/ir");

// ── CLI ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const jsonIdx = argv.indexOf("--json");
const JSON_OUT = jsonIdx !== -1 ? argv[jsonIdx + 1] : null;
if (jsonIdx !== -1 && !JSON_OUT) {
  console.error("--json requires a path");
  process.exit(2);
}

// ── Browser shims (data modules touch storage/window at import or call time;
//    an in-memory store keeps them inert — nothing is persisted) ───────────
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
  pathToFileURL(path.join(ROOT, "node_modules/vite/dist/node/index.js")).href
);
const server = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

let result;
// Import-time authoring lints ([lessonDensity] …) log to console; keep the
// dry-run diff clean by muting non-error console output during the boot.
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
  const mockCourse = await server.ssrLoadModule(
    "/src/shared/domain/mockCourse.ts",
  );
  const courseAtomsMod = await server.ssrLoadModule(
    "/src/features/languages/ja/courseAtoms.ts",
  );
  const hiragana = await server.ssrLoadModule(
    "/src/features/lesson/data/generatedHiraganaLessons.ts",
  );
  const stepPredicates = await server.ssrLoadModule(
    "/src/features/lesson/data/_stepPredicates.ts",
  );
  const hiraganaCurriculum = await server.ssrLoadModule(
    "/src/features/lesson/data/hiraganaCurriculum.ts",
  );
  const conjugationTables = await server.ssrLoadModule(
    "/src/features/languages/ja/conjugationTables.ts",
  );

  result = derive({
    getMockLessonContent: mockLessons.getMockLessonContent,
    getAvailableMockLessonIds: mockLessons.getAvailableMockLessonIds,
    getMockCourse: mockCourse.getMockCourse,
    JA_COURSE_ATOMS: courseAtomsMod.JA_COURSE_ATOMS,
    JA_PRIMARY_ATOM_BY_KANA: courseAtomsMod.JA_PRIMARY_ATOM_BY_KANA,
    isSrsEligibleAtom: courseAtomsMod.isSrsEligibleAtom,
    ROW_SUB_LESSON_IDS: hiragana.ROW_SUB_LESSON_IDS,
    isGradedStep: stepPredicates.isGradedStep,
    ALL_ROWS: hiraganaCurriculum.ALL_ROWS,
    VERB_ENTRIES: conjugationTables.VERB_ENTRIES,
    ADJ_ENTRIES: conjugationTables.ADJ_ENTRIES,
  });
} finally {
  console.log = realLog;
  console.warn = realWarn;
  console.info = realInfo;
  await server.close();
}

report(result);
if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(result, null, 1));
  console.error(`\n[json] derivation dump → ${JSON_OUT}`);
}
if (APPLY) {
  applyRestamp(result);
} else {
  console.error(
    "\nDRY-RUN — no files were modified. Re-run with --apply to re-stamp courseAtoms.ts.",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Derivation
// ═══════════════════════════════════════════════════════════════════════════
function derive(api) {
  const {
    getMockLessonContent,
    getMockCourse,
    JA_COURSE_ATOMS,
    JA_PRIMARY_ATOM_BY_KANA,
    isSrsEligibleAtom,
    ROW_SUB_LESSON_IDS,
    isGradedStep,
    ALL_ROWS,
    VERB_ENTRIES,
    ADJ_ENTRIES,
  } = api;

  // Reserved inflection surfaces (grammarHelpers `reservedInflections`,
  // rebuilt from the same tables): した is both 下 and する's past, きた both
  // 北 and くる's past. A surface in this set NEVER resolves to a vocab atom
  // (surface evidence), and an atom whose every kana variant is reserved gets
  // a human ruling instead of a re-stamp — the reviewTailSrs collision guard
  // depends on those atoms' provenance staying later-or-non-module.
  const reservedInflections = new Set();
  for (const v of VERB_ENTRIES) {
    for (const [form, surface] of Object.entries(v.forms ?? {})) {
      if (form !== "dictionary" && surface) reservedInflections.add(surface);
    }
  }
  for (const a of ADJ_ENTRIES) {
    for (const [form, surface] of Object.entries(a.forms ?? {})) {
      if (form !== "present" && surface) reservedInflections.add(surface);
    }
  }

  const splitVariants = (s) =>
    (s ?? "")
      .split(/[/、,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  const surfacesOf = (atom) => [
    ...splitVariants(atom.kana),
    ...(atom.kanji ? splitVariants(atom.kanji) : []),
  ];
  const stripLang = (id) => id.replace(/^ja:/, "");

  // Surface → winning atom id: exact variant match; kana homographs resolve
  // through the ruling table, then first-wins (JA_COURSE_ATOMS_BY_KANA
  // semantics). Kanji variants are matched exactly too (collisions → all
  // candidates, reported as ambiguity, never guessed).
  const bySurface = new Map(); // surface -> [atomId, ...] in registry order
  for (const a of JA_COURSE_ATOMS) {
    for (const s of surfacesOf(a)) {
      const arr = bySurface.get(s) ?? [];
      arr.push(a.id);
      bySurface.set(s, arr);
    }
  }
  const resolveSurface = (surface) => {
    // Inflected verb/adjective surfaces never resolve to vocab atoms (した ≠
    // 下 in running content) — same refusal as resolveEligibleKanjiAtomId.
    if (reservedInflections.has(surface)) return { id: null, ambiguous: false };
    const ids = bySurface.get(surface);
    if (!ids || ids.length === 0) return { id: null, ambiguous: false };
    if (ids.length === 1) return { id: ids[0], ambiguous: false };
    const ruled = JA_PRIMARY_ATOM_BY_KANA[surface];
    if (ruled && ids.includes(ruled)) return { id: ruled, ambiguous: false };
    return { id: ids[0], ambiguous: true }; // first-wins, flagged
  };

  // ── Live-map walk (learner order; kana row sub-lessons credited to their
  //    row's module, as in lessonAtomAttribution.test.ts). Quest/story map
  //    rows and non-mN tiles are skipped — they are not module teaching. ───
  const course = getMockCourse("ja");
  const liveModuleIds = course.modules
    .map((m) => m.id)
    .filter((id) => /^m\d+$/.test(id));
  const lessonModule = new Map(); // lessonId -> { moduleId, moduleIdx, order }
  const walk = []; // ordered lesson records
  let order = 0;
  for (const mod of course.modules) {
    if (!/^m\d+$/.test(mod.id)) continue;
    const mIdx = parseInt(mod.id.slice(1), 10);
    for (const lesson of mod.lessons) {
      if (lesson.kind === "story" || lesson.id.startsWith("story:")) continue;
      const ids = [lesson.id];
      const rowId = /^ja-m1-(.+)$/.exec(lesson.id)?.[1];
      if (rowId && ROW_SUB_LESSON_IDS[rowId]) {
        ids.push(...ROW_SUB_LESSON_IDS[rowId]);
      }
      for (const id of ids) {
        if (lessonModule.has(id)) continue;
        lessonModule.set(id, { moduleId: mod.id, moduleIdx: mIdx, order });
        order += 1;
        const content = getMockLessonContent(id);
        if (!content) continue;
        // Review surfaces never INTRODUCE (intro-before-review law): whole
        // review/recap lessons, and review-beat steps inside content lessons
        // (authored `-rev-` beats, appended `-tail-` beats). Their exercised
        // atoms remain grading evidence but never teaching evidence.
        const isReviewLesson =
          /-neo-review(-\d+)?$/.test(id) ||
          /^ja-m\d+-review-\d+$/.test(id) ||
          lesson.kind === "recap" ||
          /-recap$/.test(id);
        const exercisedTeach = [];
        const exercisedAny = [];
        const graded = [];
        const vmcqDebuts = [];
        const tiles = new Set();
        for (const step of content.steps) {
          const ex = (step.exercisedAtoms ?? []).map(stripLang);
          const isReviewStep =
            isReviewLesson ||
            /-rev-/.test(step.id ?? "") ||
            /-tail-/.test(step.id ?? "");
          exercisedAny.push(...ex);
          if (!isReviewStep) exercisedTeach.push(...ex);
          if (isGradedStep(step)) graded.push(...ex);
          // word_image_mcq is THE vocabulary debut device in the hand-authored
          // era (m3-m9, pre-IR `introduces`): a non-review vmcq targeting a
          // word IS its introduction (ぎゅうにゅう → ja-m5-neo-3-vmcq-…).
          // Sentence exercise alone is not (R2, Spencer 2026-08-20).
          if (step.type === "word_image_mcq" && !isReviewStep)
            vmcqDebuts.push(...ex);
          for (const t of step.tiles ?? []) tiles.add(t);
        }
        walk.push({
          lessonId: id,
          moduleId: mod.id,
          moduleIdx: mIdx,
          exercisedTeach,
          exercisedAny,
          graded,
          vmcqDebuts,
          tiles: [...tiles],
        });
      }
    }
  }

  // First evidence per atom from the walk.
  const firstTeachExercised = new Map();
  const firstVmcqDebut = new Map();
  const firstAnyExercised = new Map();
  const firstGraded = new Map();
  const firstTiled = new Map();
  const gradedSites = new Map(); // atomId -> [{lessonId, moduleId, moduleIdx}]
  for (const rec of walk) {
    for (const id of rec.exercisedTeach) {
      if (!firstTeachExercised.has(id)) firstTeachExercised.set(id, rec);
    }
    for (const id of rec.vmcqDebuts ?? []) {
      if (!firstVmcqDebut.has(id)) firstVmcqDebut.set(id, rec);
    }
    for (const id of rec.exercisedAny) {
      if (!firstAnyExercised.has(id)) firstAnyExercised.set(id, rec);
    }
    for (const id of rec.graded) {
      if (!firstGraded.has(id)) firstGraded.set(id, rec);
      const arr = gradedSites.get(id) ?? [];
      if (arr[arr.length - 1]?.lessonId !== rec.lessonId) {
        arr.push({
          lessonId: rec.lessonId,
          moduleId: rec.moduleId,
          moduleIdx: rec.moduleIdx,
        });
      }
      gradedSites.set(id, arr);
    }
    for (const t of rec.tiles) {
      const { id } = resolveSurface(t);
      if (id && !firstTiled.has(id)) firstTiled.set(id, rec);
    }
  }

  // ── M1/M2 kana-row taught words (CLAUDE.md §SRS doctrine: kana-lesson
  //    vocab WORDS count as taught; only kana GLYPH drills are excluded).
  //    Source: the hiragana curriculum's own anchor words + build answers —
  //    the same pool the kana review tails draw from. ──────────────────────
  const kanaRowEvidence = new Map(); // atomId -> { lessonId, moduleId }
  for (const row of ALL_ROWS) {
    const subs = row.subLessons ?? [];
    const rowLessonIds = subs.length
      ? subs.map((s) => `ja-m1-${row.id}-${s.suffix}`)
      : [`ja-m1-${row.id}`];
    const liveRowLessons = rowLessonIds.filter((id) => lessonModule.has(id));
    if (liveRowLessons.length === 0) continue; // row not on the live map
    const surfaces = new Set();
    for (const w of row.anchorWords ?? []) surfaces.add(w.kana);
    if (row.build?.answer) surfaces.add(row.build.answer);
    for (const s of subs) {
      for (const w of s.anchorWords ?? []) surfaces.add(w.kana);
      if (s.build?.answer) surfaces.add(s.build.answer);
    }
    const first = liveRowLessons
      .slice()
      .sort((a, b) => lessonModule.get(a).order - lessonModule.get(b).order)[0];
    const where = lessonModule.get(first);
    for (const surface of surfaces) {
      const { id } = resolveSurface(surface);
      if (!id) continue;
      const prev = kanaRowEvidence.get(id);
      if (!prev || where.order < lessonModule.get(prev.lessonId).order) {
        kanaRowEvidence.set(id, {
          lessonId: first,
          moduleId: where.moduleId,
        });
      }
    }
  }

  // ── IR per-lesson `introduces` (compiled JSON, the compiler's declaration
  //    of the teaching site) ────────────────────────────────────────────────
  const irIntro = new Map(); // atomId -> { lessonId, moduleId, moduleIdx, surface, ambiguous }
  const irFiles = fs
    .readdirSync(IR_DIR)
    .filter((f) => /^m\d+\.ir\.json$/.test(f))
    .sort(
      (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10),
    );
  for (const f of irFiles) {
    const ir = JSON.parse(fs.readFileSync(path.join(IR_DIR, f), "utf8"));
    for (const lesson of ir.lessons ?? []) {
      const lessonId = `ja-${lesson.id}`;
      const where = lessonModule.get(lessonId);
      if (!where) continue; // IR lesson not on the live map → not live teaching
      for (const surface of lesson.introduces ?? []) {
        const { id, ambiguous } = resolveSurface(surface);
        if (!id) continue; // IR-only token (inflections etc.)
        const prev = irIntro.get(id);
        if (!prev || where.order < lessonModule.get(prev.lessonId).order) {
          irIntro.set(id, {
            lessonId,
            moduleId: where.moduleId,
            moduleIdx: where.moduleIdx,
            surface,
            ambiguous,
          });
        }
      }
    }
  }

  // ── Static attribution status (isDeadAttribution semantics) ──────────────
  const attrStatus = (atom) => {
    const lid = atom.introducedByLessonId;
    if (!lid) return { status: "none" };
    const resolves = !!getMockLessonContent(lid);
    if (!resolves) return { status: "dangling", lessonId: lid };
    const where = lessonModule.get(lid);
    if (!where) return { status: "off-map", lessonId: lid };
    return {
      status: "live",
      lessonId: lid,
      moduleId: where.moduleId,
      moduleIdx: where.moduleIdx,
    };
  };

  // ── Classification ───────────────────────────────────────────────────────
  const SENTINELS = new Set(["future", "thr-n4", "m49", "m50"]);
  const KANA_ATTR_RE = /^ja-m[12]-/; // m1/m2 lesson-id space, old + new shapes
  const DAKUTEN_YOON = new Set(
    ALL_ROWS.filter((r) => !["ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"].includes(r.id)).map(
      (r) => r.id,
    ),
  );
  const kanaModuleOfAttr = (lessonId) => {
    if (/^ja-m2-/.test(lessonId)) return "m2";
    const row = /^ja-m1-(?:l\d+-)?([a-z-]+?)(?:-\d+)?$/.exec(lessonId)?.[1];
    if (!row) return "m1";
    return DAKUTEN_YOON.has(row) ? "m2" : "m1";
  };
  const rows = [];
  for (const atom of JA_COURSE_ATOMS) {
    const attr = attrStatus(atom);
    const teachEx = firstTeachExercised.get(atom.id) ?? null;
    const vmcqEx = firstVmcqDebut.get(atom.id) ?? null;
    const anyEx = firstAnyExercised.get(atom.id) ?? null;
    const gr = firstGraded.get(atom.id) ?? null;
    const ti = firstTiled.get(atom.id) ?? null;
    const ir = irIntro.get(atom.id) ?? null;
    const kanaEv = kanaRowEvidence.get(atom.id) ?? null;
    const kanaAttributed =
      !!atom.introducedByLessonId && KANA_ATTR_RE.test(atom.introducedByLessonId);

    // TEACH candidates (may set truth), each with a course-order position.
    const candidates = [];
    if (ir)
      candidates.push({
        kind: "ir-introduces",
        lessonId: ir.lessonId,
        moduleId: ir.moduleId,
        order: lessonModule.get(ir.lessonId).order,
      });
    if (kanaEv)
      candidates.push({
        kind: "kana-row-anchor",
        lessonId: kanaEv.lessonId,
        moduleId: kanaEv.moduleId,
        order: lessonModule.get(kanaEv.lessonId).order,
      });
    else if (kanaAttributed) {
      // Doctrine: kana-lesson-ATTRIBUTED vocab counts as taught even when the
      // old lesson id no longer resolves (あい → ja-m1-l1). Position it at the
      // front of its module.
      const m = kanaModuleOfAttr(atom.introducedByLessonId);
      const firstOfModule = walk.find((w) => w.moduleId === m);
      if (firstOfModule)
        candidates.push({
          kind: "kana-attributed",
          lessonId: atom.introducedByLessonId,
          moduleId: m,
          order: lessonModule.get(firstOfModule.lessonId).order,
        });
    }
    if (attr.status === "live")
      candidates.push({
        kind: "introducedByLessonId",
        lessonId: attr.lessonId,
        moduleId: attr.moduleId,
        order: lessonModule.get(attr.lessonId).order,
      });
    if (vmcqEx)
      candidates.push({
        kind: "vmcq-debut",
        lessonId: vmcqEx.lessonId,
        moduleId: vmcqEx.moduleId,
        order: lessonModule.get(vmcqEx.lessonId).order,
      });
    if (teachEx)
      candidates.push({
        kind: "first-exercised",
        lessonId: teachEx.lessonId,
        moduleId: teachEx.moduleId,
        order: lessonModule.get(teachEx.lessonId).order,
      });

    const earliest = candidates.slice().sort((a, b) => a.order - b.order)[0];
    const candidateModules = [...new Set(candidates.map((c) => c.moduleId))];
    const reviewOnly = !earliest && anyEx; // exercised, but only by review beats

    const row = {
      atomId: atom.id,
      kana: atom.kana,
      kanji: atom.kanji ?? null,
      kind: atom.kind,
      pos: atom.pos,
      srsEligible: isSrsEligibleAtom(atom),
      kanaDrillOnly: !!atom.kanaDrillOnly,
      old: atom.fromModule,
      new: atom.fromModule,
      class: null,
      action: "keep",
      evidenceLessonId: earliest?.lessonId ?? null,
      evidenceKind: earliest?.kind ?? null,
      candidates: candidates.map(({ kind, lessonId, moduleId }) => ({ kind, lessonId, moduleId })),
      reviewOnlyAt: reviewOnly ? anyEx.lessonId : null,
      tiledOnlyAt: !earliest && !anyEx && ti ? ti.lessonId : null,
      attr,
      firstGradedLessonId: gr?.lessonId ?? null,
      note: null,
    };

    if (!earliest) {
      // No teaching evidence on the live map.
      if (reviewOnly) {
        row.class = "ambiguous";
        row.note = `review-only exposure (${anyEx.lessonId}) — intro-before-review says a review beat cannot introduce; intro site missing. Human ruling.`;
      } else if (ti) {
        row.class = "ambiguous";
        row.note = `tile-only exposure at ${ti.lessonId} (likely distractor; kanaWordIntroOrder: distractor exposure is not an introduction)`;
      } else if (attr.status === "off-map") {
        row.class = "ambiguous";
        row.note = `taught only by registered-but-off-map lesson ${attr.lessonId} (deep-link doctrine keeps its unlock honored — human ruling)`;
      } else if (atom.fromModule === "sidequest-survival") {
        row.class = "match";
        row.note = "sidequest sentinel, no live-map teaching — truthful as-is";
      } else if (SENTINELS.has(atom.fromModule)) {
        row.class = "match";
        row.note = "sentinel tag, never taught — truthful as-is";
      } else {
        row.class = "never-taught";
        row.new = "future";
        row.action = "restamp";
      }
      rows.push(row);
      continue;
    }

    // Atom whose every kana variant is a reserved inflection surface: any id
    // evidence is likely the compiler's kana-map collision (the exact class
    // shouldWriteReviewLessonAtom guards — "shita"/"kita" emitted for plain
    // pasts). Never auto-restamp; human ruling.
    if (
      splitVariants(atom.kana).length > 0 &&
      splitVariants(atom.kana).every((v) => reservedInflections.has(v)) &&
      atom.fromModule !== earliest.moduleId
    ) {
      row.class = "ambiguous";
      row.note = `inflection-surface collision (${atom.kana} is a conjugated form of another verb/adj — reviewTailSrs guard class); evidence ${earliest.kind} ${earliest.lessonId} untrusted — human ruling`;
      rows.push(row);
      continue;
    }

    const trueModule = earliest.moduleId;
    const kanaRow = trueModule === "m1" || trueModule === "m2";

    if (atom.fromModule === "sidequest-survival") {
      // Sidequest sentinel vs live-map teaching — register/product decision
      // (the practice-content gate reads sidequest-survival as module 0).
      row.class = "ambiguous";
      row.note = `sidequest-survival tag but live-map teaching evidence at ${earliest.lessonId} — human ruling`;
      rows.push(row);
      continue;
    }

    if (atom.fromModule === trueModule) {
      row.class = kanaRow ? "kana-row" : "match";
      if (candidateModules.length > 1)
        row.note = `multi-site info: also ${candidates
          .filter((c) => c.moduleId !== trueModule)
          .map((c) => `${c.moduleId}(${c.kind})`)
          .join(", ")} — earliest wins, tag already true`;
      rows.push(row);
      continue;
    }

    if (candidateModules.includes(atom.fromModule)) {
      // The tag matches a real but LATER teaching site (word exercised before
      // its declared teach) — a genuine judgement call, never auto-restamped.
      row.class = "ambiguous";
      row.note = `multi-site: tag ${atom.fromModule} matches a LATER site; earliest is ${trueModule} (${earliest.kind} ${earliest.lessonId})`;
      rows.push(row);
      continue;
    }

    const hasKanaCand = candidateModules.some((m) => m === "m1" || m === "m2");
    const hasContentCand = candidateModules.some((m) => m !== "m1" && m !== "m2");
    if (hasKanaCand && hasContentCand) {
      // Kana-row anchor vs content-module teaching, and the tag matches
      // neither: re-stamping either way changes load-bearing behaviour (D2's
      // forward-reference homograph exclusion leans on すし=m7; the M1/M2
      // doctrine says anchor words are taught). Human ruling per word.
      row.class = "ambiguous";
      row.note = `kana-row vs content conflict: candidates span ${candidateModules.join(", ")} (tag ${atom.fromModule} matches none) — human ruling`;
      rows.push(row);
      continue;
    }

    // R2 ruling (Spencer 2026-08-20): "count the word as taught the moment
    // its INTRODUCED." A word whose only teach evidence is graded exercise
    // beats was never introduced anywhere — restamping it to the exercising
    // module would launder the bug into the label. Those are the
    // teach-them-wave inventory (R16/B107 family), not restamps.
    // Live case that forced this branch: こうえん — zero introduces anywhere,
    // heavily exercised by m32 (authored 2026-08-19 against the stale label).
    if (candidates.every((c) => c.kind === "first-exercised")) {
      row.class = "exercised-never-introduced";
      row.note = `graded from ${earliest.lessonId} but no lesson ever introduces it — teach it (R16 wave) or de-exercise it; do not restamp`;
      rows.push(row);
      continue;
    }

    if (candidateModules.length > 1) {
      row.note = `multi-site: candidates span ${candidateModules.join(", ")} — earliest wins`;
    }

    row.class = kanaRow ? "kana-row" : "restamp";
    row.new = trueModule;
    row.action = "restamp";
    rows.push(row);
  }

  // ── Positive controls — refuse to emit a diff from a broken instrument ──
  const control = (pred, label) => {
    const row = rows.find(pred);
    if (!row) throw new Error(`instrument control FAILED: ${label} — no row`);
    return row;
  };
  const controls = [];
  {
    // Known-taught: わるい (m16 pack 6, 2026-07-30) must derive m16.
    {
      const row = control(
        (r) => r.kana.split(/[/、]/)[0].trim() === "わるい" && r.evidenceLessonId,
        "わるい taught",
      );
      const derived = row.new === row.old ? row.old : row.new;
      if (derived !== "m16")
        throw new Error(
          `instrument control FAILED: わるい derived ${derived}, expected m16 (${row.evidenceLessonId})`,
        );
      controls.push(`わるい → m16 (${row.evidenceKind} ${row.evidenceLessonId})`);
    }
    // Known-taught, known-MULTI-SITE: よむ is BOTH the ya-row anchor word
    // ("よむ to read", hiraganaCurriculum ya sub-lesson 3) AND the m16
    // classroom-pack word its tag was re-homed to on 2026-07-30. The
    // instrument must find BOTH sites and refuse to auto-restamp (class
    // ambiguous, human ruling m1-doctrine vs pack re-home).
    {
      const row = control((r) => r.atomId === "yomu" || r.kana === "よむ", "よむ");
      const mods = new Set(row.candidates.map((c) => c.moduleId));
      // Two truthful states: PRE-ruling (tag m16 → ambiguous, both sites
      // found, no auto-restamp) and POST-apply (Spencer's 2026-08-20 ruling
      // written: tag m1, class kana-row). Anything else is instrument drift.
      const preRuling = row.class === "ambiguous" && row.old !== "m1";
      const postApply = row.class === "kana-row" && row.old === "m1" && row.action === "keep";
      if (!mods.has("m16") || !mods.has("m1") || (!preRuling && !postApply))
        throw new Error(
          `instrument control FAILED: よむ should be ambiguous(m16 tag) or kana-row(m1 tag, ruled+applied) with both m1+m16 sites\n${JSON.stringify(row, null, 1)}`,
        );
      controls.push(
        `よむ → multi-site {m1 kana-row anchor, m16 ja-m16-neo pack} — ${postApply ? "ruled m1, applied" : "class ambiguous, no auto-restamp"}`,
      );
    }
    // Known-taught m8 word: ちゃ (atom `cha`) is IR-introduced by m8-neo-5
    // ("ごはん/たべもの/しょくじ/ちゃ") — must derive m8 with live evidence.
    const cha = control((r) => r.atomId === "cha", "ちゃ taught");
    const chaDerived = cha.new === cha.old ? cha.old : cha.new;
    if (chaDerived !== "m8" || !cha.evidenceLessonId)
      throw new Error(
        `instrument control FAILED: ちゃ derived ${chaDerived} (${cha.evidenceLessonId ?? "no evidence"}), expected m8`,
      );
    controls.push(
      `ちゃ → ${chaDerived} (${cha.evidenceKind} ${cha.evidenceLessonId})`,
    );
    // こうえん (park) — the R1 landing (2026-08-20) closed the leak this
    // control used to pin: m32-neo-2 now DECLARES it (introduces + newAtoms),
    // so the truthful derivation is m32 via ir-introduces. The old assertion
    // (exercised-never-introduced) described the defect, not the doctrine.
    const kouen = control((r) => r.kana === "こうえん", "こうえん");
    const kouenDerived = kouen.new === kouen.old ? kouen.old : kouen.new;
    if (kouenDerived !== "m32" || kouen.evidenceKind !== "ir-introduces")
      throw new Error(
        `instrument control FAILED: こうえん should derive m32 via ir-introduces (ja-m32-neo-2 declares it since the R1 landing)\n${JSON.stringify(kouen, null, 1)}`,
      );
    controls.push(
      `こうえん → m32 (${kouen.evidenceKind} ${kouen.evidenceLessonId}; the m32-wave leak, now declared at its teaching site)`,
    );
    // Instructive control — ぎゅうにゅう was "known-untaught" in the 07-29 m8
    // walk, but the live m5-neo now debuts it with a word-image MCQ
    // (ja-m5-neo-3-vmcq-gyuunyuu, hand-verified in m5-neo-a.ts): the
    // instrument must FIND that teaching site, not echo the stale claim.
    const gyuu = control((r) => r.kana === "ぎゅうにゅう", "ぎゅうにゅう");
    if ((gyuu.new === gyuu.old ? gyuu.old : gyuu.new) !== "m5")
      throw new Error(
        `instrument control FAILED: ぎゅうにゅう should derive m5 (ja-m5-neo-3 vmcq debut)\n${JSON.stringify(gyuu, null, 1)}`,
      );
    if (!gyuu.candidates.some((c) => c.kind === "vmcq-debut"))
      throw new Error(
        `instrument control FAILED: ぎゅうにゅう should carry a vmcq-debut candidate (the ja-m5-neo-3 word-image MCQ)\n${JSON.stringify(gyuu.candidates)}`,
      );
    controls.push(
      `ぎゅうにゅう → m5 (${gyuu.evidenceKind} ${gyuu.evidenceLessonId}; was ${gyuu.old} — the 07-29 "untaught" claim is stale)`,
    );
    // The drift test's own hand-verified row: ちち must derive m17.
    const chichi = control((r) => r.kana === "ちち", "ちち");
    const chichiDerived = chichi.new === chichi.old ? chichi.old : chichi.new;
    if (chichiDerived !== "m17")
      throw new Error(
        `instrument control FAILED: ちち derived ${chichiDerived}, expected m17`,
      );
    controls.push(
      `ちち → m17 (${chichi.evidenceKind} ${chichi.evidenceLessonId}; was ${chichi.old})`,
    );
  }
  // Population guard (an empty walk would classify everything never-taught).
  if (firstAnyExercised.size < 400)
    throw new Error(
      `instrument control FAILED: walk exercised only ${firstAnyExercised.size} atoms (<400)`,
    );

  // ── Human rulings (docs/restamp-rulings.json) — applied AFTER the controls
  // so they verify the raw instrument, never the ruled overlay. A ruling may
  // only target a row the instrument itself classed `ambiguous`; anything
  // else is a stale ruling and the run refuses (same doctrine as the
  // no-silent-classes printer guard). `new: null` = explicit keep.
  const rulingsPath = path.join(ROOT, "docs", "restamp-rulings.json");
  if (fs.existsSync(rulingsPath)) {
    const { rulings } = JSON.parse(fs.readFileSync(rulingsPath, "utf8"));
    const byAtomId = new Map(rows.map((r) => [r.atomId, r]));
    for (const [atomId, ruling] of Object.entries(rulings)) {
      const row = byAtomId.get(atomId);
      if (!row) throw new Error(`ruling for unknown atom "${atomId}"`);
      if (row.class !== "ambiguous") {
        // Idempotence after --apply: once a ruled restamp is written, the row
        // re-derives as match/kana-row at the ruled module. Agreement =
        // the machine's effective end state equals the ruling's end state;
        // only a contradiction is an error.
        const machineEnd = row.action === "restamp" ? row.new : row.old;
        const ruledEnd = ruling.new ?? row.old;
        if (machineEnd === ruledEnd) continue;
        throw new Error(
          `ruling for "${atomId}" targets class "${row.class}" (old=${row.old} → machine ${machineEnd}) and CONTRADICTS the ruling end state ${ruledEnd} — stale ruling?`,
        );
      }
      if (ruling.new !== null && ruling.new !== undefined) {
        row.new = ruling.new;
        row.action = ruling.new === row.old ? "keep" : "restamp";
      }
      if (ruling.introducedByLessonId) {
        if (!lessonModule.has(ruling.introducedByLessonId))
          throw new Error(
            `ruling for "${atomId}" repoints introducedByLessonId at "${ruling.introducedByLessonId}", which is not on the live map`,
          );
        row.newIntroducedBy = ruling.introducedByLessonId;
      }
      row.class = "ruled";
      row.note = `${row.note ?? ""} ⊢ RULED: ${ruling.why}`;
    }
    const still = rows.filter((r) => r.class === "ambiguous");
    if (still.length)
      console.error(
        `NOTE: ${still.length} ambiguous rows remain UNRULED: ${still.map((r) => r.kana).join(", ")}`,
      );
  }

  return {
    generatedAt: new Date().toISOString(),
    liveModules: liveModuleIds,
    walkLessonCount: walk.length,
    exercisedAtomCount: firstAnyExercised.size,
    controls,
    rows,
    gradedSites: Object.fromEntries(gradedSites),
    lessonModules: Object.fromEntries(
      [...lessonModule.entries()].map(([k, v]) => [k, v.moduleId]),
    ),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Reporting
// ═══════════════════════════════════════════════════════════════════════════
function report(result) {
  const { rows, controls } = result;
  const byClass = new Map();
  for (const r of rows) byClass.set(r.class, [...(byClass.get(r.class) ?? []), r]);

  console.log(`fromModule re-stamp derivation — ${result.generatedAt}`);
  console.log(
    `walked ${result.walkLessonCount} live lessons; ${result.exercisedAtomCount} atoms exercised`,
  );
  console.log(`\nPOSITIVE CONTROLS (instrument verified before any classification):`);
  for (const c of controls) console.log(`  ✓ ${c}`);

  console.log(`\nCLASSIFICATION SUMMARY (${rows.length} atoms):`);
  const KNOWN_CLASSES = ["match", "kana-row", "restamp", "never-taught", "exercised-never-introduced", "ambiguous", "ruled"];
  {
    // No silent classes: a row whose class the printers don't know would
    // vanish from both the summary and the diff (that exact bug hid the
    // first 37 exercised-never-introduced rows).
    const unknown = rows.filter((r) => !KNOWN_CLASSES.includes(r.class));
    if (unknown.length)
      throw new Error(
        `printer knows no class for ${unknown.length} rows: ${[...new Set(unknown.map((r) => r.class))].join(", ")}`,
      );
  }
  for (const cls of KNOWN_CLASSES) {
    const list = byClass.get(cls) ?? [];
    const changing = list.filter((r) => r.action === "restamp").length;
    console.log(
      `  ${cls.padEnd(13)} ${String(list.length).padStart(4)}  (${changing} re-stamped)`,
    );
  }

  const fmt = (r) =>
    [
      r.class,
      r.kana + (r.kanji ? `(${r.kanji})` : ""),
      r.atomId,
      `${r.old} → ${r.new === r.old ? "·" : r.new}`,
      r.evidenceLessonId
        ? `${r.evidenceKind}:${r.evidenceLessonId}`
        : (r.tiledOnlyAt ? `tile-only:${r.tiledOnlyAt}` : "no-evidence"),
      r.note ?? "",
    ].join("\t");

  // Machine-readable twin of the diff — the independent audit script
  // consumes this instead of parsing the human table.
  fs.writeFileSync(
    path.join(ROOT, "docs", "restamp-rows.json"),
    JSON.stringify(rows, null, 1),
  );
  console.log(`\nFULL DIFF (class · word · atom · old→new · evidence · note):`);
  const orderCls = { restamp: 0, ruled: 1, "never-taught": 2, "exercised-never-introduced": 3, "kana-row": 4, ambiguous: 5, match: 6 };
  const sorted = rows
    .filter(
      (r) =>
        r.action === "restamp" ||
        r.class === "ambiguous" ||
        r.class === "ruled" ||
        r.class === "exercised-never-introduced",
    )
    .sort(
      (a, b) =>
        orderCls[a.class] - orderCls[b.class] ||
        moduleNum(a.old) - moduleNum(b.old) ||
        a.atomId.localeCompare(b.atomId),
    );
  for (const r of sorted) console.log(fmt(r));
  console.log(
    `\n(${rows.length - sorted.length} unchanged match/kana-row rows omitted from the diff body)`,
  );
}

function moduleNum(m) {
  const x = /^m(\d+)$/.exec(m);
  return x ? parseInt(x[1], 10) : 999;
}

// ═══════════════════════════════════════════════════════════════════════════
// Apply (--apply) — all-or-nothing rewrite of courseAtoms.ts
// ═══════════════════════════════════════════════════════════════════════════
function applyRestamp(result) {
  const changes = result.rows.filter((r) => r.action === "restamp");
  let src = fs.readFileSync(COURSE_ATOMS_PATH, "utf8");
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const r of changes) {
    // Anchor on the unique atom id, then the fromModule field within the same
    // object literal (bounded, non-greedy — atoms are one object each).
    const re = new RegExp(
      `(id:\\s*"${esc(r.atomId)}"[\\s\\S]{0,600}?fromModule:\\s*")(${esc(r.old)})(")`,
    );
    const m = re.exec(src);
    if (!m)
      abort(`no unique match for ${r.atomId} (fromModule "${r.old}") — file drifted?`);
    // Uniqueness: the id must appear exactly once as an id field.
    const idCount = src.split(`id: "${r.atomId}"`).length - 1;
    if (idCount !== 1)
      abort(`id "${r.atomId}" appears ${idCount} times — refusing to guess`);
    src = src.replace(re, `$1${r.new}$3`);
  }
  // Ruled repoints: introducedByLessonId moves off a DEAD pointer only when a
  // human ruling names the live teaching lesson (group-4 sidequest words).
  const repoints = result.rows.filter((r) => r.newIntroducedBy);
  for (const r of repoints) {
    const re = new RegExp(
      `(id:\\s*"${esc(r.atomId)}"[\\s\\S]{0,600}?introducedByLessonId:\\s*")([^"]+)(")`,
    );
    if (!re.exec(src))
      abort(`no introducedByLessonId to repoint for ${r.atomId} — file drifted?`);
    src = src.replace(re, `$1${r.newIntroducedBy}$3`);
  }
  fs.writeFileSync(COURSE_ATOMS_PATH, src);
  if (repoints.length)
    console.error(`APPLIED: ${repoints.length} introducedByLessonId repoints (ruled rows).`);
  console.error(
    `\nAPPLIED: ${changes.length} fromModule re-stamps written to ${path.relative(ROOT, COURSE_ATOMS_PATH)}.`,
  );
  console.error(
    "Now: update ratchet pins + GATE_EXEMPTIONS per docs/fromModule-restamp-report-2026-08-09.md §6, then run the full suite.",
  );
}

function abort(msg) {
  console.error(`\nAPPLY ABORTED (no changes written): ${msg}`);
  process.exit(1);
}
