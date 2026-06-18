import { forwardRef } from "react";
import { Icon } from "@/shared/components/Icon";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
import type { PopoverPlacement } from "./Popover";
import { cn } from "./cn";

export type { DropdownMenuItem as OverflowMenuItem };

export type OverflowMenuProps = {
  items: DropdownMenuItem[];
  /** Accessible label for the trigger + menu (e.g. "More actions for Ada"). */
  ariaLabel: string;
  placement?: PopoverPlacement;
  /** Icon orientation for the trigger. Defaults to vertical (kebab). */
  orientation?: "vertical" | "horizontal";
  /** Override surface width passed through to the menu. */
  width?: string;
  className?: string;
};

/**
 * OverflowMenu — the canonical 3-dot affordance. A square icon button that
 * opens a {@link DropdownMenu} of actions. Use this anywhere a row/card needs
 * a "more actions" overflow (contributors, friends, profile) so the trigger
 * styling and a11y stay consistent.
 */
const TriggerButton = forwardRef<
  HTMLButtonElement,
  {
    ariaLabel: string;
    orientation: "vertical" | "horizontal";
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function TriggerButton({ ariaLabel, orientation, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="menu"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
      {...rest}
    >
      <Icon
        name={orientation === "vertical" ? "moreVertical" : "moreHorizontal"}
        size={16}
        aria-hidden
      />
    </button>
  );
});

export function OverflowMenu({
  items,
  ariaLabel,
  placement = "bottom-end",
  orientation = "vertical",
  width,
  className,
}: OverflowMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <TriggerButton
          ariaLabel={ariaLabel}
          orientation={orientation}
          className={className}
        />
      }
      items={items}
      placement={placement}
      ariaLabel={ariaLabel}
      width={width}
    />
  );
}
