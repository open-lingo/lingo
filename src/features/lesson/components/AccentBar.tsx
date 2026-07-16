import type { RefObject } from "react";

/** Spanish orthography chips — the full accent row plus the inverted
 *  openers. Order mirrors the vowel row learners expect (á…ü), specials
 *  last. */
const ACCENT_CHARS = ["á", "é", "í", "ó", "ú", "ü", "ñ", "¿", "¡"];

type Props = {
  /** The textarea/input the chips type into. */
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  /** Grading has happened — chips render disabled like the field. */
  disabled?: boolean;
  /** Fired with the field's full new value after an insert, so callers
   *  mirroring the (uncontrolled) DOM into state stay in sync —
   *  setRangeText does not fire React's onChange. */
  onInsert?: (value: string) => void;
};

/**
 * Compact chip row of accented characters for learners without an OS
 * Spanish layout (same rung of the typing ladder as wanakana's romaji→
 * kana compose on the JA side). Each chip inserts its character at the
 * caret of the bound field, replacing any selection, and keeps focus in
 * the field so typing continues uninterrupted.
 */
export function AccentBar({ inputRef, disabled = false, onInsert }: Props) {
  function insert(ch: string) {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    // "end" places the caret right after the inserted char.
    el.setRangeText(ch, start, end, "end");
    el.focus();
    onInsert?.(el.value);
  }

  return (
    <div
      role="toolbar"
      aria-label="Accented characters"
      className="flex flex-wrap gap-1.5"
    >
      {ACCENT_CHARS.map((ch) => (
        <button
          key={ch}
          type="button"
          disabled={disabled}
          // preventDefault keeps focus (and the caret position) in the
          // bound field while the chip is pressed, so the insert lands
          // where the learner was typing. Keyboard activation still works:
          // insert() refocuses the field after the write.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(ch)}
          className="min-w-9 rounded-lg border-[1.5px] border-border bg-surface px-2.5 py-1 text-base font-medium text-text-primary transition-colors duration-150 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary"
          aria-label={`Insert ${ch}`}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
