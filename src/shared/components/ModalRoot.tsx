import { useTranslation } from "react-i18next";
import { ModalBase } from "./ModalBase";
import { Icon } from "./Icon";
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
        className="rounded-lg p-1 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("common.back")}
      >
        <Icon name="chevronLeft" size={20} aria-hidden />
      </button>
    ) : undefined;

  return (
    <ModalBase onClose={close} title={title} headerLeft={headerLeft}>
      {top.id === "settings" && <SettingsContent />}
      {top.id === "profile" && <ProfileEditPanel />}
    </ModalBase>
  );
}
