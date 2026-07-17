import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPillar } from "@/features/practice/pillars";
import { PracticeHubShell } from "@/features/practice/components/PracticeHubShell";

/**
 * Generic hub for the four skill pillars (reading/listening/speaking/
 * writing) at practice/pillar/:pillarId. Vocabulary and Grammar reuse
 * their existing hub pages instead. Unknown ids bounce to the practice
 * index.
 */
export function PillarHubPage() {
  const { pillarId = "" } = useParams();
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const pillar = getPillar(pillarId, language?.id ?? "ko", flags);

  if (!pillar) return <Navigate to={langPath("practice")} replace />;

  return (
    <PracticeHubShell chromeOffsetRem={11} fill={false} maxWidthClass="max-w-5xl">
      <header className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent"
          aria-hidden
        >
          <Icon name={pillar.icon} size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-text-primary sm:text-2xl">
            {t(pillar.titleKey, { defaultValue: pillar.titleDefault })}
          </h1>
          <p className="text-sm text-text-secondary">
            {t(pillar.taglineKey, { defaultValue: pillar.taglineDefault })}
          </p>
        </div>
      </header>

      {/* Pillar activities carry little content, so a comfortable card grid
          centered as a group (with the header) reads better than stretching
          them into hollow full-height cards. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {pillar.activities.map((a, i) => (
          <Link
            key={a.id}
            to={langPath(a.route)}
            className="group flex min-h-[8.5rem] flex-col justify-center gap-1.5 rounded-card border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 animate-[practice-rise_0.5s_ease_both] motion-reduce:animate-none"
            style={{ animationDelay: `${120 + i * 55}ms` }}
          >
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-text-primary">
                {t(a.titleKey, { defaultValue: a.titleDefault })}
              </p>
              {a.isNew ? (
                <span className="rounded-full bg-accent-muted px-1.5 py-px text-[0.625rem] font-bold uppercase tracking-wide text-accent">
                  {t("practice.pillars.newBadge", { defaultValue: "New" })}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-text-secondary">
              {t(a.descKey, { defaultValue: a.descDefault })}
            </p>
          </Link>
        ))}
      </div>
    </PracticeHubShell>
  );
}
