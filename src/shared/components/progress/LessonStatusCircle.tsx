import { LockIcon } from "@/shared/components/icons";

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
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3 w-3";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${sizeClass} ${className} ${
        status === "completed"
          ? "border-emerald-500 bg-emerald-500 text-white"
          : status === "locked"
            ? "border-gray-400 bg-gray-200 text-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-400"
            : status === "incomplete"
              ? "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
              : "border-emerald-500 bg-white text-emerald-600 dark:bg-gray-800 dark:text-emerald-400"
      }`}
    >
      {status === "completed" ? (
        "✓"
      ) : status === "locked" ? (
        <LockIcon className={iconSize} />
      ) : status === "incomplete" ? (
        ""
      ) : (
        "·"
      )}
    </span>
  );
}
