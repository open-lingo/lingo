/**
 * The reading library's item model — stories and conversations, normalized.
 *
 * Conversations used to be reachable only from the conversation practice
 * surface, which meant a learner browsing for something to read never saw
 * them. They are reading material, so they belong in the same list; this
 * flattens both shapes onto one row model so the library sorts, filters and
 * paginates a single collection.
 *
 * The practice surface is unaffected — it still reads `getConversations`
 * directly and still owns roleplay and speech recognition.
 */
import type { IconName } from "@/shared/iconRegistry";
import {
  levelCeiling,
  type Conversation,
  type Story,
  type StoryLevel,
} from "@/features/practice/content";
import { storyIcon } from "./storyIcon";

export type LibraryKind = "story" | "conversation";

/** One row in the library, whatever it was authored as. */
export interface LibraryItem {
  kind: LibraryKind;
  /** The authored id — also the storyProgress key, so read state is shared. */
  id: string;
  languageId: string;
  title: string;
  /** Story `theme` / conversation `situation`. */
  blurb: string;
  module: number;
  /** Difficulty. Conversations don't declare one — see `conversationLevel`. */
  level: StoryLevel;
  icon: IconName;
  tags?: string[];
  /** Sentences (story) or turns (conversation). */
  lineCount: number;
  /** First line, for the in-place peek. */
  peekText: string;
  peekTranslation: string;
  /** Router path, relative to the language prefix. */
  path: string;
}

/**
 * Difficulty for a conversation. Conversations carry a `module` but no
 * `level`, and the library sorts and filters on level, so one has to be
 * derived rather than invented per row.
 *
 * `levelCeiling(module)` is the choice: it is the same function the authoring
 * rules use to cap how hard a story at that module may be, so a conversation
 * sorts alongside the HARDEST story its module can contain. That is the right
 * end of the band — a dialogue is production-shaped and register-sensitive,
 * so it is never the gentlest thing available at its module, and putting it
 * first within a module surfaces the newly-unlocked format instead of burying
 * it under six same-module reads.
 */
export function conversationLevel(conv: Conversation): StoryLevel {
  return levelCeiling(conv.module);
}

export function storyToLibraryItem(story: Story): LibraryItem {
  return {
    kind: "story",
    id: story.id,
    languageId: story.languageId,
    title: story.title,
    blurb: story.theme,
    module: story.module,
    level: story.level,
    icon: storyIcon(story),
    tags: story.tags,
    lineCount: story.sentences.length,
    peekText: story.sentences[0]?.text ?? "",
    peekTranslation: story.sentences[0]?.translation ?? "",
    path: `practice/stories/${story.id}`,
  };
}

export function conversationToLibraryItem(conv: Conversation): LibraryItem {
  return {
    kind: "conversation",
    id: conv.id,
    languageId: conv.languageId,
    title: conv.title,
    blurb: conv.situation,
    module: conv.module,
    level: conversationLevel(conv),
    icon: "messageCircle",
    lineCount: conv.lines.length,
    peekText: conv.lines[0]?.text ?? "",
    peekTranslation: conv.lines[0]?.translation ?? "",
    // Same route as a story — the id IS the discriminator (see `ReadingRoute`).
    path: `practice/stories/${conv.id}`,
  };
}

/**
 * Both collections as one sorted list: unread first, then newest module, then
 * hardest level. Same rule the library used for stories alone — conversations
 * simply join it with their derived level. Ties break on id so the order is
 * stable across renders.
 */
export function buildLibraryItems(
  stories: Story[],
  conversations: Conversation[],
  reads: (id: string) => number,
): LibraryItem[] {
  const items = [
    ...stories.map(storyToLibraryItem),
    ...conversations.map(conversationToLibraryItem),
  ];
  return items.sort((a, b) => {
    const ar = reads(a.id) > 0;
    const br = reads(b.id) > 0;
    if (ar !== br) return ar ? 1 : -1;
    if (a.module !== b.module) return b.module - a.module;
    if (a.level !== b.level) return b.level - a.level;
    return a.id.localeCompare(b.id);
  });
}
