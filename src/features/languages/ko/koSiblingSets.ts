/**
 * Semantic sibling sets — the KO half of the confusable-word data behind
 * `siblingResolver.ts`.
 *
 * Same ruling as JA (`ja/jaSiblingSets.ts`): a distractor is only worth a slot
 * when the learner has to READ the sentence to reject it. Little & Bjork (2015)
 * measured non-competitive distractors as statistically indistinguishable from
 * never having shown the item, so "a random other noun" is not a distractor, it
 * is filler. Everything below groups words that could plausibly stand in the
 * SAME SLOT of the same sentence: 학교 / 회사 / 식당 all fit `___에 갔어요`,
 * 커피 / 우유 / 물 all fit `___를 마셔요`.
 *
 * Membership is by Hangul surface and a word may sit in several sets (그림 is
 * both an object and a hobby); `siblingsOf` unions them. Entries may name words
 * the course has not taught yet — the cloze builder intersects candidates with
 * the learner's known atoms, so listing them early is harmless and means the set
 * starts working the module the word lands in.
 *
 * Sets are grouped by FRAME, not just by topic. Korean marks the slot with a
 * particle, so a set that mixes valencies is partly solvable without reading:
 * offering 가요 against `커피를 ___` is eliminable on 를 alone. Hence the split
 * between 을/를 verbs (`actionVerbPolite`), 에 verbs (`locationVerbPolite`) and
 * so on. Tense is split for the same reason the JA file keeps plain and negative
 * verbs apart — 갔어요 against a 가요 answer tests conjugation, not vocabulary,
 * and is frequently ALSO a defensible reading of the sentence.
 *
 * Deliberate omissions, each because the item would be UNFAIR rather than hard:
 *
 *  - **Sino and native numerals are two sets, never one.** 사 and 넷 both render
 *    as "four" in the English gloss the cloze surface shows, so the learner has
 *    no signal to choose between them — the contrast is a counter-frame skill
 *    (아홉 시 vs 구 시), which belongs to the counter drills, not to a vocabulary
 *    blank.
 *  - **가장 / 아주 / 정말 are absent from `degreeAdverb`** — 가장 is a true
 *    synonym of 제일, and 아주 / 정말 collapse into 너무 under an English gloss
 *    of "so / very / really". A distractor that also translates the stem is not
 *    a hard item, it is an item with two right answers.
 *  - **하지만 / 그래도 are absent from `connectiveAdverb`** — both read as "but"
 *    against 그런데. 그리고 / 그래서 / 그런데 are three genuinely different
 *    logical relations, which is what makes that set work.
 *  - **보다 is absent from `verbPlain`** — the same surface is the m22
 *    comparative particle (커피보다), so blanking it in a comparison sentence
 *    would produce a nonsense item.
 *
 * NOTE on 좋아요 vs 좋아해요, which the product owner raised: that pair is a
 * 이/가-vs-을/를 FRAME contrast (커피가 좋아요 / 커피를 좋아해요), not a pair of
 * confusable words, and the sibling-set format cannot express it honestly — a
 * flat set says "these two fill the same slot", which is exactly what is false
 * here. It is also mechanically unreachable: the two carry different
 * `partOfSpeech` (adjective vs verb) and the cloze builder rejects cross-POS
 * candidates outright. Teaching that contrast needs a particle-choice exercise,
 * not a vocabulary blank. Each word therefore sits in its own frame's set.
 *
 * NOTE on particles: JA additionally exports `JA_PARTICLE_CONTRASTS` for its
 * build-tile floor (`lesson/data/buildTileFloor.ts`). KO has no build-tile
 * consumer, and the cloze builder only ever blanks content words, so a KO
 * particle table would be dead code today. 은/는 vs 이/가 would also hit the
 * same defensible-alternative trap JA calls out for は vs が — swapping them
 * usually yields correct Korean with a different topic/focus nuance.
 */

/** Same-category words that make each other genuinely confusable. */
export const KO_SIBLING_SETS: Readonly<Record<string, readonly string[]>> = {
  // ── Nouns ──────────────────────────────────────────────────────────────
  /** `___에 가요` / `___에서 먹어요` — destinations and settings. */
  place: ["집", "학교", "회사", "식당", "역", "병원", "가게", "교실", "공원", "도서관", "은행", "시장", "바다", "산", "온천", "외국", "고향"],
  /** `우리 ___은 …` — kin terms, the classic older-sibling tangle included. */
  family: ["엄마", "아빠", "어머니", "아버지", "부모님", "가족", "형", "오빠", "누나", "언니", "동생", "할머니", "할아버지"],
  /** `제 ___은 …` — people by role. */
  person: ["친구", "학생", "선생님", "사람", "아이", "아기"],
  /** `___를 먹어요`. */
  foodNoun: ["밥", "고기", "생선", "채소", "과일", "빵", "김치", "비빔밥", "불고기", "라면", "사과", "포도", "쿠키", "오이", "호두", "계란", "국수"],
  /** `___를 마셔요` — kept apart from food so the verb stays informative. */
  drinkNoun: ["커피", "우유", "물", "차", "주스", "맥주", "술"],
  /** `___이 있어요` / `___를 샀어요` — portable things. */
  objectNoun: ["책", "펜", "가방", "의자", "문", "핸드폰", "모자", "치마", "구두", "우산", "지도", "사진", "그림", "전화", "시계", "컴퓨터"],
  /** `___가 아파요`. Mostly single-syllable, so these serve as distractors. */
  bodyPart: ["머리", "코", "입", "귀", "손", "발", "배", "목", "다리", "눈", "얼굴", "어깨"],
  /** `___를 타요`. */
  transportNoun: ["버스", "지하철", "택시", "기차", "비행기", "자전거", "차"],
  /** `___를 좋아해요` / `___를 해요` — things you do for their own sake. */
  activityNoun: ["공부", "운동", "수영", "운전", "노래", "요리", "여행", "음악", "게임", "그림", "사진", "연습", "춤"],
  /** `내일 ___이 있어요` — scheduled things. */
  eventNoun: ["시험", "약속", "계획", "준비", "축제", "결혼", "졸업", "출발", "도착", "여행", "파티"],
  seasonNoun: ["봄", "여름", "가을", "겨울"],
  /** `___이 와요` — weather that falls. 날씨 is excluded: it takes 좋아요, not 와요. */
  weatherNoun: ["비", "눈", "바람", "구름", "안개"],
  weekday: ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"],
  month: ["일월", "이월", "삼월", "사월", "오월", "유월", "칠월", "팔월", "구월", "시월", "십일월", "십이월"],
  /** `___에 뭐 해요?` — the when-slot spans. */
  timeSpanNoun: ["하루", "주말", "일주일", "다음", "이번", "오전", "오후"],
  /** Counted with 개 / 명 / 잔 — see the header on why these never mix with Sino. */
  nativeNumber: ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "스물", "스무", "서른"],
  /** Counted with 분 / 원 / 월. */
  sinoNumber: ["일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십", "백", "천", "만"],
  /** `___으로 가세요`. */
  directionNoun: ["왼쪽", "오른쪽", "앞", "뒤", "옆", "위", "아래"],

  // ── Verbs ──────────────────────────────────────────────────────────────
  /** `학교에 ___` — being somewhere vs arriving there. Present, polite. */
  locationVerbPolite: ["가요", "와요", "있어요", "없어요", "살아요", "다녀요"],
  /** `버스를 ___` / `여기서 ___` — the transit pair. */
  transitVerbPolite: ["타요", "내려요", "갈아타요", "걸어가요"],
  /** `커피를 ___` — 을/를 verbs. Present, polite. */
  actionVerbPolite: ["먹어요", "마셔요", "봐요", "해요", "좋아해요", "싫어해요", "만나요", "알아요", "들어요", "잘해요", "못해요", "읽어요", "사요", "배워요"],
  /** Past of {@link actionVerbPolite}; kept apart so no item is a tense quiz. */
  actionVerbPast: ["먹었어요", "마셨어요", "봤어요", "했어요", "만났어요", "좋아했어요", "샀어요", "읽었어요"],
  /** Past of {@link locationVerbPolite}. 늦었어요 shares the 에 frame. */
  locationVerbPast: ["갔어요", "왔어요", "있었어요", "없었어요", "늦었어요", "도착했어요"],
  /** `___세요` — please-do forms, the register of the directions dialogues. */
  honorificImperative: ["가세요", "오세요", "타세요", "내리세요", "보세요", "하세요", "앉으세요", "조심하세요"],
  /** Dictionary forms, as the course teaches them. */
  verbPlain: ["가다", "오다", "먹다", "마시다", "하다", "타다", "내리다", "자다", "쉬다", "기다리다", "좋아하다", "싫어하다", "춤추다", "결정하다", "조심하다", "잊어버리다"],

  // ── Adjectives ─────────────────────────────────────────────────────────
  /** `이 가방은 ___` — describing a thing, incl. the 싸요/비싸요 antonym pair. */
  adjDescriptivePolite: ["좋아요", "커요", "작아요", "예뻐요", "맛있어요", "비싸요", "싸요", "나빠요", "많아요", "적어요", "재미있어요"],
  /** `오늘 날씨가 ___`. */
  adjWeatherPolite: ["맑아요", "흐려요", "더워요", "추워요", "따뜻해요", "시원해요"],
  /** `저는 ___` — how the speaker feels. Two members resolve today, so this set
   *  will not fire until a third feeling adjective is taught; that is the
   *  honest outcome, not a reason to pad it with unrelated states. */
  adjFeelingPolite: ["아파요", "피곤해요", "배고파요", "바빠요", "졸려요"],
  /** Dictionary forms, as the course teaches them. */
  adjPlain: ["좋다", "크다", "작다", "예쁘다", "맛있다", "비싸다", "싸다", "짜다", "맑다", "흐리다", "덥다", "춥다", "피곤하다"],

  // ── Adverbs ────────────────────────────────────────────────────────────
  /** `___ 학교에 갔어요` — when. Question words live in `questionAdverb`. */
  timeAdverb: ["오늘", "어제", "내일", "지금", "아침", "점심", "저녁", "밤", "매일", "요즘"],
  /** `커피를 ___ 마셔요` — how often. */
  frequencyAdverb: ["항상", "자주", "가끔", "별로", "전혀", "보통", "많이"],
  /** `___ 비싸요` — how much. 아주 / 정말 are excluded for the same reason as
   *  가장: under an English gloss of "so / very / really" they are not
   *  distinguishable from 너무, so the item would have no correct answer. */
  degreeAdverb: ["너무", "더", "덜", "제일", "조금"],
  /** Sentence-initial linkers: and / so / but. */
  connectiveAdverb: ["그리고", "그래서", "그런데"],
  /** `___ 갔어요?`. */
  questionAdverb: ["언제", "왜", "어떻게", "어디서"],
};

const INDEX: ReadonlyMap<string, readonly string[]> = (() => {
  const index = new Map<string, string[]>();
  for (const members of Object.values(KO_SIBLING_SETS)) {
    for (const member of members) {
      const bucket = index.get(member) ?? [];
      for (const sibling of members) {
        if (sibling !== member && !bucket.includes(sibling)) bucket.push(sibling);
      }
      index.set(member, bucket);
    }
  }
  return index;
})();

/** Every same-category word for `surface`, excluding itself. [] when unknown. */
export function siblingsOf(surface: string): readonly string[] {
  return INDEX.get(surface) ?? [];
}
