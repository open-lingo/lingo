/**
 * lib/spec.mjs — load + validate a lane's ~60-line SPEC yaml (the format
 * fixed by PTTOOL's brief; see `docs/pt-authoring-pack.md`'s worked
 * example). Normalizes optional fields to their defaults so every other
 * lib module can assume a complete shape.
 *
 * A malformed spec fails HERE, by name, before any generation runs — same
 * "most useful message first" doctrine `compile-ir-pt.mjs` already uses.
 *
 * ROUND 2 (lane PTTOOL2) additions, each documented in
 * `docs/pt-authoring-pack.md`'s SPEC format section:
 *   - `recall: [surface, ...]` — already-taught surfaces a checkpoint
 *     lesson may `uses:` without registering a new atom (PTR1-L6 finding
 *     b: the 8-word `words:` cap made a real recall lesson impossible).
 *   - `contrast: [{a, b, note}]` — minimal-pair pronunciation/ser-estar set.
 *   - `contrastSet: [[surface, ...], ...]` — PTGRADE finding 1: the option
 *     POOL a clozeLit on one of these surfaces must draw from (never a
 *     random same-POS word from the lesson bag).
 *   - `antiPattern: { ok, wrong }` — structured (was an opaque pass-through).
 *   - `pattern: { frame, slots: [{ pt, en, distractorsEn }] }` — a
 *     structured-input step (§2 row c: form-meaning mapping before
 *     production).
 *   - `conjugation: { verb, forms: [{ pt, en, blank }] }` — a clozeLit
 *     series across persons.
 *   - `agreement: { sentence, en, blanks: [{ answer, options }] }` —
 *     PTGRADE finding 2: replaces the old `[{m,f}]` pair list (which
 *     produced a single, often-degenerate blank) with one real sentence
 *     carrying >= 2 answerable blanks.
 *   - `infoTitle` — required, learner-facing info-card title, distinct
 *     from `grammar` (PTGRADE finding 2: `title: spec.grammar` leaked the
 *     raw authoring-only grammar-point line to the learner in all five
 *     round-1 lessons).
 *   - `allow: [surface, ...]` — declared function-word allowlist for the
 *     taught-vocabulary residual check (PTGRADE finding 3).
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
  const checkpoint = raw.checkpoint === true;
  need(
    Array.isArray(raw.words) && raw.words.length <= 8 && (raw.words.length > 0 || checkpoint),
    `"words" must be a 1-8 item list (0 allowed only when checkpoint: true, backed by "recall")`,
  );
  need(Array.isArray(raw.sentences) && raw.sentences.length > 0, `"sentences" must be a non-empty list`);
  need(raw.win && typeof raw.win.pt === "string" && typeof raw.win.en === "string", `"win" needs pt + en`);

  // PTGRADE finding 2: `info` must be authored, never silently equal to
  // `grammar` (the raw authoring-only summary line is not learner copy) —
  // and every lesson needs its own learner-facing card title.
  need(typeof raw.info === "string" && raw.info.length > 0, `"info" is required (learner-facing card body; do not fall back to "grammar")`);
  need(raw.info.trim() !== raw.grammar.trim(), `"info" must not be identical to "grammar" — "grammar" is authoring-only metadata, never learner copy`);
  need(typeof raw.infoTitle === "string" && raw.infoTitle.length > 0, `"infoTitle" is required (learner-facing card title)`);
  need(raw.infoTitle.trim() !== raw.grammar.trim(), `"infoTitle" must not be identical to "grammar"`);

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

  const recall = Array.isArray(raw.recall) ? raw.recall.map(String) : [];
  const recallSet = new Set(recall);
  const allow = Array.isArray(raw.allow) ? raw.allow.map(String) : [];

  const sentences = raw.sentences.map((s, i) => {
    need(typeof s.pt === "string" && s.pt.length > 0, `sentences[${i}].pt is required`);
    need(typeof s.en === "string" && s.en.length > 0, `sentences[${i}].en is required`);
    need(Array.isArray(s.roles) && s.roles.length > 0, `sentences[${i}].roles must be non-empty`);
    need(Array.isArray(s.uses) && s.uses.length > 0, `sentences[${i}].uses must be non-empty`);
    for (const u of s.uses) {
      need(wordByPt.has(u) || recallSet.has(u), `sentences[${i}].uses references "${u}", not in words[] or recall[]`);
    }
    return { pt: s.pt, en: s.en, roles: s.roles, uses: s.uses };
  });

  // `agreement` — one structured block, >= 2 answerable blanks (PTGRADE
  // finding 2). `sentence` is a literal PT string with each blank's
  // `answer` a literal word of it (validated in `lib/stepsExtra.mjs`,
  // which needs the real word list to check against — this layer only
  // checks the SHAPE, not sentence membership).
  let agreement;
  if (raw.agreement) {
    const a = raw.agreement;
    need(typeof a.sentence === "string" && a.sentence.length > 0, `agreement.sentence is required`);
    need(typeof a.en === "string" && a.en.length > 0, `agreement.en is required`);
    need(Array.isArray(a.blanks) && a.blanks.length >= 2, `agreement.blanks needs >= 2 entries`);
    const answers = new Set();
    a.blanks.forEach((b, i) => {
      need(typeof b.answer === "string" && b.answer.length > 0, `agreement.blanks[${i}].answer is required`);
      need(Array.isArray(b.options) && b.options.includes(b.answer) && b.options.length >= 2, `agreement.blanks[${i}].options must include the answer and have >= 2 entries`);
      need(!/^[A-ZÀ-Ý]/.test(b.answer), `agreement.blanks[${i}].answer "${b.answer}" looks like a proper noun — agreement blanks must be a real grammatical choice (article/adjective), never a name`);
      need(!answers.has(b.answer), `agreement.blanks[${i}].answer "${b.answer}" duplicates an earlier blank's answer — blanks must be distinct`);
      answers.add(b.answer);
    });
    agreement = { sentence: a.sentence, en: a.en, blanks: a.blanks.map((b) => ({ answer: b.answer, options: [...b.options] })) };
  }

  const contrast = Array.isArray(raw.contrast)
    ? raw.contrast.map((c, i) => {
        need(typeof c.a === "string" && typeof c.b === "string", `contrast[${i}] needs "a" and "b"`);
        return { a: c.a, b: c.b, note: c.note ?? undefined };
      })
    : [];

  const contrastSet = Array.isArray(raw.contrastSet)
    ? raw.contrastSet.map((set, i) => {
        need(Array.isArray(set) && set.length >= 2, `contrastSet[${i}] needs >= 2 surfaces`);
        for (const s of set) need(wordByPt.has(s) || recallSet.has(s), `contrastSet[${i}] references "${s}", not in words[] or recall[]`);
        return [...set];
      })
    : [];

  let antiPattern;
  if (raw.antiPattern !== undefined) {
    need(typeof raw.antiPattern === "object" && raw.antiPattern !== null, `"antiPattern" must be a { ok, wrong } object`);
    need(typeof raw.antiPattern.ok === "string" && raw.antiPattern.ok.length > 0, `antiPattern.ok is required`);
    need(typeof raw.antiPattern.wrong === "string" && raw.antiPattern.wrong.length > 0, `antiPattern.wrong is required`);
    antiPattern = { ok: raw.antiPattern.ok, wrong: raw.antiPattern.wrong };
  }

  let pattern;
  if (raw.pattern) {
    need(typeof raw.pattern.frame === "string" && raw.pattern.frame.length > 0, `pattern.frame is required`);
    need(Array.isArray(raw.pattern.slots) && raw.pattern.slots.length > 0, `pattern.slots must be non-empty`);
    const slots = raw.pattern.slots.map((sl, i) => {
      need(typeof sl.pt === "string" && sl.pt.length > 0, `pattern.slots[${i}].pt is required`);
      need(typeof sl.en === "string" && sl.en.length > 0, `pattern.slots[${i}].en is required`);
      need(Array.isArray(sl.distractorsEn) && sl.distractorsEn.length >= 2, `pattern.slots[${i}].distractorsEn needs >= 2 entries (no-invention doctrine: author them, don't let the generator guess)`);
      return { pt: sl.pt, en: sl.en, distractorsEn: [...sl.distractorsEn] };
    });
    pattern = { frame: raw.pattern.frame, slots };
  }

  let conjugation;
  if (raw.conjugation) {
    need(typeof raw.conjugation.verb === "string" && raw.conjugation.verb.length > 0, `conjugation.verb is required`);
    need(Array.isArray(raw.conjugation.forms) && raw.conjugation.forms.length >= 2, `conjugation.forms needs >= 2 entries`);
    const forms = raw.conjugation.forms.map((f, i) => {
      need(typeof f.pt === "string" && f.pt.length > 0, `conjugation.forms[${i}].pt is required`);
      need(typeof f.en === "string" && f.en.length > 0, `conjugation.forms[${i}].en is required`);
      need(typeof f.blank === "string" && f.blank.length > 0, `conjugation.forms[${i}].blank is required`);
      return { pt: f.pt, en: f.en, blank: f.blank };
    });
    conjugation = { verb: raw.conjugation.verb, forms };
  }

  // ROUND 3 (lane PTTOOL3, rule 1): `dialogue` is now REQUIRED, not
  // optional — R2-L1/L2/L3 each shipped with no `sim` step at all (a
  // round-1 regression `lib/schedule.mjs`'s own module law never actually
  // enforced for a non-checkpoint lesson: it only threw when checkpoint
  // was true and had no sim). Failing fast HERE, before generation runs,
  // is cheaper than a check.sh failure after the fact — same "most useful
  // message first" doctrine as every other `need()` in this file.
  need(raw.dialogue && typeof raw.dialogue === "object", `"dialogue" is required — every lesson closes on its sim (sim -> matchLit -> speakLit-win, or matchLit -> speakLit -> sim for checkpoint: true); add { npc, turns: [...] }`);
  need(Array.isArray(raw.dialogue.turns) && raw.dialogue.turns.length > 0, `"dialogue.turns" must have >= 1 turn — a dialogue with zero turns cannot render a sim`);
  const dialogue = {
    npc: raw.dialogue.npc,
    turns: raw.dialogue.turns.map((t, i) => {
      need(typeof t.npc === "string", `dialogue.turns[${i}].npc is required`);
      need(Array.isArray(t.options) && t.options.length >= 2, `dialogue.turns[${i}].options needs >= 2`);
      need(Number.isInteger(t.correct) && t.correct >= 0 && t.correct < t.options.length, `dialogue.turns[${i}].correct out of range`);
      return t;
    }),
  };

  return {
    lesson: raw.lesson,
    id: raw.id,
    title: raw.title,
    grammar: raw.grammar,
    info: raw.info,
    infoTitle: raw.infoTitle,
    antiPattern,
    checkpoint,
    recall,
    allow,
    words,
    wordByPt,
    sentences,
    agreement,
    contrast,
    contrastSet,
    pattern,
    conjugation,
    dialogue,
    win: { pt: raw.win.pt, en: raw.win.en },
  };
}
