import { useEffect, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useLangPath, useLang } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import type { Course, Lesson, SideQuest } from "@/shared/domain/course";
import { stringsFor } from "../transitStrings";
import {
  getModuleDisplay,
  getNextLessonIndex,
  type ModuleStatus,
} from "../moduleProgress";

/** A side-quest leg (one stop on a multi-lesson quest). */
export type QuestLeg = { title: string; lessonId: string; done: boolean };

/**
 * Module detail modal shared by the map (station click) and the list
 * ("view all") views — the arrivals-board outline of a module's lessons,
 * its side-quest stamp rally, and the module actions (Continue / Test out /
 * prev-next). Extracted from TransitLearnPage 2026-07-17 so both entry
 * points render the identical panel.
 */
export function DistrictView({
  course,
  index,
  statuses,
  completedSet,
  quests,
  legsFor,
  onQuest,
  onClose,
  onNav,
}: {
  course: Course;
  index: number;
  statuses: ModuleStatus[];
  completedSet: ReadonlySet<string>;
  quests: SideQuest[];
  legsFor: (q: SideQuest) => QuestLeg[] | null;
  onQuest: (q: SideQuest) => void;
  onClose: () => void;
  onNav: (index: number) => void;
}) {
  const p = useLangPath();
  const lang = useLang();
  const strings = stringsFor(lang ?? "ja");
  const mod = course.modules[index];
  const status = statuses[index];
  const nextIdx = getNextLessonIndex(mod.lessons, completedSet);
  const done = mod.lessons.filter((l) => completedSet.has(l.id)).length;
  const badge = getModuleDisplay(course.modules, index).badgeLabel;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stops = useMemo(() => {
    let x = 76;
    return mod.lessons.map((lesson, k) => {
      if (k > 0) x += lesson.kind === "recap" ? 112 : 92;
      const isDone = completedSet.has(lesson.id);
      const isCurrent = status === "current" && k === nextIdx && !isDone;
      return { lesson, k, x, isDone, isCurrent };
    });
  }, [mod, completedSet, status, nextIdx]);

  const lessonHref = (lesson: Lesson) =>
    lesson.kind === "alphabet" && lesson.alphabetId
      ? p(`practice/alphabet/${lesson.alphabetId}/learn`)
      : p(`learn/lessons/${lesson.id}`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${mod.title} district`}
    >
      <div className="tmc-district-panel w-full max-w-[900px] overflow-hidden rounded-md border-2 border-text-primary bg-surface shadow-popover" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 px-5 py-4" style={{ background: "var(--tmc-signage-bg)", color: "var(--tmc-signage-fg)" }}>
          <div className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[15px] font-extrabold" style={{ borderColor: "var(--tmc-signage-fg)", background: "var(--tmc-line-main)", color: "rgb(var(--color-on-accent))" }}>
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            {mod.eyebrow && <div className="text-[10.5px] uppercase tracking-[0.14em] opacity-70">{mod.eyebrow}</div>}
            <div className="truncate text-[19px] font-extrabold leading-tight">{mod.title}</div>
            <div className="text-[12px] opacity-75">
              {mod.comingSoon
                ? "Coming soon — lessons not yet authored"
                : `${done}/${mod.lessons.length} lessons${status === "locked" ? " · locked — complete the previous station" : ""}`}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close district view" className="grid h-9 w-9 flex-none place-items-center rounded-full hover:opacity-75" style={{ border: "2px solid var(--tmc-signage-fg)" }}>
            <Icon name="close" size={16} aria-hidden />
          </button>
        </div>

        {/* ── ARRIVALS BOARD: every lesson is a departure row ── */}
        <div className="max-h-[54vh] overflow-y-auto" style={{ background: "var(--tmc-signage-bg)", color: "var(--tmc-signage-fg)" }}>
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 text-[10px] uppercase tracking-[0.22em] opacity-60">
              <span>{strings.departuresBoard}</span>
              <span>
                {done}/{mod.lessons.length} {strings.doneStamp}
              </span>
            </div>
            {mod.comingSoon && (
              <div className="border-t border-white/10 px-4 py-6 text-[13px] opacity-70">
                {mod.summary ?? "This station is on the new course spine — its lessons are being written."}
              </div>
            )}
            {stops.map((s, i) => {
              const row = (
                <div
                  className={cn(
                    "tmc-board-row flex items-center gap-3 border-t border-white/10 px-4 py-2",
                    s.isCurrent && "bg-white/5",
                    status !== "locked" && "hover:bg-white/10",
                  )}
                  style={{ "--i": Math.min(i, 10) } as CSSProperties}
                >
                  <span
                    className="grid h-[24px] w-[34px] flex-none place-items-center rounded-[5px] text-[11px] font-extrabold text-accent-foreground"
                    style={{ background: s.lesson.kind === "recap" ? "var(--tmc-q1)" : "var(--tmc-line-main)", opacity: s.isDone || s.isCurrent || status !== "locked" ? 1 : 0.45 }}
                  >
                    {s.lesson.kind === "recap" ? strings.recapBadge : `L${s.k + 1}`}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate text-[13px] font-bold", !s.isDone && !s.isCurrent && "opacity-60")}>
                    {s.lesson.title}
                    {s.k === stops.length - 1 && <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-extrabold tracking-[0.14em] opacity-70"><Icon name="star" size={10} aria-hidden /> MASTERY</span>}
                  </span>
                  {s.isDone ? (
                    <span className="grid h-[22px] w-[22px] flex-none -rotate-12 place-items-center rounded-full text-[10px] font-bold text-accent-foreground" style={{ background: "var(--tmc-seal)" }}>
                      {strings.doneStamp}
                    </span>
                  ) : s.isCurrent ? (
                    <span className="flex-none rounded-sm bg-accent px-2.5 py-0.5 text-[10.5px] font-extrabold text-accent-foreground">NEXT ▶</span>
                  ) : (
                    <span className="flex-none text-[11px] opacity-40">·····</span>
                  )}
                </div>
              );
              return status === "locked" ? (
                <div key={s.lesson.id}>{row}</div>
              ) : (
                <Link key={s.lesson.id} to={lessonHref(s.lesson)} className="block" aria-label={`${s.lesson.title}${s.isDone ? ", completed" : s.isCurrent ? ", up next" : ""}`}>
                  {row}
                </Link>
              );
            })}
        </div>

        {/* ── SIDE QUESTS as a stamp rally strip ── */}
        {quests.length > 0 && (
          <div className="border-t border-border bg-surface-muted px-4 py-3">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-text-muted">{strings.stampRally}</span>
            </div>
            <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
              {quests.flatMap((q) => {
                const legs = legsFor(q);
                if (legs) {
                  return legs.map((leg, li) => {
                    const stamp = (
                      <span className="flex w-[68px] flex-col items-center gap-1">
                        {leg.done ? (
                          <span className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-extrabold text-accent-foreground shadow-card" style={{ background: "var(--tmc-seal)", transform: `rotate(${-14 + (li % 5) * 7}deg)`, border: "2.5px solid color-mix(in srgb, #fff 25%, var(--tmc-seal))" }}>
                            {strings.doneStamp}
                          </span>
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-border text-[13px]">{q.emoji}</span>
                        )}
                        <span className="max-w-[68px] truncate text-center text-[9.5px] leading-tight text-text-muted">{leg.title}</span>
                      </span>
                    );
                    // comingSoon sprint (content deleted, remake pending):
                    // stamps render but don't link anywhere.
                    return q.comingSoon ? (
                      <span key={leg.lessonId} className="opacity-50" aria-label={`${q.title}: ${leg.title}, coming soon`}>{stamp}</span>
                    ) : (
                      <Link key={leg.lessonId} to={lessonHref({ id: leg.lessonId, title: leg.title })} className="transition-transform hover:scale-105" aria-label={`${q.title}: ${leg.title}${leg.done ? ", stamped" : ""}`}>
                        {stamp}
                      </Link>
                    );
                  });
                }
                const stamped = q.progress >= 100;
                return (
                  <button key={q.id} onClick={() => onQuest(q)} disabled={q.comingSoon} className="transition-transform hover:scale-105 disabled:opacity-50" aria-label={`${q.title}${stamped ? ", stamped" : q.comingSoon ? ", coming soon" : ""}`}>
                    <span className="flex w-[76px] flex-col items-center gap-1">
                      {stamped ? (
                        <span className="grid h-10 w-10 place-items-center rounded-full text-[15px] shadow-card" style={{ background: "var(--tmc-seal)", transform: "rotate(-11deg)", border: "2.5px solid color-mix(in srgb, #fff 25%, var(--tmc-seal))" }}>
                          {q.emoji}
                        </span>
                      ) : (
                        <span className={cn("grid h-10 w-10 place-items-center rounded-full border-2 border-dashed text-[15px]", q.progress > 0 ? "border-accent" : "border-border")}>{q.emoji}</span>
                      )}
                      <span className="max-w-[76px] truncate text-center text-[9.5px] leading-tight text-text-muted">
                        {q.title}
                        {q.progress > 0 && q.progress < 100 ? ` · ${q.progress}%` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <button className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40" disabled={index === 0} onClick={() => onNav(index - 1)}>
            ← Previous station
          </button>
          <button className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40" disabled={index === course.modules.length - 1} onClick={() => onNav(index + 1)}>
            Next station →
          </button>
          <div className="flex-1" />
          {status !== "completed" && !mod.comingSoon && (
            <Link to={p(`learn/test-out/${mod.id}`)} className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:border-accent hover:text-text-primary">
              <Icon name="graduationCap" size={14} aria-hidden />
              Test out
            </Link>
          )}
          {status !== "locked" && stops[nextIdx] && (
            <Link to={lessonHref(stops[nextIdx].lesson)} className="rounded-sm bg-accent px-4 py-1.5 text-[12.5px] font-bold text-accent-foreground hover:bg-accent-hover">
              Continue L{nextIdx + 1} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
