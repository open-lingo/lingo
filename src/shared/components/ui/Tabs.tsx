import { Link } from "react-router-dom";

type TabListProps = {
  children: React.ReactNode;
  "aria-label"?: string;
  className?: string;
};

export function TabList({
  children,
  "aria-label": ariaLabel,
  className = "",
}: TabListProps) {
  return (
    <nav
      className={`flex gap-1 border-b border-border ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </nav>
  );
}

type TabLinkProps = {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
};

export function TabLink({
  to,
  isActive,
  children,
  className = "",
}: TabLinkProps) {
  return (
    <Link
      to={to}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "border-accent text-accent"
          : "border-transparent text-text-secondary hover:border-border hover:text-text-primary"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export function TabButton({
  isActive,
  onClick,
  children,
  className = "",
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "border-accent text-accent"
          : "border-transparent text-text-secondary hover:border-border hover:text-text-primary"
      } ${className}`}
    >
      {children}
    </button>
  );
}
