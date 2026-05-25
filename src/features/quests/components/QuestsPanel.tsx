import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ModalBase } from "@/shared/components/ModalBase";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { xpProgressToNextLevel } from "@/features/progress/leveling";
import type { Quest, QuestType } from "../types";
import { useQuests } from "../useQuests";
import { QuestRow } from "./QuestRow";
import { QuestProgressBar } from "./QuestProgressBar";

export type QuestsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Initial tab — daily by default. */
  initialTab?: QuestType | "all";
};

const TAB_ORDER: Array<QuestType | "all"> = [
  "all",
  "daily",
  "weekly",
  "random",
  "friend",
];

/**
 * Top-level "Your stats" panel — combines:
 *   - level + XP bar header
 *   - tabbed list of quests (all / daily / weekly / random / friend)
 *
 * Mounted as a modal from the LearnTopBar pill and the LearnSidebar.
 * Same component is reusable from other top-bars (practice/home) later.
 */
export function QuestsPanel({
  isOpen,
  onClose,
  initialTab = "all",
}: QuestsPanelProps) {
  const { t } = useTranslation();
  const { quests, claim } = useQuests();
  const { stats } = useUserStats();
  const [tab, setTab] = useState<QuestType | "all">(initialTab);

  const filtered = useMemo<Quest[]>(() => {
    if (tab === "all") return quests;
    return quests.filter((q) => q.type === tab);
  }, [quests, tab]);

  // Promote claimable to the top so the dopamine moment is one tap away.
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const rank: Record<Quest["status"], number> = {
          claimable: 0,
          active: 1,
          completed: 2,
          expired: 3,
        };
        return rank[a.status] - rank[b.status];
      }),
    [filtered],
  );

  const levelProgress = useMemo(
    () => xpProgressToNextLevel(stats.xp),
    [stats.xp],
  );

  if (!isOpen) return null;

  return (
    <ModalBase
      onClose={onClose}
      title={t("quests.panelTitle", { defaultValue: "Your quests" })}
      maxWidth="max-w-2xl"
    >
      <div className="flex max-h-[78vh] flex-col">
        {/* Level + XP header */}
        <section className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-text-muted">
                {t("quests.statsKicker", { defaultValue: "Level" })}
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-text-primary">
                {levelProgress.level}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Stat
                icon={<Icon name="flame" size={14} className="text-warning" />}
                value={stats.streak}
                label={t("quests.streakDays", { defaultValue: "days" })}
              />
              <Stat
                icon={<Icon name="gem" size={14} className="text-accent" />}
                value={stats.lingots}
                label={t("quests.lingots", { defaultValue: "lingots" })}
              />
              <Stat
                icon={<Icon name="star" size={14} className="text-warning" />}
                value={stats.xp}
                label="XP"
              />
            </div>
          </div>
          <div className="mt-3">
            <QuestProgressBar
              percent={levelProgress.percent}
              ariaLabel={t("quests.levelProgressAria", {
                defaultValue: "XP toward next level",
              })}
            />
            <p className="mt-1.5 text-[0.7rem] font-medium text-text-muted">
              {t("quests.levelProgressCaption", {
                defaultValue: "{{into}} / {{next}} XP to level {{n}}",
                into: levelProgress.intoLevel,
                next: levelProgress.toNext,
                n: levelProgress.level + 1,
              })}
            </p>
          </div>
        </section>

        {/* Tabs */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2"
          aria-label={t("quests.tabsAria", { defaultValue: "Quest categories" })}
        >
          {TAB_ORDER.map((id) => {
            const count =
              id === "all"
                ? quests.length
                : quests.filter((q) => q.type === id).length;
            const isActive = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary",
                )}
              >
                {t(`quests.tab.${id}`, {
                  defaultValue:
                    id === "all"
                      ? "All"
                      : id.charAt(0).toUpperCase() + id.slice(1),
                })}
                <span className="rounded-full bg-surface-muted px-1.5 text-[0.65rem] font-bold tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Body */}
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {sorted.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-surface-muted/60 p-4 text-center text-sm text-text-secondary">
              {t("quests.empty", {
                defaultValue: "No quests in this bucket right now.",
              })}
            </p>
          ) : (
            sorted.map((q) => (
              <QuestRow key={q.id} quest={q} onClaim={claim} />
            ))
          )}
        </div>
      </div>
    </ModalBase>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-base font-extrabold tabular-nums text-text-primary">
          {value}
        </span>
      </div>
      <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
