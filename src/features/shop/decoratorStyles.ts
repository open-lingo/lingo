/** Maps shop item id → decorator ring visual treatment. */
export type DecoratorStyle = {
  /** CSS `background` value for the ring element wrapping the avatar. */
  background: string;
  /** Screen-reader label, e.g. "Gold frame". */
  label: string;
};

const GOLD =
  "conic-gradient(from 0deg, #b8860b, #ffd700, #ffe66d, #ffd700, #b8860b)";
const SILVER =
  "conic-gradient(from 0deg, #8a8a8a, #d4d4d4, #f0f0f0, #d4d4d4, #8a8a8a)";
const BRONZE =
  "conic-gradient(from 0deg, #7c4e1e, #cd7f32, #e8a96a, #cd7f32, #7c4e1e)";
const BLUE =
  "conic-gradient(from 0deg, #0369a1, #38bdf8, #7dd3fc, #38bdf8, #0369a1)";
const EMERALD =
  "conic-gradient(from 0deg, #065f46, #10b981, #6ee7b7, #10b981, #065f46)";
const ROSE =
  "conic-gradient(from 0deg, #9f1239, #f43f5e, #fda4af, #f43f5e, #9f1239)";
const PLASMA =
  "conic-gradient(from 0deg, #4c1d95, #8b5cf6, #c4b5fd, #ec4899, #8b5cf6, #4c1d95)";

export const DECORATOR_STYLES: Record<string, DecoratorStyle> = {
  "profile-frame-gold": { background: GOLD, label: "Gold frame" },
  "profile-frame-silver": { background: SILVER, label: "Silver frame" },
  "profile-frame-bronze": { background: BRONZE, label: "Bronze frame" },
  "profile-frame-blue": { background: BLUE, label: "Neon blue frame" },
  "profile-frame-emerald": { background: EMERALD, label: "Emerald frame" },
  "profile-frame-rose": { background: ROSE, label: "Rose frame" },
  "profile-frame-plasma": { background: PLASMA, label: "Plasma frame" },
};

/** Returns the style for a given item id, or null if not a decorator. */
export function getDecoratorStyle(itemId: string | null | undefined): DecoratorStyle | null {
  if (!itemId) return null;
  return DECORATOR_STYLES[itemId] ?? null;
}

/** All item ids that are decorators (for filtering the shop catalog). */
export const DECORATOR_IDS = new Set(Object.keys(DECORATOR_STYLES));
