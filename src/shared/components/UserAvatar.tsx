import { useEffect, useState } from "react";
import { cn } from "@/shared/components/ui/cn";

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-14 w-14 text-xl",
} as const;

export type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const trimmed = src?.trim();

  useEffect(() => {
    setImgError(false);
  }, [trimmed]);

  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const showImage = Boolean(trimmed) && !imgError;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-on-accent",
        sizeClasses[size],
        className,
      )}
      aria-hidden={showImage}
    >
      {showImage ? (
        <img
          src={trimmed}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}
