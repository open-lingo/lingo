import type { Lesson } from "@/shared/domain/course";
import "./pathway.css";

export type ModulePreviewProps = {
  /** Title used in eyebrow + summary line ("7 lessons covering ..."). */
  summary?: string;
  lessons: Lesson[];
  comingSoon?: boolean;
};

export function ModulePreview({
  summary,
  lessons,
  comingSoon,
}: ModulePreviewProps) {
  return (
    <div className="lingo-preview-body">
      <p className="lingo-preview-eyebrow">
        {comingSoon ? "Coming soon" : "Peek at the lessons"}
      </p>
      {summary ? (
        <p className="m-0 text-[13px] text-text-secondary">{summary}</p>
      ) : null}
      {lessons.length > 0 ? (
        <div className="lingo-preview-list">
          {lessons.slice(0, 6).map((lesson, i) => (
            <div key={lesson.id} className="lingo-preview-item">
              <span className="lingo-pi-num">{i + 1}</span>
              {lesson.title}
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[12px] italic text-text-muted">
          Lesson content is still being authored — check back soon.
        </p>
      )}
    </div>
  );
}
