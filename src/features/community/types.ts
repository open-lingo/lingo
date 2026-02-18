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
