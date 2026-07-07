import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  devMarkLessonsCompleted,
  isDevUnlockOn,
  setDevUnlock,
} from "@/shared/domain/mockProgress";
import { devForceAllGrammarDue } from "@/features/flashcards/engine/grammarSrs";
import { devUnlockAtomsForLessons } from "@/features/lesson/data/unlockLessonAtoms";

/**
 * Global dev panel (Spencer 2026-07-02: "?dev=1 needs to persist to all
 * pages" + a bypass-all-locks / mark-up-to-module tool).
 *
 * - `?dev=1` on ANY route turns dev mode on (persisted via the existing
 *   `lingo_dev_unlock` localStorage flag, which the Learn pathway and
 *   `useCourseLevel` both honor); `?dev=0` turns it off. The param is
 *   consumed (stripped from the URL) either way.
 * - Rendered ONLY in dev builds (`import.meta.env.DEV`, checked by the
 *   caller in Layout) so `?dev=1` on production is inert — the pre-ship
 *   rule that debug chrome never leaks to live users.
 * - Mutating actions reload the page: every consumer (course map, trainer
 *   unlocks, queues) derives from these stores at mount, and a reload is
 *   more honest than pretending the app re-derives everything live.
 */
export function DevPanel() {
  const [devMode, setDevMode] = useState(() => isDevUnlockOn());
  const [open, setOpen] = useState(false);
  const [uptoModule, setUptoModule] = useState(7);
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();

  // Consume ?dev=1 / ?dev=0 on any page.
  useEffect(() => {
    const dev = searchParams.get("dev");
    if (dev !== "1" && dev !== "0") return;
    const on = dev === "1";
    setDevUnlock(on);
    setDevMode(on);
    const next = new URLSearchParams(searchParams);
    next.delete("dev");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!devMode) return null;

  const markUpTo = () => {
    const course = getMockCourse(language?.id ?? "ja");
    const ids: string[] = [];
    for (const mod of course.modules) {
      const n = parseInt(mod.id.replace(/^m/, ""), 10);
      if (isNaN(n) || n > uptoModule) continue;
      for (const lesson of mod.lessons) ids.push(lesson.id);
    }
    devMarkLessonsCompleted(ids);
    // Completion alone doesn't feed the atom-derived surfaces (course deck,
    // grammar review queue, reached modules) — unlock the atoms too, locally
    // only, so the simulation matches a genuine learner. (2026-07-06: the
    // gap made the grammar deck look permanently empty on simulated
    // profiles.)
    devUnlockAtomsForLessons(ids);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-16 right-3 z-[70] flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-xl border-2 border-warning/60 bg-surface p-3 shadow-popover">
          <p className="text-xs font-bold uppercase tracking-wider text-warning">
            Dev panel
          </p>
          <label className="mt-3 flex items-center justify-between gap-2 text-sm text-text-primary">
            Bypass all locks
            <input
              type="checkbox"
              checked={isDevUnlockOn()}
              onChange={(e) => {
                setDevUnlock(e.target.checked);
                window.location.reload();
              }}
            />
          </label>
          <p className="mt-1 text-[11px] leading-snug text-text-muted">
            Pathway + course-level gates open everywhere (trainer types, drill
            pools, module pickers).
          </p>
          <div className="mt-3 border-t border-border pt-3">
            <label className="flex items-center justify-between gap-2 text-sm text-text-primary">
              Complete up to module
              <input
                type="number"
                min={1}
                max={30}
                value={uptoModule}
                onChange={(e) => setUptoModule(Number(e.target.value))}
                className="w-16 rounded border border-border bg-surface px-2 py-1 text-right text-sm"
              />
            </label>
            <button
              type="button"
              onClick={markUpTo}
              className="mt-2 w-full rounded-lg border border-warning/60 bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition hover:bg-warning/20"
            >
              Mark complete (local)
            </button>
            <p className="mt-1 text-[11px] leading-snug text-text-muted">
              Simulates a learner at module {uptoModule + 1}: real completion
              data + local atom unlocks, so course level, flashcard deck, and
              grammar queues all follow.
            </p>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                devForceAllGrammarDue();
                window.location.reload();
              }}
              className="w-full rounded-lg border border-warning/60 bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition hover:bg-warning/20"
            >
              Make all grammar due
            </button>
            <p className="mt-1 text-[11px] leading-snug text-text-muted">
              Forces every reviewed Track B point due now. Never-reviewed
              points already queue as new cards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDevUnlock(false);
              window.location.reload();
            }}
            className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition hover:text-text-primary"
          >
            Exit dev mode
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle dev panel"
        className="rounded-full border-2 border-warning/60 bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-warning shadow-popover transition hover:bg-warning/10"
      >
        dev
      </button>
    </div>
  );
}
