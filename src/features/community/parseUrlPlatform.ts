export type UrlPlatform =
  | "youtube"
  | "spotify"
  | "apple_podcasts"
  | "netflix"
  | "website";

export function parseUrlPlatform(url: string): UrlPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("spotify.com")) return "spotify";
    if (host.includes("podcasts.apple.com")) return "apple_podcasts";
    if (host.includes("apple.com") && u.pathname.toLowerCase().includes("podcast"))
      return "apple_podcasts";
    if (host.includes("netflix.com")) return "netflix";
    return "website";
  } catch {
    return "website";
  }
}

import type { IconName } from "@/shared/iconRegistry";

/** Platform icon name for display. */
export const PLATFORM_ICON_NAMES: Record<UrlPlatform, IconName> = {
  youtube: "play",
  spotify: "headphones",
  apple_podcasts: "mic",
  netflix: "video",
  website: "link",
};

