import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ModalId = "settings" | string;

export type ModalEntry = {
  id: ModalId;
  props?: Record<string, unknown>;
};

type ModalContextValue = {
  stack: ModalEntry[];
  isOpen: boolean;
  open: (id: ModalId, props?: Record<string, unknown>) => void;
  close: () => void;
  closeAll: () => void;
  /** Convenience: open settings. */
  openSettings: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ModalEntry[]>([]);

  const open = useCallback((id: ModalId, props?: Record<string, unknown>) => {
    setStack((s) => [...s, { id, props }]);
  }, []);

  const close = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : []));
  }, []);

  const closeAll = useCallback(() => setStack([]), []);

  const openSettings = useCallback(() => open("settings"), [open]);

  const isOpen = stack.length > 0;

  const value = useMemo(
    () => ({
      stack,
      isOpen,
      open,
      close,
      closeAll,
      openSettings,
    }),
    [stack, isOpen, open, close, closeAll, openSettings],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
