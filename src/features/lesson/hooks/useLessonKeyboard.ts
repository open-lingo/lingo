import { useEffect, useRef } from "react";

type LessonKeyboardConfig = {
  onEnter?: () => void;
  onNumber?: (n: number) => void;
  enabled?: boolean;
};

export function useLessonKeyboard({
  onEnter,
  onNumber,
  enabled = true,
}: LessonKeyboardConfig) {
  const onEnterRef = useRef(onEnter);
  const onNumberRef = useRef(onNumber);
  onEnterRef.current = onEnter;
  onNumberRef.current = onNumber;

  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onEnterRef.current?.();
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        onNumberRef.current?.(n);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled]);
}
