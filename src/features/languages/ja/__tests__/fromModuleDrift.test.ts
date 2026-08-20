import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { ALL_ROWS } from "@/features/lesson/data/hiraganaCurriculum";
import { JA_COURSE_ATOMS, JA_COURSE_ATOMS_BY_KANA } from "../courseAtoms";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

/**
 * FROMMODULE DRIFT GUARD (R1 landing, 2026-08-20 — successor to the
 * 2026-07-29 truth table this file used to pin).
 *
 * The old test measured fromModule against first-EXERCISED module and froze
 * the mismatch counts (193 early / 44 late). The 2026-08-20 restamp
 * (scripts/restamp-from-module.mjs + Spencer's rulings in
 * docs/restamp-rulings.json) re-derived every tag from the live map, so the
 * doctrine this file enforces is now the real one:
 *
 *   fromModule = the module of the atom's EARLIEST INTRODUCTION —
 *   an IR `introduces:` declaration, an m1/m2 kana-row anchor
 *   (kana+romaji+meaning, graded — R2: "count the word as taught the moment
 *   its introduced"), or a word_image_mcq debut. Exercise alone is NOT an
 *   introduction (the こうえん class).
 *
 * Three guards, no frozen drift:
 *
 *  1. IR-INTRODUCES AGREEMENT — every kana a compiled module declares in
 *     `introduces:` must resolve to an atom whose fromModule is that module
 *     or an EARLIER introduction site (kana-row anchor). This is the exact
 *     regression that produced the m32/m33 wave authored against stale tags:
 *     a new module "introducing" a word the registry says lives elsewhere.
 *  2. USED-BEFORE-TAUGHT — no atom is exercised by an authored non-review
 *     step in a module EARLIER than its fromModule. Known debt is pinned by
 *     name, not by count.
 *  3. EXERCISED-NEVER-INTRODUCED ratchet — atoms that are graded somewhere
 *     but introduced nowhere (R16 teach-them inventory). Count only goes
 *     DOWN; new entries mean a new wave shipped exercises without a teach.
 *
 * Full table: STALE_REPORT=1 npx vitest run fromModuleDrift
 * → /tmp/ja-frommodule-drift.txt
 */

const IR_DIR = join(__dirname, "..", "curriculum", "ir");

function moduleIdxOf(tag: string): number {
  const m = /^m(\d+)$/.exec(tag);
  return m ? parseInt(m[1], 10) : -1;
}

/** kana variants: registry rows join alternates with "/" and compounds with "、". */
function variants(kana: string): string[] {
  return String(kana)
    .split(/[/、]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** m1/m2 kana-row anchor surfaces → the module that anchors them. */
function kanaAnchorModules(): Map<string, "m1" | "m2"> {
  const DAKUTEN_YOON = new Set(
    ALL_ROWS.filter(
      (r) => !["ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"].includes(r.id),
    ).map((r) => r.id),
  );
  const out = new Map<string, "m1" | "m2">();
  for (const row of ALL_ROWS) {
    const mod = DAKUTEN_YOON.has(row.id) ? "m2" : "m1";
    const surfaces = new Set<string>();
    for (const w of row.anchorWords ?? []) surfaces.add(w.kana);
    if (row.build?.answer) surfaces.add(row.build.answer);
    for (const sub of row.subLessons ?? []) {
      for (const w of sub.anchorWords ?? []) surfaces.add(w.kana);
      if (sub.build?.answer) surfaces.add(sub.build.answer);
    }
    for (const s of surfaces) if (!out.has(s)) out.set(s, mod);
  }
  return out;
}

/** lessonId → introduces kana sets, straight from the compiled IR JSON. */
function irIntroduces(): Map<string, { module: string; kana: string[] }> {
  const out = new Map<string, { module: string; kana: string[] }>();
  for (const f of readdirSync(IR_DIR).filter((f) => /^m\d+\.ir\.json$/.test(f))) {
    const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf-8"));
    const mod = ir.module ?? f.replace(/\.ir\.json$/, "");
    for (const lesson of ir.lessons ?? []) {
      const raw = lesson.id as string;
      const id = raw.startsWith("ja-") ? raw : `ja-${raw}`;
      out.set(id, { module: mod, kana: lesson.introduces ?? [] });
    }
  }
  return out;
}

type Walked = {
  firstExercised: Map<string, { moduleIdx: number; lessonId: string; stepId: string }>;
  vmcqIntroduced: Set<string>;
  liveLessonIds: Set<string>;
  exercisedAtomCount: number;
};

function walkCourse(): Walked {
  const course = getMockCourse("ja");
  const liveLessonIds = new Set<string>();
  const vmcqIntroduced = new Set<string>();
  const firstExercised = new Map<
    string,
    { moduleIdx: number; lessonId: string; stepId: string }
  >();
  for (const mod of course.modules) {
    const moduleIdx = parseModuleIndex(mod.id);
    if (moduleIdx <= 0) continue;
    for (const lesson of mod.lessons) {
      liveLessonIds.add(lesson.id);
      const content = getMockLessonContent(lesson.id);
      if (!content) continue;
      const reviewLesson =
        /-neo-review(-\d+)?(-rev)?$/.test(lesson.id) || lesson.kind === "recap";
      for (const step of content.steps) {
        const sid = (step as { id?: string }).id ?? "";
        const derived = /-fill-|-tail-|-rev-|-pad-/.test(sid);
        if (reviewLesson || derived) continue; // authored non-review only
        const ex = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const raw of ex) {
          const atomId = raw.replace(/^ja:/, "");
          // A word_image_mcq IS the vocabulary debut device (inv-30), so its
          // exercised atom counts as INTRODUCED, not merely exercised.
          if ((step as { type?: string }).type === "word_image_mcq")
            vmcqIntroduced.add(atomId);
          if (!firstExercised.has(atomId))
            firstExercised.set(atomId, { moduleIdx, lessonId: lesson.id, stepId: sid });
        }
      }
    }
  }
  return { firstExercised, vmcqIntroduced, liveLessonIds, exercisedAtomCount: firstExercised.size };
}

describe("fromModule drift guard (introduction doctrine)", () => {
  const anchors = kanaAnchorModules();
  const introducesByLesson = irIntroduces();
  const { firstExercised, vmcqIntroduced, liveLessonIds, exercisedAtomCount } = walkCourse();

  // Earliest IR introduction per PRIMARY atom.
  const irIntroModule = new Map<string, number>();
  for (const { module, kana } of introducesByLesson.values()) {
    const mIdx = moduleIdxOf(module);
    if (mIdx < 0) continue;
    for (const k of kana) {
      const atom = JA_COURSE_ATOMS_BY_KANA.get(k);
      if (!atom) continue; // IR-only atom (inflections) — deliberately unregistered
      const prev = irIntroModule.get(atom.id);
      if (prev === undefined || mIdx < prev) irIntroModule.set(atom.id, mIdx);
    }
  }

  it("instrument control: real population, and ちち agrees at m17 both ways", () => {
    expect(exercisedAtomCount).toBeGreaterThan(400);
    // The 2026-07-29 positive control (ちち tagged m8, taught m17) was FIXED
    // by the restamp; the control now asserts the agreement instead — if ちち
    // drifts again in either direction, this fires before the ratchets do.
    const chichi = JA_COURSE_ATOMS.find((a) => a.kana === "ちち")!;
    expect(chichi.fromModule).toBe("m17");
    expect(irIntroModule.get(chichi.id)).toBe(17);
  });

  it("no IR-introduced word carries a tag LATER than its introduction site", () => {
    // A tag EARLIER than an IR introduces entry is legal — a later module may
    // re-introduce a word the learner met before (よむ: m1 ya-row anchor, then
    // the m16 pack; かいもの: m5 picture debut, then m9's price lesson). A tag
    // LATER than the introduction is drift: the registry claims the learner
    // doesn't know a word a lesson already taught.
    // した/きた are exempt by name: m11's introduces are する/くる's plain
    // pasts (IR-only inflections); the kana map resolves them to the untaught
    // nouns 下/北 (the reservedInflections collision class).
    const INFLECTION_COLLISIONS = new Set(["shita", "kita"]);
    const offenders: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      if (INFLECTION_COLLISIONS.has(atom.id)) continue;
      const irMod = irIntroModule.get(atom.id);
      if (irMod === undefined) continue;
      const tag = moduleIdxOf(atom.fromModule);
      if (tag < 0 || tag > irMod)
        offenders.push(
          `${atom.kana} (${atom.id}): fromModule ${atom.fromModule} but ` +
            `IR-introduced at m${irMod}`,
        );
    }
    expect(
      offenders,
      `fromModule claims the word is taught LATER than a live lesson ` +
        `introduces it — the m32/m33 stale-tag regression class. Fix the tag ` +
        `(or the introduces list), never this test:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no atom is exercised by an authored step before its fromModule", () => {
    // Known debt, pinned BY NAME (the audit's reverse check, 2026-08-20):
    // ぎゅうにゅう is dealt by ja-m4-neo-review's match step one module before
    // its m5 vmcq debut — an authored review-lesson step, exempt from the
    // walk's review filter only because the whole lesson id doesn't match the
    // review shape. Remove the entry when the m4 match pool drops it.
    const KNOWN_DEBT = new Set([
      "gyuunyuu", // dealt by ja-m4-neo-review's match step one module before its m5 vmcq debut
      // R16 wave: hand-module exposure before the formal teach — m5-neo's
      // listening/speaking scenes comprehension-expose these long before
      // their tagged homes. Teach them earlier or de-exercise the scenes;
      // never silently restamp (exercise is not introduction — R2).
      "ja-m7-8-warm-irasshai", // いらっしゃいませ — m5-neo-6 shop dialogue ambience
      "p-wo", // を — m5-neo-2 LC attributes it before the m7 particle card
      "suru", // する — m5-neo-5 LC
      "yaru", // やる — m5-neo-5 speaking
      "kuru", // くる — m5-neo-4 LC
      "toriniku", // とりにく — m13-neo-7 sentence predates the m21 teach
      "utau", // うたう — m13-neo-8 sentence predates the m23 teach
    ]);
    const offenders: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      if (KNOWN_DEBT.has(atom.id)) continue;
      const tag = moduleIdxOf(atom.fromModule);
      if (tag < 0) continue; // future / sidequest sentinels
      const hit = firstExercised.get(atom.id);
      if (hit && hit.moduleIdx < tag)
        offenders.push(
          `${atom.kana} (${atom.id}): tagged ${atom.fromModule} but exercised ` +
            `at m${hit.moduleIdx} (${hit.lessonId} / ${hit.stepId})`,
        );
    }
    expect(
      offenders,
      `used before taught (authored, non-review):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("EXERCISED-NEVER-INTRODUCED (R16 teach-them inventory) only goes DOWN", () => {
    // Atoms graded somewhere on the live map but introduced nowhere — no IR
    // introduces, no kana-row anchor. The restamp refuses to move these (an
    // exercising module is not a teaching site — R2), so they hold their tags
    // until the R16 wave authors real introductions.
    // Measured 40 on 2026-08-20 at the R1 landing (the restamp instrument
    // says 28 — it additionally accepts "exercised at exactly the tag module"
    // as confirmation; this guard doesn't, so the m3-m5 hand-module era words
    // with dangling old-course attributions land here too). All 40 are R16
    // teach-them inventory. A NEW entry means a wave shipped grading for a
    // word nothing introduces — the こうえん regression; fix the wave.
    const MAX_INVENTORY = 40;
    const inventory: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      const hasIntro =
        irIntroModule.has(atom.id) ||
        variants(atom.kana).some((v) => anchors.has(v)) ||
        vmcqIntroduced.has(atom.id) ||
        // A LIVE introducedByLessonId is a real teaching site (うん/そう →
        // ja-m3-neo-4); a dangling one is not (isDeadAttribution semantics).
        liveLessonIds.has(atom.introducedByLessonId ?? "") ||
        // kana-lesson attribution counts as taught even when the old lesson id
        // no longer resolves (あい → ja-m1-l1) — the instrument's doctrine.
        /^ja-m[12]-/.test(atom.introducedByLessonId ?? "");
      if (hasIntro) continue;
      const hit = firstExercised.get(atom.id);
      if (hit) inventory.push(`${atom.kana} (${atom.id}) graded at ${hit.lessonId}`);
    }
    expect(
      inventory.length,
      `graded-but-never-introduced atoms (teach them or de-exercise them — ` +
        `never restamp to the exercising module):\n${inventory.join("\n")}`,
    ).toBeLessThanOrEqual(MAX_INVENTORY);
  });

  it("report: full drift table when STALE_REPORT=1", () => {
    if (!process.env.STALE_REPORT) return;
    const lines: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      const irMod = irIntroModule.get(atom.id);
      const anchorMod = variants(atom.kana)
        .map((v) => anchors.get(v))
        .find(Boolean);
      const hit = firstExercised.get(atom.id);
      lines.push(
        [
          atom.kana,
          atom.id,
          `tag ${atom.fromModule}`,
          irMod !== undefined ? `ir m${irMod}` : "ir –",
          anchorMod ? `anchor ${anchorMod}` : "anchor –",
          hit ? `first-ex m${hit.moduleIdx} (${hit.lessonId})` : "never exercised",
        ].join("\t"),
      );
    }
    writeFileSync("/tmp/ja-frommodule-drift.txt", lines.join("\n"));
    expect(true).toBe(true);
  });
});
