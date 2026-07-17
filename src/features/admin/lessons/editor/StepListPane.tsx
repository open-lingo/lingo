import { useMemo, useState } from "react";
import { Icon } from "@/shared/components/Icon";
import type { LessonStep } from "@/features/lesson/types";
import { STEP_KINDS, newStepShell, summariseStep, type StepKind } from "./stepCatalog";

type Props = {
  steps: LessonStep[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onChange: (next: LessonStep[]) => void;
};

export function StepListPane({ steps, selectedIndex, onSelect, onChange }: Props) {
  const [adding, setAdding] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, { value: StepKind; label: string }[]>();
    for (const k of STEP_KINDS) {
      if (!map.has(k.group)) map.set(k.group, []);
      map.get(k.group)!.push({ value: k.value, label: k.label });
    }
    return Array.from(map.entries());
  }, []);

  const usedIds = useMemo(() => new Set(steps.map((s) => s.id)), [steps]);

  const insertAt = (idx: number, kind: StepKind) => {
    const id = generateStepId(kind, usedIds);
    const next = [...steps];
    next.splice(idx, 0, newStepShell(kind, id));
    onChange(next);
    onSelect(idx);
    setAdding(false);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    onChange(next);
    onSelect(to);
  };

  const remove = (idx: number) => {
    if (!confirm("Delete this step?")) return;
    const next = steps.filter((_, i) => i !== idx);
    onChange(next);
    onSelect(Math.max(0, Math.min(idx, next.length - 1)));
  };

  const duplicate = (idx: number) => {
    const src = steps[idx];
    const id = generateStepId(src.type, usedIds);
    const clone = JSON.parse(JSON.stringify({ ...src, id })) as LessonStep;
    const next = [...steps];
    next.splice(idx + 1, 0, clone);
    onChange(next);
    onSelect(idx + 1);
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Steps · {steps.length}
        </h3>
        <button
          className="rounded border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-primary hover:bg-surface-muted"
          onClick={() => setAdding(true)}
          title="Append a step"
        >
          <Icon name="plus" className="inline h-3 w-3" /> add
        </button>
      </header>

      <ol
        data-testid="lesson-step-list"
        className="min-h-0 flex-1 divide-y divide-border overflow-y-auto"
        style={{ maxHeight: "calc(60vh - 2.5rem)" }}
      >
        {steps.map((step, idx) => {
          const isSel = idx === selectedIndex;
          return (
            <li
              key={`${step.id}-${idx}`}
              className={`group cursor-pointer px-3 py-2 ${
                isSel
                  ? "bg-accent/10 ring-1 ring-inset ring-accent"
                  : "hover:bg-surface-muted"
              }`}
              onClick={() => onSelect(idx)}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-6 shrink-0 text-right font-mono text-[10px] tabular-nums text-text-muted">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[10px] uppercase text-text-secondary">
                      {step.type}
                    </span>
                    <span className="truncate font-mono text-[10px] text-text-muted">
                      {step.id}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-primary">
                    {summariseStep(step) || (
                      <span className="text-text-muted italic">empty</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    title="Move up"
                    className="rounded p-0.5 text-text-muted hover:bg-surface hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(idx, idx - 1);
                    }}
                  >
                    <Icon name="chevronUp" className="h-3 w-3" />
                  </button>
                  <button
                    title="Move down"
                    className="rounded p-0.5 text-text-muted hover:bg-surface hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(idx, idx + 1);
                    }}
                  >
                    <Icon name="chevronDown" className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {isSel && (
                <div className="mt-2 flex items-center justify-end gap-1">
                  <button
                    className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-text-muted hover:bg-surface-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicate(idx);
                    }}
                    title="Duplicate"
                  >
                    <Icon name="copy" className="inline h-3 w-3" /> dup
                  </button>
                  <button
                    className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-error hover:bg-error/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(idx);
                    }}
                    title="Delete"
                  >
                    <Icon name="trash" className="inline h-3 w-3" /> del
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {adding && (
        <div className="border-t border-border bg-surface-muted p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Insert step
            </span>
            <button
              className="text-text-muted hover:text-text-primary"
              onClick={() => setAdding(false)}
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((k) => (
                    <button
                      key={k.value}
                      className="rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-text-primary hover:bg-accent/10 hover:border-accent"
                      onClick={() => insertAt(steps.length, k.value)}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function generateStepId(kind: StepKind, used: Set<string>): string {
  const stem = kind.replace(/_/g, "-");
  let n = 1;
  while (used.has(`${stem}-${n}`)) n += 1;
  return `${stem}-${n}`;
}
