// Per-language dismissal so hiding the placement prompt on one course
// doesn't hide it on another. ja keeps its pre-multilang key so existing
// dismissals survive.
const keyFor = (lang: string) => `lingo_placement_dismissed_v2_${lang}`;

export function isPlacementDismissed(lang: string = "ja"): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(keyFor(lang)) === "1";
  } catch {
    return false;
  }
}

export function dismissPlacement(lang: string = "ja"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(lang), "1");
  } catch {
    // ignore quota errors
  }
}
