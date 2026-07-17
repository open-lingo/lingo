import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { Course } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getNextLessonIndex,
} from "../moduleProgress";

/**
 * Floating "resume" play button that fades in on the learn path, so a
 * learner can jump straight back into their current/next lesson without
 * opening a station/module first. Resolves the resume target the same way
 * the district "Continue" CTA does (current module → first incomplete
 * lesson), and honors the alphabet-lesson route shape.
 */
export function ResumeFab({
  course,
  completedSet,
}: {
  course: Course;
  completedSet: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const target = useMemo(() => {
    const modIdx = getCurrentModuleIndex(course, completedSet);
    const mod = course.modules[modIdx];
    if (!mod || mod.lessons.length === 0) return null;
    const lesson = mod.lessons[getNextLessonIndex(mod.lessons, completedSet)];
    if (!lesson) return null;
    const href =
      lesson.kind === "alphabet" && lesson.alphabetId
        ? langPath(`practice/alphabet/${lesson.alphabetId}/learn`)
        : langPath(`learn/lessons/${lesson.id}`);
    return { title: lesson.title, href };
  }, [course, completedSet, langPath]);

  if (!target) return null;

  return (
    <Link
      to={target.href}
      className="resume-fab pointer-events-auto absolute bottom-7 left-1/2 z-[6] inline-flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-accent py-2.5 pl-3.5 pr-5 text-sm font-bold text-accent-foreground shadow-popover transition hover:bg-accent-hover"
      aria-label={t("learn.resumeFab.aria", {
        defaultValue: "Resume: {{lesson}}",
        lesson: target.title,
      })}
    >
      <span className="grid size-7 flex-none place-items-center rounded-full bg-white/20">
        <Icon name="play" size={16} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.7rem] font-semibold uppercase tracking-wider opacity-80">
          {t("learn.resumeFab.kicker", { defaultValue: "Resume" })}
        </span>
        <span className="block truncate leading-tight">{target.title}</span>
      </span>
    </Link>
  );
}
