const PLACEMENT_DISMISSED_KEY = "lingo_placement_dismissed_v2_ja";

export function isPlacementDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(PLACEMENT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPlacement(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLACEMENT_DISMISSED_KEY, "1");
  } catch {
    // ignore quota errors
  }
}
