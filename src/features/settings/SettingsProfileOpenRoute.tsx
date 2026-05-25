import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useModal } from "@/shared/contexts/ModalContext";

/** Deep link `/settings/profile` — settings modal with profile panel on top. */
export function SettingsProfileOpenRoute() {
  const { openSettings, openProfile } = useModal();

  useEffect(() => {
    openSettings();
    openProfile();
  }, [openSettings, openProfile]);

  return <Navigate to="/home" replace />;
}
