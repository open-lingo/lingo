import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useModal } from "@/shared/contexts/ModalContext";
import { useApi } from "@/shared/api/provider";
import { getStoredProfile } from "@/features/settings/profileStorage";
import { ApiError } from "@/shared/api/client";
import { Icon } from "@/shared/components/Icon";

export function AuthMenu() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { users } = useApi();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = user?.sub ? getStoredProfile(user.sub) : null;
  const { openSettings, openProfile } = useModal();

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
  });

  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const avatarUrl =
    me?.profile_picture_key?.trim() ||
    (user?.sub ? getStoredProfile(user.sub)?.avatarUrl : null) ||
    user?.picture ||
    undefined;
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);
  const showAvatar = avatarUrl && !imgError;

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-surface-elevated" aria-hidden />
    );
  }

  const displayName =
    me?.display_name ?? profile?.realName ?? profile?.username ?? user?.name ?? user?.email ?? t("common.user");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-text-primary transition hover:text-text-secondary"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("auth.accountMenu")}
      >
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon name="user" size={20} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface py-1 shadow-popover">
          {isAuthenticated && user && (
            <div className="border-b border-border px-4 py-2">
              <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
              {(me?.bio ?? profile?.status) && (
                <p className="mt-0.5 truncate text-xs text-text-muted">{me?.bio ?? profile?.status}</p>
              )}
              {!me?.bio && !profile?.status && user.email && (
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              )}
            </div>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
            onClick={() => { setOpen(false); openSettings(); }}
          >
            <Icon name="settings" size={18} className="shrink-0 text-text-muted" />
            {t("nav.settings")}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
              onClick={() => { setOpen(false); openProfile(); }}
            >
              <Icon name="user" size={18} className="shrink-0 text-text-muted" />
              {t("profile.editProfile")}
            </button>
          )}
          {isAuthenticated ? (
            <Link
              to="/logout"
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              <Icon name="logOut" size={18} className="shrink-0 text-text-muted" />
              {t("auth.logOut")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              {t("auth.logIn")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

