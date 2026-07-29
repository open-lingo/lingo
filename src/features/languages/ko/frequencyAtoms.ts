/**
 * Korean frequency ("optional") vocabulary — SEED sample.
 *
 * ⚠️ SEED, not the full list. This is a curated ~110-word starter so the
 * frequency-vocab feature works end-to-end for KO today. The full ~6k list
 * comes from the 국립국어원 open-government data (KOGL Type 1 — commercial OK,
 * attribution "출처: 국립국어원", no share-alike; see
 * docs/ko-6k-vocab-sourcing-2026-07-24.md). Do NOT bundle the CC-BY-SA GitHub
 * lists — share-alike poisons a proprietary dataset.
 *
 * To drop in the full data later:
 *   1. Download the 국립국어원 「현대 국어 사용 빈도 조사」(freq counts) and/or
 *      「한국어 학습용 어휘 목록」(graded learner list) from korean.go.kr.
 *   2. Run:  node scripts/ingest-ko-frequency.mjs <file.tsv> > /tmp/ko-freq.ts
 *   3. Replace the seed array below with the emitted `KO_FREQUENCY_ATOMS`.
 * The ingest script assigns `frequencyRank` from the source order and bakes
 * `unlockModule` via the same `frequencyRankToModule`, so gating stays identical.
 *
 * Rank here is the array index (rough common-word ordering). Conjugation links
 * are attached only where the surface is a classed lemma in `KO_LEMMAS`, so the
 * engine-join test can conjugate them.
 */
import type { KoConjugationLink } from "./courseAtoms";
import {
  frequencyRankToModule,
  type FrequencyAtom,
} from "../frequencyTypes";
import type { PartOfSpeech } from "@/shared/language/types";

/** KO has 27 content modules — its true upper unlock bound. */
export const KO_FREQ_LAST_MODULE = 27;

type Seed = {
  surface: string;
  reading: string;
  meaningEn: string;
  pos: PartOfSpeech;
  conjugation?: KoConjugationLink;
};

/**
 * Common-word seed, in rough frequency order (drives `frequencyRank`).
 * Conjugation links reference `KO_LEMMAS` ids (verified to conjugate).
 */
const KO_FREQUENCY_SEED: ReadonlyArray<Seed> = [
  // ── core pronouns / references ──
  { surface: "나", reading: "na", meaningEn: "I / me", pos: "pronoun" },
  { surface: "너", reading: "neo", meaningEn: "you", pos: "pronoun" },
  { surface: "우리", reading: "uri", meaningEn: "we / us", pos: "pronoun" },
  { surface: "이것", reading: "igeot", meaningEn: "this (thing)", pos: "pronoun" },
  { surface: "그것", reading: "geugeot", meaningEn: "that (thing)", pos: "pronoun" },
  { surface: "여기", reading: "yeogi", meaningEn: "here", pos: "pronoun" },
  { surface: "거기", reading: "geogi", meaningEn: "there", pos: "pronoun" },
  { surface: "누구", reading: "nugu", meaningEn: "who", pos: "pronoun" },
  { surface: "무엇", reading: "mueot", meaningEn: "what", pos: "pronoun" },
  { surface: "언제", reading: "eonje", meaningEn: "when", pos: "adverb" },

  // ── high-frequency nouns ──
  { surface: "사람", reading: "saram", meaningEn: "person", pos: "noun" },
  { surface: "때", reading: "ttae", meaningEn: "time / moment", pos: "noun" },
  { surface: "시간", reading: "sigan", meaningEn: "time / hour", pos: "noun" },
  { surface: "날", reading: "nal", meaningEn: "day", pos: "noun" },
  { surface: "년", reading: "nyeon", meaningEn: "year", pos: "noun" },
  { surface: "말", reading: "mal", meaningEn: "words / speech", pos: "noun" },
  { surface: "일", reading: "il", meaningEn: "work / affair", pos: "noun" },
  { surface: "집", reading: "jip", meaningEn: "house / home", pos: "noun" },
  { surface: "물", reading: "mul", meaningEn: "water", pos: "noun" },
  { surface: "밥", reading: "bap", meaningEn: "rice / meal", pos: "noun" },
  { surface: "손", reading: "son", meaningEn: "hand", pos: "noun" },
  { surface: "눈", reading: "nun", meaningEn: "eye / snow", pos: "noun" },
  { surface: "몸", reading: "mom", meaningEn: "body", pos: "noun" },
  { surface: "마음", reading: "maeum", meaningEn: "heart / mind", pos: "noun" },
  { surface: "생각", reading: "saenggak", meaningEn: "thought", pos: "noun" },
  { surface: "문제", reading: "munje", meaningEn: "problem", pos: "noun" },
  { surface: "친구", reading: "chingu", meaningEn: "friend", pos: "noun" },
  { surface: "학교", reading: "hakgyo", meaningEn: "school", pos: "noun" },
  { surface: "선생님", reading: "seonsaengnim", meaningEn: "teacher", pos: "noun" },
  { surface: "학생", reading: "haksaeng", meaningEn: "student", pos: "noun" },
  { surface: "회사", reading: "hoesa", meaningEn: "company", pos: "noun" },
  { surface: "나라", reading: "nara", meaningEn: "country", pos: "noun" },
  { surface: "세상", reading: "sesang", meaningEn: "world", pos: "noun" },
  { surface: "돈", reading: "don", meaningEn: "money", pos: "noun" },
  { surface: "이름", reading: "ireum", meaningEn: "name", pos: "noun" },
  { surface: "책", reading: "chaek", meaningEn: "book", pos: "noun" },
  { surface: "차", reading: "cha", meaningEn: "car / tea", pos: "noun" },
  { surface: "길", reading: "gil", meaningEn: "road / way", pos: "noun" },
  { surface: "방", reading: "bang", meaningEn: "room", pos: "noun" },
  { surface: "문", reading: "mun", meaningEn: "door", pos: "noun" },
  { surface: "옷", reading: "ot", meaningEn: "clothes", pos: "noun" },
  { surface: "음식", reading: "eumsik", meaningEn: "food", pos: "noun" },
  { surface: "커피", reading: "keopi", meaningEn: "coffee", pos: "noun" },
  { surface: "가족", reading: "gajok", meaningEn: "family", pos: "noun" },
  { surface: "아이", reading: "ai", meaningEn: "child", pos: "noun" },
  { surface: "여자", reading: "yeoja", meaningEn: "woman", pos: "noun" },
  { surface: "남자", reading: "namja", meaningEn: "man", pos: "noun" },
  { surface: "얼굴", reading: "eolgul", meaningEn: "face", pos: "noun" },
  { surface: "아침", reading: "achim", meaningEn: "morning", pos: "noun" },
  { surface: "저녁", reading: "jeonyeok", meaningEn: "evening", pos: "noun" },
  { surface: "오늘", reading: "oneul", meaningEn: "today", pos: "noun" },
  { surface: "내일", reading: "naeil", meaningEn: "tomorrow", pos: "noun" },
  { surface: "어제", reading: "eoje", meaningEn: "yesterday", pos: "noun" },
  { surface: "지금", reading: "jigeum", meaningEn: "now", pos: "adverb" },

  // ── common verbs (…다) ──
  { surface: "가다", reading: "gada", meaningEn: "to go", pos: "verb", conjugation: { class: "regular", lemmaId: "gada" } },
  { surface: "오다", reading: "oda", meaningEn: "to come", pos: "verb", conjugation: { class: "regular", lemmaId: "oda" } },
  { surface: "보다", reading: "boda", meaningEn: "to see / watch", pos: "verb", conjugation: { class: "regular", lemmaId: "boda" } },
  { surface: "먹다", reading: "meokda", meaningEn: "to eat", pos: "verb", conjugation: { class: "regular", lemmaId: "meokda" } },
  { surface: "마시다", reading: "masida", meaningEn: "to drink", pos: "verb", conjugation: { class: "regular", lemmaId: "masida" } },
  { surface: "자다", reading: "jada", meaningEn: "to sleep", pos: "verb", conjugation: { class: "regular", lemmaId: "jada" } },
  { surface: "사다", reading: "sada", meaningEn: "to buy", pos: "verb", conjugation: { class: "regular", lemmaId: "sada" } },
  { surface: "주다", reading: "juda", meaningEn: "to give", pos: "verb", conjugation: { class: "regular", lemmaId: "juda" } },
  { surface: "읽다", reading: "ilkda", meaningEn: "to read", pos: "verb", conjugation: { class: "regular", lemmaId: "ilkda" } },
  { surface: "만나다", reading: "mannada", meaningEn: "to meet", pos: "verb", conjugation: { class: "regular", lemmaId: "mannada" } },
  { surface: "배우다", reading: "baeuda", meaningEn: "to learn", pos: "verb", conjugation: { class: "regular", lemmaId: "baeuda" } },
  { surface: "하다", reading: "hada", meaningEn: "to do", pos: "verb", conjugation: { class: "hada", lemmaId: "hada" } },
  { surface: "공부하다", reading: "gongbuhada", meaningEn: "to study", pos: "verb", conjugation: { class: "hada", lemmaId: "gongbuhada" } },
  { surface: "좋아하다", reading: "joahada", meaningEn: "to like", pos: "verb", conjugation: { class: "hada", lemmaId: "joahada" } },
  { surface: "일하다", reading: "ilhada", meaningEn: "to work", pos: "verb", conjugation: { class: "hada", lemmaId: "ilhada" } },

  // ── common adjectives (descriptive verbs) ──
  { surface: "좋다", reading: "jota", meaningEn: "to be good", pos: "adjective", conjugation: { class: "regular", lemmaId: "jota" } },
  { surface: "많다", reading: "manta", meaningEn: "to be many", pos: "adjective", conjugation: { class: "regular", lemmaId: "manta" } },
  { surface: "작다", reading: "jakda", meaningEn: "to be small", pos: "adjective", conjugation: { class: "regular", lemmaId: "jakda" } },
  { surface: "높다", reading: "nopda", meaningEn: "to be high", pos: "adjective", conjugation: { class: "regular", lemmaId: "nopda" } },
  { surface: "춥다", reading: "chupda", meaningEn: "to be cold", pos: "adjective", conjugation: { class: "p_irr", lemmaId: "chupda" } },
  { surface: "덥다", reading: "deopda", meaningEn: "to be hot", pos: "adjective", conjugation: { class: "p_irr", lemmaId: "deopda" } },

  // ── adjectives without a table row (no link — surface still learnable) ──
  { surface: "크다", reading: "keuda", meaningEn: "to be big", pos: "adjective" },
  { surface: "예쁘다", reading: "yeppeuda", meaningEn: "to be pretty", pos: "adjective" },
  { surface: "바쁘다", reading: "bappeuda", meaningEn: "to be busy", pos: "adjective" },
  { surface: "쉽다", reading: "swipda", meaningEn: "to be easy", pos: "adjective" },
  { surface: "어렵다", reading: "eoryeopda", meaningEn: "to be difficult", pos: "adjective" },
  { surface: "맛있다", reading: "masitda", meaningEn: "to be delicious", pos: "adjective" },
  { surface: "재미있다", reading: "jaemiitda", meaningEn: "to be fun", pos: "adjective" },

  // ── adverbs / function words ──
  { surface: "아주", reading: "aju", meaningEn: "very", pos: "adverb" },
  { surface: "너무", reading: "neomu", meaningEn: "too / very", pos: "adverb" },
  { surface: "많이", reading: "mani", meaningEn: "a lot", pos: "adverb" },
  { surface: "조금", reading: "jogeum", meaningEn: "a little", pos: "adverb" },
  { surface: "정말", reading: "jeongmal", meaningEn: "really", pos: "adverb" },
  { surface: "빨리", reading: "ppalli", meaningEn: "quickly", pos: "adverb" },
  { surface: "천천히", reading: "cheoncheonhi", meaningEn: "slowly", pos: "adverb" },
  { surface: "다시", reading: "dasi", meaningEn: "again", pos: "adverb" },
  { surface: "함께", reading: "hamkke", meaningEn: "together", pos: "adverb" },
  { surface: "가장", reading: "gajang", meaningEn: "most", pos: "adverb" },
  { surface: "잘", reading: "jal", meaningEn: "well", pos: "adverb" },
  { surface: "또", reading: "tto", meaningEn: "also / again", pos: "adverb" },
  { surface: "그리고", reading: "geurigo", meaningEn: "and", pos: "conjunction" },
  { surface: "하지만", reading: "hajiman", meaningEn: "but", pos: "conjunction" },
  { surface: "그래서", reading: "geuraeseo", meaningEn: "so / therefore", pos: "conjunction" },
  { surface: "그런데", reading: "geureonde", meaningEn: "but / by the way", pos: "conjunction" },

  // ── determiners / quantity ──
  { surface: "모든", reading: "modeun", meaningEn: "all / every", pos: "determiner" },
  { surface: "다른", reading: "dareun", meaningEn: "other / different", pos: "determiner" },
  { surface: "새", reading: "sae", meaningEn: "new", pos: "determiner" },

  // ── more everyday nouns ──
  { surface: "전화", reading: "jeonhwa", meaningEn: "telephone", pos: "noun" },
  { surface: "사진", reading: "sajin", meaningEn: "photo", pos: "noun" },
  { surface: "영화", reading: "yeonghwa", meaningEn: "movie", pos: "noun" },
  { surface: "노래", reading: "norae", meaningEn: "song", pos: "noun" },
  { surface: "날씨", reading: "nalssi", meaningEn: "weather", pos: "noun" },
  { surface: "병원", reading: "byeongwon", meaningEn: "hospital", pos: "noun" },
  { surface: "시장", reading: "sijang", meaningEn: "market", pos: "noun" },
  { surface: "가게", reading: "gage", meaningEn: "store / shop", pos: "noun" },
  { surface: "지하철", reading: "jihacheol", meaningEn: "subway", pos: "noun" },
  { surface: "비행기", reading: "bihaenggi", meaningEn: "airplane", pos: "noun" },
  { surface: "자리", reading: "jari", meaningEn: "seat / place", pos: "noun" },
  { surface: "문화", reading: "munhwa", meaningEn: "culture", pos: "noun" },
  { surface: "여행", reading: "yeohaeng", meaningEn: "travel", pos: "noun" },
];

export const KO_FREQUENCY_ATOMS: ReadonlyArray<FrequencyAtom<KoConjugationLink>> =
  KO_FREQUENCY_SEED.map((s, i) => {
    const frequencyRank = i + 1;
    return {
      id: `ko:${s.surface}`,
      surface: s.surface,
      reading: s.reading,
      meaningEn: s.meaningEn,
      pos: s.pos,
      frequencyRank,
      unlockModule: frequencyRankToModule(frequencyRank, {
        lastModule: KO_FREQ_LAST_MODULE,
      }),
      conjugation: s.conjugation,
      source: "freq",
    };
  });
