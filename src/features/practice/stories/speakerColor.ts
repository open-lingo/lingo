/**
 * Speaker colours — one palette, shared by conversations and stories.
 *
 * Two characters in a dialogue have to be tellable apart at a glance, and the
 * only signal the transcript had was the name itself. Colour carries it.
 *
 * ASSIGNED BY ORDER OF FIRST APPEARANCE, never by a hash of the name or by the
 * speaker id. That is what makes a character keep one colour for a whole piece
 * and across re-renders, and it is why the two surfaces have to share this
 * module: a conversation declares `speakers[]` with ids, while a story only
 * carries a `speaker` NAME string per speech block. Different keys, same rule —
 * the caller collects its own distinct keys in order and hands them over.
 *
 * The palette is SEMANTIC TOKENS, not hex, so it re-tints with the theme
 * (Light / Dark / AMOLED) instead of fighting it. Ordered for separation at the
 * sizes that matter: almost every piece has two speakers, so slots 1-2 (the
 * theme accent and green) are the pair that has to read as different in every
 * theme. Slot 3 is `warning` (amber) rather than `info`, because in AMOLED the
 * accent is cyan and `info` is sky blue — near-neighbours, and a three-speaker
 * scene would land on both. `error` sits last because it collides with `accent`
 * in the Light and Dark presets, where the accent is itself a red; a
 * five-speaker piece is the only thing that reaches it.
 *
 * Measured against the real presets: every slot clears WCAG AA on `bg-surface`
 * in Light and AMOLED, and AA or AA-large in Dark (Dark's accent is 3.5:1 —
 * the app's own accent token at the app's own accent size, not a new floor).
 */

/** Tailwind class fragments for one speaker's colour slot. */
export interface SpeakerColor {
  /** Name + icon colour. Legible on `bg-surface` in every preset. */
  text: string;
  /** Faint fill for the cast chip. */
  chip: string;
  /** Chip border. */
  border: string;
}

const PALETTE: SpeakerColor[] = [
  { text: "text-accent", chip: "bg-accent/10", border: "border-accent/30" },
  { text: "text-success", chip: "bg-success/10", border: "border-success/30" },
  { text: "text-warning", chip: "bg-warning/10", border: "border-warning/30" },
  { text: "text-info", chip: "bg-info/10", border: "border-info/30" },
  { text: "text-error", chip: "bg-error/10", border: "border-error/30" },
];

/** The colour for the nth speaker to appear. Wraps past the palette length. */
export function speakerColorAt(index: number): SpeakerColor {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/**
 * Map each key to a colour by its FIRST position in `keys`. Duplicates keep the
 * colour of their first appearance, so callers can pass a raw per-line speaker
 * list without de-duplicating first.
 */
export function buildSpeakerColors(keys: readonly string[]): Map<string, SpeakerColor> {
  const colors = new Map<string, SpeakerColor>();
  for (const key of keys) {
    if (colors.has(key)) continue;
    colors.set(key, speakerColorAt(colors.size));
  }
  return colors;
}
