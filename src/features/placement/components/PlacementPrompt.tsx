import { useEffect, useRef } from "react";
import { Icon } from "@/shared/components/Icon";

type Props = {
  onStart: () => void;
  onSkip: () => void;
};

export function PlacementPrompt({ onStart, onSkip }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the first button on mount
    const modal = modalRef.current;
    if (!modal) return;
    const firstButton = modal.querySelector<HTMLElement>("button");
    firstButton?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onSkip();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modal!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="placement-prompt-heading"
        className="w-full max-w-md rounded-2xl bg-surface-primary p-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Icon name="zap" size={24} className="text-accent" />
          </div>
          <h2
            id="placement-prompt-heading"
            className="text-xl font-bold text-text-primary"
          >
            Placement Test
          </h2>
        </div>

        <p className="mt-4 text-text-secondary">
          Already know some Japanese? Take a 2-minute placement test to skip
          ahead to the right level. You can also test out of individual modules
          later.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onStart}
            className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-md hover:bg-accent-hover active:scale-[0.98]"
          >
            Take the test
          </button>
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl border border-border-primary px-4 py-3 font-semibold text-text-secondary hover:bg-surface-muted active:scale-[0.98]"
          >
            Start from scratch
          </button>
        </div>
      </div>
    </div>
  );
}
