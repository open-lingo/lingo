import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { Icon } from "@/shared/components/Icon";
import { useToast } from "@/shared/contexts/ToastContext";
import { getEditableLesson } from "./lessonEnumeration";
import {
  deleteDraft,
  loadDraft,
  notifyDraftChange,
  saveDraft,
} from "./lessonDraftStore";
import { exportLessonAsTs } from "./exportLessonTs";
import { LessonMetadataPanel } from "./editor/LessonMetadataPanel";
import { StepListPane } from "./editor/StepListPane";
import { StepInspector } from "./editor/StepInspector";
import { PreviewPane } from "./editor/PreviewPane";

export function AdminLessonEditorPage() {
  const { lessonId: encodedId } = useParams<{ lessonId: string }>();
  const lessonId = encodedId ? decodeURIComponent(encodedId) : "";
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [original, setOriginal] = useState<LessonContent | null>(null);
  const [draft, setDraft] = useState<LessonContent | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    const { content, source } = getEditableLesson(lessonId);
    setOriginal(source);
    setDraft(content ? deepClone(content) : null);
    setSelectedIdx(0);
  }, [lessonId]);

  const isDraftExisting = useMemo(
    () => (lessonId ? loadDraft(lessonId) !== null : false),
    [lessonId, draft],
  );

  const dirty = useMemo(() => {
    if (!original || !draft) return false;
    return JSON.stringify(original) !== JSON.stringify(draft);
  }, [original, draft]);

  const tsSource = useMemo(
    () => (draft ? exportLessonAsTs(draft) : ""),
    [draft],
  );

  if (!lessonId) {
    return (
      <p className="text-text-muted">No lesson selected.</p>
    );
  }
  if (!draft) {
    return (
      <div className="space-y-3">
        <p className="text-text-muted">
          Lesson <code className="font-mono">{lessonId}</code> not found.
        </p>
        <Link
          to="/admin/content/lessons"
          className="rounded border border-border bg-surface px-3 py-1 text-sm text-text-primary hover:bg-surface-muted"
        >
          <Icon name="chevronLeft" className="inline h-3 w-3" /> back to list
        </Link>
      </div>
    );
  }

  const onMetaChange = (next: LessonContent) => setDraft(next);
  const onStepsChange = (next: LessonStep[]) =>
    setDraft({ ...draft, steps: next });
  const onStepChange = (next: LessonStep) => {
    const steps = [...draft.steps];
    steps[selectedIdx] = next;
    setDraft({ ...draft, steps });
  };

  const handleSave = () => {
    try {
      saveDraft(lessonId, draft);
      notifyDraftChange();
      setOriginal(deepClone(draft));
      showToast("Draft saved", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Save failed",
        "error",
      );
    }
  };

  const handleDiscard = () => {
    if (!confirm("Discard local draft and reload from source?")) return;
    deleteDraft(lessonId);
    notifyDraftChange();
    const { content, source } = getEditableLesson(lessonId);
    setOriginal(source);
    setDraft(content ? deepClone(content) : null);
    showToast("Draft discarded", "success");
  };

  const selectedStep = draft.steps[selectedIdx] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/admin/content/lessons")}
            className="rounded border border-border bg-surface-muted px-2 py-1 text-sm text-text-primary hover:bg-surface"
            title="Back to list"
          >
            <Icon name="chevronLeft" className="inline h-3.5 w-3.5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-serif text-lg font-semibold text-text-primary">
                {draft.title || <em>untitled</em>}
              </h1>
              <StatusPill dirty={dirty} hasDraft={isDraftExisting} />
            </div>
            <p className="truncate font-mono text-[11px] text-text-muted">
              {lessonId} · {draft.languageId} · {draft.moduleId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscard}
            disabled={!isDraftExisting && !dirty}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard draft
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            <Icon name="copy" className="inline h-3.5 w-3.5" /> Export TS
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="check" className="inline h-3.5 w-3.5" /> Save draft
          </button>
        </div>
      </header>

      <LessonMetadataPanel content={draft} onChange={onMetaChange} />

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 lg:h-[60vh]">
        <div className="col-span-12 flex min-h-0 flex-col lg:col-span-3 lg:h-full">
          <StepListPane
            steps={draft.steps}
            selectedIndex={selectedIdx}
            onSelect={setSelectedIdx}
            onChange={onStepsChange}
          />
        </div>
        <div className="col-span-12 flex min-h-0 flex-col lg:col-span-5 lg:h-full">
          {selectedStep ? (
            <StepInspector
              step={selectedStep}
              allSteps={draft.steps}
              onChange={onStepChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-card border border-dashed border-border bg-surface text-sm text-text-muted">
              No steps. Add one from the left panel.
            </div>
          )}
        </div>
        <div className="col-span-12 flex min-h-0 flex-col lg:col-span-4 lg:h-full">
          <PreviewPane step={selectedStep} />
        </div>
      </div>

      {showExport && (
        <ExportModal
          source={tsSource}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function StatusPill({ dirty, hasDraft }: { dirty: boolean; hasDraft: boolean }) {
  if (dirty) {
    return (
      <span className="rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-medium text-error">
        unsaved
      </span>
    );
  }
  if (hasDraft) {
    return (
      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
        draft saved
      </span>
    );
  }
  return (
    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
      source
    </span>
  );
}

function ExportModal({ source, onClose }: { source: string; onClose: () => void }) {
  const { showToast } = useToast();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
          <div>
            <h2 className="font-serif text-base font-semibold text-text-primary">
              Export as TypeScript
            </h2>
            <p className="text-xs text-text-muted">
              Copy into a new mock-*.ts file or paste over the existing one.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </header>
        <pre className="flex-1 overflow-auto bg-surface-muted/30 p-4 font-mono text-[11px] leading-snug text-text-primary">
          {source}
        </pre>
        <footer className="flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-4 py-3">
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(source)
                .then(() => showToast("Copied to clipboard", "success"))
                .catch(() => showToast("Copy failed", "error"));
            }}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Icon name="copy" className="inline h-3.5 w-3.5" /> Copy
          </button>
          <button
            onClick={onClose}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text-primary hover:bg-surface-muted"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
