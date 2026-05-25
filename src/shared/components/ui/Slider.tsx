import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

type NativeSliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export type SliderProps = NativeSliderProps & {
  /** Show the current value to the right of the slider. */
  showValue?: boolean;
  /** Function to format the value display. Default: identity. */
  formatValue?: (value: number) => string;
};

/**
 * Range input themed against the accent token.
 *
 * Mobile behavior: full-width by default; iOS uses the native picker thumb.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { showValue, formatValue, className, value, defaultValue, ...rest },
  ref,
) {
  const numeric = Number(
    value !== undefined ? value : defaultValue !== undefined ? defaultValue : 0,
  );
  const display = formatValue ? formatValue(numeric) : String(numeric);
  const slider = (
    <input
      ref={ref}
      type="range"
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-accent",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...rest}
    />
  );
  if (!showValue) return slider;
  return (
    <div className="flex w-full items-center gap-3">
      <div className="min-w-0 flex-1">{slider}</div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-muted">
        {display}
      </span>
    </div>
  );
});
