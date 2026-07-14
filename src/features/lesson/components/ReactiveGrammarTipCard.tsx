import { useEffect } from "react";
import type { ReactiveGrammarTip } from "../types";
import { Icon } from "@/shared/components/Icon";

/**
 * Reactive grammar intervention (workshop A, 2026-07-12): flashes once per
 * grammar point per lesson session, at the moment the learner errs on a
 * step drilling that point. Shows the ✗/✓ contrast plus the rule line —
 * fault-targeted, unlike translate-and-describe explainers. The wrong form
 * is labeled and struck; it is never voiced and never typed.
 */
export function ReactiveGrammarTipCard({
  tip,
  onDismiss,
}: {
  tip: ReactiveGrammarTip;
  onDismiss: () => void;
}) {
  // Step views listen for Enter on document (useLessonKeyboard), so
  // without this a desktop learner's habitual Enter advances the lesson
  // BEHIND the open modal — and the button's own Enter never fires
  // (the hook preventDefault()s it). Capture-phase swallow: the modal
  // owns the keyboard while it's up; Enter/Escape/Space dismiss.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grammar-tip-title"
    >
      <div className="w-full max-w-md rounded-2xl border-[1.5px] border-border bg-surface p-5 shadow-popover motion-safe:animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-wider text-warning">
          Quick fix
        </p>
        <h2
          id="grammar-tip-title"
          className="mt-1 text-xl font-bold text-text-primary"
        >
          {tip.title}
        </h2>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/5 px-4 py-3">
            <Icon name="close" size={18} className="mt-1 shrink-0 text-error" aria-hidden />
            <p className="font-japanese text-lg text-text-secondary line-through decoration-error/70" lang="ja">
              {tip.wrongJa}
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
            <Icon name="check" size={18} className="mt-1 shrink-0 text-accent" aria-hidden />
            <p className="font-japanese text-lg font-semibold text-text-primary" lang="ja">
              {tip.rightJa}
            </p>
          </div>
        </div>

        <p className="mt-3 text-base leading-relaxed text-text-secondary">
          {tip.why}
        </p>

        <p className="mt-3 rounded-xl border border-info/40 bg-info/5 px-4 py-3 text-base leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">The rule again: </span>
          {tip.ruleLine}
        </p>

        {/* CTA stays put: fixed position in flow, full width, no size
            change on hover/focus — it must never jump under the cursor. */}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-base font-bold text-white transition-colors hover:bg-accent-hover"
        >
          Got it — try again
        </button>
      </div>
    </div>
  );
}
