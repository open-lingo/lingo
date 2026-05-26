import { useState, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { getStoredProfile, setStoredProfile } from "@/features/settings/profileStorage";
import type { UserProfile } from "@/features/settings/profileTypes";

export function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const userId = user?.sub ?? null;

  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const stored = getStoredProfile(userId);
    if (stored) {
      setAvatarUrl(stored.avatarUrl ?? "");
      setUsername(stored.username ?? "");
      setRealName(stored.realName ?? "");
      setStatus(stored.status ?? "");
    } else {
      setRealName(user?.name ?? "");
      setUsername(user?.nickname ?? user?.email?.split("@")[0] ?? "");
      setAvatarUrl(user?.picture ?? "");
    }
  }, [userId, user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-text-muted">Sign in to edit your profile.</p>
        <Link to="/login" className="text-sm text-link">
          Log in
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: Partial<UserProfile> = {
      avatarUrl: avatarUrl.trim() || undefined,
      username: username.trim() || undefined,
      realName: realName.trim() || undefined,
      status: status.trim() || undefined,
    };
    setStoredProfile(userId, patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("profile.editTitle")}
        </h1>
        <Link
          to="/settings/profile"
          className="text-sm text-text-muted hover:text-text-primary"
        >
          {t("common.back")}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("profile.avatarUrl")}
          </label>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center text-text-muted">
                <Icon name="user" size={32} />
              </div>
            )}
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("profile.username")}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("profile.realName")}
          </label>
          <input
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder={t("profile.realNamePlaceholder")}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("profile.status")}
          </label>
          <textarea
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={t("profile.statusPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            {saved ? t("profile.saved") : t("profile.save")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary"
          >
            {t("common.back")}
          </button>
        </div>
      </form>
    </div>
  );
}
