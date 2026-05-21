import type { LessonContent } from "@/features/lesson/types";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { hasDraft, listDraftIds, loadDraft } from "./lessonDraftStore";

export type LessonRow = {
  id: string;
  title: string;
  languageId: string;
  moduleId: string;
  stepCount: number;
  estimatedMinutes: number;
  kind?: LessonContent["kind"];
  hasDraft: boolean;
  /** Cross-course ordinal: lang+module+lesson position in the pathway.
   *  Lessons that aren't reachable from any course manifest get +Infinity. */
  ordinal: number;
  /** Module index within its language (0-based). */
  moduleIndex: number;
  /** Lesson index within its module (0-based). */
  lessonIndex: number;
};

const AUDITED_LANGS = ["ja", "ko"] as const;

function buildOrderMap(): Map<string, { ordinal: number; moduleIndex: number; lessonIndex: number }> {
  const map = new Map<string, { ordinal: number; moduleIndex: number; lessonIndex: number }>();
  let global = 0;
  for (const lang of AUDITED_LANGS) {
    let course;
    try {
      course = getMockCourse(lang);
    } catch {
      continue;
    }
    course.modules.forEach((mod, moduleIndex) => {
      mod.lessons.forEach((lesson, lessonIndex) => {
        if (!map.has(lesson.id)) {
          map.set(lesson.id, { ordinal: ++global, moduleIndex, lessonIndex });
        }
      });
    });
    for (const quest of course.sideQuests ?? []) {
      if (!map.has(quest.id)) {
        map.set(quest.id, { ordinal: ++global, moduleIndex: 99, lessonIndex: 0 });
      }
    }
  }
  return map;
}

/**
 * Snapshot of every lesson the runtime knows about, plus whether a local
 * draft exists. Read-only — does not mutate the underlying LESSONS map.
 */
export function listAllLessons(): LessonRow[] {
  const ids = getAvailableMockLessonIds();
  const draftIds = new Set(listDraftIds());
  const orderMap = buildOrderMap();
  const rows: LessonRow[] = [];
  for (const id of ids) {
    const content = getMockLessonContent(id);
    if (!content) continue;
    const order = orderMap.get(id);
    rows.push({
      id,
      title: content.title,
      languageId: content.languageId,
      moduleId: content.moduleId,
      stepCount: content.steps.length,
      estimatedMinutes: content.estimatedMinutes ?? 0,
      kind: content.kind,
      hasDraft: draftIds.has(id),
      ordinal: order?.ordinal ?? Number.POSITIVE_INFINITY,
      moduleIndex: order?.moduleIndex ?? 99,
      lessonIndex: order?.lessonIndex ?? 99,
    });
  }
  for (const draftId of draftIds) {
    if (ids.includes(draftId)) continue;
    const draft = loadDraft(draftId);
    if (!draft) continue;
    rows.push({
      id: draftId,
      title: draft.content.title + " (orphan)",
      languageId: draft.content.languageId,
      moduleId: draft.content.moduleId,
      stepCount: draft.content.steps.length,
      estimatedMinutes: draft.content.estimatedMinutes ?? 0,
      kind: draft.content.kind,
      hasDraft: true,
      ordinal: Number.POSITIVE_INFINITY,
      moduleIndex: 99,
      lessonIndex: 99,
    });
  }
  return rows.sort((a, b) => a.ordinal - b.ordinal || a.id.localeCompare(b.id));
}

/**
 * Resolve the effective LessonContent for editing. Draft (if any) wins over
 * source. The lesson player never sees this; it stays on
 * `getMockLessonContent`.
 */
export function getEditableLesson(id: string): {
  content: LessonContent | null;
  source: LessonContent | null;
  isDraft: boolean;
} {
  const source = getMockLessonContent(id);
  if (hasDraft(id)) {
    const draft = loadDraft(id);
    if (draft) {
      return { content: draft.content, source, isDraft: true };
    }
  }
  return { content: source, source, isDraft: false };
}
