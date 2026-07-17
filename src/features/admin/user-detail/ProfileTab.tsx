import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/contexts/ToastContext";
import { useDateFormat } from "@/shared/utils/formatDate";
import type { UserListItem, UserRole } from "@/shared/api/admin";
import { Icon } from "@/shared/components/Icon";
import { Button } from "@/shared/components/ui/Button";
import { AlertBanner } from "@/shared/components/ui/AlertBanner";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";
import { StatusPill } from "./_helpers";
import { BanStatusModal, type StatusValues } from "./BanStatusModal";
import { useUpdateAdminUser } from "./useAdminUserDetail";

function statusFromUser(u: UserListItem): StatusValues {
  return {
    status: (u.status === "banned" ? "banned" : "active") as "active" | "banned",
    statusExpiration: u.status_expiration ?? "",
    communityStatus: (u.community_status === "banned"
      ? "banned"
      : u.community_status === "active"
        ? "active"
        : "") as "active" | "banned" | "",
    communityStatusExpiration: u.community_status_expiration ?? "",
  };
}

export function ProfileTab({ user, userId }: { user: UserListItem; userId: string }) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const { showToast } = useToast();

  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [avatarPreviewBroken, setAvatarPreviewBroken] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<string>("user");
  const [statusValues, setStatusValues] = useState<StatusValues>(statusFromUser(user));
  const [profileError, setProfileError] = useState<string | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);

  const saveProfile = useUpdateAdminUser(userId);
  const saveStatus = useUpdateAdminUser(userId);

  // Seed the edit form whenever the fetched user changes (initial load and
  // after any server-side update — `updated_at` moves on every save).
  useEffect(() => {
    setEditUsername(user.username);
    setEditAvatarUrl(user.profile_picture_key ?? "");
    setAvatarPreviewBroken(false);
    setEditDisplayName(user.display_name ?? "");
    setEditRole(user.role ?? "user");
    setStatusValues(statusFromUser(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user.updated_at]);

  const handleProfileSave = () => {
    setProfileError(null);
    saveProfile.mutate(
      {
        username: editUsername.trim() || undefined,
        display_name: editDisplayName.trim() || undefined,
        profile_picture_key: editAvatarUrl.trim() || null,
        status: statusValues.status,
        status_expiration: statusValues.statusExpiration.trim() || null,
        community_status: statusValues.communityStatus || undefined,
        community_status_expiration:
          statusValues.communityStatusExpiration.trim() || null,
        role: editRole as UserRole,
      },
      {
        onSuccess: () => {
          showToast(t("profile.saved") ?? "Saved", "success");
        },
        onError: (err: unknown) => {
          const msg =
            err &&
            typeof err === "object" &&
            "status" in err &&
            (err as { status?: number }).status === 409
              ? "Username already taken"
              : "Failed to save profile";
          setProfileError(msg);
          showToast(msg, "error");
        },
      },
    );
  };

  const handleSaveStatus = () => {
    saveStatus.mutate(
      {
        status: statusValues.status,
        status_expiration: statusValues.statusExpiration.trim() || null,
        community_status: statusValues.communityStatus || undefined,
        community_status_expiration:
          statusValues.communityStatusExpiration.trim() || null,
      },
      {
        onSuccess: () => {
          setBanModalOpen(false);
          showToast(t("admin.ban.saved", "Status updated"), "success");
        },
        onError: () => {
          showToast(t("admin.ban.error", "Failed to update status"), "error");
        },
      },
    );
  };

  // Revert in-modal edits to the saved user so a later profile save doesn't
  // persist abandoned status changes.
  const handleBanCancel = () => {
    setStatusValues(statusFromUser(user));
    setBanModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {profileError ? <AlertBanner>{profileError}</AlertBanner> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
            {t("profile.avatarUrl")}
          </label>
          <div className="flex items-center gap-4">
            {editAvatarUrl && !avatarPreviewBroken ? (
              <img
                src={editAvatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover"
                onError={() => setAvatarPreviewBroken(true)}
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center text-text-muted">
                <Icon name="user" size={28} />
              </div>
            )}
            <input
              type="url"
              value={editAvatarUrl}
              onChange={(e) => {
                setEditAvatarUrl(e.target.value);
                setAvatarPreviewBroken(false);
              }}
              placeholder="https://..."
              className={cn("flex-1", inputClassName)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
            {t("admin.username")}
          </label>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm text-text-muted">@</span>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="username"
              className={cn("flex-1", inputClassName)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
            {t("admin.displayName")}
          </label>
          <input
            type="text"
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
            placeholder={t("admin.displayName")}
            className={cn("mt-1 w-full", inputClassName)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
            {t("admin.role")}
          </label>
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className={cn("mt-1 w-full", inputClassName)}
          >
            <option value="user">{t("admin.roleUser")}</option>
            <option value="trusted_creator">{t("admin.roleTrustedCreator")}</option>
            <option value="moderator">{t("admin.roleModerator")}</option>
            <option value="admin">{t("admin.roleAdmin")}</option>
            <option value="super_admin">{t("admin.roleSuperAdmin")}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
            {t("admin.status", "Status")}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill
              label={t("admin.accountStatus")}
              status={user.status}
              untilLabel={
                user.status === "banned" && user.status_expiration
                  ? formatDate(user.status_expiration, { dateStyle: "medium" })
                  : null
              }
            />
            <StatusPill
              label={t("admin.communityStatus")}
              status={user.community_status}
              untilLabel={
                user.community_status === "banned" && user.community_status_expiration
                  ? formatDate(user.community_status_expiration, { dateStyle: "medium" })
                  : null
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBanModalOpen(true)}
            >
              <Icon name="ban" size={14} aria-hidden className="mr-1" />
              {t("admin.ban.manage", "Manage ban")}
            </Button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleProfileSave}
        disabled={saveProfile.isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {saveProfile.isPending ? t("common.loading") : t("profile.save")}
      </button>
      <dl className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-text-muted">
            {t("admin.auth0Id")}
          </dt>
          <dd className="mt-1 font-mono text-sm text-text-secondary">{user.auth0_id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-text-muted">
            {t("admin.createdAt")}
          </dt>
          <dd className="mt-1 text-sm text-text-primary">
            {formatDate(user.created_at, { dateStyle: "medium", timeStyle: "short" })}
          </dd>
        </div>
      </dl>

      <BanStatusModal
        open={banModalOpen}
        values={statusValues}
        onChange={(patch) => setStatusValues((prev) => ({ ...prev, ...patch }))}
        onSave={handleSaveStatus}
        onCancel={handleBanCancel}
        saving={saveStatus.isPending}
      />
    </div>
  );
}
