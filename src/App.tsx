import { Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom";

import { lazyRetry } from "@/shared/utils/lazyRetry";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { RouteErrorBoundary } from "@/shared/components/RouteErrorBoundary";
import { Layout } from "@/routes/Layout";
import { LangLayout } from "@/routes/LangLayout";
import { LearnLayout } from "@/features/learn/LearnLayout";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
import { PracticePage } from "@/features/practice/PracticePage";
import { PracticeLayout } from "@/features/practice/PracticeLayout";
import { GrammarRedirect } from "@/features/grammar/GrammarRedirect";
import { RootRoute } from "@/routes/RootRoute";
import { LandingRoute } from "@/routes/LandingRoute";
import { ProtectedHome } from "@/routes/ProtectedHome";
import { RequireAuth } from "@/routes/RequireAuth";
import { SettingsOpenRoute } from "@/features/settings/SettingsOpenRoute";

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
const ProgressPage = lazyRetry(() =>
  import("@/features/progress/ProgressPage").then((m) => ({ default: m.ProgressPage })),
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
const QaTestDrivePage = lazyRetry(
  () => import("@/features/lesson/dev/QaTestDrivePage"),
);
const HomeRestructureMockup = lazyRetry(
  () => import("@/features/home/dev/HomeRestructureMockup"),
);
const SocialPage = lazyRetry(
  () => import("@/features/social/SocialPage"),
);
const FriendsPage = lazyRetry(
  () => import("@/features/social/FriendsPage"),
);
const MessengerPage = lazyRetry(
  () => import("@/features/messenger/MessengerPage"),
);
const ShopPage = lazyRetry(() => import("@/features/shop/ShopPage"));
const LearnPage = lazyRetry(() => import("@/features/learn/LearnPage"));
// Practice subroutes + placement + stories — reached only via the
// Practice tab or onboarding. Keeping them out of the main bundle drops
// ~200KB raw / ~50KB gzip from first-paint chunks.
const StoriesPage = lazyRetry(() =>
  import("@/features/stories/StoriesPage").then((m) => ({ default: m.StoriesPage })),
);
const StoryDetailPage = lazyRetry(() =>
  import("@/features/stories/StoryDetailPage").then((m) => ({ default: m.StoryDetailPage })),
);
const PracticeGrammarPage = lazyRetry(() =>
  import("@/features/practice/PracticeGrammarPage").then((m) => ({ default: m.PracticeGrammarPage })),
);
const GrammarReviewSessionPage = lazyRetry(() =>
  import("@/features/practice/grammar/GrammarReviewSessionPage").then((m) => ({
    default: m.GrammarReviewSessionPage,
  })),
);
const PracticeAlphabetHubPage = lazyRetry(() =>
  import("@/features/practice/PracticeAlphabetHubPage").then((m) => ({ default: m.PracticeAlphabetHubPage })),
);
const ParticlePracticePage = lazyRetry(() =>
  import("@/features/practice/ParticlePracticePage").then((m) => ({ default: m.ParticlePracticePage })),
);
const KanjiPracticePage = lazyRetry(() =>
  import("@/features/practice/KanjiPracticePage").then((m) => ({ default: m.KanjiPracticePage })),
);
const AlphabetPracticePage = lazyRetry(() =>
  import("@/features/practice/AlphabetPracticePage").then((m) => ({ default: m.AlphabetPracticePage })),
);
const ComponentsPracticePage = lazyRetry(() =>
  import("@/features/practice/ComponentsPracticePage").then((m) => ({ default: m.ComponentsPracticePage })),
);
const VideosPracticePage = lazyRetry(() =>
  import("@/features/practice/VideosPracticePage").then((m) => ({ default: m.VideosPracticePage })),
);
const ConjugationPracticePage = lazyRetry(() =>
  import("@/features/practice/ConjugationPracticePage").then((m) => ({ default: m.ConjugationPracticePage })),
);
const TrainerTypeSession = lazyRetry(() =>
  import("@/features/practice/conjugation/TrainerTypeSession").then((m) => ({ default: m.TrainerTypeSession })),
);
const ConjugationFreeDrillPage = lazyRetry(() =>
  import("@/features/practice/conjugation/FreeDrillPage").then((m) => ({ default: m.FreeDrillPage })),
);
const ConjugationCombinedSession = lazyRetry(() =>
  import("@/features/practice/conjugation/CombinedSession").then((m) => ({ default: m.CombinedSession })),
);
const ReadingPracticePage = lazyRetry(() =>
  import("@/features/practice/ReadingPracticePage").then((m) => ({ default: m.ReadingPracticePage })),
);
const SpeakingPracticePage = lazyRetry(() =>
  import("@/features/practice/SpeakingPracticePage").then((m) => ({ default: m.SpeakingPracticePage })),
);
const CounterPracticePage = lazyRetry(() =>
  import("@/features/practice/CounterPracticePage").then((m) => ({ default: m.CounterPracticePage })),
);
const PlacementTestPage = lazyRetry(() =>
  import("@/features/placement/PlacementTestPage").then((m) => ({ default: m.PlacementTestPage })),
);
const TravelSprintPage = lazyRetry(() => import("@/features/learn/TravelSprintPage"));
const CourseMapPage = lazyRetry(() =>
  import("@/features/learn/CourseMapPage").then((m) => ({ default: m.CourseMapPage })),
);
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
const CommunityHomePage = lazyRetry(() =>
  import("@/features/community/CommunityHomePage").then((m) => ({ default: m.CommunityHomePage })),
);
const ContentBrowserPage = lazyRetry(() =>
  import("@/features/community/ContentBrowserPage").then((m) => ({ default: m.ContentBrowserPage })),
);
const LibraryPage = lazyRetry(() =>
  import("@/features/community/LibraryPage").then((m) => ({ default: m.LibraryPage })),
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
const ForumPage = lazyRetry(() =>
  import("@/features/community/forum/ForumPage").then((m) => ({ default: m.ForumPage })),
);
const ThreadPage = lazyRetry(() =>
  import("@/features/community/forum/ThreadPage").then((m) => ({ default: m.ThreadPage })),
);
const NewThreadPage = lazyRetry(() =>
  import("@/features/community/forum/NewThreadPage").then((m) => ({ default: m.NewThreadPage })),
);
const AdminShell = lazyRetry(() =>
  import("@/features/admin/AdminLayout").then((m) => ({ default: m.AdminShell })),
);
const AdminInnerShell = lazyRetry(() =>
  import("@/features/admin/AdminLayout").then((m) => ({ default: m.AdminInnerShell })),
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
const AdminAuditPage = lazyRetry(() =>
  import("@/features/admin/AdminAuditPage").then((m) => ({ default: m.AdminAuditPage })),
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
const AdminEventsPage = lazyRetry(
  () => import("@/features/admin/events/EventsPage"),
);
const AdminLmsPage = lazyRetry(() =>
  import("@/features/admin/AdminLmsPage").then((m) => ({ default: m.AdminLmsPage })),
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
      // Global public profile route — not nested under `/:lang/*` because
      // social is per-user, not per-language. Auth-optional (logged-out
      // viewers can see public profiles).
      { path: "u/:username", element: <PublicProfilePage /> },
      {
        path: "admin",
        children: [
          // Dashboard hub — no sidebar, full-width layout
          {
            element: <AdminShell />,
            children: [
              { index: true, element: <Navigate to="/admin/home" replace /> },
              { path: "home", element: <AdminHomePage /> },
            ],
          },
          // Inner admin pages — no sidebar; just a back-to-dashboard link.
          // Navigation lives on /admin/home; pages are reachable via the
          // dashboard's nav-cards grid or in-content cross-links.
          {
            element: <AdminInnerShell />,
            children: [
              { path: "users", element: <AdminUsersListPage /> },
              { path: "users/:userId", element: <AdminUserDetailPage /> },
              { path: "moderation", element: <AdminModerationPage /> },
              { path: "ops", element: <AdminOpsPage /> },
              { path: "ops/audit", element: <AdminAuditPage /> },
              { path: "events", element: <AdminEventsPage /> },
              { path: "lms", element: <AdminLmsPage /> },
              // Deep-link compatibility — preserve old URLs during the migration.
              { path: "operations", element: <Navigate to="/admin/ops" replace /> },
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
                  { path: "course", element: <CourseMapPage /> },
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
                  { path: "journey", element: <ProgressPage /> },
                  { path: "grammar", element: <PracticeGrammarPage /> },
                  { path: "grammar/review", element: <GrammarReviewSessionPage /> },
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
                  { path: "conjugation/free", element: <ConjugationFreeDrillPage /> },
                  { path: "conjugation/train", element: <ConjugationCombinedSession /> },
                  { path: "conjugation/:typeId", element: <TrainerTypeSession /> },
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
              { path: "qa", element: <QaTestDrivePage /> },
              { path: "home-preview", element: <HomeRestructureMockup /> },
              { path: "social", element: <SocialPage /> },
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
                  { path: "explore", element: <CommunityHomePage /> },
                  { path: "browse", element: <ContentBrowserPage /> },
                  { path: "library", element: <LibraryPage /> },
                  { path: "contributors", element: <ContributorsPage /> },
                  { path: "decks/new", element: <DeckCreatePage /> },
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
