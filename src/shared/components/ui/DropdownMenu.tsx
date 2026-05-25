import { useState, type ReactElement, type ReactNode } from "react";
import { Popover, type PopoverPlacement } from "./Popover";
import { cn } from "./cn";

export type DropdownMenuItem = {
  key: string;
  label: ReactNode;
  /** Optional leading icon node. */
  leading?: ReactNode;
  /** Optional trailing slot (e.g. shortcut hint). */
  trailing?: ReactNode;
  onSelect: () => void;
  /** Use the danger color for the label (destructive action). */
  danger?: boolean;
  /** Disable interaction. */
  disabled?: boolean;
};

export type DropdownMenuProps = {
  /** Element that opens the menu when clicked. */
  trigger: ReactElement;
  items: DropdownMenuItem[];
  placement?: PopoverPlacement;
  /** Override surface width. */
  width?: string;
  /** Accessible label for the menu. */
  ariaLabel?: string;
};

/**
 * Portal-based dropdown menu. Builds on {@link Popover} for positioning.
 *
 * Mobile behavior: positions like Popover (flips + clamps). For long lists
 * with mixed content, switch to a {@link Sheet} on mobile.
 */
export function DropdownMenu({
  trigger,
  items,
  placement = "bottom-start",
  width = "min-w-[180px]",
  ariaLabel,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placement={placement}
      width={width}
    >
      <ul role="menu" aria-label={ariaLabel} className="flex flex-col">
        {items.map((item) => (
          <li key={item.key} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                item.disabled
                  ? "cursor-not-allowed text-text-muted opacity-50"
                  : item.danger
                    ? "text-error hover:bg-error/10"
                    : "text-text-primary hover:bg-surface-muted",
              )}
            >
              {item.leading && (
                <span className="shrink-0 text-text-muted">{item.leading}</span>
              )}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.trailing && (
                <span className="ml-2 shrink-0 text-xs text-text-muted">{item.trailing}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
