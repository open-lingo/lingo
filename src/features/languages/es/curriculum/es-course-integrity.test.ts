/**
 * ES COURSE-WIDE integrity gates (2026-08-24, the m4–m10 wave).
 *
 * The per-module suites check a module against itself; these check the
 * COURSE against itself — the defect classes that only appear between
 * modules, all found the hard way during the m3 sim pass:
 *   1. the recall law is cross-module (a cue:"recall" is licensed by a
 *      printed voicing ANYWHERE earlier in course order — and by nothing
 *      else);
 *   2. an emoji is a meaning: the same emoji bound to two different
 *      surfaces teaches a lie (🚪 meant «la puerta» and «hasta luego»
 *      thirty seconds apart);
 *   3. the world is a fixed cast — a dispatched module must not invent
 *      an NPC;
 *   4. step ids are unique course-wide (review tails and SRS key on them).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_ALL_LESSONS } from "./index";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import type { LessonStep, WordImageMcqStep } from "@/features/lesson/types";

function moduleOf(lessonId: string): string {
  const m = /^es-(m\d+)-/.exec(lessonId);
  return m ? m[1] : "";
}

/** Lessons in true course order (module order, then lesson number). */
const ORDERED = [...ES_ALL_LESSONS].sort((a, b) => {
  const ma = ES_MODULE_ORDER.indexOf(moduleOf(a.id) as never);
  const mb = ES_MODULE_ORDER.indexOf(moduleOf(b.id) as never);
  if (ma !== mb) return ma - mb;
  return Number(/(\d+)$/.exec(a.id)?.[1] ?? 0) - Number(/(\d+)$/.exec(b.id)?.[1] ?? 0);
});

describe("ES course integrity — cross-module", () => {
  it("the recall law holds across the whole course (printed voicing before any recall)", () => {
    const voiced = new Set<string>();
    const bad: string[] = [];
    for (const lesson of ORDERED) {
      for (const s of lesson.steps) {
        if (s.type !== "speaking") continue;
        if (s.cue === "recall") {
          if (!voiced.has(s.targetPhrase)) bad.push(`${lesson.id}/${s.id}: «${s.targetPhrase}»`);
        } else {
          voiced.add(s.targetPhrase);
        }
      }
    }
    expect(bad, `recalls before any printed voicing: ${bad.join("; ")}`).toEqual([]);
  });

  it("an emoji means ONE thing: no emoji is bound to two different surfaces in image MCQs", () => {
    // Digit emojis and flags are inherently 1:1; this catches the rest.
    // KNOWN debt (needs an art decision, not a gate exemption forever):
    //   🚪 — m1 chose it for «hasta luego» before m3 taught «la puerta».
    //   Spencer call recorded in docs/learner-sim/es-m3-FINDINGS.md.
    const KNOWN_DEBT = new Map<string, Set<string>>([
      ["🚪", new Set(["hasta luego", "puerta"])],
    ]);
    const strip = (w: string) => w.replace(/^(el|la|un|una|los|las) /, "");
    const byEmoji = new Map<string, Set<string>>();
    for (const lesson of ORDERED) {
      for (const s of lesson.steps) {
        if (s.type !== "word_image_mcq") continue;
        for (const o of (s as WordImageMcqStep).options) {
          const set = byEmoji.get(o.emoji) ?? new Set<string>();
          set.add(strip(o.word));
          byEmoji.set(o.emoji, set);
        }
      }
    }
    const bad: string[] = [];
    for (const [emoji, surfaces] of byEmoji) {
      if (surfaces.size <= 1) continue;
      const allowed = KNOWN_DEBT.get(emoji);
      if (allowed && [...surfaces].every((x) => allowed.has(x))) continue;
      bad.push(`${emoji} → ${[...surfaces].join(" / ")}`);
    }
    expect(bad, `emoji bound to multiple meanings: ${bad.join("; ")}`).toEqual([]);
  });

  it("the world keeps its cast: no step invents a proper name", () => {
    // Cast + places the course has actually taught. A dispatched module
    // adding a name here must ALSO add the character deliberately (update
    // this list in the same change, with the module that debuts them).
    const ALLOWED = new Set([
      "Ana", "Diego", "Sofía", "María", "Carmen", "Sam",
      "México", "España", "Estados", "Unidos",
    ]);
    const bad: string[] = [];
    const scan = (lessonId: string, stepId: string, text: string) => {
      // Words starting a sentence are capitalized legitimately; only flag
      // capitalized tokens NOT at the start of their sentence.
      for (const m of text.matchAll(/(?<![.!?¡¿]\s?)(?<=\s)([A-ZÁÉÍÓÚÑ][a-záéíóúñü]+)/g)) {
        const w = m[1];
        if (!ALLOWED.has(w)) bad.push(`${lessonId}/${stepId}: "${w}" in "${text}"`);
      }
    };
    for (const lesson of ORDERED) {
      for (const s of lesson.steps) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          if (typeof rec[k] === "string") scan(lesson.id, s.id, rec[k] as string);
        }
        if (Array.isArray(rec.tokens)) scan(lesson.id, s.id, (rec.tokens as string[]).join(" "));
        if (s.type === "dialogue_sim") {
          for (const t of s.turns) {
            scan(lesson.id, s.id, t.npc.kana);
            if (t.reply.mode === "choice") for (const o of t.reply.options) scan(lesson.id, s.id, o.text);
            if (t.reply.mode === "build") scan(lesson.id, s.id, t.reply.tiles.join(" "));
          }
        }
      }
    }
    expect(bad, `unknown proper names: ${bad.slice(0, 8).join("; ")}`).toEqual([]);
  });

  it("step ids are unique across the whole course", () => {
    const seen = new Map<string, string>();
    const bad: string[] = [];
    for (const lesson of ORDERED) {
      for (const s of lesson.steps as LessonStep[]) {
        const prior = seen.get(s.id);
        if (prior && prior !== lesson.id) bad.push(`${s.id} in ${prior} AND ${lesson.id}`);
        seen.set(s.id, lesson.id);
      }
    }
    expect(bad, `duplicate step ids: ${bad.join("; ")}`).toEqual([]);
  });
});
