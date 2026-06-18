import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useQuests } from "@/features/quests/useQuests";
import { isQuestDone, summarizeDailyPlan } from "./planHelpers";

/**
 * Today's Plan — the momentum checklist, compacted into a half-card to match
 * its bento neighbours. Reads real daily quests from the server-authoritative
 * quest engine and answers "what should I do today?" via a slim progress
 * meter + a single spotlight quest (the next one to knock out), instead of the
 * old full three-row checklist.
 */
export function TodaysPlan() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { quests, isLoading } = useQuests();

  const { daily, doneCount, allDone } = useMemo(
    () => summarizeDailyPlan(quests, 3),
    [quests],
  );
  const total = daily.length || 3;
  // Spotlight the next un-done quest — the one tap that moves the needle.
  const spotlight = useMemo(
    () => daily.find((q) => !isQuestDone(q)) ?? null,
    [daily],
  );

  return (
    <Card padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.plan.kicker", { defaultValue: "Today's plan" })}
          </p>
          <h2 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-text-primary sm:text-lg">
            <Icon name="target" size={18} className="text-accent" aria-hidden />
            {t("home.restructured.plan.headline", { defaultValue: "Build your momentum" })}
          </h2>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            allDone ? "bg-success/15 text-success" : "bg-accent-muted text-accent"
          }`}
        >
          {allDone ? <Icon name="checkCircle" size={14} aria-hidden /> : null}
          {t("home.restructured.plan.count", {
            defaultValue: "{{done}}/{{total}} done",
            done: doneCount,
            total,
          })}
        </span>
      </div>

      {/* Slim segmented meter — one tick per daily quest, filled as they
          complete. Replaces the tall three-row checklist. */}
      <div className="mt-3 flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < doneCount ? "bg-success" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* A smidgen of detail: the next quest to knock out (or an all-done
          note), with its live progress. */}
      {isLoading ? (
        <div className="mt-3 h-9 animate-pulse rounded-lg bg-border" aria-hidden />
      ) : daily.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">
          {t("home.restructured.plan.empty", {
            defaultValue: "No quests right now — check back tomorrow.",
          })}
        </p>
      ) : spotlight ? (
        <div className="mt-3 flex items-center gap-2.5">
          <Icon name="circle" size={18} className="shrink-0 text-text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {t(spotlight.title, { defaultValue: spotlight.title })}
            </p>
            <p className="text-xs text-text-muted">
              {spotlight.progress.current}/{spotlight.progress.target} {spotlight.progress.unit}
            </p>
          </div>
          {spotlight.rewards.xp ? (
            <span className="shrink-0 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-bold text-accent">
              +{spotlight.rewards.xp} XP
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="checkCircle" size={16} aria-hidden />
          {t("home.restructured.plan.allDoneNote", {
            defaultValue: "Daily plan complete — nice work.",
          })}
        </p>
      )}

      <Link
        to={langPath("learn")}
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
      >
        {allDone
          ? t("home.restructured.plan.allDoneCta", { defaultValue: "All done — keep practising" })
          : t("home.restructured.plan.cta", { defaultValue: "Knock one out" })}
        <Icon name="chevronRight" size={16} aria-hidden />
      </Link>
    </Card>
  );
}
