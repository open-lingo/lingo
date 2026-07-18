/**
 * Korean conjugation content — the authored lemma list. Every drilled cell is
 * GENERATED from these lemmas by `conjugationEngine.ts` (jamo composition +
 * irregular-class rules), so authoring a verb is one row here, not ~20
 * hand-typed forms. Coverage spans all major stem classes, verbs AND
 * adjectives (Korean adjectives — descriptive verbs — conjugate on the same
 * machinery).
 *
 * `module.conjugation.tables` (the thin `ConjugationTable[]` slot) is derived
 * from this list via `buildKoConjugationTables()`.
 */
import type { AtomId, ConjugationTable, PartOfSpeech } from "@/shared/language/types";
import { conjugateKo, type KoStemClass, type KoFormKey, type KoPos } from "./conjugationEngine";

export interface KoLemma {
  id: string;
  /** Dictionary form (…다). */
  lemma: string;
  meaning: string;
  pos: KoPos;
  cls: KoStemClass;
  introducedAtModule: number;
}

/**
 * ~65 high-frequency lemmas across every class. Modules are kept low so a
 * typical learner has a non-empty pool; the trainer's learn-ahead raises the
 * pool for tiles the learner hasn't formally reached (mirrors JA).
 */
export const KO_LEMMAS: KoLemma[] = [
  // ── Regular consonant-stem verbs ──
  { id: "meokda", lemma: "먹다", meaning: "to eat", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "ilkda", lemma: "읽다", meaning: "to read", pos: "verb", cls: "regular", introducedAtModule: 3 },
  { id: "anjda", lemma: "앉다", meaning: "to sit", pos: "verb", cls: "regular", introducedAtModule: 4 },
  { id: "batda", lemma: "받다", meaning: "to receive", pos: "verb", cls: "regular", introducedAtModule: 3 },
  { id: "utda", lemma: "웃다", meaning: "to laugh", pos: "verb", cls: "regular", introducedAtModule: 4 },
  { id: "ssitda", lemma: "씻다", meaning: "to wash", pos: "verb", cls: "regular", introducedAtModule: 5 },
  { id: "chatda", lemma: "찾다", meaning: "to find", pos: "verb", cls: "regular", introducedAtModule: 4 },
  { id: "datda", lemma: "닫다", meaning: "to close", pos: "verb", cls: "regular", introducedAtModule: 5 },
  // ── Regular vowel-stem verbs ──
  { id: "gada", lemma: "가다", meaning: "to go", pos: "verb", cls: "regular", introducedAtModule: 1 },
  { id: "oda", lemma: "오다", meaning: "to come", pos: "verb", cls: "regular", introducedAtModule: 1 },
  { id: "boda", lemma: "보다", meaning: "to see", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "juda", lemma: "주다", meaning: "to give", pos: "verb", cls: "regular", introducedAtModule: 3 },
  { id: "masida", lemma: "마시다", meaning: "to drink", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "mannada", lemma: "만나다", meaning: "to meet", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "baeuda", lemma: "배우다", meaning: "to learn", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "sada", lemma: "사다", meaning: "to buy", pos: "verb", cls: "regular", introducedAtModule: 3 },
  { id: "jada", lemma: "자다", meaning: "to sleep", pos: "verb", cls: "regular", introducedAtModule: 2 },
  { id: "gidarida", lemma: "기다리다", meaning: "to wait", pos: "verb", cls: "regular", introducedAtModule: 4 },
  { id: "doeda", lemma: "되다", meaning: "to become", pos: "verb", cls: "regular", introducedAtModule: 5 },

  // ── Regular adjectives ──
  { id: "jota", lemma: "좋다", meaning: "to be good", pos: "adjective", cls: "regular", introducedAtModule: 2 },
  { id: "manta", lemma: "많다", meaning: "to be many", pos: "adjective", cls: "regular", introducedAtModule: 3 },
  { id: "jakda", lemma: "작다", meaning: "to be small", pos: "adjective", cls: "regular", introducedAtModule: 3 },
  { id: "nopda", lemma: "높다", meaning: "to be high", pos: "adjective", cls: "regular", introducedAtModule: 4 },
  { id: "najda", lemma: "낮다", meaning: "to be low", pos: "adjective", cls: "regular", introducedAtModule: 5 },
  { id: "neujda", lemma: "늦다", meaning: "to be late", pos: "adjective", cls: "regular", introducedAtModule: 5 },

  // ── 하다 verbs + adjectives ──
  { id: "hada", lemma: "하다", meaning: "to do", pos: "verb", cls: "hada", introducedAtModule: 1 },
  { id: "gongbuhada", lemma: "공부하다", meaning: "to study", pos: "verb", cls: "hada", introducedAtModule: 2 },
  { id: "joahada", lemma: "좋아하다", meaning: "to like", pos: "verb", cls: "hada", introducedAtModule: 3 },
  { id: "saranghada", lemma: "사랑하다", meaning: "to love", pos: "verb", cls: "hada", introducedAtModule: 4 },
  { id: "ilhada", lemma: "일하다", meaning: "to work", pos: "verb", cls: "hada", introducedAtModule: 3 },
  { id: "malhada", lemma: "말하다", meaning: "to speak", pos: "verb", cls: "hada", introducedAtModule: 4 },
  { id: "sijakhada", lemma: "시작하다", meaning: "to start", pos: "verb", cls: "hada", introducedAtModule: 5 },
  { id: "pigonhada", lemma: "피곤하다", meaning: "to be tired", pos: "adjective", cls: "hada", introducedAtModule: 4 },
  { id: "joyonghada", lemma: "조용하다", meaning: "to be quiet", pos: "adjective", cls: "hada", introducedAtModule: 5 },
  { id: "kkaekkeuthada", lemma: "깨끗하다", meaning: "to be clean", pos: "adjective", cls: "hada", introducedAtModule: 6 },

  // ── ㅂ irregular ──
  { id: "chupda", lemma: "춥다", meaning: "to be cold", pos: "adjective", cls: "p_irr", introducedAtModule: 3 },
  { id: "deopda", lemma: "덥다", meaning: "to be hot", pos: "adjective", cls: "p_irr", introducedAtModule: 3 },
  { id: "dopda", lemma: "돕다", meaning: "to help", pos: "verb", cls: "p_irr", introducedAtModule: 5 },
  { id: "swipda", lemma: "쉽다", meaning: "to be easy", pos: "adjective", cls: "p_irr", introducedAtModule: 4 },
  { id: "eoryeopda", lemma: "어렵다", meaning: "to be difficult", pos: "adjective", cls: "p_irr", introducedAtModule: 4 },
  { id: "maepda", lemma: "맵다", meaning: "to be spicy", pos: "adjective", cls: "p_irr", introducedAtModule: 4 },
  { id: "gakkapda", lemma: "가깝다", meaning: "to be near", pos: "adjective", cls: "p_irr", introducedAtModule: 5 },
  { id: "areumdapda", lemma: "아름답다", meaning: "to be beautiful", pos: "adjective", cls: "p_irr", introducedAtModule: 6 },
  { id: "gwiyeopda", lemma: "귀엽다", meaning: "to be cute", pos: "adjective", cls: "p_irr", introducedAtModule: 5 },

  // ── ㄷ irregular ──
  { id: "deutda", lemma: "듣다", meaning: "to listen", pos: "verb", cls: "t_irr", introducedAtModule: 3 },
  { id: "geotda", lemma: "걷다", meaning: "to walk", pos: "verb", cls: "t_irr", introducedAtModule: 4 },
  { id: "mutda", lemma: "묻다", meaning: "to ask", pos: "verb", cls: "t_irr", introducedAtModule: 6 },

  // ── ㅅ irregular ──
  { id: "jitda", lemma: "짓다", meaning: "to build", pos: "verb", cls: "s_irr", introducedAtModule: 6 },
  { id: "natda", lemma: "낫다", meaning: "to get better", pos: "verb", cls: "s_irr", introducedAtModule: 7 },

  // ── 르 irregular ──
  { id: "moreuda", lemma: "모르다", meaning: "to not know", pos: "verb", cls: "reu_irr", introducedAtModule: 3 },
  { id: "bureuda", lemma: "부르다", meaning: "to call / sing", pos: "verb", cls: "reu_irr", introducedAtModule: 5 },
  { id: "ppareuda", lemma: "빠르다", meaning: "to be fast", pos: "adjective", cls: "reu_irr", introducedAtModule: 4 },
  { id: "dareuda", lemma: "다르다", meaning: "to be different", pos: "adjective", cls: "reu_irr", introducedAtModule: 4 },
  { id: "goreuda", lemma: "고르다", meaning: "to choose", pos: "verb", cls: "reu_irr", introducedAtModule: 6 },

  // ── ㅎ irregular (adjectives) ──
  { id: "geureota", lemma: "그렇다", meaning: "to be so", pos: "adjective", cls: "h_irr", introducedAtModule: 5 },
  { id: "eotteota", lemma: "어떻다", meaning: "to be how / what-like", pos: "adjective", cls: "h_irr", introducedAtModule: 4 },
  { id: "ppalgata", lemma: "빨갛다", meaning: "to be red", pos: "adjective", cls: "h_irr", introducedAtModule: 6 },
  { id: "parata", lemma: "파랗다", meaning: "to be blue", pos: "adjective", cls: "h_irr", introducedAtModule: 6 },
  { id: "hayata", lemma: "하얗다", meaning: "to be white", pos: "adjective", cls: "h_irr", introducedAtModule: 6 },

  // ── ㄹ-stem ──
  { id: "salda", lemma: "살다", meaning: "to live", pos: "verb", cls: "l_stem", introducedAtModule: 3 },
  { id: "alda", lemma: "알다", meaning: "to know", pos: "verb", cls: "l_stem", introducedAtModule: 2 },
  { id: "nolda", lemma: "놀다", meaning: "to play", pos: "verb", cls: "l_stem", introducedAtModule: 4 },
  { id: "mandeulda", lemma: "만들다", meaning: "to make", pos: "verb", cls: "l_stem", introducedAtModule: 4 },
  { id: "palda", lemma: "팔다", meaning: "to sell", pos: "verb", cls: "l_stem", introducedAtModule: 5 },
  { id: "meolda", lemma: "멀다", meaning: "to be far", pos: "adjective", cls: "l_stem", introducedAtModule: 5 },
  { id: "gilda", lemma: "길다", meaning: "to be long", pos: "adjective", cls: "l_stem", introducedAtModule: 4 },

  // ── 으 / ㅡ-deletion ──
  { id: "sseuda", lemma: "쓰다", meaning: "to write / use", pos: "verb", cls: "eu_irr", introducedAtModule: 3 },
  { id: "keuda", lemma: "크다", meaning: "to be big", pos: "adjective", cls: "eu_irr", introducedAtModule: 2 },
  { id: "kkeuda", lemma: "끄다", meaning: "to turn off", pos: "verb", cls: "eu_irr", introducedAtModule: 5 },
  { id: "bappeuda", lemma: "바쁘다", meaning: "to be busy", pos: "adjective", cls: "eu_irr", introducedAtModule: 3 },
  { id: "apeuda", lemma: "아프다", meaning: "to be sick", pos: "adjective", cls: "eu_irr", introducedAtModule: 3 },
  { id: "yeppeuda", lemma: "예쁘다", meaning: "to be pretty", pos: "adjective", cls: "eu_irr", introducedAtModule: 3 },
  { id: "gippeuda", lemma: "기쁘다", meaning: "to be glad", pos: "adjective", cls: "eu_irr", introducedAtModule: 6 },
  { id: "gopeuda", lemma: "고프다", meaning: "to be hungry", pos: "adjective", cls: "eu_irr", introducedAtModule: 4 },
];

/** Verb-only forms (progressive/plain/command/want don't apply to descriptive
 *  verbs — adjectives). */
const VERB_ONLY_FORMS: KoFormKey[] = [
  "progressive.polite",
  "progressive.casual",
  "progressive.formal",
  "present.plain",
  "prohibition",
  "honorific.command",
  "desiderative",
];

/** All form keys the module exposes in `conjugation.tables`. */
export const KO_ALL_FORMS: KoFormKey[] = [
  "dictionary",
  "present.polite",
  "present.casual",
  "present.formal",
  "past.polite",
  "past.casual",
  "past.formal",
  "future.polite",
  "future.casual",
  "future.formal",
  "progressive.polite",
  "progressive.casual",
  "progressive.formal",
  "neg.short.present.polite",
  "neg.short.present.casual",
  "neg.short.past.polite",
  "neg.long.present.polite",
  "neg.long.present.formal",
  "neg.long.past.polite",
  "present.plain",
  "adverbial",
  "prohibition",
  "honorific.command",
  "desiderative",
  "connective.and",
  "connective.but",
  "connective.so",
  "conditional",
];

export function getLemmasUpToModule(maxModule: number): KoLemma[] {
  return KO_LEMMAS.filter((l) => l.introducedAtModule <= maxModule);
}

/** Build the thin `ConjugationTable[]` for the module slot (generated forms). */
export function buildKoConjugationTables(): ConjugationTable[] {
  return KO_LEMMAS.map((l) => {
    const forms: Record<string, string> = {};
    for (const form of KO_ALL_FORMS) {
      if (l.pos === "adjective" && VERB_ONLY_FORMS.includes(form)) continue;
      forms[form] = conjugateKo(l.lemma, l.cls, form);
    }
    return {
      lemmaAtomId: `ko:${l.lemma}` as AtomId,
      partOfSpeech: (l.pos === "verb" ? "verb" : "adjective") as PartOfSpeech,
      forms,
    };
  });
}
