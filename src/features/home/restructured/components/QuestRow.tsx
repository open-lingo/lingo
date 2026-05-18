import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";

type Props = {
  iconName: IconName;
  label: string;
  done: number;
  goal: number;
  xp: number;
};

export function QuestRow({ iconName, label, done, goal, xp }: Props) {
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const complete = done >= goal;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          complete ? "bg-success/15 text-success" : "bg-accent-muted text-accent",
        )}
        aria-hidden
      >
        <Icon name={complete ? "check" : iconName} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm font-medium",
              complete ? "text-text-secondary line-through" : "text-text-primary",
            )}
          >
            {label}
          </p>
          <span className="shrink-0 text-xs font-semibold text-text-muted">
            {done}/{goal}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn("h-full rounded-full", complete ? "bg-success" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="ml-1 shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
        +{xp} XP
      </span>
    </div>
  );
}
