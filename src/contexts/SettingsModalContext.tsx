import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalView = "settings" | "profile" | null;

type SettingsModalContextValue = {
  view: ModalView;
  isOpen: boolean;
  openSettings: () => void;
  openProfile: () => void;
  close: () => void;
};

const SettingsModalContext = createContext<SettingsModalContextValue | null>(null);

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ModalView>(null);
  const openSettings = useCallback(() => setView("settings"), []);
  const openProfile = useCallback(() => setView("profile"), []);
  const close = useCallback(() => setView(null), []);
  const isOpen = view !== null;
  const value = useMemo(
    () => ({ view, isOpen, openSettings, openProfile, close }),
    [view, isOpen, openSettings, openProfile, close],
  );
  return (
    <SettingsModalContext.Provider value={value}>{children}</SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext);
  if (!ctx) throw new Error("useSettingsModal must be used within SettingsModalProvider");
  return ctx;
}
