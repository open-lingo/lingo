import { Link } from "react-router-dom";
import { cn } from "./cn";

type NavPillLinkProps = {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Pill-style nav link for admin / section switchers (token-based active state). */
export function NavPillLink({ to, isActive, children, className }: NavPillLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        isActive
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        className
      )}
    >
      {children}
    </Link>
  );
}
