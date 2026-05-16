import { isDevUnlockOn } from "@/shared/domain/mockProgress";

export type LearnDevPanelProps = {
  unlocked: boolean;
  onToggle: () => void;
  onClearProgress: () => void;
  onClearGraduatedVocab: () => void;
};

export function LearnDevPanel({
  unlocked,
  onToggle,
  onClearProgress,
  onClearGraduatedVocab,
}: LearnDevPanelProps) {
  if (!unlocked && !isDevUnlockOn()) return null;
  return (
    <div
      className="fixed bottom-[calc(var(--funding-meter-height,3.5rem)+4.5rem)] right-4 z-40 flex flex-col gap-2 rounded-xl border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-text-secondary backdrop-blur sm:bottom-[calc(var(--funding-meter-height,3.5rem)+5rem)]"
      aria-label="Developer tools"
    >
      <div className="font-semibold text-warning">DEV</div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={unlocked} onChange={onToggle} />
        Unlock all lessons
      </label>
      <button
        type="button"
        onClick={onClearProgress}
        className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
      >
        Clear progress
      </button>
      <button
        type="button"
        onClick={onClearGraduatedVocab}
        className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
      >
        Clear graduated vocab
      </button>
    </div>
  );
}
