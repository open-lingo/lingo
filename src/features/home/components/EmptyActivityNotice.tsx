import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";

/**
 * Shown on Home for users with zero completed lessons. Replaces
 * HomeActivityPanel + ProgressSummary so a fresh account isn't greeted
 * by mock streak/XP/forum-thread data. Sets the expectation that
 * activity will populate as they learn.
 */
export function EmptyActivityNotice() {
  const { t } = useTranslation();
  return (
    <Card as="section" padding="md" className="border-dashed">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icon name="flame" size={20} aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            {t("home.emptyActivity.title", {
              defaultValue: "Your progress will appear here",
            })}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("home.emptyActivity.body", {
              defaultValue:
                "Finish your first lesson to start a streak, earn XP, and unlock review cards.",
            })}
          </p>
        </div>
      </div>
    </Card>
  );
}
