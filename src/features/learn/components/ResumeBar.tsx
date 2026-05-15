import "./pathway.css";

export type ResumeBarProps = {
  currentLessonTitle: string;
  currentModuleTitle: string;
  onResume: () => void;
};

export function ResumeBar({
  currentLessonTitle,
  currentModuleTitle,
  onResume,
}: ResumeBarProps) {
  if (!currentLessonTitle) return null;
  return (
    <div className="lingo-resume-bar">
      <div className="flex-1 text-[13px] font-semibold text-text-secondary">
        Current:{" "}
        <b className="text-text-primary">
          {currentLessonTitle} · {currentModuleTitle}
        </b>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:bg-accent-hover"
      >
        Return ›
      </button>
    </div>
  );
}
