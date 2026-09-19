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
import { PT_ALLOW_WORDS, isProperNounToken } from "./rules.mjs";
import { inheritFromSpine } from "./spine.mjs";

const need = (cond, msg) => {
  if (!cond) throw new Error(`spec: ${msg}`);
};

export function loadSpec(path) {
  const raw = parse(readFileSync(path, "utf8"));
  return normalizeSpec(raw, path);
}

export function normalizeSpec(raw0, path = "<spec>") {
  need(raw0 && typeof raw0 === "object", `${path} is not a YAML mapping`);
  // Lane PTTOOL4, item 1: `spine: <lesson-id>` fills words/recall/contrast/
  // win/scene from scripts/author/pt/spine/pt-spine.yaml BEFORE any need()
  // below runs, so a spine-backed spec validates the SAME merged shape a
  // fully hand-authored one would. A missing spine id throws here, by
  // name, with the nearest real ids (see lib/spine.mjs).
  const raw = inheritFromSpine(raw0, path);
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
    // ROUND 3 (lane PTTOOL3, rule 2): a `pos: noun` entry must carry a real
    // `emoji` (imageMcq debut) or an EXPLICIT, reasoned opt-out — R2-L3
    // skipped emoji on a noun with no fallback at all, silently losing
    // its imageMcq debut. `imageable: false` without a `emoji` is only
    // legal with a non-empty `imageableReason` (e.g. an abstract noun a
    // 487-glyph vendored set genuinely has nothing for) — never a silent
    // omission the pack can't tell apart from an oversight.
    const imageable = w.imageable === false ? false : true;
    if (w.pos === "noun") {
      if (imageable) {
        need(typeof w.emoji === "string" && w.emoji.length > 0, `words[${i}] ("${w.pt}") is pos: noun and must carry "emoji" (imageMcq debut) — or set "imageable: false" with an "imageableReason"`);
      } else {
        need(typeof w.imageableReason === "string" && w.imageableReason.length > 0, `words[${i}] ("${w.pt}") sets "imageable: false" and needs a non-empty "imageableReason" naming why (an emoji-less noun is otherwise indistinguishable from a skipped one)`);
      }
    }
    return {
      pt: w.pt,
      en: w.en,
      pos: w.pos,
      gender: w.gender ?? undefined,
      emoji: w.emoji ?? undefined,
      imageable,
      imageableReason: w.imageableReason ?? undefined,
      cognate: w.cognate === true,
      falseFriend: w.falseFriend === true,
      of: w.of ?? undefined,
      hint: w.hint ?? undefined,
      // ITEM 4/10 (lane PTTOOL5): a free-text same-domain tag ("animal",
      // "person", "food"…) an imageMcq distractor pool prefers to match —
      // never validated against a closed set (the domain vocabulary is
      // open-ended); optional, silently undefined when the spec omits it.
      class: w.class ?? undefined,
    };
  });
  const wordByPt = new Map(words.map((w) => [w.pt, w]));

  const recall = Array.isArray(raw.recall) ? raw.recall.map(String) : [];
  const recallSet = new Set(recall);
  const allow = Array.isArray(raw.allow) ? raw.allow.map(String) : [];
  // ROUND 3 (lane PTTOOL3, rule 3): `allow:` is a CLOSED set of real
  // function words (PT_ALLOW_WORDS, rules.mjs) — never a place to
  // pre-load a content word. PTGRADE2's round-2 regression: R2-L2
  // allow-listed capital/paris/rio/grande (a later lesson's own atoms,
  // spent early) because `allow:` accepted any string at all. Naming the
  // bad word here, at spec-load time, is cheaper than discovering it via
  // a taught-vocab-residual FAIL after generation.
  for (const w of allow) {
    if (isProperNounToken(w)) continue; // a capitalized token is a proper noun (São, Paulo, Rio, Bia…), always exempt
    need(PT_ALLOW_WORDS.has(w), `"allow" contains "${w}", not a function word in the closed set {${[...PT_ALLOW_WORDS].join(", ")}} — register it as a real atom (words:) or recall: instead`);
  }

  // ROUND 4 (lane PTTOOL4, item 3): `allowExtra:` is the one-off escape
  // hatch `allow:`'s closed set deliberately has none of — a word that's
  // a real content word SOMEWHERE (e.g. "hoje" is a spine atom of a
  // LATER lesson, pt-m3-3) but only ever prose in THIS lesson. Never
  // silent: a non-empty `allowExtra` requires a non-empty `reason`
  // (checked here, at spec-load time) and the generator prints it as
  // INFO — see from-spec.mjs.
  const allowExtra = Array.isArray(raw.allowExtra) ? raw.allowExtra.map(String) : [];
  if (allowExtra.length) {
    need(typeof raw.reason === "string" && raw.reason.trim().length > 0, `"allowExtra" is set (${allowExtra.join(", ")}) but "reason" is missing — allowExtra is a one-off, named exception, never a silent second closed-set entry`);
  }

  const sentences = raw.sentences.map((s, i) => {
    need(typeof s.pt === "string" && s.pt.length > 0, `sentences[${i}].pt is required`);
    need(typeof s.en === "string" && s.en.length > 0, `sentences[${i}].en is required`);
    need(Array.isArray(s.roles) && s.roles.length > 0, `sentences[${i}].roles must be non-empty`);
    need(Array.isArray(s.uses) && s.uses.length > 0, `sentences[${i}].uses must be non-empty`);
    for (const u of s.uses) {
      // ROUND 3 (lane PTTOOL3, rule 4): named the fix explicitly — "uses"
      // credits atoms (answer-floor, taught-vocab-residual) and is
      // deliberately blind to `allow:`, which is prose-only pass-through
      // for the residual check and never earns FSRS credit; a lane that
      // reaches for `uses:` to "use" a function word is in the wrong field.
      need(wordByPt.has(u) || recallSet.has(u), `sentences[${i}].uses references "${u}", not in words[] or recall[] — "uses" credits atoms only (answer-floor + FSRS); a function word belongs in "allow:", never in "uses:"`);
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

  // ITEM 2 (lane PTTOOL5): every contrastSet entry carries a `why` — either
  // explicit (`{ set: [...], why: "..." }`, the new object form) or
  // resolved from a matching `contrast[].note` (exact a/b membership,
  // either order — only possible for a 2-member set). PTGRADE3/4/5 all
  // found the generator writing the SAME template stub
  // ('"tenho" is part of the tenho/tem contrast set — pick the one that
  // fits here.') that explains nothing; validated HERE, at spec-load time
  // (not later, per-cloze), so a bad `why` fails once with the smallest
  // fix instead of silently reaching the learner.
  const contrastSet = Array.isArray(raw.contrastSet)
    ? raw.contrastSet.map((entry, i) => {
        const isObj = entry && !Array.isArray(entry) && typeof entry === "object";
        const set = isObj ? entry.set : entry;
        need(Array.isArray(set) && set.length >= 2, `contrastSet[${i}] needs >= 2 surfaces`);
        for (const s of set) need(wordByPt.has(s) || recallSet.has(s), `contrastSet[${i}] references "${s}", not in words[] or recall[]`);
        let why = isObj && typeof entry.why === "string" ? entry.why : undefined;
        if (!why && set.length === 2) {
          const match = (raw.contrast ?? []).find((c) => (c.a === set[0] && c.b === set[1]) || (c.a === set[1] && c.b === set[0]));
          why = match?.note;
        }
        need(
          typeof why === "string" && why.trim().length > 0,
          `contrastSet[${i}] [${set.join(", ")}] has no "why" — add contrastSet[${i}].why (or, for a 2-member set, a "contrast" entry with matching a/b and a "note")`,
        );
        why = why.trim();
        need(why.length >= 25, `contrastSet[${i}] [${set.join(", ")}].why is only ${why.length} chars (need >= 25) — explain the actual grammar reason, not a restated label`);
        need(!why.toLowerCase().includes("contrast set"), `contrastSet[${i}] [${set.join(", ")}].why contains "contrast set" — that is the template stub, not an explanation; write what actually distinguishes ${set.join("/")}`);
        return { set: [...set], why };
      })
    : [];
  const contrastSetWhy = contrastSet.map((e) => e.why);
  const contrastSetSurfaces = contrastSet.map((e) => e.set);

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
    // ROUND 4 (lane PTTOOL4, item 4): a turn's `mode` defaults to "choice"
    // (every existing spec, unset, is unchanged) — `mode: build` is the
    // real assemble.mjs simLit reply shape (`tiles` + `answer`, no MCQ)
    // this toolkit had no way to author before; see lib/stepsClose.mjs's
    // buildSim for how each mode becomes the sim step's actual reply.
    turns: raw.dialogue.turns.map((t, i) => {
      need(typeof t.npc === "string", `dialogue.turns[${i}].npc is required`);
      const mode = t.mode === "build" ? "build" : "choice";
      if (mode === "build") {
        need(Array.isArray(t.tiles) && t.tiles.length > 0, `dialogue.turns[${i}] (mode: build): "tiles" must be a non-empty tile bank`);
        need(typeof t.answer === "string" && t.answer.length > 0, `dialogue.turns[${i}] (mode: build): "answer" is required`);
        const bank = new Map();
        for (const tile of t.tiles) bank.set(tile, (bank.get(tile) ?? 0) + 1);
        for (const ans of [t.answer, ...(t.alsoAccepted ?? [])]) {
          const need_ = new Map();
          for (const wd of ans.split(/\s+/)) need_.set(wd, (need_.get(wd) ?? 0) + 1);
          for (const [wd, n] of need_) {
            need((bank.get(wd) ?? 0) >= n, `dialogue.turns[${i}] (mode: build): answer "${ans}" needs tile "${wd}" x${n} but the bank has ${bank.get(wd) ?? 0} — smallest fix: add it to "tiles"`);
          }
        }
      } else {
        need(Array.isArray(t.options) && t.options.length >= 2, `dialogue.turns[${i}].options needs >= 2`);
        need(Number.isInteger(t.correct) && t.correct >= 0 && t.correct < t.options.length, `dialogue.turns[${i}].correct out of range`);
      }
      return { ...t, mode };
    }),
  };

  return {
    lesson: raw.lesson,
    id: raw.id,
    spine: raw.spine ?? undefined,
    scene: raw.scene ?? undefined,
    title: raw.title,
    grammar: raw.grammar,
    info: raw.info,
    infoTitle: raw.infoTitle,
    antiPattern,
    checkpoint,
    recall,
    allow,
    allowExtra,
    reason: raw.reason ?? undefined,
    words,
    wordByPt,
    sentences,
    agreement,
    contrast,
    contrastSet: contrastSetSurfaces,
    contrastSetWhy,
    pattern,
    conjugation,
    dialogue,
    win: { pt: raw.win.pt, en: raw.win.en },
  };
}
