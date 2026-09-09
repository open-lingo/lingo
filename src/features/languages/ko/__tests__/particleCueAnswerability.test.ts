import { describe, expect, it } from "vitest";
import type { LessonContent } from "@/features/lesson/types";

import { KO_M3_LESSONS } from "../curriculum/m3";
import { KO_M4_LESSONS } from "../curriculum/m4";
import { KO_M5_LESSONS } from "../curriculum/m5";
import { KO_M6_LESSONS } from "../curriculum/m6";
import { KO_M7_LESSONS } from "../curriculum/m7";
import { KO_M8_LESSONS } from "../curriculum/m8";
import { KO_M9_LESSONS } from "../curriculum/m9";
import { KO_M10_LESSONS } from "../curriculum/m10";
import { KO_M11_LESSONS } from "../curriculum/m11";
import { KO_M12_LESSONS } from "../curriculum/m12";
import { KO_M13_LESSONS } from "../curriculum/m13";
import { KO_M14_LESSONS } from "../curriculum/m14";
import { KO_M15_LESSONS } from "../curriculum/m15";
import { KO_M16_LESSONS } from "../curriculum/m16";
import { KO_M17_LESSONS } from "../curriculum/m17";
import { KO_M18_LESSONS } from "../curriculum/m18";
import { KO_M19_LESSONS } from "../curriculum/m19";
import { KO_M20_LESSONS } from "../curriculum/m20";
import { KO_M21_LESSONS } from "../curriculum/m21";
import { KO_M22_LESSONS } from "../curriculum/m22";
import { KO_M23_LESSONS } from "../curriculum/m23";
import { KO_M24_LESSONS } from "../curriculum/m24";
import { KO_M25_LESSONS } from "../curriculum/m25";
import { KO_M26_LESSONS } from "../curriculum/m26";
import { KO_M27_LESSONS } from "../curriculum/m27";

/**
 * KO port of the JA "uncued particle prompt" gate
 * (`ja/__tests__/particleCueAnswerability.test.ts`, scripts/particle-cue-scan.mjs).
 *
 * THE FAILURE MODE: a `particle_cloze` step blanks out a Korean particle and
 * asks the learner to pick it from a small option set. `meaningEn` is the
 * ONLY English text rendered BEFORE the learner answers (see
 * `ParticleClozeStepView.tsx` — `showMeaningUpFront` is unconditional;
 * `step.explanation` is a post-submit reveal, so it cannot help the learner
 * decide and is deliberately never consulted here). If `meaningEn` doesn't
 * distinguish which grammatical category the blank belongs to (topic vs.
 * subject vs. object vs. two different senses of "at"), the learner is
 * guessing among options that are ALL plausible English translations of the
 * same gloss — e.g. "이름[__]뭐예요?" ("What is your name?") offers 은
 * (topic) and 이 (subject), and nothing in "What is your name?" tells you
 * which.
 *
 * WHAT DOESN'T COUNT AS A FAILURE — Korean particles alternate their surface
 * form by the preceding sound (은 after a consonant, 는 after a vowel; 이/가;
 * 을/를; 과/와). When only ONE of the offered options survives that
 * phonological filter, the answer is forced by the stem's final sound alone
 * — no semantic cue is needed and the step is answerable. This mirrors the
 * JA gate's own scope discipline (ね/よ/じゃん only, not every particle):
 * here the scope is the seven KO particles callled out as the classic
 * uncued cases — 은/는, 이/가, 을/를, 에/에서, 도, 와/과, 하고 — matched by
 * exact `correctParticle` string. A cloze step is skipped entirely (not
 * scanned, not a finding) when ANY offered option isn't a recognized
 * particle surface — that means the blank is a verb/connective ending
 * (거예요, ㄹ, 지만, 거나, …) that happens to share a spelling with a
 * particle (을 the object marker vs. -을 거예요 the future-tense ending),
 * not an actual particle choice.
 *
 * DEDUPE: none. One finding per step id — a past lesson (JA sentence-final
 * particles, 2026-09-01) is that merging findings by content key hid which
 * ones were actually graded. Every offending step is reported by its own id.
 */

type Finding = {
  lesson: string;
  step: string;
  particle: string;
  options: string[];
  en: string;
};

// ─── Particle inventory ────────────────────────────────────────────────────

type ParticleCategory = "topic" | "subject" | "object" | "and" | "also" | "loc" | "loc-action";

/** Every particle surface that can legitimately appear as an option in a
 *  genuine particle-choice cloze (not an exhaustive KO particle list — just
 *  what shows up as distractors in this course). `phon` is the final-sound
 *  requirement of the STEM immediately before the particle: "consonant" or
 *  "vowel" for an allomorph, null for a form that attaches regardless of
 *  the preceding sound. */
const PARTICLE_INFO: Record<string, { category: ParticleCategory; phon: "consonant" | "vowel" | null }> = {
  은: { category: "topic", phon: "consonant" },
  는: { category: "topic", phon: "vowel" },
  이: { category: "subject", phon: "consonant" },
  가: { category: "subject", phon: "vowel" },
  을: { category: "object", phon: "consonant" },
  를: { category: "object", phon: "vowel" },
  과: { category: "and", phon: "consonant" },
  와: { category: "and", phon: "vowel" },
  하고: { category: "and", phon: null },
  에: { category: "loc", phon: null },
  에서: { category: "loc-action", phon: null },
  도: { category: "also", phon: null },
};

/** Particle surfaces that are NOT in `PARTICLE_INFO` but are still real KO
 *  particles that show up as distractors in these lessons (의, 로, 까지,
 *  부터, 랑, 보다, 중에서…). Recognizing them lets the "every option is a
 *  particle" scope check tell a genuine particle cloze apart from a
 *  verb/connective-ending cloze that happens to reuse a particle's spelling
 *  (future -을 거예요, potential -을 수 있어요, …) without having to also
 *  score them — they're out of this gate's declared scope (step 2/3 of the
 *  task lists only the seven categories above), but their presence as an
 *  option must not make an otherwise-genuine step look unrecognized. */
const OTHER_PARTICLE_SURFACES = new Set([
  "의", "로", "으로", "까지", "부터", "랑", "이랑", "보다", "중에서", "께", "만",
]);

const SCOPED_CATEGORIES = new Set<ParticleCategory>([
  "topic", "subject", "object", "and", "also", "loc", "loc-action",
]);

// ─── Cue lists ─────────────────────────────────────────────────────────────
//
// A cue is text that would let a learner deduce the GRAMMATICAL CATEGORY of
// the blank from `meaningEn` alone, before answering. Kept small and
// specific on purpose: growing this list to launder a real gap is exactly
// the failure the vocab-gate lesson warns about (residual checks that pass
// unusable content). A step that doesn't match gets fixed by adding one of
// these phrases to the curriculum, not by teaching the detector a new
// synonym for "I guess it's fine."
const CUES: Record<ParticleCategory, string[]> = {
  topic: ["as for", "(topic)", "speaking of"],
  subject: ["(subject)", "there's a", "there is a", "there are"],
  object: ["(object)", "object particle"],
  and: ["and", "with"],
  also: ["also", "too"],
  loc: [
    "existence", "(exist", "there's", "there is", "there are", "destination",
    "go to", "goes to", "as far as", "(time)",
  ],
  "loc-action": ["(location of action)", "(action)", "where the action", "at — action", "at action"],
};

function stripFrame(en: string): string {
  return en.toLowerCase();
}

// ─── Phonology ─────────────────────────────────────────────────────────────

/** True if the stem ends on a syllable with a batchim (final consonant),
 *  false if it ends on an open (vowel) syllable, null if no Hangul syllable
 *  block could be found (nothing to filter on). Scans from the end,
 *  skipping trailing punctuation/whitespace/latin — the cloze `before` text
 *  is the Korean sentence up to the blank. */
function hasBatchim(before: string): boolean | null {
  for (let i = before.length - 1; i >= 0; i--) {
    const code = before.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return (code - 0xac00) % 28 !== 0;
    }
  }
  return null;
}

function survivesPhonology(option: string, finalConsonant: boolean | null): boolean {
  const info = PARTICLE_INFO[option];
  if (!info || info.phon === null || finalConsonant === null) return true;
  return info.phon === (finalConsonant ? "consonant" : "vowel");
}

// ─── Scan ──────────────────────────────────────────────────────────────────

function isRecognizedParticleSurface(o: string): boolean {
  return o in PARTICLE_INFO || OTHER_PARTICLE_SURFACES.has(o);
}

function scanLessons(lessons: LessonContent[]): Finding[] {
  const findings: Finding[] = [];
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type !== "particle_cloze") continue;
      const { correctParticle, options, meaningEn, prompt } = step;

      // Scope: every offered option must be a recognized particle surface,
      // or this is a verb/connective-ending cloze (future -을 거예요,
      // potential -을 수 있어요, -거나, -지만, …), not a particle choice.
      if (!options.every(isRecognizedParticleSurface)) continue;

      const info = PARTICLE_INFO[correctParticle];
      if (!info || !SCOPED_CATEGORIES.has(info.category)) continue;

      const finalConsonant = hasBatchim(prompt.before);
      const remaining = options.filter((o) => survivesPhonology(o, finalConsonant));
      const phonologyForced = remaining.length === 1;
      if (phonologyForced) continue;

      const body = stripFrame(meaningEn);
      const cues = CUES[info.category];
      const cued = cues.some((c) => body.includes(c));
      if (cued) continue;

      findings.push({
        lesson: lesson.id,
        step: step.id,
        particle: correctParticle,
        options,
        en: meaningEn,
      });
    }
  }
  return findings;
}

const ALL_MODULES: [string, LessonContent[]][] = [
  ["m3", KO_M3_LESSONS],
  ["m4", KO_M4_LESSONS],
  ["m5", KO_M5_LESSONS],
  ["m6", KO_M6_LESSONS],
  ["m7", KO_M7_LESSONS],
  ["m8", KO_M8_LESSONS],
  ["m9", KO_M9_LESSONS],
  ["m10", KO_M10_LESSONS],
  ["m11", KO_M11_LESSONS],
  ["m12", KO_M12_LESSONS],
  ["m13", KO_M13_LESSONS],
  ["m14", KO_M14_LESSONS],
  ["m15", KO_M15_LESSONS],
  ["m16", KO_M16_LESSONS],
  ["m17", KO_M17_LESSONS],
  ["m18", KO_M18_LESSONS],
  ["m19", KO_M19_LESSONS],
  ["m20", KO_M20_LESSONS],
  ["m21", KO_M21_LESSONS],
  ["m22", KO_M22_LESSONS],
  ["m23", KO_M23_LESSONS],
  ["m24", KO_M24_LESSONS],
  ["m25", KO_M25_LESSONS],
  ["m26", KO_M26_LESSONS],
  ["m27", KO_M27_LESSONS],
];

describe("KO particle cloze blanks are cued by the English before answering", () => {
  let scanned = 0;
  const findings: Finding[] = [];
  for (const [, lessons] of ALL_MODULES) {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        if (step.type === "particle_cloze" && step.correctParticle in PARTICLE_INFO) scanned += 1;
      }
    }
    findings.push(...scanLessons(lessons));
  }

  it("scans a meaningful number of particle_cloze steps", () => {
    // Guards against the scan silently finding nothing (bad import, renamed
    // export, empty module list) and thereby passing green while checking
    // nothing — see particle-cue-scan.mjs's identical guard.
    expect(scanned).toBeGreaterThan(30);
  });

  it("has no particle_cloze blank the English gives no cue for", () => {
    expect(
      findings.map(
        (f) =>
          `${f.lesson} / ${f.step}: blank ${f.particle} options [${f.options.join(", ")}] — no cue in "${f.en}"`,
      ),
    ).toEqual([]);
  });
});
