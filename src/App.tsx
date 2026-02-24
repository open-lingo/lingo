import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "@/routes/Layout";
import { LangLayout } from "@/routes/LangLayout";
import { HomePage } from "@/features/home/HomePage";
import { LoginPage } from "@/features/auth/LoginPage";
import { LogoutPage } from "@/features/auth/LogoutPage";
import { LearnLayout } from "@/features/learn/LearnLayout";
import { LearnPage } from "@/features/learn/LearnPage";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
import { FlashcardTester } from "@/features/flashcards/FlashcardTester";
import { CardManagerPage } from "@/features/flashcards/CardManagerPage";
import { DeckManagerPage } from "@/features/flashcards/DeckManagerPage";
import { StoriesPage } from "@/features/stories/StoriesPage";
import { StoryDetailPage } from "@/features/stories/StoryDetailPage";
import { VocabPage } from "@/features/vocab/VocabPage";
import { PracticeLayout } from "@/features/practice/PracticeLayout";
import { ParticlePracticePage } from "@/features/practice/ParticlePracticePage";
import { KanjiPracticePage } from "@/features/practice/KanjiPracticePage";
import { AlphabetPracticePage } from "@/features/practice/AlphabetPracticePage";
import { ComponentsPracticePage } from "@/features/practice/ComponentsPracticePage";
import { VideosPracticePage } from "@/features/practice/VideosPracticePage";
import { GrammarPage } from "@/features/grammar/GrammarPage";
import { CommunityLayout } from "@/features/community/CommunityLayout";
import { ContentBrowserPage } from "@/features/community/ContentBrowserPage";
import { ExternalContentPage } from "@/features/community/ExternalContentPage";
import { ContributePage } from "@/features/community/ContributePage";
import { MyContentTab } from "@/features/community/contribute/MyContentTab";
import { CreateTab } from "@/features/community/contribute/CreateTab";
import { DeckEditor } from "@/features/community/contribute/DeckEditor";
import { StoryEditor } from "@/features/community/contribute/StoryEditor";
import { AdminTab } from "@/features/community/contribute/AdminTab";
import { StudioLayout } from "@/features/studio/StudioLayout";
import { ForumPage } from "@/features/community/forum/ForumPage";
import { ThreadPage } from "@/features/community/forum/ThreadPage";
import { NewThreadPage } from "@/features/community/forum/NewThreadPage";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { LessonPage } from "@/features/lesson/LessonPage";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { AdminUsersLayout } from "@/features/admin/AdminUsersLayout";
import { AdminUserEmptyState } from "@/features/admin/AdminUserEmptyState";
import { AdminUserDetailPage } from "@/features/admin/AdminUserDetailPage";
import { AdminContentLayout } from "@/features/admin/AdminContentLayout";
import { AdminDecksPage } from "@/features/admin/AdminDecksPage";
import { AdminStoriesPage } from "@/features/admin/AdminStoriesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "logout", element: <LogoutPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/users" replace /> },
          {
            path: "users",
            element: <AdminUsersLayout />,
            children: [
              { index: true, element: <AdminUserEmptyState /> },
              { path: ":userId", element: <AdminUserDetailPage /> },
            ],
          },
          {
            path: "content",
            element: <AdminContentLayout />,
            children: [
              { index: true, element: <Navigate to="decks" replace /> },
              { path: "decks", element: <AdminDecksPage /> },
              { path: "stories", element: <AdminStoriesPage /> },
            ],
          },
        ],
      },
      {
        path: ":lang",
        element: <LangLayout />,
        children: [
          { index: true, element: <Navigate to="/" replace /> },
          {
            path: "learn",
            element: <LearnLayout />,
            children: [
              { index: true, element: <LearnPage /> },
              { path: "courses", element: <Navigate to=".." replace /> },
              { path: "lessons/:lessonId", element: <LessonPage /> },
            ],
          },
          {
            path: "practice",
            element: <PracticeLayout />,
            children: [
              { index: true, element: <FlashcardsPage /> },
              { path: "flashcards/review", element: <FlashcardTester /> },
              { path: "flashcards/cards", element: <CardManagerPage /> },
              { path: "flashcards/decks", element: <DeckManagerPage /> },
              { path: "flashcards", element: <FlashcardsPage /> },
              { path: "stories", element: <StoriesPage /> },
              { path: "stories/:storyId", element: <StoryDetailPage /> },
              { path: "particles", element: <ParticlePracticePage /> },
              { path: "alphabet/:alphabetId?", element: <AlphabetPracticePage /> },
              { path: "kanji", element: <KanjiPracticePage /> },
              { path: "components", element: <ComponentsPracticePage /> },
              { path: "videos", element: <VideosPracticePage /> },
            ],
          },
          { path: "vocab", element: <VocabPage /> },
          { path: "grammar", element: <GrammarPage /> },
          {
            path: "community",
            element: <CommunityLayout />,
            children: [
              { index: true, element: <Navigate to="explore" replace /> },
              { path: "explore", element: <ContentBrowserPage /> },
              { path: "external-content", element: <ExternalContentPage /> },
              {
                path: "contribute",
                element: <ContributePage />,
                children: [
                  { index: true, element: <MyContentTab /> },
                  { path: "admin", element: <AdminTab /> },
                  { path: "create", element: <CreateTab /> },
                  { path: "create/story", element: <StoryEditor /> },
                  { path: "create/story/:storyId", element: <StoryEditor /> },
                ],
              },
              { path: "discuss", element: <ForumPage /> },
              { path: "discuss/thread/:threadId", element: <ThreadPage /> },
              { path: "discuss/new", element: <NewThreadPage /> },
              { path: "forum", element: <ForumPage /> },
              { path: "forum/thread/:threadId", element: <ThreadPage /> },
              { path: "forum/new", element: <NewThreadPage /> },
              { path: "leaderboard", element: <LeaderboardPage /> },
            ],
          },
          {
            path: "studio",
            element: <StudioLayout />,
            children: [
              { path: "decks/new", element: <DeckEditor /> },
              { path: "decks/:deckId", element: <DeckEditor /> },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
