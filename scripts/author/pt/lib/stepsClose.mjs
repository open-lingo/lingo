/**
 * lib/stepsClose.mjs — the CLOSING half of spec -> candidate steps:
 * listenCompLit, agreementLit, sim, matchLit, speakLit-win. See
 * `lib/stepsCore.mjs`'s header for why this is split from `lib/steps.mjs`,
 * and for the `_ord` field every "middle" candidate now carries (PTTOOL2
 * finding 1c, order-preserving scheduling).
 */
import { MATCH_PAIR_FLOOR, PT_ALLOW_WORDS, PT_PERSONAS } from "./rules.mjs";

let seq = 0;
export const resetIds = () => { seq = 0; };
const nextId = (prefix) => `${prefix}-${(seq += 1)}`;

/** listenCompLit — `listen`-tagged sentences; distractors are the other
 *  sentences' English glosses (deterministic, no invention). Duplicate
 *  distractor SETS across two listenCompLit steps are flagged by
 *  `lib/schedule.mjs`'s `checkListenDistractorsDistinct` (PTGRADE finding
 *  3) rather than silently reshuffled here — the pool is a fact about the
 *  spec's own sentences, not something this generator should paper over. */
export function buildListenCompLits(spec) {
  const pool = spec.sentences.map((s) => s.en);
  return spec.sentences
    .map((s, si) => ({ s, si }))
    .filter(({ s }) => s.roles.includes("listen"))
    .map(({ s, si }) => {
      const others = pool.filter((e) => e !== s.en);
      // Rotate the 3-window by this sentence's own index (mod pool size)
      // instead of always taking the first 3 — two sentences adjacent in
      // the spec's own list would otherwise draw the IDENTICAL first-3
      // window (removing one near-neighbor from a long list barely moves
      // the front), producing two listenCompLit steps with the exact same
      // distractor set (PTGRADE finding 3) even though nothing was wrong
      // with either sentence on its own.
      const offset = others.length ? si % others.length : 0;
      const distractorsEn = others.length
        ? Array.from({ length: Math.min(3, others.length) }, (_, k) => others[(offset + k) % others.length])
        : [];
      while (distractorsEn.length < 3) distractorsEn.push(`${s.en} (not this)`);
      return { id: nextId("lst"), kind: "listenCompLit", _ord: si, pt: s.pt, en: s.en, distractorsEn, atoms: s.uses };
    });
}

/** agreementLit — one structured block per spec (PTGRADE finding 2): a
 *  real sentence with >= 2 answerable blanks, each blank's `answer` a
 *  literal word of that sentence. Segments are built by locating each
 *  blank's answer as a whole word in the sentence and slicing text around
 *  it — replaces the old `[{m,f}]` pair-list shape, which only ever
 *  produced ONE blank (the feminine/masculine counterpart never appeared
 *  as its own answerable slot, just as a distractor option). */
/** ITEM 9a (lane PTTOOL5): article pairs the headline grammar of a lesson
 *  most often turns on — um/uma, o/a, no/na, do/da. When no manual
 *  `agreement:` block was authored but a `contrastSet` declares one of
 *  these pairs AND a spec sentence uses both members, the two-blank
 *  agreementLit is auto-emitted from that sentence instead of the point
 *  going untested (PTGRADE: "no step ever makes the learner choose um vs
 *  uma"). */
const ARTICLE_PAIRS = [["um", "uma"], ["o", "a"], ["no", "na"], ["do", "da"]];

function autoAgreementFromContrastSet(spec) {
  for (const set of spec.contrastSet) {
    if (set.length !== 2) continue;
    const pair = ARTICLE_PAIRS.find(([a, b]) => (set[0] === a && set[1] === b) || (set[0] === b && set[1] === a));
    if (!pair) continue;
    const [a, b] = pair;
    const sentence = spec.sentences.find(
      (s) => s.uses.includes(a) && s.uses.includes(b) && s.pt.split(" ").some((w) => w.replace(/[.,!?]+$/, "") === a) && s.pt.split(" ").some((w) => w.replace(/[.,!?]+$/, "") === b),
    );
    if (!sentence) continue;
    return { sentence: sentence.pt, en: sentence.en, blanks: [{ answer: a, options: [a, b] }, { answer: b, options: [a, b] }] };
  }
  return null;
}

export function buildAgreementLit(spec) {
  const authored = spec.agreement ?? autoAgreementFromContrastSet(spec);
  if (!authored) return null;
  const { sentence, en, blanks } = authored;
  const words = sentence.split(" ");
  const used = new Set();
  const positions = blanks.map((b) => {
    const i = words.findIndex((w, idx) => !used.has(idx) && w.replace(/[.,!?]+$/, "") === b.answer);
    if (i === -1) {
      throw new Error(`agreementLit: blank answer "${b.answer}" is not a word of "${sentence}" — smallest fix: match the exact surface (with any trailing punctuation stripped)`);
    }
    used.add(i);
    return { ...b, i };
  }).sort((a, b) => a.i - b.i);

  const segments = [];
  let cursor = 0;
  for (const b of positions) {
    if (b.i > cursor) segments.push({ text: words.slice(cursor, b.i).join(" ") + " " });
    segments.push({ blank: { id: `a${b.i}`, answer: b.answer, options: b.options } });
    cursor = b.i + 1;
  }
  if (cursor < words.length) segments.push({ text: " " + words.slice(cursor).join(" ") });

  const ord = spec.sentences.findIndex((s) => s.pt === sentence);
  return { id: "agr", kind: "agreementLit", _ord: ord === -1 ? 0 : ord, segments, en, atoms: [] };
}

const PERSONAS_LOWER = new Set([...PT_PERSONAS].map((p) => p.toLowerCase()));

/** ITEM 11 (lane PTTOOL5) support: the "content words" of a PT/EN string —
 *  letters-only tokens, lowercased, with closed-set function words and the
 *  cast's names stripped out; a 2-letter-or-shorter token is dropped too
 *  (pronouns like "eu"/"eu" already fall out via length, "eu" is 2 chars). */
function contentWords(text) {
  return new Set(
    (text ?? "")
      .toLowerCase()
      .split(/[^\p{L}]+/u)
      .filter((w) => w.length > 2 && !PT_ALLOW_WORDS.has(w) && !PERSONAS_LOWER.has(w)),
  );
}

function sharesContentWord(a, b) {
  const wb = contentWords(b);
  for (const w of contentWords(a)) if (wb.has(w)) return true;
  return false;
}

/** ITEM 11 (lane PTTOOL5): sim sanity. A choice turn's CORRECT option (or
 *  a build turn's `answer`) must share >= 1 content word with the NPC line
 *  or the `goal` — otherwise it is a non-sequitur reply (PTGRADE: NPC
 *  "Legal! Amanhã a gente vai comer pizza." keyed correct to "Eu tenho
 *  uma família.", which answers nothing the NPC said). HARD fail. Any
 *  WRONG option that ALSO shares a content word only gets an INFO line
 *  ("ambiguous option") — a real judgment call, never blocking. */
function checkSimTurnRelevance(spec) {
  spec.dialogue.turns.forEach((t, i) => {
    const context = `${t.npc} ${t.goal ?? ""}`;
    if (t.mode === "build") {
      if (!sharesContentWord(t.answer, context)) {
        throw new Error(
          `sim: dialogue.turns[${i}] (mode: build): answer "${t.answer}" shares no content word with the NPC line "${t.npc}" or goal "${t.goal ?? ""}" — ` +
            `smallest fix: rewrite the answer (or its tiles) so it actually responds`,
        );
      }
      return;
    }
    const correctText = t.options[t.correct];
    if (!sharesContentWord(correctText, context)) {
      throw new Error(
        `sim: dialogue.turns[${i}]: correct option "${correctText}" shares no content word with the NPC line "${t.npc}" or goal "${t.goal ?? ""}" — ` +
          `smallest fix: pick or write a correct option that actually responds to the turn`,
      );
    }
    t.options.forEach((opt, j) => {
      if (j === t.correct || !sharesContentWord(opt, context)) return;
      console.log(`from-spec: ${spec.id}: INFO: dialogue.turns[${i}] option "${opt}" also shares a content word with the NPC/goal — ambiguous option, verify only the keyed answer truly responds`);
    });
  });
}

/** sim — the closing `dialogue_sim`, always the module-close beat. One
 *  turn per `dialogue.turns[]` entry; the first turn is the debut turn.
 *  ROUND 4 (lane PTTOOL4, item 4): a `mode: build` turn's reply is the
 *  real assemble.mjs simLit "build" shape (tiles + answer), never MCQ —
 *  `spec.mjs` already validated the tile bank covers `answer` (and any
 *  `alsoAccepted`) by word count. */
export function buildSim(spec) {
  if (!spec.dialogue) return null;
  checkSimTurnRelevance(spec);
  const turns = spec.dialogue.turns.map((t, i) => ({
    id: `t${i + 1}`,
    npc: { speaker: spec.dialogue.npc, pt: t.npc, gloss: t.gloss ?? t.npc },
    goal: t.goal ?? "Reply.",
    reply:
      t.mode === "build"
        ? { mode: "build", tiles: [...t.tiles], answer: t.answer, ...(t.alsoAccepted?.length ? { alsoAccepted: [...t.alsoAccepted] } : {}) }
        : {
            mode: "choice",
            // PTGRADE9: writers put the keyed reply first, so `a` was correct in
            // 6 of 7 turns — rotate by turn index so position never predicts.
            ...(() => {
              const n = t.options.length, shift = n ? i % n : 0;
              const rotated = t.options.map((_, j) => t.options[(j + shift) % n]);
              return {
                options: rotated.map((text, j) => ({ id: String.fromCharCode(97 + j), text })),
                correctOptionId: String.fromCharCode(97 + ((t.correct - shift + n) % n)),
              };
            })(),
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
 *  against the win sentence's own tokens, checked against `words` AND
 *  `recall` (round 2: a checkpoint's win sentence recalls old atoms, so
 *  `words` alone — possibly empty — must not be the only credit source,
 *  and must never crash on an empty `words` list). */
export function buildSpeakWin(spec) {
  const winWords = new Set(spec.win.pt.toLowerCase().split(/\s+/).map((w) => w.replace(/[.,!?]+$/, "")));
  const known = [...spec.words.map((w) => w.pt), ...spec.recall];
  const uses = known.filter((pt) => winWords.has(pt.toLowerCase()));
  const atoms = uses.length ? uses : known.length ? [known[0]] : [];
  return { id: "win", kind: "speakLit", pt: spec.win.pt, en: spec.win.en, atoms };
}
