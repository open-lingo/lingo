import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { MOCK_RECENT_PRACTICE } from "./mockHomeData";

export function RecentPracticeTile() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  // MOCK: replace with useLastPractice() localStorage hook populated by /practice/* routes.
  const recent = MOCK_RECENT_PRACTICE;

  return (
    <Link to={langPath(recent.href)} className="block h-full">
      <Card padding="sm" className="group h-full transition hover:border-accent/60 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent">
            <Icon name={recent.iconName} size={20} aria-hidden />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.recent.kicker", { defaultValue: "Recent" })}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-text-secondary">
          {t("home.restructured.recent.label", { defaultValue: "Continue practice" })}
        </p>
        <p className="text-base font-semibold text-text-primary leading-tight">
          {recent.title}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {t("home.restructured.recent.subtitle", {
            defaultValue: "Last reviewed {{hours}}h ago",
            hours: recent.subtitleHoursAgo,
          })}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent">
          {t("home.restructured.recent.cta", { defaultValue: "Pick up where you left off" })}
          <Icon
            name="chevronRight"
            size={16}
            className="transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Card>
    </Link>
  );
}
