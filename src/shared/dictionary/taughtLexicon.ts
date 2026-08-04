/**
 * Dictionary entries for the taught-lexicon surfaces.
 *
 * `TAUGHT_LEXICON` (in the comprehensibility gate) lists the whole surfaces the
 * course teaches in its lessons but does NOT register as standalone SRS atoms:
 * conjugated verb and adjective forms, bound nouns, particle-fused words,
 * connective adverbs. The gate accepts them, so authored content uses them
 * freely — but the dictionary never carried them, and `TappableText` tokenizes
 * by longest match over DICTIONARY surfaces. A surface the dictionary lacks is
 * shredded into its pieces: tapping `나요` in `열이 나요` ("has a fever") split
 * it into `나` ("I") and `요`, so the learner was shown two wrong answers for a
 * word the course had taught them.
 *
 * Same class as the `열` homograph bug: content the learner is expected to read
 * but cannot look up. The fix is the same shape too — these become real entries
 * that flow through `lookupWordSenses`, so an inflection that shares a surface
 * with an existing word ADDS a sense rather than replacing one (`보고` is
 * "report" in the frequency list and "seeing" from 보다; both are reachable).
 *
 * The surfaces and their modules come from `TAUGHT_LEXICON` itself — this file
 * only supplies the English each one needs to be a dictionary entry. It cannot
 * widen or narrow the gate: nothing here feeds `gateResidual`.
 *
 * Inflected surfaces name their dictionary form ("from 나다"), so a learner who
 * taps a conjugated word also learns the form they will meet in the vocabulary
 * list. Only surfaces the gate lists are here; the fix is data, not matching.
 */
import type { PartOfSpeech } from "@/shared/language/types";
import { TAUGHT_LEXICON } from "@/features/practice/content/gate";

interface TaughtGloss {
  /** Short English meaning. No parentheses — `base` supplies the only one. */
  gloss: string;
  pos: PartOfSpeech;
  /** Dictionary form, when the surface is an inflection or a fused form. */
  base?: string;
  /** Reading override; omitted surfaces derive one from the language module. */
  reading?: string;
}

/**
 * One gloss per taught-lexicon surface. Keyed exactly as `TAUGHT_LEXICON` is —
 * a surface with no gloss here simply stays unlookupable (the status quo), and
 * `taughtLexicon.test.ts` asserts the table is complete so that never happens
 * silently.
 */
const TAUGHT_GLOSSES: Record<string, Record<string, TaughtGloss>> = {
  ja: {
    なに: { gloss: "what", pos: "pronoun", reading: "nani" },
    ひゃく: { gloss: "hundred", pos: "number", reading: "hyaku" },
  },
  ko: {
    // ── demonstratives / deixis ──
    이게: { gloss: "this one", pos: "pronoun", base: "이것" },
    여기: { gloss: "here", pos: "pronoun" },
    // ── number scale + counters ──
    천: { gloss: "thousand", pos: "number" },
    번: { gloss: "counter: times", pos: "counter" },
    // ── time / frequency / manner ──
    시간: { gloss: "time / hour", pos: "noun" },
    지금: { gloss: "now", pos: "adverb" },
    // ── connective adverbs ──
    그런데: { gloss: "but / by the way", pos: "conjunction" },
    그리고: { gloss: "and", pos: "conjunction" },
    그래서: { gloss: "so", pos: "conjunction" },
    그래도: { gloss: "still / even so", pos: "conjunction" },
    // ── question words ──
    언제: { gloss: "when", pos: "adverb" },
    왜: { gloss: "why", pos: "adverb" },
    어떻게: { gloss: "how, in what way", pos: "adverb" },
    어디서: { gloss: "where at, from where", pos: "adverb", base: "어디" },
    여기서: { gloss: "here at, from here", pos: "adverb", base: "여기" },
    다음: { gloss: "next", pos: "noun" },
    주말: { gloss: "weekend", pos: "noun" },
    // ── misc vocab surfaces ──
    김치: { gloss: "kimchi", pos: "noun" },
    // ── conjugated verb / adjective surfaces ──
    싸요: { gloss: "is cheap", pos: "adjective", base: "싸다" },
    좋아해요: { gloss: "likes", pos: "verb", base: "좋아하다" },
    마셨어요: { gloss: "drank", pos: "verb", base: "마시다" },
    보고: { gloss: "seeing, watching", pos: "verb", base: "보다" },
    싶어요: { gloss: "want to", pos: "verb", base: "싶다" },
    마시고: { gloss: "drinking", pos: "verb", base: "마시다" },
    앉아도: { gloss: "even if one sits", pos: "verb", base: "앉다" },
    돼요: { gloss: "is all right, works out", pos: "verb", base: "되다" },
    알겠어요: { gloss: "I understand, got it", pos: "verb", base: "알다" },
    피우면: { gloss: "if one smokes", pos: "verb", base: "피우다" },
    타세요: { gloss: "please get on, please ride", pos: "verb", base: "타다" },
    가세요: { gloss: "please go", pos: "verb", base: "가다" },
    내려요: { gloss: "gets off, goes down", pos: "verb", base: "내리다" },
    내려서: { gloss: "getting off and then", pos: "verb", base: "내리다" },
    올: { gloss: "coming, that will come", pos: "verb", base: "오다" },
    것: { gloss: "thing", pos: "noun" },
    같아요: { gloss: "seems, looks like", pos: "adjective", base: "같다" },
    있을: { gloss: "that will be, that will exist", pos: "verb", base: "있다" },
    맑을: { gloss: "that will be clear", pos: "adjective", base: "맑다" },
    내일은: { gloss: "as for tomorrow", pos: "noun", base: "내일" },
    저요: { gloss: "me, I do", pos: "pronoun", base: "저" },
    나요: { gloss: "occurs, breaks out", pos: "verb", base: "나다" },
    먹으면: { gloss: "if one eats", pos: "verb", base: "먹다" },
    괜찮을: { gloss: "that will be all right", pos: "adjective", base: "괜찮다" },
    드릴까요: { gloss: "shall I give you", pos: "verb", base: "드리다" },
    드셔: { gloss: "eats, has — honorific", pos: "verb", base: "드시다" },
    보세요: { gloss: "please try, please look", pos: "verb", base: "보다" },
    김치라고: { gloss: "called kimchi", pos: "noun", base: "김치" },
    적: { gloss: "time / occasion", pos: "noun" },
    가려고: { gloss: "intending to go", pos: "verb", base: "가다" },
    할까요: { gloss: "shall we do", pos: "verb", base: "하다" },
    요리할까요: { gloss: "shall we cook", pos: "verb", base: "요리하다" },
    합시다: { gloss: "let us do", pos: "verb", base: "하다" },
    같이: { gloss: "together", pos: "adverb" },
    들어요: { gloss: "listens, hears", pos: "verb", base: "듣다" },
    할: { gloss: "that will do, to do", pos: "verb", base: "하다" },
    줄: { gloss: "way / how", pos: "noun" },
    알아요: { gloss: "knows", pos: "verb", base: "알다" },
    간: { gloss: "went, that went", pos: "verb", base: "가다" },
    만나요: { gloss: "meets, meet", pos: "verb", base: "만나다" },
    바빠서: { gloss: "because one is busy", pos: "adjective", base: "바쁘다" },
    기다려: { gloss: "wait", pos: "verb", base: "기다리다" },
    피곤해요: { gloss: "is tired", pos: "adjective", base: "피곤하다" },
    길이: { gloss: "the road", pos: "noun", base: "길" },
    늦었어요: { gloss: "was late", pos: "verb", base: "늦다" },
    막혔거든요: { gloss: "it was blocked, it got jammed", pos: "verb", base: "막히다" },
    죄송해요: { gloss: "I am sorry", pos: "adjective", base: "죄송하다" },
    피곤해서: { gloss: "because one is tired", pos: "adjective", base: "피곤하다" },
    게: { gloss: "the thing that, the act of", pos: "noun", base: "것" },
    먹는: { gloss: "eating, that eats", pos: "verb", base: "먹다" },
    가야: { gloss: "must go, has to go", pos: "verb", base: "가다" },
    쉬면: { gloss: "if one rests", pos: "verb", base: "쉬다" },
    건강해져요: { gloss: "becomes healthy", pos: "verb", base: "건강해지다" },
    조심하세요: { gloss: "please be careful", pos: "verb", base: "조심하다" },
  },
};

/** A dictionary-shaped seed derived from one taught-lexicon surface. */
export interface TaughtLexiconSeed {
  /** Canonical id — `lex-` namespaced so it can never shadow an atom id. */
  id: string;
  surface: string;
  meaningEn: string;
  pos: PartOfSpeech;
  reading?: string;
  /** Content module key (`m20`), straight from `TAUGHT_LEXICON`. */
  module: string;
}

/**
 * Seeds for a language, in `TAUGHT_LEXICON` order. Surfaces with no authored
 * gloss are skipped rather than guessed — an unglossed entry would answer a tap
 * with nothing useful, which is no better than the shredding it replaces.
 */
export function getTaughtLexiconSeeds(languageId: string): TaughtLexiconSeed[] {
  const surfaces = TAUGHT_LEXICON[languageId];
  if (!surfaces) return [];
  const glosses = TAUGHT_GLOSSES[languageId] ?? {};
  const seeds: TaughtLexiconSeed[] = [];
  for (const [surface, module] of Object.entries(surfaces)) {
    const gloss = glosses[surface];
    if (!gloss) continue;
    seeds.push({
      id: `${languageId}:lex-${surface}`,
      surface,
      meaningEn: gloss.base ? `${gloss.gloss} (from ${gloss.base})` : gloss.gloss,
      pos: gloss.pos,
      reading: gloss.reading,
      module: `m${module}`,
    });
  }
  return seeds;
}

/** Test hook — the surfaces this file is expected to gloss. */
export function taughtLexiconSurfaces(languageId: string): string[] {
  return Object.keys(TAUGHT_LEXICON[languageId] ?? {});
}
