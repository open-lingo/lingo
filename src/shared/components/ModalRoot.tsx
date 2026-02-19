import { useTranslation } from "react-i18next";
import { ModalBase } from "./ModalBase";
import { useModal } from "@/shared/contexts/ModalContext";
import { SettingsContent } from "@/features/settings/SettingsContent";
import { ProfileEditPanel } from "@/features/settings/ProfileEditPanel";

/**
 * Renders the top modal from the stack. Place inside ModalProvider (e.g. in Layout).
 */
export function ModalRoot() {
  const { stack, close } = useModal();
  const { t } = useTranslation();

  const top = stack[stack.length - 1];
  if (!top || (top.id !== "settings" && top.id !== "profile")) return null;

  const title =
    top.id === "profile"
      ? t("profile.editTitle")
      : top.id === "settings"
        ? t("settings.title")
        : "";

  const headerLeft =
    top.id === "profile" ? (
      <button
        type="button"
        onClick={close}
        className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label={t("common.back")}
      >
        <BackIcon className="h-5 w-5" />
      </button>
    ) : undefined;

  return (
    <ModalBase onClose={close} title={title} headerLeft={headerLeft}>
      {top.id === "settings" && <SettingsContent />}
      {top.id === "profile" && <ProfileEditPanel />}
    </ModalBase>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
