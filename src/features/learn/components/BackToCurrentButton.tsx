import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

export type BackToCurrentButtonProps = {
  /**
   * Either pass `targetRef` directly OR `targetSelector` (resolved
   * against the container at observe time — lets the active node remount
   * without re-keying the button).
   */
  targetRef?: RefObject<HTMLElement | null>;
  targetSelector?: string;
  /** Ref to the scrollable container (the map) we observe within. */
  rootRef: RefObject<HTMLElement | null>;
  /** Aria-label fallback when i18n is missing. */
  label?: string;
  /** Re-resolve the selector whenever this changes — usually a small
   *  hash like `${currentLessonId}|${completedCount}`. */
  refreshKey?: string;
};

/**
 * Floating button rendered inside the map scroll container. Watches the
 * active node (via ref OR selector) with an IntersectionObserver scoped
 * to `rootRef`; appears when the target leaves the visible area, hides
 * when it's back.
 *
 * On click: scrolls the target into the center of the container.
 *
 * Defensive: if neither ref nor selector resolves at mount, the button
 * stays hidden — no errors, no leaks (observer is conditionally
 * created).
 */
export function BackToCurrentButton({
  targetRef,
  targetSelector,
  rootRef,
  label,
  refreshKey,
}: BackToCurrentButtonProps) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(true);
  // Track the resolved target so the click handler doesn't re-query DOM.
  const resolvedTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const target =
      targetRef?.current ??
      (targetSelector
        ? root.querySelector<HTMLElement>(targetSelector)
        : null);
    if (!target) {
      // Hide if no target; nothing to observe.
      setHidden(true);
      resolvedTargetRef.current = null;
      return;
    }
    resolvedTargetRef.current = target;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Show the FAB when the target is NOT in view.
          setHidden(entry.isIntersecting);
        }
      },
      { root, threshold: 0.05 },
    );
    obs.observe(target);
    return () => {
      obs.disconnect();
      resolvedTargetRef.current = null;
    };
  }, [targetRef, targetSelector, rootRef, refreshKey]);

  const handleClick = useCallback(() => {
    const target = resolvedTargetRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (hidden) return null;

  const accessibleLabel =
    label ??
    t("learn.backToCurrent", {
      defaultValue: "Back to your current lesson",
    });

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={accessibleLabel}
      className="pointer-events-auto absolute bottom-4 right-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Icon name="arrowRight" size={16} aria-hidden className="rotate-90" />
      <span>
        {t("learn.backToCurrentShort", {
          defaultValue: "Back to current",
        })}
      </span>
    </button>
  );
}
