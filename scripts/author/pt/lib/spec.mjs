/**
 * lib/spec.mjs — load + validate a lane's ~60-line SPEC yaml (the format
 * fixed by PTTOOL's brief; see `docs/pt-authoring-pack.md`'s worked
 * example). Normalizes optional fields to their defaults so every other
 * lib module can assume a complete shape.
 *
 * A malformed spec fails HERE, by name, before any generation runs — same
 * "most useful message first" doctrine `compile-ir-pt.mjs` already uses.
 */
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const need = (cond, msg) => {
  if (!cond) throw new Error(`spec: ${msg}`);
};

export function loadSpec(path) {
  const raw = parse(readFileSync(path, "utf8"));
  return normalizeSpec(raw, path);
}

export function normalizeSpec(raw, path = "<spec>") {
  need(raw && typeof raw === "object", `${path} is not a YAML mapping`);
  need(Number.isInteger(raw.lesson) && raw.lesson >= 1, `"lesson" must be a positive integer`);
  need(typeof raw.id === "string" && raw.id.length > 0, `"id" is required`);
  need(typeof raw.title === "string" && raw.title.length > 0, `"title" is required`);
  need(typeof raw.grammar === "string" && raw.grammar.length > 0, `"grammar" is required`);
  need(Array.isArray(raw.words) && raw.words.length > 0 && raw.words.length <= 8, `"words" must be a 1-8 item list`);
  need(Array.isArray(raw.sentences) && raw.sentences.length > 0, `"sentences" must be a non-empty list`);
  need(raw.win && typeof raw.win.pt === "string" && typeof raw.win.en === "string", `"win" needs pt + en`);

  const words = raw.words.map((w, i) => {
    need(typeof w.pt === "string" && w.pt.length > 0, `words[${i}].pt is required`);
    need(typeof w.en === "string" && w.en.length > 0, `words[${i}].en is required`);
    need(typeof w.pos === "string" && w.pos.length > 0, `words[${i}].pos is required`);
    return {
      pt: w.pt,
      en: w.en,
      pos: w.pos,
      gender: w.gender ?? undefined,
      emoji: w.emoji ?? undefined,
      cognate: w.cognate === true,
      falseFriend: w.falseFriend === true,
      of: w.of ?? undefined,
      hint: w.hint ?? undefined,
    };
  });
  const wordByPt = new Map(words.map((w) => [w.pt, w]));

  const sentences = raw.sentences.map((s, i) => {
    need(typeof s.pt === "string" && s.pt.length > 0, `sentences[${i}].pt is required`);
    need(typeof s.en === "string" && s.en.length > 0, `sentences[${i}].en is required`);
    need(Array.isArray(s.roles) && s.roles.length > 0, `sentences[${i}].roles must be non-empty`);
    need(Array.isArray(s.uses) && s.uses.length > 0, `sentences[${i}].uses must be non-empty`);
    for (const u of s.uses) {
      need(wordByPt.has(u), `sentences[${i}].uses references "${u}", not in words[]`);
    }
    return { pt: s.pt, en: s.en, roles: s.roles, uses: s.uses };
  });

  const agreement = Array.isArray(raw.agreement) ? raw.agreement : [];
  const dialogue = raw.dialogue
    ? {
        npc: raw.dialogue.npc,
        turns: (raw.dialogue.turns ?? []).map((t, i) => {
          need(typeof t.npc === "string", `dialogue.turns[${i}].npc is required`);
          need(Array.isArray(t.options) && t.options.length >= 2, `dialogue.turns[${i}].options needs >= 2`);
          need(Number.isInteger(t.correct) && t.correct >= 0 && t.correct < t.options.length, `dialogue.turns[${i}].correct out of range`);
          return t;
        }),
      }
    : undefined;

  return {
    lesson: raw.lesson,
    id: raw.id,
    title: raw.title,
    grammar: raw.grammar,
    info: raw.info ?? raw.grammar,
    antiPattern: raw.antiPattern,
    // `checkpoint: true` — a zero-new-atom recall lesson; forwarded as-is
    // so `lib/schedule.mjs` can read it (schedule.mjs is the ONE file a
    // checkpoint lane may edit; this one-line passthrough is the minimum
    // needed for that flag to reach it at all — noted in the lane report).
    checkpoint: raw.checkpoint === true,
    words,
    wordByPt,
    sentences,
    agreement,
    dialogue,
    win: { pt: raw.win.pt, en: raw.win.en },
  };
}
