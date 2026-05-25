import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type NativeRadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">;

export type RadioProps = NativeRadioProps & {
  /** Optional inline label to the right of the dot. */
  label?: ReactNode;
};

/**
 * Themed radio button (native input + `accent-accent`).
 *
 * Mobile behavior: pair with `RadioGroup` for vertical stacking on small viewports.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, id, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type="radio"
      id={id}
      className={cn(
        "h-4 w-4 cursor-pointer border-border text-accent accent-accent",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...rest}
    />
  );

  if (!label) return input;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary">
      {input}
      <span>{label}</span>
    </label>
  );
});

export type RadioGroupProps = {
  /** Shared name attribute for all radios in this group. */
  name: string;
  /** Currently selected value (controlled). */
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: ReactNode; disabled?: boolean }[];
  /** Horizontal layout. Default vertical. */
  inline?: boolean;
  className?: string;
};

/** Convenience grouper that renders radios from a list of options. */
export function RadioGroup({
  name,
  value,
  onChange,
  options,
  inline,
  className,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        inline ? "flex flex-wrap gap-4" : "flex flex-col gap-2",
        className,
      )}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          disabled={opt.disabled}
          onChange={(e) => {
            if (e.target.checked) onChange(opt.value);
          }}
          label={opt.label}
        />
      ))}
    </div>
  );
}
