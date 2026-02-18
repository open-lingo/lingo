export type StorySource = "course" | "community";

export type Story = {
  id: string;
  title: string;
  description?: string;
  languageId: string;
  source: StorySource;
  read?: boolean;
  isNew?: boolean;
  updatedAt?: string;
};

const MOCK_COURSE_STORIES: Story[] = [
  { id: "cs-1", title: "Meeting Min-jun", description: "A short dialogue at the bus stop.", languageId: "ko", source: "course", read: true, updatedAt: "2025-02-15" },
  { id: "cs-2", title: "At the market", description: "Buying fruit and vegetables.", languageId: "ko", source: "course", isNew: true, updatedAt: "2025-02-17" },
  { id: "cs-3", title: "The first day", description: "Introduction to the course.", languageId: "ko", source: "course", read: true, updatedAt: "2025-02-10" },
  { id: "cs-4", title: "Meeting Yuki", description: "A short introduction at the train station.", languageId: "ja", source: "course", isNew: true, updatedAt: "2025-02-16" },
  { id: "cs-5", title: "At the konbini", description: "Buying snacks at a convenience store.", languageId: "ja", source: "course", updatedAt: "2025-02-14" },
  { id: "cs-6", title: "First day of school", description: "Introducing yourself to your class.", languageId: "ja", source: "course", updatedAt: "2025-02-11" },
];

const MOCK_COMMUNITY_STORIES: Story[] = [
  { id: "cm-1", title: "Coffee shop chat", description: "Community story by @learner1.", languageId: "ko", source: "community", isNew: true, updatedAt: "2025-02-16" },
  { id: "cm-2", title: "Lost in Seoul", description: "Asking for directions.", languageId: "ko", source: "community", read: true, updatedAt: "2025-02-14" },
  { id: "cm-3", title: "Dinner with friends", description: "Informal conversation.", languageId: "ko", source: "community", updatedAt: "2025-02-12" },
  { id: "cm-4", title: "Ramen shop order", description: "Ordering at a ramen shop in Osaka.", languageId: "ja", source: "community", isNew: true, updatedAt: "2025-02-15" },
  { id: "cm-5", title: "Train to Kyoto", description: "Buying a Shinkansen ticket.", languageId: "ja", source: "community", updatedAt: "2025-02-13" },
];

export function getCourseStories(languageId?: string): Story[] {
  if (languageId) return MOCK_COURSE_STORIES.filter((s) => s.languageId === languageId);
  return MOCK_COURSE_STORIES;
}

export function getCommunityStories(languageId?: string): Story[] {
  if (languageId) return MOCK_COMMUNITY_STORIES.filter((s) => s.languageId === languageId);
  return MOCK_COMMUNITY_STORIES;
}

export function getStoryById(id: string): Story | undefined {
  return [...MOCK_COURSE_STORIES, ...MOCK_COMMUNITY_STORIES].find((s) => s.id === id);
}
