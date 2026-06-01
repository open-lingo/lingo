import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { LanguageConfig } from "@/shared/domain/languageConfig";
import type { NextLessonInfo } from "./types";
import { MOCK_HERO_PAUSED_HOURS_AGO } from "./mockHomeData";

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
  /** True when nextLesson is the user's mid-flight lesson (resume) rather
   *  than the next non-completed lesson. Drives the CTA copy. */
  isResume?: boolean;
};

export function HeroSection({
  name,
  language,
  startLessonHref,
  nextLesson,
  streakDays,
  moduleProgressPercent,
  lessonIndexLabel,
  isResume = false,
}: Props) {
  const { t } = useTranslation();
  const hasBg = Boolean(language?.backgroundImage);
  const langName = language?.name ?? null;

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
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/20 dark:from-black/80 dark:via-black/65"
          aria-hidden
        />
      ) : null}

      <div className="relative grid gap-6 px-6 py-8 sm:px-8 sm:py-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10">
        {/* Left: greeting + CTA */}
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.18em]",
              hasBg ? "text-white/85" : "text-accent",
            )}
          >
            {t("home.restructured.hero.kicker", { defaultValue: "Welcome back to Lingo" })}
          </p>
          <h1
            className={cn(
              "mt-2 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl",
              hasBg ? "text-white" : "text-text-primary",
            )}
          >
            {t("home.restructured.hero.headline", {
              defaultValue: "Hi {{name}} — let's keep going.",
              name,
            })}
          </h1>
          <p
            className={cn(
              "mt-2 max-w-md text-base sm:text-lg",
              hasBg ? "text-gray-100" : "text-text-secondary",
            )}
          >
            {streakDays > 0
              ? t("home.restructured.hero.sublineStreak", {
                  defaultValue:
                    "You're on a {{count}}-day streak. Five focused minutes will keep it alive.",
                  count: streakDays,
                })
              : t("home.restructured.hero.sublineNoStreak", {
                  defaultValue:
                    "Five focused minutes today is enough to feel the difference.",
                })}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={startLessonHref}
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-base font-semibold shadow-card transition",
                hasBg
                  ? "bg-white text-accent hover:bg-white/95"
                  : "bg-accent text-on-accent hover:bg-accent-hover",
              )}
            >
              {isResume
                ? t("home.restructured.hero.continueCta", {
                    defaultValue: "Continue lesson",
                  })
                : t("home.restructured.hero.startNextCta", {
                    defaultValue: "Start next lesson",
                  })}
              <Icon
                name="chevronRight"
                size={20}
                className="transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            {nextLesson ? (
              <p className={cn("text-sm", hasBg ? "text-gray-200" : "text-text-muted")}>
                {t("home.restructured.hero.upNext", { defaultValue: "Up next:" })}{" "}
                <span className="font-medium">{nextLesson.lesson.title}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: "where you left off" inset */}
        {nextLesson ? (
          <div
            className={cn(
              "relative rounded-2xl border p-5 backdrop-blur-md",
              hasBg
                ? "border-white/20 bg-white/10 text-white"
                : "border-border bg-surface-elevated/80",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    hasBg ? "text-white/75" : "text-text-muted",
                  )}
                >
                  {isResume
                    ? t("home.restructured.hero.leftOffKicker", {
                        defaultValue: "Where you left off",
                      })
                    : t("home.restructured.hero.upNextKicker", {
                        defaultValue: "Up next",
                      })}
                </p>
                <p
                  className={cn(
                    "mt-1 truncate font-semibold",
                    hasBg ? "text-white" : "text-text-primary",
                  )}
                >
                  {nextLesson.module}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    hasBg ? "text-gray-200" : "text-text-secondary",
                  )}
                >
                  {nextLesson.lesson.title}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  hasBg ? "bg-white/15 text-white" : "bg-accent-muted text-accent",
                )}
                aria-hidden
              >
                <Icon name="bookOpen" size={22} />
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className={cn(hasBg ? "text-white/80" : "text-text-secondary")}>
                  {lessonIndexLabel
                    ? t("home.restructured.hero.lessonOf", {
                        defaultValue: "Lesson {{current}} of {{total}}",
                        current: lessonIndexLabel.current,
                        total: lessonIndexLabel.total,
                      })
                    : t("home.restructured.hero.lessonProgress", {
                        defaultValue: "Lesson progress",
                      })}
                </span>
                <span
                  className={cn("font-semibold", hasBg ? "text-white" : "text-text-primary")}
                >
                  {moduleProgressPercent}%
                </span>
              </div>
              <div
                className={cn(
                  "mt-1.5 h-1.5 overflow-hidden rounded-full",
                  hasBg ? "bg-white/20" : "bg-surface-muted",
                )}
              >
                <div
                  className={cn("h-full rounded-full", hasBg ? "bg-white" : "bg-accent")}
                  style={{ width: `${moduleProgressPercent}%` }}
                />
              </div>
            </div>

            <p className={cn("mt-3 text-[11px]", hasBg ? "text-white/70" : "text-text-muted")}>
              {/* MOCK: replace MOCK_HERO_PAUSED_HOURS_AGO with telemetry-driven last-lesson-start timestamp. */}
              {langName
                ? t("home.restructured.hero.pausedAt", {
                    defaultValue: "{{language}} · paused {{hours}}h ago",
                    language: langName,
                    hours: MOCK_HERO_PAUSED_HOURS_AGO,
                  })
                : t("home.restructured.hero.pausedAtNoLang", {
                    defaultValue: "Paused {{hours}}h ago",
                    hours: MOCK_HERO_PAUSED_HOURS_AGO,
                  })}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
