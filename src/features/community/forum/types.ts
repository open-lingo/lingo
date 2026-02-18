export type ForumCategory = {
  id: string;
  nameKey: string;
  slug: string;
  descriptionKey: string;
  topicsCount: number;
  latestActivity: string;
  moderatorName?: string;
};

export type ForumTag = {
  id: string;
  name: string;
  slug: string;
  color?: string;
};

export type ForumThread = {
  id: string;
  categoryId: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  userVote?: 1 | -1;
  tagIds: string[];
  isPinned?: boolean;
  viewCount?: number;
  status?: "hot" | "solved" | "new";
};

export type TopContributor = {
  id: string;
  name: string;
  postCount: number;
};

export type ForumPost = {
  id: string;
  threadId: string;
  parentId?: string;
  bodyMarkdown: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  upvoteCount: number;
  downvoteCount: number;
  userVote?: 1 | -1;
};
