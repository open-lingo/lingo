import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "./cn";

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">;

export type SearchInputProps = NativeProps & {
  value: string;
  onValueChange: (value: string) => void;
  /** Optional keyboard-shortcut hint rendered at the right (e.g. "⌘K"). */
  shortcutHint?: ReactNode;
  /** Hide the leading search icon. */
  hideIcon?: boolean;
  /** Hide the clear (×) button. */
  hideClear?: boolean;
  /** ARIA label for the clear button. */
  clearLabel?: string;
};

/**
 * Search-styled input with leading magnifier, clear-button, and optional
 * shortcut hint.
 *
 * Mobile behavior: full-width; consider `inputMode="search"` (default) so the
 * mobile keyboard shows a "Search" key.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onValueChange,
      shortcutHint,
      hideIcon,
      hideClear,
      clearLabel = "Clear",
      className,
      placeholder,
      ...rest
    },
    ref,
  ) {
    const showClear = !hideClear && value.length > 0;
    return (
      <div
        className={cn(
          "relative flex w-full items-center",
          className,
        )}
      >
        {!hideIcon && (
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 text-text-muted"
          />
        )}
        <input
          ref={ref}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-border bg-surface py-2 text-sm text-text-primary placeholder:text-text-muted",
            "transition focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
            !hideIcon ? "pl-8" : "pl-3",
            showClear || shortcutHint ? "pr-9" : "pr-3",
          )}
          {...rest}
        />
        {showClear ? (
          <button
            type="button"
            onClick={() => onValueChange("")}
            aria-label={clearLabel}
            className="absolute right-2 rounded p-1 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        ) : shortcutHint ? (
          <kbd className="pointer-events-none absolute right-2 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    );
  },
);
