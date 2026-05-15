import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom";

import { Layout } from "@/routes/Layout";
import { LangLayout } from "@/routes/LangLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { LogoutPage } from "@/features/auth/LogoutPage";
import { LearnLayout } from "@/features/learn/LearnLayout";
import { LearnPage } from "@/features/learn/LearnPage";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
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
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { RootRoute } from "@/routes/RootRoute";
import { ProtectedHome } from "@/routes/ProtectedHome";

// Lazy-loaded routes: anything heavy, role-restricted (admin/studio), or rarely-hit
// on first paint. Split here keeps the main bundle focused on the learner happy path.
const DocsPage = lazy(() =>
  import("@/features/docs/DocsPage").then((m) => ({ default: m.DocsPage })),
);
const LessonPage = lazy(() =>
  import("@/features/lesson/LessonPage").then((m) => ({ default: m.LessonPage })),
);
const FlashcardTester = lazy(() =>
  import("@/features/flashcards/FlashcardTester").then((m) => ({ default: m.FlashcardTester })),
);
const CardManagerPage = lazy(() =>
  import("@/features/flashcards/CardManagerPage").then((m) => ({ default: m.CardManagerPage })),
);
const DeckManagerPage = lazy(() =>
  import("@/features/flashcards/DeckManagerPage").then((m) => ({ default: m.DeckManagerPage })),
);
const AlphabetLessonPage = lazy(() =>
  import("@/features/practice/alphabet/AlphabetLessonPage").then((m) => ({
    default: m.AlphabetLessonPage,
  })),
);
const ContentBrowserPage = lazy(() =>
  import("@/features/community/ContentBrowserPage").then((m) => ({ default: m.ContentBrowserPage })),
);
const ExternalContentPage = lazy(() =>
  import("@/features/community/ExternalContentPage").then((m) => ({ default: m.ExternalContentPage })),
);
const ExternalContentPracticePage = lazy(() =>
  import("@/features/community/ExternalContentPracticePage").then((m) => ({
    default: m.ExternalContentPracticePage,
  })),
);
const ContributePage = lazy(() =>
  import("@/features/community/ContributePage").then((m) => ({ default: m.ContributePage })),
);
const MyContentTab = lazy(() =>
  import("@/features/community/contribute/MyContentTab").then((m) => ({ default: m.MyContentTab })),
);
const CreateTab = lazy(() =>
  import("@/features/community/contribute/CreateTab").then((m) => ({ default: m.CreateTab })),
);
const AdminTab = lazy(() =>
  import("@/features/community/contribute/AdminTab").then((m) => ({ default: m.AdminTab })),
);
const DeckEditor = lazy(() =>
  import("@/features/community/contribute/DeckEditor").then((m) => ({ default: m.DeckEditor })),
);
const StoryEditor = lazy(() =>
  import("@/features/community/contribute/StoryEditor").then((m) => ({ default: m.StoryEditor })),
);
const StudioLayout = lazy(() =>
  import("@/features/studio/StudioLayout").then((m) => ({ default: m.StudioLayout })),
);
const ForumPage = lazy(() =>
  import("@/features/community/forum/ForumPage").then((m) => ({ default: m.ForumPage })),
);
const ThreadPage = lazy(() =>
  import("@/features/community/forum/ThreadPage").then((m) => ({ default: m.ThreadPage })),
);
const NewThreadPage = lazy(() =>
  import("@/features/community/forum/NewThreadPage").then((m) => ({ default: m.NewThreadPage })),
);
const AdminLayout = lazy(() =>
  import("@/features/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminUsersLayout = lazy(() =>
  import("@/features/admin/AdminUsersLayout").then((m) => ({ default: m.AdminUsersLayout })),
);
const AdminUserEmptyState = lazy(() =>
  import("@/features/admin/AdminUserEmptyState").then((m) => ({ default: m.AdminUserEmptyState })),
);
const AdminUserDetailPage = lazy(() =>
  import("@/features/admin/AdminUserDetailPage").then((m) => ({ default: m.AdminUserDetailPage })),
);
const AdminContentLayout = lazy(() =>
  import("@/features/admin/AdminContentLayout").then((m) => ({ default: m.AdminContentLayout })),
);
const AdminDecksPage = lazy(() =>
  import("@/features/admin/AdminDecksPage").then((m) => ({ default: m.AdminDecksPage })),
);
const AdminStoriesPage = lazy(() =>
  import("@/features/admin/AdminStoriesPage").then((m) => ({ default: m.AdminStoriesPage })),
);

function ForumThreadRedirect() {
  const { threadId } = useParams<{ threadId: string }>();
  return <Navigate to={`../discuss/thread/${threadId}`} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <RootRoute /> },
      { path: "home", element: <ProtectedHome /> },
      { path: "docs", element: <DocsPage /> },
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
              { path: "alphabet/:alphabetId/learn", element: <AlphabetLessonPage /> },
              { path: "alphabet/:alphabetId?", element: <AlphabetPracticePage /> },
              { path: "kanji", element: <KanjiPracticePage /> },
              { path: "components", element: <ComponentsPracticePage /> },
              { path: "videos", element: <VideosPracticePage /> },
              { path: "external-content", element: <ExternalContentPracticePage /> },
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
              { path: "forum", element: <Navigate to="discuss" replace /> },
              { path: "forum/thread/:threadId", element: <ForumThreadRedirect /> },
              { path: "forum/new", element: <Navigate to="../../discuss/new" replace /> },
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
  return (
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
