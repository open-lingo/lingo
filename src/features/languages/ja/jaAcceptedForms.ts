/**
 * JA accepted-answer widening — register (plain ⇄ polite) and argument
 * scrambling.
 *
 * Spencer's ruling 2026-07-24: "if people use polite form it should be
 * accepted, we need as many grammatically correct or close translations of
 * the sentence as possible to be correct… let me think of as many other ways
 * I can say this."
 *
 * Two independent widenings, both driven by data the course already owns:
 *
 *  1. **Register.** うまが います is correct Japanese for "there's a horse"
 *     even though the dictionary-form-first spine teaches うまが いる. The
 *     plain→polite pairs come straight out of `VERB_ENTRIES.forms` (which
 *     already carries dictionary/nai/ta beside masu/masu-neg/masu-past), so
 *     we GENERATE from the course's own tables rather than deconjugating
 *     learner input — the same contract `jaSurfaceForms` follows.
 *
 *  2. **Scrambling.** Japanese marks roles with particles, not word order,
 *     so いけに ミカの かめは いる means exactly what ミカの かめは いけに いる
 *     means. Previously each reorder had to be hand-listed in the IR's
 *     `alsoAccept` (m6 walk round 6 patched かめは いけに いる by hand); this
 *     derives them. Scrambling is meaning-preserving in a way it never is in
 *     English, which is why permuting is safe here.
 *
 * This also un-blocks putting real particles back in build-tile banks
 * (Spencer, same ruling: "particle distractors are good… we want them to
 * have to think"). A bank that can spell a valid alternative ordering stops
 * being a false-negative trap once the grader accepts the alternative.
 *
 * Pure and deterministic — no React, no storage.
 */
import { VERB_ENTRIES } from "./conjugationTables";
import { JA_COURSE_ATOMS } from "./courseAtoms";

const TRAILING_PUNCT = /([。．.、？?！!]+)$/;

/**
 * Case particles that close a scrambleable phrase. `の` is deliberately
 * ABSENT — it links a modifier to the following noun (ミカの かめは is ONE
 * chunk), so treating it as a boundary would tear noun phrases apart.
 */
const CASE_PARTICLES = ["は", "が", "を", "に", "で", "も", "へ", "と", "から", "まで"];

/**
 * Bare temporal adverbs may lead a sentence with no particle at all
 * (きょう これを しない). They scramble like a marked phrase does.
 */
const BARE_TEMPORALS = new Set([
  "きょう", "あした", "あす", "きのう", "いま", "けさ", "こんばん", "よる", "あさ", "まいにち",
]);

/** Sentences wider than this stop permuting — 4 movable chunks = 24 orders. */
const MAX_MOVABLE_CHUNKS = 4;

function buildRegisterMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (plain: string, polite: string) => {
    if (!plain || !polite || plain === polite) return;
    const seen = map.get(plain);
    if (seen) {
      if (!seen.includes(polite)) seen.push(polite);
    } else {
      map.set(plain, [polite]);
    }
  };
  for (const entry of VERB_ENTRIES) {
    const f = entry.forms;
    add(f.dictionary, f.masu);
    add(f.nai, f["masu-neg"]);
    add(f.ta, f["masu-past"]);
  }
  // ある/いる carry the course's existence grammar and are not drilled
  // conjugation-table entries. ある's negative is suppletive (ない, an
  // i-adjective form) and its polite counterpart is ありません — never
  // あらない/あらありません.
  add("ある", "あります");
  add("いる", "います");
  add("ない", "ありません");
  add("いない", "いません");
  return map;
}

/** Plain surface → every polite surface the course would accept for it. */
export const JA_PLAIN_TO_POLITE: ReadonlyMap<string, readonly string[]> =
  buildRegisterMap();

/** Polite surface → the plain form it derives from. */
const POLITE_TO_PLAIN: ReadonlyMap<string, string> = (() => {
  const inverse = new Map<string, string>();
  for (const [plain, polites] of JA_PLAIN_TO_POLITE) {
    for (const polite of polites) {
      // ありません is the polite of BOTH ある's negative ない and, loosely, of
      // a bare ない — keep the first (canonical) mapping.
      if (!inverse.has(polite)) inverse.set(polite, plain);
    }
  }
  return inverse;
})();

/**
 * Module from which register becomes a GRADED distinction.
 *
 * Spencer's ruling 2026-07-24: "politeness flag will never be a choice, we
 * will accept either answer, show them both, and then start grading on it
 * later in the course, maybe module 20 or so."
 *
 * Before this module both registers are accepted and the learner is SHOWN
 * the pair (see `registerPairFor`) — exposure without stakes, matching the
 * dict-form-first spine where ます is a mechanical derivation drilled beside
 * the plain form. From here on, a step's authored register is the answer.
 */
export const REGISTER_GRADED_FROM_MODULE = 20;

/**
 * Nouns/adjectives that can carry the polite copula. The course teaches the
 * casual copula-DROP (かめは そこ) before です exists, so かめは そこです is the
 * same sentence one register up — it must pass. Verb forms are excluded:
 * たべないです is not the polite of たべない (たべません is).
 */
const NOMINALS: ReadonlySet<string> = new Set(
  JA_COURSE_ATOMS.filter(
    (a) =>
      a.kind === "vocab" &&
      !a.kanaDrillOnly &&
      // "to eat" style glosses are dictionary-form verbs.
      !/^to /i.test(a.meaningEn) &&
      !/(ない|ます|ません|です)$/.test(a.kana),
  ).map((a) => a.kana),
);

function isNominal(token: string): boolean {
  if (JA_PLAIN_TO_POLITE.has(token) || POLITE_TO_PLAIN.has(token)) return false;
  return NOMINALS.has(token);
}

/** Last space/comma-separated token of a sentence core. */
function finalToken(core: string): string | undefined {
  const tokens = core.split(/[\s、,]+/).filter(Boolean);
  return tokens[tokens.length - 1];
}

function splitPunct(sentence: string): { core: string; punct: string } {
  const trimmed = sentence.trim();
  const punct = TRAILING_PUNCT.exec(trimmed)?.[1] ?? "";
  return {
    core: punct ? trimmed.slice(0, trimmed.length - punct.length) : trimmed,
    punct,
  };
}

/**
 * The polite rendering(s) of a plain-form sentence, or [] when the sentence
 * doesn't end in a plain predicate we can map.
 *
 * Matches the LONGEST plain form the sentence ends with, so こない resolves
 * to きません rather than ない→ありません. Requires the matched form to start
 * at a word boundary — the authored surfaces this runs on are space-
 * separated, which keeps はいる from being read as は + いる.
 */
export function politeSentenceVariants(sentence: string): string[] {
  const { core, punct } = splitPunct(sentence);
  if (!core) return [];
  const isQuestion = /[？?]/.test(punct);
  let best = "";
  for (const plain of JA_PLAIN_TO_POLITE.keys()) {
    if (plain.length > best.length && core.endsWith(plain)) best = plain;
  }
  if (!best) {
    // No verb predicate — a bare nominal takes the polite copula instead
    // (かめは そこ → かめは そこです, ぼうしは どこ？ → ぼうしは どこですか？).
    const last = finalToken(core);
    if (last && isNominal(last)) {
      return [`${core}${isQuestion ? "ですか" : "です"}${punct}`];
    }
    return [];
  }
  const head = core.slice(0, core.length - best.length);
  // Word boundary: authored surfaces are space-separated, and a comma also
  // closes a phrase (かぎ、ある？). Without this, はいる would be read as
  // は + いる and mis-derive はいます.
  if (head !== "" && !/[\s、,]$/.test(head)) return [];
  // A polite question needs か: いますか？ (the plain form leaves it bare).
  const suffix = isQuestion ? "か" : "";
  return (JA_PLAIN_TO_POLITE.get(best) ?? []).map(
    (polite) => `${head}${polite}${suffix}${punct}`,
  );
}

/**
 * The plain rendering of a polite sentence — the inverse of
 * `politeSentenceVariants`. A polite question sheds its か along with ます
 * (いますか？ → いる？).
 */
export function plainSentenceVariant(sentence: string): string | null {
  const { core, punct } = splitPunct(sentence);
  if (!core) return null;
  const isQuestion = /[？?]/.test(punct);
  // A polite question carries か between the verb and the mark.
  const stem = isQuestion && core.endsWith("か") ? core.slice(0, -1) : core;
  let best = "";
  for (const polite of POLITE_TO_PLAIN.keys()) {
    if (polite.length > best.length && stem.endsWith(polite)) best = polite;
  }
  if (!best) {
    // Polite copula on a nominal — drop it back to the casual copula-drop
    // form the course teaches (かめは そこです → かめは そこ).
    const bare = stem.replace(/です$/, "");
    const last = bare !== stem ? finalToken(bare) : undefined;
    return last && isNominal(last) ? `${bare}${punct}` : null;
  }
  const head = stem.slice(0, stem.length - best.length);
  if (head !== "" && !/[\s、,]$/.test(head)) return null;
  return `${head}${POLITE_TO_PLAIN.get(best)}${punct}`;
}

/**
 * Both register renderings of a sentence, whichever one was written — the
 * teaching surface for Spencer's "accept either answer, show them both".
 * Returns null when the sentence has no mappable predicate (a copula-drop
 * nominal like かめは そこ, say).
 */
export function registerPairFor(
  sentence: string,
): { plain: string; polite: string } | null {
  const polite = politeSentenceVariants(sentence)[0];
  if (polite) return { plain: sentence.trim(), polite };
  const plain = plainSentenceVariant(sentence);
  if (plain) return { plain, polite: sentence.trim() };
  return null;
}

/** Group space-separated tokens into particle-closed phrases. */
function chunk(tokens: string[]): string[] {
  const chunks: string[] = [];
  let pending: string[] = [];
  for (const token of tokens) {
    pending.push(token);
    // A の-final token modifies whatever follows — keep accumulating.
    if (token.endsWith("の")) continue;
    chunks.push(pending.join(" "));
    pending = [];
  }
  if (pending.length > 0) chunks.push(pending.join(" "));
  return chunks;
}

function isMovable(phrase: string): boolean {
  return (
    CASE_PARTICLES.some((p) => phrase.endsWith(p)) || BARE_TEMPORALS.has(phrase)
  );
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([items[i], ...tail]);
  }
  return out;
}

/**
 * Every meaning-preserving reordering of a sentence's particle-marked
 * phrases. The predicate stays final (Japanese is verb-final, always), and
 * every movable phrase must be particle-closed — a chunk we can't identify
 * bails the whole sentence rather than risk emitting word salad.
 */
export function scrambleVariants(sentence: string): string[] {
  const { core, punct } = splitPunct(sentence);
  const tokens = core.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return [];
  const chunks = chunk(tokens);
  if (chunks.length < 3) return [];
  const movable = chunks.slice(0, -1);
  const predicate = chunks[chunks.length - 1];
  if (movable.length < 2 || movable.length > MAX_MOVABLE_CHUNKS) return [];
  if (!movable.every(isMovable)) return [];
  return permutations(movable)
    .map((order) => `${[...order, predicate].join(" ")}${punct}`)
    .filter((variant) => variant !== `${core}${punct}`);
}
