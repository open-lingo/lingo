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
  const { stats, isReady } = useUserStats();

  const display = isReady ? stats.lingots.toLocaleString() : "—";
  const title = isReady
    ? t("nav.lingotsTooltip", { defaultValue: "{{count}} lingots", count: stats.lingots })
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
    linkToShop && "rounded-full bg-accent-muted px-2 py-1 hover:bg-accent-muted/80",
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
