/**
 * AdminLmsPage — /admin/lms
 *
 * LMS is the home for "tune learning state". Single surface, no top-level
 * tabs:
 *   - When no user is selected: a centered user picker plus a collapsible
 *     "Platform XP rates" section (the former /admin/ops "XP config" tab).
 *   - When a user is selected: their student file (learning state, XP &
 *     progress, completed lessons). Inline pencil-icon edits on the XP and
 *     Lingots stat tiles open small "Adjust" modals; "Reset progress" is
 *     the only destructive action.
 *
 * Lingot adjustment is backed by POST /api/core/v1/admin/lms/{user_id}/lingots
 * (mirrors the XP-adjustment endpoint). Audit-logged as ``lms_adjust_lingots``.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type {
  LmsLearningPatch,
  LmsSnapshot,
  UserListItem,
} from "@/shared/api/admin";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { Icon } from "@/shared/components/Icon";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";

import { PlatformXpRatesPanel } from "./PlatformXpRatesPanel";

// ── User Picker ───────────────────────────────────────────────────────────────

function UserPicker({ onSelect }: { onSelect: (user: UserListItem) => void }) {
  const { admin } = useApi();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const result = useQuery({
    queryKey: ["admin", "lms", "user-search", debouncedQuery],
    queryFn: () => admin.listUsers({ search: debouncedQuery || undefined, limit: 10 }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8">
      <div className="w-full max-w-lg space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Learning Management</h2>
          <p className="text-sm text-text-muted mt-1">
            Search for a user to view and edit their learning state.
          </p>
        </div>
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username, display name, or partial user ID…"
            className={cn(inputClassName, "pl-9")}
          />
        </div>
        {result.isLoading && (
          <p className="text-sm text-text-muted">Searching…</p>
        )}
        {result.data && result.data.items.length === 0 && debouncedQuery && (
          <p className="text-sm text-text-muted">No users found for &ldquo;{debouncedQuery}&rdquo;.</p>
        )}
        {result.data && result.data.items.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            {result.data.items.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 hover:bg-surface-muted transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">@{user.username}</span>
                    {user.display_name !== user.username && (
                      <span className="text-text-muted text-sm truncate">{user.display_name}</span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-text-muted truncate mt-0.5">{user.id}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-xs text-text-secondary">
                    {(user.xp ?? 0).toLocaleString()} XP
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Learning State Modal ─────────────────────────────────────────────────

function EditLearningModal({
  open,
  snapshot,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  snapshot: LmsSnapshot;
  onClose: () => void;
  onSave: (patch: LmsLearningPatch) => void;
  isPending: boolean;
}) {
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

// ── Adjust amount modal (XP + lingots) ────────────────────────────────────────

/**
 * Shared "Adjust <amount>" modal — XP and lingots both flow through this.
 * Caller supplies the title + currency label + reason placeholder, plus the
 * current value to preview the post-adjustment number. Saves call onSave
 * with the parsed delta + reason string ("" → "admin-lms" sentinel).
 */
function AdjustAmountModal({
  open,
  title,
  currentLabel,
  currentValue,
  reasonPlaceholder,
  previewLabel,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  title: string;
  currentLabel: string;
  currentValue: number;
  reasonPlaceholder: string;
  previewLabel: string;
  onClose: () => void;
  onSave: (amount: number, reason: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState("0");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("0");
      setReason("");
    }
  }, [open]);

  const parsed = parseInt(amount, 10);
  const preview = isNaN(parsed) ? currentValue : Math.max(0, currentValue + parsed);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onSave(parsed, reason || "admin-lms")}
            disabled={isPending || isNaN(parsed) || parsed === 0}
          >
            {isPending ? "Applying…" : "Apply adjustment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted">
          <span className="text-sm text-text-muted">{currentLabel}</span>
          <span className="font-mono font-semibold">{currentValue.toLocaleString()}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Amount (positive = grant, negative = retract)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(inputClassName, "font-mono")}
            />
            {!isNaN(parsed) && parsed !== 0 && (
              <p className="text-xs text-text-muted mt-1">
                {previewLabel}{" "}
                <span className="font-mono font-semibold">{preview.toLocaleString()}</span>
                {parsed < 0 && preview === 0 && " (clamped to 0)"}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Reason (for audit log)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className={inputClassName}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Reset Progress Modal ──────────────────────────────────────────────────────

function ResetProgressModal({
  open,
  username,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset progress — are you sure?"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isPending || confirmText !== "reset"}
          >
            {isPending ? "Resetting…" : "Reset all progress"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            This will permanently:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-400 mt-1 list-disc list-inside space-y-0.5">
            <li>Delete all lesson completion records for @{username}</li>
            <li>Reset XP, level, streak, and lingots to zero</li>
            <li>Clear their last active date</li>
          </ul>
          <p className="text-sm text-red-800 dark:text-red-300 mt-2 font-medium">
            This cannot be undone.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">
            Type{" "}
            <code className="font-mono bg-surface-muted px-1 rounded">reset</code> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="reset"
            className={inputClassName}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Student File ──────────────────────────────────────────────────────────────

function StudentFile({
  userId,
  onClear,
}: {
  userId: string;
  onClear: () => void;
}) {
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
        Failed to load user data.{" "}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">@{snap.username}</h2>
          <p className="text-sm text-text-muted">{snap.displayName}</p>
          <p className="font-mono text-xs text-text-muted mt-0.5">{snap.userId}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onClear}>
          Search again
        </Button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300">
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
              className="relative rounded-lg border border-border p-3 text-center"
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

// ── Platform XP rates — collapsible section on the picker view ────────────────
//
// Lives below the user picker, collapsed by default so the picker stays the
// primary focus. Click the header to expand. This replaces the top-level
// "Platform XP rates" tab so the LMS surface has a single linear flow:
// search a user → student file, with platform-wide tuning one click away.

function PlatformXpRatesSection() {
  const [open, setOpen] = useState(false);

  return (
    <Card padding="none" className="w-full max-w-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted transition"
        aria-expanded={open}
        aria-controls="platform-xp-rates-body"
      >
        <Icon name="settings" size={16} className="text-text-muted shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary">Platform XP rates</p>
          <p className="text-xs text-text-muted">
            Tune lesson / review / streak XP and lingot grants for all users.
          </p>
        </div>
        {open ? (
          <Icon name="chevronDown" size={16} className="text-text-muted shrink-0" aria-hidden />
        ) : (
          <Icon name="chevronRight" size={16} className="text-text-muted shrink-0" aria-hidden />
        )}
      </button>
      {open && (
        <div id="platform-xp-rates-body" className="border-t border-border p-4">
          <PlatformXpRatesPanel hideHeader />
        </div>
      )}
    </Card>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export function AdminLmsPage() {
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6">
      {selectedUser ? (
        <StudentFile
          userId={selectedUser.id}
          onClear={() => setSelectedUser(null)}
        />
      ) : (
        <div className="flex flex-col items-center flex-1">
          <UserPicker onSelect={setSelectedUser} />
          <div className="w-full max-w-lg pb-12">
            <PlatformXpRatesSection />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLmsPage;
