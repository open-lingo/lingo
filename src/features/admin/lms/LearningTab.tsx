/**
 * LearningTab — per-user learning-state management surface.
 *
 * Renders as the body of the "Learning" tab on /admin/users/:id. Owns the
 * snapshot query + the three LMS modals (edit learning state, adjust XP,
 * adjust lingots, reset progress). All mutations route through the admin
 * LMS endpoints (`/admin/lms/{user_id}*`) and invalidate the snapshot
 * query on success.
 *
 * Previously lived as `StudentFile` inside AdminLmsPage; moved here when
 * the LMS surface split into "Learning config" (global) and per-user
 * management (this tab). See docs/CLAUDE.md → "Admin shell" for the wider
 * structure.
 */
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { LmsLearningPatch } from "@/shared/api/admin";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { Icon } from "@/shared/components/Icon";

import { AdjustAmountModal } from "./AdjustAmountModal";
import { EditLearningModal } from "./EditLearningModal";
import { ResetProgressModal } from "./ResetProgressModal";

type Props = {
  userId: string;
};

export function LearningTab({ userId }: Props) {
  const { admin } = useApi();
  const qc = useQueryClient();
  const [editLearningOpen, setEditLearningOpen] = useState(false);
  const [adjustXpOpen, setAdjustXpOpen] = useState(false);
  const [adjustLingotsOpen, setAdjustLingotsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const snapshotQ = useQuery({
    queryKey: ["admin", "lms", "snapshot", userId],
    queryFn: () => admin.getLmsSnapshot(userId),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["admin", "lms", "snapshot", userId] });
  }, [qc, userId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3000);
  };

  const patchLearning = useMutation({
    mutationFn: (patch: LmsLearningPatch) => admin.patchLmsLearning(userId, patch),
    onSuccess: () => {
      invalidate();
      setEditLearningOpen(false);
      showToast("Learning state updated.");
    },
  });

  const adjustXp = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      admin.awardLmsXp(userId, { amount, reason }),
    onSuccess: () => {
      invalidate();
      setAdjustXpOpen(false);
      showToast("XP adjusted.");
    },
  });

  const adjustLingots = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      admin.adjustLmsLingots(userId, { amount, reason }),
    onSuccess: () => {
      invalidate();
      setAdjustLingotsOpen(false);
      showToast("Lingots adjusted.");
    },
  });

  const resetProgress = useMutation({
    mutationFn: () => admin.resetLmsProgress(userId),
    onSuccess: () => {
      invalidate();
      setResetOpen(false);
      showToast("Progress reset.");
    },
  });

  if (snapshotQ.isLoading) return <CenteredLoader />;
  if (snapshotQ.isError || !snapshotQ.data) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        Failed to load learning data.{" "}
        <button
          type="button"
          onClick={() => snapshotQ.refetch()}
          className="underline text-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  const snap = snapshotQ.data;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toastMsg && (
        <div className="px-4 py-2 rounded-card bg-success/10 border border-success/30 text-sm text-success">
          {toastMsg}
        </div>
      )}

      {/* Learning State */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="bookOpen" size={16} className="text-text-muted" aria-hidden />
            <h3 className="font-semibold text-text-primary">Learning State</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditLearningOpen(true)}
          >
            <Icon name="edit2" size={13} aria-hidden />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-text-muted">Language</dt>
          <dd className="font-mono font-medium">
            {snap.learning.learningLanguageId ?? (
              <span className="text-text-muted italic">not set</span>
            )}
          </dd>
          <dt className="text-text-muted">Current module</dt>
          <dd className="font-mono font-medium">
            {snap.learning.currentModule ?? (
              <span className="text-text-muted italic">not set</span>
            )}
          </dd>
          <dt className="text-text-muted">Current lesson</dt>
          <dd className="font-mono font-medium">
            {snap.learning.currentLesson ?? (
              <span className="text-text-muted italic">not set</span>
            )}
          </dd>
        </dl>
      </Card>

      {/* XP & Progress — pencil icons on XP and Lingots tiles open small
          adjustment modals; the big destructive action stays a button. */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="trendingUp" size={16} className="text-text-muted" aria-hidden />
            <h3 className="font-semibold text-text-primary">XP &amp; Progress</h3>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setResetOpen(true)}
          >
            <Icon name="rotateCcw" size={13} aria-hidden />
            Reset progress
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "XP",
              value: snap.stats.xp.toLocaleString(),
              sub: `Level ${snap.stats.level}`,
              onEdit: () => setAdjustXpOpen(true),
              editLabel: "Adjust XP",
            },
            {
              label: "Streak",
              value: `${snap.stats.streak}d`,
              sub: `Best: ${snap.stats.bestStreak}d`,
              onEdit: undefined,
              editLabel: undefined,
            },
            {
              label: "Lingots",
              value: snap.stats.lingots.toLocaleString(),
              sub: "currency",
              onEdit: () => setAdjustLingotsOpen(true),
              editLabel: "Adjust lingots",
            },
          ].map(({ label, value, sub, onEdit, editLabel }) => (
            <div
              key={label}
              className="relative rounded-card border border-border p-3 text-center"
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={editLabel}
                  className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-muted transition"
                >
                  <Icon name="pencil" size={12} aria-hidden />
                </button>
              )}
              <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold font-mono mt-1 text-text-primary">{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        {snap.stats.lastActiveDate && (
          <p className="text-xs text-text-muted mt-3">
            Last active: <span className="font-mono">{snap.stats.lastActiveDate}</span>
          </p>
        )}
      </Card>

      {/* Completed Lessons */}
      <Card padding="none">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Icon name="trophy" size={16} className="text-text-muted" aria-hidden />
          <h3 className="font-semibold text-text-primary">Completed Lessons</h3>
          <Badge size="sm" variant="neutral" className="ml-auto">
            {snap.completedLessons.length}
          </Badge>
        </div>
        {snap.completedLessons.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No lessons completed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-2">Lesson ID</th>
                  <th className="px-4 py-2 text-right">Best score</th>
                  <th className="px-4 py-2">First passed</th>
                  <th className="px-4 py-2 text-right">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snap.completedLessons
                  .sort((a, b) => b.latestAttemptAt.localeCompare(a.latestAttemptAt))
                  .map((lesson) => (
                    <tr key={lesson.lessonId} className="hover:bg-surface-muted">
                      <td className="px-4 py-2 font-mono text-xs">{lesson.lessonId}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {Math.round(lesson.bestScore * 100)}%
                      </td>
                      <td className="px-4 py-2 text-text-muted text-xs">
                        {lesson.firstPassedAt
                          ? new Date(lesson.firstPassedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-text-muted">
                        {lesson.attemptCount}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <EditLearningModal
        open={editLearningOpen}
        snapshot={snap}
        onClose={() => setEditLearningOpen(false)}
        onSave={(patch) => patchLearning.mutate(patch)}
        isPending={patchLearning.isPending}
      />
      <AdjustAmountModal
        open={adjustXpOpen}
        title="Adjust XP"
        currentLabel="Current XP:"
        currentValue={snap.stats.xp}
        previewLabel="New XP:"
        reasonPlaceholder="e.g. test-account setup, correcting error"
        onClose={() => setAdjustXpOpen(false)}
        onSave={(amount, reason) => adjustXp.mutate({ amount, reason })}
        isPending={adjustXp.isPending}
      />
      <AdjustAmountModal
        open={adjustLingotsOpen}
        title="Adjust lingots"
        currentLabel="Current lingots:"
        currentValue={snap.stats.lingots}
        previewLabel="New lingots:"
        reasonPlaceholder="e.g. starter grant, refund, correcting error"
        onClose={() => setAdjustLingotsOpen(false)}
        onSave={(amount, reason) => adjustLingots.mutate({ amount, reason })}
        isPending={adjustLingots.isPending}
      />
      <ResetProgressModal
        open={resetOpen}
        username={snap.username}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetProgress.mutate()}
        isPending={resetProgress.isPending}
      />
    </div>
  );
}

export default LearningTab;
