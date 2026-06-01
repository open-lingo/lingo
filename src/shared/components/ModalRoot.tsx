import { useTranslation } from "react-i18next";
import { ModalBase } from "./ModalBase";
import { useModal } from "@/shared/contexts/ModalContext";
import { SettingsContent } from "@/features/settings/SettingsContent";

/**
 * Renders the top modal from the stack. Place inside ModalProvider (e.g. in Layout).
 *
 * Profile editing is no longer a modal — it's inline on the public profile
 * page (`/u/:username`). See `features/profile/PublicProfilePage.tsx`.
 */
export function ModalRoot() {
  const { stack, close } = useModal();
  const { t } = useTranslation();

  const top = stack[stack.length - 1];
  if (!top || top.id !== "settings") return null;

  return (
    <ModalBase
      onClose={close}
      title={t("settings.title")}
      maxWidth="max-w-4xl"
    >
      <SettingsContent />
    </ModalBase>
  );
}
