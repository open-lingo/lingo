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
          ? "border-emerald-500 bg-emerald-500 text-white"
          : status === "locked"
            ? "border-gray-400 bg-gray-200 text-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-400"
            : status === "incomplete"
              ? "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
              : "border-emerald-500 bg-white text-emerald-600 dark:bg-gray-800 dark:text-emerald-400"
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
