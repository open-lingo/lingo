import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as wanakana from "wanakana";
import { Button, Card, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import {
  generatePracticeItems,
  type PracticeItem,
} from "@/features/practice/engine";
import { getTtsLang } from "./data/practiceDataLoader";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import { playJaAudio } from "@/shared/tts";
import { gradeTypedAnswer } from "@/shared/speech/loose-match";
import {
  romajaToHangul,
  koreanInputMatches,
} from "@/features/languages/ko/romanization/romajaToHangul";
import {
  createInitialState,
  getCardState,
  gradeFromLesson,
  setCardState,
} from "@/features/flashcards/engine";

/**
 * Writing practice — a calm typing session generated from the words the
 * learner has actually learned. Each item shows an English prompt; the
 * learner writes it in the target language and we grade the typed answer.
 *
 * The whole session is built by the tailored-practice engine
 * (`generatePracticeItems(surface: "writing")`) from unlocked vocab + reached
 * grammar, so prompts are always comprehensible and never the same ten.
 *
 * Grading reuses the lesson production-typing path: `gradeTypedAnswer`
 * (NFKC + whitespace/case fold, trailing-punctuation strip, kana + accent
 * leniency) for JA/ES, with a `wanakana.toKana` compose so learners without an
 * IME can type romaji; Korean grades romaja-or-Hangul via `koreanInputMatches`
 * with a live Hangul preview.
 */

const SESSION_COUNT = 12;

/** Human label for the "write this in {language}" prompt. Kept local so this
 *  leaf page doesn't depend on the LanguageContext provider (also simpler to
 *  test); falls back to the id for any language without an entry. */
const LANGUAGE_NAMES: Record<string, string> = {
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
};

type ItemStatus = "typing" | "wrong" | "correct" | "revealed";

export function WritingPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const isKo = langId === "ko";
  const isJa = langId === "ja";
  const ttsLang = getTtsLang(langId);
  const languageName = LANGUAGE_NAMES[langId] ?? langId.toUpperCase();

  // Stable per-session seed: the same session stays put across re-renders but
  // "New session" bumps it for a fresh set.
  const [seed, setSeed] = useState(() => Date.now());
  const items = useMemo<PracticeItem[]>(
    () =>
      generatePracticeItems(langId, {
        surface: "writing",
        count: SESSION_COUNT,
        seed,
      }),
    [langId, seed],
  );

  // Warm this session's clips up front — audio is served from the CDN, so a
  // cold play costs a round trip exactly when the learner taps.
  const prefetchTexts = useMemo(
    () => items.map((it) => it.promptAudioText ?? it.target),
    [items],
  );
  usePrefetchAudio(prefetchTexts, ttsLang);

  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<ItemStatus>("typing");
  const [hadWrong, setHadWrong] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const item = items[idx] as PracticeItem | undefined;
  const done = items.length > 0 && idx >= items.length;

  // Live target-script compose (IME-safe: mirrors input, never mutates it).
  const koreanPreview = isKo ? romajaToHangul(typed) : "";
  const showKoreanPreview =
    isKo && koreanPreview !== typed && /[가-힣]/.test(koreanPreview);
  const japanesePreview = isJa ? wanakana.toKana(typed) : "";
  const showJapanesePreview = isJa && japanesePreview !== typed;

  const play = useCallback(
    (text: string) => {
      void playJaAudio(text, ttsLang);
    },
    [ttsLang],
  );

  /** Conservative SRS credit: only a correct answer touches the production
   *  modality of each atom the item exercised (never demotes — Spencer's
   *  "only review cards count" invariant respected). */
  const creditSrs = useCallback((current: PracticeItem, retried: boolean) => {
    for (const atomId of current.exercisedAtomIds) {
      const state = getCardState(atomId) ?? createInitialState();
      const next = gradeFromLesson(state, "production", {
        correct: true,
        retried,
      });
      setCardState(atomId, next);
    }
  }, []);

  const gradeTyped = useCallback(
    (current: PracticeItem): boolean => {
      if (isKo) return koreanInputMatches(typed, current.target);
      const candidate = isJa ? wanakana.toKana(typed) : typed;
      return gradeTypedAnswer([current.target], candidate).correct;
    },
    [isJa, isKo, typed],
  );

  const handleCheck = () => {
    if (!item || typed.trim() === "") return;
    if (status === "correct" || status === "revealed") return;
    const correct = gradeTyped(item);
    if (correct) {
      setStatus("correct");
      setCorrectCount((n) => n + 1);
      creditSrs(item, hadWrong);
    } else {
      setStatus("wrong");
      setHadWrong(true);
    }
  };

  const handleReveal = () => {
    if (!item) return;
    setStatus("revealed");
  };

  const handleNext = () => {
    setTyped("");
    setStatus("typing");
    setHadWrong(false);
    setIdx((i) => i + 1);
  };

  const handleNewSession = () => {
    setIdx(0);
    setTyped("");
    setStatus("typing");
    setHadWrong(false);
    setCorrectCount(0);
    setSeed(Date.now());
  };

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.writing.title", { defaultValue: "Writing" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.writing.subtitle", {
          defaultValue: "Write sentences using words you know",
        })}
      </p>
    </div>
  );

  // Low-vocab / no-content — the engine returned nothing it could build from.
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="pencil" size={28} aria-hidden />}
          title={t("practice.writing.empty.title", {
            defaultValue: "Not enough words yet",
          })}
          description={t("practice.writing.empty.description", {
            defaultValue:
              "Keep learning to unlock writing practice — every prompt here is built from words you've already learned.",
          })}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        {header}
        <Card padding="lg" className="text-center">
          <Icon
            name="checkCircle"
            size={32}
            className="mx-auto text-success"
            aria-hidden
          />
          <p className="mt-3 text-lg font-bold text-text-primary">
            {t("practice.writing.done.title", { defaultValue: "Session complete" })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.writing.done.summary", {
              defaultValue: "You got {{correct}} of {{total}} right.",
              correct: correctCount,
              total: items.length,
            })}
          </p>
          <Button
            variant="primary"
            className="mt-5"
            onClick={handleNewSession}
          >
            {t("practice.writing.done.restart", { defaultValue: "New session" })}
          </Button>
        </Card>
      </div>
    );
  }

  const resolved = status === "correct" || status === "revealed";
  const progress = items.length ? ((idx + 1) / items.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {header}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
          <span>
            {t("practice.writing.progress", {
              defaultValue: "{{current}} of {{total}}",
              current: idx + 1,
              total: items.length,
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="sparkles" size={12} aria-hidden />
            {t("practice.writing.usingKnown", {
              defaultValue: "using words you know",
            })}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {item && (
        <Card padding="lg" className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {t("practice.writing.instruction", {
              defaultValue: "Write this in {{language}}:",
              language: languageName,
            })}
          </p>
          <p className="mt-4 text-2xl font-bold text-text-primary">
            {item.translation}
          </p>

          <form
            className="mx-auto mt-5 flex max-w-md items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
          >
            <input
              type="text"
              lang={ttsLang}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={resolved}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={t("practice.writing.inputAria", {
                defaultValue: "Your answer",
              })}
              placeholder={
                isKo
                  ? t("practice.writing.placeholderKo", {
                      defaultValue: "Type Korean, or English letters…",
                    })
                  : t("practice.writing.placeholder", {
                      defaultValue: "Type your answer…",
                    })
              }
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-lg text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
            />
            {!resolved && (
              <Button type="submit" variant="primary" disabled={typed.trim() === ""}>
                {t("practice.writing.check", { defaultValue: "Check" })}
              </Button>
            )}
          </form>

          {/* Live target-script compose preview (romaji → kana / Hangul). */}
          {!resolved && showJapanesePreview && (
            <PreviewLine
              label={t("practice.writing.kana", { defaultValue: "Kana" })}
              value={japanesePreview}
              lang="ja"
            />
          )}
          {!resolved && showKoreanPreview && (
            <PreviewLine
              label={t("practice.writing.hangul", { defaultValue: "Hangul" })}
              value={koreanPreview}
              lang="ko"
            />
          )}
          {!resolved && isKo && (
            <p className="mx-auto mt-1 max-w-md text-center text-xs text-text-muted">
              {t("practice.writing.koHint", {
                defaultValue:
                  "No Korean keyboard? Type in English letters — it converts to Hangul.",
              })}
            </p>
          )}

          {/* Wrong: a nudge (the reading) + retry / reveal, without giving the
              whole answer away yet. */}
          {status === "wrong" && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-error bg-error/10 p-3">
              <p className="text-xs text-text-muted">
                {t("practice.writing.notQuite", {
                  defaultValue: "Not quite — try again, or reveal the answer.",
                })}
              </p>
              {item.reading && (
                <p className="mt-1 text-sm text-text-secondary">
                  <span className="mr-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t("practice.writing.hint", { defaultValue: "Hint" })}
                  </span>
                  {item.reading}
                </p>
              )}
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReveal}>
                  <Icon name="eye" size={14} aria-hidden />
                  {t("practice.writing.reveal", { defaultValue: "Reveal answer" })}
                </Button>
              </div>
            </div>
          )}

          {/* Resolved: show the expected answer + reading + audio. */}
          {resolved && (
            <div
              className={`mx-auto mt-4 max-w-md rounded-lg border p-3 ${
                status === "correct"
                  ? "border-success bg-success/10"
                  : "border-border bg-surface-muted"
              }`}
            >
              <p className="text-xs text-text-muted">
                {status === "correct"
                  ? t("practice.writing.correct", { defaultValue: "Correct!" })
                  : t("practice.writing.answerLabel", {
                      defaultValue: "The answer was:",
                    })}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-xl font-bold text-text-primary" lang={ttsLang}>
                  {item.target}
                </p>
                <button
                  type="button"
                  onClick={() => play(item.target)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted"
                  aria-label={t("practice.writing.playAria", {
                    defaultValue: "Play audio",
                  })}
                >
                  <Icon name="volume" size={16} className="text-accent" />
                </button>
              </div>
              {item.reading && (
                <p className="mt-1 text-sm text-text-secondary">{item.reading}</p>
              )}
            </div>
          )}

          {resolved && (
            <div className="mt-4 flex items-center justify-center">
              <Button variant="primary" size="sm" onClick={handleNext}>
                {t("practice.writing.next", { defaultValue: "Next" })}
                <Icon name="arrowRight" size={14} aria-hidden />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/** Small romaji → target-script mirror shown under the input. */
function PreviewLine({
  label,
  value,
  lang,
}: {
  label: string;
  value: string;
  lang: string;
}) {
  return (
    <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary">
      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span lang={lang} className="text-lg font-semibold text-text-primary">
        {value}
      </span>
    </p>
  );
}
