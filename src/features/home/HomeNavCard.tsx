import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { Card } from "@/shared/components/ui";
import { cn } from "@/shared/components/ui/cn";

export type HomeNavCardProps = {
  to: string;
  title: string;
  description: string;
  iconName: IconName;
  /** Accent-tinted icon well (default) or neutral surface */
  iconTone?: "accent" | "neutral";
  className?: string;
};

export function HomeNavCard({
  to,
  title,
  description,
  iconName,
  iconTone = "accent",
  className,
}: HomeNavCardProps) {
  return (
    <Link to={to} className={cn("block h-full", className)}>
      <Card
        className={cn(
          "group flex h-full items-center gap-4 p-4 transition",
          "hover:border-accent/60 hover:shadow-md",
          "focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            iconTone === "accent"
              ? "bg-accent-muted text-accent"
              : "bg-surface-muted text-text-secondary",
          )}
          aria-hidden
        >
          <Icon name={iconName} size={26} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{description}</p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "bg-surface-muted text-text-muted transition",
            "group-hover:bg-accent-muted group-hover:text-accent",
            "group-focus-within:bg-accent-muted group-focus-within:text-accent",
          )}
          aria-hidden
        >
          <Icon
            name="chevronRight"
            size={20}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </Card>
    </Link>
  );
}
