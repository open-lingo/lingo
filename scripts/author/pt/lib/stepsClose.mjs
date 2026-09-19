/**
 * lib/stepsClose.mjs — the CLOSING half of spec -> candidate steps:
 * listenCompLit, agreementLit, sim, matchLit, speakLit-win. See
 * `lib/stepsCore.mjs`'s header for why this is split from `lib/steps.mjs`.
 */
import { MATCH_PAIR_FLOOR } from "./rules.mjs";

let seq = 0;
export const resetIds = () => { seq = 0; };
const nextId = (prefix) => `${prefix}-${(seq += 1)}`;

/** listenCompLit — `listen`-tagged sentences; distractors are the other
 *  sentences' English glosses (deterministic, no invention). */
export function buildListenCompLits(spec) {
  const pool = spec.sentences.map((s) => s.en);
  return spec.sentences
    .filter((s) => s.roles.includes("listen"))
    .map((s) => {
      const distractorsEn = pool.filter((e) => e !== s.en).slice(0, 3);
      while (distractorsEn.length < 3) distractorsEn.push(`${s.en} (not this)`);
      return { id: nextId("lst"), kind: "listenCompLit", pt: s.pt, en: s.en, distractorsEn, atoms: s.uses };
    });
}

/** agreementLit — one blank per `agreement:` pair, article vs. article
 *  (m/f), alternating text segments around it. */
export function buildAgreementLit(spec) {
  if (!spec.agreement.length) return null;
  const segments = [];
  spec.agreement.forEach((pair, i) => {
    if (i > 0) segments.push({ text: " / " });
    const [article, noun] = pair.m.split(" ");
    segments.push({ blank: { id: `a${i}`, answer: article, options: [article, pair.f.split(" ")[0]] } });
    segments.push({ text: ` ${noun}` });
  });
  return {
    id: "agr", kind: "agreementLit", segments, en: spec.grammar,
    atoms: spec.agreement.flatMap((p) => [p.m.split(" ")[1], p.f.split(" ")[1]]),
  };
}

/** sim — the closing `dialogue_sim`, always the module-close beat. One
 *  turn per `dialogue.turns[]` entry; the first turn is the debut turn. */
export function buildSim(spec) {
  if (!spec.dialogue) return null;
  const turns = spec.dialogue.turns.map((t, i) => ({
    id: `t${i + 1}`,
    npc: { speaker: spec.dialogue.npc, pt: t.npc, gloss: t.gloss ?? t.npc },
    goal: t.goal ?? "Reply.",
    reply: {
      mode: "choice",
      options: t.options.map((text, j) => ({ id: String.fromCharCode(97 + j), text })),
      correctOptionId: String.fromCharCode(97 + t.correct),
    },
    debut: i === 0,
  }));
  return { id: "sim", kind: "sim", scene: { emoji: "\u{1F4AC}", title: spec.title }, turns };
}

/** matchLit — every `words[]` entry, padded from prior taught vocab up to
 *  the MATCH_PAIR_FLOOR (>= 6). */
export function buildMatchLit(spec, priorVocab) {
  const pairs = spec.words.map((w) => ({ source: w.pt, target: w.en }));
  if (pairs.length < MATCH_PAIR_FLOOR && priorVocab) {
    for (const a of priorVocab.values()) {
      if (pairs.length >= MATCH_PAIR_FLOOR) break;
      if (!pairs.some((p) => p.source === a.surface)) pairs.push({ source: a.surface, target: a.meaningEn });
    }
  }
  return { id: "match", kind: "matchLit", pairs };
}

/** speakLit-win — the module's own promise, `spec.win`, always last. Atom
 *  credit is by WHOLE-WORD match (case-insensitive, punctuation stripped)
 *  against the win sentence's own tokens — a substring match would credit
 *  "eu" from inside "seu", or miss "Eu" against a lowercase "eu" atom. */
export function buildSpeakWin(spec) {
  const winWords = new Set(spec.win.pt.toLowerCase().split(/\s+/).map((w) => w.replace(/[.,!?]+$/, "")));
  const uses = spec.words.filter((w) => winWords.has(w.pt.toLowerCase())).map((w) => w.pt);
  return { id: "win", kind: "speakLit", pt: spec.win.pt, en: spec.win.en, atoms: uses.length ? uses : [spec.words[0].pt] };
}
