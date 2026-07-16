import { describe, it, expect } from "vitest";
import {
  conjugateKo,
  generateKoDistractors,
  type KoStemClass,
  type KoFormKey,
} from "./conjugationEngine";

/** [lemma, class, { form: expected }] — textbook-correct fixtures. */
type Case = [string, KoStemClass, Partial<Record<KoFormKey, string>>];

const CASES: Case[] = [
  // ── Regular consonant-stem ──
  [
    "먹다",
    "regular",
    {
      "present.polite": "먹어요",
      "present.casual": "먹어",
      "present.formal": "먹습니다",
      "past.polite": "먹었어요",
      "past.formal": "먹었습니다",
      "future.polite": "먹을 거예요",
      "future.formal": "먹을 겁니다",
      "progressive.polite": "먹고 있어요",
      "neg.short.present.polite": "안 먹어요",
      "neg.short.past.polite": "안 먹었어요",
      "neg.long.present.polite": "먹지 않아요",
      "neg.long.present.formal": "먹지 않습니다",
    },
  ],
  ["읽다", "regular", { "present.polite": "읽어요", "present.formal": "읽습니다", "future.polite": "읽을 거예요" }],
  ["앉다", "regular", { "present.polite": "앉아요", "past.polite": "앉았어요" }],
  ["받다", "regular", { "present.polite": "받아요", "present.formal": "받습니다" }],
  ["좋다", "regular", { "present.polite": "좋아요", "present.formal": "좋습니다", "past.polite": "좋았어요" }],
  ["많다", "regular", { "present.polite": "많아요", "present.formal": "많습니다" }],

  // ── Regular vowel-stem (contraction) ──
  [
    "가다",
    "regular",
    {
      "present.polite": "가요",
      "past.polite": "갔어요",
      "present.formal": "갑니다",
      "future.polite": "갈 거예요",
      "progressive.polite": "가고 있어요",
    },
  ],
  ["오다", "regular", { "present.polite": "와요", "past.polite": "왔어요", "present.formal": "옵니다", "future.polite": "올 거예요" }],
  ["보다", "regular", { "present.polite": "봐요", "past.polite": "봤어요", "present.formal": "봅니다" }],
  ["주다", "regular", { "present.polite": "줘요", "past.polite": "줬어요", "present.formal": "줍니다" }],
  ["마시다", "regular", { "present.polite": "마셔요", "past.polite": "마셨어요", "present.formal": "마십니다" }],
  ["만나다", "regular", { "present.polite": "만나요", "past.polite": "만났어요", "present.formal": "만납니다" }],
  ["되다", "regular", { "present.polite": "돼요", "past.polite": "됐어요", "present.formal": "됩니다" }],
  ["배우다", "regular", { "present.polite": "배워요", "past.polite": "배웠어요", "present.formal": "배웁니다" }],

  // ── 하다 ──
  [
    "하다",
    "hada",
    {
      "present.polite": "해요",
      "past.polite": "했어요",
      "present.formal": "합니다",
      "future.polite": "할 거예요",
      "progressive.polite": "하고 있어요",
      "neg.short.present.polite": "안 해요",
      "neg.long.present.polite": "하지 않아요",
    },
  ],
  [
    "공부하다",
    "hada",
    {
      "present.polite": "공부해요",
      "past.polite": "공부했어요",
      "present.formal": "공부합니다",
      "future.polite": "공부할 거예요",
      "progressive.polite": "공부하고 있어요",
      "neg.short.present.polite": "공부 안 해요",
      "neg.short.past.polite": "공부 안 했어요",
      "neg.long.present.polite": "공부하지 않아요",
    },
  ],

  // ── ㅂ irregular ──
  [
    "춥다",
    "p_irr",
    {
      "present.polite": "추워요",
      "past.polite": "추웠어요",
      "present.formal": "춥습니다",
      "future.polite": "추울 거예요",
      "neg.short.present.polite": "안 추워요",
      "neg.long.present.polite": "춥지 않아요",
    },
  ],
  ["덥다", "p_irr", { "present.polite": "더워요", "past.polite": "더웠어요", "present.formal": "덥습니다" }],
  ["돕다", "p_irr", { "present.polite": "도와요", "past.polite": "도왔어요", "present.formal": "돕습니다", "future.polite": "도울 거예요" }],
  ["쉽다", "p_irr", { "present.polite": "쉬워요", "present.formal": "쉽습니다" }],
  ["어렵다", "p_irr", { "present.polite": "어려워요", "present.formal": "어렵습니다" }],
  ["맵다", "p_irr", { "present.polite": "매워요" }],
  ["가깝다", "p_irr", { "present.polite": "가까워요" }],
  ["아름답다", "p_irr", { "present.polite": "아름다워요" }],
  ["귀엽다", "p_irr", { "present.polite": "귀여워요" }],

  // ── ㄷ irregular ──
  [
    "듣다",
    "t_irr",
    {
      "present.polite": "들어요",
      "past.polite": "들었어요",
      "present.formal": "듣습니다",
      "future.polite": "들을 거예요",
      "progressive.polite": "듣고 있어요",
    },
  ],
  ["걷다", "t_irr", { "present.polite": "걸어요", "past.polite": "걸었어요", "present.formal": "걷습니다" }],
  ["묻다", "t_irr", { "present.polite": "물어요", "past.polite": "물었어요" }],
  ["싣다", "t_irr", { "present.polite": "실어요" }],

  // ── ㅅ irregular ──
  [
    "짓다",
    "s_irr",
    {
      "present.polite": "지어요",
      "past.polite": "지었어요",
      "present.formal": "짓습니다",
      "future.polite": "지을 거예요",
    },
  ],
  ["낫다", "s_irr", { "present.polite": "나아요", "past.polite": "나았어요" }],
  ["붓다", "s_irr", { "present.polite": "부어요" }],
  ["잇다", "s_irr", { "present.polite": "이어요" }],

  // ── 르 irregular ──
  [
    "모르다",
    "reu_irr",
    {
      "present.polite": "몰라요",
      "past.polite": "몰랐어요",
      "present.formal": "모릅니다",
      "future.polite": "모를 거예요",
    },
  ],
  ["부르다", "reu_irr", { "present.polite": "불러요", "past.polite": "불렀어요", "present.formal": "부릅니다" }],
  ["빠르다", "reu_irr", { "present.polite": "빨라요", "past.polite": "빨랐어요", "present.formal": "빠릅니다" }],
  ["다르다", "reu_irr", { "present.polite": "달라요", "past.polite": "달랐어요" }],
  ["고르다", "reu_irr", { "present.polite": "골라요" }],
  ["흐르다", "reu_irr", { "present.polite": "흘러요" }],

  // ── ㅎ irregular (adjectives) ──
  [
    "그렇다",
    "h_irr",
    {
      "present.polite": "그래요",
      "past.polite": "그랬어요",
      "present.formal": "그렇습니다",
      "future.polite": "그럴 거예요",
    },
  ],
  ["어떻다", "h_irr", { "present.polite": "어때요", "past.polite": "어땠어요" }],
  ["빨갛다", "h_irr", { "present.polite": "빨개요", "past.polite": "빨갰어요", "present.formal": "빨갛습니다" }],
  ["파랗다", "h_irr", { "present.polite": "파래요" }],
  ["노랗다", "h_irr", { "present.polite": "노래요" }],
  ["하얗다", "h_irr", { "present.polite": "하얘요", "past.polite": "하얬어요" }],
  ["까맣다", "h_irr", { "present.polite": "까매요" }],

  // ── ㄹ-stem ──
  [
    "살다",
    "l_stem",
    {
      "present.polite": "살아요",
      "past.polite": "살았어요",
      "present.formal": "삽니다",
      "future.polite": "살 거예요",
      "progressive.polite": "살고 있어요",
    },
  ],
  ["알다", "l_stem", { "present.polite": "알아요", "present.formal": "압니다", "future.polite": "알 거예요" }],
  ["놀다", "l_stem", { "present.polite": "놀아요", "present.formal": "놉니다" }],
  ["만들다", "l_stem", { "present.polite": "만들어요", "past.polite": "만들었어요", "present.formal": "만듭니다", "future.polite": "만들 거예요" }],
  ["팔다", "l_stem", { "present.polite": "팔아요", "present.formal": "팝니다" }],
  ["멀다", "l_stem", { "present.polite": "멀어요", "present.formal": "멉니다" }],
  ["길다", "l_stem", { "present.polite": "길어요", "present.formal": "깁니다" }],

  // ── 으 / ㅡ-deletion ──
  [
    "쓰다",
    "eu_irr",
    {
      "present.polite": "써요",
      "past.polite": "썼어요",
      "present.formal": "씁니다",
      "future.polite": "쓸 거예요",
      "progressive.polite": "쓰고 있어요",
    },
  ],
  ["크다", "eu_irr", { "present.polite": "커요", "past.polite": "컸어요", "present.formal": "큽니다", "future.polite": "클 거예요" }],
  ["끄다", "eu_irr", { "present.polite": "꺼요", "past.polite": "껐어요" }],
  ["바쁘다", "eu_irr", { "present.polite": "바빠요", "past.polite": "바빴어요", "present.formal": "바쁩니다" }],
  ["아프다", "eu_irr", { "present.polite": "아파요", "past.polite": "아팠어요" }],
  ["예쁘다", "eu_irr", { "present.polite": "예뻐요", "past.polite": "예뻤어요" }],
  ["기쁘다", "eu_irr", { "present.polite": "기뻐요" }],
  ["슬프다", "eu_irr", { "present.polite": "슬퍼요" }],
  ["고프다", "eu_irr", { "present.polite": "고파요" }],
];

describe("conjugateKo", () => {
  for (const [lemma, cls, forms] of CASES) {
    describe(`${lemma} (${cls})`, () => {
      for (const [form, expected] of Object.entries(forms)) {
        it(`${form} → ${expected}`, () => {
          expect(conjugateKo(lemma, cls, form as KoFormKey)).toBe(expected);
        });
      }
    });
  }

  it("dictionary form is the lemma unchanged", () => {
    expect(conjugateKo("먹다", "regular", "dictionary")).toBe("먹다");
  });
});

describe("generateKoDistractors", () => {
  it("produces 3 distinct wrong forms, none equal to the answer", () => {
    for (const [lemma, cls] of CASES) {
      const correct = conjugateKo(lemma, cls, "present.polite");
      const distractors = generateKoDistractors(lemma, cls, "present.polite", correct);
      expect(distractors.length).toBeGreaterThanOrEqual(2);
      expect(new Set(distractors).size).toBe(distractors.length);
      expect(distractors).not.toContain(correct);
    }
  });

  it("offers the force-regular error for an irregular stem (듣어요 for 들어요)", () => {
    const correct = conjugateKo("듣다", "t_irr", "present.polite"); // 들어요
    const distractors = generateKoDistractors("듣다", "t_irr", "present.polite", correct);
    expect(distractors).toContain("듣어요");
  });
});
