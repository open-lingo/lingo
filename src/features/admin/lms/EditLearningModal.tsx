/**
 * EditLearningModal — patch learningLanguageId / currentModule / currentLesson
 * on a user's learning state. Backed by PATCH /admin/lms/{user_id}/learning.
 */
import { useEffect, useState } from "react";

import type { LmsLearningPatch, LmsSnapshot } from "@/shared/api/admin";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";

type Props = {
  open: boolean;
  snapshot: LmsSnapshot;
  onClose: () => void;
  onSave: (patch: LmsLearningPatch) => void;
  isPending: boolean;
};

export function EditLearningModal({ open, snapshot, onClose, onSave, isPending }: Props) {
  const [langId, setLangId] = useState(snapshot.learning.learningLanguageId ?? "");
  const [module, setModule] = useState(snapshot.learning.currentModule ?? "");
  const [lesson, setLesson] = useState(snapshot.learning.currentLesson ?? "");

  useEffect(() => {
    if (open) {
      setLangId(snapshot.learning.learningLanguageId ?? "");
      setModule(snapshot.learning.currentModule ?? "");
      setLesson(snapshot.learning.currentLesson ?? "");
    }
  }, [open, snapshot]);

  const handleSave = () => {
    const patch: LmsLearningPatch = {};
    if (langId !== (snapshot.learning.learningLanguageId ?? "")) patch.learningLanguageId = langId;
    if (module !== (snapshot.learning.currentModule ?? "")) patch.currentModule = module;
    if (lesson !== (snapshot.learning.currentLesson ?? "")) patch.currentLesson = lesson;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    onSave(patch);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Learning State"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Changes take effect immediately. The user&apos;s app will reflect this on next load.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Learning Language ID
            </label>
            <input
              type="text"
              value={langId}
              onChange={(e) => setLangId(e.target.value)}
              placeholder="e.g. ja, ko, es"
              className={cn(inputClassName, "font-mono")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Current Module
            </label>
            <input
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="e.g. m3, m7"
              className={cn(inputClassName, "font-mono")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Current Lesson
            </label>
            <input
              type="text"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              placeholder="e.g. m3-l1, m7-l3"
              className={cn(inputClassName, "font-mono")}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EditLearningModal;
