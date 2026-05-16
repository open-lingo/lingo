import { Icon } from "@/shared/components/Icon";
import { Button } from "@/shared/components/ui";
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
      <div className="min-w-0 flex-1 text-sm font-medium text-text-secondary">
        Current:{" "}
        <span className="text-text-primary">
          {currentLessonTitle} · {currentModuleTitle}
        </span>
      </div>
      <Button type="button" variant="primary" size="sm" onClick={onResume}>
        Return
        <Icon name="chevronRight" size={14} className="ml-0.5" aria-hidden />
      </Button>
    </div>
  );
}
