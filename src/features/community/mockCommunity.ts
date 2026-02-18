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
        targetId: "m1-l1",
        targetLabel: "Greetings",
        title: "Add honorific greeting variants",
        description: "Include more formal/informal greeting options.",
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
  {
    id: "official-zh",
    languageId: "zh",
    title: "Chinese for Beginners",
    description: "Pinyin, characters, and foundations.",
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
    upvoteCount: 89,
    userUpvoted: false,
    updatedAt: "2025-02-15T00:00:00Z",
    itemCount: 120,
  },
  {
    id: "addon-2",
    kind: "flashcard-pack",
    languageId: "ja",
    name: "JLPT N5 Vocab",
    description: "Essential vocabulary for JLPT N5 exam prep.",
    maintainerIds: ["user-2"],
    upvoteCount: 156,
    userUpvoted: false,
    updatedAt: "2025-02-12T00:00:00Z",
    itemCount: 800,
  },
  {
    id: "addon-3",
    kind: "course",
    languageId: "ko",
    name: "K-Drama Phrases",
    description: "Learn phrases you hear in Korean dramas.",
    maintainerIds: ["user-1", "user-3"],
    upvoteCount: 234,
    userUpvoted: true,
    userMaintainer: false,
    updatedAt: "2025-02-14T00:00:00Z",
    itemCount: 12,
  },
  {
    id: "addon-4",
    kind: "story",
    languageId: "ja",
    name: "Daily Life in Tokyo",
    description: "Short stories for intermediate learners.",
    maintainerIds: ["user-2"],
    upvoteCount: 45,
    updatedAt: "2025-02-08T00:00:00Z",
    itemCount: 8,
  },
];

export function getAddonsForLanguage(languageId: string): CommunityAddon[] {
  return MOCK_ADDONS.filter((a) => a.languageId === languageId);
}

export function getAllAddons(): CommunityAddon[] {
  return [...MOCK_ADDONS].sort((a, b) => b.upvoteCount - a.upvoteCount);
}

export function getOfficialCoursesByLanguage(languageId: string): OfficialCourseInfo[] {
  return MOCK_OFFICIAL_COURSES.filter((c) => c.languageId === languageId);
}

/** Language IDs that have official courses (for dropdown). */
export const OFFICIAL_COURSE_LANGUAGES = MOCK_OFFICIAL_COURSES.map((c) => c.languageId);
