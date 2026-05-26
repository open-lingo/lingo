import { Icon } from "@/shared/components/Icon";

export type LessonStatus = "completed" | "locked" | "available" | "incomplete";

type LessonStatusCircleProps = {
  status: LessonStatus;
  size?: "sm" | "default";
  className?: string;
};

export function LessonStatusCircle({
  status,
  size = "default",
  className = "",
}: LessonStatusCircleProps) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${sizeClass} ${className} ${
        status === "completed"
          ? "border-success bg-success text-white"
          : status === "locked"
            ? "border-border-muted bg-surface-muted text-text-muted"
            : status === "incomplete"
              ? "border-border bg-surface"
              : "border-accent bg-surface text-accent"
      }`}
    >
      {status === "completed" ? (
        <Icon name="check" size={12} className="text-white" strokeWidth={3} />
      ) : status === "locked" ? (
        <Icon name="lock" size={12} />
      ) : status === "incomplete" ? (
        ""
      ) : (
        "·"
      )}
    </span>
  );
}
