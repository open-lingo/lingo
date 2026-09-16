/**
 * `LessonOverlayCard` — the one in-lesson overlay: a scrim, a card, and the
 * keyboard capture that makes a card safe to open mid-step.
 *
 * WHY THIS EXISTS (TestFlight #132, and the `info-card-fit` class in
 * `docs/user-feedback/2026-09-15-recurring-complaints-rca.md` — five items
 * across two eras, "no scroll/max-height ever added"): `ReactiveGrammarTipCard`
 * and `RuleHintCard` shipped byte-identical wrapper strings and byte-identical
 * 15-line keyboard effects, and then diverged by exactly ONE line —
 * `RuleHintCard` grew `max-h-[85vh] overflow-y-auto`, the tip card did not. So
 * a long grammar tip ran off the bottom of a phone with no way to scroll it,
 * while its sibling was fine. That is not a bug you fix once; it is a bug you
 * stop being able to write. `max-h` + `overflow-y-auto` are DEFAULTS here, not
 * opt-in.
 *
 * NOT BUILT ON `shared/components/ui/Modal`, deliberately (the primitives
 * scope report suggested it). `Modal` portals into `document.body`, locks body
 * scroll, renders a header with a close button, runs its own focus trap and
 * `useEscapeKey`, and animates its own way. The two lesson cards need none of
 * that and DO need something Modal does not do: a capture-phase keydown
 * swallow. Step views listen for Enter on `document`
 * (`useLessonKeyboard`), so without it a desktop learner's habitual Enter
 * advances the lesson BEHIND the open card while the card's own button never
 * fires — a specific bug the original code comments were written against.
 * Rebuilding four working surfaces on a primitive that would have to grow two
 * behaviours anyway is a rewrite, not a migration; this keeps the wrapper
 * these cards actually shipped and de-duplicates it.
 *
 * `LessonIntro` is NOT a caller: it is a `pointer-events-none` page-wipe
 * curtain at `z-[60]` with no card, no dialog role and nothing to scroll.
 * Same `fixed inset-0`, different thing.
 */
import { useEffect, type ReactNode } from "react";

export type LessonOverlaySize = "sm" | "md" | "lg";

const sizeClasses: Record<LessonOverlaySize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function LessonOverlayCard({
  labelledBy,
  size = "md",
  align = "sheet",
  scrim = "soft",
  onDismissKey,
  children,
  className,
}: {
  /** Id of the element that names the dialog. */
  labelledBy?: string;
  /** Card max width. Default `md` (both lesson cards' `max-w-md`). */
  size?: LessonOverlaySize;
  /**
   * `sheet` = bottom sheet on a phone, centred from `sm:` up (what both
   * lesson cards ship). `center` = always centred (the row-test confirm).
   */
  align?: "sheet" | "center";
  /** Backdrop density: `soft` = black/40 (lesson cards), `dense` = black/50. */
  scrim?: "soft" | "dense";
  /**
   * Enter / Escape / Space dismissal, captured before the lesson's own
   * document-level Enter handler sees it. Omit for a card that must not be
   * dismissed by a stray keypress (a confirm dialog with two outcomes).
   */
  onDismissKey?: () => void;
  children: ReactNode;
  /** Extra classes on the CARD (not the scrim). */
  className?: string;
}) {
  useEffect(() => {
    if (!onDismissKey) return;
    // Capture phase, and it swallows EVERYTHING: the card owns the keyboard
    // while it is up. Enter/Escape/Space dismiss; every other key is
    // stopped from reaching `useLessonKeyboard` on document.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onDismissKey();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onDismissKey]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-4 ${
        align === "sheet" ? "items-end sm:items-center" : "items-center"
      } ${scrim === "dense" ? "bg-black/50" : "bg-black/40"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {/* `--card-pad` / `--card-max-h` are the overlay's token group (see
          `src/index.css`), so the QA page can dial card padding and the
          height cap the same way it dials tile padding. Defaults are p-5 and
          85dvh — today's shipped values (`dvh`, not `vh`, since 2026-09-16:
          this card is `position: fixed`, so the viewport IS its containing
          block, but `vh` resolves against iOS's LARGEST viewport and could cap
          it taller than what is on screen — see the token's comment). */}
      <div
        className={`w-full ${sizeClasses[size]} max-h-[var(--card-max-h)] overflow-y-auto rounded-2xl border-[1.5px] border-border bg-surface p-[var(--card-pad)] shadow-popover motion-safe:animate-fade-up ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
