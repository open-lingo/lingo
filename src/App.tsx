import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Layout } from "@/routes/Layout";
import { LangLayout } from "@/routes/LangLayout";
import { HomePage } from "@/features/home/HomePage";
import { LoginPage } from "@/features/auth/LoginPage";
import { LogoutPage } from "@/features/auth/LogoutPage";
import { LearnLayout } from "@/features/learn/LearnLayout";
import { LearnPage } from "@/features/learn/LearnPage";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
import { FlashcardTester } from "@/features/flashcards/FlashcardTester";
import { StoriesPage } from "@/features/stories/StoriesPage";
import { StoryDetailPage } from "@/features/stories/StoryDetailPage";
import { VocabPage } from "@/features/vocab/VocabPage";
import { PracticeLayout } from "@/features/practice/PracticeLayout";
import { ParticlePracticePage } from "@/features/practice/ParticlePracticePage";
import { KanjiPracticePage } from "@/features/practice/KanjiPracticePage";
import { AlphabetPracticePage } from "@/features/practice/AlphabetPracticePage";
import { ComponentsPracticePage } from "@/features/practice/ComponentsPracticePage";
import { GrammarPage } from "@/features/grammar/GrammarPage";
import { CommunityLayout } from "@/features/community/CommunityLayout";
import { ContentBrowserPage } from "@/features/community/ContentBrowserPage";
import { ForumPage } from "@/features/community/forum/ForumPage";
import { ThreadPage } from "@/features/community/forum/ThreadPage";
import { NewThreadPage } from "@/features/community/forum/NewThreadPage";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { LessonPage } from "@/features/lesson/LessonPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
          <Route path=":lang" element={<LangLayout />}>
            <Route index element={<Navigate to="/" replace />} />
            <Route path="learn" element={<LearnLayout />}>
              <Route index element={<LearnPage />} />
              <Route path="courses" element={<Navigate to=".." replace />} />
              <Route path="lessons/:lessonId" element={<LessonPage />} />
            </Route>
            <Route path="practice" element={<PracticeLayout />}>
              <Route index element={<FlashcardsPage />} />
              <Route path="flashcards/review" element={<FlashcardTester />} />
              <Route path="flashcards" element={<FlashcardsPage />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="stories/:storyId" element={<StoryDetailPage />} />
              <Route path="particles" element={<ParticlePracticePage />} />
              <Route path="alphabet/:alphabetId?" element={<AlphabetPracticePage />} />
              <Route path="kanji" element={<KanjiPracticePage />} />
              <Route path="components" element={<ComponentsPracticePage />} />
            </Route>
            <Route path="vocab" element={<VocabPage />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route path="community" element={<CommunityLayout />}>
              <Route index element={<ContentBrowserPage />} />
              <Route path="content" element={<ContentBrowserPage />} />
              <Route path="forum" element={<ForumPage />} />
              <Route path="forum/thread/:threadId" element={<ThreadPage />} />
              <Route path="forum/new" element={<NewThreadPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
