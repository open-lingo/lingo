import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { LanguageConfig } from "@/shared/domain/languageConfig";

type Props = {
  name: string;
  language: LanguageConfig | null;
  /** Pre-built lang-prefixed href for the primary lesson CTA. */
  startLessonHref: string;
  /** Title of the first lesson (used in the CTA subline). */
  firstLessonTitle?: string;
};

export function WelcomeBanner({
  name,
  language,
  startLessonHref,
  firstLessonTitle,
}: Props) {
  const { t } = useTranslation();
  const hasBgImage = Boolean(language?.backgroundImage);
  const langName = language?.name ?? "";

  return (
    <section
      className="relative overflow-hidden rounded-card border border-border shadow-card"
      style={
        language?.backgroundImage
          ? {
              backgroundImage: `url(${language.backgroundImage})`,
              backgroundSize: language.backgroundImageFit ?? "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-accent)) 10%, transparent), color-mix(in srgb, rgb(var(--color-accent)) 2%, transparent))",
            }
      }
    >
      {/* dark: intentional — heavier overlay on dark themes for legibility over background images */}
      {hasBgImage ? (
        <span
          className="absolute inset-0 bg-black/55 dark:bg-black/65"
          aria-hidden
        />
      ) : null}

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-wider",
            hasBgImage ? "text-white/85" : "text-accent",
          )}
        >
          {t("home.welcome.kicker", { defaultValue: "Welcome to Lingo" })}
        </p>
        <h1
          className={cn(
            "mt-1 text-2xl font-extrabold leading-tight sm:text-3xl",
            hasBgImage ? "text-white" : "text-text-primary",
          )}
        >
          {t("home.welcome.headline", {
            defaultValue: "Hi {{name}} — let's start learning!",
            name,
          })}
        </h1>
        <p
          className={cn(
            "mt-2 max-w-xl text-base sm:text-lg",
            hasBgImage ? "text-white/90" : "text-text-secondary",
          )}
        >
          {langName
            ? t("home.welcome.subline", {
                defaultValue:
                  "Your first {{language}} lesson is ready. Five minutes is enough to feel the difference.",
                language: langName,
              })
            : t("home.welcome.sublineNoLang", {
                defaultValue:
                  "Pick a language to begin — five minutes is enough to feel the difference.",
              })}
        </p>

        <div className="mt-6">
          <Link
            to={startLessonHref}
            className={cn(
              "group inline-flex items-center gap-3 rounded-xl px-5 py-3 text-base font-semibold shadow-card transition",
              hasBgImage
                ? "bg-white text-accent hover:bg-white/90"
                : "bg-accent text-accent-foreground hover:bg-accent-hover",
            )}
          >
            <span>
              {t("home.welcome.startCta", {
                defaultValue: "Start your first lesson",
              })}
            </span>
            <Icon
              name="chevronRight"
              size={20}
              className="transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          {firstLessonTitle ? (
            <p
              className={cn(
                "mt-2 text-sm",
                hasBgImage ? "text-white/80" : "text-text-muted",
              )}
            >
              {t("home.welcome.firstLessonHint", {
                defaultValue: "Up first: {{title}}",
                title: firstLessonTitle,
              })}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
