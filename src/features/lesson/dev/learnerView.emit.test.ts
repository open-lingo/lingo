import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * THE LEARNER'S VIEW — every lesson in course order, with the answers removed.
 *
 * Built 2026-07-27 for Spencer's learner-simulation QA: an agent walks the
 * whole course in order as a student would, and reports where it cannot
 * answer, where a word arrives unexplained, and where an explanation does not
 * hold up. That only means anything if the agent cannot see the answers, so
 * this emitter is deliberately paranoid about leakage:
 *
 *   - option ids are STRIPPED. The correct option's id is literally
 *     `"correct"` in the compiled data.
 *   - options and tiles are SHUFFLED, deterministically by step id, because
 *     `tiles` ships with the answer tiles first.
 *   - `match_pairs` is split into two independently shuffled columns; the
 *     compiled `pairs` array is the answer key.
 *   - annotations (`targetAnnotation`, `promptAnnotation`,
 *     `transcriptAnnotation`) carry readings and per-token glosses. Gone.
 *   - `reactiveGrammarTip` only appears after a wrong answer. Gone.
 *   - `explanation` follows the answer. Gone.
 *   - `exercisedAtoms` / `exercisedGrammar` are internal bookkeeping a learner
 *     never sees. Gone.
 *
 * What is KEPT is everything the learner is actually given: rule cards in
 * full (that is the teaching), prompts, audio TEXT where the learner hears
 * audio, and the options they must choose between.
 *
 * Run: `npm run learner-view` (skipped in the normal suite — it writes files).
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "../../../../docs/learner-sim");

type Rec = Record<string, unknown>;

/** Deterministic shuffle — same input, same order, every run. Seeded by the
 *  step id so two runs of the emitter never disagree about what the learner
 *  saw. */
function shuffle<T>(items: T[], seedText: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const LETTERS = "ABCDEFGH";

/**
 * An annotation array as the learner SEES it.
 *
 * Annotations were dropped wholesale by the first version of this emitter,
 * on the grounds that they carry readings and per-word glosses. They also
 * carry `surface` — and `surface` is where the kanji lives, because
 * `applyKanjiSurfaces` rewrites the display layer and deliberately never
 * touches `targetPhrase`/`transcript`/tiles (so a kanji can never desync the
 * TTS key or the grader). Stripping annotations therefore hid EVERY kanji in
 * the course: 1,852 annotated segments carry one, from m9 on.
 *
 * The cost of that was a whole simulated learner concluding, in its most
 * serious finding, that "no kanji has ever appeared in a Japanese sentence
 * anywhere in m1-m29" and that three modules were lying to it about a
 * furigana window that had never existed. The course was right and this file
 * was wrong (2026-07-27).
 *
 * Furigana is shown exactly when the renderer shows it: while the window is
 * open, or — for hand-authored segments — whenever the reading differs from
 * the surface. `gloss` stays hidden; per-word English is a crutch the learner
 * does not get for free.
 */
function renderAnnotation(ann: unknown): string {
  if (!Array.isArray(ann)) return "";
  return ann
    .map((raw) => {
      const s = raw as { surface?: string; reading?: string; furiganaWindowOpen?: boolean };
      const surface = s.surface ?? "";
      const reading = s.reading ?? "";
      const floats =
        s.furiganaWindowOpen === true ||
        (s.furiganaWindowOpen === undefined && reading !== "" && reading !== surface);
      return floats && reading !== surface ? `${surface}(${reading})` : surface;
    })
    .join("");
}

function optionTexts(step: Rec): string[] {
  const raw = step.options;
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => {
    if (typeof o === "string") return o;
    const r = o as Rec;
    const word = (r.word ?? r.text ?? r.label ?? "?") as string;
    return r.emoji ? `${r.emoji} ${word}` : word;
  });
}

function renderChoices(step: Rec, id: string): string {
  const opts = shuffle(optionTexts(step), id);
  return opts.map((o, i) => `${LETTERS[i]}) ${o}`).join("   ");
}

/** One step, as the learner meets it. Returns null for steps that show the
 *  learner nothing (there are none today, but a new type should be loud). */
function renderStep(step: Rec, n: number): string {
  const id = String(step.id ?? `step-${n}`);
  const t = String(step.type);
  // The written form of whatever Japanese this step SHOWS. `targetAnnotation`
  // is never rendered — on a build/translate/speaking step it is the answer.
  const shown = renderAnnotation(step.promptAnnotation) || renderAnnotation(step.transcriptAnnotation);
  const written = shown && /[一-鿿]/.test(shown) ? `\n   [as written: ${shown}]` : "";
  const L = (s: string) => `${n}. [${t}] ${s}${written}`;

  switch (t) {
    case "grammar_rule": {
      const ex = ((step.examples ?? []) as Rec[])
        .map((e) => `      · ${e.ja ?? e.kana ?? ""}  —  ${e.en ?? ""}`)
        .join("\n");
      const anti = step.antiPattern
        ? `\n   NOT: ${(step.antiPattern as Rec).ja} — ${(step.antiPattern as Rec).why}`
        : "";
      const culture = step.cultureNote ? `\n   Note: ${step.cultureNote}` : "";
      return L(`RULE CARD — ${step.title ?? ""}\n   ${step.rule ?? ""}${ex ? "\n" + ex : ""}${anti}${culture}`);
    }
    case "build_sentence": {
      const tiles = shuffle((step.tiles ?? []) as string[], id).join(" | ");
      const frame = [step.frameBefore, step.frameAfter].filter(Boolean).join(" … ");
      // The register cue as the learner MEETS it: a picture, plus a 1-3
      // politeness meter drawn as a meter. `audienceLabel` is screen-reader
      // alt text the app never renders as prose, and `politenessHint` is a
      // tier, not a word — joining all three into a string invented the
      // prompt "👵 an elderly neighbour 3", which the first learner walk duly
      // reported as leaked internal data (2026-07-27). It was this emitter's
      // bug, not the course's.
      const meter = step.politenessHint
        ? ` politeness ${"●".repeat(Number(step.politenessHint))}${"○".repeat(3 - Number(step.politenessHint))}`
        : "";
      const cue = step.audienceEmoji ? `${step.audienceEmoji}${meter}` : meter.trim();
      return L(
        `${step.prompt ?? "Build it"}${cue ? `\n   [register cue: ${cue}]` : ""}` +
          `${frame ? `\n   [frame: ${frame}]` : ""}\n   TILES: ${tiles}`,
      );
    }
    case "listening_build": {
      const tiles = shuffle((step.tiles ?? []) as string[], id).join(" | ");
      return L(`${step.prompt ?? "Build what you hear."}\n   AUDIO: ${step.audioKey ?? ""}\n   TILES: ${tiles}`);
    }
    case "listening_comprehension":
      return L(
        `AUDIO: ${step.transcript ?? step.audioKey ?? ""}\n   Q: ${step.question ?? ""}\n   ${renderChoices(step, id)}`,
      );
    case "translate":
      return L(`Translate into Japanese: ${step.sourceText ?? ""}`);
    case "speaking":
      return L(`Say this in Japanese: ${step.translation ?? ""}`);
    case "multiple_choice":
      return L(`${step.prompt ?? ""}\n   ${renderChoices(step, id)}`);
    case "particle_cloze": {
      const p = (step.prompt ?? {}) as Rec;
      return L(
        `Fill the blank: ${p.before ?? ""}___${p.after ?? ""}` +
          `${step.meaningEn ? `\n   (meaning: ${step.meaningEn})` : ""}\n   ${renderChoices(step, id)}`,
      );
    }
    case "word_image_mcq":
      return L(`Which word means this picture? (${step.meaningEn ?? "?"})\n   ${renderChoices(step, id)}`);
    case "kanji_reading":
      return L(`How do you read 【${step.kanji ?? ""}】?\n   ${renderChoices(step, id)}`);
    case "match_pairs": {
      const pairs = (step.pairs ?? []) as Rec[];
      const left = shuffle(pairs.map((p) => String(p.source)), id + "L").join(" | ");
      const right = shuffle(pairs.map((p) => String(p.target)), id + "R").join(" | ");
      return L(`${step.prompt ?? "Match the pairs"}\n   LEFT:  ${left}\n   RIGHT: ${right}`);
    }
    case "dialogue_listen": {
      const lines = ((step.lines ?? []) as Rec[])
        .map((l) => `      ${l.speaker}: ${l.kana ?? l.ja ?? ""}`)
        .join("\n");
      const qs = ((step.questions ?? []) as Rec[])
        .map((q, i) => `      Q${i + 1}: ${q.prompt}\n         ${shuffle(
          ((q.options ?? []) as Rec[]).map((o) => String(o.text ?? o.label ?? "")),
          id + i,
        ).map((o, j) => `${LETTERS[j]}) ${o}`).join("   ")}`)
        .join("\n");
      return L(`DIALOGUE (audio)\n${lines}\n${qs}`);
    }
    case "conjugation_transform": {
      const opts = shuffle(
        [String(step.answer ?? ""), ...((step.distractors ?? []) as string[])],
        id,
      );
      return L(
        `Change 【${step.base ?? ""}】 (${step.baseGloss ?? ""}) into: ${step.formLabel ?? step.form ?? ""}` +
          `\n   ${opts.map((o, i) => `${LETTERS[i]}) ${o}`).join("   ")}`,
      );
    }
    case "self_explanation_mcq":
      return L(`${step.question ?? ""}${step.anchor ? `\n   (about: ${step.anchor})` : ""}\n   ${renderChoices(step, id)}`);
    case "symbol_intro": {
      // Teaching, so it is shown whole — this is where a kana is introduced.
      const p = (step.payload ?? {}) as Rec;
      return L(
        `TEACHES 【${p.symbol ?? ""}】 = "${p.romanization ?? ""}" — ${p.hint ?? ""}` +
          `${p.example ? ` (e.g. ${p.example})` : ""}`,
      );
    }
    case "symbol_trace": {
      const p = (step.payload ?? {}) as Rec;
      return L(`Trace 【${p.symbol ?? ""}】`);
    }
    case "symbol_recognition":
    case "symbol_to_sound": {
      // The payload pairs the symbol with its romanization, which IS the
      // answer — so only the prompt side is shown, plus shuffled options.
      const p = (step.payload ?? {}) as Rec;
      const asked = t === "symbol_recognition" ? `Which kana is "${p.romanization ?? ""}"?` : `How is 【${p.symbol ?? ""}】 read?`;
      return L(`${asked}\n   ${renderChoices(step, id)}`);
    }
    case "row_test":
      return L(`ROW TEST (${step.rowId ?? ""}) — ${((step.items ?? []) as unknown[]).length} items, pass mark ${step.passThreshold ?? "?"}`);
    default:
      return L(`!! UNRENDERED STEP TYPE — the emitter has not been taught this one. Keys: ${Object.keys(step).join(", ")}`);
  }
}

describe("learner view emitter", () => {
  it.skipIf(!process.env.LEARNER_VIEW)("writes docs/learner-sim/<module>.md", () => {
    const course = getMockCourse("ja");
    mkdirSync(OUT_DIR, { recursive: true });
    const index: string[] = [
      "# Learner-view index — the course in order, answers removed",
      "",
      "Generated by `npm run learner-view`. One file per module, lessons in the",
      "order the course presents them. See `HOW-TO-READ.md` before starting.",
      "",
      "| # | module | title | lessons | steps |",
      "| --- | --- | --- | --- | --- |",
    ];

    let n = 0;
    for (const mod of course.modules) {
      if (!mod.lessons?.length) continue;
      // N5 only. The one n4-tier module in the map is the July pilot m30
      // ("Casual register"), which the N4 spine reassigns to n4-01 and the run
      // plan retires — simulating a learner through it would measure content
      // that is on its way out, and its premise ("m29 taught the plain forms")
      // describes a module the rewrite deleted.
      if ((mod as { tier?: string }).tier === "n4") continue;
      n++;
      const out: string[] = [
        `# ${mod.id} — ${mod.title}`,
        "",
        `${mod.eyebrow ?? ""}${mod.summary ? `\n\n${mod.summary}` : ""}`,
        "",
      ];
      let stepCount = 0;
      for (const [li, entry] of mod.lessons.entries()) {
        const lesson = getMockLessonContent(entry.id);
        if (!lesson) {
          out.push(`## Lesson ${li + 1} — ${entry.title} (${entry.id})\n\n_(no content found)_\n`);
          continue;
        }
        out.push(`## Lesson ${li + 1} — ${entry.title} (${entry.id})`, "");
        lesson.steps.forEach((step, si) => {
          stepCount++;
          out.push(renderStep(step as unknown as Rec, si + 1));
        });
        out.push("");
      }
      writeFileSync(join(OUT_DIR, `${mod.id}.md`), out.join("\n") + "\n");
      index.push(`| ${n} | [${mod.id}](${mod.id}.md) | ${mod.title} | ${mod.lessons.length} | ${stepCount} |`);
    }

    writeFileSync(join(OUT_DIR, "INDEX.md"), index.join("\n") + "\n");
  });
});
