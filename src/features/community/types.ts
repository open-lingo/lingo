/**
 * Community content types.
 * Official courses: curated by maintainers, users can submit revisions.
 * Addons: user-created courses, flashcard packs, etc.
 */

export type AddonKind = "course" | "flashcard-pack" | "story" | "grammar";

export type CommunityAddon = {
  id: string;
  kind: AddonKind;
  languageId: string;
  name: string;
  description: string;
  /** GitHub URL or external source */
  sourceUrl?: string;
  maintainerIds: string[];
  upvoteCount: number;
  /** User has upvoted (requires auth) */
  userUpvoted?: boolean;
  /** User is maintainer */
  userMaintainer?: boolean;
  /** ISO date */
  updatedAt: string;
  /** Card count for packs, lesson count for courses */
  itemCount?: number;
  /** Deck ID for flashcard packs when sample content is available */
  deckId?: string;
  /** Cover/thumbnail URL. Use getDeckImageUrl() for placeholder when omitted. */
  image?: string;
  /** UI locale for names/descriptions (e.g. en, ko). Filter by user's selected locale. */
  locale?: string;
  /** Discussion count for this content (links forum + content). */
  discussionCount?: number;
  /** Display name of primary maintainer. */
  maintainerName?: string;
};

export type RevisionStatus = "pending" | "accepted" | "rejected";

export type CourseRevision = {
  id: string;
  courseId: string;
  /** Lesson or module being revised */
  targetId?: string;
  targetLabel?: string;
  title: string;
  description: string;
  /** GitHub PR or issue link */
  linkUrl?: string;
  status: RevisionStatus;
  submittedBy?: string;
  submittedAt: string;
};

export type OfficialCourseInfo = {
  id: string;
  languageId: string;
  title: string;
  description: string;
  /** How to submit a revision (link or instructions) */
  revisionGuideUrl?: string;
  /** Pending/accepted revisions (mock) */
  revisions?: CourseRevision[];
};

export type SuggestionType = "bug" | "feature" | "content" | "other";

// --- External Content ---

export type ExternalContentLink = {
  url: string;
  label?: string;
  description?: string;
};

export type ExternalContentType =
  | "song"
  | "podcast"
  | "text"
  | "video"
  | "movie"
  | "tv_show"
  | "article"
  | "website"
  | "app"
  | "other";

export type ExternalContentLevel =
  | "new"
  | "beginner"
  | "intermediate"
  | "hard"
  | "advanced";

export type ExternalContentSkill =
  | "listening"
  | "reading"
  | "both"
  | "other";

export type ExternalContentItem = {
  id: string;
  title: string;
  description?: string;
  links: ExternalContentLink[];
  contentType: ExternalContentType;
  contentLanguageId: string;
  translationLanguageId?: string;
  level: ExternalContentLevel;
  skill?: ExternalContentSkill;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
  submittedBy?: string;
};
