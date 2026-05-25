import { useRef } from "react";
import type { Course, Lesson } from "@/shared/domain/course";
import { LearnCourseMap } from "./LearnCourseMap";
import { BackToCurrentButton } from "./BackToCurrentButton";

export type LearnMapScrollAreaProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  devUnlock: boolean;
  langPath: (path: string) => string;
  isModuleOpen: (moduleId: string) => boolean;
  onToggleModule: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
};

/**
 * Scroll container that hosts the LearnCourseMap. The map becomes its
 * own overflow-y scroll region so the surrounding page (sidebar,
 * navigation, top-of-page hero) stays put as the learner pages through
 * the curriculum.
 *
 * Height strategy:
 *   - Desktop: fixed to `calc(100vh - <header offsets>)` so the
 *     map fills the remaining viewport. The exact subtract uses CSS
 *     var fallbacks so a future header-height refactor doesn't require
 *     touching this file.
 *   - Mobile (`lg:` breakpoint and below): the page itself remains the
 *     primary scroll container — we cap min-height instead so the user
 *     doesn't see a tiny embedded scroll area inside a tiny viewport.
 *
 * The BackToCurrentButton is mounted as a positioned sibling inside the
 * scroll container so it tracks the active `[data-current]` row.
 */
export function LearnMapScrollArea(props: LearnMapScrollAreaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hash the visible-state inputs so the IntersectionObserver re-binds
  // whenever the active node identity changes (e.g. user completes a
  // lesson and the next lesson becomes the new "current").
  const refreshKey = `${props.completedSet.size}|${props.course.id}`;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative overflow-y-auto overflow-x-hidden lg:max-h-[calc(100vh-12rem)] lg:rounded-xl lg:border lg:border-border lg:bg-surface/40 lg:p-2"
        style={{ scrollbarGutter: "stable" }}
        data-testid="learn-map-scroll"
      >
        <LearnCourseMap {...props} />
      </div>
      <BackToCurrentButton
        rootRef={containerRef}
        targetSelector='[data-current="true"]'
        refreshKey={refreshKey}
      />
    </div>
  );
}
