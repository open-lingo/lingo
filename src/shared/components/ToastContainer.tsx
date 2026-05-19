import { useToast } from "@/shared/contexts/ToastContext";
import { Icon } from "@/shared/components/Icon";

const variantStyles: Record<string, string> = {
  success:
    "bg-emerald-600 text-white dark:bg-emerald-500",
  error:
    "bg-red-600 text-white dark:bg-red-500",
  info:
    "bg-gray-700 text-white dark:bg-gray-600",
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[var(--funding-meter-height,4.5rem)] left-4 right-4 z-[60] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${variantStyles[t.variant] ?? variantStyles.info}`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="ml-3 -mr-1 inline-flex shrink-0 rounded p-1 opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            <Icon name="close" size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
