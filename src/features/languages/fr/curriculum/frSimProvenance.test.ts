/**
 * FR dialogue_sim vocab-provenance gate — closes the gap the m17 review
 * (commit 92575c05) found by hand: `moduleBarGuards.ts`'s "vocab provenance"
 * check walks `frSurfaces(step)`, and `frSurfaces` has NO `dialogue_sim`
 * case (m13.ts's own header notes this explicitly — "moduleBarGuards.ts has
 * no `dialogue_sim` case at all — sim content is exempt from the gate").
 * That let «Et la semaine prochaine, j'ai quelque chose de nouveau pour
 * vous…» — a tease line using three never-taught words («prochaine»,
 * «quelque chose», «nouveau») — ship in m17 L10 undetected; only a human
 * review caught it.
 *
 * WHAT THIS WALKS: every `dialogue_sim` step in every FR module m2–m21, all
 * turns, these fields only:
 *   - NPC line: `kana` (always) and `audioText` (when present);
 *   - the reply the learner is actually led to produce/pick:
 *       build mode  — every tile in the bank, `answer`, `alsoAccepted[]`,
 *                      `audioText` (tiles get the SAME treatment as
 *                      `build_sentence` in `frSurfaces` — a max-acceptance
 *                      tile bank is real words even on the wrong-order
 *                      tiles; that is a hard course invariant, not a
 *                      provenance exemption);
 *       choice mode — the CORRECT option's text, every
 *                      `alsoCorrectOptionIds` option's text, `audioText`.
 * WHAT IS DELIBERATELY NOT WALKED, and why:
 *   - wrong (non-correct, non-`alsoCorrectOptionIds`) choice options —
 *     mirrors `frSurfaces`'s own `multiple_choice` case (correct-only) and
 *     "grade answers, not every string": a choice distractor is allowed to
 *     be a wrong-shaped foil (`"d'accord, seize euro"` — missing plural -s)
 *     the same way an MCQ distractor is; it is not a claim the course
 *     teaches that exact string;
 *   - `speaker`, `goal`, `gloss`, `replyGloss`, `explanation` — English
 *     annotation / UI-label fields, not French the learner is asked to
 *     read or produce as dialogue. (`explanation` sometimes quotes French in
 *     «guillemets», same shape as an `info` body's quoted spans — out of
 *     scope for this pass; the task that opened this gate named NPC lines +
 *     reply content specifically. If a future review finds an untaught word
 *     leaking through an `explanation` quote, that is the next class to
 *     close here, following the same "fix the class" rule this file itself
 *     is answering to.)
 *
 * TOKENIZER / REGISTRY: reuses `frTokens`, `FR_FUNCTION_WORDS`,
 * `FR_PROPER_NAMES` from `../__tests__/moduleBarGuards` (the SAME tokenizer
 * and allowlists the existing per-module provenance check uses — no second
 * tokenizer) and `getFrCourseAtoms()` / `elidesBefore()` from
 * `../courseAtoms`. The per-token → earliest-teaching-module map below
 * mirrors `getFrRealFormLexicon()`'s own elided-clitic derivation
 * (`../__tests__/moduleBarGuards.ts` lines ~126–133) exactly, because that
 * function only answers "is this token ever taught", not "in which module
 * number" — this gate additionally needs the module number to enforce
 * `fromModule ≤ this lesson's module` (course-wide, not just
 * "already covered by this module's hand-maintained `priorModules` list",
 * which is what the existing per-module gate checks).
 *
 * EXEMPTIONS (no per-module exemptions — these are course-wide, generic,
 * and each has a stated reason):
 *   1. `FR_FUNCTION_WORDS` — closed-class function words / copulas, the
 *      same allowlist the existing gate uses. Reason: sentence chrome, not
 *      content vocabulary.
 *   2. `FR_PROPER_NAMES` — course cast + place names, the same allowlist
 *      the existing gate uses. Reason: proper nouns are not taught
 *      vocabulary; a learner is never expected to have "learned" «Marie».
 *   3. Multi-word carrier atoms need NO separate exemption: every atom's
 *      surface (single- or multi-word) is tokenized into its component
 *      words when building the module map below (mirrors
 *      `getFrRealFormLexicon()`), so a component word of a registered
 *      phrase atom (e.g. «vous» inside «s'il vous plaît») is already a
 *      known token from that atom's module — the carrier-atom doctrine
 *      ("Carrier atoms: word-level ownership") falls out of the existing
 *      per-atom tokenization, nothing extra to add.
 *   4. Digits: `FR_WORD_TOKEN` (from `frTokens`) matches only letter runs —
 *      no numeral ever tokenizes, so no numeral needs (or can receive) an
 *      exemption. Every FR number in this course is spelled out
 *      («onze», «vingt») and taught as its own atom; verified none of
 *      m2–m21's dialogue_sim content contains a raw digit
 *      (`grep -nE "kana:.*[0-9]|audioText:.*[0-9]"` — no hits).
 *   5. §13.6 "the incomprehensible line is the cue" (`isIncomprehensibleTease`
 *      below): an NPC line's `kana`/`audioText` is exempt when that turn's
 *      `npc.gloss` opens with an ellipsis ("…something…") — the content
 *      author's own marker that the line is deliberately unparseable and
 *      the ONLY graded move is the escape phrase «je ne comprends pas»
 *      (itself always a taught atom). Reason: the pedagogical point of
 *      the line IS that the learner can't and shouldn't decode it — same
 *      "grade answers, not every string" doctrine the MCQ-distractor
 *      exemption above rests on, extended to an NPC line the design marks
 *      as intentionally out of the learner's vocabulary. Content-structure
 *      keyed (the gloss marker), not per-module: exactly 3 turns carry it
 *      today (all in m2 — `fr-m2v2-3-sim-comprends` t1-fast, `fr-m2v2-3-
 *      sim-payoff` t1-fast, `fr-m2v2-9-sim-cafe` t4-rapide), and a 4th
 *      instance anywhere else in the course would be caught by the same
 *      rule automatically.
 *   6. `FR_NPC_FORMULAS` (below): a short, explicit allowlist of glossed,
 *      never-graded NPC service/social formulas — «vous désirez ?»,
 *      «enchanté», «enchantée». Reason: same as §5 — the pedagogical point
 *      is the learner reasoning from CONTEXT (a server's question, an
 *      introduction), not decoding the formula word-for-word, and it is
 *      never offered as gradable content. Unlike §5 this is not detected
 *      from content structure — there is no marker field for it — so it is
 *      a literal string allowlist, applied to NPC surfaces ONLY (never
 *      reply tiles/options — see `walk()`), and growing it requires a
 *      documented gloss on every occurrence course-wide. Coordinator ruling
 *      2026-09-10: this gate's first pass rewrote every instance to
 *      «Bonjour !», which does not cue an order/introduction the way the
 *      original formula does, and m6/m10/m12 shipped with the original
 *      lines live on prod — restored the content, added this exemption
 *      instead.
 * No hits required a broader exemption category than the six above (e.g. no
 * multi-word carrier / proper noun / numeral case needed anything beyond §3
 * and §4) — see the FINAL REPORT for the full hit list and how every
 * remaining real hit was resolved by a minimal content fix instead.
 */
import { describe, it, expect } from "vitest";
import type {
  DialogueSimStep,
  DialogueSimTurn,
  LessonContent,
} from "@/features/lesson/types";
import {
  frTokens,
  FR_FUNCTION_WORDS,
  FR_PROPER_NAMES,
} from "../__tests__/moduleBarGuards";
import { getFrCourseAtoms, elidesBefore } from "../courseAtoms";

import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_MODULE } from "./m7";
import { FR_M8_MODULE } from "./m8";
import { FR_M9_MODULE } from "./m9";
import { FR_M10_MODULE } from "./m10";
import { FR_M11_MODULE } from "./m11";
import { FR_M12_MODULE } from "./m12";
import { FR_M13_MODULE } from "./m13";
import { FR_M14_MODULE } from "./m14";
import { FR_M15_MODULE } from "./m15";
import { FR_M16_MODULE } from "./m16";
import { FR_M17_MODULE } from "./m17";
import { FR_M18_MODULE } from "./m18";
import { FR_M19_MODULE } from "./m19";
import { FR_M20_MODULE } from "./m20";
import { FR_M21_MODULE } from "./m21";
import { FR_M22_MODULE } from "./m22";
import { FR_M23_MODULE } from "./m23";
import { FR_M24_MODULE } from "./m24";

// ─── Module inventory (m2–m21; m1 is not in range) ──

const MODULES: ReadonlyArray<{ id: string; n: number; lessons: LessonContent[] }> = [
  { id: "m2", n: 2, lessons: FR_M2_MODULE.lessons },
  { id: "m3", n: 3, lessons: FR_M3_MODULE.lessons },
  { id: "m4", n: 4, lessons: FR_M4_MODULE.lessons },
  { id: "m5", n: 5, lessons: FR_M5_MODULE.lessons },
  { id: "m6", n: 6, lessons: FR_M6_MODULE.lessons },
  { id: "m7", n: 7, lessons: FR_M7_MODULE.lessons },
  { id: "m8", n: 8, lessons: FR_M8_MODULE.lessons },
  { id: "m9", n: 9, lessons: FR_M9_MODULE.lessons },
  { id: "m10", n: 10, lessons: FR_M10_MODULE.lessons },
  { id: "m11", n: 11, lessons: FR_M11_MODULE.lessons },
  { id: "m12", n: 12, lessons: FR_M12_MODULE.lessons },
  { id: "m13", n: 13, lessons: FR_M13_MODULE.lessons },
  { id: "m14", n: 14, lessons: FR_M14_MODULE.lessons },
  { id: "m15", n: 15, lessons: FR_M15_MODULE.lessons },
  { id: "m16", n: 16, lessons: FR_M16_MODULE.lessons },
  { id: "m17", n: 17, lessons: FR_M17_MODULE.lessons },
  { id: "m18", n: 18, lessons: FR_M18_MODULE.lessons },
  { id: "m19", n: 19, lessons: FR_M19_MODULE.lessons },
  { id: "m20", n: 20, lessons: FR_M20_MODULE.lessons },
  { id: "m21", n: 21, lessons: FR_M21_MODULE.lessons },
  { id: "m22", n: 22, lessons: FR_M22_MODULE.lessons },
  { id: "m23", n: 23, lessons: FR_M23_MODULE.lessons },
  { id: "m24", n: 24, lessons: FR_M24_MODULE.lessons },
  // EVERY new FR module must be added here when it lands (coordinator checklist).
];

// ─── Token → earliest-teaching-module map ─────────────────────────────────

/**
 * Mirrors `getFrRealFormLexicon()`'s elided-clitic derivation
 * (`../__tests__/moduleBarGuards.ts`) but records the teaching MODULE
 * NUMBER per token rather than just membership — this gate needs
 * `fromModule ≤ this lesson's module`, not just "is this ever taught
 * somewhere in the course".
 *
 * `getFrCourseAtoms()` returns atoms in ascending module order (see its own
 * header/collector), so first-write-wins on a token key is automatically
 * "earliest module that teaches this token" — no separate min-tracking
 * needed.
 */
function buildAtomModuleNumByToken(): Map<string, number> {
  const map = new Map<string, number>();
  const moduleNum = (m: string) => Number(m.replace(/^m/, ""));
  for (const a of getFrCourseAtoms()) {
    // `FrAtom.fromModule` is typed `ModuleId | undefined` (inherited from the
    // generic `Atom` base — see shared/language/types.ts), but every FR atom
    // is constructed via `atom()` in courseAtoms.ts, whose factory signature
    // requires `fromModule: FrAtomSource` — it is never actually absent at
    // runtime. Guard rather than assert-cast, so a genuinely malformed atom
    // is silently excluded (never taught) rather than crashing the walk.
    if (!a.fromModule) continue;
    const n = moduleNum(a.fromModule);
    const toks = frTokens(a.surface);
    for (const w of toks) {
      if (!map.has(w)) map.set(w, n);
    }
    if (elidesBefore(a)) {
      const first = toks[0];
      if (first) {
        for (const clitic of ["l", "j", "n", "m", "t", "s", "qu"]) {
          const key = `${clitic}'${first}`;
          if (!map.has(key)) map.set(key, n);
        }
      }
    }
  }
  return map;
}

const ATOM_MODULE_NUM_BY_TOKEN = buildAtomModuleNumByToken();

// ─── dialogue_sim surface projection (the fix: frSurfaces has no case) ────

/** The French text one `dialogue_sim` turn actually exposes — see the file
 *  header for exactly which fields and why. */
export function dialogueSimTurnSurfaces(turn: DialogueSimTurn): string[] {
  const out: string[] = [];
  out.push(turn.npc.kana);
  if (turn.npc.audioText) out.push(turn.npc.audioText);
  const reply = turn.reply;
  if (reply.mode === "build") {
    out.push(...reply.tiles);
    out.push(reply.answer);
    if (reply.alsoAccepted) out.push(...reply.alsoAccepted);
    if (reply.audioText) out.push(reply.audioText);
  } else {
    const correct = reply.options.find((o) => o.id === reply.correctOptionId);
    if (correct) out.push(correct.text);
    for (const altId of reply.alsoCorrectOptionIds ?? []) {
      const alt = reply.options.find((o) => o.id === altId);
      if (alt) out.push(alt.text);
    }
    if (reply.audioText) out.push(reply.audioText);
  }
  return out.filter(Boolean);
}

/** Every surface exposed by a `dialogue_sim` step, across all its turns. */
export function dialogueSimStepSurfaces(step: DialogueSimStep): string[] {
  return step.turns.flatMap(dialogueSimTurnSurfaces);
}

/**
 * §13.6 "the incomprehensible line is the cue" — an NPC line deliberately
 * written to be UNPARSEABLE, so the learner's only move is the escape
 * phrase «je ne comprends pas» (the graded, always-taught reply). Marked,
 * course-wide, by the NPC line's own `gloss` opening with the ellipsis +
 * "something" pattern ("…something quick you didn't catch.", "…something
 * you didn't catch.", "…something fast about… tomorrow?") — the content
 * author's own signal that this line is not a vocabulary claim. Exactly 3
 * turns in the course carry this marker (all m2, both L3 sims + the L9
 * cafe tease); this is a content-structure key, not a per-module list — a
 * 4th instance anywhere else in the course would be exempted the same way,
 * automatically, with no test-file edit.
 */
function isIncomprehensibleTease(turn: DialogueSimTurn): boolean {
  return turn.npc.gloss.trimStart().startsWith("…");
}

/**
 * FR_NPC_FORMULAS — glossed, never-graded NPC service/social formulas.
 *
 * Cue lines in the §13.6 spirit: the learner reasons from CONTEXT (a server
 * addressing them, someone being introduced), not from decoding the formula
 * word-for-word, and the formula is never offered as gradable reply content
 * — it lives only on `turn.npc.kana` / `turn.npc.audioText`, never on a
 * tile, `answer`, `alsoAccepted`, or choice option text. Coordinator ruling
 * 2026-09-10 (this gate's first pass had replaced every instance with
 * «Bonjour !», which does not cue an order/introduction the way the
 * original formula does, and m6/m10/m12 are live on prod with the original
 * lines): restore the formulas, exempt them structurally instead of
 * rewriting the content.
 *
 * Applied to NPC surfaces ONLY (see `walk()` below) — a reply surface using
 * one of these strings still gets the full token check, same as everything
 * else a learner is asked to produce. Adding an entry here requires the new
 * formula carry a documented gloss on EVERY use in the course (no bare/
 * unglossed occurrence anywhere) — this is a narrow, stated allowlist, not a
 * general "exempt formulaic French" escape hatch.
 */
const FR_NPC_FORMULAS: readonly string[] = ["vous désirez ?", "enchanté", "enchantée"];

const FR_NPC_FORMULA_PATTERN = new RegExp(
  FR_NPC_FORMULAS.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "gi",
);

/** Strips any `FR_NPC_FORMULAS` occurrence out of an NPC surface before
 *  tokenizing, so the formula's words never reach the provenance check. Only
 *  ever called on `turn.npc.kana` / `turn.npc.audioText` — see `walk()`. */
function stripNpcFormulas(surface: string): string {
  return surface.replace(FR_NPC_FORMULA_PATTERN, " ");
}

// ─── The gate ──────────────────────────────────────────────────────────────

type Hit = { moduleId: string; lessonId: string; stepId: string; token: string; surface: string; reason: string };

function walk(): Hit[] {
  const hits: Hit[] = [];
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      for (const step of lesson.steps) {
        if (step.type !== "dialogue_sim") continue;
        for (const turn of (step as DialogueSimStep).turns) {
          const tease = isIncomprehensibleTease(turn);
          const npcSurfaces = [turn.npc.kana, turn.npc.audioText].filter(
            (s): s is string => Boolean(s),
          );
          const surfaces = tease
            ? dialogueSimTurnSurfaces(turn).filter((s) => !npcSurfaces.includes(s))
            : dialogueSimTurnSurfaces(turn);
          for (const surf of surfaces) {
            // FR_NPC_FORMULAS applies to NPC surfaces only — never to reply
            // tiles/options, which must stay fully gradable from taught
            // vocabulary.
            const scanned = npcSurfaces.includes(surf) ? stripNpcFormulas(surf) : surf;
            for (const t of frTokens(scanned)) {
              if (FR_FUNCTION_WORDS.has(t) || FR_PROPER_NAMES.has(t)) continue;
              const taughtIn = ATOM_MODULE_NUM_BY_TOKEN.get(t);
              if (taughtIn === undefined) {
                hits.push({
                  moduleId: mod.id,
                  lessonId: lesson.id,
                  stepId: step.id,
                  token: t,
                  surface: surf,
                  reason: "never taught in any module",
                });
              } else if (taughtIn > mod.n) {
                hits.push({
                  moduleId: mod.id,
                  lessonId: lesson.id,
                  stepId: step.id,
                  token: t,
                  surface: surf,
                  reason: `taught in m${taughtIn}, used before it's taught (m${mod.n})`,
                });
              }
            }
          }
        }
      }
    }
  }
  return hits;
}

describe("FR dialogue_sim vocab provenance (m2–m21)", () => {
  it("every token in every dialogue_sim turn (NPC lines, correct reply, alsoAccepted) resolves to an atom taught at or before this module", () => {
    const hits = walk();
    const fmt = hits.map(
      (h) =>
        `${h.moduleId}/${h.lessonId}/${h.stepId}: "${h.token}" (${h.reason}) — in "${h.surface.slice(0, 70)}"`,
    );
    expect(fmt).toEqual([]);
  });
});
