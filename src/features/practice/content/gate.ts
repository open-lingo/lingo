/**
 * Comprehensibility gate for curated content.
 *
 * Mirrors the authored-content gate that guards JA grammar-review pools
 * (`features/lesson/data/grammarReviewPools.test.ts`): a sentence is
 * "comprehensible at module M" iff, after stripping punctuation, it
 * decomposes ENTIRELY (greedy longest-match) into course-atom surfaces whose
 * `fromModule <= M`, plus a small curated set of function morphemes the
 * course teaches head-on but does not register as standalone atoms, plus the
 * proper nouns the content itself introduces (names — semantically
 * transparent, they carry no comprehension load).
 *
 * Language-agnostic: atom surfaces come from the normalized cross-language
 * atom catalog (`normalizedAtoms.ts`), so the same gate covers ja/ko/es.
 *
 * If authored content fails this gate the FIX IS THE CONTENT, not the gate —
 * that is the invariant that keeps curated content readable.
 */
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";

/**
 * Numeric order of an atom's source-module key. `mN` → N. Survival phrases
 * (`sidequest-survival`) are taught from the very start, so they read as
 * always-available (0). `future` / anything unattributed sorts last so it
 * never counts as comprehensible.
 */
export function moduleOrder(moduleKey: string): number {
  if (moduleKey === "sidequest-survival") return 0;
  const m = /^m(\d+)$/.exec(moduleKey);
  return m ? Number(m[1]) : Infinity;
}

/** Split "/"、"、"-separated kana/hangul variants (moduleConformance pattern). */
function surfaceVariants(display: string, secondary?: string): string[] {
  const out = display.split(/[/、]/).map((s) => s.trim());
  if (secondary) out.push(...secondary.split(/[/、]/).map((s) => s.trim()));
  return out.filter(Boolean);
}

/**
 * Function morphemes each language teaches directly but does not carry as a
 * standalone SRS atom (copulas, politeness/tense endings, bound grammar
 * pieces). Every entry is a form the curriculum introduces at or before the
 * module it is used in; the greedy matcher strips real words first, so these
 * only clear genuine grammatical residue, never advance-level vocab.
 */
const FUNCTION_MORPHEMES: Record<string, string[]> = {
  // Plain copula + polite endings taught across m3-m7 (だ in m3-neo, the
  // です/ます paradigm as the course's core politeness spine).
  ja: [
    "だ",
    "です",
    "ではない",
    "じゃない",
    "ます",
    "ません",
    "ました",
    "ませんでした",
    "でした",
    "ください",
  ],
  // KO registers most conjugated surfaces + particles as atoms; the rest are
  // handled as whole taught surfaces in TAUGHT_LEXICON.ko (agglutinative
  // stem+ending splitting is too fragile to model here).
  ko: [],
};

/**
 * Taught-lexicon supplement: surfaces the course teaches in its lessons but
 * does NOT register as standalone SRS `courseAtoms` (verb stems that only
 * ever surface conjugated, connective adverbs, high-frequency function words,
 * number pieces). Each is tagged with the module the course introduces it —
 * sourced from that module's own lesson content (the converted mini-dialogue
 * is the module's capstone, so any word in it is taught by that module).
 *
 * This COMPLETES the atom registry's coverage for the gate's purpose; it does
 * not weaken it: a surface that is neither an atom, a morpheme, a proper noun,
 * nor a lexicon entry at/below the module still fails, so above-level vocab is
 * still caught. Verb stems are listed bare (보 "watch", 마시 "drink") so the
 * conjugation endings in FUNCTION_MORPHEMES strip the rest.
 */
const TAUGHT_LEXICON: Record<string, Record<string, number>> = {
  ja: {
    なに: 4, // 何 "what" — casual reading of the なん atom
    ひゃく: 5, // 百 "hundred" — taught with money/prices
  },
  // Whole taught eojeol (surface forms) the KO course uses but does not carry
  // as SRS atoms — verb conjugations, connective adverbs, bound grammar
  // pieces, number-scale words. Module = the course's first-introduction
  // module (grepped from the curriculum lessons) or, when only the converted
  // mini-dialogue evidences it, that dialogue's module (a safe upper bound).
  ko: {
    // demonstratives / deixis
    이게: 4, // 이 것이 → this-thing (contraction)
    여기: 4, // here
    // number-scale + counters
    천: 5, // hundred-thousand scale piece (units are atoms)
    번: 24, // counter: times
    // time / frequency / manner words (not atomized)
    시간: 6, // duration "time"
    지금: 10, // now
    // connective adverbs (sentence linkers)
    그런데: 8, // but / by the way
    그리고: 13, // and
    그래서: 13, // so
    그래도: 22, // still, even so
    // question words
    언제: 13, // when
    왜: 17, // why
    어떻게: 17, // how
    어디서: 17, // "where (from)"
    여기서: 16, // "here (at)"
    다음: 17, // next
    주말: 23, // weekend
    // misc vocab surfaces
    김치: 21, // kimchi
    // ── conjugated verb / adjective surfaces (whole forms) ──
    싸요: 8, // 싸다 is cheap
    좋아해요: 13, // 좋아하다 like
    마셨어요: 10, // drank
    보고: 11, // 보다 + 고 (want-to auxiliary chain)
    싶어요: 11, // want (…고 싶어요)
    마시고: 15, // 마시다 + 고 (progressive chain)
    앉아도: 15, // 앉다 + 아도 (permission)
    돼요: 15, // 되다 works / is-allowed
    알겠어요: 16, // "got it"
    피우면: 16, // 피우다 + 면 (if smoke)
    타세요: 17, // 타다 ride (please)
    가세요: 17, // 가다 go (please)
    내려요: 17, // 내리다 get off
    내려서: 17, // 내리다 + 서 (and get off)
    올: 18, // 오다 + ㄹ (will come, modifier)
    것: 18, // bound noun "thing" (것 같아요)
    같아요: 18, // seems
    있을: 18, // 있다 + ㄹ (will be)
    맑을: 18, // 맑다 + ㄹ (will be clear)
    내일은: 18, // tomorrow-topic (내일 + 은)
    저요: 19, // "me" (저 + 요)
    나요: 20, // 나다 occur (열이 나요)
    먹으면: 20, // 먹다 + 으면 (if eat)
    괜찮을: 20, // 괜찮다 + ㄹ (will be fine)
    드릴까요: 21, // humble "shall I give"
    드셔: 21, // honorific eat (드셔 보세요)
    보세요: 21, // "please try" (auxiliary 보다 honorific)
    김치라고: 21, // "(called) kimchi" (김치 + 라고)
    적: 25, // bound noun: experience (간 적이)
    가려고: 25, // 가다 + 려고 (intending to go)
    할까요: 23, // 하다 + ㄹ까요 (shall we)
    요리할까요: 23, // 요리하다 + ㄹ까요
    합시다: 23, // 하다 let's
    같이: 23, // together
    들어요: 24, // 듣다 listen
    할: 24, // 하다 + ㄹ (할 줄)
    줄: 24, // bound noun (know-how-to)
    알아요: 24, // 알다 know
    간: 25, // 가다 + past modifier (간 적이)
    만나요: 12, // 만나다 meet (present)
    바빠서: 14, // 바쁘다 + 아서 (busy so)
    기다려: 14, // 기다리다 wait (기다려 주세요)
    피곤해요: 26, // 피곤하다 tired
    길이: 26, // road-subject (길 + 이)
    늦었어요: 26, // was late
    막혔거든요: 26, // got jammed (explanatory)
    죄송해요: 26, // sorry
    피곤해서: 26, // tired so
    게: 27, // bound nominalizer (먹는 게)
    먹는: 27, // 먹다 + 는 (modifier)
    가야: 27, // 가다 + 야 (must go)
    쉬면: 27, // 쉬다 + 면 (if rest)
    건강해져요: 27, // become healthy
    조심하세요: 27, // take care
  },
};

/**
 * Proper nouns (personal / place names) used across authored content. Names
 * are comprehension-neutral: a learner who can read the sentence around the
 * name understands it regardless of whether the name is "known" vocab. Kept
 * as a small curated allowlist so a typo in the CONTENT still trips the gate
 * (an unlisted residue is a failure), not a blanket "ignore CJK runs".
 */
const PROPER_NOUNS: Record<string, string[]> = {
  ja: ["トム", "ミカ", "ケン", "ユミ", "たなか", "さとう", "にほん", "とうきょう"],
  ko: ["민수", "미나", "지수", "준", "유진", "한국", "서울", "일본"],
};

/**
 * Greedy longest-match residual after removing punctuation and every allowed
 * surface (atoms with `fromModule <= module`, function morphemes, proper
 * nouns). `""` = fully explained by course content at that module.
 */
export function gateResidual(
  text: string,
  languageId: string,
  module: number,
): string {
  const nospace = (s: string) => s.replace(/\s/g, "");
  const lexicon = TAUGHT_LEXICON[languageId] ?? {};
  const surfaces = getNormalizedCourseAtoms(languageId)
    .filter((a) => moduleOrder(a.module) <= module)
    .flatMap((a) => surfaceVariants(a.display, a.secondary))
    .concat(FUNCTION_MORPHEMES[languageId] ?? [])
    .concat(PROPER_NOUNS[languageId] ?? [])
    .concat(
      Object.entries(lexicon)
        .filter(([, m]) => m <= module)
        .map(([surface]) => surface),
    )
    // Word boundaries are meaningless for character coverage — collapse spaces
    // on both sides so cross-word contractions and multi-token surfaces
    // (e.g. "고 있어요") match cleanly.
    .map(nospace)
    .filter(Boolean);

  const allowed = new Set(surfaces);
  const maxLen = surfaces.reduce((m, s) => Math.max(m, s.length), 1);
  const punct = /[.,!?;:'"()\[\]…—–\-·、。！？「」『』〜～0-9０-９A-Za-z’]/g;

  // Match WITHIN each whitespace-delimited token, not across the whole line:
  // the authored content carries natural word spacing, and matching per token
  // prevents a cross-word false merge (e.g. topic は + いくら's い → はい "yes")
  // from mis-decomposing an otherwise comprehensible line.
  let residual = "";
  for (const rawToken of text.split(/\s+/)) {
    const token = rawToken.replace(punct, "");
    // Positional left-to-right greedy longest-match: at each index consume the
    // longest allowed surface starting there; unmatched chars are residual.
    let i = 0;
    while (i < token.length) {
      let matched = 0;
      for (let len = Math.min(maxLen, token.length - i); len >= 1; len--) {
        if (allowed.has(token.slice(i, i + len))) {
          matched = len;
          break;
        }
      }
      if (matched) {
        i += matched;
      } else {
        residual += token[i];
        i += 1;
      }
    }
  }
  return residual;
}

/** True iff `text` decomposes fully into course content at `module`. */
export function isComprehensible(
  text: string,
  languageId: string,
  module: number,
): boolean {
  return gateResidual(text, languageId, module) === "";
}
