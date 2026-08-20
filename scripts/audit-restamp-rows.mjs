/**
 * INDEPENDENT AUDIT of the restamp instrument's rows (R1, Spencer 2026-08-20:
 * "have someone else audit what we think is wrong"). This script shares NO
 * traversal code with restamp-from-module.mjs — it re-walks the live course
 * with its own logic and re-verifies every row that proposes a change:
 *
 *   EVIDENCE   every restamp row's evidence lesson really does exercise or
 *              introduce the atom (ir-introduces rows are checked against the
 *              compiled mN.ir.json directly — the raw source, not the walk).
 *   REVERSE    nothing AUTHORED in a module EARLIER than the new label
 *              exercises the atom. Hits here are not instrument errors — they
 *              are the used-before-taught content bugs the report predicted
 *              (§ the "40 failing steps") — but they must be enumerated, not
 *              assumed. Derived steps (-fill- / -tail- / -rev- pads) are
 *              listed separately: they draw on the labels and self-heal.
 *   ORPHAN     never-taught rows have no authored non-review exercise at all.
 *
 * Output: docs/restamp-audit-report.json + a console summary.
 * Exit 1 only on EVIDENCE failures (instrument defects); REVERSE hits are
 * findings for the landing fix-list.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IR_DIR = path.join(ROOT, "src/features/languages/ja/curriculum/ir");

// ── Browser shims (same inert in-memory environment as the instrument) ────
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

const realLog = console.log;
console.log = () => {};
console.warn = () => {};
console.info = () => {};
let rowsPath = path.join(ROOT, "docs", "restamp-rows.json");
try {
  const { getMockLessonContent } = await server.ssrLoadModule(
    "/src/features/lesson/data/mockLessons.ts",
  );
  const { getMockCourse } = await server.ssrLoadModule(
    "/src/shared/domain/mockCourse.ts",
  );
  const { ALL_ROWS } = await server.ssrLoadModule(
    "/src/features/lesson/data/hiraganaCurriculum.ts",
  );
  console.log = realLog;

  const rows = JSON.parse(fs.readFileSync(rowsPath, "utf-8"));
  const course = getMockCourse("ja");

  // ── Own walk: atomId → ordered occurrences ───────────────────────────────
  const occ = new Map(); // atomId -> [{mIdx, lessonId, stepId, type, derived, review}]
  const moduleIdxOf = new Map();
  for (const mod of course.modules) {
    if (!/^m\d+$/.test(mod.id)) continue;
    const mIdx = parseInt(mod.id.slice(1), 10);
    moduleIdxOf.set(mod.id, mIdx);
    for (const lesson of mod.lessons) {
      if (lesson.kind === "story") continue;
      const content = getMockLessonContent(lesson.id);
      if (!content) continue;
      const reviewLesson =
        /-neo-review(-\d+)?(-rev)?$/.test(lesson.id) || lesson.kind === "recap";
      for (const step of content.steps) {
        const sid = step.id ?? "";
        const derived = /-fill-|-tail-|-rev-|-pad-/.test(sid);
        const review = reviewLesson || /-rev-|-tail-/.test(sid);
        for (const raw of step.exercisedAtoms ?? []) {
          const id = raw.replace(/^ja:/, "");
          const arr = occ.get(id) ?? [];
          arr.push({ mIdx, lessonId: lesson.id, stepId: sid, type: step.type, derived, review });
          occ.set(id, arr);
        }
      }
    }
  }

  // ── IR introduces, straight from the compiled JSON (raw source) ──────────
  const irIntroduces = new Map(); // lessonId -> Set(kana surfaces)
  for (const f of fs.readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"))) {
    const ir = JSON.parse(fs.readFileSync(path.join(IR_DIR, f), "utf-8"));
    const mNum = /^m(\d+)/.exec(f)?.[1];
    (ir.lessons ?? []).forEach((l, i) => {
      // Compiled IR stores ids WITHOUT the ja- prefix ("m12-neo-1"); the
      // instrument's evidence ids carry it. Normalize to the prefixed form.
      const raw = l.id ?? `m${mNum}-neo-${i + 1}`;
      const id = raw.startsWith("ja-") ? raw : `ja-${raw}`;
      irIntroduces.set(id, new Set(l.introduces ?? []));
    });
  }
    // courseAtoms kana rows join alternate surfaces with "/" and compound
  // rows with "、" ("より、ほう" ↔ IR introduces ["より", "ほう"]).
  const variants = (kana) =>
    String(kana)
      .split(/[/、]/)
      .map((v) => v.trim())
      .filter(Boolean);

  // ── Kana-row anchor surfaces, straight from the curriculum data ──────────
  // (kana-row sub-lessons carry no exercisedAtoms, so the occ walk cannot see
  // anchor introductions; verify the anchor claim against ALL_ROWS instead.)
  const rowAnchors = new Map(); // row id ("wa") -> Set(kana surfaces)
  for (const row of ALL_ROWS) {
    const s = new Set();
    for (const w of row.anchorWords ?? []) s.add(w.kana);
    if (row.build?.answer) s.add(row.build.answer);
    for (const sub of row.subLessons ?? []) {
      for (const w of sub.anchorWords ?? []) s.add(w.kana);
      if (sub.build?.answer) s.add(sub.build.answer);
    }
    rowAnchors.set(row.id, s);
  }
  const anchorsOf = (lessonId) => {
    const rowId = /^ja-m1-(?:l\d+-)?(.+?)(?:-\d+)?$/.exec(lessonId)?.[1];
    return rowAnchors.get(rowId) ?? new Set();
  };

  const report = { generated: null, evidenceFailures: [], reverseAuthored: [], reverseDerived: [], orphanExercised: [], checked: { restamp: 0, neverTaught: 0, ruled: 0 } };

  for (const r of rows) {
    // Human-ruled rows get the SAME machine checks as their machine-classed
    // twins — a ruling moves the label, it doesn't exempt the evidence.
    if (r.class === "ruled" && r.action === "restamp") {
      report.checked.ruled += 1;
      if (r.new === "future") {
        const hits = (occ.get(r.atomId) ?? []).filter((o) => !o.derived && !o.review);
        for (const o of hits)
          report.orphanExercised.push({ atomId: r.atomId, kana: r.kana, at: `${o.lessonId} ${o.stepId} (${o.type})`, ruled: true });
        continue;
      }
      const newIdx = parseInt(String(r.new).replace(/^m/, ""), 10);
      let ok = false;
      if (r.evidenceKind === "ir-introduces") {
        const intro = irIntroduces.get(r.evidenceLessonId);
        ok = !!intro && variants(r.kana).some((v) => intro.has(v));
      }
      if (!ok && r.evidenceKind === "kana-row-anchor") {
        const anchors = anchorsOf(r.evidenceLessonId);
        ok = variants(r.kana).some((v) => anchors.has(v));
      }
      if (!ok)
        ok = (occ.get(r.atomId) ?? []).some((o) => o.lessonId === r.evidenceLessonId);
      if (!ok)
        report.evidenceFailures.push({ atomId: r.atomId, kana: r.kana, new: r.new, evidence: `${r.evidenceKind}:${r.evidenceLessonId}`, ruled: true });
      for (const o of occ.get(r.atomId) ?? []) {
        if (Number.isFinite(newIdx) && o.mIdx < newIdx) {
          (o.derived ? report.reverseDerived : report.reverseAuthored).push({
            atomId: r.atomId, kana: r.kana, new: r.new, ruled: true,
            at: `${o.lessonId} ${o.stepId} (${o.type}${o.review ? ", review" : ""})`,
          });
        }
      }
      continue;
    }
    if (r.class === "restamp") {
      report.checked.restamp += 1;
      const newIdx = parseInt(String(r.new).replace(/^m/, ""), 10);
      // EVIDENCE
      let ok = false;
      if (r.evidenceKind === "ir-introduces") {
        const intro = irIntroduces.get(r.evidenceLessonId);
        ok = !!intro && variants(r.kana).some((v) => intro.has(v));
      }
      if (!ok)
        ok = (occ.get(r.atomId) ?? []).some((o) => o.lessonId === r.evidenceLessonId);
      if (!ok)
        report.evidenceFailures.push({ atomId: r.atomId, kana: r.kana, new: r.new, evidence: `${r.evidenceKind}:${r.evidenceLessonId}` });
      // REVERSE
      for (const o of occ.get(r.atomId) ?? []) {
        if (Number.isFinite(newIdx) && o.mIdx < newIdx) {
          (o.derived ? report.reverseDerived : report.reverseAuthored).push({
            atomId: r.atomId, kana: r.kana, new: r.new,
            at: `${o.lessonId} ${o.stepId} (${o.type}${o.review ? ", review" : ""})`,
          });
        }
      }
    } else if (r.class === "never-taught") {
      report.checked.neverTaught += 1;
      const hits = (occ.get(r.atomId) ?? []).filter((o) => !o.derived && !o.review);
      for (const o of hits)
        report.orphanExercised.push({ atomId: r.atomId, kana: r.kana, at: `${o.lessonId} ${o.stepId} (${o.type})` });
    }
  }

  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter((x) => { const k = JSON.stringify(x); if (seen.has(k)) return false; seen.add(k); return true; });
  };
  report.reverseAuthored = dedupe(report.reverseAuthored);
  report.reverseDerived = dedupe(report.reverseDerived);
  report.orphanExercised = dedupe(report.orphanExercised);

  fs.writeFileSync(path.join(ROOT, "docs", "restamp-audit-report.json"), JSON.stringify(report, null, 1));
  const uniqAtoms = (arr) => new Set(arr.map((x) => x.atomId)).size;
  console.log(`AUDIT of ${report.checked.restamp} restamp + ${report.checked.neverTaught} never-taught + ${report.checked.ruled} ruled rows`);
  console.log(`  evidence failures (instrument defects):   ${report.evidenceFailures.length}`);
  console.log(`  reverse hits, AUTHORED (fix-list):        ${report.reverseAuthored.length} sites / ${uniqAtoms(report.reverseAuthored)} words`);
  console.log(`  reverse hits, derived (self-healing):     ${report.reverseDerived.length} sites / ${uniqAtoms(report.reverseDerived)} words`);
  console.log(`  never-taught yet authored-exercised:      ${report.orphanExercised.length} sites / ${uniqAtoms(report.orphanExercised)} words`);
  console.log(`  full detail → docs/restamp-audit-report.json`);
  if (report.evidenceFailures.length) {
    console.log("\nEVIDENCE FAILURES:");
    for (const f of report.evidenceFailures) console.log(" ", f.kana, f.new, f.evidence);
    process.exitCode = 1;
  }
} finally {
  console.log = realLog;
  await server.close();
}
