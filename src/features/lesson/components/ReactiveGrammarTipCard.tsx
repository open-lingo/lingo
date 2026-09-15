import type { ReactiveGrammarTip } from "../types";
import { Icon } from "@/shared/components/Icon";
import { LessonOverlayCard } from "./overlays/LessonOverlayCard";
import { Badge } from "@/shared/components/ui";

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
  // The wrapper, the scrim, the card box and the capture-phase keyboard
  // swallow are all `LessonOverlayCard` now — including the `max-h` +
  // `overflow-y-auto` this file never had (TestFlight #132: "this info card
  // doesn't fit on the screen and has no scroll"). Its sibling
  // `RuleHintCard` had that one line and this one didn't, which is the whole
  // reason the primitive exists.
  return (
    <LessonOverlayCard labelledBy="grammar-tip-title" onDismissKey={onDismiss}>
        <Badge variant="eyebrow" tone="warning">
          Quick fix
        </Badge>
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
    </LessonOverlayCard>
  );
}
