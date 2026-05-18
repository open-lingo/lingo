import { cn } from "@/shared/components/ui/cn";

type Props = {
  name: string;
  status: "active" | "idle";
};

export function FriendAvatar({ name, status }: Props) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-sm font-bold text-accent"
        aria-hidden
      >
        {initial}
      </span>
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
          status === "active" ? "bg-success" : "bg-text-muted",
        )}
        aria-hidden
      />
    </div>
  );
}
