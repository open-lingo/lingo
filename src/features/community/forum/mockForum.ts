import { sortByCreatedAtAsc } from "@/shared/utils/dateUtils";
import type { ForumCategory, ForumTag, ForumThread, ForumPost, TopContributor } from "./types";

export const FORUM_CATEGORIES: ForumCategory[] = [
  { id: "general", slug: "general", nameKey: "forum.categoryGeneral", descriptionKey: "forum.categoryGeneralDesc", topicsCount: 42, latestActivity: "2025-02-16T09:00:00Z", moderatorName: "Open Lingo" },
  { id: "features", slug: "features", nameKey: "forum.categoryFeatures", descriptionKey: "forum.categoryFeaturesDesc", topicsCount: 18, latestActivity: "2025-02-16T09:00:00Z", moderatorName: "Alex" },
  { id: "bugs", slug: "bugs", nameKey: "forum.categoryBugs", descriptionKey: "forum.categoryBugsDesc", topicsCount: 9, latestActivity: "2025-02-13T16:00:00Z", moderatorName: "Sam" },
  { id: "tips", slug: "tips", nameKey: "forum.categoryTips", descriptionKey: "forum.categoryTipsDesc", topicsCount: 31, latestActivity: "2025-02-15T08:00:00Z", moderatorName: "Jordan" },
  { id: "content", slug: "content", nameKey: "forum.categoryContent", descriptionKey: "forum.categoryContentDesc", topicsCount: 12, latestActivity: "2025-02-12T11:00:00Z" },
];

export const FORUM_TAGS: ForumTag[] = [
  { id: "help", slug: "help", name: "help", color: "blue" },
  { id: "korean", slug: "korean", name: "Korean", color: "green" },
  { id: "japanese", slug: "japanese", name: "Japanese", color: "red" },
  { id: "flashcards", slug: "flashcards", name: "flashcards", color: "purple" },
  { id: "ux", slug: "ux", name: "UX", color: "amber" },
  { id: "beginner", slug: "beginner", name: "beginner", color: "emerald" },
];

export const MOCK_THREADS: ForumThread[] = [
  {
    id: "t1",
    categoryId: "features",
    title: "Dark mode improvements",
    excerpt: "Would love to see more theme options and automatic switching based on system preference.",
    bodyMarkdown: "Would love to see more theme options and automatic switching based on system preference.\n\nRight now we have light/dark but I'd like:\n- AMOLED black option\n- Custom accent colors\n- Schedule-based switching",
    authorId: "u1",
    authorName: "Alex",
    createdAt: "2025-02-15T14:00:00Z",
    updatedAt: "2025-02-16T09:00:00Z",
    replyCount: 12,
    upvoteCount: 34,
    downvoteCount: 2,
    tagIds: ["ux"],
    viewCount: 342,
    status: "hot",
  },
  {
    id: "t2",
    categoryId: "tips",
    title: "Best way to practice Hangul pronunciation?",
    excerpt: "I've been using the alphabet practice but struggling with certain vowel combinations. Any tips?",
    bodyMarkdown: "I've been using the alphabet practice but struggling with certain vowel combinations like ㅢ and ㅚ.\n\nWhat's worked for you?",
    authorId: "u2",
    authorName: "Jordan",
    createdAt: "2025-02-14T10:30:00Z",
    updatedAt: "2025-02-15T08:00:00Z",
    replyCount: 8,
    upvoteCount: 21,
    downvoteCount: 0,
    tagIds: ["korean", "beginner", "help"],
    viewCount: 156,
    status: "new",
  },
  {
    id: "t3",
    categoryId: "bugs",
    title: "Flashcard deck doesn't load for Japanese",
    excerpt: "Selecting Japanese and going to Flashcards shows a blank screen. Korean works fine.",
    bodyMarkdown: "Steps to reproduce:\n1. Switch language to Japanese\n2. Go to Flashcards\n3. Blank screen, no cards load\n\nKorean works fine.",
    authorId: "u3",
    authorName: "Sam",
    createdAt: "2025-02-13T16:00:00Z",
    updatedAt: "2025-02-13T16:00:00Z",
    replyCount: 3,
    upvoteCount: 15,
    downvoteCount: 1,
    tagIds: ["japanese", "flashcards"],
    viewCount: 89,
    status: "solved",
  },
  {
    id: "t4",
    categoryId: "general",
    title: "Welcome to the Open Lingo community forum!",
    excerpt: "Introduce yourself and share what you're learning.",
    bodyMarkdown: "Welcome! This is the place to discuss, ask questions, and share tips. Be kind and helpful.",
    authorId: "u0",
    authorName: "Open Lingo",
    createdAt: "2025-02-10T00:00:00Z",
    updatedAt: "2025-02-10T00:00:00Z",
    replyCount: 24,
    upvoteCount: 89,
    downvoteCount: 0,
    tagIds: [],
    isPinned: true,
    viewCount: 1204,
    status: "hot",
  },
  {
    id: "t5",
    categoryId: "content",
    title: "Request: More particle examples for Korean",
    excerpt: "The particle practice is great but I'd love more real-world sentence examples.",
    bodyMarkdown: "The particle practice is great but I'd love more real-world sentence examples for 는/은, 이/가, etc.",
    authorId: "u1",
    authorName: "Alex",
    createdAt: "2025-02-12T11:00:00Z",
    updatedAt: "2025-02-12T11:00:00Z",
    replyCount: 5,
    upvoteCount: 18,
    downvoteCount: 0,
    tagIds: ["korean", "help"],
    viewCount: 67,
  },
];

export const TOP_CONTRIBUTORS: TopContributor[] = [
  { id: "u1", name: "Alex", postCount: 42 },
  { id: "u2", name: "Jordan", postCount: 38 },
  { id: "u3", name: "Sam", postCount: 21 },
];

export const MOCK_POSTS: ForumPost[] = [
  {
    id: "p1",
    threadId: "t1",
    bodyMarkdown: "Great idea! AMOLED black would be easier on the eyes at night.",
    authorId: "u2",
    authorName: "Jordan",
    createdAt: "2025-02-15T15:30:00Z",
    upvoteCount: 8,
    downvoteCount: 0,
  },
  {
    id: "p2",
    threadId: "t1",
    bodyMarkdown: "You can use `prefers-color-scheme` in CSS — the app might already support it. Check your system settings.",
    authorId: "u3",
    authorName: "Sam",
    createdAt: "2025-02-15T16:00:00Z",
    upvoteCount: 5,
    downvoteCount: 0,
  },
  {
    id: "p3",
    threadId: "t2",
    parentId: undefined,
    bodyMarkdown: "For ㅢ I find it helps to say \"eu-ee\" quickly. For ㅚ, it's close to \"weh\" as in \"wedding\".",
    authorId: "u1",
    authorName: "Alex",
    createdAt: "2025-02-14T12:00:00Z",
    upvoteCount: 12,
    downvoteCount: 0,
  },
  {
    id: "p4",
    threadId: "t2",
    bodyMarkdown: "Thanks! The wedding tip really helps with ㅚ.",
    authorId: "u2",
    authorName: "Jordan",
    createdAt: "2025-02-14T14:00:00Z",
    parentId: "p3",
    upvoteCount: 3,
    downvoteCount: 0,
  },
];

export function getThreadsByCategory(categoryId: string | null): ForumThread[] {
  const list = [...MOCK_THREADS].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  if (!categoryId) return list;
  return list.filter((t) => t.categoryId === categoryId);
}

export function getThreadsHot(): ForumThread[] {
  return [...MOCK_THREADS].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const scoreA = a.upvoteCount - a.downvoteCount + a.replyCount * 2;
    const scoreB = b.upvoteCount - b.downvoteCount + b.replyCount * 2;
    return scoreB - scoreA;
  });
}

export function getThreadById(id: string): ForumThread | undefined {
  return MOCK_THREADS.find((t) => t.id === id);
}

export function getPostsByThreadId(threadId: string): ForumPost[] {
  return sortByCreatedAtAsc(
    MOCK_POSTS.filter((p) => p.threadId === threadId)
  );
}

export function getTagById(id: string): ForumTag | undefined {
  return FORUM_TAGS.find((t) => t.id === id);
}
