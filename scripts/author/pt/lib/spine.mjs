/**
 * lib/spine.mjs — lane PTTOOL4, item 1: `spine: <lesson-id>` in a spec.
 * Loads the course spine (`spine/pt-spine.yaml`, Fable's machine form of
 * docs/pt-spine-2026-09-18.md §4) and fills a spec's content fields from
 * the named lesson, so a writing lane supplies only `sentences:` and
 * `dialogue:` (plus the structural `lesson`/`id` bookkeeping every spec
 * already carries). `lib/spec.mjs` calls `inheritFromSpine` FIRST, before
 * any `need()` validation runs, so every downstream check sees a single,
 * already-merged spec shape whether or not it used `spine:`.
 *
 * Merge rule: a field the spec ALSO sets explicitly wins (`from-spec.mjs`
 * prints "overrides spine: <field>" to name every such override); a field
 * only the spine has is filled in silently.
 */
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SPINE_PATH = join(here, "../spine/pt-spine.yaml");

/** Spine `words[].pos` shorthand -> the full pos word the rest of the
 *  toolkit (`rules.mjs`'s `mapPartOfSpeech`, `VALID_POS`) understands.
 *  `chunk` -> `phrase` per the brief ("chunk rows become phrase-step
 *  atoms") — `phrase` is already a real `Atom.partOfSpeech` member. */
const SPINE_POS_MAP = {
  verb: "verb", noun: "noun", adv: "adverb", chunk: "phrase",
  det: "determiner", pron: "pronoun", adp: "particle", num: "number", adj: "adjective",
};

let cached;
export function loadSpineDoc() {
  if (!cached) cached = parse(readFileSync(SPINE_PATH, "utf8"));
  return cached;
}

/** Every lesson entry across every module, tagged with its module id. */
export function allSpineLessons(doc = loadSpineDoc()) {
  return (doc.modules ?? []).flatMap((m) => (m.lessons ?? []).map((l) => ({ ...l, moduleId: m.id })));
}

export function findSpineLesson(id, doc = loadSpineDoc()) {
  return allSpineLessons(doc).find((l) => l.id === id) ?? null;
}

/** Cheap Levenshtein — good enough for "nearest ids" on a typo, not a
 *  general string-distance library dependency. */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function nearestSpineIds(id, n = 5, doc = loadSpineDoc()) {
  return allSpineLessons(doc)
    .map((l) => l.id)
    .sort((a, b) => levenshtein(id, a) - levenshtein(id, b))
    .slice(0, n);
}

function mapSpineWord(w) {
  const out = { pt: w.pt, en: w.en, pos: SPINE_POS_MAP[w.pos] ?? w.pos };
  if (w.gender) out.gender = w.gender;
  if (w.emoji) out.emoji = w.emoji;
  if (w.cognate) out.cognate = true;
  return out;
}

/** A mechanical, overridable default: the spine has no learner-facing
 *  prose, only the authoring-only `point` line + the word list — so this
 *  is a starting point, not a claim of finished copy (a spec's own
 *  `info:` still wins per the override rule above). */
function synthesizeInfo(lesson) {
  const words = (lesson.words ?? []).map((w) => `${w.pt} (${w.en})`).join(", ");
  const pointLine = lesson.point ? `${lesson.point.charAt(0).toUpperCase()}${lesson.point.slice(1)}.` : "";
  return words ? `${pointLine} New words: ${words}.`.trim() : pointLine || `Checkpoint: ${(lesson.contrasts ?? []).join(", ")}.`;
}

export function inheritFromSpine(raw, specPath = "<spec>") {
  if (!raw.spine) return raw;
  const lesson = findSpineLesson(raw.spine);
  if (!lesson) {
    const nearest = nearestSpineIds(raw.spine);
    throw new Error(`spec: ${specPath}: spine "${raw.spine}" not found in spine/pt-spine.yaml — nearest ids: ${nearest.join(", ")}`);
  }
  const out = { ...raw };
  const fill = (field, value) => {
    if (value === undefined) return;
    if (out[field] !== undefined) { console.log(`from-spec: ${specPath}: overrides spine: ${field}`); return; }
    out[field] = value;
  };

  fill("title", lesson.title);
  if (lesson.point) fill("grammar", `${lesson.grammar ?? ""}${lesson.grammar ? ": " : ""}${lesson.point}`.trim());
  fill("infoTitle", lesson.title);
  fill("info", synthesizeInfo(lesson));
  if (lesson.words) fill("words", lesson.words.map(mapSpineWord));
  if (lesson.recall) fill("recall", [...lesson.recall]);
  if (lesson.contrast) {
    fill("antiPattern", { ok: lesson.contrast.ok, wrong: lesson.contrast.wrong });
    fill("contrast", [{ a: lesson.contrast.ok, b: lesson.contrast.wrong, note: lesson.contrast.why }]);
  }
  if (lesson.win) fill("win", { pt: lesson.win.pt, en: lesson.win.en });
  if (lesson.scene) {
    fill("scene", { ...lesson.scene });
    if (out.dialogue && out.dialogue.npc === undefined) out.dialogue = { ...out.dialogue, npc: lesson.scene.npc };
  }
  return out;
}
