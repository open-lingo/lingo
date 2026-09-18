/**
 * JA typed-answer grading with a kanji→kana fallback (TestFlight #203, b30).
 *
 * `acceptedAnswers` in curriculum, practice and conversation content are
 * authored in kana (as`gradeTypedAnswer` from `loose-match.ts` expects), but
 * a learner typing on a real Japanese IME/kanji keyboard naturally reaches
 * for kanji — 「図書館」, not「としょかん」— and a literal kana compare then
 * grades a correct answer wrong. Spencer, b30 #203: "we need to normalize
 * kanji answers too if they want to use their kanji keyboard."
 *
 * This reuses the SAME kuromoji reader the speaking step already relies on
 * for the mirror-image problem (#188/#189/#190, B28B): convert the typed
 * kanji to hiragana, then grade again. Pure-kana input short-circuits inside
 * `convertToHiragana` before it ever touches kuromoji, so calling this on
 * every JA typed-answer submit costs nothing for the common case.
 */
import { gradeTypedAnswer, type TypedAnswerGrade } from "@/shared/speech/loose-match";
import type { AccentPolicy } from "@/shared/speech/loose-match";
import { convertToHiragana } from "./kuroshiro";

/** CJK Unified Ideographs — gates the async kuromoji fallback so plain-kana
 *  input (the overwhelming majority of attempts) never pays for it. */
const KANJI_RE = /[一-鿿]/;

/**
 * Grade a typed JA answer against `acceptedAnswers`. Tries the literal
 * (kana-authored) compare first; only when that fails AND the input
 * contains kanji does it convert kanji→kana and retry once. Returns the
 * literal grade unchanged for non-kanji input or an exact/first-pass match.
 */
export async function gradeTypedAnswerJa(
  acceptedAnswers: readonly string[],
  input: string,
  policy?: AccentPolicy,
): Promise<TypedAnswerGrade> {
  const direct = gradeTypedAnswer(acceptedAnswers, input, policy);
  if (direct.correct || !KANJI_RE.test(input)) return direct;
  const asKana = await convertToHiragana(input);
  if (asKana === input) return direct;
  return gradeTypedAnswer(acceptedAnswers, asKana, policy);
}
