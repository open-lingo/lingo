/**
 * Cosmetic-ready username. The `cosmetic` prop is the future hook for
 * purchasable/unlockable username effects: color swatches, gradients, and
 * inline badges. Default renders plain text-primary so every call site stays
 * harmless when no cosmetic is set.
 */
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";

export type UsernameCosmetic = {
  /** Solid color (theme token via CSS var or arbitrary hex). */
  color?: string;
  /** CSS gradient string — applied via background-clip when set. */
  gradient?: string;
  /** Small inline badge after the name (verified/founder/etc.). */
  badge?: { iconName: IconName; tone?: "accent" | "warning" | "success" };
  /** Font weight override (default semibold). */
  weight?: "normal" | "medium" | "semibold" | "bold";
};

const WEIGHT: Record<NonNullable<UsernameCosmetic["weight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const BADGE_TONE = {
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
};

type Props = {
  name: string;
  cosmetic?: UsernameCosmetic;
  className?: string;
};

export function UsernameDisplay({ name, cosmetic, className }: Props) {
  const c = cosmetic ?? {};
  const weight = WEIGHT[c.weight ?? "semibold"];

  const nameStyle: React.CSSProperties = c.gradient
    ? {
        backgroundImage: c.gradient,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }
    : c.color
      ? { color: c.color }
      : {};

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={cn(weight, !c.color && !c.gradient && "text-text-primary")} style={nameStyle}>
        {name}
      </span>
      {c.badge ? (
        <Icon
          name={c.badge.iconName}
          size={13}
          className={BADGE_TONE[c.badge.tone ?? "accent"]}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
