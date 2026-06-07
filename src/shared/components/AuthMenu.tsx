import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { canModerateCommunityContent, canAccessSiteAdmin } from "@/shared/auth/roles";
import { useModal } from "@/shared/contexts/ModalContext";
import { useApi } from "@/shared/api/provider";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { resolveUserAvatarUrl } from "@/shared/auth/resolveUserAvatarUrl";
import { getStoredProfile } from "@/features/settings/profileStorage";
import { ApiError } from "@/shared/api/client";
import { Icon } from "@/shared/components/Icon";
import { Button, composeButtonClasses } from "@/shared/components/ui/Button";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { DecoratedAvatar } from "@/shared/components/DecoratedAvatar";
import { useEquippedDecorator } from "@/features/shop/useEquippedDecorator";

export function AuthMenu() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { users } = useApi();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = user?.sub ? getStoredProfile(user.sub) : null;
  const { openSettings } = useModal();
  const { openThemeEditor } = useTheme();
  const flags = useFeatureFlags();

  // Fix M8 — user-scoped key so a previous account's role doesn't leak
  // into the menu after a logout/login switch (admin shortcuts etc).
  const userIdKey = user?.sub ?? "anon";
  const { data: me } = useQuery({
    queryKey: ["users", userIdKey, "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
    // /users/me is slow-moving (XP bumps only on lesson sync, role basically
    // never). Shares cache with HomePage / useLearnProfile / SettingsSectionPanel
    // via the same key. Mutations invalidate ["users", uid, "me"] explicitly,
    // so we can cache at 5 min instead of refetching every nav after a minute.
    staleTime: 5 * 60_000,
  });

  const role = me?.role;
  const siteAdmin = canAccessSiteAdmin(role);
  const showModeration = canModerateCommunityContent(role);
  const { style: decoratorStyle } = useEquippedDecorator();

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

  const avatarUrl = resolveUserAvatarUrl(me, user);
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);
  const showAvatar = avatarUrl && !imgError;

  if (isLoading) {
    return (
      <div className="h-9 w-9 motion-safe:animate-pulse rounded-full bg-surface-elevated" aria-hidden />
    );
  }

  const displayName =
    me?.display_name ?? profile?.realName ?? profile?.username ?? user?.name ?? user?.email ?? t("common.user");

  const menuLinkClass = composeButtonClasses({ variant: "menu" });

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={
          showAvatar
            ? decoratorStyle
              ? "overflow-visible hover:text-text-primary"
              : "overflow-hidden hover:text-text-primary"
            : undefined
        }
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("auth.accountMenu")}
      >
        {showAvatar ? (
          <DecoratedAvatar
            name={displayName}
            src={avatarUrl ?? undefined}
            size="sm"
            decoratorStyle={decoratorStyle}
            className={decoratorStyle ? undefined : "h-full w-full object-cover rounded-full"}
          />
        ) : (
          <Icon name="user" size={20} />
        )}
      </Button>

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
          <Button variant="menu" type="button" onClick={() => { setOpen(false); openSettings(); }}>
            <Icon name="settings" size={18} className="shrink-0 text-text-muted" />
            {t("nav.settings")}
          </Button>
          {isAuthenticated && (() => {
            // Public profile URL — prefer the backend ``me.username`` (Auth0
            // sub maps to this in the seed). Fall back to the Auth0
            // ``nickname`` claim or the email local-part so the link still
            // resolves for accounts that haven't picked a username yet. The
            // profile page now hosts inline editing — no separate "Edit
            // profile" entry needed.
            const myUsername =
              me?.username?.trim() ||
              profile?.username?.trim() ||
              user?.nickname?.trim() ||
              user?.email?.split("@")[0]?.trim() ||
              "";
            if (!myUsername) return null;
            return (
              <Link
                to={`/u/${encodeURIComponent(myUsername)}`}
                className={menuLinkClass}
                onClick={() => setOpen(false)}
              >
                <Icon name="user" size={18} className="shrink-0 text-text-muted" />
                {t("authMenu.viewProfile", "View profile")}
              </Link>
            );
          })()}
          {showModeration && flags.community.tabs.contribute && (
            <Link
              to={langPath("community/contribute/admin")}
              className={menuLinkClass}
              onClick={() => setOpen(false)}
            >
              <Icon name="shield" size={18} className="shrink-0 text-text-muted" />
              {t("nav.moderateContent")}
            </Link>
          )}
          {siteAdmin && (
            <Link to="/admin/home" className={menuLinkClass} onClick={() => setOpen(false)}>
              <Icon name="layoutDashboard" size={18} className="shrink-0 text-text-muted" />
              {t("nav.siteAdmin")}
            </Link>
          )}
          <Button variant="menu" type="button" onClick={() => { setOpen(false); openThemeEditor(); }}>
            <Icon name="palette" size={18} className="shrink-0 text-text-muted" />
            {t("authMenu.themeLabel", "Theme")}
          </Button>
          {isAuthenticated ? (
            <Link to="/logout" className={menuLinkClass} onClick={() => setOpen(false)}>
              <Icon name="logOut" size={18} className="shrink-0 text-text-muted" />
              {t("auth.logOut")}
            </Link>
          ) : (
            <Link to="/login" className={menuLinkClass} onClick={() => setOpen(false)}>
              {t("auth.logIn")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
