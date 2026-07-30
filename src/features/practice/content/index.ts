/**
 * Curated content registry — the language-agnostic read surface over the
 * per-language authored `Story` / `Conversation` data.
 *
 * Content is module-gated: `getStories` / `getConversations` return only
 * items whose `module <= reachedModule`, so a learner never sees content
 * above their level. Languages without curated content return `[]` (graceful
 * — the calling surface simply shows an empty state).
 */
import type { Conversation, Story } from "./types";
import { koStories, koConversations } from "./ko";
import { jaStories, jaConversations } from "./ja";

interface ContentProvider {
  stories: () => Story[];
  conversations: () => Conversation[];
}

const REGISTRY: Record<string, ContentProvider> = {
  ko: { stories: koStories, conversations: koConversations },
  ja: { stories: jaStories, conversations: jaConversations },
};

/** All authored stories for a language (unfiltered). Empty if none. */
export function allStories(languageId: string): Story[] {
  return REGISTRY[languageId]?.stories() ?? [];
}

/** All authored conversations for a language (unfiltered). Empty if none. */
export function allConversations(languageId: string): Conversation[] {
  return REGISTRY[languageId]?.conversations() ?? [];
}

/** Stories unlocked at `reachedModule` (module <= reached). */
export function getStories(
  languageId: string,
  reachedModule: number,
): Story[] {
  return allStories(languageId).filter((s) => s.module <= reachedModule);
}

/** Conversations unlocked at `reachedModule` (module <= reached). */
export function getConversations(
  languageId: string,
  reachedModule: number,
): Conversation[] {
  return allConversations(languageId).filter((c) => c.module <= reachedModule);
}

export type { Conversation, Story } from "./types";
export type {
  ConversationLine,
  ConversationSpeaker,
  StorySentence,
} from "./types";
export { isComprehensible, gateResidual, moduleOrder } from "./gate";
