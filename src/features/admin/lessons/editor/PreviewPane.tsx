import { useState } from "react";
import type { LessonStep } from "@/features/lesson/types";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { Icon } from "@/shared/components/Icon";

type Props = {
  step: LessonStep | null;
};

/**
 * Renders the currently-selected step through the live StepRenderer.
 * Inputs are wired to no-op handlers — preview is for visual feedback,
 * not progress recording.
 */
export function PreviewPane({ step }: Props) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Preview
        </span>
        <button
          onClick={() => setResetKey((k) => k + 1)}
          className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-text-primary"
          title="Reset preview state"
        >
          <Icon name="refresh" className="inline h-3 w-3" /> reset
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {!step ? (
          <p className="text-sm text-text-muted">
            Select a step on the left to preview it here.
          </p>
        ) : (
          <div key={`${step.id}-${resetKey}`} className="relative">
            <StepRenderer
              step={step}
              onComplete={() => {}}
              onContinue={() => {}}
            />
          </div>
        )}
      </div>
    </section>
  );
}
