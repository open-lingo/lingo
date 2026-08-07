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
import { VERB_ENTRIES, ADJ_ENTRIES } from "./conjugationTables";
import { JA_COURSE_ATOMS } from "./courseAtoms";

const TRAILING_PUNCT = /([。．.、？?！!]+)$/;

/**
 * Case particles that close a scrambleable phrase. `の` is deliberately
 * ABSENT — it links a modifier to the following noun (ミカの かめは is ONE
 * chunk), so treating it as a boundary would tear noun phrases apart.
 */
const CASE_PARTICLES = ["は", "が", "を", "に", "で", "も", "へ", "と", "から", "まで", "より"];

/**
 * Bare temporal adverbs may lead a sentence with no particle at all
 * (きょう これを しない). They scramble like a marked phrase does.
 */
const BARE_TEMPORALS = new Set([
  "きょう", "あした", "あす", "きのう", "いま", "けさ", "こんばん", "ごぜん", "ごご",
  "よる", "あさ", "ばん", "まいにち",
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
    // THE PAST-NEGATIVE CELL. Present-negative and past-affirmative were
    // wired up years ago; this one never was, so every plain past-negative in
    // the course graded as near-exact-match (「きのうは なにも しなかった」
    // rejected 「…しませんでした」, m16). ない→なかった is regular for every verb
    // in the language, and the polite half is already sitting in the table.
    add(f.nai.replace(/ない$/, "なかった"), f["masu-past-neg"]);
    // 〜たい conjugates as an i-ADJECTIVE, so its polite is plain + です in all
    // four cells — m13's own antiPattern card says exactly this, and every
    // たい step in m13 was rejecting the です form. Derived from the table's
    // `tai` rather than from the learner's input, per the file's contract.
    if (f.tai.endsWith("たい")) {
      const stem = f.tai.slice(0, -1); // のみたい → のみた
      add(f.tai, `${f.tai}です`);
      add(`${stem}くない`, `${stem}くないです`);
      add(`${stem}かった`, `${stem}かったです`);
      add(`${stem}くなかった`, `${stem}くなかったです`);
    }
  }
  // ADJECTIVES. `ADJ_ENTRIES` has carried complete form tables all along and
  // this map never read them, so a conjugated adjective had NO polite route
  // at all: 「きのう かさは やすかった」 accepted 5 variants, none of them
  // 「やすかったです」. Only the PRESENT cell worked, and only by accident —
  // adjectives are tagged `kind: "vocab"` in courseAtoms, so they rode the
  // bare-nominal copula path below.
  for (const adj of ADJ_ENTRIES) {
    if (adj.type === "i-adj") {
      // An i-adjective's polite form IS the plain form plus です, in every
      // cell — it never takes だ and never becomes ありません.
      for (const plain of Object.values(adj.forms)) add(plain, `${plain}です`);
      continue;
    }
    // na-adjective rows are stored POLITE (きれいです / きれいじゃないです /
    // きれいでした / きれいじゃなかったです), so the plain half is what has to be
    // derived. The copula is a separate word here, which is why these do NOT
    // follow the i-adjective rule.
    const polite = adj.forms;
    const bare = adj.dictionary;
    add(`${bare}だ`, polite.present);
    add(bare, polite.present); // casual copula-drop
    add(`${bare}だった`, polite.past);
    const plainNeg = polite.negative.replace(/です$/, "");
    const plainPastNeg = polite["past-negative"].replace(/です$/, "");
    add(plainNeg, polite.negative);
    add(plainPastNeg, polite["past-negative"]);
    // じゃないです and じゃありません are both standard polite negatives; the
    // course authors the first and learners reach for either.
    add(plainNeg, plainNeg.replace(/じゃない$/, "じゃありません"));
    add(
      plainPastNeg,
      plainPastNeg.replace(/じゃなかった$/, "じゃありませんでした"),
    );
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

/**
 * A nominal with the plain copula fused onto it — 「せんせいだ」.
 *
 * Authored surfaces are space-separated, but the copula is NOT a separate
 * token, so `finalToken` handed the nominal check "せんせいだ" and it never
 * matched anything. Result: 「ははは せんせいだ。」 accepted THREE variants and
 * rejected 「ははは せんせいです。」 — a plain/polite pair the course explicitly
 * leaves ungraded before m20.
 *
 * Returns the bare nominal, or null. The whole token is checked FIRST by the
 * caller, so a noun that simply ends in だ (からだ) is matched as itself and
 * never reaches this. Stripping is only allowed when what remains is a
 * REGISTERED nominal, which is what keeps のんだ/よんだ (verb pasts, already
 * matched by the verb tables above) and every other だ-final string out.
 */
function nominalBeforeDa(token: string): string | null {
  if (!token.endsWith("だ")) return null;
  const bare = token.slice(0, -1);
  if (bare.length === 0) return null;
  if (isNominal(bare)) return bare;
  // A number+counter predicate is a nominal PHRASE that no lexicon holds
  // whole: じゅうきゅうえん and ごふん are built from registered pieces (えん,
  // ふん) and registered nowhere themselves, so an exact-match check left
  // 「えんぴつは じゅうきゅうえんだ」 and 「いま しちじ ごふんだ」 with no polite
  // rendering at all. Ending in a registered nominal is enough.
  //
  // Safe because the WHOLE token is tested first by every caller: the course
  // holds exactly five だ-final atoms (からだ, まだ, のんだ, あそんだ, およいだ),
  // からだ is matched as itself, and the three verb pasts are matched by the
  // conjugation tables long before this runs.
  for (let n = 1; n <= 4 && n < bare.length; n++) {
    if (NOMINALS.has(bare.slice(bare.length - n))) return bare;
  }
  return null;
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
      // なに becomes なん in front of the copula — 「なにです」 is not Japanese,
      // 「なんです」 is. The two are separate atoms, so nothing else bridges them.
      const head = core.slice(0, core.length - last.length);
      const nominal = last === "なに" ? "なん" : last;
      return [`${head}${nominal}${isQuestion ? "ですか" : "です"}${punct}`];
    }
    // …or it already carries the PLAIN copula, which です replaces rather
    // than follows: せんせいだ → せんせいです, never せんせいだです.
    const bare = last ? nominalBeforeDa(last) : null;
    if (bare) {
      const head = core.slice(0, core.length - last!.length);
      return [`${head}${bare}${isQuestion ? "ですか" : "です"}${punct}`];
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
 * EVERY plain rendering of a polite sentence.
 *
 * `plainSentenceVariant` returns one, which is all `registerPairFor` needs to
 * show a pair. Grading needs the set, because a nominal predicate has TWO
 * plain renderings and the course teaches both: 「たなかさんは せんせいです」 is
 * 「…せんせいだ」 with the copula, and 「…せんせい」 with it dropped.
 *
 * This is the missing half of the register widening. `translateVariants` only
 * ever called `politeSentenceVariants`, so which register a learner could
 * answer in depended on which one the AUTHOR happened to write — 「Say to a
 * friend」 steps accepted the polite answer while 「Say politely」 steps
 * rejected the plain one. Spencer 2026-08-05: symmetric everywhere below
 * REGISTER_GRADED_FROM_MODULE.
 */
export function plainSentenceVariants(sentence: string): string[] {
  const out = new Set<string>();
  const one = plainSentenceVariant(sentence);
  if (one) out.add(one);

  const { core, punct } = splitPunct(sentence);
  const isQuestion = /[？?]/.test(punct);
  const stem = isQuestion && core.endsWith("か") ? core.slice(0, -1) : core;
  const bare = stem.replace(/です$/, "");
  if (bare !== stem) {
    const last = finalToken(bare);
    // Restore the plain copula the です was standing in for. Only on a
    // NOMINAL — an i-adjective's polite is plain + です, so 「たかいです」 drops
    // to 「たかい」 and must never become 「たかいだ」.
    if (last && isNominal(last)) {
      out.add(`${bare}${punct}`);
      if (!isQuestion) out.add(`${bare}だ${punct}`);
    }
  }
  return [...out];
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
 * phrases. The predicate stays final (Japanese is verb-final, always).
 *
 * Only the LONGEST CONTIGUOUS RUN of particle-closed phrases moves; every
 * other chunk stays exactly where it was authored.
 *
 * This used to be all-or-nothing — one chunk it couldn't identify bailed the
 * whole sentence — which meant a single leading interjection or a bare verb
 * cost the sentence its scrambling entirely. 「すみません バスで としょかんに
 * いきますか」 got zero variants because of すみません, and every sentence
 * containing いちばん/たぶん got zero because those adverbs carry no particle
 * (2026-08-05 audit, m18–m24 and m25–m30).
 *
 * A contiguous run is the safe generalisation, and the two things it refuses
 * are exactly the two that matter:
 *
 *  - **It never reorders across a fixed chunk.** In 「トムは くうこうに つく
 *    つもりだと おもう」 the run stops at the bare verb つく, so トムは and
 *    くうこうに swap and the つく つもりだと predicate complex is untouched.
 *    Permuting the whole pre-predicate span would have hoisted つもりだと to
 *    the front and emitted word salad — と is in CASE_PARTICLES and looks
 *    movable, but here it is quotative.
 *  - **It keeps a fixed adverb pinned to the predicate.** いちばん must stay
 *    immediately pre-predicate; being outside the run is what guarantees it.
 */
export function scrambleVariants(sentence: string): string[] {
  const { core, punct } = splitPunct(sentence);
  const tokens = core.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return [];
  const chunks = chunk(tokens);
  if (chunks.length < 3) return [];
  const pre = chunks.slice(0, -1);

  // Longest contiguous movable run; first one wins a tie.
  let bestStart = 0;
  let bestLen = 0;
  let start = 0;
  let len = 0;
  for (let i = 0; i <= pre.length; i++) {
    if (i < pre.length && isMovable(pre[i])) {
      if (len === 0) start = i;
      len++;
    } else {
      if (len > bestLen) {
        bestLen = len;
        bestStart = start;
      }
      len = 0;
    }
  }
  if (bestLen < 2 || bestLen > MAX_MOVABLE_CHUNKS) return [];

  const head = chunks.slice(0, bestStart);
  const run = chunks.slice(bestStart, bestStart + bestLen);
  const tail = chunks.slice(bestStart + bestLen);
  return permutations(run)
    .map((order) => `${[...head, ...order, ...tail].join(" ")}${punct}`)
    .filter((variant) => variant !== `${core}${punct}`);
}

/**
 * The two members of an open list may be given in either order.
 *
 * 「いぬや ねこが すきだ」 and 「ねこや いぬが すきだ」 are the same statement —
 * や's own rule card defines it as naming a couple of examples out of many
 * and says nothing about order, and たり…たり…する has the same semantics.
 * `scrambleVariants` cannot reach these: it permutes whole chunks, and this
 * needs the JOINING particle to stay put while its nouns trade places.
 *
 * **と is deliberately excluded.** 「いぬと ねこが いる」 (a closed list) and
 * 「ミカと えいがを みる」 (と = "with") are structurally identical — [Xと]
 * [Y+case] [verb] — and telling them apart needs semantics this layer does
 * not have. Swapping the second would produce 「えいがと ミカを みる」, which
 * says something else entirely. と-lists stay hand-listed in `alsoAccept`.
 */
const YA_LIST = /(^|\s)([^\s、。]+)や\s+([^\s、。]+?)([はがをに])(?=\s|$)/g;
/**
 * A たり member is a whole phrase, not a token — 「えいがを みたり」 is object +
 * verb — so the halves may contain spaces. Anchored on the する that closes
 * the construction so the lazy halves cannot run past it.
 */
const TARI_PAIR = /([^、。]+?)たり\s+([^、。]+?)たり(?=\s*(する|します|$))/;

export function listOrderVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(YA_LIST)) {
    const at = m.index as number;
    out.push(
      `${sentence.slice(0, at)}${m[1]}${m[3]}や ${m[2]}${m[4]}` +
        sentence.slice(at + m[0].length),
    );
  }
  const tari = TARI_PAIR.exec(sentence);
  if (tari) {
    const at = tari.index;
    out.push(
      `${sentence.slice(0, at)}${tari[2]}たり ${tari[1]}たり` +
        sentence.slice(at + tari[0].length),
    );
  }
  return out;
}

/**
 * The casual copula DROP, and its mirror.
 *
 * The course teaches dropping だ before it teaches だ exists, so both
 * 「ははは せんせいだ」 and 「ははは せんせい」 are things it authors — and each was
 * rejecting the other. This is register-INDEPENDENT (both are plain), so
 * unlike the です⇄だ pairing it is not gated at m20.
 *
 * Guarded by `nominalBeforeDa`: the だ only comes off when what remains is a
 * registered nominal, which keeps every verb past (のんだ, よんだ) and every
 * noun that merely ends in だ (からだ) out of it. The mirror skips questions —
 * 「どこだ？」 is a register the course never asks for.
 */
export function copulaVariants(sentence: string): string[] {
  const { core, punct } = splitPunct(sentence);
  const last = finalToken(core);
  if (!last) return [];
  const head = core.slice(0, core.length - last.length);
  // The WHOLE token is tested first, exactly as `politeSentenceVariants` does.
  // からだ is a noun that merely ends in だ — testing for the copula first
  // stripped it to から, which is itself registered and so passed the
  // counter-phrase check. Order is the guard here, not the check.
  if (isNominal(last)) {
    return /[？?]/.test(punct) ? [] : [`${head}${last}だ${punct}`];
  }
  const bare = nominalBeforeDa(last);
  return bare ? [`${head}${bare}${punct}`] : [];
}

/**
 * A bare て-form request and its 〜てください twin.
 *
 * 「みずを のんで」 and 「みずを のんでください」 are one speech act two registers
 * apart, and m8 authors both — 「みずを のんでください。」 was rejecting
 * 「みずを のんで。」 and vice versa.
 *
 * Driven off `VERB_ENTRIES.forms.te` rather than a 〜て suffix regex, because
 * the て-form of a godan verb ends in で (のんで, よんで, あそんで) and a bare
 * suffix match would read the で of 「いえで。」 as one and offer
 * 「いえでください」. Matching the lexicon's actual て-forms cannot do that.
 *
 * Register-bearing, so the caller gates it at REGISTER_GRADED_FROM_MODULE
 * along with the other polite/plain pairs.
 */
const TE_FORMS: ReadonlySet<string> = new Set([
  ...VERB_ENTRIES.map((e) => e.forms.te).filter(Boolean),
  // `VERB_ENTRIES` does not cover every verb the course teaches — きく has no
  // row, so 「うたを きいて。」 found no て-form and got no ください twin. The atom
  // registry carries the rest as explicit "(te-form)" vocab. Filtering on
  // pos === "verb" is what keeps the other て/で-final words out: きって is a
  // postage stamp, たて a length, and で/まで/ので are particles.
  ...JA_COURSE_ATOMS.filter(
    (a) => a.pos === "verb" && /[てで]$/.test(a.kana),
  ).map((a) => a.kana),
]);

export function teRequestVariants(sentence: string): string[] {
  const { core, punct } = splitPunct(sentence);
  const withoutKudasai = core.replace(/ください$/, "");
  if (withoutKudasai !== core) {
    const last = finalToken(withoutKudasai);
    return last && TE_FORMS.has(last) ? [`${withoutKudasai}${punct}`] : [];
  }
  const last = finalToken(core);
  return last && TE_FORMS.has(last) ? [`${core}ください${punct}`] : [];
}

/**
 * The must-form ladder — 〜なきゃ / 〜なくちゃ / 〜なければ ならない.
 *
 * m28's own L2 rule card settles the first pair: "なくては is a second
 * conditional doing the same job, and it contracts to なくちゃ: 「いかなくちゃ」
 * means exactly what 「いかなきゃ」 means, in exactly the same register. Which
 * one a speaker reaches for is habit, not grammar." The grader disagreed with
 * the lesson — はたらかなくちゃ graded wrong against はたらかなきゃ (Spencer m28
 * walk, 2026-08-05).
 *
 * All of these endings sit on the SAME ない-stem (いか / かえら / はたらか), so
 * the rewrite is a suffix swap needing no lexicon — which matters, because
 * that stem exists in no lexicon in this repo. m28's IR registers every
 * must-form WHOLE for exactly that reason, and deconjugating one here would
 * re-import the problem the whole-form registration exists to avoid.
 *
 * **One-way on the full form** (Spencer, 2026-08-05): a contraction target
 * also accepts 〜なければ ならない, because spelling the long form out is never
 * wrong. The reverse is deliberately NOT generated — m28 L2's teaching target
 * IS the full form, and accepting いかなきゃ there would let a learner skip the
 * lesson. Nothing below matches a full form, so the expansion cannot run
 * backwards even through the caller's fixpoint.
 *
 * Anchored at a clause end because that is where a must-form lives: "なきゃ
 * ends the sentence on its own. Nothing follows it" (m28 L1).
 */
const MUST_CONTRACTION = /(なきゃ|なくちゃ)(?=[。．.、！!？?]|\s*$)/g;

/** The long forms a contraction may also be written as. */
const MUST_LONG_FORMS = ["なければ ならない", "なくては ならない"];

/**
 * なければ ⇄ なくては in an ALREADY-long must-form.
 *
 * Separate from the contraction path above and safe in both directions: these
 * are two conditionals doing one job (m28's own card), and neither is a
 * shorter form of the other, so swapping them cannot let a learner skip the
 * long form m28 L2 teaches. 「あした いかなければ なりません」 was rejecting
 * 「…いかなくては なりません」.
 */
const LONG_MUST_CONDITIONAL = /(なければ|なくては)(?=\s*(ならない|なりません))/g;

export function longMustFormVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(LONG_MUST_CONDITIONAL)) {
    const at = m.index as number;
    if (at === 0) continue;
    const twin = m[1] === "なければ" ? "なくては" : "なければ";
    out.push(
      `${sentence.slice(0, at)}${twin}${sentence.slice(at + m[0].length)}`,
    );
  }
  return out;
}

/**
 * ん is the spoken contraction of の, and the course writes only the ん.
 *
 * 「ねつが あるんだ」 and 「ねつが あるのだ」 are the same sentence in the same
 * register; m27 authors nine translate targets in the ん spelling and rejected
 * every の one. Anchored to んだ / んです specifically, NOT to any trailing の —
 * m30's casual の-question (「なにしてるの」) is a different item entirely, and
 * 「…のだ？」 is not how a spoken question ends.
 *
 * なんだ/なんです ride along: they are な + んだ, so the same swap gives
 * なのだ/なのです, which is correct (「びょうきなんだ」 → 「びょうきなのだ」).
 */
const N_DESU = /ん(だ|です)(?=[。．.、！!？?]|\s*$)/g;

export function nDesuVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(N_DESU)) {
    const at = m.index as number;
    // Needs something in front of it — a bare んだ is not a sentence.
    if (at === 0) continue;
    out.push(
      `${sentence.slice(0, at)}の${m[1]}${sentence.slice(at + m[0].length)}`,
    );
  }
  return out;
}

/**
 * じゃ is the colloquial contraction of では, in every negative-copula shape
 * the course uses. Closed pair, both directions, meaning identical.
 * 「ごごは ひまじゃない」 was rejecting 「ごごは ひまでは ない」.
 */
/**
 * Whitespace is tolerated on the way IN because the course writes じゃない
 * glued and では ない spaced, and emitted glued because the grader normalizes
 * whitespace on both sides anyway.
 */
const NEGATIVE_COPULA = /(じゃ|では)\s*(ない|ありません|なかった|ありませんでした)/g;

export function dewaVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(NEGATIVE_COPULA)) {
    const at = m.index as number;
    if (at === 0) continue;
    const twin = m[1] === "じゃ" ? "では" : "じゃ";
    out.push(
      `${sentence.slice(0, at)}${twin}${m[2]}${sentence.slice(at + m[0].length)}`,
    );
  }
  return out;
}

export function mustFormVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(MUST_CONTRACTION)) {
    const at = m.index as number;
    // A bare なきゃ is not a sentence — it needs the ない-stem in front of it.
    if (at === 0) continue;
    const head = sentence.slice(0, at);
    const tail = sentence.slice(at + m[0].length);
    const twin = m[1] === "なきゃ" ? "なくちゃ" : "なきゃ";
    for (const ending of [twin, ...MUST_LONG_FORMS]) {
      out.push(`${head}${ending}${tail}`);
    }
  }
  return out;
}

/**
 * かえる carries its own destination.
 *
 * 帰る is not "return" in the abstract — it is "go back where you belong", and
 * the belonging is IN THE VERB (`courseAtoms` glosses it "to go back" and
 * notes it as the "home as return-destination cue"). So 「かえらなきゃ」,
 * 「うちに かえらなきゃ」 and 「いえに かえらなきゃ」 are one sentence written three
 * ways, and a learner is right whether they leave the destination implied or
 * spell it out — 「きょう うちに かえらなきゃ」 graded wrong against
 * 「きょうは かえらなきゃ」 (Spencer m28 walk, 2026-08-05).
 *
 * Scoped tightly, in both directions:
 *  - only うち/いえ are droppable. Other destinations are NOT — 「くにに かえる」
 *    is going back to your COUNTRY, and dropping くに loses the sentence.
 *  - a destination is only ADDED where the verb has none, so a phrase already
 *    marking one is never double-marked.
 *  - only かえる takes this. Every other verb needs its destination said.
 *
 * に⇄へ rides along because both mark a destination on a motion verb — the
 * swap `moduleCompiler`'s `particleVariants` already makes at compile time,
 * but reachable here from every derived variant rather than only from the
 * authored string.
 *
 * かえる is unambiguous in this course: `courseAtoms` records that the
 * potential of かう was REJECTED as an atom precisely because its kana collide
 * with 帰る, so no かえる surface here is ever "can buy".
 */
const RETURN_VERB_SOURCE =
  "かえ(?:らなければ|らなくちゃ|らなくては|りましょう|らなかった|りたい|りました|りません|らなきゃ|らない|ります|った|って|ろう|る)";
const RETURN_VERB = new RegExp(RETURN_VERB_SOURCE, "g");

/** Every way this course spells "(to) home" as a destination. */
const HOME_DESTINATIONS = ["うちに", "いえに", "うちへ", "いえへ"];
const HOME_DESTINATION_BEFORE = /(うち|いえ)([にへ])\s*$/;
/**
 * Any に/へ-marked phrase ANYWHERE in the clause, not merely the token in
 * front of the verb. Checking only the adjacent token reads
 * 「くにに わたしは かえらなきゃ」 — a legal scramble — as destinationless and
 * accepts 「くにに わたしは うちに かえらなきゃ」, which marks the destination
 * twice. One clause gets one destination.
 */
const ANY_DESTINATION = /[^\s、。]+[にへ](?=[\s、]|$)/;

export function homeReturnVariants(sentence: string): string[] {
  const out: string[] = [];
  for (const m of sentence.matchAll(RETURN_VERB)) {
    const at = m.index as number;
    const head = sentence.slice(0, at);
    const rest = sentence.slice(at);
    const marked = HOME_DESTINATION_BEFORE.exec(head);
    if (marked) {
      const before = head.slice(0, marked.index);
      const written = `${marked[1]}${marked[2]}`;
      // Leave it implied — かえる already says "home".
      out.push(`${before}${rest}`.trim());
      // …or spell it another way.
      for (const dest of HOME_DESTINATIONS) {
        if (dest !== written) out.push(`${before}${dest} ${rest}`);
      }
      continue;
    }
    // The clause this かえる belongs to, back to the previous sentence end.
    const clause = head.slice(head.lastIndexOf("。") + 1);
    if (ANY_DESTINATION.test(clause)) continue;
    // Nothing marked — the learner may say the implied destination out loud.
    for (const dest of HOME_DESTINATIONS) out.push(`${head}${dest} ${rest}`);
  }
  return out;
}
