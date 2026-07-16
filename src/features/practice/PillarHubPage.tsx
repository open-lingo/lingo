import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPillar } from "@/features/practice/pillars";

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
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-accent"
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

      <div className="grid gap-3 sm:grid-cols-2">
        {pillar.activities.map((a) => (
          <Link
            key={a.id}
            to={langPath(a.route)}
            className="group flex flex-col gap-1 rounded-card border border-border bg-surface p-4 transition hover:border-accent hover:bg-surface-muted"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-text-primary">
                {t(a.titleKey, { defaultValue: a.titleDefault })}
              </p>
              {a.isNew ? (
                <span className="rounded-full bg-accent-muted px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-accent">
                  {t("practice.pillars.newBadge", { defaultValue: "New" })}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-text-secondary">
              {t(a.descKey, { defaultValue: a.descDefault })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
