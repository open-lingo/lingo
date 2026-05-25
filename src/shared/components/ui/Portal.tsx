import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PortalProps = {
  children: ReactNode;
  /** Optional explicit container; defaults to document.body. */
  container?: HTMLElement | null;
};

/**
 * Renders children into a portal anchored at `document.body` (or the provided
 * container). SSR-safe: returns null on the server and mounts on first effect.
 */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  const target = container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
}
