import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Icon } from "@/shared/components/Icon";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { LanguagePickerGrid } from "@/features/home/LanguagePickerGrid";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { LessonProgressBar } from "@/features/lesson/components/LessonProgressBar";
import { LanguageSymbolMasteryProvider as KanaMasteryProvider } from "@/shared/symbolMastery/LanguageSymbolMasteryProvider";
import {
  AVAILABLE_LEARNING_LANGUAGE_IDS,
  getLanguageConfig,
} from "@/shared/domain/languageConfig";
import type { Language } from "@/shared/domain/languages";

import { getPreviewLesson, type PreviewLesson } from "./data/previewLessons";
import { marketingUrl } from "@/shared/config/marketing";

/**
 * Public no-auth "Try it free" preview lesson.
 *
 * - No `RequireAuth` wrapper at the route — anyone can land here.
 * - No persistence: results stay in component state, never written to
 *   localStorage / mockProgress / lessonProgress.
 * - No XP / accuracy stats at the end — the goal is "try it then sign
 *   up", not "feel scored".
 *
 * URL shapes:
 *   /try             → language picker
 *   /try?lang=ja     → preview lesson for ja (or "coming soon" stub)
 *
 * After completion (or for languages with no preview), routes to a
 * "Sign up to keep going" screen that hands the chosen language off to
 * /get-started via the existing `lingo_pending_language_id`
 * sessionStorage key.
 */
const PENDING_LANGUAGE_STORAGE_KEY = "lingo_pending_language_id";
/** Set when a visitor reaches the signup CTA from a preview, so the choice
 *  survives the Auth0 round-trip and LanguageContext can persist it. */
export const PREVIEW_COMPLETED_STORAGE_KEY = "lingo_preview_completed_lang";

export default function PreviewLessonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const langId = searchParams.get("lang");

  const handlePickLanguage = useCallback(
    (lang: Language) => {
      const next = new URLSearchParams(searchParams);
      next.set("lang", lang.id);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  if (!langId) {
    return <PreviewLanguagePicker onPick={handlePickLanguage} />;
  }

  return <PreviewForLanguage languageId={langId} />;
}

function PreviewLanguagePicker({
  onPick,
}: {
  onPick: (lang: Language) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-4 pb-40 pt-12 sm:pt-16">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-accent">
          <Icon name="play" size={12} className="shrink-0" />
          {t("preview.eyebrow", { defaultValue: "Free preview · no signup" })}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
          {t("preview.pickTitle", {
            defaultValue: "Which language do you want to try?",
          })}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
          {t("preview.pickSubtitle", {
            defaultValue:
              "Pick one and we'll walk you through a 2-minute taste — no account needed.",
          })}
        </p>
      </header>

      <div className="mt-10">
        <LanguagePickerGrid
          onSelect={onPick}
          headline=""
          subhead=""
          className=""
        />
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href={marketingUrl("/")}
          className="text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
        >
          {t("preview.backToLanding", {
            defaultValue: "← Back to landing",
          })}
        </a>
      </div>
    </div>
  );
}

function PreviewForLanguage({ languageId }: { languageId: string }) {
  const lesson = useMemo(() => getPreviewLesson(languageId), [languageId]);
  const config = getLanguageConfig(languageId);
  const available = (
    AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]
  ).includes(languageId);

  if (!lesson) {
    return (
      <PreviewComingSoon
        languageId={languageId}
        languageName={config?.name ?? languageId}
        available={available}
      />
    );
  }

  return (
    <KanaMasteryProvider>
      <PreviewRunner lesson={lesson} languageName={config?.name ?? languageId} />
    </KanaMasteryProvider>
  );
}

function PreviewRunner({
  lesson,
  languageName,
}: {
  lesson: PreviewLesson;
  languageName: string;
}) {
  const { t } = useTranslation();
  const [stepIdx, setStepIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  const totalSteps = lesson.steps.length;
  const currentStep = lesson.steps[stepIdx];

  // Preview is stateless on purpose — we only need correctness for the
  // "celebration" branch inside each step view, never for grading or
  // persistence. Discard the value at this boundary.
  const handleStepComplete = useCallback(() => {}, []);

  const handleContinue = useCallback(() => {
    if (stepIdx < totalSteps - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  }, [stepIdx, totalSteps]);

  if (finished) {
    return <PreviewFinished lesson={lesson} languageName={languageName} />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col">
      <div className="flex items-center gap-4 py-5">
        <a
          href={marketingUrl("/")}
          className="-ml-1 rounded-xl p-2.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("preview.exit", { defaultValue: "Exit preview" })}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.25}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </a>
        <LessonProgressBar current={stepIdx} total={totalSteps} />
      </div>

      <div className="flex flex-1 flex-col py-4 [container-type:size]">
        {currentStep && (
          <StepRenderer
            key={currentStep.id}
            step={currentStep}
            onComplete={handleStepComplete}
            onContinue={handleContinue}
          />
        )}
      </div>
    </div>
  );
}

function PreviewFinished({
  lesson,
  languageName,
}: {
  lesson: PreviewLesson;
  languageName: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent bg-accent-muted text-accent">
        <Icon name="partyPopper" size={40} />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
        {t("preview.lovedItTitle", {
          defaultValue: "Loved it? Keep going.",
        })}
      </h1>
      <p className="text-base text-text-secondary">
        {t("preview.lovedItSubtitle", {
          defaultValue:
            "You just tried {{count}} things in {{language}}. Sign up free to unlock the full course.",
          count: lesson.steps.length,
          language: languageName,
        })}
      </p>

      <SignupCta languageId={lesson.languageId} />

      <a
        href={marketingUrl("/")}
        className="text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
      >
        {t("preview.keepBrowsing", {
          defaultValue: "Or just keep browsing",
        })}
      </a>
    </div>
  );
}

function PreviewComingSoon({
  languageId,
  languageName,
  available,
}: {
  languageId: string;
  languageName: string;
  available: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Card padding="lg" className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent">
          <Icon name="flame" size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-text-primary">
          {available
            ? t("preview.comingSoonAvailableTitle", {
                defaultValue: "{{language}} preview is on the way",
                language: languageName,
              })
            : t("preview.comingSoonTitle", {
                defaultValue: "{{language}} is coming soon",
                language: languageName,
              })}
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          {available
            ? t("preview.comingSoonAvailableSubtitle", {
                defaultValue:
                  "We haven't authored a 2-minute taste for {{language}} yet — but the full course is live. Sign up to start it.",
                language: languageName,
              })
            : t("preview.comingSoonSubtitle", {
                defaultValue:
                  "{{language}} isn't live yet. Sign up and we'll let you know the moment it lands.",
                language: languageName,
              })}
        </p>

        <div className="mt-6">
          <SignupCta languageId={languageId} />
        </div>

        <div className="mt-5">
          <Link
            to="/try"
            className="text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
          >
            {t("preview.pickAnother", {
              defaultValue: "← Pick another language",
            })}
          </Link>
        </div>
      </Card>
    </div>
  );
}

function SignupCta({ languageId }: { languageId: string }) {
  const { t } = useTranslation();

  function handleStash() {
    try {
      sessionStorage.setItem(PENDING_LANGUAGE_STORAGE_KEY, languageId);
      // Mark that this signup is coming off a completed preview so the
      // post-auth experience doesn't treat the learner as cold.
      sessionStorage.setItem(PREVIEW_COMPLETED_STORAGE_KEY, languageId);
    } catch {
      // Private mode / disabled storage — /get-started will fall back
      // to its own picker.
    }
  }

  return (
    <Link
      to={`/get-started?lang=${encodeURIComponent(languageId)}`}
      onClick={handleStash}
      className={composeButtonClasses({ variant: "primary-3d" })}
    >
      {t("preview.signupCta", {
        defaultValue: "Sign up to keep going",
      })}
      <Icon name="arrowRight" size={18} className="ml-2" />
    </Link>
  );
}
