import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { LanguageConfig } from "@/shared/domain/languageConfig";
import type { NextLessonInfo } from "./types";

type Props = {
  name: string;
  language: LanguageConfig | null;
  startLessonHref: string;
  nextLesson: NextLessonInfo | null;
  streakDays: number;
  /** Module progress 0–100 — derived externally to keep this presentational. */
  moduleProgressPercent: number;
  /** "Lesson N of M" — derived externally. */
  lessonIndexLabel: { current: number; total: number } | null;
  isResume?: boolean;
  /** Account-level XP/level for the reward strip. */
  level: number;
  xpTotal: number;
  xpToNext: number;
  levelPct: number;
};

/**
 * The single dominant "Continue learning" hero — answers "what should I do?"
 * and "what reward am I about to earn?" in one block. Merges the old greeting
 * banner + the redundant right-side lesson card + the standalone account
 * overview (streak + XP-to-next-level) into one focused CTA.
 */
export function HeroContinue({
  name,
  language,
  startLessonHref,
  nextLesson,
  streakDays,
  moduleProgressPercent,
  lessonIndexLabel,
  isResume = false,
  level,
  xpTotal,
  xpToNext,
  levelPct,
}: Props) {
  const { t } = useTranslation();
  const hasBg = Boolean(language?.backgroundImage);
  const langName = language?.name ?? null;
  const langFlag = language?.flag ?? null;

  const ctaLabel = isResume
    ? t("home.restructured.hero.continueLearning", { defaultValue: "Continue learning" })
    : t("home.restructured.hero.startLearning", { defaultValue: "Start learning" });

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border shadow-card"
      style={
        language?.backgroundImage
          ? {
              backgroundImage: `url(${language.backgroundImage})`,
              backgroundSize: language.backgroundImageFit ?? "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "linear-gradient(135deg, rgb(var(--color-accent-rgb, 14 165 233) / 0.10), rgb(var(--color-accent-rgb, 14 165 233) / 0.02))",
            }
      }
    >
      {/* dark: intentional — heavier overlay on dark themes for legibility over background images */}
      {hasBg ? (
        <span
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/25 dark:from-black/85 dark:via-black/65"
          aria-hidden
        />
      ) : null}

      <div className="relative grid gap-4 px-6 py-5 sm:px-8 sm:py-6 md:grid-cols-[1.35fr_1fr] md:items-center md:gap-8">
        {/* Left: greeting + lesson + CTA */}
        <div className="min-w-0">
          <p
            className={cn(
              "flex items-center gap-1.5 text-base font-semibold sm:text-lg",
              hasBg ? "text-white/90" : "text-text-secondary",
            )}
          >
            <Icon name="hand" size={18} aria-hidden className="text-warning" />
            {t("home.restructured.hero.greeting", {
              defaultValue: "Hi {{name}}",
              name,
            })}
          </p>
          <h1
            className={cn(
              "mt-1 truncate text-2xl font-extrabold leading-tight sm:text-3xl",
              hasBg ? "text-white" : "text-text-primary",
            )}
          >
            {nextLesson
              ? isResume
                ? t("home.restructured.hero.continueTitle", {
                    defaultValue: "Continue {{title}}",
                    title: nextLesson.module,
                  })
                : t("home.restructured.hero.upNextTitle", {
                    defaultValue: "Up next: {{title}}",
                    title: nextLesson.module,
                  })
              : t("home.restructured.hero.keepGoing", {
                  defaultValue: "Let's keep going.",
                })}
          </h1>

          {nextLesson ? (
            <div className="mt-2 max-w-md">
              <div
                className={cn(
                  "flex items-center justify-between text-xs",
                  hasBg ? "text-white/85" : "text-text-secondary",
                )}
              >
                <span className="truncate">
                  {lessonIndexLabel
                    ? t("home.restructured.hero.lessonOfWithName", {
                        defaultValue: "Lesson {{current}} of {{total}} · {{title}}",
                        current: lessonIndexLabel.current,
                        total: lessonIndexLabel.total,
                        title: nextLesson.lesson.title,
                      })
                    : nextLesson.lesson.title}
                </span>
                <span className={cn("ml-2 font-semibold", hasBg ? "text-white" : "text-text-primary")}>
                  {moduleProgressPercent}%
                </span>
              </div>
              <div
                className={cn(
                  "mt-1.5 h-1.5 overflow-hidden rounded-full",
                  hasBg ? "bg-white/25" : "bg-surface-muted",
                )}
              >
                <div
                  className={cn("h-full rounded-full", hasBg ? "bg-white" : "bg-accent")}
                  style={{ width: `${moduleProgressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to={startLessonHref}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold shadow-card transition",
                hasBg
                  ? "bg-white text-accent hover:bg-white/95"
                  : "bg-accent text-on-accent hover:bg-accent-hover",
              )}
            >
              {ctaLabel}
              <Icon
                name="chevronRight"
                size={20}
                className="transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            {langName ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium",
                  hasBg ? "text-white/85" : "text-text-muted",
                )}
              >
                {langFlag ? (
                  <span aria-hidden className="text-base leading-none">
                    {langFlag}
                  </span>
                ) : null}
                {langName}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: reward strip — streak + level/XP-to-next (Duolingo-style) */}
        <div
          className={cn(
            "relative grid grid-cols-2 gap-3 rounded-2xl border p-4 backdrop-blur-md",
            hasBg
              ? "border-white/20 bg-white/10 text-white"
              : "border-border bg-surface-elevated/80",
          )}
        >
          {/* Streak */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-warning/10 px-2 py-3 text-center">
            <Icon name="flame" size={26} className="text-warning" aria-hidden />
            <span
              className={cn(
                "mt-1 text-2xl font-extrabold leading-none",
                hasBg ? "text-white" : "text-text-primary",
              )}
            >
              {streakDays}
            </span>
            <span className={cn("text-[11px]", hasBg ? "text-white/80" : "text-text-muted")}>
              {t("home.restructured.hero.dayStreak", { defaultValue: "day streak" })}
            </span>
          </div>

          {/* Level + XP */}
          <div className="flex flex-col justify-center rounded-xl bg-accent/10 px-3 py-3">
            <div className="flex items-center gap-1.5">
              <Icon name="star" size={16} className="text-accent" aria-hidden />
              <span
                className={cn(
                  "text-sm font-bold",
                  hasBg ? "text-white" : "text-text-primary",
                )}
              >
                {t("home.restructured.hero.levelLabel", {
                  defaultValue: "Level {{level}}",
                  level,
                })}
              </span>
            </div>
            <div className={cn("mt-2 h-2 overflow-hidden rounded-full", hasBg ? "bg-white/25" : "bg-surface-muted")}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
                style={{ width: `${levelPct}%` }}
              />
            </div>
            <span className={cn("mt-1.5 text-[11px] leading-tight", hasBg ? "text-white/80" : "text-text-muted")}>
              {t("home.restructured.hero.xpToNext", {
                defaultValue: "{{xp}} XP to level {{level}}",
                xp: xpToNext.toLocaleString(),
                level: level + 1,
              })}
            </span>
          </div>
          <p className={cn("col-span-2 text-center text-[11px]", hasBg ? "text-white/70" : "text-text-muted")}>
            {t("home.restructured.hero.totalXp", {
              defaultValue: "{{xp}} total XP",
              xp: xpTotal.toLocaleString(),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
