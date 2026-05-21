import type { LessonContent } from "@/features/lesson/types";

const KEY_PREFIX = "open-lingo-lesson-draft:v1:";
const INDEX_KEY = "open-lingo-lesson-draft-index:v1";

export type LessonDraft = {
  lessonId: string;
  updatedAt: string;
  content: LessonContent;
};

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // localStorage full or unavailable — ignore; index will rebuild
  }
}

export function listDraftIds(): string[] {
  return readIndex();
}

export function hasDraft(lessonId: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + lessonId) !== null;
  } catch {
    return false;
  }
}

export function loadDraft(lessonId: string): LessonDraft | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + lessonId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LessonDraft;
    if (!parsed?.content || typeof parsed.content !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(lessonId: string, content: LessonContent): LessonDraft {
  const draft: LessonDraft = {
    lessonId,
    updatedAt: new Date().toISOString(),
    content,
  };
  try {
    localStorage.setItem(KEY_PREFIX + lessonId, JSON.stringify(draft));
    const idx = readIndex();
    if (!idx.includes(lessonId)) writeIndex([...idx, lessonId]);
  } catch (err) {
    throw new Error(
      `Failed to save lesson draft: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
  return draft;
}

export function deleteDraft(lessonId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + lessonId);
    const idx = readIndex().filter((id) => id !== lessonId);
    writeIndex(idx);
  } catch {
    // ignore
  }
}

const SUBSCRIBERS = new Set<() => void>();

export function subscribeDrafts(fn: () => void): () => void {
  SUBSCRIBERS.add(fn);
  return () => {
    SUBSCRIBERS.delete(fn);
  };
}

export function notifyDraftChange(): void {
  for (const fn of SUBSCRIBERS) fn();
}
