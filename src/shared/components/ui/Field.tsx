import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "./cn";

export type FieldProps = {
  /** Field label shown above the control. */
  label?: ReactNode;
  /** Optional supporting text shown below the control. */
  helper?: ReactNode;
  /** Error message; when present, overrides `helper` styling. */
  error?: ReactNode;
  /** Render label inline (side-by-side with control) instead of stacked. */
  inline?: boolean;
  /** Show a "required" asterisk. */
  required?: boolean;
  /** Hide the visible label but keep it accessible (sr-only). */
  hideLabel?: boolean;
  /** Single form control element. Will receive id + aria-* automatically. */
  children: ReactElement;
  className?: string;
  /** Pass through the explicit field id (otherwise generated). */
  id?: string;
};

/**
 * Form field wrapper — pairs a label, helper / error text, and a single control.
 * Generates and wires `id` + `aria-describedby` + `aria-invalid` onto the child.
 *
 * Mobile behavior: stacks label above control; pass `inline` for side-by-side
 * (good for checkboxes / switches).
 */
export function Field({
  label,
  helper,
  error,
  inline,
  required,
  hideLabel,
  children,
  className,
  id: idProp,
}: FieldProps) {
  const reactId = useId();
  const id = idProp ?? `field-${reactId}`;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  type ControlProps = {
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  };
  const onlyChild = Children.only(children) as ReactElement<ControlProps>;
  const childProps = (onlyChild.props ?? {}) as ControlProps;
  const control = isValidElement(onlyChild)
    ? cloneElement(onlyChild, {
        id: childProps.id ?? id,
        "aria-describedby": [errorId, helperId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : childProps["aria-invalid"],
      } as ControlProps)
    : onlyChild;

  const labelNode = label && (
    <label
      htmlFor={id}
      className={cn(
        "text-sm font-medium text-text-primary",
        hideLabel && "sr-only",
      )}
    >
      {label}
      {required && <span className="ml-0.5 text-error">*</span>}
    </label>
  );

  return (
    <div
      className={cn(
        inline ? "flex items-center gap-3" : "flex flex-col gap-1.5",
        className,
      )}
    >
      {labelNode}
      <div className={inline ? "flex-1" : undefined}>{control}</div>
      {error ? (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export type FieldsetProps = {
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Grouping wrapper with semantic `<fieldset>` + `<legend>`. */
export function Fieldset({ legend, children, className }: FieldsetProps) {
  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      {legend && (
        <legend className="mb-1 text-sm font-semibold text-text-primary">
          {legend}
        </legend>
      )}
      {children}
    </fieldset>
  );
}
