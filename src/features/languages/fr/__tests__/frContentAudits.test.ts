/**
 * FR content audits — the mechanical half of the authoring ledger
 * (built 2026-09-01, after the m3/m4 waves showed which manual audits
 * repeat every module). One rendered walk, one failures list per check,
 * frAudioCoverage's shape. Everything here was previously checked by
 * hand per module; from m5 on it is checked by this file.
 *
 * What lives HERE vs the existing gates:
 *   - fr-quality: density, adjacency, selection runs, production mix,
 *     compounding, checkpoint/mastery shape (course-wide).
 *   - moduleBarGuards: overuse, provenance, distractor lint (MCQ family
 *     incl. echo-back), wimcq first-exposure, particle-cloze scope.
 *   - mN.test.ts: tint dictionaries, info budgets, NPC-mirror, goal
 *     length, closing-zone match, per-module recall floors.
 *   - THIS FILE: the checks none of those see — word-level elision on
 *     COMPOSED sentences (inside multi-word tiles, where the tile-level
 *     validator is blind), sim-reply integrity (composability, tile
 *     dupes, option/audio honesty — dialogue_sim is outside the MCQ
 *     lint's choiceSets), the audio-prompted wimcq's playable prompt
 *     (frAudioCoverage never reads meaningEn), word_map integrity, the
 *     raw match_pairs floor (the factory floor doesn't bind raw steps),
 *     and the COURSE-WIDE voiced-first recall walk (the per-module
 *     walks re-prove their prefix every time; this is the one canonical
 *     full-course statement).
 *
 * Ratchet policy (house law): a failing check is fixed in content, or
 * the existing pre-gate instance is allowlisted by id with a dated
 * comment. Checks are never weakened to admit new content.
 */
import { describe, expect, it } from "vitest";
import { FR_ALL_LESSONS } from "../curriculum";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getTtsUrl } from "@/shared/tts";
import { mustElide } from "../grammarHelpers";
import type {
  DialogueSimStep,
  LessonContent,
  LessonStep,
  MatchPairsStep,
  WordMapStep,
} from "@/features/lesson/types";

// ─── Allowlist (dated, shrink-only) ──────────────────────────────────────

/** Raw match_pairs grids below the 6-pair factory floor.
 *  fr-m1v2-1-match-close (5 pairs): promoted 2026-08-21, predates this
 *  gate — L1 has taught exactly five words when the grid appears, so a
 *  sixth pair would require an untaught word. Intentional; allowlisted. */
const RAW_MATCH_FLOOR_ALLOWLIST = new Set(["fr-m1v2-1-match-close"]);

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Word sequence of a composed French sentence, apostrophes kept inside
 *  tokens, ALL lengths kept (1-char «à»/«y» matter for pair positions). */
function wordSeq(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/[’ʼ]/g, "'")
      .match(/[a-zàâæçéèêëîïôœùûüÿ]+(?:'[a-zàâæçéèêëîïôœùûüÿ]+)*/gi) ?? []
  );
}

/** Fold a sim line for option/audio comparison: case, punctuation,
 *  apostrophe look-alikes, whitespace. */
function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’ʼ]/g, "'")
    .replace(/[!?.,«»…—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Can `answer` be segmented into a subset of `tiles` (each used at most
 *  once, joined by single spaces)? */
function composableFromTiles(answer: string, tiles: readonly string[]): boolean {
  const target = answer.trim();
  const walk = (rest: string, remaining: string[]): boolean => {
    if (rest === "") return true;
    for (let i = 0; i < remaining.length; i++) {
      const t = remaining[i];
      if (rest === t || rest.startsWith(t + " ")) {
        const next = rest === t ? "" : rest.slice(t.length + 1);
        if (walk(next, remaining.filter((_, j) => j !== i))) return true;
      }
    }
    return false;
  };
  return walk(target, [...tiles]);
}

function elisionBreaches(text: string, where: string, into: string[]): void {
  const words = wordSeq(text);
  for (let i = 0; i < words.length - 1; i++) {
    if (mustElide(words[i], words[i + 1])) {
      into.push(`${where}: "${words[i]} ${words[i + 1]}" must be written elided (pin F2/F4)`);
    }
  }
}

// ─── The walk ────────────────────────────────────────────────────────────

type Failures = {
  elision: string[];
  simReply: string[];
  buildBank: string[];
  audioPrompt: string[];
  wordMap: string[];
  matchFloor: string[];
  recall: string[];
};

function auditCourse(): Failures {
  const f: Failures = {
    elision: [],
    simReply: [],
    buildBank: [],
    audioPrompt: [],
    wordMap: [],
    matchFloor: [],
    recall: [],
  };

  // Course-wide voiced-first recall walk runs over the AUTHORED lessons
  // in pathway order (render-side augmentation reuses authored steps and
  // must not be able to break the authored ledger).
  const voiced = new Set<string>();
  for (const lesson of FR_ALL_LESSONS) {
    for (const step of lesson.steps) {
      if (step.type !== "speaking") continue;
      if (step.cue === "recall") {
        if (!voiced.has(step.targetPhrase)) {
          f.recall.push(
            `${lesson.id}/${step.id}: recall of «${step.targetPhrase}» before any printed voicing`,
          );
        }
      } else {
        voiced.add(step.targetPhrase);
      }
    }
  }

  for (const authored of FR_ALL_LESSONS) {
    const lesson: LessonContent = getMockLessonContent(authored.id) ?? authored;
    for (const step of lesson.steps as LessonStep[]) {
      const at = `${lesson.id}/${step.id}`;
      const s = step as never as Record<string, unknown>;

      // 1. Word-level elision on every composed/spoken French surface.
      //    (The tile-level factory check can't see inside a multi-word
      //    tile — «il n'y a pas de» + «école» composes a breach the
      //    boundary check never meets.)
      if (step.type === "build_sentence" || step.type === "listening_build") {
        elisionBreaches(((s.correctOrder as string[]) ?? []).join(" "), at, f.elision);
      }
      for (const key of ["targetSentence", "targetPhrase", "audioText", "transcript"]) {
        if (typeof s[key] === "string") elisionBreaches(s[key] as string, `${at}.${key}`, f.elision);
      }

      // 2. Build-family tile banks: no duplicate tiles; correctOrder ⊆ bank.
      if (step.type === "build_sentence" || step.type === "listening_build") {
        const tiles = (s.tiles as string[]) ?? [];
        if (new Set(tiles).size !== tiles.length) {
          f.buildBank.push(`${at}: duplicate tiles [${tiles.join(" | ")}]`);
        }
        const pool = [...tiles];
        for (const t of (s.correctOrder as string[]) ?? []) {
          const i = pool.indexOf(t);
          if (i === -1) {
            f.buildBank.push(`${at}: correctOrder tile "${t}" missing from the bank`);
          } else {
            pool.splice(i, 1);
          }
        }
      }

      // 3. dialogue_sim reply integrity (outside the MCQ lint's world).
      if (step.type === "dialogue_sim") {
        for (const turn of (step as DialogueSimStep).turns) {
          const wt = `${at}/${turn.id}`;
          const reply = turn.reply;
          if (reply.mode === "choice") {
            const ids = reply.options.map((o) => o.id);
            const texts = reply.options.map((o) => fold(o.text));
            if (new Set(ids).size !== ids.length) f.simReply.push(`${wt}: duplicate option ids`);
            if (new Set(texts).size !== texts.length) f.simReply.push(`${wt}: duplicate option texts`);
            const correct = reply.options.find((o) => o.id === reply.correctOptionId);
            if (!correct) {
              f.simReply.push(`${wt}: correctOptionId resolves to no option`);
            } else if (reply.audioText && fold(reply.audioText) !== fold(correct.text)) {
              // Confirmation audio must confirm the CORRECT reply — a
              // mismatch teaches the wrong sound for the right answer.
              f.simReply.push(
                `${wt}: reply audio "${reply.audioText}" ≠ correct option "${correct.text}"`,
              );
            }
            for (const alt of reply.alsoCorrectOptionIds ?? []) {
              if (!ids.includes(alt)) f.simReply.push(`${wt}: alsoCorrect id "${alt}" resolves to no option`);
            }
            for (const o of reply.options) elisionBreaches(o.text, `${wt} option`, f.elision);
          } else {
            const tiles = reply.tiles;
            if (new Set(tiles).size !== tiles.length) f.simReply.push(`${wt}: duplicate reply tiles`);
            const accepted = [reply.answer, ...(reply.alsoAccepted ?? [])];
            for (const a of accepted) {
              if (!composableFromTiles(a, tiles)) {
                f.simReply.push(`${wt}: accepted reply "${a}" is not composable from the tile bank`);
              }
              elisionBreaches(a, `${wt} accepted`, f.elision);
            }
            if (reply.audioText && fold(reply.audioText) !== fold(reply.answer)) {
              f.simReply.push(
                `${wt}: reply audio "${reply.audioText}" ≠ primary answer "${reply.answer}"`,
              );
            }
          }
          if (turn.npc.audioText === undefined || turn.npc.audioText.trim() === "") {
            // kana would be handed to TTS as display text with question
            // marks and em dashes; every NPC line declares its clip text.
            f.simReply.push(`${wt}: npc line has no audioText`);
          }
        }
      }

      // 4. Audio-prompted word_image_mcq: the prompt IS the clip — it
      //    must resolve, or the step renders as a silent ear question.
      //    (frAudioCoverage never reads meaningEn.)
      if (step.type === "word_image_mcq") {
        const options = (s.options as Array<{ word: string }>) ?? [];
        const audioPrompted = options.some((o) => o.word === (s.meaningEn as string));
        if (audioPrompted && getTtsUrl(s.meaningEn as string, "fr") === null) {
          f.audioPrompt.push(`${at}: audio-prompted on «${s.meaningEn}» with no manifest clip`);
        }
      }

      // 5. word_map integrity: pair indices in range; every token audible
      //    in the sentence clip (tokens are display slices of audioText).
      if (step.type === "word_map") {
        const map = step as WordMapStep;
        for (const p of map.pairs) {
          if (p.tokenIndex < 0 || p.tokenIndex >= map.tokens.length) {
            f.wordMap.push(`${at}: pair "${p.en}" points at token ${p.tokenIndex}, out of range`);
          }
        }
        if (map.audioText) {
          const audio = fold(map.audioText);
          for (const t of map.tokens) {
            if (!audio.includes(fold(t))) {
              f.wordMap.push(`${at}: token «${t}» is not inside audioText "${map.audioText}"`);
            }
          }
        }
      }

      // 6. Raw match_pairs grids: the factory floor (≥6, unique sources)
      //    binds hand-written steps too — there is no FR render-side pad.
      if (step.type === "match_pairs" && !RAW_MATCH_FLOOR_ALLOWLIST.has(step.id)) {
        const pairs = (step as MatchPairsStep).pairs;
        if (pairs.length < 6) {
          f.matchFloor.push(`${at}: ${pairs.length} pairs (< 6; no fr pad branch exists)`);
        }
        const sources = pairs.map((p) => p.source);
        if (new Set(sources).size !== sources.length) {
          f.matchFloor.push(`${at}: duplicate match sources`);
        }
      }
    }
  }
  return f;
}

const audited = auditCourse();

describe("fr content audits (course-wide, rendered)", () => {
  it("no elision breach in any composed sentence — word level, inside tiles included", () => {
    expect(audited.elision, audited.elision.join("\n")).toEqual([]);
  });

  it("sim replies are honest: options resolve, accepted builds compose, audio confirms the answer", () => {
    expect(audited.simReply, audited.simReply.join("\n")).toEqual([]);
  });

  it("build banks: unique tiles, correctOrder drawn from the bank", () => {
    expect(audited.buildBank, audited.buildBank.join("\n")).toEqual([]);
  });

  it("audio-prompted word MCQs have a playable prompt clip", () => {
    expect(audited.audioPrompt, audited.audioPrompt.join("\n")).toEqual([]);
  });

  it("word maps: indices in range, every token audible in the clip", () => {
    expect(audited.wordMap, audited.wordMap.join("\n")).toEqual([]);
  });

  it("raw match grids honor the 6-pair floor (allowlist is dated & shrink-only)", () => {
    expect(audited.matchFloor, audited.matchFloor.join("\n")).toEqual([]);
  });

  it("course-wide: cued recall never precedes a printed voicing (§13.9 law 3)", () => {
    expect(audited.recall, audited.recall.join("\n")).toEqual([]);
  });
});
