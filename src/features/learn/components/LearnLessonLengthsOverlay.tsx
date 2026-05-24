import { useMemo } from "react";
import { ModalBackdrop } from "@/shared/components/ModalBackdrop";
import { Button } from "@/shared/components/ui/Button";
import { getMockLessonStats } from "@/features/lesson/data/mockLessons";

type Props = {
  onClose: () => void;
};

export function LearnLessonLengthsOverlay({ onClose }: Props) {
  const stats = useMemo(() => getMockLessonStats(), []);
  const grandLessons = stats.reduce((s, m) => s + m.totalLessons, 0);
  const grandSteps = stats.reduce((s, m) => s + m.totalSteps, 0);
  const grandMinutes = stats.reduce((s, m) => s + m.totalMinutes, 0);

  return (
    <ModalBackdrop onClose={onClose} ariaLabelledBy="lesson-lengths-title">
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-warning/40 bg-surface text-text-primary shadow-popover">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-baseline gap-3">
            <div
              id="lesson-lengths-title"
              className="text-sm font-bold uppercase tracking-wider text-warning"
            >
              DEV · Lesson lengths
            </div>
            <div className="text-xs text-text-muted">
              {grandLessons} lessons · {grandSteps} steps · ~{grandMinutes} min total
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {stats.map((mod) => (
            <div key={mod.moduleId} className="mb-5 last:mb-0">
              <div className="mb-1 flex items-baseline justify-between border-b border-border/60 pb-1">
                <div className="text-sm font-semibold">{mod.moduleId}</div>
                <div className="text-xs text-text-muted">
                  {mod.totalLessons} lessons · {mod.totalSteps} steps · ~{mod.totalMinutes} min
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="text-text-muted">
                  <tr>
                    <th className="px-1 py-1 text-left font-normal">id</th>
                    <th className="px-1 py-1 text-left font-normal">title</th>
                    <th className="px-1 py-1 text-right font-normal">steps</th>
                    <th className="px-1 py-1 text-right font-normal">min</th>
                    <th className="px-1 py-1 text-left font-normal">kind</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.lessons.map((l) => (
                    <tr key={l.id} className="border-t border-border/30">
                      <td className="px-1 py-1 font-mono text-text-secondary">{l.id}</td>
                      <td className="px-1 py-1">{l.title}</td>
                      <td className="px-1 py-1 text-right tabular-nums">{l.stepCount}</td>
                      <td className="px-1 py-1 text-right tabular-nums">{l.estimatedMinutes}</td>
                      <td className="px-1 py-1 text-text-muted">{l.kind ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
}
