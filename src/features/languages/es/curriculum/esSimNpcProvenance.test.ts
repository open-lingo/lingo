/**
 * ES course-wide gate — dialogue_sim NPC-LINE word provenance.
 *
 * GAP THIS CLOSES: `es-quality.test.ts`'s describe("ES quality —
 * dialogue_sim content resolves to registered atoms") already runs two
 * checks over dialogue_sim content:
 *   (1) multi-word atom inflection integrity — runs over NPC lines AND
 *       accepted replies (`includeNpc` defaults to `true` there).
 *   (2) word-level provenance (every content word resolves to a
 *       registered atom / taught verb conjugation / function word / proper
 *       name) — runs with `includeNpc = false`, i.e. REPLIES ONLY. That
 *       file's own note explains why: this course has an established,
 *       deliberate "rapido"/"despacio" NPC design pattern (m1–m10, e.g.
 *       es-m2-9's t4-rapido) where an NPC turn runs AHEAD of taught
 *       vocabulary as an immersion device, rescued by the fixed survival
 *       phrase "no entiendo" — checking every NPC word against taught
 *       vocabulary is factually wrong about that design (unscoped, check
 *       (2) found 153 "violations", all 153 in NPC position, zero in
 *       reply position — 2026-09-10 investigation, recorded in that
 *       file).
 *
 * But "NPC content may deliberately run ahead of the vocab calendar as an
 * IMMERSION device" is not the same claim as "an NPC line's words are
 * never checked at all" — m30 L8's NPC line «¿Te lavas las manos?» used
 * «lavas» (tú form), registered nowhere in the atom/verb registry (only
 * lavarse/lavo/lava were), and it shipped unnoticed by any gate: check
 * (2) never looks at NPC text, and check (1) only walks MULTI-WORD atom
 * phrases, not single-word verb-conjugation provenance. docs/es-ir-sources
 * /authoring-rules.md's own "Hard rule: dialogue_sim NPC lines" already
 * states the doctrine check (2) was SUPPOSED to enforce course-wide:
 * "Every NPC line, not just graded replies, must resolve to atoms
 * registered by that lesson's module" (with the rapido/despacio exception
 * carved out separately) — this file is what actually enforces it,
 * because `es-quality.test.ts` is out of scope for this change (a
 * concurrent m31 author owns adjacent course-wide files) and the doctrine
 * gap is real regardless of who fixes it.
 *
 * SCOPE — this gate does NOT re-implement check (2); it is the missing
 * NPC-side half of it, built from the SAME exported primitives check (2)
 * uses (no new provenance rule invented):
 *   - `esTokens`, `ES_FUNCTION_WORDS`, `ES_PROPER_NAMES`,
 *     `getEsGenderCanon`, `getEsPluralCanon` — `../__tests__/
 *     moduleBarGuards.ts` (the same import es-quality.test.ts uses).
 *   - `getEsCourseAtoms` — `../courseAtoms.ts` (cumulative-by-module atom
 *     surface words, same construction as check (2)'s
 *     `cumulativeAtomWordsByModule`).
 *   - `ES_VERB_ENTRIES` — `../conjugationTables.ts` (cumulative-by-module
 *     conjugated-verb-form words, gated on `introducedAtModule`, same
 *     construction as check (2)'s `cumulativeVerbWordsByModule` — this is
 *     the machinery that would have caught «lavas»: lavar/lavarse's own
 *     present-tense forms are keyed by module the same way «hablas» is).
 *   - `ES_MODULE_ORDER` — `../grammarHelpers.ts`.
 *   - `ES_ALL_LESSONS` — `./index.ts` (the same course-wide lesson
 *     inventory es-quality.test.ts iterates; not a glob — ES has no glob
 *     collector, `index.ts` explicitly imports each `mN.ts`'s named
 *     `LESSONS` export, so no `*.test.ts` file is ever swept in).
 *
 * FIELDS SCANNED (`DialogueSimTurn`, `src/features/lesson/types.ts`):
 * enumerated so the exclusions are a decision, not an oversight.
 *   - `npc.kana` (Spanish, shown) — SCANNED.
 *   - `npc.audioText` (Spanish TTS-lookup override, only when it differs
 *     from `kana`) — SCANNED, mirrors check (1)/(2)'s own npc-audio
 *     branch.
 *   - `goal` — English cue ("You brought your own bag — turn it down.").
 *     Not Spanish. Not scanned.
 *   - `reply` (build/choice) — accepted-reply text. Already covered by
 *     `es-quality.test.ts` check (2) (`includeNpc` defaults true there
 *     covers check (1); check (2) itself IS the reply scan). Re-checking
 *     it here would duplicate that gate, not close a gap. Not scanned.
 *   - `replyGloss` — English gloss of the model reply. Not Spanish. Not
 *     scanned.
 *   - `explanation` — English post-commit rationale prose that frequently
 *     quotes Spanish forms in «guillemets», INCLUDING deliberately WRONG
 *     contrastive forms for teaching ("«mano pequeña», not «pequeño»" —
 *     the "grade answers, not every string" doctrine: this text exists to
 *     explain a contrast, not to expose the learner to a line they must
 *     decode, and scanning it would flag intentional foils as defects.
 *     Not scanned.
 *   - `scene.{emoji,title,setting}` — module-level framing text, not a
 *     turn field, English. Not scanned.
 * There is no separate "tease" or "feedback" field on this course's
 * `DialogueSimStep`/`DialogueSimTurn` shape (unlike some other language
 * sims) — `npc` and `reply` are the only per-turn content slots.
 *
 * EXEMPTIONS — identical to check (2)'s, no new rule:
 *   - `ES_FUNCTION_WORDS` / `ES_PROPER_NAMES`.
 *   - plural/gender canon fold (`getEsPluralCanon`/`getEsGenderCanon`) —
 *     only when the raw token itself is not already a known word (a
 *     registered plural/feminine keeps its own identity), same guard
 *     check (2) applies.
 *   - conjugated verb forms cumulative to `introducedAtModule`.
 *
 * RATCHET — this course has an established forward-reference NPC pattern
 * (see above) that predates this gate; per-module `KNOWN_LEGACY` below is
 * the exact, enumerated set of already-shipped NPC words this gate does
 * not fail on. It is SHRINK-ONLY: an entry is removed when the line is
 * fixed or the word becomes registered — never added to for new content.
 * Every entry was investigated against a "simple unregistered-inflection"
 * bar — the «lavas» defect class this gate exists to catch (a form like
 * "lavas" where only "lavarse"/"lavo"/"lava" were registered). A full
 * m1–m30 audit found ZERO current instances of that class — the literal
 * m30 L8 "«lavas»" example never shipped as dialogue_sim NPC content (it
 * exists only as an unscanned `multiple_choice` distractor, per "grade
 * answers, not every string"); every other candidate resolved to class
 * (a), (b), or (c) below. One genuine PROVENANCE-MACHINERY gap was found
 * and fixed instead (not an IR fragment, not an allowlist entry): "tus"
 * (plural of "tu") was missing from `ES_FUNCTION_WORDS` in
 * `moduleBarGuards.ts` — every other possessive in that closed class had
 * both numbers (mi/mis, su/sus, nuestro/nuestra) but "tu" had no plural
 * pair, so "¿y tus amigos?" (m20/m26 NPC lines) tripped this gate before
 * that fix landed.
 */
import "./index";

import { describe, it, expect } from "vitest";
import type { DialogueSimStep, DialogueSimTurn } from "@/features/lesson/types";
import { ES_ALL_LESSONS } from "./index";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_VERB_ENTRIES } from "../conjugationTables";
import {
  esTokens,
  ES_FUNCTION_WORDS,
  ES_PROPER_NAMES,
  getEsGenderCanon,
  getEsPluralCanon,
} from "../__tests__/moduleBarGuards";

const MODULE_ORDER: readonly string[] = ES_MODULE_ORDER;

function moduleOf(lessonId: string): string {
  const m = /^es-(m\d+)-/.exec(lessonId);
  return m ? m[1] : "";
}

/**
 * SHRINK-ONLY per-module allowlist of already-shipped NPC words this gate
 * does not fail on. Exact raw tokens (lowercase, as `esTokens` produces
 * them), scoped per module because provenance is cumulative: the same
 * word can be legacy-allowed in an early module and legitimately taught
 * (no longer needing the allowance) by a later one.
 *
 * MEASURED 2026-09-10, full run against m1–m30, ratchet: must only
 * shrink. Every entry was investigated against `getEsCourseAtoms()` /
 * `ES_VERB_ENTRIES` (m1–m30, all modules, not just ≤ this one) before
 * being allowlisted — none is a "lavas"-class unregistered INFLECTION of
 * an atom already registered by this module or earlier (the one class
 * this gate exists to catch and that a fragment fix would address; a
 * full audit found zero current instances of that class — see this
 * file's investigation note below). Two real classes instead:
 *
 *  (a) FORWARD-REFERENCE to a word the course registers LATER — the
 *      documented rapido/despacio immersion pattern (see file header).
 *      Confirmed by checking the word IS a registered atom or taught
 *      verb form, just not yet at this module:
 *        café→m7, tiene→m5(tener), cine→m9, mañana→m8, quieres→m7,
 *        voy→m9, necesito→m16, tarde→m14, cuando→m23, ir→m28(atom)/
 *        m11(verb paradigm).
 *  (b) NEVER REGISTERED anywhere in m1–m30 — reaction words / discourse
 *      markers / fixed idiom chunks used as NPC flavor across many
 *      modules, apparently a deliberate choice (cognate/tone-decodable
 *      without formal SRS teaching): ay, hora, mira, cita, perfecto,
 *      algo, mmm, todo, genial, pregunta, uf, tanto, vez, alguna, pasó,
 *      cuéntamelo, principio, después. This is a genuine content
 *      question (should some of these become atoms?) that this
 *      engineering task cannot resolve — registering new atoms means
 *      editing `courseAtoms.ts`, owned by the concurrent m31 author and
 *      out of this change's blast radius. Flagged here, not silently
 *      resolved either way.
 *  (c) m2's "despacio" syllable-hyphenated coaching line ("¿Có-mo
 *      es-tás?", the documented slow-pronunciation device) tokenizes
 *      into hyphen-split fragments («có», «mo», «tás») that are not
 *      words at all — a tokenizer artifact of that device (esTokens
 *      splits on the coaching hyphen), not a vocabulary gap. The whole
 *      phrase is «cómo estás», both real, both PRIOR/function words.
 *
 * Never add an entry for NEW content — fix the line (register the word,
 * or use a rescued/registered survival phrase) instead. Removing an
 * entry is always safe; it only tightens the gate.
 */
const KNOWN_LEGACY: Record<string, Set<string>> = {
  m1: new Set(["ay", "café"]),
  m2: new Set([
    "café", "cine", "hora", "ir", "mañana", "quieres", "tiene",
    // (c) syllable-hyphenation tokenizer fragments of «¿Cómo estás?»:
    "có", "mo", "tás",
  ]),
  m3: new Set(["ay", "café", "mira"]),
  m4: new Set(["ay", "cita", "necesito", "perfecto", "voy"]),
  m5: new Set(["perfecto"]),
  m6: new Set(["perfecto"]),
  m7: new Set(["algo", "mmm", "todo"]),
  m8: new Set(["genial", "perfecto"]),
  m9: new Set(["ay", "perfecto", "tarde", "uf"]),
  m10: new Set(["genial", "pregunta"]),
  m20: new Set(["todo"]),
  m22: new Set(["cuando"]),
  m23: new Set(["alguna", "cuéntamelo", "después", "pasó", "principio", "todo", "vez"]),
  m24: new Set(["cuéntamelo", "pasó", "principio", "todo"]),
  m25: new Set(["cuéntamelo", "principio", "todo"]),
  m26: new Set(["cuéntamelo", "principio", "tanto", "todo"]),
  m27: new Set(["cuéntamelo", "principio", "todo"]),
  m28: new Set(["cuéntamelo", "principio", "todo"]),
};

describe("ES quality — dialogue_sim NPC line word provenance (course-wide)", () => {
  const ATOMS = getEsCourseAtoms();

  const cumulativeAtomWordsByModule = new Map<string, Set<string>>();
  {
    const words = new Set<string>();
    for (const m of MODULE_ORDER) {
      for (const a of ATOMS) {
        if (a.fromModule !== m) continue;
        for (const w of esTokens(a.surface)) words.add(w);
      }
      cumulativeAtomWordsByModule.set(m, new Set(words));
    }
  }

  const cumulativeVerbWordsByModule = new Map<string, Set<string>>();
  {
    const words = new Set<string>();
    for (const m of MODULE_ORDER) {
      const n = Number(m.slice(1));
      for (const v of ES_VERB_ENTRIES) {
        if (v.introducedAtModule !== n) continue;
        for (const w of esTokens(v.lemma ?? "")) words.add(w);
        for (const f of Object.values(v.forms ?? {})) {
          if (typeof f === "string") for (const w of esTokens(f)) words.add(w);
        }
      }
      cumulativeVerbWordsByModule.set(m, new Set(words));
    }
  }

  const genderCanon = getEsGenderCanon();
  const pluralCanon = getEsPluralCanon();

  /** NPC-line text only (kana + audioText when it differs) — see the
   *  file-header "FIELDS SCANNED" note for why nothing else is included. */
  function npcTexts(
    step: DialogueSimStep,
    lessonId: string,
  ): Array<{ id: string; text: string }> {
    const out: Array<{ id: string; text: string }> = [];
    for (const t of step.turns as DialogueSimTurn[]) {
      out.push({ id: `${lessonId}/${step.id}/${t.id}/npc`, text: t.npc.kana });
      if (t.npc.audioText && t.npc.audioText !== t.npc.kana) {
        out.push({ id: `${lessonId}/${step.id}/${t.id}/npc-audio`, text: t.npc.audioText });
      }
    }
    return out;
  }

  it(
    "every content word in a dialogue_sim NPC line resolves to a registered atom, a taught verb " +
      "conjugation, a function word, a proper name, or a per-module KNOWN_LEGACY allowance " +
      "(fromModule ≤ N, cumulative) — the NPC-side half of es-quality.test.ts check (2)",
    () => {
      const bad: string[] = [];
      for (const lesson of ES_ALL_LESSONS) {
        const mod = moduleOf(lesson.id);
        if (!mod) continue;
        const knownAtoms = cumulativeAtomWordsByModule.get(mod) ?? new Set<string>();
        const knownVerbs = cumulativeVerbWordsByModule.get(mod) ?? new Set<string>();
        const legacy = KNOWN_LEGACY[mod] ?? new Set<string>();
        for (const step of lesson.steps) {
          if (step.type !== "dialogue_sim") continue;
          for (const { id, text } of npcTexts(step as DialogueSimStep, lesson.id)) {
            for (const raw of esTokens(text)) {
              if (ES_FUNCTION_WORDS.has(raw) || ES_PROPER_NAMES.has(raw)) continue;
              const t = knownAtoms.has(raw)
                ? raw
                : (pluralCanon.get(raw) ?? genderCanon.get(raw) ?? raw);
              if (knownAtoms.has(t) || knownVerbs.has(raw) || knownVerbs.has(t)) continue;
              if (legacy.has(raw)) continue;
              bad.push(`${id}: unregistered word "${raw}" in "${text}" (module ${mod})`);
            }
          }
        }
      }
      expect(
        bad,
        `unregistered word in dialogue_sim NPC line (fromModule ≤ N):\n${bad.join("\n")}`,
      ).toEqual([]);
    },
  );
});
