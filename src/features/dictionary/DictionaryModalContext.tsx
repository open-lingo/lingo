import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { lazyRetry } from "@/shared/utils/lazyRetry";

// Lazy so the dictionary UI + service only load the first time someone opens a
// lookup — keeps it out of the initial bundle for people who never touch it.
const DictionaryModal = lazyRetry(() =>
  import("./DictionaryModal").then((m) => ({ default: m.DictionaryModal })),
);

type DictionaryModalContextValue = {
  /** Open on the search view (empty query). */
  open: () => void;
  /**
   * Open straight to a specific word — resolves via `lookupWord` against the
   * active course language (the story / tap-a-word path).
   */
  openWord: (surface: string) => void;
  /** Close the modal. */
  close: () => void;
};

const DictionaryModalContext = createContext<DictionaryModalContextValue | null>(
  null,
);

/**
 * Mounts a single, app-wide dictionary lookup modal and exposes open/close
 * controls via `useDictionaryModal()`. Mount once near the other UI providers.
 */
export function DictionaryModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialWord, setInitialWord] = useState<string | null>(null);

  const open = useCallback(() => {
    setInitialWord(null);
    setIsOpen(true);
  }, []);

  const openWord = useCallback((surface: string) => {
    setInitialWord(surface);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ open, openWord, close }),
    [open, openWord, close],
  );

  return (
    <DictionaryModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <DictionaryModal open onClose={close} initialWord={initialWord} />
        </Suspense>
      )}
    </DictionaryModalContext.Provider>
  );
}

export function useDictionaryModal(): DictionaryModalContextValue {
  const ctx = useContext(DictionaryModalContext);
  if (!ctx) {
    throw new Error(
      "useDictionaryModal must be used within a DictionaryModalProvider",
    );
  }
  return ctx;
}
