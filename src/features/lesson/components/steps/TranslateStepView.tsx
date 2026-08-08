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
import { gradeTypedAnswer } from "@/shared/speech/loose-match";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { expandAcceptedAnswers } from "./translateVariants";
import {
  registerPairFor,
  REGISTER_GRADED_FROM_MODULE,
} from "@/features/languages/ja/jaAcceptedForms";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import {
  romajaToHangul,
  koreanInputMatches,
} from "@/features/languages/ko/romanization/romajaToHangul";
import { formatPrompt } from "../formatPrompt";

const CELEBRATE_MS = 1100;

/** Katakana block (incl. the ー prolonged-sound mark) — picks the nudge
 *  wording so we say "katakana" for テレビ and "hiragana" for the reverse. */
const KATAKANA_RE = /[ァ-ヺー]/;

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

  function handleSubmit() {
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
    // answer grades correct but surfaces the accented form as a nudge.
    const grade = gradeTypedAnswer(accepted, composed);
    setIsCorrect(grade.correct);
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
      <p className="mt-auto text-xs font-bold uppercase tracking-wider text-text-muted">
        {directionLabel}
      </p>
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
          className="w-full resize-none rounded-xl border-[1.5px] border-border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors focus:border-accent disabled:opacity-60"
        />
        {/* Korean romaja → Hangul live preview (IME-safe: mirrors, never
            mutates the field). */}
        {intoKorean &&
          !submitted &&
          (() => {
            const preview = romajaToHangul(answer);
            return preview !== answer && /[가-힣]/.test(preview) ? (
              <p className="mt-2 text-sm text-text-secondary">
                <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Hangul
                </span>
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

        {submitted && !isCorrect && (
          <p className="text-sm text-text-secondary">
            Accepted answers: <span className="font-semibold text-text-primary">{step.acceptedAnswers.join(", ")}</span>
          </p>
        )}

        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={normalizeTypedAnswer(answer).length === 0}
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
