/**
 * Cosmetic-ready avatar. The `frame` prop is the future hook for purchasable /
 * unlockable PFP rings. v1 of the social page renders a handful of frames so
 * Spencer can see the slot in action; the underlying type stays open-ended so
 * a real cosmetics system can drop in without breaking call sites.
 */
import { cn } from "@/shared/components/ui/cn";

export type AvatarFrame =
  | { kind: "none" }
  // Solid ring — single color from theme tokens or arbitrary hex.
  | { kind: "solid"; color: string }
  // Conic / linear gradient ring — pass any valid CSS gradient string.
  | { kind: "gradient"; gradient: string }
  // Future: animated rings (sparkle, pulsate). Reserved.
  | { kind: "animated"; gradient: string };

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, { box: string; inner: string; text: string; status: string }> = {
  sm: { box: "h-9 w-9", inner: "h-8 w-8", text: "text-sm", status: "h-2.5 w-2.5" },
  md: { box: "h-11 w-11", inner: "h-10 w-10", text: "text-base", status: "h-3 w-3" },
  lg: { box: "h-14 w-14", inner: "h-[52px] w-[52px]", text: "text-xl", status: "h-3.5 w-3.5" },
  xl: { box: "h-20 w-20", inner: "h-[74px] w-[74px]", text: "text-3xl", status: "h-4 w-4" },
};

type Props = {
  name: string;
  /** Visual identity slot — when present, replaces initial letter. */
  imageUrl?: string;
  /** Live presence indicator. Omit for no dot. */
  status?: "active" | "idle";
  /** Cosmetic ring around the avatar. Defaults to none. */
  frame?: AvatarFrame;
  size?: Size;
  className?: string;
};

export function UserAvatar({
  name,
  imageUrl,
  status,
  frame = { kind: "none" },
  size = "md",
  className,
}: Props) {
  const s = SIZE[size];
  const initial = name.charAt(0).toUpperCase();

  const frameStyle: React.CSSProperties =
    frame.kind === "solid"
      ? { background: frame.color }
      : frame.kind === "gradient" || frame.kind === "animated"
        ? { background: frame.gradient }
        : {};

  const hasFrame = frame.kind !== "none";

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          s.box,
          hasFrame ? "p-[2px]" : "",
          frame.kind === "animated" ? "animate-pulse" : "",
        )}
        style={frameStyle}
      >
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-full bg-surface-muted",
            s.inner,
          )}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={cn("font-bold text-accent", s.text)} aria-hidden>
              {initial}
            </span>
          )}
        </div>
      </div>
      {status ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface",
            s.status,
            status === "active" ? "bg-success" : "bg-text-muted",
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
