/**
 * Korean Survival Phrasebook — sidequest lesson.
 *
 * Mirrors the JA `sidequest-survival.ts` (15-phrase exposure-first audio
 * primer). EXPOSURE, not quiz: each phrase is a `phrase_card` with
 * meaning + romanization + Hangul. Audio auto-plays. The user reads,
 * hears, continues. No correct/incorrect.
 *
 * Phrases chosen for the traveler in Seoul:
 *   - Greetings + politeness — 안녕하세요, 감사합니다, 죄송합니다,
 *     괜찮아요
 *   - Yes / no / understanding — 네, 아니요, 잘 모르겠어요
 *   - Asking — 얼마예요?, 어디예요?, 화장실이 어디예요?
 *   - Help + requests — 도와주세요, 물 주세요, 이거 주세요
 *   - Coping — 한국어 못해요, 다시 말해주세요, 잠시만요
 *
 * Lesson id `ko-sidequest-survival-phrases` does NOT match the
 * `^ja-m\d+-…` or `^ko-m\d+-…` shape, so any review-tail augmentation
 * skips it cleanly.
 *
 * Note on register: 안녕하세요 (polite-formal) is the all-purpose
 * traveler greeting. We don't teach 안녕 (casual) or 안녕히 가세요
 * (goodbye, to person leaving) — too many register branches for a
 * 5-minute primer. Spencer's call when content review happens.
 *
 * CONTENT-TODO: a Korean speaker should sanity-check:
 *   - Whether 잘 모르겠어요 is the right "I don't know" register for a
 *     traveler (vs. 몰라요 which is more casual).
 *   - The cultural-note copy on 죄송합니다 vs. 미안해요 (formal vs.
 *     casual apology) — current copy paraphrases the JA equivalent's
 *     framing, may need Korean-specific framing.
 */
import type { LessonContent, PhraseCardStep } from "@/features/lesson/types";

function phrase(
  id: string,
  meaningEn: string,
  romanization: string,
  hangul: string,
  cultureNote?: string,
): PhraseCardStep {
  return {
    id,
    type: "phrase_card",
    meaningEn,
    // PhraseCardStep uses `romaji` for the transliteration slot — KO
    // Revised Romanization rides there. Renderer is script-agnostic.
    romaji: romanization,
    kana: hangul,
    cultureNote,
  };
}

export const MOCK_LESSON_KO_SIDEQUEST_SURVIVAL: LessonContent = {
  id: "ko-sidequest-survival-phrases",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ko",
  title: "Korean Survival Phrasebook",
  description:
    "15 phrases that turn a tourist trip from baffling to functional.",
  estimatedMinutes: 5,
  xpReward: 20,
  steps: [
    {
      id: "ko-surv-info-0",
      type: "info",
      title: "15 phrases, 5 minutes",
      body:
        "Quick exposure to the 15 phrases that cover ~80% of tourist Seoul: hello, thanks, sorry, yes/no, how much, where, please, please help, I don't speak Korean, one moment. Tap to hear each one. You don't need to memorize anything — just hear them once so they feel familiar when you meet them in the wild.",
      variant: "culture",
    },

    // ─── Greetings + politeness ──────────────────────────────────────
    phrase(
      "ko-surv-annyeonghaseyo",
      "Hello (polite, all-purpose)",
      "annyeonghaseyo",
      "안녕하세요",
      "Works morning to night. The casual form is just 안녕 (annyeong) — use with kids and close friends only. With strangers and shop staff, 안녕하세요 is your default.",
    ),
    phrase(
      "ko-surv-gamsahamnida",
      "Thank you (formal)",
      "gamsahamnida",
      "감사합니다",
      "Slightly more formal than 고마워요 (gomawoyo). Use 감사합니다 with strangers and service staff; 고마워요 with peers.",
    ),
    phrase(
      "ko-surv-joesonghamnida",
      "I'm sorry / excuse me (formal)",
      "joesonghamnida",
      "죄송합니다",
      "Used for actual apologies. For light 'excuse me' (bumping into someone), 실례합니다 (sillyehamnida) is also common.",
    ),
    phrase(
      "ko-surv-gwaenchanayo",
      "It's okay / I'm okay",
      "gwaenchanayo",
      "괜찮아요",
      "The Swiss Army knife of polite Korean — answers 'are you okay?' / 'sorry about that' / 'do you want X?' (declining) all interchangeably.",
    ),

    // ─── Yes / no / understanding ────────────────────────────────────
    phrase(
      "ko-surv-ne",
      "Yes",
      "ne",
      "네",
      "Often used as a polite 'mmhm, I'm listening' even when you don't fully agree. Not quite a commitment to 'yes.'",
    ),
    phrase(
      "ko-surv-aniyo",
      "No",
      "aniyo",
      "아니요",
      "Stronger than English 'no' in some contexts — softens with 괜찮아요 ('it's okay, don't worry').",
    ),
    phrase(
      "ko-surv-jal-moreugesseoyo",
      "I don't know / I'm not sure",
      "jal moreugesseoyo",
      "잘 모르겠어요",
      "Literally 'I don't know well.' Polite hedge. The shorter 몰라요 (mollayo) is more casual.",
    ),

    // ─── Asking ──────────────────────────────────────────────────────
    phrase(
      "ko-surv-eolmayeyo",
      "How much is it?",
      "eolmayeyo",
      "얼마예요?",
      "Pointing helps. Prices in Korean come back with numbers + 원 (won). Practice 1–10 ahead of any market visit.",
    ),
    phrase(
      "ko-surv-eodiyeyo",
      "Where is it?",
      "eodiyeyo",
      "어디예요?",
      "Pair with the noun: '화장실이 어디예요?' = where's the bathroom? Works for everything.",
    ),
    phrase(
      "ko-surv-hwajangsil",
      "Where is the bathroom?",
      "hwajangsiri eodiyeyo",
      "화장실이 어디예요?",
      "화장실 = bathroom; 이 = subject marker (used because 화장실 ends in a consonant); 어디예요 = where is it.",
    ),

    // ─── Help + requests ─────────────────────────────────────────────
    phrase(
      "ko-surv-dowajuseyo",
      "Please help me",
      "dowajuseyo",
      "도와주세요",
      "The all-purpose request for help — from 'I'm lost' to 'I dropped my phone in the subway.' 주세요 attaches the 'please' politeness.",
    ),
    phrase(
      "ko-surv-mul-juseyo",
      "Water, please",
      "mul juseyo",
      "물 주세요",
      "Pattern: noun + 주세요 = 'please give me X.' Works for 커피 주세요, 메뉴 주세요, 영수증 주세요 (receipt).",
    ),
    phrase(
      "ko-surv-igeo-juseyo",
      "This one, please",
      "igeo juseyo",
      "이거 주세요",
      "Point + say. 이거 = 'this one (close to me).' For 'that one (close to you)' use 그거; 'that one (far)' use 저거.",
    ),

    // ─── Coping with limits ──────────────────────────────────────────
    phrase(
      "ko-surv-motaeyo",
      "I don't speak Korean (well)",
      "hangugeo motaeyo",
      "한국어 못해요",
      "Literally 'Korean — can't do.' Frees your conversation partner to slow down or switch. Pair with a smile.",
    ),
    phrase(
      "ko-surv-dasi-malhaejuseyo",
      "Please say it again",
      "dasi malhaejuseyo",
      "다시 말해주세요",
      "다시 = again; 말하다 = to speak; 주세요 = please. The Korean equivalent of 'say that one more time, slower.'",
    ),
    phrase(
      "ko-surv-jamsimanyo",
      "One moment, please",
      "jamsimanyo",
      "잠시만요",
      "Universal 'hang on a sec' — useful for 'sorry let me check my phone' or 'sorry let me get my friend to translate.'",
    ),

    {
      id: "ko-surv-win",
      type: "info",
      title: "You're equipped",
      body:
        "You can now greet, thank, apologize, ask 'how much / where / where's the bathroom,' say yes/no, request help, say 'I don't speak Korean,' ask to repeat, and signal 'one moment.' That's ~80% of tourist Korea. Replay this anytime — the audio is the goal, not the Hangul.",
      variant: "win",
    },
  ],
};
