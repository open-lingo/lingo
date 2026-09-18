import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  children: string;
  className?: string;
};

/**
 * The post-answer explanation box shared by the cloze family
 * (ParticleClozeStepView, AgreementClozeStepView, ConjugationClozeStepView).
 *
 * TestFlight #191/#193 (b28, 2026-09-17): each of these views rendered its
 * `step.explanation` as a single unclamped `<p>` whenever `submitted` —
 * correct OR wrong. だいがくを そつぎょうすることになった (m34) wraps its
 * explanation to 5 lines at Spencer's font scale; stacked under a
 * two-line-wrapped correct option chip, that pushed CHECK/CONTINUE off a
 * 430×932 stage and forced a scrollbar the step was never meant to have.
 * CLAUDE.md § "Explanations: short, anchored, optional": explanation text
 * has a ~3-line budget, depth goes behind an expander.
 *
 * The fix keeps the box's rendered HEIGHT IDENTICAL in both states — the
 * expander does not grow the box (so the CTA below it never moves): on
 * mount, the collapsed (3-line-clamped) paragraph's own `clientHeight` is
 * measured once and reused as a `max-height` cap for BOTH states. "More"
 * swaps the paragraph from `line-clamp-3` (truncated, no scroll affordance)
 * to `overflow-y-auto` at that SAME pixel cap, so the rest of the text is
 * reached by scrolling the small box itself — "opens INSIDE the box" — not
 * by the box growing and shoving the CTA down, and not by the page scrolling.
 * A "More" toggle only renders at all when the text actually overflows 3
 * lines; a short explanation is unaffected.
 */
export function ExplanationBox({ children, className }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [capPx, setCapPx] = useState<number | null>(null);
  const pRef = useRef<HTMLParagraphElement | null>(null);

  // Measure the COLLAPSED (line-clamp-3) box once per explanation string —
  // this is what "3 short lines" resolves to at the live font size/scale,
  // so the cap tracks Spencer's accessibility font slider automatically
  // instead of hard-coding a px/rem guess (regression-classes C2).
  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el) return;
    setCapPx(el.clientHeight);
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setExpanded(false);
  }, [children]);

  return (
    <div
      className={`rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary ${className ?? ""}`}
    >
      <p
        ref={pRef}
        className={expanded ? "overflow-y-auto" : "line-clamp-3"}
        style={expanded && capPx != null ? { maxHeight: capPx } : undefined}
      >
        {children}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 block text-sm font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          {expanded
            ? t("lesson.feedback.less", "Less")
            : t("lesson.feedback.more", "More")}
        </button>
      )}
    </div>
  );
}
