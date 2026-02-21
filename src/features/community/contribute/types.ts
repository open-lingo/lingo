/** Moderation workflow status for community content. */
export type ContentStatus =
  | "draft"
  | "submitted"
  | "review"
  | "published"
  | "changes_requested"
  | "rejected";

export type CreatorContentKind = "flashcard-pack" | "course" | "story" | "video";

export type CreatorContentItem = {
  id: string;
  kind: CreatorContentKind;
  name: string;
  languageId: string;
  status: ContentStatus;
  cardCount?: number;
  updatedAt: string;
  moderationNotes?: string;
  image?: string | null;
};
