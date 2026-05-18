import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { QuestRow } from "./components/QuestRow";
import { MOCK_DAILY_QUESTS, MOCK_WEEKLY_QUEST } from "./mockHomeData";

// MOCK: hours-until-reset is hardcoded; replace with real "ms until local midnight".
const MOCK_RESET_HOURS = 11;

export function QuestsCard() {
  const { t } = useTranslation();
  const wq = MOCK_WEEKLY_QUEST;
  const wqPct = Math.min(100, Math.round((wq.done / wq.goal) * 100));

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.quests.todayKicker", { defaultValue: "Today" })}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("home.restructured.quests.dailyHeadline", { defaultValue: "Daily quests" })}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold text-accent">
          <Icon name="partyPopper" size={14} aria-hidden />
          {t("home.restructured.quests.resetIn", {
            defaultValue: "Resets {{hours}}h",
            hours: MOCK_RESET_HOURS,
          })}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {/* MOCK: MOCK_DAILY_QUESTS — replace with quest engine (definition list + per-day progress). */}
        {MOCK_DAILY_QUESTS.map((q) => (
          <QuestRow
            key={q.id}
            iconName={q.iconName}
            label={t(q.labelKey, { defaultValue: q.labelDefault })}
            done={q.done}
            goal={q.goal}
            xp={q.xp}
          />
        ))}
      </div>

      {/* Weekly */}
      <div className="mt-auto rounded-xl border border-border bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("home.restructured.quests.weeklyKicker", { defaultValue: "Weekly goal" })}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">
              {/* MOCK: MOCK_WEEKLY_QUEST — replace with weekly quest definition. */}
              {t(wq.labelKey, { defaultValue: wq.labelDefault })}
            </p>
          </div>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
            +{wq.xp} XP
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
              style={{ width: `${wqPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {wq.done}/{wq.goal}
          </span>
        </div>
      </div>
    </Card>
  );
}
