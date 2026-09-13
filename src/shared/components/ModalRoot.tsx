import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ModalBase } from "./ModalBase";
import { useModal } from "@/shared/contexts/ModalContext";
import { lazyRetry } from "@/shared/utils/lazyRetry";

// Settings pulls the full cross-language registry (every language module,
// including course-map data) just to render its language-picker sections.
// Only needed once the settings modal is actually opened, so it's lazy —
// nothing else in ModalRoot renders unless `top.id === "settings"` anyway.
const SettingsContent = lazyRetry(() =>
  import("@/features/settings/SettingsContent").then((m) => ({
    default: m.SettingsContent,
  })),
);

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

  const initialSection =
    typeof top.props?.initialSection === "string" ? top.props.initialSection : undefined;

  return (
    <ModalBase
      onClose={close}
      title={t("settings.title")}
      maxWidth="max-w-6xl"
      fullHeight
    >
      <Suspense fallback={null}>
        <SettingsContent initialSection={initialSection} />
      </Suspense>
    </ModalBase>
  );
}
