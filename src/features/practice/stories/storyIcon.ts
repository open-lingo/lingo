/**
 * Story icon — a glyph per story, chosen from its authored `tags`.
 *
 * The library used to render one identical book glyph for every row, which
 * made a 40-item list read as undifferentiated. Tags are already authored on
 * every story, so they are the natural source: the first tag with a mapping
 * wins, and anything unmapped falls back to the generic story glyph.
 *
 * Every name here must exist in `@/shared/iconRegistry`.
 */
import type { IconName } from "@/shared/iconRegistry";
import type { Story } from "@/features/practice/content";

/** Tag -> glyph. Order of lookup is the story's own tag order. */
const TAG_ICONS: Record<string, IconName> = {
  // people
  friends: "users",
  neighbours: "users",
  grandparents: "users",
  family: "heart",
  // learning
  school: "graduationCap",
  study: "graduationCap",
  homework: "graduationCap",
  exam: "graduationCap",
  // culture + occasions
  culture: "partyPopper",
  festival: "partyPopper",
  birthday: "partyPopper",
  seasons: "sparkles",
  spring: "sparkles",
  summer: "sparkles",
  winter: "sparkles",
  // places + movement
  town: "mapPin",
  city: "mapPin",
  park: "mapPin",
  directions: "compass",
  travel: "plane",
  sea: "plane",
  // things people do
  food: "flame",
  cooking: "flame",
  shopping: "gem",
  money: "gem",
  health: "activity",
  hospital: "activity",
  exercise: "dumbbell",
  bicycles: "dumbbell",
  work: "target",
  music: "music",
  movies: "film",
  photos: "camera",
  art: "palette",
  hobbies: "star",
  // objects + comms
  phone: "smartphone",
  letters: "fileText",
  objects: "package",
  numbers: "barChart",
  weather: "cloud",
  // social register
  manners: "smile",
  keigo: "smile",
  greetings: "messageCircle",
  help: "hand",
  // time
  plans: "calendarDays",
  morning: "clock",
  "daily-life": "clock",
  mystery: "venetianMask",
};

/** Glyph for a story: first mapped tag wins, else the generic story glyph. */
export function storyIcon(story: Pick<Story, "tags">): IconName {
  for (const tag of story.tags ?? []) {
    const icon = TAG_ICONS[tag];
    if (icon) return icon;
  }
  return "stories";
}
