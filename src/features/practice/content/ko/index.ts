/**
 * Korean curated content — stories + conversations.
 *
 * Readings (Revised Romanization) are derived at first access via
 * `romanizeKorean`, so authored data stays terse and the reading aid stays
 * consistent with the rest of the KO surfaces.
 */
import type { Conversation, Story } from "../types";
import { withReading } from "./reading";
import { KO_STORIES } from "./stories";
import { KO_CULTURE_STORIES } from "./stories-culture";
import { KO_CONVERSATIONS } from "./conversations";

let storiesMemo: Story[] | null = null;
let conversationsMemo: Conversation[] | null = null;

export function koStories(): Story[] {
  if (!storiesMemo) {
    storiesMemo = [...KO_STORIES, ...KO_CULTURE_STORIES].map((s) => ({
      ...s,
      sentences: s.sentences.map(withReading),
    }));
  }
  return storiesMemo;
}

export function koConversations(): Conversation[] {
  if (!conversationsMemo) {
    conversationsMemo = KO_CONVERSATIONS.map((c) => ({
      ...c,
      lines: c.lines.map(withReading),
    }));
  }
  return conversationsMemo;
}
