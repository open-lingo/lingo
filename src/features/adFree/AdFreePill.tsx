import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";
import { AD_FREE_AMBER_MS } from "./config";
import { useAdFreeStatus } from "./useAdFreeStatus";

function formatRemaining(ms: number, t: ReturnType<typeof useTranslation>["t"]): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      return t("adFree.pill.hoursOnly", { defaultValue: "{{hours}}h left", hours });
    }
    return t("adFree.pill.hoursAndMinutes", {
      defaultValue: "{{hours}}h {{minutes}}m left",
      hours,
      minutes: mins,
    });
  }
  return t("adFree.pill.minutesOnly", {
    defaultValue: "{{minutes}}m left",
    minutes: totalMinutes,
  });
}

/**
 * Small "ad-free · Xm left" pill rendered in the header.
 * Hidden when no ad-free window is active. Click → shop ad-free section.
 *
 * Goes amber when remaining time is below `AD_FREE_AMBER_MS`.
 */
export function AdFreePill({ className }: { className?: string }) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const status = useAdFreeStatus();

  if (!status.isActive) return null;

  const amber = status.remainingMs < AD_FREE_AMBER_MS;
  const remainingLabel = formatRemaining(status.remainingMs, t);

  return (
    <Link
      to={`${langPath("shop")}#ad-free`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition",
        amber
          ? "bg-warning/15 text-warning hover:bg-warning/25"
          : "bg-success/15 text-success hover:bg-success/25",
        className,
      )}
      title={t("adFree.pill.tooltip", {
        defaultValue: "Ad-free time active — click to manage",
      })}
      aria-label={t("adFree.pill.ariaLabel", {
        defaultValue: "Ad-free time: {{remaining}}",
        remaining: remainingLabel,
      })}
    >
      <Icon name="shieldCheck" size={14} aria-hidden />
      <span>
        <span className="hidden sm:inline">
          {t("adFree.pill.prefix", { defaultValue: "ad-free" })} ·{" "}
        </span>
        {remainingLabel}
      </span>
    </Link>
  );
}
