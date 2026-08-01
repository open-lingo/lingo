/**
 * Japanese curated content — stories + conversations.
 *
 * CONVERSATIONS are converted from the m3-m5 neo mini-dialogue exchanges
 * (`languages/ja/curriculum/m{3,4,5}-neo*.ts`, the `dialogueListen` steps).
 * They keep the course's casual plain-form register (だ + plain verbs).
 *
 * Readings (romaji) are derived at first access via the JA romanizer, so the
 * authored data stays terse and the reading aid matches the rest of the app.
 */
import type { Conversation, Story } from "../types";
import { withReading } from "./reading";
import { JA_STORIES } from "./stories";
import { JA_CULTURE_STORIES } from "./stories-culture";
import { JA_CONVERSATIONS } from "./conversations";

let storiesMemo: Story[] | null = null;
let conversationsMemo: Conversation[] | null = null;

export function jaStories(): Story[] {
  if (!storiesMemo) {
    storiesMemo = [...JA_STORIES, ...JA_CULTURE_STORIES].map((s) => ({
      ...s,
      sentences: s.sentences.map(withReading),
    }));
  }
  return storiesMemo;
}

export function jaConversations(): Conversation[] {
  if (!conversationsMemo) {
    conversationsMemo = JA_CONVERSATIONS.map((c) => ({
      ...c,
      lines: c.lines.map(withReading),
    }));
  }
  return conversationsMemo;
}
