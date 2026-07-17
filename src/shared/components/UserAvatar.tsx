import { useEffect, useState } from "react";
import { cn } from "@/shared/components/ui/cn";

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-14 w-14 text-xl",
} as const;

const statusDotSize = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
} as const;

export type UserAvatarStatus = "active" | "idle";

export type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  status?: UserAvatarStatus | null;
};

export function UserAvatar({
  name,
  src,
  size = "md",
  className,
  status,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const trimmed = src?.trim();

  useEffect(() => {
    setImgError(false);
  }, [trimmed]);

  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const showImage = Boolean(trimmed) && !imgError;

  const avatar = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-accent-foreground",
        sizeClasses[size],
        className,
      )}
      aria-hidden={showImage}
    >
      {showImage ? (
        <img
          src={trimmed}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initial
      )}
    </div>
  );

  if (!status) return avatar;

  return (
    <div className="relative inline-flex">
      {avatar}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface",
          statusDotSize[size],
          status === "active" ? "bg-success" : "bg-text-muted",
        )}
        aria-hidden
      />
    </div>
  );
}
