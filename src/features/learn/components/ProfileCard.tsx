export type UserStats = {
  username: string;
  level: string;
  streak: number;
  xpToday: number;
  coins: number;
};

export type ProfileCardProps = {
  stats: UserStats;
  onOpenShop: () => void;
};

/** Right-rail top — avatar / username / level + stats grid + shop button. */
export function ProfileCard({ stats, onOpenShop }: ProfileCardProps) {
  const initial = stats.username.slice(0, 1).toUpperCase();
  return (
    <section className="rounded-2xl border-[1.5px] border-border bg-surface p-[18px] shadow-[0_1px_2px_0_rgb(15_23_42/0.06),0_2px_6px_-1px_rgb(15_23_42/0.05)]">
      <div className="mb-[14px] flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-bold text-text-primary">
            {stats.username}
          </p>
          <p className="m-0 mt-0.5 text-[12px] text-text-muted">
            {stats.level}
          </p>
        </div>
      </div>
      <div className="mb-[14px] grid grid-cols-3 gap-2">
        <StatTile
          icon="🔥"
          value={String(stats.streak)}
          label="Streak"
          tone="streak"
        />
        <StatTile icon="⚡" value={String(stats.xpToday)} label="XP today" />
        <StatTile
          icon="🪙"
          value={String(stats.coins)}
          label="Coins"
          tone="coins"
        />
      </div>
      <button
        type="button"
        onClick={onOpenShop}
        className="flex w-full items-center justify-center gap-2 rounded-[11px] border border-border bg-surface-muted px-3 py-2.5 text-[13px] font-semibold text-text-primary transition hover:border-accent hover:text-accent"
      >
        🛒 Shop · Streak Shield, Boosts
      </button>
    </section>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: string;
  label: string;
  tone?: "streak" | "coins";
}) {
  const valueColor =
    tone === "streak"
      ? "text-warning"
      : tone === "coins"
        ? "text-accent"
        : "text-text-primary";
  return (
    <div className="rounded-[10px] bg-surface-muted p-2 text-center">
      <div className={`text-[16px] font-extrabold ${valueColor}`}>
        <span className="mr-0.5 text-[14px]">{icon}</span>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </div>
    </div>
  );
}
