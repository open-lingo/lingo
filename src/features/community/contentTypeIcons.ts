import type { ExternalContentType } from "./types";
import type { IconName } from "@/shared/iconRegistry";

/** Icon for each external content type. */
export const CONTENT_TYPE_ICONS: Record<ExternalContentType, IconName> = {
  song: "music",
  podcast: "podcast",
  text: "fileText",
  video: "video",
  movie: "film",
  tv_show: "tv",
  article: "newspaper",
  website: "globe",
  app: "smartphone",
  other: "circle",
};
