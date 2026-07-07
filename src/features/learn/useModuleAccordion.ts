import { useCallback, useEffect, useRef, useState } from "react";

type AccordionState = Record<string, boolean>;

const STORAGE_KEY_PREFIX = "lingo_module_open_v1";

function storageKey(courseId: string): string {
  return `${STORAGE_KEY_PREFIX}:${courseId}`;
}

function readState(courseId: string): AccordionState | null {
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as AccordionState;
    return null;
  } catch {
    return null;
  }
}

function writeState(courseId: string, state: AccordionState): void {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(state));
  } catch {
    // Quota or privacy mode — fail silently.
  }
}

/** Persists per-course module-open state to localStorage. First visit
 * (no stored state) defaults to: current module open, others closed. */
export function useModuleAccordion(
  courseId: string,
  currentModuleId: string,
): {
  isOpen: (moduleId: string) => boolean;
  toggle: (moduleId: string) => void;
  expand: (moduleId: string) => void;
} {
  const [state, setState] = useState<AccordionState>(() => {
    const stored = readState(courseId);
    // Always open the CURRENT module on mount, merged over stored state.
    // Stored-state-alone regressed for returning learners: a visit made at
    // M1 persisted {m1: true}, and on a later visit at M13 the ref below
    // already equals m13 so the change-effect never fires — the map opened
    // to M1 forever instead of where the learner actually is. Within-session
    // manual collapse of the current module still sticks (the merge only
    // runs in this mount initializer).
    if (stored) return { ...stored, [currentModuleId]: true };
    return { [currentModuleId]: true };
  });

  // If the current module changes (e.g. user just finished M1), expand it
  // automatically on the visit when it becomes current — but don't fight
  // a user's manual collapse on subsequent renders.
  const lastSeenCurrentRef = useRef<string>(currentModuleId);
  useEffect(() => {
    if (lastSeenCurrentRef.current !== currentModuleId) {
      lastSeenCurrentRef.current = currentModuleId;
      setState((prev) => ({ ...prev, [currentModuleId]: true }));
    }
  }, [currentModuleId]);

  useEffect(() => {
    writeState(courseId, state);
  }, [courseId, state]);

  const isOpen = useCallback(
    (moduleId: string) => Boolean(state[moduleId]),
    [state],
  );

  const toggle = useCallback((moduleId: string) => {
    setState((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  const expand = useCallback((moduleId: string) => {
    setState((prev) => ({ ...prev, [moduleId]: true }));
  }, []);

  return { isOpen, toggle, expand };
}
