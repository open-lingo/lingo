import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useQuests } from "@/features/quests/useQuests";
import { isQuestDone, summarizeDailyPlan } from "./planHelpers";

/**
 * Today's Plan — the momentum checklist. Reads real daily quests from the
 * server-authoritative quest engine. Answers "what should I do today?" and
 * creates a small completion loop ("2/3 done").
 */
export function TodaysPlan() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { quests, isLoading } = useQuests();

  const { daily, doneCount, allDone } = useMemo(
    () => summarizeDailyPlan(quests, 3),
    [quests],
  );

  return (
    <Card padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.plan.kicker", { defaultValue: "Today's plan" })}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">
            {t("home.restructured.plan.headline", { defaultValue: "Build your momentum" })}
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            allDone ? "bg-success/15 text-success" : "bg-accent-muted text-accent"
          }`}
        >
          {allDone ? (
            <Icon name="checkCircle" size={14} aria-hidden />
          ) : (
            <Icon name="target" size={14} aria-hidden />
          )}
          {t("home.restructured.plan.count", {
            defaultValue: "{{done}}/{{total}} done",
            done: doneCount,
            total: daily.length || 3,
          })}
        </span>
      </div>

      {isLoading ? (
        <ul className="mt-4 space-y-2.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-border" />
              <div className="h-3.5 flex-1 rounded bg-border" />
              <div className="h-4 w-10 rounded-full bg-border" />
            </li>
          ))}
        </ul>
      ) : daily.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          {t("home.restructured.plan.empty", {
            defaultValue: "No quests right now — check back tomorrow.",
          })}
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {daily.map((q) => {
            const done = isQuestDone(q);
            return (
              <li
                key={q.id}
                className="flex items-center gap-3 rounded-lg px-1.5 py-1.5"
              >
                <Icon
                  name={done ? "checkCircle" : "circle"}
                  size={20}
                  className={done ? "shrink-0 text-success" : "shrink-0 text-text-muted"}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      done ? "text-text-muted line-through" : "text-text-primary"
                    }`}
                  >
                    {t(q.title, { defaultValue: q.title })}
                  </p>
                  {!done ? (
                    <p className="text-xs text-text-muted">
                      {q.progress.current}/{q.progress.target} {q.progress.unit}
                    </p>
                  ) : null}
                </div>
                {q.rewards.xp ? (
                  <span className="shrink-0 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-bold text-accent">
                    +{q.rewards.xp} XP
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to={langPath("learn")}
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 pt-1.5 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
      >
        {allDone
          ? t("home.restructured.plan.allDoneCta", { defaultValue: "All done — keep practising" })
          : t("home.restructured.plan.cta", { defaultValue: "Knock one out" })}
        <Icon name="chevronRight" size={16} aria-hidden />
      </Link>
    </Card>
  );
}
