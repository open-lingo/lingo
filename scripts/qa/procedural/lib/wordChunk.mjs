/**
 * Word-level chunk/content-morpheme facts for the ES/FR/KO ports of Q2
 * (whole-word-tiles) and Q3 (one-content-word-per-chunk).
 *
 * JA is agglutinative and space-FREE — Q2/Q3 there are about sub-word
 * MORPHEME boundaries inside a single orthographic run (`lib/irLexicon.mjs`,
 * `lib/tileMorphology.mjs`). ES/FR/KO are space-tokenized, and the
 * authoring guides (`docs/es-lesson-authoring-guide.md` §14,
 * `docs/fr-authoring-playbook.md` "Build alternates") EXPLICITLY sanction
 * multi-word tiles for fixed expressions and chunked conjugations
 * («buenas noches», «por favor», «je vais», «s'il vous plaît», «j'ai
 * mangé» — "verbs are CHUNKS" until the m11 conjugation checkpoint). So the
 * JA-style "does a real word span this tile boundary" question does not
 * port literally: a tile SPANNING several orthographic words on purpose is
 * normal, not a defect.
 *
 * The two questions this file backs are redefined for space-tokenized
 * courses (see `docs/procedural-qa-2026-09-17.md` §"chunk definitions"):
 *
 *   Q2 (word-boundary integrity): does concatenating a step's tiles,
 *   word-for-word, exactly reconstruct `targetSentence`? A tile that
 *   fragments a single orthographic word across a tile boundary (the
 *   direct ES/FR/KO analogue of JA's やめて shrapnel — e.g. "corr" + "iendo"
 *   instead of "corriendo") fails this; a multi-word tile ("buenas noches"
 *   as ONE tile) does not, because the reconstruction is still exact.
 *   Purely mechanical — no dictionary needed, see `sentenceReconstructs`.
 *
 *   Q3 (one content word per tile): within one tile, split on internal
 *   whitespace into its own words; a tile is flagged only if it contains
 *   TWO OR MORE independent CONTENT words (not glue) and the tile's own
 *   full text is not itself a registered whole-course atom (the fixed-
 *   expression escape the authoring guides describe — "chunks registered
 *   whole"). "Content" vs "glue" is decided by:
 *     - ES/FR: a small closed-class function-word table (articles,
 *       prepositions, clitic pronouns, conjunctions, the `ne...pas`
 *       negation frame) — the ES/FR analogue of JA's PARTICLES list for
 *       Q4 — cross-checked against Lexique's `cgram` for FR (`lib/lexique.mjs`'s
 *       `isFunctionWord`, ART/PRE/PRO/CON) where the table doesn't resolve.
 *       simplemma (`scripts/lexical/es|fr/sidecar.mjs`) is NOT used for
 *       this content/function split — it lemmatizes and flags dictionary
 *       membership, not part of speech, so it cannot tell glue from
 *       content on its own. It IS the ES/FR analyzer of record
 *       (installed, tested, licence-recorded — docs/procedural-qa-
 *       2026-09-17.md) and a natural place to plug a future "is this
 *       content word even attested" cross-check; scoped out here rather
 *       than silently unused.
 *     - KO: Kiwi's own morphological tags (`sidecar.mjs`, `kiwipiepy`) —
 *       content tags (NNG/NNP/NNB/NR/NP/VV/VA/VX/VCN/MAG/MAJ/MM/IC/XR/SL/
 *       SH/SN) vs function tags (particles JK-series/JX/JC, endings EP/EF/EC/
 *       ETN/ETM, copula VCP, affixes XSN/XSV/XSA/XPN, symbols S*) — the
 *       direct KO analogue of JA's fugashi POS fallback, and arguably a
 *       BETTER fit than a hand table since Kiwi already segments KO's own
 *       agglutination (조사/어미) the way UniDic does for JA.
 */
import { isFunctionWord as lexiqueIsFunctionWord, lexiqueAvailable } from "./lexique.mjs";

// ---- Punctuation stripped before word-splitting, per language ----------
const PUNCT = {
  es: /[¿¡"“”«»‘’'.,;:!?()\[\]…—–]/g,
  fr: /["“”«»‘’.,;:!?()\[\]…—–]/g,
  ko: /["“”「」『』.,;:!?()\[\]…·]/g,
};

/** Sentence -> whitespace-delimited words, punctuation stripped. Full-width
 *  and half-width space both split (matches `irLexicon.mjs`'s `chunksOf`
 *  convention for consistency, even though ES/FR/KO content is ASCII-space
 *  by construction). */
export function wordsOf(text, lang) {
  const punct = PUNCT[lang] ?? /[.,;:!?()]/g;
  return String(text)
    .replace(punct, "")
    .trim()
    .split(/[\s　]+/)
    .filter(Boolean);
}

/**
 * Q2's mechanical boundary check: do the tiles, joined word-for-word,
 * exactly reconstruct `targetSentence`? Returns `null` when clean, or a
 * `{expected, got}` mismatch descriptor otherwise. A tile carrying several
 * words internally (a sanctioned multi-word tile) still reconstructs
 * cleanly, since its words simply appear consecutively in both sides —
 * only a tile that SPLITS a single orthographic word, or that drops/adds
 * a word, produces a mismatch.
 */
export function sentenceReconstructs(targetSentence, tiles, lang) {
  // KO is NOT purely space-tokenized the way ES/FR are: a particle or the
  // copula (이에요/예요/이다...) attaches DIRECTLY to the preceding noun
  // with NO space (표준 띄어쓰기 — Korean word-spacing groups an 어절
  // "orthographic word" = content stem + its bound particles/endings as
  // ONE unit) even though a genuine build EXERCISE deliberately tiles the
  // stem and its attached particle/copula SEPARATELY so the learner
  // practices choosing the right one (exactly Q4's JA doctrine, ported).
  // Measured 2026-09-17 (lane A7e): comparing word-joined-by-space (the
  // ES/FR rule) flags this CORRECT, intended split as a false "mismatch"
  // in 5/58 KO applicable steps (e.g. tiles ["학생","이에요"] for
  // "학생이에요") — not a defect, a script-spacing artifact. KO therefore
  // compares with ALL whitespace stripped from both sides (character
  // concatenation, the same permissiveness JA's own Q2 chunk-grouping
  // rests on), not word-for-word.
  if (lang === "ko") {
    const expected = String(targetSentence).replace(/\s/g, "");
    const got = tiles.join("").replace(/\s/g, "");
    if (expected === got) return null;
    return { expected, got };
  }
  const sentWords = wordsOf(targetSentence, lang);
  const tileWords = tiles.flatMap((t) => wordsOf(t, lang));
  const expected = sentWords.join(" ");
  const got = tileWords.join(" ");
  if (expected === got) return null;
  return { expected, got };
}

/**
 * A "phrase-choice bank" (Q3 exclusion, ES/FR/KO): a build/listen step
 * whose tile bank is really a DISCRIMINATION exercise between several
 * competing WHOLE-CLAUSE tiles (each an alternate answer, not a
 * compositional word piece) — the ES/FR analogue of JA's `picker: true`
 * register-choice steps, which `docs/procedural-qa-2026-09-17.md` §3
 * (finding #10) already documents as a category error that must be
 * excluded BEFORE measuring precision, not folded into the function-word
 * table. Measured 2026-09-17 (lane A7e): real examples
 * (`fr-m13-8-build-2`'s tiles `["je n'ai pas de sœur", "et toi ?", "je
 * n'ai pas de frère", "j'ai une sœur"]`) glue a negation frame + its
 * object into ONE tile specifically because the OTHER tiles in the bank
 * are equally full clause-length alternatives (a wrong object, a wrong
 * polarity) — the exercise is "pick the right whole answer," not "build
 * the sentence word by word," so per-tile content-word counting doesn't
 * apply the way it does to a genuine word-level bank («buenas noches»'s
 * decoys are single words: «buenos», «tardes»).
 *
 * Detection: ANY tile NOT used in `correctOrder` (a true distractor, not
 * a piece of the real answer) whose own word count is at least half the
 * target sentence's word count — i.e. a distractor that is itself "half a
 * sentence or more." A genuine word-level bank's distractors are always
 * short (one word, or a short elided/fixed chunk); a phrase-choice bank's
 * distractors are full alternate clauses by construction.
 */
export function isPhraseChoiceBank(targetSentence, tiles, correctOrder, lang) {
  const targetWordCount = wordsOf(targetSentence, lang).length;
  const usedSet = new Set(correctOrder ?? tiles);
  const threshold = Math.max(2, Math.ceil(targetWordCount / 2));
  return tiles.some((t) => !usedSet.has(t) && wordsOf(t, lang).length >= threshold);
}

// ---- ES/FR closed-class function words (Q3) -----------------------------
// Deliberately small and structural — the ES/FR analogue of Q4's JA
// PARTICLES/LEXICALIZED table, not an attempt at a full function-word
// dictionary. Lowercased; elided forms (j', l', qu', d', n', m', t', s',
// c') are matched as their own tokens only when the elision apostrophe
// makes them a standalone space-delimited word (rare — usually the elided
// form is fused onto the next word as one token, e.g. "j'aime", which this
// table does not need to resolve: a single space-delimited token always
// contributes exactly one "word" to a tile's count regardless of how it's
// classified, so it can never itself create a false 2-content-word flag).
const FUNCTION_WORDS_ES = new Set([
  "el", "la", "los", "las", "lo", "un", "una", "unos", "unas",
  "a", "ante", "bajo", "cabe", "con", "contra", "de", "del", "al",
  "desde", "en", "entre", "hacia", "hasta", "para", "por", "según",
  "sin", "so", "sobre", "tras", "durante", "mediante",
  "yo", "tú", "usted", "él", "ella", "nosotros", "nosotras", "vosotros",
  "vosotras", "ustedes", "ellos", "ellas",
  "me", "te", "se", "nos", "os", "le", "les",
  "mi", "mis", "tu", "tus", "su", "sus", "nuestro", "nuestra", "nuestros",
  "nuestras", "vuestro", "vuestra",
  "y", "e", "o", "u", "ni", "pero", "sino", "que", "si", "porque",
  "aunque", "mientras", "como", "pues",
  "no",
]);

const FUNCTION_WORDS_FR = new Set([
  "le", "la", "les", "l'", "un", "une", "des", "du", "au", "aux",
  "à", "de", "en", "dans", "sur", "sous", "avec", "sans", "pour", "par",
  "chez", "entre", "vers", "depuis", "pendant", "avant", "après",
  "je", "j'", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "m'", "te", "t'", "se", "s'", "lui", "leur", "y",
  "moi", "toi", "ça", "ce", "c'", "cette", "cet", "ces",
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "notre",
  "nos", "votre", "vos", "leurs",
  "et", "ou", "mais", "donc", "or", "ni", "car", "que", "qu'", "si",
  "quand", "comme",
  "ne", "n'", "pas",
  // avoir/être conjugated forms — measured 2026-09-17 (lane A7e): these are
  // ambiguous by surface form alone (full content verb "j'ai un chat" vs.
  // copula "c'est cher" vs. the passé-composé AUXILIARY "je suis allé" /
  // "j'ai mangé", which `fr-authoring-playbook.md` documents as a
  // deliberately CHUNKED construction). Treating them as glue mirrors JA's
  // aspectual-auxiliary rule (いく/くる/しまう after a て-form = function,
  // not content) and was the single largest remaining FR Q3 false-positive
  // class after the number-phrase fix (passé composé + copula "c'est"/
  // "il est" tiles) — the downside (missing a genuine defect where avoir/
  // être IS the tile's only real word) never fires, since a tile needs 2+
  // CONTENT words to flag at all.
  "ai", "as", "a", "avons", "avez", "ont",
  "suis", "es", "est", "sommes", "êtes", "sont",
  "n'y", // "il n'y a" fuses ne+y without a space in the authored tile text
  "quel", "quelle", "quels", "quelles", // interrogative determiner ("quelle heure ?")
]);

const FUNCTION_WORDS = { es: FUNCTION_WORDS_ES, fr: FUNCTION_WORDS_FR };

/**
 * Classify one space-delimited word for ES/FR Q3: "atom" (itself a
 * registered course atom — counts as content but never triggers the
 * multi-content-word flag on its own since it's a single token),
 * "function" (glue, per the table above or Lexique's cgram for FR), or
 * "content" (everything else — the default, matching the JA doctrine
 * that an unrecognized token counts as content, never silently as glue).
 */
export function classifyWord(word, lang, atomSurfaces) {
  const lower = word.toLowerCase();
  // Function-table check FIRST: a word like "un"/"je"/"au" is grammatical
  // glue in THIS tile position regardless of whether the same surface is
  // ALSO separately registered as a course atom elsewhere (numbers "un" =
  // "one", subject pronouns "je"/"tu" taught as standalone vocab atoms in
  // early modules) — checking atom-membership first was measured to
  // misclassify exactly these as "content," which was the dominant false-
  // positive class in the first FR pass (263/451 hits, most of them
  // article/pronoun words that also happen to be atoms — see
  // docs/procedural-qa-2026-09-17.md's French section for the before/after
  // count). "Atom" only matters for words the function table doesn't
  // resolve — it exists so an unusual content word doesn't need to be
  // manually added to the closed-class table to be recognized (it already
  // defaults to "content" either way, so this branch is a documentation
  // aid more than a behavior change now).
  const table = FUNCTION_WORDS[lang];
  if (table?.has(lower)) return "function";
  if (lang === "fr" && lexiqueAvailable() && lexiqueIsFunctionWord(lower)) return "function";
  if (atomSurfaces?.has(word) || atomSurfaces?.has(lower)) return "atom";
  // Capitalized surface = a proper noun (character/place name — "Thomas",
  // "Paris", "Montréal") — comprehension-neutral, the direct ES/FR analogue
  // of `gate.ts`'s curated PROPER_NOUNS allowance for ja/ko. Measured
  // 2026-09-17 (lane A7e): m22's "whose is it" possessive drills tile
  // "le sac de Thomas" as ONE tile — the name competing as a second
  // "content word" alongside the real noun was the second-largest FR Q3
  // false-positive class. Script-level (capitalization), not a curated
  // list, since ES/FR character names aren't centrally registered the way
  // ja/ko's are in `gate.ts`. A tile-INITIAL word is never checked this
  // way — every real tile in this corpus keeps natural mid-sentence casing
  // (lowercase articles/nouns even at tile position 0, confirmed against
  // real content), so this does not need a position guard.
  if (word.length > 1 && /^[A-ZÀ-Þ]/.test(word) && !/^[A-ZÀ-Þ]+$/.test(word)) return "properNoun";
  return "content";
}

/**
 * Content-word count for one tile (ES/FR): split on whitespace, classify
 * each word, count "content" — "atom" words count as content too (they
 * are real vocabulary) but the whole-tile atom escape (checked by the
 * caller BEFORE calling this, against the tile's full joined text) is
 * what actually clears a legitimate multi-word fixed expression; this
 * function only measures "how many independent content words does this
 * tile carry," which is what flags an ACCIDENTAL two-content-word glue.
 */
// A NUMBER + a currency/quantity-unit noun ("quarante euros", "cuarenta
// euros", "trente et un euros") is a pedagogically single price/quantity
// unit, the direct ES/FR analogue of JA's number+counter class ("さんじ"
// 3-o'clock, ruled ONE word in the JA v2 audit — docs/procedural-qa-
// 2026-09-17.md §3). Measured 2026-09-17 (lane A7e): this was the single
// largest false-positive class in the first real FR pass (most of m12/
// m17/m21's price drills) — every price step deliberately tiles a WHOLE
// amount together so the learner discriminates between numbers ("soixante
// euros" vs "quarante euros"), never between an amount and its currency
// noun. `et` ("trente ET un euros") is already in FUNCTION_WORDS_FR/ES
// (conjunction), so a compound cardinal split across several number
// tokens by "et"/"y" still matches this rule word-by-word.
const NUMBER_WORD_RE_FR =
  /^(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|cents|mille)(?:-(?:et-)?(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|cents|mille))*$/i;
const NUMBER_WORD_RE_ES =
  /^(?:un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte|veinti[a-záéíóú]+|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|cientos|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil)$/i;
const UNIT_NOUNS = new Set([
  "euro", "euros", "cent", "cents", "centime", "centimes", "mille",
  "dollar", "dollars", "peso", "pesos",
  // time-of-day unit nouns — the same "número + counter" class as currency
  // (m23's clock-time drills: "trois heures", "à dix heures").
  "heure", "heures", "hora", "horas",
]);

function isNumberOrUnitToken(word, lang) {
  const lower = word.toLowerCase();
  const re = lang === "fr" ? NUMBER_WORD_RE_FR : NUMBER_WORD_RE_ES;
  return re.test(lower) || UNIT_NOUNS.has(lower);
}

/** True if EVERY word in the tile is either function glue or a number/
 *  unit-noun token — the whole tile is a price/quantity phrase, not a
 *  shrapnel candidate, regardless of how many "content" words it has. */
function isNumberPhrase(tile, lang) {
  const words = wordsOf(tile, lang);
  return words.length > 0 && words.every((w) => isNumberOrUnitToken(w, lang) || classifyWord(w, lang, null) === "function");
}

export function contentWordCount(tile, lang, atomSurfaces) {
  if ((lang === "fr" || lang === "es") && isNumberPhrase(tile, lang)) {
    return { contentWords: [], wordCount: wordsOf(tile, lang).length, numberPhrase: true };
  }
  const words = wordsOf(tile, lang);
  const contentWords = [];
  for (const w of words) {
    const cls = classifyWord(w, lang, atomSurfaces);
    if (cls !== "function" && cls !== "properNoun") contentWords.push(w);
  }
  return { contentWords, wordCount: words.length };
}

// ---- KO: Kiwi tag classification (Q3) ------------------------------------
// https://github.com/bab2min/Kiwi/blob/main/docs/KiwiTagSet.md
const KO_CONTENT_TAGS = new Set([
  "NNG", "NNP", "NNB", "NR", "NP", // nouns/pronoun/numeral
  "VV", "VA", "VX", "VCN", // verb, adjective, aux-verb, negative copula
  "MAG", "MAJ", "MM", // adverbs, determiner
  "IC", "XR", // interjection, root
  "SL", "SH", "SN", // foreign/hanja/number literal
]);
const KO_FUNCTION_TAGS = new Set([
  "JKS", "JKC", "JKG", "JKO", "JKB", "JKV", "JKQ", "JX", "JC", // particles
  "EP", "EF", "EC", "ETN", "ETM", // endings
  "VCP", // positive copula 이다 — treated as glue, the KO analogue of JA's です/だ
  "XSN", "XSV", "XSA", "XPN", // affixes
  "SF", "SP", "SS", "SE", "SO", "SW", // symbols/punctuation
]);

/** Count content-tagged morphemes in a KO tile via Kiwi tokenization.
 *  `tagOne` is the caller's ko sidecar `tagOne` (injected, not imported
 *  here, so this file stays sidecar-agnostic / easily unit-testable). */
export function koContentMorphemeCount(tile, tagOne) {
  const tokens = tagOne(tile) ?? [];
  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tag = tokens[i].tag;
    const isContent = KO_CONTENT_TAGS.has(tag);
    const isFunction = KO_FUNCTION_TAGS.has(tag);
    // NNB (dependent/bound noun) directly after NR (a cardinal numeral,
    // "아홉" 9) or MM (a determiner — Korean's special ATTRIBUTIVE numeral
    // forms 한/두/세/네 "one/two/three/four [+counter]", grammatically a
    // determiner tag, not NR, even though semantically still "a number")
    // is a number+COUNTER pair — "아홉 시" (nine o'clock), "한 시" (one
    // o'clock), "네 명" (four people) — the KO analogue of ES/FR's
    // number+unit-noun exclusion (`isNumberPhrase`) and JA's own
    // number+counter class-1 ruling (さんじ "3 o'clock" — one pedagogical
    // word, docs/procedural-qa-2026-09-17.md §3). Measured 2026-09-17
    // (lane A7e): this was the single largest KO Q3 false-positive class.
    if (tag === "NNB" && i > 0 && (tokens[i - 1].tag === "NR" || tokens[i - 1].tag === "MM")) continue;
    if (isContent) count++;
    else if (!isFunction) count++; // unclassified tag = content, never silently glue
  }
  return { count, tokens };
}
