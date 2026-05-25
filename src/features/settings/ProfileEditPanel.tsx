import { useState, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";

export function ProfileEditPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const me = await users.getMe();
        if (cancelled) return;
        setUsername(me.username);
        setRealName(me.display_name);
        setAvatarUrl(me.profile_picture_key ?? "");
        setBio(me.bio ?? "");
        setIsRegistered(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setRealName(user?.name ?? "");
          setUsername(user?.nickname ?? user?.email?.split("@")[0] ?? "");
          setAvatarUrl(user?.picture ?? "");
          setIsRegistered(false);
        } else {
          setError("Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, users, user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="px-6 py-5">
        <p className="text-sm text-text-muted">Sign in to edit your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-6 py-5">
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isRegistered) {
        await users.updateMe({
          username: username.trim() || undefined,
          display_name: realName.trim() || undefined,
          profile_picture_key: avatarUrl.trim() || undefined,
          bio: bio.trim() || undefined,
        });
        // Fix M8 — user-scoped key now includes userId between "users" and
        // "me". Use a predicate so we invalidate the active user's profile
        // cache without nuking unrelated `users` queries.
        await queryClient.invalidateQueries({
          predicate: (q) => {
            const k = q.queryKey;
            return Array.isArray(k) && k[0] === "users" && k.includes("me");
          },
        });
      } else {
        await users.register({
          username: username.trim(),
          display_name: realName.trim() || username.trim(),
        });
        setIsRegistered(true);
        // Fix M8 — user-scoped key now includes userId between "users" and
        // "me". Use a predicate so we invalidate the active user's profile
        // cache without nuking unrelated `users` queries.
        await queryClient.invalidateQueries({
          predicate: (q) => {
            const k = q.queryKey;
            return Array.isArray(k) && k[0] === "users" && k.includes("me");
          },
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Username already taken");
      } else {
        setError("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
      {error && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          {t("profile.avatarUrl")}
        </label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center text-text-muted">
              <Icon name="user" size={28} />
            </div>
          )}
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
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
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
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
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          {t("profile.status")}
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("profile.statusPlaceholder")}
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? t("common.loading") : saved ? t("profile.saved") : t("profile.save")}
      </button>
    </form>
  );
}
