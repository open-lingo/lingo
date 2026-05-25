import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useModal } from "@/shared/contexts/ModalContext";

/**
 * Deep link `/settings` — opens the settings modal and returns to home so the
 * learner keeps context (e.g. mid-lesson: open settings, close, resume).
 */
export function SettingsOpenRoute() {
  const { openSettings } = useModal();

  useEffect(() => {
    openSettings();
  }, [openSettings]);

  return <Navigate to="/home" replace />;
}
