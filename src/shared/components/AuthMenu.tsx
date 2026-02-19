import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useModal } from "@/shared/contexts/ModalContext";
import { getStoredProfile } from "@/features/settings/profileStorage";

export function AuthMenu() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = user?.sub ? getStoredProfile(user.sub) : null;
  const { openSettings, openProfile } = useModal();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-600 dark:bg-gray-600" aria-hidden />
    );
  }

  const displayName =
    profile?.realName ?? profile?.username ?? user?.name ?? user?.email ?? t("common.user");
  const avatarUrl = profile?.avatarUrl ?? user?.picture;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-600 text-gray-200 transition hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("auth.accountMenu")}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {isAuthenticated && user && (
            <div className="border-b border-gray-700 px-4 py-2 dark:border-gray-600">
              <p className="truncate text-sm font-medium text-gray-200">{displayName}</p>
              {profile?.status && (
                <p className="mt-0.5 truncate text-xs text-gray-400">{profile.status}</p>
              )}
              {!profile?.status && user.email && (
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              )}
            </div>
          )}
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700"
            onClick={() => { setOpen(false); openSettings(); }}
          >
            {t("nav.settings")}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700"
              onClick={() => { setOpen(false); openProfile(); }}
            >
              {t("profile.editProfile")}
            </button>
          )}
          {isAuthenticated ? (
            <Link
              to="/logout"
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              {t("auth.logOut")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700"
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.79 17.79 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
