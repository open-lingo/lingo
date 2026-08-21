import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";

type Props = {
  className?: string;
  linkToShop?: boolean;
  size?: "sm" | "md";
};

export function LingotBalance({ className, linkToShop = true, size = "sm" }: Props) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { stats, isReady, isError } = useUserStats();

  // `isReady` only means the query SETTLED — it is true on error too, and the
  // error fallback (`DEFAULT_STATS`) has `lingots: 0`. Rendering that showed a
  // confident "0" to users who actually have a balance. Keep the em-dash
  // placeholder when the load failed: unknown is not zero.
  const known = isReady && !isError;
  const display = known ? stats.lingots.toLocaleString() : "—";
  const title = known
    ? t("nav.lingotsTooltip", { defaultValue: "{{count}} lingots", count: stats.lingots })
    : isError
      ? t("nav.lingotsUnavailable", { defaultValue: "Couldn't load your lingots" })
      : t("nav.lingotsLoading", { defaultValue: "Loading lingots…" });

  const inner = (
    <>
      <Icon name="gem" size={size === "sm" ? 14 : 16} aria-hidden />
      <span className="tabular-nums">{display}</span>
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-1 font-semibold text-accent transition",
    size === "sm" ? "text-xs" : "text-sm",
    linkToShop && "min-h-11 rounded-full bg-accent-muted px-3 hover:bg-accent-muted/80",
    className,
  );

  if (linkToShop) {
    return (
      <Link to={langPath("shop")} className={classes} title={title}>
        {inner}
      </Link>
    );
  }

  return (
    <span className={classes} title={title}>
      {inner}
    </span>
  );
}
