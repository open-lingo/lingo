import { useTranslation } from "react-i18next";
import { Card, ProgressRing, WeekSparkline } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { getMockProgressSummary } from "@/shared/domain/mockProgress";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { MOCK_WEEK_MINUTES, MOCK_KANA_MASTERY } from "./mockHomeData";

// XP-per-level curve. Used only when the backend doesn't supply a level
// (DEFAULT_STATS.level is 1) so the UI can still show a sensible XP bar.
const XP_PER_LEVEL = 500;

function nextLevelXpFor(level: number) {
  // Simple linear curve. Replace if backend starts returning a target.
  return Math.max(1, level) * XP_PER_LEVEL;
}

export function AccountOverviewCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  // Real server-cached stats — falls back to zeros when backend not wired.
  const { stats } = useUserStats();
  // Mock data still feeds anything the backend doesn't yet provide
  // (daily-goal minutes, today's XP delta, kana mastery, week sparkline).
  const p = getMockProgressSummary();

  const dailyPct = Math.min(
    100,
    Math.round((p.dailyGoalCompletedMinutes / p.dailyGoalMinutes) * 100),
  );

  const xpTotal = stats.xp;
  // MOCK: backend doesn't yet surface "xp earned today" — keep the mock delta.
  const xpToday = p.xpEarnedToday ?? 0;
  const level = stats.level;
  const nextLevelXp = nextLevelXpFor(level);
  const levelPct = Math.min(100, Math.round((xpTotal / nextLevelXp) * 100));
  const xpToNext = Math.max(0, nextLevelXp - xpTotal);

  const weekTotalMin = MOCK_WEEK_MINUTES.reduce((a, b) => a + b, 0);
  const daysActiveThisWeek = MOCK_WEEK_MINUTES.filter((n) => n > 0).length;

  const isJa = language?.id === "ja";

  return (
    <Card padding="lg" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.account.kicker", { defaultValue: "Account overview" })}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary sm:text-xl">
            {t("home.restructured.account.headline", {
              defaultValue: "Your progress at a glance",
            })}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold text-accent">
          <Icon name="star" size={14} aria-hidden />
          {t("home.restructured.account.levelPill", {
            defaultValue: "Level {{level}}",
            level,
          })}
        </span>
      </div>

      {/* Top metric row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {/* Daily goal ring */}
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={dailyPct}
            label={`${p.dailyGoalCompletedMinutes}m`}
            sublabel={t("home.restructured.account.ringSublabel", { defaultValue: "goal" })}
            accentClass="text-accent"
          />
          <div>
            <p className="text-sm font-medium text-text-secondary">
              {t("home.restructured.account.dailyGoalLabel", { defaultValue: "Daily goal" })}
            </p>
            <p className="text-xs text-text-muted">
              {t("home.restructured.account.dailyGoalProgress", {
                defaultValue: "{{done}} / {{goal}} min today",
                done: p.dailyGoalCompletedMinutes,
                goal: p.dailyGoalMinutes,
              })}
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-[84px] w-[84px] items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-warning/10" aria-hidden />
            <Icon name="flame" size={42} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary leading-none">
              {stats.streak}
              <span className="ml-1 text-base font-medium text-text-secondary">
                {t("home.restructured.account.daysSuffix", { defaultValue: "days" })}
              </span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t("home.restructured.account.streakCaption", {
                defaultValue: "Current streak · best {{best}}",
                best: stats.bestStreak,
              })}
            </p>
          </div>
        </div>

        {/* Weekly sparkline */}
        <div>
          <p className="text-sm font-medium text-text-secondary">
            {t("home.restructured.account.weekLabel", { defaultValue: "This week" })}
          </p>
          <div className="mt-2">
            {/* MOCK: MOCK_WEEK_MINUTES — replace with store.completed aggregated per day. */}
            <WeekSparkline
              data={MOCK_WEEK_MINUTES}
              ariaLabel={t("home.restructured.account.weekAria", {
                defaultValue: "Minutes practiced per day this week",
              })}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {t("home.restructured.account.weekCaption", {
              defaultValue: "{{min}} min · {{days}} of 7 days",
              min: weekTotalMin,
              days: daysActiveThisWeek,
            })}
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-text-secondary">
            {t("home.restructured.account.xpLine", {
              defaultValue: "{{xp}} XP",
              xp: xpTotal.toLocaleString(),
            })}
            {xpToday > 0 ? (
              <span className="ml-1 text-accent">
                {t("home.restructured.account.xpToday", {
                  defaultValue: "+{{xp}} today",
                  xp: xpToday,
                })}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-text-muted">
            {t("home.restructured.account.xpToNext", {
              defaultValue: "{{xp}} XP to level {{level}}",
              xp: xpToNext,
              level: level + 1,
            })}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
            style={{ width: `${levelPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-text-secondary">
          <Icon name="gem" size={14} className="text-accent" aria-hidden />
          <span
            className="font-semibold text-text-primary"
            aria-label={t("account.lingotsAria", {
              defaultValue: "{{count}} lingots",
              count: stats.lingots,
            })}
          >
            {stats.lingots.toLocaleString()}
          </span>
          <span className="text-text-muted">
            {t("account.lingots", { defaultValue: "Lingots" })}
          </span>
        </div>
      </div>

      {/* Kana mastery — JA only */}
      {isJa ? (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {t("home.restructured.account.kanaTitle", {
                defaultValue: "Hiragana mastery",
              })}
            </p>
            <p className="text-xs text-text-secondary">
              {/* MOCK: MOCK_KANA_MASTERY — replace with JA kana SRS retention query. */}
              {t("home.restructured.account.kanaCaption", {
                defaultValue: "{{retained}} of {{total}} kana confidently retained",
                retained: MOCK_KANA_MASTERY.retained,
                total: MOCK_KANA_MASTERY.total,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-text-primary">{MOCK_KANA_MASTERY.percent}%</p>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              {t("home.restructured.account.kanaRetention", { defaultValue: "retention" })}
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
