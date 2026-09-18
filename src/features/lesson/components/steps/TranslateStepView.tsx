import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as wanakana from "wanakana";
import type { TranslateStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { ExplainButton } from "../ExplainButton";
import { AccentBar } from "../AccentBar";
import { normalizeTypedAnswer } from "@/shared/speech";
import { gradeTypedAnswer, typedAnswerKey } from "@/shared/speech/loose-match";
import { accentPolicyFor } from "@/shared/language/registry";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { expandAcceptedAnswers } from "./translateVariants";
import {
  registerPairFor,
  REGISTER_GRADED_FROM_MODULE,
} from "@/features/languages/ja/jaAcceptedForms";
import { gradeTypedAnswerJa } from "@/features/languages/ja/readingAnnotation/typedAnswerKanjiFallback";
import { convertToHiragana, warmKanjiReading } from "@/features/languages/ja/readingAnnotation/kuroshiro";
import {
  isYouToSuruTemitaNearMiss,
  YOU_TO_SURU_TEMITA_NEAR_MISS_MESSAGE,
} from "@/features/languages/ja/nearMissYouToSuruTemita";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import {
  romajaToHangul,
  koreanInputMatches,
} from "@/features/languages/ko/romanization/romajaToHangul";
import { formatPrompt } from "../formatPrompt";
import { RegisterCueEyebrow } from "./RegisterCueEyebrow";
import { Badge } from "@/shared/components/ui";

const CELEBRATE_MS = 1100;

/** Katakana block (incl. the ー prolonged-sound mark) — picks the nudge
 *  wording so we say "katakana" for テレビ and "hiragana" for the reverse. */
const KATAKANA_RE = /[ァ-ヺー]/;

/** CJK Unified Ideographs — gates the async kuromoji kanji→kana fallback
 *  (#203, #200/#201) so plain-kana input never pays for it. */
const KANJI_RE = /[一-鿿]/;

type Nudge =
  | { tone: "accent" | "kana"; display: string }
  /** Both registers are correct here — show the pair rather than correct it
   *  (Spencer 2026-07-24: "we will accept either answer, show them both"). */
  | { tone: "register"; plain: string; polite: string };

type Props = {
  step: TranslateStep;
  onComplete: (
    stepId: string,
    correct: boolean,
    progressTicks?: number,
    answerText?: string,
  ) => void;
  onContinue: () => void;
};

/** One entry per grading key — variants differing only in spacing or edge
 *  punctuation grade the same and read as noise when listed (#61). */
function uniqueByKey(answers: string[]): string[] {
  const seen = new Set<string>();
  return answers.filter((a) => {
    const k = typedAnswerKey(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function TranslateStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const intoJapanese =
    (language?.id ?? "ja") === "ja" && step.sourceLanguage === "native";
  // Register (plain vs ます) is ungraded until REGISTER_GRADED_FROM_MODULE:
  // until then either answer passes and we SHOW the pair as a teaching beat.
  const moduleIndex = useLessonModuleIndex();
  const registerGraded =
    moduleIndex !== null && moduleIndex >= REGISTER_GRADED_FROM_MODULE;
  // Korean production typing: no wanakana equivalent, so we don't compose
  // in-place — instead grade romaja-or-Hangul via koreanInputMatches and show
  // a live Hangul preview (the desktop "Korean keyboard").
  const intoKorean = language?.id === "ko" && step.sourceLanguage === "native";
  // Accent chip row for learners typing INTO Spanish without an OS layout
  // for it. es only — the JA path has wanakana; other courses opt in as
  // they land.
  const showAccentBar =
    language?.id === "es" && step.sourceLanguage === "native";

  // Romaji→kana live compose (rung 1 of the production typing ladder;
  // Spencer QA 2026-07-12: learners without an OS IME must be able to
  // answer with English letters). wanakana converts as they type; kana
  // and kanji typed via a real IME pass through untouched.
  useEffect(() => {
    const el = textareaRef.current;
    if (!intoJapanese || !el) return;
    wanakana.bind(el, { IMEMode: true });
    return () => wanakana.unbind(el);
  }, [intoJapanese]);

  // Kick off the kuromoji dictionary load on mount (same warm-up pattern as
  // SpeakingStepView's intro warm-up, #188/#189/#190 B28B) so the ~12MB
  // parse races grading less often when a kanji-typed answer needs the
  // kanji→kana fallback below (#203).
  useEffect(() => {
    if (intoJapanese) warmKanjiReading();
  }, [intoJapanese]);

  // Japanese is written without spaces, but curriculum acceptedAnswers store
  // them space-separated for readability. normalizeTypedAnswer ignores
  // whitespace + width/case (but not content) so natural spaceless input
  // grades correctly. See src/shared/speech/loose-match.ts.
  // Into-Japanese answers additionally accept rule-safe variants (topic
  // drop, pronoun swap, です drop, punctuation) — see translateVariants.ts.
  const accepted = useMemo(
    () =>
      intoJapanese
        ? expandAcceptedAnswers(step.acceptedAnswers, { moduleIndex })
        : step.acceptedAnswers,
    [intoJapanese, step.acceptedAnswers, moduleIndex],
  );
  // Grade from the DOM at submit time, not from render-time state: React's
  // onChange lags wanakana's final programmatic write by one event (state
  // held せんせいでs while the DOM showed せんせいです), so deriving
  // correctness during render graded the stale value. toKana also resolves
  // a pending trailing consonant (the classic word-final "n").
  const [isCorrect, setIsCorrect] = useState(false);
  // Correct-but-nudge banner. Two tones, mutually exclusive per course:
  //  - "accent": submission was right modulo Latin diacritics ("anos" for
  //    "años") — es typing without an accent layout.
  //  - "kana": submission was right modulo script — the romaji IME yields
  //    hiragana, so テレビ typed as てれび passes but nudges the katakana.
  // Both are fully correct for SRS/XP; only the banner changes.
  const [nudge, setNudge] = useState<Nudge | null>(null);
  // Set only while the kanji→kana fallback below is awaiting kuromoji — the
  // literal-kana path (the overwhelming majority of submits) never touches
  // this. Disables the Check button so a second submit can't race the first.
  const [checking, setChecking] = useState(false);
  // #200/#201 (b30): the learner answered a ようとした-keyed step with the
  // てみた form of the same verb — a different KIND of wrong than a random
  // miss, worth naming instead of only listing accepted answers.
  const [nearMissTemita, setNearMissTemita] = useState(false);

  async function handleSubmit() {
    const raw = textareaRef.current?.value ?? answer;
    // Korean: accept Hangul (IME) or romaja (composes to Hangul / matches the
    // target's pronunciation) against any accepted answer.
    if (intoKorean) {
      const correct = accepted.some((ans) => koreanInputMatches(raw, ans));
      setIsCorrect(correct);
      setNudge(null);
      setSubmitted(true);
      onComplete(step.id, correct, undefined, raw);
      if (correct) {
        setCelebrationText(pickCelebrationText(t));
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      }
      return;
    }
    const composed = intoJapanese ? wanakana.toKana(raw) : raw;
    // gradeTypedAnswer normalizes both sides (NFKC + whitespace + case),
    // strips trailing sentence punctuation (toKana turns a natural final
    // "." into 。, and answers authored without 。 must still match), and
    // accent-folds as a fallback: a de-accented rendering of a real
    // answer grades correct but surfaces the accented form as a nudge —
    // except across the language's protected minimal pairs (fr F5:
    // ou/où, a/à …), where the fold is refused and the answer is wrong.
    //
    // JA additionally retries via a kanji→kana fallback (#203, b30):
    // acceptedAnswers are authored in kana, but wanakana only converts
    // ROMAJI to kana — kanji typed directly on a real IME/kanji keyboard
    // (図書館, not としょかん) passes through untouched and a literal
    // compare would grade a correct answer wrong. gradeTypedAnswerJa tries
    // the literal compare first and only pays for kuromoji conversion when
    // that fails and the input actually contains kanji.
    let grade = gradeTypedAnswer(accepted, composed, accentPolicyFor(language?.id));
    if (intoJapanese && !grade.correct) {
      setChecking(true);
      try {
        grade = await gradeTypedAnswerJa(accepted, composed, accentPolicyFor(language?.id));
      } finally {
        setChecking(false);
      }
    }
    setIsCorrect(grade.correct);
    if (intoJapanese && !grade.correct) {
      // Run on a kanji-normalized form too (convertToHiragana skip-fasts
      // on pure-kana input, so this costs nothing for the common case) —
      // a learner typing 図書館に行ってみた on a kanji keyboard is the same
      // near-miss as としょかんにいってみた.
      const kanaForNearMiss = KANJI_RE.test(composed)
        ? await convertToHiragana(composed)
        : composed;
      setNearMissTemita(isYouToSuruTemitaNearMiss(accepted, kanaForNearMiss));
    } else {
      setNearMissTemita(false);
    }
    const registerPair =
      intoJapanese && grade.correct && !registerGraded
        ? registerPairFor(composed)
        : null;
    if (grade.accentFlagged && grade.accentDisplay) {
      setNudge({ tone: "accent", display: grade.accentDisplay });
    } else if (grade.kanaFlagged && grade.kanaDisplay) {
      setNudge({ tone: "kana", display: grade.kanaDisplay });
    } else if (registerPair) {
      setNudge({ tone: "register", ...registerPair });
    } else {
      setNudge(null);
    }
    setSubmitted(true);
    onComplete(step.id, grade.correct, undefined, composed);
    if (grade.correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const directionLabel =
    step.sourceLanguage === "native"
      ? "Translate to the target language"
      : "Translate to your language";

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* `mt-auto` HERE and on the action block below is what centres this
          step: two auto margins in a column split the free space evenly, so
          the content sits midway between the header and the CTA while the CTA
          stays bottom-anchored — no wrapper element, no reading-order change.
          Translate was the worst offender in the sweep: a prompt and a text
          field are short, so top-aligning them stranded a 450px void on a
          430x932 phone (Spencer QA 2026-08-07) — nearly half the screen.
          Collapses to 0 when content overflows. */}
      {/* #71 (Spencer TestFlight b12, 2026-09-14): "move the box up
          vertically a bit more" — on mobile this was one of two `mt-auto`
          gaps (see the comment below) splitting the free vertical space
          evenly above and below the content, so half the void sat above
          the prompt. Swapping the TOP gap for a small fixed margin on
          mobile removes that half; the bottom block keeps `mt-auto` so
          the CTA still anchors to the bottom and the original "450px
          void" bug (content top-aligned with nothing pushing the CTA
          down) doesn't come back. `sm:mt-auto` restores the original
          centred layout on desktop — unchanged there. */}
      {/* Two eyebrows, one row: WHAT to do (direction) and IN WHICH FORM
          (the register cue, when the beat authored one). The cue used to be
          the first six words of `sourceText`, which made it part of the
          gloss on every surface that re-used it. */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 sm:mt-auto">
        <Badge variant="eyebrow">{directionLabel}</Badge>
        <RegisterCueEyebrow cue={step.registerCue} />
      </div>
      <h2 className="text-2xl font-bold text-text-primary">
        {step.sourceLanguage === "target" ? (
          step.sourceAnnotation ? (
            <AnnotatedJa segments={step.sourceAnnotation} />
          ) : (
            <AnnotatedJa text={step.sourceText} />
          )
        ) : (
          formatPrompt(step.sourceText)
        )}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      <div className="relative">
        {/* UNCONTROLLED while wanakana drives it: a controlled value prop
            races wanakana's direct DOM writes and drops keystrokes (found
            live: "senseidesu" rendered せんせいでs). State mirrors the DOM
            via onChange for grading; the step remount resets the field. */}
        <textarea
          ref={textareaRef}
          // Mid-lesson, focus is stranded on the previous step's Continue —
          // without this, keystrokes go to <body> (same stranded-focus bug
          // as the transform card, Spencer walk 2026-07-24).
          autoFocus
          disabled={submitted}
          defaultValue=""
          onChange={(e) => setAnswer(e.target.value)}
          lang={intoKorean ? "ko" : undefined}
          placeholder={
            intoJapanese
              ? "Type your translation — English letters become kana as you type…"
              : intoKorean
                ? "Type Korean, or English letters (annyeong → 안녕)…"
                : "Type your translation..."
          }
          rows={3}
          // #71: "make their typing a little bigger" — text-base(16px) →
          // text-lg(18px), +12.5%.
          className="w-full resize-none rounded-xl border-[1.5px] border-border bg-surface px-4 py-3 text-lg text-text-primary outline-none transition-colors focus:border-accent disabled:opacity-60"
        />
        {/* Korean romaja → Hangul live preview (IME-safe: mirrors, never
            mutates the field). */}
        {intoKorean &&
          !submitted &&
          (() => {
            const preview = romajaToHangul(answer);
            return preview !== answer && /[가-힣]/.test(preview) ? (
              <p className="mt-2 text-sm text-text-secondary">
                <Badge as="span" variant="eyebrow" className="mr-2">
                  Hangul
                </Badge>
                <span lang="ko" className="text-lg font-semibold text-text-primary">
                  {preview}
                </span>
              </p>
            ) : null;
          })()}
        {celebrating && <CelebrationToast text={celebrationText} />}
        {showAccentBar && (
          <div className="mt-2">
            <AccentBar
              inputRef={textareaRef}
              disabled={submitted}
              // setRangeText bypasses onChange — mirror the DOM into
              // `answer` so the Check button's disabled check stays live.
              onInsert={setAnswer}
            />
          </div>
        )}
      </div>

      {/* Bottom-anchored block: feedback + CTA together so the button
          sits in the shared bottom action slot on every step type. */}
      <div className="mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {submitted && (
          <Feedback
            correct={isCorrect}
            flagged={nudge !== null && nudge.tone !== "register"}
            note={
              /* Both registers pass until module 20. This is exposure, not
                 a correction — it stays in the success palette (`note`, not
                 `flaggedNote`) so neither rendering reads as the lesser one. */
              nudge?.tone === "register" ? (
                <>
                  Both work — plain{" "}
                  <span className="font-semibold" lang="ja">
                    {nudge.plain}
                  </span>
                  , polite{" "}
                  <span className="font-semibold" lang="ja">
                    {nudge.polite}
                  </span>
                </>
              ) : undefined
            }
            flaggedNote={
              nudge === null || nudge.tone === "register" ? undefined : nudge.tone === "accent" ? (
                <>
                  Watch the accents:{" "}
                  <span className="font-semibold">{nudge.display}</span>
                </>
              ) : (
                <>
                  Usually written in{" "}
                  {KATAKANA_RE.test(nudge.display) ? "katakana" : "hiragana"}:{" "}
                  <span className="font-semibold" lang="ja">
                    {nudge.display}
                  </span>
                </>
              )
            }
          />
        )}

        {/* #200/#201 (Spencer, b30): a ようとした step answered in てみた is a
            named confusion, not a random miss — say why before listing the
            accepted forms. */}
        {submitted && !isCorrect && nearMissTemita && (
          <p className="text-sm text-warning">{YOU_TO_SURU_TEMITA_NEAR_MISS_MESSAGE}</p>
        )}
        {submitted && !isCorrect && (
          <p className="text-sm text-text-secondary">
            Accepted answers: <span className="font-semibold text-text-primary">{uniqueByKey(step.acceptedAnswers).join(", ")}</span>
          </p>
        )}

        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label={checking ? "Checking…" : "Check"}
            disabled={normalizeTypedAnswer(answer).length === 0 || checking}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}
      </div>
    </div>
  );
}
