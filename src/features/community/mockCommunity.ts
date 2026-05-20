import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import type { CommunityAddon, OfficialCourseInfo, CourseRevision } from "./types";

/** Official courses with revision info. Mock data until API exists. */
export const MOCK_OFFICIAL_COURSES: OfficialCourseInfo[] = [
  {
    id: "official-ko",
    languageId: "ko",
    title: "Korean for Beginners",
    description: "Structured course with Hangul, greetings, and everyday phrases.",
    revisionGuideUrl: "https://github.com/open-lingo/lingo/blob/main/CONTRIBUTING.md",
    revisions: [
      {
        id: "rev-1",
        courseId: "official-ko",
        targetId: "ko-m1-intro",
        targetLabel: "How Hangul works",
        title: "Add a section on stroke direction",
        description: "Hangul has consistent left-to-right + top-to-bottom stroke order — worth a paragraph in the intro.",
        linkUrl: "https://github.com/open-lingo/lingo/issues/42",
        status: "pending",
        submittedBy: "community",
        submittedAt: "2025-02-10T00:00:00Z",
      },
    ] as CourseRevision[],
  },
  {
    id: "official-ja",
    languageId: "ja",
    title: "Japanese for Beginners",
    description: "Hiragana, Katakana, basic kanji, and particles.",
    revisionGuideUrl: "https://github.com/open-lingo/lingo/blob/main/CONTRIBUTING.md",
  },

];

/** User-created addons: courses, flashcard packs, etc. Mock data. */
export const MOCK_ADDONS: CommunityAddon[] = [
  {
    id: "addon-1",
    kind: "flashcard-pack",
    languageId: "ko",
    name: "Korean Particles Master",
    description: "120 cards covering common Korean particles with examples.",
    sourceUrl: "https://github.com/open-lingo/community-addons",
    maintainerIds: ["user-1"],
    maintainerName: "Alex",
    upvoteCount: 89,
    discussionCount: 12,
    userUpvoted: false,
    updatedAt: "2025-02-15T00:00:00Z",
    itemCount: 120,
    deckId: "addon-particles",
  },
  {
    id: "addon-2",
    kind: "flashcard-pack",
    languageId: "ja",
    name: "JLPT N5 Vocab",
    description: "Essential vocabulary for JLPT N5 exam prep.",
    maintainerIds: ["user-2"],
    maintainerName: "Jordan",
    upvoteCount: 156,
    discussionCount: 5,
    userUpvoted: false,
    updatedAt: "2025-02-12T00:00:00Z",
    itemCount: 800,
    deckId: "addon-jlpt-n5",
  },
  {
    id: "addon-3",
    kind: "course",
    languageId: "ko",
    name: "K-Drama Phrases",
    description: "Learn phrases you hear in Korean dramas.",
    maintainerIds: ["user-1", "user-3"],
    maintainerName: "Alex",
    upvoteCount: 234,
    discussionCount: 8,
    userUpvoted: true,
    userMaintainer: false,
    updatedAt: "2025-02-14T00:00:00Z",
    itemCount: 12,
    deckId: "addon-kdrama",
    image: "https://picsum.photos/seed/kdrama/400/200",
    locale: "en",
  },
  {
    id: "addon-4",
    kind: "story",
    languageId: "ja",
    name: "Daily Life in Tokyo",
    description: "Short stories for intermediate learners.",
    maintainerIds: ["user-2"],
    maintainerName: "Jordan",
    upvoteCount: 45,
    discussionCount: 3,
    updatedAt: "2025-02-08T00:00:00Z",
    itemCount: 8,
  },
  {
    id: "addon-5",
    kind: "story",
    languageId: "ko",
    name: "Coffee Shop Chat",
    description: "A conversation at a Seoul coffee shop. Beginner-friendly.",
    maintainerIds: ["user-1"],
    maintainerName: "Alex",
    upvoteCount: 67,
    discussionCount: 6,
    updatedAt: "2025-02-16T00:00:00Z",
    itemCount: 1,
  },
  {
    id: "addon-6",
    kind: "story",
    languageId: "ko",
    name: "Lost in Seoul",
    description: "Asking for directions in Korean.",
    maintainerIds: ["user-3"],
    maintainerName: "Sam",
    upvoteCount: 34,
    discussionCount: 2,
    updatedAt: "2025-02-14T00:00:00Z",
    itemCount: 1,
  },
];

export function getAddonsForLanguage(languageId: string): CommunityAddon[] {
  return MOCK_ADDONS.filter((a) => a.languageId === languageId);
}

export function getAllAddons(): CommunityAddon[] {
  return [...MOCK_ADDONS].sort((a, b) => b.upvoteCount - a.upvoteCount);
}

/** Trending courses (by upvotes) for a language. */
export function getTrendingCourses(languageId: string): CommunityAddon[] {
  return MOCK_ADDONS.filter((a) => a.kind === "course" && a.languageId === languageId)
    .sort((a, b) => b.upvoteCount - a.upvoteCount)
    .slice(0, 4);
}

/** Trending flashcard packs (by upvotes) for a language. */
export function getTrendingCardPacks(languageId: string): CommunityAddon[] {
  return MOCK_ADDONS.filter(
    (a) => a.kind === "flashcard-pack" && a.languageId === languageId
  )
    .sort((a, b) => b.upvoteCount - a.upvoteCount)
    .slice(0, 4);
}

/** New stories for a language (by updatedAt). */
export function getNewStories(languageId: string): CommunityAddon[] {
  return sortByUpdatedAtDesc(
    MOCK_ADDONS.filter((a) => a.kind === "story" && a.languageId === languageId)
  ).slice(0, 4);
}

export function getOfficialCoursesByLanguage(languageId: string): OfficialCourseInfo[] {
  return MOCK_OFFICIAL_COURSES.filter((c) => c.languageId === languageId);
}

/** Language IDs that have official courses (for dropdown). */
export const OFFICIAL_COURSE_LANGUAGES = MOCK_OFFICIAL_COURSES.map((c) => c.languageId);
