import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { Card } from "@/shared/components/ui/Card";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { BUILT_IN_THEMES } from "@/shared/theme/presets";
import { MOCK_COMMUNITY_THEMES } from "@/shared/theme/community-mock";
import type { IconName } from "@/shared/iconRegistry";
import { LanguageFlagsRow } from "./components/LanguageFlagsRow";

const THEME_COUNT = Object.keys(BUILT_IN_THEMES).length + MOCK_COMMUNITY_THEMES.length;
const COMMUNITY_DECK_COUNT = 20;
const LANGUAGE_COUNT = 7;

type WhyItem = { icon: IconName; key: string; titleDefault: string; descDefault: string };
const WHY_ITEMS: WhyItem[] = [
  {
    icon: "flame",
    key: "whyHonestPace",
    titleDefault: "Honest pace",
    descDefault: "Five-minute lessons, real coverage. No streak guilt, no fake gamification.",
  },
  {
    icon: "bookText",
    key: "whyRealCurriculum",
    titleDefault: "Real curriculum",
    descDefault: "Structured paths designed by language teachers — not auto-generated word lists.",
  },
  {
    icon: "layers",
    key: "whySrsRespect",
    titleDefault: "SRS that respects you",
    descDefault: "Spaced repetition, no infinite drills. Cards return when you're about to forget — not on a fixed schedule.",
  },
  {
    icon: "github",
    key: "whyYoursToFork",
    titleDefault: "Yours to fork",
    descDefault: "MIT-licensed. Import Anki decks. Build your own. The app is the source.",
  },
];

type FeatureItem = { icon: IconName; key: string; titleDefault: string; descDefault: string };
const FEATURES: FeatureItem[] = [
  {
    icon: "graduationCap",
    key: "featureCourses",
    titleDefault: "Structured courses",
    descDefault: "Hand-authored modules, with kana drilling and live speech recognition for Japanese.",
  },
  {
    icon: "bookOpen",
    key: "featureFlashcards",
    titleDefault: "SRS flashcards",
    descDefault: "Spaced repetition with audio, ruby text, and image support. Import Anki decks too.",
  },
  {
    icon: "bookText",
    key: "featureStories",
    titleDefault: "Stories with audio",
    descDefault: "Graded readers with synced TTS — tap any word for translation and example sentences.",
  },
  {
    icon: "pencil",
    key: "featureLetterPractice",
    titleDefault: "Letter practice",
    descDefault: "Animated stroke order, drawing with shape verification, multi-script (Hiragana, Katakana, Hangul, more).",
  },
  {
    icon: "layers",
    key: "featureParticles",
    titleDefault: "Grammar drills",
    descDefault: "Japanese particles surfaced as quick MCQ drills — not buried in a PDF.",
  },
  {
    icon: "star",
    key: "featureCommunityDecks",
    titleDefault: "Community decks",
    descDefault: "20+ user-built decks today. Share yours, browse theirs, fork the ones you like.",
  },
];

export function LandingPage() {
  const { t } = useTranslation();
  const availableCount = AVAILABLE_LEARNING_LANGUAGE_IDS.length;
  // If the visitor already picked a language elsewhere (LanguagePickerModal,
  // a previous `/get-started` attempt, etc.) the same sessionStorage key
  // pre-fills the preview path so they skip the picker on `/try`.
  let pendingLang: string | null = null;
  try {
    pendingLang =
      typeof window !== "undefined"
        ? sessionStorage.getItem("lingo_pending_language_id")
        : null;
  } catch {
    pendingLang = null;
  }
  const tryHref = pendingLang ? `/try?lang=${encodeURIComponent(pendingLang)}` : "/try";

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <section className="mx-auto max-w-5xl px-6 pb-9 pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-accent">
          <Icon name="flame" size={12} className="shrink-0" />
          {t("landing.heroEyebrow", "Built by learners · 100% open source")}
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-[clamp(2.25rem,6vw,4rem)] font-black leading-[1.05] tracking-[-0.02em] text-text-primary">
          {t("landing.heroHeadlineLead", "Pick a language.")}{" "}
          <span className="text-accent">
            {t("landing.heroHeadlineAccent", "Start in 60 seconds.")}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-[1.55] text-text-secondary">
          {t(
            "landing.heroSubtitle",
            "Structured courses, spaced-repetition flashcards, and story-based reading — all wrapped in a free, open-source app you actually own."
          )}
        </p>

        <div className="mt-7 flex flex-wrap items-stretch justify-center gap-3.5">
          {/* Lead with the no-signup taste — let visitors feel progress before
              the account ask (the invest-first funnel). "Get started" (signup)
              is the secondary door. */}
          <Link to={tryHref} className={composeButtonClasses({ variant: "primary-3d" })}>
            <Icon name="play" size={18} className="shrink-0" aria-hidden />
            {t("landing.tryItFree", "Try it free")}
          </Link>
          <Link
            to="/get-started"
            className={composeButtonClasses({
              variant: "outline",
              accent: true,
              size: "hero",
              className: "border-[1.5px]",
            })}
          >
            {t("landing.getStarted", "Get started")}
            <Icon name="arrowRight" size={16} className="shrink-0" aria-hidden />
          </Link>
        </div>

        <p className="mt-3.5 text-[13px] text-text-muted">
          {t(
            "landing.heroMeta",
            "No credit card · No ads on the learning path · Free & open-source"
          )}
        </p>

        <LanguageFlagsRow
          label={t("landing.pickFromLanguages", "Pick from {{count}} languages", {
            count: LANGUAGE_COUNT,
          })}
          soonLabel={t("landing.soonBadge", "Soon")}
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
            {t("landing.whyEyebrow", "Why Lingo")}
          </p>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-tight text-text-primary">
            {t("landing.whyTitle", "Built for learners, not metrics")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-[1.55] text-text-secondary">
            {t("landing.whySubtitle", "Four reasons people stick with Lingo over the alternatives.")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_ITEMS.map(({ icon, key, titleDefault, descDefault }) => (
            <Card key={key} padding="md">
              <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-muted text-accent">
                <Icon name={icon} size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-text-primary">
                {t(`landing.${key}Title`, titleDefault)}
              </h3>
              <p className="mt-1.5 text-sm leading-[1.5] text-text-secondary">
                {t(`landing.${key}Desc`, descDefault)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
              {t("landing.featuresEyebrow", "What you get")}
            </p>
            <h2 className="mt-2 text-[32px] font-extrabold tracking-tight text-text-primary">
              {t("landing.featuresTitle", "Everything in one app")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[15px] leading-[1.55] text-text-secondary">
              {t("landing.featuresSubtitle", "The whole stack — no upsells, no plugins.")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, key, titleDefault, descDefault }) => (
              <Card key={key} padding="md" className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
                  <Icon name={icon} size={22} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">
                    {t(`landing.${key}`, titleDefault)}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.5] text-text-secondary">
                    {t(`landing.${key}Desc`, descDefault)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Card padding="lg" className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-[16rem] flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
                {t("landing.openEyebrow", "Open by default")}
              </p>
              <h3 className="mt-1.5 text-[22px] font-extrabold text-text-primary">
                {t("landing.openTitle", "Built in the open. Free forever.")}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-[1.55] text-text-secondary">
                {t(
                  "landing.openDesc",
                  "Every feature ships under MIT. Self-host if you want. Light ads fund the servers — and never touch the learning path."
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-6">
              <Stat value={`${COMMUNITY_DECK_COUNT}+`} label={t("landing.statDecks", "community decks")} />
              <Stat value={String(THEME_COUNT)} label={t("landing.statThemes", "themes")} />
              <Stat value={String(LANGUAGE_COUNT)} label={t("landing.statLanguages", "languages")} />
            </div>

            <div>
              <GitHubBadge />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center">
        <h2 className="text-[28px] font-extrabold text-text-primary">
          {t("landing.ctaTitle", "Ready to start learning?")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-text-secondary">
          {t("landing.ctaSubtitle", "Five minutes a day. Real progress in three weeks.")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link to={tryHref} className={composeButtonClasses({ variant: "primary-3d" })}>
            <Icon name="play" size={18} className="mr-2" aria-hidden />
            {t("landing.tryItFree", "Try it free")}
          </Link>
          <Link
            to="/get-started"
            className={composeButtonClasses({
              variant: "outline",
              accent: true,
              size: "hero",
              className: "border-[1.5px]",
            })}
          >
            {t("landing.getStarted", "Get started")}
            <Icon name="arrowRight" size={16} className="ml-2" aria-hidden />
          </Link>
        </div>
        {availableCount < LANGUAGE_COUNT && (
          <p className="mt-3 text-[12px] text-text-muted">
            {t("landing.ctaAvailability", "{{available}} of {{total}} languages live today; the rest are coming.", {
              available: availableCount,
              total: LANGUAGE_COUNT,
            })}
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-accent">{value}</div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted">
        {label}
      </div>
    </div>
  );
}
