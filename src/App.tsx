import { Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom";

import { lazyRetry } from "@/shared/utils/lazyRetry";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { RouteErrorBoundary } from "@/shared/components/RouteErrorBoundary";
import { Layout } from "@/routes/Layout";
import { LangLayout } from "@/routes/LangLayout";
import { LearnLayout } from "@/features/learn/LearnLayout";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
import { StoriesPage } from "@/features/stories/StoriesPage";
import { StoryDetailPage } from "@/features/stories/StoryDetailPage";
import { PracticeGrammarPage } from "@/features/practice/PracticeGrammarPage";
import { PracticeAlphabetHubPage } from "@/features/practice/PracticeAlphabetHubPage";
import { PracticePage } from "@/features/practice/PracticePage";
import { PracticeLayout } from "@/features/practice/PracticeLayout";
import { ParticlePracticePage } from "@/features/practice/ParticlePracticePage";
import { KanjiPracticePage } from "@/features/practice/KanjiPracticePage";
import { AlphabetPracticePage } from "@/features/practice/AlphabetPracticePage";
import { ComponentsPracticePage } from "@/features/practice/ComponentsPracticePage";
import { VideosPracticePage } from "@/features/practice/VideosPracticePage";
import { ConjugationPracticePage } from "@/features/practice/ConjugationPracticePage";
import { ReadingPracticePage } from "@/features/practice/ReadingPracticePage";
import { SpeakingPracticePage } from "@/features/practice/SpeakingPracticePage";
import { CounterPracticePage } from "@/features/practice/CounterPracticePage";
import { GrammarRedirect } from "@/features/grammar/GrammarRedirect";
import { PlacementTestPage } from "@/features/placement/PlacementTestPage";
import { RootRoute } from "@/routes/RootRoute";
import { LandingRoute } from "@/routes/LandingRoute";
import { ProtectedHome } from "@/routes/ProtectedHome";
import { RequireAuth } from "@/routes/RequireAuth";
import { SettingsOpenRoute } from "@/features/settings/SettingsOpenRoute";
import { SettingsProfileOpenRoute } from "@/features/settings/SettingsProfileOpenRoute";

// Lazy-loaded routes: anything heavy, role-restricted (admin/studio), or rarely-hit
// on first paint. Split here keeps the main bundle focused on the learner happy path.
const LoginPage = lazyRetry(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const LogoutPage = lazyRetry(() =>
  import("@/features/auth/LogoutPage").then((m) => ({ default: m.LogoutPage })),
);
const PrivacyPolicyPage = lazyRetry(() =>
  import("@/features/legal/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsOfServicePage = lazyRetry(() =>
  import("@/features/legal/TermsOfServicePage").then((m) => ({ default: m.TermsOfServicePage })),
);
const AboutPage = lazyRetry(() =>
  import("@/features/legal/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const VocabPage = lazyRetry(() =>
  import("@/features/vocab/VocabPage").then((m) => ({ default: m.VocabPage })),
);
const CommunityLayout = lazyRetry(() =>
  import("@/features/community/CommunityLayout").then((m) => ({ default: m.CommunityLayout })),
);
const LeaderboardRoute = lazyRetry(() =>
  import("@/features/leaderboard/LeaderboardRoute").then((m) => ({ default: m.LeaderboardRoute })),
);
const LessonPage = lazyRetry(() =>
  import("@/features/lesson/LessonPage").then((m) => ({ default: m.LessonPage })),
);

/**
 * Force-remount wrapper: React Router reuses the route element across
 * `:lessonId` changes (param updates only re-render — no unmount), so
 * `useState` values in LessonPage (`finished`, `currentStepIdx`,
 * `results`) leaked across navigations. That carried the previous
 * lesson's `finished=true` into the next lesson on Next-lesson clicks
 * and auto-fired `markLessonCompleted` with stale results — a tester
 * could spam Next and "complete" every lesson in a module without
 * grading anything. Keying on `lessonId` makes React drop and rebuild
 * the subtree on each navigation, resetting all state cleanly.
 */
function KeyedLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  return <LessonPage key={lessonId ?? "_"} />;
}
const SpeechTunePage = lazyRetry(() =>
  import("@/features/speech-tune/SpeechTunePage").then((m) => ({
    default: m.SpeechTunePage,
  })),
);
const LessonStepPreviewPage = lazyRetry(
  () => import("@/features/lesson/dev/LessonStepPreviewPage"),
);
const HomeRestructureMockup = lazyRetry(
  () => import("@/features/home/dev/HomeRestructureMockup"),
);
const SocialPreviewPage = lazyRetry(
  () => import("@/features/social/preview/SocialPreviewPage"),
);
const FriendsPage = lazyRetry(
  () => import("@/features/social/FriendsPage"),
);
const MessengerPage = lazyRetry(
  () => import("@/features/messenger/MessengerPage"),
);
const ShopPage = lazyRetry(() => import("@/features/shop/ShopPage"));
const LearnPage = lazyRetry(() => import("@/features/learn/LearnPage"));
const TravelSprintPage = lazyRetry(() => import("@/features/learn/TravelSprintPage"));
const AssetTestPage = lazyRetry(() => import("@/features/asset-test/AssetTestPage"));
const PickerTestPage = lazyRetry(() => import("@/features/picker-test/PickerTestPage"));
const GetStartedPage = lazyRetry(() => import("@/features/landing/GetStartedPage"));
const PreviewLessonPage = lazyRetry(() => import("@/features/preview/PreviewLessonPage"));
const FlashcardTester = lazyRetry(() =>
  import("@/features/flashcards/FlashcardTester").then((m) => ({ default: m.FlashcardTester })),
);
const CardManagerPage = lazyRetry(() =>
  import("@/features/flashcards/CardManagerPage").then((m) => ({ default: m.CardManagerPage })),
);
const DeckManagerPage = lazyRetry(() =>
  import("@/features/flashcards/DeckManagerPage").then((m) => ({ default: m.DeckManagerPage })),
);
const AlphabetLessonPage = lazyRetry(() =>
  import("@/features/practice/alphabet/AlphabetLessonPage").then((m) => ({
    default: m.AlphabetLessonPage,
  })),
);
const ContentBrowserPage = lazyRetry(() =>
  import("@/features/community/ContentBrowserPage").then((m) => ({ default: m.ContentBrowserPage })),
);
const ContributorsPage = lazyRetry(() =>
  import("@/features/community/ContributorsPage").then((m) => ({ default: m.ContributorsPage })),
);
const ExternalContentPage = lazyRetry(() =>
  import("@/features/community/ExternalContentPage").then((m) => ({ default: m.ExternalContentPage })),
);
const ExternalContentPracticePage = lazyRetry(() =>
  import("@/features/community/ExternalContentPracticePage").then((m) => ({
    default: m.ExternalContentPracticePage,
  })),
);
const ContributePage = lazyRetry(() =>
  import("@/features/community/ContributePage").then((m) => ({ default: m.ContributePage })),
);
const MyContentTab = lazyRetry(() =>
  import("@/features/community/contribute/MyContentTab").then((m) => ({ default: m.MyContentTab })),
);
const CreateTab = lazyRetry(() =>
  import("@/features/community/contribute/CreateTab").then((m) => ({ default: m.CreateTab })),
);
const AdminTab = lazyRetry(() =>
  import("@/features/community/contribute/AdminTab").then((m) => ({ default: m.AdminTab })),
);
const DeckEditor = lazyRetry(() =>
  import("@/features/community/contribute/DeckEditor").then((m) => ({ default: m.DeckEditor })),
);
const StoryEditor = lazyRetry(() =>
  import("@/features/community/contribute/StoryEditor").then((m) => ({ default: m.StoryEditor })),
);
const DeckCreatePage = lazyRetry(() =>
  import("@/features/community/DeckCreatePage").then((m) => ({ default: m.DeckCreatePage })),
);
const MyDecksPage = lazyRetry(() =>
  import("@/features/community/MyDecksPage").then((m) => ({ default: m.MyDecksPage })),
);
const SubscribedPage = lazyRetry(() =>
  import("@/features/community/SubscribedPage").then((m) => ({ default: m.SubscribedPage })),
);
const ForumPage = lazyRetry(() =>
  import("@/features/community/forum/ForumPage").then((m) => ({ default: m.ForumPage })),
);
const ThreadPage = lazyRetry(() =>
  import("@/features/community/forum/ThreadPage").then((m) => ({ default: m.ThreadPage })),
);
const NewThreadPage = lazyRetry(() =>
  import("@/features/community/forum/NewThreadPage").then((m) => ({ default: m.NewThreadPage })),
);
const AdminLayout = lazyRetry(() =>
  import("@/features/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminHomePage = lazyRetry(() =>
  import("@/features/admin/AdminHomePage").then((m) => ({ default: m.AdminHomePage })),
);
const AdminUsersListPage = lazyRetry(() =>
  import("@/features/admin/AdminUsersListPage").then((m) => ({ default: m.AdminUsersListPage })),
);
const AdminUserDetailPage = lazyRetry(() =>
  import("@/features/admin/AdminUserDetailPage").then((m) => ({ default: m.AdminUserDetailPage })),
);
const AdminModerationPage = lazyRetry(() =>
  import("@/features/admin/AdminModerationPage").then((m) => ({ default: m.AdminModerationPage })),
);
const AdminOpsPage = lazyRetry(() =>
  import("@/features/admin/AdminOpsPage").then((m) => ({ default: m.AdminOpsPage })),
);
const AdminDecksPage = lazyRetry(() =>
  import("@/features/admin/AdminDecksPage").then((m) => ({ default: m.AdminDecksPage })),
);
const AdminStoriesPage = lazyRetry(() =>
  import("@/features/admin/AdminStoriesPage").then((m) => ({ default: m.AdminStoriesPage })),
);
const AdminLessonsListPage = lazyRetry(() =>
  import("@/features/admin/lessons/AdminLessonsListPage").then((m) => ({
    default: m.AdminLessonsListPage,
  })),
);
const AdminLessonEditorPage = lazyRetry(() =>
  import("@/features/admin/lessons/AdminLessonEditorPage").then((m) => ({
    default: m.AdminLessonEditorPage,
  })),
);
const PublicProfilePage = lazyRetry(() =>
  import("@/features/profile/PublicProfilePage").then((m) => ({
    default: m.PublicProfilePage,
  })),
);

function ForumThreadRedirect() {
  const { threadId } = useParams<{ threadId: string }>();
  return <Navigate to={`../discuss/thread/${threadId}`} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <RootRoute /> },
      { path: "landing", element: <LandingRoute /> },
      { path: "home", element: <ProtectedHome /> },
      { path: "privacy", element: <PrivacyPolicyPage /> },
      { path: "terms", element: <TermsOfServicePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "get-started", element: <GetStartedPage /> },
      { path: "try", element: <PreviewLessonPage /> },
      { path: "logout", element: <LogoutPage /> },
      { path: "settings", element: <SettingsOpenRoute /> },
      { path: "settings/profile", element: <SettingsProfileOpenRoute /> },
      // Global public profile route — not nested under `/:lang/*` because
      // social is per-user, not per-language. Auth-optional (logged-out
      // viewers can see public profiles).
      { path: "u/:username", element: <PublicProfilePage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/home" replace /> },
          { path: "home", element: <AdminHomePage /> },
          { path: "users", element: <AdminUsersListPage /> },
          { path: "users/:userId", element: <AdminUserDetailPage /> },
          { path: "moderation", element: <AdminModerationPage /> },
          { path: "ops", element: <AdminOpsPage /> },
          // Deep-link compatibility — preserve old URLs during the migration.
          { path: "operations", element: <Navigate to="/admin/ops" replace /> },
          { path: "xp-config", element: <Navigate to="/admin/ops" replace /> },
          {
            path: "content",
            children: [
              { index: true, element: <Navigate to="/admin/moderation" replace /> },
              { path: "decks", element: <AdminDecksPage /> },
              { path: "stories", element: <AdminStoriesPage /> },
              { path: "lessons", element: <AdminLessonsListPage /> },
              { path: "lessons/:lessonId", element: <AdminLessonEditorPage /> },
            ],
          },
        ],
      },
      {
        path: ":lang",
        element: <RequireAuth />,
        children: [
          {
            element: <LangLayout />,
            children: [
              { index: true, element: <Navigate to="/" replace /> },
              {
                path: "learn",
                element: <LearnLayout />,
                children: [
                  { index: true, element: <LearnPage /> },
                  { path: "courses", element: <Navigate to=".." replace /> },
                  { path: "travel-sprint", element: <TravelSprintPage /> },
                  { path: "lessons/:lessonId", element: <KeyedLessonPage /> },
                  { path: "placement-test", element: <PlacementTestPage /> },
                  { path: "test-out/:moduleId", element: <PlacementTestPage /> },
                ],
              },
              {
                path: "practice",
                element: <PracticeLayout />,
                children: [
                  { index: true, element: <PracticePage /> },
                  { path: "grammar", element: <PracticeGrammarPage /> },
                  { path: "flashcards/review", element: <FlashcardTester /> },
                  { path: "flashcards/cards", element: <CardManagerPage /> },
                  { path: "flashcards/decks", element: <DeckManagerPage /> },
                  { path: "flashcards", element: <FlashcardsPage /> },
                  { path: "stories", element: <StoriesPage /> },
                  { path: "stories/:storyId", element: <StoryDetailPage /> },
                  { path: "particles", element: <ParticlePracticePage /> },
                  { path: "alphabet/:alphabetId/learn", element: <AlphabetLessonPage /> },
                  { path: "alphabet/:alphabetId", element: <AlphabetPracticePage /> },
                  { path: "alphabet", element: <PracticeAlphabetHubPage /> },
                  { path: "kanji", element: <KanjiPracticePage /> },
                  { path: "conjugation", element: <ConjugationPracticePage /> },
                  { path: "reading", element: <ReadingPracticePage /> },
                  { path: "speaking", element: <SpeakingPracticePage /> },
                  { path: "counters", element: <CounterPracticePage /> },
                  { path: "components", element: <ComponentsPracticePage /> },
                  { path: "videos", element: <VideosPracticePage /> },
                  { path: "external-content", element: <ExternalContentPracticePage /> },
                ],
              },
              { path: "vocab", element: <VocabPage /> },
              { path: "shop", element: <ShopPage /> },
              { path: "grammar", element: <GrammarRedirect /> },
              { path: "speech-tune", element: <SpeechTunePage /> },
              { path: "lesson-preview", element: <LessonStepPreviewPage /> },
              { path: "home-preview", element: <HomeRestructureMockup /> },
              { path: "social", element: <SocialPreviewPage /> },
              { path: "social/friends", element: <FriendsPage /> },
              { path: "messenger", element: <MessengerPage /> },
              { path: "messenger/:friendId", element: <MessengerPage /> },
              { path: "asset-test", element: <AssetTestPage /> },
              { path: "picker-test", element: <PickerTestPage /> },
              {
                path: "community",
                element: <CommunityLayout />,
                children: [
                  { index: true, element: <Navigate to="explore" replace /> },
                  { path: "explore", element: <ContentBrowserPage /> },
                  { path: "contributors", element: <ContributorsPage /> },
                  { path: "subscribed", element: <SubscribedPage /> },
                  { path: "decks/new", element: <DeckCreatePage /> },
                  { path: "decks/mine", element: <MyDecksPage /> },
                  { path: "decks/:deckId", element: <DeckEditor /> },
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
                  { path: "leaderboard", element: <LeaderboardRoute /> },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
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
