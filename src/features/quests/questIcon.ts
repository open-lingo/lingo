import type { IconName } from "@/shared/iconRegistry";
import type { Quest } from "./types";

/**
 * Quest → lucide icon. Quests are gamification UI (not authored catalog
 * content), so per house style they render with lucide glyphs, never the
 * raw `emoji` field that ships in the data. Server quests only carry
 * `emoji`, so the mapping lives here at the view layer rather than in the
 * data model.
 *
 * Resolution order:
 *   1. Known quest id (matches the seed catalog semantics exactly).
 *   2. The emoji string (covers server-authored quests reusing a glyph).
 *   3. Quest type fallback.
 */
const BY_ID: Record<string, IconName> = {
  "daily-fifty-xp": "zap",
  "daily-flashcards": "layers",
  "weekly-three-lessons": "bookOpen",
  "weekly-master-row": "trophy",
  "random-try-story": "stories",
  "friend-overtake-sora": "users",
};

const BY_EMOJI: Record<string, IconName> = {
  "⚡": "zap",
  "🃏": "layers",
  "📚": "bookOpen",
  "★": "star",
  "⭐": "star",
  "🏆": "trophy",
  "📖": "stories",
  "🤝": "users",
  "🔥": "flame",
  "🎯": "target",
  "💎": "gem",
};

const BY_TYPE: Record<Quest["type"], IconName> = {
  daily: "zap",
  weekly: "trophy",
  random: "sparkles",
  friend: "users",
};

export function questIcon(quest: Pick<Quest, "id" | "type" | "emoji">): IconName {
  return (
    BY_ID[quest.id] ??
    (quest.emoji ? BY_EMOJI[quest.emoji] : undefined) ??
    BY_TYPE[quest.type]
  );
}
